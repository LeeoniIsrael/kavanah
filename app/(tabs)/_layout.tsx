import { colors, fonts } from "@/design/theme";
import { tapHaptic } from "@/services/haptics";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import type { ComponentProps, ComponentType, PropsWithChildren } from "react";

const SystemTabs = NativeTabs as ComponentType<
  PropsWithChildren<ComponentProps<typeof NativeTabs>>
>;

export default function TabsLayout(): React.JSX.Element {
  return (
    <SystemTabs
      disableTransparentOnScrollEdge
      iconColor={{ default: colors.inkMuted, selected: colors.blue }}
      labelStyle={{ fontFamily: fonts.medium }}
      minimizeBehavior="onScrollDown"
      screenListeners={{ tabPress: () => void tapHaptic() }}
      tabBarRespectsIMEInsets
      tintColor={colors.blue}
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md={{ default: "home", selected: "home_filled" }}
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="prayer">
        <NativeTabs.Trigger.Icon
          sf={{ default: "book.closed", selected: "book.closed.fill" }}
          md={{ default: "menu_book", selected: "menu_book" }}
        />
        <NativeTabs.Trigger.Label>Prayer</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="zmanim">
        <NativeTabs.Trigger.Icon
          sf={{ default: "calendar", selected: "calendar.circle.fill" }}
          md={{ default: "calendar_today", selected: "calendar_month" }}
        />
        <NativeTabs.Trigger.Label>Zmanim</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="circle">
        <NativeTabs.Trigger.Icon
          sf={{ default: "person.2", selected: "person.2.fill" }}
          md="groups"
        />
        <NativeTabs.Trigger.Label>Circle</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md={{ default: "person", selected: "person" }}
        />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </SystemTabs>
  );
}
