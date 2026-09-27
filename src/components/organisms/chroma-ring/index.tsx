import { Canvas, Fill, Shader, Skia } from "@shopify/react-native-skia";
import { memo, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AppState,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useThemeColors } from "@/design/appearance";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SHADER_SOURCE } from "./conf";

type ChromaRingProps = {
  children: ReactNode;
  active?: boolean;
  borderRadius?: number;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
};

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map(
    (offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255,
  ) as [number, number, number];
}

/** Content-sized decoration; the shared Button retains touch/accessibility ownership. */
export const ChromaRing = memo(function ChromaRing({
  children,
  active = true,
  borderRadius = 18,
  borderWidth = 1.5,
  style,
}: ChromaRingProps) {
  const colors = useThemeColors();
  const reduced = useReducedMotion();
  const [foreground, setForeground] = useState(
    AppState.currentState === "active",
  );
  const [size, setSize] = useState({ width: 0, height: 0 });
  const progress = useSharedValue(0);
  const source = useMemo(() => {
    try {
      return Skia.RuntimeEffect.Make(SHADER_SOURCE);
    } catch {
      return null;
    }
  }, []);
  const base = useMemo(
    () => rgb(colors.hairlineStrong),
    [colors.hairlineStrong],
  );
  const glow = useMemo(() => rgb(colors.blue), [colors.blue]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setForeground(state === "active"),
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (source && active && foreground && !reduced) {
      progress.value = withRepeat(
        withTiming(1, { duration: 12000, easing: Easing.linear }),
        -1,
        false,
      );
    }
    return () => cancelAnimation(progress);
  }, [active, foreground, progress, reduced, source]);

  const uniforms = useDerivedValue(() => ({
    iResolution: [size.width, size.height],
    progress: progress.value,
    borderRadius,
    borderWidth,
    baseColor: base,
    glowColor: glow,
  }));

  return (
    <View
      onLayout={({ nativeEvent: { layout } }) =>
        setSize((previous) =>
          previous.width === layout.width && previous.height === layout.height
            ? previous
            : { width: layout.width, height: layout.height },
        )
      }
      style={[
        styles.container,
        { borderRadius, padding: borderWidth, backgroundColor: colors.vellum },
        style,
      ]}
    >
      {children}
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
      >
        {source && size.width > 0 && size.height > 0 ? (
          <Canvas style={StyleSheet.absoluteFill}>
            <Fill>
              <Shader source={source} uniforms={uniforms} />
            </Fill>
          </Canvas>
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius, borderWidth, borderColor: colors.hairlineStrong },
            ]}
          />
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { position: "relative", overflow: "hidden" },
});
