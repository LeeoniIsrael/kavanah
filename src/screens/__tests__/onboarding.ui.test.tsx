import type { Session } from "@supabase/supabase-js";
import { act, fireEvent, render } from "@testing-library/react-native";
import { OnboardingScreen } from "../OnboardingScreen";
import { useCircleAccount } from "@/store/circleAccountStore";
import { usePrayerIdentityStore } from "@/store/prayerIdentityStore";
import { sendSignInCode } from "@/services/onboardingAuth";
import { requestLocalDataDeletion } from "@/services/localDataDeletion";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ replace: mockReplace, back: jest.fn() }) }));
jest.mock("expo", () => ({ isRunningInExpoGo: () => true }));
jest.mock("expo-constants", () => ({ __esModule: true, default: { expoConfig: { extra: { privacyPolicyUrl: "https://example.com/privacy", termsUrl: "https://example.com/terms" } } } }));
jest.mock("expo-apple-authentication", () => ({ isAvailableAsync: jest.fn(async () => false) }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: jest.requireActual("react-native").View }));
jest.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));
jest.mock("@/components/BrandMark", () => ({ BrandWordmark: () => null }));
jest.mock("@/components/AnimatedWelcomeHeadline", () => ({ AnimatedWelcomeHeadline: () => null }));
jest.mock("@/design/appearance", () => ({
  useThemeColors: () => jest.requireActual("@/design/theme").palettes.light,
  useThemedStyles: (factory: any) => factory(jest.requireActual("@/design/theme").palettes.light),
}));
jest.mock("@/services/localDataDeletion", () => ({ requestLocalDataDeletion: jest.fn() }));
jest.mock("@/services/network/client", () => ({ circleConfigured: true }));
jest.mock("@/services/onboardingAuth", () => ({ sendSignInCode: jest.fn(), verifySignInCode: jest.fn(), signInWithApple: jest.fn(), signInWithGoogle: jest.fn() }));
jest.mock("@/store/circleAccountStore", () => ({ useCircleAccount: jest.requireActual("zustand").create(() => ({ session: null })) }));
jest.mock("@/store/prayerIdentityStore", () => ({ usePrayerIdentityStore: jest.requireActual("zustand").create(() => ({ save: jest.fn(async () => undefined), finish: jest.fn(), completed: false })) }));
jest.mock("@/services/haptics", () => ({ confirmHaptic: jest.fn(), softHaptic: jest.fn(), successHaptic: jest.fn(), tapHaptic: jest.fn(), typingHaptic: jest.fn() }));

const session = { user: { id: "alice", is_anonymous: false } } as Session;
const originalEnv = { ...process.env };
beforeEach(() => {
  process.env.EXPO_PUBLIC_ENABLE_EMAIL_SIGN_IN = "true";
  process.env.EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN = "false";
  process.env.EXPO_PUBLIC_ENABLE_GOOGLE_SIGN_IN = "false";
  process.env.EXPO_PUBLIC_ENABLE_PHONE_SIGN_IN = "false";
  useCircleAccount.setState({ session: null });
  jest.mocked(usePrayerIdentityStore.getState().save).mockReset().mockResolvedValue(undefined);
  jest.mocked(usePrayerIdentityStore.getState().finish).mockClear();
  jest.mocked(sendSignInCode).mockReset().mockResolvedValue(undefined);
  mockReplace.mockClear();
  jest.mocked(requestLocalDataDeletion).mockClear();
});
afterEach(() => { for (const key of ["EXPO_PUBLIC_ENABLE_EMAIL_SIGN_IN", "EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN", "EXPO_PUBLIC_ENABLE_GOOGLE_SIGN_IN", "EXPO_PUBLIC_ENABLE_PHONE_SIGN_IN"]) {
  if (originalEnv[key] === undefined) delete process.env[key]; else process.env[key] = originalEnv[key];
} });

test("account entry has no guest action and exposes policies before sign-in", () => {
  const view = render(<OnboardingScreen mode="account" />);
  expect(view.queryByText("Explore without an account")).toBeNull();
  expect(view.getByText("An account is required. You choose whether to share your practice.")).toBeTruthy();
  expect(view.getByRole("link", { name: "Read Privacy Policy" })).toBeTruthy();
  expect(view.getByRole("link", { name: "Read Terms of Use" })).toBeTruthy();
  expect(view.queryByText("Make it yours.")).toBeNull();
  fireEvent.press(view.getByLabelText("Clear local data from this device"));
  expect(requestLocalDataDeletion).toHaveBeenCalledTimes(1);
});

test("first-launch onboarding contains no guest entry, including during its introduction", () => {
  const view = render(<OnboardingScreen />);
  expect(view.queryByText("Explore without an account", { includeHiddenElements: true })).toBeNull();
  expect(view.queryByText("Make it yours.")).toBeNull();
});

test("a build without a usable sign-in method blocks entry with a clear failure state", () => {
  process.env.EXPO_PUBLIC_ENABLE_EMAIL_SIGN_IN = "false";
  const view = render(<OnboardingScreen mode="account" />);
  expect(view.getByText("Sign-in is unavailable in this build. An account is required to use Kavanah.")).toBeTruthy();
  expect(view.queryByText("Explore without an account")).toBeNull();
});

test("code submission blocks duplicates and shows an actionable sending failure", async () => {
  let fail!: (error: Error) => void;
  jest.mocked(sendSignInCode).mockImplementation(() => new Promise((_, reject) => { fail = reject; }));
  const view = render(<OnboardingScreen mode="account" />);
  fireEvent.press(view.getByText("Continue with email"));
  fireEvent.changeText(view.getByLabelText("Email address"), "test@example.com");
  act(() => {
    fireEvent.press(view.getByText("Send code"));
    fireEvent.press(view.getByText("Send code"));
  });
  expect(sendSignInCode).toHaveBeenCalledTimes(1);
  await act(async () => { fail(new Error("Check your connection and try again.")); });
  expect(view.getByRole("alert")).toBeTruthy();
  expect(view.getByText("Check your connection and try again.")).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
});

test("sign-out while saving preferences cannot finish onboarding or enter the app", async () => {
  useCircleAccount.setState({ session });
  let finish!: () => void;
  jest.mocked(usePrayerIdentityStore.getState().save).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const view = render(<OnboardingScreen />);
  fireEvent.press(view.getByText("Man"));
  fireEvent.press(view.getByText("Continue"));
  fireEvent.press(view.getByText("I'm not sure yet"));
  fireEvent.press(view.getByText("Open my prayer book"));
  await act(async () => { useCircleAccount.setState({ session: null }); finish(); });
  expect(usePrayerIdentityStore.getState().finish).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(view.getByText("Continue with email")).toBeTruthy();
});
