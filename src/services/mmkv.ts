type SyncKeyValueStorage = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
};

class MemoryStorage implements SyncKeyValueStorage {
  private readonly values = new Map<string, string>();

  getString(key: string): string | undefined {
    return this.values.get(key);
  }

  set(key: string, value: string): void {
    this.values.set(key, value);
  }
}

export const userStorage = createStorage("kavanah.user");
export const cacheStorage = createStorage("kavanah.cache");

export function readJson<T>(storage: SyncKeyValueStorage, key: string, guard: (value: unknown) => value is T): T | null {
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

export function writeJson(storage: SyncKeyValueStorage, key: string, value: unknown): void {
  storage.set(key, JSON.stringify(value));
}

function createStorage(id: string): SyncKeyValueStorage {
  try {
    // MMKV is unavailable in Expo Go, so this must stay a guarded runtime load.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MMKV } = require("react-native-mmkv") as { MMKV: new (config: { id: string }) => SyncKeyValueStorage };
    return new MMKV({ id });
  } catch {
    return new MemoryStorage();
  }
}
