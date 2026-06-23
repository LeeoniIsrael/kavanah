export type GeoPoint = {
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  label: string;
};

export type ZmanKey =
  | "alotHashachar"
  | "sunrise"
  | "latestShema"
  | "latestTefilah"
  | "minchaGedolah"
  | "minchaKetana"
  | "sunset"
  | "candleLighting"
  | "havdalah";

export type Zman = {
  key: ZmanKey;
  title: string;
  time: Date;
  notificationLeadMinutes: number;
};
