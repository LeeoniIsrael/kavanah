import "react-native-reanimated";
import "./global.css";

import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RootNavigator } from "./src/navigation/RootNavigator";
import { AppProviders } from "./src/providers/AppProviders";

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </AppProviders>
    </SafeAreaProvider>
  );
}
