import { AppHeader } from "@/src/components/layout/AppHeader";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-10 lg:px-8">
        <AppHeader />
        {children}
      </div>
    </div>
  );
}
