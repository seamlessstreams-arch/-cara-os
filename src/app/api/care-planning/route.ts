// ══════════════════════════════════════════════════════════════════════════════
// API: /api/care-planning
//
// Care Planning Compliance Intelligence
//
// GET  — Returns care planning assessment with realistic Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateCarePlanningIntelligence,
  getReviewTypeLabel,
  getReviewStatusLabel,
} from "@/lib/care-planning";
import type {
  CareChild,
  PlannedReview,
  ReviewAction,
  CarePlanDocument,
} from "@/lib/care-planning";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

const DEMO_CHILDREN: CareChild[] = [
  { id: "child-alex", name: "Alex", dateOfBirth: "2012-03-15", placementStartDate: "2025-10-01", isEligibleChild: false, currentPlacement: true },
  { id: "child-jordan", name: "Jordan", dateOfBirth: "2013-07-22", placementStartDate: "2025-11-01", isEligibleChild: false, currentPlacement: true },
  { id: "child-morgan", name: "Morgan", dateOfBirth: "2010-12-01", placementStartDate: "2026-01-10", isEligibleChild: true, currentPlacement: true },
];

const DEMO_REVIEWS: PlannedReview[] = [
  // Alex — good overall, one late PEP
  { id: "rev-001", childId: "child-alex", reviewType: "lac_review", dueDate: "2026-02-15", actualDate: "2026-02-14", status: "completed_on_time", chairedBy: "IRO Patricia Smith", childParticipated: true, childViewsRecorded: true, parentInvited: true, parentAttended: true, socialWorkerAttended: true, iroConducted: true, actionsAgreed: 4, keyDecisions: ["Maintain current placement", "Increase contact with mother to community setting"] },
  { id: "rev-002", childId: "child-alex", reviewType: "pep_review", dueDate: "2026-03-01", actualDate: "2026-03-10", status: "completed_late", childParticipated: true, childViewsRecorded: true, parentInvited: true, parentAttended: false, socialWorkerAttended: true, actionsAgreed: 3, keyDecisions: ["Additional English tutoring", "Alex to attend homework club"] },
  { id: "rev-003", childId: "child-alex", reviewType: "health_review", dueDate: "2026-04-01", actualDate: "2026-04-01", status: "completed_on_time", childParticipated: true, childViewsRecorded: true, parentInvited: false, parentAttended: false, socialWorkerAttended: true, actionsAgreed: 2 },
  { id: "rev-004", childId: "child-alex", reviewType: "risk_assessment_review", dueDate: "2026-05-10", actualDate: "2026-05-09", status: "completed_on_time", childParticipated: true, childViewsRecorded: true, parentInvited: false, parentAttended: false, socialWorkerAttended: true, actionsAgreed: 3 },

  // Jordan — all on time
  { id: "rev-005", childId: "child-jordan", reviewType: "lac_review", dueDate: "2026-01-20", actualDate: "2026-01-20", status: "completed_on_time", chairedBy: "IRO David Jones", childParticipated: true, childViewsRecorded: true, parentInvited: true, parentAttended: true, socialWorkerAttended: true, iroConducted: true, actionsAgreed: 5, keyDecisions: ["Increase Grandmother contact to weekly", "Art therapy referral"] },
  { id: "rev-006", childId: "child-jordan", reviewType: "care_plan_review", dueDate: "2026-03-15", actualDate: "2026-03-14", status: "completed_on_time", childParticipated: true, childViewsRecorded: true, parentInvited: true, parentAttended: true, socialWorkerAttended: true, actionsAgreed: 3 },
  { id: "rev-007", childId: "child-jordan", reviewType: "pep_review", dueDate: "2026-04-01", actualDate: "2026-04-01", status: "completed_on_time", childParticipated: true, childViewsRecorded: true, parentInvited: true, parentAttended: false, socialWorkerAttended: true, actionsAgreed: 2, keyDecisions: ["Request additional SENCO support", "Jordan to take GCSE art"] },
  { id: "rev-008", childId: "child-jordan", reviewType: "behaviour_support_review", dueDate: "2026-05-01", actualDate: "2026-05-01", status: "completed_on_time", childParticipated: true, childViewsRecorded: true, parentInvited: false, parentAttended: false, socialWorkerAttended: true, actionsAgreed: 2 },

  // Morgan — one overdue pathway plan
  { id: "rev-009", childId: "child-morgan", reviewType: "lac_review", dueDate: "2026-02-01", actualDate: "2026-02-01", status: "completed_on_time", chairedBy: "IRO Patricia Smith", childParticipated: true, childViewsRecorded: true, parentInvited: false, parentAttended: false, socialWorkerAttended: true, iroConducted: true, actionsAgreed: 4 },
  { id: "rev-010", childId: "child-morgan", reviewType: "pathway_plan_review", dueDate: "2026-04-15", status: "overdue", childParticipated: false, childViewsRecorded: false, parentInvited: false, parentAttended: false, socialWorkerAttended: false, actionsAgreed: 0 },
  { id: "rev-011", childId: "child-morgan", reviewType: "health_review", dueDate: "2026-05-10", actualDate: "2026-05-10", status: "completed_on_time", childParticipated: true, childViewsRecorded: true, parentInvited: false, parentAttended: false, socialWorkerAttended: true, actionsAgreed: 1 },
];

const DEMO_ACTIONS: ReviewAction[] = [
  { id: "act-001", reviewId: "rev-001", childId: "child-alex", description: "Arrange trial session at boxing club", assignedTo: "Sarah Johnson", dueDate: "2026-03-01", completedDate: "2026-02-25", status: "completed", category: "activity" },
  { id: "act-002", reviewId: "rev-001", childId: "child-alex", description: "Submit contact venue change request to PA", assignedTo: "Darren Laville", dueDate: "2026-03-01", completedDate: "2026-02-28", status: "completed", category: "contact" },
  { id: "act-003", reviewId: "rev-002", childId: "child-alex", description: "Arrange English tutoring", assignedTo: "Sarah Johnson", dueDate: "2026-04-01", completedDate: "2026-03-20", status: "completed", category: "education" },
  { id: "act-004", reviewId: "rev-004", childId: "child-alex", description: "Update exploitation risk assessment", assignedTo: "Darren Laville", dueDate: "2026-05-15", completedDate: "2026-05-12", status: "completed", category: "assessment" },
  { id: "act-005", reviewId: "rev-005", childId: "child-jordan", description: "Request art therapy referral via CAMHS", assignedTo: "Lisa Williams", dueDate: "2026-02-15", completedDate: "2026-02-10", status: "completed", category: "therapy" },
  { id: "act-006", reviewId: "rev-005", childId: "child-jordan", description: "Increase grandmother contact to weekly", assignedTo: "Tom Richards", dueDate: "2026-02-01", completedDate: "2026-01-25", status: "completed", category: "contact" },
  { id: "act-007", reviewId: "rev-007", childId: "child-jordan", description: "Request additional SENCO time", assignedTo: "Tom Richards", dueDate: "2026-04-15", status: "in_progress", category: "education" },
  { id: "act-008", reviewId: "rev-009", childId: "child-morgan", description: "Complete independence skills assessment", assignedTo: "Lisa Williams", dueDate: "2026-03-01", completedDate: "2026-02-28", status: "completed", category: "assessment" },
  { id: "act-009", reviewId: "rev-009", childId: "child-morgan", description: "Arrange work experience placement", assignedTo: "Lisa Williams", dueDate: "2026-04-15", status: "overdue", category: "independence" },
];

const DEMO_DOCUMENTS: CarePlanDocument[] = [
  { id: "doc-001", childId: "child-alex", documentType: "care_plan", lastUpdated: "2026-04-15", nextReviewDue: "2026-10-15", isUpToDate: true },
  { id: "doc-002", childId: "child-alex", documentType: "placement_plan", lastUpdated: "2026-03-01", nextReviewDue: "2026-09-01", isUpToDate: true },
  { id: "doc-003", childId: "child-alex", documentType: "pep", lastUpdated: "2026-03-10", nextReviewDue: "2026-06-10", isUpToDate: true },
  { id: "doc-004", childId: "child-alex", documentType: "risk_assessment", lastUpdated: "2026-05-12", nextReviewDue: "2026-08-12", isUpToDate: true },
  { id: "doc-005", childId: "child-jordan", documentType: "care_plan", lastUpdated: "2026-03-15", nextReviewDue: "2026-09-15", isUpToDate: true },
  { id: "doc-006", childId: "child-jordan", documentType: "behaviour_support_plan", lastUpdated: "2026-05-01", nextReviewDue: "2026-08-01", isUpToDate: true },
  { id: "doc-007", childId: "child-jordan", documentType: "pep", lastUpdated: "2026-04-01", nextReviewDue: "2026-07-01", isUpToDate: true },
  { id: "doc-008", childId: "child-morgan", documentType: "care_plan", lastUpdated: "2026-04-15", nextReviewDue: "2026-10-15", isUpToDate: true },
  { id: "doc-009", childId: "child-morgan", documentType: "pathway_plan", lastUpdated: "2025-10-01", nextReviewDue: "2026-04-01", isUpToDate: false },
  { id: "doc-010", childId: "child-morgan", documentType: "health_plan", lastUpdated: "2026-05-10", nextReviewDue: "2026-11-10", isUpToDate: true },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateCarePlanningIntelligence(
    DEMO_CHILDREN, DEMO_REVIEWS, DEMO_ACTIONS, DEMO_DOCUMENTS,
    "oak-house", "2026-01-01", "2026-05-18",
  );

  const enrichedTypeBreakdown = result.reviewTypeBreakdown.map((t) => ({
    ...t,
    reviewTypeLabel: getReviewTypeLabel(t.reviewType),
  }));

  return NextResponse.json({
    data: {
      ...result,
      reviewTypeBreakdown: enrichedTypeBreakdown,
      meta: {
        statusLabels: Object.fromEntries(
          (["completed_on_time", "completed_late", "overdue", "scheduled", "cancelled"] as const).map(
            (s) => [s, getReviewStatusLabel(s)],
          ),
        ),
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { children, reviews, actions, documents, homeId, periodStart, periodEnd } = body as {
    children?: CareChild[];
    reviews?: PlannedReview[];
    actions?: ReviewAction[];
    documents?: CarePlanDocument[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!children || !Array.isArray(children) || children.length === 0) {
    return NextResponse.json({ error: "children array is required" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateCarePlanningIntelligence(
    children, reviews ?? [], actions ?? [], documents ?? [],
    homeId ?? "unknown", periodStart, periodEnd,
  );

  return NextResponse.json({ data: result });
}
