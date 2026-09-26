import type { ReaderLanguage, SiddurSegment } from "./model";
export function pageDirection(language: ReaderLanguage, dx: number): number {
  return (dx < 0 ? 1 : -1) * (language === "he" ? -1 : 1);
}
export function rulerTarget(start: number, dx: number, count: number): number {
  return Math.max(0, Math.min(count - 1, start + Math.round(-dx / 12)));
}
export function pageForRef(
  pages: SiddurSegment[][],
  ref: string | undefined,
): number {
  return Math.max(
    0,
    pages.findIndex((page) => page.some((segment) => segment.ref === ref)),
  );
}
