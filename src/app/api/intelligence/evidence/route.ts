import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeIntelligenceAudit } from "@/lib/intelligence/audit";
import { scanEvidenceGaps, type EvidenceGapScanInput } from "@/lib/intelligence/evidence-gap-scanner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = any;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const category = searchParams.get("category");
  const judgementArea = searchParams.get("judgementArea");

  if (!isSupabaseEnabled()) {
    return NextResponse.json({
      ok: true,
      items: [],
      persisted: false,
      message: "Supabase not configured. Evidence room operates in demo mode.",
    });
  }

  const supabase = createServerClient() as unknown as LooseSupabase;
  let query = supabase.from("inspection_evidence_items").select("*").order("evidence_date", { ascending: false });

  if (homeId) query = query.eq("home_id", homeId);
  if (category) query = query.eq("evidence_category", category);
  if (judgementArea) query = query.eq("judgement_area", judgementArea);

  const { data, error } = await query.limit(100);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, items: data ?? [], persisted: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { homeId, title, summary, evidenceCategory, judgementArea, sourceType, sourceId, childId, staffId, evidenceDate, actorUserId, actorRole } = body;

    if (!homeId || !title || !evidenceCategory || !sourceType) {
      return NextResponse.json(
        { error: "homeId, title, evidenceCategory, and sourceType are required" },
        { status: 400 },
      );
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({
        ok: true,
        persisted: false,
        message: "Evidence item accepted but not persisted (Supabase not configured).",
      });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const { data, error } = await supabase.from("inspection_evidence_items").insert({
      home_id: homeId,
      title,
      summary: summary ?? null,
      evidence_category: evidenceCategory,
      judgement_area: judgementArea ?? null,
      source_type: sourceType,
      source_id: sourceId ?? null,
      child_id: childId ?? null,
      staff_id: staffId ?? null,
      evidence_date: evidenceDate ?? new Date().toISOString().split("T")[0],
      created_by: actorUserId ?? null,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeIntelligenceAudit({
      homeId,
      entityType: "inspection_evidence_item",
      entityId: data?.id,
      action: "record_created",
      actorUserId,
      actorRole,
    });

    return NextResponse.json({ ok: true, item: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/evidence] POST error:", err);
    return NextResponse.json({ error: "Failed to create evidence item" }, { status: 500 });
  }
}
