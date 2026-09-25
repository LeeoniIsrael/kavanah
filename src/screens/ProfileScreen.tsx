import { SectionHeading } from "@/components/ui/section-heading";
import { BouncyAccordion } from "@/components/ui/bouncy-accordion";
import { Card } from "@/components/ui/card";
import { ChoiceRow } from "@/components/ui/choice-row";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { useAppearanceStore, useThemeColors } from "@/design/appearance";
import { cn } from "@/lib/utils";
import {
  Bell,
  Check,
  ChevronRight,
  Languages,
  LockKeyhole,
  MoonStar,
  Navigation,
  ShieldCheck,
  MessageCircle,
  UserRound,
  X,
} from "@/components/ui/icons";
import { useState } from "react";
import { Modal, ScrollView, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui/button";
import { GooeyInfoPopover } from "@/components/ui/gooey-popover";
import { findLanguage, languageOptions } from "@/data/languages";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { confirmHaptic } from "@/services/haptics";
import {
  cancelTravelPrayerNotification,
  initializeNotifications,
  scheduleZmanNotifications,
} from "@/services/notifications";
import {
  getPrayerFocusSetup,
  openPrayerFocusSetup,
} from "@/services/prayerFocus";
import { useAuthStore } from "@/store/authStore";
import {
  CURRENT_ASSISTANT_CONSENT_VERSION,
  useSettingsStore,
} from "@/store/settingsStore";
import { useSocialStore } from "@/store/socialStore";
import { useZmanimStore } from "@/store/zmanimStore";

type ProfileModal = "focus" | "language" | "privacy" | "social" | null;

export function ProfileScreen(): React.JSX.Element {
  const colors = useThemeColors();
  const { preference, setPreference } = useAppearanceStore();

  const insets = useSafeAreaInsets();
  const { biometricLockEnabled, setBiometricLockEnabled } = useAuthStore();
  const { profile, saveProfile } = useSocialStore();
  const {
    primaryLanguageCode,
    assistantConsentVersion,
    zmanNotificationsEnabled,
    travelNotificationsEnabled,
    prayerFocusEnabled,
    setPrimaryLanguageCode,
    setAssistantConsent,
    setZmanNotificationsEnabled,
    setTravelNotificationsEnabled,
    setPrayerFocusEnabled,
  } = useSettingsStore();
  const [activeModal, setActiveModal] = useState<ProfileModal>(null);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [travelNotificationMessage, setTravelNotificationMessage] =
    useState("");
  const [focusSetupMessage, setFocusSetupMessage] = useState("");
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [handle, setHandle] = useState(profile?.handle.replace(/^@/, "") ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [profilePrivate, setProfilePrivate] = useState(
    profile?.isPrivate ?? true,
  );
  const sharingPreferences = useSocialStore((state) => state.preferences);
  const reduceMotion = useReducedMotion();
  const primaryLanguage = findLanguage(primaryLanguageCode);
  const assistantEnabled =
    assistantConsentVersion === CURRENT_ASSISTANT_CONSENT_VERSION;
  const focusSetup = getPrayerFocusSetup();

  const openFocusSetup = async () => {
    const opened = await openPrayerFocusSetup();
    setFocusSetupMessage(
      opened
        ? "Finish the setup there, then return to Kavanah."
        : "Open your device settings and choose Focus or Do Not Disturb.",
    );
  };

  const changeNotifications = async (enabled: boolean) => {
    void confirmHaptic();
    if (!enabled) {
      setZmanNotificationsEnabled(false);
      setNotificationMessage("");
      return;
    }
    setZmanNotificationsEnabled(true);
    setNotificationMessage("Turning on local reminders…");
    const granted = await initializeNotifications();
    setZmanNotificationsEnabled(granted);
    setNotificationMessage(
      granted
        ? "Reminders will follow your calculated local times."
        : "Notifications are disabled in device settings.",
    );
    if (granted) {
      const { upcomingZmanim, refresh } = useZmanimStore.getState();
      if (upcomingZmanim.length > 0) {
        await scheduleZmanNotifications(upcomingZmanim);
      } else {
        await refresh();
      }
    }
  };

  const changeTravelNotifications = async (enabled: boolean) => {
    void confirmHaptic();
    if (!enabled) {
      await cancelTravelPrayerNotification();
      setTravelNotificationsEnabled(false);
      setTravelNotificationMessage("");
      return;
    }

    setTravelNotificationsEnabled(true);
    setTravelNotificationMessage("Turning on travel reminders…");
    const granted = await initializeNotifications();
    setTravelNotificationsEnabled(granted);
    setTravelNotificationMessage(
      granted
        ? "Ready for reminders you start from Home or a Shortcut."
        : "Notifications are disabled in device settings.",
    );
  };

  return (
    <Screen
      largeTitle="Profile"
      subtitle={
        profile?.bio ||
        "Make a profile, choose what people can see, and practice with your circle."
      }
    >
      <View style={{ gap: 12 }}>
        <SectionHeading title="Appearance" />
        <View
          accessibilityRole="radiogroup"
          style={{
            flexDirection: "row",
            gap: 6,
            backgroundColor: colors.mineral,
            borderRadius: 20,
            padding: 5,
          }}
        >
          {(["system", "light", "dark"] as const).map((mode) => (
            <Button
              key={mode}
              variant="ghost"
              size="content"
              haptic="selection"
              accessibilityRole="radio"
              accessibilityState={{ checked: preference === mode }}
              onPress={() => setPreference(mode)}
              style={{
                flex: 1,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
                backgroundColor:
                  preference === mode ? colors.blue : "transparent",
              }}
            >
              <Text
                style={{
                  color: preference === mode ? colors.onAccent : colors.ink,
                }}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </Button>
          ))}
        </View>
        <Text variant="caption">
          {preference === "system"
            ? "Follows your device’s appearance."
            : preference === "light"
              ? "A little light. Room to breathe."
              : "Quiet surroundings. Space to focus."}
        </Text>
      </View>
      <Button
        variant="ghost"
        size="content"
        accessibilityRole="button"
        onPress={() => setActiveModal("social")}
        className="min-h-[92px] p-5 rounded-lg bg-card flex-row items-center gap-4"
      >
        <View className="w-14 h-14 rounded-full bg-blueSoft items-center justify-center">
          {profile ? (
            <Text className="text-foreground font-heading text-[20px]">
              {profile.displayName.charAt(0).toUpperCase()}
            </Text>
          ) : (
            <UserRound size={24} color={colors.ink} />
          )}
        </View>
        <View className="flex-1 gap-1">
          <Text variant="section">
            {profile ? "Edit social profile" : "Create your profile"}
          </Text>
          <Text variant="body" className="text-[14px] leading-[22px]">
            {profile
              ? `${profile.handle} · ${profile.isPrivate ? "Private" : "Visible to your circle"}`
              : "Add a name, handle, bio, and privacy choice."}
          </Text>
        </View>
        <ChevronRight size={16} color={colors.inkMuted} />
      </Button>

      <View className="z-20 min-h-[94px] p-5 flex-row items-center gap-3 rounded-lg bg-card">
        <GooeyInfoPopover
          accessibilityLabel="What stays on this device"
          title="Local by default"
          body="Prayer history, bookmarks, streaks, settings, and location calculations remain here unless you explicitly choose a connected feature."
          side="bottom"
          align="start"
          color={colors.blueSoft}
          triggerStyle={{
            alignItems: "center",
            backgroundColor: colors.blueSoft,
            borderRadius: 13,
            height: 44,
            justifyContent: "center",
            width: 44,
          }}
          trigger={<ShieldCheck size={20} color={colors.ink} />}
        />
        <View className="flex-1 gap-[2px]">
          <Text className="text-[17px] leading-[24px] font-semibold tracking-normal text-foreground font-heading">
            Local by default
          </Text>
          <Text className="text-[13px] leading-[20px] font-medium tracking-normal text-inkMuted font-label">
            Bookmarks, streaks, and location calculations stay on this device.
          </Text>
        </View>
      </View>

      <Card className="p-0 gap-0 overflow-hidden rounded-lg bg-card">
        <Button
          variant="ghost"
          size="content"
          accessibilityRole="button"
          onPress={() => setActiveModal("language")}
          className="min-h-[76px] rounded-none px-5 py-4 flex-row items-center gap-3 border-b border-b-hairline"
        >
          <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
            <Languages size={20} color={colors.blue} />
          </View>
          <View className="flex-1 gap-[2px]">
            <Text className="text-[17px] leading-[24px] font-semibold tracking-normal text-foreground font-heading">
              Primary language
            </Text>
            <Text className="text-[13px] leading-[20px] font-medium tracking-normal text-muted-foreground font-label">
              {primaryLanguage.name} · {primaryLanguage.nativeName}
            </Text>
          </View>
          <ChevronRight size={16} color={colors.inkMuted} />
        </Button>

        <View className="min-h-[76px] rounded-none px-5 py-4 flex-row items-center gap-3 border-b border-b-hairline">
          <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
            <Bell size={20} color={colors.blue} />
          </View>
          <View className="flex-1 gap-[2px]">
            <Text className="text-[17px] leading-[24px] font-semibold tracking-normal text-foreground font-heading">
              Zmanim reminders
            </Text>
            <Text className="text-[13px] leading-[20px] font-medium tracking-normal text-muted-foreground font-label">
              {notificationMessage ||
                "Alerts before selected local prayer times."}
            </Text>
          </View>
          <Switch
            accessibilityLabel="Zmanim reminders"
            checked={zmanNotificationsEnabled}
            onCheckedChange={(enabled) => void changeNotifications(enabled)}
          />
        </View>

        <View className="min-h-[76px] rounded-none px-5 py-4 flex-row items-center gap-3 border-b border-b-hairline">
          <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
            <Navigation size={20} color={colors.blue} />
          </View>
          <View className="flex-1 gap-[2px]">
            <Text className="text-[17px] leading-[24px] font-semibold tracking-normal text-foreground font-heading">
              Travel prayer reminders
            </Text>
            <Text className="text-[13px] leading-[20px] font-medium tracking-normal text-muted-foreground font-label">
              {travelNotificationMessage ||
                "For long trips you start from Home or a phone automation. Maps routes stay private."}
            </Text>
          </View>
          <Switch
            accessibilityLabel="Travel prayer reminders"
            checked={travelNotificationsEnabled}
            onCheckedChange={(enabled) =>
              void changeTravelNotifications(enabled)
            }
          />
        </View>

        <View className="min-h-[76px] rounded-none px-5 py-4 flex-row items-center gap-3 border-b border-b-hairline">
          <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
            <MoonStar size={20} color={colors.blue} />
          </View>
          <View className="flex-1 gap-[2px]">
            <Text className="text-[17px] leading-[24px] font-semibold tracking-normal text-foreground font-heading">
              Prayer Focus
            </Text>
            <Text className="text-[13px] leading-[20px] font-medium tracking-normal text-muted-foreground font-label">
              Pause before each prayer so you can quiet the phone.
            </Text>
          </View>
          <Switch
            accessibilityHint="Shows a quiet-phone prompt before each prayer"
            accessibilityLabel="Prayer Focus"
            checked={prayerFocusEnabled}
            onCheckedChange={(enabled) => {
              void confirmHaptic();
              setPrayerFocusEnabled(enabled);
              if (enabled) setActiveModal("focus");
            }}
          />
        </View>

        <View className="min-h-[76px] rounded-none px-5 py-4 flex-row items-center gap-3 border-b border-b-hairline">
          <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
            <LockKeyhole size={20} color={colors.blue} />
          </View>
          <View className="flex-1 gap-[2px]">
            <Text className="text-[17px] leading-[24px] font-semibold tracking-normal text-foreground font-heading">
              Biometric lock
            </Text>
            <Text className="text-[13px] leading-[20px] font-medium tracking-normal text-muted-foreground font-label">
              Lock Kavanah whenever the app leaves the foreground.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Biometric lock"
            checked={biometricLockEnabled}
            onCheckedChange={(enabled) => {
              void confirmHaptic();
              void setBiometricLockEnabled(enabled);
            }}
          />
        </View>

        <View className="min-h-[76px] rounded-none px-5 py-4 flex-row items-center gap-3 border-b border-b-hairline">
          <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
            <MessageCircle size={20} color={colors.blue} />
          </View>
          <View className="flex-1 gap-[2px]">
            <Text className="text-[17px] leading-[24px] font-semibold tracking-normal text-foreground font-heading">
              Prayer assistant
            </Text>
            <Text className="text-[13px] leading-[20px] font-medium tracking-normal text-muted-foreground font-label">
              Allow prayer questions to be processed by OpenAI through Kavanah.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Prayer assistant"
            checked={assistantEnabled}
            onCheckedChange={(enabled) => {
              void confirmHaptic();
              setAssistantConsent(enabled);
            }}
          />
        </View>

        <Button
          variant="ghost"
          size="content"
          accessibilityRole="button"
          onPress={() => setActiveModal("privacy")}
          className={cn(
            "min-h-[76px] rounded-none px-5 py-4 flex-row items-center gap-3 border-b border-b-hairline",
            "border-b-[0px]",
          )}
        >
          <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
            <ShieldCheck size={20} color={colors.blue} />
          </View>
          <View className="flex-1 gap-[2px]">
            <Text className="text-[17px] leading-[24px] font-semibold tracking-normal text-foreground font-heading">
              Privacy and data use
            </Text>
            <Text className="text-[13px] leading-[20px] font-medium tracking-normal text-muted-foreground font-label">
              What stays here and what leaves this device.
            </Text>
          </View>
          <ChevronRight size={16} color={colors.inkMuted} />
        </Button>
      </Card>

      <Text variant="body" className="text-[13px] leading-[20px] px-1">
        Account sync is unavailable until secure server verification and
        complete account deletion are ready.
      </Text>

      <Modal
        visible={activeModal !== null}
        animationType={reduceMotion ? "none" : "slide"}
        presentationStyle="fullScreen"
        onRequestClose={() => setActiveModal(null)}
      >
        <SafeAreaView className="flex-1 bg-background">
          <View
            className="absolute right-6 z-[10]"
            style={{ top: insets.top + 16 }}
            pointerEvents="box-none"
          >
            <Button
              variant="ghost"
              size="content"
              accessibilityLabel="Close"
              accessibilityRole="button"
              onPress={() => setActiveModal(null)}
              pressedScale={0.96}
              className="w-11 h-11 rounded-md items-center justify-center bg-card"
            >
              <X size={20} color={colors.ink} />
            </Button>
          </View>
          {activeModal === "language" ? (
            <ScrollView
              contentContainerClassName="px-6 pt-[72px] pb-12 gap-6"
              showsVerticalScrollIndicator={false}
            >
              <View className="gap-1 pr-12">
                <Text variant="caption">Language</Text>
                <Text variant="display" className="text-[34px] leading-[39px]">
                  Prayer text
                </Text>
                <Text variant="body">
                  Hebrew remains visible. Translation and transliteration follow
                  this choice.
                </Text>
              </View>
              <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
                {languageOptions.map((language) => (
                  <ChoiceRow
                    key={language.code}
                    title={language.name}
                    detail={language.nativeName}
                    selected={language.code === primaryLanguageCode}
                    onPress={() => {
                      setPrimaryLanguageCode(language.code);
                      setActiveModal(null);
                    }}
                  />
                ))}
              </View>
            </ScrollView>
          ) : activeModal === "focus" ? (
            <ScrollView
              contentContainerClassName="px-6 pt-[72px] pb-12 gap-6"
              showsVerticalScrollIndicator={false}
            >
              <View className="gap-1 pr-12">
                <Text variant="caption">Prayer Focus</Text>
                <Text variant="display" className="text-[34px] leading-[39px]">
                  A quieter siddur
                </Text>
                <Text variant="body">{focusSetup.body}</Text>
              </View>
              <View className="min-h-28 p-4 flex-row items-center gap-3 rounded-lg bg-blueSoft">
                <View className="w-11 h-11 rounded-sm items-center justify-center bg-blueSoft">
                  <MoonStar size={20} color={colors.ink} />
                </View>
                <View className="flex-1 gap-1">
                  <Text variant="section" className="text-foreground">
                    Before the first word
                  </Text>
                  <Text
                    variant="body"
                    className="text-inkMuted text-[14px] leading-[20px]"
                  >
                    Kavanah will pause when a prayer opens. Your phone keeps
                    final control of calls, alarms, and notifications.
                  </Text>
                </View>
              </View>
              <View className="border-t border-t-hairlineStrong">
                {focusSetup.steps.map((step, index) => (
                  <View
                    key={step}
                    className="min-h-16 flex-row items-center gap-3 border-b border-b-hairline"
                  >
                    <Text className="text-[12px] leading-[16px] font-medium tracking-normal w-6 text-primary text-center font-label">
                      {index + 1}
                    </Text>
                    <Text variant="body" className="flex-1">
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
              <Button
                variant="default"
                size="content"
                accessibilityRole="button"
                haptic="confirm"
                onPress={() => void openFocusSetup()}
                className="min-h-[50px] px-4 rounded-md flex-row items-center justify-center gap-2 bg-primary"
              >
                <Text className="text-[17px] leading-[24px] font-semibold tracking-normal text-primary-foreground font-heading">
                  {focusSetup.actionLabel}
                </Text>
                <ChevronRight size={16} color={colors.onAccent} />
              </Button>
              {focusSetupMessage ? (
                <Text
                  variant="body"
                  className="text-center text-[13px] leading-[19px]"
                >
                  {focusSetupMessage}
                </Text>
              ) : null}
            </ScrollView>
          ) : activeModal === "social" ? (
            <ScrollView
              contentContainerClassName="px-6 py-4 gap-5"
              keyboardShouldPersistTaps="handled"
            >
              <View className="flex-row items-center justify-between">
                <Text variant="section" className="text-[22px]">
                  Your profile
                </Text>
                <Button
                  variant="ghost"
                  size="content"
                  onPress={() => setActiveModal(null)}
                  className="w-11 h-11 items-center justify-center"
                >
                  <X size={20} color={colors.ink} />
                </Button>
              </View>
              <View className="gap-2">
                <Text variant="caption">Display name</Text>
                <Input
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholders={[
                    "Your name",
                    "How should your circle know you?",
                  ]}
                  className="min-h-12"
                />
              </View>
              <View className="gap-2">
                <Text variant="caption">Handle</Text>
                <Input
                  value={handle}
                  onChangeText={(value) =>
                    setHandle(value.replace(/[^a-zA-Z0-9_]/g, ""))
                  }
                  autoCapitalize="none"
                  placeholders={["yourhandle", "choose_a_handle"]}
                  className="min-h-12"
                />
              </View>
              <View className="gap-2">
                <Text variant="caption">Bio</Text>
                <Input
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  placeholders={[
                    "What are you practicing toward?",
                    "What brings you back to prayer?",
                    "Share what guides your practice…",
                  ]}
                  className="min-h-24 p-3"
                />
              </View>
              <View className="min-h-[72px] flex-row items-center gap-3 border-t border-b border-hairline">
                <View className="flex-1">
                  <Text variant="section">Private profile</Text>
                  <Text variant="body" className="text-[12px] leading-[17px]">
                    Approve people before they see your activity.
                  </Text>
                </View>
                <Switch
                  accessibilityLabel="Private profile"
                  checked={profilePrivate}
                  onCheckedChange={setProfilePrivate}
                />
              </View>
              <Text variant="body" className="text-[13px] leading-[20px]">
                Choose automatic prayer updates and streak milestones in Circle.
                Your weekly quote comes directly from a prayer.
              </Text>
              <Button
                variant="default"
                size="content"
                disabled={!displayName.trim() || !handle.trim()}
                onPress={() => {
                  saveProfile({
                    displayName: displayName.trim(),
                    handle: `@${handle.trim().toLowerCase()}`,
                    bio: bio.trim(),
                    isPrivate: profilePrivate,
                    shareMilestones: sharingPreferences.milestones,
                  });
                  setActiveModal(null);
                }}
                className="min-h-[52px] rounded-md items-center justify-center bg-primary"
              >
                <Text className="text-primary-foreground font-heading text-[16px]">
                  Save profile
                </Text>
              </Button>
            </ScrollView>
          ) : (
            <ScrollView
              contentContainerClassName="px-6 pt-[72px] pb-12 gap-6"
              showsVerticalScrollIndicator={false}
            >
              <View className="gap-1 pr-12">
                <Text variant="caption">Privacy</Text>
                <Text variant="display" className="text-[34px] leading-[39px]">
                  Clear by design
                </Text>
                <Text variant="body">
                  Open each section to see exactly how Kavanah handles your
                  data.
                </Text>
              </View>
              <BouncyAccordion.Root defaultValue="device" gap={6}>
                <BouncyAccordion.Item value="device">
                  <BouncyAccordion.Trigger accessibilityLabel="Stored on this device">
                    <BouncyAccordion.Trigger.Icon>
                      <LockKeyhole size={20} color={colors.blue} />
                    </BouncyAccordion.Trigger.Icon>
                    <BouncyAccordion.Trigger.Label>
                      Stored on this device
                    </BouncyAccordion.Trigger.Label>
                  </BouncyAccordion.Trigger>
                  <BouncyAccordion.Content>
                    Bookmarks, streaks, language preferences, reminder settings,
                    and the coordinates used to calculate zmanim. Travel
                    reminders do not read or store routes from Maps. Precise
                    coordinates are not sent to the prayer assistant.
                  </BouncyAccordion.Content>
                </BouncyAccordion.Item>
                <BouncyAccordion.Item value="assistant">
                  <BouncyAccordion.Trigger accessibilityLabel="Prayer assistant data use">
                    <BouncyAccordion.Trigger.Icon>
                      <MessageCircle size={20} color={colors.blue} />
                    </BouncyAccordion.Trigger.Icon>
                    <BouncyAccordion.Trigger.Label>
                      Prayer assistant
                    </BouncyAccordion.Trigger.Label>
                  </BouncyAccordion.Trigger>
                  <BouncyAccordion.Content>
                    Only after you allow it, your question, selected prayer
                    text, language, source reference, and review status are sent
                    through Kavanah's server to OpenAI. Display translations are
                    identified as unreviewed. Email addresses, phone numbers,
                    and street addresses are removed first. Questions are not
                    used for advertising.
                  </BouncyAccordion.Content>
                </BouncyAccordion.Item>
                <BouncyAccordion.Item value="guidance">
                  <BouncyAccordion.Trigger accessibilityLabel="Religious guidance">
                    <BouncyAccordion.Trigger.Icon>
                      <ShieldCheck size={20} color={colors.blue} />
                    </BouncyAccordion.Trigger.Icon>
                    <BouncyAccordion.Trigger.Label>
                      Religious guidance
                    </BouncyAccordion.Trigger.Label>
                  </BouncyAccordion.Trigger>
                  <BouncyAccordion.Content>
                    Assistant answers are educational and may be incomplete.
                    They are not binding halachic rulings and do not replace a
                    qualified rabbi, doctor, or emergency service.
                  </BouncyAccordion.Content>
                </BouncyAccordion.Item>
                <BouncyAccordion.Item value="choice">
                  <BouncyAccordion.Trigger accessibilityLabel="Your choice">
                    <BouncyAccordion.Trigger.Icon>
                      <Check size={20} color={colors.blue} />
                    </BouncyAccordion.Trigger.Icon>
                    <BouncyAccordion.Trigger.Label>
                      Your choice
                    </BouncyAccordion.Trigger.Label>
                  </BouncyAccordion.Trigger>
                  <BouncyAccordion.Content>
                    You can turn off the prayer assistant or reminders here at
                    any time. Kavanah can still be used for prayer search,
                    reading, bookmarks, and local zmanim without an account.
                  </BouncyAccordion.Content>
                </BouncyAccordion.Item>
              </BouncyAccordion.Root>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}
