// ==============================================================================
// API: /api/independence-life-skills
//
// Independence & Life Skills Intelligence
//
// GET  — Returns independence assessment with Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateIndependenceLifeSkillsIntelligence,
  getSkillDomainLabel,
  getCompetenceLevelLabel,
  getAssessmentFrequencyLabel,
  getGoalStatusLabel,
  getTeachingMethodLabel,
  getRatingLabel,
} from "@/lib/independence-life-skills";
import type {
  SkillAssessment,
  IndependenceGoal,
  PracticalSession,
  PathwayPlanProgress,
} from "@/lib/independence-life-skills";

// -- Demo Data: Oak House -------------------------------------------------------

// Alex (14): developing well — cooking, budgeting, hygiene assessed, goals on track
const ALEX_ASSESSMENTS: SkillAssessment[] = [
  { id: "sa-a1", childId: "child-alex", childName: "Alex", domain: "cooking_nutrition", competenceLevel: "mostly_independent", assessedDate: "2026-04-01", assessedBy: "Sarah Johnson", previousLevel: "needs_some_support", targetLevel: "independent", notes: null },
  { id: "sa-a2", childId: "child-alex", childName: "Alex", domain: "budgeting_finance", competenceLevel: "needs_some_support", assessedDate: "2026-04-01", assessedBy: "Sarah Johnson", previousLevel: "needs_significant_support", targetLevel: "mostly_independent", notes: null },
  { id: "sa-a3", childId: "child-alex", childName: "Alex", domain: "personal_hygiene", competenceLevel: "independent", assessedDate: "2026-04-01", assessedBy: "Sarah Johnson", previousLevel: "mostly_independent", targetLevel: "independent", notes: null },
  { id: "sa-a4", childId: "child-alex", childName: "Alex", domain: "travel_transport", competenceLevel: "mostly_independent", assessedDate: "2026-04-01", assessedBy: "Sarah Johnson", previousLevel: "needs_some_support", targetLevel: "independent", notes: null },
  { id: "sa-a5", childId: "child-alex", childName: "Alex", domain: "digital_literacy", competenceLevel: "independent", assessedDate: "2026-04-01", assessedBy: "Sarah Johnson", previousLevel: "mostly_independent", targetLevel: "independent", notes: null },
];

// Jordan (13): behind in most areas — limited engagement
const JORDAN_ASSESSMENTS: SkillAssessment[] = [
  { id: "sa-j1", childId: "child-jordan", childName: "Jordan", domain: "cooking_nutrition", competenceLevel: "needs_significant_support", assessedDate: "2026-04-01", assessedBy: "Tom Richards", previousLevel: "needs_significant_support", targetLevel: "needs_some_support", notes: null },
  { id: "sa-j2", childId: "child-jordan", childName: "Jordan", domain: "personal_hygiene", competenceLevel: "needs_some_support", assessedDate: "2026-04-01", assessedBy: "Tom Richards", previousLevel: "needs_significant_support", targetLevel: "mostly_independent", notes: null },
  { id: "sa-j3", childId: "child-jordan", childName: "Jordan", domain: "digital_literacy", competenceLevel: "mostly_independent", assessedDate: "2026-04-01", assessedBy: "Tom Richards", previousLevel: null, targetLevel: "independent", notes: "Naturally skilled" },
];

// Morgan (15): advanced — approaching independence across multiple domains
const MORGAN_ASSESSMENTS: SkillAssessment[] = [
  { id: "sa-m1", childId: "child-morgan", childName: "Morgan", domain: "cooking_nutrition", competenceLevel: "independent", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", previousLevel: "mostly_independent", targetLevel: "independent", notes: null },
  { id: "sa-m2", childId: "child-morgan", childName: "Morgan", domain: "budgeting_finance", competenceLevel: "mostly_independent", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", previousLevel: "needs_some_support", targetLevel: "independent", notes: null },
  { id: "sa-m3", childId: "child-morgan", childName: "Morgan", domain: "laundry_clothing", competenceLevel: "independent", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", previousLevel: "mostly_independent", targetLevel: "independent", notes: null },
  { id: "sa-m4", childId: "child-morgan", childName: "Morgan", domain: "travel_transport", competenceLevel: "independent", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", previousLevel: "needs_some_support", targetLevel: "independent", notes: null },
  { id: "sa-m5", childId: "child-morgan", childName: "Morgan", domain: "household_tasks", competenceLevel: "mostly_independent", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", previousLevel: "needs_some_support", targetLevel: "independent", notes: null },
  { id: "sa-m6", childId: "child-morgan", childName: "Morgan", domain: "health_management", competenceLevel: "mostly_independent", assessedDate: "2026-04-01", assessedBy: "Lisa Williams", previousLevel: "needs_some_support", targetLevel: "independent", notes: null },
];

const DEMO_ASSESSMENTS: SkillAssessment[] = [
  ...ALEX_ASSESSMENTS,
  ...JORDAN_ASSESSMENTS,
  ...MORGAN_ASSESSMENTS,
];

const DEMO_GOALS: IndependenceGoal[] = [
  { id: "ig-a1", childId: "child-alex", childName: "Alex", domain: "cooking_nutrition", goalDescription: "Cook a full meal independently", status: "on_track", targetDate: "2026-07-01", reviewDate: "2026-05-01", childInvolved: true, ageAppropriate: true },
  { id: "ig-a2", childId: "child-alex", childName: "Alex", domain: "budgeting_finance", goalDescription: "Manage weekly pocket money budget", status: "on_track", targetDate: "2026-06-01", reviewDate: "2026-05-01", childInvolved: true, ageAppropriate: true },
  { id: "ig-a3", childId: "child-alex", childName: "Alex", domain: "travel_transport", goalDescription: "Travel to school independently by bus", status: "achieved", targetDate: "2026-04-01", reviewDate: "2026-04-15", childInvolved: true, ageAppropriate: true },
  { id: "ig-j1", childId: "child-jordan", childName: "Jordan", domain: "cooking_nutrition", goalDescription: "Prepare breakfast independently", status: "behind", targetDate: "2026-04-01", reviewDate: null, childInvolved: false, ageAppropriate: true },
  { id: "ig-j2", childId: "child-jordan", childName: "Jordan", domain: "personal_hygiene", goalDescription: "Maintain daily hygiene routine", status: "on_track", targetDate: "2026-06-01", reviewDate: "2026-05-01", childInvolved: true, ageAppropriate: true },
  { id: "ig-m1", childId: "child-morgan", childName: "Morgan", domain: "budgeting_finance", goalDescription: "Open and manage a bank account", status: "achieved", targetDate: "2026-03-01", reviewDate: "2026-03-15", childInvolved: true, ageAppropriate: true },
  { id: "ig-m2", childId: "child-morgan", childName: "Morgan", domain: "household_tasks", goalDescription: "Complete a full weekly clean of bedroom", status: "achieved", targetDate: "2026-04-01", reviewDate: "2026-04-10", childInvolved: true, ageAppropriate: true },
  { id: "ig-m3", childId: "child-morgan", childName: "Morgan", domain: "health_management", goalDescription: "Book and attend GP appointment independently", status: "on_track", targetDate: "2026-06-01", reviewDate: "2026-05-01", childInvolved: true, ageAppropriate: true },
];

const DEMO_SESSIONS: PracticalSession[] = [
  { id: "ps-a1", childId: "child-alex", childName: "Alex", domain: "cooking_nutrition", teachingMethod: "practical_activity", date: "2026-03-10", durationMinutes: 60, childEngaged: true, progressMade: true, staffMember: "Sarah Johnson", communityBased: false },
  { id: "ps-a2", childId: "child-alex", childName: "Alex", domain: "cooking_nutrition", teachingMethod: "practical_activity", date: "2026-03-24", durationMinutes: 60, childEngaged: true, progressMade: true, staffMember: "Sarah Johnson", communityBased: false },
  { id: "ps-a3", childId: "child-alex", childName: "Alex", domain: "budgeting_finance", teachingMethod: "one_to_one", date: "2026-03-15", durationMinutes: 45, childEngaged: true, progressMade: true, staffMember: "Sarah Johnson", communityBased: false },
  { id: "ps-a4", childId: "child-alex", childName: "Alex", domain: "travel_transport", teachingMethod: "community_based", date: "2026-03-20", durationMinutes: 90, childEngaged: true, progressMade: true, staffMember: "Sarah Johnson", communityBased: true },
  { id: "ps-j1", childId: "child-jordan", childName: "Jordan", domain: "cooking_nutrition", teachingMethod: "practical_activity", date: "2026-03-12", durationMinutes: 45, childEngaged: false, progressMade: false, staffMember: "Tom Richards", communityBased: false },
  { id: "ps-j2", childId: "child-jordan", childName: "Jordan", domain: "personal_hygiene", teachingMethod: "one_to_one", date: "2026-03-18", durationMinutes: 30, childEngaged: true, progressMade: true, staffMember: "Tom Richards", communityBased: false },
  { id: "ps-m1", childId: "child-morgan", childName: "Morgan", domain: "cooking_nutrition", teachingMethod: "practical_activity", date: "2026-03-05", durationMinutes: 90, childEngaged: true, progressMade: true, staffMember: "Lisa Williams", communityBased: false },
  { id: "ps-m2", childId: "child-morgan", childName: "Morgan", domain: "budgeting_finance", teachingMethod: "community_based", date: "2026-03-10", durationMinutes: 60, childEngaged: true, progressMade: true, staffMember: "Lisa Williams", communityBased: true },
  { id: "ps-m3", childId: "child-morgan", childName: "Morgan", domain: "laundry_clothing", teachingMethod: "practical_activity", date: "2026-03-15", durationMinutes: 45, childEngaged: true, progressMade: true, staffMember: "Lisa Williams", communityBased: false },
  { id: "ps-m4", childId: "child-morgan", childName: "Morgan", domain: "travel_transport", teachingMethod: "community_based", date: "2026-03-22", durationMinutes: 120, childEngaged: true, progressMade: true, staffMember: "Lisa Williams", communityBased: true },
  { id: "ps-m5", childId: "child-morgan", childName: "Morgan", domain: "health_management", teachingMethod: "one_to_one", date: "2026-04-01", durationMinutes: 45, childEngaged: true, progressMade: true, staffMember: "Lisa Williams", communityBased: false },
];

const DEMO_PATHWAYS: PathwayPlanProgress[] = [
  { id: "pp-a", childId: "child-alex", childName: "Alex", hasPathwayPlan: true, lastReviewDate: "2026-04-15", independenceSectionComplete: true, accommodationPlanned: false, educationEmploymentPlanned: true, financialLiteracyIncluded: true, healthPassportComplete: false, socialNetworksIdentified: true, childContributed: true },
  { id: "pp-j", childId: "child-jordan", childName: "Jordan", hasPathwayPlan: false, lastReviewDate: null, independenceSectionComplete: false, accommodationPlanned: false, educationEmploymentPlanned: false, financialLiteracyIncluded: false, healthPassportComplete: false, socialNetworksIdentified: false, childContributed: false },
  { id: "pp-m", childId: "child-morgan", childName: "Morgan", hasPathwayPlan: true, lastReviewDate: "2026-04-20", independenceSectionComplete: true, accommodationPlanned: true, educationEmploymentPlanned: true, financialLiteracyIncluded: true, healthPassportComplete: true, socialNetworksIdentified: true, childContributed: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateIndependenceLifeSkillsIntelligence(
    DEMO_ASSESSMENTS,
    DEMO_GOALS,
    DEMO_SESSIONS,
    DEMO_PATHWAYS,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        skillDomainLabels: Object.fromEntries(
          (["cooking_nutrition", "budgeting_finance", "personal_hygiene", "laundry_clothing", "household_tasks", "travel_transport", "communication", "digital_literacy", "health_management", "emotional_regulation", "social_skills", "problem_solving"] as const).map(
            (d) => [d, getSkillDomainLabel(d)],
          ),
        ),
        competenceLevelLabels: Object.fromEntries(
          (["independent", "mostly_independent", "needs_some_support", "needs_significant_support", "not_yet_started"] as const).map(
            (l) => [l, getCompetenceLevelLabel(l)],
          ),
        ),
        assessmentFrequencyLabels: Object.fromEntries(
          (["monthly", "quarterly", "six_monthly", "annually", "ad_hoc"] as const).map(
            (f) => [f, getAssessmentFrequencyLabel(f)],
          ),
        ),
        goalStatusLabels: Object.fromEntries(
          (["achieved", "on_track", "behind", "not_started", "abandoned"] as const).map(
            (s) => [s, getGoalStatusLabel(s)],
          ),
        ),
        teachingMethodLabels: Object.fromEntries(
          (["one_to_one", "group_session", "practical_activity", "community_based", "peer_mentoring", "online_learning"] as const).map(
            (m) => [m, getTeachingMethodLabel(m)],
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

  const { assessments, goals, sessions, pathways, homeId, periodStart, periodEnd } = body as {
    assessments?: SkillAssessment[];
    goals?: IndependenceGoal[];
    sessions?: PracticalSession[];
    pathways?: PathwayPlanProgress[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateIndependenceLifeSkillsIntelligence(
    assessments ?? [],
    goals ?? [],
    sessions ?? [],
    pathways ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
