import type { Session } from "@supabase/supabase-js";
import { act, fireEvent, render } from "@testing-library/react-native";
import { Alert } from "react-native";
import { CircleFriends } from "../PeopleScreen";
import { ProfileScreen } from "../ProfileScreen";
import { deleteCircleAccount, loadCircleAccount, useCircleAccount } from "@/store/circleAccountStore";

const mockSignOut = jest.fn();
jest.mock("@/services/network/client", () => ({
  circleConfigured: true,
  circleRpc: jest.fn(),
  requireCircle: () => ({ auth: { signOut: (...args: unknown[]) => mockSignOut(...args) } }),
}));
jest.mock("@/store/circleAccountStore", () => ({
  useCircleAccount: jest.requireActual("zustand").create(() => ({ session: null, profile: null, ready: true })),
  loadCircleAccount: jest.fn(),
  deleteCircleAccount: jest.fn(),
}));
jest.mock("@/store/socialStore", () => ({ useSocialStore: { getState: () => ({ profile: null }) } }));
jest.mock("@/services/network/outbox", () => ({ useCircleSync: () => ({ pending: 0 }), flushCircle: jest.fn() }));
jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }), useLocalSearchParams: () => ({}) }));
jest.mock("@/services/localDataDeletion", () => ({ requestLocalDataDeletion: jest.fn() }));
jest.mock("@/services/haptics", () => ({ confirmHaptic: jest.fn() }));
jest.mock("@/store/authStore", () => ({ useAuthStore: () => ({ biometricLockEnabled: false }) }));
jest.mock("@/store/settingsStore", () => ({
  CURRENT_ASSISTANT_CONSENT_VERSION: 1,
  useSettingsStore: () => ({ primaryLanguageCode: "en", assistantConsentVersion: 0 }),
}));
jest.mock("@/design/appearance", () => ({
  useThemeColors: () => ({}),
  useAppearanceStore: () => ({ preference: "system" }),
}));
jest.mock("@/design/layout", () => ({ useInterfaceStyles: () => ({}) }));
jest.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: jest.requireActual("react-native").View,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock("@/components/Screen", () => ({ Screen: jest.requireActual("react-native").View }));
jest.mock("@/components/ProfilePhoto", () => ({ ProfilePhoto: () => null }));
jest.mock("@/components/PrayerFocusSetupContent", () => ({ PrayerFocusSetupContent: () => null }));
jest.mock("@/components/ActivityTiming", () => ({ ActivityTiming: () => null }));
jest.mock("@/components/ui/button", () => ({ Button: jest.requireActual("react-native").Pressable }));
jest.mock("@/components/ui/text", () => ({ Text: jest.requireActual("react-native").Text }));
jest.mock("@/components/ui/input", () => ({ Input: jest.requireActual("react-native").TextInput }));
jest.mock("@/components/ui/card", () => ({ Card: jest.requireActual("react-native").View }));
jest.mock("@/components/ui/section-heading", () => ({ SectionHeading: () => null }));
jest.mock("@/components/ui/choice-row", () => ({ ChoiceRow: () => null }));
jest.mock("@/components/ui/switch", () => ({ Switch: () => null }));
jest.mock("@/components/ui/gooey-popover", () => ({ GooeyInfoPopover: () => null }));
jest.mock("@/components/ui/bouncy-accordion", () => {
  const View = jest.requireActual("react-native").View;
  const Trigger = Object.assign(() => null, { Icon: View, Label: View });
  return { BouncyAccordion: { Root: View, Item: View, Trigger, Content: View } };
});
jest.mock("@/components/ui/icons", () => Object.fromEntries(
  ["Bell", "Share2", "Check", "ChevronRight", "Languages", "LockKeyhole", "MoonStar", "ShieldCheck", "MessageCircle", "UserRound", "X"].map(name => [name, () => null]),
));

const flush = async () => { await act(async () => { await Promise.resolve(); }); };
beforeEach(() => {
  mockSignOut.mockReset().mockResolvedValue({ error: null });
  jest.mocked(loadCircleAccount).mockReset().mockResolvedValue(undefined);
  jest.mocked(deleteCircleAccount).mockReset().mockResolvedValue(undefined);
  useCircleAccount.setState({ session: { user: { id: "alice" } } as Session, profile: null, ready: true });
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

for (const [name, Screen] of [["Profile", ProfileScreen], ["Circle", () => <CircleFriends tabs={null} />]] as const) {
  describe(name, () => {
    test("sign-out ends only this device's session and awaits local account cleanup", async () => {
      let finish!: (value: { error: null }) => void;
      mockSignOut.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
      const view = render(<Screen />);
      fireEvent.press(view.getByText("Sign out"));
      fireEvent.press(view.getByText("Sign out"));
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
      expect(loadCircleAccount).not.toHaveBeenCalled();
      await act(async () => { finish({ error: null }); });
      expect(loadCircleAccount).toHaveBeenCalledWith(null);
      expect(deleteCircleAccount).not.toHaveBeenCalled();
    });

    test("failed sign-out preserves local state and shows a recoverable error", async () => {
      mockSignOut.mockResolvedValue({ error: new Error("Sign-out unavailable") });
      const view = render(<Screen />);
      fireEvent.press(view.getByText("Sign out"));
      await flush();
      expect(view.getByText("Sign-out unavailable")).toBeTruthy();
      expect(loadCircleAccount).not.toHaveBeenCalled();
      expect(useCircleAccount.getState().session?.user.id).toBe("alice");
      mockSignOut.mockResolvedValue({ error: null });
      fireEvent.press(view.getByText("Sign out"));
      await flush();
      expect(loadCircleAccount).toHaveBeenCalledWith(null);
    });

    test("deletion requires confirmation that explains account-local loss and retained legacy records", async () => {
      const view = render(<Screen />);
      fireEvent.press(view.getByText("Delete account"));
      expect(deleteCircleAccount).not.toHaveBeenCalled();
      const [title, message, buttons] = jest.mocked(Alert.alert).mock.calls[0]!;
      expect(title).toBe("Delete your account?");
      expect(message).toContain("deletes your Kavanah account and active Circle data");
      expect(message).toContain("removes this account’s practice history, bookmarks, notes, preferences, app-local photos, and reminders from this device");
      expect(message).toContain("Older records without an account owner remain until you clear local data");
      expect(message).not.toContain("Private device activity stays");
      await act(async () => { buttons?.find(button => button.style === "cancel")?.onPress?.(); });
      expect(deleteCircleAccount).not.toHaveBeenCalled();
      await act(async () => { buttons?.find(button => button.style === "destructive")?.onPress?.(); });
      expect(deleteCircleAccount).toHaveBeenCalledTimes(1);
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    test("a deletion cleanup failure is visible and is not reported as success", async () => {
      jest.mocked(deleteCircleAccount).mockRejectedValue(new Error("The cloud account was deleted, but local cleanup failed."));
      const view = render(<Screen />);
      fireEvent.press(view.getByText("Delete account"));
      const buttons = jest.mocked(Alert.alert).mock.calls[0]![2];
      await act(async () => { buttons?.find(button => button.style === "destructive")?.onPress?.(); });
      expect(view.getByText("The cloud account was deleted, but local cleanup failed.")).toBeTruthy();
    });
  });
}
