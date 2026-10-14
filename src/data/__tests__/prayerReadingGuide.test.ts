import { corePrayers } from "@/data/corePrayers";
import { prayerReadingGuide, prayerScopeNote } from "@/data/prayerReadingGuide";

test("a sourced section keeps its scope and practical guidance", () => {
  const asher = corePrayers.find((prayer) => prayer.id === "asher-yatzar")!;
  expect(prayerScopeNote(asher)).toContain("Prayer-book section");
  expect(prayerReadingGuide(asher).before).toContain("leave the bathroom");
  expect(prayerReadingGuide(asher).after).toBeUndefined();
});
test("morning washing follows Modeh Ani rather than becoming a prerequisite", () => {
  const modeh = corePrayers.find((prayer) => prayer.id === "modeh-ani")!;
  const guide = prayerReadingGuide(modeh);
  expect(guide.before).toContain("before washing");
  expect(guide.after).toContain("Next, wash");
  expect(prayerScopeNote(modeh)).toContain("Prayer-book section");
});
test("an unrelated source with a matching title does not inherit ritual steps", () => {
  const sample = corePrayers[0]!;
  expect(
    prayerReadingGuide({ ...sample, id: "different-source" }).after,
  ).toBeUndefined();
});
