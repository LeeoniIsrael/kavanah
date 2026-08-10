import Constants from "expo-constants";
import { fetch as expoFetch } from "expo/fetch";

import { getOrCreateInstallationId, redactPii } from "@/services/security";

export const HALACHIC_ASSISTANT_SYSTEM_PROMPT = [
  "Kavanah answers from the prayer text and verified source references supplied with each question.",
  "It explains context in plain language, separates established practice from interpretation, and does not issue binding halachic rulings.",
  "Personal details are removed before a question is sent."
].join(" ");

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type AssistantStreamEvent = {
  delta?: unknown;
  error?: unknown;
  done?: unknown;
};

const MAX_CONTEXT_ITEMS = 18;
const MAX_CONTEXT_ITEM_LENGTH = 1400;

export async function* createAssistantStream(userInput: string, verifiedContext: string[]): AsyncGenerator<string> {
  const endpoint = getAssistantEndpoint();
  if (!endpoint) {
    yield "The assistant is not connected in this build yet. The prayer and its verified source remain available above.";
    return;
  }

  const installationId = await getOrCreateInstallationId();
  const response = await expoFetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
      "X-Kavanah-Install-Id": installationId
    },
    body: JSON.stringify({
      question: redactPii(userInput.trim()).slice(0, 1000),
      context: verifiedContext
        .slice(0, MAX_CONTEXT_ITEMS)
        .map((item) => redactPii(item).slice(0, MAX_CONTEXT_ITEM_LENGTH))
    })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
    throw new Error(typeof payload?.error === "string" ? payload.error : "The assistant could not answer right now.");
  }

  if (!response.body) {
    throw new Error("The assistant response was empty.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const data = event
        .split("\n")
        .find((line) => line.startsWith("data: "))
        ?.slice(6);
      if (!data) {
        continue;
      }
      const parsed = JSON.parse(data) as AssistantStreamEvent;
      if (typeof parsed.error === "string") {
        throw new Error(parsed.error);
      }
      if (typeof parsed.delta === "string") {
        yield parsed.delta;
      }
    }

    if (done) {
      break;
    }
  }
}

function getAssistantEndpoint(): string | null {
  const configured = process.env.EXPO_PUBLIC_ASSISTANT_API_URL ?? Constants.expoConfig?.extra?.assistantApiUrl;
  if (typeof configured !== "string" || !configured.trim()) {
    return null;
  }

  const endpoint = configured.trim();
  const isLocalDevelopment = __DEV__ && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(endpoint);
  if (!endpoint.startsWith("https://") && !isLocalDevelopment) {
    throw new Error("The assistant endpoint must use HTTPS.");
  }
  return endpoint;
}
