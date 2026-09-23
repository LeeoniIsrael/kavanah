import type { BlurTint } from "expo-blur";
import type { LinearGradientPoint } from "expo-linear-gradient";
import type { ReactNode } from "react";
import type {
  ColorValue,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

export type GradientConfig = {
  colors: readonly [ColorValue, ColorValue, ...ColorValue[]];
  locations?: readonly [number, number, ...number[]] | null;
  start?: LinearGradientPoint;
  end?: LinearGradientPoint;
};

export type BlurConfig = {
  intensity?: number;
  tint?: BlurTint;
};

export type MaskGradientColors = readonly [
  ColorValue,
  ColorValue,
  ...ColorValue[],
];

export type AnimatedHeaderScrollViewProps = {
  largeTitle: string;
  subtitle?: string;
  children: ReactNode;
  leftComponent?: ReactNode;
  rightComponent?: ReactNode;
  showsVerticalScrollIndicator?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  headerBackgroundGradient?: GradientConfig;
  headerBlurConfig?: BlurConfig;
  smallTitleBlurIntensity?: number;
  smallTitleBlurTint?: BlurTint;
  maskGradientColors?: MaskGradientColors;
  largeTitleBlurIntensity?: number;
  largeHeaderTitleStyle?: StyleProp<TextStyle>;
  largeHeaderSubtitleStyle?: StyleProp<TextStyle>;
  smallHeaderTitleStyle?: StyleProp<TextStyle>;
  smallHeaderSubtitleStyle?: StyleProp<TextStyle>;
};
