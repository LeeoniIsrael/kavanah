import { queueCircle } from "@/services/network/outbox";
import { create } from "zustand";
import { readSocialData, writeSocialData } from "@/services/socialStorage";
import {
  dayKey,
  selectedQuote,
  shouldSharePrayer,
  STREAK_MILESTONES,
  weekKey,
  type SharingPreferences,
} from "@/services/socialPolicy";

export type SocialProfile = {
  displayName: string;
  handle: string;
  bio: string;
  isPrivate: boolean;
  shareMilestones: boolean;
};
export type FeedPost = {
  id: string;
  kind: "prayer" | "milestone" | "quote";
  createdAt: string;
  prayerId: string;
  practice: string;
  startedAt?: string;
  durationSeconds?: number;
  streak?: number;
  quote?: string;
  sourceRef?: string;
  sourceUrl?: string;
  language?: string;
  week?: string;
};
export type PrayerActivity = {
  id: string;
  prayerId: string;
  title: string;
  completedAt: Date;
  startedAt?: Date;
  streak: number;
  practiceKey?: string;
};
export type QuoteSource = {
  prayerId: string;
  title: string;
  text: string;
  sourceRef: string;
  sourceUrl: string;
  language: string;
};
type SavedSocial = {
  preferences: SharingPreferences;
  posts: FeedPost[];
  seenEvents: string[];
  seenDays: string[];
  hasPrayedEver: boolean;
};
type SocialState = SavedSocial & {
  profile: SocialProfile | null;
  saveProfile: (profile: SocialProfile) => void;
  setPreferences: (preferences: SharingPreferences) => void;
  recordPrayer: (activity: PrayerActivity) => void;
  setWeeklyQuote: (
    source: QuoteSource,
    start: number,
    end: number,
    now?: Date,
  ) => boolean;
  removePost: (id: string) => void;
};
const PROFILE_KEY = "social.profile.v1";
// Keep legacy free-form posts intact in v1; they are not part of the new feed.
const STORAGE_KEY = "social.activity.v2";
const profile = readSocialData(PROFILE_KEY, isSocialProfile);
const saved = readSocialData(STORAGE_KEY, isSavedSocial);
// Migrate the old daily option without discarding activity or sharing choices.
if (saved && (saved.preferences.prayers as string) === "first-daily") {
  saved.preferences.prayers = "first-ever";
}
function persist(state: SavedSocial): SavedSocial {
  const data = {
    hasPrayedEver: state.hasPrayedEver,
    preferences: state.preferences,
    posts: state.posts.slice(0, 200),
    seenEvents: state.seenEvents.slice(0, 1000),
    seenDays: state.seenDays.slice(0, 366),
  };
  writeSocialData(STORAGE_KEY, data);
  return data;
}
export const useSocialStore = create<SocialState>((set) => ({
  profile,
  preferences: saved?.preferences ?? {
    prayers: "off",
    milestones: profile?.shareMilestones ?? false,
  },
  posts: saved?.posts ?? [],
  seenEvents: saved?.seenEvents ?? [],
  seenDays: saved?.seenDays ?? [],
  hasPrayedEver:
    saved?.hasPrayedEver ??
    Boolean(saved?.seenEvents.length || saved?.seenDays.length),
  saveProfile: (profile) => {
    writeSocialData(PROFILE_KEY, profile);
    set({ profile });
  },
  setPreferences: (preferences) => {
    set((state) => persist({ ...state, preferences }));
    queueCircle(
      "circle_preferences",
      {
        prayer_mode: preferences.prayers,
        share_milestones: preferences.milestones,
      },
      "preferences",
    );
  },
  recordPrayer: (activity) =>
    set((state) => {
      if (state.seenEvents.includes(activity.id)) return state;
      queueCircle(
        "circle_record",
        {
          event: activity.id,
          prayer: activity.prayerId,
          started: activity.startedAt?.toISOString() ?? null,
          completed: activity.completedAt.toISOString(),
        },
        `record:${activity.id}`,
      );
      const date = dayKey(activity.completedAt);
      const base = {
        createdAt: activity.completedAt.toISOString(),
        prayerId: activity.prayerId,
        practice: activity.title,
        ...(activity.startedAt && activity.startedAt <= activity.completedAt
          ? {
              startedAt: activity.startedAt.toISOString(),
              durationSeconds: Math.floor(
                (activity.completedAt.getTime() -
                  activity.startedAt.getTime()) /
                  1000,
              ),
            }
          : {}),
      };
      const additions: FeedPost[] = [];
      if (shouldSharePrayer(state.preferences.prayers, !state.hasPrayedEver)) {
        additions.push({
          ...base,
          id: `prayer:${activity.id}`,
          kind: "prayer",
        });
      }
      const milestoneId = `milestone:${activity.practiceKey ?? activity.prayerId}:${activity.streak}:${date}`;
      if (
        state.preferences.milestones &&
        STREAK_MILESTONES.some((n) => n === activity.streak) &&
        !state.posts.some((p) => p.id === milestoneId) &&
        !state.seenEvents.includes(milestoneId)
      ) {
        additions.unshift({
          ...base,
          id: milestoneId,
          kind: "milestone",
          streak: activity.streak,
        });
      }
      return persist({
        ...state,
        hasPrayedEver: true,
        posts: [...additions, ...state.posts],
        seenEvents: [
          activity.id,
          ...(additions.some((p) => p.kind === "milestone")
            ? [milestoneId]
            : []),
          ...state.seenEvents,
        ],
        seenDays: [date, ...state.seenDays.filter((d) => d !== date)],
      });
    }),
  setWeeklyQuote: (source, start, end, now = new Date()) => {
    const quote = selectedQuote(source.text, start, end);
    if (!quote) return false;
    queueCircle(
      "circle_quote",
      {
        prayer: source.prayerId,
        passage_text: source.text,
        quote_language: source.language,
        first_word: Math.min(start, end),
        last_word: Math.max(start, end),
      },
      "quote",
    );
    const week = weekKey(now);
    set((state) =>
      persist({
        ...state,
        posts: [
          {
            id: `quote:${week}`,
            kind: "quote",
            quote,
            week,
            prayerId: source.prayerId,
            practice: source.title,
            sourceRef: source.sourceRef,
            sourceUrl: source.sourceUrl,
            language: source.language,
            createdAt: now.toISOString(),
          },
          ...state.posts.filter((p) => p.id !== `quote:${week}`),
        ],
      }),
    );
    return true;
  },
  removePost: (id) =>
    set((state) =>
      persist({ ...state, posts: state.posts.filter((p) => p.id !== id) }),
    ),
}));
function isSocialProfile(value: unknown): value is SocialProfile {
  if (typeof value !== "object" || !value) return false;
  const p = value as SocialProfile;
  return (
    typeof p.displayName === "string" &&
    typeof p.handle === "string" &&
    typeof p.bio === "string" &&
    typeof p.isPrivate === "boolean" &&
    typeof p.shareMilestones === "boolean"
  );
}
function isSavedSocial(value: unknown): value is SavedSocial {
  if (typeof value !== "object" || !value) return false;
  const s = value as SavedSocial;
  return (
    !!s.preferences &&
    ["off", "first-ever", "first-daily", "every"].includes(
      s.preferences.prayers,
    ) &&
    typeof s.preferences.milestones === "boolean" &&
    Array.isArray(s.posts) &&
    s.posts.every(
      (p) =>
        p &&
        ["prayer", "milestone", "quote"].includes(p.kind) &&
        typeof p.id === "string" &&
        typeof p.practice === "string" &&
        typeof p.prayerId === "string" &&
        typeof p.createdAt === "string" &&
        Number.isFinite(Date.parse(p.createdAt)) &&
        (p.kind !== "quote" || typeof p.quote === "string"),
    ) &&
    Array.isArray(s.seenEvents) &&
    s.seenEvents.every((x) => typeof x === "string") &&
    Array.isArray(s.seenDays) &&
    s.seenDays.every((x) => typeof x === "string")
  );
}
