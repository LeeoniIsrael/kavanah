import { create } from "zustand";

import { readJson, userStorage, writeJson } from "@/services/mmkv";

export type SocialProfile = {
  displayName: string;
  handle: string;
  bio: string;
  isPrivate: boolean;
  shareMilestones: boolean;
};

export type FeedPost = {
  id: string;
  authorName: string;
  authorHandle: string;
  kind: "reflection" | "milestone" | "lesson";
  body: string;
  createdAt: string;
  practice?: string;
  streak?: number;
  likes: number;
  liked: boolean;
};

type SocialState = {
  profile: SocialProfile | null;
  posts: FeedPost[];
  saveProfile: (profile: SocialProfile) => void;
  publishPost: (body: string, kind?: FeedPost["kind"]) => void;
  publishMilestone: (practice: string, streak: number) => void;
  toggleLike: (id: string) => void;
};

const PROFILE_KEY = "social.profile.v1";
const POSTS_KEY = "social.posts.v1";

const communityPosts: FeedPost[] = [
  {
    id: "community-miriam",
    authorName: "Miriam L.",
    authorHandle: "@miriaml",
    kind: "reflection",
    body: "I slowed down for one line of Modeh Ani this morning: gratitude before momentum.",
    createdAt: "2026-09-20T12:10:00.000Z",
    practice: "Morning prayer",
    likes: 18,
    liked: false,
  },
  {
    id: "community-avi",
    authorName: "Avi R.",
    authorHandle: "@avir",
    kind: "milestone",
    body: "One hundred mornings of wrapping. The streak matters less than who I became by returning.",
    createdAt: "2026-09-19T13:30:00.000Z",
    practice: "Tefillin",
    streak: 100,
    likes: 64,
    liked: false,
  },
  {
    id: "community-noa",
    authorName: "Noa S.",
    authorHandle: "@noalearns",
    kind: "lesson",
    body: "A lesson I’m carrying today: fixed words can still hold a new intention each time.",
    createdAt: "2026-09-18T22:05:00.000Z",
    practice: "Daily learning",
    likes: 27,
    liked: false,
  },
];

const persistedProfile = readJson(userStorage, PROFILE_KEY, isSocialProfile);
const persistedPosts = readJson(userStorage, POSTS_KEY, isFeedPostArray) ?? [];

export const useSocialStore = create<SocialState>((set, get) => ({
  profile: persistedProfile,
  posts: [...persistedPosts, ...communityPosts],
  saveProfile: (profile) => {
    writeJson(userStorage, PROFILE_KEY, profile);
    set({ profile });
  },
  publishPost: (body, kind = "reflection") => {
    const clean = body.trim();
    const profile = get().profile;
    if (!clean || !profile) return;
    const post: FeedPost = {
      id: `local-${Date.now()}`,
      authorName: profile.displayName,
      authorHandle: profile.handle,
      kind,
      body: clean,
      createdAt: new Date().toISOString(),
      likes: 0,
      liked: false,
    };
    set((state) => {
      const localPosts = [post, ...state.posts.filter((item) => item.id.startsWith("local-"))];
      writeJson(userStorage, POSTS_KEY, localPosts);
      return { posts: [post, ...state.posts] };
    });
  },
  publishMilestone: (practice, streak) => {
    const profile = get().profile;
    if (!profile || !profile.shareMilestones) return;
    const post: FeedPost = {
      id: `local-${Date.now()}`,
      authorName: profile.displayName,
      authorHandle: profile.handle,
      kind: "milestone",
      body: `${streak} days of ${practice}. Grateful to keep returning.`,
      createdAt: new Date().toISOString(),
      practice,
      streak,
      likes: 0,
      liked: false,
    };
    set((state) => {
      const localPosts = [post, ...state.posts.filter((item) => item.id.startsWith("local-"))];
      writeJson(userStorage, POSTS_KEY, localPosts);
      return { posts: [post, ...state.posts] };
    });
  },
  toggleLike: (id) => set((state) => ({
    posts: state.posts.map((post) => post.id === id
      ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) }
      : post),
  })),
}));

function isSocialProfile(value: unknown): value is SocialProfile {
  if (typeof value !== "object" || value === null) return false;
  const profile = value as Partial<SocialProfile>;
  return typeof profile.displayName === "string" && typeof profile.handle === "string" && typeof profile.bio === "string" && typeof profile.isPrivate === "boolean" && typeof profile.shareMilestones === "boolean";
}

function isFeedPostArray(value: unknown): value is FeedPost[] {
  return Array.isArray(value) && value.every((item) => {
    if (typeof item !== "object" || item === null) return false;
    const post = item as Partial<FeedPost>;
    return typeof post.id === "string" && typeof post.body === "string" && typeof post.authorName === "string" && typeof post.createdAt === "string";
  });
}
