"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { simulateMatch, upsertMatchCustomization } from "@om/db";
import { getDb } from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/admin/permissions";
import type { MatchLineups } from "@/src/lib/types/lineup";
import type { MatchEditorialPreview } from "@/src/lib/data/match-preview";

export async function simulateMatchAction(matchId: number) {
  const result = await simulateMatch(getDb(), matchId);
  revalidateTag("matches", { expire: 0 });
  revalidatePath("/", "layout");
  return result;
}

export async function saveMatchLineupAction(
  matchId: number,
  customLineup: MatchLineups,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  try {
    await upsertMatchCustomization(getDb(), matchId, {
      customLineup: customLineup as unknown as Record<string, unknown>,
    });

    revalidateTag("lineups", { expire: 0 });
    revalidatePath(`/simulation/${matchId}`);
    revalidatePath("/simulation");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur lors de la sauvegarde de la composition.",
    };
  }
}

export async function resetMatchLineupAction(
  matchId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  try {
    await upsertMatchCustomization(getDb(), matchId, {
      customLineup: null,
    });

    revalidateTag("lineups", { expire: 0 });
    revalidatePath(`/simulation/${matchId}`);
    revalidatePath("/simulation");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur lors de la réinitialisation.",
    };
  }
}

export async function saveMatchEditorialAction(
  matchId: number,
  customEditorial: Partial<MatchEditorialPreview>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  try {
    await upsertMatchCustomization(getDb(), matchId, {
      customEditorial: customEditorial as unknown as Record<string, unknown>,
    });

    revalidateTag("match-preview", { expire: 0 });
    revalidatePath(`/simulation/${matchId}`);
    revalidatePath("/simulation");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur lors de la sauvegarde du texte.",
    };
  }
}

export async function resetMatchEditorialAction(
  matchId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  try {
    await upsertMatchCustomization(getDb(), matchId, {
      customEditorial: null,
    });

    revalidateTag("match-preview", { expire: 0 });
    revalidatePath(`/simulation/${matchId}`);
    revalidatePath("/simulation");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur lors de la réinitialisation.",
    };
  }
}
