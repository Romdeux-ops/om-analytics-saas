import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { CardSkeleton } from "@/src/components/ui/CardSkeleton";

export default function PronosticsLoading() {
  return (
    <div>
      <PageSectionHeader
        title={
          <>
            Pro<span className="text-accent-text">nos</span>
          </>
        }
        subtitle="Pronostics & notes des supporters"
      />
      <CardSkeleton rows={8} />
    </div>
  );
}
