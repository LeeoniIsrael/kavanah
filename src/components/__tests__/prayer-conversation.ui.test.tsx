import { act, fireEvent, render } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import {
  PrayerConversation,
  usePrayerConversation,
} from "../PrayerExplanation";
import { createAssistantStream } from "@/services/assistantService";
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
    const Pressable = require("react-native").Pressable;
    return <Pressable {...props}>{children}</Pressable>;
  },
}));
jest.mock("@/components/ui/text", () => ({
  Text: require("react-native").Text,
}));
jest.mock("@/components/ui/icons", () => ({
  X: () => null,
  ArrowUp: () => null,
}));
jest.mock("@/store/settingsStore", () => {
  const state = { assistantConsentVersion: 1, setAssistantConsent: jest.fn() };
  const useSettingsStore = Object.assign((selector: any) => selector(state), {
    getState: () => state,
  });
  return { CURRENT_ASSISTANT_CONSENT_VERSION: 1, useSettingsStore };
});
jest.mock("@/services/assistantService", () => ({
  createAssistantStream: jest.fn(),
}));
function Trigger() {
  const open = usePrayerConversation();
  return (
    <Pressable onPress={() => open?.({ x: 0, y: 100, width: 200, height: 44 })}>
      <Text>Open conversation</Text>
    </Pressable>
  );
}
test("general questions and follow-ups share history, and closing preserves the conversation", async () => {
  jest.mocked(createAssistantStream).mockImplementation(async function* () {
    yield "A simple answer.";
  });
  const view = render(
    <PrayerConversation
      context={["Prayer: Modeh Ani"]}
      language="English"
      title="Modeh Ani"
    >
      <Trigger />
    </PrayerConversation>,
  );
  fireEvent.press(view.getByText("Open conversation"));
  expect(createAssistantStream).not.toHaveBeenCalled();
  fireEvent.changeText(
    view.getByLabelText("Question about this prayer"),
    "What is this prayer about?",
  );
  await act(async () => {
    fireEvent.press(view.getByLabelText("Send question"));
  });
  expect(view.getByText("A simple answer.")).toBeTruthy();
  fireEvent.changeText(
    view.getByLabelText("Question about this prayer"),
    "Can you make that simpler?",
  );
  await act(async () => {
    fireEvent.press(view.getByLabelText("Send question"));
  });
  const calls = jest.mocked(createAssistantStream).mock.calls;
  expect(calls[1]?.[1].join("\n")).toContain(
    "Previous user: What is this prayer about?",
  );
  expect(calls[1]?.[1].join("\n")).toContain(
    "Previous assistant: A simple answer.",
  );
  fireEvent.changeText(
    view.getByLabelText("Question about this prayer"),
    "Unsent draft",
  );
  await act(async () => {
    fireEvent.press(view.getByLabelText("Return to prayer"));
  });
  fireEvent.press(view.getByText("Open conversation"));
  expect(view.getByDisplayValue("Unsent draft")).toBeTruthy();
  expect(view.getByText("Can you make that simpler?")).toBeTruthy();
  expect(createAssistantStream).toHaveBeenCalledTimes(2);
});
