import { BlurView } from "expo-blur";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { useEffect, useState, type ComponentProps } from "react";

import { colors } from "@/design/theme";

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
  glassEffectStyle = "regular",
  isInteractive = false,
  style,
  ...props
}: AppGlassSurfaceProps): React.JSX.Element {
  const reduceTransparency = useReduceTransparency();
  const canUseNativeGlass =
    Platform.OS === "ios" &&
    !reduceTransparency &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable();

  if (canUseNativeGlass) {
    return (
      <GlassView
        colorScheme="dark"
        glassEffectStyle={glassEffectStyle}
        isInteractive={isInteractive}
        style={style}
        {...props}
      >
        {children}
      </GlassView>
    );
  }

  if (Platform.OS === "ios" && !reduceTransparency) {
    return (
      <BlurView intensity={64} style={style} tint="dark" {...props}>
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        Platform.OS === "android" ? styles.material : styles.opaque,
        style,
      ]}
      {...props}
    >
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

const styles = StyleSheet.create({
  material: {
    backgroundColor: colors.vellum,
    borderColor: colors.hairlineStrong,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 6,
  },
  opaque: {
    backgroundColor: colors.vellum,
    borderColor: colors.hairlineStrong,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
