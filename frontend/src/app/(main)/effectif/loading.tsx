import { CardSkeleton } from "@/src/components/ui/CardSkeleton";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { Users } from "lucide-react";

export default function EffectifLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageSectionHeader
        title={<span className="text-gradient">Effectif</span>}
        subtitle="Olympique de Marseille · Saison 2026-2027"
        icon={<Users size={18} />}
        accent="cyan"
      />
      <CardSkeleton rows={6} />
    </div>
  );
}
