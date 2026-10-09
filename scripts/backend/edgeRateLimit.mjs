import { pathToFileURL } from "node:url";

// Owner-operated probe of this application's cheap health route only.
// No credentials, redirects, provider calls, retries, or configurable target.
const HEALTH_URL = "https://kavanah-rho.vercel.app/api/health";
const BURST_REQUESTS = 210; // Covers two adjacent 100-request fixed windows.
const CONCURRENCY = 4;
const MAX_DURATION_MS = 20_000;

export async function probeEdgeRateLimit({
  fetchImpl = globalThis.fetch,
  timeoutMs = MAX_DURATION_MS,
} = {}) {
  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > MAX_DURATION_MS
  ) {
    throw new Error("Probe timeout must be between 1 and 20000 milliseconds.");
  }
  const started = Date.now();
  const deadline = AbortSignal.timeout(timeoutMs);
  const counts = {};
  let requests = 0;
  let next = 0;
  let limited = false;
  let failed = false;
  const target = `${HEALTH_URL}?edge_probe=${started}`;
  const result = (outcome, reason) => ({
    outcome,
    reason,
    requests,
    counts,
    elapsed_ms: Date.now() - started,
  });
  const request = async () => {
    requests++;
    try {
      const response = await fetchImpl(target, {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
        redirect: "error",
        signal: AbortSignal.any([deadline, AbortSignal.timeout(4_000)]),
      });
      counts[response.status] = (counts[response.status] ?? 0) + 1;
      if (response.status === 429) limited = true;
      return response;
    } catch {
      failed = true;
      counts.network_errors = (counts.network_errors ?? 0) + 1;
      return null;
    }
  };

  const baseline = await request();
  if (!baseline || baseline.status !== 200) {
    await baseline?.body?.cancel().catch(() => {});
    return result(
      "inconclusive",
      "A fresh successful health baseline is required.",
    );
  }
  let health;
  try {
    health = await baseline.json();
  } catch {
    return result("inconclusive", "Health did not return valid JSON.");
  }
  if (health?.status !== "ok" || health?.assistant !== "disabled") {
    return result(
      "inconclusive",
      "Expected healthy production with paid AI disabled.",
    );
  }

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (
        next < BURST_REQUESTS &&
        !deadline.aborted &&
        !limited &&
        !failed
      ) {
        next++;
        const response = await request();
        await response?.body?.cancel().catch(() => {});
      }
    }),
  );
  if (limited) {
    return result(
      "429_observed",
      "Check the matched firewall rule and function logs; then verify recovery after 60 seconds.",
    );
  }
  return result(
    "inconclusive",
    failed || deadline.aborted
      ? "Network failure or deadline; no automatic retry was made."
      : "No 429 within the bounded probe; inspect the saved rule and its scope.",
  );
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  try {
    const result = await probeEdgeRateLimit();
    console.log(JSON.stringify(result, null, 2));
    if (result.outcome !== "429_observed") process.exitCode = 2;
  } catch {
    console.error(
      "Probe unavailable. Use the repository's supported Node.js 24 LTS; no automatic retry will run.",
    );
    process.exitCode = 1;
  }
}
