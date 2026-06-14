// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara-studio/library — List and Query Generated Content
//
// Retrieves all generations for the current organisation/home.
// Supports filtering by child, type, and status.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { libraryQuerySchema } from "@/lib/cara-studio/schemas";
import { getUserIdFromRequest } from "@/lib/auth-guard";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { GenerationStatus } from "@/lib/cara-studio/types";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    const homeId = process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
    const organisationId = process.env.SUPABASE_ORG_ID ?? "org_default";

    // ── Parse query params ───────────────────────────────────────────────────
    const url = new URL(req.url);
    const params = {
      childId: url.searchParams.get("childId") ?? undefined,
      generationType: url.searchParams.get("generationType") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    };

    const parsed = libraryQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { childId, generationType, status, limit, offset } = parsed.data;

    // ── Fetch from database ─────────────────────────────────────────────────
    const sb = createServerClient();
    if (!sb || !isSupabaseEnabled()) {
      // Demo mode — return sample data
      return NextResponse.json({
        success: true,
        data: getDemoLibrary(childId, generationType, status),
        total: 3,
        limit,
        offset,
      });
    }

    let query = (sb.from("aria_studio_generations") as SB)
      .select("id, organisation_id, home_id, child_id, generation_type, title, brief, tone, audience, status, output_json, safety_json, model, created_by, created_at, approved_by, approved_at, committed_by, committed_at, updated_at", { count: "exact" })
      .eq("home_id", homeId)
      .order("created_at", { ascending: false });

    if (childId) query = query.eq("child_id", childId);
    if (generationType) query = query.eq("generation_type", generationType);
    if (status) query = query.eq("status", status);

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error("[cara-studio/library] Query failed:", error);
      return NextResponse.json(
        { error: "Failed to fetch library" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error("[cara-studio/library] Error:", err);
    return NextResponse.json(
      { error: "Library query failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ── Demo Data ─────────────────────────────────────────────────────────────────

function getDemoLibrary(childId?: string, generationType?: string, status?: string) {
  const items = [
    {
      id: "gen_demo_1",
      generation_type: "KEYWORK_SESSION",
      title: "Keywork Session — Emotional Regulation",
      brief: "Plan a keywork session focused on emotional regulation strategies",
      tone: "warm_professional",
      audience: "staff",
      status: "approved" as GenerationStatus,
      child_id: "child_jordan",
      model: "gpt-4o",
      created_by: "staff_darren",
      created_at: "2026-05-14T10:30:00Z",
      approved_by: "staff_manager",
      approved_at: "2026-05-14T11:00:00Z",
    },
    {
      id: "gen_demo_2",
      generation_type: "STAFF_BRIEFING",
      title: "Morning Handover Brief",
      brief: "Create a morning handover briefing covering key updates",
      tone: "direct",
      audience: "staff",
      status: "draft" as GenerationStatus,
      child_id: null,
      model: "gpt-4o",
      created_by: "staff_darren",
      created_at: "2026-05-15T08:00:00Z",
      approved_by: null,
      approved_at: null,
    },
    {
      id: "gen_demo_3",
      generation_type: "YOUNG_PERSON_EXPLAINER",
      title: "Understanding Your Care Plan",
      brief: "Explain care plan objectives in young-person-friendly language",
      tone: "calm_reassuring",
      audience: "young_person",
      status: "committed" as GenerationStatus,
      child_id: "child_jordan",
      model: "gpt-4o",
      created_by: "staff_darren",
      created_at: "2026-05-12T14:00:00Z",
      approved_by: "staff_manager",
      approved_at: "2026-05-12T15:00:00Z",
    },
  ];

  return items.filter((item) => {
    if (childId && item.child_id !== childId) return false;
    if (generationType && item.generation_type !== generationType) return false;
    if (status && item.status !== status) return false;
    return true;
  });
}
