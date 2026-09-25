import { useAppColorScheme, useAppearanceStore } from "@/design/appearance";
import { themeVariables } from "@/design/themeVariables";
import "../global.css";

import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { BrandWordmark } from "@/components/BrandMark";
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
import { Appearance, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout(): React.JSX.Element {
  const scheme = useAppColorScheme();
  const preference = useAppearanceStore((s) => s.preference);
  useEffect(() => {
    Appearance.setColorScheme(
      preference === "system" ? "unspecified" : preference,
    );
  }, [preference]);
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
      <View
        style={[{ flex: 1 }, themeVariables[scheme]]}
        className="flex-1 bg-background items-center justify-center"
      >
        <BrandWordmark width={190} />
      </View>
    );
  }

  return (
    <View style={[{ flex: 1 }, themeVariables[scheme]]}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <AppProviders>
            <ThemeProvider value={NAV_THEME[scheme]}>
              <StatusBar style={scheme === "dark" ? "light" : "dark"} />
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
    </View>
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
