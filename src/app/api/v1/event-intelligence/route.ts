// ══════════════════════════════════════════════════════════════════════════════
// CARA — EVENT INTELLIGENCE API ROUTE
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
import { dal } from "@/lib/db/dal";
import { buildLiveEventStream } from "@/lib/event-stream/live-event-stream";
import { computeEventIntelligence } from "@/lib/event-intelligence/event-intelligence-engine";

// Read a dal collection defensively: a transient query failure degrades to an
// empty list rather than 500-ing the whole route.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const store = getStore();

  // Capture once → one canonical stream (projected ∪ captured) → analytics.
  const stream = buildLiveEventStream(store);

  const youngPeople = await safeList(dal.youngPeople.findAll());
  const children = youngPeople
    .filter((yp: any) => yp.status === "current")
    .map((yp: any) => ({
      id: yp.id,
      name: yp.preferred_name || `${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim() || yp.id,
    }));

  const result = computeEventIntelligence({ events: stream.events, children });

  return NextResponse.json({ data: result });
}
