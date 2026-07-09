import { AuthProvider } from "@/src/components/auth/AuthProvider";
import { NavPrefetch } from "@/src/components/ui/NavPrefetch";
import { getAuthProfile, getAuthUser, getGuestModeFromCookies } from "@/src/lib/auth/session";

export async function AppProviders({ children }: { children: React.ReactNode }) {
  const [user, hasGuestCookie] = await Promise.all([getAuthUser(), getGuestModeFromCookies()]);
  const profile = user ? await getAuthProfile() : null;
  const initialGuest = hasGuestCookie && !user;

  return (
    <AuthProvider
      key={user?.id ?? (initialGuest ? "guest" : "anon")}
      initialGuest={initialGuest}
      initialUser={user}
      initialProfile={profile}
    >
      <NavPrefetch />
      {children}
    </AuthProvider>
  );
}
