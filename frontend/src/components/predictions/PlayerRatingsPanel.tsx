"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/components/auth/AuthProvider";
import { Button } from "@/src/components/ui/Button";
import { SectionHeading } from "@/src/components/ui/SectionHeading";
import { submitRatingsAction } from "@/src/lib/predictions/actions";
import { RATING_DEFAULT, RATING_MAX, RATING_MIN, RATING_STEP } from "@/src/lib/predictions/constants";
import type { MatchRatingsData, MotmSummary, PlayerRatingSummary, RateablePlayer } from "@/src/lib/predictions/types";
import { formatRating } from "@/src/lib/predictions/window";
import { cn } from "@/src/lib/ui/cn";
import { shortTeamName } from "@/src/lib/ui/teams";

const PARIS_TZ = "Europe/Paris";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TZ,
  }).format(new Date(iso));
}

interface PlayerRatingsPanelProps {
  data: MatchRatingsData;
}

export function PlayerRatingsPanel({ data }: PlayerRatingsPanelProps) {
  const router = useRouter();
  const { requireAuth, user } = useAuth();
  const [ratings, setRatings] = useState<Record<string, number>>(data.mine);
  const [motm, setMotm] = useState<string | null>(data.myMotm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const hasVoted = Object.keys(data.mine).length > 0;
  const isOpen = data.window === "open";
  const showCommunity = data.window === "closed" || hasVoted;
  const summaryByKey = useMemo(() => new Map(data.summary.map((s) => [s.key, s])), [data.summary]);

  const starters = data.players.filter((p) => p.starter);
  const substitutes = data.players.filter((p) => !p.starter);

  function setRating(key: string, value: number | null) {
    setJustSaved(false);
    setRatings((prev) => {
      const next = { ...prev };
      if (value === null) delete next[key];
      else next[key] = value;
      return next;
    });
    if (value === null && motm === key) setMotm(null);
  }

  function toggleMotm(key: string) {
    setJustSaved(false);
    setMotm((current) => (current === key ? null : key));
    if (ratings[key] === undefined) setRating(key, RATING_DEFAULT);
  }

  async function handleSubmit() {
    await requireAuth(async () => {
      setSaving(true);
      setError(null);
      const result = await submitRatingsAction(
        data.matchId,
        Object.entries(ratings).map(([playerKey, rating]) => ({ playerKey, rating })),
        motm,
      );
      setSaving(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setJustSaved(true);
      router.refresh();
    });
  }

  if (data.window === "upcoming") {
    return (
      <section className="border-y-[6px] border-ink py-10">
        <p className="label text-ink/60">Notes des fans</p>
        <p className="display mt-3 text-5xl text-ink/40 md:text-7xl">Pas encore.</p>
        <p className="editorial mt-3 max-w-xl text-xl text-ink/70">
          Les notes ouvrent <span className="capitalize">{formatDateTime(data.opensAt)}</span>, deux heures après le
          coup d&apos;envoi.
        </p>
      </section>
    );
  }

  if (data.players.length === 0) {
    return (
      <section className="border-y-[6px] border-ink py-10">
        <p className="label text-ink/60">Notes des fans</p>
        <p className="editorial mt-3 max-w-xl text-xl text-ink/70">
          La composition de l&apos;OM pour ce match n&apos;est pas disponible : impossible de noter les joueurs.
        </p>
      </section>
    );
  }

  const ratedCount = Object.keys(ratings).length;

  return (
    <div className="space-y-10">
      <section>
        <SectionHeading
          title="Les notes des fans"
          subtitle={`${data.teamName ? shortTeamName(data.teamName) : "OM"} · de ${RATING_MIN} à ${RATING_MAX}, par demi-point`}
          action={
            <span className={cn("px-2 py-1", isOpen ? "bg-accent text-on-accent" : "bg-ink text-paper")}>
              {isOpen ? (
                <>
                  Ouvert jusqu&apos;au <span className="capitalize">{formatDateTime(data.closesAt)}</span>
                </>
              ) : (
                "Votes clos"
              )}
            </span>
          }
        />

        {!showCommunity && (
          <p className="editorial mb-4 text-lg text-ink/70">
            Note les joueurs que tu as vus et désigne ton homme du match. Les moyennes de la communauté
            s&apos;affichent une fois ton vote envoyé.
          </p>
        )}

        <PlayerGroup
          title="Titulaires"
          players={starters}
          ratings={ratings}
          motm={motm}
          summaryByKey={summaryByKey}
          showCommunity={showCommunity}
          editable={isOpen}
          onRate={setRating}
          onToggleMotm={toggleMotm}
        />

        {substitutes.length > 0 && (
          <PlayerGroup
            title="Remplaçants (s'ils sont entrés en jeu)"
            players={substitutes}
            ratings={ratings}
            motm={motm}
            summaryByKey={summaryByKey}
            showCommunity={showCommunity}
            editable={isOpen}
            onRate={setRating}
            onToggleMotm={toggleMotm}
            className="mt-8"
          />
        )}

        {isOpen && (
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t-[6px] border-ink pt-4">
            <Button onClick={handleSubmit} loading={saving} disabled={ratedCount === 0}>
              {hasVoted ? "Mettre à jour mes notes" : "Valider mes notes"}
            </Button>
            <span className="label text-ink/60">
              <span className="tabular">{ratedCount}</span> joueur{ratedCount > 1 ? "s" : ""} noté
              {ratedCount > 1 ? "s" : ""}
              {motm ? " · Homme du match choisi" : " · Pas d'homme du match"}
            </span>
            {justSaved && <span className="label text-accent-text">● Notes enregistrées</span>}
            {!user && <span className="label text-ink/50">Connexion requise pour voter</span>}
          </div>
        )}

        {error && (
          <p className="label mt-3 text-live-text" role="alert">
            {error}
          </p>
        )}
      </section>

      {showCommunity && <MotmPodium motm={data.motm} />}
    </div>
  );
}

interface PlayerGroupProps {
  title: string;
  players: RateablePlayer[];
  ratings: Record<string, number>;
  motm: string | null;
  summaryByKey: Map<string, PlayerRatingSummary>;
  showCommunity: boolean;
  editable: boolean;
  onRate: (key: string, value: number | null) => void;
  onToggleMotm: (key: string) => void;
  className?: string;
}

function PlayerGroup({
  title,
  players,
  ratings,
  motm,
  summaryByKey,
  showCommunity,
  editable,
  onRate,
  onToggleMotm,
  className,
}: PlayerGroupProps) {
  return (
    <div className={className}>
      <p className="label border-b border-ink pb-2 text-ink/60">{title}</p>
      <ul role="list">
        {players.map((player) => (
          <PlayerRatingRow
            key={player.key}
            player={player}
            rating={ratings[player.key]}
            isMotm={motm === player.key}
            summary={showCommunity ? summaryByKey.get(player.key) : undefined}
            editable={editable}
            onRate={(value) => onRate(player.key, value)}
            onToggleMotm={() => onToggleMotm(player.key)}
          />
        ))}
      </ul>
    </div>
  );
}

function PlayerRatingRow({
  player,
  rating,
  isMotm,
  summary,
  editable,
  onRate,
  onToggleMotm,
}: {
  player: RateablePlayer;
  rating: number | undefined;
  isMotm: boolean;
  summary: PlayerRatingSummary | undefined;
  editable: boolean;
  onRate: (value: number | null) => void;
  onToggleMotm: () => void;
}) {
  const step = (delta: number) => {
    const base = rating ?? RATING_DEFAULT - delta;
    onRate(Math.min(RATING_MAX, Math.max(RATING_MIN, base + delta)));
  };

  return (
    <li className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-ink/15 py-2.5 sm:grid-cols-[2.25rem_1fr_6rem_auto]">
      <span className="flex h-8 w-8 items-center justify-center border border-ink bg-accent font-mono text-xs font-bold tabular text-on-accent">
        {player.jersey ?? "–"}
      </span>

      <div className="min-w-0">
        <p className="truncate text-sm font-bold uppercase">{player.name}</p>
        <p className="label text-ink/50">
          {player.role ?? player.position}
          {summary && (
            <span className="sm:hidden">
              {" "}
              · Fans {formatRating(summary.average)} ({summary.votes})
            </span>
          )}
        </p>
      </div>

      <div className="hidden text-right sm:block">
        {summary ? (
          <>
            <span className="display text-3xl leading-none tabular text-accent-text">{formatRating(summary.average)}</span>
            <span className="label block text-ink/50">
              {summary.votes} vote{summary.votes > 1 ? "s" : ""}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5">
        {editable ? (
          <>
            <RatingStep label={`Baisser la note de ${player.name}`} disabled={rating === RATING_MIN} onClick={() => step(-RATING_STEP)}>
              −
            </RatingStep>
            <button
              type="button"
              onClick={() => onRate(rating === undefined ? RATING_DEFAULT : null)}
              title={rating === undefined ? "Noter ce joueur" : "Retirer ma note"}
              className={cn(
                "w-12 border border-ink py-1 text-center font-mono text-sm font-bold tabular",
                rating === undefined ? "text-ink/40 hover:bg-ink hover:text-paper" : "bg-ink text-paper",
              )}
            >
              {rating === undefined ? "—" : formatRating(rating)}
            </button>
            <RatingStep label={`Monter la note de ${player.name}`} disabled={rating === RATING_MAX} onClick={() => step(RATING_STEP)}>
              +
            </RatingStep>
            <button
              type="button"
              onClick={onToggleMotm}
              aria-pressed={isMotm}
              title="Homme du match"
              className={cn(
                "ml-1 flex h-8 w-8 items-center justify-center border border-ink text-sm transition-colors duration-100",
                isMotm ? "bg-accent text-on-accent" : "text-ink/40 hover:bg-ink hover:text-paper",
              )}
            >
              ★
            </button>
          </>
        ) : (
          <span className="label text-ink/60">
            {rating !== undefined ? `Toi : ${formatRating(rating)}` : ""}
            {isMotm && <span className="ml-1 text-accent-text">★</span>}
          </span>
        )}
      </div>
    </li>
  );
}

function RatingStep({
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
      className="flex h-8 w-8 items-center justify-center border border-ink font-mono font-bold transition-colors duration-100 hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function MotmPodium({ motm }: { motm: MotmSummary[] }) {
  const total = motm.reduce((sum, m) => sum + m.votes, 0);
  const podium = motm.slice(0, 3);

  return (
    <section>
      <SectionHeading
        title="Homme du match"
        subtitle={`Vote des supporters · ${total} vote${total > 1 ? "s" : ""}`}
      />
      {podium.length === 0 ? (
        <p className="editorial text-lg text-ink/60">Personne n&apos;a encore désigné d&apos;homme du match.</p>
      ) : (
        <ol className="grid border-l border-t border-ink sm:grid-cols-3">
          {podium.map((entry, i) => {
            const pct = total > 0 ? Math.round((entry.votes / total) * 100) : 0;
            return (
              <li
                key={entry.key}
                className={cn("border-b border-r border-ink p-4", i === 0 && "bg-ink text-paper")}
              >
                <p className={cn("label", i === 0 ? "text-accent-inverse" : "text-ink/50")}>N°{i + 1}</p>
                <p className="display mt-2 text-3xl leading-[0.9]">{entry.name}</p>
                <p className="display mt-3 text-5xl leading-none tabular">
                  {pct}
                  <span className="text-2xl">%</span>
                </p>
                <p className={cn("label mt-1", i === 0 ? "text-paper/60" : "text-ink/50")}>
                  {entry.votes} vote{entry.votes > 1 ? "s" : ""}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
