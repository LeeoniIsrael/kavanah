import { updateNextPrayerWidget } from "../syncNextPrayerWidget.ios";
const mockWidgetLoaded = jest.fn();
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { executionEnvironment: "storeClient" },
  ExecutionEnvironment: { StoreClient: "storeClient" },
}));
jest.mock("@/widgets/NextPrayerWidget", () => {
  mockWidgetLoaded();
  throw new Error("Expo Go must not import the native widget module");
});
test("Expo Go skips native widget initialization before importing it", () => {
  expect(() => updateNextPrayerWidget([], undefined, "system")).not.toThrow();
  expect(mockWidgetLoaded).not.toHaveBeenCalled();
});
