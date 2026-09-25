import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { X } from "@/components/ui/icons";
import { useThemeColors } from "@/design/appearance";
import { useInterfaceStyles } from "@/design/layout";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  CURRENT_ASSISTANT_CONSENT_VERSION,
  useSettingsStore,
} from "@/store/settingsStore";
import { createAssistantStream } from "@/services/assistantService";

type Rect = { x: number; y: number; width: number; height: number };
export function PrayerExplanation({
  context,
  language,
  passage,
}: {
  context: string[];
  language: string;
  passage?: string | undefined;
}) {
  const colors = useThemeColors(),
    ui = useInterfaceStyles(),
    insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const consent = useSettingsStore((s) => s.assistantConsentVersion);
  const allow = useSettingsStore((s) => s.setAssistantConsent);
  const anchor = useRef<View>(null);
  const [progress] = useState(() => new Animated.Value(0));
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current += 1;
    },
    [],
  );
  const [origin, setOrigin] = useState<Rect | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const accepted = consent === CURRENT_ASSISTANT_CONSENT_VERSION;
  const run = async () => {
    const request = ++generation.current;
    setAnswer("");
    setError(false);
    setBusy(true);
    try {
      const question = `Explain ${passage ? "only the supplied passage" : "this prayer"} in ${language}. Use two short sentences, at most 45 words, and everyday words for a complete beginner. Address the reader as you. Say what these words mean and why someone says them. Avoid Hebrew terms unless essential; explain any you use. The interface already identifies this as an AI explanation. No headings, jargon, ritual instructions, or invented claims. If the text is incomplete, do not pretend it is the whole prayer.`;
      for await (const chunk of createAssistantStream(
        question,
        passage ? [`Passage to explain: ${passage}`, ...context] : context,
      )) {
        if (generation.current !== request) break;
        setAnswer((value) => value + chunk);
      }
    } catch {
      if (generation.current === request) {
        setError(true);
        setAnswer(
          "Couldn’t load the explanation. You can try again; your prayer is still here.",
        );
      }
    } finally {
      if (generation.current === request) setBusy(false);
    }
  };
  const open = () =>
    anchor.current?.measureInWindow((x, y, w, h) => {
      progress.setValue(0);
      setOrigin({ x, y, width: w, height: h });
      Animated.timing(progress, {
        toValue: 1,
        duration: reduced ? 0 : 260,
        useNativeDriver: false,
      }).start();
      if (accepted) void run();
    });
  const close = () => {
    generation.current += 1;
    Animated.timing(progress, {
      toValue: 0,
      duration: reduced ? 0 : 180,
      useNativeDriver: false,
    }).start(() => {
      setOrigin(null);
      setBusy(false);
      setAnswer("");
    });
  };
  const tween = (a: number, b: number) =>
    progress.interpolate({ inputRange: [0, 1], outputRange: [a, b] });
  return (
    <>
      <View ref={anchor} collapsable={false}>
        <Button
          variant="ghost"
          size="content"
          onPress={open}
          style={{
            minHeight: 44,
            justifyContent: "flex-start",
            paddingVertical: 10,
          }}
          accessibilityLabel={
            passage
              ? "Explain this passage simply"
              : "Explain this prayer simply"
          }
        >
          <Text style={[ui.itemTitle, { color: colors.blue }]}>
            {passage ? "Explain this passage" : "Explain this prayer"}
          </Text>
        </Button>
      </View>
      <Modal
        visible={Boolean(origin)}
        transparent
        animationType="none"
        onRequestClose={close}
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
            <Animated.View
              style={{
                flex: 1,
                opacity: progress,
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
              }}
            >
              <View
                style={{
                  padding: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={ui.itemTitle}>In simple words</Text>
                  <Text style={ui.caption}>AI explanation · {language}</Text>
                </View>
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={close}
                  accessibilityLabel="Close explanation and return to prayer"
                >
                  <X size={20} color={colors.ink} />
                </Button>
              </View>
              <ScrollView
                contentContainerStyle={{
                  paddingHorizontal: 24,
                  paddingBottom: 32,
                  gap: 24,
                }}
              >
                {passage ? <Text style={ui.body}>{passage}</Text> : null}
                {!accepted ? (
                  <View style={{ gap: 20 }}>
                    <Text style={ui.body}>
                      To explain this, Kavanah sends the prayer text, source and
                      language to OpenAI. AI explanations can make mistakes.
                    </Text>
                    <Button
                      onPress={() => {
                        allow(true);
                        void run();
                      }}
                    >
                      <Text style={{ color: colors.onAccent }}>
                        Allow and explain
                      </Text>
                    </Button>
                  </View>
                ) : (
                  <>
                    {busy && !answer ? (
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <ActivityIndicator color={colors.blue} />
                        <Text style={ui.body}>Finding simple words…</Text>
                      </View>
                    ) : null}
                    {answer ? (
                      <Text
                        selectable
                        style={[
                          ui.body,
                          { fontSize: 21, lineHeight: 33, color: colors.ink },
                        ]}
                      >
                        {answer}
                      </Text>
                    ) : null}
                    {error ? (
                      <Button variant="secondary" onPress={() => void run()}>
                        <Text>Try again</Text>
                      </Button>
                    ) : null}
                    {!busy && answer && !error ? (
                      <Text style={ui.caption}>
                        An explanation of meaning, not instructions for
                        religious practice.
                      </Text>
                    ) : null}
                  </>
                )}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        ) : null}
      </Modal>
    </>
  );
}
