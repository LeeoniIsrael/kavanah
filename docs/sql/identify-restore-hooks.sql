-- Read-only follow-up to inspect-restore-source.sql, on Kavanah's SOURCE project.
-- Lists enabled event hooks and the same static routine candidates, without
-- returning routine bodies, default argument values, URLs, tokens or user data.
-- Body fingerprints detect changes; familiar names alone do not establish safety.
-- No application routine is invoked. At most 50 rows; matched_total shows whether
-- the result was truncated. With the supplied inventory, expect eight rows.
WITH routines AS (
  SELECT p.oid, p.proname, p.prosrc, p.prokind, n.nspname,
         EXISTS (
           SELECT 1 FROM pg_catalog.pg_depend d
           WHERE d.classid = 'pg_catalog.pg_proc'::regclass
             AND d.objid = p.oid AND d.deptype = 'e'
         ) AS extension_owned
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
), flagged AS (
  SELECT 'event_trigger'::text AS kind, e.evtname::text AS name, r.oid
  FROM pg_catalog.pg_event_trigger e
  JOIN routines r ON r.oid = e.evtfoid
  WHERE e.evtenabled <> 'D'
  UNION ALL
  SELECT 'routine_candidate', pg_catalog.format('%I.%I', r.nspname, r.proname), r.oid
  FROM routines r
  WHERE r.prokind IN ('f', 'p')
    AND r.nspname !~ '^pg_' AND r.nspname <> 'information_schema'
    AND NOT r.extension_owned
    AND r.prosrc ~* '(https?://|\m(net|cron|http|wrappers|aws_lambda|supabase_functions)[[:space:]]*\.|\m(http_[a-z_]+|dblink[a-z_]*)[[:space:]]*\()'
)
SELECT f.kind, f.name,
       pg_catalog.format('%I.%I(%s)', r.nspname, r.proname,
         pg_catalog.pg_get_function_identity_arguments(r.oid)) AS routine,
       pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(r.prosrc, 'UTF8')),
         'hex') AS body_sha256,
       (count(*) OVER ())::integer AS matched_total
FROM flagged f
JOIN routines r ON r.oid = f.oid
ORDER BY f.kind, f.name, routine
LIMIT 50;
