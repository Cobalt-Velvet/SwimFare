/**
 * YYYY-MM-DD in UTC. 収集バッチが「いつ観測したか」を記録するための日付。
 * 画面の基準日には使わない。UTC の日付は JST/KST 09:00 に変わるが cron は 12:00 に走るため、
 * その間は「今日」の行がまだ無い。画面側は store の latestObservedDate() を使う。
 */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}
