// ══════════════════════════════════════════════════════════════════════════════
// CARA — UNIFIED EVENT STREAM API ROUTE
// GET /api/v1/event-stream
//
// Projects the home's domain collections into one normalised CornerstoneEvent
// stream — the "capture once, surface everywhere" backbone. Returns the unified
// timeline plus an overview (counts by type/risk, pending approvals, Cara
// compliance flags).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { loadEventStoreShape } from "@/lib/event-stream/dal-store-shape";
import { buildLiveEventStream } from "@/lib/event-stream/live-event-stream";

export async function GET() {
  // Live spine = read-only projection of domain collections ∪ events captured
  // directly to the spine (store.cornerstoneEvents). Capture once, surface here.
  const result = buildLiveEventStream(await loadEventStoreShape());
  return NextResponse.json({ data: result });
}
