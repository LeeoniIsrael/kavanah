import Constants, { ExecutionEnvironment } from "expo-constants";
import type { AppearancePreference } from "@/design/appearance";
import { zmanimGuide } from "@/data/zmanimGuide";
import { palettes } from "@/design/theme";
import type { NextPrayerWidgetProps } from "@/widgets/NextPrayerWidget";
import type { Zman, ZmanKey } from "@/types/zmanim";

type WidgetTimelineEntry = { date: Date; props: NextPrayerWidgetProps };
type WidgetHandle = { updateTimeline: (entries: WidgetTimelineEntry[]) => void };

const prayerMoments: Partial<
  Record<ZmanKey, { action: string; query: string; helper: string }>
> = {
  alotHashachar: { action: "Begin", query: "modeh ani", helper: "Modeh Ani" },
  sunrise: { action: "Morning prayer", query: "shacharit", helper: "Shacharit" },
  latestShema: { action: "Say Shema", query: "shema", helper: "Morning Shema deadline" },
  latestTefilah: { action: "Morning prayer", query: "shacharit", helper: "Morning prayer deadline" },
  minchaGedolah: { action: "Afternoon prayer", query: "mincha", helper: "Afternoon prayer" },
  minchaKetana: { action: "Afternoon prayer", query: "mincha", helper: "Preferred window" },
  sunset: { action: "Evening prayer", query: "maariv", helper: "Maariv" },
  candleLighting: { action: "Light candles", query: "candle lighting", helper: "Shabbat" },
  havdalah: { action: "Havdalah", query: "havdalah", helper: "Close Shabbat" },
};

const widgetColors = {
  light: {
    surface: palettes.light.blueSoft,
    ink: palettes.light.ink,
    muted: palettes.light.inkMuted,
    accent: palettes.light.ink,
    onAccent: palettes.light.onAccent,
  },
  dark: {
    surface: palettes.dark.blueSoft,
    ink: palettes.dark.ink,
    muted: palettes.dark.inkMuted,
    accent: palettes.dark.ink,
    onAccent: palettes.dark.onAccent,
  },
};

export function updateNextPrayerWidget(
  upcomingZmanim: Zman[],
  locationLabel: string | undefined,
  appearance: AppearancePreference,
): void {
  // Do not import the native widget module in Expo Go: its missing-module error
  // is also reported to LogBox even when a require is inside try/catch.
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
  try {
    // expo-widgets is available only in a native build. Expo Go safely skips this feature.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- load only after the Expo Go guard
    const widget = require("./NextPrayerWidget").default as WidgetHandle;
    const now = new Date();
    const future = upcomingZmanim
      .filter((zman) => zman.time.getTime() > now.getTime())
      .slice(0, 28);

    if (future.length === 0) {
      widget.updateTimeline([
        {
          date: now,
          props: makeFallbackProps(appearance),
        },
      ]);
      return;
    }

    const entries: WidgetTimelineEntry[] = future.map((zman, index) => {
      const previous = future[index - 1];
      return {
        date: previous?.time ?? now,
        props: makePrayerProps(zman, locationLabel, appearance),
      };
    });
    const last = future.at(-1);
    if (last) {
      entries.push({
        date: last.time,
        props: makeFallbackProps(appearance),
      });
    }
    widget.updateTimeline(entries);
  } catch {
    // The widget target is not included in Expo Go; keep the main app usable there.
  }
}

function makePrayerProps(
  zman: Zman,
  locationLabel: string | undefined,
  appearance: AppearancePreference,
): NextPrayerWidgetProps {
  const moment = prayerMoments[zman.key];
  return {
    momentLabel: "Next prayer",
    title: zmanimGuide[zman.key].title,
    time: formatTime(zman.time),
    timeAt: zman.time.getTime(),
    detail: `${moment?.helper ?? "Next prayer moment"} in ${locationLabel ?? "your location"}.`,
    action: moment?.action ?? "Find a prayer",
    url: prayerURL(moment?.query ?? ""),
    appearance,
    colors: widgetColors,
  };
}

function makeFallbackProps(appearance: AppearancePreference): NextPrayerWidgetProps {
  return {
    momentLabel: "Prayer for today",
    title: "A moment of intention.",
    time: "",
    timeAt: null,
    detail: "Find your words. Begin where you are.",
    action: "Find a prayer",
    url: prayerURL(""),
    appearance,
    colors: widgetColors,
  };
}

function prayerURL(query: string): string {
  return query
    ? `kavanah://prayer?query=${encodeURIComponent(query)}`
    : "kavanah://prayer";
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
