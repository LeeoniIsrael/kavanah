/* eslint-disable react-hooks/exhaustive-deps -- Section fetches are keyed by canonical ref; language and scale reuse the same cached segments. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import * as MediaLibrary from "expo-media-library";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  Bookmark as BookmarkIcon,
  BookmarkCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  Share2,
  X,
} from "@/components/ui/icons";
import { List, Settings2 } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useThemeColors, useAppColorScheme } from "@/design/appearance";
import { confirmHaptic } from "@/services/haptics";
import {
  loadAnnotations,
  loadBookmarks,
  loadPosition,
  removeBookmark,
  saveAnnotation,
  saveBookmark,
  savePosition,
  searchCached,
  selectedBook,
} from "./cache";
import { ChapterRuler } from "./ChapterRuler";
import { pageDirection, pageForRef } from "./navigation";
import { createReaderHtml } from "./readerHtml";
import { leafNodes, normalizeHebrewSearch, sefariaProvider } from "./sefaria";
import { downloadBook, loadBook, loadSection } from "./service";
import type {
  Bookmark,
  PrayerProfile,
  ReaderLanguage,
  ReaderPosition,
  SiddurDefinition,
  SiddurNode,
  SiddurSegment,
  TextAnnotation,
} from "./model";
const pageGroups = (
  segments: SiddurSegment[],
  lang: ReaderLanguage,
  scale: number,
) => {
  const pages: SiddurSegment[][] = [];
  let current: SiddurSegment[] = [],
    size = 0;
  const limit = Math.round(700 / scale);
  for (const s of segments) {
    const length = ((lang === "he" ? s.he || s.en : s.en || s.he) ?? "").length;
    if (current.length && size + length > limit) {
      pages.push(current);
      current = [];
      size = 0;
    }
    current.push(s);
    size += length;
  }
  if (current.length) pages.push(current);
  return pages.length ? pages : [[]];
};
const button = (colors: ReturnType<typeof useThemeColors>) => ({
  width: 44,
  height: 44,
  borderRadius: 16,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  backgroundColor: colors.mineral,
});
export function SiddurExperience() {
  const colors = useThemeColors(),
    dark = useAppColorScheme() === "dark",
    reduceMotion = useReducedMotion();
  const [catalog, setCatalog] = useState<SiddurDefinition[]>([]),
    [bookId, setBookId] = useState("Siddur Ashkenaz"),
    [reader, setReader] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [book, setBook] = useState<SiddurDefinition | null>(null),
    [nodes, setNodes] = useState<SiddurNode[]>([]),
    [sectionIndex, setSectionIndex] = useState(0),
    [segments, setSegments] = useState<SiddurSegment[]>([]),
    [pageIndex, setPageIndex] = useState(0);
  const [language, setLanguage] = useState<ReaderLanguage>("en"),
    [fontScale, setFontScale] = useState(1),
    [profile, setProfile] = useState<PrayerProfile>("general"),
    [toc, setToc] = useState(false),
    [settings, setSettings] = useState(false),
    [query, setQuery] = useState("");
  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]),
    [selection, setSelection] = useState<{
      text: string;
      start: { id: string; offset: number };
      end: { id: string; offset: number };
    } | null>(null),
    [note, setNote] = useState(false),
    [noteText, setNoteText] = useState(""),
    [bookmarks, setBookmarks] = useState<Bookmark[]>([]),
    [download, setDownload] = useState(""),
    [contentResults, setContentResults] = useState<SiddurSegment[]>([]);
  const pageRef = useRef<View>(null),
    loadingId = useRef(0),
    pendingRestore = useRef<string | undefined>(undefined),
    [readySection, setReadySection] = useState(""),
    [slide] = useState(() => new Animated.Value(0)),
    interaction = useRef<
      "idle" | "selecting" | "zooming" | "annotating" | "ruler"
    >("idle");
  const [opacity] = useState(() => new Animated.Value(1));
  const leaves = useMemo(() => leafNodes(nodes), [nodes]);
  const section = leaves[sectionIndex];
  const pages = useMemo(
    () => pageGroups(segments, language, fontScale),
    [segments, language, fontScale],
  );
  const currentPage = useMemo(
    () => pages[Math.min(pageIndex, pages.length - 1)] ?? [],
    [pages, pageIndex],
  );
  const location = currentPage[0]?.ref ?? section?.ref;
  const currentBookmark = bookmarks.find(
    (b) => b.segmentRef === location && b.siddurId === bookId,
  );
  useEffect(() => {
    let live = true;
    void selectedBook()
      .then((id) => {
        if (live && id) setBookId(id);
      })
      .catch(() => {});
    void sefariaProvider
      .getCatalog()
      .then((c) => {
        if (live) setCatalog(c);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  const open = useCallback(async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const loaded = await loadBook(id);
      const saved = await loadPosition(id);
      const refs = leafNodes(loaded.nodes);
      pendingRestore.current = saved?.segmentRef;
      setSegments([]);
      setReadySection("");
      setPageIndex(0);
      setBook(loaded.book);
      setNodes(loaded.nodes);
      setBookId(id);
      setLanguage(saved?.language ?? "en");
      setFontScale(saved?.fontScale ?? 1);
      setProfile(saved?.profile ?? "general");
      setBookmarks(await loadBookmarks(id));
      const target = Math.max(
        0,
        refs.findIndex(
          (n) =>
            n.ref ===
            (saved?.sectionRef ??
              "Siddur Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Morning Blessings"),
        ),
      );
      setSectionIndex(target);
      setReader(true);
    } catch {
      setError(
        "This siddur is unavailable right now. Connect to download its approved text.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!reader || !section) return;
    let active = true;
    const request = ++loadingId.current;
    void (async () => {
      try {
        const s = await loadSection(bookId, section.ref);
        if (!active || request !== loadingId.current) return;
        setSegments(s);
        if (!s.length)
          setError(
            "No approved text is available in this section. Choose another section from Contents.",
          );
        else setError("");
        setAnnotations(await loadAnnotations(bookId, section.ref));
        const anchor = pendingRestore.current;
        if (anchor) {
          const groups = pageGroups(s, language, fontScale);
          const p = pageForRef(groups, anchor);
          if (p >= 0) setPageIndex(p);
          pendingRestore.current = undefined;
        }
        setReadySection(section.ref);
        const near = leaves[sectionIndex + 1];
        if (near) void loadSection(bookId, near.ref).catch(() => {});
      } catch {
        if (active)
          setError("This section is not cached. Connect and try again.");
      }
    })();
    return () => {
      active = false;
    };
  }, [reader, section?.ref, bookId]);
  useEffect(() => {
    if (
      !reader ||
      !section ||
      readySection !== section.ref ||
      currentPage[0]?.sectionId !== section.ref
    )
      return;
    const position: ReaderPosition = {
      siddurId: bookId,
      language,
      sectionRef: section.ref,
      segmentRef: location,
      fontScale,
      profile,
    };
    void savePosition(position).catch(() => {});
  }, [
    reader,
    bookId,
    language,
    section?.ref,
    location,
    fontScale,
    profile,
    readySection,
  ]);
  const goSection = (n: number) => {
    if (n < 0 || n >= leaves.length) return;
    setReadySection("");
    setSegments([]);
    setSectionIndex(n);
    setPageIndex(0);
    setSelection(null);
    setToc(false);
    interaction.current = "idle";
  };
  const goPage = (direction: number) => {
    if (interaction.current !== "idle") return;
    setSelection(null);
    const turn = () => {
      if (direction > 0) {
        if (pageIndex < pages.length - 1) setPageIndex((p) => p + 1);
        else goSection(sectionIndex + 1);
      } else if (pageIndex > 0) setPageIndex((p) => p - 1);
      else goSection(sectionIndex - 1);
    };
    if (reduceMotion) {
      turn();
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0.6,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: -direction * 26,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start(() => {
      turn();
      slide.setValue(direction * 16);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 135,
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: 0,
          duration: 135,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };
  const switchLanguage = (next: ReaderLanguage) => {
    if (next === language) return;
    const anchor = location;
    opacity.setValue(0);
    setLanguage(next);
    const nextPages = pageGroups(segments, next, fontScale);
    const n = pageForRef(nextPages, anchor);
    setPageIndex(Math.max(0, n));
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };
  const onMessage = (event: WebViewMessageEvent) => {
    let m: {
      type: string;
      dx?: number;
      side?: number;
      scale?: number;
      text?: string;
      start?: { id: string; offset: number };
      end?: { id: string; offset: number };
    };
    try {
      m = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (m.type === "selection" && m.start && m.end && m.text) {
      interaction.current = "selecting";
      setSelection({ text: m.text, start: m.start, end: m.end });
    } else if (
      m.type === "selectionEnd" &&
      interaction.current === "selecting"
    ) {
      interaction.current = "idle";
      setSelection(null);
    } else if (m.type === "pinchStart") {
      interaction.current = "zooming";
    } else if (m.type === "pinchEnd") {
      interaction.current = "idle";
    } else if (m.type === "pinch" && m.scale) {
      setFontScale((s) =>
        Math.max(0.8, Math.min(1.7, Math.round(s * m.scale! * 20) / 20)),
      );
    } else if (m.type === "swipe" && m.dx)
      goPage(pageDirection(language, m.dx));
    else if (m.type === "edge" && m.side !== undefined)
      goPage((m.side > 0.5 ? 1 : -1) * (language === "he" ? -1 : 1));
  };
  const addAnnotation = async (type: "highlight" | "note") => {
    if (!selection || !book) return;
    const now = Date.now();
    const a: TextAnnotation = {
      id: `${now}-${Math.random().toString(36).slice(2)}`,
      siddurId: bookId,
      versionKey:
        (language === "he"
          ? book.versions.he?.versionTitle
          : book.versions.en?.versionTitle) ?? "",
      language,
      startSegmentId: selection.start.id,
      startOffset: selection.start.offset,
      endSegmentId: selection.end.id,
      endOffset: selection.end.offset,
      selectedText: selection.text,
      type,
      note: type === "note" ? noteText : undefined,
      createdAt: now,
      updatedAt: now,
    };
    await saveAnnotation(a);
    setAnnotations((old) => [...old, a]);
    setNote(false);
    setNoteText("");
    setSelection(null);
    interaction.current = "idle";
    void confirmHaptic();
  };
  const toggleBookmark = async () => {
    if (!location) return;
    if (currentBookmark) {
      await removeBookmark(currentBookmark.id);
      setBookmarks((b) => b.filter((x) => x.id !== currentBookmark.id));
    } else {
      const b: Bookmark = {
        id: `${bookId}:${location}`,
        siddurId: bookId,
        sectionRef: section?.ref ?? "",
        segmentRef: location,
        language,
        createdAt: Date.now(),
      };
      await saveBookmark(b);
      setBookmarks((old) => [b, ...old]);
    }
    void confirmHaptic();
  };
  const share = async (save = false) => {
    if (!pageRef.current) return;
    try {
      const uri = await captureRef(pageRef.current, {
        format: "png",
        quality: 1,
      });
      if (save) {
        const permission = await MediaLibrary.requestPermissionsAsync(true, [
          "photo",
        ]);
        if (permission.granted) await MediaLibrary.Asset.create(uri);
        else setError("Allow photo access to save this page.");
      } else if (await Sharing.isAvailableAsync())
        await Sharing.shareAsync(uri, { mimeType: "image/png" });
    } catch {
      setError("This page could not be captured right now.");
    }
  };
  const chooseCapture = () =>
    Alert.alert("Current page", "Capture a clean image of this prayer page", [
      { text: "Save image", onPress: () => void share(true) },
      { text: "Share image", onPress: () => void share(false) },
      { text: "Cancel", style: "cancel" },
    ]);
  useEffect(() => {
    if (!toc || query.trim().length < 2) return;
    let live = true;
    const timer = setTimeout(() => {
      void searchCached(bookId, query)
        .then((results) => {
          if (live) setContentResults(results);
        })
        .catch(() => {});
    }, 180);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [toc, query, bookId]);
  const filtered = useMemo(
    () =>
      leaves
        .map((n, i) => ({ n, i }))
        .filter(
          ({ n }) =>
            !query ||
            normalizeHebrewSearch(
              `${n.titleEn} ${n.titleHe ?? ""} ${n.ref}`,
            ).includes(normalizeHebrewSearch(query)),
        )
        .slice(0, 100),
    [leaves, query],
  );
  const html = useMemo(
    () => createReaderHtml(currentPage, language, fontScale, annotations, dark),
    [currentPage, language, fontScale, annotations, dark],
  );
  return (
    <View style={{ gap: 18, paddingTop: 22 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <BookOpen size={23} color={colors.blue} />
        <Text variant="section" style={{ flex: 1 }}>
          Siddur reader
        </Text>
        <Button
          accessibilityLabel="Siddur adjustments"
          variant="ghost"
          onPress={() => {
            void open(bookId).then(() => setSettings(true));
          }}
          style={button(colors)}
        >
          <Settings2 size={20} color={colors.ink} />
        </Button>
      </View>
      <View
        style={{
          backgroundColor: colors.vellum,
          borderRadius: 26,
          padding: 22,
          gap: 12,
        }}
      >
        <Text variant="section" style={{ fontSize: 23 }}>
          {bookId}
        </Text>
        <Text style={{ color: colors.inkMuted }}>
          Read the structured Sefaria text, with your place saved on this
          device.
        </Text>
        <Button
          variant="secondary"
          onPress={() => void open(bookId)}
          disabled={loading}
          style={{
            minHeight: 50,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 18,
            backgroundColor: colors.blue,
          }}
        >
          {loading ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Text style={{ color: colors.onAccent, fontWeight: "700" }}>
              Open reader
            </Text>
          )}
        </Button>
      </View>
      {error && !reader ? (
        <Text style={{ color: colors.danger }}>{error}</Text>
      ) : null}
      <Modal
        visible={reader}
        animationType="slide"
        onRequestClose={() => {
          if (note) setNote(false);
          else if (settings) setSettings(false);
          else if (toc) setToc(false);
          else setReader(false);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.parchment }}>
          <View
            style={{
              height: 58,
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
              paddingHorizontal: 15,
            }}
          >
            <Button
              variant="ghost"
              accessibilityLabel="Close Siddur reader"
              onPress={() => setReader(false)}
              style={button(colors)}
            >
              <X size={20} color={colors.ink} />
            </Button>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                numberOfLines={1}
                style={{ fontSize: 13, fontWeight: "600", color: colors.ink }}
              >
                {section?.titleEn ?? bookId}
              </Text>
            </View>
            <Button
              variant="ghost"
              accessibilityLabel="Table of contents"
              onPress={() => {
                setSettings(false);
                setToc(true);
              }}
              style={button(colors)}
            >
              <List size={20} color={colors.ink} />
            </Button>
            <Button
              variant="ghost"
              accessibilityLabel="Reader adjustments"
              onPress={() => {
                setToc(false);
                setSettings(true);
              }}
              style={button(colors)}
            >
              <Settings2 size={20} color={colors.ink} />
            </Button>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignSelf: "center",
              padding: 3,
              borderRadius: 16,
              backgroundColor: colors.mineral,
              marginBottom: 10,
            }}
          >
            {(["en", "he"] as const).map((l) => (
              <Button
                key={l}
                accessibilityLabel={
                  l === "en" ? "Read in English" : "Read in Hebrew"
                }
                accessibilityState={{ selected: language === l }}
                variant="ghost"
                onPress={() => switchLanguage(l)}
                style={{
                  borderRadius: 13,
                  minWidth: 83,
                  backgroundColor:
                    language === l ? colors.vellum : "transparent",
                }}
              >
                <Text style={{ textAlign: "center", color: colors.ink }}>
                  {l === "en" ? "English" : "עברית"}
                </Text>
              </Button>
            ))}
          </View>
          <Animated.View
            ref={pageRef}
            collapsable={false}
            style={{
              flex: 1,
              marginHorizontal: 12,
              borderRadius: 24,
              overflow: "hidden",
              backgroundColor: colors.vellum,
              opacity,
              transform: [{ translateX: slide }],
              shadowColor: colors.shadow,
              shadowOpacity: 0.07,
              shadowRadius: 10,
            }}
          >
            {segments.length ? (
              <WebView
                key={`${section?.ref}:${pageIndex}:${language}:${fontScale}`}
                source={{ html }}
                originWhitelist={["about:blank"]}
                onShouldStartLoadWithRequest={(r) => r.url === "about:blank"}
                onMessage={onMessage}
                textInteractionEnabled
                javaScriptEnabled
                domStorageEnabled={false}
                scrollEnabled
                showsVerticalScrollIndicator={false}
                style={{ backgroundColor: colors.vellum }}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 25,
                }}
              >
                {error ? (
                  <Text style={{ color: colors.inkMuted }}>{error}</Text>
                ) : (
                  <ActivityIndicator color={colors.blue} />
                )}
              </View>
            )}
          </Animated.View>
          {selection ? (
            <View
              style={{
                flexDirection: "row",
                alignSelf: "center",
                gap: 8,
                padding: 7,
                borderRadius: 18,
                backgroundColor: colors.mineral,
                marginTop: 6,
              }}
            >
              <Button
                onPress={() => void Clipboard.setStringAsync(selection.text)}
                accessibilityLabel="Copy selected text"
              >
                <Text>Copy</Text>
              </Button>
              <Button
                onPress={() => void addAnnotation("highlight")}
                accessibilityLabel="Highlight selected text"
              >
                <Text>Highlight</Text>
              </Button>
              <Button
                onPress={() => {
                  interaction.current = "annotating";
                  setNote(true);
                }}
                accessibilityLabel="Add note to selected text"
              >
                <Text>Note</Text>
              </Button>
            </View>
          ) : null}
          <View
            style={{
              height: 56,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 18,
            }}
          >
            <Button
              variant="ghost"
              accessibilityLabel="Previous page"
              onPress={() => goPage(-1)}
              style={button(colors)}
            >
              <ChevronLeft size={20} color={colors.ink} />
            </Button>
            <Button
              variant="ghost"
              accessibilityLabel={
                currentBookmark ? "Remove bookmark" : "Bookmark this page"
              }
              onPress={() => void toggleBookmark()}
              style={button(colors)}
            >
              {currentBookmark ? (
                <BookmarkCheck size={20} color={colors.blue} />
              ) : (
                <BookmarkIcon size={20} color={colors.ink} />
              )}
            </Button>
            <Text style={{ color: colors.inkMuted, fontSize: 12 }}>
              {pageIndex + 1} / {pages.length}
            </Text>
            <Button
              variant="ghost"
              accessibilityLabel="Share this page"
              onPress={chooseCapture}
              style={button(colors)}
            >
              <Share2 size={19} color={colors.ink} />
            </Button>
            <Button
              variant="ghost"
              accessibilityLabel="Next page"
              onPress={() => goPage(1)}
              style={button(colors)}
            >
              <ChevronRight size={20} color={colors.ink} />
            </Button>
          </View>
          <ChapterRuler
            sections={leaves}
            index={sectionIndex}
            onCommit={goSection}
          />
          {toc ? (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                justifyContent: "flex-end",
                backgroundColor: "#0008",
                zIndex: 30,
              }}
            >
              <View
                style={{
                  height: "90%",
                  backgroundColor: colors.parchment,
                  borderTopLeftRadius: 26,
                  borderTopRightRadius: 26,
                  overflow: "hidden",
                }}
              >
                <SafeAreaView
                  style={{
                    flex: 1,
                    backgroundColor: colors.parchment,
                    padding: 20,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text variant="section" style={{ fontSize: 24 }}>
                      Contents
                    </Text>
                    <Button
                      onPress={() => setToc(false)}
                      accessibilityLabel="Close contents"
                    >
                      <X size={22} color={colors.ink} />
                    </Button>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.mineral,
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      marginVertical: 16,
                    }}
                  >
                    <Search size={18} color={colors.inkMuted} />
                    <TextInput
                      value={query}
                      onChangeText={setQuery}
                      placeholder="Search English or Hebrew"
                      placeholderTextColor={colors.inkMuted}
                      style={{
                        height: 48,
                        flex: 1,
                        marginLeft: 8,
                        color: colors.ink,
                      }}
                    />
                  </View>
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {!query && bookmarks.length ? (
                      <View style={{ paddingVertical: 10 }}>
                        <Text variant="section">Saved places</Text>
                        {bookmarks.map((saved) => {
                          const i = leaves.findIndex(
                            (n) => n.ref === saved.sectionRef,
                          );
                          return (
                            <Pressable
                              key={saved.id}
                              accessibilityRole="button"
                              accessibilityLabel={`Return to ${leaves[i]?.titleEn ?? "saved place"}`}
                              onPress={() => {
                                pendingRestore.current = saved.segmentRef;
                                goSection(i);
                              }}
                              style={{
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderColor: colors.hairline,
                              }}
                            >
                              <Text style={{ color: colors.ink }}>
                                {leaves[i]?.titleEn ?? saved.sectionRef}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                    {query.trim().length >= 2 && contentResults.length ? (
                      <View style={{ paddingVertical: 10 }}>
                        <Text variant="section">
                          Text matches in downloaded sections
                        </Text>
                        {contentResults.map((result) => {
                          const i = leaves.findIndex(
                            (n) => n.ref === result.sectionId,
                          );
                          return (
                            <Pressable
                              key={result.ref}
                              accessibilityRole="button"
                              accessibilityLabel={`Go to ${result.ref}`}
                              onPress={() => {
                                pendingRestore.current = result.ref;
                                goSection(i);
                              }}
                              style={{
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderColor: colors.hairline,
                              }}
                            >
                              <Text
                                style={{ color: colors.ink, fontWeight: "600" }}
                              >
                                {leaves[i]?.titleEn}
                              </Text>
                              <Text
                                numberOfLines={2}
                                style={{ color: colors.inkMuted }}
                              >
                                {result.en ?? result.he}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                    {filtered.map(({ n, i }) => (
                      <Pressable
                        key={n.ref}
                        accessibilityRole="button"
                        accessibilityLabel={`Go to ${n.titleEn}`}
                        onPress={() => goSection(i)}
                        style={{
                          paddingVertical: 14,
                          paddingLeft: Math.min(n.depth, 4) * 10,
                          borderBottomWidth: 1,
                          borderColor: colors.hairline,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.ink,
                            fontSize: 16,
                            fontWeight: "600",
                          }}
                        >
                          {n.titleEn}
                        </Text>
                        {n.titleHe ? (
                          <Text
                            style={{ color: colors.inkMuted, fontSize: 13 }}
                          >
                            {n.titleHe}
                          </Text>
                        ) : null}
                      </Pressable>
                    ))}
                  </ScrollView>
                </SafeAreaView>
              </View>
            </View>
          ) : null}
          {settings ? (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                justifyContent: "flex-end",
                backgroundColor: "#0008",
                zIndex: 30,
              }}
            >
              <View
                style={{
                  height: "90%",
                  backgroundColor: colors.parchment,
                  borderTopLeftRadius: 26,
                  borderTopRightRadius: 26,
                  overflow: "hidden",
                }}
              >
                <SafeAreaView
                  style={{
                    flex: 1,
                    backgroundColor: colors.parchment,
                    padding: 22,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text variant="section" style={{ fontSize: 25 }}>
                      Reading settings
                    </Text>
                    <Button
                      onPress={() => setSettings(false)}
                      accessibilityLabel="Close settings"
                    >
                      <X size={22} color={colors.ink} />
                    </Button>
                  </View>
                  <ScrollView
                    contentContainerStyle={{
                      gap: 20,
                      paddingTop: 25,
                      paddingBottom: 40,
                    }}
                  >
                    <Text variant="section">Siddur & tradition</Text>
                    {catalog
                      .filter((b) => b.availability.he || b.availability.en)
                      .map((b) => (
                        <Button
                          key={b.id}
                          variant="secondary"
                          onPress={() => {
                            setSettings(false);
                            void open(b.id);
                          }}
                          style={{
                            padding: 14,
                            borderRadius: 16,
                            backgroundColor:
                              bookId === b.id ? colors.blueSoft : colors.vellum,
                            alignItems: "flex-start",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          <Text
                            style={{ color: colors.ink, fontWeight: "600" }}
                          >
                            {b.displayName}
                          </Text>
                          <Text
                            style={{ color: colors.inkMuted, fontSize: 12 }}
                          >
                            {b.rite.replaceAll("_", " ")} · {b.scope} ·{" "}
                            {b.availability.he ? "Hebrew " : ""}
                            {b.availability.en ? "English" : ""}
                          </Text>
                        </Button>
                      ))}
                    <Text variant="section">More traditions</Text>
                    <Text style={{ color: colors.inkMuted, fontSize: 13 }}>
                      Spanish & Portuguese, Yemenite, Italian, Romaniote,
                      Karaite, and modern denominational editions need a
                      verified open text source before they can be enabled.
                    </Text>
                    <Text variant="section">Presentation</Text>
                    <Text style={{ color: colors.inkMuted, fontSize: 13 }}>
                      Standard text is available. Interlinear and transliterated
                      editions require source-aligned open text.
                    </Text>
                    <Text variant="section">Reading</Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      {(["en", "he"] as const).map((l) => (
                        <Button
                          key={l}
                          onPress={() => switchLanguage(l)}
                          variant="secondary"
                        >
                          <Text>{l === "en" ? "English" : "עברית"}</Text>
                        </Button>
                      ))}
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 16,
                      }}
                    >
                      <Button
                        onPress={() =>
                          setFontScale((s) =>
                            Math.max(0.8, Math.round((s - 0.1) * 10) / 10),
                          )
                        }
                        accessibilityLabel="Decrease text size"
                      >
                        <Text style={{ fontSize: 18 }}>A−</Text>
                      </Button>
                      <Text>{Math.round(fontScale * 100)}%</Text>
                      <Button
                        onPress={() =>
                          setFontScale((s) =>
                            Math.min(1.7, Math.round((s + 0.1) * 10) / 10),
                          )
                        }
                        accessibilityLabel="Increase text size"
                      >
                        <Text style={{ fontSize: 22 }}>A+</Text>
                      </Button>
                    </View>
                    <Text variant="section">Profile</Text>
                    <View
                      style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}
                    >
                      {(["general", "masculine", "feminine"] as const).map(
                        (p) => (
                          <Button
                            key={p}
                            onPress={() => setProfile(p)}
                            variant="secondary"
                            style={{
                              backgroundColor:
                                profile === p ? colors.blueSoft : colors.vellum,
                            }}
                          >
                            <Text>{p}</Text>
                          </Button>
                        ),
                      )}
                    </View>
                    <Text style={{ color: colors.inkMuted, fontSize: 12 }}>
                      Profile does not alter canonical prayer text unless an
                      explicitly sourced variant is available.
                    </Text>
                    <Text variant="section">Offline</Text>
                    <Button
                      variant="secondary"
                      onPress={() => {
                        setDownload("Starting download…");
                        void downloadBook(bookId, (done, total) =>
                          setDownload(`${done} of ${total} sections cached`),
                        )
                          .then(() => setDownload("Available offline"))
                          .catch(() =>
                            setDownload(
                              "Download paused. Try again when connected.",
                            ),
                          );
                      }}
                    >
                      <Text>Download complete book</Text>
                    </Button>
                    {download ? (
                      <Text style={{ color: colors.inkMuted }}>{download}</Text>
                    ) : null}
                    <Text variant="section">Text source</Text>
                    <Text style={{ color: colors.inkMuted }}>
                      Sefaria · independent source library. Kavanah is not
                      endorsed by Sefaria.
                    </Text>
                    {[
                      book?.versions.he,
                      book?.versions.en,
                      book?.fallbackEnglish,
                    ]
                      .filter(Boolean)
                      .map((v, i) => (
                        <Text
                          key={i}
                          style={{ color: colors.inkMuted, fontSize: 13 }}
                        >
                          {v?.versionTitle} · {v?.license}
                        </Text>
                      ))}
                  </ScrollView>
                </SafeAreaView>
              </View>
            </View>
          ) : null}
          {note ? (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                zIndex: 40,
              }}
            >
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  backgroundColor: "#0007",
                  padding: 22,
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.vellum,
                    borderRadius: 24,
                    padding: 20,
                    gap: 14,
                  }}
                >
                  <Text variant="section">Note on selection</Text>
                  <Text numberOfLines={2} style={{ color: colors.inkMuted }}>
                    {selection?.text}
                  </Text>
                  <TextInput
                    multiline
                    value={noteText}
                    onChangeText={setNoteText}
                    placeholder="Write a note"
                    placeholderTextColor={colors.inkMuted}
                    style={{
                      minHeight: 100,
                      color: colors.ink,
                      textAlignVertical: "top",
                    }}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      gap: 12,
                    }}
                  >
                    <Button
                      onPress={() => {
                        setNote(false);
                        interaction.current = "selecting";
                      }}
                    >
                      <Text>Cancel</Text>
                    </Button>
                    <Button onPress={() => void addAnnotation("note")}>
                      <Text>Save note</Text>
                    </Button>
                  </View>
                </View>
              </View>
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
