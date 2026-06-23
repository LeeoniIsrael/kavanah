import { Bell, MapPin, RefreshCw } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, View } from "react-native";

import { Screen } from "@/components/Screen";
import { Body, Label, Title } from "@/components/Text";
import { ZmanRow } from "@/components/ZmanRow";
import { useZmanimStore } from "@/store/zmanimStore";

export function ZmanimScreen(): React.JSX.Element {
  const { location, zmanim, isLoading, refresh } = useZmanimStore();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Screen>
      <View className="gap-2">
        <Label>Local calendar</Label>
        <Title>Zmanim</Title>
        <Body>Precise daily times with local notification scheduling.</Body>
      </View>

      <View className="flex-row items-center justify-between rounded-lg bg-white p-4">
        <View className="flex-row items-center gap-3">
          <MapPin size={18} color="#111827" />
          <Body className="font-semibold text-ink">{location?.label ?? "Finding location"}</Body>
        </View>
        <Pressable accessibilityRole="button" onPress={() => void refresh()} disabled={isLoading} className="h-11 w-11 items-center justify-center rounded-full bg-mist">
          <RefreshCw size={18} color={isLoading ? "#8A8F98" : "#111827"} />
        </Pressable>
      </View>

      <View className="rounded-lg bg-white px-4">
        {zmanim.map((zman) => (
          <ZmanRow key={zman.key} zman={zman} />
        ))}
      </View>

      <View className="flex-row items-center gap-3 rounded-lg border border-ink/10 p-4">
        <Bell size={18} color="#B9785F" />
        <Body className="flex-1 text-sm">Kavanah schedules upcoming zmanim, candle lighting, Havdalah, and tefillin reminders locally on device.</Body>
      </View>
    </Screen>
  );
}
