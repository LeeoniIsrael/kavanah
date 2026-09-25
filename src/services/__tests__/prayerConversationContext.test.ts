import {
  prayerConversationContext,
  type PrayerTurn,
} from "@/services/prayerConversationContext";

test("follow-ups carry prior questions and answers alongside source context", () => {
  const result = prayerConversationContext(
    ["Prayer: Modeh Ani", "Review pending"],
    [
      { role: "user", content: "What does compassion mean?" },
      { role: "assistant", content: "It means kindness toward someone." },
    ],
    "Spanish",
  );
  expect(result.join("\n")).toContain("Reply in Spanish");
  expect(result).toContain("Previous user: What does compassion mean?");
  expect(result).toContain(
    "Previous assistant: It means kindness toward someone.",
  );
  expect(result.join("\n")).toContain("Review pending");
});
test("bounded history excludes failures and retains the newest turns", () => {
  const turns: PrayerTurn[] = Array.from({ length: 20 }, (_, i) => ({
    role: "user",
    content: `question ${i}`,
  }));
  turns.push({ role: "assistant", content: "Network error", failed: true });
  const result = prayerConversationContext(
    Array.from({ length: 30 }, (_, i) => `source ${i}`),
    turns,
    "English",
  );
  expect(result.length).toBeLessThanOrEqual(18);
  expect(result).toContain("Previous user: question 19");
  expect(result).not.toContain("Previous user: question 0");
  expect(result.join("\n")).not.toContain("Network error");
});
