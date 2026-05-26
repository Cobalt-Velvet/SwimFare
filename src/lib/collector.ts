import { fetchCheapestPrices, type PriceObservation } from './travelpayouts';
import { TRACKED_ROUTES } from './routes';

const WEEKS_AHEAD = 4;

export type CollectorEnv = {
  TRAVELPAYOUTS_TOKEN: string;
  DB: D1Database;
};

export type CollectorResult = {
  observed_date: string;
  attempted: number;
  saved: number;
  errors: string[];
};

export async function collectPrices(env: CollectorEnv): Promise<CollectorResult> {
  const observed = todayUtc();
  const departures = upcomingSaturdays(observed, WEEKS_AHEAD);
  const errors: string[] = [];

  const tasks = TRACKED_ROUTES.flatMap((route) => {
    const [origin, destination] = route.split('-');
    return departures.map(async (departureAt) => {
      try {
        const [result] = await fetchCheapestPrices(env.TRAVELPAYOUTS_TOKEN, {
          origin,
          destination,
          departureAt,
          limit: 1,
          oneWay: true,
          observedDate: observed,
        });
        return result ?? null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${route} ${departureAt}: ${msg}`);
        return null;
      }
    });
  });

  const settled = await Promise.all(tasks);
  const observations = settled.filter((o): o is PriceObservation => o !== null);

  if (observations.length > 0) {
    await persist(env.DB, observations);
  }

  return {
    observed_date: observed,
    attempted: tasks.length,
    saved: observations.length,
    errors,
  };
}

async function persist(db: D1Database, observations: PriceObservation[]) {
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO prices
       (route, departure_date, observed_date, days_before, price, currency, airline)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  await db.batch(
    observations.map((o) =>
      stmt.bind(
        o.route,
        o.departure_date,
        o.observed_date,
        o.days_before,
        o.price,
        o.currency,
        o.airline,
      ),
    ),
  );
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function upcomingSaturdays(from: string, count: number): string[] {
  const start = new Date(`${from}T00:00:00Z`);
  const dayUtc = start.getUTCDay();
  const daysUntilNextSat = ((6 - dayUtc + 7) % 7) || 7;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + daysUntilNextSat + 7 * i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
