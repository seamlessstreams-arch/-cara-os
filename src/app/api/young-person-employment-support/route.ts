// ==============================================================================
// API: /api/young-person-employment-support
//
// Young Person Employment Support Intelligence
//
// GET  — Returns employment support assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateYoungPersonEmploymentSupportIntelligence,
  getSupportTypeLabel,
  getEngagementLevelLabel,
  getOutcomeStatusLabel,
  getCareersPlanStatusLabel,
  getRatingLabel,
} from "@/lib/young-person-employment-support";
import type {
  ChildEmploymentProfile,
  EmploymentSupportSession,
  PartnershipRecord,
  StaffEmploymentTraining,
} from "@/lib/young-person-employment-support";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_PROFILES: ChildEmploymentProfile[] = [
  {
    id: "cep-alex",
    childId: "child-alex",
    childName: "Alex",
    age: 14,
    careersPlanExists: true,
    careersPlanStatus: "current",
    careerAspirations: ["Chef"],
    workExperienceCompleted: true,
    cvPrepared: true,
    interviewPracticed: false,
    financialLiteracyAssessed: false,
    personalAdviserEngaged: false,
  },
  {
    id: "cep-jordan",
    childId: "child-jordan",
    childName: "Jordan",
    age: 13,
    careersPlanExists: false,
    careersPlanStatus: "not_in_place",
    careerAspirations: ["Artist"],
    workExperienceCompleted: false,
    cvPrepared: false,
    interviewPracticed: false,
    financialLiteracyAssessed: false,
    personalAdviserEngaged: false,
  },
  {
    id: "cep-morgan",
    childId: "child-morgan",
    childName: "Morgan",
    age: 15,
    careersPlanExists: true,
    careersPlanStatus: "current",
    careerAspirations: ["IT Technician", "Game Developer"],
    workExperienceCompleted: true,
    cvPrepared: true,
    interviewPracticed: true,
    financialLiteracyAssessed: true,
    personalAdviserEngaged: true,
  },
];

const DEMO_SESSIONS: EmploymentSupportSession[] = [
  {
    id: "ess-1",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-03-15",
    supportType: "cv_writing",
    facilitatedBy: "Sarah Johnson",
    duration: 45,
    childEngaged: "partially_engaged",
    outcomeStatus: "achieved",
    skillsDeveloped: ["CV formatting", "Personal statement writing"],
    nextSteps: "Review CV in one month",
  },
  {
    id: "ess-2",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-04-10",
    supportType: "work_experience",
    facilitatedBy: "Tom Richards",
    duration: 480,
    childEngaged: "engaged",
    outcomeStatus: "achieved",
    skillsDeveloped: ["Customer service", "Food hygiene awareness"],
    nextSteps: "Discuss experience and reflect on career goals",
  },
  {
    id: "ess-3",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-02-20",
    supportType: "careers_guidance",
    facilitatedBy: "Lisa Williams",
    duration: 60,
    childEngaged: "highly_engaged",
    outcomeStatus: "achieved",
    skillsDeveloped: ["Career research", "Labour market awareness"],
    nextSteps: "Explore IT apprenticeship options",
  },
  {
    id: "ess-4",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-03-25",
    supportType: "interview_skills",
    facilitatedBy: "Sarah Johnson",
    duration: 60,
    childEngaged: "highly_engaged",
    outcomeStatus: "achieved",
    skillsDeveloped: ["Interview technique", "Confidence building"],
    nextSteps: "Mock interview with employer partner",
  },
  {
    id: "ess-5",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-04-15",
    supportType: "financial_literacy",
    facilitatedBy: "Darren Laville",
    duration: 45,
    childEngaged: "engaged",
    outcomeStatus: "achieved",
    skillsDeveloped: ["Budgeting basics", "Bank account management"],
    nextSteps: "Set up practice budget for next month",
  },
  {
    id: "ess-6",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-04-28",
    supportType: "careers_guidance",
    facilitatedBy: "Lisa Williams",
    duration: 30,
    childEngaged: "engaged",
    outcomeStatus: "in_progress",
    skillsDeveloped: ["Exploring interests"],
    nextSteps: "Research creative career paths",
  },
];

const DEMO_PARTNERSHIPS: PartnershipRecord[] = [
  {
    id: "pr-1",
    partnerId: "partner-cafe",
    partnerName: "The Corner Cafe",
    partnerType: "employer",
    activeEngagement: true,
    opportunitiesProvided: 2,
    childrenSupported: ["child-alex", "child-morgan"],
  },
  {
    id: "pr-2",
    partnerId: "partner-college",
    partnerName: "City College",
    partnerType: "college",
    activeEngagement: true,
    opportunitiesProvided: 3,
    childrenSupported: ["child-morgan"],
  },
  {
    id: "pr-3",
    partnerId: "partner-volunteer",
    partnerName: "Community Hub",
    partnerType: "volunteer_org",
    activeEngagement: true,
    opportunitiesProvided: 1,
    childrenSupported: ["child-alex"],
  },
];

const DEMO_TRAINING: StaffEmploymentTraining[] = [
  {
    id: "set-1",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    careersGuidanceTrained: true,
    cvInterviewSupport: true,
    financialLiteracyTrained: true,
    apprenticeshipAwareness: true,
    localLabourMarket: true,
    motivationalInterviewing: true,
  },
  {
    id: "set-2",
    staffId: "staff-tom",
    staffName: "Tom Richards",
    careersGuidanceTrained: true,
    cvInterviewSupport: true,
    financialLiteracyTrained: false,
    apprenticeshipAwareness: true,
    localLabourMarket: false,
    motivationalInterviewing: false,
  },
  {
    id: "set-3",
    staffId: "staff-lisa",
    staffName: "Lisa Williams",
    careersGuidanceTrained: true,
    cvInterviewSupport: true,
    financialLiteracyTrained: true,
    apprenticeshipAwareness: true,
    localLabourMarket: true,
    motivationalInterviewing: true,
  },
  {
    id: "set-4",
    staffId: "staff-darren",
    staffName: "Darren Laville",
    careersGuidanceTrained: true,
    cvInterviewSupport: true,
    financialLiteracyTrained: true,
    apprenticeshipAwareness: true,
    localLabourMarket: true,
    motivationalInterviewing: true,
  },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateYoungPersonEmploymentSupportIntelligence(
    DEMO_PROFILES,
    DEMO_SESSIONS,
    DEMO_PARTNERSHIPS,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        supportTypeLabels: Object.fromEntries(
          (["work_experience", "cv_writing", "interview_skills", "careers_guidance", "financial_literacy", "apprenticeship_search", "college_application", "volunteering"] as const).map(
            (t) => [t, getSupportTypeLabel(t)],
          ),
        ),
        engagementLevelLabels: Object.fromEntries(
          (["highly_engaged", "engaged", "partially_engaged", "disengaged"] as const).map(
            (e) => [e, getEngagementLevelLabel(e)],
          ),
        ),
        outcomeStatusLabels: Object.fromEntries(
          (["achieved", "in_progress", "not_started", "not_applicable"] as const).map(
            (o) => [o, getOutcomeStatusLabel(o)],
          ),
        ),
        careersPlanStatusLabels: Object.fromEntries(
          (["current", "overdue", "not_in_place"] as const).map(
            (c) => [c, getCareersPlanStatusLabel(c)],
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

  const { profiles, sessions, partnerships, training, homeId, periodStart, periodEnd } = body as {
    profiles?: ChildEmploymentProfile[];
    sessions?: EmploymentSupportSession[];
    partnerships?: PartnershipRecord[];
    training?: StaffEmploymentTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateYoungPersonEmploymentSupportIntelligence(
    profiles ?? [],
    sessions ?? [],
    partnerships ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
