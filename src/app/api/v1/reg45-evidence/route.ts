import { NextRequest, NextResponse } from "next/server";
import { careEventsDb } from "@/lib/db";
import { buildReg45Queue } from "@/lib/care-events/compliance-queues";
import type { ManagerDecision } from "@/types/care-events";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

// GET /api/v1/reg45-evidence?decision=&theme=  → enriched queue + counts
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  // Live-safe via careEventsDb; events pre-fetched into a map for the sync resolver.
  const [queue, allEvents] = await Promise.all([
    careEventsDb.reg45EvidenceQueue.findAll(),
    careEventsDb.careEvents.findAll(),
  ]);
  const byId = new Map(allEvents.map((e) => [e.id, e]));
  const result = buildReg45Queue(
    queue,
    (id) => byId.get(id),
    { decision: sp.get("decision"), theme: sp.get("theme") },
  );
  return NextResponse.json(result);
}

// PATCH /api/v1/reg45-evidence  → record a manager decision on a queue item
export async function PATCH(req: NextRequest) {
  let body: {
    id?: string;
    manager_decision?: ManagerDecision;
    manager_approved_text?: string;
    review_notes?: string;
    reviewed_by?: string;
  };
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const updated = await careEventsDb.reg45EvidenceQueue.patch(body.id, {
    manager_decision: body.manager_decision,
    manager_approved_text: body.manager_approved_text ?? null,
    review_notes: body.review_notes ?? null,
    reviewed_by: body.reviewed_by ?? null,
    reviewed_at: new Date().toISOString(),
  });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
