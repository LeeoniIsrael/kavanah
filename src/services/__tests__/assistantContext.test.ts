import { corePrayers } from "@/data/corePrayers";
import { buildPrayerAssistantContext } from "@/services/assistantContext";

describe("assistant prayer context", () => {
  it("labels pending Hebrew and display translations without claiming approval", () => {
    const prayer = corePrayers.find((item) => item.id === "modeh-ani");
    if (!prayer) throw new Error("Modeh Ani fixture is missing.");
    const token = prayer.tokens[0];
    if (!token) throw new Error("Modeh Ani token fixture is missing.");
    const context = buildPrayerAssistantContext(prayer, "en", [
      {
        hebrew: token.hebrew,
        localizedTransliteration: token.transliteration,
        localizedTranslation: token.translation
      }
    ]);

    expect(context).toContain("Rabbinical Hebrew review: pending");
    expect(context.some((item) => item.startsWith("Display translation (not rabbinically reviewed):"))).toBe(true);
    expect(context.some((item) => item.startsWith("Display transliteration (not rabbinically reviewed):"))).toBe(true);
    expect(context.join(" ")).not.toContain("verified prayer context");
  });
});
