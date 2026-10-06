import { suspendLocalWrites } from "@/services/mmkv";
import { clearSiddurPersonalData, saveBookmark } from "../cache";
const mockRun = jest.fn();
const mockExec = jest.fn<Promise<void>, [string]>();
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: async () => ({
    runAsync: (...args: unknown[]) => mockRun(...args),
    execAsync: (sql: string) => mockExec(sql),
  }),
}));

test("local reset waits for an in-flight SQLite write and prevents queued writes from restoring private rows", async () => {
  let release!: () => void;
  const records = new Set<string>();
  mockRun.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        release = () => {
          records.add("private");
          resolve();
        };
      }),
  );
  mockExec.mockImplementation(async (sql: string) => {
    if (sql.includes("DELETE FROM bookmarks")) records.clear();
  });
  suspendLocalWrites(false);
  try {
    const bookmark = {
      id: "private",
      siddurId: "test",
      sectionRef: "test",
      segmentRef: "test.1",
      language: "en" as const,
      createdAt: Date.now(),
    };
    const first = saveBookmark(bookmark);
    await new Promise((resolve) => setImmediate(resolve));
    const queued = saveBookmark({ ...bookmark, id: "queued" });
    suspendLocalWrites(true);
    const reset = clearSiddurPersonalData();
    await new Promise((resolve) => setImmediate(resolve));
    expect(
      mockExec.mock.calls.some(([sql]) =>
        sql.includes("DELETE FROM bookmarks"),
      ),
    ).toBe(false);
    release();
    await Promise.all([first, queued, reset]);
    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(records.size).toBe(0);
    expect(
      mockExec.mock.calls.some(([sql]) =>
        sql.includes("DELETE FROM bookmarks"),
      ),
    ).toBe(true);
  } finally {
    suspendLocalWrites(false);
  }
});
