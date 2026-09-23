import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BookOpenText, CalendarDays, CircleUserRound, House } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts } from "@/design/theme";
import { HomeScreen } from "@/screens/HomeScreen";
import { PrayerScreen } from "@/screens/PrayerScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ZmanimScreen } from "@/screens/ZmanimScreen";
import { tapHaptic } from "@/services/haptics";
import { StateBounce } from "@/components/ui/motion-feedback";

export type RootTabParamList = {
  Home: undefined;
  Prayer: { prayerId?: string; query?: string } | undefined;
  Zmanim: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootNavigator(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <Tab.Navigator
      screenListeners={{
        tabPress: () => {
          void tapHaptic();
        }
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarActiveBackgroundColor: colors.blueSoft,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          borderTopWidth: 0,
          height: 76,
          paddingBottom: 8,
          paddingTop: 8,
          marginHorizontal: 24,
          bottom: bottomInset,
          position: "absolute",
          borderRadius: 38,
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.hairline,
          shadowColor: colors.ink,
          shadowOpacity: 0.1,
          shadowRadius: 24,
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
          marginVertical: 0,
          borderRadius: 29,
          overflow: "hidden",
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
    return (
      <StateBounce trigger={focused}>
        <Icon color={color} size={size} strokeWidth={focused ? 2.2 : 1.5} />
      </StateBounce>
    );
  }

  return TabBarIcon;
}
