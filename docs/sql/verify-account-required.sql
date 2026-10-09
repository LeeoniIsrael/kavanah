-- Read-only account requirement metadata verification. Expect seven PASS rows.
-- Hosted two-account and anonymous-session behavior still needs acceptance testing.
WITH expected_functions(signature, body_hash, user_execute) AS (
  VALUES
    ('private.has_account()', 'f03291640096fd36b98b9eb87b38e7274a2f21724133088136988dc052fb508b', true),
    ('private.allowed(uuid)', '3bf3cd063aa59347964bba4ba96c4a30611133cfc68acb21da04a094ee282cff', true),
    ('private.connected(uuid)', 'cb29b0acee930efc526d11665f7e9ed02a48935896e69dc3a54a6deb70b76b46', true),
    ('private.throttle(text,integer)', '4a956580156dbf2fd706e7af38e8096f181e16eeaaf82b5b2d7f5970750a737b', false),
    ('public.circle_settings()', 'cb7fcee5dcd340d9796452ff542397a0311543eaec47943959613d87942fb2fd', true),
    ('public.circle_remove(uuid)', '54c4683a4c3cb47f3de270dc072987f9ea2888628571d29eaed1d7cbe643345e', true)
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
