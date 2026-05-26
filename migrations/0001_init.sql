-- 同一 (route, departure_date, observed_date) は1日1観測。
CREATE TABLE prices (
  route          TEXT NOT NULL,
  departure_date TEXT NOT NULL,
  observed_date  TEXT NOT NULL,
  days_before    INTEGER NOT NULL,
  price          REAL    NOT NULL,
  currency       TEXT    NOT NULL,
  PRIMARY KEY (route, departure_date, observed_date)
);

-- 割安／割高の判定クエリ用：同一路線・同一残り日数の平均を取る。
CREATE INDEX idx_prices_route_days_before ON prices (route, days_before);
