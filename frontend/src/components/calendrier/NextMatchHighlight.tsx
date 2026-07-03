import { CalendarClock, MapPin, Swords, Zap } from "lucide-react";
import { Card } from "@/src/components/ui/Card";
import { SectionHeading } from "@/src/components/ui/SectionHeading";
import { Badge } from "@/src/components/ui/Badge";
import { TeamCrest } from "@/src/components/ui/TeamCrest";
import { MatchCountdown } from "@/src/components/home/MatchCountdown";
import { getNextOmFixture } from "@/src/lib/data/calendar";
import { getCompetition } from "@/src/lib/data/competitions";
import { shortTeamName } from "@/src/lib/ui/teams";

const PARIS_TZ = "Europe/Paris";

function formatMatchDate(dateStr: string, timeTbd: boolean): string {
  const date = new Date(dateStr);
  if (timeTbd) {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: PARIS_TZ,
    }).format(date);
  }
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TZ,
  }).format(date);
}

export function NextMatchHighlight() {
  const fixture = getNextOmFixture();

  if (!fixture) {
    return (
      <Card className="mb-8 flex flex-col">
        <SectionHeading
          title="Prochain match"
          subtitle="Calendrier OM"
          icon={<CalendarClock size={16} />}
        />
        <div className="flex flex-1 items-center justify-center py-10 text-center">
          <p className="text-sm text-slate-500">Aucun match à venir pour l&apos;OM.</p>
        </div>
      </Card>
    );
  }

  const isHome = fixture.homeTeam === "Marseille";
  const competition = getCompetition(fixture.competition);

  return (
    <Card variant="hero" className="mb-8 flex flex-col">
      <SectionHeading
        title="Prochain match"
        subtitle={`Journée ${fixture.matchday} · ${competition.label}`}
        icon={<CalendarClock size={16} />}
        action={
          <Badge variant="gold">
            J{fixture.matchday}
          </Badge>
        }
      />

      <div className="flex flex-1 flex-col justify-between gap-7">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant={isHome ? "om" : "muted"}>
            <MapPin size={10} />
            {isHome ? "À domicile" : "À l'extérieur"}
          </Badge>
          {fixture.timeTbd && (
            <Badge variant="muted">Horaire à confirmer</Badge>
          )}
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 h-40 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4">
            <TeamSide name={fixture.homeTeam} align="right" />
            <div className="flex flex-col items-center gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 shadow-inner">
                <Swords size={16} className="text-cyan-300" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
                VS
              </span>
            </div>
            <TeamSide name={fixture.awayTeam} align="left" />
          </div>
        </div>

        <div className="space-y-1.5 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <MapPin size={13} className="text-cyan-400" />
            {isHome
              ? "Orange Vélodrome, Marseille"
              : `Déplacement — ${shortTeamName(fixture.awayTeam)}`}
          </p>
          <p className="pl-[21px] text-xs capitalize text-slate-500">
            {formatMatchDate(fixture.date, fixture.timeTbd)}
          </p>
        </div>

        <div className="border-t border-white/5 pt-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
            Coup d&apos;envoi dans
          </p>
          <MatchCountdown targetDate={fixture.date} />
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/5 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/10 text-amber-300">
            <Zap size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-200">Simulation bientôt</p>
            <p className="text-xs text-slate-500">
              Le moteur de prédiction sera disponible prochainement pour ce match.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function TeamSide({ name, align }: { name: string; align: "left" | "right" }) {
  return (
    <div
      className={
        align === "right"
          ? "flex flex-col items-center gap-3 md:flex-row-reverse md:justify-start md:text-right"
          : "flex flex-col items-center gap-3 md:flex-row md:justify-start md:text-left"
      }
    >
      <TeamCrest name={name} size="lg" />
      <div className="min-w-0">
        <p className="truncate font-tech text-lg font-black uppercase leading-tight text-white md:text-xl">
          {shortTeamName(name)}
        </p>
      </div>
    </div>
  );
}
