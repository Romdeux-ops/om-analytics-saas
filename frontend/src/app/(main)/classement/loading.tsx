import { ListOrdered } from "lucide-react";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";
import { CardSkeleton } from "@/src/components/ui/CardSkeleton";

export default function ClassementLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageSectionHeader
        title={<span className="text-gradient-gold">Classements</span>}
        subtitle="Ligue 1 · Europa League · Coupe de France"
        icon={<ListOrdered size={18} />}
        accent="gold"
      />
      <CardSkeleton rows={8} />
    </div>
  );
}
