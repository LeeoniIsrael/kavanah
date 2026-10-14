import { fireEvent, render } from "@testing-library/react-native";
import { useState } from "react";
import { InlineQuoteText } from "../InlineQuoteText";
import { selectedQuote } from "@/services/socialPolicy";

jest.mock("@/design/appearance", () => ({
  useThemeColors: () => require("@/design/theme").palettes.light,
}));
jest.mock("@/services/haptics", () => ({
  confirmHaptic: jest.fn(),
  successHaptic: jest.fn(),
}));
jest.mock("@/components/ui/button", () => ({
  Button: require("react-native").Pressable,
}));
jest.mock("@/components/ui/text", () => ({
  Text: require("react-native").Text,
}));
jest.mock("@/components/ui/icons", () => ({
  Check: () => null,
  X: () => null,
}));

test("keeps reading pauses and continuous quote selection across lines", () => {
  const source = {
    prayerId: "modeh-ani",
    title: "Modeh Ani",
    sourceRef: "Modeh Ani",
    sourceUrl: "https://www.sefaria.org",
    language: "transliteration" as const,
    text: "Modeh Ani Lefanecha,\nmelech chai ve kayam,\nshehech-zarta bee, nishmati, b'chemla,\nRabah Emunatecha",
  };
  const save = jest.fn(() => true);
  function Harness() {
    const [active, setActive] = useState("");
    return (
      <InlineQuoteText
        active={active === "test"}
        fieldId="test"
        onActivate={setActive}
        onSave={save}
        source={source}
        style={{}}
      />
    );
  }
  const view = render(<Harness />);
  expect(view.getAllByTestId("quote-line-break")).toHaveLength(3);
  fireEvent.press(view.getByLabelText("Lefanecha,, word 3"));
  fireEvent.press(view.getByLabelText("chai, word 5"));
  expect(view.getByText("3 words selected")).toBeTruthy();
  fireEvent.press(
    view.getByLabelText("Save selected words as my weekly quote"),
  );
  expect(save).toHaveBeenCalledWith(source, 2, 4);
  expect(selectedQuote(source.text, 2, 4)).toBe("Lefanecha, melech chai");
});
