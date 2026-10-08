-- Generated from supabase/migrations/202610060001_production_safeguards.sql.
-- Apply once to the existing Kavanah project after checking its deployed schema.
-- Generate/check with: node scripts/backend/deploymentSql.mjs [--check]
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- Durable admission control for the anonymous, optional prayer assistant.
-- Only the Vercel server may reserve work. No prompts, raw IPs or tokens stored.
create table private.assistant_budget (
 singleton boolean primary key default true check(singleton),
 total bigint not null default 0,
 day date not null default current_date, daily integer not null default 0,
 minute timestamptz not null default date_trunc('minute',now()), minute_hits integer not null default 0
);
insert into private.assistant_budget(singleton) values(true);
create table private.assistant_buckets (
 scope text not null check(scope in ('ip','installation')),
 subject text not null check(subject ~ '^[a-f0-9]{64}$'),
 day date not null, hits integer not null, primary key(scope,subject)
);
create table private.assistant_requests (
 id uuid primary key, installation text not null, ip text not null,
 created_at timestamptz not null, expires_at timestamptz not null
);
create index assistant_active on private.assistant_requests(expires_at);
alter table private.assistant_budget enable row level security;
alter table private.assistant_buckets enable row level security;
alter table private.assistant_requests enable row level security;
revoke all on private.assistant_budget,private.assistant_buckets,private.assistant_requests from public,anon,authenticated;

create function public.assistant_reserve(request_id uuid, installation_hash text, ip_hash text,
 daily_limit integer, total_limit integer)
returns text language plpgsql security definer set search_path='' as $$
declare budget private.assistant_budget; instant timestamptz; today date; active integer;
begin
 if request_id is null or installation_hash is null or ip_hash is null or
 installation_hash !~ '^[a-f0-9]{64}$' or ip_hash !~ '^[a-f0-9]{64}$' or
 daily_limit is null or total_limit is null or daily_limit not between 1 and 10000 or
 total_limit not between 1 and 100000 then raise exception 'Invalid assistant configuration'; end if;
 -- Serialize every admission across instances. Failed/aborted work is never refunded.
 select * into strict budget from private.assistant_budget where singleton for update;
 instant=clock_timestamp(); today=(instant at time zone 'UTC')::date;
 if budget.total>=total_limit then return 'budget'; end if;
 if budget.day<>today then budget.day=today; budget.daily=0; end if;
 if budget.minute<>date_trunc('minute',instant) then budget.minute=date_trunc('minute',instant); budget.minute_hits=0; end if;
 if budget.daily>=daily_limit or budget.minute_hits>=30 then return 'rate'; end if;
 delete from private.assistant_requests where created_at<instant-interval '2 days';
 delete from private.assistant_buckets where day<today;
 if exists(select 1 from private.assistant_requests where id=request_id) then return 'duplicate'; end if;
 select count(*) into active from private.assistant_requests where expires_at>instant;
 if active>=5 or exists(select 1 from private.assistant_requests where expires_at>instant and installation=installation_hash) or
 (select count(*) from private.assistant_requests where expires_at>instant and ip=ip_hash)>=2 then return 'busy'; end if;
 if exists(select 1 from private.assistant_buckets where day=today and
 ((scope='installation' and subject=installation_hash and hits>=10) or (scope='ip' and subject=ip_hash and hits>=30))) then return 'rate'; end if;
 insert into private.assistant_buckets values('installation',installation_hash,today,1),('ip',ip_hash,today,1)
 on conflict(scope,subject) do update set hits=private.assistant_buckets.hits+1;
 insert into private.assistant_requests values(request_id,installation_hash,ip_hash,instant,instant+interval '60 seconds');
 update private.assistant_budget set total=budget.total+1, day=today, daily=budget.daily+1,
 minute=budget.minute, minute_hits=budget.minute_hits+1 where singleton;
 return 'allowed';
end $$;
create function public.assistant_finish(request_id uuid) returns void
language sql security definer set search_path='' as $$
 update private.assistant_requests set expires_at=clock_timestamp() where id=request_id
$$;
revoke all on function public.assistant_reserve(uuid,text,text,integer,integer),public.assistant_finish(uuid) from public,anon,authenticated;
grant execute on function public.assistant_reserve(uuid,text,text,integer,integer),public.assistant_finish(uuid) to service_role;

-- Block and request operations must take the same locks, then recheck visibility.
-- Otherwise a request admitted before a concurrent block could recreate a contact.
create or replace function public.circle_request(contact_handle text) returns void
language plpgsql security definer set search_path='' as $$
declare other uuid;
begin
 perform private.throttle('request',20);
 if contact_handle is null or lower(trim(contact_handle)) !~ '^[a-z0-9_]{3,24}$' then raise exception 'Invalid handle'; end if;
 select id into other from public.circle_profiles where handle=lower(trim(contact_handle));
 if other is null or other=auth.uid() then raise exception 'This person is not available. Check their handle.'; end if;
 perform id from public.circle_profiles where id in (auth.uid(),other) order by id for update;
 if not private.allowed(other) then raise exception 'This person is not available. Check their handle.'; end if;
 if not exists(select 1 from public.circle_connections where (requester=auth.uid() and recipient=other) or (requester=other and recipient=auth.uid())) and
 ((select count(*) from public.circle_connections where requester=auth.uid() or recipient=auth.uid())>=200 or
 (select count(*) from public.circle_connections where requester=other or recipient=other)>=200) then raise exception 'This circle is full. Remove a connection before adding another.'; end if;
 if exists(select 1 from public.circle_connections where requester=other and recipient=auth.uid()) then
 update public.circle_connections set status='accepted' where requester=other and recipient=auth.uid();
 else insert into public.circle_connections(requester,recipient) values(auth.uid(),other) on conflict do nothing; end if;
end $$;
create or replace function public.circle_connection(other uuid, action text) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform private.throttle('connection',60);
 if other is null or other=auth.uid() or action is null or action not in ('accept','remove','block') then raise exception 'Invalid action'; end if;
 perform id from public.circle_profiles where id in (auth.uid(),other) order by id for update;
 if action='accept' and private.allowed(other) then
 update public.circle_connections set status='accepted' where requester=other and recipient=auth.uid();
 elsif action in ('remove','block') then
 delete from public.circle_connections where (requester=other and recipient=auth.uid()) or (recipient=other and requester=auth.uid());
 if action='block' then insert into private.blocks values(auth.uid(),other) on conflict do nothing; end if;
 else raise exception 'Invalid action'; end if;
end $$;
-- The streak query needs at most the longest supported milestone's 100 days.
-- Keep the existing function contract and validate the generated change below.

create or replace function public.circle_record(event text, prayer text, started timestamptz, completed timestamptz)
 returns void language plpgsql security definer set search_path='' as $$
 declare prefs private.settings; item private.catalog; d date; run integer; was_first boolean;
 begin
 perform private.throttle('completion',120);
 select * into strict prefs from private.settings where user_id=auth.uid() for update;
 if exists(select 1 from private.sessions where owner=auth.uid() and event_id=event) then return; end if;
 if completed is null or completed>now()+interval '5 minutes' or completed<now()-interval '30 days' then raise exception 'Completion date is outside the sync window.'; end if;
 select * into strict item from private.catalog where id=prayer;
 d=(completed at time zone prefs.timezone)::date;
 was_first=not prefs.has_prayed;
 insert into private.sessions values(auth.uid(),event,prayer,started,completed,d);
 update private.settings set has_prayed=true where user_id=auth.uid();
 if prefs.prayers='every' or (prefs.prayers='first-ever' and was_first) then
 insert into public.circle_activity(owner,event_key,kind,prayer_id,title,created_at,started_at,duration_seconds)
 values(auth.uid(),'prayer:'||event,'prayer',prayer,item.title,completed,started,extract(epoch from completed-started)::integer);
 end if;
 -- Server calculates the consecutive active-day streak, never trusts a client counter.
 with days as (select distinct local_day from private.sessions where owner=auth.uid() and local_day between d-99 and d),
 ranked as (select local_day, row_number() over(order by local_day desc)::integer n from days)
 select count(*) into run from ranked where local_day=d-(n-1);
 if prefs.milestones and run in (3,7,18,40,100) then
 insert into private.milestones values(auth.uid(),run) on conflict do nothing;
 if found then insert into public.circle_activity(owner,event_key,kind,prayer_id,title,created_at,streak,started_at,duration_seconds)
 values(auth.uid(),'milestone:'||run,'milestone',prayer,item.title,completed,run,started,extract(epoch from completed-started)::integer); end if;
 end if;
 end $$;

-- Private tables remain API-inaccessible; RLS also protects accidental future grants.
ALTER TABLE private.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.suspensions ENABLE ROW LEVEL SECURITY;

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
