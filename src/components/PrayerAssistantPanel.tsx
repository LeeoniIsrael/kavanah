import { useState } from "react";
import { Keyboard, StyleSheet, TextInput, View } from "react-native";
import { ArrowUp, CornerDownLeft } from "lucide-react-native";
import { AssistantMessageBubble } from "@/components/AssistantMessageBubble";
import { AssistantBeam, AssistantMark } from "@/components/AssistantMotion";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { colors, fonts } from "@/design/theme";
import type { AssistantMessage } from "@/services/assistantService";

type PrayerAssistantPanelProps = {
  input: string;
  isOpen: boolean;
  isStreaming: boolean;
  messages: AssistantMessage[];
  onChangeInput: (value: string) => void;
  onSubmit: () => void;
};
const suggestions = [
  "What does this mean?",
  "How can I carry this into my day?",
];
export function PrayerAssistantPanel({
  input,
  isOpen,
  isStreaming,
  messages,
  onChangeInput,
  onSubmit,
}: PrayerAssistantPanelProps) {
  const [focused, setFocused] = useState(false);
  const canSend = !!input.trim() && !isStreaming;
  const submit = () => {
    if (canSend) {
      Keyboard.dismiss();
      onSubmit();
    }
  };
  return (
    <View style={s.section}>
      <View style={s.heading}>
        <AssistantMark busy={isStreaming} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.title}>Go a little deeper.</Text>
          <Text style={s.subtitle}>Explore this prayer with Kavanah AI.</Text>
        </View>
      </View>
      {isOpen && messages.length > 0 && (
        <View style={s.messages}>
          {messages.map((message) => (
            <AssistantMessageBubble key={message.id} message={message} />
          ))}
        </View>
      )}
      <AssistantBeam active={focused || isStreaming}>
        <TextInput
          accessibilityLabel="Question about this prayer"
          value={input}
          onChangeText={onChangeInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="What would you like to understand?"
          placeholderTextColor={colors.inkMuted}
          selectionColor={colors.blue}
          multiline
          maxLength={1000}
          scrollEnabled
          style={s.input}
          textAlignVertical="top"
        />
        <View style={s.toolbar}>
          <Text accessibilityLiveRegion="polite" style={s.status}>
            {isStreaming
              ? "Reflecting on this prayer…"
              : input.length
                ? `${input.length}/1000`
                : "Meaning, context, everyday practice"}
          </Text>
          <Button
            size="content"
            variant="ghost"
            accessibilityLabel="Ask question"
            accessibilityState={{ disabled: !canSend, busy: isStreaming }}
            disabled={!canSend}
            onPress={submit}
            style={[s.send, !canSend && s.sendInactive]}
          >
            <ArrowUp
              color={canSend ? colors.parchment : colors.inkMuted}
              size={22}
              strokeWidth={2.2}
            />
          </Button>
        </View>
      </AssistantBeam>
      {!input && !isStreaming && messages.length === 0 && (
        <View style={s.suggestions}>
          {suggestions.map((prompt) => (
            <Button
              key={prompt}
              variant="ghost"
              size="content"
              onPress={() => onChangeInput(prompt)}
              style={s.suggestion}
              accessibilityLabel={`Use question: ${prompt}`}
            >
              <Text style={s.prompt}>{prompt}</Text>
              <CornerDownLeft size={15} color={colors.inkMuted} />
            </Button>
          ))}
        </View>
      )}
      <Text style={s.footnote}>
        AI can make mistakes. For personal rulings, ask your rabbi.
      </Text>
    </View>
  );
}
const s = StyleSheet.create({
  section: { gap: 16, paddingVertical: 12 },
  heading: { flexDirection: "row", gap: 12, alignItems: "center" },
  title: {
    fontFamily: fonts.semibold,
    color: colors.ink,
    fontSize: 21,
    lineHeight: 29,
  },
  subtitle: { color: colors.inkMuted, fontSize: 13, lineHeight: 20 },
  messages: { gap: 18, paddingVertical: 8 },
  input: {
    minHeight: 106,
    maxHeight: 190,
    padding: 20,
    paddingBottom: 12,
    color: colors.ink,
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 25,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  status: { flex: 1, color: colors.inkMuted, fontSize: 12, lineHeight: 19 },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  sendInactive: { backgroundColor: colors.mineral },
  suggestions: { gap: 4 },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: 8,
    gap: 12,
  },
  prompt: { color: colors.inkMuted, fontSize: 14, lineHeight: 22, flex: 1 },
  footnote: {
    color: colors.inkMuted,
    fontSize: 11,
    lineHeight: 17,
    paddingHorizontal: 4,
  },
});
