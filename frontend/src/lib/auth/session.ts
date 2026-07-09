import { cache } from "react";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/src/lib/supabase/server";
import type { ProfileView } from "@/src/lib/fan-zone/types";

const GUEST_COOKIE = "om_guest";

/** Déduplique getUser() au sein d'une même requête RSC. */
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Déduplique la lecture du cookie invité au sein d'une même requête RSC. */
export const getGuestModeFromCookies = cache(async (): Promise<boolean> => {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_COOKIE)?.value === "1";
});

function profileFromUser(user: User): ProfileView {
  return {
    id: user.id,
    display_name:
      (user.user_metadata?.display_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Supporter",
    avatar_url: null,
    role: "user",
  };
}

/** Profil SSR pour éviter un fetch client au premier rendu Fan Zone. */
export const getAuthProfile = cache(async (): Promise<ProfileView | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role")
    .eq("id", user.id)
    .single();

  if (error || !data) return profileFromUser(user);
  return data;
});
