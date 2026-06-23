import { searchPrayers } from "@/services/prayerService";

describe("prayer search", () => {
  it("matches intent terms across title, translation, and transliteration", () => {
    const [travel] = searchPrayers("lead us in peace");
    const [shema] = searchPrayers("adonai echad");

    expect(travel?.prayer.id).toBe("tefilat-haderech");
    expect(shema?.prayer.id).toBe("shema");
  });
});
