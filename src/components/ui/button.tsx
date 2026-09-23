import { TextClassContext } from "@/components/ui/text";
import { motion } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import {
  confirmHaptic,
  softHaptic,
  successHaptic,
  tapHaptic,
} from "@/services/haptics";
import { cva, type VariantProps } from "class-variance-authority";
import { useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const buttonVariants = cva(
  cn(
    "group shrink-0 flex-row items-center justify-center gap-2 rounded-md shadow-none",
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    }),
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-primary active:bg-primary/90",
          Platform.select({ web: "hover:bg-primary/90" }),
        ),
        destructive: cn(
          "bg-destructive active:bg-destructive/90 dark:bg-destructive/60",
          Platform.select({
            web: "hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
          }),
        ),
        outline: cn(
          "border-border bg-background active:bg-accent dark:bg-input/30 dark:border-input dark:active:bg-input/50 border",
          Platform.select({
            web: "hover:bg-accent dark:hover:bg-input/50",
          }),
        ),
        secondary: cn(
          "bg-secondary active:bg-secondary/80",
          Platform.select({ web: "hover:bg-secondary/80" }),
        ),
        ghost: cn(
          "active:bg-accent dark:active:bg-accent/50",
          Platform.select({ web: "hover:bg-accent dark:hover:bg-accent/50" }),
        ),
        link: "",
      },
      size: {
        default: cn(
          "min-h-12 px-4 py-3",
          Platform.select({ web: "has-[>svg]:px-3" }),
        ),
        sm: cn(
          "min-h-11 gap-1.5 rounded-md px-3 py-2",
          Platform.select({ web: "has-[>svg]:px-2.5" }),
        ),
        lg: cn(
          "min-h-14 rounded-md px-6 py-3",
          Platform.select({ web: "has-[>svg]:px-4" }),
        ),
        icon: "size-11",
        content: "h-auto p-0 flex-col items-stretch justify-start rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const buttonTextVariants = cva(
  cn(
    "text-foreground text-sm font-heading",
    Platform.select({ web: "pointer-events-none transition-colors" }),
  ),
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        destructive: "text-white",
        outline: cn(
          "group-active:text-accent-foreground",
          Platform.select({ web: "group-hover:text-accent-foreground" }),
        ),
        secondary: "text-secondary-foreground",
        ghost: "group-active:text-accent-foreground",
        link: cn(
          "text-primary group-active:underline",
          Platform.select({
            web: "underline-offset-4 hover:underline group-hover:underline",
          }),
        ),
      },
      size: {
        default: "",
        sm: "",
        lg: "",
        icon: "",
        content: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type HapticTone = "selection" | "soft" | "confirm" | "success" | "none";
type ButtonProps = Omit<PressableProps, "style"> &
  VariantProps<typeof buttonVariants> & {
    style?: StyleProp<ViewStyle>;
    pressedScale?: number;
    haptic?: boolean | HapticTone;
  };

const AnimatedButton = Animated.createAnimatedComponent(Pressable);

function Button({
  className,
  variant,
  size,
  style,
  onPress,
  onPressIn,
  onPressOut,
  pressedScale = 0.985,
  haptic = "soft",
  ...props
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();
  const animateTo = (value: number) => {
    scale.stopAnimation();
    lift.stopAnimation();
    if (value === 1 && !reduceMotion) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          stiffness: 520,
          damping: 28,
          mass: 0.72,
          useNativeDriver: true,
        }),
        Animated.spring(lift, {
          toValue: 0,
          stiffness: 520,
          damping: 30,
          mass: 0.72,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }
    Animated.parallel([
      Animated.timing(scale, {
        toValue: reduceMotion ? 1 : value,
        duration: motion.pressMs,
        easing: Easing.bezier(...motion.snappy),
        useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: reduceMotion ? 0 : 1.5,
        duration: motion.pressMs,
        easing: Easing.bezier(...motion.snappy),
        useNativeDriver: true,
      }),
    ]).start();
  };
  const playHaptic = async () => {
    if (haptic === false || haptic === "none") return;
    if (haptic === true || haptic === "selection") return tapHaptic();
    if (haptic === "confirm") return confirmHaptic();
    if (haptic === "success") return successHaptic();
    return softHaptic();
  };
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <AnimatedButton
        accessibilityRole="button"
        {...props}
        className={cn(
          buttonVariants({ variant, size }),
          props.disabled && "opacity-50",
          className,
        )}
        style={[style, { transform: [{ scale }, { translateY: lift }] }]}
        onPress={(event) => {
          void playHaptic();
          onPress?.(event);
        }}
        onPressIn={(event) => {
          animateTo(pressedScale);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          animateTo(1);
          onPressOut?.(event);
        }}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
