import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { BookOpenText, Check, ImagePlus, Share, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Body, SectionTitle } from "@/components/Text";
import { colors, fonts, grid, radii, shadows, spacing, type } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { confirmHaptic, successHaptic } from "@/services/haptics";
import type { StreakHabit } from "@/store/streakStore";

export type PracticeStoryMoment = {
  habit: StreakHabit;
  streak: number;
  completedAt: Date;
};

type StoryLayout = "focus" | "quiet" | "light";

type Props = {
  moment: PracticeStoryMoment | null;
  onClose: () => void;
};

const practiceCopy: Record<StreakHabit, { title: string; subtitle: string; eyebrow: string }> = {
  shacharit: { title: "Morning prayer", subtitle: "Made space for Shacharit", eyebrow: "Morning practice" },
  mincha: { title: "Afternoon prayer", subtitle: "Paused for Mincha", eyebrow: "Afternoon practice" },
  maariv: { title: "Evening prayer", subtitle: "Closed the day with Maariv", eyebrow: "Evening practice" },
  tefillin: { title: "Tefillin", subtitle: "Wrapped with intention", eyebrow: "Morning practice" },
  study: { title: "Daily learning", subtitle: "Made time to learn", eyebrow: "Daily practice" }
};

const layoutOptions: { id: StoryLayout; label: string }[] = [
  { id: "focus", label: "Focus" },
  { id: "quiet", label: "Quiet" },
  { id: "light", label: "Light" }
];

export function PracticeStoryComposer({ moment, onClose }: Props): React.JSX.Element {
  const storyRef = useRef<View>(null);
  const [layout, setLayout] = useState<StoryLayout>("focus");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoReady, setPhotoReady] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState("");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (moment) {
      setLayout("focus");
      setPhotoUri(null);
      setPhotoReady(true);
      setError("");
    }
  }, [moment]);

  const choosePhoto = async () => {
    setError("");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.92
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoReady(false);
      setPhotoUri(result.assets[0].uri);
      void confirmHaptic();
    }
  };

  const shareStory = async () => {
    const storyView = storyRef.current;
    if (!storyView || !moment || isSharing || !photoReady) return;
    setError("");
    setIsSharing(true);

    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error("Sharing is not available on this device.");
      }
      const uri = await captureRef(storyView, {
        format: "png",
        quality: 1,
        width: 1080,
        height: 1920,
        result: "tmpfile"
      });
      await Sharing.shareAsync(uri, {
        dialogTitle: "Share your Kavanah moment",
        mimeType: "image/png",
        UTI: "public.png"
      });
      await successHaptic();
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : "This story could not be prepared.");
    } finally {
      setIsSharing(false);
    }
  };

  const close = () => {
    onClose();
  };

  return (
    <Modal
      animationType={reduceMotion ? "none" : "slide"}
      onRequestClose={close}
      onShow={() => void confirmHaptic()}
      presentationStyle="fullScreen"
      visible={moment !== null}
    >
      <SafeAreaView style={styles.safeArea}>
        {moment ? (
          <View style={styles.root}>
            <View style={styles.header}>
              <AnimatedPressable accessibilityLabel="Close story composer" accessibilityRole="button" haptic="selection" onPress={close} pressedScale={0.94} style={styles.iconButton}>
                <X size={18} color={colors.ink} />
              </AnimatedPressable>
              <View style={styles.headerCopy}>
                <SectionTitle>Share your practice</SectionTitle>
                <Body style={styles.headerBody}>A private photo becomes a story-ready image.</Body>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.previewFrame}>
                <View ref={storyRef} collapsable={false} style={styles.storyCapture}>
                  <StoryArtwork
                    layout={layout}
                    moment={moment}
                    photoUri={photoUri}
                    onPhotoReady={() => setPhotoReady(true)}
                    onPhotoError={() => {
                      setPhotoReady(true);
                      setError("This photo could not be opened. Choose another photo to continue.");
                    }}
                  />
                </View>
              </View>

              <View accessibilityLabel="Story layout" style={styles.layoutPicker}>
                {layoutOptions.map((option) => {
                  const selected = layout === option.id;
                  return (
                    <AnimatedPressable
                      key={option.id}
                      accessibilityRole="tab"
                      accessibilityState={{ selected }}
                      haptic="selection"
                      onPress={() => setLayout(option.id)}
                      pressedScale={0.97}
                      style={[styles.layoutOption, selected && styles.layoutOptionSelected]}
                    >
                      <Text style={[styles.layoutOptionText, selected && styles.layoutOptionTextSelected]}>{option.label}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>

              <View style={styles.privacyNote}>
                <Check size={15} color={colors.olive} />
                <Text style={styles.privacyText}>Your photo stays on this device. Kavanah adds no name, prayer text, or location.</Text>
              </View>

              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            </ScrollView>

            <View style={styles.actions}>
              <AnimatedPressable accessibilityRole="button" haptic="selection" onPress={() => void choosePhoto()} style={styles.photoButton}>
                <ImagePlus size={18} color={colors.ink} />
                <Text style={styles.photoButtonText}>{photoUri ? "Change photo" : "Choose photo"}</Text>
              </AnimatedPressable>
              <AnimatedPressable
                accessibilityRole="button"
                disabled={isSharing || !photoReady}
                haptic="confirm"
                onPress={() => void shareStory()}
                style={[styles.shareButton, (isSharing || !photoReady) && styles.disabled]}
              >
                {isSharing || !photoReady ? <ActivityIndicator color={colors.white} size="small" /> : <Share size={18} color={colors.white} />}
                <Text style={styles.shareButtonText}>{isSharing ? "Preparing" : "Share"}</Text>
              </AnimatedPressable>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

function StoryArtwork({
  layout,
  moment,
  photoUri,
  onPhotoReady,
  onPhotoError
}: {
  layout: StoryLayout;
  moment: PracticeStoryMoment;
  photoUri: string | null;
  onPhotoReady: () => void;
  onPhotoError: () => void;
}): React.JSX.Element {
  const copy = practiceCopy[moment.habit];
  const date = moment.completedAt.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
  const streak = moment.streak > 0 ? `${moment.streak} day${moment.streak === 1 ? "" : "s"}` : "Today";
  const light = layout === "light";

  return (
    <View style={[styles.story, light ? styles.storyLight : styles.storyDark]}>
      {photoUri ? (
        <Image onError={onPhotoError} onLoadEnd={onPhotoReady} resizeMode="cover" source={{ uri: photoUri }} style={layout === "light" ? styles.lightPhoto : styles.fullPhoto} />
      ) : null}
      {!light ? <View style={[styles.photoWash, layout === "quiet" && styles.photoWashQuiet]} /> : null}

      <View style={[styles.storyBrand, light && styles.storyBrandLight]}>
        <BookOpenText color={light && !photoUri ? colors.ink : colors.white} size={16} strokeWidth={2.1} />
        <Text style={[styles.storyBrandText, light && !photoUri && styles.darkText]}>Kavanah</Text>
      </View>

      {layout === "focus" ? (
        <View style={styles.focusContent}>
          <View style={styles.focusRule} />
          <Text style={styles.storyEyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.focusTitle}>{copy.title}</Text>
          <Text style={styles.focusSubtitle}>{copy.subtitle}</Text>
          <View style={styles.storyMetrics}>
            <View>
              <Text style={styles.metricValue}>{streak}</Text>
              <Text style={styles.metricLabel}>in practice</Text>
            </View>
            <View style={styles.metricDivider} />
            <View>
              <Text style={styles.metricValue}>{date}</Text>
              <Text style={styles.metricLabel}>this moment</Text>
            </View>
          </View>
        </View>
      ) : null}

      {layout === "quiet" ? (
        <View style={styles.quietContent}>
          <Text style={styles.quietDate}>{date}</Text>
          <Text style={styles.quietTitle}>{copy.title}</Text>
          <View style={styles.quietFooter}>
            <View style={styles.quietRule} />
            <Text style={styles.quietSubtitle}>{copy.subtitle}</Text>
            <Text style={styles.quietStreak}>{streak} in practice</Text>
          </View>
        </View>
      ) : null}

      {layout === "light" ? (
        <View style={styles.lightContent}>
          <Text style={[styles.storyEyebrow, styles.blueText]}>{copy.eyebrow}</Text>
          <Text style={[styles.lightTitle, styles.darkText]}>{copy.title}</Text>
          <Text style={styles.lightSubtitle}>{copy.subtitle}</Text>
          <View style={styles.lightFooter}>
            <Text style={styles.lightMetric}>{streak} in practice</Text>
            <Text style={styles.lightDate}>{date}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.parchment },
  root: { flex: 1 },
  header: {
    paddingHorizontal: grid.margin,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  iconButton: {
    width: grid.touch,
    height: grid.touch,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.vellum,
    borderWidth: 1,
    borderColor: colors.hairline
  },
  headerCopy: { flex: 1, gap: 2 },
  headerBody: { fontSize: 13, lineHeight: 18 },
  scrollContent: { paddingHorizontal: grid.margin, paddingBottom: spacing.xl, gap: spacing.lg },
  previewFrame: {
    width: "100%",
    maxWidth: 348,
    aspectRatio: 9 / 16,
    alignSelf: "center",
    borderRadius: radii.xl,
    overflow: "hidden",
    backgroundColor: colors.ink,
    ...shadows.card
  },
  storyCapture: { flex: 1 },
  story: { flex: 1, position: "relative", overflow: "hidden" },
  storyDark: { backgroundColor: colors.ink },
  storyLight: { backgroundColor: colors.vellum },
  fullPhoto: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  lightPhoto: { position: "absolute", top: 0, left: 0, right: 0, width: "100%", height: "57%" },
  photoWash: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(8, 12, 10, 0.44)" },
  photoWashQuiet: { backgroundColor: "rgba(8, 12, 10, 0.28)" },
  storyBrand: {
    position: "absolute",
    top: "5.5%",
    left: "7%",
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  storyBrandLight: { top: "4.5%" },
  storyBrandText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 13,
    color: colors.white
  },
  darkText: { color: colors.ink },
  blueText: { color: colors.blue },
  storyEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.74)"
  },
  focusContent: { position: "absolute", left: "7%", right: "7%", bottom: "7.5%" },
  focusRule: { width: 3, height: 42, backgroundColor: colors.blue, marginBottom: 18 },
  focusTitle: { fontFamily: fonts.semibold, fontSize: 43, lineHeight: 47, color: colors.white, marginTop: 5 },
  focusSubtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: "rgba(255,255,255,0.82)", marginTop: 8 },
  storyMetrics: { flexDirection: "row", alignItems: "center", gap: 17, marginTop: 30 },
  metricDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.24)" },
  metricValue: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19, color: colors.white },
  metricLabel: { fontFamily: fonts.medium, fontSize: 8, lineHeight: 11, color: "rgba(255,255,255,0.56)", marginTop: 2 },
  quietContent: { flex: 1, paddingHorizontal: "7%", paddingTop: "19%", paddingBottom: "7.5%", justifyContent: "space-between" },
  quietDate: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 15, color: "rgba(255,255,255,0.75)" },
  quietTitle: { alignSelf: "center", fontFamily: fonts.semibold, fontSize: 48, lineHeight: 54, color: colors.white, textAlign: "center" },
  quietFooter: { gap: 8 },
  quietRule: { width: 32, height: 2, backgroundColor: colors.blue, marginBottom: 5 },
  quietSubtitle: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, color: colors.white },
  quietStreak: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, color: "rgba(255,255,255,0.64)" },
  lightContent: { position: "absolute", left: "7%", right: "7%", top: "63%", bottom: "6%" },
  lightTitle: { fontFamily: fonts.semibold, fontSize: 36, lineHeight: 41, marginTop: 4 },
  lightSubtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.inkMuted, marginTop: 5 },
  lightFooter: { marginTop: "auto", paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.hairline, flexDirection: "row", justifyContent: "space-between", gap: 12 },
  lightMetric: { flex: 1, fontFamily: fonts.semibold, fontSize: 11, lineHeight: 15, color: colors.ink },
  lightDate: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 15, color: colors.inkMuted },
  layoutPicker: {
    height: 46,
    flexDirection: "row",
    padding: 3,
    borderRadius: radii.md,
    backgroundColor: colors.mineral
  },
  layoutOption: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: radii.sm },
  layoutOptionSelected: { backgroundColor: colors.vellum, ...shadows.pressed },
  layoutOptionText: { ...type.caption, color: colors.inkMuted },
  layoutOptionTextSelected: { color: colors.ink },
  privacyNote: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, paddingHorizontal: spacing.xs },
  privacyText: { ...type.caption, flex: 1, color: colors.inkMuted, lineHeight: 18 },
  error: { ...type.caption, color: colors.danger, paddingHorizontal: spacing.xs },
  actions: {
    paddingHorizontal: grid.margin,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.glass
  },
  photoButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.vellum,
    borderWidth: 1,
    borderColor: colors.hairlineStrong
  },
  photoButtonText: { ...type.body, fontWeight: "600", color: colors.ink },
  shareButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: radii.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.blue
  },
  shareButtonText: { ...type.body, fontWeight: "600", color: colors.white },
  disabled: { opacity: 0.5 }
});
