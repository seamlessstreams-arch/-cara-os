import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { buildOversightQueue } from "@/lib/care-events/compliance-queues";

export const dynamic = "force-dynamic";

// GET /api/v1/management-oversight?status=&priority=&child_id=
// → care events awaiting manager review, presented as oversight tasks + meta
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const result = buildOversightQueue(db.careEvents.findNeedingManagerReview(), today, {
    status: sp.get("status"),
    priority: sp.get("priority"),
    child_id: sp.get("child_id"),
  });
  return NextResponse.json(result);
}

// PATCH /api/v1/management-oversight  → manager completes an oversight task.
// Records the decision on the care event; never sends any external notification.
export async function PATCH(req: NextRequest) {
  let body: { task_id?: string; completed_by?: string; evidence_note?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.task_id) return NextResponse.json({ error: "task_id is required" }, { status: 400 });

  const updated = db.careEvents.patch(body.task_id, {
    status: "verified",
    manager_review_completed: true,
    requires_manager_review: false,
    manager_id: body.completed_by ?? null,
    manager_review_at: new Date().toISOString(),
    manager_review_note: body.evidence_note ?? null,
  });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
