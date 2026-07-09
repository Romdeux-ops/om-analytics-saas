import { CardSkeleton } from "@/src/components/ui/CardSkeleton";

export default function SimulationLoading() {
  return (
    <div className="max-w-[1600px]">
      <div className="mb-6 animate-pulse space-y-3">
        <div className="h-6 w-48 rounded bg-white/10" />
        <div className="h-4 w-64 rounded bg-white/5" />
      </div>
      <CardSkeleton rows={4} />
    </div>
  );
}
