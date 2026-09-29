import {
  cacheBook,
  cacheSection,
  recordDownloadProgress,
} from "./cache";
import { leafNodes, sefariaProvider } from "./sefaria";
import { createSectionBuffer } from "./sectionBuffer";
import type { SiddurDefinition, SiddurNode } from "./model";
export async function loadBook(
  id: string,
): Promise<{ book: SiddurDefinition; nodes: SiddurNode[] }> {
  const book = (await sefariaProvider.getCatalog()).find((b) => b.id === id);
  if (!book || (!book.availability.he && !book.availability.en))
    throw new Error("No sections from this book meet the current catalog’s import checks.");
  const nodes = await sefariaProvider.getStructure(id);
  await cacheBook(book, nodes);
  return { book, nodes };
}
const sectionBuffer = createSectionBuffer((id, ref) =>
  sefariaProvider.getSection(id, ref),
);
export const loadSection = sectionBuffer.load;
export const preloadSections = sectionBuffer.preload;
export async function downloadBook(
  id: string,
  onProgress?: (complete: number, total: number) => void,
): Promise<void> {
  const { nodes } = await loadBook(id);
  const leaves = leafNodes(nodes);
  let complete = 0;
  for (const leaf of leaves) {
    try {
      await cacheSection(id, leaf.ref, await loadSection(id, leaf.ref));
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
