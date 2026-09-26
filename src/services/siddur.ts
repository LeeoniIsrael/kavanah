import manifest from "@/data/generatedLiturgyIndex.json";
import order from "@/data/siddurOrder.json";
import type { PrayerIdentity } from "@/store/prayerIdentityStore";
import type { LiturgyIndexEntry } from "@/types/prayer";
export type SiddurBook = keyof typeof order;
export const siddurBooks = Object.keys(order) as SiddurBook[];
const byId = new Map(
  (manifest.entries as LiturgyIndexEntry[]).map((entry) => [entry.id, entry]),
);
export function siddurEntries(book: SiddurBook): LiturgyIndexEntry[] {
  return order[book]
    .map((id) => byId.get(id))
    .filter((entry): entry is LiturgyIndexEntry => Boolean(entry));
}
export function normalizeSiddurSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0591-\u05c7\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
export function searchSiddur(book: SiddurBook, query: string) {
  const words = normalizeSiddurSearch(query).split(/\s+/).filter(Boolean);
  return siddurEntries(book).filter((entry) => {
    const text = normalizeSiddurSearch(
      [entry.title, entry.hebrewTitle, ...entry.path, ...entry.aliases].join(
        " ",
      ),
    );
    return words.every((word) => text.includes(word));
  });
}

export function preferredSiddurBook(identity: PrayerIdentity | null): SiddurBook | null {
  if (!identity || identity.community === "unsure") return null;
  if (identity.community === "hasidic") return "Siddur Sefard";
  if (identity.community === "mediterranean") return "Siddur Edot HaMizrach";
  return "Siddur Ashkenaz";
}

// This is a reading default, not a ruling about who may say a prayer.
export function fitsDailyView(entry: LiturgyIndexEntry, identity: PrayerIdentity | null): boolean {
  if (identity?.audience !== "woman") return true;
  const label = [entry.title, ...entry.path].join(" ").toLowerCase();
  return !/tefillin|phylacter|laying tefillin|wrapping in tzitzit|tallit blessing/.test(label);
}
