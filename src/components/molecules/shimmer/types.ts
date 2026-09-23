import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export type ShimmerDirection =
  | "leftToRight"
  | "rightToLeft"
  | "topToBottom"
  | "bottomToTop";

export type ShimmerPreset = "dark" | "light" | "twitter" | "neutral" | "custom";

export type ShimmerProps = {
  isLoading?: boolean;
  shimmerColors?: string[];
  duration?: number;
  /** @deprecated Prefer the style prop for portable component styling. */
  className?: string;
  style?: StyleProp<ViewStyle>;
  variant?: "shimmer" | "pulse";
  direction?: ShimmerDirection;
  preset?: ShimmerPreset;
  opacity?: number;
  children?: ReactNode;
  accessibilityLabel?: string;
};

export type ShimmerGroupProps = Omit<ShimmerProps, "className" | "children"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};
