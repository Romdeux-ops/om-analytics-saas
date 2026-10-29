import { CardSkeleton } from "@/src/components/ui/CardSkeleton";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";

export default function EffectifLoading() {
  return (
    <div>
      <PageSectionHeader
        title={
          <>
            Effec<span className="text-accent-text">tif</span>
          </>
        }
        subtitle="Olympique de Marseille · Saison 2026-2027"
      />
      <CardSkeleton rows={6} />
    </div>
  );
}
