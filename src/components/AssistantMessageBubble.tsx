import { AssistantResponseText } from "@/components/AssistantResponseText";
import { BrandMark } from "@/components/BrandMark";
import { Text } from "@/components/ui/text";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { AssistantMessage } from "@/services/assistantService";
import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

export function AssistantMessageBubble({ message }: { message: AssistantMessage }): React.JSX.Element {
  const progress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();
  const isUser = message.role === "user";

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      damping: 18,
      stiffness: 210,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{
          translateY: reduceMotion ? 0 : progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
        }, { scale: reduceMotion ? 1 : progress.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }],
      }}
      className={isUser ? "self-end max-w-[88%]" : "self-start w-full"}
    >
      {isUser ? (
        <View className="rounded-lg rounded-br-sm bg-foreground px-4 py-3 shadow-card">
          <Text variant="body" className="text-white text-[15px] leading-[22px]">{message.content}</Text>
        </View>
      ) : (
        <View className="flex-row items-start gap-3 py-3">
          <View className="mt-0.5 h-8 w-8 overflow-hidden rounded-md bg-foreground items-center justify-center">
            <BrandMark size={25} inverted />
          </View>
          <View className="flex-1 border-l border-l-hairlineStrong pl-3">
            {message.content ? (
              <AssistantResponseText content={message.content} className="text-foreground text-[15px] leading-[23px]" />
            ) : (
              <View className="flex-row gap-1 py-2" accessibilityLabel="Thinking">
                {[0.35, 0.6, 1].map((opacity) => <View key={opacity} className="h-1.5 w-1.5 rounded-full bg-primary" style={{ opacity }} />)}
              </View>
            )}
          </View>
        </View>
      )}
    </Animated.View>
  );
}
