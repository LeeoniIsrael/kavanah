import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
for(const file of ['202609250001_circle.sql','202609250002_catalog.sql'])await db.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002',c='00000000-0000-4000-8000-000000000003';
await db.exec(`insert into auth.users values('${a}'),('${b}'),('${c}');`);
async function as(id){await db.exec(`reset role; select set_config('request.jwt.claim.sub','${id}',false); set role authenticated;`);}
const q=(sql,args=[])=>db.query(sql,args);
let checks=0;
async function denied(sql,args=[]){await assert.rejects(q(sql,args));checks++;}
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
await db.close();console.log(`${checks} database/security checks passed against PostgreSQL (PGlite).`);

// Public invitation rendering must not echo executable input or invent a store listing.
const {default:invite}=await import('../../api/invite.js');
let html='';let headers={};
const response={setHeader:(k,v)=>headers[k]=v,status:()=>response,send:value=>html=value};
invite({query:{handle:'<script>alert(1)</script>'}},response);
assert(!html.includes('<script>'));assert(html.includes('preparing for launch'));assert.equal(headers['Referrer-Policy'],'no-referrer');
invite({query:{handle:'alice'}},response);assert(html.includes('@alice'));assert(html.includes('kavanah://people?handle=alice'));
console.log('Invitation escaping, privacy headers, and installed-app link checks passed.');
