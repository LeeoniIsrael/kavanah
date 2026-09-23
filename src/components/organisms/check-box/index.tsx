import { colors, motion } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useEffect } from "react";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path, Rect } from "react-native-svg";

import { checkboxConfig } from "./conf";
import type { CheckboxProps } from "./types";

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type { CheckboxProps } from "./types";

/**
 * A controlled, presentational checkbox whose checkmark draws in both
 * directions. Put it inside the Pressable that owns the checkbox semantics.
 */
export function Checkbox({
  checked = false,
  checkmarkColor = colors.white,
  showBorder = true,
  size = checkboxConfig.defaultSize,
  stroke = checkboxConfig.defaultStroke,
}: CheckboxProps): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const pathLength = size;
  const progress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(checked ? 1 : 0, {
      duration: reduceMotion ? 0 : motion.stateMs,
    });
  }, [checked, progress, reduceMotion]);

  const animatedPathProps = useAnimatedProps(() => ({
    strokeDashoffset: pathLength * (1 - progress.value),
    opacity: progress.value,
  }));

  const inset = Math.max(stroke / 2, 1);
  const cornerRadius = size * 0.25;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Rect
        x={inset}
        y={inset}
        width={size - inset * 2}
        height={size - inset * 2}
        rx={cornerRadius}
        fill={checked ? colors.gold : "transparent"}
        stroke={
          showBorder
            ? checked
              ? colors.gold
              : colors.hairlineStrong
            : "transparent"
        }
        strokeWidth={stroke}
      />
      <AnimatedPath
        animatedProps={animatedPathProps}
        d={`M ${size * 0.25} ${size * 0.52} L ${size * 0.43} ${size * 0.69} L ${size * 0.76} ${size * 0.32}`}
        fill="none"
        stroke={checkmarkColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
      />
    </Svg>
  );
}
