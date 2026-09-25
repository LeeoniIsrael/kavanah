import { readSocialData, writeSocialData } from "@/services/socialStorage";
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
};
export const useCircleAccount = create<State>(() => ({
  session: null,
  profile: null,
  ready: false,
  error: null,
}));
let epoch = 0;
export async function loadCircleAccount(session: Session | null) {
  const generation = ++epoch;
  setOutboxOwner(null);
  useCircleAccount.setState({
    session,
    profile: null,
    ready: false,
    error: null,
  });
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
export function startCircleAccount() {
  if (!circleClient) {
    useCircleAccount.setState({ ready: true });
    return () => undefined;
  }
  const initialEpoch = epoch;
  void circleClient.auth
    .getSession()
    .then(({ data }) => {
      if (epoch === initialEpoch) return loadCircleAccount(data.session);
    })
    .catch(() =>
      useCircleAccount.setState({
        ready: true,
        error: "Could not restore sign-in.",
      }),
    );
  const {
    data: { subscription },
  } = circleClient.auth.onAuthStateChange((event, session) => {
    if (event === "INITIAL_SESSION") return;
    // Never await Supabase calls inside its auth lock. Refresh does not reload preferences/outbox.
    if (event === "TOKEN_REFRESHED") {
      useCircleAccount.setState({ session });
      return;
    }
    setTimeout(() => void loadCircleAccount(session), 0);
  });
  return () => subscription.unsubscribe();
}
export async function deleteCircleAccount() {
  const id = useCircleAccount.getState().session?.user.id;
  await circleRpc("circle_delete_account", {}, id);
  if (id) writeSocialData(`circle.profile.${id}`, null);
  clearOutbox();
  setOutboxOwner(null);
  await requireCircle().auth.signOut({ scope: "local" });
  await loadCircleAccount(null);
}
