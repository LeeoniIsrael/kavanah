import { parseAssistantContent } from "@/services/assistantFormatting";

describe("parseAssistantContent", () => {
  it("turns markdown sections into native content blocks", () => {
    expect(parseAssistantContent("A short answer.\n\n**Practical guidance:** Use this before the ritual.\n\n**Sources:** Exodus 13:9.")).toEqual([
      { kind: "paragraph", text: "A short answer." },
      { kind: "section", title: "Practical guidance", text: "Use this before the ritual." },
      { kind: "section", title: "Sources", text: "Exodus 13:9." }
    ]);
  });

  it("formats lists without preserving markdown bullets", () => {
    expect(parseAssistantContent("- First step\n- Second step")).toEqual([
      { kind: "bullet", text: "First step" },
      { kind: "bullet", text: "Second step" }
    ]);
  });
});
