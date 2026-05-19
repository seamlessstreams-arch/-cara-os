// ==============================================================================
// API: /api/transition-pathway-planning
//
// Transition Pathway Planning Intelligence
//
// GET  — Returns transition pathway planning assessment with Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateTransitionPathwayPlanningIntelligence,
  getTransitionTypeLabel,
  getPathwayStatusLabel,
  getSkillAreaLabel,
  getSkillLevelLabel,
  getRatingLabel,
} from "@/lib/transition-pathway-planning";
import type {
  PathwayPlan,
  IndependenceSkillAssessment,
  TransitionMeeting,
  StaffTransitionTraining,
} from "@/lib/transition-pathway-planning";

// -- Demo Data: Oak House -------------------------------------------------------

const DEMO_PLANS: PathwayPlan[] = [
  {
    id: "pp-1",
    childId: "child-alex",
    childName: "Alex",
    planDate: "2026-01-15",
    transitionType: "leaving_care",
    pathwayStatus: "on_track",
    personalAdviserAssigned: true,
    planReviewedRegularly: true,
    childViewsIncluded: true,
    accommodationIdentified: true,
    financialPlanInPlace: true,
    healthPassportCompleted: true,
  },
  {
    id: "pp-2",
    childId: "child-jordan",
    childName: "Jordan",
    planDate: "2026-02-01",
    transitionType: "semi_independence",
    pathwayStatus: "at_risk",
    personalAdviserAssigned: true,
    planReviewedRegularly: false,
    childViewsIncluded: true,
    accommodationIdentified: false,
    financialPlanInPlace: false,
    healthPassportCompleted: false,
  },
  {
    id: "pp-3",
    childId: "child-morgan",
    childName: "Morgan",
    planDate: "2026-03-10",
    transitionType: "foster_care",
    pathwayStatus: "in_progress",
    personalAdviserAssigned: true,
    planReviewedRegularly: true,
    childViewsIncluded: true,
    accommodationIdentified: true,
    financialPlanInPlace: true,
    healthPassportCompleted: true,
  },
];

const DEMO_ASSESSMENTS: IndependenceSkillAssessment[] = [
  // Alex — strong across the board
  { id: "isa-1", childId: "child-alex", childName: "Alex", assessmentDate: "2026-02-10", assessedBy: "Sarah Johnson", skillArea: "budgeting", currentLevel: "competent", supportInPlace: true, progressRecorded: true },
  { id: "isa-2", childId: "child-alex", childName: "Alex", assessmentDate: "2026-02-10", assessedBy: "Sarah Johnson", skillArea: "cooking", currentLevel: "independent", supportInPlace: true, progressRecorded: true },
  { id: "isa-3", childId: "child-alex", childName: "Alex", assessmentDate: "2026-02-10", assessedBy: "Sarah Johnson", skillArea: "cleaning", currentLevel: "competent", supportInPlace: true, progressRecorded: true },
  { id: "isa-4", childId: "child-alex", childName: "Alex", assessmentDate: "2026-02-10", assessedBy: "Sarah Johnson", skillArea: "laundry", currentLevel: "independent", supportInPlace: true, progressRecorded: true },
  { id: "isa-5", childId: "child-alex", childName: "Alex", assessmentDate: "2026-03-15", assessedBy: "Tom Richards", skillArea: "travel", currentLevel: "competent", supportInPlace: true, progressRecorded: true },
  { id: "isa-6", childId: "child-alex", childName: "Alex", assessmentDate: "2026-03-15", assessedBy: "Tom Richards", skillArea: "health_management", currentLevel: "developing", supportInPlace: true, progressRecorded: true },
  { id: "isa-7", childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-01", assessedBy: "Lisa Williams", skillArea: "employment_readiness", currentLevel: "competent", supportInPlace: true, progressRecorded: true },
  { id: "isa-8", childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-01", assessedBy: "Lisa Williams", skillArea: "emotional_resilience", currentLevel: "developing", supportInPlace: true, progressRecorded: true },
  // Jordan — developing, less support
  { id: "isa-9", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-03-01", assessedBy: "Darren Laville", skillArea: "budgeting", currentLevel: "developing", supportInPlace: true, progressRecorded: true },
  { id: "isa-10", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-03-01", assessedBy: "Darren Laville", skillArea: "cooking", currentLevel: "not_started", supportInPlace: false, progressRecorded: false },
  { id: "isa-11", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-03-15", assessedBy: "Sarah Johnson", skillArea: "cleaning", currentLevel: "developing", supportInPlace: true, progressRecorded: true },
  { id: "isa-12", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-04-10", assessedBy: "Tom Richards", skillArea: "social_skills", currentLevel: "competent", supportInPlace: true, progressRecorded: true },
  // Morgan — good progress
  { id: "isa-13", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-03-20", assessedBy: "Lisa Williams", skillArea: "budgeting", currentLevel: "competent", supportInPlace: true, progressRecorded: true },
  { id: "isa-14", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-03-20", assessedBy: "Lisa Williams", skillArea: "cooking", currentLevel: "competent", supportInPlace: true, progressRecorded: true },
  { id: "isa-15", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-04-05", assessedBy: "Darren Laville", skillArea: "shopping", currentLevel: "independent", supportInPlace: true, progressRecorded: true },
  { id: "isa-16", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-04-05", assessedBy: "Darren Laville", skillArea: "tenancy_management", currentLevel: "developing", supportInPlace: true, progressRecorded: true },
  { id: "isa-17", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-04-20", assessedBy: "Sarah Johnson", skillArea: "education_continuation", currentLevel: "competent", supportInPlace: true, progressRecorded: true },
];

const DEMO_MEETINGS: TransitionMeeting[] = [
  // Alex — well attended meetings
  { id: "tm-1", childId: "child-alex", childName: "Alex", meetingDate: "2026-01-20", attendees: ["Sarah Johnson", "Alex", "SW Jane Cooper", "Darren Laville"], minutesRecorded: true, actionsAgreed: true, childAttended: true, socialWorkerPresent: true, nextMeetingScheduled: true },
  { id: "tm-2", childId: "child-alex", childName: "Alex", meetingDate: "2026-03-18", attendees: ["Tom Richards", "Alex", "SW Jane Cooper", "Personal Adviser Mark Thompson"], minutesRecorded: true, actionsAgreed: true, childAttended: true, socialWorkerPresent: true, nextMeetingScheduled: true },
  { id: "tm-3", childId: "child-alex", childName: "Alex", meetingDate: "2026-05-10", attendees: ["Lisa Williams", "Alex", "SW Jane Cooper"], minutesRecorded: true, actionsAgreed: true, childAttended: true, socialWorkerPresent: true, nextMeetingScheduled: true },
  // Jordan — missed meeting, incomplete records
  { id: "tm-4", childId: "child-jordan", childName: "Jordan", meetingDate: "2026-02-15", attendees: ["Darren Laville", "Jordan", "SW Ahmed Patel"], minutesRecorded: true, actionsAgreed: true, childAttended: true, socialWorkerPresent: true, nextMeetingScheduled: true },
  { id: "tm-5", childId: "child-jordan", childName: "Jordan", meetingDate: "2026-04-12", attendees: ["Sarah Johnson", "SW Ahmed Patel"], minutesRecorded: true, actionsAgreed: false, childAttended: false, socialWorkerPresent: true, nextMeetingScheduled: false },
  // Morgan — good participation
  { id: "tm-6", childId: "child-morgan", childName: "Morgan", meetingDate: "2026-03-25", attendees: ["Lisa Williams", "Morgan", "SW Claire Davis", "Tom Richards"], minutesRecorded: true, actionsAgreed: true, childAttended: true, socialWorkerPresent: true, nextMeetingScheduled: true },
  { id: "tm-7", childId: "child-morgan", childName: "Morgan", meetingDate: "2026-05-05", attendees: ["Darren Laville", "Morgan", "SW Claire Davis"], minutesRecorded: true, actionsAgreed: true, childAttended: true, socialWorkerPresent: true, nextMeetingScheduled: true },
];

const DEMO_TRAINING: StaffTransitionTraining[] = [
  {
    id: "stt-1",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    leavingCarePolicy: true,
    pathwayPlanning: true,
    independenceSkills: true,
    housingOptions: true,
    financialCapability: true,
    emotionalSupport: true,
  },
  {
    id: "stt-2",
    staffId: "staff-tom",
    staffName: "Tom Richards",
    leavingCarePolicy: true,
    pathwayPlanning: true,
    independenceSkills: true,
    housingOptions: true,
    financialCapability: false,
    emotionalSupport: true,
  },
  {
    id: "stt-3",
    staffId: "staff-lisa",
    staffName: "Lisa Williams",
    leavingCarePolicy: true,
    pathwayPlanning: true,
    independenceSkills: true,
    housingOptions: false,
    financialCapability: true,
    emotionalSupport: true,
  },
  {
    id: "stt-4",
    staffId: "staff-darren",
    staffName: "Darren Laville",
    leavingCarePolicy: true,
    pathwayPlanning: true,
    independenceSkills: true,
    housingOptions: true,
    financialCapability: true,
    emotionalSupport: true,
  },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateTransitionPathwayPlanningIntelligence(
    DEMO_PLANS,
    DEMO_ASSESSMENTS,
    DEMO_MEETINGS,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        transitionTypeLabels: Object.fromEntries(
          (["leaving_care", "step_down", "foster_care", "semi_independence", "supported_living", "return_home", "adoption", "other"] as const).map(
            (v) => [v, getTransitionTypeLabel(v)],
          ),
        ),
        pathwayStatusLabels: Object.fromEntries(
          (["not_started", "in_progress", "on_track", "at_risk", "completed"] as const).map(
            (v) => [v, getPathwayStatusLabel(v)],
          ),
        ),
        skillAreaLabels: Object.fromEntries(
          (["budgeting", "cooking", "cleaning", "laundry", "shopping", "travel", "health_management", "tenancy_management", "employment_readiness", "education_continuation", "emotional_resilience", "social_skills"] as const).map(
            (v) => [v, getSkillAreaLabel(v)],
          ),
        ),
        skillLevelLabels: Object.fromEntries(
          (["not_started", "developing", "competent", "independent"] as const).map(
            (v) => [v, getSkillLevelLabel(v)],
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

  const { plans, assessments, meetings, training, homeId, periodStart, periodEnd } = body as {
    plans?: PathwayPlan[];
    assessments?: IndependenceSkillAssessment[];
    meetings?: TransitionMeeting[];
    training?: StaffTransitionTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateTransitionPathwayPlanningIntelligence(
    plans ?? [],
    assessments ?? [],
    meetings ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
