import { Button } from "@/components/ui/button";
import { Check, X } from "@/components/ui/icons";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/design/appearance";
import { fonts } from "@/design/theme";
import { confirmHaptic, successHaptic } from "@/services/haptics";
import type { QuoteSource } from "@/store/socialStore";
import { useState } from "react";
import type { StyleProp, TextStyle } from "react-native";
import { Pressable, View } from "react-native";

type Props = {
  active: boolean;
  fieldId: string;
  onActivate: (fieldId: string) => void;
  onSave: (source: QuoteSource, start: number, end: number) => boolean;
  source: QuoteSource;
  style: StyleProp<TextStyle>;
};

export function InlineQuoteText({
  active,
  fieldId,
  onActivate,
  onSave,
  source,
  style,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const words = source.text.trim().split(/\s+/u).filter(Boolean);
  const [range, setRange] = useState<[number, number] | null>(null);
  const [saved, setSaved] = useState(false);

  const low = range ? Math.min(...range) : -1;
  const high = range ? Math.max(...range) : -1;
  const chooseWord = (index: number) => {
    onActivate(fieldId);
    setSaved(false);
    setRange((current) =>
      !active || !current || current[0] !== current[1]
        ? [index, index]
        : [current[0], index],
    );
    void confirmHaptic();
  };

  return (
    <View style={{ gap: 10 }}>
      <View
        accessibilityLabel={`${source.language === "he" ? "Hebrew" : "Transliteration"} quote text. Tap a word to start selecting.`}
        style={{
          flexDirection: source.language === "he" ? "row-reverse" : "row",
          flexWrap: "wrap",
          columnGap: 6,
          rowGap: 2,
        }}
      >
        {words.map((word, index) => {
          const selected = active && index >= low && index <= high;
          return (
            <Pressable
              key={`${word}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`${word}, word ${index + 1}`}
              accessibilityHint={
                active
                  ? "Sets the end of your weekly quote"
                  : "Starts a weekly quote selection"
              }
              accessibilityState={{ selected }}
              onPress={() => chooseWord(index)}
              hitSlop={{ top: 5, bottom: 5 }}
              style={{
                borderRadius: 6,
                backgroundColor: selected ? colors.blue : "transparent",
                paddingHorizontal: selected ? 4 : 0,
              }}
            >
              <Text
                style={[
                  style,
                  source.language === "he" && { fontFamily: fonts.hebrew },
                  selected && { color: colors.onAccent },
                ]}
              >
                {word}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {active && range ? (
        <View
          accessibilityLiveRegion="polite"
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
            minHeight: 44,
          }}
        >
          {saved ? (
            <>
              <Check size={18} color={colors.blue} />
              <Text style={{ flex: 1, color: colors.blue, fontSize: 13 }}>
                Weekly quote saved
              </Text>
            </>
          ) : (
            <>
              <Text style={{ flex: 1, color: colors.inkMuted, fontSize: 12 }}>
                {high - low + 1} {high === low ? "word" : "words"} selected
              </Text>
              <Button
                variant="ghost"
                size="content"
                accessibilityLabel="Cancel quote selection"
                onPress={() => onActivate("")}
                style={{ width: 44, height: 44, justifyContent: "center" }}
              >
                <X size={16} color={colors.inkMuted} />
              </Button>
              <Button
                size="content"
                accessibilityLabel="Save selected words as my weekly quote"
                onPress={() => {
                  if (onSave(source, low, high)) {
                    setSaved(true);
                    void successHaptic();
                  }
                }}
                style={{
                  minHeight: 44,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                }}
              >
                <Text style={{ color: colors.onAccent, fontSize: 13 }}>
                  Save weekly quote
                </Text>
              </Button>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}
