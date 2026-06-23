import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BookOpenText, CalendarDays, MessageCircle, Shield, Sparkles } from "lucide-react-native";

import { AssistantScreen } from "@/screens/AssistantScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { PrayerScreen } from "@/screens/PrayerScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ZmanimScreen } from "@/screens/ZmanimScreen";

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
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#111827",
        tabBarInactiveTintColor: "#8A8F98",
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          height: 84,
          paddingBottom: 24,
          paddingTop: 10,
          backgroundColor: "#F7F4EE"
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600"
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
  return ({ color, size }: { color: string; size: number }) => <Icon color={color} size={size} strokeWidth={1.8} />;
}
