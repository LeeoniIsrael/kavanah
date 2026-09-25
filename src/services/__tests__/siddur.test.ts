import { siddurBooks, siddurEntries, searchSiddur } from "../siddur";
import manifest from "@/data/generatedLiturgyIndex.json";
describe("siddur navigation", () => {
  test.each(siddurBooks)(
    "%s contains every indexed section exactly once",
    (book) => {
      const entries = siddurEntries(book);
      expect(new Set(entries.map((entry) => entry.id)).size).toBe(
        entries.length,
      );
      expect(entries.length).toBe(
        manifest.entries.filter((entry) => entry.work === book).length,
      );
      expect(entries.every((entry) => entry.work === book)).toBe(true);
    },
  );
  test("source order starts with weekday prayer, rather than alphabetical blessings", () => {
    expect(siddurEntries("Siddur Ashkenaz")[0]?.path[0]).toBe("Weekday");
  });
  test("Hebrew search ignores vowels and English search uses section paths", () => {
    expect(
      searchSiddur("Siddur Ashkenaz", "שְׁמַע").map((entry) => entry.id),
    ).toEqual(searchSiddur("Siddur Ashkenaz", "שמע").map((entry) => entry.id));
    const matches = searchSiddur("Siddur Ashkenaz", "shacharit amidah");
    expect(matches.length).toBeGreaterThan(0);
    expect(
      matches.every(
        (entry) =>
          entry.path.join(" ").includes("Shacharit") &&
          entry.path.join(" ").includes("Amidah"),
      ),
    ).toBe(true);
    expect(searchSiddur("Siddur Ashkenaz", "not-a-prayer-xyz")).toEqual([]);
  });
});
