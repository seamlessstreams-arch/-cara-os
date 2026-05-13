import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listTrainingRecords, createTrainingRecord, updateTrainingRecord,
  listCompetencyAssessments, createCompetencyAssessment,
  MANDATORY_TRAINING, COMPETENCY_AREAS,
} from "@/lib/services/competency-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  // Reference data (no DB needed)
  if (type === "mandatory_courses") {
    return NextResponse.json({ ok: true, data: MANDATORY_TRAINING });
  }
  if (type === "competency_areas") {
    return NextResponse.json({ ok: true, data: COMPETENCY_AREAS });
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  // Competency assessments
  if (type === "competency") {
    const result = await listCompetencyAssessments(homeId, {
      staffId: searchParams.get("staffId") ?? undefined,
      limit: parseInt(searchParams.get("limit") ?? "100"),
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Training records (default)
  const result = await listTrainingRecords(homeId, {
    staffId: searchParams.get("staffId") ?? undefined,
    category: searchParams.get("category") as any ?? undefined,
    mandatory: searchParams.get("mandatory") === "true" ? true : searchParams.get("mandatory") === "false" ? false : undefined,
    limit: parseInt(searchParams.get("limit") ?? "100"),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    // Create training record
    if (action === "create_training") {
      const { staffId, homeId, category, courseName, isMandatory, provider, completedDate, expiryDate, certificateRef, renewalPeriodMonths, notes } = body;
      if (!staffId || !homeId || !category || !courseName) {
        return NextResponse.json({ error: "staffId, homeId, category, courseName required" }, { status: 400 });
      }
      const result = await createTrainingRecord({
        staffId, homeId, category, courseName, isMandatory: isMandatory ?? false,
        provider, completedDate, expiryDate, certificateRef, renewalPeriodMonths, notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    // Update training record
    if (action === "update_training") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      delete updates.action;
      const result = await updateTrainingRecord(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    // Create competency assessment
    if (action === "create_competency") {
      const { staffId, homeId, competencyArea, level, assessedBy, evidence, developmentNotes, nextReviewDate } = body;
      if (!staffId || !homeId || !competencyArea || !level || !assessedBy) {
        return NextResponse.json({ error: "staffId, homeId, competencyArea, level, assessedBy required" }, { status: 400 });
      }
      const result = await createCompetencyAssessment({
        staffId, homeId, competencyArea, level, assessedBy,
        evidence, developmentNotes, nextReviewDate,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json({ error: "action must be create_training, update_training, or create_competency" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
