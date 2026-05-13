import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listDailyRecords,
  getDailyRecord,
  createDailyRecord,
  updateDailyRecord,
  signOffRecord,
  RECORDING_STANDARDS,
  SHIFT_TIMES,
} from "@/lib/services/daily-recording-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  // Static constants (no DB)
  if (type === "standards") {
    return NextResponse.json({ ok: true, data: RECORDING_STANDARDS });
  }
  if (type === "shift_times") {
    return NextResponse.json({ ok: true, data: SHIFT_TIMES });
  }

  // Single record
  const id = searchParams.get("id");
  if (id) {
    const result = await getDailyRecord(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  // List records
  const result = await listDailyRecords(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    authorId: searchParams.get("authorId") ?? undefined,
    recordType: searchParams.get("recordType") as "daily_log" | "shift_note" ?? undefined,
    shiftType: searchParams.get("shiftType") as "early" | "late" ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, homeId } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "create") {
      const result = await createDailyRecord({
        homeId,
        childId: body.childId,
        recordType: body.recordType ?? "daily_log",
        shiftType: body.shiftType,
        authorId: body.authorId,
        content: body.content,
        moodObservations: body.moodObservations,
        behaviourNotes: body.behaviourNotes,
        medicationNotes: body.medicationNotes,
        safeguardingFlags: body.safeguardingFlags ?? [],
        positiveHighlights: body.positiveHighlights ?? [],
        concerns: body.concerns ?? [],
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateDailyRecord(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "sign_off") {
      const { id, signedOffBy } = body;
      if (!id || !signedOffBy) return NextResponse.json({ error: "id and signedOffBy required" }, { status: 400 });
      const result = await signOffRecord(id, signedOffBy);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json({ error: "action must be create, update, or sign_off" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
