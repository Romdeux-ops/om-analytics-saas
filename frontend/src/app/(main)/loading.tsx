import { CardSkeleton } from "@/src/components/ui/CardSkeleton";

export default function MainLoading() {
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-0">
      <div className="lg:col-span-8 lg:pr-10">
        <CardSkeleton rows={4} className="min-h-[420px]" />
      </div>
      <div className="lg:col-span-4 lg:border-l lg:border-ink lg:pl-8">
        <CardSkeleton rows={5} className="min-h-[420px]" />
      </div>
    </div>
  );
}
