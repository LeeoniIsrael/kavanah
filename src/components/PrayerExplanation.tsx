import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { X, ArrowUp } from "@/components/ui/icons";
import { useThemeColors } from "@/design/appearance";
import { useInterfaceStyles } from "@/design/layout";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  CURRENT_ASSISTANT_CONSENT_VERSION,
  useSettingsStore,
} from "@/store/settingsStore";
import { createAssistantStream } from "@/services/assistantService";
import {
  prayerConversationContext,
  type PrayerTurn,
} from "@/services/prayerConversationContext";

type Rect = { x: number; y: number; width: number; height: number };
const Conversation = createContext<
  ((rect: Rect, passage?: string) => void) | null
>(null);
export function usePrayerConversation() {
  return useContext(Conversation);
}
const explain =
  "Explain this prayer simply in two short sentences. What am I saying, and why?";

// Every trigger in the reader opens this one conversation, including passage shortcuts.
export function PrayerConversation({
  children,
  context,
  language,
  title,
}: {
  children: ReactNode;
  context: string[];
  language: string;
  title: string;
}) {
  const colors = useThemeColors(),
    ui = useInterfaceStyles(),
    insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const consent = useSettingsStore((s) => s.assistantConsentVersion);
  const allow = useSettingsStore((s) => s.setAssistantConsent);
  const accepted = consent === CURRENT_ASSISTANT_CONSENT_VERSION;
  const [progress] = useState(() => new Animated.Value(0));
  const [origin, setOrigin] = useState<Rect | null>(null);
  const [turns, setTurns] = useState<PrayerTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState("");
  const [busy, setBusy] = useState(false);
  const [focusComposer, setFocusComposer] = useState(false);
  const input = useRef<TextInput>(null);
  const lock = useRef(false),
    generation = useRef(0),
    atBottom = useRef(true);
  const scroll = useRef<ScrollView>(null);
  useEffect(
    () => () => {
      generation.current += 1;
    },
    [],
  );
  const send = async (question: string, history = turns) => {
    const clean = question.trim().slice(0, 1000);
    if (!clean || lock.current) return;
    if (
      useSettingsStore.getState().assistantConsentVersion !==
      CURRENT_ASSISTANT_CONSENT_VERSION
    ) {
      setPending(clean);
      return;
    }
    lock.current = true;
    setBusy(true);
    setDraft("");
    setPending("");
    const request = ++generation.current;
    const next: PrayerTurn[] = [
      ...history,
      { role: "user", content: clean },
      { role: "assistant", content: "" },
    ];
    setTurns(next);
    atBottom.current = true;
    let answer = "";
    try {
      for await (const chunk of createAssistantStream(
        clean,
        prayerConversationContext(context, history, language),
      )) {
        if (generation.current !== request) break;
        answer += chunk;
        setTurns([
          ...next.slice(0, -1),
          { role: "assistant", content: answer },
        ]);
      }
      if (!answer.trim()) throw new Error("Empty response");
    } catch {
      if (generation.current === request)
        setTurns([
          ...next.slice(0, -1),
          {
            role: "assistant",
            content: "Couldn’t answer right now. Try again in a moment.",
            failed: true,
          },
        ]);
    } finally {
      if (generation.current === request) {
        setBusy(false);
        lock.current = false;
      }
    }
  };
  const open = (rect: Rect, passage?: string) => {
    progress.setValue(0);
    setFocusComposer(!passage);
    setOrigin(rect);
    Animated.timing(progress, {
      toValue: 1,
      duration: reduced ? 0 : 260,
      useNativeDriver: false,
    }).start();
    if (passage) {
      const question = `Explain this passage in simple words: “${passage.slice(0, 800)}”`;
      // Do not discard a draft or an in-flight answer when another passage is chosen.
      if (busy || draft) setDraft((value) => value || question);
      else if (accepted) void send(question);
      else setPending(question);
    }
  };
  const close = () => {
    Keyboard.dismiss();
    Animated.timing(progress, {
      toValue: 0,
      duration: reduced ? 0 : 180,
      useNativeDriver: false,
    }).start(() => setOrigin(null));
  };
  const tween = (a: number, b: number) =>
    progress.interpolate({ inputRange: [0, 1], outputRange: [a, b] });
  return (
    <Conversation.Provider value={open}>
      {children}
      <Modal
        visible={Boolean(origin)}
        transparent
        animationType="none"
        onRequestClose={close}
        onShow={() => {
          if (focusComposer && accepted) input.current?.focus();
        }}
      >
        {origin ? (
          <Animated.View
            accessibilityViewIsModal
            style={{
              position: "absolute",
              left: tween(origin.x, 0),
              top: tween(origin.y, 0),
              width: tween(origin.width, width),
              height: tween(origin.height, height),
              borderRadius: tween(18, 0),
              overflow: "hidden",
              backgroundColor: colors.parchment,
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}
            >
              <Animated.View
                style={{ flex: 1, opacity: progress, paddingTop: insets.top }}
              >
                <View
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={ui.itemTitle}>In simple words</Text>
                    <Text numberOfLines={2} style={ui.caption}>
                      {title} · AI
                    </Text>
                  </View>
                  <Button
                    variant="ghost"
                    size="icon"
                    onPress={close}
                    accessibilityLabel="Return to prayer"
                  >
                    <X size={20} color={colors.ink} />
                  </Button>
                </View>
                <ScrollView
                  ref={scroll}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                  onScroll={(event) => {
                    const n = event.nativeEvent;
                    atBottom.current =
                      n.contentSize.height -
                        n.contentOffset.y -
                        n.layoutMeasurement.height <
                      100;
                  }}
                  scrollEventThrottle={100}
                  onContentSizeChange={() => {
                    if (atBottom.current)
                      scroll.current?.scrollToEnd({ animated: false });
                  }}
                  contentContainerStyle={{
                    paddingHorizontal: 24,
                    paddingVertical: 16,
                    gap: 24,
                  }}
                >
                  {!accepted ? (
                    <View style={{ gap: 20 }}>
                      <Text style={ui.body}>
                        Your questions, this conversation and the prayer text
                        are sent to OpenAI. AI answers can make mistakes. Avoid
                        sharing private details.
                      </Text>
                      <Button
                        onPress={() => {
                          allow(true);
                          if (pending) void send(pending);
                          else input.current?.focus();
                        }}
                      >
                        <Text style={{ color: colors.onAccent }}>
                          Allow questions
                        </Text>
                      </Button>
                    </View>
                  ) : null}
                  {turns.length === 0 && accepted ? (
                    <View style={{ gap: 16 }}>
                      <Text
                        style={[
                          ui.body,
                          { fontSize: 21, lineHeight: 31, color: colors.ink },
                        ]}
                      >
                        What would you like to understand?
                      </Text>
                      <Text style={ui.body}>
                        Ask in your own words, or start with a simple
                        explanation.
                      </Text>
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onPress={() => void send(explain)}
                      >
                        <Text>Explain simply</Text>
                      </Button>
                    </View>
                  ) : null}
                  {turns.map((turn, index) => (
                    <View
                      key={index}
                      style={{
                        gap: 8,
                        ...(turn.role === "user"
                          ? {
                              backgroundColor: colors.vellum,
                              padding: 16,
                              borderRadius: 20,
                              marginLeft: 24,
                            }
                          : {}),
                      }}
                    >
                      <Text style={ui.caption}>
                        {turn.role === "user" ? "You" : "Kavanah"}
                      </Text>
                      {turn.content ? (
                        <Text
                          selectable
                          style={[
                            ui.body,
                            { color: colors.ink, fontSize: 18, lineHeight: 29 },
                          ]}
                        >
                          {turn.content}
                        </Text>
                      ) : (
                        <ActivityIndicator
                          style={{ alignSelf: "flex-start" }}
                          color={colors.blue}
                        />
                      )}
                      {turn.failed && index === turns.length - 1 ? (
                        <Button
                          variant="ghost"
                          disabled={busy}
                          onPress={() =>
                            void send(
                              turns[index - 1]?.content ?? "",
                              turns.slice(0, -2),
                            )
                          }
                        >
                          <Text style={{ color: colors.blue }}>Try again</Text>
                        </Button>
                      ) : null}
                    </View>
                  ))}
                  {pending && !accepted ? (
                    <Text style={ui.caption}>
                      Your question is ready. Allow questions above to send it.
                    </Text>
                  ) : null}
                </ScrollView>
                <View
                  style={{
                    paddingHorizontal: 20,
                    paddingTop: 12,
                    paddingBottom: Math.max(insets.bottom, 12),
                    borderTopWidth: 0.5,
                    borderTopColor: colors.hairline,
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: colors.vellum,
                      borderRadius: 24,
                      padding: 12,
                      flexDirection: "row",
                      alignItems: "flex-end",
                      gap: 10,
                    }}
                  >
                    <TextInput
                      ref={input}
                      value={draft}
                      onChangeText={setDraft}
                      multiline
                      maxLength={1000}
                      placeholder={
                        turns.length
                          ? "Ask a follow-up…"
                          : "Ask about this prayer…"
                      }
                      placeholderTextColor={colors.inkMuted}
                      accessibilityLabel="Question about this prayer"
                      style={{
                        flex: 1,
                        color: colors.ink,
                        fontSize: 17,
                        lineHeight: 24,
                        minHeight: 44,
                        maxHeight: 120,
                        padding: 8,
                      }}
                    />
                    <Button
                      size="icon"
                      disabled={busy || !draft.trim()}
                      accessibilityLabel="Send question"
                      onPress={() => void send(draft)}
                    >
                      <ArrowUp
                        size={20}
                        color={
                          busy || !draft.trim()
                            ? colors.inkMuted
                            : colors.onAccent
                        }
                      />
                    </Button>
                  </View>
                  <Text style={[ui.caption, { textAlign: "center" }]}>
                    AI can be mistaken. Your prayer stays where you left it.
                  </Text>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </Animated.View>
        ) : null}
      </Modal>
    </Conversation.Provider>
  );
}

export function PrayerExplanation({
  passage,
}: {
  passage?: string | undefined;
}) {
  const open = usePrayerConversation(),
    anchor = useRef<View>(null);
  const colors = useThemeColors(),
    ui = useInterfaceStyles();
  return (
    <View ref={anchor} collapsable={false}>
      <Button
        variant="ghost"
        size="content"
        onPress={() =>
          anchor.current?.measureInWindow((x, y, width, height) =>
            open?.({ x, y, width, height }, passage),
          )
        }
        style={{
          minHeight: 44,
          justifyContent: "flex-start",
          paddingVertical: 10,
        }}
        accessibilityLabel={
          passage ? "Ask about this passage" : "Ask about this prayer"
        }
      >
        <Text style={[ui.itemTitle, { color: colors.blue }]}>
          {passage ? "Explain this passage" : "Ask about this prayer"}
        </Text>
      </Button>
    </View>
  );
}
