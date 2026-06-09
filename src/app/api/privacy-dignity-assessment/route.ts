// ==============================================================================
// API: /api/privacy-dignity-assessment
//
// Privacy & Dignity Assessment Intelligence
//
// GET  — Returns assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generatePrivacyDignityIntelligence,
  getPrivacyDomainLabel,
  getComplianceStatusLabel,
  getAuditOutcomeLabel,
  getChildFeedbackRatingLabel,
  getIncidentTypeLabel,
  getRatingLabel,
} from "@/lib/privacy-dignity-assessment";
import type {
  PrivacyAudit,
  ChildPrivacyFeedback,
  PrivacyIncident,
  StaffPrivacyTraining,
} from "@/lib/privacy-dignity-assessment";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_AUDITS: PrivacyAudit[] = [
  {
    id: "aud-1",
    auditDate: "2026-03-15",
    auditedBy: "Darren Laville",
    domain: "bedroom",
    complianceStatus: "fully_compliant",
    auditOutcome: "passed",
    knockingPolicyObserved: true,
    lockableStorageProvided: true,
    personalSpaceRespected: true,
    findingsNotes: "All bedrooms personalised with own décor, locks on drawers provided",
  },
  {
    id: "aud-2",
    auditDate: "2026-03-15",
    auditedBy: "Darren Laville",
    domain: "bathroom",
    complianceStatus: "fully_compliant",
    auditOutcome: "passed",
    knockingPolicyObserved: true,
    lockableStorageProvided: true,
    personalSpaceRespected: true,
    findingsNotes: "Bathroom locks functional, dignity maintained during personal care",
  },
  {
    id: "aud-3",
    auditDate: "2026-04-10",
    auditedBy: "Sarah Johnson",
    domain: "communication",
    complianceStatus: "fully_compliant",
    auditOutcome: "passed",
    knockingPolicyObserved: true,
    lockableStorageProvided: true,
    personalSpaceRespected: true,
    findingsNotes: "Private phone call area available, children can receive mail unopened",
  },
  {
    id: "aud-4",
    auditDate: "2026-04-10",
    auditedBy: "Sarah Johnson",
    domain: "personal_belongings",
    complianceStatus: "fully_compliant",
    auditOutcome: "passed",
    knockingPolicyObserved: true,
    lockableStorageProvided: true,
    personalSpaceRespected: true,
    findingsNotes: "Personal belongings inventories up to date, secure storage available",
  },
  {
    id: "aud-5",
    auditDate: "2026-05-01",
    auditedBy: "Darren Laville",
    domain: "digital_privacy",
    complianceStatus: "mostly_compliant",
    auditOutcome: "minor_findings",
    knockingPolicyObserved: true,
    lockableStorageProvided: true,
    personalSpaceRespected: true,
    findingsNotes: "Digital device policy clear, minor update needed to social media monitoring guidance",
  },
  {
    id: "aud-6",
    auditDate: "2026-05-01",
    auditedBy: "Darren Laville",
    domain: "bodily_autonomy",
    complianceStatus: "fully_compliant",
    auditOutcome: "passed",
    knockingPolicyObserved: true,
    lockableStorageProvided: true,
    personalSpaceRespected: true,
    findingsNotes: "Children consulted on personal care routines, body autonomy well respected",
  },
];

const DEMO_FEEDBACK: ChildPrivacyFeedback[] = [
  {
    id: "fb-1",
    childId: "child-alex",
    childName: "Alex",
    feedbackDate: "2026-04-20",
    domain: "bedroom",
    rating: "very_positive",
    feelsPrivacyRespected: true,
    feelsBedroomIsOwn: true,
    canMakePrivateCalls: true,
    belongingsSafe: true,
    comments: "Staff always knock and wait before entering",
  },
  {
    id: "fb-2",
    childId: "child-jordan",
    childName: "Jordan",
    feedbackDate: "2026-04-20",
    domain: "bedroom",
    rating: "positive",
    feelsPrivacyRespected: true,
    feelsBedroomIsOwn: true,
    canMakePrivateCalls: true,
    belongingsSafe: true,
    comments: "My room feels like my own space",
  },
  {
    id: "fb-3",
    childId: "child-morgan",
    childName: "Morgan",
    feedbackDate: "2026-04-20",
    domain: "communication",
    rating: "very_positive",
    feelsPrivacyRespected: true,
    feelsBedroomIsOwn: true,
    canMakePrivateCalls: true,
    belongingsSafe: true,
    comments: "I can call my friends whenever I want in private",
  },
  {
    id: "fb-4",
    childId: "child-alex",
    childName: "Alex",
    feedbackDate: "2026-05-10",
    domain: "personal_belongings",
    rating: "positive",
    feelsPrivacyRespected: true,
    feelsBedroomIsOwn: true,
    canMakePrivateCalls: true,
    belongingsSafe: true,
    comments: "I have a lockable drawer for my things",
  },
  {
    id: "fb-5",
    childId: "child-jordan",
    childName: "Jordan",
    feedbackDate: "2026-05-10",
    domain: "digital_privacy",
    rating: "positive",
    feelsPrivacyRespected: true,
    feelsBedroomIsOwn: true,
    canMakePrivateCalls: true,
    belongingsSafe: true,
    comments: "I know the WiFi rules and they feel fair",
  },
];

const DEMO_INCIDENTS: PrivacyIncident[] = [];

const DEMO_TRAINING: StaffPrivacyTraining[] = [
  {
    id: "tr-1",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    privacyRightsAwareness: true,
    knockingPolicyTrained: true,
    confidentialityTrained: true,
    dataProtectionTrained: true,
    bodyAutonomyTrained: true,
    digitalPrivacyTrained: true,
  },
  {
    id: "tr-2",
    staffId: "staff-tom",
    staffName: "Tom Richards",
    privacyRightsAwareness: true,
    knockingPolicyTrained: true,
    confidentialityTrained: true,
    dataProtectionTrained: true,
    bodyAutonomyTrained: true,
    digitalPrivacyTrained: false,
  },
  {
    id: "tr-3",
    staffId: "staff-lisa",
    staffName: "Lisa Williams",
    privacyRightsAwareness: true,
    knockingPolicyTrained: true,
    confidentialityTrained: true,
    dataProtectionTrained: true,
    bodyAutonomyTrained: true,
    digitalPrivacyTrained: true,
  },
  {
    id: "tr-4",
    staffId: "staff-darren",
    staffName: "Darren Laville",
    privacyRightsAwareness: true,
    knockingPolicyTrained: true,
    confidentialityTrained: true,
    dataProtectionTrained: true,
    bodyAutonomyTrained: true,
    digitalPrivacyTrained: true,
  },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generatePrivacyDignityIntelligence(
    DEMO_AUDITS,
    DEMO_FEEDBACK,
    DEMO_INCIDENTS,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        privacyDomainLabels: Object.fromEntries(
          (["bedroom", "bathroom", "communication", "personal_belongings", "personal_information", "bodily_autonomy", "digital_privacy", "mail_correspondence"] as const).map(
            (d) => [d, getPrivacyDomainLabel(d)],
          ),
        ),
        complianceStatusLabels: Object.fromEntries(
          (["fully_compliant", "mostly_compliant", "partially_compliant", "non_compliant"] as const).map(
            (s) => [s, getComplianceStatusLabel(s)],
          ),
        ),
        auditOutcomeLabels: Object.fromEntries(
          (["passed", "minor_findings", "major_findings", "failed"] as const).map(
            (o) => [o, getAuditOutcomeLabel(o)],
          ),
        ),
        childFeedbackRatingLabels: Object.fromEntries(
          (["very_positive", "positive", "neutral", "negative", "very_negative"] as const).map(
            (r) => [r, getChildFeedbackRatingLabel(r)],
          ),
        ),
        incidentTypeLabels: Object.fromEntries(
          (["unauthorised_room_entry", "belongings_searched_without_consent", "communication_intercepted", "information_disclosed", "bodily_autonomy_breach", "digital_privacy_breach", "mail_opened", "other"] as const).map(
            (t) => [t, getIncidentTypeLabel(t)],
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

  const { audits, feedback, incidents, training, homeId, periodStart, periodEnd } = body as {
    audits?: PrivacyAudit[];
    feedback?: ChildPrivacyFeedback[];
    incidents?: PrivacyIncident[];
    training?: StaffPrivacyTraining[];
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

  const result = generatePrivacyDignityIntelligence(
    audits ?? [],
    feedback ?? [],
    incidents ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
