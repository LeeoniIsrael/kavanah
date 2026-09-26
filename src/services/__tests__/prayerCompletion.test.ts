import {
  getPrayerCompletionDeadline,
  isPrayerCompletionOnTime,
} from "@/services/prayerCompletion";
import type { Zman, ZmanKey } from "@/types/zmanim";

describe("prayer completion timing", () => {
  const deadline = "2026-09-25T14:00:00.000Z";

  it("allows completion at or before the accepted time", () => {
    expect(
      isPrayerCompletionOnTime(
        deadline,
        new Date("2026-09-25T14:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("rejects completion after the accepted time", () => {
    expect(
      isPrayerCompletionOnTime(
        deadline,
        new Date("2026-09-25T14:00:00.001Z"),
      ),
    ).toBe(false);
  });

  it("keeps untimed prayer completions available", () => {
    expect(isPrayerCompletionOnTime(undefined, new Date())).toBe(true);
  });

  it("uses the end of a prayer window rather than its start", () => {
    const schedule = [
      zman("sunrise", "2026-09-25T10:45:00.000Z"),
      zman("latestTefilah", "2026-09-25T14:45:00.000Z"),
    ];

    expect(getPrayerCompletionDeadline(schedule[0], schedule)).toEqual(
      schedule[1].time,
    );
  });

  it("uses the next dawn as the end of the evening prayer window", () => {
    const schedule = [
      zman("sunset", "2026-09-25T22:45:00.000Z"),
      zman("alotHashachar", "2026-09-26T09:15:00.000Z"),
    ];

    expect(getPrayerCompletionDeadline(schedule[0], schedule)).toEqual(
      schedule[1].time,
    );
  });
});

function zman(key: ZmanKey, time: string): Zman {
  return {
    key,
    title: key,
    time: new Date(time),
    notificationLeadMinutes: 0,
    method: "test",
  };
}
