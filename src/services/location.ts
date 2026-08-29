import * as Location from "expo-location";

import type { GeoPoint } from "@/types/zmanim";

export async function requestZmanimLocation(): Promise<GeoPoint> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    throw new Error("Location is off. Enable it to calculate accurate times for where you are.");
  }

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const place = await Location.reverseGeocodeAsync(position.coords).catch(() => []);
  const firstPlace = place[0];
  const label = [firstPlace?.city, firstPlace?.region].filter(Boolean).join(", ") || "Current location";

  const geoPoint: GeoPoint = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    label
  };
  if (typeof position.coords.altitude === "number") {
    geoPoint.altitudeMeters = position.coords.altitude;
  }
  return geoPoint;
}
