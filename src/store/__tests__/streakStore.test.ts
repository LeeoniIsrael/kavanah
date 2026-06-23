import { useStreakStore } from "@/store/streakStore";

describe("streak store", () => {
  beforeEach(() => {
    useStreakStore.setState({
      habits: [
        { habit: "shacharit", streak: 0, freezes: 2, completedDates: [], badges: [] },
        { habit: "mincha", streak: 0, freezes: 2, completedDates: [], badges: [] },
        { habit: "maariv", streak: 0, freezes: 2, completedDates: [], badges: [] },
        { habit: "tefillin", streak: 0, freezes: 2, completedDates: [], badges: [] },
        { habit: "study", streak: 0, freezes: 2, completedDates: [], badges: [] }
      ]
    });
  });

  it("increments streaks and awards milestone badges", () => {
    useStreakStore.getState().completeHabit("study", new Date("2026-06-20T12:00:00Z"));
    useStreakStore.getState().completeHabit("study", new Date("2026-06-21T12:00:00Z"));
    useStreakStore.getState().completeHabit("study", new Date("2026-06-22T12:00:00Z"));

    const study = useStreakStore.getState().habits.find((habit) => habit.habit === "study");
    expect(study?.streak).toBe(3);
    expect(study?.badges).toContain("3 days");
  });
});
