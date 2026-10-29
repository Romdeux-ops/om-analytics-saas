export default function Loading() {
  return (
    <div className="page-shell flex min-h-screen items-end px-6 pb-10 md:px-12">
      <div className="w-full border-t-[6px] border-ink pt-3">
        <p className="label flex items-center gap-2 text-ink/60">
          <span className="pulse-dot text-accent" aria-hidden="true" />
          Chargement
        </p>
        <p className="display mt-2 text-[clamp(4rem,14vw,12rem)] text-ink">
          <span className="text-accent-text">OM</span> Analytics
        </p>
      </div>
    </div>
  );
}
