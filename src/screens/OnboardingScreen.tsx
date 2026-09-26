import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { BrandWordmark } from "@/components/BrandMark";
import { AnimatedWelcomeHeadline } from "@/components/AnimatedWelcomeHeadline";
import { fonts } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { confirmHaptic, softHaptic, successHaptic, tapHaptic, typingHaptic } from "@/services/haptics";
import { circleConfigured } from "@/services/network/client";
import { sendSignInCode, signInWithApple, signInWithGoogle, verifySignInCode, type CodeChannel } from "@/services/onboardingAuth";
import { usePrayerIdentityStore, type PrayerAudience, type PrayerCommunity } from "@/store/prayerIdentityStore";

type Step = "splash" | "welcome" | "contact" | "code" | "audience" | "community";
const ink = "#F4F7FB";
const muted = "#98A7B8";
const background = "#000000";
const edge = "#344254";
const accent = "#8DB6E8";
const appleSignInEnabled = process.env.EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN === "true";
const googleSignInEnabled = process.env.EXPO_PUBLIC_ENABLE_GOOGLE_SIGN_IN === "true";
const phoneSignInEnabled = process.env.EXPO_PUBLIC_ENABLE_PHONE_SIGN_IN === "true";

const communityOptions: { value: PrayerCommunity; title: string; detail: string }[] = [
  { value: "european", title: "Eastern European", detail: "The prayer book many European communities use" },
  { value: "hasidic", title: "Hasidic", detail: "The style common in many Hasidic homes" },
  { value: "mediterranean", title: "Mediterranean & Middle Eastern", detail: "A familiar style across those communities" },
  { value: "unsure", title: "I'm not sure yet", detail: "You can choose in your prayer book later" },
];

function Action({
  label,
  onPress,
  kind = "outline",
  icon,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  kind?: "solid" | "outline" | "quiet";
  icon?: "apple" | "google";
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPressIn={() => { if (!disabled) void tapHaptic(); }}
      onPress={onPress}
      style={styles.actionPressable}
    >
      {({ pressed }) => (
        <View style={[
          styles.actionSurface,
          kind === "solid" ? styles.actionSolid : kind === "quiet" ? styles.actionQuiet : styles.actionOutline,
          { opacity: disabled ? 0.42 : pressed ? 0.78 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
        ]}>
          {icon === "apple" && <Ionicons name="logo-apple" size={21} color={kind === "solid" ? background : ink} style={styles.actionIcon} />}
          {icon === "google" && <Text style={[styles.googleIcon, { color: kind === "solid" ? background : ink }]}>G</Text>}
          <Text style={[styles.actionLabel, { color: kind === "solid" ? background : ink }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function OnboardingScreen({ mode = "onboarding" }: { mode?: "onboarding" | "account" | "preferences" }): React.JSX.Element {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { height } = useWindowDimensions();
  const save = usePrayerIdentityStore((state) => state.save);
  const finish = usePrayerIdentityStore((state) => state.finish);
  const [step, setStep] = useState<Step>(mode === "onboarding" ? "splash" : mode === "account" ? "welcome" : "audience");
  const [channel, setChannel] = useState<CodeChannel>("email");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [audience, setAudience] = useState<PrayerAudience | null>(null);
  const [community, setCommunity] = useState<PrayerCommunity | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [intro] = useState(() => new Animated.Value(mode === "onboarding" ? 0 : 1));

  useEffect(() => {
    if (mode !== "onboarding") return;
    // Give the mark a brief introduction without delaying account access.
    const timer = setTimeout(() => {
      Animated.timing(intro, {
        toValue: 1,
        duration: reduceMotion ? 1 : 550,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: Platform.OS !== "web",
      }).start(({ finished }) => {
        if (finished) { setStep("welcome"); void softHaptic(); }
      });
    }, reduceMotion ? 0 : 900);
    return () => { clearTimeout(timer); intro.stopAnimation(); };
  }, [intro, mode, reduceMotion]);

  const next = (value: Step) => { void tapHaptic(); setMessage(""); setStep(value); };
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try { await action(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Something went wrong. Try again."); void softHaptic(); }
    finally { setBusy(false); }
  };
  const done = async () => {
    if (!audience || !community) return;
    await save({ audience, community });
    if (mode === "onboarding") finish();
    void successHaptic();
    router.replace(mode === "preferences" ? "/profile" : "/prayer");
  };
  const afterSignIn = () => { void confirmHaptic(); if (mode === "account") router.replace("/profile"); else next("audience"); };
  const submitCredential = () => void run(async () => {
    if (step === "code") { await verifySignInCode(contact, code, channel); afterSignIn(); }
    else { await sendSignInCode(contact, channel); void softHaptic(); next("code"); }
  });
  const goBack = () => {
    if (mode !== "onboarding" && (step === "welcome" || step === "audience")) router.back();
    else next(step === "code" ? "contact" : step === "community" ? "audience" : "welcome");
  };

  if (step === "splash" || step === "welcome") {
    const travel = Math.min(height * 0.38, 300);
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.heroCenter} pointerEvents="none">
          <Animated.View style={[styles.logo, {
            transform: [
              { translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [0, -travel] }) },
              { scale: intro.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }) },
            ],
          }]}>
            <BrandWordmark width={296} color="#FFFFFF" />
          </Animated.View>
        </View>
        <Animated.View
          pointerEvents={step === "splash" ? "none" : "auto"}
          importantForAccessibility={step === "splash" ? "no-hide-descendants" : "auto"}
          style={[styles.welcomeContent, {
            opacity: intro,
            transform: [{ translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
          }]}
        >
          {mode === "account" && <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={goBack} style={styles.close}><Ionicons name="close" size={23} color={ink} /></Pressable>}
          <View style={styles.welcomeBottom}>
            <AnimatedWelcomeHeadline />
            <Text style={styles.welcomeDescription}>Make each moment of prayer your own.</Text>
            {circleConfigured ? (
              <View style={styles.providerGroup}>
                <Action label="Continue with email" kind="solid" disabled={busy} onPress={() => { setChannel("email"); next("contact"); }} />
                {Platform.OS === "ios" && appleSignInEnabled && <Action label="Continue with Apple" icon="apple" disabled={busy} onPress={() => void run(async () => { if (await signInWithApple()) afterSignIn(); })} />}
                {googleSignInEnabled && <Action label="Continue with Google" icon="google" disabled={busy} onPress={() => void run(async () => { if (await signInWithGoogle()) afterSignIn(); })} />}
                {phoneSignInEnabled && <Action label="Continue with phone" kind="quiet" disabled={busy} onPress={() => { setChannel("phone"); next("contact"); }} />}
              </View>
            ) : <Text style={styles.unavailable}>Account sign-in is being set up. You can keep using your prayer book without an account.</Text>}
            {mode === "onboarding" && <Pressable accessibilityRole="button" onPress={() => next("audience")} hitSlop={10} style={styles.explore}><Text style={styles.exploreText}>Explore without an account <Ionicons name="arrow-forward" size={16} color={muted} /></Text></Pressable>}
            {mode === "account" && !circleConfigured && <Action label="Back to Profile" kind="quiet" onPress={goBack} />}
            <Text style={styles.privacy}>Your prayer stays private.</Text>
            {!!message && <Text accessibilityRole="alert" style={styles.error}>{message}</Text>}
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.formPage} keyboardShouldPersistTaps="handled">
          <View style={styles.formTop}>
            <BrandWordmark width={118} color="#FFFFFF" />
            <View style={styles.flex} />
            <Pressable accessibilityRole="button" accessibilityLabel={mode !== "onboarding" && step === "audience" ? "Close" : "Go back"} onPress={goBack} hitSlop={12}>
              <Text style={styles.backLabel}>{mode !== "onboarding" && step === "audience" ? "Close" : "Back"}</Text>
            </Pressable>
          </View>
          {(step === "contact" || step === "code") && <>
            <View style={styles.formSpacer} />
            <Text style={styles.formTitle}>{step === "code" ? "Check your messages." : channel === "email" ? "Your email." : "Your phone number."}</Text>
            <Text style={styles.formDescription}>{step === "code" ? `Enter the code sent to ${contact.trim()}.` : "We'll send one code. No password to remember."}</Text>
            <TextInput
              key={`${step}-${channel}`}
              accessibilityLabel={step === "code" ? "Verification code" : channel === "email" ? "Email address" : "Phone number with country code"}
              placeholder={step === "code" ? "6-digit code" : channel === "email" ? "you@example.com" : "+1 212 555 0123"}
              placeholderTextColor={muted}
              keyboardType={step === "code" ? "number-pad" : channel === "email" ? "email-address" : "phone-pad"}
              autoComplete={step === "code" ? "one-time-code" : channel === "email" ? "email" : "tel"}
              autoCapitalize="none" autoCorrect={false}
              autoFocus
              returnKeyType={step === "code" ? "done" : "go"}
              onSubmitEditing={submitCredential}
              maxLength={step === "code" ? 10 : 100}
              value={step === "code" ? code : contact}
              onChangeText={(value) => {
                typingHaptic(step === "code" ? code : contact, value);
                if (step === "code") setCode(value); else setContact(value);
                if (message) setMessage("");
              }}
              style={styles.input}
            />
            {!!message && <Text accessibilityRole="alert" style={styles.error}>{message}</Text>}
            {step === "code" && <Pressable hitSlop={10} disabled={busy} onPress={() => void run(() => sendSignInCode(contact, channel))}><Text style={styles.resend}>Send a new code</Text></Pressable>}
            <View style={styles.flex} />
            <Action label={step === "code" ? "Verify and continue" : "Send code"} kind="solid" disabled={busy} onPress={submitCredential} />
            <Text style={styles.formFoot}>Continuing creates your account if you're new.</Text>
          </>}
          {step === "audience" && <>
            <View style={styles.formSpacer} />
            <Text style={styles.formTitle}>Make it yours.</Text>
            <Text style={styles.formDescription}>Which daily prayer view is right for you?</Text>
            {(["woman", "man"] as const).map((value) => (
              <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: audience === value }} onPress={() => { setAudience(value); void tapHaptic(); }} style={styles.choicePressable}>
                {({ pressed }) => <View style={[styles.choice, audience === value && styles.choiceSelected, { opacity: pressed ? 0.75 : 1 }]}>
                  <Text style={styles.choiceTitle}>{value === "woman" ? "Woman" : "Man"}</Text>
                  <View style={[styles.radio, audience === value && styles.radioSelected]} />
                </View>}
              </Pressable>
            ))}
            <Text style={styles.helper}>This sets a reading default. You can change it at any time.</Text>
            <View style={styles.flex} />
            <Action label="Continue" kind="solid" disabled={!audience || busy} onPress={() => next("community")} />
          </>}
          {step === "community" && <>
            <View style={styles.formSpacerSmall} />
            <Text style={styles.formTitle}>What feels familiar?</Text>
            <Text style={styles.formDescription}>We'll open the closest prayer book. You can change it later.</Text>
            {communityOptions.map((option) => (
              <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: community === option.value }} onPress={() => { setCommunity(option.value); void tapHaptic(); }} style={styles.choicePressable}>
                {({ pressed }) => <View style={[styles.choice, community === option.value && styles.choiceSelected, { opacity: pressed ? 0.75 : 1 }]}>
                  <View style={styles.flex}><Text style={styles.choiceTitle}>{option.title}</Text><Text style={styles.choiceDetail}>{option.detail}</Text></View>
                  <View style={[styles.radio, community === option.value && styles.radioSelected]} />
                </View>}
              </Pressable>
            ))}
            <View style={styles.flex} />
            <Action label="Open my prayer book" kind="solid" disabled={!community || busy} onPress={() => void run(done)} />
          </>}
          {!!message && step !== "contact" && step !== "code" && <Text accessibilityRole="alert" style={styles.error}>{message}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: background },
  flex: { flex: 1 },
  heroCenter: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  logo: { alignItems: "center", justifyContent: "center" },
  welcomeContent: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, paddingHorizontal: 27, paddingBottom: 20, maxWidth: 560, width: "100%", alignSelf: "center" },
  welcomeBottom: { marginTop: "auto" },
  close: { alignSelf: "flex-end", padding: 8, marginTop: 12, marginRight: -8 },
  welcomeDescription: { color: muted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, marginTop: 6 },
  providerGroup: { marginTop: 29, gap: 10 },
  actionPressable: { width: "100%" },
  actionSurface: { minHeight: 56, borderRadius: 11, borderWidth: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  actionSolid: { backgroundColor: ink, borderColor: ink },
  actionOutline: { backgroundColor: "transparent", borderColor: "#66788C" },
  actionQuiet: { backgroundColor: "transparent", borderColor: "transparent" },
  actionLabel: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 21 },
  actionIcon: { marginRight: 10 },
  googleIcon: { marginRight: 10, fontFamily: fonts.bold, fontSize: 20, lineHeight: 25 },
  unavailable: { color: muted, fontFamily: fonts.medium, fontSize: 14, lineHeight: 21, marginTop: 29 },
  explore: { alignItems: "center", justifyContent: "center", minHeight: 42, marginTop: 8 },
  exploreText: { color: muted, fontFamily: fonts.medium, fontSize: 13 },
  privacy: { color: "#738296", fontFamily: fonts.regular, fontSize: 11, textAlign: "center", marginTop: 19 },
  error: { color: "#F2A0A8", fontFamily: fonts.medium, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 14 },
  formPage: { flexGrow: 1, paddingHorizontal: 27, paddingBottom: 24, maxWidth: 560, width: "100%", alignSelf: "center" },
  formTop: { height: 62, flexDirection: "row", alignItems: "center" },
  backLabel: { color: accent, fontFamily: fonts.medium, fontSize: 14 },
  formSpacer: { flex: 1, minHeight: 100 },
  formSpacerSmall: { flex: 1, minHeight: 43 },
  formTitle: { color: ink, fontFamily: fonts.semibold, fontSize: 37, lineHeight: 44, letterSpacing: -1.8 },
  formDescription: { color: muted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, marginTop: 11, marginBottom: 34 },
  input: { minHeight: 61, borderWidth: 1, borderColor: edge, borderRadius: 11, paddingHorizontal: 17, color: ink, backgroundColor: "#17212D", fontFamily: fonts.medium, fontSize: 17 },
  resend: { color: accent, fontFamily: fonts.semibold, fontSize: 14, marginTop: 19 },
  formFoot: { color: muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "center", marginTop: 20 },
  choicePressable: { width: "100%", marginBottom: 10 },
  choice: { borderWidth: 1, borderColor: edge, borderRadius: 11, minHeight: 64, paddingHorizontal: 17, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 14 },
  choiceSelected: { borderColor: accent, backgroundColor: "#16263A" },
  choiceTitle: { color: ink, fontFamily: fonts.semibold, fontSize: 16 },
  choiceDetail: { color: muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 4 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: "#8291A3" },
  radioSelected: { borderColor: accent, borderWidth: 5, backgroundColor: background },
  helper: { color: muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 19, marginTop: 6 },
});
