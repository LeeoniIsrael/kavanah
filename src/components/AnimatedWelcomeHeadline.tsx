import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { fonts } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const lines = [
  "Your siddur, wherever you are.",
  "A quiet moment, wherever you are.",
  "Prayer that moves with your day.",
] as const;

function Character({
  char,
  index,
  leaving,
}: {
  char: string;
  index: number;
  leaving: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = leaving
      ? withDelay(index * 9, withTiming(0, { duration: 210 }))
      : withDelay(
          index * 15,
          withSpring(1, { damping: 15, stiffness: 210, mass: 1 }),
        );
  }, [index, leaving, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 18 },
      { scale: 0.82 + progress.value * 0.18 },
    ],
  }));

  return (
    <Animated.Text accessible={false} style={[styles.character, animatedStyle]}>
      {char}
    </Animated.Text>
  );
}

export function AnimatedWelcomeHeadline(): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    let change: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setLeaving(true);
      change = setTimeout(() => {
        setIndex((current) => (current + 1) % lines.length);
        setLeaving(false);
      }, 520);
    }, 4800);
    return () => {
      clearInterval(interval);
      if (change) clearTimeout(change);
    };
  }, [reduceMotion]);

  const line = lines[index] ?? lines[0];
  if (reduceMotion) return <Text style={styles.plain}>{lines[0]}</Text>;

  let characterIndex = 0;
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={line}
      style={styles.line}
    >
      {line.split(" ").map((word, wordIndex) => (
        <View key={`${index}-${wordIndex}`} style={styles.word}>
          {Array.from(word).map((char, indexInWord) => (
            <Character
              key={`${index}-${wordIndex}-${indexInWord}`}
              char={char}
              index={characterIndex++}
              leaving={leaving}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const type = {
  color: "#F4F7FB",
  fontFamily: fonts.semibold,
  fontSize: 25,
  lineHeight: 32,
  letterSpacing: -1.1,
} as const;

const styles = StyleSheet.create({
  plain: type,
  line: {
    minHeight: 64,
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "flex-end",
  },
  word: { flexDirection: "row", marginRight: 6 },
  character: type,
});
