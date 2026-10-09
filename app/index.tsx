import { Redirect } from "expo-router";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { usePrayerIdentityStore } from "@/store/prayerIdentityStore";
import { useCircleAccount } from "@/store/circleAccountStore";
import { isAccountSession } from "@/services/accountAccess";
import { AccountSessionStatus } from "@/components/AccountSessionStatus";

export default function Index(): React.JSX.Element {
  const completed = usePrayerIdentityStore((state) => state.completed);
  const { session, sessionReady, sessionError } = useCircleAccount();
  if (!sessionReady || sessionError) return <AccountSessionStatus error={sessionError} />;
  return completed && isAccountSession(session) ? <Redirect href="/home" /> : <OnboardingScreen key={isAccountSession(session) ? session.user.id : "sign-in"} />;
}
