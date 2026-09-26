import {
  cacheBook,
  cachedBook,
  cacheSection,
  cachedSection,
  recordDownloadProgress,
} from "./cache";
import { leafNodes, sefariaProvider } from "./sefaria";
import type { SiddurDefinition, SiddurNode, SiddurSegment } from "./model";
export async function loadBook(
  id: string,
): Promise<{ book: SiddurDefinition; nodes: SiddurNode[] }> {
  const cached = await cachedBook(id);
  if (cached) return cached;
  const book = (await sefariaProvider.getCatalog()).find((b) => b.id === id);
  if (!book || (!book.availability.he && !book.availability.en))
    throw new Error("No approved text edition is available for this book.");
  const nodes = await sefariaProvider.getStructure(id);
  await cacheBook(book, nodes);
  return { book, nodes };
}
export async function loadSection(
  id: string,
  ref: string,
): Promise<SiddurSegment[]> {
  const cached = await cachedSection(ref);
  if (cached) return cached;
  const segments = await sefariaProvider.getSection(id, ref);
  await cacheSection(id, ref, segments);
  return segments;
}
export async function downloadBook(
  id: string,
  onProgress?: (complete: number, total: number) => void,
): Promise<void> {
  const { nodes } = await loadBook(id);
  const leaves = leafNodes(nodes);
  let complete = 0;
  for (const leaf of leaves) {
    try {
      await loadSection(id, leaf.ref);
      complete++;
    } catch {
      /* Retried on the next download. */
    }
    if (complete % 8 === 0 || leaf === leaves[leaves.length - 1]) {
      await recordDownloadProgress(id, complete, leaves.length);
      onProgress?.(complete, leaves.length);
    }
  }
  if (complete < leaves.length) throw new Error("Download incomplete");
}
