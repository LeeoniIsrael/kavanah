import { NavigationFade } from "./NavigationFade";
import { contentMotion } from "@/design/contentMotion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useThemeColors } from "@/design/appearance";
import { fonts } from "@/design/theme";
import { Stack } from "expo-router";

export function TabStack({
  title,
}: {
  title: string;
}): React.JSX.Element {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();

  return (
    <Stack
      screenLayout={({ children }) => <NavigationFade>{children}</NavigationFade>}
      screenOptions={{
        animation: reducedMotion ? "none" : "fade",
        animationDuration: contentMotion.duration,
        contentStyle: { backgroundColor: colors.parchment },
        headerBackButtonDisplayMode: "minimal",
        headerShown: false,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.parchment },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts.semibold, color: colors.ink },
        headerLargeTitleStyle: {
          fontFamily: fonts.semibold,
          color: colors.ink,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title }} />
    </Stack>
  );
}
