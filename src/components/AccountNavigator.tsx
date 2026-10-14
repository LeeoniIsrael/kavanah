import { contentMotion } from "@/design/contentMotion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Stack } from "expo-router";
import { isAccountSession } from "@/services/accountAccess";
import { useCircleAccount } from "@/store/circleAccountStore";
import { usePrayerIdentityStore } from "@/store/prayerIdentityStore";

export function AccountNavigator(): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const session = useCircleAccount((state) => state.session);
  const sessionReady = useCircleAccount((state) => state.sessionReady);
  const sessionError = useCircleAccount((state) => state.sessionError);
  const completed = usePrayerIdentityStore((state) => state.completed);
  const canOpenApp = sessionReady && !sessionError && isAccountSession(session) && completed;
  return (
    <Stack key={session?.user.id ?? "signed-out"} screenOptions={{ headerShown: false, animation: reducedMotion ? "none" : "fade", animationDuration: contentMotion.duration }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sign-in" />
      <Stack.Protected guard={canOpenApp}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="prayer-preferences" />
        <Stack.Screen name="people" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="holiday-checklist" />
        <Stack.Screen name="focus-setup" />
      </Stack.Protected>
    </Stack>
  );
}
