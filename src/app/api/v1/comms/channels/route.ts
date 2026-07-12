import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { resolveCommsUser, auditComms } from "@/lib/comms/comms-service";
import { canViewChannel, isManagerRole } from "@/lib/comms/comms-access";
import { persistCommsChannel } from "@/lib/supabase/comms";
import type { CommsChannelSummary } from "@/types/comms";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

// GET /api/v1/comms/channels → channels the acting user may view, with unread counts.
export async function GET(req: NextRequest) {
  const user = await resolveCommsUser(req);
  const channels = db.commsChannels.findForHome(user.home_id);
  const visible = channels.filter((c) => canViewChannel(user, c).allowed);

  const data: CommsChannelSummary[] = visible.map((c) => {
    const msgs = db.commsMessages.findByChannel(c.id);
    const receipts = db.commsMessageReceipts.findForUserInChannel(user.id, c.id);
    const readIds = new Set(receipts.filter((r) => r.read_at).map((r) => r.message_id));
    const unread = msgs.filter((m) => m.author_id !== user.id && !readIds.has(m.id)).length;
    const last = msgs[msgs.length - 1] ?? null;
    return {
      ...c,
      unread_count: unread,
      last_message_at: last?.created_at ?? null,
      last_message_preview: last ? last.body.slice(0, 80) : null,
    };
  });

  return NextResponse.json({ data });
}

// POST /api/v1/comms/channels → create a channel (managers only).
export async function POST(req: NextRequest) {
  const user = await resolveCommsUser(req);
  if (!isManagerRole(user.role)) {
    auditComms("access_denied", user, "channel:create", { reason: "managers_only" });
    return NextResponse.json({ error: "Only managers can create channels" }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const channel = db.commsChannels.create({
    home_id: user.home_id,
    type: (body.type as never) ?? "home_announcements",
    name: (body.name as string) ?? "New Channel",
    description: (body.description as string) ?? null,
    access: (body.access as never) ?? "all_staff",
    allowed_roles: Array.isArray(body.allowed_roles) ? (body.allowed_roles as string[]) : [],
    linked_child_id: (body.linked_child_id as string) ?? null,
    linked_incident_id: (body.linked_incident_id as string) ?? null,
    sensitivity: (body.sensitivity as never) ?? "internal",
    created_by: user.id,
  });
  auditComms("channel_created", user, channel.id, { type: channel.type, access: channel.access });
  void persistCommsChannel(channel);
  return NextResponse.json({ data: channel }, { status: 201 });
}
