import { View } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { loadCircleAccount, restoreCircleSession } from "@/store/circleAccountStore";

export function AccountSessionStatus({ error }: { error?: string | null }): React.JSX.Element {
  return (
    <View className="flex-1 items-center justify-center p-6 bg-background gap-4">
      {error ? <>
        <Text accessibilityRole="header" variant="section">Sign-in could not be restored</Text>
        <Text accessibilityRole="alert" variant="body">{error}</Text>
        <Button accessibilityLabel="Retry restoring sign-in" onPress={() => void restoreCircleSession()}>
          <Text>Try again</Text>
        </Button>
        <Button variant="secondary" onPress={() => void loadCircleAccount(null)}>
          <Text>Sign in again</Text>
        </Button>
      </> : <Text accessibilityRole="progressbar" accessibilityLiveRegion="polite" variant="body">Restoring sign-in…</Text>}
    </View>
  );
}
