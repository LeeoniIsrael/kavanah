import type { Zman, ZmanKey } from "@/types/zmanim";

const deadlineKeyByMoment: Partial<Record<ZmanKey, ZmanKey>> = {
  sunrise: "latestTefilah",
  latestShema: "latestShema",
  latestTefilah: "latestTefilah",
  minchaGedolah: "sunset",
  minchaKetana: "sunset",
  sunset: "alotHashachar",
  candleLighting: "candleLighting",
};

export function getPrayerCompletionDeadline(
  moment: Zman,
  schedule: Zman[],
): Date | undefined {
  const deadlineKey = deadlineKeyByMoment[moment.key];
  if (!deadlineKey) return undefined;

  if (deadlineKey === moment.key) return moment.time;

  return schedule.find(
    (zman) =>
      zman.key === deadlineKey && zman.time.getTime() > moment.time.getTime(),
  )?.time;
}

export function isPrayerCompletionOnTime(
  deadline: string | undefined,
  completedAt: Date,
): boolean {
  if (!deadline) return true;

  const deadlineTime = Date.parse(deadline);
  return Number.isNaN(deadlineTime) || completedAt.getTime() <= deadlineTime;
}
