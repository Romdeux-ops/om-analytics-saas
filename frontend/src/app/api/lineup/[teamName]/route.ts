import { NextResponse, type NextRequest } from "next/server";
import { getProbableLineup } from "@/src/lib/data/lineup";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamName: string }> },
) {
  const { teamName } = await params;
  const decoded = decodeURIComponent(teamName);

  try {
    const lineup = await getProbableLineup(decoded);
    return NextResponse.json(lineup, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
