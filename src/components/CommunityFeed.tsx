import {
  Heart,
  MessageCircle,
  PenLine,
  Share2,
  Sparkles,
} from "lucide-react-native";
import { useState } from "react";
import { Modal, Share as NativeShare, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GooeyInfoPopover } from "@/components/ui/gooey-popover";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { colors } from "@/design/theme";
import { useSocialStore, type FeedPost } from "@/store/socialStore";

export function CommunityFeed(): React.JSX.Element {
  const { profile, posts, publishPost, toggleLike } = useSocialStore();
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <View className="gap-4">
      <View className="flex-row items-end justify-between gap-3">
        <View className="gap-1 flex-1">
          <Text variant="section" className="text-[22px] leading-[28px]">
            Your circle
          </Text>
          <Text variant="body" className="text-[13px] leading-[18px]">
            Reflections and milestones from people you follow.
          </Text>
        </View>
        <Button
          variant="default"
          size="content"
          accessibilityRole="button"
          onPress={() => setComposerOpen(true)}
          className="min-h-11 px-4 rounded-full flex-row items-center gap-2 bg-primary"
        >
          <PenLine size={16} color={colors.white} />
          <Text className="text-white font-heading text-[13px]">Post</Text>
        </Button>
      </View>

      <View className="border-l-2 border-l-gold pl-4 gap-7">
        {posts.map((post) => (
          <FeedPostRow
            key={post.id}
            post={post}
            onLike={() => toggleLike(post.id)}
          />
        ))}
      </View>

      <Modal
        visible={composerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setComposerOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-background px-6 py-4 gap-6">
          <View className="flex-row items-center justify-between">
            <Button
              variant="ghost"
              size="content"
              onPress={() => setComposerOpen(false)}
              className="min-h-11 px-2"
            >
              <Text variant="section" className="text-[15px]">
                Cancel
              </Text>
            </Button>
            <Text variant="section">Share a perspective</Text>
            <Button
              variant="default"
              size="content"
              disabled={!profile || !draft.trim()}
              onPress={() => {
                publishPost(draft);
                setDraft("");
                setComposerOpen(false);
              }}
              className="min-h-11 px-4 rounded-full bg-primary"
            >
              <Text className="text-white font-heading text-[13px]">
                Publish
              </Text>
            </Button>
          </View>
          {profile ? (
            <Input
              accessibilityLabel="Post text"
              value={draft}
              onChangeText={setDraft}
              multiline
              autoFocus
              placeholders={[
                "What stayed with you from prayer?",
                "What did you notice in your learning?",
                "Share one thought you want to carry forward…",
              ]}
              className="h-48 p-4 text-[18px] leading-[26px] bg-card"
            />
          ) : (
            <Card className="gap-2">
              <Text variant="section">Create your profile first</Text>
              <Text variant="body">
                Set up your name and privacy from the Profile tab before
                publishing.
              </Text>
            </Card>
          )}
          <View className="flex-row gap-2 items-start">
            <Sparkles size={16} color={colors.gold} />
            <Text variant="body" className="flex-1 text-[13px] leading-[19px]">
              Share the lesson, not private prayer text or someone else’s story.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function FeedPostRow({
  post,
  onLike,
}: {
  post: FeedPost;
  onLike: () => void;
}): React.JSX.Element {
  const initial = post.authorName.trim().charAt(0).toUpperCase();
  return (
    <View className="relative gap-3">
      <View className="absolute -left-[23px] top-4 w-3 h-3 rounded-full bg-gold border-2 border-background" />
      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
          <Text className="text-white font-heading">{initial}</Text>
        </View>
        <View className="flex-1">
          <Text variant="section" className="text-[15px] leading-[20px]">
            {post.authorName}
          </Text>
          <Text variant="body" className="text-[12px] leading-[17px]">
            {post.authorHandle} · {relativeTime(post.createdAt)}
          </Text>
        </View>
        {post.kind === "milestone" && post.streak ? (
          <View className="px-3 py-1 rounded-full bg-accent">
            <Text className="text-primary font-heading text-[12px]">
              {post.streak} days
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        variant="body"
        className="text-[16px] leading-[24px] text-foreground"
      >
        {post.body}
      </Text>
      {post.practice ? (
        <Text className="text-[12px] leading-[17px] text-muted-foreground font-label">
          {post.practice}
        </Text>
      ) : null}
      <View className="flex-row gap-5">
        <Button
          variant="ghost"
          size="content"
          onPress={onLike}
          className="min-h-10 flex-row items-center gap-2"
        >
          <Heart
            size={17}
            color={post.liked ? colors.gold : colors.inkMuted}
            fill={post.liked ? colors.gold : "transparent"}
          />
          <Text className="text-[12px] text-muted-foreground font-label">
            {post.likes}
          </Text>
        </Button>
        <GooeyInfoPopover
          accessibilityLabel="About comments"
          title="Conversation is still private"
          body="Comments will appear after connected accounts and moderation controls are ready. For now, share a reflection directly."
          side="bottom"
          align="start"
          triggerStyle={{
            alignItems: "center",
            backgroundColor: colors.mineral,
            borderRadius: 22,
            height: 44,
            justifyContent: "center",
            width: 44,
          }}
          trigger={<MessageCircle size={17} color={colors.inkMuted} />}
        />
        <Button
          variant="ghost"
          size="content"
          accessibilityLabel="Share post or send as a reminder"
          onPress={() =>
            void NativeShare.share({
              message: `${post.body}\n\nShared from Kavanah`,
            })
          }
          className="min-h-10"
        >
          <Share2 size={17} color={colors.inkMuted} />
        </Button>
      </View>
    </View>
  );
}

function relativeTime(iso: string): string {
  const hours = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000),
  );
  if (hours < 1) return "now";
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
