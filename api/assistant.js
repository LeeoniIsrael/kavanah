const crypto = require("node:crypto");
const { TextDecoder } = require("node:util");

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODERATIONS_URL = "https://api.openai.com/v1/moderations";
const MAX_QUESTION_LENGTH = 1000;
const MAX_CONTEXT_LENGTH = 18000;
const DAILY_REQUEST_LIMIT = 20;
const usage = new Map();

const SYSTEM_PROMPT = [
  "You are Kavanah, a guarded Jewish prayer and learning assistant.",
  "Answer only from the verified context supplied in the request. If the context is insufficient, say that clearly and do not fill gaps from memory.",
  "Write in the language requested by the supplied context.",
  "Begin with a direct two-sentence takeaway. Then include short Practical guidance and Sources sections only when supported.",
  "Clearly distinguish established text, common practice, and interpretation.",
  "Never invent quotations or citations. Never issue a binding halachic ruling.",
  "For personal, disputed, medical, safety, or high-stakes questions, recommend a qualified rabbi or appropriate professional.",
  "Do not repeat private information from the question."
].join(" ");

module.exports = async function handler(request, response) {
  setSecurityHeaders(response);
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return response.status(503).json({ error: "The assistant is not configured." });
  }

  const installationId = normalizeHeader(request.headers["x-kavanah-install-id"]);
  if (!/^[a-f0-9]{64}$/i.test(installationId)) {
    return response.status(400).json({ error: "This installation could not be verified." });
  }
  if (!consumeAllowance(installationId)) {
    return response.status(429).json({ error: "Today's assistant limit has been reached. Try again tomorrow." });
  }

  const body = isObject(request.body) ? request.body : {};
  const question = typeof body.question === "string" ? body.question.trim().slice(0, MAX_QUESTION_LENGTH) : "";
  const context = Array.isArray(body.context)
    ? body.context.filter((item) => typeof item === "string").join("\n\n").slice(0, MAX_CONTEXT_LENGTH)
    : "";

  if (!question || !context) {
    return response.status(400).json({ error: "A question and verified prayer context are required." });
  }

  try {
    const flagged = await isFlagged(question);
    if (flagged) {
      return response.status(422).json({ error: "That question cannot be processed by the assistant." });
    }

    const upstream = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        instructions: SYSTEM_PROMPT,
        input: `Verified prayer context:\n${context}\n\nUser question:\n${question}`,
        max_output_tokens: 500,
        reasoning: { effort: "none" },
        stream: true,
        store: false,
        safety_identifier: crypto.createHash("sha256").update(installationId).digest("hex")
      })
    });

    if (!upstream.ok || !upstream.body) {
      const requestId = upstream.headers.get("x-request-id");
      console.error("OpenAI response failed", upstream.status, requestId);
      return response.status(502).json({ error: "The assistant could not answer right now." });
    }

    response.statusCode = 200;
    response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");
    response.flushHeaders?.();

    await pipeOpenAIStream(upstream.body, response);
    response.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    response.end();
  } catch (error) {
    console.error("Assistant gateway error", error instanceof Error ? error.message : error);
    if (!response.headersSent) {
      return response.status(500).json({ error: "The assistant could not answer right now." });
    }
    response.write(`data: ${JSON.stringify({ error: "The assistant connection was interrupted." })}\n\n`);
    response.end();
  }
};

async function isFlagged(input) {
  const result = await fetch(OPENAI_MODERATIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model: "omni-moderation-latest", input })
  });
  if (!result.ok) {
    throw new Error(`Moderation failed with status ${result.status}`);
  }
  const payload = await result.json();
  return payload.results?.[0]?.flagged === true;
}

async function pipeOpenAIStream(stream, response) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ") || line === "data: [DONE]") {
        continue;
      }
      try {
        const event = JSON.parse(line.slice(6));
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          response.write(`data: ${JSON.stringify({ delta: event.delta })}\n\n`);
        }
      } catch {
        // Ignore incomplete or non-JSON upstream event lines.
      }
    }
    if (done) {
      return;
    }
  }
}

function consumeAllowance(installationId) {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${day}:${installationId}`;
  const count = usage.get(key) || 0;
  if (count >= DAILY_REQUEST_LIMIT) {
    return false;
  }
  usage.set(key, count + 1);
  if (usage.size > 5000) {
    for (const storedKey of usage.keys()) {
      if (!storedKey.startsWith(day)) usage.delete(storedKey);
    }
  }
  return true;
}

function normalizeHeader(value) {
  return Array.isArray(value) ? value[0] || "" : typeof value === "string" ? value : "";
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function setSecurityHeaders(response) {
  response.setHeader("Content-Security-Policy", "default-src 'none'");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
}
