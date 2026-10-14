import { userFacingError, UserFacingError } from "@/services/userFacingError";
import { usePrayerIdentityStore } from "@/store/prayerIdentityStore";
import {
  readSocialData,
  writeSocialData,
  removeAccountLocalData,
} from "@/services/socialStorage";
import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import {
  circleClient,
  circleRpc,
  requireCircle,
} from "@/services/network/client";
import {
  pendingCirclePreferences,
  setOutboxOwner,
  flushCircle,
  clearOutbox,
} from "@/services/network/outbox";
import { useSocialStore } from "./socialStore";
import { isAccountSession } from "@/services/accountAccess";
import { accountScope, setAccountScope } from "@/services/accountScope";
import { cancelLocalRemindersForDeletion, syncReminders } from "@/services/reminderScheduler";
export type CircleProfile = {
  id: string;
  handle: string;
  display_name: string;
};
type State = {
  session: Session | null;
  profile: CircleProfile | null;
  ready: boolean;
  error: string | null;
  sessionReady: boolean;
  sessionError: string | null;
};
export const useCircleAccount = create<State>(() => ({
  session: null,
  profile: null,
  ready: false,
  error: null,
  sessionReady: false,
  sessionError: null,
}));
let epoch = 0;
let localTransitionFailed = false;
export async function loadCircleAccount(session: Session | null) {
  session = isAccountSession(session) ? session : null;
  const generation = ++epoch;
  setOutboxOwner(null);
  const owner = session?.user.id ?? null;
  if (accountScope().owner !== owner || owner === null || useCircleAccount.getState().session?.user.id !== owner || localTransitionFailed) {
    useCircleAccount.setState({ session: null, profile: null, sessionReady: false });
    try {
      setAccountScope(owner, localTransitionFailed);
      // Revoke old scheduled notifications before granting the next account access.
      await cancelLocalRemindersForDeletion();
      if (generation !== epoch) return;
      localTransitionFailed = false;
    } catch {
      if (generation !== epoch) return;
      localTransitionFailed = true;
      if (generation === epoch) useCircleAccount.setState({ session: null, sessionReady: true, ready: true, sessionError: "Could not safely switch local accounts. Restart and try again." });
      return;
    }
    if (generation !== epoch) return;
  }
  // Account metadata is authoritative. Device-wide legacy preferences may
  // belong to somebody else and must never be uploaded on sign-in.
  if (session && useCircleAccount.getState().session?.user.id !== session.user.id) {
    try {
      usePrayerIdentityStore.getState().restoreFromAccount(session.user.user_metadata ?? {}, session.user.id);
    } catch {
      localTransitionFailed = true;
      useCircleAccount.setState({ session: null, sessionReady: true, ready: true, sessionError: "Could not safely load local account preferences. Restart and try again." });
      return;
    }
  }
  useCircleAccount.setState({
    session,
    profile: null,
    ready: false,
    error: null,
    sessionReady: true,
    sessionError: null,
  });
  if (!session) {
    useCircleAccount.setState({ ready: true });
    return;
  }
  void syncReminders();
  const cacheKey = `circle.profile.${session.user.id}`;
  const cached = readSocialData(cacheKey, (v): v is CircleProfile =>
    Boolean(
      v && typeof v === "object" && (v as CircleProfile).id === session.user.id,
    ),
  );
  if (cached) {
    setOutboxOwner(session.user.id);
    useCircleAccount.setState({ profile: cached });
  }
  try {
    const { data, error } = await requireCircle()
      .from("circle_profiles")
      .select("id,handle,display_name")
      .eq("id", session.user.id)
      .maybeSingle();
    if (error) throw error;
    if (generation !== epoch) return;
    if (!data) {
      setOutboxOwner(null);
      writeSocialData(cacheKey, null);
    }
    if (data) {
      const settings = await circleRpc("circle_settings");
      if (generation !== epoch) return;
      // Do not enqueue a write while hydrating this account's server-owned choices.
      setOutboxOwner(session.user.id);
      const choices = pendingCirclePreferences() ?? settings;
      if (choices) useSocialStore.setState({ preferences: choices });
      writeSocialData(cacheKey, data);
      void flushCircle();
    }
    useCircleAccount.setState({
      profile: data as CircleProfile | null,
      ready: true,
    });
  } catch (error) {
    if (generation === epoch)
      useCircleAccount.setState({
        ready: true,
        error:
          userFacingError(error, "Could not load your account."),
      });
  }
}
export async function restoreCircleSession() {
  const generation = ++epoch;
  setOutboxOwner(null);
  useCircleAccount.setState({ session: null, profile: null, sessionReady: false, sessionError: null });
  if (!circleClient) {
    await loadCircleAccount(null);
    return;
  }
  try {
    const { data, error } = await circleClient.auth.getSession();
    if (generation !== epoch) return;
    if (error) throw error;
    await loadCircleAccount(data.session);
  } catch {
    if (generation !== epoch) return;
    try {
      setAccountScope(null);
      await cancelLocalRemindersForDeletion();
    } catch { if (generation === epoch) localTransitionFailed = true; }
    if (generation === epoch) useCircleAccount.setState({
      session: null, profile: null, ready: true, sessionReady: true,
      sessionError: "Could not restore sign-in. Check your connection and try again.",
    });
  }
}
export function startCircleAccount() {
  void restoreCircleSession();
  if (!circleClient) return () => { epoch++; };
  const {
    data: { subscription },
  } = circleClient.auth.onAuthStateChange((event, session) => {
    if (event === "INITIAL_SESSION") return;
    const accountSession = isAccountSession(session) ? session : null;
    const previousId = useCircleAccount.getState().session?.user.id;
    // Never await Supabase calls inside its auth lock. Refresh does not reload preferences/outbox.
    if (event === "TOKEN_REFRESHED" && accountSession && previousId === accountSession.user.id) {
      useCircleAccount.setState({ session: accountSession, sessionReady: true, sessionError: null });
      return;
    }
    // Revoke access immediately. Hydrate the next account and cancel old native
    // reminders outside the Auth lock before publishing its session.
    useCircleAccount.setState({ session: null, sessionReady: !accountSession, sessionError: null });
    const generation = ++epoch;
    setOutboxOwner(null);
    if (!accountSession) {
      useCircleAccount.setState({ profile: null, ready: true });
      void loadCircleAccount(null);
      return;
    }
    setTimeout(() => {
      if (generation === epoch) void loadCircleAccount(accountSession);
    }, 0);
  });
  return () => { epoch++; subscription.unsubscribe(); };
}
let deletion: Promise<void> | null = null;
export function deleteCircleAccount(): Promise<void> {
  if (deletion) return deletion;
  deletion = deleteAccount().finally(() => {
    deletion = null;
  });
  return deletion;
}
async function deleteAccount() {
  const id = useCircleAccount.getState().session?.user.id;
  if (!id) throw new UserFacingError("Sign in to delete this account.");
  await circleRpc("circle_delete_account", {}, id);
  const deletingCurrent = useCircleAccount.getState().session?.user.id === id;
  if (deletingCurrent) {
    epoch++;
    setOutboxOwner(null);
    useCircleAccount.setState({ session: null, profile: null, sessionReady: false });
    setAccountScope(null);
  }
  const deletionEpoch = epoch;
  try {
    if (deletingCurrent) await cancelLocalRemindersForDeletion();
    const { clearSiddurAccountData } = await import("@/features/siddur/cache");
    await clearSiddurAccountData(id);
    removeAccountLocalData(id);
  } catch {
    if (deletingCurrent && epoch === deletionEpoch) useCircleAccount.setState({ sessionReady: true, ready: true, sessionError: "The cloud account was deleted, but local cleanup failed. Clear local data before using this installation again." });
    throw new UserFacingError("The cloud account was deleted, but local cleanup failed. Clear local data to retry cleanup.");
  }
  // A completed deletion must never clear a different account that signed in
  // while the server request was running.
  if (!deletingCurrent || epoch !== deletionEpoch || useCircleAccount.getState().session) return;
  epoch++;
  setOutboxOwner(null);
  clearOutbox();
  const { error } = await requireCircle().auth.signOut({ scope: "local" });
  await loadCircleAccount(null);
  if (error)
    throw new UserFacingError(
      "The cloud account was deleted, but local sign-out could not finish. Restart and clear local data.",
    );
}
