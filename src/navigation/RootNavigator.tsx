import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BookOpenText, CalendarDays, Shield, Sparkles } from "lucide-react-native";

import { colors, radii } from "@/design/theme";
import { HomeScreen } from "@/screens/HomeScreen";
import { PrayerScreen } from "@/screens/PrayerScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ZmanimScreen } from "@/screens/ZmanimScreen";
import { tapHaptic } from "@/services/haptics";

export type RootTabParamList = {
  Home: undefined;
  Prayer: undefined;
  Zmanim: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootNavigator(): React.JSX.Element {
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
        tabBarInactiveTintColor: "#8A929B",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.hairline,
          elevation: 0,
          height: 78,
          paddingBottom: 18,
          paddingTop: 8,
          marginHorizontal: 0,
          marginBottom: 0,
          position: "absolute",
          borderRadius: 0,
          backgroundColor: colors.white
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0
        },
        tabBarItemStyle: {
          borderRadius: radii.md
        }
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: tabIcon(Sparkles) }} />
      <Tab.Screen name="Prayer" component={PrayerScreen} options={{ tabBarIcon: tabIcon(BookOpenText) }} />
      <Tab.Screen name="Zmanim" component={ZmanimScreen} options={{ tabBarIcon: tabIcon(CalendarDays) }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon(Shield) }} />
    </Tab.Navigator>
  );
}

function tabIcon(Icon: typeof Sparkles) {
  function TabBarIcon({ color, size, focused }: { color: string; size: number; focused: boolean }): React.JSX.Element {
    return <Icon color={focused ? colors.blue : color} size={size} strokeWidth={focused ? 2.2 : 1.8} />;
  }

  return TabBarIcon;
}
