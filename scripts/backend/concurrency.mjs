// Isolated real PostgreSQL sessions. Never run this harness on a hosted database.
import { Client } from "pg";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { URL } from "node:url";
const url = new URL(
  process.env.PG_TEST_URL || "postgresql://agent@127.0.0.1:55432/postgres",
);
if (!["127.0.0.1", "localhost"].includes(url.hostname))
  throw Error("Concurrency tests require an isolated localhost database");
const admin = new Client({
  connectionString: url.toString(),
  connectionTimeoutMillis: 5000,
  query_timeout: 15000,
  statement_timeout: 10000,
});
await admin.connect();
const name = `kavanah_audit_${randomUUID().replaceAll("-", "")}`;
const clients = [];
let db;
try {
  await admin.query(`create database ${name}`);
  url.pathname = `/${name}`;
  db = new Client({
    connectionString: url.toString(),
    connectionTimeoutMillis: 5000,
    query_timeout: 15000,
    statement_timeout: 10000,
  });
  await db.connect();
  await db.query(`do $roles$ begin
    if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
    if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
    if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
  end $roles$;`);
  await db.query(
    `create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`,
  );
  for (const file of [
    "202609250001_circle.sql",
    "202609250002_catalog.sql",
    "202609270001_circle_table_grants.sql",
    "202610060001_production_safeguards.sql",
  ])
    await db.query(readFileSync(`supabase/migrations/${file}`, "utf8"));
  for (let i = 0; i < 12; i++) {
    const c = new Client({
      connectionString: url.toString(),
      connectionTimeoutMillis: 5000,
      query_timeout: 15000,
      statement_timeout: 10000,
    });
    await c.connect();
    clients.push(c);
  }
  const reserve = async (c, id, subject, daily, total) => {
    await c.query("reset role; set role service_role");
    return (
      await c.query("select assistant_reserve($1,$2,$2,$3,$4) result", [
        id,
        subject.toString(16).padStart(64, "0"),
        daily,
        total,
      ])
    ).rows[0].result;
  };
  const results = await Promise.all(
    clients.map((c, i) => reserve(c, randomUUID(), i, 3, 5)),
  );
  assert.equal(results.filter((x) => x === "allowed").length, 3);
  assert.equal(
    (await db.query("select total::int from private.assistant_budget")).rows[0]
      .total,
    3,
  );
  await db.query(
    "truncate private.assistant_requests,private.assistant_buckets; update private.assistant_budget set total=0,daily=0,minute_hits=0",
  );
  const operation = randomUUID();
  const duplicates = await Promise.all(
    clients.map((c) => reserve(c, operation, 1, 100, 100)),
  );
  assert.equal(duplicates.filter((x) => x === "allowed").length, 1);
  assert.equal(duplicates.filter((x) => x === "duplicate").length, 11);
  await db.query(
    "truncate private.assistant_requests,private.assistant_buckets; update private.assistant_budget set total=0,daily=0,minute_hits=0",
  );
  const lifetime = await Promise.all(
    clients.map((c, i) => reserve(c, randomUUID(), i, 100, 2)),
  );
  assert.equal(lifetime.filter((x) => x === "allowed").length, 2);
  await db.query("update private.assistant_budget set day=current_date-1");
  assert.equal(await reserve(clients[0], randomUUID(), 99, 100, 2), "budget");
  const a = randomUUID(),
    b = randomUUID(),
    c = randomUUID();
  await db.query("insert into auth.users select unnest($1::uuid[])", [
    [a, b, c],
  ]);
  const as = async (client, id) => {
    await client.query("reset role");
    await client.query("select set_config('request.jwt.claim.sub',$1,false)", [
      id,
    ]);
    await client.query("set role authenticated");
  };
  for (const [client, id, handle] of [
    [clients[0], a, "alice"],
    [clients[1], b, "bobby"],
    [clients[2], c, "carol"],
  ]) {
    await as(client, id);
    await client.query("select circle_join($1,$1,'UTC',false)", [handle]);
  }
  const waitForLock = async (client) => {
    const pid = (await client.query("select pg_backend_pid() pid")).rows[0].pid;
    return pid;
  };
  const pid = await waitForLock(clients[1]);
  await as(clients[0], a);
  await clients[0].query("begin");
  await clients[0].query("select circle_request('bobby')");
  await as(clients[1], b);
  await clients[1].query("begin");
  const blocked = clients[1].query("select circle_connection($1,'block')", [a]);
  let lock = false;
  for (let i = 0; i < 50; i++) {
    lock = (
      await db.query(
        "select wait_event_type='Lock' waiting from pg_stat_activity where pid=$1",
        [pid],
      )
    ).rows[0]?.waiting;
    if (lock) break;
    await delay(20);
  }
  assert(lock, "blocking must wait on the same profile lock as requesting");
  await clients[0].query("commit");
  await blocked;
  await clients[1].query("commit");
  assert.equal(
    (await db.query("select count(*)::int n from circle_connections")).rows[0]
      .n,
    0,
  );
  await assert.rejects(clients[0].query("select circle_request('bobby')"));
  // Reverse ordering: a waiting request must recheck the block after acquiring locks.
  await db.query("truncate private.blocks");
  await clients[1].query("begin");
  await clients[1].query("select circle_connection($1,'block')", [a]);
  const waitingRequest = clients[0]
    .query("select circle_request('bobby')")
    .then(
      () => false,
      () => true,
    );
  await delay(30);
  await clients[1].query("commit");
  assert(await waitingRequest);
  // Simultaneous duplicate completions create exactly one session and shared update.
  await clients[0].query("select circle_preferences('every',false)");
  await Promise.all(
    clients.map(async (client) => {
      await as(client, a);
      await client.query(
        "select circle_record('same-event','modeh-ani',null,now())",
      );
    }),
  );
  assert.equal(
    (
      await db.query(
        "select count(*)::int n from private.sessions where event_id='same-event'",
      )
    ).rows[0].n,
    1,
  );
  assert.equal(
    (
      await db.query(
        "select count(*)::int n from circle_activity where event_key='prayer:same-event'",
      )
    ).rows[0].n,
    1,
  );
  // Two arrivals at a 199-person circle must admit exactly one, never exceed 200.
  await db.query("truncate circle_connections,private.blocks");
  const seed = Array.from({ length: 199 }, (_, i) => ({
    id: randomUUID(),
    handle: `test_${i}`,
  }));
  await db.query(
    "insert into auth.users select id from jsonb_to_recordset($1) as x(id uuid,handle text)",
    [JSON.stringify(seed)],
  );
  await db.query(
    "insert into circle_profiles(id,handle,display_name) select id,handle,handle from jsonb_to_recordset($1) as x(id uuid,handle text)",
    [JSON.stringify(seed)],
  );
  await db.query(
    "insert into circle_connections(requester,recipient) select $1,id from jsonb_to_recordset($2) as x(id uuid,handle text)",
    [a, JSON.stringify(seed)],
  );
  await as(clients[1], b);
  await as(clients[2], c);
  const capacity = await Promise.allSettled([
    clients[1].query("select circle_request('alice')"),
    clients[2].query("select circle_request('alice')"),
  ]);
  assert.equal(capacity.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    (
      await db.query(
        "select count(*)::int n from circle_connections where requester=$1 or recipient=$1",
        [a],
      )
    ).rows[0].n,
    200,
  );
  console.log(
    "Real PostgreSQL concurrent caps, deduplication, block/request races, duplicate completions and circle capacity passed.",
  );
} finally {
  await Promise.all(clients.map((c) => c.end()));
  await db?.end();
  await admin.query(`drop database if exists ${name}`);
  await admin.end();
}
