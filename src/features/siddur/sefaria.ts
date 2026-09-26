import { allowedLicense, candidateBooks, chooseVersions } from "./registry";
import type {
  ReaderLanguage,
  SiddurDefinition,
  SiddurNode,
  SiddurProvider,
  SiddurSegment,
  SiddurVersion,
} from "./model";
const BASE = "https://www.sefaria.org/api";
type ApiNode = {
  key?: string;
  depth?: number;
  titles?: { lang: string; text: string; primary?: boolean }[];
  nodes?: ApiNode[];
};
type ApiVersion = {
  language?: string;
  versionTitle?: string;
  license?: string;
  versionSource?: string;
  text?: unknown;
};
async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Sefaria temporarily unavailable");
  return response.json() as Promise<T>;
}
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
function cleanText(input: unknown): string {
  return typeof input === "string"
    ? input
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim()
    : "";
}
function textArray(response: { versions?: ApiVersion[] }): string[] {
  const text = response.versions?.[0]?.text;
  return Array.isArray(text) ? text.map(cleanText) : [];
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
export class SefariaSiddurProvider implements SiddurProvider {
  private catalog?: SiddurDefinition[];
  private structures = new Map<string, SiddurNode[]>();
  async getVersions(id: string): Promise<SiddurVersion[]> {
    const raw = await getJson<ApiVersion[]>(
      `/texts/versions/${encodeURIComponent(id)}`,
    );
    return raw
      .filter((v) => v.language === "he" || v.language === "en")
      .map((v) => ({
        language: v.language as ReaderLanguage,
        versionTitle: v.versionTitle ?? "",
        license: v.license ?? "",
        versionSource: v.versionSource,
      }));
  }
  async getCatalog(): Promise<SiddurDefinition[]> {
    if (this.catalog) return this.catalog;
    const results = await Promise.all(
      candidateBooks.map(async (book) => {
        try {
          return {
            ...book,
            ...chooseVersions(await this.getVersions(book.id)),
          };
        } catch {
          return {
            ...book,
            versions: {},
            availability: { he: false, en: false },
          };
        }
      }),
    );
    this.catalog = results;
    return results;
  }
  async getStructure(id: string): Promise<SiddurNode[]> {
    const found = this.structures.get(id);
    if (found) return found;
    const raw = await getJson<{ schema: ApiNode }>(
      `/v2/raw/index/${encodeURIComponent(id)}`,
    );
    const nodes = normalizeSchema(id, raw.schema);
    this.structures.set(id, nodes);
    return nodes;
  }
  async getSection(id: string, ref: string): Promise<SiddurSegment[]> {
    const book = (await this.getCatalog()).find((b) => b.id === id);
    if (!book) throw new Error("Unknown siddur");
    const fetchVersion = async (v?: SiddurVersion): Promise<string[]> => {
      if (!v || !allowedLicense(v.license)) return [];
      const key = `${v.language === "he" ? "hebrew" : "english"}|${v.versionTitle}`;
      const data = await getJson<{ versions?: ApiVersion[] }>(
        `/v3/texts/${encodeURIComponent(ref)}?version=${encodeURIComponent(key)}&fill_in_missing_segments=0`,
      );
      const returned = data.versions?.[0];
      if (
        returned?.versionTitle !== v.versionTitle ||
        !allowedLicense(returned.license)
      )
        return [];
      return textArray(data);
    };
    const [he, en] = await Promise.all([
      fetchVersion(book.versions.he),
      fetchVersion(book.versions.en),
    ]);
    const fallback =
      book.fallbackEnglish && (!en.length || en.some((s) => !s))
        ? await fetchVersion(book.fallbackEnglish)
        : [];
    const english = en.map((s, i) => s || fallback[i] || "");
    for (let i = en.length; i < fallback.length; i++)
      english.push(fallback[i]!);
    return mapSegments(
      ref,
      he,
      english,
      book.versions.he?.versionTitle,
      book.versions.en?.versionTitle,
    ).map((s, i) => ({
      ...s,
      enVersion: en[i]
        ? book.versions.en?.versionTitle
        : fallback[i]
          ? book.fallbackEnglish?.versionTitle
          : undefined,
    }));
  }
}
export const sefariaProvider = new SefariaSiddurProvider();
