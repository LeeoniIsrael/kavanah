import { BrandWordmark } from "@/components/BrandMark";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Bell, MapPin, RefreshCw } from "lucide-react-native";
import { useEffect } from "react";
import { View } from "react-native";

import { Screen } from "@/components/Screen";
import { ParametricField } from "@/components/ParametricField";
import { Button } from "@/components/ui/button";
import { LoadingOrbit, StatusPulse } from "@/components/ui/motion-feedback";
import { ZmanRow } from "@/components/ZmanRow";
import { colors } from "@/design/theme";
import { useZmanimStore } from "@/store/zmanimStore";

export function ZmanimScreen(): React.JSX.Element {
  const { location, zmanim, upcomingZmanim, isLoading, error, refresh } =
    useZmanimStore();
  const nextZman = upcomingZmanim[0];

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Screen>
      <BrandWordmark width={128} />
      <View className="flex-row items-start justify-between gap-4">
        <View>
          <Text variant="caption">Local time</Text>
          <Text variant="display">Zmanim</Text>
        </View>
        <Button
          variant="ghost"
          size="content"
          accessibilityLabel="Refresh local prayer times"
          accessibilityRole="button"
          onPress={() => void refresh()}
          disabled={isLoading}
          className="w-11 h-11 rounded-md items-center justify-center bg-card border border-hairline"
        >
          <LoadingOrbit active={isLoading}>
            <RefreshCw
              size={19}
              color={isLoading ? colors.inkMuted : colors.ink}
            />
          </LoadingOrbit>
        </Button>
      </View>

      <Card className="relative overflow-hidden rounded-lg bg-primary p-6 gap-3 border-[0px]">
        <ParametricField />
        <View className="flex-row items-center gap-2">
          <StatusPulse active={Boolean(nextZman)}>
            <View className="w-2 h-2 rounded-full bg-white" />
          </StatusPulse>
          <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-[rgba(255,255,255,0.68)] font-label">
            Next
          </Text>
        </View>
        <Text variant="section" className="text-white">
          {nextZman?.title ?? "Calculating times"}
        </Text>
        <Text className="text-[56px] leading-[58px] font-normal tracking-[-2px] text-white font-body">
          {nextZman ? formatTime(nextZman.time) : "--:--"}
        </Text>
        <Text variant="body" className="text-[rgba(255,255,255,0.68)]">
          {nextZman
            ? `${formatDay(nextZman.time)} · ${location?.label ?? "local time"}`
            : (error ?? "Set location to calculate precise local zmanim.")}
        </Text>
      </Card>

      <View className="min-h-[58px] border-t border-b border-hairline px-1 flex-row items-center gap-3">
        <MapPin size={18} color={colors.blue} />
        <Text className="text-[16px] leading-[22px] font-normal tracking-normal flex-1 text-foreground font-body">
          {error ?? location?.label ?? "Location unavailable"}
        </Text>
        <Button
          variant="secondary"
          size="content"
          accessibilityRole="button"
          onPress={() => void refresh()}
          disabled={isLoading}
          className="min-h-11 rounded-md bg-muted px-3 items-center justify-center"
        >
          <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-primary font-label">
            {isLoading ? "Finding" : "Update"}
          </Text>
        </Button>
      </View>

      <Card className="p-0 gap-0 overflow-hidden rounded-lg bg-card">
        {zmanim.length > 0 ? (
          <>
            <Text variant="caption" className="px-1 pt-3 pb-1">
              Today
            </Text>
            {zmanim.map((zman) => (
              <ZmanRow key={zman.key} zman={zman} />
            ))}
          </>
        ) : (
          <View className="gap-2 p-6">
            <Text variant="section">Waiting for local times</Text>
            <Text variant="body">
              {error ??
                "Use your location once and Kavanah will calculate today’s zmanim on device."}
            </Text>
          </View>
        )}
      </Card>

      <View className="min-h-[58px] border-l-[2px] border-l-gold px-3 flex-row items-center gap-3">
        <Bell size={18} color={colors.blue} />
        <Text variant="body" className="flex-1 text-[14px] leading-[20px]">
          Reminders stay on this device. Shabbat candle lighting appears on
          Friday; Havdalah appears on Saturday.
        </Text>
      </View>
    </Screen>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDay(date: Date): string {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString([], { weekday: "long" });
}
