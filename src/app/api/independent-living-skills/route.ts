import { NextResponse } from "next/server";
import {
  generateIndependentLivingSkillsIntelligence,
  getSkillTypeLabel,
  getCompetencyLevelLabel,
  getRatingLabel,
} from "@/lib/independent-living-skills";
import type {
  SkillsSession,
  LivingSkillsPolicy,
  StaffLivingSkillsTraining,
} from "@/lib/independent-living-skills";

const DEMO_SESSIONS: SkillsSession[] = [
  { id: "ss-1", childId: "child-alex", childName: "Alex", sessionDate: "2026-04-01", skillType: "cooking_meal_prep", competencyLevel: "independent", childEngaged: true, progressMade: true, confidenceBuilt: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "ss-2", childId: "child-alex", childName: "Alex", sessionDate: "2026-04-08", skillType: "budgeting_money", competencyLevel: "mostly_independent", childEngaged: true, progressMade: true, confidenceBuilt: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "ss-3", childId: "child-alex", childName: "Alex", sessionDate: "2026-04-15", skillType: "laundry_clothing_care", competencyLevel: "independent", childEngaged: true, progressMade: true, confidenceBuilt: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "ss-4", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-04-01", skillType: "cleaning_tidying", competencyLevel: "independent", childEngaged: true, progressMade: true, confidenceBuilt: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "ss-5", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-04-08", skillType: "personal_hygiene", competencyLevel: "mostly_independent", childEngaged: true, progressMade: true, confidenceBuilt: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "ss-6", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-04-15", skillType: "shopping_errands", competencyLevel: "independent", childEngaged: true, progressMade: true, confidenceBuilt: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "ss-7", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-04-01", skillType: "travel_navigation", competencyLevel: "independent", childEngaged: true, progressMade: true, confidenceBuilt: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "ss-8", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-04-08", skillType: "home_maintenance", competencyLevel: "mostly_independent", childEngaged: true, progressMade: true, confidenceBuilt: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
];

const DEMO_POLICY: LivingSkillsPolicy = {
  id: "lp-1",
  independenceStrategy: true,
  skillsDevelopmentPlan: true,
  ageAppropriateFramework: true,
  riskAssessmentProcess: true,
  pathwayPlanIntegration: true,
  communityAccessPolicy: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffLivingSkillsTraining[] = [
  { id: "st-1", staffId: "staff-sarah", staffName: "Sarah Johnson", independencePromotion: true, practicalSkillsTeaching: true, riskEnablement: true, pathwayPlanning: true, communityAccess: true, motivationalApproaches: true },
  { id: "st-2", staffId: "staff-tom", staffName: "Tom Richards", independencePromotion: true, practicalSkillsTeaching: true, riskEnablement: true, pathwayPlanning: true, communityAccess: true, motivationalApproaches: true },
  { id: "st-3", staffId: "staff-lisa", staffName: "Lisa Williams", independencePromotion: true, practicalSkillsTeaching: true, riskEnablement: true, pathwayPlanning: true, communityAccess: true, motivationalApproaches: true },
  { id: "st-4", staffId: "staff-darren", staffName: "Darren Laville", independencePromotion: true, practicalSkillsTeaching: true, riskEnablement: true, pathwayPlanning: true, communityAccess: true, motivationalApproaches: true },
];

export async function GET() {
  const result = generateIndependentLivingSkillsIntelligence(
    DEMO_SESSIONS, DEMO_POLICY, DEMO_TRAINING, "oak-house", "2026-01-01", "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        skillTypeLabels: Object.fromEntries(
          (["cooking_meal_prep", "cleaning_tidying", "laundry_clothing_care", "budgeting_money", "personal_hygiene", "shopping_errands", "travel_navigation", "home_maintenance"] as const).map((t) => [t, getSkillTypeLabel(t)]),
        ),
        competencyLevelLabels: Object.fromEntries(
          (["independent", "mostly_independent", "developing", "requires_support", "not_started"] as const).map((c) => [c, getCompetencyLevelLabel(c)]),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map((r) => [r, getRatingLabel(r)]),
        ),
      },
    },
  });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { sessions, policy, training, homeId, periodStart, periodEnd } = body as {
    sessions?: SkillsSession[]; policy?: LivingSkillsPolicy | null; training?: StaffLivingSkillsTraining[];
    homeId?: string; periodStart?: string; periodEnd?: string;
  };

  if (!periodStart || !periodEnd) return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });

  const result = generateIndependentLivingSkillsIntelligence(
    sessions ?? [], policy ?? null, training ?? [], homeId ?? "unknown", periodStart, periodEnd,
  );

  return NextResponse.json({ data: result });
}
