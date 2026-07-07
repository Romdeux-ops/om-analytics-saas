import { createClient } from "@/src/lib/supabase/server";
import type { UserRole } from "./types";

const ADMIN_FORBIDDEN = "Action réservée aux administrateurs.";

export async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: ADMIN_FORBIDDEN };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== ("admin" satisfies UserRole)) {
    return { ok: false, error: ADMIN_FORBIDDEN };
  }

  return { ok: true, userId: user.id };
}
