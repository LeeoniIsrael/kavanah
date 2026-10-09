-- Run with the LOGS query source (ClickHouse), using the same bounded time range
-- as inspect-post-backup-log-summary.sql: at most 24 hours per run.
-- Read-only; share the result, not the underlying event messages or SQL text.
-- Classifications and keyword matches are triage heuristics, not proof of changes
-- or of their absence. SQL text, truncation, REVIEW or a full 20 rows need review.
-- This does not establish historical logging coverage or deletion completeness.
SELECT
  timestamp AS timestamp_utc,
  CASE
    WHEN log_attributes['parsed.query'] != ''
      OR log_attributes['parsed.internal_query'] != ''
      OR match(event_message, '(?i)statement:|audit:') THEN 'SQL_REVIEW'
    WHEN match(event_message, '(?i)^checkpoint (starting|complete)') THEN 'CHECKPOINT'
    WHEN match(event_message, '(?i)^restartpoint (starting|complete)') THEN 'RESTARTPOINT'
    WHEN match(event_message, '(?i)^automatic (vacuum|analyze)') THEN 'MAINTENANCE'
    WHEN match(event_message, '(?i)^(connection|disconnection)[ :]')
      THEN 'CONNECTION'
    ELSE 'REVIEW'
  END AS category,
  match(
    concat(event_message, ' ', log_attributes['parsed.query'],
      ' ', log_attributes['parsed.internal_query']),
    '(?i)(^|[^a-z_])(create|alter|drop|grant|revoke|delete|truncate|do|cron|pg_cron|pg_net|net|http|http_get|http_post|webhook|dblink|foreign|wrappers)([^a-z_]|$)'
  ) AS change_or_automation_keywords,
  length(event_message) >= 100000
    OR length(log_attributes['parsed.query']) >= 100000
    OR length(log_attributes['parsed.internal_query']) >= 100000 AS possible_truncation
FROM logs
WHERE source = 'postgres_logs'
  AND timestamp >= toDateTime64('2026-10-09 04:51:58', 6, 'UTC')
  AND log_attributes['parsed.command_tag'] = ''
ORDER BY timestamp
LIMIT 20;
