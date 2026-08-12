import { getCachedPrayers, searchPrayers, syncCorePrayers } from "@/services/prayerService";

describe("prayer search", () => {
  it("matches intent terms across title, translation, and transliteration", () => {
    const [travel] = searchPrayers("lead us in peace");
    const [shema] = searchPrayers("adonai echad");

    expect(travel?.prayer.id).toBe("tefilat-haderech");
    expect(shema?.prayer.id).toBe("shema");
  });

  it("keeps bundled Hebrew immutable while rabbinic review is pending", async () => {
    const before = getCachedPrayers();
    const after = await syncCorePrayers();

    expect(after).toEqual(before);
    expect(after.every((prayer) => prayer.hebrewReview.status === "pending")).toBe(true);
    expect(after.find((prayer) => prayer.id === "asher-yatzar")?.hebrewReview.contentKind).toBe("excerpt");
  });
});
