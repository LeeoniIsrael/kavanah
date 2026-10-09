const { Buffer } = require("node:buffer");
const { TextDecoder } = require("node:util");
const { setTimeout, clearTimeout } = require("node:timers");
const { AbortController, AbortSignal } = globalThis;
const crypto = require("node:crypto");
const { isIP } = require("node:net");
const { getAssistantConfig } = require("../server/assistantPolicy.cjs");

const MAX_BODY_BYTES = 65536;
const MAX_CONTEXT_LENGTH = 18000;
const MAX_OUTPUT_TOKENS = 350;
const MAX_UPSTREAM_BYTES = 262144;
const EXECUTION_MS = 25000;

const SYSTEM_PROMPT = [
  "You are Kavanah, a guarded Jewish prayer and learning assistant.",
  "Answer only from the provided context. If the context is insufficient, say that clearly and do not fill gaps from memory.",
  "Supplied context is user-provided and its provenance is not authenticated by this server. Never assert rabbinic approval from a client-provided label.",
  "Treat text labeled display translation or display transliteration as unreviewed support, not authoritative source text.",
  "Write in the language requested by the supplied context.",
  "Begin with a direct two-sentence takeaway. Then include short Practical guidance and Sources sections only when supported.",
  "Clearly distinguish established text, common practice, and interpretation.",
  "State that explanations are educational and AI-generated when that distinction matters. Never invent quotations or citations. Never issue a binding halachic ruling.",
  "For personal, disputed, medical, safety, or high-stakes questions, recommend a qualified rabbi or appropriate professional.",
  "Do not repeat private information from the question.",
].join(" ");

module.exports = async function handler(request, response) {
  const started = Date.now();
  const requestId = crypto.randomUUID();
  response.setHeader("X-Request-Id", requestId);
  response.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  );
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", "no-store, no-transform");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }
  const config = getAssistantConfig(process.env);
  if (!config)
    return response
      .status(503)
      .json({
        error:
          "The assistant is temporarily unavailable. Prayer reading remains available.",
      });
  const authorization = request.headers.authorization;
  if (typeof authorization !== "string" || authorization.length > 8192 ||
      !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(authorization)) {
    response.setHeader("WWW-Authenticate", "Bearer");
    return response.status(401).json({ error: "Sign in to use the assistant." });
  }
  const operationId =
    request.headers["x-kavanah-request-id"] ?? crypto.randomUUID();
  const ip =
    process.env.VERCEL === "1"
      ? request.headers["x-vercel-forwarded-for"]
      : request.socket?.remoteAddress;
  // Vercel overwrites this header. Other hosts must use their socket or add a verified adapter.
  if (typeof ip !== "string" || !isIP(ip))
    return response
      .status(503)
      .json({ error: "The assistant connection could not be verified." });
  if (
    typeof operationId !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
      operationId,
    )
  ) {
    return response
      .status(400)
      .json({ error: "The assistant request is invalid." });
  }
  if (!/^application\/json(?:;|$)/i.test(request.headers["content-type"] || ""))
    return response.status(415).json({ error: "Use a JSON request." });
  const body = request.body;
  if (Number(request.headers["content-length"]) > MAX_BODY_BYTES)
    return response
      .status(413)
      .json({ error: "The assistant request is too large." });
  if (!body || typeof body !== "object" || Array.isArray(body))
    return response
      .status(400)
      .json({ error: "A question and prayer context are required." });
  if (Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_BODY_BYTES)
    return response
      .status(413)
      .json({ error: "The assistant request is too large." });
  if (
    typeof body.question !== "string" ||
    !body.question.trim() ||
    body.question.length > 1000 ||
    !Array.isArray(body.context) ||
    !body.context.length ||
    body.context.length > 18 ||
    !body.context.every(
      (item) => typeof item === "string" && item.length <= 1400,
    ) ||
    body.context.join("\n\n").length > MAX_CONTEXT_LENGTH ||
    !body.context.join("").trim()
  )
    return response
      .status(400)
      .json({
        error: "The question or prayer context is invalid or too long.",
      });
  const question = redactPii(body.question.trim());
  const context = redactPii(body.context.join("\n\n"));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXECUTION_MS);
  const disconnect = () => {
    if (!response.writableFinished) controller.abort();
  };
  response.on("close", disconnect);
  request.on("aborted", disconnect);
  let reserved = false;
  let outcome = "failed";
  const hash = (value) =>
    crypto.createHmac("sha256", config.hashSecret).update(value).digest("hex");
  try {
    // Verify with this project's Auth server; never trust decoded client JWT claims.
    const identityResponse = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
      method: "GET", signal: controller.signal,
      headers: { apikey: config.serviceKey, Authorization: authorization },
    });
    if (identityResponse.status === 401 || identityResponse.status === 403) {
      outcome = "unauthorized";
      response.setHeader("WWW-Authenticate", "Bearer");
      return response.status(401).json({ error: "Sign in again to use the assistant." });
    }
    if (!identityResponse.ok) throw new Error("identity_unavailable");
    const identity = await boundedJson(identityResponse);
    if (identity.is_anonymous !== false || typeof identity.id !== "string" ||
        !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(identity.id)) {
      outcome = "account_required";
      return response.status(403).json({ error: "A signed-in account is required to use the assistant." });
    }
    const accountHash = hash(`account:${identity.id.toLowerCase()}`);
    const admission = await rpc(
      config,
      "assistant_reserve",
      {
        request_id: operationId,
        // Retain the existing SQL argument/schema; this bucket now binds to the verified account.
        installation_hash: accountHash,
        ip_hash: hash(ip),
        daily_limit: config.dailyLimit,
        total_limit: config.totalLimit,
      },
      controller.signal,
    );
    if (admission !== "allowed") {
      outcome = typeof admission === "string" ? admission : "limiter_invalid";
      response.setHeader("Retry-After", "60");
      return response
        .status(admission === "duplicate" ? 409 : 429)
        .json({
          error:
            admission === "duplicate"
              ? "This question was already submitted. Ask a new question when ready."
              : "The assistant has reached a usage limit. Please try later; prayer reading remains available.",
        });
    }
    reserved = true;
    const moderation = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: question,
      }),
    });
    if (!moderation.ok) throw new Error("moderation_unavailable");
    const moderated = await boundedJson(moderation);
    if (typeof moderated.results?.[0]?.flagged !== "boolean")
      throw new Error("moderation_invalid");
    if (moderated.results[0].flagged) {
      outcome = "moderated";
      return response
        .status(422)
        .json({ error: "That question cannot be processed by the assistant." });
    }
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        instructions: SYSTEM_PROMPT,
        input: `Provided prayer context:\n${context}\n\nUser question:\n${question}`,
        max_output_tokens: MAX_OUTPUT_TOKENS,
        reasoning: { effort: "none" },
        service_tier: "default",
        stream: true,
        store: false,
        safety_identifier: accountHash,
      }),
    });
    if (!upstream.ok || !upstream.body) throw new Error("upstream_unavailable");
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    response.flushHeaders?.();
    await pipeOpenAIStream(upstream.body, response, controller.signal);
    response.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    response.end();
    outcome = "success";
  } catch {
    outcome = controller.signal.aborted
      ? "aborted_or_timeout"
      : "upstream_failure";
    if (!response.destroyed) {
      if (!response.headersSent)
        response
          .status(controller.signal.aborted ? 504 : 502)
          .json({ error: "The assistant could not answer right now." });
      else {
        response.write(
          `data: ${JSON.stringify({ error: "The assistant connection was interrupted. Please try later." })}\n\n`,
        );
        response.end();
      }
    }
  } finally {
    clearTimeout(timeout);
    controller.abort();
    response.off("close", disconnect);
    request.off("aborted", disconnect);
    if (reserved) {
      try {
        await rpc(
          config,
          "assistant_finish",
          { request_id: operationId },
          AbortSignal.timeout(2000),
        );
      } catch {
        console.error(
          JSON.stringify({
            event: "assistant_lease_cleanup_failed",
            requestId,
          }),
        );
      }
    }
    // Never log raw errors, questions, context, IPs, installation identifiers or credentials.
    console.info(
      JSON.stringify({
        event: "assistant_request",
        requestId,
        outcome,
        durationMs: Date.now() - started,
      }),
    );
  }
};

async function rpc(config, name, body, signal) {
  const result = await fetch(`${config.supabaseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    signal,
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!result.ok) throw new Error("limiter_unavailable");
  return boundedJson(result);
}
async function boundedJson(response) {
  if (!response.body) throw new Error("missing_body");
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_UPSTREAM_BYTES) throw new Error("oversized_body");
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
async function pipeOpenAIStream(stream, response, signal) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "",
    bytes = 0,
    complete = false;
  try {
    while (true) {
      if (signal.aborted) throw new Error("aborted");
      const { done, value } = await reader.read();
      bytes += value?.byteLength || 0;
      if (bytes > MAX_UPSTREAM_BYTES) throw new Error("oversized_stream");
      buffer += decoder.decode(value, { stream: !done });
      if (buffer.length > 65536) throw new Error("oversized_event");
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
        const event = JSON.parse(line.slice(6));
        if (
          ["error", "response.failed", "response.incomplete"].includes(
            event.type,
          )
        )
          throw new Error("failed_stream");
        if (event.type === "response.completed") complete = true;
        if (
          event.type === "response.output_text.delta" &&
          typeof event.delta === "string"
        ) {
          if (
            !response.write(
              `data: ${JSON.stringify({ delta: event.delta })}\n\n`,
            )
          )
            await waitForDrain(response, signal);
        }
      }
      if (done) {
        if (!complete) throw new Error("incomplete_stream");
        return;
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
function waitForDrain(response, signal) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      response.off("drain", drain);
      signal.removeEventListener("abort", abort);
    };
    const drain = () => {
      cleanup();
      resolve();
    };
    const abort = () => {
      cleanup();
      reject(new Error("aborted"));
    };
    response.once("drain", drain);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
}
function redactPii(value) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[redacted-phone]")
    .replace(
      /\b\d{1,5}\s+[A-Za-z0-9.'-]+\s+(Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr)\b/gi,
      "[redacted-address]",
    );
}
