import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
execFileSync(process.execPath, ['scripts/backend/deploymentSql.mjs', '--check'], { stdio: 'inherit' });
const db=new PGlite();
await db.exec(`create role service_role; create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key, is_anonymous boolean default false); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
for(const file of ['202609250001_circle.sql','202609250002_catalog.sql','202609270001_circle_table_grants.sql'])await db.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
const deployment=readFileSync('docs/sql/production-safeguards.sql','utf8');
const verification=readFileSync('docs/sql/verify-production-safeguards.sql','utf8');
const beforeDeployment=(await db.query(verification)).rows;
assert.equal(beforeDeployment.find(row=>row.check_name==='Tables, RLS and grants').status,'FAIL');
assert.equal(beforeDeployment.find(row=>row.check_name.startsWith('public.assistant_reserve')).status,'FAIL');
// A failure at the end must undo new tables and replaced Circle functions.
const previousRequest=(await db.query("select pg_get_functiondef('public.circle_request(text)'::regprocedure) definition")).rows[0].definition;
await assert.rejects(db.exec(deployment.replace("NOTIFY pgrst, 'reload schema';", "SELECT 1/0;")));
await db.exec('ROLLBACK');
assert.equal((await db.query("select to_regclass('private.assistant_budget') present")).rows[0].present,null);
assert.equal((await db.query("select pg_get_functiondef('public.circle_request(text)'::regprocedure) definition")).rows[0].definition,previousRequest);
await db.exec('create schema supabase_migrations; create table supabase_migrations.schema_migrations(version text primary key, statements text[], name text)');
await db.exec(deployment);
assert.equal((await db.query("select count(*)::int n from supabase_migrations.schema_migrations where version='202610060001'")).rows[0].n,1);
await assert.rejects(db.exec(deployment));
await db.exec('ROLLBACK');
assert.equal((await db.query('select count(*)::int n from private.assistant_budget')).rows[0].n,1);
console.log('SQL editor transaction rollback, history recording and repeat-application protection passed.');
const verify=async()=> (await db.query(verification)).rows;
assert.equal((await verify()).length,6);
assert((await verify()).every(row=>row.status==='PASS'));
await db.exec('grant execute on function public.assistant_reserve(uuid,text,text,integer,integer) to authenticated');
assert.equal((await verify()).find(row=>row.check_name.startsWith('public.assistant_reserve')).status,'FAIL');
await db.exec('revoke execute on function public.assistant_reserve(uuid,text,text,integer,integer) from authenticated; alter table private.blocks disable row level security');
assert.equal((await verify()).find(row=>row.check_name==='Tables, RLS and grants').status,'FAIL');
await db.exec('alter table private.blocks enable row level security');
const installedRequest=(await db.query("select pg_get_functiondef('public.circle_request(text)'::regprocedure) definition")).rows[0].definition;
await db.exec("create or replace function public.circle_request(contact_handle text) returns void language plpgsql security definer set search_path='' as $$ begin return; end $$");
assert.equal((await verify()).find(row=>row.check_name==='public.circle_request(text)').status,'FAIL');
await db.exec(installedRequest);
assert((await verify()).every(row=>row.status==='PASS'));
console.log('Read-only verification detects missing safeguards, client execution grants, disabled RLS and changed function code.');
const accountDeployment=readFileSync('docs/sql/require-accounts.sql','utf8');
const accountVerification=readFileSync('docs/sql/verify-account-required.sql','utf8');
assert((await db.query(accountVerification)).rows.every(row=>row.status==='FAIL'));
await assert.rejects(db.exec(accountDeployment.replace("NOTIFY pgrst, 'reload schema';",'SELECT 1/0;')));
await db.exec('ROLLBACK');
assert.equal((await db.query("select to_regprocedure('private.has_account()') present")).rows[0].present,null);
await db.exec(accountDeployment);
assert.equal((await db.query("select count(*)::int n from supabase_migrations.schema_migrations where version='202610080001'")).rows[0].n,1);
assert.equal((await db.query(accountVerification)).rows.length,7);
assert((await db.query(accountVerification)).rows.every(row=>row.status==='PASS'));
await db.exec('alter policy account_required on public.circle_profiles using (true)');
assert.equal((await db.query(accountVerification)).rows.find(row=>row.check_name==='Restrictive account policies').status,'FAIL');
await db.exec('alter policy account_required on public.circle_profiles using (private.has_account())');
assert((await db.query(accountVerification)).rows.every(row=>row.status==='PASS'));
await assert.rejects(db.exec(accountDeployment));
await db.exec('ROLLBACK');
console.log('Account-only deployment rollback, history, repeat protection and policy verification passed.');
const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002',c='00000000-0000-4000-8000-000000000003';
await db.exec(`insert into auth.users(id) values('${a}'),('${b}'),('${c}');`);
async function as(id){await db.exec(`reset role; select set_config('request.jwt.claim.sub','${id}',false); set role authenticated;`);}
const q=(sql,args=[])=>db.query(sql,args);
let checks=0;
async function denied(sql,args=[]){await assert.rejects(q(sql,args));checks++;}
for(const table of ['circle_profiles','circle_connections','circle_activity']){
 const privileges=(await q(`select c.relrowsecurity rls,
  has_table_privilege('anon',c.oid,'SELECT') anon_select,
  has_table_privilege('authenticated',c.oid,'SELECT') user_select,
  has_table_privilege('authenticated',c.oid,'INSERT') user_insert,
  has_table_privilege('authenticated',c.oid,'UPDATE') user_update,
  has_table_privilege('authenticated',c.oid,'DELETE') user_delete
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname=$1`,[table])).rows[0];
 assert.deepEqual(privileges,{rls:true,anon_select:false,user_select:true,user_insert:false,user_update:false,user_delete:false});checks++;
}
const privateTables=(await q("select c.relname,c.relrowsecurity rls,has_table_privilege('authenticated',c.oid,'SELECT') can_read from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='private' and c.relkind='r'")).rows;
for(const table of privateTables){assert.equal(table.rls,true,table.relname);assert.equal(table.can_read,false,table.relname);checks++;}
for(const [id,handle] of [[a,'alice'],[b,'bobby'],[c,'carol']]){await as(id);await q("select circle_join($1,$1,'America/New_York',false)",[handle]);}
await as(a);
await denied("insert into circle_activity(owner,event_key,kind,prayer_id,title) values($1,'fake','prayer','modeh-ani','Fake')",[a]);
await denied("select * from private.sessions");
await denied("select private.throttle('cheat',1000)");
await q("select circle_preferences('first-ever',false)");
await q("select circle_record('one','modeh-ani',now()-interval '15 seconds',now())");
await q("select circle_record('one','modeh-ani',null,now())");
await q("select circle_record('two','modeh-ani',null,now())");
assert.equal((await q('select * from circle_activity')).rows.length,1);checks++;
await as(b);assert.equal((await q('select * from circle_activity')).rows.length,0);checks++;
await q("select circle_request('alice')");
assert.equal((await q('select * from circle_activity')).rows.length,0);checks++;
await as(a);await q("select circle_connection($1,'accept')",[b]);
await as(b);assert.equal((await q('select * from circle_activity')).rows.length,1);checks++;
assert.equal((await q('select * from circle_feed()')).rows.length,1);checks++;
await as(c);assert.equal((await q('select * from circle_activity')).rows.length,0);checks++;
assert.equal((await q('select * from circle_feed()')).rows.length,0);checks++;

await as(a);
await denied("select circle_quote('modeh-ani','My arbitrary caption','en',0,2)");
const text='I thank You, living and enduring King, for restoring my soul with compassion; great is Your faithfulness.';
await q("select circle_quote('modeh-ani',$1,'en',0,2)",[text]);
await q("select circle_quote('modeh-ani',$1,'en',0,3)",[text]);
assert.equal((await q("select * from circle_activity where kind='quote'")).rows.length,1);checks++;
await denied("select circle_quote('modeh-ani',$1,'en',0,100)",[text]);
const firstPage=(await q('select * from circle_feed(null,null,1)')).rows;
const nextPage=(await q('select * from circle_feed($1,$2,1)',[firstPage[0].created_at,firstPage[0].id])).rows;
assert.equal(firstPage.length,1);assert.equal(nextPage.length,1);assert.notEqual(firstPage[0].id,nextPage[0].id);checks++;
await denied("select circle_record('future','modeh-ani',null,now()+interval '1 day')");
await denied("select circle_record('backwards','modeh-ani',now(),now()-interval '1 minute')");

await q("select circle_preferences('off',true)");
await q("select circle_record('older2','modeh-ani',null,now()-interval '2 days')");
await q("select circle_record('older1','modeh-ani',null,now()-interval '1 day')");
await q("select circle_record('three','modeh-ani',null,now())");
assert.equal((await q("select streak from circle_activity where kind='milestone'")).rows[0].streak,3);checks++;
await as(b);
const post=(await q('select id from circle_activity limit 1')).rows[0].id;
await q("select circle_remove($1)",[post]);
assert.equal((await q('select id from circle_activity where id=$1',[post])).rows.length,1);checks++;
await q("select circle_report($1,$2,'abuse')",[a,post]);
await q("select circle_connection($1,'block')",[a]);
assert.equal((await q('select * from circle_activity')).rows.length,0);checks++;
assert.equal((await q('select * from circle_feed()')).rows.length,0);checks++;
await as(a);await denied("select circle_request('bobby')");
await as(c);await q("select circle_preferences('off',false)");await q("select circle_record('private-first','modeh-ani',null,now())");
await q("select circle_preferences('first-ever',false)");await q("select circle_record('later','modeh-ani',null,now())");
assert.equal((await q('select * from circle_feed()')).rows.length,0);checks++;
await db.exec('reset role');
await q('insert into private.suspensions(user_id,reason) values($1,$$Test moderation$$)',[a]);
await as(a);assert.equal((await q('select * from circle_feed()')).rows.length,0);checks++;
await denied("select circle_record('suspended','modeh-ani',null,now())");
await q('select circle_delete_account()');
await db.exec('reset role');
for(const table of ['public.circle_profiles','public.circle_activity','private.sessions','private.settings','private.rate_limits']){
 const key=table==='public.circle_profiles'?'id':table==='private.settings'?'user_id':'owner';
 assert.equal((await q(`select count(*)::int n from ${table} where ${key}=$1`,[a])).rows[0].n,0);checks++;
}
await db.exec(`set role anon`);await denied('select * from circle_activity');await denied('select * from circle_feed()');await denied("select circle_join('outsider','Outsider','UTC',false)");
// The assistant guard must be callable only by the server role.
await denied("select assistant_reserve(gen_random_uuid(),repeat('a',64),repeat('b',64),10,100)");
await db.exec('reset role; set role authenticated');
await denied("select assistant_reserve(gen_random_uuid(),repeat('a',64),repeat('b',64),10,100)");
await denied('select * from private.assistant_budget');
await db.exec('reset role; set role service_role');
const reserve=async(id,installation='a',ip='b',daily=100,total=1000)=>(await q("select assistant_reserve($1,repeat($2,64),repeat($3,64),$4,$5) status",[id,installation,ip,daily,total])).rows[0].status;
const rid='10000000-0000-4000-8000-000000000001';
assert.equal(await reserve(rid),'allowed');checks++;
assert.equal(await reserve(rid),'duplicate');checks++;
assert.equal(await reserve('10000000-0000-4000-8000-000000000002'),'busy');checks++;
await q('select assistant_finish($1)',[rid]);
assert.equal(await reserve(rid),'duplicate');checks++;
for(let i=2;i<=10;i++){
 const id=`10000000-0000-4000-8000-${String(i).padStart(12,'0')}`;
 assert.equal(await reserve(id),'allowed');await q('select assistant_finish($1)',[id]);
}
assert.equal(await reserve('10000000-0000-4000-8000-000000000011'),'rate');checks++;
assert.equal(await reserve('10000000-0000-4000-8000-000000000012','c','d',10),'rate');checks++;
assert.equal(await reserve('10000000-0000-4000-8000-000000000013','c','d',100,10),'budget');checks++;
await denied("select assistant_reserve(gen_random_uuid(),repeat('a',64),repeat('b',64),10001,100)");
// Concurrency leases survive instance death and expire, without refunding cost.
await db.exec("reset role; update private.assistant_requests set expires_at=now()-interval '1 second'; update private.assistant_budget set minute_hits=0; set role service_role");
for(let i=0;i<5;i++)assert.equal(await reserve(`20000000-0000-4000-8000-${String(i).padStart(12,'0')}`,String(i),String(i)),'allowed');
assert.equal(await reserve('20000000-0000-4000-8000-000000000099','f','f'),'busy');checks++;
await db.exec("reset role; update private.assistant_requests set expires_at=now()-interval '1 second'; set role service_role");
assert.equal(await reserve('20000000-0000-4000-8000-000000000099','f','f'),'allowed');checks++;
// Turning off sharing or completion duplication cannot change another user's rows.
await db.exec('reset role');
assert.equal((await q('select count(*)::int n from auth.users where id=$1',[a])).rows[0].n,0);checks++;
// A valid role/JWT subject belonging to a legacy anonymous Auth row is still denied.
const legacy='00000000-0000-4000-8000-000000000004';
await q('insert into auth.users(id) values($1)',[legacy]);
await as(legacy);
await q("select circle_join('legacy_guest','Legacy','UTC',false)");
await q("select circle_preferences('every',false)");
await q("select circle_record('legacy','modeh-ani',null,now())");
await q("select circle_request('carol')");
await db.exec('reset role');
await q('update auth.users set is_anonymous=true where id=$1',[legacy]);
await as(legacy);
for(const table of ['circle_profiles','circle_connections','circle_activity']) {
 assert.equal((await q(`select * from ${table}`)).rows.length,0); checks++;
}
assert.equal((await q('select * from circle_feed()')).rows.length,0);checks++;
assert.equal((await q('select circle_settings() settings')).rows[0].settings,null);checks++;
await denied("select circle_join('another_guest','Guest','UTC',false)");
await denied("select circle_preferences('off',false)");
await denied("select circle_record('guest-write','modeh-ani',null,now())");
await denied("select circle_request('carol')");
await denied("select circle_connection($1,'accept')",[c]);
await denied("select circle_report($1,null,'other')",[c]);
await db.exec('reset role');
const legacyPost=(await q('select id from circle_activity where owner=$1',[legacy])).rows[0].id;
await as(legacy); await q('select circle_remove($1)',[legacyPost]);
await db.exec('reset role');
assert.equal((await q('select count(*)::int n from circle_activity where owner=$1',[legacy])).rows[0].n,1);checks++;
await as(c); await denied("select circle_request('legacy_guest')");
// Conversion to a real identity restores ownership; deleted users cannot reuse old JWT subjects.
await db.exec('reset role'); await q('update auth.users set is_anonymous=false where id=$1',[legacy]);
await as(legacy);assert.equal((await q('select * from circle_profiles')).rows.length,2);checks++;
await db.exec('reset role'); await q('update auth.users set is_anonymous=true where id=$1',[legacy]);
await as(legacy);await q('select circle_delete_account()');
await denied("select circle_join('deleted_guest','Deleted','UTC',false)");
await as(a);await denied("select circle_join('deleted_user','Deleted','UTC',false)");
await db.exec('reset role');
const restoreInventory=readFileSync('docs/sql/inspect-restore-source.sql','utf8');
const restoreHooks=readFileSync('docs/sql/identify-restore-hooks.sql','utf8');
const restoreHookLines=readFileSync('docs/sql/compare-restore-hook-lines.sql','utf8');
await db.exec("begin read only; set local statement_timeout='5s'");
const currentInventory=(await q(restoreInventory)).rows;
assert.equal(currentInventory.length,8);
assert.equal(currentInventory.find(row=>row.check_name==='External routine candidates').status,'NOT_FOUND');
await db.exec('rollback');
await db.close();console.log(`${checks} database/security checks passed against PostgreSQL (PGlite).`);

// Inventory reads only catalogs, including when optional job relations are absent,
// when the named relation is a view, and when hooks contain private tokens/URLs.
const inventoryDb=new PGlite();
try {
 const inspect=async(sql=restoreInventory)=>{
  await inventoryDb.exec("begin read only; set local statement_timeout='5s'");
  try{return (await inventoryDb.query(sql)).rows;}
  finally{await inventoryDb.exec('rollback');}
 };
 const absent=await inspect();
 assert.equal(absent.length,8);
 assert(absent.every(row=>row.status==='NOT_FOUND'));
 assert.deepEqual(await inspect(restoreHooks),[]);
 const missingLines=await inspect(restoreHookLines);
 assert.equal(missingLines.length,3);
 assert(missingLines.every(row=>row.status==='MISSING' && row.line_fingerprints===null));
 await inventoryDb.exec(`
  create schema cron; create schema net; create schema pgcustom;
  create function net.http_post() returns integer language plpgsql as $$
   begin raise exception 'An inventory must never invoke this integration'; end $$;
  create view cron.job as select net.http_post() command;
  create table net.http_request_queue(secret text);
  insert into net.http_request_queue values ('FIXTURE_PRIVATE_TOKEN');
  create foreign data wrapper fixture_fdw;
  create server fixture_server foreign data wrapper fixture_fdw
   options (endpoint 'https://fixture.invalid/FIXTURE_PRIVATE_TOKEN');
  create function public.fixture_hook() returns trigger language plpgsql as $$
   begin
    -- https://fixture.invalid/FIXTURE_PRIVATE_TOKEN
    perform net.http_post(); return new;
   end $$;
  create function pgcustom.fixture_integration(secret text default 'FIXTURE_DEFAULT_TOKEN')
   returns void language plpgsql as $$
   begin perform net.http_post(); end $$;
  create table public.fixture_records(id integer);
  create trigger fixture_hook before insert on public.fixture_records
   for each row execute function public.fixture_hook();
  create function public.fixture_ddl() returns event_trigger language plpgsql as $$
   begin return; end $$;
  create event trigger fixture_ddl on ddl_command_end
   execute function public.fixture_ddl();
 `);
 const observed=await inspect();
 for(const name of ['Scheduled-job relation','HTTP-queue relation','Foreign servers',
                    'Application triggers','Enabled event triggers','External routine candidates']){
  assert.equal(observed.find(row=>row.check_name===name).status,'REVIEW',name);
 }
 assert.equal(observed.find(row=>row.check_name==='External routine candidates').observed,2);
 assert(!JSON.stringify(observed).includes('FIXTURE_PRIVATE_TOKEN'));
 assert(!JSON.stringify(observed).includes('fixture.invalid'));
 const hookDetails=await inspect(restoreHooks);
 assert.equal(hookDetails.length,3);
 assert(hookDetails.every(row=>row.matched_total===3 && /^[a-f0-9]{64}$/.test(row.body_sha256)));
 assert(hookDetails.some(row=>row.kind==='event_trigger' && row.name==='fixture_ddl'
  && row.routine==='public.fixture_ddl()'));
 assert(hookDetails.some(row=>row.kind==='routine_candidate' && row.name==='pgcustom.fixture_integration'
  && row.routine==='pgcustom.fixture_integration(secret text)'));
 assert(!JSON.stringify(hookDetails).includes('FIXTURE_PRIVATE_TOKEN'));
 assert(!JSON.stringify(hookDetails).includes('FIXTURE_DEFAULT_TOKEN'));
 assert(!JSON.stringify(hookDetails).includes('fixture.invalid'));
 const priorFingerprint=hookDetails.find(row=>row.name==='public.fixture_hook').body_sha256;
 await inventoryDb.exec(`create or replace function public.fixture_hook() returns trigger
  language plpgsql as $$begin perform net.http_post(); return null; end $$;`);
 const changedHook=(await inspect(restoreHooks)).find(row=>row.name==='public.fixture_hook');
 assert.notEqual(changedHook.body_sha256,priorFingerprint);
 assert.equal(changedHook.routine,'public.fixture_hook()');
 await inventoryDb.exec('alter event trigger fixture_ddl disable');
 assert(!(await inspect(restoreHooks)).some(row=>row.name==='fixture_ddl'));
 await inventoryDb.exec('alter event trigger fixture_ddl enable');
 // Counts stay visible when a follow-up would otherwise silently omit hooks.
 for(let i=0;i<51;i++) await inventoryDb.exec(`create function pgcustom.fixture_${i}() returns void
  language plpgsql as $$begin perform net.http_post(); end $$;`);
 const boundedHooks=await inspect(restoreHooks);
 assert.equal(boundedHooks.length,50);
 assert(boundedHooks.every(row=>row.matched_total===54));
 assert.equal((await inventoryDb.query('select count(*)::int n from public.fixture_records')).rows[0].n,0);
 assert.equal((await inventoryDb.query('select secret from net.http_request_queue')).rows[0].secret,'FIXTURE_PRIVATE_TOKEN');
 // Line comparison never returns unknown code and never invokes provider hooks.
 // Reconstruct ALL lines from known text and verify the complete body hash;
 // trimmed/whitespace matches alone are insufficient (including inside literals).
 const hash=value=>createHash('sha256').update(value,'utf8').digest('hex');
 const body="\nbegin\n\t-- https://fixture.invalid/FIXTURE_PRIVATE_TOKEN \r\n"+
  "  perform net.http_post();\n  raise exception 'FIXTURE_LITERAL_ONE';\nend;\n";
 await inventoryDb.exec(`create schema if not exists extensions;
  create function extensions.grant_pg_net_access() returns event_trigger
   language plpgsql as $body$${body}$body$;
  create function extensions.grant_pg_net_access(secret text default 'FIXTURE_DEFAULT_TOKEN')
   returns void language plpgsql as $$begin raise exception 'Must not execute'; end $$;`);
 const lineRows=await inspect(restoreHookLines);
 assert.equal(lineRows.length,3);
 const compared=lineRows.find(row=>row.routine==='extensions.grant_pg_net_access()');
 assert.equal(compared.status,'COMPARE');
 assert.equal(compared.body_sha256,hash(body));
 assert.equal(compared.line_count,body.split('\n').length);
 const known=new Map(body.split('\n').map(line=>{
  const content=line.replace(/^[ \t\r]+|[ \t\r]+$/g,'');
  return [hash(content),content];
 }));
 const reconstructed=compared.line_fingerprints.map((line,index)=>{
  assert.equal(line.line,index+1);
  assert.match(line.prefix_ws,/^[ \t\r]*$/);
  assert.match(line.suffix_ws,/^[ \t\r]*$/);
  assert(known.has(line.trimmed_sha256));
  const value=line.prefix_ws+known.get(line.trimmed_sha256)+line.suffix_ws;
  assert.equal(hash(value),line.sha256);
  return value;
 }).join('\n');
 assert.equal(reconstructed,body);
 assert.equal(hash(reconstructed),compared.body_sha256);
 for(const secret of ['FIXTURE_PRIVATE_TOKEN','FIXTURE_DEFAULT_TOKEN','FIXTURE_LITERAL_ONE','fixture.invalid']){
  assert(!JSON.stringify(lineRows).includes(secret));
 }
 await inventoryDb.exec(`create or replace function extensions.grant_pg_net_access()
  returns event_trigger language plpgsql as $body$${body.replace('FIXTURE_LITERAL_ONE','FIXTURE_LITERAL_TWO')}$body$;`);
 const literalChanged=(await inspect(restoreHookLines)).find(row=>row.status==='COMPARE');
 assert.notEqual(literalChanged.body_sha256,compared.body_sha256);
 assert(literalChanged.line_fingerprints.some(line=>!known.has(line.trimmed_sha256)));
 for(const oversized of ["begin\n-- "+'x'.repeat(16384)+"\nend;",
                        "begin\n"+'-- bounded\n'.repeat(200)+"end;"]){
  await inventoryDb.exec(`create or replace function extensions.grant_pg_net_access()
   returns event_trigger language plpgsql as $body$${oversized}$body$;`);
  const rejected=(await inspect(restoreHookLines)).find(row=>row.routine==='extensions.grant_pg_net_access()');
  assert.equal(rejected.status,'TOO_LARGE');
  assert.equal(rejected.line_fingerprints,null);
 }
 console.log('Restore-source inventory/hooks: read-only execution, hostile optional relations, custom-schema detection, body fingerprints, visible truncation and secret omission passed.');
 console.log('Restore-hook line comparison: exact reconstruction, changed literals, missing/oversized routines and secret omission passed without invoking hooks.');
} finally {await inventoryDb.close();}

// Public invitation rendering must not echo executable input or invent a store listing.
const {default:invite}=await import('../../api/invite.js');
let html='';let headers={};
const response={setHeader:(k,v)=>headers[k]=v,status:()=>response,send:value=>html=value};
invite({query:{handle:'<script>alert(1)</script>'}},response);
assert(!html.includes('<script>'));assert(html.includes('preparing for launch'));assert.equal(headers['Referrer-Policy'],'no-referrer');
invite({query:{handle:'alice'}},response);assert(html.includes('@alice'));assert(html.includes('kavanah://people?handle=alice'));
console.log('Invitation escaping, privacy headers, and installed-app link checks passed.');
