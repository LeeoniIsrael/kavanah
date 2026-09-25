import { writeFileSync } from "node:fs";
import index from "../../src/data/generatedLiturgyIndex.json";
import { corePrayers } from "../../src/data/corePrayers";
const q = (s: string) => `'${s.replaceAll("'", "''")}'`;
const catalog = [
  ...corePrayers,
  ...index.entries
    .filter((e) => !corePrayers.some((p) => p.id === e.id))
    .map((e) => ({ id: e.id, title: e.title, category: "source" })),
];
const rows = catalog.map((p) => `(${q(p.id)},${q(p.title)},${q(p.category)})`);
const passages = corePrayers.flatMap((p) =>
  p.tokens.flatMap((t, i) =>
    [
      ["he", t.hebrew],
      ["en", t.translation],
    ]
      .filter(([, text]) => text?.trim())
      .map(
        ([lang, text]) =>
          `(${q(`${p.id}:${i}:${lang}`)},${q(p.id)},${q(lang!)},${q(text!)},${q(p.sefariaRef)})`,
      ),
  ),
);
writeFileSync(
  "supabase/migrations/202609250002_catalog.sql",
  `-- Generated from corePrayers. Content approval remains a release gate.\ninsert into private.catalog(id,title,practice) values\n${rows.join(",\n")} on conflict(id) do update set title=excluded.title,practice=excluded.practice;\ninsert into private.passages(id,prayer_id,language,body,source_ref) values\n${passages.join(",\n")} on conflict(id) do update set body=excluded.body,source_ref=excluded.source_ref;\n`,
);
