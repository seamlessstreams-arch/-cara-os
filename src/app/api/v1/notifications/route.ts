import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const recipientId = searchParams.get("recipient_id");
  const unreadOnly = searchParams.get("unread_only") === "true";

  let notifications = db.notifications.findAll();
  if (recipientId) notifications = notifications.filter((n) => n.recipient_id === recipientId);
  if (unreadOnly) notifications = notifications.filter((n) => !n.read);

  return NextResponse.json(notifications.sort((a, b) => b.created_at.localeCompare(a.created_at)));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const notif = db.notifications.create(body);
  return NextResponse.json(notif, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  const updated = db.notifications.patch(id, updates);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
