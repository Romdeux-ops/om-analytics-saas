import Link from "next/link";
import { MatchCountdown } from "@/src/components/home/MatchCountdown";
import { getNextOmFixture } from "@/src/lib/data/calendar";
import { getCompetition } from "@/src/lib/data/competitions";
import { isOmTeam, shortTeamName } from "@/src/lib/ui/teams";
import { cn } from "@/src/lib/ui/cn";

const PARIS_TZ = "Europe/Paris";

function formatDay(dateStr: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: PARIS_TZ,
  }).format(new Date(dateStr));
}

function formatHour(dateStr: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TZ,
  }).format(new Date(dateStr));
}

export async function NextMatchCard() {
  const fixture = await getNextOmFixture();

  if (!fixture) {
    return (
      <section className="border-t-[6px] border-ink pt-3">
        <p className="label text-ink/60">01 — Prochain match</p>
        <p className="display mt-4 text-6xl text-ink/30 md:text-8xl">Relâche.</p>
        <p className="editorial mt-3 text-xl text-ink/70">Aucun match à venir pour l&apos;OM.</p>
      </section>
    );
  }

  const isHome = fixture.homeTeam === "Marseille";
  const competition = getCompetition(fixture.competition);

  return (
    <section className="border-t-[6px] border-ink pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="label text-ink/60">
          <span className="text-accent-text">01</span> — Prochain match
        </p>
        <p className="label text-ink/60">
          {competition.label} · J{fixture.matchday} · {isHome ? "Domicile" : "Extérieur"}
        </p>
      </div>

      <Link href="/calendrier" prefetch className="group mt-4 block" aria-label="Voir le calendrier">
        <h2 className="display text-[clamp(4.5rem,13vw,12.5rem)] text-ink">
          <TeamLine name={fixture.homeTeam} />
          <span className="editorial my-1 block text-[0.22em] normal-case leading-none text-ink/70 md:my-2">
            reçoit
          </span>
          <TeamLine name={fixture.awayTeam} />
        </h2>
        <span className="label mt-4 inline-flex items-center gap-2 border-b-2 border-ink pb-0.5 text-ink group-hover:border-accent">
          Tout le calendrier <span className="arrow">→</span>
        </span>
      </Link>

      <dl className="mt-8 grid grid-cols-2 border-y border-ink md:grid-cols-3">
        <div className="border-r border-ink py-3 pr-3">
          <dt className="label text-ink/60">Lieu</dt>
          <dd className="mt-1 text-sm font-bold uppercase">
            {isHome ? "Orange Vélodrome" : `Chez ${shortTeamName(fixture.homeTeam)}`}
          </dd>
        </div>
        <div className="py-3 pl-3 md:border-r md:border-ink md:pr-3">
          <dt className="label text-ink/60">Date</dt>
          <dd className="mt-1 text-sm font-bold uppercase">{formatDay(fixture.date)}</dd>
        </div>
        <div className="col-span-2 border-t border-ink py-3 md:col-span-1 md:border-t-0 md:pl-3">
          <dt className="label text-ink/60">Coup d&apos;envoi</dt>
          <dd className="mt-1 text-sm font-bold uppercase tabular">
            {fixture.timeTbd ? "Horaire à confirmer" : formatHour(fixture.date)}
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        <MatchCountdown targetDate={fixture.date} />
      </div>
    </section>
  );
}

function TeamLine({ name }: { name: string }) {
  const om = isOmTeam(name);
  return (
    <span
      className={cn(
        "block transition-transform duration-150 group-hover:translate-x-2",
        om ? "text-accent-text" : "text-ink",
      )}
    >
      {shortTeamName(name)}
    </span>
  );
}
