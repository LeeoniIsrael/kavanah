/* eslint-disable react-hooks/exhaustive-deps -- Section fetches are keyed by canonical ref; language and scale reuse the same cached segments. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import * as MediaLibrary from "expo-media-library";
import { LinearGradient } from "expo-linear-gradient";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { BookOpen, X } from "@/components/ui/icons";
import { SearchBar } from "@/components/SearchBar";
import {
  ChevronLeft,
  ChevronRight,
  List,
  MoreHorizontal,
  Settings2,
} from "lucide-react-native";
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
import { ReadingSettingsSheet } from "./ReadingSettingsSheet";
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
export type SiddurMenuAction =
  "contents" | "bookmark" | "share" | "save" | "settings";

export function SiddurExperience({
  embedded = false,
  menuCommand,
  onBookmarkStatus,
  onChooseDefault,
}: {
  embedded?: boolean;
  menuCommand?: { id: number; action: SiddurMenuAction } | null;
  onBookmarkStatus?: (bookmarked: boolean) => void;
  onChooseDefault?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
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
    turning = useRef(false),
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
    onBookmarkStatus?.(Boolean(currentBookmark));
  }, [currentBookmark, onBookmarkStatus]);
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
    if (!embedded) return;
    let live = true;
    void selectedBook()
      .then((id) => {
        if (live) void open(id ?? "Siddur Ashkenaz");
      })
      .catch(() => {
        if (live) void open("Siddur Ashkenaz");
      });
    return () => {
      live = false;
    };
  }, [embedded, open]);
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
    if (interaction.current !== "idle" || turning.current) return;
    setSelection(null);
    const canTurn =
      direction > 0
        ? pageIndex < pages.length - 1 || sectionIndex < leaves.length - 1
        : pageIndex > 0 || sectionIndex > 0;
    if (!canTurn) {
      if (reduceMotion) {
        slide.setValue(0);
        return;
      }
      Animated.spring(slide, {
        toValue: 0,
        useNativeDriver: true,
        tension: 110,
        friction: 15,
      }).start();
      return;
    }
    const turn = () => {
      if (direction > 0) {
        if (pageIndex < pages.length - 1) setPageIndex((p) => p + 1);
        else goSection(sectionIndex + 1);
      } else if (pageIndex > 0) setPageIndex((p) => p - 1);
      else goSection(sectionIndex - 1);
    };
    if (reduceMotion) {
      slide.setValue(0);
      turn();
      return;
    }
    turning.current = true;
    const visualDirection = direction * (language === "he" ? -1 : 1);
    const travel = windowWidth * 0.78;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0.35,
        duration: 150,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: -visualDirection * travel,
        duration: 150,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) {
        turning.current = false;
        return;
      }
      turn();
      slide.setValue(visualDirection * travel);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(slide, {
            toValue: 0,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          turning.current = false;
        });
      });
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
    } else if (
      m.type === "drag" &&
      m.dx &&
      !turning.current &&
      interaction.current === "idle"
    ) {
      slide.setValue(
        Math.max(-windowWidth * 0.5, Math.min(windowWidth * 0.5, m.dx)),
      );
    } else if (m.type === "dragEnd" && !turning.current) {
      Animated.spring(slide, {
        toValue: 0,
        useNativeDriver: true,
        tension: 110,
        friction: 15,
      }).start();
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
    Alert.alert("Current page", undefined, [
      { text: "Share image", onPress: () => void share(false) },
      { text: "Save image", onPress: () => void share(true) },
      { text: "Cancel", style: "cancel" },
    ]);
  const openReaderMenu = () =>
    Alert.alert("Prayer options", undefined, [
      {
        text: "Contents",
        onPress: () => {
          setSettings(false);
          setToc(true);
        },
      },
      {
        text: currentBookmark ? "Remove bookmark" : "Bookmark this page",
        onPress: () => void toggleBookmark(),
      },
      { text: "Share or save page", onPress: chooseCapture },
      {
        text: "Reading settings",
        onPress: () => {
          setToc(false);
          setSettings(true);
        },
      },
      ...(onChooseDefault
        ? [{ text: "Default Prayer view", onPress: onChooseDefault }]
        : []),
      { text: "Cancel", style: "cancel" },
    ]);
  const previousMenuCommand = useRef(menuCommand?.id);
  /* eslint-disable react-hooks/set-state-in-effect -- A header menu command is a user event forwarded to this embedded reader. */
  useEffect(() => {
    if (
      !embedded ||
      !menuCommand ||
      menuCommand.id === previousMenuCommand.current
    )
      return;
    previousMenuCommand.current = menuCommand.id;
    if (menuCommand.action === "contents") {
      setSettings(false);
      setToc(true);
    } else if (menuCommand.action === "bookmark") {
      void toggleBookmark();
    } else if (menuCommand.action === "share") {
      void share(false);
    } else if (menuCommand.action === "save") {
      void share(true);
    } else if (menuCommand.action === "settings") {
      setToc(false);
      setSettings(true);
    }
  }, [embedded, menuCommand?.id]);
  /* eslint-enable react-hooks/set-state-in-effect */
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
  const pageTilt = slide.interpolate({
    inputRange: [-windowWidth, 0, windowWidth],
    outputRange: ["12deg", "0deg", "-12deg"],
    extrapolate: "clamp",
  });
  const pageLift = slide.interpolate({
    inputRange: [-windowWidth, 0, windowWidth],
    outputRange: [30, 0, 30],
    extrapolate: "clamp",
  });
  const ReaderHost = embedded ? View : Modal;
  return (
    <View style={embedded ? { flex: 1 } : { gap: 18, paddingTop: 22 }}>
      {!embedded ? (
        <>
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
        </>
      ) : null}
      <ReaderHost
        {...(embedded
          ? { style: { height: Math.max(390, windowHeight - 319) } }
          : {
              visible: reader,
              animationType: "slide" as const,
              onRequestClose: () => {
                if (note) setNote(false);
                else if (settings) setSettings(false);
                else if (toc) setToc(false);
                else setReader(false);
              },
            })}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.parchment,
            paddingTop: embedded
              ? 0
              : Platform.OS === "ios"
                ? Math.max(insets.top, 52)
                : insets.top,
            paddingBottom: embedded ? 0 : Math.max(insets.bottom, 10),
          }}
        >
          {embedded ? (
            <View
              style={{
                minHeight: 36,
                justifyContent: "center",
                paddingHorizontal: 4,
              }}
            >
              <Text
                numberOfLines={1}
                style={{ color: colors.ink, fontSize: 16, fontWeight: "600" }}
              >
                {section?.titleEn ?? bookId}
              </Text>
            </View>
          ) : (
            <View
              style={{
                height: 58,
                flexDirection: "row",
                alignItems: "center",
                gap: 9,
                paddingHorizontal: 15,
              }}
            >
              {!embedded ? (
                <Button
                  variant="ghost"
                  accessibilityLabel="Close Siddur reader"
                  onPress={() => setReader(false)}
                  style={button(colors)}
                >
                  <X size={20} color={colors.ink} />
                </Button>
              ) : null}
              <View
                style={{
                  flex: 1,
                  alignItems: embedded ? "flex-start" : "center",
                }}
              >
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
                accessibilityLabel="Reader menu"
                onPress={openReaderMenu}
                style={button(colors)}
              >
                <MoreHorizontal size={23} color={colors.ink} />
              </Button>
            </View>
          )}
          {!embedded ? (
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
          ) : null}
          <View
            style={{
              flex: 1,
              position: "relative",
              marginHorizontal: embedded ? -24 : 12,
            }}
          >
            <Animated.View
              ref={pageRef}
              collapsable={false}
              style={{
                flex: 1,
                marginHorizontal: embedded ? 24 : 0,
                borderRadius: 24,
                overflow: "hidden",
                transformOrigin: "bottom",
                backgroundColor: colors.vellum,
                opacity,
                transform: [
                  { translateX: slide },
                  { rotateZ: pageTilt },
                  { translateY: pageLift },
                ],
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
                  bounces={false}
                  directionalLockEnabled
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
            {embedded ? (
              <>
                <LinearGradient
                  colors={[colors.parchment, colors.vellum, colors.parchment]}
                  locations={[0, 0.5, 1]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 24,
                  }}
                />
                <LinearGradient
                  colors={[colors.parchment, colors.vellum, colors.parchment]}
                  locations={[0, 0.5, 1]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 24,
                  }}
                />
              </>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous page"
              onPress={() => goPage(-1)}
              style={{
                position: "absolute",
                left: -8,
                top: "50%",
                width: 44,
                height: 52,
                marginTop: -26,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              {language === "he" ? (
                <ChevronRight size={12} color={colors.inkMuted} />
              ) : (
                <ChevronLeft size={12} color={colors.inkMuted} />
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next page"
              onPress={() => goPage(1)}
              style={{
                position: "absolute",
                right: -8,
                top: "50%",
                width: 44,
                height: 52,
                marginTop: -26,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              {language === "he" ? (
                <ChevronLeft size={12} color={colors.inkMuted} />
              ) : (
                <ChevronRight size={12} color={colors.inkMuted} />
              )}
            </Pressable>
          </View>
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
              minHeight: embedded ? 30 : 54,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 18,
            }}
          >
            <Text
              accessibilityLabel={`Page ${pageIndex + 1} of ${pages.length}`}
              style={{
                color: colors.inkMuted,
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              Page {pageIndex + 1} of {pages.length}
            </Text>
          </View>
          <View style={{ marginTop: embedded ? 8 : 0 }}>
            <ChapterRuler
              sections={leaves}
              index={sectionIndex}
              onCommit={goSection}
            />
          </View>
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
                  <SearchBar
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search English or Hebrew"
                    accessibilityLabel="Search siddur section titles in English or Hebrew"
                    style={{ marginVertical: 16 }}
                  />
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
          <ReadingSettingsSheet
            visible={settings}
            onClose={() => setSettings(false)}
            language={language}
            onLanguageChange={switchLanguage}
            fontScale={fontScale}
            onFontScaleChange={setFontScale}
            bookId={bookId}
            book={book}
            catalog={catalog}
            onBookChange={(id) => {
              setSettings(false);
              void open(id);
            }}
            profile={profile}
            onProfileChange={setProfile}
            downloadStatus={download}
            onDownload={() => {
              setDownload("Starting download…");
              void downloadBook(bookId, (done, total) =>
                setDownload(`${done} of ${total} sections cached`),
              )
                .then(() => setDownload("Available offline"))
                .catch(() =>
                  setDownload("Download paused. Try again when connected."),
                );
            }}
          />
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
        </View>
      </ReaderHost>
    </View>
  );
}
