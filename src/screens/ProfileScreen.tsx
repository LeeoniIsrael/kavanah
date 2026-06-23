import { Lock, LogOut, ShieldCheck } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, Switch, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Body, Label, Title } from "@/components/Text";
import { HALACHIC_ASSISTANT_SYSTEM_PROMPT } from "@/services/assistantService";
import { useAuthStore } from "@/store/authStore";

export function ProfileScreen(): React.JSX.Element {
  const { tokens, biometricLockEnabled, hydrate, signInWithApple, signOut, setBiometricLockEnabled } = useAuthStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <Screen>
      <View className="gap-2">
        <Label>Security</Label>
        <Title>Private by default</Title>
        <Body>OAuth tokens live in Keychain or Keystore, while local app state stays on device.</Body>
      </View>

      <View className="gap-3 rounded-lg bg-white p-5">
        <View className="flex-row items-center gap-3">
          <ShieldCheck size={20} color="#111827" />
          <Body className="font-semibold text-ink">{tokens ? "Signed in securely" : "Guest mode"}</Body>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => (tokens ? void signOut() : void signInWithApple())}
          className="h-12 flex-row items-center justify-center gap-2 rounded-lg bg-ink"
        >
          {tokens ? <LogOut size={17} color="#FFFFFF" /> : <Lock size={17} color="#FFFFFF" />}
          <Body className="font-semibold text-white">{tokens ? "Sign out" : "Sign in with Apple"}</Body>
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between rounded-lg bg-white p-5">
        <View className="flex-1 pr-4">
          <Body className="font-semibold text-ink">Biometric lock</Body>
          <Body className="text-sm">Require Face ID, Touch ID, or device biometrics.</Body>
        </View>
        <Switch value={biometricLockEnabled} onValueChange={(enabled) => void setBiometricLockEnabled(enabled)} />
      </View>

      <View className="gap-2 rounded-lg border border-ink/10 p-4">
        <Label>Assistant guardrail</Label>
        <Body className="text-sm">{HALACHIC_ASSISTANT_SYSTEM_PROMPT}</Body>
      </View>
    </Screen>
  );
}
