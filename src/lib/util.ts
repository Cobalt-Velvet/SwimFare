/** YYYY-MM-DD in UTC. cron が UTC 03:00 (JST/KST 12:00) に走るので UTC 日付で揃える。 */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}
