import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import type { ManagerDecision } from "@/types/care-events";

// ── Annex A section definitions ───────────────────────────────────────────────
const ANNEX_A_SECTIONS = [
  { key: "section_1", label: "Section 1 — Details of the home", weight: 10 },
  { key: "section_2", label: "Section 2 — Children and young people", weight: 20 },
  { key: "section_3", label: "Section 3 — Staffing", weight: 15 },
  { key: "section_4", label: "Section 4 — Incidents and notifications", weight: 15 },
  { key: "section_5", label: "Section 5 — Complaints and representations", weight: 10 },
  { key: "section_6", label: "Section 6 — Missing episodes", weight: 10 },
  { key: "section_7", label: "Section 7 — Physical interventions / restraints", weight: 10 },
  { key: "section_8", label: "Section 8 — Regulation 44 visits", weight: 5 },
  { key: "section_9", label: "Section 9 — Regulation 45 reports", weight: 5 },
];

function calcReadinessScore(sectionData: ReturnType<typeof buildSectionData>): number {
  let totalWeight = 0;
  let earnedWeight = 0;
  for (const section of ANNEX_A_SECTIONS) {
    const s = sectionData.find((d) => d.key === section.key);
    totalWeight += section.weight;
    if (s && s.evidence_count > 0) {
      // Give full weight if any approved evidence exists, partial for pending
      const approvedFraction = s.evidence_count > 0 ? Math.min(s.approved_count / Math.max(s.evidence_count, 1), 1) : 0;
      earnedWeight += section.weight * (0.4 + 0.6 * approvedFraction);
    }
  }
  return Math.round((earnedWeight / totalWeight) * 100);
}

function buildSectionData(items: ReturnType<typeof db.annexAEvidenceQueue.findAll>) {
  return ANNEX_A_SECTIONS.map((section) => {
    const sectionItems = items.filter((e) => e.annex_section === section.key);
    const approvedItems = sectionItems.filter(
      (e) => e.manager_decision === "approved" || e.manager_decision === "accepted"
    );
    const pendingItems = sectionItems.filter((e) => e.manager_decision === "pending");
    const rejectedItems = sectionItems.filter((e) => e.manager_decision === "rejected");

    // Find stale items (evidence older than 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const staleItems = approvedItems.filter((e) => e.created_at < ninetyDaysAgo);

    return {
      key: section.key,
      label: section.label,
      weight: section.weight,
      evidence_count: sectionItems.length,
      approved_count: approvedItems.length,
      pending_count: pendingItems.length,
      rejected_count: rejectedItems.length,
      stale_count: staleItems.length,
      has_gap: sectionItems.length === 0,
      items: sectionItems,
    };
  });
}

// GET /api/v1/annex-a-readiness
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section");
  const decision = searchParams.get("decision") as ManagerDecision | null;

  const allItems = db.annexAEvidenceQueue.findAll();
  const sectionData = buildSectionData(allItems);
  const readinessScore = calcReadinessScore(sectionData);

  let filteredItems = allItems;
  if (section) filteredItems = filteredItems.filter((e) => e.annex_section === section);
  if (decision) filteredItems = filteredItems.filter((e) => e.manager_decision === decision);

  // Sort: pending first, then by created_at desc
  const decisionOrder: Record<string, number> = { pending: 0, approved: 1, accepted: 1, deferred: 2, rejected: 3 };
  const sortedItems = [...filteredItems].sort((a, b) => {
    const aO = decisionOrder[a.manager_decision] ?? 1;
    const bO = decisionOrder[b.manager_decision] ?? 1;
    if (aO !== bO) return aO - bO;
    return b.created_at.localeCompare(a.created_at);
  });

  // Enrich items with source care event
  const enriched = sortedItems.map((item) => {
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
          }
        : null,
    };
  });

  const gaps = sectionData.filter((s) => s.has_gap).map((s) => s.key);
  const staleTotal = sectionData.reduce((sum, s) => sum + s.stale_count, 0);

  return NextResponse.json({
    data: enriched,
    meta: {
      readiness_score: readinessScore,
      total_evidence: allItems.length,
      pending_decisions: allItems.filter((e) => e.manager_decision === "pending").length,
      approved_count: allItems.filter((e) => e.manager_decision === "approved" || e.manager_decision === "accepted").length,
      rejected_count: allItems.filter((e) => e.manager_decision === "rejected").length,
      sections: sectionData.map((s) => ({ key: s.key, label: s.label, evidence_count: s.evidence_count, approved_count: s.approved_count, pending_count: s.pending_count, stale_count: s.stale_count, has_gap: s.has_gap })),
      gaps,
      stale_count: staleTotal,
    },
  });
}

// PATCH /api/v1/annex-a-readiness
// Body: { id, manager_decision, manager_approved_text?, reviewed_by }
export async function PATCH(req: NextRequest) {
  let body: {
    id: string;
    manager_decision: ManagerDecision;
    manager_approved_text?: string;
    reviewed_by: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, manager_decision, manager_approved_text, reviewed_by } = body;
  if (!id || !manager_decision || !reviewed_by) {
    return NextResponse.json({ error: "id, manager_decision, and reviewed_by are required" }, { status: 400 });
  }

  const updated = db.annexAEvidenceQueue.patch(id, {
    manager_decision,
    manager_approved_text: manager_approved_text ?? null,
    reviewed_by,
    reviewed_at: new Date().toISOString(),
  });

  if (!updated) return NextResponse.json({ error: "Evidence item not found" }, { status: 404 });

  return NextResponse.json({ data: updated });
}
