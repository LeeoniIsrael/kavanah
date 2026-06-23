import { localizeHebrewTransliteration, translatePrayerText } from "@/services/localizationService";

describe("localization service", () => {
  it("keeps English translations local", async () => {
    await expect(translatePrayerText("Blessed are You", "en")).resolves.toBe("Blessed are You");
  });

  it("adapts Hebrew transliteration conventions for selected languages", () => {
    expect(localizeHebrewTransliteration("Baruch atah shema", "de")).toContain("Baruch");
    expect(localizeHebrewTransliteration("shacharit", "pl")).toBe("szacharit");
  });

  it("renders Japanese transliteration in Japanese script", () => {
    expect(localizeHebrewTransliteration("Baruch atah Adonai", "ja")).toBe("バルフ アタ アドナイ");
  });

  it("renders non-Latin language transliterations in matching scripts", () => {
    expect(localizeHebrewTransliteration("Shema", "ko")).toBe("쉐마");
    expect(localizeHebrewTransliteration("Shema", "ru")).toBe("шема");
    expect(localizeHebrewTransliteration("Shema", "ar")).toBe("شيما");
  });
});
