import { Send } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { Body, Display, Label, SectionTitle } from "@/components/Text";
import { colors, radii, spacing, type } from "@/design/theme";
import { createAssistantStream, type AssistantMessage } from "@/services/assistantService";
import { confirmHaptic } from "@/services/haptics";
import { usePrayerStore } from "@/store/prayerStore";

export function AssistantScreen(): React.JSX.Element {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const prayers = usePrayerStore((state) => state.prayers);

  const send = async () => {
    const clean = input.trim();
    if (!clean || isStreaming) {
      return;
    }
    void confirmHaptic();
    setInput("");
    setIsStreaming(true);
    const userMessage: AssistantMessage = { id: `${Date.now()}-user`, role: "user", content: clean, createdAt: new Date().toISOString() };
    const assistantId = `${Date.now()}-assistant`;
    setMessages((current) => [...current, userMessage, { id: assistantId, role: "assistant", content: "", createdAt: new Date().toISOString() }]);
    const context = prayers.flatMap((prayer) => prayer.tokens.map((token) => `${prayer.title}: ${token.translation}`)).slice(0, 6);
    for await (const chunk of createAssistantStream(clean, context)) {
      setMessages((current) => current.map((message) => (message.id === assistantId ? { ...message, content: `${message.content}${chunk}` } : message)));
    }
    setIsStreaming(false);
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.lightLine} />
        <Label>Guarded assistant</Label>
        <Display>Ask simply</Display>
        <Body>Short source-aware explanations, practical care, and privacy redaction before anything leaves the device.</Body>
      </View>

      {messages.length === 0 ? (
        <Card accent="rose" style={styles.empty}>
          <SectionTitle>Try a gentle question</SectionTitle>
          <Body>Ask what a prayer means, how to prepare for a ritual, or what a source is trying to teach.</Body>
        </Card>
      ) : (
        <View style={styles.messages}>
          {messages.map((message) => (
            <View key={message.id} style={[styles.bubble, message.role === "user" ? styles.userBubble : styles.assistantBubble]}>
              <Body style={message.role === "user" ? styles.userText : styles.assistantText}>{message.content}</Body>
            </View>
          ))}
        </View>
      )}

      <View style={styles.composer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="What does this prayer mean?"
          style={styles.input}
          placeholderTextColor={colors.inkMuted}
          multiline
        />
        <AnimatedPressable accessibilityRole="button" onPress={() => void send()} disabled={!input.trim() || isStreaming} style={[styles.sendButton, (!input.trim() || isStreaming) && styles.sendDisabled]}>
          <Send size={17} color={colors.white} />
        </AnimatedPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
    paddingTop: spacing.sm
  },
  lightLine: {
    width: 64,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.rose,
    marginBottom: spacing.sm
  },
  empty: {
    gap: spacing.sm
  },
  messages: {
    gap: spacing.md
  },
  bubble: {
    maxWidth: "88%",
    borderRadius: radii.lg,
    padding: spacing.lg
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.ink,
    borderBottomRightRadius: radii.sm
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.vellum,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderBottomLeftRadius: radii.sm
  },
  userText: {
    color: colors.white
  },
  assistantText: {
    color: colors.ink
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.vellum,
    padding: spacing.sm
  },
  input: {
    ...type.body,
    flex: 1,
    minHeight: 44,
    maxHeight: 132,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.ink
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink
  },
  sendDisabled: {
    opacity: 0.42
  }
});
