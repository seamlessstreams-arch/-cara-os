// ==============================================================================
// API: /api/sibling-contact-quality
//
// Sibling Contact Quality Intelligence
//
// GET  — Returns sibling contact assessment with Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateSiblingContactQualityIntelligence,
  getContactTypeLabel,
  getContactQualityLabel,
  getBarrierTypeLabel,
  getContactOutcomeLabel,
  getFrequencyComplianceLabel,
  getRatingLabel,
} from "@/lib/sibling-contact-quality";
import type {
  SiblingRelationship,
  SiblingContactSession,
  SiblingContactReview,
  StaffSiblingTraining,
} from "@/lib/sibling-contact-quality";

// -- Demo Data: Oak House -------------------------------------------------------

const DEMO_RELATIONSHIPS: SiblingRelationship[] = [
  // Alex has one sibling (Sam) in a different home
  { id: "sr-1", childId: "child-alex", childName: "Alex", siblingId: "sib-sam", siblingName: "Sam", siblingPlacement: "different_home", contactPlanExists: true, plannedFrequency: "Fortnightly", frequencyCompliance: "meets_plan", lastContactDate: "2026-05-10", relationshipQuality: "strong" },
  // Jordan has one sibling (Casey) in birth family
  { id: "sr-2", childId: "child-jordan", childName: "Jordan", siblingId: "sib-casey", siblingName: "Casey", siblingPlacement: "birth_family", contactPlanExists: true, plannedFrequency: "Monthly", frequencyCompliance: "meets_plan", lastContactDate: "2026-04-28", relationshipQuality: "developing" },
  // Morgan has one sibling (Riley) in same home
  { id: "sr-3", childId: "child-morgan", childName: "Morgan", siblingId: "sib-riley", siblingName: "Riley", siblingPlacement: "same_home", contactPlanExists: true, plannedFrequency: "Daily (same home)", frequencyCompliance: "exceeds_plan", lastContactDate: "2026-05-18", relationshipQuality: "strong" },
];

const DEMO_SESSIONS: SiblingContactSession[] = [
  { id: "sc-1", childId: "child-alex", childName: "Alex", siblingId: "sib-sam", siblingName: "Sam", date: "2026-04-12", contactType: "face_to_face", duration: 90, qualityRating: "excellent", outcome: "positive", childViewSought: true, childEnjoyedContact: true, siblingViewSought: true, facilitatedBy: "Sarah Johnson", barriers: ["none"], followUpActions: [] },
  { id: "sc-2", childId: "child-alex", childName: "Alex", siblingId: "sib-sam", siblingName: "Sam", date: "2026-04-26", contactType: "shared_activity", duration: 120, qualityRating: "excellent", outcome: "positive", childViewSought: true, childEnjoyedContact: true, siblingViewSought: true, facilitatedBy: "Tom Richards", barriers: ["none"], followUpActions: [] },
  { id: "sc-3", childId: "child-alex", childName: "Alex", siblingId: "sib-sam", siblingName: "Sam", date: "2026-05-10", contactType: "face_to_face", duration: 90, qualityRating: "good", outcome: "positive", childViewSought: true, childEnjoyedContact: true, siblingViewSought: true, facilitatedBy: "Sarah Johnson", barriers: ["none"], followUpActions: [] },
  { id: "sc-4", childId: "child-jordan", childName: "Jordan", siblingId: "sib-casey", siblingName: "Casey", date: "2026-03-30", contactType: "supervised", duration: 60, qualityRating: "good", outcome: "positive", childViewSought: true, childEnjoyedContact: true, siblingViewSought: true, facilitatedBy: "Lisa Williams", barriers: ["none"], followUpActions: [] },
  { id: "sc-5", childId: "child-jordan", childName: "Jordan", siblingId: "sib-casey", siblingName: "Casey", date: "2026-04-28", contactType: "supervised", duration: 60, qualityRating: "good", outcome: "mixed", childViewSought: true, childEnjoyedContact: null, siblingViewSought: true, facilitatedBy: "Lisa Williams", barriers: ["scheduling_difficulty"], followUpActions: ["Discuss scheduling with LA"] },
];

const DEMO_REVIEWS: SiblingContactReview[] = [
  { id: "scr-1", childId: "child-alex", childName: "Alex", reviewDate: "2026-04-01", reviewedBy: "Darren Laville", allSiblingsConsidered: true, contactPlanUpdated: true, childViewsIncluded: true, barriersAddressed: true, outcomeSatisfactory: true },
  { id: "scr-2", childId: "child-jordan", childName: "Jordan", reviewDate: "2026-04-15", reviewedBy: "Darren Laville", allSiblingsConsidered: true, contactPlanUpdated: true, childViewsIncluded: true, barriersAddressed: true, outcomeSatisfactory: true },
  { id: "scr-3", childId: "child-morgan", childName: "Morgan", reviewDate: "2026-04-15", reviewedBy: "Darren Laville", allSiblingsConsidered: true, contactPlanUpdated: true, childViewsIncluded: true, barriersAddressed: true, outcomeSatisfactory: true },
];

const DEMO_TRAINING: StaffSiblingTraining[] = [
  { id: "sst-1", staffId: "staff-sarah", staffName: "Sarah Johnson", siblingRelationshipAwareness: true, facilitatingContactSkills: true, managingDifficultContact: true, childViewsTraining: true, legalFrameworkKnowledge: true },
  { id: "sst-2", staffId: "staff-tom", staffName: "Tom Richards", siblingRelationshipAwareness: true, facilitatingContactSkills: true, managingDifficultContact: true, childViewsTraining: true, legalFrameworkKnowledge: false },
  { id: "sst-3", staffId: "staff-lisa", staffName: "Lisa Williams", siblingRelationshipAwareness: true, facilitatingContactSkills: true, managingDifficultContact: true, childViewsTraining: true, legalFrameworkKnowledge: true },
  { id: "sst-4", staffId: "staff-darren", staffName: "Darren Laville", siblingRelationshipAwareness: true, facilitatingContactSkills: true, managingDifficultContact: true, childViewsTraining: true, legalFrameworkKnowledge: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateSiblingContactQualityIntelligence(
    DEMO_RELATIONSHIPS,
    DEMO_SESSIONS,
    DEMO_REVIEWS,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        contactTypeLabels: Object.fromEntries(
          (["face_to_face", "supervised", "unsupervised", "virtual_video", "telephone", "letter_email", "shared_activity", "overnight_stay"] as const).map(
            (t) => [t, getContactTypeLabel(t)],
          ),
        ),
        contactQualityLabels: Object.fromEntries(
          (["excellent", "good", "adequate", "poor", "harmful"] as const).map(
            (q) => [q, getContactQualityLabel(q)],
          ),
        ),
        barrierTypeLabels: Object.fromEntries(
          (["distance", "local_authority_decision", "court_order", "child_wishes", "sibling_wishes", "safeguarding_concern", "placement_restriction", "scheduling_difficulty", "none"] as const).map(
            (b) => [b, getBarrierTypeLabel(b)],
          ),
        ),
        contactOutcomeLabels: Object.fromEntries(
          (["positive", "mixed", "negative", "cancelled_by_child", "cancelled_by_sibling", "cancelled_by_authority", "no_show"] as const).map(
            (o) => [o, getContactOutcomeLabel(o)],
          ),
        ),
        frequencyComplianceLabels: Object.fromEntries(
          (["exceeds_plan", "meets_plan", "below_plan", "significantly_below", "no_plan"] as const).map(
            (f) => [f, getFrequencyComplianceLabel(f)],
          ),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map(
            (r) => [r, getRatingLabel(r)],
          ),
        ),
      },
    },
  });
}

// -- POST -----------------------------------------------------------------------

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { relationships, sessions, reviews, training, homeId, periodStart, periodEnd } = body as {
    relationships?: SiblingRelationship[];
    sessions?: SiblingContactSession[];
    reviews?: SiblingContactReview[];
    training?: StaffSiblingTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateSiblingContactQualityIntelligence(
    relationships ?? [],
    sessions ?? [],
    reviews ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
