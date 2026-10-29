import { cn } from "@/src/lib/ui/cn";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Conservé pour compatibilité : le titrage est purement typographique. */
  icon?: React.ReactNode;
  /** Numéro de rubrique façon sommaire (« 01 »). */
  index?: string;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  action,
  index,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-5 flex items-end justify-between gap-4 border-b border-ink pb-3", className)}>
      <div className="min-w-0">
        {(index || subtitle) && (
          <p className="label mb-1.5 truncate text-ink/60">
            {index && <span className="mr-2 text-accent-text">{index}</span>}
            {subtitle}
          </p>
        )}
        <h2 className="display text-3xl text-ink md:text-4xl">{title}</h2>
      </div>
      {action && <div className="label shrink-0">{action}</div>}
    </div>
  );
}
