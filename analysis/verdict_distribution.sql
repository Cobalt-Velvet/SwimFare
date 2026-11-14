-- 判定の偏りを検証するクエリ。
-- 基準日 2026-11-13 の全運賃について、比較対象の期間（全期間 / 90日 / 60日 / 30日）と
-- 基準値（平均 / 中央値）を変えたとき、判定の分布がどう変わるかを数える。
-- 条件は src/lib/judgment.ts と同じ：同一路線、days_before ±3、基準日より前、5件未満は判定しない、±5%。
-- 基準日を固定しているので、いつ実行しても同じ結果になる。
WITH today AS (
  SELECT route, departure_date, days_before, price
    FROM prices
   WHERE observed_date = '2026-11-13'
),
periods(days) AS (VALUES (9999), (90), (60), (30)),
samples AS (
  SELECT pr.days,
         t.route,
         t.departure_date,
         t.price AS current_price,
         p.price AS past_price,
         ROW_NUMBER() OVER (PARTITION BY pr.days, t.route, t.departure_date ORDER BY p.price) AS rn,
         COUNT(p.price) OVER (PARTITION BY pr.days, t.route, t.departure_date) AS n
    FROM today t
   CROSS JOIN periods pr
    LEFT JOIN prices p
      ON p.route = t.route
     AND p.days_before BETWEEN t.days_before - 3 AND t.days_before + 3
     AND p.observed_date < '2026-11-13'
     AND p.observed_date >= date('2026-11-13', '-' || pr.days || ' day')
),
base AS (
  SELECT days, route, departure_date, current_price, n,
         AVG(past_price) AS avg_price,
         -- 中央値：価格順に並べた真ん中の1件（偶数なら真ん中2件の平均）。
         AVG(CASE WHEN rn IN ((n + 1) / 2, (n + 2) / 2) THEN past_price END) AS median_price
    FROM samples
   GROUP BY days, route, departure_date
)
SELECT CASE days WHEN 9999 THEN 'all' ELSE days || 'd' END AS period,
       COUNT(*)                                                            AS fares,
       SUM(n < 5)                                                          AS insufficient,
       SUM(n >= 5 AND (current_price - avg_price) / avg_price < -0.05)     AS avg_cheap,
       SUM(n >= 5 AND ABS((current_price - avg_price) / avg_price) <= 0.05) AS avg_normal,
       SUM(n >= 5 AND (current_price - avg_price) / avg_price > 0.05)      AS avg_expensive,
       SUM(n >= 5 AND (current_price - median_price) / median_price < -0.05)     AS med_cheap,
       SUM(n >= 5 AND ABS((current_price - median_price) / median_price) <= 0.05) AS med_normal,
       SUM(n >= 5 AND (current_price - median_price) / median_price > 0.05)      AS med_expensive
  FROM base
 GROUP BY days
 ORDER BY days DESC;
