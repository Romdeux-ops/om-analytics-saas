export default function Loading() {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center">
      <div className="relative z-10 text-center">
        <div className="relative mx-auto mb-5 h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/15" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-cyan-400" />
          <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-lg" />
        </div>
        <p className="font-tech text-lg font-black tracking-wide">
          <span className="text-gradient">OM</span> <span className="text-white">ANALYTICS</span>
        </p>
        <p className="mt-2 text-sm text-slate-500">Chargement…</p>
      </div>
    </div>
  );
}
