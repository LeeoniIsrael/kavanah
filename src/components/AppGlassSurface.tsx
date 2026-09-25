import {
  useAppColorScheme,
  useThemedStyles,
  type ThemeColors,
} from "@/design/appearance";
import { BlurView } from "expo-blur";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { useEffect, useState, type ComponentProps } from "react";
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import { cn } from "@/lib/utils";

type AppGlassSurfaceProps = ViewProps & {
  children?: React.ReactNode;
  className?: string;
  glassEffectStyle?: ComponentProps<typeof GlassView>["glassEffectStyle"];
  isInteractive?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A platform-aware surface for controls that float above app content.
 * Native Liquid Glass is used only when both the build and runtime support it.
 */
export function AppGlassSurface({
  children,
  className,
  glassEffectStyle = "regular",
  isInteractive = false,
  style,
  ...props
}: AppGlassSurfaceProps): React.JSX.Element {
  const scheme = useAppColorScheme();
  const styles = useThemedStyles(makestyles);

  const reduceTransparency = useReduceTransparency();
  const canUseNativeGlass =
    Platform.OS === "ios" &&
    !reduceTransparency &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable();

  // NativeWind styles belong to a core View. GlassView/BlurView do not
  // interpret className; forwarding it silently loses layout and corner styles.
  return (
    <View
      {...props}
      className={cn("overflow-hidden rounded-lg", className)}
      style={[
        { borderCurve: "continuous" },
        !canUseNativeGlass &&
          (Platform.OS !== "ios" || reduceTransparency) &&
          styles.opaque,
        style,
      ]}
    >
      {canUseNativeGlass ? (
        <GlassView
          pointerEvents="none"
          colorScheme={scheme}
          glassEffectStyle={glassEffectStyle}
          isInteractive={isInteractive}
          style={StyleSheet.absoluteFill}
        />
      ) : Platform.OS === "ios" && !reduceTransparency ? (
        <BlurView
          pointerEvents="none"
          intensity={64}
          tint={scheme}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {children}
    </View>
  );
}

function useReduceTransparency(): boolean {
  // Start conservatively opaque until the accessibility preference resolves.
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    void AccessibilityInfo.isReduceTransparencyEnabled().then(setEnabled);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      setEnabled,
    );
    return () => subscription.remove();
  }, []);

  return enabled;
}

const makestyles = (colors: ThemeColors) =>
  StyleSheet.create({
    opaque: {
      backgroundColor: colors.vellum,
    },
  });
