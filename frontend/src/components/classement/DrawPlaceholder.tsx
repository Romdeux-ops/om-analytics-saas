import type { Competition } from "@/src/lib/types/competition";

interface DrawPlaceholderProps {
  competition: Competition;
}

export function DrawPlaceholder({ competition }: DrawPlaceholderProps) {
  const isEuropa = competition.id === "europa";

  return (
    <section className="grid gap-8 border-t-[6px] border-ink pt-6 md:grid-cols-12">
      <div className="md:col-span-8">
        <p className="label text-ink/60">Saison {competition.season}</p>
        <h2 className="display mt-2 text-6xl text-ink md:text-8xl">{competition.label}</h2>
        <p className="editorial mt-5 max-w-lg text-2xl leading-snug text-ink/75">
          {competition.drawMessage}
        </p>
      </div>
      <div className="flex flex-col justify-between border-l border-ink pl-6 md:col-span-4">
        <span className="label inline-flex w-fit border border-ink bg-ink px-2 py-1 text-paper">
          Tirage à venir
        </span>
        {isEuropa && (
          <p className="display mt-6 text-5xl text-accent-text tabular">28.08.26</p>
        )}
      </div>
    </section>
  );
}
