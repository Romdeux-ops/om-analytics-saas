"use client";

import { useState } from "react";
import { Heart, MessageCircle, SmilePlus } from "lucide-react";
import { cn } from "@/src/lib/ui/cn";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { EMOJI_REACTIONS } from "@/src/lib/fan-zone/constants";
import type { ReactionCount } from "@/src/lib/fan-zone/types";

interface MessageActionsProps {
  likeCount: number;
  userLiked: boolean;
  reactions: ReactionCount[];
  userReaction: string | null;
  onToggleLike: () => void;
  onToggleReaction: (emoji: string) => void;
  onStartReply: () => void;
  compact?: boolean;
}

export function MessageActions({
  likeCount,
  userLiked,
  reactions,
  userReaction,
  onToggleLike,
  onToggleReaction,
  onStartReply,
  compact = false,
}: MessageActionsProps) {
  const { requireAuth } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);

  function handleReaction(emoji: string) {
    requireAuth(() => {
      onToggleReaction(emoji);
      setPickerOpen(false);
    });
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact ? "mt-1" : "mt-3")}>
      <button
        type="button"
        onClick={() => requireAuth(onToggleLike)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
          userLiked
            ? "border-rose-400/40 bg-rose-500/15 text-rose-300"
            : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-rose-400/30 hover:text-rose-300",
        )}
        aria-pressed={userLiked}
        aria-label={userLiked ? "Retirer le like" : "Aimer"}
      >
        <Heart size={13} className={userLiked ? "fill-current" : ""} />
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => requireAuth(() => setPickerOpen((v) => !v))}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:border-violet-400/30 hover:text-violet-300"
          aria-expanded={pickerOpen}
          aria-label="Ajouter une réaction"
        >
          <SmilePlus size={13} />
          {!compact && <span>Réagir</span>}
        </button>

        {pickerOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-10 cursor-default"
              aria-label="Fermer le sélecteur"
              onClick={() => setPickerOpen(false)}
            />
            <div
              role="menu"
              className="absolute left-0 top-full z-20 mt-1 flex gap-0.5 rounded-xl border border-white/10 bg-[var(--bg-raise)] p-1.5 shadow-xl"
            >
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  role="menuitem"
                  onClick={() => handleReaction(emoji)}
                  className={cn(
                    "rounded-lg px-2 py-1 text-base transition-colors hover:bg-white/10",
                    userReaction === emoji && "bg-violet-500/20 ring-1 ring-violet-400/30",
                  )}
                  aria-label={`Réagir ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {!compact && (
        <button
          type="button"
          onClick={() => requireAuth(onStartReply)}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:border-cyan-400/30 hover:text-cyan-300"
          aria-label="Répondre"
        >
          <MessageCircle size={13} />
          <span>Répondre</span>
        </button>
      )}

      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => handleReaction(r.emoji)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
            userReaction === r.emoji
              ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
              : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]",
          )}
          aria-pressed={userReaction === r.emoji}
          aria-label={`${r.emoji}, ${r.count} réaction${r.count > 1 ? "s" : ""}`}
        >
          <span>{r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}
    </div>
  );
}
