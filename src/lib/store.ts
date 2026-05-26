import { judge, type Judgment } from './judgment';
import { todayUtc } from './util';

export type Departure = {
  departure_date: string;
  days_before: number;
  price: number;
  currency: string;
  airline: string | null;
  judgment: Judgment;
};

export type RoutePayload = {
  route: string;
  observed_date: string;
  departures: Departure[];
};

export type HistoryPoint = {
  days_before: number;
  avg_price: number;
  sample_count: number;
};

export type StoreEnv = { DB: D1Database; CACHE: KVNamespace };

const CACHE_TTL_SECONDS = 3600;
const CACHE_VERSION = 'v4';

type TodayRow = {
  departure_date: string;
  days_before: number;
  price: number;
  currency: string;
  airline: string | null;
};

export async function getRoutePayload(env: StoreEnv, route: string): Promise<RoutePayload> {
  const observed_date = todayUtc();
  const cacheKey = `route:${CACHE_VERSION}:${route}:${observed_date}`;

  const cached = await env.CACHE.get(cacheKey);
  if (cached) return JSON.parse(cached) as RoutePayload;

  let today: TodayRow[];
  try {
    const { results } = await env.DB.prepare(
      `SELECT departure_date, days_before, price, currency, airline
         FROM prices
         WHERE route = ?1 AND observed_date = ?2
         ORDER BY departure_date`,
    )
      .bind(route, observed_date)
      .all<TodayRow>();
    today = results;
  } catch (e) {
    // D1 が落ちた路線は空の departures で返し、他路線は通常通り描画する。
    // 空 payload は障害復旧後すぐ反映できるよう KV にキャッシュしない。
    console.warn(
      `[store] getRoutePayload D1 read failed for ${route}: ${e instanceof Error ? e.message : String(e)}`,
    );
    return { route, observed_date, departures: [] };
  }

  const departures = await Promise.all(
    today.map(async (t) => ({
      ...t,
      judgment: await judge(env.DB, route, t.days_before, t.price, observed_date),
    })),
  );

  const payload: RoutePayload = { route, observed_date, departures };
  await env.CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: CACHE_TTL_SECONDS });
  return payload;
}

export async function getRouteHistory(
  env: StoreEnv,
  route: string,
  daysBack = 30,
): Promise<HistoryPoint[]> {
  const observed_date = todayUtc();
  const since = subtractDays(observed_date, daysBack);
  const cacheKey = `history:${CACHE_VERSION}:${route}:${observed_date}:${daysBack}`;

  const cached = await env.CACHE.get(cacheKey);
  if (cached) return JSON.parse(cached) as HistoryPoint[];

  let raw: { days_before: number; avg_price: number; sample_count: number }[];
  try {
    const { results } = await env.DB.prepare(
      `SELECT days_before,
              AVG(price) AS avg_price,
              COUNT(*)   AS sample_count
         FROM prices
         WHERE route = ?1 AND observed_date >= ?2 AND observed_date < ?3
         GROUP BY days_before
         ORDER BY days_before`,
    )
      .bind(route, since, observed_date)
      .all<{ days_before: number; avg_price: number; sample_count: number }>();
    raw = results;
  } catch (e) {
    // 空配列で返すと RouteDetail がチャート無しの「データ不足」表示に倒れる。
    console.warn(
      `[store] getRouteHistory D1 read failed for ${route}: ${e instanceof Error ? e.message : String(e)}`,
    );
    return [];
  }

  const history = raw.map((r) => ({
    days_before: r.days_before,
    avg_price: Math.round(r.avg_price),
    sample_count: r.sample_count,
  }));

  await env.CACHE.put(cacheKey, JSON.stringify(history), { expirationTtl: CACHE_TTL_SECONDS });
  return history;
}

function subtractDays(yyyymmdd: string, days: number): string {
  const d = new Date(`${yyyymmdd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}
