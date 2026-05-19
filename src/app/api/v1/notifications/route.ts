import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { careEventsDb } from "@/lib/db";
import { isSupabaseEnabled } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const recipientId = searchParams.get("recipient_id");
  const unreadOnly = searchParams.get("unread_only") === "true";

  if (isSupabaseEnabled()) {
    if (!recipientId) {
      return NextResponse.json({ error: "recipient_id is required" }, { status: 400 });
    }
    const notifications = await careEventsDb.notifications.findByRecipient(recipientId, unreadOnly);
    return NextResponse.json(notifications);
  }

  // In-memory fallback
  let notifications = db.notifications.findAll();
  if (recipientId) notifications = notifications.filter((n) => n.recipient_id === recipientId);
  if (unreadOnly) notifications = notifications.filter((n) => !n.read);
  return NextResponse.json(notifications.sort((a, b) => b.created_at.localeCompare(a.created_at)));
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (isSupabaseEnabled()) {
    const notif = await careEventsDb.notifications.create(body);
    return NextResponse.json(notif, { status: 201 });
  }

  const notif = db.notifications.create(body);
  return NextResponse.json(notif, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (isSupabaseEnabled()) {
    if (updates.read === true || updates.read_at) {
      await careEventsDb.notifications.markRead(id);
      return NextResponse.json({ id, read: true, read_at: new Date().toISOString() });
    }
    return NextResponse.json({ error: "Unsupported update" }, { status: 400 });
  }

  const updated = db.notifications.patch(id, updates);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
