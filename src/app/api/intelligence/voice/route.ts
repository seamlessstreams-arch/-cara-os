import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeIntelligenceAudit } from "@/lib/intelligence/audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = any;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");
  const homeId = searchParams.get("homeId");
  const category = searchParams.get("category");

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, entries: [], persisted: false });
  }

  const supabase = createServerClient() as unknown as LooseSupabase;
  let query = supabase.from("child_voice_entries").select("*").order("entry_date", { ascending: false });

  if (childId) query = query.eq("child_id", childId);
  if (homeId) query = query.eq("home_id", homeId);
  if (category) query = query.eq("category", category);

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, entries: data ?? [], persisted: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { childId, homeId, entryDate, category, childWords, summary, actionTaken, staffResponse, linkedRecordType, linkedRecordId, actorUserId, actorRole } = body;

    if (!childId || !homeId || !category) {
      return NextResponse.json({ error: "childId, homeId, and category are required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const { data, error } = await supabase.from("child_voice_entries").insert({
      child_id: childId,
      home_id: homeId,
      entry_date: entryDate ?? new Date().toISOString().split("T")[0],
      category,
      child_words: childWords ?? null,
      summary: summary ?? null,
      action_taken: actionTaken ?? null,
      staff_response: staffResponse ?? null,
      linked_record_type: linkedRecordType ?? null,
      linked_record_id: linkedRecordId ?? null,
      created_by: actorUserId ?? null,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeIntelligenceAudit({
      homeId,
      entityType: "child_voice_entry",
      entityId: data?.id,
      action: "voice_entry_created",
      actorUserId,
      actorRole,
      detail: { childId, category },
    });

    return NextResponse.json({ ok: true, entry: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/voice] POST error:", err);
    return NextResponse.json({ error: "Failed to create voice entry" }, { status: 500 });
  }
}
