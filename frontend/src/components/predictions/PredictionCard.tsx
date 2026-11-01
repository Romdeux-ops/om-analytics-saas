"use client";

import { useState } from "react";
import Link from "next/link";
import { PREDICTION_POINTS } from "@om/db/prediction-points";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { Button } from "@/src/components/ui/Button";
import { savePredictionAction } from "@/src/lib/predictions/actions";
import { MAX_PREDICTED_GOALS } from "@/src/lib/predictions/constants";
import type { MatchPredictionData, PredictionDistribution, Scoreline } from "@/src/lib/predictions/types";
import { cn } from "@/src/lib/ui/cn";
import { isOmTeam, shortTeamName } from "@/src/lib/ui/teams";

const PARIS_TZ = "Europe/Paris";

function formatDeadline(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TZ,
  }).format(new Date(iso));
}

interface PredictionCardProps {
  data: MatchPredictionData;
  /** Masque le lien vers le classement (déjà sur /pronostics). */
  hideLeaderboardLink?: boolean;
  className?: string;
}

export function PredictionCard({ data, hideLeaderboardLink = false, className }: PredictionCardProps) {
  const homeShort = shortTeamName(data.homeTeam);
  const awayShort = shortTeamName(data.awayTeam);

  return (
    <article className={cn("border border-ink border-t-[6px] bg-paper", className)}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink px-4 py-2">
        <span className="label flex items-center gap-2">
          <span className="bg-accent px-1.5 py-0.5 text-on-accent">Ton prono</span>
          <span className="text-ink/60">
            {homeShort} – {awayShort}
          </span>
        </span>
        <span className="label text-ink/60">
          {data.isOpen ? (
            <>
              Clôture au coup d&apos;envoi · <span className="capitalize">{formatDeadline(data.kickoff)}</span>
            </>
          ) : (
            "Pronos clos"
          )}
        </span>
      </header>

      {data.isOpen ? <OpenPrediction data={data} /> : <ClosedPrediction data={data} />}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-ink px-4 py-2">
        <p className="label text-ink/50">
          Score exact {PREDICTION_POINTS.exact} pts · Bon résultat {PREDICTION_POINTS.outcome} pt
        </p>
        {!hideLeaderboardLink && (
          <Link
            href="/pronostics"
            prefetch
            className="label inline-flex items-center gap-2 border-b-2 border-ink pb-0.5 hover:border-accent"
          >
            Classement des pronostiqueurs <span className="arrow">→</span>
          </Link>
        )}
      </footer>
    </article>
  );
}

function OpenPrediction({ data }: { data: MatchPredictionData }) {
  const { requireAuth } = useAuth();
  const [score, setScore] = useState<Scoreline>(data.mine ?? { home: 0, away: 0 });
  const [saved, setSaved] = useState<Scoreline | null>(data.mine);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = !saved || saved.home !== score.home || saved.away !== score.away;

  async function handleSave() {
    await requireAuth(async () => {
      setSaving(true);
      setError(null);
      const result = await savePredictionAction(data.matchId, score.home, score.away);
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(score);
    });
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <GoalStepper
          teamName={data.homeTeam}
          value={score.home}
          onChange={(home) => setScore((s) => ({ ...s, home }))}
        />
        <span className="display text-5xl text-ink/30" aria-hidden="true">
          –
        </span>
        <GoalStepper
          teamName={data.awayTeam}
          value={score.away}
          onChange={(away) => setScore((s) => ({ ...s, away }))}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Button onClick={handleSave} loading={saving} disabled={!isDirty}>
          {saved ? "Mettre à jour" : "Valider mon prono"}
        </Button>
        {saved && !isDirty && (
          <span className="label text-ink/60">
            <span className="mr-1.5 text-accent-text">●</span>
            Enregistré : {saved.home}–{saved.away}
          </span>
        )}
      </div>

      {error && (
        <p className="label mt-3 text-live-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function GoalStepper({
  teamName,
  value,
  onChange,
}: {
  teamName: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const short = shortTeamName(teamName);
  return (
    <div className="flex flex-col items-center gap-2">
      <span className={cn("label", isOmTeam(teamName) ? "text-accent-text" : "text-ink/70")}>{short}</span>
      <div className="flex items-center gap-2">
        <StepButton label={`Un but de moins pour ${short}`} disabled={value <= 0} onClick={() => onChange(value - 1)}>
          −
        </StepButton>
        <output className="display w-[1.4em] text-center text-7xl tabular leading-none" aria-label={`Buts ${short}`}>
          {value}
        </output>
        <StepButton
          label={`Un but de plus pour ${short}`}
          disabled={value >= MAX_PREDICTED_GOALS}
          onClick={() => onChange(value + 1)}
        >
          +
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center border border-ink font-mono text-lg font-bold transition-colors duration-100 hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function ClosedPrediction({ data }: { data: MatchPredictionData }) {
  const { mine, result, distribution } = data;

  return (
    <div className="grid gap-6 p-4 md:grid-cols-2">
      <div className="space-y-3">
        <div>
          <p className="label text-ink/60">Ton prono</p>
          <p className="display mt-1 text-6xl tabular leading-none">
            {mine ? (
              `${mine.home}–${mine.away}`
            ) : (
              <span className="text-ink/30">—</span>
            )}
          </p>
          {!mine && <p className="label mt-1 text-ink/50">Pas de prono pour ce match</p>}
        </div>

        {result ? (
          <div className="flex items-end gap-4 border-t border-ink pt-3">
            <div>
              <p className="label text-ink/60">Score final</p>
              <p className="display mt-1 text-4xl tabular leading-none">
                {result.home}–{result.away}
              </p>
            </div>
            {mine?.points != null && <PointsBadge points={mine.points} />}
          </div>
        ) : (
          <p className="label border-t border-ink pt-3 text-ink/50">
            Points attribués dès que le résultat officiel est synchronisé.
          </p>
        )}
      </div>

      <CommunityDistribution distribution={distribution} homeTeam={data.homeTeam} awayTeam={data.awayTeam} />
    </div>
  );
}

function PointsBadge({ points }: { points: number }) {
  return (
    <span
      className={cn(
        "label border border-ink px-2 py-1",
        points === PREDICTION_POINTS.exact && "bg-accent text-on-accent",
        points === PREDICTION_POINTS.outcome && "bg-ink text-paper",
        points === PREDICTION_POINTS.miss && "text-ink/60",
      )}
    >
      +{points} pt{points > 1 ? "s" : ""}
    </span>
  );
}

function CommunityDistribution({
  distribution,
  homeTeam,
  awayTeam,
}: {
  distribution: PredictionDistribution | null;
  homeTeam: string;
  awayTeam: string;
}) {
  if (!distribution || distribution.total === 0) {
    return (
      <div>
        <p className="label text-ink/60">La communauté</p>
        <p className="editorial mt-2 text-lg text-ink/60">Aucun prono enregistré pour ce match.</p>
      </div>
    );
  }

  const rows = [
    { label: `Victoire ${shortTeamName(homeTeam)}`, count: distribution.homeWin },
    { label: "Match nul", count: distribution.draw },
    { label: `Victoire ${shortTeamName(awayTeam)}`, count: distribution.awayWin },
  ];
  const leader = Math.max(...rows.map((r) => r.count));

  return (
    <div>
      <p className="label text-ink/60">
        La communauté · <span className="tabular">{distribution.total}</span> prono
        {distribution.total > 1 ? "s" : ""}
      </p>
      <ul className="mt-3 space-y-2.5" role="list">
        {rows.map((row) => {
          const pct = Math.round((row.count / distribution.total) * 100);
          const isLeader = row.count === leader && row.count > 0;
          return (
            <li key={row.label}>
              <span className="flex items-end justify-between gap-3">
                <span className="text-[12px] font-semibold uppercase tracking-wide">{row.label}</span>
                <span className={cn("display text-3xl leading-none tabular", isLeader ? "text-accent-text" : "text-ink/40")}>
                  {pct}
                  <span className="text-lg">%</span>
                </span>
              </span>
              <span className="mt-1 block h-2.5 border border-ink" aria-hidden="true">
                <span
                  className={cn("block h-full", isLeader ? "bg-accent" : "bg-ink")}
                  style={{ width: `${pct}%` }}
                />
              </span>
            </li>
          );
        })}
      </ul>
      {distribution.topScore && (
        <p className="label mt-3 text-ink/60">
          Score le plus joué :{" "}
          <span className="text-ink">
            {distribution.topScore.home}–{distribution.topScore.away}
          </span>{" "}
          ({distribution.topScore.count})
        </p>
      )}
    </div>
  );
}
