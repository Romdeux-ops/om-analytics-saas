import { CardSkeleton } from "@/src/components/ui/CardSkeleton";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { formatSeason } from "@om/db/season";

export default function EffectifLoading() {
  return (
    <div>
      <PageSectionHeader
        title={
          <>
            Effec<span className="text-accent-text">tif</span>
          </>
        }
        subtitle={`Olympique de Marseille · Saison ${formatSeason()}`}
      />
      <CardSkeleton rows={6} />
    </div>
  );
}
