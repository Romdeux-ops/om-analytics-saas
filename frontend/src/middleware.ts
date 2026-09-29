import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const GUEST_COOKIE = "om_guest";
const PUBLIC_PATHS = ["/welcome", "/auth/callback", "/api/revalidate"];

type CookieToSet = { name: string; value: string; options?: CookieOptions };

function hasSupabaseAuthCookies(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
  );
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
}

function copyHeaders(from: NextResponse, to: NextResponse) {
  from.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") return;
    to.headers.set(key, value);
  });
}

function redirectWithCookies(url: URL, source: NextResponse) {
  const response = NextResponse.redirect(url);
  copyCookies(source, response);
  copyHeaders(source, response);
  return response;
}

/** Jeton émis avant un `db reset` : la base auth ne le connaît plus. */
function isStaleSession(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  if (code === "refresh_token_not_found" || code === "session_not_found") return true;
  const name = "name" in error ? String(error.name) : "";
  const status = "status" in error ? Number(error.status) : 0;
  return name === "AuthApiError" && status === 400;
}

function clearSupabaseCookies(response: NextResponse, request: NextRequest) {
  for (const { name } of request.cookies.getAll()) {
    if (name.startsWith("sb-")) response.cookies.delete(name);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const hasGuestCookie = request.cookies.get(GUEST_COOKIE)?.value === "1";

  // Invité sans session Supabase : pas besoin de vérifier le JWT à chaque navigation.
  if (hasGuestCookie && !isPublicPath && pathname !== "/welcome" && !hasSupabaseAuthCookies(request)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[], headers: Record<string, string>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  let user: { id: string } | null = null;
  let dropSession = false;
  try {
    const { data, error } = await supabase.auth.getClaims();
    if (error) {
      dropSession = isStaleSession(error);
    } else {
      const sub = data?.claims?.sub;
      user = typeof sub === "string" ? { id: sub } : null;
    }
  } catch (error) {
    dropSession = isStaleSession(error);
  }

  if (dropSession) clearSupabaseCookies(supabaseResponse, request);

  if (user && hasGuestCookie) {
    supabaseResponse.cookies.delete(GUEST_COOKIE);
  }

  if (user && pathname === "/welcome") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return redirectWithCookies(url, supabaseResponse);
  }

  if (!user && !hasGuestCookie && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/welcome";
    const response = redirectWithCookies(url, supabaseResponse);
    if (dropSession) clearSupabaseCookies(response, request);
    return response;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
