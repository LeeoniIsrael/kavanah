import type { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Screen({ children }: PropsWithChildren): React.JSX.Element {
  return (
    <SafeAreaView className="flex-1 bg-linen">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
