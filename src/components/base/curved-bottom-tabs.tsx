import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  createAnimatedComponent,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts, motion } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

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

const AnimatedPath = createAnimatedComponent(Path);
const FLOATING_BUTTON_SIZE = 58;
const BAR_TOP = 25;
const NOTCH_DEPTH = 32;
const NOTCH_HALF_WIDTH = 36;
const BAR_RADIUS = 22;

/**
 * An animated bottom bar whose active destination sits in a moving curved cradle.
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
  const [width, setWidth] = useState(0);
  const animatedIndex = useSharedValue(currentIndex);
  const reduceMotion = useReducedMotion();
  const segmentWidth = tabs.length > 0 ? width / tabs.length : 0;
  const totalHeight = BAR_TOP + barHeight;
  const activeTab = tabs[currentIndex];

  useEffect(() => {
    animatedIndex.value = reduceMotion
      ? currentIndex
      : withTiming(currentIndex, {
          duration: motion.navigationMs,
          easing: Easing.bezier(...motion.snappy),
        });
  }, [animatedIndex, currentIndex, reduceMotion]);

  const animatedPathProps = useAnimatedProps(() => {
    const center = segmentWidth * (animatedIndex.value + 0.5);
    const left = center - NOTCH_HALF_WIDTH;
    const right = center + NOTCH_HALF_WIDTH;
    const leftRadius = Math.min(BAR_RADIUS, Math.max(0, left));
    const rightRadius = Math.min(BAR_RADIUS, Math.max(0, width - right));
    const d = [
      `M 0 ${leftRadius}`,
      `Q 0 0 ${leftRadius} 0`,
      `H ${left}`,
      `C ${center - 29} 0 ${center - 34} ${NOTCH_DEPTH} ${center} ${NOTCH_DEPTH}`,
      `C ${center + 34} ${NOTCH_DEPTH} ${center + 29} 0 ${right} 0`,
      `H ${width - rightRadius}`,
      `Q ${width} 0 ${width} ${rightRadius}`,
      `V ${barHeight - BAR_RADIUS}`,
      `Q ${width} ${barHeight} ${width - BAR_RADIUS} ${barHeight}`,
      `H ${BAR_RADIUS}`,
      `Q 0 ${barHeight} 0 ${barHeight - BAR_RADIUS}`,
      "Z",
    ].join(" ");
    return { d };
  });

  const floatingButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: segmentWidth * animatedIndex.value },
      { scale: buttonScale },
    ],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  if (tabs.length === 0 || !activeTab) return <></>;

  return (
    <View
      onLayout={handleLayout}
      pointerEvents="box-none"
      style={[styles.container, { height: totalHeight }]}
    >
      {width > 0 ? (
        <Svg
          height={barHeight + 1}
          pointerEvents="none"
          style={[styles.bar, { top: BAR_TOP }, shadow]}
          viewBox={`0 0 ${width} ${barHeight}`}
          width={width}
        >
          <AnimatedPath
            animatedProps={animatedPathProps}
            fill={colors.glass}
            stroke={colors.hairlineStrong}
            strokeWidth={1}
          />
        </Svg>
      ) : null}

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
                { height: totalHeight, opacity: pressed ? 0.66 : 1 },
              ]}
              testID={`tab-${tab.id}`}
            >
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

      {width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.floatingSlot,
            { width: segmentWidth },
            floatingButtonStyle,
          ]}
        >
          <LinearGradient colors={gradient} style={styles.floatingButton}>
            {tintIcon(activeTab.icon, activeColor, true)}
            {typeof activeTab.badge === "number" && activeTab.badge > 0 ? (
              <Badge count={activeTab.badge} floating />
            ) : null}
          </LinearGradient>
        </Animated.View>
      ) : null}
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
        { bottom: Math.max(insets.bottom, 12) },
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
    position: "absolute",
    left: 18,
    right: 18,
  },
  container: {
    width: "100%",
  },
  bar: {
    left: 0,
    position: "absolute",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 12,
  },
  items: {
    flexDirection: "row",
    width: "100%",
  },
  item: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 11,
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
  floatingSlot: {
    alignItems: "center",
    left: 0,
    position: "absolute",
    top: 0,
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
