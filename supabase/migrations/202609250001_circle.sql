-- Circle's API is a small set of authenticated functions. No client table writes.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table public.circle_profiles (
 id uuid primary key references auth.users on delete cascade,
 handle text not null unique check(handle ~ '^[a-z0-9_]{3,24}$'),
 display_name text not null check(length(trim(display_name)) between 1 and 50),
 created_at timestamptz not null default now()
);
create table private.settings (
 user_id uuid primary key references public.circle_profiles on delete cascade,
 prayers text not null default 'off' check(prayers in ('off','first-ever','every')),
 milestones boolean not null default false, has_prayed boolean not null default false,
 timezone text not null default 'UTC'
);
create table public.circle_connections (
 requester uuid references public.circle_profiles on delete cascade,
 recipient uuid references public.circle_profiles on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted')),
 created_at timestamptz not null default now(), primary key(requester,recipient),
 check(requester <> recipient)
);
create unique index connection_pair on public.circle_connections(least(requester,recipient), greatest(requester,recipient));
create index incoming_connections on public.circle_connections(recipient,status,requester);
create table private.blocks (
 owner uuid references public.circle_profiles on delete cascade,
 target uuid references public.circle_profiles on delete cascade,
 primary key(owner,target), check(owner<>target)
);
create table private.catalog (
 id text primary key, title text not null, practice text not null
);
create table private.passages (
 id text primary key, prayer_id text not null references private.catalog,
 language text not null, body text not null, source_ref text not null
);
create table private.sessions (
 owner uuid references public.circle_profiles on delete cascade,
 event_id text not null check(length(event_id) between 1 and 160),
 prayer_id text not null references private.catalog,
 started_at timestamptz, completed_at timestamptz not null, local_day date not null,
 primary key(owner,event_id),
 check(started_at is null or (started_at<=completed_at and completed_at-started_at<=interval '24 hours'))
);
create index sessions_days on private.sessions(owner,local_day desc);
create table public.circle_activity (
 id uuid primary key default gen_random_uuid(), owner uuid not null references public.circle_profiles on delete cascade,
 event_key text not null, kind text not null check(kind in ('prayer','milestone','quote')),
 prayer_id text not null references private.catalog, title text not null,
 created_at timestamptz not null default now(), started_at timestamptz, duration_seconds integer,
 streak integer, quote text, source_ref text, language text,
 unique(owner,event_key)
);
create index activity_feed on public.circle_activity(created_at desc,id desc);
create index activity_owner_feed on public.circle_activity(owner,created_at desc,id desc);
create table private.milestones (
 owner uuid references public.circle_profiles on delete cascade, days integer not null, primary key(owner,days)
);
create table private.reports (
 id uuid primary key default gen_random_uuid(), reporter uuid references public.circle_profiles on delete cascade,
 target uuid references public.circle_profiles on delete cascade, activity_id uuid references public.circle_activity on delete set null,
 reason text not null check(reason in ('abuse','inappropriate','impersonation','other')),
 created_at timestamptz not null default now(), reviewed_at timestamptz
);
create index reports_queue on private.reports(created_at) where reviewed_at is null;
create table private.rate_limits (
 owner uuid references auth.users on delete cascade, bucket text, window_at timestamptz, hits integer not null,
 primary key(owner,bucket)
);
create table private.suspensions (
 user_id uuid primary key references public.circle_profiles on delete cascade,
 reason text not null, created_at timestamptz not null default now()
);
create function private.allowed(other uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and not exists(select 1 from private.suspensions where user_id in (auth.uid(),other)) and not exists(select 1 from private.blocks where
 (owner=auth.uid() and target=other) or (target=auth.uid() and owner=other))
$$;
create function private.connected(other uuid) returns boolean language sql stable security definer set search_path='' as $$
 select other=auth.uid() or (private.allowed(other) and exists(select 1 from public.circle_connections
 where status='accepted' and ((requester=auth.uid() and recipient=other) or (recipient=auth.uid() and requester=other))))
$$;
create function private.throttle(bucket_name text, maximum integer) returns void language plpgsql security definer set search_path='' as $$
 declare n integer;
 begin
 if auth.uid() is null then raise exception 'Sign in to continue.'; end if;
 if exists(select 1 from private.suspensions where user_id=auth.uid()) then raise exception 'This Circle account is unavailable. Contact support.'; end if;
 insert into private.rate_limits values(auth.uid(),bucket_name,now(),1)
 on conflict(owner,bucket) do update set
 hits=case when private.rate_limits.window_at < now()-interval '1 hour' then 1 else private.rate_limits.hits+1 end,
 window_at=case when private.rate_limits.window_at < now()-interval '1 hour' then now() else private.rate_limits.window_at end
 returning hits into n;
 if n>maximum then raise exception 'Please try again later.'; end if;
 end $$;
alter table public.circle_profiles enable row level security;
alter table public.circle_connections enable row level security;
alter table public.circle_activity enable row level security;
create policy profile_visibility on public.circle_profiles for select to authenticated using (
 private.connected(id) or (private.allowed(id) and exists(select 1 from public.circle_connections where
 (requester=auth.uid() and recipient=id) or (recipient=auth.uid() and requester=id)))
);
create policy connection_visibility on public.circle_connections for select to authenticated using(requester=auth.uid() or recipient=auth.uid());
create policy activity_visibility on public.circle_activity for select to authenticated using(private.connected(owner));
grant usage on schema private to authenticated;
grant execute on function private.allowed(uuid),private.connected(uuid) to authenticated;
grant select on public.circle_profiles,public.circle_connections,public.circle_activity to authenticated;
revoke all on public.circle_profiles,public.circle_connections,public.circle_activity from anon;

create function public.circle_join(user_handle text, user_name text, user_timezone text, already_prayed boolean default true)
 returns void language plpgsql security definer set search_path='' as $$
 begin
 perform private.throttle('join',5);
 if not exists(select 1 from pg_timezone_names where name=user_timezone) then raise exception 'Invalid timezone'; end if;
 insert into public.circle_profiles(id,handle,display_name) values(auth.uid(),lower(trim(user_handle)),trim(user_name));
 insert into private.settings(user_id,timezone,has_prayed) values(auth.uid(),user_timezone,already_prayed);
 end $$;
create function public.circle_preferences(prayer_mode text, share_milestones boolean) returns void language plpgsql security definer set search_path='' as $$
 begin
 perform private.throttle('preferences',60);
 update private.settings set prayers=prayer_mode,milestones=share_milestones where user_id=auth.uid();
 end $$;
create function public.circle_settings() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('prayers',prayers,'milestones',milestones) from private.settings where user_id=auth.uid()
$$;
create function public.circle_request(contact_handle text) returns void language plpgsql security definer set search_path='' as $$
 declare other uuid;
 begin
 perform private.throttle('request',20);
 select id into other from public.circle_profiles where handle=lower(trim(contact_handle));
 if other is null or other=auth.uid() or not private.allowed(other) then raise exception 'This person is not available. Check their handle.'; end if;
 -- Bound private circles and lock both profiles in a stable order for concurrent requests.
 perform id from public.circle_profiles where id in (auth.uid(),other) order by id for update;
 if not exists(select 1 from public.circle_connections where (requester=auth.uid() and recipient=other) or (requester=other and recipient=auth.uid())) and
 ((select count(*) from public.circle_connections where requester=auth.uid() or recipient=auth.uid())>=200 or
 (select count(*) from public.circle_connections where requester=other or recipient=other)>=200) then raise exception 'This circle is full. Remove a connection before adding another.'; end if;
 if exists(select 1 from public.circle_connections where requester=other and recipient=auth.uid()) then
 update public.circle_connections set status='accepted' where requester=other and recipient=auth.uid();
 else
 insert into public.circle_connections(requester,recipient) values(auth.uid(),other) on conflict do nothing;
 end if;
 end $$;
create function public.circle_connection(other uuid, action text) returns void language plpgsql security definer set search_path='' as $$
 begin
 perform private.throttle('connection',60);
 if action='accept' and private.allowed(other) then
 update public.circle_connections set status='accepted' where requester=other and recipient=auth.uid();
 elsif action='remove' or action='block' then
 delete from public.circle_connections where (requester=other and recipient=auth.uid()) or (recipient=other and requester=auth.uid());
 if action='block' then insert into private.blocks values(auth.uid(),other) on conflict do nothing; end if;
 else raise exception 'Invalid action'; end if;
 end $$;
create function public.circle_record(event text, prayer text, started timestamptz, completed timestamptz)
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
 with days as (select distinct local_day from private.sessions where owner=auth.uid() and local_day<=d),
 ranked as (select local_day, row_number() over(order by local_day desc)::integer n from days)
 select count(*) into run from ranked where local_day=d-(n-1);
 if prefs.milestones and run in (3,7,18,40,100) then
 insert into private.milestones values(auth.uid(),run) on conflict do nothing;
 if found then insert into public.circle_activity(owner,event_key,kind,prayer_id,title,created_at,streak,started_at,duration_seconds)
 values(auth.uid(),'milestone:'||run,'milestone',prayer,item.title,completed,run,started,extract(epoch from completed-started)::integer); end if;
 end if;
 end $$;
create function public.circle_quote(prayer text, passage_text text, quote_language text, first_word integer, last_word integer)
 returns void language plpgsql security definer set search_path='' as $$
 declare passage private.passages; words text[]; w text; title_text text;
 begin
 perform private.throttle('quote',20);
 select * into passage from private.passages where prayer_id=prayer and body=passage_text and language=quote_language limit 1;
 if passage.id is null then raise exception 'This passage is not available for Circle yet.'; end if;
 words=regexp_split_to_array(trim(passage.body),'\s+');
 if first_word is null or last_word is null or first_word<0 or last_word<first_word or last_word>=array_length(words,1) or last_word-first_word>=60 then raise exception 'Choose between 1 and 60 words.'; end if;
 select to_char(date_trunc('week',now() at time zone timezone),'YYYY-MM-DD') into w from private.settings where user_id=auth.uid();
 select title into title_text from private.catalog where id=prayer;
 insert into public.circle_activity(owner,event_key,kind,prayer_id,title,quote,source_ref,language)
 values(auth.uid(),'quote:'||w,'quote',prayer,title_text,array_to_string(words[first_word+1:last_word+1],' '),passage.source_ref,quote_language)
 on conflict(owner,event_key) do update set prayer_id=excluded.prayer_id,title=excluded.title,quote=excluded.quote,source_ref=excluded.source_ref,language=excluded.language,created_at=now();
 end $$;
create function public.circle_remove(activity uuid) returns void language sql security definer set search_path='' as $$
 delete from public.circle_activity where id=activity and owner=auth.uid()
$$;
create function public.circle_report(person uuid, activity uuid, report_reason text) returns void language plpgsql security definer set search_path='' as $$
 begin
 perform private.throttle('report',10);
 if person=auth.uid() or not private.allowed(person) or not (private.connected(person) or exists(select 1 from public.circle_connections where (requester=auth.uid() and recipient=person) or (recipient=auth.uid() and requester=person))) then raise exception 'Person is unavailable'; end if;
 if activity is not null and not exists(select 1 from public.circle_activity where id=activity and owner=person) then raise exception 'Update is unavailable'; end if;
 insert into private.reports(reporter,target,activity_id,reason) values(auth.uid(),person,activity,report_reason);
 end $$;
-- Account deletion cascades through contacts, posts, sessions, blocks and reports.
-- JWT can survive deletion briefly, but its subject has no remaining rows and cannot recreate a profile without auth.users.
create function public.circle_delete_account() returns void language plpgsql security definer set search_path='' as $$
 begin
 if auth.uid() is null then raise exception 'Sign in to continue'; end if;
 delete from auth.users where id=auth.uid();
 end $$;
-- Deny execution inherited from Postgres's PUBLIC default; expose only intended RPCs.
revoke execute on all functions in schema private from public,anon,authenticated;
grant execute on function private.allowed(uuid),private.connected(uuid) to authenticated;
do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname like 'circle_%' loop
 execute format('revoke all on function %s from public, anon',f.signature);
 execute format('grant execute on function %s to authenticated',f.signature);
 end loop;
end $$;
revoke all on all tables in schema private from public,anon,authenticated;

-- Fan-out on read: index into each connected person's recent activity instead of
-- scanning the global feed and discarding invisible rows. No write fan-out or realtime subscription.
create function public.circle_feed(before_created timestamptz default null, before_id uuid default null, page_size integer default 20)
returns table(id uuid,owner uuid,title text,kind text,created_at timestamptz,started_at timestamptz,duration_seconds integer,streak integer,quote text,source_ref text,circle_profiles jsonb)
language sql stable security definer set search_path='' as $$
 with people as (
 select auth.uid() person where auth.uid() is not null
 union
 select case when requester=auth.uid() then recipient else requester end from public.circle_connections
 where status='accepted' and (requester=auth.uid() or recipient=auth.uid())
 ), visible as (select person from people where private.allowed(person))
 select a.id,a.owner,a.title,a.kind,a.created_at,a.started_at,a.duration_seconds,a.streak,a.quote,a.source_ref,
 jsonb_build_object('id',p.id,'handle',p.handle,'display_name',p.display_name)
 from visible v cross join lateral (
 select * from public.circle_activity a where a.owner=v.person
 and (before_created is null or (a.created_at,a.id)<(before_created,coalesce(before_id,'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)))
 order by a.created_at desc,a.id desc limit greatest(1,least(coalesce(page_size,20),50))
 ) a join public.circle_profiles p on p.id=a.owner
 order by a.created_at desc,a.id desc limit greatest(1,least(coalesce(page_size,20),50))
$$;
revoke all on function public.circle_feed(timestamptz,uuid,integer) from public,anon;
grant execute on function public.circle_feed(timestamptz,uuid,integer) to authenticated;
