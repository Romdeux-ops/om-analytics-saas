import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { CardSkeleton } from "@/src/components/ui/CardSkeleton";

export default function ClassementLoading() {
  return (
    <div>
      <PageSectionHeader
        title={
          <>
            Classe<span className="text-accent-text">ments</span>
          </>
        }
        subtitle="Ligue 1 · Europa League · Coupe de France"
      />
      <CardSkeleton rows={8} />
    </div>
  );
}
