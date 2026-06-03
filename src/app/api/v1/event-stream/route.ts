// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — UNIFIED EVENT STREAM API ROUTE
// GET /api/v1/event-stream
//
// Projects the home's domain collections into one normalised CornerstoneEvent
// stream — the "capture once, surface everywhere" backbone. Returns the unified
// timeline plus an overview (counts by type/risk, pending approvals, ARIA
// compliance flags).
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildLiveEventStream } from "@/lib/event-stream/live-event-stream";

export async function GET() {
  // Live spine = read-only projection of domain collections ∪ events captured
  // directly to the spine (store.cornerstoneEvents). Capture once, surface here.
  const result = buildLiveEventStream(getStore());
  return NextResponse.json({ data: result });
}
