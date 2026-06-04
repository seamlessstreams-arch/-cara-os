import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { resolveCommsUser, auditComms } from "@/lib/comms/comms-service";
import { canViewChannel } from "@/lib/comms/comms-access";
import { persistCommsReceipt } from "@/lib/supabase/comms";

export const dynamic = "force-dynamic";

// POST /api/v1/comms/messages/[id]/receipt  { acknowledge?: boolean }
// Marks a message read; if acknowledge=true also records acknowledgement.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = resolveCommsUser(req);
  const msg = db.commsMessages.findById(id);
  if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const channel = db.commsChannels.findById(msg.channel_id);
  if (!channel || !canViewChannel(user, channel).allowed) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  let acknowledge = false;
  try {
    acknowledge = !!(await req.json())?.acknowledge;
  } catch {
    /* read-only mark */
  }

  const receipt = db.commsMessageReceipts.mark(id, msg.channel_id, user.id, { read: true, acknowledge });
  auditComms(acknowledge ? "message_acknowledged" : "message_read", user, id, {});
  void persistCommsReceipt(receipt);
  return NextResponse.json({ data: receipt });
}
