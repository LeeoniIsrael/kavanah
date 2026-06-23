import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BookOpenText, CalendarDays, MessageCircle, Shield, Sparkles } from "lucide-react-native";

import { colors, radii } from "@/design/theme";
import { AssistantScreen } from "@/screens/AssistantScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { PrayerScreen } from "@/screens/PrayerScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ZmanimScreen } from "@/screens/ZmanimScreen";
import { tapHaptic } from "@/services/haptics";

export type RootTabParamList = {
  Home: undefined;
  Prayer: undefined;
  Zmanim: undefined;
  Assistant: undefined;
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
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: "#9AA0A9",
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          height: 92,
          paddingBottom: 24,
          paddingTop: 12,
          marginHorizontal: 14,
          marginBottom: 10,
          position: "absolute",
          borderRadius: radii.xl,
          backgroundColor: colors.vellum,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 1,
          shadowRadius: 22
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0
        },
        tabBarItemStyle: {
          borderRadius: radii.lg
        }
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: tabIcon(Sparkles) }} />
      <Tab.Screen name="Prayer" component={PrayerScreen} options={{ tabBarIcon: tabIcon(BookOpenText) }} />
      <Tab.Screen name="Zmanim" component={ZmanimScreen} options={{ tabBarIcon: tabIcon(CalendarDays) }} />
      <Tab.Screen name="Assistant" component={AssistantScreen} options={{ tabBarIcon: tabIcon(MessageCircle) }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon(Shield) }} />
    </Tab.Navigator>
  );
}

function tabIcon(Icon: typeof Sparkles) {
  function TabBarIcon({ color, size, focused }: { color: string; size: number; focused: boolean }): React.JSX.Element {
    return <Icon color={focused ? colors.gold : color} size={size} strokeWidth={focused ? 2.2 : 1.8} />;
  }

  return TabBarIcon;
}
