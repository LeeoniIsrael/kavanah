const { getAssistantConfig } = require("../server/assistantPolicy.cjs");
// A cheap liveness/configuration probe; intentionally makes no provider requests.
module.exports = function health(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (!["GET", "HEAD"].includes(request.method)) {
    response.setHeader("Allow", "GET, HEAD");
    return response.status(405).json({ error: "Method not allowed." });
  }
  const enabled = process.env.ASSISTANT_ENABLED === "true";
  const configured = Boolean(getAssistantConfig(process.env));
  response.status(enabled && !configured ? 503 : 200);
  if (request.method === "HEAD") return response.end();
  return response.json({
    status: enabled && !configured ? "degraded" : "ok",
    assistant: enabled
      ? configured
        ? "configured"
        : "unavailable"
      : "disabled",
  });
};
