-- Read-only metadata inventory before considering a physical restore to a new project.
-- Run on Kavanah's SOURCE project. Fixed eight rows; no account data, job commands,
-- trigger arguments, routine bodies or secrets are returned. No application routines are invoked.
-- REVIEW identifies capabilities needing inspection, not proof they are in use.
-- NOT_FOUND is limited to these checks and the current database, not the backup.
-- This report does not authorize a restore or establish complete containment.
WITH external_extensions AS (
  SELECT extname
  FROM pg_catalog.pg_extension
  WHERE extname IN ('pg_cron', 'pg_net', 'http', 'wrappers', 'dblink',
                    'pg_background', 'aws_lambda', 'plpython3u', 'plperlu')
     OR extname LIKE '%\_fdw' ESCAPE '\'
), application_routines AS (
  SELECT p.oid, p.prosrc, l.lanname, l.lanpltrusted
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_catalog.pg_language l ON l.oid = p.prolang
  WHERE p.prokind IN ('f', 'p')
    AND n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'
    AND NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_depend d
      WHERE d.classid = 'pg_catalog.pg_proc'::regclass
        AND d.objid = p.oid AND d.deptype = 'e'
    )
), observations(check_name, observed, detail) AS (
  SELECT 'External-capable extensions', count(*)::integer,
         coalesce(string_agg(extname, ', ' ORDER BY extname), 'None in the inspected list')
  FROM external_extensions
  UNION ALL
  SELECT 'Scheduled-job relation',
         (pg_catalog.to_regclass('cron.job') IS NOT NULL)::integer,
         'Presence only; configured/active jobs still need inspection if present'
  UNION ALL
  SELECT 'HTTP-queue relation',
         (pg_catalog.to_regclass('net.http_request_queue') IS NOT NULL)::integer,
         'Presence only; pending requests still need inspection if present'
  UNION ALL
  SELECT 'Foreign servers', count(*)::integer,
         'Metadata only; endpoints and credentials are omitted'
  FROM pg_catalog.pg_foreign_server
  UNION ALL
  SELECT 'Enabled event triggers', count(*)::integer,
         'Inspect effects before clone provisioning changes database objects'
  FROM pg_catalog.pg_event_trigger WHERE evtenabled <> 'D'
  UNION ALL
  SELECT 'Application triggers', count(*)::integer,
         'Non-internal triggers in public/private/auth; includes legitimate product hooks'
  FROM pg_catalog.pg_trigger t
  JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE NOT t.tgisinternal AND t.tgenabled <> 'D'
    AND n.nspname IN ('public', 'private', 'auth')
  UNION ALL
  SELECT 'External routine candidates', count(*)::integer,
         'Static text heuristic; dynamic/quoted calls or other integrations can be missed'
  FROM application_routines
  WHERE prosrc ~* '(https?://|\m(net|cron|http|wrappers|aws_lambda|supabase_functions)[[:space:]]*\.|\m(http_[a-z_]+|dblink[a-z_]*)[[:space:]]*\()'
  UNION ALL
  SELECT 'Native/untrusted routine candidates', count(*)::integer,
         'Non-extension routines needing review; not invoked by this query'
  FROM application_routines
  WHERE lanname NOT IN ('sql', 'plpgsql') AND NOT lanpltrusted
)
SELECT check_name,
       CASE WHEN observed > 0 THEN 'REVIEW' ELSE 'NOT_FOUND' END AS status,
       observed, detail
FROM observations
ORDER BY check_name;
