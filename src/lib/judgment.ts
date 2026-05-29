export const MIN_SAMPLES = 5;
export const CHEAP_THRESHOLD = -0.05;
export const EXPENSIVE_THRESHOLD = 0.05;
// 平均を取る days_before の許容窓（±日）。
// cron は毎日「次の4つの土曜」を収集するため days_before が毎日1ずつシフトし、
// 完全一致では同じ値が週1回しか溜まらない（5サンプルに約5週かかる）。
// ±3日の窓でブッキングカーブ上の近い点をプールし、サンプルを日次で増やす。
export const DAYS_BEFORE_WINDOW = 3;

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
             AND observed_date < ?4`,
      )
      .bind(route, days_before - DAYS_BEFORE_WINDOW, days_before + DAYS_BEFORE_WINDOW, observed_date)
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
