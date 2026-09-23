import { CalendarDays } from "lucide-react";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { CardSkeleton } from "@/src/components/ui/CardSkeleton";

export default function CalendrierLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageSectionHeader
        title={<span className="text-gradient">Calendrier</span>}
        subtitle="Ligue 1 · Europa League · Coupe de France"
        icon={<CalendarDays size={18} />}
        accent="cyan"
      />
      <CardSkeleton rows={6} />
    </div>
  );
}
