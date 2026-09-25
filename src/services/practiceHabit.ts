import type { StreakHabit } from "@/store/streakStore";

export function habitForPrayer(prayer: {
  id: string;
  title: string;
  category: string;
  tags: string[];
}): StreakHabit | undefined {
  const searchable =
    `${prayer.id} ${prayer.title} ${prayer.tags.join(" ")}`.toLowerCase();
  if (prayer.category === "tefillin" || searchable.includes("tefillin"))
    return "tefillin";
  if (
    prayer.category === "study" ||
    searchable.includes("study") ||
    searchable.includes("learning")
  )
    return "study";
  if (
    searchable.includes("shacharit") ||
    searchable.includes("morning service")
  )
    return "shacharit";
  if (searchable.includes("mincha") || searchable.includes("afternoon service"))
    return "mincha";
  if (
    searchable.includes("maariv") ||
    searchable.includes("arvit") ||
    searchable.includes("evening service")
  )
    return "maariv";
  return undefined;
}
