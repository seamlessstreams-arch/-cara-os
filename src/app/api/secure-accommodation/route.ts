// ══════════════════════════════════════════════════════════════════════════════
// API: /api/secure-accommodation
//
// Secure Accommodation Intelligence
//
// GET  — Returns assessment with realistic Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generateSecureAccommodationIntelligence,
  getSecureOrderStatusLabel,
  getWelfareReviewStatusLabel,
  getReviewParticipantLabel,
  getRestrictionJustificationLabel,
  getProgressOutcomeLabel,
  getDischargeReadinessLabel,
} from "@/lib/secure-accommodation";
import type {
  SecureAccommodationOrder,
  WelfareReview,
  ChildWelfare,
  DischargeAssessment,
} from "@/lib/secure-accommodation";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

// Morgan (15) — active s25 order (risk to self), 2 welfare reviews
// Alex (14) — no orders
// Jordan (13) — no orders

const DEMO_ORDERS: SecureAccommodationOrder[] = [
  {
    id: "ord-morgan-01",
    childId: "child-morgan",
    childName: "Morgan",
    orderStatus: "active",
    orderDate: "2026-01-15",
    expiryDate: "2026-04-15",
    courtName: "Family Court — Manchester",
    justification: ["risk_to_self"],
    maximumPeriodDays: 91,
    localAuthorityApplicant: "Greater Manchester LA",
    s25CriteriaDocumented: true,
    leastRestrictiveConsidered: true,
  },
];

const DEMO_REVIEWS: WelfareReview[] = [
  {
    id: "rev-morgan-01",
    childId: "child-morgan",
    orderId: "ord-morgan-01",
    reviewDate: "2026-02-15",
    status: "completed_on_time",
    reviewedBy: "Darren Laville",
    participants: ["child", "parent", "social_worker", "iro", "advocate"],
    childViewsRecorded: true,
    childAttended: true,
    progressOutcome: "positive_progress",
    recommendationsMade: 4,
    recommendationsActioned: 3,
    continueSecureRecommended: true,
    alternativesConsidered: true,
    nextReviewDue: "2026-03-15",
  },
  {
    id: "rev-morgan-02",
    childId: "child-morgan",
    orderId: "ord-morgan-01",
    reviewDate: "2026-03-15",
    status: "completed_on_time",
    reviewedBy: "Darren Laville",
    participants: ["child", "parent", "social_worker", "iro", "advocate", "legal_representative"],
    childViewsRecorded: true,
    childAttended: true,
    progressOutcome: "positive_progress",
    recommendationsMade: 3,
    recommendationsActioned: 3,
    continueSecureRecommended: false,
    alternativesConsidered: true,
    nextReviewDue: "2026-04-15",
  },
];

const DEMO_WELFARE: ChildWelfare[] = [
  {
    id: "wel-morgan",
    childId: "child-morgan",
    educationProvided: true,
    educationHoursPerWeek: 25,
    therapeuticSupportInPlace: true,
    therapySessions: 12,
    familyContactMaintained: true,
    contactFrequency: "weekly",
    healthNeedsMet: true,
    physicalActivityAccess: true,
    outsideTimeMinutesPerDay: 90,
    personalBelongingsAccessible: true,
    privacyRespected: true,
    culturalNeedsMet: true,
    complaintsMechanismAvailable: true,
  },
];

const DEMO_DISCHARGE: DischargeAssessment[] = [
  {
    id: "dis-morgan-01",
    childId: "child-morgan",
    orderId: "ord-morgan-01",
    assessmentDate: "2026-04-01",
    assessedBy: "Sarah Johnson",
    readiness: "nearly_ready",
    transitionPlanInPlace: true,
    receivingPlacementIdentified: true,
    supportNetworkMapped: true,
    riskManagementPlanUpdated: true,
    childViewsOnDischarge: true,
  },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateSecureAccommodationIntelligence(
    DEMO_ORDERS,
    DEMO_REVIEWS,
    DEMO_WELFARE,
    DEMO_DISCHARGE,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        secureOrderStatusLabels: Object.fromEntries(
          (["active", "expired", "pending", "refused", "not_required", "revoked"] as const).map(
            (s) => [s, getSecureOrderStatusLabel(s)],
          ),
        ),
        welfareReviewStatusLabels: Object.fromEntries(
          (["completed_on_time", "completed_late", "overdue", "not_due"] as const).map(
            (s) => [s, getWelfareReviewStatusLabel(s)],
          ),
        ),
        reviewParticipantLabels: Object.fromEntries(
          (["child", "parent", "social_worker", "iro", "advocate", "legal_representative", "guardian"] as const).map(
            (p) => [p, getReviewParticipantLabel(p)],
          ),
        ),
        restrictionJustificationLabels: Object.fromEntries(
          (["risk_to_self", "risk_to_others", "absconding_risk", "criminal_activity", "exploitation_risk"] as const).map(
            (j) => [j, getRestrictionJustificationLabel(j)],
          ),
        ),
        progressOutcomeLabels: Object.fromEntries(
          (["positive_progress", "stable", "deteriorating", "insufficient_evidence"] as const).map(
            (o) => [o, getProgressOutcomeLabel(o)],
          ),
        ),
        dischargeReadinessLabels: Object.fromEntries(
          (["ready", "nearly_ready", "not_ready", "requires_assessment"] as const).map(
            (r) => [r, getDischargeReadinessLabel(r)],
          ),
        ),
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    orders,
    reviews,
    welfare,
    dischargeAssessments,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    orders?: SecureAccommodationOrder[];
    reviews?: WelfareReview[];
    welfare?: ChildWelfare[];
    dischargeAssessments?: DischargeAssessment[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generateSecureAccommodationIntelligence(
    orders ?? [],
    reviews ?? [],
    welfare ?? [],
    dischargeAssessments ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
