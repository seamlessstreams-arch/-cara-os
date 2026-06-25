import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { resolveCommsUser, auditComms } from "@/lib/comms/comms-service";
import { canViewChannel, canPostChannel, type CommsUser } from "@/lib/comms/comms-access";
import { persistCommsMessage } from "@/lib/supabase/comms";
import { sendPushToUser } from "@/lib/push/web-push";
import type { CommsMessage, CommsMessageEnriched } from "@/types/comms";

export const dynamic = "force-dynamic";

function staffName(id: string): string {
  const s = (db.staff?.findAll?.() ?? []).find((x: { id: string }) => x.id === id) as
    | { full_name?: string; first_name?: string; last_name?: string }
    | undefined;
  return s?.full_name ?? [s?.first_name, s?.last_name].filter(Boolean).join(" ") ?? "Unknown";
}

function enrich(m: CommsMessage, user: CommsUser): CommsMessageEnriched {
  const receipts = db.commsMessageReceipts.findByMessage(m.id);
  const mine = receipts.find((r) => r.user_id === user.id);
  return {
    ...m,
    body: m.is_deleted ? "[message deleted]" : m.body,
    author_name: staffName(m.author_id),
    read_count: receipts.filter((r) => r.read_at).length,
    acknowledged_count: receipts.filter((r) => r.acknowledged_at).length,
    read_by_me: !!mine?.read_at,
    acknowledged_by_me: !!mine?.acknowledged_at,
  };
}

// GET /api/v1/comms/messages?channel_id=  → messages in a channel (access-checked).
export async function GET(req: NextRequest) {
  const user = await resolveCommsUser(req);
  const channelId = req.nextUrl.searchParams.get("channel_id");
  if (!channelId) return NextResponse.json({ error: "channel_id is required" }, { status: 400 });
  const channel = db.commsChannels.findById(channelId);
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  const access = canViewChannel(user, channel);
  if (!access.allowed) {
    auditComms("access_denied", user, `channel:${channelId}`, { reason: access.reason });
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
  }
  const data = db.commsMessages.findByChannel(channelId).map((m) => enrich(m, user));
  return NextResponse.json({ data });
}

// POST /api/v1/comms/messages  → send a message (access-checked, audited, write-through).
export async function POST(req: NextRequest) {
  const user = await resolveCommsUser(req);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const channelId = body.channel_id as string;
  const text = (body.body as string)?.trim();
  if (!channelId || !text) return NextResponse.json({ error: "channel_id and body are required" }, { status: 400 });

  const channel = db.commsChannels.findById(channelId);
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  const access = canPostChannel(user, channel);
  if (!access.allowed) {
    auditComms("access_denied", user, `channel:${channelId}`, { reason: access.reason, intent: "post" });
    return NextResponse.json({ error: "You cannot post in this channel", reason: access.reason }, { status: 403 });
  }

  const priority = (["normal", "urgent", "emergency"].includes(body.priority as string) ? body.priority : "normal") as CommsMessage["priority"];
  const msg = db.commsMessages.create({
    channel_id: channelId,
    home_id: channel.home_id,
    author_id: user.id,
    body: text,
    priority,
    requires_acknowledgement: !!body.requires_acknowledgement || priority !== "normal",
    linked_child_id: (body.linked_child_id as string) ?? channel.linked_child_id ?? null,
    linked_incident_id: (body.linked_incident_id as string) ?? channel.linked_incident_id ?? null,
    linked_record_type: (body.linked_record_type as never) ?? null,
    linked_record_id: (body.linked_record_id as string) ?? null,
    retention_category: channel.access === "safeguarding" ? "safeguarding_linked_messages" : channel.linked_child_id ? "child_linked_messages" : "routine_messages",
  });
  // Author has implicitly read their own message.
  db.commsMessageReceipts.mark(msg.id, channelId, user.id, { read: true });
  auditComms("message_sent", user, msg.id, { channel_id: channelId, priority, has_link: !!msg.linked_child_id || !!msg.linked_incident_id });
  void persistCommsMessage(msg);

  // Privacy-safe notification for urgent/emergency — NO message content, NO child/incident detail.
  if (priority !== "normal") {
    const recipients = (db.staff?.findAll?.() ?? []).filter((s: { id: string; home_id?: string; role?: string }) => {
      if (s.id === user.id) return false;
      const u: CommsUser = { id: s.id, role: s.role ?? "residential_care_worker", home_id: s.home_id ?? "home_oak", shift_active: true };
      return canViewChannel(u, channel).allowed;
    });
    for (const r of recipients as Array<{ id: string }>) {
      db.notifications.create({
        home_id: channel.home_id,
        recipient_id: r.id,
        title: priority === "emergency" ? "Emergency broadcast" : "Urgent message",
        body: `New ${priority} message in ${channel.name}. Open the Comms Centre to read.`,
        type: "system",
        priority: priority === "emergency" ? "urgent" : "high",
        read: false,
        action_url: "/comms",
      });
      // Also ping the device — operational only (channel name, no message content).
      void sendPushToUser(r.id, {
        title: priority === "emergency" ? "Emergency broadcast" : "Urgent message",
        body: `New ${priority} message in ${channel.name}.`,
        url: "/comms",
        tag: `comms-${channelId}`,
        priority: priority === "emergency" ? "critical" : "normal",
      });
    }
  }

  return NextResponse.json({ data: enrich(msg, user) }, { status: 201 });
}
