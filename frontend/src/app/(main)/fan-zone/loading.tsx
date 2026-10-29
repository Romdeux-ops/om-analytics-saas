import { CardSkeleton } from "@/src/components/ui/CardSkeleton";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";

export default function FanZoneLoading() {
  return (
    <div>
      <PageSectionHeader
        title={
          <>
            Fan <span className="text-accent-text">Zone</span>
          </>
        }
        subtitle="Le mur du virage · Communauté OM"
      />
      <CardSkeleton rows={5} />
    </div>
  );
}
