import { DebateCard } from "@/src/components/fan-zone/DebateCard";
import type { DebateView } from "@/src/lib/fan-zone/types";

interface DebateListProps {
  debates: DebateView[];
  onDebateClosed?: (debateId: number) => void;
}

export function DebateList({ debates, onDebateClosed }: DebateListProps) {
  if (!debates.length) return null;

  return (
    <section className="mt-6 space-y-4" aria-label="Débats actifs">
      <h2 className="font-tech text-sm font-bold uppercase tracking-wider text-slate-400">
        Zone débat
      </h2>
      {debates.map((debate) => (
        <DebateCard key={debate.id} debate={debate} onClosed={onDebateClosed} />
      ))}
    </section>
  );
}
