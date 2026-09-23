import { BrandWordmark } from "@/components/BrandMark";
import { CircleLoadingIndicator } from "@/components/molecules/circle-loader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { Check, ImagePlus, Share, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import { Button } from "@/components/ui/button";
import { colors, grid } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { confirmHaptic, successHaptic, tapHaptic } from "@/services/haptics";
import type { StreakHabit } from "@/store/streakStore";

export type PracticeStoryMoment = {
  habit?: StreakHabit;
  prayerTitle?: string;
  streak: number;
  completedAt: Date;
};

type StoryLayout = "focus" | "quiet" | "light";

type Props = {
  moment: PracticeStoryMoment | null;
  onClose: () => void;
};

const practiceCopy: Record<
  StreakHabit,
  { title: string; subtitle: string; eyebrow: string }
> = {
  shacharit: {
    title: "Morning prayer",
    subtitle: "Made space for Shacharit",
    eyebrow: "Morning practice",
  },
  mincha: {
    title: "Afternoon prayer",
    subtitle: "Paused for Mincha",
    eyebrow: "Afternoon practice",
  },
  maariv: {
    title: "Evening prayer",
    subtitle: "Closed the day with Maariv",
    eyebrow: "Evening practice",
  },
  tefillin: {
    title: "Tefillin",
    subtitle: "Wrapped with intention",
    eyebrow: "Morning practice",
  },
  study: {
    title: "Daily learning",
    subtitle: "Made time to learn",
    eyebrow: "Daily practice",
  },
};

const layoutOptions: { id: StoryLayout; label: string }[] = [
  { id: "focus", label: "Focus" },
  { id: "quiet", label: "Quiet" },
  { id: "light", label: "Light" },
];

export function PracticeStoryComposer({
  moment,
  onClose,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const storyRef = useRef<View>(null);
  const [layout, setLayout] = useState<StoryLayout>("focus");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoReady, setPhotoReady] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState("");
  const reduceMotion = useReducedMotion();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const previewWidth = Math.min(
    windowWidth - grid.margin * 2,
    windowHeight < 760 ? 232 : windowHeight < 900 ? 276 : 336,
  );

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
      quality: 0.92,
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
        result: "tmpfile",
      });
      await Sharing.shareAsync(uri, {
        dialogTitle: "Share your Kavanah moment",
        mimeType: "image/png",
        UTI: "public.png",
      });
      await successHaptic();
    } catch (shareError) {
      setError(
        shareError instanceof Error
          ? shareError.message
          : "This story could not be prepared.",
      );
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
      <View
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        className="flex-1 bg-background"
      >
        {moment ? (
          <View className="flex-1">
            <View className="px-6 py-3 flex-row items-center gap-3">
              <Button
                variant="outline"
                size="content"
                accessibilityLabel="Close story composer"
                accessibilityRole="button"
                haptic="selection"
                onPress={close}
                pressedScale={0.94}
                className="w-11 h-11 rounded-md items-center justify-center bg-card border border-hairline"
              >
                <X size={18} color={colors.ink} />
              </Button>
              <View className="flex-1 gap-[2px]">
                <Text variant="section">Share your practice</Text>
                <Text variant="body" className="text-[13px] leading-[18px]">
                  A private photo becomes a story-ready image.
                </Text>
              </View>
            </View>

            <ScrollView
              contentContainerClassName="px-6 pb-6 gap-4"
              showsVerticalScrollIndicator={false}
            >
              <View
                className="aspect-[0.5625] self-center rounded-xl overflow-hidden bg-foreground shadow-card"
                style={[{ width: previewWidth }]}
              >
                <View ref={storyRef} collapsable={false} className="flex-1">
                  <StoryArtwork
                    layout={layout}
                    moment={moment}
                    photoUri={photoUri}
                    onPhotoReady={() => setPhotoReady(true)}
                    onPhotoError={() => {
                      setPhotoReady(true);
                      setError(
                        "This photo could not be opened. Choose another photo to continue.",
                      );
                    }}
                  />
                </View>
              </View>

              <Tabs
                value={layout}
                onValueChange={(value) => {
                  if (
                    value === "focus" ||
                    value === "quiet" ||
                    value === "light"
                  ) {
                    void tapHaptic();
                    setLayout(value);
                  }
                }}
              >
                <TabsList
                  accessibilityLabel="Story layout"
                  className="mr-0 h-12 w-full"
                >
                  {layoutOptions.map((option) => (
                    <TabsTrigger
                      key={option.id}
                      value={option.id}
                      className="h-full flex-1"
                    >
                      <Text>{option.label}</Text>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <View className="flex-row items-start gap-2 px-1">
                <Check size={15} color={colors.olive} />
                <Text className="text-[12px] leading-[16px] font-medium tracking-normal flex-1 text-muted-foreground font-label">
                  Your photo stays on this device. Kavanah adds no name, prayer
                  text, or location.
                </Text>
              </View>

              {error ? (
                <Text
                  accessibilityRole="alert"
                  className="text-[12px] leading-[16px] font-medium tracking-normal text-danger px-1 font-label"
                >
                  {error}
                </Text>
              ) : null}
            </ScrollView>

            <View className="px-6 pt-2 pb-2 flex-row gap-3 border-t border-t-hairline bg-glass">
              <View className="flex-1">
                <Button
                  variant="outline"
                  size="content"
                  accessibilityRole="button"
                  haptic="selection"
                  onPress={() => void choosePhoto()}
                  className="w-full min-h-[50px] rounded-md flex-row items-center justify-center gap-2 bg-card border border-hairlineStrong"
                >
                  <ImagePlus size={18} color={colors.ink} />
                  <Text
                    numberOfLines={1}
                    className="font-heading text-[14px] leading-[19px] text-foreground"
                  >
                    {photoUri ? "Change photo" : "Choose photo"}
                  </Text>
                </Button>
              </View>
              <View className="flex-1">
                <Button
                  variant="default"
                  size="content"
                  accessibilityRole="button"
                  disabled={!photoReady}
                  isLoading={isSharing}
                  loadingLabel="Preparing"
                  haptic="confirm"
                  onPress={() => void shareStory()}
                  className={cn(
                    "w-full min-h-[50px] rounded-md flex-row items-center justify-center gap-2 bg-primary",
                    !photoReady && "opacity-[0.5]",
                  )}
                >
                  {!photoReady ? (
                    <CircleLoadingIndicator
                      dotColor={colors.white}
                      dotRadius={2.5}
                      dotSpacing={4}
                    />
                  ) : (
                    <Share size={18} color={colors.white} />
                  )}
                  <Text className="text-[16px] leading-[22px] font-semibold tracking-normal text-white font-heading">
                    Share
                  </Text>
                </Button>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function StoryArtwork({
  layout,
  moment,
  photoUri,
  onPhotoReady,
  onPhotoError,
}: {
  layout: StoryLayout;
  moment: PracticeStoryMoment;
  photoUri: string | null;
  onPhotoReady: () => void;
  onPhotoError: () => void;
}): React.JSX.Element {
  const copy = moment.habit
    ? practiceCopy[moment.habit]
    : {
        title: moment.prayerTitle ?? "Prayer",
        subtitle: "Prayed with intention",
        eyebrow: "Prayer complete",
      };
  const date = moment.completedAt.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const streak =
    moment.streak > 0
      ? `${moment.streak} day${moment.streak === 1 ? "" : "s"}`
      : "Today";
  const light = layout === "light";

  return (
    <View
      className={cn(
        "flex-1 relative overflow-hidden",
        light ? "bg-background" : "bg-primary",
      )}
    >
      {photoUri ? (
        <Image
          onError={onPhotoError}
          onLoadEnd={onPhotoReady}
          resizeMode="cover"
          source={{ uri: photoUri }}
          className={
            layout === "light"
              ? "absolute top-0 left-0 right-0 w-full h-[57%]"
              : "absolute left-0 right-0 top-0 bottom-0 w-full h-full"
          }
        />
      ) : null}
      {!light ? (
        <View
          className={cn(
            "absolute left-0 right-0 top-0 bottom-0 bg-[rgba(11,26,59,0.44)]",
            layout === "quiet" && "bg-[rgba(11,26,59,0.28)]",
          )}
        />
      ) : null}

      <View
        className={cn(
          "absolute top-[5.5%] left-[7%] flex-row items-center gap-[7px]",
          light && "top-[4.5%]",
        )}
      >
        <BrandWordmark width={92} inverted={!light || Boolean(photoUri)} />
      </View>

      {layout === "focus" ? (
        <View className="absolute left-[7%] right-[7%] bottom-[7.5%]">
          <View className="w-[3px] h-[42px] bg-primary mb-[18px]" />
          <Text className="font-heading text-[10px] leading-[14px] text-[rgba(255,255,255,0.74)]">
            {copy.eyebrow}
          </Text>
          <Text className="font-heading text-[43px] leading-[47px] text-white mt-[5px]">
            {copy.title}
          </Text>
          <Text className="font-body text-[15px] leading-[21px] text-[rgba(255,255,255,0.82)] mt-2">
            {copy.subtitle}
          </Text>
          <View className="flex-row items-center gap-[17px] mt-[30px]">
            <View>
              <Text className="font-heading text-[14px] leading-[19px] text-white">
                {streak}
              </Text>
              <Text className="font-label text-[8px] leading-[11px] text-[rgba(255,255,255,0.56)] mt-[2px]">
                in practice
              </Text>
            </View>
            <View className="w-[1px] h-9 bg-[rgba(255,255,255,0.24)]" />
            <View>
              <Text className="font-heading text-[14px] leading-[19px] text-white">
                {date}
              </Text>
              <Text className="font-label text-[8px] leading-[11px] text-[rgba(255,255,255,0.56)] mt-[2px]">
                this moment
              </Text>
            </View>
          </View>
        </View>
      ) : null}

      {layout === "quiet" ? (
        <View className="flex-1 px-[7%] pt-[19%] pb-[7.5%] justify-between">
          <Text className="font-label text-[11px] leading-[15px] text-[rgba(255,255,255,0.75)]">
            {date}
          </Text>
          <Text className="self-center font-heading text-[48px] leading-[54px] text-white text-center">
            {copy.title}
          </Text>
          <View className="gap-2">
            <View className="w-8 h-[2px] bg-primary mb-[5px]" />
            <Text className="font-label text-[15px] leading-[21px] text-white">
              {copy.subtitle}
            </Text>
            <Text className="font-body text-[11px] leading-[16px] text-[rgba(255,255,255,0.64)]">
              {streak} in practice
            </Text>
          </View>
        </View>
      ) : null}

      {layout === "light" ? (
        <View className="absolute left-[7%] right-[7%] top-[63%] bottom-[6%]">
          <Text
            className={cn(
              "font-heading text-[10px] leading-[14px] text-[rgba(255,255,255,0.74)]",
              "text-primary",
            )}
          >
            {copy.eyebrow}
          </Text>
          <Text
            className={cn(
              "font-heading text-[36px] leading-[41px] mt-1",
              "text-foreground",
            )}
          >
            {copy.title}
          </Text>
          <Text className="font-body text-[14px] leading-[20px] text-muted-foreground mt-[5px]">
            {copy.subtitle}
          </Text>
          <View className="mt-auto pt-3 border-t border-t-hairline flex-row justify-between gap-3">
            <Text className="flex-1 font-heading text-[11px] leading-[15px] text-foreground">
              {streak} in practice
            </Text>
            <Text className="font-label text-[10px] leading-[15px] text-muted-foreground">
              {date}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
