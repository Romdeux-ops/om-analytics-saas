import { AuthProvider } from "@/src/components/auth/AuthProvider";
import { NavPrefetch } from "@/src/components/ui/NavPrefetch";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NavPrefetch />
      {children}
    </AuthProvider>
  );
}
