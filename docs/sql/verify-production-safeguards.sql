-- Read-only installed-state verification. No user data or provider calls.
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
    ('public.assistant_reserve(uuid,text,text,integer,integer)', '1bf8ae6c6d3e151c45efa70fd923115fd9e7b8b646900cd96b4e9e02eb1ef421', false, true),
    ('public.assistant_finish(uuid)', '54ae4257dbd78b905fd9c355fdab7179ef3a10b17bb0f64f74b33162a52ce602', false, true),
    ('public.circle_request(text)', '168595b6e47f1f6f5c2e38af3cfce65a6e226cfb8a45298114d852db1c835133', true, null::boolean),
    ('public.circle_connection(uuid,text)', '300ef98e9d8162223f3182ac514a0a91a2e88b31845f3584a48806e938833cfc', true, null::boolean),
    ('public.circle_record(text,text,timestamptz,timestamptz)', '40b5b2c27bd22a8b83d6c92571fdc65dc78618e6d70723a1175d764cf9251031', true, null::boolean)
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
