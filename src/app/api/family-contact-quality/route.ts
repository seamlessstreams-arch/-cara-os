// ══════════════════════════════════════════════════════════════════════════════
// API: /api/family-contact-quality
//
// Family Contact Quality Intelligence
//
// GET  — Returns family contact quality metrics with Oak House demo data
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generateFamilyContactQualityIntelligence,
  getContactTypeLabels,
  getContactOutcomeLabels,
  getRatingLabels,
} from "@/lib/family-contact-quality";
import type {
  FamilyContact,
  FamilyContactPolicy,
  StaffFamilyContactTraining,
} from "@/lib/family-contact-quality";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

const DEMO_CONTACTS: FamilyContact[] = [
  // Alex — face-to-face visit (very positive)
  { id: "fc-001", childId: "child-alex", childName: "Alex", contactDate: "2026-02-10", contactType: "face_to_face_visit", contactOutcome: "very_positive", childPrepared: true, childConsulted: true, supportProvided: true, documentedInPlan: true, staffSupervised: true, feedbackRecorded: true },
  // Alex — video call (positive)
  { id: "fc-002", childId: "child-alex", childName: "Alex", contactDate: "2026-03-05", contactType: "video_call", contactOutcome: "positive", childPrepared: true, childConsulted: true, supportProvided: true, documentedInPlan: true, staffSupervised: true, feedbackRecorded: true },
  // Alex — sibling contact (very positive)
  { id: "fc-003", childId: "child-alex", childName: "Alex", contactDate: "2026-04-12", contactType: "sibling_contact", contactOutcome: "very_positive", childPrepared: true, childConsulted: true, supportProvided: true, documentedInPlan: true, staffSupervised: true, feedbackRecorded: true },
  // Jordan — supervised contact (positive)
  { id: "fc-004", childId: "child-jordan", childName: "Jordan", contactDate: "2026-02-20", contactType: "supervised_contact", contactOutcome: "positive", childPrepared: true, childConsulted: true, supportProvided: true, documentedInPlan: true, staffSupervised: true, feedbackRecorded: true },
  // Jordan — phone call (very positive)
  { id: "fc-005", childId: "child-jordan", childName: "Jordan", contactDate: "2026-03-15", contactType: "phone_call", contactOutcome: "very_positive", childPrepared: true, childConsulted: true, supportProvided: true, documentedInPlan: true, staffSupervised: true, feedbackRecorded: true },
  // Jordan — family activity (positive)
  { id: "fc-006", childId: "child-jordan", childName: "Jordan", contactDate: "2026-04-20", contactType: "family_activity", contactOutcome: "positive", childPrepared: true, childConsulted: true, supportProvided: true, documentedInPlan: true, staffSupervised: true, feedbackRecorded: true },
  // Morgan — letter/email (very positive)
  { id: "fc-007", childId: "child-morgan", childName: "Morgan", contactDate: "2026-03-01", contactType: "letter_email", contactOutcome: "very_positive", childPrepared: true, childConsulted: true, supportProvided: true, documentedInPlan: true, staffSupervised: true, feedbackRecorded: true },
  // Morgan — unsupervised contact (positive)
  { id: "fc-008", childId: "child-morgan", childName: "Morgan", contactDate: "2026-04-08", contactType: "unsupervised_contact", contactOutcome: "positive", childPrepared: true, childConsulted: true, supportProvided: true, documentedInPlan: true, staffSupervised: true, feedbackRecorded: true },
];

const DEMO_POLICY: FamilyContactPolicy = {
  id: "pol-oak",
  contactPromotionStrategy: true,
  safeguardingProtocol: true,
  supervisedContactProcedure: true,
  letteringAndPhonePolicy: true,
  siblingContactFramework: true,
  familyEngagementPlan: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffFamilyContactTraining[] = [
  { id: "tr-sarah", staffId: "staff-sarah", staffName: "Sarah Johnson", familyDynamicsAwareness: true, contactSupervision: true, safeguardingInContact: true, childPreparationSkills: true, conflictManagement: true, recordKeeping: true },
  { id: "tr-tom", staffId: "staff-tom", staffName: "Tom Richards", familyDynamicsAwareness: true, contactSupervision: true, safeguardingInContact: true, childPreparationSkills: true, conflictManagement: true, recordKeeping: true },
  { id: "tr-lisa", staffId: "staff-lisa", staffName: "Lisa Williams", familyDynamicsAwareness: true, contactSupervision: true, safeguardingInContact: true, childPreparationSkills: true, conflictManagement: true, recordKeeping: true },
  { id: "tr-darren", staffId: "staff-darren", staffName: "Darren Laville", familyDynamicsAwareness: true, contactSupervision: true, safeguardingInContact: true, childPreparationSkills: true, conflictManagement: true, recordKeeping: true },
];

// ── GET ───────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateFamilyContactQualityIntelligence(
    DEMO_CONTACTS,
    DEMO_POLICY,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        contactTypeLabels: getContactTypeLabels(),
        contactOutcomeLabels: getContactOutcomeLabels(),
        ratingLabels: getRatingLabels(),
      },
    },
  });
}

// ── POST ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { contacts, policy, training, homeId, periodStart, periodEnd } = body as {
    contacts?: FamilyContact[];
    policy?: FamilyContactPolicy | null;
    training?: StaffFamilyContactTraining[];
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
