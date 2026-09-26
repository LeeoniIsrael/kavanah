import type { ReactNode } from "react";
import type {
  AccessibilityRole,
  AccessibilityState,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

export interface RadiantButtonTheme {
  background?: string;
  backgroundSubtle?: string;
  foreground?: string;
  highlight?: string;
  highlightSubtle?: string;
}

export interface RadiantButtonProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  theme?: RadiantButtonTheme;
  paddingHorizontal?: number;
  paddingVertical?: number;
  disabled?: boolean;
  showDots?: boolean;
  showShimmer?: boolean;
  showGlow?: boolean;
  dotSpacing?: number;
  dotRadius?: number;
  dotOpacity?: number;
  shimmerOpacity?: number;
  glowBlur?: number;
  glowWidth?: number;
  breathingEnabled?: boolean;
  glowBandWidth?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
}
