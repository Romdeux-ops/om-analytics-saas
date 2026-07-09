"use server";

import { createClient } from "@/src/lib/supabase/server";
import { cookies } from "next/headers";
import {
  MAX_DISPLAY_NAME_LENGTH,
  MIN_DISPLAY_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "@/src/lib/fan-zone/constants";

const GUEST_COOKIE = "om_guest";
const GUEST_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function setGuestModeAction() {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: GUEST_MAX_AGE,
    path: "/",
  });
}

export async function clearGuestModeAction() {
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_COOKIE);
}


export async function signInAction(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, error: "Email ou mot de passe incorrect." };
  }

  await clearGuestModeAction();
  return { ok: true };
}

export async function signUpAction(
  email: string,
  password: string,
  displayName: string,
): Promise<{ ok: true; needsConfirmation: boolean } | { ok: false; error: string }> {
  const name = displayName.trim();
  if (name.length < MIN_DISPLAY_NAME_LENGTH || name.length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      ok: false,
      error: `Pseudo : ${MIN_DISPLAY_NAME_LENGTH}–${MAX_DISPLAY_NAME_LENGTH} caractères.`,
    };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Mot de passe : minimum ${MIN_PASSWORD_LENGTH} caractères.` };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (data.session) {
    await clearGuestModeAction();
    return { ok: true, needsConfirmation: false };
  }

  return { ok: true, needsConfirmation: true };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearGuestModeAction();
}

