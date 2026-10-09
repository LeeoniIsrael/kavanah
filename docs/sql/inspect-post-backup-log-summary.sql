-- Run in Supabase's LOGS query source (ClickHouse), NOT the Database source.
-- Select a time range covering the backup through now, at most 24 hours per run.
-- This cutoff refers specifically to the October 9, 2026 scheduled backup.
-- Read-only: returns command types/severity/codes, timestamps and counts only.
-- Does not return statement text, event messages, identities, IPs or credentials.
-- These are recorded events/attempts, not proof of committed changes.
-- No rows or missing command tags do NOT establish that nothing changed.
-- Retention, logging configuration and the selected range can omit events.
-- This does not reconstruct removed jobs or establish complete deletion history.
SELECT
  CASE
    WHEN log_attributes['parsed.command_tag'] = '' THEN 'UNCLASSIFIED'
    ELSE log_attributes['parsed.command_tag']
  END AS operation,
  log_attributes['parsed.error_severity'] AS severity,
  log_attributes['parsed.sql_state_code'] AS sqlstate,
  count() AS recorded_events,
  min(timestamp) AS first_seen_utc,
  max(timestamp) AS last_seen_utc
FROM logs
WHERE source = 'postgres_logs'
  AND timestamp >= toDateTime64('2026-10-09 04:51:58', 6, 'UTC')
GROUP BY operation, severity, sqlstate
ORDER BY first_seen_utc
LIMIT 100;
