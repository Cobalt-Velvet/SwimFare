import { subtractDays } from './util';

export const MIN_SAMPLES = 5;
// 割安／割高のしきい値（平均からの乖離率）。
// 直近30日・平均を基準にした乖離率は、中央の半分が -15%〜+23% に広がっている
// （基準日60日・1,883件、analysis/deviation_histogram.sql）。±5% では「通常」が 16% しか残らず、
// ほぼ全てが割安か割高になる。±10% で 割安 31% / 通常 31% / 割高 38%。
export const CHEAP_THRESHOLD = -0.1;
export const EXPENSIVE_THRESHOLD = 0.1;
// ホームで路線カードを強調（glow）する「明確に安い便」の乖離率（%）。
// 同じ60日で、該当便を含む路線は1日平均 -10% で 7.3 / -20% で 4.4 / -30% で 3.0（約11路線中）。
// 強調が大半の路線に付くと意味が無いので -30% にする。
export const STRONG_CHEAP_PCT = -30;
// 平均を取る days_before の許容窓（±日）。
// cron は毎日「次の4つの土曜」を収集するため days_before が毎日1ずつシフトし、
// 完全一致では同じ値が週1回しか溜まらない（5サンプルに約5週かかる）。
// ±3日の窓でブッキングカーブ上の近い点をプールし、サンプルを日次で増やす。
export const DAYS_BEFORE_WINDOW = 3;
// 比較対象にする観測の期間（基準日から遡る日数）。
// 期間を区切らないと、季節による価格水準の変化（夏の安値など）が平均に残り続け、
// 判定が「割高」に偏る。基準日6つ・193件の検証で、割高の割合は 全期間 64% → 30日 47%。
// 中央値は外れ値の高値を無視して基準が下がり、偏りが増えたため採用しない（90日・中央値 75%）。
// 検証クエリ：analysis/verdict_distribution.sql。グラフ（過去30日の平均）とも同じ期間に揃える。
export const BASELINE_DAYS = 30;

export type Judgment =
  | {
      verdict: 'insufficient_data';
      sample_count: number;
      required: number;
    }
  | {
      verdict: 'cheap' | 'normal' | 'expensive';
      sample_count: number;
      avg_price: number;
      deviation_pct: number;
    };

export async function judge(
  db: D1Database,
  route: string,
  days_before: number,
  current_price: number,
  observed_date: string,
): Promise<Judgment> {
  let results: { price: number }[];
  try {
    const r = await db
      .prepare(
        `SELECT price FROM prices
           WHERE route = ?1
             AND days_before BETWEEN ?2 AND ?3
             AND observed_date < ?4
             AND observed_date >= ?5`,
      )
      .bind(
        route,
        days_before - DAYS_BEFORE_WINDOW,
        days_before + DAYS_BEFORE_WINDOW,
        observed_date,
        subtractDays(observed_date, BASELINE_DAYS),
      )
      .all<{ price: number }>();
    results = r.results;
  } catch (e) {
    // D1 が落ちても判定だけ「収集中」に倒して全体は壊さない。
    console.warn(
      `[judge] D1 read failed for ${route} d_b=${days_before}: ${e instanceof Error ? e.message : String(e)}`,
    );
    return { verdict: 'insufficient_data', sample_count: 0, required: MIN_SAMPLES };
  }

  const sample_count = results.length;
  if (sample_count < MIN_SAMPLES) {
    return { verdict: 'insufficient_data', sample_count, required: MIN_SAMPLES };
  }

  const avg_price = results.reduce((sum, r) => sum + r.price, 0) / sample_count;
  const deviation = (current_price - avg_price) / avg_price;
  const deviation_pct = Math.round(deviation * 1000) / 10;

  let verdict: 'cheap' | 'normal' | 'expensive';
  if (deviation < CHEAP_THRESHOLD) verdict = 'cheap';
  else if (deviation > EXPENSIVE_THRESHOLD) verdict = 'expensive';
  else verdict = 'normal';

  return { verdict, sample_count, avg_price: Math.round(avg_price), deviation_pct };
}
