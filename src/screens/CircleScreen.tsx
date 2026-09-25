import { memo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  BookOpen,
  Check,
  ChevronRight,
  CircleDot,
  Quote,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { colors, fonts } from "@/design/theme";
import { useSocialStore, type FeedPost } from "@/store/socialStore";
import { weekKey, type PrayerSharing } from "@/services/socialPolicy";
import { useCurrentDate } from "@/hooks/useCurrentDate";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const modes: { id: PrayerSharing; title: string; detail: string }[] = [
  {
    id: "off",
    title: "Keep prayers private",
    detail: "No automatic prayer updates.",
  },
  {
    id: "first-daily",
    title: "First prayer each day",
    detail: "One update after your first completed prayer.",
  },
  {
    id: "every",
    title: "Every prayer",
    detail: "An update each time you finish a prayer.",
  },
];
export function CircleScreen(): React.JSX.Element {
  const router = useRouter();
  const posts = useSocialStore((s) => s.posts);
  const profile = useSocialStore((s) => s.profile);
  const preferences = useSocialStore((s) => s.preferences);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const now = useCurrentDate();
  const weeklyQuote = posts.find(
    (p) => p.kind === "quote" && p.week === weekKey(now),
  );
  const automaticEnabled =
    preferences.prayers !== "off" || preferences.milestones;
  const openPrayers = () =>
    router.push({ pathname: "/prayer", params: { prayerId: "modeh-ani" } });
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={posts}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => <ActivityCard post={item} />}
        contentContainerStyle={s.content}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={5}
        ListHeaderComponent={
          <View style={{ gap: 24, paddingBottom: 24 }}>
            <View style={s.row}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={s.title}>Circle</Text>
                <Text style={s.muted}>Prayer, shared simply.</Text>
              </View>
              <Button
                variant="ghost"
                size="content"
                accessibilityLabel="Sharing preferences"
                onPress={() => setSettingsOpen(true)}
                style={s.iconButton}
              >
                <Settings2 size={22} color={colors.ink} />
              </Button>
            </View>
            <View style={s.intro}>
              <View style={s.row}>
                <View style={s.avatar}>
                  <Text style={s.initial}>
                    {profile?.displayName.charAt(0).toUpperCase() || "You"}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={s.heading}>
                    {profile?.displayName || "Your practice, your pace"}
                  </Text>
                  <Text style={s.small}>
                    Your profile shares only what you choose.
                  </Text>
                </View>
              </View>
              <Button
                variant="ghost"
                size="content"
                accessibilityLabel="Choose automatic sharing"
                onPress={() => setSettingsOpen(true)}
                style={s.settingsRow}
              >
                <View style={{ flex: 1, gap: 5 }}>
                  <Text style={s.label}>Automatic updates</Text>
                  <Text style={s.small}>
                    {preferences.prayers === "off"
                      ? "Prayers stay private"
                      : preferences.prayers === "every"
                        ? "Every completed prayer"
                        : "Your first prayer each day"}
                    {preferences.milestones ? " · Milestones on" : ""}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.inkMuted} />
              </Button>
            </View>
            <View style={s.quoteCard}>
              <View style={s.row}>
                <Quote size={20} color="#C3CAFF" />
                <Text style={s.quoteLabel}>Your quote of the week</Text>
              </View>
              <Text
                style={[
                  s.quoteTitle,
                  weeklyQuote?.language === "he" && {
                    fontFamily: fonts.hebrew,
                    writingDirection: "rtl",
                    textAlign: "right",
                  },
                ]}
              >
                {weeklyQuote
                  ? `“${weeklyQuote.quote}”`
                  : "A line worth carrying."}
              </Text>
              <Text style={s.quoteDescription}>
                {weeklyQuote
                  ? weeklyQuote.practice
                  : "Find a line in a prayer. Hold it, choose your words, and add it here."}
              </Text>
              <Button
                variant="ghost"
                size="content"
                onPress={openPrayers}
                style={s.quoteAction}
              >
                <BookOpen size={17} color={colors.ink} />
                <Text style={s.label}>
                  {weeklyQuote
                    ? "Choose a different quote"
                    : "Choose in prayer"}
                </Text>
                <ChevronRight size={17} color={colors.ink} />
              </Button>
              <Text style={s.quoteFootnote}>
                One quote each week. Replace it anytime. No caption.
              </Text>
            </View>
            <View style={s.row}>
              <Text style={s.section}>Your activity</Text>
              <View style={{ flex: 1 }} />
              <Text style={s.small}>
                {posts.length
                  ? `${posts.length} update${posts.length === 1 ? "" : "s"}`
                  : "A fresh start"}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <CircleDot size={26} color={colors.blue} />
            </View>
            <Text style={s.heading}>
              {automaticEnabled
                ? "You’re ready. Just pray."
                : "Nothing to compose."}
            </Text>
            <Text style={[s.muted, { textAlign: "center", lineHeight: 23 }]}>
              {automaticEnabled
                ? "Your next matching completion will appear here automatically."
                : "Choose your automatic updates, then pray. Your practice creates the post."}
            </Text>
            <Button
              variant="default"
              size="content"
              onPress={
                automaticEnabled ? openPrayers : () => setSettingsOpen(true)
              }
              style={s.primary}
            >
              <Text style={s.primaryText}>
                {automaticEnabled ? "Open a prayer" : "Choose my updates"}
              </Text>
            </Button>
          </View>
        }
        ListFooterComponent={
          <View style={s.notice}>
            <ShieldCheck size={17} color={colors.inkMuted} />
            <Text style={[s.small, { flex: 1, lineHeight: 19 }]}>
              Only you can see this for now. Circle is not connected to other
              accounts; these updates stay on this device.
            </Text>
          </View>
        }
      />
      <SharingSettings
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </SafeAreaView>
  );
}
export function SharingSettings({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const preferences = useSocialStore((s) => s.preferences);
  const setPreferences = useSocialStore((s) => s.setPreferences);
  const reduceMotion = useReducedMotion();
  return (
    <Modal
      visible={visible}
      presentationStyle="fullScreen"
      animationType={reduceMotion ? "none" : "slide"}
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <SafeAreaView style={s.screen}>
          <View style={[s.row, { padding: 24 }]}>
            <Text style={[s.section, { flex: 1 }]}>
              What your profile shares
            </Text>
            <Button
              variant="ghost"
              size="content"
              accessibilityLabel="Close sharing preferences"
              onPress={onClose}
              style={s.iconButton}
            >
              <X color={colors.ink} size={22} />
            </Button>
          </View>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 32,
              gap: 24,
            }}
          >
            <Text style={s.muted}>
              Choose once. Kavanah creates simple updates from your completed
              prayers. You never need to write a post.
            </Text>
            <View style={{ gap: 12 }}>
              <Text style={s.heading}>Prayer updates</Text>
              <View accessibilityRole="radiogroup" style={s.options}>
                {modes.map((mode) => (
                  <Button
                    key={mode.id}
                    variant="ghost"
                    size="content"
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: preferences.prayers === mode.id,
                    }}
                    onPress={() =>
                      setPreferences({ ...preferences, prayers: mode.id })
                    }
                    style={[
                      s.option,
                      preferences.prayers === mode.id && s.selectedOption,
                    ]}
                  >
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={s.label}>{mode.title}</Text>
                      <Text style={s.small}>{mode.detail}</Text>
                    </View>
                    <View
                      style={[
                        s.radio,
                        preferences.prayers === mode.id && {
                          backgroundColor: colors.blue,
                          borderColor: colors.blue,
                        },
                      ]}
                    >
                      {preferences.prayers === mode.id && (
                        <Check size={16} color={colors.parchment} />
                      )}
                    </View>
                  </Button>
                ))}
              </View>
            </View>
            <View style={s.milestoneOption}>
              <View style={{ flex: 1, gap: 7 }}>
                <Text style={s.heading}>Streak milestones</Text>
                <Text style={s.small}>
                  Celebrate 3, 7, 18, 40, and 100 days of returning.
                </Text>
              </View>
              <Switch
                accessibilityLabel="Share streak milestones"
                value={preferences.milestones}
                onValueChange={(milestones) =>
                  setPreferences({ ...preferences, milestones })
                }
                trackColor={{ false: colors.mineral, true: colors.blue }}
                thumbColor={colors.white}
              />
            </View>
            <View style={s.rule}>
              <Sparkles size={19} color={colors.blue} />
              <Text style={[s.muted, { flex: 1 }]}>
                Only new completions create updates. Changing these choices
                never posts your past activity.
              </Text>
            </View>
            <Text style={s.small}>
              Weekly quotes are always your choice. Select exact words in a
              prayer; captions and free-form posts are not part of Circle.
            </Text>
          </ScrollView>
          <View style={{ padding: 24, paddingTop: 12 }}>
            <Button size="content" onPress={onClose} style={s.primary}>
              <Text style={s.primaryText}>Done</Text>
            </Button>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
const ActivityCard = memo(function ActivityCard({ post }: { post: FeedPost }) {
  const router = useRouter();
  const removePost = useSocialStore((s) => s.removePost);
  const quote = post.kind === "quote";
  return (
    <View style={s.activity}>
      <View style={s.row}>
        <View style={s.activityIcon}>
          {quote ? (
            <Quote size={18} color={colors.blue} />
          ) : post.kind === "milestone" ? (
            <Sparkles size={18} color={colors.blue} />
          ) : (
            <BookOpen size={18} color={colors.inkMuted} />
          )}
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={s.label}>
            {quote
              ? "Quote of the week"
              : post.kind === "milestone"
                ? `${post.streak} days of practice`
                : "A moment for prayer"}
          </Text>
          <Text style={s.small}>
            {new Date(post.createdAt).toLocaleDateString([], {
              month: "short",
              day: "numeric",
            })}
            {quote ? " · Chosen by you" : " · Automatic"}
          </Text>
        </View>
        <Button
          variant="ghost"
          size="content"
          style={s.iconButton}
          accessibilityLabel={`Remove ${post.practice} update`}
          onPress={() => removePost(post.id)}
        >
          <X size={16} color={colors.inkMuted} />
        </Button>
      </View>
      {quote && (
        <Text
          style={[
            s.activityQuote,
            post.language === "he" && {
              writingDirection: "rtl",
              textAlign: "right",
              fontFamily: fonts.hebrew,
            },
          ]}
        >
          {post.quote}
        </Text>
      )}
      <Button
        variant="ghost"
        size="content"
        onPress={() =>
          router.push({
            pathname: "/prayer",
            params: { prayerId: post.prayerId },
          })
        }
        style={s.postSource}
      >
        <Text style={[s.muted, { flex: 1 }]}>
          {post.practice}
          {quote && post.sourceRef ? `\n${post.sourceRef}` : ""}
        </Text>
        <ChevronRight size={16} color={colors.inkMuted} />
      </Button>
    </View>
  );
});
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parchment },
  content: {
    padding: 24,
    paddingTop: 12,
    paddingBottom: 32,
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 38,
    lineHeight: 46,
    color: colors.ink,
  },
  section: {
    fontFamily: fonts.semibold,
    fontSize: 21,
    lineHeight: 28,
    color: colors.ink,
  },
  heading: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.ink,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  muted: { fontSize: 14, lineHeight: 22, color: colors.inkMuted },
  small: { fontSize: 12, lineHeight: 18, color: colors.inkMuted },
  iconButton: {
    width: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  intro: { gap: 18 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.mineral,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { color: colors.ink, fontSize: 14, fontFamily: fonts.semibold },
  settingsRow: {
    padding: 16,
    backgroundColor: colors.vellum,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quoteCard: {
    backgroundColor: colors.blueSoft,
    borderRadius: 24,
    padding: 22,
    gap: 16,
  },
  quoteLabel: { color: "#C3CAFF", fontSize: 13, lineHeight: 20 },
  quoteTitle: {
    color: colors.ink,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 28,
    lineHeight: 36,
  },
  quoteDescription: { color: "#C2C7D5", fontSize: 14, lineHeight: 22 },
  quoteAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 48,
    backgroundColor: "#363C55",
    borderRadius: 14,
    padding: 10,
  },
  quoteFootnote: { color: "#C2C7D5", fontSize: 11, lineHeight: 17 },
  empty: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.blueSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  primary: {
    backgroundColor: colors.blue,
    borderRadius: 16,
    minHeight: 50,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: colors.parchment,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 22,
  },
  notice: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairlineStrong,
    flexDirection: "row",
    gap: 10,
  },
  options: { gap: 10 },
  option: {
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    backgroundColor: colors.vellum,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  selectedOption: {
    backgroundColor: colors.blueSoft,
    borderColor: colors.blue,
  },
  radio: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: colors.inkMuted,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  rule: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  activity: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.vellum,
    gap: 14,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mineral,
    alignItems: "center",
    justifyContent: "center",
  },
  activityQuote: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 23,
    lineHeight: 33,
    color: colors.ink,
  },
  postSource: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
  },
});
