import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useThemeColors } from "@/design/appearance";
import { Bell, MapPin } from "@/components/ui/icons";
import { useEffect } from "react";
import { View } from "react-native";

import {
  ZmanimHeroSkeleton,
  ZmanimListSkeleton,
} from "@/components/LoadingSkeletons";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui/button";
import { GooeyInfoPopover } from "@/components/ui/gooey-popover";
import { StatusPulse } from "@/components/ui/motion-feedback";
import { ZmanRow } from "@/components/ZmanRow";
import { useZmanimStore } from "@/store/zmanimStore";

export function ZmanimScreen(): React.JSX.Element {
  const colors = useThemeColors();

  const { location, zmanim, upcomingZmanim, isLoading, error, refresh } =
    useZmanimStore();
  const nextZman = upcomingZmanim[0];
  const showInitialLoading = isLoading && zmanim.length === 0 && !error;

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Screen largeTitle="Zmanim" subtitle="Local prayer times">
      <Card className="relative overflow-hidden rounded-lg bg-blueSoft p-6 gap-3 border-[0px]">
        {showInitialLoading ? (
          <ZmanimHeroSkeleton />
        ) : (
          <>
            <View className="flex-row items-center gap-2">
              <StatusPulse active={Boolean(nextZman)}>
                <View className="w-2 h-2 rounded-full bg-white" />
              </StatusPulse>
              <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-inkMuted font-label">
                Next
              </Text>
            </View>
            <Text variant="section" className="text-foreground">
              {nextZman?.title ?? "Calculating times"}
            </Text>
            <Text className="text-[56px] leading-[58px] font-normal tracking-[-2px] text-foreground font-body">
              {nextZman ? formatTime(nextZman.time) : "--:--"}
            </Text>
            <Text variant="body" className="text-inkMuted">
              {nextZman
                ? `${formatDay(nextZman.time)} · ${location?.label ?? "local time"}`
                : (error ?? "Set location to calculate precise local zmanim.")}
            </Text>
          </>
        )}
      </Card>

      <View className="z-20 min-h-[64px] rounded-lg bg-card px-4 py-3 flex-row items-center gap-3">
        <GooeyInfoPopover
          accessibilityLabel="How Kavanah uses your location"
          title="Calculated here"
          body="Your coordinates are used on this device to calculate today’s prayer times. They are not sent to the prayer assistant."
          side="bottom"
          align="start"
          triggerStyle={{
            alignItems: "center",
            backgroundColor: colors.mineral,
            borderRadius: 22,
            height: 44,
            justifyContent: "center",
            width: 44,
          }}
          trigger={<MapPin size={20} color={colors.blue} />}
        />
        <Text className="text-[16px] leading-[22px] font-normal tracking-normal flex-1 text-foreground font-body">
          {error ?? location?.label ?? "Location unavailable"}
        </Text>
        <Button
          variant="secondary"
          size="content"
          accessibilityRole="button"
          onPress={() => void refresh()}
          isLoading={isLoading}
          loadingLabel="Finding"
          className="min-h-11 rounded-md bg-muted px-3 items-center justify-center"
        >
          <Text className="text-[12px] leading-[16px] font-medium tracking-normal text-primary font-label">
            Update
          </Text>
        </Button>
      </View>

      <Card className="p-0 gap-0 overflow-hidden rounded-lg bg-card">
        {showInitialLoading ? (
          <ZmanimListSkeleton />
        ) : zmanim.length > 0 ? (
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
        <Bell size={20} color={colors.blue} />
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
