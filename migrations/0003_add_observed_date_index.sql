-- 画面の基準日（MAX(observed_date)）を全件走査せずに引くためのインデックス。
CREATE INDEX idx_prices_observed_date ON prices (observed_date);
