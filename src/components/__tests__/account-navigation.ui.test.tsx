import type { Session } from "@supabase/supabase-js";
import { act, fireEvent, render } from "@testing-library/react-native";
import { AccountNavigator } from "../AccountNavigator";
import Index from "../../../app/index";
import { useCircleAccount, restoreCircleSession } from "@/store/circleAccountStore";
import { usePrayerIdentityStore } from "@/store/prayerIdentityStore";

jest.mock("expo-router", () => {
  const { View, Text } = jest.requireActual("react-native");
  const Stack = ({ children }: any) => <View>{children}</View>;
  Stack.Screen = function FakeScreen({ name }: any) { return <View testID={`route:${name}`} />; };
  Stack.Protected = function FakeProtected({ guard, children }: any) { return guard ? children : null; };
  return { Stack, Redirect: ({ href }: any) => <Text>{`Redirect:${href}`}</Text> };
});
jest.mock("@/store/circleAccountStore", () => ({
  useCircleAccount: jest.requireActual("zustand").create(() => ({ session: null, sessionReady: true, sessionError: null })),
  restoreCircleSession: jest.fn(),
  loadCircleAccount: jest.fn(),
}));
jest.mock("@/store/prayerIdentityStore", () => ({ usePrayerIdentityStore: jest.requireActual("zustand").create(() => ({ completed: true })) }));
jest.mock("@/screens/OnboardingScreen", () => ({ OnboardingScreen: () => <>{jest.requireActual("react").createElement(jest.requireActual("react-native").Text, null, "Sign in required")}</> }));
jest.mock("@/components/ui/text", () => ({ Text: jest.requireActual("react-native").Text }));
jest.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: any) => <>{jest.requireActual("react").createElement(jest.requireActual("react-native").Pressable, props, children)}</> }));

const session = (anonymous = false) => ({ user: { id: "alice", is_anonymous: anonymous } }) as Session;
beforeEach(() => {
  useCircleAccount.setState({ session: null, sessionReady: true, sessionError: null });
  usePrayerIdentityStore.setState({ completed: true });
  jest.mocked(restoreCircleSession).mockClear();
});

test.each([null, session(true)])("all app routes remain blocked for signed-out or anonymous users with completed legacy onboarding", account => {
  useCircleAccount.setState({ session: account });
  const view = render(<AccountNavigator />);
  for (const route of ["(tabs)", "prayer-preferences", "people", "notifications", "holiday-checklist", "focus-setup"]) expect(view.queryByTestId(`route:${route}`)).toBeNull();
  expect(view.getByTestId("route:index")).toBeTruthy();
  const entry = render(<Index />);
  expect(entry.getByText("Sign in required")).toBeTruthy();
  expect(entry.queryByText("Redirect:/home")).toBeNull();
});

test("restoration shows loading, failures expose a retry, and no private route is granted", () => {
  useCircleAccount.setState({ sessionReady: false });
  const view = render(<Index />);
  expect(view.getByRole("progressbar")).toBeTruthy();
  act(() => useCircleAccount.setState({ sessionReady: true, sessionError: "Check your connection." }));
  expect(view.getByRole("alert")).toBeTruthy();
  fireEvent.press(view.getByLabelText("Retry restoring sign-in"));
  expect(restoreCircleSession).toHaveBeenCalledTimes(1);
  expect(view.queryByText("Redirect:/home")).toBeNull();
});

test("valid sign-in opens app routes; sign-out immediately removes them", () => {
  useCircleAccount.setState({ session: session() });
  const view = render(<AccountNavigator />);
  expect(view.getByTestId("route:(tabs)")).toBeTruthy();
  act(() => useCircleAccount.setState({ session: null }));
  expect(view.queryByTestId("route:(tabs)")).toBeNull();
  expect(view.queryByTestId("route:people")).toBeNull();
});

test("a newly signed-in user completes preferences before entering the app", () => {
  useCircleAccount.setState({ session: session() });
  usePrayerIdentityStore.setState({ completed: false });
  const view = render(<AccountNavigator />);
  expect(view.queryByTestId("route:(tabs)")).toBeNull();
  const entry = render(<Index />);
  expect(entry.getByText("Sign in required")).toBeTruthy();
});
