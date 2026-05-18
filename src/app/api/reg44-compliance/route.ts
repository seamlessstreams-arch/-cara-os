// ══════════════════════════════════════════════════════════════════════════════
// API: /api/reg44-compliance
//
// Reg 44 Compliance Intelligence
//
// GET  — Returns Reg 44 compliance assessment with realistic Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateReg44ComplianceIntelligence,
  getVisitFocusLabel,
  getRecommendationPriorityLabel,
  getRecommendationStatusLabel,
} from "@/lib/reg44-compliance";
import type {
  Reg44Visit,
  Reg44Recommendation,
  ChildParticipation,
  ManagementResponse,
} from "@/lib/reg44-compliance";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

const CHILD_IDS = ["child-morgan", "child-alex", "child-jayden"];

const DEMO_VISITS: Reg44Visit[] = [
  {
    id: "v-jan",
    homeId: "oak-house",
    visitDate: "2025-01-20",
    visitor: "Sandra Mitchell",
    visitorIndependent: true,
    childrenSpokenTo: 3,
    totalChildren: 3,
    staffSpokenTo: 2,
    recordsReviewed: true,
    environmentInspected: true,
    focusAreas: ["overall_quality", "safeguarding", "children_views"],
    overallRating: "good",
    positiveFindings: ["Warm, nurturing atmosphere observed", "Children engaged and happy"],
    concerns: ["Fire drill records incomplete"],
    reportSubmittedDate: "2025-01-25",
    reportSubmittedOnTime: true,
    sharedWithOfsted: true,
  },
  {
    id: "v-feb",
    homeId: "oak-house",
    visitDate: "2025-02-18",
    visitor: "Sandra Mitchell",
    visitorIndependent: true,
    childrenSpokenTo: 3,
    totalChildren: 3,
    staffSpokenTo: 3,
    recordsReviewed: true,
    environmentInspected: true,
    focusAreas: ["behaviour", "education", "staffing"],
    overallRating: "good",
    positiveFindings: ["Behaviour management is consistent and child-centred", "PEP reviews timely"],
    concerns: [],
    reportSubmittedDate: "2025-02-22",
    reportSubmittedOnTime: true,
    sharedWithOfsted: true,
  },
  {
    id: "v-mar",
    homeId: "oak-house",
    visitDate: "2025-03-15",
    visitor: "Sandra Mitchell",
    visitorIndependent: true,
    childrenSpokenTo: 2,
    totalChildren: 3,
    staffSpokenTo: 2,
    recordsReviewed: true,
    environmentInspected: true,
    focusAreas: ["health", "environment", "records"],
    overallRating: "outstanding",
    positiveFindings: ["Health appointments all up to date", "Environment well-maintained and homely", "Records accurate and current"],
    concerns: [],
    reportSubmittedDate: "2025-03-20",
    reportSubmittedOnTime: true,
    sharedWithOfsted: true,
  },
  {
    id: "v-apr",
    homeId: "oak-house",
    visitDate: "2025-04-22",
    visitor: "Sandra Mitchell",
    visitorIndependent: true,
    childrenSpokenTo: 3,
    totalChildren: 3,
    staffSpokenTo: 2,
    recordsReviewed: true,
    environmentInspected: true,
    focusAreas: ["complaints", "children_views", "safeguarding"],
    overallRating: "good",
    positiveFindings: ["Complaints procedure understood by children", "Children feel safe"],
    concerns: ["One child expressed frustration about Wi-Fi access"],
    reportSubmittedDate: "2025-04-28",
    reportSubmittedOnTime: true,
    sharedWithOfsted: true,
  },
  {
    id: "v-may",
    homeId: "oak-house",
    visitDate: "2025-05-19",
    visitor: "Sandra Mitchell",
    visitorIndependent: true,
    childrenSpokenTo: 3,
    totalChildren: 3,
    staffSpokenTo: 3,
    recordsReviewed: true,
    environmentInspected: true,
    focusAreas: ["overall_quality", "staffing", "education"],
    overallRating: "outstanding",
    positiveFindings: ["Outstanding practice observed in therapeutic keywork", "Staff morale high"],
    concerns: [],
    reportSubmittedDate: "2025-05-24",
    reportSubmittedOnTime: true,
    sharedWithOfsted: true,
  },
  {
    id: "v-jun",
    homeId: "oak-house",
    visitDate: "2025-06-16",
    visitor: "Sandra Mitchell",
    visitorIndependent: true,
    childrenSpokenTo: 3,
    totalChildren: 3,
    staffSpokenTo: 2,
    recordsReviewed: true,
    environmentInspected: true,
    focusAreas: ["behaviour", "health", "children_views"],
    overallRating: "good",
    positiveFindings: ["Children report feeling listened to", "Health needs well managed"],
    concerns: ["Garden furniture needs repair"],
    reportSubmittedDate: "2025-06-20",
    reportSubmittedOnTime: true,
    sharedWithOfsted: true,
  },
];

const DEMO_RECOMMENDATIONS: Reg44Recommendation[] = [
  { id: "rec-1", homeId: "oak-house", visitId: "v-jan", description: "Complete fire drill records for all shifts", priority: "high", status: "completed", assignedTo: "Darren Laville", targetDate: "2025-02-10", completedDate: "2025-02-05", evidenceOfCompletion: "Fire drill log updated and verified", impactAssessed: true },
  { id: "rec-2", homeId: "oak-house", visitId: "v-jan", description: "Update emergency contact list for all children", priority: "medium", status: "completed", assignedTo: "Darren Laville", targetDate: "2025-02-15", completedDate: "2025-02-10", evidenceOfCompletion: "Contact lists updated on file", impactAssessed: true },
  { id: "rec-3", homeId: "oak-house", visitId: "v-feb", description: "Ensure agency staff receive induction pack before first shift", priority: "high", status: "completed", assignedTo: "Darren Laville", targetDate: "2025-03-10", completedDate: "2025-03-08", evidenceOfCompletion: "Induction checklist signed by 2 agency workers", impactAssessed: true },
  { id: "rec-4", homeId: "oak-house", visitId: "v-feb", description: "Review and update behaviour support plans for all children", priority: "medium", status: "completed", assignedTo: "Darren Laville", targetDate: "2025-03-15", completedDate: "2025-03-14", evidenceOfCompletion: "Plans reviewed and updated on Cornerstone", impactAssessed: true },
  { id: "rec-5", homeId: "oak-house", visitId: "v-mar", description: "Create sensory profile for Jayden", priority: "medium", status: "completed", assignedTo: "Darren Laville", targetDate: "2025-04-10", completedDate: "2025-04-08", evidenceOfCompletion: "Sensory profile completed with OT input", impactAssessed: true },
  { id: "rec-6", homeId: "oak-house", visitId: "v-mar", description: "Install additional bathroom grab rail", priority: "low", status: "completed", assignedTo: "Darren Laville", targetDate: "2025-04-30", completedDate: "2025-04-15", evidenceOfCompletion: "Grab rail installed, photo on file", impactAssessed: false },
  { id: "rec-7", homeId: "oak-house", visitId: "v-apr", description: "Review Wi-Fi access policy with children's council", priority: "medium", status: "completed", assignedTo: "Darren Laville", targetDate: "2025-05-15", completedDate: "2025-05-12", evidenceOfCompletion: "Children's council meeting minutes — new Wi-Fi policy agreed", impactAssessed: true },
  { id: "rec-8", homeId: "oak-house", visitId: "v-apr", description: "Refresh safeguarding training for night staff", priority: "immediate", status: "completed", assignedTo: "Darren Laville", targetDate: "2025-05-01", completedDate: "2025-04-28", evidenceOfCompletion: "Training certificates on file for all night staff", impactAssessed: true },
  { id: "rec-9", homeId: "oak-house", visitId: "v-may", description: "Document therapeutic keywork outcomes in care plans", priority: "medium", status: "completed", assignedTo: "Darren Laville", targetDate: "2025-06-15", completedDate: "2025-06-10", evidenceOfCompletion: "Care plans updated with keywork outcome sections", impactAssessed: true },
  { id: "rec-10", homeId: "oak-house", visitId: "v-may", description: "Establish peer mentoring programme between children", priority: "low", status: "in_progress", assignedTo: "Darren Laville", targetDate: "2025-07-31", impactAssessed: false },
  { id: "rec-11", homeId: "oak-house", visitId: "v-jun", description: "Repair garden furniture and create outdoor activity zone", priority: "medium", status: "open", assignedTo: "Darren Laville", targetDate: "2025-07-15", impactAssessed: false },
  { id: "rec-12", homeId: "oak-house", visitId: "v-jun", description: "Review health pathway documentation for new admission", priority: "high", status: "in_progress", assignedTo: "Darren Laville", targetDate: "2025-07-10", impactAssessed: false },
];

const DEMO_PARTICIPATION: ChildParticipation[] = [
  { id: "cp-1", homeId: "oak-house", visitId: "v-jan", childId: "child-morgan", childName: "Morgan", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-2", homeId: "oak-house", visitId: "v-jan", childId: "child-alex", childName: "Alex", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-3", homeId: "oak-house", visitId: "v-jan", childId: "child-jayden", childName: "Jayden", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-4", homeId: "oak-house", visitId: "v-feb", childId: "child-morgan", childName: "Morgan", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-5", homeId: "oak-house", visitId: "v-feb", childId: "child-alex", childName: "Alex", spokenTo: true, viewsCaptured: true, feedbackPositive: false, issuesRaised: ["Wants more activities at weekends"], issuesActioned: true },
  { id: "cp-6", homeId: "oak-house", visitId: "v-feb", childId: "child-jayden", childName: "Jayden", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-7", homeId: "oak-house", visitId: "v-mar", childId: "child-morgan", childName: "Morgan", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-8", homeId: "oak-house", visitId: "v-mar", childId: "child-alex", childName: "Alex", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-9", homeId: "oak-house", visitId: "v-mar", childId: "child-jayden", childName: "Jayden", spokenTo: false, viewsCaptured: false, feedbackPositive: false, issuesRaised: [], issuesActioned: false },
  { id: "cp-10", homeId: "oak-house", visitId: "v-apr", childId: "child-morgan", childName: "Morgan", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-11", homeId: "oak-house", visitId: "v-apr", childId: "child-alex", childName: "Alex", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-12", homeId: "oak-house", visitId: "v-apr", childId: "child-jayden", childName: "Jayden", spokenTo: true, viewsCaptured: true, feedbackPositive: false, issuesRaised: ["Wi-Fi too slow for gaming"], issuesActioned: true },
  { id: "cp-13", homeId: "oak-house", visitId: "v-may", childId: "child-morgan", childName: "Morgan", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-14", homeId: "oak-house", visitId: "v-may", childId: "child-alex", childName: "Alex", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-15", homeId: "oak-house", visitId: "v-may", childId: "child-jayden", childName: "Jayden", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-16", homeId: "oak-house", visitId: "v-jun", childId: "child-morgan", childName: "Morgan", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-17", homeId: "oak-house", visitId: "v-jun", childId: "child-alex", childName: "Alex", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
  { id: "cp-18", homeId: "oak-house", visitId: "v-jun", childId: "child-jayden", childName: "Jayden", spokenTo: true, viewsCaptured: true, feedbackPositive: true, issuesRaised: [], issuesActioned: false },
];

const DEMO_RESPONSES: ManagementResponse[] = [
  { id: "mr-1", homeId: "oak-house", visitId: "v-jan", responseDate: "2025-01-28", respondedOnTime: true, acceptedRecommendations: 2, rejectedRecommendations: 0, rejectionReasons: [], actionPlanCreated: true, sharedWithRI: true },
  { id: "mr-2", homeId: "oak-house", visitId: "v-feb", responseDate: "2025-02-25", respondedOnTime: true, acceptedRecommendations: 2, rejectedRecommendations: 0, rejectionReasons: [], actionPlanCreated: true, sharedWithRI: true },
  { id: "mr-3", homeId: "oak-house", visitId: "v-mar", responseDate: "2025-03-25", respondedOnTime: true, acceptedRecommendations: 2, rejectedRecommendations: 0, rejectionReasons: [], actionPlanCreated: true, sharedWithRI: true },
  { id: "mr-4", homeId: "oak-house", visitId: "v-apr", responseDate: "2025-05-02", respondedOnTime: true, acceptedRecommendations: 2, rejectedRecommendations: 0, rejectionReasons: [], actionPlanCreated: true, sharedWithRI: true },
  { id: "mr-5", homeId: "oak-house", visitId: "v-may", responseDate: "2025-05-28", respondedOnTime: true, acceptedRecommendations: 2, rejectedRecommendations: 0, rejectionReasons: [], actionPlanCreated: true, sharedWithRI: true },
  { id: "mr-6", homeId: "oak-house", visitId: "v-jun", responseDate: "2025-06-23", respondedOnTime: true, acceptedRecommendations: 2, rejectedRecommendations: 0, rejectionReasons: [], actionPlanCreated: true, sharedWithRI: true },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateReg44ComplianceIntelligence(
    DEMO_VISITS,
    DEMO_RECOMMENDATIONS,
    DEMO_PARTICIPATION,
    DEMO_RESPONSES,
    CHILD_IDS,
    "oak-house",
    "2025-01-01",
    "2025-06-30",
    "2025-07-01",
  );

  // Enrich focus area coverage with labels
  const enrichedFocusAreas = result.visitCompliance.focusAreaCoverage.map((f) => ({
    ...f,
    areaLabel: getVisitFocusLabel(f.area),
  }));

  // Enrich overdue recommendations with priority labels
  const enrichedOverdue = result.recommendations.overdueRecommendations.map((r) => ({
    ...r,
    priorityLabel: getRecommendationPriorityLabel(r.priority),
  }));

  // Enrich priority breakdown with labels
  const enrichedPriorities = result.recommendations.priorityBreakdown.map((p) => ({
    ...p,
    priorityLabel: getRecommendationPriorityLabel(p.priority),
  }));

  return NextResponse.json({
    data: {
      ...result,
      visitCompliance: {
        ...result.visitCompliance,
        focusAreaCoverage: enrichedFocusAreas,
      },
      recommendations: {
        ...result.recommendations,
        overdueRecommendations: enrichedOverdue,
        priorityBreakdown: enrichedPriorities,
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    visits,
    recommendations,
    participation,
    responses,
    childIds,
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
  } = body as {
    visits?: Reg44Visit[];
    recommendations?: Reg44Recommendation[];
    participation?: ChildParticipation[];
    responses?: ManagementResponse[];
    childIds?: string[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    referenceDate?: string;
  };

  if (!periodStart || !periodEnd || !referenceDate) {
    return NextResponse.json(
      { error: "periodStart, periodEnd, and referenceDate are required" },
      { status: 400 },
    );
  }

  const result = generateReg44ComplianceIntelligence(
    visits ?? [],
    recommendations ?? [],
    participation ?? [],
    responses ?? [],
    childIds ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
    referenceDate,
  );

  return NextResponse.json({ data: result });
}
