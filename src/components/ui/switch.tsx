import { cn } from "@/lib/utils";
import { motion } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import * as SwitchPrimitives from "@rn-primitives/switch";
import { useEffect, useRef } from "react";
import { Animated, Easing, Platform } from "react-native";

const AnimatedThumb = Animated.createAnimatedComponent(SwitchPrimitives.Thumb);

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitives.Root>) {
  const progress = useRef(new Animated.Value(props.checked ? 1 : 0)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    Animated.timing(progress, {
      toValue: props.checked ? 1 : 0,
      duration: reduceMotion ? 0 : motion.stateMs,
      easing: Easing.bezier(...motion.snappy),
      useNativeDriver: true,
    }).start();
  }, [progress, props.checked, reduceMotion]);

  return (
    <SwitchPrimitives.Root
      hitSlop={8}
      className={cn(
        "flex h-7 w-12 shrink-0 flex-row items-center rounded-full border border-transparent",
        Platform.select({
          web: "focus-visible:border-ring focus-visible:ring-ring/50 peer inline-flex outline-none transition-all focus-visible:ring-[3px] disabled:cursor-not-allowed",
        }),
        props.checked ? "bg-primary" : "bg-input dark:bg-input/80",
        props.disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      <AnimatedThumb
        className={cn(
          "bg-white size-6 rounded-full",
          Platform.select({
            web: "pointer-events-none block ring-0",
          }),
          props.checked ? "dark:bg-primary-foreground" : "dark:bg-foreground",
        )}
        style={{
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 20],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 0.9, 1],
              }),
            },
          ],
        }}
      />
    </SwitchPrimitives.Root>
  );
}

export { Switch };
