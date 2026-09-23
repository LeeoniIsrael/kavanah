import { AssistantMessageBubble } from "@/components/AssistantMessageBubble";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { AssistantMessage } from "@/services/assistantService";
import { softHaptic } from "@/services/haptics";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

type PrayerAssistantPanelProps = {
  input: string;
  isOpen: boolean;
  isStreaming: boolean;
  messages: AssistantMessage[];
  onChangeInput: (value: string) => void;
  onSubmit: () => void;
};

function KavanahSendGlyph(): React.JSX.Element {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.5 10.5 12 4l6.5 6.5M12 4v13.5"
        stroke={colors.white}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={20} r={1.15} fill={colors.white} />
    </Svg>
  );
}

export function PrayerAssistantPanel({
  input,
  isOpen,
  isStreaming,
  messages,
  onChangeInput,
  onSubmit,
}: PrayerAssistantPanelProps): React.JSX.Element {
  const [focused, setFocused] = useState(false);
  const focusProgress = useRef(new Animated.Value(0)).current;
  const sendProgress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();
  const canSend = input.trim().length > 0 && !isStreaming;

  useEffect(() => {
    Animated.timing(focusProgress, {
      toValue: focused ? 1 : 0,
      duration: reduceMotion ? 0 : 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focusProgress, focused, reduceMotion]);

  const submit = () => {
    if (!canSend) return;
    if (reduceMotion) {
      onSubmit();
      return;
    }
    sendProgress.setValue(0);
    Animated.sequence([
      Animated.timing(sendProgress, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sendProgress, {
        toValue: 0,
        duration: 210,
        easing: Easing.bezier(0.2, 0.9, 0.25, 1),
        useNativeDriver: true,
      }),
    ]).start();
    onSubmit();
  };

  return (
    <View className="overflow-hidden rounded-xl border border-hairlineStrong bg-card">
      <View className="px-5 pb-4 pt-5">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-10 items-center justify-center">
            <BrandMark size={40} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text variant="section" className="text-[17px] leading-[22px]">
              Questions about this prayer
            </Text>
            <Text
              variant="body"
              className="text-[13px] leading-[18px] text-inkFaint"
            >
              Explore meaning, context, and practice.
            </Text>
          </View>
        </View>
      </View>

      {isOpen ? (
        <View className="gap-3 border-t border-hairline px-5 py-4">
          {messages.length > 0 ? (
            messages.map((message) => (
              <AssistantMessageBubble key={message.id} message={message} />
            ))
          ) : (
            <Text
              variant="body"
              className="text-[14px] leading-[21px] text-inkFaint"
            >
              Ask about a phrase, the prayer’s setting, or a simple takeaway.
            </Text>
          )}
        </View>
      ) : null}

      <Animated.View
        className="mx-3 mb-3 min-h-[60px] flex-row items-end gap-2 rounded-lg border bg-parchmentLift p-2 pl-3"
        style={{
          borderColor: focusProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.hairlineStrong, colors.gold],
          }),
          shadowColor: colors.gold,
          shadowOpacity: focusProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.1],
          }),
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <Input
          accessibilityLabel="Question about this prayer"
          value={input}
          onChangeText={onChangeInput}
          onFocus={() => {
            setFocused(true);
            void softHaptic();
          }}
          onBlur={() => setFocused(false)}
          onSubmitEditing={submit}
          blurOnSubmit={false}
          placeholders={[
            "Ask what this means…",
            "Ask about a phrase…",
            "Ask how to carry this into your day…",
          ]}
          placeholderTextColor={colors.inkMuted}
          className="h-auto min-h-11 max-h-[116px] w-auto flex-1 border-0 bg-transparent px-0 py-2 shadow-none"
          multiline
        />
        <Button
          variant="default"
          size="content"
          accessibilityLabel={
            isStreaming ? "Answering question" : "Ask question"
          }
          accessibilityState={{ disabled: !canSend, busy: isStreaming }}
          onPress={submit}
          disabled={!canSend}
          isLoading={isStreaming}
          haptic="none"
          pressedScale={0.9}
          className="h-11 w-11 items-center justify-center rounded-lg bg-primary"
        >
          <Animated.View
            style={{
              opacity: sendProgress.interpolate({
                inputRange: [0, 0.65, 1],
                outputRange: [1, 0.25, 1],
              }),
              transform: [
                {
                  translateY: sendProgress.interpolate({
                    inputRange: [0, 0.65, 1],
                    outputRange: [0, -9, 0],
                  }),
                },
                {
                  scale: sendProgress.interpolate({
                    inputRange: [0, 0.65, 1],
                    outputRange: [1, 0.82, 1],
                  }),
                },
              ],
            }}
          >
            <KavanahSendGlyph />
          </Animated.View>
        </Button>
      </Animated.View>
    </View>
  );
}
