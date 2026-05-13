import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listComplaints,
  createComplaint,
  updateComplaint,
  COMPLAINT_SOURCES,
  COMPLAINT_CATEGORIES,
  INVESTIGATION_STAGES,
  COMPLAINT_OUTCOMES,
} from "@/lib/services/complaints-investigation-service";
import type {
  ComplaintSource,
  ComplaintCategory,
  InvestigationStage,
} from "@/lib/services/complaints-investigation-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "complaint_sources") return NextResponse.json({ ok: true, data: COMPLAINT_SOURCES });
  if (type === "complaint_categories") return NextResponse.json({ ok: true, data: COMPLAINT_CATEGORIES });
  if (type === "investigation_stages") return NextResponse.json({ ok: true, data: INVESTIGATION_STAGES });
  if (type === "complaint_outcomes") return NextResponse.json({ ok: true, data: COMPLAINT_OUTCOMES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listComplaints(homeId, {
    complaintSource: (searchParams.get("complaintSource") ?? undefined) as ComplaintSource | undefined,
    complaintCategory: (searchParams.get("complaintCategory") ?? undefined) as ComplaintCategory | undefined,
    investigationStage: (searchParams.get("investigationStage") ?? undefined) as InvestigationStage | undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  if (action === "create_complaint") {
    const result = await createComplaint(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_complaint") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateComplaint(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
