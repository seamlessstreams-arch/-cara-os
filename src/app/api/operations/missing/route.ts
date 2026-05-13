import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listMissingEpisodes,
  getMissingEpisode,
  reportMissing,
  resolveEpisode,
  updateReturnInterview,
  closeEpisode,
  EPISODE_TYPES,
  TRIGGER_CATEGORIES,
  RETURN_INTERVIEW_STATUS,
  RISK_LEVELS,
} from "@/lib/services/missing-from-care-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "episode_types") {
    return NextResponse.json({ ok: true, data: EPISODE_TYPES });
  }
  if (type === "triggers") {
    return NextResponse.json({ ok: true, data: TRIGGER_CATEGORIES });
  }
  if (type === "interview_statuses") {
    return NextResponse.json({ ok: true, data: RETURN_INTERVIEW_STATUS });
  }
  if (type === "risk_levels") {
    return NextResponse.json({ ok: true, data: RISK_LEVELS });
  }

  const id = searchParams.get("id");
  if (id) {
    const result = await getMissingEpisode(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listMissingEpisodes(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    episodeType: searchParams.get("episodeType") ?? undefined,
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

    if (action === "report") {
      const result = await reportMissing({
        home_id: homeId,
        child_id: body.childId,
        episode_type: body.episodeType,
        reported_missing_at: body.reportedMissingAt ?? new Date().toISOString(),
        reported_by: body.reportedBy,
        police_notified: body.policeNotified ?? false,
        police_notified_at: body.policeNotifiedAt,
        police_reference: body.policeReference,
        placing_authority_notified: body.placingAuthorityNotified ?? false,
        placing_authority_notified_at: body.placingAuthorityNotifiedAt,
        ofsted_notified: body.ofstedNotified ?? false,
        risk_level: body.riskLevel ?? "medium",
        trigger_category: body.triggerCategory,
        trigger_details: body.triggerDetails,
        last_known_location: body.lastKnownLocation,
        found_at: body.foundAt,
        found_location: body.foundLocation,
        found_by: body.foundBy,
        duration_minutes: body.durationMinutes,
        return_interview_status: body.returnInterviewStatus ?? "pending",
        return_interview_date: body.returnInterviewDate,
        return_interview_by: body.returnInterviewBy,
        return_interview_notes: body.returnInterviewNotes,
        actions_taken: body.actionsTaken ?? [],
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "resolve") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await resolveEpisode(id, {
        found_at: body.foundAt,
        found_location: body.foundLocation,
        found_by: body.foundBy,
        duration_minutes: body.durationMinutes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "return_interview") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateReturnInterview(id, {
        return_interview_status: body.returnInterviewStatus,
        return_interview_date: body.returnInterviewDate,
        return_interview_by: body.returnInterviewBy,
        return_interview_notes: body.returnInterviewNotes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "close") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await closeEpisode(id);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be report, resolve, return_interview, or close" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
