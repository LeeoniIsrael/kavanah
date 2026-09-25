import { defaultReminders } from "@/services/reminderPlan";
import { isReminderPreferences, useReminderStore } from "../reminderStore";
import { readSocialData } from "@/services/socialStorage";
describe("reminder preferences", () => {
  it("rejects malformed persisted data and invalid clock values", () => {
    expect(isReminderPreferences({})).toBe(false);
    const p = defaultReminders();
    p.quietStart = "25:00";
    expect(isReminderPreferences(p)).toBe(false);
  });
  it("rejects invalid days and negative advance notice", () => {
    const p = defaultReminders();
    p.prayers.tefillin.days = [9];
    expect(isReminderPreferences(p)).toBe(false);
    const q = defaultReminders();
    q.holidays.lead = -1;
    expect(isReminderPreferences(q)).toBe(false);
  });
  it("durably saves choices while off", () => {
    useReminderStore.getState().update({ sound: true });
    expect(readSocialData("reminders.v1", isReminderPreferences)?.sound).toBe(
      true,
    );
    expect(useReminderStore.getState().prefs.enabled).toBe(false);
  });
  it("persists separate checklists for each holiday occurrence", () => {
    useReminderStore.getState().toggleTask("2026-09-12", "Plan meals");
    useReminderStore.getState().toggleTask("2027-10-02", "Plan meals");
    useReminderStore.getState().toggleTask("2026-09-12", "Plan meals");
    expect(useReminderStore.getState().checklists["2026-09-12"]).toEqual([]);
    expect(useReminderStore.getState().checklists["2027-10-02"]).toEqual([
      "Plan meals",
    ]);
  });
});
