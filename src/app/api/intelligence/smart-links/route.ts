import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeIntelligenceAudit } from "@/lib/intelligence/audit";
import { suggestSmartLinks, type SmartLinkContext } from "@/lib/intelligence/smart-linking";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = any;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sourceType = searchParams.get("sourceType");
  const sourceId = searchParams.get("sourceId");

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, links: [], persisted: false });
  }

  const supabase = createServerClient() as unknown as LooseSupabase;
  let query = supabase.from("smart_record_links").select("*").order("created_at", { ascending: false });

  if (sourceType) query = query.eq("source_type", sourceType);
  if (sourceId) query = query.eq("source_id", sourceId);

  const { data, error } = await query.limit(50);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, links: data ?? [], persisted: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "suggest") {
      const ctx: SmartLinkContext = {
        sourceType: body.sourceType,
        sourceId: body.sourceId,
        childId: body.childId,
        staffId: body.staffId,
        homeId: body.homeId,
        severity: body.severity,
        category: body.category,
      };
      const suggestions = suggestSmartLinks(ctx);
      return NextResponse.json({ ok: true, suggestions });
    }

    // Create a link
    const { homeId, sourceType, sourceId, targetType, targetId, relationship, suggestedBy, actorUserId, actorRole } = body;

    if (!homeId || !sourceType || !sourceId || !targetType || !targetId || !relationship) {
      return NextResponse.json(
        { error: "homeId, sourceType, sourceId, targetType, targetId, and relationship are required" },
        { status: 400 },
      );
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const { data, error } = await supabase.from("smart_record_links").insert({
      home_id: homeId,
      source_type: sourceType,
      source_id: sourceId,
      target_type: targetType,
      target_id: targetId,
      relationship,
      suggested_by: suggestedBy ?? "user",
      created_by: actorUserId ?? null,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeIntelligenceAudit({
      homeId,
      entityType: "smart_record_link",
      entityId: data?.id,
      action: "smart_link_created",
      actorUserId,
      actorRole,
      detail: { sourceType, targetType, relationship },
    });

    return NextResponse.json({ ok: true, link: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/smart-links] POST error:", err);
    return NextResponse.json({ error: "Failed to process smart link" }, { status: 500 });
  }
}
