import { act, render } from "@testing-library/react-native";
import type { Session } from "@supabase/supabase-js";
import { WidgetSync } from "../WidgetSync";
import { useCircleAccount } from "@/store/circleAccountStore";
import { updateNextPrayerWidget } from "../syncNextPrayerWidget";
jest.mock("@/widgets/syncNextPrayerWidget", () => ({ updateNextPrayerWidget: jest.fn() }));
jest.mock("@/design/appearance", () => ({ useAppearanceStore: (selector: any) => selector({ preference: "system" }) }));
jest.mock("@/store/circleAccountStore", () => ({ useCircleAccount: jest.requireActual("zustand").create(() => ({ session: null, sessionReady: false, sessionError: null })) }));
jest.mock("@/store/zmanimStore", () => {
  const state = { upcomingZmanim: [{ key: "sunrise", time: new Date(2030, 0, 1) }], location: { label: "Private location" } };
  return { useZmanimStore: (selector: any) => selector(state) };
});
beforeEach(() => { jest.clearAllMocks(); useCircleAccount.setState({ session: null, sessionReady: false, sessionError: null }); });
test("unverified and signed-out sessions only publish generic widget content", () => {
  const view = render(<WidgetSync />);
  expect(updateNextPrayerWidget).toHaveBeenLastCalledWith([], undefined, "system");
  act(() => useCircleAccount.setState({ session: { user: { id: "alice", is_anonymous: false } } as Session, sessionReady: true }));
  expect(updateNextPrayerWidget).toHaveBeenLastCalledWith(expect.any(Array), "Private location", "system");
  act(() => useCircleAccount.setState({ session: null }));
  expect(updateNextPrayerWidget).toHaveBeenLastCalledWith([], undefined, "system");
  view.unmount();
});
test("reset unmount clears the persisted widget timeline", () => {
  useCircleAccount.setState({ session: { user: { id: "alice", is_anonymous: false } } as Session, sessionReady: true });
  const view = render(<WidgetSync />);
  view.unmount();
  expect(updateNextPrayerWidget).toHaveBeenLastCalledWith([], undefined, "system");
});
