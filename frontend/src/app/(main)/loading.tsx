import { CardSkeleton } from "@/src/components/ui/CardSkeleton";

export default function MainLoading() {
  return (
    <div className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-12">
      <div className="h-full lg:col-span-7">
        <CardSkeleton rows={4} className="min-h-[280px]" />
      </div>
      <div className="h-full lg:col-span-5">
        <CardSkeleton rows={5} className="min-h-[280px]" />
      </div>
      <div className="lg:col-span-12">
        <CardSkeleton rows={3} />
      </div>
      <div className="lg:col-span-12">
        <CardSkeleton rows={4} />
      </div>
    </div>
  );
}
