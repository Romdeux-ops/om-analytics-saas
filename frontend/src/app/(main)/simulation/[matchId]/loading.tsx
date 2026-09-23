export default function SimulationLoading() {
  return (
    <div className="flex min-h-[70vh] w-full max-w-[1600px] flex-col gap-6">
      <div className="flex h-16 items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-48 animate-pulse rounded-md bg-white/10" />
          <div className="h-3 w-64 animate-pulse rounded-md bg-white/5" />
        </div>
        <div className="h-10 w-44 animate-pulse rounded-xl bg-white/10" />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-white/[0.04]" />
          <div className="grid h-32 grid-cols-3 gap-6">
            <div className="animate-pulse rounded-[var(--radius-card)] bg-white/[0.04]" />
            <div className="animate-pulse rounded-[var(--radius-card)] bg-white/[0.04]" />
            <div className="animate-pulse rounded-[var(--radius-card)] bg-white/[0.04]" />
          </div>
          <div className="min-h-[300px] flex-1 animate-pulse rounded-[var(--radius-card)] bg-white/[0.04]" />
        </div>
        <div className="min-h-[400px] animate-pulse rounded-[var(--radius-card)] bg-white/[0.04] lg:col-span-4" />
      </div>
    </div>
  );
}
