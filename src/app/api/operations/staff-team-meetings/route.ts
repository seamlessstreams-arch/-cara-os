import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listMeetings,
  createMeeting,
  updateMeeting,
  MEETING_TYPES,
  MEETING_STATUSES,
  MINUTES_STATUSES,
  ACTION_PRIORITIES,
} from "@/lib/services/staff-team-meetings-service";
import type {
  MeetingType,
  MeetingStatus,
} from "@/lib/services/staff-team-meetings-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "meeting_types") return NextResponse.json({ ok: true, data: MEETING_TYPES });
  if (type === "meeting_statuses") return NextResponse.json({ ok: true, data: MEETING_STATUSES });
  if (type === "minutes_statuses") return NextResponse.json({ ok: true, data: MINUTES_STATUSES });
  if (type === "action_priorities") return NextResponse.json({ ok: true, data: ACTION_PRIORITIES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listMeetings(homeId, {
    meetingType: (searchParams.get("meetingType") ?? undefined) as MeetingType | undefined,
    meetingStatus: (searchParams.get("meetingStatus") ?? undefined) as MeetingStatus | undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const __parsed = await readJsonBody(request);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const { action, ...payload } = body;

  if (action === "create_meeting") {
    const result = await createMeeting(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_meeting") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateMeeting(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
