export type AssistantContentBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "section"; title: string; text: string }
  | { kind: "bullet"; text: string };

export function parseAssistantContent(content: string): AssistantContentBlock[] {
  const blocks: AssistantContentBlock[] = [];
  const paragraphs = content.replace(/\r\n/g, "\n").split(/\n\s*\n/);

  for (const paragraph of paragraphs) {
    const text = paragraph.trim();
    if (!text) {
      continue;
    }

    const section = text.match(/^\*\*([^*]+?):\*\*\s*([\s\S]*)$/);
    if (section) {
      blocks.push({ kind: "section", title: (section[1] ?? "").trim(), text: cleanMarkdown(section[2] ?? "") });
      continue;
    }

    const heading = text.match(/^#{1,6}\s+([^\n]+)\n?([\s\S]*)$/);
    if (heading) {
      blocks.push({ kind: "section", title: cleanMarkdown(heading[1] ?? ""), text: cleanMarkdown(heading[2] ?? "") });
      continue;
    }

    const lines = text.split("\n");
    if (lines.every((line) => /^[-•]\s+/.test(line.trim()))) {
      for (const line of lines) {
        blocks.push({ kind: "bullet", text: cleanMarkdown(line.trim().replace(/^[-•]\s+/, "")) });
      }
      continue;
    }

    blocks.push({ kind: "paragraph", text: cleanMarkdown(text) });
  }

  return blocks;
}

function cleanMarkdown(text: string): string {
  return text.trim().replace(/^\*+|\*+$/g, "");
}
