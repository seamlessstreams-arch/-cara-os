import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { resolveCommsUser, auditComms } from "@/lib/comms/comms-service";
import { persistTrustNoticeAck } from "@/lib/supabase/comms";
import { STAFF_TRUST_NOTICE_VERSION } from "@/types/comms";

export const dynamic = "force-dynamic";

// GET /api/v1/comms/trust-notice → current version + whether the user has acknowledged it.
export async function GET(req: NextRequest) {
  const user = resolveCommsUser(req);
  const latest = db.staffTrustNoticeAcks.latestForUser(user.id);
  const acknowledged = !!latest && latest.notice_version === STAFF_TRUST_NOTICE_VERSION;
  return NextResponse.json({
    data: {
      version: STAFF_TRUST_NOTICE_VERSION,
      acknowledged,
      acknowledged_at: acknowledged ? latest!.acknowledged_at : null,
    },
  });
}

// POST /api/v1/comms/trust-notice → acknowledge the current Staff Trust Notice.
export async function POST(req: NextRequest) {
  const user = resolveCommsUser(req);
  let body: { device_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* no body */
  }
  const ack = db.staffTrustNoticeAcks.create({
    organisation_id: "org_default",
    user_id: user.id,
    notice_version: STAFF_TRUST_NOTICE_VERSION,
    device_id: body.device_id ?? null,
  });
  auditComms("trust_notice_acknowledged", user, ack.id, { version: STAFF_TRUST_NOTICE_VERSION });
  void persistTrustNoticeAck(ack);
  return NextResponse.json({ data: ack }, { status: 201 });
}
