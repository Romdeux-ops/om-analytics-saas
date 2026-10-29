import { cn } from "@/src/lib/ui/cn";

interface CardSkeletonProps {
  className?: string;
  rows?: number;
}

export function CardSkeleton({ className, rows = 4 }: CardSkeletonProps) {
  return (
    <div className={cn("border-t-[6px] border-ink pt-3 animate-pulse", className)}>
      <div className="mb-5 space-y-2 border-b border-ink pb-3">
        <div className="h-2.5 w-24 bg-ink/15" />
        <div className="h-8 w-48 bg-ink/20" />
      </div>
      <div className="divide-y divide-ink/15">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 py-3" style={{ opacity: 1 - i * 0.12 }}>
            <div className="h-4 w-6 bg-ink/15" />
            <div className="h-4 flex-1 bg-ink/10" />
            <div className="h-4 w-10 bg-ink/15" />
          </div>
        ))}
      </div>
    </div>
  );
}
