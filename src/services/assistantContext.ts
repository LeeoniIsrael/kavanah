import type { PrayerText } from "@/types/prayer";

export type AssistantLocalizedToken = {
  hebrew: string;
  localizedTranslation: string;
  localizedTransliteration: string;
};

export function buildPrayerAssistantContext(
  prayer: PrayerText,
  primaryLanguageCode: string,
  tokens: AssistantLocalizedToken[]
): string[] {
  const review = prayer.hebrewReview;
  const reviewLabel = review.status === "approved"
    ? "Rabbinically reviewed Hebrew: approved"
    : `Rabbinical Hebrew review: ${review.status}`;

  return [
    `Prayer title: ${prayer.title}`,
    `User-facing purpose (app guidance, not canonical source text): ${prayer.useCase}`,
    `Short description (app guidance, not canonical source text): ${prayer.summary}`,
    `Primary language code: ${primaryLanguageCode}`,
    reviewLabel,
    `Hebrew content scope: ${review.contentKind}`,
    `Tradition: ${review.tradition}`,
    `Source reference supplied for review: ${review.sourceTitle} - ${review.sourceRef}`,
    `Source license status: ${review.licenseStatus}`,
    ...tokens.flatMap((token) => [
      token.hebrew ? `Hebrew prayer text: ${token.hebrew}` : "",
      token.localizedTransliteration
        ? `Display transliteration (not rabbinically reviewed): ${token.localizedTransliteration}`
        : "",
      token.localizedTranslation
        ? `Display translation (not rabbinically reviewed): ${token.localizedTranslation}`
        : ""
    ])
  ].filter(Boolean);
}
