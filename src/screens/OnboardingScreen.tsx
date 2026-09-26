import { useEffect, useState } from "react";
import { Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandMark } from "@/components/BrandMark";
import { GradientWaveText } from "@/components/onboarding/GradientWaveText";
import { useThemeColors } from "@/design/appearance";
import { fonts } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { confirmHaptic, softHaptic, successHaptic, tapHaptic } from "@/services/haptics";
import { circleConfigured } from "@/services/network/client";
import { sendSignInCode, signInWithApple, signInWithGoogle, verifySignInCode, type CodeChannel } from "@/services/onboardingAuth";
import { usePrayerIdentityStore, type PrayerAudience, type PrayerCommunity } from "@/store/prayerIdentityStore";

type Step = "splash" | "welcome" | "contact" | "code" | "audience" | "community";
const communityOptions: { value: PrayerCommunity; title: string; detail: string }[] = [
  { value: "european", title: "Eastern European", detail: "The prayer book many European communities use" },
  { value: "hasidic", title: "Hasidic", detail: "The style common in many Hasidic homes" },
  { value: "mediterranean", title: "Mediterranean & Middle Eastern", detail: "A familiar style across those communities" },
  { value: "unsure", title: "I'm not sure yet", detail: "You can choose in your prayer book later" },
];

export function OnboardingScreen({ mode = "onboarding" }: { mode?: "onboarding" | "account" | "preferences" }): React.JSX.Element {
  const colors = useThemeColors();
  const reduceMotion = useReducedMotion();
  const router = useRouter();
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
  const [spiral] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (mode !== "onboarding" || reduceMotion) return;
    const animation = Animated.timing(spiral, { toValue: 1, duration: 1950, easing: Easing.inOut(Easing.cubic), useNativeDriver: Platform.OS !== "web" });
    animation.start();
    return () => animation.stop();
  }, [mode, reduceMotion, spiral]);
  useEffect(() => {
    if (mode !== "onboarding") return;
    const timer = setTimeout(() => {
      setStep("welcome");

    }, reduceMotion ? 450 : 1750);
    return () => clearTimeout(timer);
  }, [reduceMotion, mode]);
  const next = (value: Step) => {
    void tapHaptic();
    setMessage("");
    setStep(value);
  };
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
  const text = (size: number, weight: "regular" | "medium" | "semibold" | "bold" = "regular", color = colors.ink) => ({ fontFamily: fonts[weight], fontSize: size, color });
  const button = (label: string, action: () => void, primary = false, disabled = false) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled || busy} onPress={action} style={({ pressed }) => [styles.button, { backgroundColor: primary ? colors.blue : colors.vellum, borderColor: primary ? colors.blue : colors.hairlineStrong, opacity: disabled || busy ? 0.55 : pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
      <Text style={[text(16, "semibold", primary ? colors.onAccent : colors.ink)]}>{label}</Text>
    </Pressable>
  );
  if (step === "splash") return (
    <View style={[styles.splash, { backgroundColor: colors.parchment }]}>
      <Animated.View style={{ alignItems: "center", opacity: spiral.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }), transform: [{ scale: spiral.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }] }}>
        <Animated.View style={{ position: "absolute", width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderColor: colors.blue, opacity: 0.28, transform: [{ rotate: spiral.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "300deg"] }) }, { scale: spiral.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.3] }) }] }} />
        <BrandMark size={56} />
      </Animated.View>
      <GradientWaveText style={{ width: 290, height: 76, marginTop: 30 }} textStyle={{ fontFamily: fonts.bold, fontSize: 55, lineHeight: 72, letterSpacing: -3 }}>kavanah</GradientWaveText>
      <Text style={[text(14, "medium", colors.inkMuted), { marginTop: 8 }]}>Make room for a meaningful moment.</Text>
    </View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.parchment }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <View style={styles.topline}>
            <BrandMark size={27} />
            <Text style={[text(20, "bold"), { letterSpacing: -0.8, marginLeft: 8 }]}>kavanah</Text>
            <View style={{ flex: 1 }} />
            {(step !== "welcome" || mode !== "onboarding") && <Pressable accessibilityRole="button" accessibilityLabel={mode !== "onboarding" && (step === "welcome" || step === "audience") ? "Close" : "Go back"} hitSlop={12} onPress={() => {
              if (mode !== "onboarding" && (step === "welcome" || step === "audience")) router.back();
              else next(step === "code" ? "contact" : step === "community" ? "audience" : "welcome");
            }}><Text style={text(15, "medium", colors.blue)}>{mode !== "onboarding" && (step === "welcome" || step === "audience") ? "Close" : "Back"}</Text></Pressable>}
          </View>
          {step === "welcome" && <>
            <View style={{ flex: 1, minHeight: 18 }} />
            <Text style={[text(43, "bold"), styles.title]}>Prayer that feels like yours.</Text>
            <Text style={[text(17, "regular", colors.inkMuted), styles.subtitle]}>A calm place for the right words, the right time, and your own way of praying.</Text>
            <LinearGradient colors={[colors.goldSoft, colors.vellum]} style={[styles.preview, { borderColor: colors.hairlineStrong }]}>
              <View style={styles.previewTop}><Text style={text(13, "semibold", colors.blue)}>Your daily moment</Text><Text style={text(13, "medium", colors.inkMuted)}>Morning</Text></View>
              <Text style={[{ fontFamily: fonts.hebrewSemibold, fontSize: 30, color: colors.ink, textAlign: "right", marginTop: 22 }]}>שְׁמַע יִשְׂרָאֵל</Text>
              <Text style={[text(17, "semibold"), { marginTop: 6 }]}>Shema Yisrael</Text>
              <Text style={[text(13, "regular", colors.inkMuted), { marginTop: 7 }]}>Hebrew, pronunciation, and meaning together.</Text>
              <View style={[styles.previewBar, { backgroundColor: colors.blue }]} />
            </LinearGradient>
            <View style={{ flex: 1, minHeight: 18 }} />
            {Platform.OS === "ios" && button("Continue with Apple", () => void run(async () => { if (await signInWithApple()) afterSignIn(); }), true)}
            {Platform.OS !== "web" && button("Continue with Google", () => void run(async () => { if (await signInWithGoogle()) afterSignIn(); }), Platform.OS !== "ios")}
            <View style={styles.double}>{button("Email", () => { setChannel("email"); next("contact"); })}{button("Phone", () => { setChannel("phone"); next("contact"); })}</View>
            {mode === "onboarding" && button("Explore first", () => next("audience"))}
            <Text style={[text(12, "regular", colors.inkMuted), styles.foot]}>Your prayer stays private. You can create an account anytime.</Text>
          </>}
          {(step === "contact" || step === "code") && <>
            <View style={{ flex: 1, minHeight: 70 }} />
            <Text style={[text(36, "bold"), styles.title]}>{step === "code" ? "One quick check." : channel === "email" ? "What's your email?" : "What's your number?"}</Text>
            <Text style={[text(16, "regular", colors.inkMuted), styles.subtitle]}>{step === "code" ? `Enter the code sent to ${contact.trim()}.` : `We'll send a one-time code. No password to remember.`}</Text>
            <TextInput
              accessibilityLabel={step === "code" ? "Verification code" : channel === "email" ? "Email address" : "Phone number with country code"}
              placeholder={step === "code" ? "6-digit code" : channel === "email" ? "you@example.com" : "+1 212 555 0123"}
              placeholderTextColor={colors.inkMuted}
              keyboardType={step === "code" ? "number-pad" : channel === "email" ? "email-address" : "phone-pad"}
              autoComplete={step === "code" ? "one-time-code" : channel === "email" ? "email" : "tel"}
              autoCapitalize="none" autoCorrect={false}
              maxLength={step === "code" ? 10 : 100}
              value={step === "code" ? code : contact}
              onChangeText={step === "code" ? setCode : setContact}
              style={[styles.input, text(18, "medium"), { backgroundColor: colors.vellum, borderColor: colors.hairlineStrong }]}
            />
            {step === "code" && <Pressable hitSlop={10} disabled={busy} onPress={() => void run(() => sendSignInCode(contact, channel))}><Text style={[text(14, "semibold", colors.blue), { marginTop: 18 }]}>Send a new code</Text></Pressable>}
            <View style={{ flex: 1, minHeight: 32 }} />
            {button(step === "code" ? "Verify and continue" : "Send my code", () => void run(async () => {
              if (step === "code") { await verifySignInCode(contact, code, channel); afterSignIn(); }
              else { await sendSignInCode(contact, channel); void softHaptic(); next("code"); }
            }), true)}
            <Text style={[text(12, "regular", colors.inkMuted), styles.foot]}>Continuing creates your account if you're new. Never share your code.</Text>
          </>}
          {step === "audience" && <>
            <View style={{ flex: 1, minHeight: 55 }} />
            <Text style={[text(35, "bold"), styles.title]}>Make it yours.</Text>
            <Text style={[text(16, "regular", colors.inkMuted), styles.subtitle]}>Which daily prayer view feels right for you? You can change this in Profile.</Text>
            {(["woman", "man"] as const).map((value) => (
              <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: audience === value }} onPress={() => { setAudience(value); void tapHaptic(); }} style={({ pressed }) => [styles.choice, { borderColor: audience === value ? colors.blue : colors.hairlineStrong, backgroundColor: audience === value ? colors.goldSoft : colors.vellum, opacity: pressed ? 0.8 : 1 }]}>
                <Text style={text(19, "semibold")}>{value === "woman" ? "Woman" : "Man"}</Text><View style={[styles.radio, { borderColor: colors.blue, backgroundColor: audience === value ? colors.blue : "transparent" }]} />
              </Pressable>
            ))}
            <Text style={[text(13, "regular", colors.inkMuted), { lineHeight: 20, marginTop: 12 }]}>This sets a reading default. Practices vary by community and person.</Text>
            <View style={{ flex: 1, minHeight: 32 }} />
            {button("Continue", () => next("community"), true, !audience)}
          </>}
          {step === "community" && <>
            <View style={{ flex: 1, minHeight: 16 }} />
            <Text style={[text(35, "bold"), styles.title]}>What feels familiar?</Text>
            <Text style={[text(16, "regular", colors.inkMuted), styles.subtitle]}>We'll open the closest prayer book. There's no wrong answer.</Text>
            {communityOptions.map((option) => (
              <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: community === option.value }} onPress={() => { setCommunity(option.value); void tapHaptic(); }} style={({ pressed }) => [styles.choice, { borderColor: community === option.value ? colors.blue : colors.hairlineStrong, backgroundColor: community === option.value ? colors.goldSoft : colors.vellum, opacity: pressed ? 0.8 : 1 }]}>
                <View style={{ flex: 1 }}><Text style={text(17, "semibold")}>{option.title}</Text><Text style={[text(13, "regular", colors.inkMuted), { marginTop: 3, lineHeight: 19 }]}>{option.detail}</Text></View><View style={[styles.radio, { borderColor: colors.blue, backgroundColor: community === option.value ? colors.blue : "transparent" }]} />
              </Pressable>
            ))}
            <View style={{ flex: 1, minHeight: 20 }} />
            {button("Open my prayer book", () => void run(done), true, !community)}
            <Text style={[text(12, "regular", colors.inkMuted), styles.foot]}>You can change your choice at any time.</Text>
          </>}
          {!!message && <Text accessibilityRole="alert" style={[text(14, "medium", colors.danger), { textAlign: "center", marginTop: 12 }]}>{message}</Text>}
          {!circleConfigured && (step === "welcome" || step === "contact") && <Text style={[text(12, "regular", colors.inkMuted), styles.foot]}>Account sign-in will be available when this build is connected. You can explore now.</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: "center", justifyContent: "center" },
  page: { flexGrow: 1, paddingHorizontal: 25, paddingBottom: 20, maxWidth: 560, width: "100%", alignSelf: "center" },
  topline: { flexDirection: "row", alignItems: "center", minHeight: 54, marginBottom: 14 },
  title: { letterSpacing: -1.7, lineHeight: 46, maxWidth: 370 },
  subtitle: { lineHeight: 25, marginTop: 13, marginBottom: 30, maxWidth: 390 },
  preview: { borderWidth: 1, borderRadius: 30, padding: 24, minHeight: 206, overflow: "hidden" },
  previewTop: { flexDirection: "row", justifyContent: "space-between" },
  previewBar: { height: 4, width: 48, borderRadius: 2, marginTop: 23 },
  button: { minHeight: 54, borderWidth: 1, borderRadius: 17, alignItems: "center", justifyContent: "center", marginTop: 9, paddingHorizontal: 16 },
  double: { flexDirection: "row", gap: 9 },
  foot: { textAlign: "center", lineHeight: 18, marginTop: 15 },
  input: { borderWidth: 1, borderRadius: 18, minHeight: 58, paddingHorizontal: 18 },
  choice: { borderWidth: 1, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 18, minHeight: 70, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  radio: { width: 19, height: 19, borderRadius: 10, borderWidth: 2 },
});
