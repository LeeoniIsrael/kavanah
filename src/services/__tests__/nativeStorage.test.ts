import type * as Storage from "../mmkv";
const mockFiles = new Map<string, Map<string, string>>();
const mockSecrets = new Map<string, string>();
const mockConfigs: { id: string; encryptionKey?: string }[] = [];
let mockFail = false;
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { appOwnership: "standalone" },
}));
jest.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "device-only",
  getItem: (key: string) => mockSecrets.get(key) ?? null,
  setItem: (key: string, value: string) => mockSecrets.set(key, value),
}));
jest.mock("expo-file-system", () => ({
  Paths: { document: "file:///test/documents" },
  File: class {
    constructor(...parts: string[]) {
      this.name = parts.at(-1)!;
    }
    name: string;
    get exists() {
      return mockFiles.has(this.name);
    }
  },
}));
jest.mock("react-native-mmkv", () => ({
  MMKV: class {
    values: Map<string, string>;
    constructor(config: { id: string; encryptionKey?: string }) {
      if (mockFail) throw new Error("Native storage unavailable");
      mockConfigs.push(config);
      if (!mockFiles.has(config.id)) mockFiles.set(config.id, new Map());
      this.values = mockFiles.get(config.id)!;
    }
    getString(key: string) {
      return this.values.get(key);
    }
    getAllKeys() {
      return [...this.values.keys()];
    }
    set(key: string, value: string) {
      this.values.set(key, value);
    }
    delete(key: string) {
      this.values.delete(key);
    }
    clearAll() {
      this.values.clear();
    }
  },
}));
function load() {
  let result: typeof Storage;
  jest.isolateModules(() => {
    result = jest.requireActual("../mmkv");
  });
  return result!;
}
beforeEach(() => {
  mockFiles.clear();
  mockSecrets.clear();
  mockConfigs.length = 0;
  mockFail = false;
});
test("copies legacy personal values before clearing plaintext and reuses the device-only key", () => {
  mockFiles.set("kavanah.user", new Map([["history", "private history"]]));
  const first = load();
  expect(first.userStorage.getString("history")).toBe("private history");
  expect(mockFiles.get("kavanah.user")?.size).toBe(0);
  const key = mockConfigs.find(
    (config) => config.id === "kavanah.user.secure-v1",
  )?.encryptionKey;
  expect(key).toHaveLength(16);
  expect(mockSecrets.get("kavanah.mmkv-key.v1")).toBe(key);
  expect(load().userStorage.getString("history")).toBe("private history");
  expect(
    mockConfigs
      .filter((config) => config.id === "kavanah.user.secure-v1")
      .every((config) => config.encryptionKey === key),
  ).toBe(true);
});
test("native persistence failures never silently fall back to empty memory or plaintext", () => {
  mockFail = true;
  expect(load).toThrow("could not open its local storage");
});
test("a missing key never replaces the key or opens existing ciphertext", () => {
  const privateValues = new Map([["history", "encrypted history"]]);
  mockFiles.set("kavanah.user.secure-v1", privateValues);
  expect(load).toThrow("Existing files have been left in place");
  expect(mockSecrets.size).toBe(0);
  expect(mockConfigs).toEqual([]);
  expect(privateValues.get("history")).toBe("encrypted history");
});
test("local reset suspends late writes while allowing actual data removal", () => {
  const storage = load();
  storage.userStorage.set("history", "private history");
  storage.suspendLocalWrites(true);
  storage.userStorage.clearAll();
  storage.userStorage.set("history", "late callback");
  expect(storage.userStorage.getString("history")).toBeUndefined();
});
