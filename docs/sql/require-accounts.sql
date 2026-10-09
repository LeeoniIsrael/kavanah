-- Generated from supabase/migrations/202610080001_account_required.sql. Apply once after the production safeguards.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
-- Account-only access. Existing anonymous identities retain only their deletion RPC.
-- Check the authoritative Auth row, including for tokens issued before anonymous signup is disabled.
create function private.has_account() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
  select 1 from auth.users where id=auth.uid() and not coalesce(is_anonymous,false)
 )
$$;
revoke all on function private.has_account() from public, anon, authenticated;
grant execute on function private.has_account() to authenticated;

create or replace function private.allowed(other uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select private.has_account()
 and exists(select 1 from auth.users where id=other and not coalesce(is_anonymous,false))
 and not exists(select 1 from private.suspensions where user_id in (auth.uid(),other))
 and not exists(select 1 from private.blocks where
  (owner=auth.uid() and target=other) or (target=auth.uid() and owner=other))
$$;

create or replace function private.connected(other uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select private.has_account() and (other=auth.uid() or (
  private.allowed(other) and exists(select 1 from public.circle_connections
   where status='accepted' and ((requester=auth.uid() and recipient=other)
    or (recipient=auth.uid() and requester=other)))
 ))
$$;

create or replace function private.throttle(bucket_name text, maximum integer) returns void
language plpgsql security definer set search_path='' as $$
 declare n integer;
 begin
 if not private.has_account() then raise exception 'Sign in with an account to continue.'; end if;
 if exists(select 1 from private.suspensions where user_id=auth.uid()) then raise exception 'This Circle account is unavailable. Contact support.'; end if;
 insert into private.rate_limits values(auth.uid(),bucket_name,now(),1)
 on conflict(owner,bucket) do update set
 hits=case when private.rate_limits.window_at < now()-interval '1 hour' then 1 else private.rate_limits.hits+1 end,
 window_at=case when private.rate_limits.window_at < now()-interval '1 hour' then now() else private.rate_limits.window_at end
 returning hits into n;
 if n>maximum then raise exception 'Please try again later.'; end if;
 end
$$;

create or replace function public.circle_settings() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('prayers',prayers,'milestones',milestones)
 from private.settings where user_id=auth.uid() and private.has_account()
$$;

create or replace function public.circle_remove(activity uuid) returns void
language sql security definer set search_path='' as $$
 delete from public.circle_activity where id=activity and owner=auth.uid() and private.has_account()
$$;

-- Restrictive policies AND with existing ownership/connection policies.
create policy account_required on public.circle_profiles as restrictive
 for select to authenticated using (private.has_account());
create policy account_required on public.circle_connections as restrictive
 for select to authenticated using (private.has_account());
create policy account_required on public.circle_activity as restrictive
 for select to authenticated using (private.has_account());

-- Explicitly retain intended grants; never grant access to private.throttle.
revoke all on function private.throttle(text,integer) from public,anon,authenticated;
revoke all on function private.allowed(uuid),private.connected(uuid),
 public.circle_settings(),public.circle_remove(uuid) from public,anon;
grant execute on function private.allowed(uuid),private.connected(uuid),
 public.circle_settings(),public.circle_remove(uuid) to authenticated;

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
