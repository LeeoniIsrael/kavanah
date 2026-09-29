import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { ScrollView } from "@/components/ui/fade-scroll-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Share2 } from "@/components/ui/icons";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/design/appearance";
import { motion } from "@/design/theme";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { tapHaptic } from "@/services/haptics";

export function PrayerCompletionPrompt({
  onShare,
  onDismiss,
  enabled,
  onEnabledChange,
}: {
  onShare: () => void;
  onDismiss: () => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}) {
  const colors = useThemeColors();
  const reduceMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  const closing = useRef(false);

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    Animated.spring(progress, {
      toValue: 1,
      stiffness: 310,
      damping: 28,
      mass: 0.85,
      useNativeDriver: true,
    }).start();
    return () => progress.stopAnimation();
  }, [progress, reduceMotion]);

  const close = (next: () => void) => {
    if (closing.current) return;
    closing.current = true;
    if (reduceMotion) {
      next();
      return;
    }
    Animated.timing(progress, {
      toValue: 0,
      duration: 150,
      easing: Easing.bezier(...motion.standard),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) next();
    });
  };

  return (
    <View
      accessibilityViewIsModal
      style={{
        position: "absolute",
        zIndex: 50,
        inset: 0,
        justifyContent: "flex-end",
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(6, 16, 33, 0.48)",
          opacity: progress,
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss share prompt"
        onPress={() => close(onDismiss)}
        style={{ position: "absolute", inset: 0 }}
      />
      <Animated.View
        style={{
          alignSelf: "center",
          width: "100%",
          maxWidth: 440,
          maxHeight: "100%",
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [28, 0],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.98, 1],
              }),
            },
          ],
        }}
      >
        <ScrollView
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ padding: 16 }}
          bounces={false}
        >
          <Card style={{ gap: 0, padding: 24 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 14,
              }}
            >
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.blueSoft,
                }}
              >
                <Check size={24} color={colors.blue} />
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                <Text variant="section" style={{ color: colors.ink }}>
                  Prayer saved
                </Text>
                <Text variant="body" style={{ color: colors.inkMuted }}>
                  Want to share this moment?
                </Text>
              </View>
            </View>

            <View style={{ gap: 8, marginTop: 24 }}>
              <Button
                accessibilityLabel="Create a story for this prayer"
                haptic="selection"
                onPress={() => close(onShare)}
                style={{
                  minHeight: 52,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Share2 size={18} color={colors.onAccent} />
                <Text style={{ color: colors.onAccent }}>Create story</Text>
              </Button>
              <Button
                variant="ghost"
                accessibilityLabel="Not now"
                haptic="selection"
                onPress={() => close(onDismiss)}
                style={{
                  minHeight: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.inkMuted }}>Not now</Text>
              </Button>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                minHeight: 52,
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.hairline,
              }}
            >
              <Text
                variant="caption"
                style={{ flex: 1, color: colors.inkMuted }}
              >
                Ask after each prayer
              </Text>
              <Switch
                accessibilityLabel="Ask to share after each prayer"
                checked={enabled}
                onCheckedChange={(next) => {
                  void tapHaptic();
                  onEnabledChange(next);
                }}
              />
            </View>
          </Card>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
