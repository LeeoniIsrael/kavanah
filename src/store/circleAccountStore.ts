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
  updateAccountMetadata,
} from "@/services/network/client";
import {
  pendingCirclePreferences,
  setOutboxOwner,
  flushCircle,
  clearOutbox,
} from "@/services/network/outbox";
import { useSocialStore } from "./socialStore";
import { isAccountSession } from "@/services/accountAccess";
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
export async function loadCircleAccount(session: Session | null) {
  session = isAccountSession(session) ? session : null;
  const generation = ++epoch;
  setOutboxOwner(null);
  useCircleAccount.setState({
    session,
    profile: null,
    ready: false,
    error: null,
    sessionReady: true,
    sessionError: null,
  });
  if (session) {
    const metadata = session.user.user_metadata ?? {};
    const localIdentity = usePrayerIdentityStore.getState().identity;
    usePrayerIdentityStore.getState().restoreFromAccount(metadata);
    if (!metadata.prayer_identity && localIdentity) {
      void updateAccountMetadata(session, { prayer_identity: localIdentity })
        .catch(() => undefined);
    }
  }
  if (!session) {
    useCircleAccount.setState({ ready: true });
    return;
  }
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
          error instanceof Error
            ? error.message
            : "Could not load your account.",
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
    // Revoke route access immediately; profile hydration runs outside the auth lock.
    useCircleAccount.setState({ session: accountSession, sessionReady: true, sessionError: null });
    // Never await Supabase calls inside its auth lock. Refresh does not reload preferences/outbox.
    if (event === "TOKEN_REFRESHED" && accountSession && previousId === accountSession.user.id) {
      return;
    }
    const generation = ++epoch;
    setOutboxOwner(null);
    if (!accountSession) {
      useCircleAccount.setState({ profile: null, ready: true });
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
  if (!id) throw new Error("Sign in to delete this account.");
  await circleRpc("circle_delete_account", {}, id);
  removeAccountLocalData(id);
  // A completed deletion must never clear a different account that signed in
  // while the server request was running.
  if (useCircleAccount.getState().session?.user.id !== id) return;
  epoch++;
  setOutboxOwner(null);
  clearOutbox();
  const { error } = await requireCircle().auth.signOut({ scope: "local" });
  await loadCircleAccount(null);
  if (error)
    throw new Error(
      "The cloud account was deleted, but local sign-out could not finish. Restart and clear local data.",
    );
}
