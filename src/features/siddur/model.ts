export type ReaderLanguage = "he" | "en";
export type Nusach =
  | "ASHKENAZ"
  | "SEFARD"
  | "ARI_CHABAD"
  | "EDOT_HAMIZRACH"
  | "SPANISH_PORTUGUESE"
  | "BALADI"
  | "SHAMI"
  | "ITALKIM"
  | "ROMANIOTE"
  | "KARAITE";
export type Denomination =
  | "ORTHODOX"
  | "MODERN_ORTHODOX"
  | "CONSERVATIVE"
  | "REFORM"
  | "RECONSTRUCTIONIST"
  | "RENEWAL"
  | "HUMANISTIC";
export type Scope = "COMPLETE" | "WEEKDAY" | "SHABBAT_FESTIVAL" | "MACHZOR";
export type Presentation = "STANDARD" | "INTERLINEAR" | "TRANSLITERATED";
export type PrayerProfile = "general" | "masculine" | "feminine";
export type SiddurVersion = {
  language: ReaderLanguage;
  versionTitle: string;
  license: string;
  versionSource?: string | undefined;
};
export type SiddurDefinition = {
  id: string;
  sefariaIndex: string;
  displayName: string;
  category: "siddur" | "machzor";
  rite: Nusach;
  scope: Scope;
  presentation: Presentation;
  occasion?: string | undefined;
  denomination?: Denomination | undefined;
  availability: Record<ReaderLanguage, boolean>;
  versions: Partial<Record<ReaderLanguage, SiddurVersion | undefined>>;
  fallbackEnglish?: SiddurVersion | undefined;
};
export type SiddurNode = {
  id: string;
  ref: string;
  titleEn: string;
  titleHe?: string | undefined;
  depth: number;
  children?: SiddurNode[] | undefined;
};
export type SiddurSegment = {
  id: string;
  ref: string;
  sectionId: string;
  order: number;
  he?: string | undefined;
  en?: string | undefined;
  heVersion?: string | undefined;
  enVersion?: string | undefined;
};
export type TextAnnotation = {
  id: string;
  siddurId: string;
  versionKey: string;
  language: ReaderLanguage;
  startSegmentId: string;
  startOffset: number;
  endSegmentId: string;
  endOffset: number;
  selectedText: string;
  type: "highlight" | "note";
  note?: string | undefined;
  createdAt: number;
  updatedAt: number;
};
export type ReaderPosition = {
  siddurId: string;
  language: ReaderLanguage;
  sectionRef: string;
  segmentRef?: string | undefined;
  fontScale: number;
  profile: PrayerProfile;
};
export type Bookmark = {
  id: string;
  siddurId: string;
  sectionRef: string;
  segmentRef: string;
  language: ReaderLanguage;
  createdAt: number;
};
export interface SiddurProvider {
  getCatalog(): Promise<SiddurDefinition[]>;
  getStructure(siddurId: string): Promise<SiddurNode[]>;
  getSection(siddurId: string, ref: string): Promise<SiddurSegment[]>;
  getVersions(siddurId: string): Promise<SiddurVersion[]>;
}
// OpenSiddurProvider can implement this interface when a documented endpoint and license policy are available.
