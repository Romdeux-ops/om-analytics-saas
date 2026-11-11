import { RotateCcw, Shuffle, Star } from "lucide-react";
import type { LivePlayerSummary } from "./LiveSimulationView";
import type { LiveState } from "@/src/lib/simulation/timeline";
import type { LiveStandingRow } from "@/src/lib/simulation/standings";

interface FullTimeSummaryProps {
  homeName: string;
  awayName: string;
  state: LiveState;
  best?: LivePlayerSummary;
  movements: LiveStandingRow[];
  seed: number;
  onReplay: () => void;
  onNewSimulation: () => void;
}

export function FullTimeSummary({ homeName, awayName, state, best, movements, seed, onReplay, onNewSimulation }: FullTimeSummaryProps) {
  const { score, stats } = state;
  const winner = score.home > score.away ? homeName : score.away > score.home ? awayName : null;

  return (
    <section className="ink-block grid gap-8 p-6 md:grid-cols-12 md:p-10" aria-label="Résumé du match">
      <div className="md:col-span-5">
        <p className="label text-paper/60">Coup de sifflet final · graine {seed}</p>
        <p className="display mt-3 text-[clamp(2.75rem,6vw,5rem)]">
          {winner ? (
            <>
              Victoire <span className="text-accent-inverse">{winner}</span>
            </>
          ) : (
            "Match nul"
          )}
        </p>
        <p className="display mt-2 text-5xl tabular text-paper/80">
          {score.home} – {score.away}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onReplay}
            className="label inline-flex items-center gap-2 border border-paper px-4 py-2.5 hover:bg-paper hover:text-ink"
          >
            <RotateCcw size={13} aria-hidden="true" /> Rejouer ce match
          </button>
          <button
            type="button"
            onClick={onNewSimulation}
            className="label inline-flex items-center gap-2 border border-paper bg-accent px-4 py-2.5 text-on-accent"
          >
            <Shuffle size={13} aria-hidden="true" /> Nouvelle simulation
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:col-span-4">
        <SummaryStat label="xG" value={`${stats.home.xg.toFixed(2)} – ${stats.away.xg.toFixed(2)}`} />
        <SummaryStat label="Tirs (cadrés)" value={`${stats.home.shots} (${stats.home.shotsOnTarget}) – ${stats.away.shots} (${stats.away.shotsOnTarget})`} />
        <SummaryStat label="Possession" value={`${stats.home.possession} – ${stats.away.possession} %`} />
        <SummaryStat label="Cartons" value={`${stats.home.yellow + stats.home.red} – ${stats.away.yellow + stats.away.red}`} />
        {best && (
          <div className="col-span-2 border-t border-paper/20 pt-4">
            <dt className="label inline-flex items-center gap-1.5 text-paper/60">
              <Star size={12} aria-hidden="true" /> Homme du match
            </dt>
            <dd className="mt-1 flex items-baseline justify-between gap-3">
              <span className="display truncate text-3xl">{best.name}</span>
              <span className="display text-4xl tabular text-accent-inverse">{best.rating.toFixed(1)}</span>
            </dd>
            <dd className="label mt-1 text-paper/55">{best.teamName}</dd>
          </div>
        )}
      </dl>

      <div className="md:col-span-3">
        <p className="label text-paper/60">Au classement</p>
        <ul className="mt-3 space-y-3">
          {movements.map((row) => (
            <li key={row.clubName} className="border-b border-paper/20 pb-2">
              <p className="text-[13px] font-semibold uppercase">{row.clubName}</p>
              <p className="display mt-1 text-3xl tabular">
                {row.baseRank}<sup className="text-base">e</sup> → {row.rank}
                <sup className="text-base">e</sup>
                <span className="label ml-2 align-middle text-paper/70">
                  {row.rankDelta > 0 ? `▲ ${row.rankDelta}` : row.rankDelta < 0 ? `▼ ${-row.rankDelta}` : "="}
                </span>
              </p>
              <p className="label text-paper/55">
                {row.points} pts ({row.pointsDelta > 0 ? `+${row.pointsDelta}` : "+0"})
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label text-paper/60">{label}</dt>
      <dd className="display mt-1 text-2xl tabular">{value}</dd>
    </div>
  );
}
