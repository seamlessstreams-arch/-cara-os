// ==============================================================================
// API: /api/sibling-contact-management
//
// Sibling Contact Management Intelligence
//
// GET  — Returns sibling contact assessment with Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateSiblingContactManagementIntelligence,
  getContactTypeLabel,
  getContactOutcomeLabel,
  getBarrierTypeLabel,
  getBarrierStatusLabel,
  getRatingLabel,
} from "@/lib/sibling-contact-management";
import type {
  SiblingContact,
  SiblingAssessment,
  ContactBarrier,
  StaffSiblingTraining,
} from "@/lib/sibling-contact-management";

// -- Demo Data: Oak House -------------------------------------------------------

const DEMO_CONTACTS: SiblingContact[] = [
  { id: "sc-1", childId: "child-alex", childName: "Alex", siblingId: "sib-alex-1", siblingName: "Sam", contactDate: "2026-02-10", contactType: "face_to_face", contactOutcome: "very_positive", durationMinutes: 120, facilitatedBy: "Sarah Johnson", childSatisfied: true, recordedInCasefile: true },
  { id: "sc-2", childId: "child-alex", childName: "Alex", siblingId: "sib-alex-1", siblingName: "Sam", contactDate: "2026-03-15", contactType: "video_call", contactOutcome: "positive", durationMinutes: 45, facilitatedBy: "Tom Richards", childSatisfied: true, recordedInCasefile: true },
  { id: "sc-3", childId: "child-alex", childName: "Alex", siblingId: "sib-alex-1", siblingName: "Sam", contactDate: "2026-04-12", contactType: "shared_activity", contactOutcome: "very_positive", durationMinutes: 180, facilitatedBy: "Sarah Johnson", childSatisfied: true, recordedInCasefile: true },
  { id: "sc-4", childId: "child-jordan", childName: "Jordan", siblingId: "sib-jordan-1", siblingName: "Casey", contactDate: "2026-02-20", contactType: "face_to_face", contactOutcome: "positive", durationMinutes: 90, facilitatedBy: "Lisa Williams", childSatisfied: true, recordedInCasefile: true },
  { id: "sc-5", childId: "child-jordan", childName: "Jordan", siblingId: "sib-jordan-1", siblingName: "Casey", contactDate: "2026-03-25", contactType: "phone_call", contactOutcome: "positive", durationMinutes: 30, facilitatedBy: "Darren Laville", childSatisfied: true, recordedInCasefile: true },
  { id: "sc-6", childId: "child-jordan", childName: "Jordan", siblingId: "sib-jordan-2", siblingName: "Riley", contactDate: "2026-04-05", contactType: "face_to_face", contactOutcome: "very_positive", durationMinutes: 120, facilitatedBy: "Lisa Williams", childSatisfied: true, recordedInCasefile: true },
  { id: "sc-7", childId: "child-morgan", childName: "Morgan", siblingId: "sib-morgan-1", siblingName: "Taylor", contactDate: "2026-02-15", contactType: "video_call", contactOutcome: "positive", durationMinutes: 40, facilitatedBy: "Tom Richards", childSatisfied: true, recordedInCasefile: true },
  { id: "sc-8", childId: "child-morgan", childName: "Morgan", siblingId: "sib-morgan-1", siblingName: "Taylor", contactDate: "2026-04-20", contactType: "overnight_stay", contactOutcome: "very_positive", durationMinutes: 1440, facilitatedBy: "Darren Laville", childSatisfied: true, recordedInCasefile: true },
];

const DEMO_ASSESSMENTS: SiblingAssessment[] = [
  { id: "sa-1", childId: "child-alex", childName: "Alex", assessmentDate: "2026-01-15", assessedBy: "Sarah Johnson", siblingRelationshipMapped: true, contactPlanInPlace: true, childViewsSought: true, siblingViewsSought: true, reviewScheduled: true, socialWorkerConsulted: true },
  { id: "sa-2", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-01-20", assessedBy: "Lisa Williams", siblingRelationshipMapped: true, contactPlanInPlace: true, childViewsSought: true, siblingViewsSought: true, reviewScheduled: true, socialWorkerConsulted: true },
  { id: "sa-3", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-01-25", assessedBy: "Darren Laville", siblingRelationshipMapped: true, contactPlanInPlace: true, childViewsSought: true, siblingViewsSought: true, reviewScheduled: true, socialWorkerConsulted: true },
];

const DEMO_BARRIERS: ContactBarrier[] = [
  { id: "cb-1", childId: "child-morgan", childName: "Morgan", siblingName: "Taylor", barrierType: "distance", barrierStatus: "resolved", identifiedDate: "2026-01-10", actionTaken: true, escalatedIfNeeded: true },
];

const DEMO_TRAINING: StaffSiblingTraining[] = [
  { id: "st-1", staffId: "staff-sarah", staffName: "Sarah Johnson", siblingRelationships: true, contactFacilitation: true, childViewsAdvocacy: true, safeguardingInContact: true, recordKeeping: true, barrierResolution: true },
  { id: "st-2", staffId: "staff-tom", staffName: "Tom Richards", siblingRelationships: true, contactFacilitation: true, childViewsAdvocacy: true, safeguardingInContact: true, recordKeeping: true, barrierResolution: true },
  { id: "st-3", staffId: "staff-lisa", staffName: "Lisa Williams", siblingRelationships: true, contactFacilitation: true, childViewsAdvocacy: true, safeguardingInContact: true, recordKeeping: true, barrierResolution: true },
  { id: "st-4", staffId: "staff-darren", staffName: "Darren Laville", siblingRelationships: true, contactFacilitation: true, childViewsAdvocacy: true, safeguardingInContact: true, recordKeeping: true, barrierResolution: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateSiblingContactManagementIntelligence(
    DEMO_CONTACTS,
    DEMO_ASSESSMENTS,
    DEMO_BARRIERS,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        contactTypeLabels: Object.fromEntries(
          (["face_to_face", "video_call", "phone_call", "letter_email", "shared_activity", "overnight_stay", "supervised_visit", "other"] as const).map(
            (t) => [t, getContactTypeLabel(t)],
          ),
        ),
        contactOutcomeLabels: Object.fromEntries(
          (["very_positive", "positive", "mixed", "difficult", "did_not_happen"] as const).map(
            (o) => [o, getContactOutcomeLabel(o)],
          ),
        ),
        barrierTypeLabels: Object.fromEntries(
          (["distance", "court_order", "safeguarding_concern", "placement_policy", "child_refusal", "sibling_refusal", "scheduling_conflict", "transport", "other"] as const).map(
            (b) => [b, getBarrierTypeLabel(b)],
          ),
        ),
        barrierStatusLabels: Object.fromEntries(
          (["resolved", "in_progress", "unresolved", "not_applicable"] as const).map(
            (s) => [s, getBarrierStatusLabel(s)],
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

  const { contacts, assessments, barriers, training, homeId, periodStart, periodEnd } = body as {
    contacts?: SiblingContact[];
    assessments?: SiblingAssessment[];
    barriers?: ContactBarrier[];
    training?: StaffSiblingTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateSiblingContactManagementIntelligence(
    contacts ?? [],
    assessments ?? [],
    barriers ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
