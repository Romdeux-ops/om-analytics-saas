"use client";

import { useState } from "react";
import { BarChart3, Lock } from "lucide-react";
import { Card } from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
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

    requireAuth(async () => {
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

  return (
    <Card variant={featured ? "hero" : "flat"} className={featured ? "border-violet-400/20" : ""}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-violet-400" aria-hidden="true" />
          {featured && <Badge variant="om">Match du jour</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {isClosed && <Badge variant="muted">Clos</Badge>}
          {isAdmin && !isClosed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClosePoll}
              disabled={closing}
              className="text-amber-300 hover:text-amber-200"
            >
              <Lock size={13} />
              Fermer
            </Button>
          )}
        </div>
      </div>

      <h3 className="font-tech text-lg font-bold text-white">{localPoll.question}</h3>

      <ul className="mt-4 space-y-2" role="list">
        {localPoll.options.map((option) => {
          const pct = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0;
          const isSelected = localPoll.user_vote_option_id === option.id;

          return (
            <li key={option.id}>
              <button
                type="button"
                disabled={hasVoted || isClosed || voting}
                onClick={() => handleVote(option.id)}
                className={cn(
                  "relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left transition-colors",
                  isSelected
                    ? "border-violet-400/40 bg-violet-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-violet-400/25 hover:bg-white/[0.04]",
                  (hasVoted || isClosed) && "cursor-default",
                )}
                aria-pressed={isSelected}
                aria-label={`Voter pour ${option.label}`}
              >
                {(hasVoted || isClosed) && (
                  <span
                    className="absolute inset-y-0 left-0 bg-violet-500/15 transition-all"
                    style={{ width: `${pct}%` }}
                    aria-hidden="true"
                  />
                )}
                <span className="relative flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">{option.label}</span>
                  {(hasVoted || isClosed) && (
                    <span className="text-xs text-slate-400">{pct}%</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-slate-500">
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        {!hasVoted && !isClosed && " · Cliquez pour voter"}
      </p>

      {error && (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}
