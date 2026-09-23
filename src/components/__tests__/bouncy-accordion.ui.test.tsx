import { fireEvent, render, screen } from "@testing-library/react-native";

import { BouncyAccordion } from "@/components/ui/bouncy-accordion";

jest.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: () => true }));

test("bouncy accordion exposes and changes its expanded state", () => {
  render(
    <BouncyAccordion.Root defaultValue="local">
      <BouncyAccordion.Item value="local">
        <BouncyAccordion.Trigger accessibilityLabel="Local data">
          <BouncyAccordion.Trigger.Label>
            Local data
          </BouncyAccordion.Trigger.Label>
        </BouncyAccordion.Trigger>
        <BouncyAccordion.Content>
          Stored on this device.
        </BouncyAccordion.Content>
      </BouncyAccordion.Item>
      <BouncyAccordion.Item value="assistant">
        <BouncyAccordion.Trigger accessibilityLabel="Assistant data">
          <BouncyAccordion.Trigger.Label>
            Assistant data
          </BouncyAccordion.Trigger.Label>
        </BouncyAccordion.Trigger>
        <BouncyAccordion.Content>
          Sent only with consent.
        </BouncyAccordion.Content>
      </BouncyAccordion.Item>
    </BouncyAccordion.Root>,
  );

  expect(
    screen.getByRole("button", { name: "Local data", expanded: true }),
  ).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Assistant data" }));
  expect(
    screen.getByRole("button", { name: "Local data", expanded: false }),
  ).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Assistant data", expanded: true }),
  ).toBeTruthy();
  fireEvent.press(screen.getByRole("button", { name: "Assistant data" }));
  expect(
    screen.getByRole("button", { name: "Assistant data", expanded: false }),
  ).toBeTruthy();
});
