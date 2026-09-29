import type { SiddurSegment } from "./model";

// Source text is bundled offline. Keep prepared sections out of the database
// write path, and share pending work when a reader catches up to the buffer.
export function createSectionBuffer(
  read: (bookId: string, ref: string) => Promise<SiddurSegment[]>,
  capacity = 512,
) {
  const entries = new Map<string, Promise<SiddurSegment[]>>();
  const load = (bookId: string, ref: string) => {
    const key = JSON.stringify([bookId, ref]);
    const existing = entries.get(key);
    if (existing) {
      entries.delete(key);
      entries.set(key, existing);
      return existing;
    }
    const pending = Promise.resolve().then(() => read(bookId, ref));
    entries.set(key, pending);
    if (entries.size > capacity) entries.delete(entries.keys().next().value!);
    void pending.catch(() => {
      if (entries.get(key) === pending) entries.delete(key);
    });
    return pending;
  };
  const preload = (bookId: string, refs: string[], current: number) => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let next = current + 1;
    const end = Math.min(refs.length, next + Math.ceil(refs.length * 0.3));
    const step = async () => {
      if (cancelled || next >= end) return;
      try {
        await load(bookId, refs[next++]!);
      } catch {
        // Speculation must never show an error or prevent foreground retry.
      }
      if (!cancelled) timer = setTimeout(() => { void step(); }, 16);
    };
    if (current >= 0 && current < refs.length) {
      timer = setTimeout(() => { void step(); }, 16);
    }
    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  };
  return { load, preload };
}
