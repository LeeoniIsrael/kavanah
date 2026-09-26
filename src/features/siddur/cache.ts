import * as SQLite from "expo-sqlite";
import { normalizeHebrewSearch } from "./sefaria";
import type {
  Bookmark,
  ReaderPosition,
  SiddurDefinition,
  SiddurNode,
  SiddurSegment,
  TextAnnotation,
} from "./model";
let database: Promise<SQLite.SQLiteDatabase> | undefined;
async function db() {
  database ??= (async () => {
    const connection = await SQLite.openDatabaseAsync("siddur-v1.db");
    await connection.execAsync(`PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS siddur_books(id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS siddur_sections(ref TEXT PRIMARY KEY, book_id TEXT NOT NULL, data TEXT NOT NULL, updated_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS siddur_segments(ref TEXT PRIMARY KEY, section_ref TEXT NOT NULL, book_id TEXT NOT NULL, he TEXT, en TEXT, data TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS segments_section ON siddur_segments(section_ref);
      CREATE TABLE IF NOT EXISTS siddur_section_cache(ref TEXT PRIMARY KEY, book_id TEXT NOT NULL, updated_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS siddur_versions(book_id TEXT NOT NULL, language TEXT NOT NULL, version_title TEXT NOT NULL, license TEXT NOT NULL, source TEXT, PRIMARY KEY(book_id,language,version_title));
      CREATE TABLE IF NOT EXISTS siddur_downloads(book_id TEXT PRIMARY KEY, completed INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS reader_positions(book_id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS bookmarks(id TEXT PRIMARY KEY, book_id TEXT NOT NULL, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS annotations(id TEXT PRIMARY KEY, book_id TEXT NOT NULL, section_ref TEXT NOT NULL, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS reader_preferences(key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
    return connection;
  })();
  return database;
}
export async function cacheBook(book: SiddurDefinition, nodes: SiddurNode[]) {
  const d = await db();
  await d.runAsync(
    "INSERT OR REPLACE INTO siddur_books VALUES(?,?,?)",
    book.id,
    JSON.stringify(book),
    Date.now(),
  );
  for (const v of Object.values(book.versions))
    if (v)
      await d.runAsync(
        "INSERT OR REPLACE INTO siddur_versions VALUES(?,?,?,?,?)",
        book.id,
        v.language,
        v.versionTitle,
        v.license,
        v.versionSource ?? null,
      );
  for (const n of nodes)
    await d.runAsync(
      "INSERT OR REPLACE INTO siddur_sections VALUES(?,?,?,?)",
      n.ref,
      book.id,
      JSON.stringify(n),
      Date.now(),
    );
}
export async function cachedBook(
  id: string,
): Promise<{ book: SiddurDefinition; nodes: SiddurNode[] } | null> {
  const d = await db();
  const row = await d.getFirstAsync<{ data: string }>(
    "SELECT data FROM siddur_books WHERE id=?",
    id,
  );
  if (!row) return null;
  const nodes = await d.getAllAsync<{ data: string }>(
    "SELECT data FROM siddur_sections WHERE book_id=? ORDER BY rowid",
    id,
  );
  return {
    book: JSON.parse(row.data),
    nodes: nodes.map((n) => JSON.parse(n.data)),
  };
}
export async function cacheSection(
  bookId: string,
  ref: string,
  segments: SiddurSegment[],
) {
  const d = await db();
  await d.withTransactionAsync(async () => {
    await d.runAsync("DELETE FROM siddur_segments WHERE section_ref=?", ref);
    for (const s of segments)
      await d.runAsync(
        "INSERT INTO siddur_segments VALUES(?,?,?,?,?,?)",
        s.ref,
        ref,
        bookId,
        s.he ?? null,
        s.en ?? null,
        JSON.stringify(s),
      );
    await d.runAsync(
      "INSERT OR REPLACE INTO siddur_section_cache VALUES(?,?,?)",
      ref,
      bookId,
      Date.now(),
    );
  });
}
export async function cachedSection(
  ref: string,
): Promise<SiddurSegment[] | null> {
  const rows = await (
    await db()
  ).getAllAsync<{ data: string }>(
    "SELECT data FROM siddur_segments WHERE section_ref=? ORDER BY rowid",
    ref,
  );
  if (rows.length) return rows.map((r) => JSON.parse(r.data));
  const marker = await (
    await db()
  ).getFirstAsync("SELECT ref FROM siddur_section_cache WHERE ref=?", ref);
  return marker ? [] : null;
}
export async function savePosition(position: ReaderPosition) {
  await (
    await db()
  ).runAsync(
    "INSERT OR REPLACE INTO reader_positions VALUES(?,?)",
    position.siddurId,
    JSON.stringify(position),
  );
  await (
    await db()
  ).runAsync(
    "INSERT OR REPLACE INTO reader_preferences VALUES(?,?)",
    "selected_book",
    position.siddurId,
  );
}
export async function loadPosition(
  bookId: string,
): Promise<ReaderPosition | null> {
  const r = await (
    await db()
  ).getFirstAsync<{ data: string }>(
    "SELECT data FROM reader_positions WHERE book_id=?",
    bookId,
  );
  return r ? JSON.parse(r.data) : null;
}
export async function selectedBook(): Promise<string | null> {
  const r = await (
    await db()
  ).getFirstAsync<{ value: string }>(
    "SELECT value FROM reader_preferences WHERE key=?",
    "selected_book",
  );
  return r?.value ?? null;
}
export async function saveBookmark(bookmark: Bookmark) {
  await (
    await db()
  ).runAsync(
    "INSERT OR REPLACE INTO bookmarks VALUES(?,?,?)",
    bookmark.id,
    bookmark.siddurId,
    JSON.stringify(bookmark),
  );
}
export async function removeBookmark(id: string) {
  await (await db()).runAsync("DELETE FROM bookmarks WHERE id=?", id);
}
export async function loadBookmarks(bookId: string): Promise<Bookmark[]> {
  const rows = await (
    await db()
  ).getAllAsync<{ data: string }>(
    "SELECT data FROM bookmarks WHERE book_id=? ORDER BY rowid DESC",
    bookId,
  );
  return rows.map((r) => JSON.parse(r.data));
}
export async function saveAnnotation(a: TextAnnotation) {
  await (
    await db()
  ).runAsync(
    "INSERT OR REPLACE INTO annotations VALUES(?,?,?,?)",
    a.id,
    a.siddurId,
    a.startSegmentId.replace(/\.\d+$/, ""),
    JSON.stringify(a),
  );
}
export async function loadAnnotations(
  bookId: string,
  sectionRef: string,
): Promise<TextAnnotation[]> {
  const rows = await (
    await db()
  ).getAllAsync<{ data: string }>(
    "SELECT data FROM annotations WHERE book_id=? AND section_ref=?",
    bookId,
    sectionRef,
  );
  return rows.map((r) => JSON.parse(r.data));
}
export async function searchCached(
  bookId: string,
  query: string,
): Promise<SiddurSegment[]> {
  const rows = await (
    await db()
  ).getAllAsync<{ data: string }>(
    "SELECT data FROM siddur_segments WHERE book_id=? ORDER BY rowid",
    bookId,
  );
  const needle = normalizeHebrewSearch(query);
  return rows
    .map((r) => JSON.parse(r.data) as SiddurSegment)
    .filter((s) =>
      normalizeHebrewSearch(`${s.he ?? ""} ${s.en ?? ""}`).includes(needle),
    )
    .slice(0, 50);
}
export async function downloadProgress(bookId: string) {
  return (await db()).getFirstAsync<{ completed: number; total: number }>(
    "SELECT completed,total FROM siddur_downloads WHERE book_id=?",
    bookId,
  );
}
export async function recordDownloadProgress(
  bookId: string,
  completed: number,
  total: number,
) {
  await (
    await db()
  ).runAsync(
    "INSERT OR REPLACE INTO siddur_downloads VALUES(?,?,?,?)",
    bookId,
    completed,
    total,
    Date.now(),
  );
}
