const { URL } = require("node:url");
// This policy is server-only. Invalid/missing configuration stops all paid work.
function getAssistantConfig(env) {
  const dailyLimit = Number(env.ASSISTANT_DAILY_REQUEST_LIMIT);
  const totalLimit = Number(env.ASSISTANT_TOTAL_REQUEST_LIMIT);
  if (
    env.ASSISTANT_ENABLED !== "true" ||
    !env.OPENAI_API_KEY ||
    !env.SUPABASE_SERVICE_ROLE_KEY ||
    !env.ASSISTANT_RATE_LIMIT_SECRET ||
    env.ASSISTANT_RATE_LIMIT_SECRET.length < 32 ||
    !Number.isInteger(dailyLimit) ||
    dailyLimit < 1 ||
    dailyLimit > 10000 ||
    !Number.isInteger(totalLimit) ||
    totalLimit < 1 ||
    totalLimit > 100000 ||
    !["gpt-5.6-luna"].includes(env.OPENAI_MODEL || "gpt-5.6-luna")
  )
    return null;
  try {
    const url = new URL(env.SUPABASE_URL);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    return {
      dailyLimit,
      totalLimit,
      supabaseUrl: url.origin,
      model: env.OPENAI_MODEL || "gpt-5.6-luna",
      apiKey: env.OPENAI_API_KEY,
      serviceKey: env.SUPABASE_SERVICE_ROLE_KEY,
      hashSecret: env.ASSISTANT_RATE_LIMIT_SECRET,
    };
  } catch {
    return null;
  }
}
module.exports = { getAssistantConfig };
