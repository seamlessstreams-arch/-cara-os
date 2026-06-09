// ==============================================================================
// API: /api/visitor-partnership-quality
//
// Visitor & Partnership Quality Intelligence
//
// GET  — Returns visitor/partnership assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateVisitorPartnershipQualityIntelligence,
  getVisitorTypeLabel,
  getVisitPurposeLabel,
  getVisitOutcomeLabel,
  getPartnershipRatingLabel,
  getActionStatusLabel,
  getRatingLabel,
} from "@/lib/visitor-partnership-quality";
import type {
  VisitRecord,
  PartnershipAssessment,
  Reg44Visit,
  VisitorAction,
} from "@/lib/visitor-partnership-quality";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_VISITS: VisitRecord[] = [
  // Alex — regular SW and therapy visits
  { id: "vr-1", visitorType: "social_worker", visitorName: "Claire Davies", visitPurpose: "statutory_visit", date: "2026-02-10", childId: "child-alex", childName: "Alex", outcome: "positive", reportProvided: true, recommendationsCount: 0, childSeen: true, childSpokenToAlone: true, duration: 45, followUpDate: null },
  { id: "vr-2", visitorType: "therapist", visitorName: "Dr Rachel Green", visitPurpose: "therapy_session", date: "2026-02-20", childId: "child-alex", childName: "Alex", outcome: "positive", reportProvided: true, recommendationsCount: 0, childSeen: true, childSpokenToAlone: true, duration: 50, followUpDate: null },
  { id: "vr-3", visitorType: "social_worker", visitorName: "Claire Davies", visitPurpose: "statutory_visit", date: "2026-04-14", childId: "child-alex", childName: "Alex", outcome: "constructive", reportProvided: true, recommendationsCount: 1, childSeen: true, childSpokenToAlone: true, duration: 40, followUpDate: "2026-05-14" },
  // Jordan — SW visits + CAMHS
  { id: "vr-4", visitorType: "social_worker", visitorName: "Mark Thompson", visitPurpose: "statutory_visit", date: "2026-01-25", childId: "child-jordan", childName: "Jordan", outcome: "positive", reportProvided: true, recommendationsCount: 0, childSeen: true, childSpokenToAlone: true, duration: 50, followUpDate: null },
  { id: "vr-5", visitorType: "health_professional", visitorName: "CAMHS Team", visitPurpose: "health_appointment", date: "2026-03-05", childId: "child-jordan", childName: "Jordan", outcome: "constructive", reportProvided: true, recommendationsCount: 1, childSeen: true, childSpokenToAlone: false, duration: 60, followUpDate: "2026-04-05" },
  { id: "vr-6", visitorType: "social_worker", visitorName: "Mark Thompson", visitPurpose: "review_meeting", date: "2026-04-20", childId: "child-jordan", childName: "Jordan", outcome: "positive", reportProvided: true, recommendationsCount: 0, childSeen: true, childSpokenToAlone: true, duration: 55, followUpDate: null },
  // Morgan — IRO review + education
  { id: "vr-7", visitorType: "iro", visitorName: "Susan Clarke", visitPurpose: "review_meeting", date: "2026-02-28", childId: "child-morgan", childName: "Morgan", outcome: "positive", reportProvided: true, recommendationsCount: 2, childSeen: true, childSpokenToAlone: true, duration: 90, followUpDate: "2026-05-28" },
  { id: "vr-8", visitorType: "education_professional", visitorName: "PEP Coordinator", visitPurpose: "education_support", date: "2026-03-20", childId: "child-morgan", childName: "Morgan", outcome: "positive", reportProvided: true, recommendationsCount: 0, childSeen: true, childSpokenToAlone: null, duration: 45, followUpDate: null },
  // General home visits
  { id: "vr-9", visitorType: "advocate", visitorName: "Children's Rights Alliance", visitPurpose: "general_support", date: "2026-03-10", childId: null, childName: null, outcome: "positive", reportProvided: false, recommendationsCount: 0, childSeen: true, childSpokenToAlone: true, duration: 60, followUpDate: null },
];

const DEMO_PARTNERSHIPS: PartnershipAssessment[] = [
  { id: "pa-1", partnerAgency: "CAMHS", partnerType: "health_professional", assessmentDate: "2026-03-01", partnershipRating: "good", informationSharingEffective: true, jointPlanningEvident: true, responsiveToRequests: true, attendsReviewMeetings: true, childFocused: true, challengeAccepted: true },
  { id: "pa-2", partnerAgency: "Oakwood Academy", partnerType: "education_professional", assessmentDate: "2026-03-01", partnershipRating: "excellent", informationSharingEffective: true, jointPlanningEvident: true, responsiveToRequests: true, attendsReviewMeetings: true, childFocused: true, challengeAccepted: true },
  { id: "pa-3", partnerAgency: "Local Authority SW Team", partnerType: "social_worker", assessmentDate: "2026-03-01", partnershipRating: "good", informationSharingEffective: true, jointPlanningEvident: false, responsiveToRequests: true, attendsReviewMeetings: true, childFocused: true, challengeAccepted: false },
];

const DEMO_REG44S: Reg44Visit[] = [
  { id: "r44-1", visitDate: "2026-02-15", visitorName: "Helen Morris (Independent)", childrenInterviewed: 3, totalChildren: 3, staffInterviewed: 2, reportTimely: true, issuesRaised: 1, issuesResolved: 1, previousRecommendationsReviewed: true, overallPositive: true },
  { id: "r44-2", visitDate: "2026-03-15", visitorName: "Helen Morris (Independent)", childrenInterviewed: 2, totalChildren: 3, staffInterviewed: 2, reportTimely: true, issuesRaised: 0, issuesResolved: 0, previousRecommendationsReviewed: true, overallPositive: true },
  { id: "r44-3", visitDate: "2026-04-15", visitorName: "Helen Morris (Independent)", childrenInterviewed: 3, totalChildren: 3, staffInterviewed: 3, reportTimely: true, issuesRaised: 2, issuesResolved: 1, previousRecommendationsReviewed: true, overallPositive: true },
];

const DEMO_ACTIONS: VisitorAction[] = [
  { id: "va-1", visitId: "vr-3", visitorType: "social_worker", description: "Update Alex's care plan with new education targets", assignedTo: "Darren Laville", dueDate: "2026-05-14", status: "completed", completedDate: "2026-05-10" },
  { id: "va-2", visitId: "vr-7", visitorType: "iro", description: "Review Morgan's pathway plan timeline", assignedTo: "Darren Laville", dueDate: "2026-03-28", status: "completed", completedDate: "2026-03-25" },
  { id: "va-3", visitId: "vr-7", visitorType: "iro", description: "Arrange college visit for Morgan", assignedTo: "Sarah Johnson", dueDate: "2026-04-30", status: "completed", completedDate: "2026-04-28" },
  { id: "va-4", visitId: "r44-3", visitorType: "reg44_visitor", description: "Update fire evacuation plan signage", assignedTo: "Tom Richards", dueDate: "2026-05-15", status: "in_progress", completedDate: null },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateVisitorPartnershipQualityIntelligence(
    DEMO_VISITS,
    DEMO_PARTNERSHIPS,
    DEMO_REG44S,
    DEMO_ACTIONS,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        visitorTypeLabels: Object.fromEntries(
          (["reg44_visitor", "social_worker", "iro", "therapist", "advocate", "family_member", "education_professional", "health_professional", "ofsted_inspector", "police_liaison"] as const).map(
            (t) => [t, getVisitorTypeLabel(t)],
          ),
        ),
        visitPurposeLabels: Object.fromEntries(
          (["statutory_visit", "review_meeting", "therapy_session", "care_planning", "safeguarding", "education_support", "health_appointment", "family_contact", "inspection", "general_support"] as const).map(
            (p) => [p, getVisitPurposeLabel(p)],
          ),
        ),
        visitOutcomeLabels: Object.fromEntries(
          (["positive", "constructive", "concerns_raised", "action_required", "follow_up_needed", "cancelled", "no_show"] as const).map(
            (o) => [o, getVisitOutcomeLabel(o)],
          ),
        ),
        partnershipRatingLabels: Object.fromEntries(
          (["excellent", "good", "adequate", "poor"] as const).map(
            (r) => [r, getPartnershipRatingLabel(r)],
          ),
        ),
        actionStatusLabels: Object.fromEntries(
          (["completed", "in_progress", "overdue", "not_started"] as const).map(
            (s) => [s, getActionStatusLabel(s)],
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

  const { visits, partnerships, reg44s, actions, homeId, periodStart, periodEnd } = body as {
    visits?: VisitRecord[];
    partnerships?: PartnershipAssessment[];
    reg44s?: Reg44Visit[];
    actions?: VisitorAction[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateVisitorPartnershipQualityIntelligence(
    visits ?? [],
    partnerships ?? [],
    reg44s ?? [],
    actions ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
