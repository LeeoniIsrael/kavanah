import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BookOpenText, CalendarDays, CircleUserRound, House } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts } from "@/design/theme";
import { HomeScreen } from "@/screens/HomeScreen";
import { PrayerScreen } from "@/screens/PrayerScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ZmanimScreen } from "@/screens/ZmanimScreen";
import { tapHaptic } from "@/services/haptics";

export type RootTabParamList = {
  Home: undefined;
  Prayer: { prayerId?: string; query?: string } | undefined;
  Zmanim: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootNavigator(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenListeners={{
        tabPress: () => {
          void tapHaptic();
        }
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.white,
        tabBarActiveBackgroundColor: colors.blue,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          borderTopWidth: 0,
          height: 74 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          marginHorizontal: 16,
          marginBottom: 8,
          position: "absolute",
          borderRadius: 4,
          backgroundColor: colors.mineral,
          shadowColor: colors.ink,
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 10 },
          elevation: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 13,
          fontFamily: fonts.medium,
          fontWeight: "500",
          letterSpacing: 0,
          marginTop: 3
        },
        tabBarItemStyle: {
          height: 58,
          marginHorizontal: 4,
          borderRadius: 2,
          paddingVertical: 3
        },
        tabBarIconStyle: {
          height: 24
        }
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: tabIcon(House) }} />
      <Tab.Screen name="Prayer" component={PrayerScreen} options={{ tabBarIcon: tabIcon(BookOpenText) }} />
      <Tab.Screen name="Zmanim" component={ZmanimScreen} options={{ tabBarIcon: tabIcon(CalendarDays) }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon(CircleUserRound) }} />
    </Tab.Navigator>
  );
}

function tabIcon(Icon: typeof House) {
  function TabBarIcon({ color, size, focused }: { color: string; size: number; focused: boolean }): React.JSX.Element {
    return <Icon color={color} size={size} strokeWidth={focused ? 2 : 1.5} />;
  }

  return TabBarIcon;
}
