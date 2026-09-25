import { AssistantResponseText } from "@/components/AssistantResponseText";
import { Text } from "@/components/ui/text";
import { useThemedStyles, type ThemeColors } from "@/design/appearance";
import { fonts } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { AssistantMessage } from "@/services/assistantService";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

export function AssistantMessageBubble({
  message,
}: {
  message: AssistantMessage;
}) {
  const s = useThemedStyles(makes);

  const [progress] = useState(() => new Animated.Value(0));
  const reduced = useReducedMotion();
  const isUser = message.role === "user";
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: reduced ? 0 : 220,
      useNativeDriver: true,
    }).start();
  }, [progress, reduced]);
  if (!isUser && !message.content) return null;
  return (
    <Animated.View
      style={{
        opacity: progress,
        alignSelf: isUser ? "flex-end" : "stretch",
        maxWidth: isUser ? "92%" : "100%",
      }}
    >
      {isUser ? (
        <View style={s.question}>
          <Text style={s.body}>{message.content}</Text>
        </View>
      ) : (
        <View style={s.answer}>
          <Text style={s.label}>Kavanah AI</Text>
          <AssistantResponseText content={message.content} style={s.body} />
        </View>
      )}
    </Animated.View>
  );
}
const makes = (colors: ThemeColors) =>
  StyleSheet.create({
    question: {
      backgroundColor: colors.blueSoft,
      borderRadius: 20,
      borderBottomRightRadius: 6,
      borderCurve: "continuous",
      paddingHorizontal: 18,
      paddingVertical: 14,
    },
    answer: { gap: 10, paddingVertical: 4 },
    label: { color: colors.inkMuted, fontSize: 12, fontFamily: fonts.semibold },
    body: { color: colors.ink, fontSize: 16, lineHeight: 25 },
  });
