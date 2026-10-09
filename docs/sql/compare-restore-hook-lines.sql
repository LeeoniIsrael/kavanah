-- Read-only follow-up on Kavanah's SOURCE project. Do not run a restore yet.
-- The three named routines have not matched the public body fingerprints reviewed.
-- Return line fingerprints and whitespace only, never code, URLs or credentials.
-- This lets the reviewer reconstruct known PUBLIC lines and check the complete
-- body hash; unknown lines remain unknown. Matching trimmed hashes alone is NOT
-- proof of equivalent/safe code. Review the reconstructed body before clearance.
-- No routine is invoked or modified. Exactly three rows; oversized bodies are
-- explicitly rejected, rather than silently truncated (16 KiB / 200 lines each).
WITH targets(routine) AS (
  VALUES ('extensions.set_graphql_placeholder()'),
         ('extensions.grant_pg_graphql_access()'),
         ('extensions.grant_pg_net_access()')
), bodies AS (
  SELECT t.routine, p.prosrc,
         pg_catalog.string_to_array(p.prosrc, E'\n') AS lines
  FROM targets t
  LEFT JOIN pg_catalog.pg_proc p
    ON p.oid = pg_catalog.to_regprocedure(t.routine)
), sized AS (
  SELECT *, coalesce(pg_catalog.cardinality(lines), 0) AS line_count,
         pg_catalog.octet_length(prosrc) <= 16384
           AND pg_catalog.cardinality(lines) <= 200 AS within_limit
  FROM bodies
)
SELECT routine,
       CASE WHEN prosrc IS NULL THEN 'MISSING'
            WHEN NOT within_limit THEN 'TOO_LARGE'
            ELSE 'COMPARE' END AS status,
       pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(prosrc, 'UTF8')),
         'hex') AS body_sha256,
       line_count,
       CASE WHEN within_limit THEN (
         SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'line', x.line_no,
           'sha256', pg_catalog.encode(
             pg_catalog.sha256(pg_catalog.convert_to(x.line, 'UTF8')), 'hex'),
           'trimmed_sha256', pg_catalog.encode(
             pg_catalog.sha256(pg_catalog.convert_to(x.content, 'UTF8')), 'hex'),
           'prefix_ws', substring(x.line FROM E'^[ \t\r]*'),
           'suffix_ws', CASE WHEN x.content = '' THEN ''
             ELSE substring(x.line FROM E'[ \t\r]*$') END
         ) ORDER BY x.line_no)
         FROM (
           SELECT line, line_no,
                  pg_catalog.regexp_replace(line,
                    E'^[ \t\r]+|[ \t\r]+$', '', 'g') AS content
           FROM pg_catalog.unnest(s.lines) WITH ORDINALITY AS l(line, line_no)
         ) x
       ) END AS line_fingerprints
FROM sized s
ORDER BY routine;
