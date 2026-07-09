import { MessagesSquare } from "lucide-react";
import { CardSkeleton } from "@/src/components/ui/CardSkeleton";
import { PageSectionHeader } from "@/src/components/layout/PageSectionHeader";

export default function FanZoneLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageSectionHeader
        title={
          <span className="bg-gradient-to-r from-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
            Fan Zone
          </span>
        }
        subtitle="Communauté OM"
        icon={<MessagesSquare size={18} />}
        accent="violet"
      />
      <CardSkeleton rows={5} />
    </div>
  );
}
