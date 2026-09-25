import { HomeScreen } from "@/screens/HomeScreen";
import { Stack } from "expo-router";

export default function HomeRoute(): React.JSX.Element {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <HomeScreen />
    </>
  );
}
