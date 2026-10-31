import { AuthProvider } from "@/src/components/auth/AuthProvider";
import { getAuthProfile, getAuthUser } from "@/src/lib/auth/session";

export default async function FanZoneLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  const profile = user ? await getAuthProfile() : null;

  return (
    <AuthProvider key={user?.id ?? "anon"} resolvedOnServer initialUser={user} initialProfile={profile}>
      {children}
    </AuthProvider>
  );
}
