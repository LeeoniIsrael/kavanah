import "../global.css";

import { BrandWordmark } from "@/components/BrandMark";
import { PulsingDots } from "@/components/molecules/pulsing-dots";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { NAV_THEME } from "@/lib/theme";
import { AppProviders } from "@/providers/AppProviders";
import { getNotificationNavigationUrl } from "@/services/notifications";
import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_500Medium } from "@expo-google-fonts/manrope/500Medium";
import { Manrope_600SemiBold } from "@expo-google-fonts/manrope/600SemiBold";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import { NotoSansHebrew_400Regular } from "@expo-google-fonts/noto-sans-hebrew/400Regular";
import { NotoSansHebrew_600SemiBold } from "@expo-google-fonts/noto-sans-hebrew/600SemiBold";
import { PortalHost } from "@rn-primitives/portal";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { type Href, Stack, ThemeProvider, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout(): React.JSX.Element {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    NotoSansHebrew_400Regular,
    NotoSansHebrew_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <BrandWordmark width={190} />
        <PulsingDots
          accessibilityLabel="Opening Kavanah"
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <AppProviders>
          <ThemeProvider value={NAV_THEME.dark}>
            <StatusBar style="light" />
            <NotificationRouter />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="index" />
            </Stack>
            <PortalHost />
          </ThemeProvider>
        </AppProviders>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

function NotificationRouter(): null {
  const router = useRouter();

  useEffect(() => {
    const openResponse = async (
      response: Notifications.NotificationResponse | null,
    ) => {
      if (!response) return;
      const url = getNotificationNavigationUrl(response);
      if (!url) return;
      router.push(url.replace("kavanah://", "/") as Href);
      await Notifications.clearLastNotificationResponseAsync();
    };

    void Notifications.getLastNotificationResponseAsync().then(openResponse);
    const subscription =
      Notifications.addNotificationResponseReceivedListener(openResponse);
    return () => subscription.remove();
  }, [router]);

  return null;
}
