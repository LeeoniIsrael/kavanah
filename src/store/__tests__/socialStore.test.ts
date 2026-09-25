import { useSocialStore } from "@/store/socialStore";
import { selectedQuote, weekKey } from "@/services/socialPolicy";

const date = new Date(2026, 8, 24, 9);
const activity = {
  id: "morning",
  prayerId: "modeh-ani",
  title: "Modeh Ani",
  completedAt: date,
  streak: 1,
};
beforeEach(() =>
  useSocialStore.setState({
    profile: null,
    posts: [],
    seenDays: [],
    hasPrayedEver: false,
    seenEvents: [],
    preferences: { prayers: "off", milestones: false },
  }),
);
test("automatic updates stay off until chosen and do not backfill", () => {
  useSocialStore.getState().recordPrayer(activity);
  useSocialStore
    .getState()
    .setPreferences({ prayers: "first-ever", milestones: false });
  useSocialStore.getState().recordPrayer({ ...activity, id: "afternoon" });
  expect(useSocialStore.getState().posts).toHaveLength(0);
});
test("first-ever records only the first lifetime prayer; repeated events never repost", () => {
  useSocialStore
    .getState()
    .setPreferences({ prayers: "first-ever", milestones: false });
  useSocialStore.getState().recordPrayer(activity);
  useSocialStore.getState().recordPrayer(activity);
  useSocialStore.getState().recordPrayer({ ...activity, id: "later" });
  useSocialStore.getState().recordPrayer({
    ...activity,
    id: "tomorrow",
    completedAt: new Date(2026, 8, 25, 9),
  });
  expect(useSocialStore.getState().posts).toHaveLength(1);
});
test("every prayer records distinct completions; milestones deduplicate and survive removal", () => {
  useSocialStore
    .getState()
    .setPreferences({ prayers: "every", milestones: true });
  const milestone = { ...activity, streak: 7, practiceKey: "shacharit" };
  useSocialStore.getState().recordPrayer(milestone);
  const post = useSocialStore
    .getState()
    .posts.find((p) => p.kind === "milestone")!;
  useSocialStore.getState().removePost(post.id);
  useSocialStore.getState().recordPrayer({ ...milestone, id: "repeat" });
  expect(
    useSocialStore.getState().posts.filter((p) => p.kind === "prayer"),
  ).toHaveLength(2);
  expect(
    useSocialStore.getState().posts.filter((p) => p.kind === "milestone"),
  ).toHaveLength(0);
});
test("weekly quotes contain only source words and replace within a Monday-based week", () => {
  const source = {
    prayerId: "modeh-ani",
    title: "Modeh Ani",
    text: "I give thanks before You",
    sourceRef: "Modeh Ani",
    sourceUrl: "https://www.sefaria.org",
    language: "en",
  };
  expect(useSocialStore.getState().setWeeklyQuote(source, 2, 0, date)).toBe(
    true,
  );
  expect(useSocialStore.getState().posts[0]?.quote).toBe("I give thanks");
  useSocialStore.getState().setWeeklyQuote(source, 1, 4, new Date(2026, 8, 27));
  expect(useSocialStore.getState().posts).toHaveLength(1);
  expect(useSocialStore.getState().posts[0]?.week).toBe(weekKey(date));
  useSocialStore.getState().setWeeklyQuote(source, 0, 4, new Date(2026, 8, 28));
  expect(useSocialStore.getState().posts).toHaveLength(2);
  expect(useSocialStore.getState().setWeeklyQuote(source, 0, 99)).toBe(false);
  expect(selectedQuote("a ".repeat(61), 0, 60)).toBeNull();
});
test("milestones can be shared without every-prayer updates", () => {
  useSocialStore
    .getState()
    .setPreferences({ prayers: "off", milestones: true });
  useSocialStore.getState().recordPrayer({ ...activity, streak: 18 });
  expect(useSocialStore.getState().posts.map((p) => p.kind)).toEqual([
    "milestone",
  ]);
});

test("timed prayer and milestone preserve the real start and elapsed seconds", () => {
  useSocialStore
    .getState()
    .setPreferences({ prayers: "every", milestones: true });
  useSocialStore
    .getState()
    .recordPrayer({
      ...activity,
      streak: 3,
      startedAt: new Date(date.getTime() - 125000),
    });
  expect(useSocialStore.getState().posts).toHaveLength(2);
  for (const post of useSocialStore.getState().posts) {
    expect(post.startedAt).toBe(
      new Date(date.getTime() - 125000).toISOString(),
    );
    expect(post.durationSeconds).toBe(125);
  }
});
test("first ever cannot repeat after deleting the post or clearing bounded event history", () => {
  useSocialStore
    .getState()
    .setPreferences({ prayers: "first-ever", milestones: true });
  useSocialStore.getState().recordPrayer(activity);
  useSocialStore.getState().removePost(useSocialStore.getState().posts[0]!.id);
  useSocialStore.setState({ seenEvents: [], seenDays: [] });
  useSocialStore
    .getState()
    .recordPrayer({ ...activity, id: "later", streak: 3 });
  expect(useSocialStore.getState().posts.map((p) => p.kind)).toEqual([
    "milestone",
  ]);
});
