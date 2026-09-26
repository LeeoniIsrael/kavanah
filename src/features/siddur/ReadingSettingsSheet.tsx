import { useThemeColors } from "@/design/appearance";
import { X } from "@/components/ui/icons";
import { Text } from "@/components/ui/text";
import {
  Modal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  PrayerProfile,
  ReaderLanguage,
  SiddurDefinition,
  SiddurVersion,
} from "./model";

type Props = {
  visible: boolean;
  onClose: () => void;
  language: ReaderLanguage;
  onLanguageChange: (language: ReaderLanguage) => void;
  fontScale: number;
  onFontScaleChange: (scale: number) => void;
  bookId: string;
  book: SiddurDefinition | null;
  catalog: SiddurDefinition[];
  onBookChange: (id: string) => void;
  profile: PrayerProfile;
  onProfileChange: (profile: PrayerProfile) => void;
  downloadStatus: string;
  onDownload: () => void;
};

const sectionLabel = { fontSize: 13, fontWeight: "700" as const };

export function ReadingSettingsSheet({
  visible,
  onClose,
  language,
  onLanguageChange,
  fontScale,
  onFontScaleChange,
  bookId,
  book,
  catalog,
  onBookChange,
  profile,
  onProfileChange,
  downloadStatus,
  onDownload,
}: Props): React.JSX.Element {
  const colors = useThemeColors();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const editions = [
    ...(book ? [book] : []),
    ...catalog.filter(
      (item) =>
        item.id !== book?.id && (item.availability.he || item.availability.en),
    ),
  ];
  const sources = [book?.versions.he, book?.versions.en, book?.fallbackEnglish]
    .filter((item): item is SiddurVersion => Boolean(item))
    .filter(
      (item, index, all) =>
        all.findIndex((other) => other.versionTitle === item.versionTitle) ===
        index,
    );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close reading settings"
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: "#0009",
          }}
        />
        <View
          style={{
            height: Math.min(height * 0.79, 720),
            backgroundColor: colors.parchmentLift,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderColor: colors.hairline,
            borderWidth: 1,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.hairlineStrong,
              marginTop: 10,
              marginBottom: 14,
            }}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 24,
              paddingBottom: 18,
            }}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <Text
                accessibilityRole="header"
                style={{
                  color: colors.ink,
                  fontSize: 23,
                  lineHeight: 30,
                  fontWeight: "700",
                }}
              >
                Reading settings
              </Text>
              <Text
                style={{ color: colors.inkMuted, fontSize: 13, lineHeight: 20 }}
              >
                Make the Siddur comfortable to read.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close settings"
              onPress={onClose}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} color={colors.inkMuted} />
            </Pressable>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: Math.max(insets.bottom, 18) + 24,
              gap: 22,
            }}
          >
            <View style={{ gap: 10 }}>
              <Text style={{ ...sectionLabel, color: colors.inkMuted }}>
                LANGUAGE
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: colors.mineral,
                  borderRadius: 17,
                  padding: 4,
                  gap: 4,
                }}
              >
                {(["en", "he"] as const).map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityLabel={item === "en" ? "English" : "Hebrew"}
                    accessibilityState={{ selected: language === item }}
                    onPress={() => onLanguageChange(item)}
                    style={{
                      flex: 1,
                      minHeight: 42,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 13,
                      backgroundColor:
                        language === item ? colors.blueSoft : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          language === item ? colors.blue : colors.inkMuted,
                        fontWeight: language === item ? "700" : "500",
                      }}
                    >
                      {item === "en" ? "English" : "עברית"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <Text style={{ ...sectionLabel, color: colors.inkMuted }}>
                TEXT SIZE
              </Text>
              <View
                style={{
                  minHeight: 60,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 12,
                  borderRadius: 18,
                  backgroundColor: colors.vellum,
                  borderColor: colors.hairline,
                  borderWidth: 1,
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease text size"
                  accessibilityState={{ disabled: fontScale <= 0.8 }}
                  disabled={fontScale <= 0.8}
                  onPress={() =>
                    onFontScaleChange(
                      Math.max(0.8, Math.round((fontScale - 0.1) * 10) / 10),
                    )
                  }
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: fontScale <= 0.8 ? 0.4 : 1,
                  }}
                >
                  <Text style={{ color: colors.ink, fontSize: 18 }}>A−</Text>
                </Pressable>
                <Text
                  style={{ color: colors.ink, fontSize: 17, fontWeight: "700" }}
                >
                  {Math.round(fontScale * 100)}%
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase text size"
                  accessibilityState={{ disabled: fontScale >= 1.7 }}
                  disabled={fontScale >= 1.7}
                  onPress={() =>
                    onFontScaleChange(
                      Math.min(1.7, Math.round((fontScale + 0.1) * 10) / 10),
                    )
                  }
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: fontScale >= 1.7 ? 0.4 : 1,
                  }}
                >
                  <Text style={{ color: colors.ink, fontSize: 21 }}>A+</Text>
                </Pressable>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <Text style={{ ...sectionLabel, color: colors.inkMuted }}>
                SIDDUR & TRADITION
              </Text>
              {editions.length ? (
                editions.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Read ${item.displayName}`}
                    accessibilityState={{ selected: bookId === item.id }}
                    onPress={() => onBookChange(item.id)}
                    style={{
                      minHeight: 58,
                      borderRadius: 17,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      justifyContent: "center",
                      backgroundColor:
                        bookId === item.id ? colors.blueSoft : colors.vellum,
                      borderColor:
                        bookId === item.id ? colors.blue : colors.hairline,
                      borderWidth: 1,
                    }}
                  >
                    <Text style={{ color: colors.ink, fontWeight: "600" }}>
                      {item.displayName}
                    </Text>
                    <Text style={{ color: colors.inkMuted, fontSize: 12 }}>
                      {item.rite.replaceAll("_", " ").toLowerCase()} ·{" "}
                      {item.scope.toLowerCase()}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <View
                  style={{
                    padding: 16,
                    borderRadius: 17,
                    backgroundColor: colors.vellum,
                  }}
                >
                  <Text style={{ color: colors.ink, fontWeight: "600" }}>
                    {bookId}
                  </Text>
                  <Text style={{ color: colors.inkMuted, fontSize: 12 }}>
                    Current Siddur
                  </Text>
                </View>
              )}
              {editions.length <= 1 ? (
                <Text
                  style={{
                    color: colors.inkMuted,
                    fontSize: 12,
                    lineHeight: 18,
                  }}
                >
                  Other verified editions will appear when their text is
                  available.
                </Text>
              ) : null}
            </View>

            <View style={{ gap: 10 }}>
              <Text style={{ ...sectionLabel, color: colors.inkMuted }}>
                PROFILE
              </Text>
              <View style={{ flexDirection: "row", gap: 7 }}>
                {(["general", "masculine", "feminine"] as const).map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityLabel={`${item} profile`}
                    accessibilityState={{ selected: profile === item }}
                    onPress={() => onProfileChange(item)}
                    style={{
                      flex: 1,
                      minHeight: 42,
                      borderRadius: 14,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor:
                        profile === item ? colors.blueSoft : colors.mineral,
                    }}
                  >
                    <Text
                      style={{
                        color: profile === item ? colors.blue : colors.inkMuted,
                        fontSize: 12,
                        fontWeight: profile === item ? "700" : "500",
                      }}
                    >
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text
                style={{ color: colors.inkMuted, fontSize: 12, lineHeight: 18 }}
              >
                Profile changes only prayers with a verified text variant.
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              <Text style={{ ...sectionLabel, color: colors.inkMuted }}>
                OFFLINE
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Download complete Siddur"
                onPress={onDownload}
                style={{
                  minHeight: 48,
                  borderRadius: 16,
                  justifyContent: "center",
                  paddingHorizontal: 16,
                  backgroundColor: colors.mineral,
                }}
              >
                <Text style={{ color: colors.ink, fontWeight: "600" }}>
                  Download this Siddur
                </Text>
              </Pressable>
              {downloadStatus ? (
                <Text style={{ color: colors.inkMuted, fontSize: 12 }}>
                  {downloadStatus}
                </Text>
              ) : null}
            </View>

            <View style={{ gap: 5 }}>
              <Text style={{ ...sectionLabel, color: colors.inkMuted }}>
                TEXT SOURCE
              </Text>
              <Text
                style={{ color: colors.inkMuted, fontSize: 12, lineHeight: 18 }}
              >
                Text provided by Sefaria. Kavanah is independent of Sefaria.
              </Text>
              {sources.map((item) => (
                <Text
                  key={item.versionTitle}
                  style={{
                    color: colors.inkMuted,
                    fontSize: 12,
                    lineHeight: 18,
                  }}
                >
                  {item.versionTitle} · {item.license}
                </Text>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
