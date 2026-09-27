import { candidateBooks } from "./registry";
import { corePrayers } from "@/data/corePrayers";
import type {
  ReaderLanguage,
  SiddurDefinition,
  SiddurNode,
  SiddurProvider,
  SiddurSegment,
  SiddurVersion,
} from "./model";
type ApiNode = {
  key?: string;
  depth?: number;
  titles?: { lang: string; text: string; primary?: boolean }[];
  nodes?: ApiNode[];
};
const title = (node: ApiNode, lang: string) =>
  node.titles?.find((t) => t.lang === lang && t.primary)?.text ??
  node.titles?.find((t) => t.lang === lang)?.text;
export function normalizeSchema(index: string, root: ApiNode): SiddurNode[] {
  const visit = (node: ApiNode, path: string[], depth: number): SiddurNode => {
    const en = title(node, "en") ?? node.key ?? "";
    const parts = depth === 0 ? [index] : [...path, en];
    const ref = parts.join(", ");
    return {
      id: ref,
      ref,
      titleEn: en,
      titleHe: title(node, "he"),
      depth,
      children: node.nodes?.map((child) => visit(child, parts, depth + 1)),
    };
  };
  return root.nodes?.map((child) => visit(child, [index], 1)) ?? [];
}
export function leafNodes(nodes: SiddurNode[]): SiddurNode[] {
  return nodes.flatMap((node) =>
    node.children?.length ? leafNodes(node.children) : [node],
  );
}
export function normalizeHebrewSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\u05be/g, " ")
    .replace(/[\u0591-\u05c7\u0300-\u036f]/g, "")
    .replace(/[\u05be\u05f3\u05f4'".,:;!?\-]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
export function mapSegments(
  ref: string,
  he: string[],
  en: string[],
  heVersion?: string,
  enVersion?: string,
): SiddurSegment[] {
  return Array.from({ length: Math.max(he.length, en.length) }, (_, i) => ({
    id: `${ref}.${i + 1}`,
    ref: `${ref}.${i + 1}`,
    sectionId: ref,
    order: i,
    he: he[i] || undefined,
    en: en[i] || undefined,
    heVersion: he[i] ? heVersion : undefined,
    enVersion: en[i] ? enVersion : undefined,
  }));
}
// The reader shares the same immutable offline catalog as search.
export class SefariaSiddurProvider implements SiddurProvider {
  async getVersions(id: string): Promise<SiddurVersion[]> {
    const all = corePrayers.filter(p => p.sourceMetadata?.work === id).flatMap(p => [p.sourceMetadata!.sourceVersion, ...p.sourceMetadata!.translationVersions]);
    return [...new Map(all.filter(v => v && (v.language === "he" || v.language === "en")).map(v => [`${v!.language}:${v!.versionTitle}`, {...v!, language: v!.language as ReaderLanguage}])).values()];
  }
  async getCatalog(): Promise<SiddurDefinition[]> {
    return Promise.all(candidateBooks.filter(book => corePrayers.some(p => p.sourceMetadata?.work === book.id)).map(async book => {
      const versions = await this.getVersions(book.id);
      return {...book, displayName: `${book.displayName} · selected sections`, availability: {he:true,en:true}, versions: {he: versions.find(v => v.language === "he"), en: versions.find(v => v.language === "en")}};
    }));
  }
  async getStructure(id: string): Promise<SiddurNode[]> {
    const roots: SiddurNode[] = [];
    for (const prayer of corePrayers.filter(p => p.sourceMetadata?.work === id)) {
      const path = prayer.sourceMetadata!.path.length ? prayer.sourceMetadata!.path : [prayer.title];
      let siblings = roots;
      path.forEach((title, index) => {
        const leaf = index === path.length - 1;
        const ref = leaf ? prayer.sefariaRef : [id, ...path.slice(0,index+1)].join(", ");
        let node = siblings.find(n => n.ref === ref);
        if (!node) { node = {id: ref, ref, titleEn: title, depth:index+1, ...(leaf ? {titleHe: prayer.sourceMetadata!.hebrewTitle} : {children: []})}; siblings.push(node); }
        if (!leaf) siblings = node.children!;
      });
    }
    return roots;
  }
  async getSection(id: string, ref: string): Promise<SiddurSegment[]> {
    const prayer = corePrayers.find(p => p.sourceMetadata?.work === id && p.sefariaRef === ref);
    if (!prayer) throw new Error("This section is not included in the current research catalog.");
    return prayer.tokens.map((token, i) => ({
      id: token.id, ref: `${ref}.${i+1}`, sectionId: ref, order:i,
      he: token.hebrew, en: token.translation, transliteration: token.transliteration,
      ...(token.kind ? {kind: token.kind} : {}),
      heVersion: `${prayer.sourceMetadata!.sourceVersion!.versionTitle} · ${prayer.sourceMetadata!.sourceVersion!.license}`,
      enVersion: prayer.sourceMetadata!.translationVersions.map(v => `${v.versionTitle} · ${v.license}`).join("; ")
    }));
  }
}
export const sefariaProvider = new SefariaSiddurProvider();
