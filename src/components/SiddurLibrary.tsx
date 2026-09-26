import { useState } from "react";
import { Linking, View } from "react-native";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Text } from "./ui/text";
import { BookOpen, ChevronRight } from "./ui/icons";
import { useThemeColors } from "@/design/appearance";
import { useInterfaceStyles } from "@/design/layout";
import { readSocialData, writeSocialData } from "@/services/socialStorage";
import {
  siddurBooks,
  preferredSiddurBook,
  fitsDailyView,
  siddurEntries,
  searchSiddur,
  type SiddurBook,
} from "@/services/siddur";
import { usePrayerIdentityStore } from "@/store/prayerIdentityStore";
import { usePrayerStore } from "@/store/prayerStore";
import type { LiturgyIndexEntry } from "@/types/prayer";
const isBook = (v: unknown): v is SiddurBook =>
  siddurBooks.includes(v as SiddurBook);
export function SiddurLibrary({
  onOpen,
}: {
  onOpen: (entry: LiturgyIndexEntry) => void;
}) {
  const ui = useInterfaceStyles(),
    colors = useThemeColors();
  const identity = usePrayerIdentityStore((state) => state.identity);
  const [book, setBook] = useState<SiddurBook | null>(() => preferredSiddurBook(identity) ?? readSocialData("siddur.book", isBook));
  const [path, setPath] = useState<string[]>([]),
    [query, setQuery] = useState("");
  const last = readSocialData(
    "siddur.place",
    (v): v is string => typeof v === "string",
  );
  const savedIds = usePrayerStore((state) => state.bookmarkedPrayerIds);
  const [savedOnly, setSavedOnly] = useState(false);
  const entries = book ? siddurEntries(book).filter((entry) => fitsDailyView(entry, identity)) : [];
  const resume = entries.find((entry) => entry.id === last);
  const open = (entry: LiturgyIndexEntry) => {
    writeSocialData("siddur.place", entry.id);
    onOpen(entry);
  };
  if (!book)
    return (
      <View style={{ gap: 20 }}>
        <Text style={ui.editorial}>Your siddur, in one place.</Text>
        <Text style={ui.body}>
          Choose the prayer style that feels familiar. You can change it
          anytime.
        </Text>
        {siddurBooks.map((item) => (
          <Button
            key={item}
            variant="secondary"
            size="content"
            onPress={() => {
              setBook(item);
              writeSocialData("siddur.book", item);
            }}
            style={ui.row}
          >
            <BookOpen size={24} color={colors.blue} />
            <Text variant="section" style={{ flex: 1 }}>
              {item === "Siddur Ashkenaz" ? "Eastern European" : item === "Siddur Sefard" ? "Hasidic" : "Mediterranean & Middle Eastern"}
            </Text>
            <ChevronRight size={16} color={colors.inkMuted} />
          </Button>
        ))}
        <Text style={ui.caption}>
          Source library preview. Prayer text and personal practice guidance are still being reviewed.
        </Text>
      </View>
    );
  const filtered = query.trim() ? searchSiddur(book, query).filter((entry) => fitsDailyView(entry, identity)) : entries;
  const visible = savedOnly
    ? filtered.filter((entry) => savedIds.includes(entry.id))
    : filtered;
  const scoped =
    query.trim() || savedOnly
      ? visible
      : visible.filter((entry) =>
          path.every((part, i) => entry.path[i] === part),
        );
  const groups =
    query.trim() || savedOnly
      ? []
      : [
          ...new Set(
            scoped
              .filter((entry) => entry.path.length > path.length + 1)
              .map((entry) => entry.path[path.length]!),
          ),
        ];
  const leaves =
    query.trim() || savedOnly
      ? scoped
      : scoped.filter((entry) => entry.path.length <= path.length + 1);
  return (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text style={[ui.sectionTitle, { flex: 1 }]}>
          Your daily prayer book
        </Text>
        <Button
          variant="ghost"
          onPress={() => {
            setBook(null);
            setPath([]);
            setQuery("");
            setSavedOnly(false);
          }}
        >
          <Text>Change</Text>
        </Button>
      </View>
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="Find a section in this siddur"
        placeholderTextColor={colors.inkMuted}
        accessibilityLabel="Search siddur section titles in English or Hebrew"
        autoCorrect={false}
      />
      {resume && !query && !savedOnly && path.length === 0 ? (
        <Button
          variant="ghost"
          size="content"
          onPress={() => open(resume)}
          style={ui.feature}
        >
          <Text variant="caption">Continue reading</Text>
          <Text style={ui.editorial}>{resume.title}</Text>
          <Text style={ui.caption}>{resume.path.slice(0, -1).join(" · ")}</Text>
        </Button>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {[
          [false, "Contents"],
          [true, "Saved places"],
        ].map(([saved, label]) => (
          <Button
            key={String(label)}
            variant={savedOnly === saved ? "secondary" : "ghost"}
            onPress={() => {
              setSavedOnly(Boolean(saved));
              setPath([]);
            }}
            accessibilityState={{ selected: savedOnly === saved }}
          >
            <Text>{String(label)}</Text>
          </Button>
        ))}
      </View>
      {path.length > 0 && !query && !savedOnly ? (
        <Button
          variant="ghost"
          size="content"
          onPress={() => setPath(path.slice(0, -1))}
          style={{ alignItems: "flex-start", minHeight: 44 }}
        >
          <Text>
            ‹ {path.length === 1 ? "All contents" : path[path.length - 2]}
          </Text>
        </Button>
      ) : null}
      {path.length > 0 && !query && !savedOnly ? (
        <Text style={ui.sectionTitle}>{path[path.length - 1]}</Text>
      ) : null}
      {!query &&
      !savedOnly &&
      path.length === 0 &&
      book === "Siddur Ashkenaz" ? (
        <View style={{ gap: 8 }}>
          <Text style={ui.caption}>Go straight to</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {["Shacharit", "Minchah", "Maariv"].map((service) => (
              <Button
                key={service}
                variant="secondary"
                onPress={() => setPath(["Weekday", service])}
              >
                <Text>{service}</Text>
              </Button>
            ))}
          </View>
        </View>
      ) : null}
      <View style={ui.surface}>
        {groups.map((group) => (
          <Button
            key={group}
            variant="ghost"
            size="content"
            onPress={() => setPath([...path, group])}
            style={[
              ui.separator,
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 16,
              },
            ]}
          >
            <Text style={[ui.itemTitle, { flex: 1 }]}>{group}</Text>
            <ChevronRight size={16} color={colors.inkMuted} />
          </Button>
        ))}
        {leaves.slice(0, 60).map((entry) => (
          <Button
            key={entry.id}
            variant="ghost"
            size="content"
            onPress={() => open(entry)}
            style={[
              ui.separator,
              {
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 12,
              },
            ]}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={ui.itemTitle}>{entry.title}</Text>
              <Text style={ui.caption}>
                {query || savedOnly
                  ? entry.path.slice(0, -1).join(" · ")
                  : entry.hebrewTitle}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.inkMuted} />
          </Button>
        ))}
        {leaves.length > 60 ? (
          <Text style={ui.caption}>
            {leaves.length} sections match. Refine your search to narrow them
            down.
          </Text>
        ) : null}
        {!groups.length && !leaves.length ? (
          <Text style={ui.body}>
            {savedOnly
              ? "Bookmark a section while reading to keep it here."
              : "No sections found. Try a title in English or Hebrew."}
          </Text>
        ) : null}
      </View>
      <Text style={ui.caption}>
        Text opens from Sefaria when connected. Availability varies by section.
        This source library is not yet a rabbinically approved Kavanah siddur;
        gender-specific guidance is pending review.
      </Text>
      <Button
        variant="ghost"
        onPress={() =>
          void Linking.openURL(
            `https://www.sefaria.org/${encodeURIComponent(book.replaceAll(" ", "_"))}`,
          ).catch(() => undefined)
        }
      >
        <Text>View source and editions</Text>
      </Button>
    </View>
  );
}
