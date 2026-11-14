-- ±5% のしきい値を見直すためのクエリ。
-- 基準日 2026-09-15〜2026-11-13 の全運賃について、直近30日・平均を基準にした
-- 乖離率（%、整数に丸め）ごとの件数を数える。pct = -999 は5件未満で判定しない運賃。
WITH today AS (
  SELECT route, departure_date, days_before, price, observed_date
    FROM prices
   WHERE observed_date BETWEEN '2026-09-15' AND '2026-11-13'
),
base AS (
  SELECT t.observed_date, t.route, t.departure_date,
         t.price AS current_price,
         COUNT(p.price) AS n,
         AVG(p.price) AS avg_price
    FROM today t
    LEFT JOIN prices p
      ON p.route = t.route
     AND p.days_before BETWEEN t.days_before - 3 AND t.days_before + 3
     AND p.observed_date < t.observed_date
     AND p.observed_date >= date(t.observed_date, '-30 day')
   GROUP BY t.observed_date, t.route, t.departure_date
)
SELECT CASE WHEN n < 5 THEN -999
            ELSE CAST(ROUND((current_price - avg_price) * 100.0 / avg_price) AS INTEGER)
       END AS pct,
       COUNT(*) AS c
  FROM base
 GROUP BY pct
 ORDER BY pct;
