import type { Metadata } from "next";
import Link from "next/link";
import { formatSeason } from "@om/db/season";
import { GuestBanner } from "@/src/components/fan-zone/GuestBanner";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { LeaderboardTable } from "@/src/components/predictions/LeaderboardTable";
import { PredictionCard } from "@/src/components/predictions/PredictionCard";
import { PredictionHistory } from "@/src/components/predictions/PredictionHistory";
import { SectionHeading } from "@/src/components/ui/SectionHeading";
import { getAuthUser } from "@/src/lib/auth/session";
import {
  getLeaderboard,
  getMatchesToRate,
  getMatchPredictionData,
  getNextMatchToPredict,
  getPredictionHistory,
} from "@/src/lib/predictions/queries.server";
import type { MatchToRate } from "@/src/lib/predictions/types";
import { pageMetadata } from "@/src/lib/site";
import { shortTeamName } from "@/src/lib/ui/teams";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Pronostics",
  description: "Pronostique les matchs de l'OM, note les joueurs et grimpe au classement des supporters.",
  path: "/pronostics",
});

export default async function PronosticsPage() {
  const user = await getAuthUser();
  const [nextMatch, leaderboard, history, toRate] = await Promise.all([
    getNextMatchToPredict(),
    getLeaderboard(),
    user ? getPredictionHistory(user.id) : Promise.resolve([]),
    getMatchesToRate(user?.id),
  ]);
  const nextPrediction = nextMatch ? await getMatchPredictionData(nextMatch, user?.id) : null;
  const myEntry = user ? leaderboard.find((e) => e.userId === user.id) : undefined;

  return (
    <div>
      <PageSectionHeader
        title={
          <>
            Pro<span className="text-accent-text">nos</span>
          </>
        }
        subtitle={`Pronostics & notes des supporters · Saison ${formatSeason()}`}
      />

      <GuestBanner message="Mode invité — connectez-vous pour pronostiquer et noter les joueurs." />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-0">
        <div className="space-y-12 lg:col-span-7 lg:pr-10">
          <section>
            <SectionHeading index="01" title="Prochain match" subtitle="Clôture au coup d'envoi" />
            {nextPrediction ? (
              <PredictionCard data={nextPrediction} hideLeaderboardLink />
            ) : (
              <p className="editorial text-lg text-ink/60">Aucun match à venir pour l&apos;instant.</p>
            )}
          </section>

          {toRate.length > 0 && (
            <section>
              <SectionHeading index="02" title="À noter" subtitle="Notes ouvertes 72 h après le match" />
              <MatchesToRateList matches={toRate} />
            </section>
          )}

          {user && (
            <section>
              <SectionHeading
                index={toRate.length > 0 ? "03" : "02"}
                title="Mes pronos"
                subtitle="Ton prono / score final · points"
              />
              <PredictionHistory items={history} />
            </section>
          )}
        </div>

        <aside className="lg:col-span-5 lg:border-l lg:border-ink lg:pl-8">
          <SectionHeading
            title="Le classement"
            subtitle="Pronostiqueurs · Saison en cours"
            action={
              myEntry ? (
                <span className="bg-accent px-2 py-1 text-on-accent">
                  Toi : {myEntry.rank}
                  <sup>e</sup> · {myEntry.totalPoints} pts
                </span>
              ) : undefined
            }
          />
          <LeaderboardTable entries={leaderboard} currentUserId={user?.id} />
          <p className="label mt-4 text-ink/50">
            Égalité : plus de scores exacts, puis moins de matchs joués.
          </p>
        </aside>
      </div>
    </div>
  );
}

const PARIS_TZ = "Europe/Paris";

function formatClosing(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TZ,
  }).format(new Date(iso));
}

function MatchesToRateList({ matches }: { matches: MatchToRate[] }) {
  return (
    <ul className="border-t border-ink" role="list">
      {matches.map((m) => (
        <li key={m.matchId}>
          <Link
            href={`/simulation/${m.matchId}?tab=notes`}
            prefetch={false}
            className="group flex items-center justify-between gap-3 border-b border-ink py-3 transition-colors duration-100 hover:bg-ink hover:text-paper"
          >
            <span className="min-w-0">
              <span className="display block truncate text-3xl leading-none">
                {shortTeamName(m.homeTeam)} – {shortTeamName(m.awayTeam)}
              </span>
              <span className="label mt-1 block opacity-60">
                Clôture <span className="capitalize">{formatClosing(m.closesAt)}</span>
              </span>
            </span>
            <span className="label shrink-0">
              {m.hasVoted ? "Modifier mes notes" : "Noter les joueurs"} <span className="arrow">→</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
