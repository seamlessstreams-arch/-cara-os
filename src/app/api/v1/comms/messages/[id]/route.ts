import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { resolveCommsUser, auditComms } from "@/lib/comms/comms-service";
import { isManagerRole } from "@/lib/comms/comms-access";
import { persistCommsMessage } from "@/lib/supabase/comms";

export const dynamic = "force-dynamic";

// PATCH /api/v1/comms/messages/[id]  → edit own message (keeps edit history).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = resolveCommsUser(req);
  const msg = db.commsMessages.findById(id);
  if (!msg || msg.is_deleted) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  if (msg.author_id !== user.id) return NextResponse.json({ error: "You can only edit your own messages" }, { status: 403 });
  if (msg.investigation_hold) return NextResponse.json({ error: "Message is under investigation hold" }, { status: 423 });

  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const newText = body.body?.trim();
  if (!newText) return NextResponse.json({ error: "body is required" }, { status: 400 });

  const updated = db.commsMessages.patch(id, {
    body: newText,
    edited: true,
    edit_history: [...msg.edit_history, { body: msg.body, edited_at: new Date().toISOString(), edited_by: user.id }],
  });
  auditComms("message_edited", user, id, {});
  if (updated) void persistCommsMessage(updated);
  return NextResponse.json({ data: updated });
}

// DELETE /api/v1/comms/messages/[id]  → SOFT delete (author or manager). Never hard-deleted.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = resolveCommsUser(req);
  const msg = db.commsMessages.findById(id);
  if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  if (msg.author_id !== user.id && !isManagerRole(user.role)) {
    return NextResponse.json({ error: "Only the author or a manager can delete this message" }, { status: 403 });
  }
  if (msg.investigation_hold) return NextResponse.json({ error: "Message is under investigation hold" }, { status: 423 });

  const updated = db.commsMessages.patch(id, { is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: user.id });
  auditComms("message_deleted", user, id, {});
  if (updated) void persistCommsMessage(updated);
  return NextResponse.json({ data: { id, is_deleted: true } });
}
