export default function SimulationLoading() {
  return (
    <div className="flex min-h-[70vh] w-full animate-pulse flex-col gap-10">
      <div className="flex items-end gap-1 border-b border-ink">
        <div className="h-10 w-40 bg-ink/20" />
        <div className="h-8 w-40 bg-ink/10" />
      </div>
      <div className="grid border-y-[6px] border-ink md:grid-cols-2">
        <div className="space-y-4 py-10 md:border-r md:border-ink md:pr-20">
          <div className="h-3 w-24 bg-ink/15" />
          <div className="h-32 w-3/4 bg-ink/15" />
        </div>
        <div className="flex flex-col items-end space-y-4 py-10 md:pl-20">
          <div className="h-3 w-24 bg-ink/15" />
          <div className="h-32 w-3/4 bg-ink/15" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-8 w-64 bg-ink/15" />
        <div className="h-48 w-full bg-ink/10" />
      </div>
    </div>
  );
}
