"use client";

import { useCallback, useMemo, useState } from "react";
import { MoreHorizontal, Pin, Trash2 } from "lucide-react";
import { cn } from "@/src/lib/ui/cn";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { MessageActions } from "@/src/components/fan-zone/MessageActions";
import { ReplyComposer } from "@/src/components/fan-zone/ReplyComposer";
import { fetchMessageRepliesClient } from "@/src/lib/fan-zone/queries.client";
import {
  createReplyAction,
  toggleLikeAction,
  toggleReactionAction,
} from "@/src/lib/fan-zone/actions";
import { deleteMessageAction, pinMessageAction } from "@/src/lib/fan-zone/admin-actions";
import { REPLIES_PREVIEW } from "@/src/lib/fan-zone/constants";
import { formatRelativeTime, getInitials } from "@/src/lib/fan-zone/format";
import type { MessageView, ReactionCount } from "@/src/lib/fan-zone/types";

function replyCountLabel(count: number) {
  return `${count} réponse${count > 1 ? "s" : ""}`;
}

function applyEmojiOptimistic(
  reactions: ReactionCount[],
  userReaction: string | null,
  emoji: string,
  action: "added" | "removed" | "updated",
  prevEmoji?: string,
): { reactions: ReactionCount[]; user_reaction: string | null } {
  const next = reactions.map((r) => ({ ...r }));

  function bump(e: string, delta: number) {
    const idx = next.findIndex((r) => r.emoji === e);
    if (idx >= 0) {
      next[idx] = { ...next[idx], count: Math.max(0, next[idx].count + delta) };
      if (next[idx].count === 0) next.splice(idx, 1);
    } else if (delta > 0) {
      next.push({ emoji: e, count: delta });
    }
  }

  if (action === "removed") {
    bump(emoji, -1);
    return { reactions: next, user_reaction: null };
  }
  if (action === "updated" && prevEmoji) {
    bump(prevEmoji, -1);
    bump(emoji, 1);
    return { reactions: next, user_reaction: emoji };
  }
  bump(emoji, 1);
  return { reactions: next, user_reaction: emoji };
}

function mergeReplies(existing: MessageView[], incoming: MessageView[]): MessageView[] {
  const ids = new Set(existing.map((r) => r.id));
  const merged = [...existing];
  for (const reply of incoming) {
    if (!ids.has(reply.id)) {
      merged.push(reply);
      ids.add(reply.id);
    }
  }
  return merged.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

type EngagementOverride = Pick<
  MessageView,
  "like_count" | "user_liked" | "reactions" | "user_reaction" | "reply_count"
>;

interface MessageCardProps {
  message: MessageView;
  roomId: number;
  compact?: boolean;
  liveReplies?: MessageView[];
  onDeleted?: (messageId: number) => void;
  onPinned?: (messageId: number, pinned: boolean) => void;
}

export function MessageCard({
  message,
  roomId,
  compact = false,
  liveReplies = [],
  onDeleted,
  onPinned,
}: MessageCardProps) {
  const { isAdmin } = useAuth();
  const [engagementOverride, setEngagementOverride] = useState<EngagementOverride | null>(null);
  const [replies, setReplies] = useState<MessageView[]>([]);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [replyComposerOpen, setReplyComposerOpen] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const displayMessage = engagementOverride ? { ...message, ...engagementOverride } : message;
  const { profile, content, created_at, pending } = displayMessage;

  const allReplies = useMemo(() => mergeReplies(replies, liveReplies), [replies, liveReplies]);

  const loadReplies = useCallback(async () => {
    setLoadingReplies(true);
    try {
      const data = await fetchMessageRepliesClient(message.id);
      setReplies(data);
    } finally {
      setLoadingReplies(false);
    }
  }, [message.id]);

  async function handleOpenReplies() {
    setRepliesOpen(true);
    setShowAllReplies(false);
    if (allReplies.length === 0 && displayMessage.reply_count > 0) {
      await loadReplies();
    }
  }

  function handleStartReply() {
    setReplyComposerOpen(true);
    if (displayMessage.reply_count > 0 && !repliesOpen) {
      void handleOpenReplies();
    }
  }

  async function handleToggleLike() {
    const snapshot = displayMessage;
    const wasLiked = snapshot.user_liked;
    setEngagementOverride({
      user_liked: !wasLiked,
      like_count: Math.max(0, snapshot.like_count + (wasLiked ? -1 : 1)),
      reactions: snapshot.reactions,
      user_reaction: snapshot.user_reaction,
      reply_count: snapshot.reply_count,
    });

    const result = await toggleLikeAction(message.id);
    setEngagementOverride(null);
    if (!result.ok) {
      setEngagementOverride({
        user_liked: snapshot.user_liked,
        like_count: snapshot.like_count,
        reactions: snapshot.reactions,
        user_reaction: snapshot.user_reaction,
        reply_count: snapshot.reply_count,
      });
    }
  }

  async function handleToggleReaction(emoji: string) {
    const snapshot = displayMessage;
    const prevEmoji = snapshot.user_reaction;
    const optimisticAction =
      prevEmoji === emoji ? "removed" : prevEmoji ? "updated" : "added";
    const optimistic = applyEmojiOptimistic(
      snapshot.reactions,
      snapshot.user_reaction,
      emoji,
      optimisticAction,
      prevEmoji ?? undefined,
    );

    setEngagementOverride({
      like_count: snapshot.like_count,
      user_liked: snapshot.user_liked,
      reactions: optimistic.reactions,
      user_reaction: optimistic.user_reaction,
      reply_count: snapshot.reply_count,
    });

    const result = await toggleReactionAction(message.id, emoji);
    setEngagementOverride(null);
    if (!result.ok) {
      setEngagementOverride({
        like_count: snapshot.like_count,
        user_liked: snapshot.user_liked,
        reactions: snapshot.reactions,
        user_reaction: snapshot.user_reaction,
        reply_count: snapshot.reply_count,
      });
    }
  }

  async function handleReplySubmit(content: string): Promise<boolean> {
    const result = await createReplyAction(roomId, message.id, content);
    if (!result.ok) return false;

    setEngagementOverride({
      like_count: displayMessage.like_count,
      user_liked: displayMessage.user_liked,
      reactions: displayMessage.reactions,
      user_reaction: displayMessage.user_reaction,
      reply_count: displayMessage.reply_count + 1,
    });
    setRepliesOpen(true);
    setShowAllReplies(false);
    await loadReplies();
    setEngagementOverride(null);
    return true;
  }

  async function handleDelete() {
    if (!window.confirm("Supprimer ce message ?")) return;
    setAdminLoading(true);
    const result = await deleteMessageAction(message.id);
    setAdminLoading(false);
    setAdminMenuOpen(false);
    if (result.ok) onDeleted?.(message.id);
  }

  async function handlePinToggle() {
    const nextPinned = !displayMessage.is_pinned;
    setAdminLoading(true);
    const result = await pinMessageAction(message.id, nextPinned);
    setAdminLoading(false);
    setAdminMenuOpen(false);
    if (result.ok) onPinned?.(message.id, nextPinned);
  }

  const visibleReplies = showAllReplies ? allReplies : allReplies.slice(0, REPLIES_PREVIEW);
  const hiddenReplyCount = allReplies.length - REPLIES_PREVIEW;

  // Banderole légèrement de travers, de façon stable pour un même message
  const tilt = compact ? 0 : ((Math.abs(message.id * 37) % 5) - 2) * 0.35;

  return (
    <article
      className={cn(
        compact
          ? "flex gap-2 border-b border-ink/15 py-2 last:border-b-0"
          : "flex gap-3 border border-ink bg-paper p-4 transition-transform duration-150 hover:!rotate-0",
        pending && "opacity-60",
        displayMessage.is_pinned && !compact && "border-t-[6px] shadow-[4px_4px_0_0_var(--accent)]",
      )}
      style={tilt ? { rotate: `${tilt}deg` } : undefined}
      aria-busy={pending}
    >
      <div
        className={cn(
          "display flex shrink-0 items-center justify-center overflow-hidden border border-ink bg-ink text-paper",
          compact ? "h-7 w-7 text-sm" : "h-10 w-10 text-lg",
        )}
        aria-hidden="true"
      >
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover grayscale" />
        ) : (
          getInitials(profile.display_name)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline gap-2">
          <span className={cn("display text-ink", compact ? "text-lg" : "text-2xl")}>
            {profile.display_name}
          </span>
          <time className="text-[11px] tabular text-ink/50" dateTime={created_at}>
            {formatRelativeTime(created_at)}
          </time>
          {displayMessage.is_pinned && !compact && (
            <span className="label bg-accent px-1.5 py-0.5 text-on-accent">Épinglé</span>
          )}
          {pending && <span className="label text-ink/50">Envoi…</span>}
          {isAdmin && !pending && (
            <div className="relative ml-auto">
              <button
                type="button"
                onClick={() => setAdminMenuOpen((v) => !v)}
                className="pressable cursor-pointer border border-transparent p-1 text-ink/60 hover:border-ink hover:text-ink"
                aria-label="Actions admin"
                aria-expanded={adminMenuOpen}
                disabled={adminLoading}
              >
                <MoreHorizontal size={16} />
              </button>
              {adminMenuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Fermer le menu"
                    onClick={() => setAdminMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] border border-ink bg-paper shadow-[4px_4px_0_0_var(--ink)]"
                  >
                    {!compact && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handlePinToggle}
                        className="label flex w-full cursor-pointer items-center gap-2 border-b border-ink px-3 py-2.5 text-left hover:bg-ink hover:text-paper"
                      >
                        <Pin size={12} />
                        {displayMessage.is_pinned ? "Désépingler" : "Épingler"}
                      </button>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleDelete}
                      className="label flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-live-text hover:bg-live hover:text-on-accent"
                    >
                      <Trash2 size={12} />
                      Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </header>

        <p className={cn("mt-1 whitespace-pre-wrap break-words text-ink", compact ? "text-xs" : "text-[13px] leading-relaxed")}>
          {content}
        </p>

        {!pending && (
          <MessageActions
            likeCount={displayMessage.like_count}
            userLiked={displayMessage.user_liked}
            reactions={displayMessage.reactions}
            userReaction={displayMessage.user_reaction}
            onToggleLike={handleToggleLike}
            onToggleReaction={handleToggleReaction}
            onStartReply={handleStartReply}
            compact={compact}
          />
        )}

        {!compact && displayMessage.reply_count > 0 && !repliesOpen && (
          <button
            type="button"
            onClick={handleOpenReplies}
            aria-expanded={false}
            className="label mt-3 inline-flex cursor-pointer items-center gap-1.5 border-b-2 border-ink pb-0.5 hover:border-accent"
          >
            {replyCountLabel(displayMessage.reply_count)} <span aria-hidden="true">↓</span>
          </button>
        )}

        {replyComposerOpen && !compact && (
          <ReplyComposer
            onSubmit={handleReplySubmit}
            onCancel={() => setReplyComposerOpen(false)}
          />
        )}

        {repliesOpen && !compact && (
          <div className="mt-3 border-l-[3px] border-ink pl-3">
            {loadingReplies ? (
              <div className="space-y-2 py-1" aria-busy="true" aria-label="Chargement des réponses">
                <div className="h-10 animate-pulse bg-ink/10" />
                <div className="h-10 animate-pulse bg-ink/5" />
              </div>
            ) : allReplies.length === 0 ? (
              <p className="editorial text-base text-ink/55">Aucune réponse pour l&apos;instant.</p>
            ) : (
              <>
                {visibleReplies.map((reply) => (
                  <MessageCard
                    key={reply.id}
                    message={reply}
                    roomId={roomId}
                    compact
                    onDeleted={onDeleted}
                  />
                ))}
                {!showAllReplies && hiddenReplyCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllReplies(true)}
                    className="label cursor-pointer py-2 text-accent-text hover:underline"
                  >
                    Voir plus ({hiddenReplyCount} réponse{hiddenReplyCount > 1 ? "s" : ""})
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

