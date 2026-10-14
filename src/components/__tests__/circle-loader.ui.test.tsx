import { fireEvent, render, screen } from "@testing-library/react-native";
import { CircleLoadingIndicator } from "@/components/molecules/circle-loader";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
jest.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));
jest.mock("@/services/haptics", () => ({ confirmHaptic: jest.fn(), softHaptic: jest.fn(), successHaptic: jest.fn(), tapHaptic: jest.fn() }));
test("reduced motion retains an accessible busy status", () => {
  render(<CircleLoadingIndicator accessibilityLabel="Loading prayer" />);
  expect(screen.getByRole("progressbar", { name: "Loading prayer" }).props.accessibilityState.busy).toBe(true);
});
test("loading replaces text, blocks submission, and restores the action when complete", () => {
  const onPress = jest.fn();
  const view = render(<Button accessibilityLabel="Save" isLoading loadingLabel="Saving" onPress={onPress}><Text>Save</Text></Button>);
  expect(screen.queryByText("Saving")).toBeNull();
  expect(screen.getByRole("progressbar")).toBeTruthy();
  fireEvent.press(screen.getByRole("button"));
  expect(onPress).not.toHaveBeenCalled();
  view.rerender(<Button accessibilityLabel="Save" onPress={onPress}><Text>Save</Text></Button>);
  expect(screen.queryByRole("progressbar")).toBeNull();
  fireEvent.press(screen.getByRole("button"));
  expect(onPress).toHaveBeenCalledTimes(1);
});
