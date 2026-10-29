"use client";

import { useState } from "react";
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

const chip =
  "pressable inline-flex cursor-pointer items-center gap-1.5 border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors duration-100";

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
    <div className={cn("flex flex-wrap items-center gap-1.5", compact ? "mt-1" : "mt-3")}>
      <button
        type="button"
        onClick={() => requireAuth(onToggleLike)}
        className={cn(
          chip,
          userLiked
            ? "border-ink bg-ink text-paper"
            : "border-ink/30 text-ink/70 hover:border-ink hover:text-ink",
        )}
        aria-pressed={userLiked}
        aria-label={userLiked ? "Retirer le like" : "Aimer"}
      >
        <span aria-hidden="true">{userLiked ? "■" : "□"}</span>
        Allez
        {likeCount > 0 && <span className="tabular">{likeCount}</span>}
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => requireAuth(() => setPickerOpen((v) => !v))}
          className={cn(chip, "border-ink/30 text-ink/70 hover:border-ink hover:text-ink")}
          aria-expanded={pickerOpen}
          aria-label="Ajouter une réaction"
        >
          +{!compact && <span>Réagir</span>}
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
              className="absolute left-0 top-full z-20 mt-1 flex border border-ink bg-paper shadow-[4px_4px_0_0_var(--ink)]"
            >
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  role="menuitem"
                  onClick={() => handleReaction(emoji)}
                  className={cn(
                    "cursor-pointer border-r border-ink px-2.5 py-1.5 text-base last:border-r-0 hover:bg-accent",
                    userReaction === emoji && "bg-ink",
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
          className={cn(chip, "border-ink/30 text-ink/70 hover:border-ink hover:text-ink")}
          aria-label="Répondre"
        >
          Répondre <span aria-hidden="true">↩</span>
        </button>
      )}

      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => handleReaction(r.emoji)}
          className={cn(
            "pressable inline-flex cursor-pointer items-center gap-1 border px-1.5 py-0.5 text-xs",
            userReaction === r.emoji
              ? "border-ink bg-accent text-on-accent"
              : "border-ink/30 text-ink/70 hover:border-ink",
          )}
          aria-pressed={userReaction === r.emoji}
          aria-label={`${r.emoji}, ${r.count} réaction${r.count > 1 ? "s" : ""}`}
        >
          <span>{r.emoji}</span>
          <span className="tabular">{r.count}</span>
        </button>
      ))}
    </div>
  );
}
