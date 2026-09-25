import { HomeScreen } from "@/screens/HomeScreen";
import { colors } from "@/design/theme";
import { tapHaptic } from "@/services/haptics";
import { Stack, useRouter } from "expo-router";
import { CalendarDays } from "lucide-react-native";
import { Platform, Pressable } from "react-native";

export default function HomeRoute(): React.JSX.Element {
  const router = useRouter();
  const openZmanim = () => {
    void tapHaptic();
    router.push("/zmanim");
  };
  return (
    <>
      {Platform.OS === "ios" ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            accessibilityLabel="Open local prayer times"
            icon="calendar"
            onPress={openZmanim}
          />
        </Stack.Toolbar>
      ) : (
        <Stack.Screen
          options={{
            headerRight: () => (
              <Pressable
                accessibilityLabel="Open local prayer times"
                accessibilityRole="button"
                hitSlop={10}
                onPress={openZmanim}
              >
                <CalendarDays color={colors.ink} size={22} />
              </Pressable>
            ),
          }}
        />
      )}
      <HomeScreen />
    </>
  );
}
