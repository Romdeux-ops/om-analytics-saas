import { CalendarClock, ChevronRight, MapPin, Swords } from "lucide-react";
import { Card } from "@/src/components/ui/Card";
import { SectionHeading } from "@/src/components/ui/SectionHeading";
import { Badge } from "@/src/components/ui/Badge";
import { TeamCrest } from "@/src/components/ui/TeamCrest";
import { MatchCountdown } from "@/src/components/home/MatchCountdown";
import { getNextOmMatch } from "@/src/lib/data/matches";
import { shortTeamName } from "@/src/lib/ui/teams";

const OM_NAME = "Olympique de Marseille";

function formatMatchDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function NextMatchCard() {
  const match = await getNextOmMatch();

  if (!match) {
    return (
      <Card className="flex h-full flex-col">
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

  const isHome = match.home_team_name === OM_NAME;
  const homeName = match.home_team_name;
  const awayName = match.away_team_name;

  return (
    <Card href="/calendrier" variant="hero" className="flex h-full flex-col">
      <SectionHeading
        title="Prochain match"
        subtitle="Le rendez-vous à ne pas manquer"
        icon={<CalendarClock size={16} />}
        action={
          <span className="flex items-center gap-1 text-xs font-medium text-cyan-300 transition-all group-hover:gap-2">
            Calendrier <ChevronRight size={14} />
          </span>
        }
      />

      <div className="flex flex-1 flex-col justify-between gap-7">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant={isHome ? "om" : "muted"}>
            <MapPin size={10} />
            {isHome ? "À domicile" : "À l'extérieur"}
          </Badge>
          <Badge variant="gold">Journée à venir</Badge>
        </div>

        {/* Affiche du match */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 h-40 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4">
            <TeamSide name={homeName} align="right" />

            <div className="flex flex-col items-center gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 shadow-inner">
                <Swords size={16} className="text-cyan-300" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
                VS
              </span>
            </div>

            <TeamSide name={awayName} align="left" />
          </div>
        </div>

        <div className="space-y-1.5 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <MapPin size={13} className="text-cyan-400" />
            {isHome ? "Orange Vélodrome, Marseille" : `Déplacement — ${shortTeamName(awayName)}`}
          </p>
          <p className="pl-[21px] text-xs capitalize text-slate-500">
            {formatMatchDate(new Date(match.date))}
          </p>
        </div>

        <div className="border-t border-white/5 pt-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
            Coup d&apos;envoi dans
          </p>
          <MatchCountdown targetDate={match.date} />
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
      <TeamCrest name={name} size="lg" className="transition-transform duration-300 group-hover:scale-105" />
      <div className="min-w-0">
        <p className="truncate text-lg font-black uppercase leading-tight text-white font-tech md:text-xl">
          {shortTeamName(name)}
        </p>
      </div>
    </div>
  );
}
