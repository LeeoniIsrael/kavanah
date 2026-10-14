import { setAccountScope } from "@/services/accountScope";
import { suspendLocalWrites } from "@/services/mmkv";
import { clearSiddurAccountData, clearSiddurPersonalData, loadBookmarks, saveBookmark, removeBookmark, savePosition, loadPosition, selectedBook, saveAnnotation, loadAnnotations } from "../cache";
import type { DatabaseSync } from "node:sqlite";
let mockDatabase: DatabaseSync;
let mockBeforeWrite: (() => Promise<void>) | undefined;
let mockAfterRead: (() => Promise<void>) | undefined;
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: async () => {
    const sqlite = jest.requireActual<{ DatabaseSync: typeof DatabaseSync }>("node:sqlite");
    mockDatabase = new sqlite.DatabaseSync(":memory:");
    return {
      execAsync: async (sql: string) => { mockDatabase.exec(sql); },
      runAsync: async (sql: string, ...params: (string | number)[]) => { await mockBeforeWrite?.(); return mockDatabase.prepare(sql).run(...params); },
      getFirstAsync: async (sql: string, ...params: (string | number)[]) => { const result = mockDatabase.prepare(sql).get(...params); await mockAfterRead?.(); return result; },
      getAllAsync: async (sql: string, ...params: (string | number)[]) => { const result = mockDatabase.prepare(sql).all(...params); await mockAfterRead?.(); return result; },
    };
  },
}));
const bookmark = { id: "same-id", siddurId: "book", sectionRef: "section", segmentRef: "section.1", language: "en" as const, createdAt: 1 };
beforeEach(async () => {
  mockBeforeWrite = undefined; mockAfterRead = undefined;
  suspendLocalWrites(false); setAccountScope("alice");
  await clearSiddurPersonalData();
});

test("real SQLite queries isolate positions, bookmarks and notes even with colliding IDs", async () => {
  await saveBookmark(bookmark);
  const position = { siddurId: "book", sectionRef: "section", segmentRef: "section.1", language: "en" as const, fontScale: 1, profile: "general" as const };
  await savePosition(position);
  await saveAnnotation({ id: "note", siddurId: "book", versionKey: "v1", language: "en", startSegmentId: "section.1", startOffset: 0, endSegmentId: "section.1", endOffset: 1, selectedText: "private", type: "note", note: "Alice note", createdAt: 1, updatedAt: 1 });
  setAccountScope("bob");
  expect(await loadBookmarks("book")).toEqual([]);
  expect(await loadPosition("book")).toBeNull();
  expect(await selectedBook()).toBeNull();
  expect(await loadAnnotations("book", "section")).toEqual([]);
  await saveBookmark({ ...bookmark, segmentRef: "section.2" });
  setAccountScope("alice");
  expect((await loadBookmarks("book"))[0]?.segmentRef).toBe("section.1");
  expect(await loadPosition("book")).toEqual(position);
  expect((await loadAnnotations("book", "section"))[0]?.note).toBe("Alice note");
  await removeBookmark("same-id");
  await clearSiddurAccountData("alice");
  setAccountScope("bob");
  expect((await loadBookmarks("book"))[0]?.segmentRef).toBe("section.2");
});

test("in-flight writes stay pinned to their owner; queued writes and late reads cannot cross a switch", async () => {
  let release!: () => void;
  mockBeforeWrite = () => new Promise<void>(resolve => { release = resolve; });
  const first = saveBookmark(bookmark);
  await new Promise(resolve => setImmediate(resolve));
  const queued = saveBookmark({ ...bookmark, id: "queued" });
  setAccountScope("bob");
  mockBeforeWrite = undefined; release();
  await Promise.all([first, queued]);
  expect(await loadBookmarks("book")).toEqual([]);
  setAccountScope("alice");
  expect((await loadBookmarks("book")).map(b => b.id)).toEqual(["same-id"]);
  mockAfterRead = () => new Promise<void>(resolve => { release = resolve; });
  const lateRead = loadBookmarks("book");
  await new Promise(resolve => setImmediate(resolve));
  setAccountScope("bob"); mockAfterRead = undefined; release();
  expect(await lateRead).toEqual([]);
});

test("legacy SQL rows are quarantined until explicit all-local-data reset", async () => {
  mockDatabase.exec(`INSERT INTO bookmarks VALUES('legacy','book','{}')`);
  expect(await loadBookmarks("book")).toEqual([]);
  expect(mockDatabase.prepare("SELECT count(*) AS n FROM bookmarks").get()?.n).toBe(1);
  suspendLocalWrites(true); await clearSiddurPersonalData();
  expect(mockDatabase.prepare("SELECT count(*) AS n FROM bookmarks").get()?.n).toBe(0);
  suspendLocalWrites(false);
});
