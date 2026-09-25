import { useThemeColors } from "@/design/appearance";
import { fonts } from "@/design/theme";
import { Stack } from "expo-router";

export function TabStack({ title }: { title: string }): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
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
