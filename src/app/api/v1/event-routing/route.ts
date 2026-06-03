// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EVENT ROUTING API ROUTE
// GET /api/v1/event-routing
//
// The "link intelligently" pillar: projects the store into the canonical event
// stream, then computes — per event — which surfaces it routes to and which
// external notifications it would trigger, gating everything externally-facing
// behind human approval. Produces a PLAN only; no external calls are made.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildEventStream } from "@/lib/event-stream/event-projector";
import { mapStoreToEventInput } from "@/lib/event-stream/store-mapper";
import { computeEventRouting } from "@/lib/event-routing/event-routing-engine";

export async function GET() {
  const stream = buildEventStream(mapStoreToEventInput(getStore()));
  const result = computeEventRouting({ events: stream.events });
  return NextResponse.json({ data: result });
}
