-- Supabase may grant table write privileges to authenticated by default.
-- Circle writes must go through the validated circle_* RPCs, never direct tables.
revoke all privileges on table
  public.circle_profiles,
  public.circle_connections,
  public.circle_activity
from public, anon, authenticated;

grant select on table
  public.circle_profiles,
  public.circle_connections,
  public.circle_activity
to authenticated;
