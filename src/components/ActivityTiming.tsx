import { View } from "react-native";
import { Text } from "./ui/text";
import { useInterfaceStyles } from "@/design/layout";

export function formatActivityDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60),
    remainder = seconds % 60;
  if (minutes < 60) return `${minutes}m${remainder ? ` ${remainder}s` : ""}`;
  return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
}

/** Flexible metadata groups share one baseline and wrap without truncation. */
export function ActivityTiming({
  startedAt,
  completedAt,
  durationSeconds,
}: {
  startedAt?: string | null | undefined;
  completedAt?: string | null | undefined;
  durationSeconds?: number | null | undefined;
}) {
  const ui = useInterfaceStyles();
  const time = startedAt || completedAt;
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        columnGap: 16,
        rowGap: 4,
      }}
    >
      <Text style={ui.caption}>
        {time
          ? `${startedAt ? "Started" : "Completed"} ${new Date(time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
          : "Daily check-in"}
      </Text>
      {typeof durationSeconds === "number" &&
      Number.isFinite(durationSeconds) &&
      durationSeconds >= 0 ? (
        <Text
          style={[
            ui.caption,
            { marginLeft: "auto", fontVariant: ["tabular-nums"] },
          ]}
        >
          {formatActivityDuration(durationSeconds)}
        </Text>
      ) : null}
    </View>
  );
}
