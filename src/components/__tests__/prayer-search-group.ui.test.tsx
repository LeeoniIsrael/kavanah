import { fireEvent, render } from "@testing-library/react-native";
import { Keyboard } from "react-native";
import { PrayerSearchGroupCard } from "../PrayerSearchGroupCard";
import { corePrayers } from "@/data/corePrayers";
import type { PrayerSearchGroup } from "@/services/prayerSearchGroups";

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: { View: require("react-native").View },
  Easing: require("react-native").Easing,
  useSharedValue: (value: number) => require("react").useRef({ value }).current,
  useAnimatedStyle: (factory: () => unknown) => factory(),
  withTiming: (value: number) => value,
}));
jest.mock("@/design/appearance", () => ({
  useThemeColors: () => require("@/design/theme").palettes.light,
  useThemedStyles: (factory: any) =>
    factory(require("@/design/theme").palettes.light),
}));
jest.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));
jest.mock("@/components/ui/text", () => ({
  Text: require("react-native").Text,
  TextClassContext: require("react").createContext(""),
}));
jest.mock("@/components/ui/icons", () => ({
  ChevronDown: () => null,
  ChevronRight: () => null,
}));

const prayer = corePrayers[0]!;
const edition = {
  ...prayer,
  id: "alternate-source",
  sourceMetadata: {
    ...prayer.sourceMetadata,
    categories: [],
    hebrewTitle: "",
    sourceVersion: null,
    translationVersions: [],
    work: "Another prayer book",
    path: ["Weekday", "Morning"],
  },
};
const group: PrayerSearchGroup = {
  prayer,
  score: 1,
  reason: "test",
  editions: [{ prayer: edition, score: 1, reason: "test" }],
};

test("disclosure opens and closes without opening the prayer, and each edition keeps its source", () => {
  const onOpen = jest.fn();
  const dismiss = jest.spyOn(Keyboard, "dismiss").mockImplementation(() => {});
  const view = render(<PrayerSearchGroupCard group={group} onOpen={onOpen} />);
  const disclosure = () =>
    view.getByRole("button", { name: `Other editions of ${prayer.title}` });
  expect(disclosure().props.accessibilityState.expanded).toBe(false);
  expect(view.queryByText("Another prayer book")).toBeNull();
  fireEvent.press(disclosure());
  expect(dismiss).toHaveBeenCalledTimes(1);
  expect(disclosure().props.accessibilityState.expanded).toBe(true);
  expect(onOpen).not.toHaveBeenCalled();
  fireEvent.press(view.getByText("Another prayer book"));
  expect(onOpen).toHaveBeenLastCalledWith("alternate-source");
  fireEvent.press(disclosure());
  expect(view.queryByText("Another prayer book")).toBeNull();
  fireEvent.press(disclosure());
  expect(view.getByText("Another prayer book")).toBeTruthy();
  fireEvent.press(view.getByRole("button", { name: `Open ${prayer.title}` }));
  expect(onOpen).toHaveBeenLastCalledWith(prayer.id);
  dismiss.mockRestore();
});

test("a single source has no disclosure", () => {
  const view = render(
    <PrayerSearchGroupCard
      group={{ ...group, editions: [] }}
      onOpen={jest.fn()}
    />,
  );
  expect(view.queryByLabelText(`Other editions of ${prayer.title}`)).toBeNull();
});

test("arriving search results preserve the open list and expose the new source", () => {
  const onOpen = jest.fn();
  const view = render(<PrayerSearchGroupCard group={group} onOpen={onOpen} />);
  fireEvent.press(
    view.getByRole("button", { name: `Other editions of ${prayer.title}` }),
  );
  view.rerender(
    <PrayerSearchGroupCard
      group={{
        ...group,
        editions: [
          ...group.editions,
          {
            prayer: {
              ...edition,
              id: "third-source",
              sourceMetadata: {
                ...edition.sourceMetadata,
                work: "Third prayer book",
              },
            },
            score: 1,
            reason: "test",
          },
        ],
      }}
      onOpen={onOpen}
    />,
  );
  fireEvent.press(view.getByText("Third prayer book"));
  expect(onOpen).toHaveBeenCalledWith("third-source");
});
