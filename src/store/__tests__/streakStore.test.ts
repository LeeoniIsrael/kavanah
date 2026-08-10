import { useStreakStore } from "@/store/streakStore";

describe("streak store", () => {
  beforeEach(() => {
    useStreakStore.setState({
      enabledHabits: ["shacharit", "mincha", "maariv", "tefillin", "study"],
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

  it("allows a completed practice to be unchecked and checked again", () => {
    const firstDay = new Date("2026-06-20T12:00:00Z");
    const secondDay = new Date("2026-06-21T12:00:00Z");
    useStreakStore.getState().completeHabit("study", firstDay);
    useStreakStore.getState().completeHabit("study", secondDay);

    useStreakStore.getState().toggleHabit("study", secondDay);
    let study = useStreakStore.getState().habits.find((habit) => habit.habit === "study");
    expect(study?.completedDates).not.toContain("2026-06-21");
    expect(study?.streak).toBe(1);

    useStreakStore.getState().toggleHabit("study", secondDay);
    study = useStreakStore.getState().habits.find((habit) => habit.habit === "study");
    expect(study?.completedDates).toContain("2026-06-21");
    expect(study?.streak).toBe(2);
  });

  it("hides and restores optional practices without deleting their history", () => {
    useStreakStore.getState().completeHabit("study", new Date("2026-06-20T12:00:00Z"));

    useStreakStore.getState().setHabitEnabled("study", false);
    expect(useStreakStore.getState().enabledHabits).not.toContain("study");
    expect(useStreakStore.getState().habits.find((habit) => habit.habit === "study")?.completedDates).toContain("2026-06-20");

    useStreakStore.getState().setHabitEnabled("study", true);
    expect(useStreakStore.getState().enabledHabits).toContain("study");
    expect(useStreakStore.getState().habits.find((habit) => habit.habit === "study")?.streak).toBe(1);
  });

  it("allows every daily practice to be optional", () => {
    const habits = useStreakStore.getState().enabledHabits;
    habits.forEach((habit) => useStreakStore.getState().setHabitEnabled(habit, false));

    expect(useStreakStore.getState().enabledHabits).toEqual([]);
  });
});
