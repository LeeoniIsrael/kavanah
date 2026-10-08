import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const source = 'supabase/migrations/202610060001_production_safeguards.sql';
const destination = 'docs/sql/production-safeguards.sql';
const migration = readFileSync(source, 'utf8');
const sql = `-- Generated from ${source}.
-- Apply once to the existing Kavanah project after checking its deployed schema.
-- Generate/check with: node scripts/backend/deploymentSql.mjs [--check]
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

${migration}
-- Keep existing CLI migration history consistent when that table is present.
-- A duplicate history entry fails the transaction rather than resetting allowance.
DO $kavanah_history$
BEGIN
  IF to_regclass('supabase_migrations.schema_migrations') IS NOT NULL THEN
    EXECUTE 'INSERT INTO supabase_migrations.schema_migrations(version) VALUES ($1)'
      USING '202610060001';
  END IF;
END
$kavanah_history$;

NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT 'Production safeguards applied' AS status;
`;

if (process.argv.includes('--check')) {
  assert.equal(readFileSync(destination, 'utf8'), sql, 'Regenerate the SQL editor deployment after changing its source migration');
  console.log('SQL editor deployment matches the source migration.');
} else {
  mkdirSync('docs/sql', { recursive: true });
  writeFileSync(destination, sql);
  console.log(`Saved ${destination}`);
}
