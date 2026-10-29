import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { CardSkeleton } from "@/src/components/ui/CardSkeleton";

export default function CalendrierLoading() {
  return (
    <div>
      <PageSectionHeader
        title={
          <>
            Calen<span className="text-accent-text">drier</span>
          </>
        }
        subtitle="Ligue 1 · Europa League · Coupe de France"
      />
      <CardSkeleton rows={6} />
    </div>
  );
}
