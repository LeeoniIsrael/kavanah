import { localizeHebrewTransliteration, translatePrayerText } from "@/services/localizationService";

describe("localization service", () => {
  it("keeps English translations local", async () => {
    await expect(translatePrayerText("Blessed are You", "en")).resolves.toBe("Blessed are You");
  });

  it("adapts Hebrew transliteration conventions for selected languages", () => {
    expect(localizeHebrewTransliteration("Baruch atah shema", "de")).toContain("Baruch");
    expect(localizeHebrewTransliteration("shacharit", "pl")).toBe("szacharit");
  });
});
