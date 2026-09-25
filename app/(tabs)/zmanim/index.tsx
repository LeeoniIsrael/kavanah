import { ZmanimScreen } from "@/screens/ZmanimScreen";
import { colors } from "@/design/theme";
import { tapHaptic } from "@/services/haptics";
import { useZmanimStore } from "@/store/zmanimStore";
import { Stack } from "expo-router";
import { RefreshCw } from "lucide-react-native";
import { Platform, Pressable } from "react-native";

export default function ZmanimRoute(): React.JSX.Element {
  const { isLoading, refresh } = useZmanimStore();
  const refreshTimes = () => {
    void tapHaptic();
    void refresh();
  };
  return (
    <>
      {Platform.OS === "ios" ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            accessibilityLabel="Refresh local prayer times"
            disabled={isLoading}
            icon="arrow.clockwise"
            onPress={refreshTimes}
          />
        </Stack.Toolbar>
      ) : (
        <Stack.Screen
          options={{
            headerRight: () => (
              <Pressable
                accessibilityLabel="Refresh local prayer times"
                accessibilityRole="button"
                disabled={isLoading}
                hitSlop={10}
                onPress={refreshTimes}
              >
                <RefreshCw
                  color={isLoading ? colors.inkMuted : colors.ink}
                  size={22}
                />
              </Pressable>
            ),
          }}
        />
      )}
      <ZmanimScreen />
    </>
  );
}
