import { motion } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useEffect, useRef, type PropsWithChildren } from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";

type MotionProps = PropsWithChildren<{
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

/** A restrained status pulse for live or time-sensitive information. */
export function StatusPulse({
  active = true,
  children,
  style,
}: MotionProps): React.JSX.Element {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!active || reduceMotion) {
      scale.stopAnimation();
      scale.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.22,
          duration: 360,
          easing: Easing.bezier(...motion.snappy),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 520,
          easing: Easing.bezier(...motion.standard),
          useNativeDriver: true,
        }),
        Animated.delay(1500),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [active, reduceMotion, scale]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

/** A one-shot keyframe response for confirmations and icon state changes. */
export function StateBounce({
  trigger,
  children,
  style,
}: PropsWithChildren<{
  trigger: string | number | boolean;
  style?: StyleProp<ViewStyle>;
}>): React.JSX.Element {
  const scale = useRef(new Animated.Value(1)).current;
  const offset = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (reduceMotion) return;

    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.24,
          duration: 130,
          easing: Easing.bezier(...motion.snappy),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          stiffness: 420,
          damping: 20,
          mass: 0.7,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(offset, {
          toValue: -4,
          duration: 120,
          easing: Easing.bezier(...motion.snappy),
          useNativeDriver: true,
        }),
        Animated.spring(offset, {
          toValue: 0,
          stiffness: 420,
          damping: 22,
          mass: 0.7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [offset, reduceMotion, scale, trigger]);

  return (
    <Animated.View
      style={[style, { transform: [{ translateY: offset }, { scale }] }]}
    >
      {children}
    </Animated.View>
  );
}

/** Keeps loader geometry fixed while rotating only its composited layer. */
export function LoadingOrbit({
  active = true,
  children,
  style,
}: MotionProps): React.JSX.Element {
  const rotation = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!active || reduceMotion) {
      rotation.stopAnimation();
      rotation.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 760,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [active, reduceMotion, rotation]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            {
              rotate: rotation.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
