import { cn } from "@/src/lib/ui/cn";

interface CardSkeletonProps {
  className?: string;
  rows?: number;
}

export function CardSkeleton({ className, rows = 4 }: CardSkeletonProps) {
  return (
    <div className={cn("bento-card animate-pulse p-5 md:p-6", className)}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded-md bg-white/10" />
          <div className="h-3 w-40 rounded-md bg-white/5" />
        </div>
        <div className="h-8 w-8 rounded-lg bg-white/5" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="h-14 rounded-2xl bg-white/[0.04]"
            style={{ opacity: 1 - i * 0.12 }}
          />
        ))}
      </div>
    </div>
  );
}
