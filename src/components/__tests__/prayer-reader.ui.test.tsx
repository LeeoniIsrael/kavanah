import { act, fireEvent, render } from "@testing-library/react-native";
import { GuidedPrayer } from "../GuidedPrayer";
jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: {
    View: require("react-native").View,
    FlatList: require("react-native").FlatList,
  },
  useSharedValue: (value: number) =>
    require("react").useRef({
      value,
      set(next: number) {
        this.value = next;
      },
    }).current,
  useAnimatedStyle: (factory: () => unknown) => factory(),
  useAnimatedScrollHandler:
    (handler: (event: unknown) => void) => (event: { nativeEvent: unknown }) =>
      handler(event.nativeEvent),
}));
jest.mock("@/design/appearance", () => ({
  useThemeColors: () => require("@/design/theme").palettes.light,
  useThemedStyles: (factory: any) =>
    factory(require("@/design/theme").palettes.light),
}));
jest.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => {
    const { Pressable } = require("react-native");
    return <Pressable {...props}>{children}</Pressable>;
  },
}));
jest.mock("@/components/ui/text", () => ({
  Text: require("react-native").Text,
  TextClassContext: require("react").createContext(""),
}));
jest.mock("@/components/ui/icons", () => ({
  Check: () => null,
  Bookmark: () => null,
  BookmarkCheck: () => null,
  Quote: () => null,
  X: () => null,
}));
const tokens = [
  {
    id: "one",
    hebrew: "א",
    transliteration: "First pronunciation",
    translation: "First meaning",
  },
  {
    id: "two",
    hebrew: "ב",
    transliteration: "Second pronunciation",
    translation: "Second meaning",
  },
];
function setup(completionBlockedReason?: string) {
  const startedAt = Date.now();
  const callbacks = {
    onClose: jest.fn(),
    onComplete: jest.fn(),
    onDetails: jest.fn(),
    onBookmark: jest.fn(),
    onSaveQuote: jest.fn(() => true),
  };
  return {
    ...render(
      <GuidedPrayer
        completionBlockedReason={completionBlockedReason}
        startedAt={startedAt}
        prayerTitle="Test prayer"
        tokens={tokens}
        visible
        bookmarked={false}
        reviewPending
        quoteSource={{
          prayerId: "test",
          title: "Test prayer",
          sourceRef: "Test 1",
          sourceUrl: "https://example.com",
        }}
        {...callbacks}
      />,
    ),
    ...callbacks,
  };
}
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
test("opening and waiting never logs completion, and close stays available", () => {
  const view = setup();
  expect(view.getByText("0:00 elapsed")).toBeTruthy();
  act(() => jest.advanceTimersByTime(30000));
  expect(view.getByText("0:30 elapsed")).toBeTruthy();
  expect(view.onComplete).not.toHaveBeenCalled();
  fireEvent.press(view.getByLabelText("Close without logging a prayer"));
  expect(view.onClose).toHaveBeenCalledTimes(1);
  expect(view.onComplete).not.toHaveBeenCalled();
});
test("all passages are readable without another start or next action", () => {
  const view = setup();
  expect(view.getByText("First meaning")).toBeTruthy();
  expect(view.getByText("Second meaning")).toBeTruthy();
  fireEvent.press(view.getByLabelText("Finish prayer and save to activity"));
  expect(view.onComplete).toHaveBeenCalledTimes(1);
});
test("bookmarking and opening details do not log a prayer", () => {
  const view = setup();
  fireEvent.press(view.getByLabelText("Bookmark prayer"));
  fireEvent.press(
    view.getByText("Text & pronunciation review pending · Source & options"),
  );
  expect(view.onBookmark).toHaveBeenCalledTimes(1);
  expect(view.onDetails).toHaveBeenCalledTimes(1);
  expect(view.onComplete).not.toHaveBeenCalled();
});

test("closed timing window keeps the text and exit available but disables Finish", () => {
  const view = setup("Today’s logging window closed at local sunset.");
  expect(
    view.getByText("Today’s logging window closed at local sunset."),
  ).toBeTruthy();
  expect(view.getByLabelText("First, word 1")).toBeTruthy();
  fireEvent.press(view.getByLabelText("Finish prayer and save to activity"));
  expect(view.onComplete).not.toHaveBeenCalled();
  fireEvent.press(view.getByLabelText("Close without logging a prayer"));
  expect(view.onClose).toHaveBeenCalledTimes(1);
});

test("one-blessing choice hides the second blessing but retains head placement directions", () => {
  const { corePrayers } = require("@/data/corePrayers");
  const prayer = corePrayers.find((p: any) => p.id === "tefillin");
  const view = render(
    <GuidedPrayer
      practice="tefillin"
      startedAt={Date.now()}
      prayerTitle="Tefillin"
      tokens={prayer.tokens}
      visible
      bookmarked={false}
      reviewPending
      onClose={jest.fn()}
      onComplete={jest.fn()}
      onDetails={jest.fn()}
      onBookmark={jest.fn()}
      onSaveQuote={jest.fn()}
    />,
  );
  const blessing = prayer.tokens.find(
    (t: any) => t.id === "tefillin-5",
  ).transliteration;
  expect(view.getByText(blessing)).toBeTruthy();
  fireEvent.press(view.getByText("One blessing"));
  expect(view.queryByText(blessing)).toBeNull();
  expect(view.getByText(/Secure it without another blessing/)).toBeTruthy();
  fireEvent.press(view.getByText("Two blessings"));
  expect(view.getByText(blessing)).toBeTruthy();
});

test("source instructions are displayed as directions, never pronunciation or translation", () => {
  const view = render(
    <GuidedPrayer
      startedAt={Date.now()}
      prayerTitle="Instructions"
      tokens={[
        {
          id: "rubric",
          kind: "instruction",
          hebrew: "הוראה",
          translation: "Cover your eyes",
          transliteration: "",
        },
      ]}
      visible
      bookmarked={false}
      reviewPending
      onClose={jest.fn()}
      onComplete={jest.fn()}
      onDetails={jest.fn()}
      onBookmark={jest.fn()}
      onSaveQuote={jest.fn()}
    />,
  );
  expect(view.getByText("Direction · not recited")).toBeTruthy();
  expect(view.getByText("Cover your eyes")).toBeTruthy();
  expect(view.queryByText("Translation · English")).toBeNull();
});

test("passage count follows the visible passage in either scroll direction without logging", () => {
  const view = setup();
  const list = view.UNSAFE_getByType(require("react-native").FlatList);
  expect(view.getByLabelText("Passage 1 of 2")).toBeTruthy();
  act(() =>
    list.props.onViewableItemsChanged({
      viewableItems: [{ item: tokens[1], index: 1, isViewable: true }],
    }),
  );
  expect(view.getByLabelText("Passage 2 of 2")).toBeTruthy();
  act(() =>
    list.props.onViewableItemsChanged({
      viewableItems: [{ item: tokens[0], index: 0, isViewable: true }],
    }),
  );
  expect(view.getByLabelText("Passage 1 of 2")).toBeTruthy();
  expect(view.onComplete).not.toHaveBeenCalled();
});
