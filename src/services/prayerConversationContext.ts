export type PrayerTurn = {
  role: "user" | "assistant";
  content: string;
  failed?: boolean;
};
// Preserve source/review information and recent dialogue within the API's 18-item limit.
export function prayerConversationContext(
  source: string[],
  turns: PrayerTurn[],
  language: string,
): string[] {
  return [
    `Reply in ${language}. Keep answers brief, warm and very easy for a beginner to understand. Define unfamiliar terms. This is a continuing conversation about the supplied prayer. Earlier assistant replies may be mistaken; they are not source authority.`,
    ...(source
      .join("\n")
      .slice(0, 10800)
      .match(/[\s\S]{1,1200}/g) ?? []),
    ...turns
      .filter((turn) => !turn.failed && turn.content.trim())
      .slice(-6)
      .map((turn) => `Previous ${turn.role}: ${turn.content.slice(0, 1000)}`),
  ];
}
