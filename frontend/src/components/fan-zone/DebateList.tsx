import { DebateCard } from "@/src/components/fan-zone/DebateCard";
import type { DebateView } from "@/src/lib/fan-zone/types";

interface DebateListProps {
  debates: DebateView[];
  onDebateClosed?: (debateId: number) => void;
}

export function DebateList({ debates, onDebateClosed }: DebateListProps) {
  if (!debates.length) return null;

  return (
    <section className="mt-10 space-y-5" aria-label="Débats actifs">
      <h2 className="flex items-baseline justify-between border-t-[6px] border-ink pt-2">
        <span className="display text-3xl">Zone débat</span>
        <span className="label text-ink/50">{debates.length} en cours</span>
      </h2>
      {debates.map((debate) => (
        <DebateCard key={debate.id} debate={debate} onClosed={onDebateClosed} />
      ))}
    </section>
  );
}
