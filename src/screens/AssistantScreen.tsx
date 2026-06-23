import { Send } from "lucide-react-native";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Body, Label, Title } from "@/components/Text";
import { createAssistantStream, type AssistantMessage } from "@/services/assistantService";
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
      <View className="gap-2">
        <Label>Guarded assistant</Label>
        <Title>Ask simply</Title>
        <Body>Short source-aware explanations, clear practice notes, and privacy redaction before external use.</Body>
      </View>

      <View className="gap-3">
        {messages.map((message) => (
          <View key={message.id} className={`rounded-lg p-4 ${message.role === "user" ? "bg-ink" : "bg-white"}`}>
            <Body className={message.role === "user" ? "text-white" : "text-ink"}>{message.content}</Body>
          </View>
        ))}
      </View>

      <View className="flex-row items-center gap-3 rounded-lg border border-ink/10 bg-white px-4">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="What does this prayer mean?"
          className="min-h-14 flex-1 text-base text-ink"
          placeholderTextColor="#8A8F98"
          multiline
        />
        <Pressable accessibilityRole="button" onPress={() => void send()} className="h-11 w-11 items-center justify-center rounded-full bg-ink">
          <Send size={17} color="#FFFFFF" />
        </Pressable>
      </View>
    </Screen>
  );
}
