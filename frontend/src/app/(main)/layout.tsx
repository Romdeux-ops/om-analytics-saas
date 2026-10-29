import { Suspense } from "react";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { MatchTicker } from "@/src/components/layout/MatchTicker";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <Suspense fallback={<div className="h-[33px] border-b border-ink bg-ink" />}>
        <MatchTicker />
      </Suspense>
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pb-16 pt-5 md:px-8 md:pt-6 lg:px-12">
        <AppHeader />
        {children}
      </div>
    </div>
  );
}
