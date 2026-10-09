import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

type SyncKeyValueStorage = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
  clearAll: () => void;
  getAllKeys: () => string[];
};

class MemoryStorage implements SyncKeyValueStorage {
  private readonly values = new Map<string, string>();

  getString(key: string): string | undefined {
    return this.values.get(key);
  }

  delete(key: string): void {
    this.values.delete(key);
  }
  clearAll(): void {
    this.values.clear();
  }
  getAllKeys(): string[] {
    return [...this.values.keys()];
  }

  set(key: string, value: string): void {
    if (!writesSuspended) this.values.set(key, value);
  }
}

let writesSuspended = false;
export function suspendLocalWrites(value: boolean): void {
  writesSuspended = value;
}
export function localWritesSuspended(): boolean {
  return writesSuspended;
}

export const usesNativeUserStorage =
  Constants.appOwnership !== "expo" && Platform.OS !== "web";
export const userStorage = createStorage("kavanah.user");
export const cacheStorage = createStorage("kavanah.cache");

export function readJson<T>(
  storage: SyncKeyValueStorage,
  key: string,
  guard: (value: unknown) => value is T,
): T | null {
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

export function writeJson(
  storage: SyncKeyValueStorage,
  key: string,
  value: unknown,
): void {
  storage.set(key, JSON.stringify(value));
}

function createStorage(id: string): SyncKeyValueStorage {
  if (!usesNativeUserStorage) {
    return new MemoryStorage();
  }

  try {
    // MMKV is unavailable in Expo Go, so this must stay a guarded runtime load.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MMKV } = require("react-native-mmkv") as {
      MMKV: new (config: {
        id: string;
        encryptionKey?: string;
      }) => SyncKeyValueStorage;
    };
    if (id !== "kavanah.user") return new MMKV({ id });
    const keyName = "kavanah.mmkv-key.v1";
    let key = SecureStore.getItem(keyName);
    if (!key) {
      // A restored/lost Keychain entry must never cause MMKV to open existing
      // ciphertext with a replacement key and discard unreadable personal data.
      if (
        new File(Paths.document, "mmkv", "kavanah.user.secure-v1").exists ||
        new File(Paths.document, "mmkv", "kavanah.user.secure-v1.crc").exists
      ) {
        throw new Error("The existing personal-storage key is unavailable");
      }
      // MMKV v3 accepts at most 16 bytes. Use 16 cryptographically random ASCII
      // characters (96 bits of entropy), never a password or committed key.
      const alphabet =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      key = Array.from(
        Crypto.getRandomBytes(16),
        (byte) => alphabet[byte & 63],
      ).join("");
      SecureStore.setItem(keyName, key, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }
    // Copy into a new encrypted file before clearing legacy plaintext. A restart
    // during migration can repeat the copy without changing the encryption key.
    const encrypted = new MMKV({
      id: "kavanah.user.secure-v1",
      encryptionKey: key,
    });
    const legacy = new MMKV({ id });
    if (encrypted.getString("storage.migrated.v1") !== "true") {
      for (const name of legacy.getAllKeys()) {
        const value = legacy.getString(name);
        if (value !== undefined) encrypted.set(name, value);
      }
      encrypted.set("storage.migrated.v1", "true");
    }
    legacy.clearAll();
    return {
      getString: (name) => encrypted.getString(name),
      getAllKeys: () => encrypted.getAllKeys(),
      set: (name, value) => {
        if (!writesSuspended) encrypted.set(name, value);
      },
      delete: (name) => encrypted.delete(name),
      clearAll: () => encrypted.clearAll(),
    };
  } catch {
    // A native build must not silently lose persistence or fall back to plaintext.
    throw new Error(
      "Kavanah could not open its local storage. Existing files have been left in place. Unlock your device and restart the app.",
    );
  }
}
