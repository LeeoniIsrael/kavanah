import { NavigationContainer, type LinkingOptions } from "@react-navigation/native";
import { Manrope_400Regular } from "@expo-google-fonts/manrope/400Regular";
import { Manrope_500Medium } from "@expo-google-fonts/manrope/500Medium";
import { Manrope_600SemiBold } from "@expo-google-fonts/manrope/600SemiBold";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import { NotoSansHebrew_400Regular } from "@expo-google-fonts/noto-sans-hebrew/400Regular";
import { NotoSansHebrew_600SemiBold } from "@expo-google-fonts/noto-sans-hebrew/600SemiBold";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { Linking, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppErrorBoundary } from "./src/components/AppErrorBoundary";
import { colors } from "./src/design/theme";
import { RootNavigator, type RootTabParamList } from "./src/navigation/RootNavigator";
import { AppProviders } from "./src/providers/AppProviders";
import { getNotificationNavigationUrl } from "./src/services/notifications";

const linking: LinkingOptions<RootTabParamList> = {
  prefixes: ["kavanah://"],
  config: {
    screens: {
      Home: "home",
      Prayer: "prayer",
      Zmanim: "zmanim",
      Profile: "profile"
    }
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (url) return url;

    const response = await Notifications.getLastNotificationResponseAsync();
    if (!response) return null;
    const notificationUrl = getNotificationNavigationUrl(response);
    if (notificationUrl) await Notifications.clearLastNotificationResponseAsync();
    return notificationUrl;
  },
  subscribe(listener) {
    const linkingSubscription = Linking.addEventListener("url", ({ url }) => listener(url));
    const notificationSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = getNotificationNavigationUrl(response);
      if (url) listener(url);
    });
    return () => {
      linkingSubscription.remove();
      notificationSubscription.remove();
    };
  }
};

export default function App(): React.JSX.Element {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    NotoSansHebrew_400Regular,
    NotoSansHebrew_600SemiBold
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.parchment }} />;
  }

  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <AppProviders>
          <NavigationContainer linking={linking}>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </AppProviders>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
