"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronDown, MoreHorizontal, Pin, Trash2 } from "lucide-react";
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
import type { MessageView, ReactionCount } from "@/src/lib/fan-zone/types";

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
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

function replyCountLabel(count: number) {
  return `${count} réponse${count > 1 ? "s" : ""}`;
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

  return (
    <article
      className={cn(
        compact ? "flex gap-2 py-2" : "flex gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4",
        pending && "opacity-60",
        displayMessage.is_pinned && !compact && "border-amber-400/30 bg-amber-500/5",
      )}
      aria-busy={pending}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 font-bold text-violet-200 ring-1 ring-violet-400/20",
          compact ? "h-7 w-7 text-[10px]" : "h-10 w-10 text-sm",
        )}
        aria-hidden="true"
      >
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
        ) : (
          getInitials(profile.display_name)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline gap-2">
          <span className={cn("font-tech font-bold text-white", compact && "text-sm")}>
            {profile.display_name}
          </span>
          <time className="text-xs text-slate-500" dateTime={created_at}>
            {formatRelativeTime(created_at)}
          </time>
          {displayMessage.is_pinned && !compact && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              Épinglé
            </span>
          )}
          {pending && (
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Envoi...</span>
          )}
          {isAdmin && !pending && (
            <div className="relative ml-auto">
              <button
                type="button"
                onClick={() => setAdminMenuOpen((v) => !v)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
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
                    className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] rounded-xl border border-white/10 bg-[var(--bg-raise)] p-1 shadow-xl"
                  >
                    {!compact && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handlePinToggle}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/10"
                      >
                        <Pin size={13} />
                        {displayMessage.is_pinned ? "Désépingler" : "Épingler"}
                      </button>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleDelete}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={13} />
                      Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </header>

        <p className={cn("mt-1 whitespace-pre-wrap break-words text-slate-200", compact ? "text-xs" : "text-sm")}>
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
            className="mt-2 flex items-center gap-1 text-xs font-medium text-cyan-400 transition-colors hover:text-cyan-300"
          >
            <ChevronDown size={14} />
            {replyCountLabel(displayMessage.reply_count)}
          </button>
        )}

        {replyComposerOpen && !compact && (
          <ReplyComposer
            onSubmit={handleReplySubmit}
            onCancel={() => setReplyComposerOpen(false)}
          />
        )}

        {repliesOpen && !compact && (
          <div className="mt-3 space-y-1 border-l-2 border-violet-400/20 pl-3">
            {loadingReplies ? (
              <p className="text-xs text-slate-500">Chargement des réponses...</p>
            ) : allReplies.length === 0 ? (
              <p className="text-xs text-slate-500">Aucune réponse pour l&apos;instant.</p>
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
                    className="py-2 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
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

