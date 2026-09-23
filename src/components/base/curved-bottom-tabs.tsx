import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts } from "@/design/theme";

export type CurvedTab = {
  id: string;
  title: string;
  icon: ReactNode;
  badge?: number;
};

export type CurvedBottomTabsProps = {
  tabs: CurvedTab[];
  currentIndex: number;
  onPress: (index: number, tab: CurvedTab) => void;
  onLongPress?: (index: number, tab: CurvedTab) => void;
  gradient?: readonly [string, string];
  barHeight?: number;
  buttonScale?: number;
  activeColor?: string;
  inactiveColor?: string;
  labelColor?: string;
  textSize?: number;
  fontFamily?: string;
  shadow?: ViewStyle;
};

const FLOATING_BUTTON_SIZE = 58;
const BAR_TOP = 18;
const BAR_RADIUS = 26;

/**
 * A floating bottom bar whose active destination rises above the dock.
 * The component is navigation-agnostic so it can also be reused outside React Navigation.
 */
export function CurvedBottomTabs({
  tabs,
  currentIndex,
  onPress,
  onLongPress,
  gradient = [colors.blue, "#5969E8"],
  barHeight = 72,
  buttonScale = 1,
  activeColor = colors.white,
  inactiveColor = colors.inkMuted,
  labelColor = colors.blue,
  textSize = 11,
  fontFamily = fonts.medium,
  shadow,
}: CurvedBottomTabsProps): React.JSX.Element {
  const totalHeight = BAR_TOP + barHeight;
  if (tabs.length === 0 || !tabs[currentIndex]) return <></>;
  const itemWidth = `${100 / tabs.length}%` as `${number}%`;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { height: totalHeight }, shadow]}
    >
      <View
        pointerEvents="none"
        style={[styles.bar, { height: barHeight, top: BAR_TOP }]}
      />

      <View style={styles.items}>
        {tabs.map((tab, index) => {
          const selected = index === currentIndex;
          return (
            <Pressable
              accessibilityLabel={tab.title}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              key={tab.id}
              onLongPress={() => onLongPress?.(index, tab)}
              onPress={() => onPress(index, tab)}
              style={({ pressed }) => [
                styles.item,
                {
                  height: totalHeight,
                  opacity: pressed ? 0.66 : 1,
                  width: itemWidth,
                },
              ]}
              testID={`tab-${tab.id}`}
            >
              {selected ? (
                <LinearGradient
                  colors={gradient}
                  pointerEvents="none"
                  style={[
                    styles.floatingButton,
                    { transform: [{ scale: buttonScale }] },
                  ]}
                >
                  {tintIcon(tab.icon, activeColor, true)}
                  {typeof tab.badge === "number" && tab.badge > 0 ? (
                    <Badge count={tab.badge} floating />
                  ) : null}
                </LinearGradient>
              ) : null}
              <View style={[styles.inlineIcon, selected && styles.hiddenIcon]}>
                {tintIcon(tab.icon, inactiveColor, false)}
                {typeof tab.badge === "number" && tab.badge > 0 ? (
                  <Badge count={tab.badge} />
                ) : null}
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  {
                    color: selected ? labelColor : inactiveColor,
                    fontFamily,
                    fontSize: textSize,
                  },
                ]}
              >
                {tab.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type TintableIconProps = {
  color?: string;
  size?: number;
  strokeWidth?: number;
};

function tintIcon(icon: ReactNode, color: string, active: boolean): ReactNode {
  if (!isValidElement<TintableIconProps>(icon)) return icon;
  return cloneElement(icon as ReactElement<TintableIconProps>, {
    color,
    size: active ? 25 : 23,
    strokeWidth: active ? 2.25 : 1.65,
  });
}

function Badge({
  count,
  floating = false,
}: {
  count: number;
  floating?: boolean;
}): React.JSX.Element {
  return (
    <View style={[styles.badge, floating && styles.floatingBadge]}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

export function CurvedTabBarNavigation({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const tabs: CurvedTab[] = state.routes.map((route) => {
    const options = descriptors[route.key]?.options;
    const focused = state.routes[state.index]?.key === route.key;
    const color = focused ? colors.white : colors.inkMuted;
    const icon = options?.tabBarIcon?.({ focused, color, size: 24 }) ?? null;
    const rawLabel = options?.tabBarLabel ?? options?.title ?? route.name;
    return {
      id: route.key,
      title: typeof rawLabel === "string" ? rawLabel : route.name,
      icon,
      ...(typeof options?.tabBarBadge === "number"
        ? { badge: options.tabBarBadge }
        : {}),
    };
  });

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.navigationPosition,
        { bottom: Math.max(insets.bottom, 10) },
      ]}
    >
      <CurvedBottomTabs
        currentIndex={state.index}
        onLongPress={(index) => {
          const route = state.routes[index];
          if (route)
            navigation.emit({ type: "tabLongPress", target: route.key });
        }}
        onPress={(index) => {
          const route = state.routes[index];
          if (!route) return;
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (index !== state.index && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        }}
        tabs={tabs}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  navigationPosition: {
    alignItems: "center",
    alignSelf: "center",
    position: "absolute",
    left: 18,
    right: 18,
  },
  container: {
    alignSelf: "center",
    maxWidth: 600,
    width: "100%",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 12,
  },
  bar: {
    backgroundColor: colors.glass,
    borderColor: colors.hairlineStrong,
    borderRadius: BAR_RADIUS,
    borderWidth: 1,
    left: 0,
    position: "absolute",
    right: 0,
  },
  items: {
    bottom: 0,
    flexDirection: "row",
    height: "100%",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  item: {
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 11,
    position: "relative",
  },
  inlineIcon: {
    alignItems: "center",
    height: 27,
    justifyContent: "center",
    marginBottom: 2,
    position: "relative",
  },
  hiddenIcon: {
    opacity: 0,
  },
  label: {
    lineHeight: 14,
  },
  floatingButton: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.20)",
    borderRadius: FLOATING_BUTTON_SIZE / 2,
    borderWidth: 1,
    height: FLOATING_BUTTON_SIZE,
    justifyContent: "center",
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    position: "absolute",
    top: 0,
    width: FLOATING_BUTTON_SIZE,
    elevation: 10,
  },
  badge: {
    alignItems: "center",
    backgroundColor: colors.danger,
    borderColor: colors.vellum,
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    justifyContent: "center",
    minWidth: 16,
    paddingHorizontal: 3,
    position: "absolute",
    right: -9,
    top: -5,
  },
  floatingBadge: {
    borderColor: colors.blue,
    right: 4,
    top: 4,
  },
  badgeText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 8,
    lineHeight: 10,
  },
});
