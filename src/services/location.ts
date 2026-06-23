import * as Location from "expo-location";

import type { GeoPoint } from "@/types/zmanim";

export async function requestZmanimLocation(): Promise<GeoPoint> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    return { latitude: 40.7128, longitude: -74.006, label: "New York" };
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
