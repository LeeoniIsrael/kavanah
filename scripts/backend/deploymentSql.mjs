import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const source = 'supabase/migrations/202610060001_production_safeguards.sql';
const destination = 'docs/sql/production-safeguards.sql';
const migration = readFileSync(source, 'utf8');
const verificationDestination = 'docs/sql/verify-production-safeguards.sql';
const signatures = {
  assistant_reserve: 'public.assistant_reserve(uuid,text,text,integer,integer)',
  assistant_finish: 'public.assistant_finish(uuid)',
  circle_request: 'public.circle_request(text)',
  circle_connection: 'public.circle_connection(uuid,text)',
  circle_record: 'public.circle_record(text,text,timestamptz,timestamptz)',
};
const routines = [...migration.matchAll(/create(?: or replace)? function public\.(\w+)\([\s\S]*?\bas \$\$([\s\S]*?)\$\$/gi)];
assert.equal(routines.length, 5, 'Review verification signatures when changing migration routines');
const routineRows = routines.map(([, name, body]) => {
  assert(signatures[name], `Missing verification signature for ${name}`);
  const hash = createHash('sha256').update(body).digest('hex');
  const assistant = name.startsWith('assistant_');
  return `    ('${signatures[name]}', '${hash}', ${!assistant}, ${assistant ? 'true' : 'null::boolean'})`;
}).join(',\n');
const verification = `-- Read-only installed-state verification. No user data or provider calls.
-- Function hashes are deployment fingerprints, not substitutes for account/API tests.
WITH expected_tables(name, user_read) AS (
  VALUES
    ('public.circle_profiles', true), ('public.circle_connections', true),
    ('public.circle_activity', true), ('private.settings', false),
    ('private.blocks', false), ('private.catalog', false),
    ('private.passages', false), ('private.sessions', false),
    ('private.milestones', false), ('private.reports', false),
    ('private.rate_limits', false), ('private.suspensions', false),
    ('private.assistant_budget', false), ('private.assistant_buckets', false),
    ('private.assistant_requests', false)
), table_checks AS (
  SELECT e.name, coalesce(
    c.relkind = 'r' AND c.relrowsecurity
    AND NOT has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
    AND has_table_privilege('authenticated', c.oid, 'SELECT') = e.user_read
    AND NOT has_table_privilege('authenticated', c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'),
    false
  ) AS passed
  FROM expected_tables e LEFT JOIN pg_class c ON c.oid = to_regclass(e.name)
), expected_functions(signature, body_hash, user_execute, server_execute) AS (
  VALUES
${routineRows}
), function_checks AS (
  SELECT e.signature, coalesce(
    p.prosecdef AND p.proconfig @> ARRAY['search_path=""']
    AND encode(sha256(convert_to(p.prosrc, 'UTF8')), 'hex') = e.body_hash
    AND NOT has_function_privilege('anon', p.oid, 'EXECUTE')
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE') = e.user_execute
    AND (e.server_execute IS NULL OR has_function_privilege('service_role', p.oid, 'EXECUTE') = e.server_execute),
    false
  ) AS passed
  FROM expected_functions e LEFT JOIN pg_proc p ON p.oid = to_regprocedure(e.signature)
)
SELECT 'Tables, RLS and grants' AS check_name,
       CASE WHEN bool_and(passed) THEN 'PASS' ELSE 'FAIL' END AS status,
       coalesce(string_agg(name, ', ' ORDER BY name) FILTER (WHERE NOT passed),
                'All 15 expected tables match RLS and client grants') AS detail
FROM table_checks
UNION ALL
SELECT signature, CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END,
       CASE WHEN passed THEN 'Installed function code, fixed search path and role grants match'
            ELSE 'Function missing or code/search path/role grants differ' END
FROM function_checks
ORDER BY check_name;
`;
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

const accountSource = 'supabase/migrations/202610080001_account_required.sql';
const accountDestination = 'docs/sql/require-accounts.sql';
const accountVerificationDestination = 'docs/sql/verify-account-required.sql';
const accountMigration = readFileSync(accountSource, 'utf8');
const accountSignatures = {
  'private.has_account': ['private.has_account()', true],
  'private.allowed': ['private.allowed(uuid)', true],
  'private.connected': ['private.connected(uuid)', true],
  'private.throttle': ['private.throttle(text,integer)', false],
  'public.circle_settings': ['public.circle_settings()', true],
  'public.circle_remove': ['public.circle_remove(uuid)', true],
};
const accountRoutines = [...accountMigration.matchAll(/create(?: or replace)? function (private|public)\.(\w+)\([\s\S]*?\bas \$\$([\s\S]*?)\$\$/gi)];
assert.equal(accountRoutines.length, 6, 'Review account verification after changing its routines');
const accountRows = accountRoutines.map(([, schema, name, body]) => {
  const [signature, userExecute] = accountSignatures[`${schema}.${name}`] ?? [];
  assert(signature, `Missing account signature for ${schema}.${name}`);
  return `    ('${signature}', '${createHash('sha256').update(body).digest('hex')}', ${userExecute})`;
}).join(',\n');
const accountSql = `-- Generated from ${accountSource}. Apply once after the production safeguards.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
${accountMigration}
DO $kavanah_history$
BEGIN
  IF to_regclass('supabase_migrations.schema_migrations') IS NOT NULL THEN
    EXECUTE 'INSERT INTO supabase_migrations.schema_migrations(version) VALUES ($1)'
      USING '202610080001';
  END IF;
END
$kavanah_history$;
NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT 'Account requirement applied' AS status;
`;
const accountVerification = `-- Read-only account requirement metadata verification. Expect seven PASS rows.
-- Hosted two-account and anonymous-session behavior still needs acceptance testing.
WITH expected_functions(signature, body_hash, user_execute) AS (
  VALUES
${accountRows}
), function_checks AS (
  SELECT e.signature, coalesce(
    p.prosecdef AND p.proconfig @> ARRAY['search_path=""']
    AND encode(sha256(convert_to(p.prosrc, 'UTF8')), 'hex') = e.body_hash
    AND NOT has_function_privilege('anon', p.oid, 'EXECUTE')
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE') = e.user_execute,
    false
  ) AS passed
  FROM expected_functions e LEFT JOIN pg_proc p ON p.oid = to_regprocedure(e.signature)
), expected_tables(name) AS (
  VALUES ('public.circle_profiles'), ('public.circle_connections'), ('public.circle_activity')
), policy_checks AS (
  SELECT e.name, EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
    WHERE c.oid = to_regclass(e.name) AND c.relrowsecurity
    AND p.polname = 'account_required' AND NOT p.polpermissive AND p.polcmd = 'r'
    AND p.polroles = ARRAY[to_regrole('authenticated')::oid]
    AND pg_get_expr(p.polqual, p.polrelid) = 'private.has_account()'
  ) AS passed FROM expected_tables e
)
SELECT signature AS check_name, CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END AS status,
       CASE WHEN passed THEN 'Function code, fixed search path and execution grants match'
            ELSE 'Function missing or code/search path/grants differ' END AS detail
FROM function_checks
UNION ALL
SELECT 'Restrictive account policies', CASE WHEN bool_and(passed) THEN 'PASS' ELSE 'FAIL' END,
       coalesce(string_agg(name, ', ' ORDER BY name) FILTER (WHERE NOT passed),
                'All three public tables require a non-anonymous existing Auth account')
FROM policy_checks ORDER BY check_name;
`;

if (process.argv.includes('--check')) {
  assert.equal(readFileSync(destination, 'utf8'), sql, 'Regenerate the SQL editor deployment after changing its source migration');
  assert.equal(readFileSync(verificationDestination, 'utf8'), verification, 'Regenerate the installed-state verification after changing its source migration');
  assert.equal(readFileSync(accountDestination, 'utf8'), accountSql, 'Regenerate the account deployment SQL');
  assert.equal(readFileSync(accountVerificationDestination, 'utf8'), accountVerification, 'Regenerate the account verification SQL');
  console.log('SQL editor deployment and verification match the source migration.');
} else {
  mkdirSync('docs/sql', { recursive: true });
  writeFileSync(destination, sql);
  writeFileSync(verificationDestination, verification);
  writeFileSync(accountDestination, accountSql);
  writeFileSync(accountVerificationDestination, accountVerification);
  console.log('Saved production and account requirement deployment/verification SQL.');
}
