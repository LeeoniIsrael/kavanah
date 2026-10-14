import researchPrayers from "./researchPrayers.json";
import type { PrayerText } from "@/types/prayer";

// Sole published catalog. Source capture does not imply expert approval.
export const corePrayers = researchPrayers as PrayerText[];
