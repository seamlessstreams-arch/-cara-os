// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUTOMATED EVIDENCE BANK API ROUTE
// GET /api/v1/evidence-bank
//
// Rolls the canonical event stream up by Ofsted evidence category — coverage,
// recency, contributing event types and gaps. The evidence pack builds itself.
// CHR 2015 Reg 44/45, Reg 13.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { loadEventStoreShape } from "@/lib/event-stream/dal-store-shape";
import { buildEventStream } from "@/lib/event-stream/event-projector";
import { mapStoreToEventInput } from "@/lib/event-stream/store-mapper";
import { computeEvidenceBank } from "@/lib/evidence-bank/evidence-bank-engine";

export async function GET() {
  const stream = buildEventStream(mapStoreToEventInput(await loadEventStoreShape()));
  const result = computeEvidenceBank({ events: stream.events });
  return NextResponse.json({ data: result });
}
