import React, { memo, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import {
  BlurMask,
  Canvas,
  Fill,
  Group,
  LinearGradient,
  Mask,
  Rect,
  RoundedRect,
  Shader,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { BORDER_GLOW_SHADER } from "./conf";
import { createDotShaderSource, hexToRgb } from "./helpers";
import type { RadiantButtonProps, RadiantButtonTheme } from "./types";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const defaultTheme: Required<RadiantButtonTheme> = {
  background: "#000000",
  backgroundSubtle: "#1a1a1a",
  foreground: "#ffffff",
  highlight: "#c084fc",
  highlightSubtle: "#a855f7",
};

function RadiantButtonComponent({
  children,
  onPress,
  style,
  textStyle,
  borderRadius = 12,
  borderWidth = 2,
  duration = 3000,
  theme: themeProp,
  paddingHorizontal = 24,
  paddingVertical = 14,
  disabled = false,
  showDots = true,
  showShimmer = true,
  showGlow = true,
  dotSpacing = 5,
  dotRadius = 0.65,
  dotOpacity = 0.35,
  shimmerOpacity = 0.35,
  glowBlur = 18,
  glowWidth = 0.7,
  breathingEnabled = true,
  glowBandWidth = 0.15,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = "button",
  accessibilityState,
}: RadiantButtonProps): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const shimmerAngle = useSharedValue(0);
  const breathe = useSharedValue(0);
  const pressed = useSharedValue(0);
  const theme = useMemo(
    () => ({ ...defaultTheme, ...themeProp }),
    [themeProp],
  );
  const highlightRgb = useMemo(
    () => hexToRgb(theme.highlight),
    [theme.highlight],
  );
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const borderGlowShader = useMemo(() => {
    try {
      return Skia.RuntimeEffect.Make(BORDER_GLOW_SHADER);
    } catch {
      return null;
    }
  }, []);
  const dotShader = useMemo(() => {
    if (!showDots) return null;
    try {
      return Skia.RuntimeEffect.Make(
        createDotShaderSource(dotSpacing, dotRadius, dotOpacity),
      );
    } catch {
      return null;
    }
  }, [dotOpacity, dotRadius, dotSpacing, showDots]);

  useEffect(() => {
    if (disabled || reduceMotion) {
      progress.value = 0;
      shimmerAngle.value = 0;
      breathe.value = 0;
      return;
    }

    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false,
    );
    if (showShimmer) {
      shimmerAngle.value = withRepeat(
        withTiming(360, { duration: duration / 0.4, easing: Easing.linear }),
        -1,
        false,
      );
    }
    if (breathingEnabled && showGlow) {
      breathe.value = withRepeat(
        withTiming(1, {
          duration: duration * 1.5,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      );
    }

    return () => {
      cancelAnimation(progress);
      cancelAnimation(shimmerAngle);
      cancelAnimation(breathe);
    };
  }, [
    breathe,
    breathingEnabled,
    disabled,
    duration,
    progress,
    reduceMotion,
    shimmerAngle,
    showGlow,
    showShimmer,
  ]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height },
    );
  };

  const { width, height } = layout;
  const centerX = width / 2;
  const centerY = height / 2;
  const innerClip = useMemo(() => {
    if (!width || !height) return undefined;
    const path = Skia.Path.Make();
    path.addRRect(
      Skia.RRectXY(
        Skia.XYWHRect(
          borderWidth,
          borderWidth,
          width - borderWidth * 2,
          height - borderWidth * 2,
        ),
        Math.max(borderRadius - borderWidth, 0),
        Math.max(borderRadius - borderWidth, 0),
      ),
    );
    return path;
  }, [borderRadius, borderWidth, height, width]);

  const borderGlowUniforms = useDerivedValue(() => ({
    iResolution: [width, height] as [number, number],
    progress: progress.value,
    borderRadius,
    borderWidth,
    bandWidth: interpolate(
      pressed.value,
      [0, 1],
      [glowBandWidth, glowBandWidth * 2],
    ),
    highlightColor: highlightRgb,
  }));
  const dotUniforms = useDerivedValue(() => ({
    iResolution: [width, height] as [number, number],
    angle: progress.value * Math.PI * 2,
  }));
  const shimmerTransform = useDerivedValue(() => [
    { rotate: (shimmerAngle.value * Math.PI) / 180 },
  ]);
  const glowOpacity = useDerivedValue(() => {
    const breatheAddition = breathingEnabled
      ? interpolate(breathe.value, [0, 1], [0, 0.2])
      : 0;
    return (
      0.25 +
      breatheAddition +
      interpolate(pressed.value, [0, 1], [0, 0.5])
    );
  });
  const glowTransform = useDerivedValue(() => [
    {
      scale: breathingEnabled
        ? interpolate(breathe.value, [0, 1], [1, 1.15])
        : 1,
    },
  ]);
  const animatedPressStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(pressed.value, [0, 1], [0, 1]) }],
  }));
  const shimmerSize = Math.max(width, height) * 1.5;

  return (
    <Animated.View style={animatedPressStyle}>
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        accessibilityState={{ ...accessibilityState, disabled }}
        disabled={disabled}
        onLayout={handleLayout}
        onPress={onPress}
        onPressIn={() => {
          // Reanimated SharedValues are intentionally mutable animation state.
          // eslint-disable-next-line react-hooks/immutability
          pressed.value = withTiming(1, { duration: reduceMotion ? 0 : 300 });
        }}
        onPressOut={() => {
          // Reanimated SharedValues are intentionally mutable animation state.
          // eslint-disable-next-line react-hooks/immutability
          pressed.value = withTiming(0, { duration: reduceMotion ? 0 : 600 });
        }}
        style={[
          styles.button,
          {
            borderRadius,
            opacity: disabled ? 0.5 : 1,
            paddingHorizontal,
            paddingVertical,
          },
          style,
        ]}
      >
        {width > 0 && height > 0 && innerClip ? (
          <Canvas style={StyleSheet.absoluteFill}>
            {borderGlowShader ? (
              <Group>
                <Rect x={0} y={0} width={width} height={height}>
                  <Shader
                    source={borderGlowShader}
                    uniforms={borderGlowUniforms}
                  />
                  <BlurMask blur={6} style="normal" />
                </Rect>
                <Rect x={0} y={0} width={width} height={height}>
                  <Shader
                    source={borderGlowShader}
                    uniforms={borderGlowUniforms}
                  />
                </Rect>
              </Group>
            ) : null}

            <Group clip={innerClip}>
              <Rect
                x={borderWidth}
                y={borderWidth}
                width={width - borderWidth * 2}
                height={height - borderWidth * 2}
                color={theme.background}
              />
              <RoundedRect
                x={borderWidth}
                y={borderWidth}
                width={width - borderWidth * 2}
                height={height - borderWidth * 2}
                r={Math.max(borderRadius - borderWidth, 0)}
                color={theme.backgroundSubtle}
                style="stroke"
                strokeWidth={1}
              />
              {showDots && dotShader ? (
                <Fill>
                  <Shader source={dotShader} uniforms={dotUniforms} />
                </Fill>
              ) : null}
              {showShimmer ? (
                <Mask
                  mask={
                    <Rect
                      x={borderWidth}
                      y={borderWidth}
                      width={width - borderWidth * 2}
                      height={height - borderWidth * 2}
                    >
                      <LinearGradient
                        start={vec(centerX, borderWidth)}
                        end={vec(centerX, height - borderWidth)}
                        colors={["transparent", "transparent", "white"]}
                        positions={[0, 0.4, 1]}
                      />
                    </Rect>
                  }
                >
                  <Group
                    transform={shimmerTransform}
                    origin={vec(centerX, centerY)}
                    opacity={shimmerOpacity}
                  >
                    <Rect
                      x={centerX - shimmerSize / 2}
                      y={centerY - shimmerSize / 2}
                      width={shimmerSize}
                      height={shimmerSize}
                    >
                      <LinearGradient
                        start={vec(0, 0)}
                        end={vec(shimmerSize, shimmerSize * 0.7)}
                        colors={[
                          "transparent",
                          "transparent",
                          theme.highlight,
                          "transparent",
                          "transparent",
                        ]}
                        positions={[0, 0.35, 0.5, 0.65, 1]}
                      />
                    </Rect>
                  </Group>
                </Mask>
              ) : null}
              {showGlow ? (
                <Group
                  transform={glowTransform}
                  origin={vec(centerX, height)}
                  opacity={glowOpacity}
                >
                  <RoundedRect
                    x={centerX - (width * glowWidth) / 2}
                    y={height - 22}
                    width={width * glowWidth}
                    height={26}
                    r={13}
                    color={theme.highlight}
                  >
                    <BlurMask blur={glowBlur} style="normal" />
                  </RoundedRect>
                </Group>
              ) : null}
            </Group>
          </Canvas>
        ) : null}
        <View style={styles.content}>
          {typeof children === "string" ? (
            <Text style={[styles.text, { color: theme.foreground }, textStyle]}>
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    overflow: "hidden",
    position: "relative",
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    width: "100%",
    zIndex: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export const RadiantButton = memo(RadiantButtonComponent);
export default RadiantButton;
