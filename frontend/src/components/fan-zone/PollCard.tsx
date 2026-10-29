"use client";

import { useState } from "react";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { castVoteAction } from "@/src/lib/fan-zone/actions";
import { closePollAction } from "@/src/lib/fan-zone/admin-actions";
import { cn } from "@/src/lib/ui/cn";
import type { PollView } from "@/src/lib/fan-zone/types";

interface PollCardProps {
  poll: PollView;
  featured?: boolean;
  onClosed?: (pollId: number) => void;
}

export function PollCard({ poll, featured = false, onClosed }: PollCardProps) {
  const { requireAuth, isAdmin } = useAuth();
  const [localPoll, setLocalPoll] = useState(poll);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [closing, setClosing] = useState(false);

  const totalVotes = localPoll.options.reduce((sum, o) => sum + o.vote_count, 0);
  const hasVoted = localPoll.user_vote_option_id !== null;
  const isClosed =
    !localPoll.is_active ||
    Boolean(localPoll.closes_at && new Date(localPoll.closes_at) < new Date());

  async function handleVote(optionId: number) {
    if (hasVoted || isClosed || voting) return;

    await requireAuth(async () => {
      setVoting(true);
      setError(null);

      const prev = localPoll;
      setLocalPoll({
        ...localPoll,
        user_vote_option_id: optionId,
        options: localPoll.options.map((o) =>
          o.id === optionId ? { ...o, vote_count: o.vote_count + 1 } : o,
        ),
      });

      const result = await castVoteAction(localPoll.id, optionId);
      setVoting(false);

      if (!result.ok) {
        setLocalPoll(prev);
        setError(result.error);
      }
    });
  }

  async function handleClosePoll() {
    if (isClosed || closing) return;
    setClosing(true);
    setError(null);

    const result = await closePollAction(localPoll.id);
    setClosing(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setLocalPoll({
      ...localPoll,
      is_active: false,
      closes_at: new Date().toISOString(),
    });
    onClosed?.(localPoll.id);
  }

  const showResults = hasVoted || isClosed;
  const leaderVotes = Math.max(0, ...localPoll.options.map((o) => o.vote_count));

  return (
    <article
      className={cn(
        "border border-ink bg-paper",
        featured ? "border-t-[6px] shadow-[6px_6px_0_0_var(--ink)]" : "",
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink px-4 py-2">
        <span className="label flex items-center gap-2">
          <span className={featured ? "bg-accent px-1.5 py-0.5 text-on-accent" : ""}>
            {featured ? "Match du jour" : "Sondage"}
          </span>
          {isClosed && <span className="text-ink/50">· Clos</span>}
        </span>
        {isAdmin && !isClosed && (
          <button
            type="button"
            onClick={handleClosePoll}
            disabled={closing}
            className="label border-b border-ink pb-0.5 hover:border-live hover:text-live-text disabled:opacity-40"
          >
            {closing ? "Fermeture…" : "Fermer le vote"}
          </button>
        )}
      </header>

      <div className="p-4">
        <h3 className="display text-3xl leading-[0.95] text-ink">{localPoll.question}</h3>

        <ul className="mt-5 space-y-3" role="list">
          {localPoll.options.map((option) => {
            const pct = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0;
            const isSelected = localPoll.user_vote_option_id === option.id;
            const isLeader = showResults && totalVotes > 0 && option.vote_count === leaderVotes;

            return (
              <li key={option.id}>
                <button
                  type="button"
                  disabled={hasVoted || isClosed || voting}
                  onClick={() => handleVote(option.id)}
                  className={cn(
                    "group block w-full text-left disabled:cursor-default",
                    !showResults && "cursor-pointer border border-ink px-3 py-2.5 transition-colors duration-100 hover:bg-ink hover:text-paper",
                  )}
                  aria-pressed={isSelected}
                  aria-label={`Voter pour ${option.label}`}
                >
                  {showResults ? (
                    <>
                      <span className="flex items-end justify-between gap-3">
                        <span className="text-[13px] font-semibold uppercase tracking-wide">
                          {isSelected && <span className="mr-1.5 text-accent-text">●</span>}
                          {option.label}
                        </span>
                        <span className={cn("display text-5xl leading-none tabular", isLeader ? "text-accent-text" : "text-ink/40")}>
                          {pct}
                          <span className="text-2xl">%</span>
                        </span>
                      </span>
                      <span className="mt-1.5 block h-3 border border-ink" aria-hidden="true">
                        <span
                          className={cn("block h-full transition-[width] duration-500", isLeader ? "bg-accent" : "bg-ink")}
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                    </>
                  ) : (
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold uppercase tracking-wide">{option.label}</span>
                      <span className="arrow" aria-hidden="true">→</span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="label mt-4 text-ink/50">
          <span className="tabular">{totalVotes}</span> vote{totalVotes !== 1 ? "s" : ""}
          {!hasVoted && !isClosed && " · Choisis ton camp"}
        </p>

        {error && (
          <p className="label mt-2 text-live-text" role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
