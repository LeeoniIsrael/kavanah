import { create } from "zustand";
import { readSocialData, writeSocialData } from "@/services/socialStorage";
import { circleClient } from "@/services/network/client";

export type PrayerCommunity = "european" | "hasidic" | "mediterranean" | "unsure";
export type PrayerAudience = "man" | "woman";
export type PrayerIdentity = { audience: PrayerAudience; community: PrayerCommunity };
const key = "prayer.identity.v1";
const completeKey = "onboarding.complete.v1";
const isIdentity = (value: unknown): value is PrayerIdentity => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PrayerIdentity>;
  return (candidate.audience === "man" || candidate.audience === "woman") &&
    ["european", "hasidic", "mediterranean", "unsure"].includes(candidate.community ?? "");
};
const isTrue = (value: unknown): value is true => value === true;

type State = {
  identity: PrayerIdentity | null;
  completed: boolean;
  save: (identity: PrayerIdentity) => Promise<void>;
  finish: () => void;
  restoreFromAccount: (metadata: Record<string, unknown>) => void;
};
export const usePrayerIdentityStore = create<State>((set, get) => ({
  identity: readSocialData(key, isIdentity),
  completed: Boolean(readSocialData(completeKey, isTrue)),
  save: async (identity) => {
    writeSocialData(key, identity);
    if (identity.community === "unsure") writeSocialData("siddur.book", null);
    set({ identity });
    if (!circleClient) return;
    const { data: { session } } = await circleClient.auth.getSession();
    if (session) {
      const { error } = await circleClient.auth.updateUser({ data: { prayer_identity: identity } });
      if (error) throw error;
    }
  },
  finish: () => {
    writeSocialData(completeKey, true);
    set({ completed: true });
  },
  restoreFromAccount: (metadata) => {
    if (get().identity || !isIdentity(metadata.prayer_identity)) return;
    writeSocialData(key, metadata.prayer_identity);
    set({ identity: metadata.prayer_identity });
  },
}));
