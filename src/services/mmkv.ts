import { MMKV } from "react-native-mmkv";

export const userStorage = new MMKV({ id: "kavanah.user" });
export const cacheStorage = new MMKV({ id: "kavanah.cache" });

export function readJson<T>(storage: MMKV, key: string, guard: (value: unknown) => value is T): T | null {
  const raw = storage.getString(key);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return guard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeJson(storage: MMKV, key: string, value: unknown): void {
  storage.set(key, JSON.stringify(value));
}
