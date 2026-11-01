import Link from "next/link";
import { PREDICTION_POINTS } from "@om/db/prediction-points";
import type { PredictionHistoryItem } from "@/src/lib/predictions/types";
import { cn } from "@/src/lib/ui/cn";
import { shortTeamName } from "@/src/lib/ui/teams";

const PARIS_TZ = "Europe/Paris";

function formatDay(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: PARIS_TZ }).format(new Date(iso));
}

export function PredictionHistory({ items }: { items: PredictionHistoryItem[] }) {
  if (items.length === 0) {
    return <p className="editorial text-lg text-ink/60">Aucun prono cette saison pour l&apos;instant.</p>;
  }

  return (
    <ul className="border-t border-ink" role="list">
      {items.map((item) => {
        const { prediction, result } = item;
        return (
          <li key={item.matchId}>
            <Link
              href={`/simulation/${item.matchId}`}
              prefetch={false}
              className="grid grid-cols-[4rem_1fr_auto_auto] items-center gap-3 border-b border-ink py-2.5 transition-colors duration-100 hover:bg-ink hover:text-paper"
            >
              <span className="label opacity-60">{formatDay(item.kickoff)}</span>
              <span className="truncate text-sm font-bold uppercase">
                {shortTeamName(item.homeTeam)} – {shortTeamName(item.awayTeam)}
              </span>
              <span className="text-right font-mono text-sm tabular">
                {prediction.home}–{prediction.away}
                {result && (
                  <span className="opacity-50">
                    {" "}
                    / {result.home}–{result.away}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "label w-14 border border-current px-1.5 py-0.5 text-center",
                  prediction.points === PREDICTION_POINTS.exact && "bg-accent text-on-accent",
                )}
              >
                {prediction.points == null ? "—" : `+${prediction.points}`}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
