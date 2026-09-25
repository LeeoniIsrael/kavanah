import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Alert, Linking, Share, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useInterfaceStyles } from "@/design/layout";
import {
  circleConfigured,
  circleRpc as requestCircle,
  requireCircle,
} from "@/services/network/client";
import {
  skipFailedCircleChange,
  canSkipFailedCircleChange,
  flushCircle,
  useCircleSync,
} from "@/services/network/outbox";
import {
  deleteCircleAccount,
  loadCircleAccount,
  useCircleAccount,
  type CircleProfile,
} from "@/store/circleAccountStore";
import { useSocialStore } from "@/store/socialStore";

type Contact = {
  requester: string;
  recipient: string;
  status: string;
  person: CircleProfile;
};
type Update = {
  id: string;
  owner: string;
  title: string;
  kind: string;
  created_at: string;
  started_at: string | null;
  duration_seconds: number | null;
  streak: number | null;
  quote: string | null;
  source_ref: string | null;
  circle_profiles: CircleProfile;
};
type FriendsProps = { tabs: ReactNode; lead?: ReactNode };
export function CircleFriends({ tabs, lead }: FriendsProps) {
  const id = useCircleAccount((s) => s.session?.user.id);
  const { handle } = useLocalSearchParams<{ handle?: string }>();
  return (
    <PeopleContent
      key={`${id ?? "guest"}:${handle ?? ""}`}
      tabs={tabs}
      lead={lead}
    />
  );
}
function PeopleContent({ tabs, lead }: FriendsProps) {
  const ui = useInterfaceStyles();
  const { session, profile, ready, error: accountError } = useCircleAccount();
  const circleRpc = useCallback(
    (name: string, args: Record<string, unknown> = {}) =>
      requestCircle(name, args, session?.user.id),
    [session?.user.id],
  );
  const sync = useCircleSync();
  const [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false);
  const params = useLocalSearchParams<{ handle?: string }>();
  const [name, setName] = useState(
      useSocialStore.getState().profile?.displayName ?? "",
    ),
    [handle, setHandle] = useState(
      useSocialStore.getState().profile?.handle.replace(/^@/, "") ?? "",
    ),
    [contact, setContact] = useState(
      params.handle && /^[a-z0-9_]{3,24}$/.test(params.handle)
        ? params.handle
        : "",
    );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [notice, setNotice] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]),
    [updates, setUpdates] = useState<Update[]>([]),
    [more, setMore] = useState(false);
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not connect. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const load = useCallback(async () => {
    if (!profile) return;
    const db = requireCircle();
    const { data: links, error: linkError } = await db
      .from("circle_connections")
      .select("requester,recipient,status")
      .limit(200);
    if (linkError) throw linkError;
    const ids = (links ?? []).map((x) =>
      x.requester === profile.id ? x.recipient : x.requester,
    );
    const { data: people, error: peopleError } = ids.length
      ? await db
          .from("circle_profiles")
          .select("id,handle,display_name")
          .in("id", ids)
      : { data: [], error: null };
    if (peopleError) throw peopleError;
    setContacts(
      (links ?? []).flatMap((x) => {
        const person = people?.find(
          (p) =>
            p.id === (x.requester === profile.id ? x.recipient : x.requester),
        );
        return person ? [{ ...x, person }] : [];
      }),
    );
    const data = await circleRpc("circle_feed");
    setUpdates((data ?? []) as Update[]);
    setMore(data?.length === 20);
  }, [profile, circleRpc]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load updates state only after awaited network reads.
    void load().catch((e) => setError(e.message));
  }, [load]);
  const change = (other: string, action: string) =>
    run(async () => {
      await circleRpc("circle_connection", { other, action });
      await load();
    });
  const invite = () =>
    run(async () => {
      const link = process.env.EXPO_PUBLIC_INVITE_URL;
      await Share.share({
        message: `Join me on Kavanah. A little space for prayer, together. Add @${profile!.handle} in Circle.${link && /^https:\/\//.test(link) ? `\n${link}?handle=${encodeURIComponent(profile!.handle)}` : ""}`,
      });
    });
  const report = (post: Update) =>
    Alert.alert(
      "This update",
      [
        "Report inappropriate content or block this person to remove them from your circle.",
      ].join(""),
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          onPress: () =>
            void run(async () => {
              await circleRpc("circle_report", {
                person: post.owner,
                activity: post.id,
                report_reason: "inappropriate",
              });
              setNotice(
                "Report sent for review. You can also block this person.",
              );
            }),
        },
        {
          text: "Block person",
          style: "destructive",
          onPress: () => void change(post.owner, "block"),
        },
      ],
    );
  const button = (label: string, action: () => void, secondary = false) => (
    <Button
      disabled={busy}
      variant={secondary ? "secondary" : "default"}
      onPress={action}
    >
      <Text>{label}</Text>
    </Button>
  );
  return (
    <Screen largeTitle="Circle" subtitle="Prayer, shared simply.">
      {tabs}
      {!circleConfigured ? (
        <View style={ui.surface}>
          <Text style={ui.itemTitle}>Friends aren’t connected yet</Text>
          <Text style={ui.body}>
            Accounts aren’t connected in this build yet. Your prayers and
            activity remain on this device.
          </Text>
        </View>
      ) : !ready ? (
        <Text style={ui.body}>Opening your circle…</Text>
      ) : !session ? (
        <View style={ui.surface}>
          <Text style={ui.itemTitle}>Pray in good company</Text>
          <Text style={ui.body}>
            Sign in with your email. You choose who joins your circle and what
            you share. Private prayer works without an account.
          </Text>
          <Input
            accessibilityLabel="Email address"
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setSent(false);
            }}
            editable={!busy}
          />
          {sent && (
            <Input
              accessibilityLabel="Email verification code"
              placeholder="Code from your email"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              value={code}
              onChangeText={setCode}
              maxLength={10}
            />
          )}
          {button(
            busy ? "Connecting…" : sent ? "Verify code" : "Continue with email",
            () =>
              void run(async () => {
                if (sent) {
                  const { error } = await requireCircle().auth.verifyOtp({
                    email: email.trim(),
                    token: code.trim(),
                    type: "email",
                  });
                  if (error) throw error;
                } else {
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                    throw new Error("Enter your email address.");
                  const { error } = await requireCircle().auth.signInWithOtp({
                    email: email.trim(),
                  });
                  if (error) throw error;
                  setSent(true);
                  setNotice("Check your email for a sign-in code.");
                }
              }),
          )}
          {sent &&
            button(
              "Use another email",
              () => {
                setSent(false);
                setCode("");
              },
              true,
            )}
          <Text style={ui.caption}>
            Continuing creates an account if you don’t have one. Never share
            your sign-in code.
          </Text>
        </View>
      ) : accountError && !profile ? (
        <View style={ui.surface}>
          <Text style={ui.itemTitle}>Couldn’t open your account</Text>
          <Text style={ui.body}>Check your connection, then try again.</Text>
          {button(
            "Try again",
            () => void run(() => loadCircleAccount(session)),
          )}
        </View>
      ) : !profile ? (
        <View style={ui.surface}>
          <Text style={ui.itemTitle}>How your people find you</Text>
          <Input
            placeholder="Your name"
            accessibilityLabel="Your name"
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
          <Input
            placeholder="Choose a handle"
            accessibilityLabel="Handle, 3 to 24 letters, numbers or underscores"
            autoCapitalize="none"
            value={handle}
            onChangeText={setHandle}
            maxLength={24}
          />
          <Text style={ui.body}>
            Your name and handle are visible to people you connect with. Future
            completions are saved to your account; sharing starts off. Existing
            device history is not uploaded.
          </Text>
          {button(
            "Join Circle",
            () =>
              void run(async () => {
                if (
                  !/^[a-z0-9_]{3,24}$/.test(handle.trim().toLowerCase()) ||
                  !name.trim()
                )
                  throw new Error(
                    "Add your name and a handle with 3–24 letters, numbers or underscores.",
                  );
                await circleRpc("circle_join", {
                  user_handle: handle,
                  user_name: name,
                  user_timezone:
                    Intl.DateTimeFormat().resolvedOptions().timeZone,
                  already_prayed: useSocialStore.getState().hasPrayedEver,
                });
                await loadCircleAccount(session);
              }),
          )}
        </View>
      ) : (
        <>
          <View style={ui.surface}>
            <Text style={ui.itemTitle}>{profile.display_name}</Text>
            <Text style={ui.body}>
              @{profile.handle} · Only accepted connections see your updates.
            </Text>
            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
              {button("Invite a friend", () => void invite())}
              {button("Refresh", () => void run(load), true)}
            </View>
          </View>
          <View style={ui.surface}>
            <Text style={ui.itemTitle}>Add a friend</Text>
            <Text style={ui.body}>
              Enter their handle. They’ll receive a request in Circle.
            </Text>
            <Input
              accessibilityLabel="Person’s handle"
              placeholder="@handle"
              autoCapitalize="none"
              value={contact}
              onChangeText={setContact}
              maxLength={25}
            />
            {button(
              "Send request",
              () =>
                void run(async () => {
                  await circleRpc("circle_request", {
                    contact_handle: contact.replace(/^@/, "").trim(),
                  });
                  setContact("");
                  setNotice(
                    "Request sent. Their updates appear after they accept.",
                  );
                  await load();
                }),
            )}
          </View>
          {contacts.map((link) => (
            <View key={link.person.id} style={ui.surface}>
              <Text style={ui.itemTitle}>{link.person.display_name}</Text>
              <Text style={ui.caption}>
                @{link.person.handle} ·{" "}
                {link.status === "accepted"
                  ? "In your circle"
                  : link.recipient === profile.id
                    ? "Wants to connect"
                    : "Request sent"}
              </Text>
              <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
                {link.status === "pending" &&
                  link.recipient === profile.id &&
                  button("Accept", () => void change(link.person.id, "accept"))}
                {button(
                  link.status === "accepted" ? "Remove" : "Dismiss",
                  () => void change(link.person.id, "remove"),
                  true,
                )}
                {button(
                  "Report",
                  () =>
                    Alert.alert(
                      "Report this profile?",
                      "Send this profile to the moderation team for review.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Report",
                          onPress: () =>
                            void run(async () => {
                              await circleRpc("circle_report", {
                                person: link.person.id,
                                activity: null,
                                report_reason: "abuse",
                              });
                              setNotice("Profile reported for review.");
                            }),
                        },
                      ],
                    ),
                  true,
                )}
                {button(
                  "Block",
                  () =>
                    Alert.alert(
                      "Block this person?",
                      "You will no longer see each other’s updates.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Block",
                          style: "destructive",
                          onPress: () => void change(link.person.id, "block"),
                        },
                      ],
                    ),
                  true,
                )}
              </View>
            </View>
          ))}
          {lead}
          <Text style={ui.sectionTitle}>Friends’ activity</Text>
          {!updates.length && (
            <Text style={ui.body}>
              Shared prayers and weekly quotes from your circle will appear
              here. No captions. Nothing to compose.
            </Text>
          )}
          {updates.map((post) => (
            <View key={post.id} style={ui.surface}>
              <Text style={ui.itemTitle}>
                {post.circle_profiles.display_name}
              </Text>
              <Text style={ui.caption}>
                @{post.circle_profiles.handle} ·{" "}
                {new Date(post.created_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
              <Text style={post.kind === "quote" ? ui.editorial : ui.itemTitle}>
                {post.kind === "quote"
                  ? `“${post.quote}”`
                  : post.kind === "milestone"
                    ? `${post.streak} days of prayer`
                    : post.title}
              </Text>
              {post.kind === "quote" && (
                <Text style={ui.caption}>{post.source_ref}</Text>
              )}
              {post.started_at && (
                <Text style={ui.caption}>
                  Started{" "}
                  {new Date(post.started_at).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {post.duration_seconds !== null
                    ? ` · ${Math.floor(post.duration_seconds / 60)}m ${post.duration_seconds % 60}s`
                    : ""}
                </Text>
              )}
              {post.owner === profile.id
                ? button(
                    "Remove update",
                    () =>
                      Alert.alert(
                        "Remove this update?",
                        "It will disappear from everyone’s feed. Your private completion stays saved.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Remove",
                            style: "destructive",
                            onPress: () =>
                              void run(async () => {
                                await circleRpc("circle_remove", {
                                  activity: post.id,
                                });
                                await load();
                              }),
                          },
                        ],
                      ),
                    true,
                  )
                : button("Report or block", () => report(post), true)}
            </View>
          ))}
          {more &&
            button(
              "More updates",
              () =>
                void run(async () => {
                  const last = updates[updates.length - 1]!;
                  const data = await circleRpc("circle_feed", {
                    before_created: last.created_at,
                    before_id: last.id,
                  });
                  setUpdates((data ?? []) as Update[]);
                  setMore(data?.length === 20);
                }),
              true,
            )}
        </>
      )}
      {!profile && lead}
      {sync.pending > 0 && (
        <View style={ui.surface}>
          <Text style={ui.body}>
            {sync.pending} change{sync.pending === 1 ? "" : "s"} waiting to
            sync.
          </Text>
          {sync.error && (
            <>
              <Text style={ui.caption}>{sync.error}</Text>
              {canSkipFailedCircleChange() &&
                button(
                  "Skip this change",
                  () =>
                    Alert.alert(
                      "Skip this upload?",
                      "This one change will stay on your device. Other pending changes will resume syncing.",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Skip", onPress: skipFailedCircleChange },
                      ],
                    ),
                  true,
                )}
            </>
          )}
          {button(
            "Retry sync",
            () =>
              void run(async () => {
                await flushCircle();
                await load();
              }),
            true,
          )}
        </View>
      )}
      {(error || accountError) && (
        <Text accessibilityRole="alert" style={ui.body}>
          {error || accountError}
        </Text>
      )}
      {notice && (
        <Text accessibilityLiveRegion="polite" style={ui.body}>
          {notice}
        </Text>
      )}
      {circleConfigured && (
        <View style={{ gap: 8 }}>
          <Text style={ui.caption}>
            By joining Circle, you agree to the community terms and privacy
            policy. Your circle should be a respectful place to practice.
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {button(
              "Privacy",
              () =>
                void Linking.openURL(
                  "https://github.com/LeeoniIsrael/kavanah/blob/main/docs/privacy-policy.md",
                ),
              true,
            )}
            {button(
              "Terms",
              () =>
                void Linking.openURL(
                  "https://github.com/LeeoniIsrael/kavanah/blob/main/docs/terms-of-use.md",
                ),
              true,
            )}
          </View>
        </View>
      )}
      {session && (
        <View style={{ gap: 12 }}>
          {button(
            "Sign out",
            () =>
              void run(async () => {
                const { error } = await requireCircle().auth.signOut();
                if (error) throw error;
              }),
            true,
          )}
          {button(
            "Delete account",
            () =>
              Alert.alert(
                "Delete your Circle account?",
                "This permanently deletes your profile, cloud prayer history, posts and connections. Private device activity stays on this phone.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete account",
                    style: "destructive",
                    onPress: () => void run(deleteCircleAccount),
                  },
                ],
              ),
            true,
          )}
        </View>
      )}
    </Screen>
  );
}
