/* eslint-disable @typescript-eslint/no-require-imports */
import { fireEvent, render } from "@testing-library/react-native";
import { View, Text } from "react-native";
import { Accordion, AccordionReveal } from "../ui/accordion";
import { tapHaptic } from "@/services/haptics";

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: { View: require("react-native").View },
  Easing: require("react-native").Easing,
  useSharedValue: (value: number) => require("react").useRef({ value }).current,
  useAnimatedStyle: (factory: () => unknown) => factory(),
  withTiming: (value: number) => value,
}));
jest.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));
jest.mock("@/services/haptics", () => ({ tapHaptic: jest.fn() }));

function Items() {
  return (
    <>
      {["one", "two"].map((value) => (
        <Accordion.Item key={value} value={value}>
          <Accordion.Trigger accessibilityLabel={value}>
            <Accordion.Trigger.Label>{value}</Accordion.Trigger.Label>
          </Accordion.Trigger>
          <Accordion.Content>
            <Text>{value} details</Text>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </>
  );
}
test("multiple sections remain independently open and collapsed content is hidden", () => {
  const view = render(
    <Accordion type="multiple">
      <Items />
    </Accordion>,
  );
  expect(view.queryByText("one details")).toBeNull();
  fireEvent.press(view.getByRole("button", { name: "one" }));
  fireEvent.press(view.getByRole("button", { name: "two" }));
  expect(view.getByText("one details")).toBeTruthy();
  expect(view.getByText("two details")).toBeTruthy();
  fireEvent.press(view.getByRole("button", { name: "one" }));
  expect(view.queryByText("one details")).toBeNull();
  expect(view.getByText("two details")).toBeTruthy();
});
test("controlled sections wait for their owner and noncollapsible sections stay open", () => {
  const change = jest.fn();
  const view = render(
    <Accordion value="one" onValueChange={change} collapsible={false}>
      <Items />
    </Accordion>,
  );
  fireEvent.press(view.getByRole("button", { name: "one" }));
  expect(change).not.toHaveBeenCalled();
  fireEvent.press(view.getByRole("button", { name: "two" }));
  expect(change).toHaveBeenCalledWith("two");
  expect(
    view.getByRole("button", { name: "one", expanded: true }),
  ).toBeTruthy();
  view.rerender(
    <Accordion value="two">
      <Items />
    </Accordion>,
  );
  expect(
    view.getByRole("button", { name: "two", expanded: true }),
  ).toBeTruthy();
});
test("a disabled trigger cannot toggle or produce feedback", () => {
  jest.mocked(tapHaptic).mockClear();
  const change = jest.fn();
  const view = render(
    <Accordion onValueChange={change}>
      <Accordion.Item value="one">
        <Accordion.Trigger disabled accessibilityLabel="disabled">
          Disabled
        </Accordion.Trigger>
      </Accordion.Item>
    </Accordion>,
  );
  fireEvent.press(view.getByRole("button", { name: "disabled" }));
  expect(change).not.toHaveBeenCalled();
  expect(tapHaptic).not.toHaveBeenCalled();
});
test("reveal mounts content once and remeasures changed natural height", () => {
  const view = render(
    <AccordionReveal open>
      <View testID="content">
        <Text>Details</Text>
      </View>
    </AccordionReveal>,
  );
  expect(view.getAllByTestId("content")).toHaveLength(1);
  const measure = view.getByTestId("content").parent!;
  fireEvent(measure, "layout", { nativeEvent: { layout: { height: 120 } } });
  fireEvent(measure, "layout", { nativeEvent: { layout: { height: 240 } } });
  view.rerender(
    <AccordionReveal open={false}>
      <View testID="content">
        <Text>Details</Text>
      </View>
    </AccordionReveal>,
  );
  expect(view.queryByText("Details")).toBeNull();
});

jest.mock("@/components/ui/icons", () => ({
  ChevronDown: () => null,
  Plus: () => null,
}));
