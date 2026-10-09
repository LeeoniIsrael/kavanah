import assert from "node:assert/strict";
import test from "node:test";
import { probeEdgeRateLimit } from "./edgeRateLimit.mjs";

const healthy = () => Response.json({ status: "ok", assistant: "disabled" });

test("probe uses only credential-free health GETs and stops on a 429", async () => {
  let calls = 0;
  const result = await probeEdgeRateLimit({
    fetchImpl: async (url, options) => {
      assert.match(
        url,
        /^https:\/\/kavanah-rho\.vercel\.app\/api\/health\?edge_probe=\d+$/,
      );
      assert.equal(options.method, "GET");
      assert.equal(options.credentials, "omit");
      assert.equal(options.redirect, "error");
      assert.equal(options.cache, "no-store");
      assert.equal(options.headers, undefined);
      assert.equal(options.body, undefined);
      assert.ok(options.signal instanceof AbortSignal);
      calls++;
      return calls > 100 ? new Response(null, { status: 429 }) : healthy();
    },
  });
  assert.equal(result.outcome, "429_observed");
  assert.ok(result.counts[429] >= 1);
  assert.ok(
    calls <= 104,
    "Only four requests can already be in flight at the first denial",
  );
});

test("probe has a hard request budget when the edge never limits", async () => {
  let calls = 0;
  const result = await probeEdgeRateLimit({
    fetchImpl: async () => {
      calls++;
      return healthy();
    },
  });
  assert.equal(result.outcome, "inconclusive");
  assert.equal(calls, 211);
  assert.equal(result.requests, 211);
});

test("invalid or enabled health baseline prevents a burst", async () => {
  for (const baseline of [
    new Response(null, { status: 503 }),
    new Response(null, { status: 429 }),
    new Response("not JSON"),
    Response.json({ status: "ok", assistant: "configured" }),
  ]) {
    let calls = 0;
    const result = await probeEdgeRateLimit({
      fetchImpl: async () => {
        calls++;
        return baseline;
      },
    });
    assert.equal(result.outcome, "inconclusive");
    assert.equal(calls, 1);
  }
});

test("a network failure is not retried and does not expose its sensitive message", async () => {
  let calls = 0;
  const result = await probeEdgeRateLimit({
    fetchImpl: async () => {
      calls++;
      throw new Error("secret-test-token");
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.outcome, "inconclusive");
  assert.equal(result.counts.network_errors, 1);
  assert.ok(!JSON.stringify(result).includes("secret-test-token"));
});

test("overall deadline cancels in-flight work and stops further requests", async () => {
  let calls = 0;
  let active = 0;
  let peak = 0;
  const result = await probeEdgeRateLimit({
    timeoutMs: 20,
    fetchImpl: async (_url, { signal }) => {
      calls++;
      if (calls === 1) return healthy();
      active++;
      peak = Math.max(peak, active);
      try {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, 500);
          const abort = () => {
            clearTimeout(timer);
            reject(new Error("aborted"));
          };
          if (signal.aborted) abort();
          else signal.addEventListener("abort", abort, { once: true });
        });
        return healthy();
      } finally {
        active--;
      }
    },
  });
  assert.equal(result.outcome, "inconclusive");
  assert.ok(calls <= 5);
  assert.ok(peak <= 4);
  assert.equal(active, 0);
  assert.ok(result.elapsed_ms < 500);
});

test("invalid duration is rejected before network work", async () => {
  for (const timeoutMs of [0, -1, 20_001, Infinity, 1.5]) {
    await assert.rejects(
      probeEdgeRateLimit({
        timeoutMs,
        fetchImpl: () => {
          assert.fail("No request is allowed for an invalid timeout");
        },
      }),
      /Probe timeout/,
    );
  }
});
