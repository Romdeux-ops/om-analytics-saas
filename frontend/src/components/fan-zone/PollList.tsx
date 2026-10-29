import { PollCard } from "@/src/components/fan-zone/PollCard";
import type { PollView } from "@/src/lib/fan-zone/types";

interface PollListProps {
  polls: PollView[];
  onPollClosed?: (pollId: number) => void;
}

export function PollList({ polls, onPollClosed }: PollListProps) {
  if (!polls.length) return null;

  const [featured, ...rest] = polls;

  return (
    <section className="space-y-5" aria-label="Sondages actifs">
      <h2 className="flex items-baseline justify-between border-t-[6px] border-ink pt-2">
        <span className="display text-3xl">Le vote du virage</span>
        <span className="label text-ink/50">{polls.length} sondage{polls.length > 1 ? "s" : ""}</span>
      </h2>
      <PollCard key={`${featured.id}-${featured.user_vote_option_id}`} poll={featured} featured onClosed={onPollClosed} />
      {rest.map((poll) => (
        <PollCard key={`${poll.id}-${poll.user_vote_option_id}`} poll={poll} onClosed={onPollClosed} />
      ))}
    </section>
  );
}
