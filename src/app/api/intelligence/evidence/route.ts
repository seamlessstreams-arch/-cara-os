import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeIntelligenceAudit } from "@/lib/intelligence/audit";
import { scanEvidenceGaps, type EvidenceGapScanInput } from "@/lib/intelligence/evidence-gap-scanner";
import { evidenceItems, nextFallbackId } from "@/lib/intelligence/fallback-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = any;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const category = searchParams.get("category");
  const judgementArea = searchParams.get("judgementArea");

  if (!isSupabaseEnabled()) {
    let rows = [...evidenceItems];
    if (homeId) rows = rows.filter((r) => r.home_id === homeId);
    if (category) rows = rows.filter((r) => r.category === category);
    if (judgementArea) rows = rows.filter((r) => r.judgement_area === judgementArea);
    rows.sort((a, b) => b.evidence_date.localeCompare(a.evidence_date));
    return NextResponse.json({ ok: true, items: rows, persisted: true });
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
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { homeId, title, summary, evidenceCategory, judgementArea, sourceType, sourceId, childId, staffId, evidenceDate, actorUserId, actorRole } = body;

    if (!homeId || !title || !evidenceCategory || !sourceType) {
      return NextResponse.json(
        { error: "homeId, title, evidenceCategory, and sourceType are required" },
        { status: 400 },
      );
    }

    if (!isSupabaseEnabled()) {
      const now = new Date().toISOString();
      const row = {
        id: nextFallbackId("ev"),
        home_id: homeId as string,
        child_id: (childId as string) ?? null,
        staff_id: (staffId as string) ?? null,
        source_record_type: sourceType as string,
        source_record_id: (sourceId as string) ?? null,
        title: title as string,
        description: (summary as string) ?? "",
        category: evidenceCategory as string,
        judgement_area: (judgementArea as string) ?? null,
        quality_indicator: null,
        evidence_date: (evidenceDate as string) ?? now.slice(0, 10),
        created_by: (actorUserId as string) ?? null,
        created_at: now,
      };
      evidenceItems.unshift(row);
      return NextResponse.json({ ok: true, item: row, persisted: true });
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
