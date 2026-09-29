import { Linking, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import {
  ChevronRight,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  UserRound,
} from "@/components/ui/icons";
import { useThemeColors } from "@/design/appearance";
import { fonts } from "@/design/theme";

type PrivacyDataUseProps = {
  assistantEnabled: boolean;
  circleEnabled: boolean;
  onAssistantChange: (enabled: boolean) => void;
};

export function PrivacyDataUse({
  assistantEnabled,
  circleEnabled,
  onAssistantChange,
}: PrivacyDataUseProps): React.JSX.Element {
  const colors = useThemeColors();

  return (
    <View style={{ gap: 28 }}>
      <View style={{ gap: 9, paddingRight: 48 }}>
        <Text variant="caption" style={{ fontSize: 14, lineHeight: 20 }}>
          Privacy and data use
        </Text>
        <Text
          accessibilityRole="header"
          style={{
            color: colors.ink,
            fontFamily: "Georgia",
            fontSize: 38,
            lineHeight: 46,
          }}
        >
          Your practice is yours.
        </Text>
        <Text variant="body" style={{ fontSize: 15, lineHeight: 23 }}>
          Here is what stays on your phone and what leaves it when you choose an
          optional feature.
        </Text>
      </View>

      <Card style={{ gap: 0, padding: 0 }}>
        <View style={{ padding: 20, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.blueSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LockKeyhole size={20} color={colors.blue} />
            </View>
            <Text
              accessibilityRole="header"
              style={{
                flex: 1,
                color: colors.ink,
                fontFamily: fonts.semibold,
                fontSize: 20,
                lineHeight: 28,
              }}
            >
              On this device
            </Text>
          </View>
          <Text variant="body" style={{ fontSize: 14, lineHeight: 22 }}>
            Bookmarks, prayer activity, preferences, and reminder schedules stay
            here. Location is used to calculate local prayer times; precise
            coordinates are not sent to the assistant.
          </Text>
        </View>
      </Card>

      <View style={{ gap: 12 }}>
        <Text
          accessibilityRole="header"
          style={{
            color: colors.ink,
            fontFamily: fonts.semibold,
            fontSize: 20,
            lineHeight: 28,
          }}
        >
          When you use online features
        </Text>
        <Card style={{ gap: 0, padding: 0 }}>
          <View style={{ padding: 20, gap: 10 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <UserRound size={24} color={colors.blue} />
              <Text
                accessibilityRole="header"
                style={{
                  flex: 1,
                  color: colors.ink,
                  fontFamily: fonts.semibold,
                  fontSize: 17,
                  lineHeight: 24,
                }}
              >
                Circle account
              </Text>
              <Text
                variant="caption"
                style={{ color: colors.inkMuted, fontSize: 13, lineHeight: 20 }}
              >
                {circleEnabled ? "Connected" : "Optional"}
              </Text>
            </View>
            <Text variant="body" style={{ fontSize: 14, lineHeight: 22 }}>
              If you join, your sign-in details, profile, and future prayer
              completions are saved to your account. Past device activity is not
              uploaded. Only updates you choose to share are visible to accepted
              connections.
            </Text>
          </View>
          <View
            style={{
              height: 1,
              backgroundColor: colors.hairline,
              marginHorizontal: 20,
            }}
          />
          <View style={{ padding: 20, gap: 10 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <MessageCircle size={24} color={colors.blue} />
              <Text
                accessibilityRole="header"
                style={{
                  flex: 1,
                  color: colors.ink,
                  fontFamily: fonts.semibold,
                  fontSize: 17,
                  lineHeight: 24,
                }}
              >
                Prayer assistant
              </Text>
              <Text
                variant="caption"
                style={{ color: colors.inkMuted, fontSize: 13, lineHeight: 20 }}
              >
                {assistantEnabled ? "Allowed" : "Off"}
              </Text>
            </View>
            <Text variant="body" style={{ fontSize: 14, lineHeight: 22 }}>
              With your permission, your question and relevant prayer text go
              through Kavanah’s server to OpenAI. Kavanah removes recognizable
              contact details first. Avoid sharing sensitive information in
              questions.
            </Text>
          </View>
        </Card>
      </View>

      <View style={{ gap: 12 }}>
        <Text
          accessibilityRole="header"
          style={{
            color: colors.ink,
            fontFamily: fonts.semibold,
            fontSize: 20,
            lineHeight: 28,
          }}
        >
          Your controls
        </Text>
        <Card style={{ gap: 0, padding: 0 }}>
          <View
            style={{
              minHeight: 72,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
            }}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <Text
                style={{
                  color: colors.ink,
                  fontFamily: fonts.semibold,
                  fontSize: 17,
                  lineHeight: 24,
                }}
              >
                Allow prayer assistant
              </Text>
              <Text variant="caption" style={{ fontSize: 13, lineHeight: 20 }}>
                Change this at any time.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Allow prayer assistant"
              checked={assistantEnabled}
              onCheckedChange={onAssistantChange}
            />
          </View>
        </Card>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 10,
            paddingHorizontal: 4,
          }}
        >
          <ShieldCheck size={20} color={colors.inkMuted} />
          <Text
            variant="caption"
            style={{ flex: 1, fontSize: 13, lineHeight: 20 }}
          >
            Assistant answers may be incomplete and are not religious, medical,
            or emergency advice. Prayer reading works without an account or
            assistant.
          </Text>
        </View>
      </View>

      <Button
        variant="ghost"
        size="row"
        accessibilityRole="link"
        onPress={() =>
          void Linking.openURL(
            "https://github.com/LeeoniIsrael/kavanah/blob/main/docs/privacy-policy.md",
          )
        }
        style={{
          backgroundColor: colors.vellum,
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            color: colors.ink,
            fontFamily: fonts.semibold,
            fontSize: 15,
            lineHeight: 22,
          }}
        >
          Read the full privacy policy
        </Text>
        <ChevronRight size={16} color={colors.inkMuted} />
      </Button>
    </View>
  );
}
