import { cacheStorage, readJson, writeJson } from "@/services/mmkv";
import { secureFetch } from "@/services/network";

const TRANSLATION_CACHE_KEY = "language.translations.v2";

type TranslationCache = Record<string, string>;

function isTranslationCache(value: unknown): value is TranslationCache {
  return typeof value === "object" && value !== null && Object.values(value).every((item) => typeof item === "string");
}

export async function translatePrayerText(text: string, languageCode: string): Promise<string> {
  const cleanText = text.trim();
  if (!cleanText || languageCode === "en") {
    return cleanText;
  }
  if (languageCode === "he") {
    return cleanText;
  }

  const cache = readJson(cacheStorage, TRANSLATION_CACHE_KEY, isTranslationCache) ?? {};
  const cacheKey = `${languageCode}:${cleanText}`;
  const cached = cache[cacheKey];
  if (cached) {
    return cached;
  }

  try {
    const providerLanguageCode = toTranslationProviderCode(languageCode);
    const translated = await translateWithGoogle(cleanText, providerLanguageCode).catch(() => translateWithMyMemory(cleanText, providerLanguageCode));
    writeJson(cacheStorage, TRANSLATION_CACHE_KEY, { ...cache, [cacheKey]: translated });
    return translated;
  } catch {
    return cleanText;
  }
}

export function localizeHebrewTransliteration(transliteration: string, languageCode: string): string {
  const clean = transliteration.trim();
  if (!clean) {
    return clean;
  }

  if (languageCode === "ja") {
    return romanizedHebrewToJapaneseKana(clean);
  }
  if (languageCode === "ko") {
    return replaceByOrderedMap(clean, koreanMap);
  }
  if (languageCode === "el") {
    return replaceByOrderedMap(clean, greekMap);
  }
  if (["ru", "uk"].includes(languageCode)) {
    return replaceByOrderedMap(clean, cyrillicMap);
  }
  if (["ar", "fa", "ur"].includes(languageCode)) {
    return replaceByOrderedMap(clean, arabicMap);
  }
  if (languageCode === "he" || languageCode === "yi") {
    return replaceByOrderedMap(clean, hebrewPronunciationMap);
  }
  if (languageCode === "hi") {
    return replaceByOrderedMap(clean, devanagariMap);
  }
  if (languageCode === "bn") {
    return replaceByOrderedMap(clean, bengaliMap);
  }
  if (languageCode === "th") {
    return replaceByOrderedMap(clean, thaiMap);
  }
  if (languageCode === "am") {
    return replaceByOrderedMap(clean, ethiopicMap);
  }
  if (["zh-CN", "zh-TW"].includes(languageCode)) {
    return romanizedHebrewToChineseCharacters(clean);
  }

  if (["es", "pt", "it", "lad"].includes(languageCode)) {
    return clean.replace(/ch/gi, "j").replace(/sh/gi, "sh").replace(/tz/gi, "tz");
  }
  if (["fr"].includes(languageCode)) {
    return clean.replace(/ch/gi, "kh").replace(/ou/gi, "ou");
  }
  if (["de"].includes(languageCode)) {
    return clean.replace(/sh/gi, "sch").replace(/ch/gi, "ch").replace(/tz/gi, "z");
  }
  if (["pl"].includes(languageCode)) {
    return clean.replace(/sh/gi, "sz").replace(/ch/gi, "ch").replace(/tz/gi, "c");
  }
  if (["ru", "uk"].includes(languageCode)) {
    return clean.replace(/kh|ch/gi, "kh").replace(/sh/gi, "sh").replace(/tz/gi, "ts");
  }
  if (["tr"].includes(languageCode)) {
    return clean.replace(/sh/gi, "ş").replace(/ch/gi, "h").replace(/tz/gi, "ts");
  }
  if (["ar", "fa", "ur"].includes(languageCode)) {
    return clean.replace(/kh|ch/gi, "kh").replace(/sh/gi, "sh");
  }
  return clean;
}

function toTranslationProviderCode(languageCode: string): string {
  if (languageCode === "zh-CN" || languageCode === "zh-TW") {
    return "zh";
  }
  if (languageCode === "yi") {
    return "yi";
  }
  if (languageCode === "lad") {
    return "es";
  }
  return languageCode;
}

function stripEntities(input: string): string {
  return decodePercentEncodedText(input).replace(/&#39;/g, "'").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").trim();
}

async function translateWithGoogle(text: string, languageCode: string): Promise<string> {
  const response = await secureFetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(languageCode)}&dt=t&q=${encodeURIComponent(text)}`,
    {},
    { retries: 1, timeoutMs: 7000 }
  );
  const payload = (await response.json()) as unknown;
  const translated = parseGoogleTranslateResponse(payload);
  if (!translated) {
    throw new Error("Google translation response did not include translated text.");
  }
  return translated;
}

async function translateWithMyMemory(text: string, languageCode: string): Promise<string> {
  const response = await secureFetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${encodeURIComponent(languageCode)}`, {}, { retries: 1, timeoutMs: 7000 });
  const payload = (await response.json()) as { responseData?: { translatedText?: unknown } };
  return typeof payload.responseData?.translatedText === "string" ? stripEntities(payload.responseData.translatedText) : text;
}

function parseGoogleTranslateResponse(payload: unknown): string {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    return "";
  }

  return payload[0]
    .map((segment) => (Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : ""))
    .join("")
    .trim();
}

function decodePercentEncodedText(input: string): string {
  if (!/%[0-9A-F]{2}/i.test(input)) {
    return input;
  }

  try {
    return decodeURIComponent(input);
  } catch {
    return input.replace(/%20/g, " ");
  }
}

function romanizedHebrewToJapaneseKana(input: string): string {
  const phraseMap: Record<string, string> = {
    adonai: "アドナイ",
    eloheinu: "エロヘイヌ",
    elohecha: "エロヘハ",
    elohenu: "エロヘヌ",
    melech: "メレフ",
    haolam: "ハオラム",
    "ha'olam": "ハオラム",
    baruch: "バルフ",
    atah: "アタ",
    asher: "アシェル",
    kidshanu: "キドシャヌ",
    bemitzvotav: "ベミツヴォタヴ",
    vetzivanu: "ヴェツィヴァヌ",
    shema: "シェマ",
    yisrael: "イスラエル",
    echad: "エハド",
    torah: "トラ",
    shalom: "シャロム",
    amen: "アメン"
  };

  return input
    .split(/(\s+|[,.;:!?]+)/)
    .map((part) => {
      const key = part.toLowerCase().replace(/[’']/g, "'");
      return phraseMap[key] ?? romanWordToKana(part);
    })
    .join("");
}

function romanWordToKana(input: string): string {
  return replaceByOrderedMap(input.toLowerCase(), japaneseSyllableMap)
    .replace(/[bcdfghjklmnpqrstvwxyz]/gi, (letter) => consonantKana[letter.toLowerCase()] ?? letter)
    .replace(/a/g, "ア")
    .replace(/e/g, "エ")
    .replace(/i/g, "イ")
    .replace(/o/g, "オ")
    .replace(/u/g, "ウ")
    .replace(/'/g, "")
    .replace(/\b\w+\b/g, (value) => value);
}

function romanizedHebrewToChineseCharacters(input: string): string {
  const phraseMap: Record<string, string> = {
    adonai: "阿多奈",
    eloheinu: "埃洛海努",
    baruch: "巴鲁赫",
    atah: "阿塔",
    shema: "舍玛",
    yisrael: "以色列",
    echad: "埃哈德",
    torah: "托拉",
    shalom: "沙洛姆",
    amen: "阿门"
  };

  return input
    .split(/(\s+|[,.;:!?]+)/)
    .map((part) => {
      const key = part.toLowerCase().replace(/[’']/g, "'");
      return phraseMap[key] ?? replaceByOrderedMap(part.toLowerCase(), chineseMap);
    })
    .join("");
}

function replaceByOrderedMap(input: string, replacements: [RegExp, string][]): string {
  return replacements.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), input);
}

const japaneseSyllableMap: [RegExp, string][] = [
  [/she/gi, "シェ"],
  [/sha/gi, "シャ"],
  [/shi/gi, "シ"],
  [/sho/gi, "ショ"],
  [/shu/gi, "シュ"],
  [/cha/gi, "ハ"],
  [/che/gi, "ヘ"],
  [/chi/gi, "ヒ"],
  [/cho/gi, "ホ"],
  [/chu/gi, "フ"],
  [/tz/gi, "ツ"],
  [/ts/gi, "ツ"],
  [/va/gi, "ヴァ"],
  [/ve/gi, "ヴェ"],
  [/vi/gi, "ヴィ"],
  [/vo/gi, "ヴォ"],
  [/vu/gi, "ヴ"],
  [/ba/gi, "バ"],
  [/be/gi, "ベ"],
  [/bi/gi, "ビ"],
  [/bo/gi, "ボ"],
  [/bu/gi, "ブ"],
  [/da/gi, "ダ"],
  [/de/gi, "デ"],
  [/di/gi, "ディ"],
  [/do/gi, "ド"],
  [/du/gi, "ドゥ"],
  [/fa/gi, "ファ"],
  [/fe/gi, "フェ"],
  [/fi/gi, "フィ"],
  [/fo/gi, "フォ"],
  [/fu/gi, "フ"],
  [/ga/gi, "ガ"],
  [/ge/gi, "ゲ"],
  [/gi/gi, "ギ"],
  [/go/gi, "ゴ"],
  [/gu/gi, "グ"],
  [/ha/gi, "ハ"],
  [/he/gi, "ヘ"],
  [/hi/gi, "ヒ"],
  [/ho/gi, "ホ"],
  [/hu/gi, "フ"],
  [/ka/gi, "カ"],
  [/ke/gi, "ケ"],
  [/ki/gi, "キ"],
  [/ko/gi, "コ"],
  [/ku/gi, "ク"],
  [/la|ra/gi, "ラ"],
  [/le|re/gi, "レ"],
  [/li|ri/gi, "リ"],
  [/lo|ro/gi, "ロ"],
  [/lu|ru/gi, "ル"],
  [/ma/gi, "マ"],
  [/me/gi, "メ"],
  [/mi/gi, "ミ"],
  [/mo/gi, "モ"],
  [/mu/gi, "ム"],
  [/na/gi, "ナ"],
  [/ne/gi, "ネ"],
  [/ni/gi, "ニ"],
  [/no/gi, "ノ"],
  [/nu/gi, "ヌ"],
  [/pa/gi, "パ"],
  [/pe/gi, "ペ"],
  [/pi/gi, "ピ"],
  [/po/gi, "ポ"],
  [/pu/gi, "プ"],
  [/sa/gi, "サ"],
  [/se/gi, "セ"],
  [/si/gi, "シ"],
  [/so/gi, "ソ"],
  [/su/gi, "ス"],
  [/ta/gi, "タ"],
  [/te/gi, "テ"],
  [/ti/gi, "ティ"],
  [/to/gi, "ト"],
  [/tu/gi, "トゥ"],
  [/ya/gi, "ヤ"],
  [/ye/gi, "イェ"],
  [/yo/gi, "ヨ"],
  [/yu/gi, "ユ"],
  [/za/gi, "ザ"],
  [/ze/gi, "ゼ"],
  [/zi/gi, "ジ"],
  [/zo/gi, "ゾ"],
  [/zu/gi, "ズ"]
];

const consonantKana: Record<string, string> = {
  b: "ブ",
  c: "ク",
  d: "ド",
  f: "フ",
  g: "グ",
  h: "フ",
  j: "ジ",
  k: "ク",
  l: "ル",
  m: "ム",
  n: "ン",
  p: "プ",
  q: "ク",
  r: "ル",
  s: "ス",
  t: "ト",
  v: "ヴ",
  w: "ウ",
  x: "クス",
  y: "イ",
  z: "ズ"
};

const koreanMap: [RegExp, string][] = [
  [/baruch/gi, "바루흐"],
  [/atah/gi, "아타"],
  [/adonai/gi, "아도나이"],
  [/eloheinu/gi, "엘로헤이누"],
  [/shema/gi, "쉐마"],
  [/sh/gi, "샤"],
  [/ch|kh/gi, "하"],
  [/tz|ts/gi, "츠"],
  [/a/gi, "아"],
  [/b/gi, "브"],
  [/d/gi, "드"],
  [/e/gi, "에"],
  [/f/gi, "프"],
  [/g/gi, "그"],
  [/h/gi, "흐"],
  [/i/gi, "이"],
  [/j/gi, "즈"],
  [/k/gi, "크"],
  [/l/gi, "르"],
  [/m/gi, "므"],
  [/n/gi, "느"],
  [/o/gi, "오"],
  [/p/gi, "프"],
  [/q/gi, "크"],
  [/r/gi, "르"],
  [/s/gi, "스"],
  [/t/gi, "트"],
  [/u/gi, "우"],
  [/v/gi, "브"],
  [/w/gi, "우"],
  [/x/gi, "크스"],
  [/y/gi, "이"],
  [/z/gi, "즈"]
];

const greekMap: [RegExp, string][] = [
  [/sh/gi, "σ̌"],
  [/ch|kh/gi, "χ"],
  [/tz|ts/gi, "τσ"],
  [/a/gi, "α"],
  [/b/gi, "β"],
  [/d/gi, "δ"],
  [/e/gi, "ε"],
  [/f/gi, "φ"],
  [/g/gi, "γ"],
  [/h/gi, "χ"],
  [/i/gi, "ι"],
  [/j/gi, "τζ"],
  [/k/gi, "κ"],
  [/l/gi, "λ"],
  [/m/gi, "μ"],
  [/n/gi, "ν"],
  [/o/gi, "ο"],
  [/p/gi, "π"],
  [/q/gi, "κ"],
  [/r/gi, "ρ"],
  [/s/gi, "σ"],
  [/t/gi, "τ"],
  [/u/gi, "ου"],
  [/v/gi, "β"],
  [/w/gi, "ου"],
  [/x/gi, "ξ"],
  [/y/gi, "ι"],
  [/z/gi, "ζ"]
];

const cyrillicMap: [RegExp, string][] = [
  [/sh/gi, "ш"],
  [/ch|kh/gi, "х"],
  [/tz|ts/gi, "ц"],
  [/ya/gi, "я"],
  [/yu/gi, "ю"],
  [/a/gi, "а"],
  [/b/gi, "б"],
  [/v/gi, "в"],
  [/g/gi, "г"],
  [/d/gi, "д"],
  [/e/gi, "е"],
  [/z/gi, "з"],
  [/i/gi, "и"],
  [/k/gi, "к"],
  [/l/gi, "л"],
  [/m/gi, "м"],
  [/n/gi, "н"],
  [/o/gi, "о"],
  [/p/gi, "п"],
  [/r/gi, "р"],
  [/s/gi, "с"],
  [/t/gi, "т"],
  [/u/gi, "у"],
  [/f/gi, "ф"],
  [/h/gi, "х"],
  [/j/gi, "дж"],
  [/q/gi, "к"],
  [/w/gi, "в"],
  [/x/gi, "кс"],
  [/y/gi, "й"]
];

const arabicMap: [RegExp, string][] = [
  [/sh/gi, "ش"],
  [/ch|kh/gi, "خ"],
  [/tz|ts/gi, "تس"],
  [/a/gi, "ا"],
  [/b/gi, "ب"],
  [/d/gi, "د"],
  [/e/gi, "ي"],
  [/f/gi, "ف"],
  [/g/gi, "غ"],
  [/h/gi, "ه"],
  [/i/gi, "ي"],
  [/j/gi, "ج"],
  [/k/gi, "ك"],
  [/l/gi, "ل"],
  [/m/gi, "م"],
  [/n/gi, "ن"],
  [/o/gi, "و"],
  [/p/gi, "پ"],
  [/q/gi, "ق"],
  [/r/gi, "ر"],
  [/s/gi, "س"],
  [/t/gi, "ت"],
  [/u/gi, "و"],
  [/v/gi, "ڤ"],
  [/w/gi, "و"],
  [/x/gi, "كس"],
  [/z/gi, "ز"],
  [/y/gi, "ي"]
];

const hebrewPronunciationMap: [RegExp, string][] = [
  [/sh/gi, "ש"],
  [/ch|kh/gi, "ח"],
  [/tz|ts/gi, "צ"],
  [/a/gi, "א"],
  [/b/gi, "ב"],
  [/d/gi, "ד"],
  [/e/gi, "י"],
  [/f/gi, "פ"],
  [/g/gi, "ג"],
  [/h/gi, "ה"],
  [/i/gi, "י"],
  [/j/gi, "ג"],
  [/k/gi, "ק"],
  [/l/gi, "ל"],
  [/m/gi, "מ"],
  [/n/gi, "נ"],
  [/o/gi, "ו"],
  [/p/gi, "פ"],
  [/q/gi, "ק"],
  [/r/gi, "ר"],
  [/s/gi, "ס"],
  [/t/gi, "ט"],
  [/u/gi, "ו"],
  [/v/gi, "ו"],
  [/w/gi, "ו"],
  [/x/gi, "קס"],
  [/z/gi, "ז"],
  [/y/gi, "י"]
];

const devanagariMap: [RegExp, string][] = [
  [/sh/gi, "श"],
  [/ch|kh/gi, "ख"],
  [/tz|ts/gi, "त्स"],
  [/a/gi, "अ"],
  [/b/gi, "ब"],
  [/d/gi, "द"],
  [/e/gi, "े"],
  [/g/gi, "ग"],
  [/h/gi, "ह"],
  [/i/gi, "ि"],
  [/j/gi, "ज"],
  [/k/gi, "क"],
  [/l/gi, "ल"],
  [/m/gi, "म"],
  [/n/gi, "न"],
  [/o/gi, "ो"],
  [/r/gi, "र"],
  [/q/gi, "क"],
  [/s/gi, "स"],
  [/t/gi, "त"],
  [/u/gi, "ु"],
  [/v/gi, "व"],
  [/w/gi, "व"],
  [/x/gi, "क्स"],
  [/z/gi, "ज़"],
  [/y/gi, "य"]
];

const bengaliMap: [RegExp, string][] = [
  [/sh/gi, "শ"],
  [/ch|kh/gi, "খ"],
  [/tz|ts/gi, "ৎস"],
  [/a/gi, "আ"],
  [/b/gi, "ব"],
  [/d/gi, "দ"],
  [/e/gi, "ে"],
  [/f/gi, "ফ"],
  [/g/gi, "গ"],
  [/h/gi, "হ"],
  [/i/gi, "ি"],
  [/j/gi, "জ"],
  [/k/gi, "ক"],
  [/l/gi, "ল"],
  [/m/gi, "ম"],
  [/n/gi, "ন"],
  [/o/gi, "ো"],
  [/p/gi, "প"],
  [/q/gi, "ক"],
  [/r/gi, "র"],
  [/s/gi, "স"],
  [/t/gi, "ত"],
  [/u/gi, "ু"],
  [/v/gi, "ভ"],
  [/w/gi, "ও"],
  [/x/gi, "ক্স"],
  [/z/gi, "জ"],
  [/y/gi, "য"]
];

const thaiMap: [RegExp, string][] = [
  [/sh/gi, "ช"],
  [/ch|kh/gi, "ค"],
  [/tz|ts/gi, "ตซ"],
  [/a/gi, "า"],
  [/b/gi, "บ"],
  [/d/gi, "ด"],
  [/e/gi, "เ"],
  [/g/gi, "ก"],
  [/h/gi, "ฮ"],
  [/i/gi, "ิ"],
  [/j/gi, "จ"],
  [/k/gi, "ค"],
  [/l/gi, "ล"],
  [/m/gi, "ม"],
  [/n/gi, "น"],
  [/o/gi, "โ"],
  [/p/gi, "พ"],
  [/q/gi, "ค"],
  [/r/gi, "ร"],
  [/s/gi, "ส"],
  [/t/gi, "ต"],
  [/u/gi, "ุ"],
  [/v/gi, "ว"],
  [/w/gi, "ว"],
  [/x/gi, "คส"],
  [/z/gi, "ซ"],
  [/y/gi, "ย"]
];

const ethiopicMap: [RegExp, string][] = [
  [/sh/gi, "ሽ"],
  [/ch|kh/gi, "ኅ"],
  [/tz|ts/gi, "ጽ"],
  [/a/gi, "አ"],
  [/b/gi, "ብ"],
  [/d/gi, "ድ"],
  [/e/gi, "ኤ"],
  [/f/gi, "ፍ"],
  [/g/gi, "ግ"],
  [/h/gi, "ህ"],
  [/i/gi, "ኢ"],
  [/j/gi, "ጅ"],
  [/k/gi, "ክ"],
  [/l/gi, "ል"],
  [/m/gi, "ም"],
  [/n/gi, "ን"],
  [/o/gi, "ኦ"],
  [/p/gi, "ፕ"],
  [/q/gi, "ቅ"],
  [/r/gi, "ር"],
  [/s/gi, "ስ"],
  [/t/gi, "ት"],
  [/u/gi, "ኡ"],
  [/v/gi, "ቭ"],
  [/w/gi, "ው"],
  [/x/gi, "ክስ"],
  [/y/gi, "ይ"],
  [/z/gi, "ዝ"]
];

const chineseMap: [RegExp, string][] = [
  [/sh/gi, "沙"],
  [/ch|kh/gi, "赫"],
  [/tz|ts/gi, "茨"],
  [/a/gi, "阿"],
  [/b/gi, "布"],
  [/d/gi, "德"],
  [/e/gi, "埃"],
  [/f/gi, "夫"],
  [/g/gi, "格"],
  [/h/gi, "赫"],
  [/i/gi, "伊"],
  [/j/gi, "吉"],
  [/k/gi, "克"],
  [/l/gi, "勒"],
  [/m/gi, "姆"],
  [/n/gi, "恩"],
  [/o/gi, "奥"],
  [/p/gi, "普"],
  [/q/gi, "克"],
  [/r/gi, "尔"],
  [/s/gi, "斯"],
  [/t/gi, "特"],
  [/u/gi, "乌"],
  [/v/gi, "夫"],
  [/w/gi, "乌"],
  [/x/gi, "克斯"],
  [/y/gi, "伊"],
  [/z/gi, "兹"]
];
