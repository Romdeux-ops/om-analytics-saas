import { ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";

export default function ClassementPage() {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center">
      <div className="relative z-10 mx-4 max-w-lg">
        <div className="bento-card glow-border p-10 text-center">
          <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-xl" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10 text-amber-300">
              <Trophy size={28} />
            </span>
          </div>
          <Badge variant="gold" className="mb-4">
            Bientôt disponible
          </Badge>
          <h1 className="mb-3 font-tech text-3xl font-black">
            <span className="text-gradient-gold">Classements</span>
          </h1>
          <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-slate-400">
            Classement du championnat, forme récente, statistiques domicile/extérieur et position
            européenne.
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
