import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Animated, Platform, Text, type TextStyle, type ViewStyle } from "react-native";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function GradientWaveText({ children, style, textStyle }: {
  children: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}): React.JSX.Element {
  const [width, setWidth] = useState(240);
  const [phase] = useState(() => new Animated.Value(0));
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion) return;
    const animation = Animated.loop(Animated.timing(phase, {
      toValue: 1, duration: 3600, useNativeDriver: true,
    }));
    animation.start();
    return () => animation.stop();
  }, [phase, reduceMotion]);
  if (Platform.OS === "web") return (
    <Text style={[textStyle, { textAlign: "center", backgroundImage: "linear-gradient(90deg, #8DB6E8, #F4F7FF, #A8A4F4, #8DB6E8, #F4F7FF, #A8A4F4, #8DB6E8)", backgroundSize: "200% 100%", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: reduceMotion ? undefined : "kavanah-wave 3.6s linear infinite" } as TextStyle]}>{children}</Text>
  );
  return (
    <MaskedView
      style={style}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      maskElement={<Text style={[{ color: "black", textAlign: "center" }, textStyle]}>{children}</Text>}
    >
      <Animated.View style={{ width: width * 2, transform: [{ translateX: phase.interpolate({ inputRange: [0, 1], outputRange: [0, -width] }) }] }}>
        <LinearGradient
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          colors={["#8DB6E8", "#F4F7FF", "#A8A4F4", "#8DB6E8", "#F4F7FF", "#A8A4F4", "#8DB6E8"]}
          locations={[0, 0.16, 0.33, 0.5, 0.66, 0.83, 1]}
          style={{ height: textStyle?.lineHeight ?? 80 }}
        />
      </Animated.View>
    </MaskedView>
  );
}
