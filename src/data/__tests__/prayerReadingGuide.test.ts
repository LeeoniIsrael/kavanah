import { corePrayers } from "@/data/corePrayers";
import { prayerReadingGuide, prayerScopeNote } from "@/data/prayerReadingGuide";

test("an excerpt cannot appear to be a complete ritual guide", () => {
  const asher = corePrayers.find((prayer) => prayer.id === "asher-yatzar")!;
  expect(prayerScopeNote(asher)).toContain("not the full prayer");
  expect(prayerReadingGuide(asher).before).toContain("leave the bathroom");
  expect(prayerReadingGuide(asher).after).toBeUndefined();
});
test("morning washing follows Modeh Ani rather than becoming a prerequisite", () => {
  const modeh = corePrayers.find((prayer) => prayer.id === "modeh-ani")!;
  const guide = prayerReadingGuide(modeh);
  expect(guide.before).toContain("before washing");
  expect(guide.after).toContain("Next, wash");
  expect(prayerScopeNote(modeh)).toBeUndefined();
});
test("an unrelated source with a matching title does not inherit ritual steps", () => {
  const sample = corePrayers[0]!;
  expect(
    prayerReadingGuide({ ...sample, id: "different-source" }).after,
  ).toBeUndefined();
});
