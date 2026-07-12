import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { buildAnnexAQueue } from "@/lib/care-events/compliance-queues";
import type { ManagerDecision } from "@/types/care-events";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

// GET /api/v1/annex-a-readiness?section=&decision=  → enriched queue + readiness meta
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const result = buildAnnexAQueue(
    db.annexAEvidenceQueue.findAll(),
    (id) => db.careEvents.findById(id),
    { section: sp.get("section"), decision: sp.get("decision") },
  );
  return NextResponse.json(result);
}

// PATCH /api/v1/annex-a-readiness  → record a manager decision on a queue item
export async function PATCH(req: NextRequest) {
  let body: {
    id?: string;
    manager_decision?: ManagerDecision;
    manager_approved_text?: string;
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

  const updated = db.annexAEvidenceQueue.patch(body.id, {
    manager_decision: body.manager_decision,
    manager_approved_text: body.manager_approved_text ?? null,
    reviewed_by: body.reviewed_by ?? null,
    reviewed_at: new Date().toISOString(),
  });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
