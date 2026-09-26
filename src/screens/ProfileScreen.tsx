import { ProfilePhoto } from "@/components/ProfilePhoto";
import { PrayerFocusSetupContent } from "@/components/PrayerFocusSetupContent";
import { useRouter } from "expo-router";
import {
  deleteCircleAccount,
  loadCircleAccount,
  useCircleAccount,
} from "@/store/circleAccountStore";
import { circleConfigured, requireCircle } from "@/services/network/client";
import { SectionHeading } from "@/components/ui/section-heading";
import { BouncyAccordion } from "@/components/ui/bouncy-accordion";
import { Card } from "@/components/ui/card";
import { ChoiceRow } from "@/components/ui/choice-row";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { useAppearanceStore, useThemeColors } from "@/design/appearance";
import { cn } from "@/lib/utils";
import {
  Bell,
  Share2,
  Check,
  ChevronRight,
  Languages,
  LockKeyhole,
  MoonStar,
  ShieldCheck,
  MessageCircle,
  UserRound,
  X,
} from "@/components/ui/icons";
import { useState } from "react";
import { Alert, Modal, Platform, ScrollView, View } from "react-native";
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
import { useAuthStore } from "@/store/authStore";
import {
  CURRENT_ASSISTANT_CONSENT_VERSION,
  useSettingsStore,
} from "@/store/settingsStore";

type ProfileModal = "focus" | "language" | "privacy" | null;

export function ProfileScreen(): React.JSX.Element {
  const colors = useThemeColors();
  const { preference, setPreference } = useAppearanceStore();

  const insets = useSafeAreaInsets();
  const { biometricLockEnabled, setBiometricLockEnabled } = useAuthStore();
  const router = useRouter();
  const profile = useCircleAccount((state) => state.profile);
  const accountSession = useCircleAccount((state) => state.session);
  const {
    primaryLanguageCode,
    assistantConsentVersion,
    prayerFocusEnabled,
    shareAfterPrayer,
    setShareAfterPrayer,
    setPrimaryLanguageCode,
    setAssistantConsent,
    setPrayerFocusEnabled,
  } = useSettingsStore();
  const [activeModal, setActiveModal] = useState<ProfileModal>(null);
  const [accountAction, setAccountAction] = useState<
    "signOut" | "delete" | null
  >(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const primaryLanguage = findLanguage(primaryLanguageCode);
  const assistantEnabled =
    assistantConsentVersion === CURRENT_ASSISTANT_CONSENT_VERSION;

  const runAccountAction = async (action: "signOut" | "delete") => {
    if (accountAction) return;
    setAccountAction(action);
    setAccountError(null);
    try {
      if (action === "delete") {
        await deleteCircleAccount();
      } else {
        const { error } = await requireCircle().auth.signOut({
          scope: "local",
        });
        if (error) throw error;
        await loadCircleAccount(null);
      }
    } catch (error) {
      setAccountError(
        error instanceof Error
          ? error.message
          : "Could not update your account. Please try again.",
      );
    } finally {
      setAccountAction(null);
    }
  };

  const confirmDeleteProfile = () => {
    const message =
      "This permanently deletes your Circle profile, cloud prayer history, posts, and connections. Prayer activity saved only on this device stays here.";
    if (Platform.OS === "web") {
      if (globalThis.confirm?.(`${message}\n\nDelete profile?`))
        void runAccountAction("delete");
      return;
    }
    Alert.alert("Delete your profile?", message, [
      { text: "Keep profile", style: "cancel" },
      {
        text: "Delete profile",
        style: "destructive",
        onPress: () => void runAccountAction("delete"),
      },
    ]);
  };

  return (
    <Screen
      largeTitle="Profile"
      subtitle="Your practice, preferences, and privacy."
    >
      <ProfilePhoto
        key={profile?.id ?? "local"}
        owner={profile?.id ?? "local"}
        name={profile?.display_name ?? "Your profile"}
      />
      <View style={{ gap: 12 }}>
        <SectionHeading title="Your prayer book" />
        <Button
          variant="secondary"
          onPress={() => router.push("/prayer-preferences")}
        >
          <Text>Change my prayer view</Text>
        </Button>
        {!accountSession && circleConfigured && (
          <Button variant="secondary" onPress={() => router.push("/sign-in")}>
            <Text>Sign in to save across devices</Text>
          </Button>
        )}
        {!accountSession && !circleConfigured && (
          <Text variant="caption">Account sync is being set up. Your prayer book remains available on this device.</Text>
        )}
      </View>
      {accountSession && (
        <View style={{ gap: 12 }}>
          <SectionHeading title="Account" />
          <Card className="p-0 gap-0 overflow-hidden rounded-lg bg-card">
            <Button
              variant="ghost"
              size="content"
              accessibilityRole="button"
              disabled={accountAction !== null}
              isLoading={accountAction === "signOut"}
              onPress={() => void runAccountAction("signOut")}
              className="min-h-[68px] rounded-none px-5 py-4 border-b border-b-hairline"
            >
              <Text variant="section" className="text-[17px] leading-[24px]">
                Sign out
              </Text>
            </Button>
            <Button
              variant="ghost"
              size="content"
              accessibilityRole="button"
              disabled={accountAction !== null}
              isLoading={accountAction === "delete"}
              onPress={confirmDeleteProfile}
              className="min-h-[68px] rounded-none px-5 py-4"
            >
              <Text
                variant="section"
                className="text-[17px] leading-[24px] text-destructive"
              >
                Delete profile
              </Text>
            </Button>
          </Card>
          {accountError && (
            <Text accessibilityRole="alert" variant="body">
              {accountError}
            </Text>
          )}
          <Text variant="caption">
            Subscription management will appear here when plans are available.
          </Text>
        </View>
      )}
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
        onPress={() => router.push("/people")}
        className="min-h-[92px] p-5 rounded-lg bg-card flex-row items-center gap-4"
      >
        <View className="w-14 h-14 rounded-full bg-blueSoft items-center justify-center">
          {profile ? (
            <Text className="text-foreground font-heading text-[20px]">
              {profile.display_name.charAt(0).toUpperCase()}
            </Text>
          ) : (
            <UserRound size={24} color={colors.ink} />
          )}
        </View>
        <View className="flex-1 gap-1">
          <Text variant="section">
            {profile ? "Your Circle account" : "Connect your circle"}
          </Text>
          <Text variant="body" className="text-[14px] leading-[22px]">
            {profile
              ? `@${profile.handle} · Private circle`
              : "Your account, people, and shared practice."}
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

        <Button
          variant="ghost"
          onPress={() => router.push("/notifications")}
          className="min-h-[76px] rounded-none px-5 py-4 flex-row items-center gap-3 border-b border-b-hairline"
        >
          <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
            <Bell size={20} color={colors.blue} />
          </View>
          <View className="flex-1 gap-[2px]">
            <Text className="text-[17px] leading-[24px] font-semibold tracking-normal text-foreground font-heading">
              Notifications
            </Text>
            <Text className="text-[13px] leading-[20px] font-medium tracking-normal text-muted-foreground font-label">
              Prayer, tefillin and holiday reminders.
            </Text>
          </View>
          <ChevronRight size={16} color={colors.inkMuted} />
        </Button>

        <View className="min-h-[76px] px-5 py-4 flex-row items-center gap-3 border-b border-b-hairline">
          <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
            <Share2 size={20} color={colors.blue} />
          </View>
          <View className="flex-1 gap-[2px]">
            <Text className="text-[17px] leading-[24px] font-semibold text-foreground font-heading">
              Share after prayer
            </Text>
            <Text className="text-[13px] leading-[20px] text-muted-foreground font-label">
              Ask to share when you finish. Nothing posts automatically.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Share after prayer"
            checked={shareAfterPrayer}
            onCheckedChange={setShareAfterPrayer}
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
        Prayer stays usable without an account. In Circle, you control your
        connections, sharing, and account deletion.
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
              <PrayerFocusSetupContent />
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
                    and the coordinates used to calculate zmanim. Precise
                    coordinates are not sent to the prayer assistant.
                  </BouncyAccordion.Content>
                </BouncyAccordion.Item>
                <BouncyAccordion.Item value="circle">
                  <BouncyAccordion.Trigger accessibilityLabel="Circle account data">
                    <BouncyAccordion.Trigger.Icon>
                      <UserRound size={20} color={colors.blue} />
                    </BouncyAccordion.Trigger.Icon>
                    <BouncyAccordion.Trigger.Label>
                      Circle account
                    </BouncyAccordion.Trigger.Label>
                  </BouncyAccordion.Trigger>
                  <BouncyAccordion.Content>
                    Joining Circle saves future prayer completions to your
                    account. Sharing starts off; accepted connections see only
                    the updates you choose to share. Your address book is never
                    uploaded. Delete your cloud account from Profile → Account;
                    private device activity remains here.
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
