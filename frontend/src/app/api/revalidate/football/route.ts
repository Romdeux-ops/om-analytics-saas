import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { FOOTBALL_CACHE_TAG } from "@/src/lib/data/football";

/** Appelée par `bun run football:sync` (GitHub Actions) après écriture en base. */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag(FOOTBALL_CACHE_TAG, { expire: 0 });
  for (const path of ["/", "/calendrier", "/classement"]) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
