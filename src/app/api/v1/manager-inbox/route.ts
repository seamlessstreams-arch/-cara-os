// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGER ACTION INBOX API ROUTE
// GET /api/v1/manager-inbox
//
// One prioritised command centre: composes the canonical event stream into the
// approvals, safeguarding alerts, high-risk events and compliance gaps a manager
// must act on — each with reason, deadline, links, Cara suggestion and actions.
// CHR 2015 Reg 13 (leadership oversight).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { loadEventStoreShape } from "@/lib/event-stream/dal-store-shape";
import { buildEventStream } from "@/lib/event-stream/event-projector";
import { mapStoreToEventInput } from "@/lib/event-stream/store-mapper";
import { computeManagerInbox } from "@/lib/manager-inbox/manager-inbox-engine";

export async function GET() {
  const stream = buildEventStream(mapStoreToEventInput(await loadEventStoreShape()));
  const result = computeManagerInbox({ events: stream.events });
  return NextResponse.json({ data: result });
}
