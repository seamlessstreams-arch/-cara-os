// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EVENT INTELLIGENCE API ROUTE
// GET /api/v1/event-intelligence
//
// The "capture once → analytics" payoff: projects the store into the canonical
// CornerstoneEvent stream, then runs stream-native analytics over it — a
// cross-domain per-child risk radar, the approval backlog, the compliance
// register and theme trends. The analytics consume the SAME stream that powers
// the timeline, not the raw store.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildLiveEventStream } from "@/lib/event-stream/live-event-stream";
import { computeEventIntelligence } from "@/lib/event-intelligence/event-intelligence-engine";

export async function GET() {
  const store = getStore();

  // Capture once → one canonical stream (projected ∪ captured) → analytics.
  const stream = buildLiveEventStream(store);

  const children = ((store.youngPeople ?? []) as any[])
    .filter((yp: any) => yp.status === "current")
    .map((yp: any) => ({
      id: yp.id,
      name: yp.preferred_name || `${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim() || yp.id,
    }));

  const result = computeEventIntelligence({ events: stream.events, children });

  return NextResponse.json({ data: result });
}
