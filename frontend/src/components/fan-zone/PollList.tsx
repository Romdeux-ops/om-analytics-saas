import { PollCard } from "@/src/components/fan-zone/PollCard";
import type { PollView } from "@/src/lib/fan-zone/types";

interface PollListProps {
  polls: PollView[];
}

export function PollList({ polls }: PollListProps) {
  if (!polls.length) return null;

  const [featured, ...rest] = polls;

  return (
    <section className="space-y-4" aria-label="Sondages actifs">
      <PollCard key={`${featured.id}-${featured.user_vote_option_id}`} poll={featured} featured />
      {rest.map((poll) => (
        <PollCard key={`${poll.id}-${poll.user_vote_option_id}`} poll={poll} />
      ))}
    </section>
  );
}
