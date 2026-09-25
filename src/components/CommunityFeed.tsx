import { useRouter } from "expo-router";
import { ChevronRight, Users } from "lucide-react-native";
import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { colors } from "@/design/theme";

/** Home entry point. The virtualized activity feed lives in its own tab. */
export function CommunityFeed() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="content"
      onPress={() => router.push("/circle")}
      style={{
        padding: 20,
        borderRadius: 22,
        backgroundColor: colors.vellum,
        flexDirection: "row",
        gap: 16,
        alignItems: "center",
      }}
    >
      <Users size={24} color={colors.blue} />
      <View style={{ flex: 1, gap: 5 }}>
        <Text variant="section">Your circle</Text>
        <Text style={{ color: colors.inkMuted, fontSize: 13, lineHeight: 20 }}>
          Prayer updates. Milestones. A quote to carry.
        </Text>
      </View>
      <ChevronRight size={18} color={colors.inkMuted} />
    </Button>
  );
}
