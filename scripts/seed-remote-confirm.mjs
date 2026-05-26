// Guard for `npm run seed:remote`. Refuses to run unless SEED_REMOTE_CONFIRM=yes.
// Why: seed.sql contains INSERT OR REPLACE on today's rows, which would
// overwrite production cron observations. This guard prevents accidental
// invocation (e.g. typo of seed:local).

if (process.env.SEED_REMOTE_CONFIRM !== 'yes') {
  console.error('');
  console.error('  seed:remote was BLOCKED.');
  console.error('');
  console.error("  This would overwrite today's real Travelpayouts data in the");
  console.error('  PRODUCTION D1 with synthetic seed values. The cron-collected');
  console.error("  snapshot for today would be lost until tomorrow's cron.");
  console.error('');
  console.error('  For local demo data, use:  npm run seed:local');
  console.error('');
  console.error('  If you REALLY want to seed the remote DB, set the env var first:');
  console.error('    bash:  SEED_REMOTE_CONFIRM=yes npm run seed:remote');
  console.error("    pwsh:  $env:SEED_REMOTE_CONFIRM='yes'; npm run seed:remote");
  console.error('');
  process.exit(1);
}

console.log('[seed:remote] SEED_REMOTE_CONFIRM=yes detected. Proceeding.');
