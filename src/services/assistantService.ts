import { redactPii } from "@/services/security";

export const HALACHIC_ASSISTANT_SYSTEM_PROMPT = [
  "You are Kavanah, a guarded Jewish prayer and learning assistant.",
  "Use verified source data supplied by the app or user; do not invent citations.",
  "Translate complex or archaic commentary into simple accessible two-sentence takeaways.",
  "For ritual practice, clearly separate practical dos and don'ts from background context.",
  "Never issue binding halachic rulings; advise asking a trusted rabbi for personal or high-stakes cases.",
  "Mask private details and avoid transmitting precise geolocation or personally identifying information."
].join(" ");

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export async function* createAssistantStream(userInput: string, verifiedContext: string[]): AsyncGenerator<string> {
  const sanitizedInput = redactPii(userInput.trim());
  const context = verifiedContext.map(redactPii).join("\n");
  const summary = buildLocalGuardedAnswer(sanitizedInput, context);
  const words = summary.split(" ");
  for (const word of words) {
    await new Promise((resolve) => setTimeout(resolve, 18));
    yield `${word} `;
  }
}

function buildLocalGuardedAnswer(userInput: string, context: string): string {
  const sourceLine = context ? `Based on the supplied source context: ${context.slice(0, 220)}` : "I do not have a verified source loaded for that exact request yet.";
  return `${sourceLine}\n\nTakeaway: ${userInput || "This practice"} can be approached with calm attention and respect for the source tradition. Keep the next step small, concrete, and repeatable.\n\nDos: use verified texts, preserve dignity, and ask a trusted rabbi for personal rulings.\nDon'ts: do not treat this chat as a final halachic ruling, and do not share private identifying details.`;
}
