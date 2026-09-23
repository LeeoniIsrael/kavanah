import { fireEvent, render, screen, act } from "@testing-library/react-native";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";

jest.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));
jest.mock("@/services/haptics", () => ({
  confirmHaptic: jest.fn(async () => undefined),
  softHaptic: jest.fn(async () => undefined),
  successHaptic: jest.fn(async () => undefined),
  tapHaptic: jest.fn(async () => undefined),
}));

test("migrated actions fire once and disabled actions cannot submit", async () => {
  const onPress = jest.fn();
  const view = render(
    <Button onPress={onPress}>
      <Text>Ask question</Text>
    </Button>,
  );
  await act(async () => {
    fireEvent.press(screen.getByText("Ask question"));
  });
  expect(onPress).toHaveBeenCalledTimes(1);
  view.rerender(
    <Button onPress={onPress} disabled>
      <Text>Ask question</Text>
    </Button>,
  );
  await act(async () => {
    fireEvent.press(screen.getByText("Ask question"));
  });
  expect(onPress).toHaveBeenCalledTimes(1);
});

test("practice buttons retain checkbox semantics and their checked state", () => {
  render(
    <Button
      accessibilityRole="checkbox"
      accessibilityLabel="Daily study"
      accessibilityState={{ checked: true }}
    >
      <Text>Daily study</Text>
    </Button>,
  );
  expect(screen.getByRole("checkbox", { checked: true })).toBeTruthy();
});

test("search input preserves controlled query updates", () => {
  function Search() {
    const [query, setQuery] = useState("");
    return (
      <Input
        accessibilityLabel="Search prayers"
        value={query}
        onChangeText={setQuery}
      />
    );
  }
  render(<Search />);
  fireEvent.changeText(screen.getByLabelText("Search prayers"), "shema");
  expect(screen.getByDisplayValue("shema")).toBeTruthy();
});

test("input keeps the first placeholder static when reduced motion is enabled", () => {
  render(
    <Input
      accessibilityLabel="Reflection"
      placeholders={["What stayed with you?", "What will you carry forward?"]}
    />,
  );
  expect(screen.getByLabelText("Reflection").props.placeholder).toBe(
    "What stayed with you?",
  );
});

test("settings switches and story tabs preserve controlled selection", () => {
  function Controls() {
    const [checked, setChecked] = useState(false);
    const [layout, setLayout] = useState("focus");
    return (
      <>
        <Switch
          accessibilityLabel="Prayer Focus"
          checked={checked}
          onCheckedChange={setChecked}
        />
        <Tabs value={layout} onValueChange={setLayout}>
          <TabsList>
            <TabsTrigger value="focus">
              <Text>Focus</Text>
            </TabsTrigger>
            <TabsTrigger value="quiet">
              <Text>Quiet</Text>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </>
    );
  }
  render(<Controls />);
  fireEvent.press(screen.getByRole("switch", { name: "Prayer Focus" }));
  expect(screen.getByRole("switch", { checked: true })).toBeTruthy();
  fireEvent.press(screen.getByRole("tab", { name: "Quiet" }));
  expect(
    screen.getByRole("tab", { selected: true, name: "Quiet" }),
  ).toBeTruthy();
});
