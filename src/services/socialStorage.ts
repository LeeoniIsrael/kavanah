import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import { accountStorageKey, accountStoragePrefix } from "./accountScope";
import {
  readJson,
  userStorage,
  writeJson,
  usesNativeUserStorage,
  localWritesSuspended,
} from "@/services/mmkv";

// Expo Go cannot load MMKV. Use an app-scoped document so Circle choices and
// activity survive relaunch there as well as in the native app.
export function readSocialData<T>(
  key: string,
  guard: (value: unknown) => value is T,
): T | null {
  const scoped = accountStorageKey(key);
  if (!scoped) return null;
  key = scoped;
  if (Platform.OS === "web") {
    try {
      const raw = globalThis.localStorage?.getItem(`kavanah.${key}`);
      if (raw) {
        const value: unknown = JSON.parse(raw);
        if (guard(value)) return value;
      }
    } catch {
      /* Continue to the in-memory fallback. */
    }
    return readJson(userStorage, key, guard);
  }
  if (usesNativeUserStorage) {
    const saved = readJson(userStorage, key, guard);
    if (saved !== null) {
      const legacy = new File(Paths.document, `${key}.json`);
      if (legacy.exists) legacy.delete();
      return saved;
    }
  }
  try {
    const file = new File(Paths.document, `${key}.json`);
    if (file.exists) {
      const value: unknown = JSON.parse(file.textSync());
      if (guard(value)) {
        if (usesNativeUserStorage) {
          writeJson(userStorage, key, value);
          file.delete();
        }
        return value;
      }
    }
  } catch {
    /* Preserve the MMKV migration/fallback below. */
  }
  return readJson(userStorage, key, guard);
}
export function writeSocialData(key: string, value: unknown): void {
  if (localWritesSuspended()) return;
  const scoped = accountStorageKey(key);
  if (!scoped) return;
  key = scoped;
  // Release builds use encrypted MMKV; plaintext files are only an Expo Go fallback.
  writeJson(userStorage, key, value);
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.setItem(`kavanah.${key}`, JSON.stringify(value));
    } catch {
      /* In-memory fallback remains. */
    }
    return;
  }
  if (usesNativeUserStorage) {
    const legacy = new File(Paths.document, `${key}.json`);
    if (legacy.exists) legacy.delete();
    return;
  }
  try {
    const file = new File(Paths.document, `${key}.json`);
    if (!file.exists) file.create({ intermediates: true });
    file.write(JSON.stringify(value));
  } catch {
    /* MMKV remains available in native builds. */
  }
}

export function removeSocialData(key: string): void {
  const scoped = accountStorageKey(key);
  if (!scoped) return;
  key = scoped;
  userStorage.delete(key);
  if (Platform.OS === "web")
    globalThis.localStorage?.removeItem(`kavanah.${key}`);
  else {
    const file = new File(Paths.document, `${key}.json`);
    if (file.exists) file.delete();
  }
}

export function removeAccountLocalData(id: string): void {
  removeSocialData(`circle.profile.${id}`);
  removeSocialData(`circle.outbox.${id}`);
  const prefix = accountStoragePrefix(id);
  for (const key of userStorage.getAllKeys()) if (key.startsWith(prefix)) userStorage.delete(key);
  if (Platform.OS === "web") {
    for (const key of Object.keys(globalThis.localStorage ?? {}))
      if (key.startsWith(`kavanah.${prefix}`)) globalThis.localStorage.removeItem(key);
  } else {
    for (const file of new Directory(Paths.document).list())
      if (file instanceof File && file.name.startsWith(prefix) && file.name.endsWith(".json")) file.delete();
  }
  if (Platform.OS !== "web") {
    for (const suffix of ["", "-pending"]) {
      const file = new File(
        Paths.document,
        `profile-photo-${encodeURIComponent(id)}${suffix}.jpg`,
      );
      if (file.exists) file.delete();
    }
  }
}
