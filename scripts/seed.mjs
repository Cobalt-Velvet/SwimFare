// Demo seed: synthesize past price observations + today's observations with
// designed deviations so the cheap/normal/expensive distribution is balanced
// and only 1–2 routes "glow" (have a deviation ≤ -10%).
// Today rows use INSERT OR REPLACE: seed deliberately overrides cron data for
// demo stability. Production (cron only, no seed) shows real Travelpayouts data.
// Output: scripts/seed.sql. Apply with `npm run seed:local` or `npm run seed:remote`.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROUTES = {
  'ICN-NRT': { base: 12000, airlines: ['KE', 'OZ', 'JL', 'NH', '7C', 'LJ'] },
  'ICN-KIX': { base: 13000, airlines: ['KE', 'OZ', 'JL', 'NH', '7C', 'LJ', 'TW'] },
  'ICN-FUK': { base: 11000, airlines: ['KE', 'OZ', '7C', 'LJ', 'JL'] },
  'PUS-NRT': { base: 14000, airlines: ['BX', 'KE', 'OZ', 'JL'] },
  'PUS-KIX': { base: 11000, airlines: ['BX', 'KE', '7C', 'MM'] },
  'PUS-FUK': { base: 9000, airlines: ['BX', 'KE', '7C'] },
};

// History slots cover the values the cron generates plus neighbors.
const DAYS_BEFORE_SLOTS = [1, 5, 7, 12, 14, 19, 21, 26, 28];
const SAMPLES_PER_SLOT = 8;
const PRICE_VARIANCE = 0.15;

// Target deviations (%) for today's 4 weekly slots per route. Designed to give
// a varied cheap/normal/expensive mix, with only ICN-KIX and PUS-KIX crossing
// the -10% glow threshold.
const TODAY_TARGET_DEVS = {
  'ICN-NRT': [-3, -7, +5, +12],
  'ICN-KIX': [-13, -3, +8, +2],
  'ICN-FUK': [+8, +3, -5, +12],
  'PUS-NRT': [-7, +12, -3, +8],
  'PUS-KIX': [-2, -15, +3, +9],
  'PUS-FUK': [+15, +5, -7, -3],
};

function fmt(date) {
  return date.toISOString().slice(0, 10);
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function slotAverage(base, daysBefore) {
  return base + Math.max(0, 14 - daysBefore) * 600;
}

const today = new Date();
const todayStr = fmt(today);

// 1. Historical rows. While generating, track the actual sample average per
//    (route, days_before) so today's seed deviation lands at the intended verdict.
const historyRows = [];
const historyAvg = {};
for (const [route, { base, airlines }] of Object.entries(ROUTES)) {
  historyAvg[route] = {};
  for (const daysBefore of DAYS_BEFORE_SLOTS) {
    const slotAvg = slotAverage(base, daysBefore);
    const prices = [];
    for (let i = 0; i < SAMPLES_PER_SLOT; i++) {
      const observedOffset = Math.floor(rand(7, 90));
      const observed = new Date(today);
      observed.setUTCDate(observed.getUTCDate() - observedOffset);
      const departure = new Date(observed);
      departure.setUTCDate(departure.getUTCDate() + daysBefore);
      const price = Math.round(slotAvg * rand(1 - PRICE_VARIANCE, 1 + PRICE_VARIANCE));
      prices.push(price);
      const airline = pick(airlines);
      historyRows.push(
        `('${route}','${fmt(departure)}','${fmt(observed)}',${daysBefore},${price},'JPY','${airline}')`,
      );
    }
    historyAvg[route][daysBefore] = prices.reduce((s, p) => s + p, 0) / prices.length;
  }
}

// 2. Today rows. 4 slots per route (next 4 Saturdays) with designed deviations
//    against the actual per-slot history average so verdicts are deterministic.
const dow = today.getUTCDay();
const daysToNextSat = ((6 - dow + 7) % 7) || 7;
const todayDaysBefore = [0, 1, 2, 3].map((i) => daysToNextSat + 7 * i);

const todayRows = [];
for (const [route, { airlines }] of Object.entries(ROUTES)) {
  const devs = TODAY_TARGET_DEVS[route];
  for (let i = 0; i < todayDaysBefore.length; i++) {
    const daysBefore = todayDaysBefore[i];
    const departure = new Date(today);
    departure.setUTCDate(departure.getUTCDate() + daysBefore);
    const histAvg = historyAvg[route][daysBefore];
    if (!histAvg) continue;
    const dev = devs[i] / 100;
    const price = Math.round(histAvg * (1 + dev));
    const airline = pick(airlines);
    todayRows.push(
      `('${route}','${fmt(departure)}','${todayStr}',${daysBefore},${price},'JPY','${airline}')`,
    );
  }
}

const sql = `-- Synthetic seed for demo. Regenerate with: npm run seed:gen
-- 1. Remove all past observations so seed history is fully deterministic.
--    Today's rows are kept here and overwritten by step 3.
DELETE FROM prices WHERE observed_date < DATE('now');

-- 2. Historical past observations (gives the judgment function enough samples).
INSERT OR REPLACE INTO prices (route, departure_date, observed_date, days_before, price, currency, airline)
VALUES
${historyRows.join(',\n')};

-- 3. Today's rows. INSERT OR REPLACE overrides any cron-collected today rows
--    so the demo distribution is deterministic. In production (cron only, no
--    seed runs), real Travelpayouts data is shown.
INSERT OR REPLACE INTO prices (route, departure_date, observed_date, days_before, price, currency, airline)
VALUES
${todayRows.join(',\n')};
`;

const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(here, { recursive: true });
const outPath = `${here}/seed.sql`;
writeFileSync(outPath, sql);
console.log(`Wrote ${historyRows.length} history rows + ${todayRows.length} today rows to ${outPath}`);
