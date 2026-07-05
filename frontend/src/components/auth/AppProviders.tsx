import { getGuestModeFromCookies } from "@/src/app/actions/auth";
import { AuthProvider } from "@/src/components/auth/AuthProvider";
import { createClient } from "@/src/lib/supabase/server";

export async function AppProviders({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasGuestCookie = await getGuestModeFromCookies();
  const initialGuest = hasGuestCookie && !user;

  return (
    <AuthProvider
      key={user?.id ?? (initialGuest ? "guest" : "anon")}
      initialGuest={initialGuest}
      initialUser={user}
    >
      {children}
    </AuthProvider>
  );
}
