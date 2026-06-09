// ==============================================================================
// API: /api/parental-contact-management
//
// Parental Contact Management Intelligence
//
// GET  — Returns parental contact assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateParentalContactManagementIntelligence,
  getContactTypeLabel,
  getContactOutcomeLabel,
  getRiskLevelLabel,
  getComplianceStatusLabel,
  getRatingLabel,
} from "@/lib/parental-contact-management";
import type {
  ParentalContactPlan,
  ParentalContactSession,
  ContactRiskAssessment,
  StaffContactTraining,
} from "@/lib/parental-contact-management";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_PLANS: ParentalContactPlan[] = [
  // Alex — mother: supervised face-to-face monthly, medium risk, court order
  { id: "pcp-1", childId: "child-alex", childName: "Alex", parentId: "parent-alex-mother", parentName: "Claire Thompson", contactType: "face_to_face_supervised", frequency: "Monthly", riskLevel: "medium", courtOrderInPlace: true, contactSupervisor: "Sarah Johnson", planReviewDate: "2026-06-01", planCurrent: true, childViewConsidered: true },
  // Alex — father: telephone fortnightly, low risk
  { id: "pcp-2", childId: "child-alex", childName: "Alex", parentId: "parent-alex-father", parentName: "David Thompson", contactType: "telephone", frequency: "Fortnightly", riskLevel: "low", courtOrderInPlace: false, contactSupervisor: "Tom Richards", planReviewDate: "2026-06-01", planCurrent: true, childViewConsidered: true },
  // Jordan — mother: supervised face-to-face fortnightly, high risk, court order
  { id: "pcp-3", childId: "child-jordan", childName: "Jordan", parentId: "parent-jordan-mother", parentName: "Michelle Carter", contactType: "face_to_face_supervised", frequency: "Fortnightly", riskLevel: "high", courtOrderInPlace: true, contactSupervisor: "Lisa Williams", planReviewDate: "2026-06-15", planCurrent: true, childViewConsidered: true },
  // Jordan — father: no contact order
  { id: "pcp-4", childId: "child-jordan", childName: "Jordan", parentId: "parent-jordan-father", parentName: "Gary Carter", contactType: "no_contact_order", frequency: "None", riskLevel: "very_high", courtOrderInPlace: true, contactSupervisor: "", planReviewDate: "2026-09-01", planCurrent: true, childViewConsidered: true },
  // Morgan — mother: unsupervised face-to-face weekly, low risk
  { id: "pcp-5", childId: "child-morgan", childName: "Morgan", parentId: "parent-morgan-mother", parentName: "Sarah Davies", contactType: "face_to_face_unsupervised", frequency: "Weekly", riskLevel: "low", courtOrderInPlace: false, contactSupervisor: "", planReviewDate: "2026-06-01", planCurrent: true, childViewConsidered: true },
  // Morgan — father: video call monthly, low risk
  { id: "pcp-6", childId: "child-morgan", childName: "Morgan", parentId: "parent-morgan-father", parentName: "James Davies", contactType: "video_call", frequency: "Monthly", riskLevel: "low", courtOrderInPlace: false, contactSupervisor: "", planReviewDate: "2026-06-01", planCurrent: true, childViewConsidered: true },
];

const DEMO_SESSIONS: ParentalContactSession[] = [
  // Alex — supervised visit with mother (positive)
  { id: "pcs-1", childId: "child-alex", childName: "Alex", parentId: "parent-alex-mother", parentName: "Claire Thompson", date: "2026-04-15", contactType: "face_to_face_supervised", duration: 60, outcome: "positive", supervisedBy: "Sarah Johnson", childPrepared: true, childDebriefed: true, parentCooperative: true, safeguardingConcernRaised: false, incidentDuringContact: false },
  // Alex — phone call with father (positive)
  { id: "pcs-2", childId: "child-alex", childName: "Alex", parentId: "parent-alex-father", parentName: "David Thompson", date: "2026-04-20", contactType: "telephone", duration: 30, outcome: "positive", supervisedBy: "Tom Richards", childPrepared: true, childDebriefed: true, parentCooperative: true, safeguardingConcernRaised: false, incidentDuringContact: false },
  // Jordan — supervised visit with mother (mixed)
  { id: "pcs-3", childId: "child-jordan", childName: "Jordan", parentId: "parent-jordan-mother", parentName: "Michelle Carter", date: "2026-04-10", contactType: "face_to_face_supervised", duration: 45, outcome: "mixed", supervisedBy: "Lisa Williams", childPrepared: true, childDebriefed: true, parentCooperative: false, safeguardingConcernRaised: false, incidentDuringContact: false },
  // Jordan — supervised visit with mother (negative — cancelled by parent)
  { id: "pcs-4", childId: "child-jordan", childName: "Jordan", parentId: "parent-jordan-mother", parentName: "Michelle Carter", date: "2026-04-24", contactType: "face_to_face_supervised", duration: 0, outcome: "cancelled_by_parent", supervisedBy: "Lisa Williams", childPrepared: true, childDebriefed: true, parentCooperative: false, safeguardingConcernRaised: false, incidentDuringContact: false },
  // Morgan — unsupervised visit with mother (positive)
  { id: "pcs-5", childId: "child-morgan", childName: "Morgan", parentId: "parent-morgan-mother", parentName: "Sarah Davies", date: "2026-05-01", contactType: "face_to_face_unsupervised", duration: 120, outcome: "positive", supervisedBy: "", childPrepared: true, childDebriefed: true, parentCooperative: true, safeguardingConcernRaised: false, incidentDuringContact: false },
  // Morgan — video call with father (positive)
  { id: "pcs-6", childId: "child-morgan", childName: "Morgan", parentId: "parent-morgan-father", parentName: "James Davies", date: "2026-05-05", contactType: "video_call", duration: 30, outcome: "positive", supervisedBy: "", childPrepared: true, childDebriefed: false, parentCooperative: true, safeguardingConcernRaised: false, incidentDuringContact: false },
];

const DEMO_ASSESSMENTS: ContactRiskAssessment[] = [
  // Alex — mother (medium risk)
  { id: "cra-1", childId: "child-alex", childName: "Alex", parentId: "parent-alex-mother", parentName: "Claire Thompson", assessmentDate: "2026-03-01", assessedBy: "Darren Laville", riskLevel: "medium", riskFactorsIdentified: ["History of emotional volatility", "Previous boundary issues"], safeguardingMeasures: ["Supervised contact only", "Staff to monitor emotional state"], reviewDate: "2026-06-01", reviewCurrent: true },
  // Jordan — mother (high risk)
  { id: "cra-2", childId: "child-jordan", childName: "Jordan", parentId: "parent-jordan-mother", parentName: "Michelle Carter", assessmentDate: "2026-02-15", assessedBy: "Darren Laville", riskLevel: "high", riskFactorsIdentified: ["Substance misuse history", "Domestic abuse history", "Unpredictable behaviour"], safeguardingMeasures: ["Supervised contact at all times", "Two staff present", "Contact in designated room"], reviewDate: "2026-05-15", reviewCurrent: true },
  // Jordan — father (very high risk)
  { id: "cra-3", childId: "child-jordan", childName: "Jordan", parentId: "parent-jordan-father", parentName: "Gary Carter", assessmentDate: "2026-01-10", assessedBy: "Darren Laville", riskLevel: "very_high", riskFactorsIdentified: ["Convicted of offence against child", "Court-ordered no contact"], safeguardingMeasures: ["No contact order enforced", "Alert system in place", "Staff briefed on appearance"], reviewDate: "2026-07-10", reviewCurrent: true },
];

const DEMO_TRAINING: StaffContactTraining[] = [
  { id: "sct-1", staffId: "staff-sarah", staffName: "Sarah Johnson", supervisedContactTrained: true, riskAssessmentTrained: true, childPrepDebriefTrained: true, safeguardingInContact: true, managingParentalConflict: true, courtOrderAwareness: true },
  { id: "sct-2", staffId: "staff-tom", staffName: "Tom Richards", supervisedContactTrained: true, riskAssessmentTrained: true, childPrepDebriefTrained: true, safeguardingInContact: true, managingParentalConflict: false, courtOrderAwareness: false },
  { id: "sct-3", staffId: "staff-lisa", staffName: "Lisa Williams", supervisedContactTrained: true, riskAssessmentTrained: true, childPrepDebriefTrained: true, safeguardingInContact: true, managingParentalConflict: true, courtOrderAwareness: true },
  { id: "sct-4", staffId: "staff-darren", staffName: "Darren Laville", supervisedContactTrained: true, riskAssessmentTrained: true, childPrepDebriefTrained: true, safeguardingInContact: true, managingParentalConflict: true, courtOrderAwareness: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateParentalContactManagementIntelligence(
    DEMO_PLANS,
    DEMO_SESSIONS,
    DEMO_ASSESSMENTS,
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
          (["face_to_face_supervised", "face_to_face_unsupervised", "telephone", "video_call", "letter", "no_contact_order"] as const).map(
            (t) => [t, getContactTypeLabel(t)],
          ),
        ),
        contactOutcomeLabels: Object.fromEntries(
          (["positive", "mixed", "negative", "cancelled_by_parent", "cancelled_by_child", "cancelled_by_authority"] as const).map(
            (o) => [o, getContactOutcomeLabel(o)],
          ),
        ),
        riskLevelLabels: Object.fromEntries(
          (["low", "medium", "high", "very_high"] as const).map(
            (r) => [r, getRiskLevelLabel(r)],
          ),
        ),
        complianceStatusLabels: Object.fromEntries(
          (["fully_compliant", "mostly_compliant", "partially_compliant", "non_compliant"] as const).map(
            (c) => [c, getComplianceStatusLabel(c)],
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

  const { plans, sessions, assessments, training, homeId, periodStart, periodEnd } = body as {
    plans?: ParentalContactPlan[];
    sessions?: ParentalContactSession[];
    assessments?: ContactRiskAssessment[];
    training?: StaffContactTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateParentalContactManagementIntelligence(
    plans ?? [],
    sessions ?? [],
    assessments ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
