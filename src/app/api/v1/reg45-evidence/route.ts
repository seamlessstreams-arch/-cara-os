import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import type { ManagerDecision } from "@/types/care-events";

// GET /api/v1/reg45-evidence
// Returns the Regulation 45 evidence queue from care event routing
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const decision = searchParams.get("decision") as ManagerDecision | null;
  const theme = searchParams.get("theme");

  let items = db.reg45EvidenceQueue.findAll();

  if (decision) items = items.filter((e) => e.manager_decision === decision);
  if (theme) items = items.filter((e) => e.suggested_theme?.toLowerCase().includes(theme.toLowerCase()));

  // Sort: pending first, then by created_at desc
  const decisionOrder: Record<ManagerDecision, number> = {
    pending: 0,
    approved: 1,
    accepted: 1,
    deferred: 2,
    rejected: 3,
  };
  const sorted = [...items].sort((a, b) => {
    const aO = decisionOrder[a.manager_decision] ?? 1;
    const bO = decisionOrder[b.manager_decision] ?? 1;
    if (aO !== bO) return aO - bO;
    return b.created_at.localeCompare(a.created_at);
  });

  // Enrich with source care event data
  const enriched = sorted.map((item) => {
    const careEvent = db.careEvents.findById(item.care_event_id);
    return {
      ...item,
      care_event: careEvent
        ? {
            id: careEvent.id,
            title: careEvent.title,
            category: careEvent.category,
            event_date: careEvent.event_date,
            status: careEvent.status,
            staff_id: careEvent.staff_id,
            child_id: careEvent.child_id,
          }
        : null,
    };
  });

  // Count by decision
  const all = db.reg45EvidenceQueue.findAll();
  const counts = {
    pending: all.filter((e) => e.manager_decision === "pending").length,
    approved: all.filter((e) => e.manager_decision === "approved" || e.manager_decision === "accepted").length,
    rejected: all.filter((e) => e.manager_decision === "rejected").length,
    deferred: all.filter((e) => e.manager_decision === "deferred").length,
    total: all.length,
  };

  return NextResponse.json({ data: enriched, meta: { counts } });
}

// PATCH /api/v1/reg45-evidence
// Body: { id, manager_decision, manager_approved_text?, review_notes?, reviewed_by }
export async function PATCH(req: NextRequest) {
  let body: {
    id: string;
    manager_decision: ManagerDecision;
    manager_approved_text?: string;
    review_notes?: string;
    reviewed_by: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, manager_decision, manager_approved_text, review_notes, reviewed_by } = body;
  if (!id || !manager_decision || !reviewed_by) {
    return NextResponse.json({ error: "id, manager_decision, and reviewed_by are required" }, { status: 400 });
  }

  const validDecisions: ManagerDecision[] = ["approved", "accepted", "rejected", "deferred", "pending"];
  if (!validDecisions.includes(manager_decision)) {
    return NextResponse.json({ error: "Invalid manager_decision" }, { status: 400 });
  }

  const updated = db.reg45EvidenceQueue.patch(id, {
    manager_decision,
    manager_approved_text: manager_approved_text ?? null,
    review_notes: review_notes ?? null,
    reviewed_by,
    reviewed_at: new Date().toISOString(),
  });

  if (!updated) return NextResponse.json({ error: "Evidence item not found" }, { status: 404 });

  // Audit the decision
  const careEvent = db.careEvents.findById(updated.care_event_id);
  if (careEvent) {
    const action = manager_decision === "approved" || manager_decision === "accepted"
      ? "reg45_evidence_accepted"
      : "reg45_evidence_rejected";
    db.careEventAuditLog.append({
      care_event_id: careEvent.id,
      home_id: careEvent.home_id,
      action,
      actor_staff_id: reviewed_by,
      actor_role: "manager",
      detail: { evidence_id: id, manager_decision, review_notes },
      ip_address: null,
    });
  }

  return NextResponse.json({ data: updated });
}
