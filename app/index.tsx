import { Redirect } from "expo-router";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { usePrayerIdentityStore } from "@/store/prayerIdentityStore";

export default function Index(): React.JSX.Element {
  const completed = usePrayerIdentityStore((state) => state.completed);
  return completed ? <Redirect href="/home" /> : <OnboardingScreen />;
}
