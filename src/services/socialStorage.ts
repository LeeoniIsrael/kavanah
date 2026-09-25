import { File, Paths } from "expo-file-system";
import { readJson, userStorage, writeJson } from "@/services/mmkv";

// Expo Go cannot load MMKV. Use an app-scoped document so Circle choices and
// activity survive relaunch there as well as in the native app.
export function readSocialData<T>(
  key: string,
  guard: (value: unknown) => value is T,
): T | null {
  try {
    const file = new File(Paths.document, `${key}.json`);
    if (file.exists) {
      const value: unknown = JSON.parse(file.textSync());
      if (guard(value)) return value;
    }
  } catch {
    /* Preserve the MMKV migration/fallback below. */
  }
  return readJson(userStorage, key, guard);
}
export function writeSocialData(key: string, value: unknown): void {
  // Mirror existing native storage for compatibility with older installs.
  writeJson(userStorage, key, value);
  const file = new File(Paths.document, `${key}.json`);
  if (!file.exists) file.create({ intermediates: true });
  file.write(JSON.stringify(value));
}
