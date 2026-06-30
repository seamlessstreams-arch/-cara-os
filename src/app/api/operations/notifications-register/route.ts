import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  NOTIFICATION_TYPES,
  NOTIFIED_BODIES,
  NOTIFICATION_STATUSES,
  TIMELINESS_OPTIONS,
} from "@/lib/services/notifications-register-service";
import type {
  NotificationType,
  NotificationStatus,
  TimelinessMet,
} from "@/lib/services/notifications-register-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "notification_types") return NextResponse.json({ ok: true, data: NOTIFICATION_TYPES });
  if (type === "notified_bodies") return NextResponse.json({ ok: true, data: NOTIFIED_BODIES });
  if (type === "notification_statuses") return NextResponse.json({ ok: true, data: NOTIFICATION_STATUSES });
  if (type === "timeliness_options") return NextResponse.json({ ok: true, data: TIMELINESS_OPTIONS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    notificationType: (searchParams.get("notificationType") ?? undefined) as NotificationType | undefined,
    notificationStatus: (searchParams.get("notificationStatus") ?? undefined) as NotificationStatus | undefined,
    timelinessMet: (searchParams.get("timelinessMet") ?? undefined) as TimelinessMet | undefined,
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

  if (action === "create_record") {
    const result = await createRecord(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_record") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateRecord(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
