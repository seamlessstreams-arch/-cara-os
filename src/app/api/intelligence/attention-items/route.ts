import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeIntelligenceAudit } from "@/lib/intelligence/audit";
import { attentionItems, nextFallbackId } from "@/lib/intelligence/fallback-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = any;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const status = searchParams.get("status");
  const urgency = searchParams.get("urgency");
  const category = searchParams.get("category");

  if (!isSupabaseEnabled()) {
    let rows = [...attentionItems];
    if (homeId) rows = rows.filter((r) => r.home_id === homeId);
    if (status) rows = rows.filter((r) => r.status === status);
    if (urgency) rows = rows.filter((r) => r.urgency === urgency);
    if (category) rows = rows.filter((r) => r.category === category);
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return NextResponse.json({ ok: true, items: rows, persisted: true });
  }

  const supabase = createServerClient() as unknown as LooseSupabase;
  let query = supabase.from("manager_attention_items").select("*").order("created_at", { ascending: false });

  if (homeId) query = query.eq("home_id", homeId);
  if (status) query = query.eq("status", status);
  if (urgency) query = query.eq("urgency", urgency);
  if (category) query = query.eq("category", category);

  const { data, error } = await query.limit(100);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, items: data ?? [], persisted: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { homeId, title, category, urgency, childId, staffId, sourceRecordType, sourceRecordId, reason, suggestedAction, dueDate, actorUserId, actorRole } = body;

    if (!homeId || !title || !category || !sourceRecordType) {
      return NextResponse.json(
        { error: "homeId, title, category, and sourceRecordType are required" },
        { status: 400 },
      );
    }

    if (!isSupabaseEnabled()) {
      const now = new Date().toISOString();
      const row = {
        id: nextFallbackId("att"),
        home_id: homeId as string,
        title: title as string,
        category: category as string,
        urgency: (urgency as string) ?? "medium",
        status: "open",
        child_id: (childId as string) ?? null,
        staff_id: (staffId as string) ?? null,
        source_record_type: sourceRecordType as string,
        source_record_id: (sourceRecordId as string) ?? null,
        reason: (reason as string) ?? "",
        suggested_action: (suggestedAction as string) ?? "",
        due_date: (dueDate as string) ?? null,
        reviewed_by: null,
        reviewed_at: null,
        escalated_to: null,
        escalated_at: null,
        created_by: (actorUserId as string) ?? null,
        created_at: now,
        updated_at: now,
      };
      attentionItems.unshift(row);
      return NextResponse.json({ ok: true, item: row, persisted: true });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const { data, error } = await supabase.from("manager_attention_items").insert({
      home_id: homeId,
      title,
      category,
      urgency: urgency ?? "medium",
      child_id: childId ?? null,
      staff_id: staffId ?? null,
      source_record_type: sourceRecordType,
      source_record_id: sourceRecordId ?? null,
      reason: reason ?? null,
      suggested_action: suggestedAction ?? null,
      due_date: dueDate ?? null,
      created_by: actorUserId ?? null,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeIntelligenceAudit({
      homeId,
      entityType: "manager_attention_item",
      entityId: data?.id,
      action: "record_created",
      actorUserId,
      actorRole,
    });

    return NextResponse.json({ ok: true, item: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/attention-items] POST error:", err);
    return NextResponse.json({ error: "Failed to create attention item" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, reviewedBy, escalatedTo, actorUserId, actorRole, homeId } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      const idx = attentionItems.findIndex((r) => r.id === id);
      if (idx >= 0) {
        const now = new Date().toISOString();
        attentionItems[idx] = {
          ...attentionItems[idx],
          status,
          updated_at: now,
          ...(status === "reviewed" ? { reviewed_by: (reviewedBy as string) ?? (actorUserId as string) ?? null, reviewed_at: now } : {}),
          ...(status === "escalated" ? { escalated_to: (escalatedTo as string) ?? "ri", escalated_at: now } : {}),
        };
        return NextResponse.json({ ok: true, item: attentionItems[idx], persisted: true });
      }
      return NextResponse.json({ ok: true, item: null, persisted: true });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { status, updated_at: now };

    if (status === "reviewed") {
      updates.reviewed_by = reviewedBy ?? actorUserId ?? null;
      updates.reviewed_at = now;
    }
    if (status === "escalated") {
      updates.escalated_to = escalatedTo ?? "ri";
      updates.escalated_at = now;
    }

    const { data, error } = await supabase.from("manager_attention_items").update(updates).eq("id", id).select().single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const auditAction = status === "escalated" ? "attention_item_escalated" : "attention_item_reviewed";
    await writeIntelligenceAudit({
      homeId,
      entityType: "manager_attention_item",
      entityId: id,
      action: auditAction as "attention_item_reviewed" | "attention_item_escalated",
      actorUserId,
      actorRole,
      detail: { newStatus: status },
    });

    return NextResponse.json({ ok: true, item: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/attention-items] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update attention item" }, { status: 500 });
  }
}
