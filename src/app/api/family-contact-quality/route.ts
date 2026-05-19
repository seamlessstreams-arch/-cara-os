// ==============================================================================
// API: /api/family-contact-quality
//
// Family Contact Quality Intelligence
//
// GET  — Returns family contact assessment with Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateFamilyContactQualityIntelligence,
  getContactTypeLabel,
  getContactOutcomeLabel,
  getContactPersonLabel,
  getRatingLabel,
} from "@/lib/family-contact-quality";
import type {
  FamilyContact,
  ContactPolicy,
  StaffContactTraining,
} from "@/lib/family-contact-quality";

// -- Demo Data: Oak House -------------------------------------------------------

const DEMO_CONTACTS: FamilyContact[] = [
  // Alex — Mother (face_to_face)
  { id: "fc-a1", childId: "child-alex", childName: "Alex", contactDate: "2026-03-15", contactType: "face_to_face", contactPerson: "parent_mother", contactOutcome: "very_positive", childPrepared: true, childViewsRecorded: true, supervisedAppropriately: true, recordedInCasefile: true, contactPlanFollowed: true, childSatisfied: true },
  // Alex — Father (phone_call)
  { id: "fc-a2", childId: "child-alex", childName: "Alex", contactDate: "2026-03-20", contactType: "phone_call", contactPerson: "parent_father", contactOutcome: "positive", childPrepared: true, childViewsRecorded: true, supervisedAppropriately: true, recordedInCasefile: true, contactPlanFollowed: true, childSatisfied: true },
  // Alex — Grandparent (video_call)
  { id: "fc-a3", childId: "child-alex", childName: "Alex", contactDate: "2026-04-01", contactType: "video_call", contactPerson: "grandparent", contactOutcome: "positive", childPrepared: true, childViewsRecorded: true, supervisedAppropriately: true, recordedInCasefile: true, contactPlanFollowed: true, childSatisfied: true },
  // Jordan — Mother (supervised_visit)
  { id: "fc-j1", childId: "child-jordan", childName: "Jordan", contactDate: "2026-03-10", contactType: "supervised_visit", contactPerson: "parent_mother", contactOutcome: "neutral", childPrepared: true, childViewsRecorded: true, supervisedAppropriately: true, recordedInCasefile: true, contactPlanFollowed: true, childSatisfied: false },
  // Jordan — Sibling (activity_based)
  { id: "fc-j2", childId: "child-jordan", childName: "Jordan", contactDate: "2026-03-25", contactType: "activity_based", contactPerson: "sibling", contactOutcome: "very_positive", childPrepared: true, childViewsRecorded: true, supervisedAppropriately: true, recordedInCasefile: true, contactPlanFollowed: true, childSatisfied: true },
  // Jordan — Father (letterbox)
  { id: "fc-j3", childId: "child-jordan", childName: "Jordan", contactDate: "2026-04-10", contactType: "letterbox", contactPerson: "parent_father", contactOutcome: "positive", childPrepared: true, childViewsRecorded: true, supervisedAppropriately: true, recordedInCasefile: true, contactPlanFollowed: true, childSatisfied: true },
  // Morgan — Father (unsupervised_visit)
  { id: "fc-m1", childId: "child-morgan", childName: "Morgan", contactDate: "2026-03-12", contactType: "unsupervised_visit", contactPerson: "parent_father", contactOutcome: "positive", childPrepared: true, childViewsRecorded: true, supervisedAppropriately: true, recordedInCasefile: true, contactPlanFollowed: true, childSatisfied: true },
  // Morgan — Grandparent (family_event)
  { id: "fc-m2", childId: "child-morgan", childName: "Morgan", contactDate: "2026-04-05", contactType: "family_event", contactPerson: "grandparent", contactOutcome: "very_positive", childPrepared: true, childViewsRecorded: true, supervisedAppropriately: true, recordedInCasefile: true, contactPlanFollowed: true, childSatisfied: true },
  // Morgan — Sibling (face_to_face)
  { id: "fc-m3", childId: "child-morgan", childName: "Morgan", contactDate: "2026-04-18", contactType: "face_to_face", contactPerson: "sibling", contactOutcome: "positive", childPrepared: true, childViewsRecorded: true, supervisedAppropriately: true, recordedInCasefile: true, contactPlanFollowed: true, childSatisfied: true },
];

const DEMO_POLICY: ContactPolicy = {
  id: "pol-oak",
  contactPlanForEachChild: true,
  familyEngagementStrategy: true,
  supervisedContactGuidance: true,
  letterboxProcess: true,
  complaintsMechanism: true,
  culturalConsideration: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffContactTraining[] = [
  { id: "tr-1", staffId: "staff-1", staffName: "Sarah Johnson", familyEngagement: true, contactSupervision: true, childPreparation: true, conflictManagement: true, recordKeeping: true, culturalAwareness: true },
  { id: "tr-2", staffId: "staff-2", staffName: "Tom Richards", familyEngagement: true, contactSupervision: true, childPreparation: true, conflictManagement: true, recordKeeping: true, culturalAwareness: false },
  { id: "tr-3", staffId: "staff-3", staffName: "Lisa Williams", familyEngagement: true, contactSupervision: true, childPreparation: true, conflictManagement: false, recordKeeping: true, culturalAwareness: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateFamilyContactQualityIntelligence(
    DEMO_CONTACTS,
    DEMO_POLICY,
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
          (["face_to_face", "phone_call", "video_call", "letterbox", "supervised_visit", "unsupervised_visit", "activity_based", "family_event"] as const).map(
            (t) => [t, getContactTypeLabel(t)],
          ),
        ),
        contactOutcomeLabels: Object.fromEntries(
          (["very_positive", "positive", "neutral", "difficult", "did_not_happen"] as const).map(
            (o) => [o, getContactOutcomeLabel(o)],
          ),
        ),
        contactPersonLabels: Object.fromEntries(
          (["parent_mother", "parent_father", "sibling", "grandparent", "extended_family", "other_significant"] as const).map(
            (p) => [p, getContactPersonLabel(p)],
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

  const { contacts, policy, training, homeId, periodStart, periodEnd } = body as {
    contacts?: FamilyContact[];
    policy?: ContactPolicy | null;
    training?: StaffContactTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateFamilyContactQualityIntelligence(
    contacts ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
