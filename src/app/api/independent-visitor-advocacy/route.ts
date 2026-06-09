// ==============================================================================
// API: /api/independent-visitor-advocacy
//
// Independent Visitor & Advocacy Intelligence
//
// GET  — Returns advocacy assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateIndependentVisitorAdvocacyIntelligence,
  getVisitorStatusLabel,
  getVisitOutcomeLabel,
  getAdvocacyTypeLabel,
  getReferralOutcomeLabel,
  getRatingLabel,
} from "@/lib/independent-visitor-advocacy";
import type {
  IndependentVisit,
  AdvocacyReferral,
  AdvocacyPolicy,
  StaffAdvocacyTraining,
} from "@/lib/independent-visitor-advocacy";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_VISITS: IndependentVisit[] = [
  { id: "iv-1", childId: "child-alex", childName: "Alex", visitDate: "2026-02-05", visitorName: "Margaret Clarke", visitOutcome: "very_positive", durationMinutes: 90, childEngaged: true, childSatisfied: true, recordedInCasefile: true, privateTimeProvided: true },
  { id: "iv-2", childId: "child-alex", childName: "Alex", visitDate: "2026-03-12", visitorName: "Margaret Clarke", visitOutcome: "positive", durationMinutes: 75, childEngaged: true, childSatisfied: true, recordedInCasefile: true, privateTimeProvided: true },
  { id: "iv-3", childId: "child-alex", childName: "Alex", visitDate: "2026-04-16", visitorName: "Margaret Clarke", visitOutcome: "very_positive", durationMinutes: 120, childEngaged: true, childSatisfied: true, recordedInCasefile: true, privateTimeProvided: true },
  { id: "iv-4", childId: "child-jordan", childName: "Jordan", visitDate: "2026-02-15", visitorName: "David Thompson", visitOutcome: "positive", durationMinutes: 60, childEngaged: true, childSatisfied: true, recordedInCasefile: true, privateTimeProvided: true },
  { id: "iv-5", childId: "child-jordan", childName: "Jordan", visitDate: "2026-03-22", visitorName: "David Thompson", visitOutcome: "very_positive", durationMinutes: 90, childEngaged: true, childSatisfied: true, recordedInCasefile: true, privateTimeProvided: true },
  { id: "iv-6", childId: "child-morgan", childName: "Morgan", visitDate: "2026-03-05", visitorName: "Janet Wilson", visitOutcome: "positive", durationMinutes: 60, childEngaged: true, childSatisfied: true, recordedInCasefile: true, privateTimeProvided: true },
  { id: "iv-7", childId: "child-morgan", childName: "Morgan", visitDate: "2026-04-10", visitorName: "Janet Wilson", visitOutcome: "positive", durationMinutes: 75, childEngaged: true, childSatisfied: true, recordedInCasefile: true, privateTimeProvided: true },
];

const DEMO_REFERRALS: AdvocacyReferral[] = [
  { id: "ar-1", childId: "child-alex", childName: "Alex", referralDate: "2026-01-20", advocacyType: "childrens_rights_officer", referralOutcome: "successful", childInformedOfRights: true, childConsentObtained: true, timelyResponse: true, childSatisfied: true },
  { id: "ar-2", childId: "child-jordan", childName: "Jordan", referralDate: "2026-02-10", advocacyType: "formal_advocate", referralOutcome: "successful", childInformedOfRights: true, childConsentObtained: true, timelyResponse: true, childSatisfied: true },
  { id: "ar-3", childId: "child-morgan", childName: "Morgan", referralDate: "2026-03-01", advocacyType: "complaints_advocacy", referralOutcome: "successful", childInformedOfRights: true, childConsentObtained: true, timelyResponse: true, childSatisfied: true },
];

const DEMO_POLICY: AdvocacyPolicy = {
  id: "ap-1",
  advocacyInformationDisplayed: true,
  childrenInformedOnAdmission: true,
  independentVisitorPromoted: true,
  complaintsAdvocacyAvailable: true,
  rightsLeafletProvided: true,
  regularRightsReminders: true,
  advocacyContactDetailsAccessible: true,
};

const DEMO_TRAINING: StaffAdvocacyTraining[] = [
  { id: "at-1", staffId: "staff-sarah", staffName: "Sarah Johnson", advocacyRights: true, independentVisitorRole: true, complaintsProcess: true, signposting: true, childParticipation: true, confidentiality: true },
  { id: "at-2", staffId: "staff-tom", staffName: "Tom Richards", advocacyRights: true, independentVisitorRole: true, complaintsProcess: true, signposting: true, childParticipation: true, confidentiality: true },
  { id: "at-3", staffId: "staff-lisa", staffName: "Lisa Williams", advocacyRights: true, independentVisitorRole: true, complaintsProcess: true, signposting: true, childParticipation: true, confidentiality: true },
  { id: "at-4", staffId: "staff-darren", staffName: "Darren Laville", advocacyRights: true, independentVisitorRole: true, complaintsProcess: true, signposting: true, childParticipation: true, confidentiality: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateIndependentVisitorAdvocacyIntelligence(
    DEMO_VISITS,
    DEMO_REFERRALS,
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
        visitorStatusLabels: Object.fromEntries(
          (["active", "pending_match", "not_requested", "declined_by_child", "ended"] as const).map(
            (s) => [s, getVisitorStatusLabel(s)],
          ),
        ),
        visitOutcomeLabels: Object.fromEntries(
          (["very_positive", "positive", "neutral", "difficult", "did_not_happen"] as const).map(
            (o) => [o, getVisitOutcomeLabel(o)],
          ),
        ),
        advocacyTypeLabels: Object.fromEntries(
          (["formal_advocate", "independent_visitor", "childrens_rights_officer", "complaints_advocacy", "legal_advocacy", "peer_advocacy", "other"] as const).map(
            (t) => [t, getAdvocacyTypeLabel(t)],
          ),
        ),
        referralOutcomeLabels: Object.fromEntries(
          (["successful", "in_progress", "declined_by_child", "no_service_available", "not_needed"] as const).map(
            (o) => [o, getReferralOutcomeLabel(o)],
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

  const { visits, referrals, policy, training, homeId, periodStart, periodEnd } = body as {
    visits?: IndependentVisit[];
    referrals?: AdvocacyReferral[];
    policy?: AdvocacyPolicy | null;
    training?: StaffAdvocacyTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateIndependentVisitorAdvocacyIntelligence(
    visits ?? [],
    referrals ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
