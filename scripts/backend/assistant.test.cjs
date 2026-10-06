const { Response } = globalThis;
const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { randomUUID } = require("node:crypto");
const handler = require("../../api/assistant.js");
const { getAssistantConfig } = require("../../server/assistantPolicy.cjs");
const env = {
  ASSISTANT_ENABLED: "true",
  OPENAI_API_KEY: "test-only",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-only",
  ASSISTANT_RATE_LIMIT_SECRET: "a".repeat(32),
  ASSISTANT_DAILY_REQUEST_LIMIT: "100",
  ASSISTANT_TOTAL_REQUEST_LIMIT: "1000",
};
const originalEnv = { ...process.env };
let calls, logs, originalFetch, originalInfo, originalError;
beforeEach(() => {
  Object.assign(process.env, env);
  delete process.env.VERCEL;
  calls = [];
  logs = [];
  originalFetch = global.fetch;
  originalInfo = console.info;
  originalError = console.error;
  console.info = console.error = (message) => logs.push(message);
  global.fetch = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith("assistant_reserve")) return Response.json("allowed");
    if (url.endsWith("assistant_finish")) return Response.json(null);
    if (url.endsWith("moderations"))
      return Response.json({ results: [{ flagged: false }] });
    return new Response(
      'data: {"type":"response.output_text.delta","delta":"Answer"}\n\ndata: {"type":"response.completed"}\n\n',
    );
  };
});
afterEach(() => {
  global.fetch = originalFetch;
  console.info = originalInfo;
  console.error = originalError;
  for (const key of Object.keys(process.env))
    if (!(key in originalEnv)) delete process.env[key];
  Object.assign(process.env, originalEnv);
});
function request(
  body = { question: "Explain this prayer", context: ["Prayer context"] },
) {
  return Object.assign(new EventEmitter(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-kavanah-install-id": "a".repeat(64),
      "x-kavanah-request-id": randomUUID(),
    },
    body,
    socket: { remoteAddress: "127.0.0.1" },
  });
}
function response() {
  return Object.assign(new EventEmitter(), {
    headers: {},
    statusCode: 0,
    headersSent: false,
    writableFinished: false,
    destroyed: false,
    output: "",
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(n) {
      this.statusCode = n;
      return this;
    },
    json(value) {
      this.payload = value;
      this.headersSent = true;
      this.writableFinished = true;
      return this;
    },
    flushHeaders() {
      this.headersSent = true;
    },
    write(value) {
      this.output += value;
      return true;
    },
    end() {
      this.writableFinished = true;
      this.emit("close");
    },
  });
}
test("unconfigured or disabled service performs no paid work", async () => {
  delete process.env.ASSISTANT_TOTAL_REQUEST_LIMIT;
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 503);
  assert.equal(calls.length, 0);
  assert.equal(
    getAssistantConfig({ ...env, OPENAI_MODEL: "expensive-unreviewed-model" }),
    null,
  );
});
test("rejects invalid and oversized inputs before database or provider calls", async () => {
  for (const [body, status] of [
    [{ question: "x".repeat(1001), context: ["x"] }, 400],
    [{ question: "x", context: [{}] }, 400],
    [{ question: "x", context: ["x".repeat(1401)] }, 400],
    [{ question: "x", context: ["x"], extra: "x".repeat(65536) }, 413],
  ]) {
    const res = response();
    await handler(request(body), res);
    assert.equal(res.statusCode, status);
  }
  assert.equal(calls.length, 0);
});
test("client proxy headers are not trusted outside the verified Vercel adapter", async () => {
  const req = request();
  req.socket.remoteAddress = "unknown";
  req.headers["x-forwarded-for"] = "127.0.0.1";
  const res = response();
  await handler(req, res);
  assert.equal(res.statusCode, 503);
  assert.equal(calls.length, 0);
});
test("limiter failures fail closed before moderation or generation", async () => {
  global.fetch = async () => {
    throw Error("secret provider error");
  };
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 502);
  assert(!JSON.stringify(res.payload).includes("secret"));
  assert(!logs.join("").includes("secret"));
});
test("rejected durable allowance performs no paid work", async () => {
  global.fetch = async (url) => {
    calls.push(url);
    return Response.json("budget");
  };
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 429);
  assert.equal(calls.length, 1);
});
test("reserves before provider calls, redacts server-side, limits output, completes and releases", async () => {
  const res = response();
  await handler(
    request({
      question: "Explain for user@example.com",
      context: ["Prayer context"],
    }),
    res,
  );
  assert.equal(res.statusCode, 200);
  assert(res.output.includes('"done":true'));
  assert(calls[0].url.endsWith("assistant_reserve"));
  assert(calls.at(-1).url.endsWith("assistant_finish"));
  const payload = JSON.parse(
    calls.find((c) => c.url.endsWith("responses")).init.body,
  );
  assert.equal(payload.max_output_tokens, 350);
  assert.equal(payload.store, false);
  assert(!payload.input.includes("user@example.com"));
  assert(!logs.join("").includes("user@example.com"));
  assert(!logs.join("").includes("127.0.0.1"));
  assert.equal(res.headers["Cache-Control"], "no-store, no-transform");
});
test("malformed moderation fails closed and releases the lease", async () => {
  const fetch = global.fetch;
  global.fetch = async (url, init) =>
    url.endsWith("moderations")
      ? Response.json({ results: [] })
      : fetch(url, init);
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 502);
  assert(!calls.some((c) => c.url.endsWith("responses")));
  assert(calls.at(-1).url.endsWith("assistant_finish"));
});
test("an incomplete upstream stream is an error, never a successful answer", async () => {
  const fetch = global.fetch;
  global.fetch = async (url, init) =>
    url.endsWith("responses")
      ? new Response('data: {"type":"response.failed"}\n\n')
      : fetch(url, init);
  const res = response();
  await handler(request(), res);
  assert(res.output.includes('"error"'));
  assert(!res.output.includes('"done":true'));
});
test("disconnect cancels upstream work, with no retry or refund", async () => {
  const req = request(),
    res = response();
  const fetch = global.fetch;
  let cancelled = false;
  global.fetch = async (url, init) => {
    if (!url.endsWith("moderations")) return fetch(url, init);
    return new Promise((resolve, reject) => {
      init.signal.addEventListener(
        "abort",
        () => {
          cancelled = true;
          reject(Error("abort"));
        },
        { once: true },
      );
      res.destroyed = true;
      res.emit("close");
    });
  };
  await handler(req, res);
  assert(cancelled);
  assert(!calls.some((c) => c.url.endsWith("responses")));
  assert(calls.at(-1).url.endsWith("assistant_finish"));
});
test("execution deadline cancels a stalled provider request", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const fetch = global.fetch;
  let stalled = false,
    cancelled = false;
  global.fetch = async (url, init) => {
    if (!url.endsWith("moderations")) return fetch(url, init);
    stalled = true;
    return new Promise((resolve, reject) =>
      init.signal.addEventListener(
        "abort",
        () => {
          cancelled = true;
          reject(Error("abort"));
        },
        { once: true },
      ),
    );
  };
  const res = response(),
    pending = handler(request(), res);
  for (let i = 0; i < 20 && !stalled; i++)
    await new Promise((resolve) => setImmediate(resolve));
  assert(stalled);
  t.mock.timers.tick(25001);
  await pending;
  assert(cancelled);
  assert.equal(res.statusCode, 504);
});
