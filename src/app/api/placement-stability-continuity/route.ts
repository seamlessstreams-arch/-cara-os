// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Placement Stability & Continuity API Route
//
// GET  → returns Chamberlain House demo placement stability intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generatePlacementStabilityContinuityIntelligence,
  getReviewTypeLabel,
  getStabilityStatusLabel,
  getRatingLabel,
} from "@/lib/placement-stability-continuity/placement-stability-continuity-engine";
import type {
  PlacementReview,
  PlacementPolicy,
  StaffPlacementTraining,
  ReviewType,
  StabilityStatus,
  Rating,
} from "@/lib/placement-stability-continuity/placement-stability-continuity-engine";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const reviews: PlacementReview[] = [
    { id: "pr-01", childId: "child-alex", childName: "Alex", reviewDate: "2025-02-10", reviewType: "stability_assessment", stabilityStatus: "stable", childParticipated: true, familyEngaged: true, continuityMaintained: true, documentedInPlan: true, managementOversight: true, actionsTaken: true },
    { id: "pr-02", childId: "child-alex", childName: "Alex", reviewDate: "2025-04-15", reviewType: "placement_plan_review", stabilityStatus: "stable", childParticipated: true, familyEngaged: true, continuityMaintained: true, documentedInPlan: true, managementOversight: true, actionsTaken: true },
    { id: "pr-03", childId: "child-jordan", childName: "Jordan", reviewDate: "2025-01-20", reviewType: "matching_review", stabilityStatus: "mostly_stable", childParticipated: true, familyEngaged: false, continuityMaintained: true, documentedInPlan: true, managementOversight: true, actionsTaken: true },
    { id: "pr-04", childId: "child-jordan", childName: "Jordan", reviewDate: "2025-03-25", reviewType: "key_worker_session", stabilityStatus: "stable", childParticipated: true, familyEngaged: true, continuityMaintained: true, documentedInPlan: true, managementOversight: true, actionsTaken: true },
    { id: "pr-05", childId: "child-jordan", childName: "Jordan", reviewDate: "2025-05-10", reviewType: "contact_review", stabilityStatus: "stable", childParticipated: true, familyEngaged: true, continuityMaintained: true, documentedInPlan: true, managementOversight: true, actionsTaken: true },
    { id: "pr-06", childId: "child-morgan", childName: "Morgan", reviewDate: "2025-02-05", reviewType: "transition_planning", stabilityStatus: "some_concerns", childParticipated: false, familyEngaged: false, continuityMaintained: false, documentedInPlan: true, managementOversight: true, actionsTaken: true },
    { id: "pr-07", childId: "child-morgan", childName: "Morgan", reviewDate: "2025-04-01", reviewType: "disruption_meeting", stabilityStatus: "at_risk", childParticipated: true, familyEngaged: false, continuityMaintained: false, documentedInPlan: true, managementOversight: true, actionsTaken: true },
    { id: "pr-08", childId: "child-morgan", childName: "Morgan", reviewDate: "2025-05-20", reviewType: "multi_agency_review", stabilityStatus: "mostly_stable", childParticipated: true, familyEngaged: true, continuityMaintained: true, documentedInPlan: true, managementOversight: true, actionsTaken: true },
  ];

  const policy: PlacementPolicy = {
    id: "policy-01",
    stabilityStrategy: true,
    matchingProcess: true,
    disruptionProtocol: true,
    transitionFramework: true,
    contactArrangements: true,
    contingencyPlanning: true,
    regularReview: true,
  };

  const staff: StaffPlacementTraining[] = [
    { id: "train-01", staffId: "staff-sarah", staffName: "Sarah Johnson", attachmentTheory: true, therapeuticCaregiving: true, disruptionPrevention: true, transitionSupport: true, familyEngagement: true, multiAgencyWorking: true },
    { id: "train-02", staffId: "staff-tom", staffName: "Tom Richards", attachmentTheory: true, therapeuticCaregiving: true, disruptionPrevention: true, transitionSupport: true, familyEngagement: true, multiAgencyWorking: true },
    { id: "train-03", staffId: "staff-lisa", staffName: "Lisa Williams", attachmentTheory: true, therapeuticCaregiving: true, disruptionPrevention: true, transitionSupport: true, familyEngagement: true, multiAgencyWorking: true },
    { id: "train-04", staffId: "staff-darren", staffName: "Darren Laville", attachmentTheory: true, therapeuticCaregiving: true, disruptionPrevention: true, transitionSupport: true, familyEngagement: true, multiAgencyWorking: true },
  ];

  return { reviews, policy, staff };
}

// ── Label Maps for Meta ────────────────────────────────────────────────────

function buildMeta() {
  const reviewTypes: ReviewType[] = [
    "stability_assessment", "disruption_meeting", "placement_plan_review",
    "matching_review", "transition_planning", "contact_review",
    "key_worker_session", "multi_agency_review",
  ];
  const stabilityStatuses: StabilityStatus[] = [
    "stable", "mostly_stable", "some_concerns", "at_risk", "disrupted",
  ];
  const ratings: Rating[] = [
    "outstanding", "good", "requires_improvement", "inadequate",
  ];

  return {
    reviewTypeLabels: Object.fromEntries(reviewTypes.map((t) => [t, getReviewTypeLabel(t)])),
    stabilityStatusLabels: Object.fromEntries(stabilityStatuses.map((s) => [s, getStabilityStatusLabel(s)])),
    ratingLabels: Object.fromEntries(ratings.map((r) => [r, getRatingLabel(r)])),
  };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { reviews, policy, staff } = getDemoData();
    const result = generatePlacementStabilityContinuityIntelligence(
      reviews, policy, staff, "oak-house", "2025-01-01", "2025-06-30",
    );
    return NextResponse.json({ ...result, meta: buildMeta() });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate placement stability intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reviews, policy, staff, homeId, periodStart, periodEnd } = body;

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields: periodStart, periodEnd" },
        { status: 400 },
      );
    }

    if (!Array.isArray(reviews)) {
      return NextResponse.json(
        { error: "reviews must be an array" },
        { status: 400 },
      );
    }

    if (!Array.isArray(staff)) {
      return NextResponse.json(
        { error: "staff must be an array" },
        { status: 400 },
      );
    }

    const result = generatePlacementStabilityContinuityIntelligence(
      reviews,
      policy ?? null,
      staff,
      homeId ?? "unknown",
      periodStart,
      periodEnd,
    );

    return NextResponse.json({ ...result, meta: buildMeta() });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process placement stability data", details: String(error) },
      { status: 500 },
    );
  }
}
