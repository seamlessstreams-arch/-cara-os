import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { resolveCommsUser, auditComms } from "@/lib/comms/comms-service";
import { isManagerRole } from "@/lib/comms/comms-access";
import { isValidRetentionCategory } from "@/lib/comms/comms-governance";
import { persistCommsMessage } from "@/lib/supabase/comms";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

// POST /api/v1/comms/messages/[id]/hold
//
// Manager-only investigation hold. Placing a hold FREEZES the message — it can no
// longer be edited, deleted or converted (enforced server-side by the 423 checks on
// those routes) — and bumps its retention so it is preserved while a matter is live.
// Releasing lifts the freeze. The message body is never altered here; only the hold
// + retention flags change. Every change is audited.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await resolveCommsUser(req);
  if (!isManagerRole(user.role)) {
    return NextResponse.json({ error: "Only a manager can place or release an investigation hold" }, { status: 403 });
  }

  const msg = db.commsMessages.findById(id);
  if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  let body: { hold?: boolean; retention_category?: string; reason?: string };
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.hold !== "boolean") {
    return NextResponse.json({ error: "hold (boolean) is required" }, { status: 400 });
  }
  if (body.retention_category && !isValidRetentionCategory(body.retention_category)) {
    return NextResponse.json({ error: "Unknown retention_category" }, { status: 400 });
  }

  const hold = body.hold;
  const retention_category =
    body.retention_category ?? (hold ? "investigation" : msg.retention_category);

  const updated = db.commsMessages.patch(id, { investigation_hold: hold, retention_category });

  auditComms(hold ? "message_held" : "message_hold_released", user, id, {
    reason: body.reason ?? null,
    retention_category,
  });
  if (updated) void persistCommsMessage(updated);

  return NextResponse.json({ data: updated });
}
