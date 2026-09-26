import { act, fireEvent, render } from "@testing-library/react-native";
import { GuidedPrayer } from "../GuidedPrayer";
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
  fireEvent.press(view.getByText("Text review pending · Source & options"));
  expect(view.onBookmark).toHaveBeenCalledTimes(1);
  expect(view.onDetails).toHaveBeenCalledTimes(1);
  expect(view.onComplete).not.toHaveBeenCalled();
});

test("selects and saves a transliteration quote without leaving the prayer", () => {
  const view = setup();
  fireEvent.press(view.getByLabelText("First, word 1"));
  fireEvent.press(view.getAllByLabelText("pronunciation, word 2")[0]!);
  expect(view.getByText("2 words selected")).toBeTruthy();
  fireEvent.press(
    view.getByLabelText("Save selected words as my weekly quote"),
  );
  expect(view.onSaveQuote).toHaveBeenCalledWith(
    expect.objectContaining({
      language: "transliteration",
      text: "First pronunciation",
    }),
    0,
    1,
  );
  expect(view.getByText("Weekly quote saved")).toBeTruthy();
  expect(view.onClose).not.toHaveBeenCalled();
});

test("closed timing window keeps the text and exit available but disables Finish", () => {
  const view = setup("Today’s logging window closed at local sunset.");
  expect(
    view.getByText("Today’s logging window closed at local sunset."),
  ).toBeTruthy();
  expect(
    view.getAllByLabelText(
      "Transliteration quote text. Tap a word to start selecting.",
    ),
  ).toHaveLength(2);
  fireEvent.press(view.getByLabelText("Finish prayer and save to activity"));
  expect(view.onComplete).not.toHaveBeenCalled();
  fireEvent.press(view.getByLabelText("Close without logging a prayer"));
  expect(view.onClose).toHaveBeenCalledTimes(1);
});
