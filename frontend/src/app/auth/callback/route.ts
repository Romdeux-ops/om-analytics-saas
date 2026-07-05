import { clearGuestModeAction } from "@/src/app/actions/auth";
import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

function safeNextPath(raw: string | null): string {
  const path = raw ?? "/";
  if (path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return "/";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await clearGuestModeAction();
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/welcome?error=auth_callback_failed`);
}
