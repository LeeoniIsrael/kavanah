import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  BookOpenText,
  CalendarDays,
  CircleUserRound,
  House,
} from "lucide-react-native";

import { CurvedTabBarNavigation } from "@/components/base/curved-bottom-tabs";
import { colors } from "@/design/theme";
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
  return (
    <Tab.Navigator
      tabBar={(props) => <CurvedTabBarNavigation {...props} />}
      screenListeners={{
        tabPress: () => {
          void tapHaptic();
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: tabIcon(House) }}
      />
      <Tab.Screen
        name="Prayer"
        component={PrayerScreen}
        options={{ tabBarIcon: tabIcon(BookOpenText) }}
      />
      <Tab.Screen
        name="Zmanim"
        component={ZmanimScreen}
        options={{ tabBarIcon: tabIcon(CalendarDays) }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: tabIcon(CircleUserRound) }}
      />
    </Tab.Navigator>
  );
}

function tabIcon(Icon: typeof House) {
  function TabBarIcon({
    color,
    size,
    focused,
  }: {
    color: string;
    size: number;
    focused: boolean;
  }): React.JSX.Element {
    return (
      <StateBounce trigger={focused}>
        <Icon color={color} size={size} strokeWidth={focused ? 2.2 : 1.5} />
      </StateBounce>
    );
  }

  return TabBarIcon;
}
