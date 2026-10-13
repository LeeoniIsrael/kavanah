import { create } from "zustand";
import { readSocialData, writeSocialData } from "@/services/socialStorage";
import { circleClient, updateAccountMetadata } from "@/services/network/client";
import { isAccountSession } from "@/services/accountAccess";

export type PrayerCommunity = "european" | "hasidic" | "mediterranean" | "unsure";
export type PrayerAudience = "man" | "woman";
export type PrayerIdentity = { audience: PrayerAudience; community: PrayerCommunity };
const key = "prayer.identity.v1";
const completeKey = "onboarding.complete.v1";
const accountKey = "prayer.identity.account.v1";
const isIdentity = (value: unknown): value is PrayerIdentity => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PrayerIdentity>;
  return (candidate.audience === "man" || candidate.audience === "woman") &&
    ["european", "hasidic", "mediterranean", "unsure"].includes(candidate.community ?? "");
};
const isTrue = (value: unknown): value is true => value === true;
type AccountIdentity = { ownerId: string; identity: PrayerIdentity | null; completed: boolean };
const persistedAccount = readSocialData(accountKey, (value): value is AccountIdentity => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AccountIdentity>;
  return typeof candidate.ownerId === "string" && candidate.ownerId.length > 0 &&
    (candidate.identity === null || isIdentity(candidate.identity)) &&
    typeof candidate.completed === "boolean";
});
// Owner and value must be one record: a crash between separate writes could
// otherwise associate the new person's choice with the previous person's ID.
function persistAccount(ownerId: string, identity: PrayerIdentity | null, completed: boolean) {
  writeSocialData(accountKey, { ownerId, identity, completed });
}

type State = {
  identity: PrayerIdentity | null;
  ownerId: string | null;
  completed: boolean;
  save: (identity: PrayerIdentity, expectedUserId: string) => Promise<void>;
  finish: () => void;
  restoreFromAccount: (metadata: Record<string, unknown>, accountId: string) => void;
};
export const usePrayerIdentityStore = create<State>((set, get) => ({
  identity: persistedAccount ? persistedAccount.identity : readSocialData(key, isIdentity),
  ownerId: persistedAccount?.ownerId ?? null,
  completed: persistedAccount ? persistedAccount.completed : Boolean(readSocialData(completeKey, isTrue)),
  save: async (identity, expectedUserId) => {
    if (!circleClient) throw new Error("Sign-in is unavailable in this build.");
    const { data: { session }, error } = await circleClient.auth.getSession();
    if (error || !isAccountSession(session) || session.user.id !== expectedUserId) throw new Error("Sign in to save your preferences.");
    await updateAccountMetadata(session, { prayer_identity: identity });
    const { data: current, error: currentError } = await circleClient.auth.getSession();
    if (currentError || !isAccountSession(current.session) || current.session.user.id !== expectedUserId) throw new Error("Your sign-in changed. Please try again.");
    writeSocialData(key, identity);
    if (identity.community === "unsure") writeSocialData("siddur.book", null);
    const completed = get().ownerId === expectedUserId && get().completed;
    persistAccount(expectedUserId, identity, completed);
    set({ identity, ownerId: expectedUserId, completed });
  },
  finish: () => {
    writeSocialData(completeKey, true);
    const { ownerId, identity } = get();
    if (ownerId) persistAccount(ownerId, identity, true);
    set({ completed: true });
  },
  restoreFromAccount: (metadata, accountId) => {
    // Our token may predate a successful preference save made through the
    // authenticated HTTP endpoint. Keep a locally saved choice only when its
    // owner is known to be this account; never assign legacy unowned data.
    if (get().ownerId === accountId && get().identity) return;
    const identity = isIdentity(metadata.prayer_identity) ? metadata.prayer_identity : null;
    // A valid saved account choice can restore onboarding. Missing/invalid
    // metadata must not inherit another person's device-wide onboarding flag.
    const completed = identity !== null;
    writeSocialData(key, identity);
    writeSocialData(completeKey, completed);
    const previous = get().identity;
    if (!identity || previous?.audience !== identity.audience || previous.community !== identity.community) {
      writeSocialData("siddur.book", null);
    }
    persistAccount(accountId, identity, completed);
    set({ identity, completed, ownerId: accountId });
  },
}));
