import { CalendarDays, Trophy } from "lucide-react";
import { Card } from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { cn } from "@/src/lib/ui/cn";
import type { Competition } from "@/src/lib/types/competition";

interface DrawPlaceholderProps {
  competition: Competition;
}

export function DrawPlaceholder({ competition }: DrawPlaceholderProps) {
  const isEuropa = competition.id === "europa";

  return (
    <Card className="flex flex-col items-center py-14 text-center md:py-20">
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
        <span
          className={cn("absolute inset-0 rounded-2xl blur-xl", isEuropa ? "bg-cyan-500/20" : "bg-amber-500/20")}
        />
        <span
          className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-2xl border",
            isEuropa
              ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
              : "border-amber-400/30 bg-amber-500/10 text-amber-300",
          )}
        >
          {isEuropa ? <Trophy size={28} /> : <CalendarDays size={28} />}
        </span>
      </div>

      <Badge variant={isEuropa ? "om" : "gold"} className="mb-4">
        Tirage à venir
      </Badge>

      <h2 className="mb-2 font-tech text-2xl font-black uppercase tracking-tight text-white md:text-3xl">
        {competition.label}
      </h2>
      <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
        Saison {competition.season}
      </p>

      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-400">
        {competition.drawMessage}
      </p>

      {isEuropa && (
        <p className="mt-6 font-tech text-xl font-black tabular-nums text-cyan-300">
          28 août 2026
        </p>
      )}
    </Card>
  );
}
