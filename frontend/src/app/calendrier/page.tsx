import { ArrowLeft, CalendarDays } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";

export default function CalendrierPage() {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center">
      <div className="relative z-10 mx-4 max-w-lg">
        <div className="bento-card glow-border p-10 text-center">
          <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 rounded-2xl bg-cyan-500/20 blur-xl" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300">
              <CalendarDays size={28} />
            </span>
          </div>
          <Badge variant="om" className="mb-4">
            Bientôt disponible
          </Badge>
          <h1 className="mb-3 font-tech text-3xl font-black">
            <span className="text-gradient">Calendrier</span>
          </h1>
          <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-slate-400">
            Le calendrier complet de l&apos;OM, match par match, avec filtres par compétition et
            rappels de coup d&apos;envoi.
          </p>
          <Button href="/" variant="outline">
            <ArrowLeft size={14} />
            Retour au menu
          </Button>
        </div>
      </div>
    </div>
  );
}
