import type { LeaderboardEntry } from "@/src/lib/predictions/types";
import { cn } from "@/src/lib/ui/cn";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="border border-dashed border-ink p-6">
        <p className="display text-4xl text-ink/30">Tableau vierge.</p>
        <p className="editorial mt-2 text-lg text-ink/70">
          Le classement s&apos;ouvre dès le premier match corrigé. Pose ton prono pour y figurer.
        </p>
      </div>
    );
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-ink text-left">
          <th scope="col" className="label w-10 py-2 text-ink/60">
            #
          </th>
          <th scope="col" className="label py-2 text-ink/60">
            Supporter
          </th>
          <th scope="col" className="label py-2 text-right text-ink/60" title="Scores exacts">
            Exacts
          </th>
          <th scope="col" className="label hidden py-2 text-right text-ink/60 sm:table-cell" title="Bons résultats">
            Bons
          </th>
          <th scope="col" className="label hidden py-2 text-right text-ink/60 sm:table-cell" title="Matchs pronostiqués">
            MJ
          </th>
          <th scope="col" className="label py-2 text-right text-ink/60">
            Pts
          </th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => {
          const isMe = entry.userId === currentUserId;
          return (
            <tr
              key={entry.userId}
              className={cn("border-b border-ink/15 tabular", isMe && "bg-accent text-on-accent")}
              aria-current={isMe ? "true" : undefined}
            >
              <td className="py-2 font-mono font-bold">{entry.rank}</td>
              <td className="max-w-0 truncate py-2 font-bold uppercase">
                {entry.displayName}
                {isMe && <span className="label ml-2">· Toi</span>}
              </td>
              <td className="py-2 text-right">{entry.exactCount}</td>
              <td className="hidden py-2 text-right sm:table-cell">{entry.outcomeCount}</td>
              <td className="hidden py-2 text-right sm:table-cell">{entry.scoredCount}</td>
              <td className="display py-2 text-right text-2xl leading-none">{entry.totalPoints}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
