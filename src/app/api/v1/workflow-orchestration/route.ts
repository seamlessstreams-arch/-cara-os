// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WORKFLOW ORCHESTRATION API ROUTE
// GET /api/v1/workflow-orchestration
//
// Processes the canonical event stream against the configurable workflow rules and
// returns the concrete actions generated — approval tasks, debriefs, key-working
// follow-ups, evidence additions, ARIA summaries and human-gated notification
// drafts — with deadlines and escalation. CHR 2015 Reg 13.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildEventStream } from "@/lib/event-stream/event-projector";
import { mapStoreToEventInput } from "@/lib/event-stream/store-mapper";
import { computeWorkflowOrchestration } from "@/lib/workflow-orchestration/workflow-orchestration-engine";

export async function GET() {
  const events = buildEventStream(mapStoreToEventInput(getStore())).events;
  const result = computeWorkflowOrchestration({ events });
  return NextResponse.json({ data: result });
}
