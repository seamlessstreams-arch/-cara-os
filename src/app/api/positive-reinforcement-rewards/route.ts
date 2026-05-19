// ==============================================================================
// API: /api/positive-reinforcement-rewards
//
// Positive Reinforcement & Rewards Intelligence
//
// GET  — Returns positive reinforcement assessment with Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generatePositiveReinforcementRewardsIntelligence,
  getPraiseTypeLabel,
  getRewardCategoryLabel,
  getBehaviourTrendLabel,
  getChildResponseLabel,
  getRatingLabel,
} from "@/lib/positive-reinforcement-rewards";
import type {
  PraiseRecord,
  RewardRecord,
  BehaviourOutcome,
  StaffReinforcementTraining,
} from "@/lib/positive-reinforcement-rewards";

// -- Demo Data: Oak House -------------------------------------------------------

const DEMO_PRAISE: PraiseRecord[] = [
  { id: "pr-1", childId: "child-alex", childName: "Alex", praiseDate: "2026-04-01", praiseType: "verbal", givenBy: "Sarah Johnson", reason: "Helped Jordan with homework without being asked", childResponse: "positive", specificAndDescriptive: true, linkedToValues: true },
  { id: "pr-2", childId: "child-alex", childName: "Alex", praiseDate: "2026-04-05", praiseType: "written", givenBy: "Tom Richards", reason: "Completed all chores independently this week", childResponse: "very_positive", specificAndDescriptive: true, linkedToValues: true },
  { id: "pr-3", childId: "child-alex", childName: "Alex", praiseDate: "2026-04-12", praiseType: "certificate", givenBy: "Darren Laville", reason: "Star of the Week for consistent effort in education", childResponse: "very_positive", specificAndDescriptive: true, linkedToValues: true },
  { id: "pr-4", childId: "child-jordan", childName: "Jordan", praiseDate: "2026-04-02", praiseType: "verbal", givenBy: "Lisa Williams", reason: "Used calm breathing when feeling frustrated", childResponse: "positive", specificAndDescriptive: true, linkedToValues: true },
  { id: "pr-5", childId: "child-jordan", childName: "Jordan", praiseDate: "2026-04-08", praiseType: "reward_token", givenBy: "Sarah Johnson", reason: "Earned 5 tokens for respectful communication all week", childResponse: "very_positive", specificAndDescriptive: true, linkedToValues: true },
  { id: "pr-6", childId: "child-jordan", childName: "Jordan", praiseDate: "2026-04-15", praiseType: "public_recognition", givenBy: "Darren Laville", reason: "Recognised in house meeting for being a great friend", childResponse: "positive", specificAndDescriptive: true, linkedToValues: true },
  { id: "pr-7", childId: "child-morgan", childName: "Morgan", praiseDate: "2026-04-03", praiseType: "verbal", givenBy: "Tom Richards", reason: "Cooked dinner for everyone and tidied up", childResponse: "positive", specificAndDescriptive: true, linkedToValues: true },
  { id: "pr-8", childId: "child-morgan", childName: "Morgan", praiseDate: "2026-04-10", praiseType: "activity_reward", givenBy: "Lisa Williams", reason: "Earned cinema trip for meeting weekly targets", childResponse: "very_positive", specificAndDescriptive: true, linkedToValues: true },
  { id: "pr-9", childId: "child-morgan", childName: "Morgan", praiseDate: "2026-04-18", praiseType: "special_privilege", givenBy: "Sarah Johnson", reason: "Extended bedtime for consistent positive behaviour", childResponse: "very_positive", specificAndDescriptive: true, linkedToValues: true },
];

const DEMO_REWARDS: RewardRecord[] = [
  { id: "rw-1", childId: "child-alex", childName: "Alex", rewardDate: "2026-04-05", rewardCategory: "weekly_target", description: "Chose pizza night for meeting all weekly targets", childChosenReward: true, fairAndConsistent: true, linkedToBehaviourPlan: true, childResponse: "very_positive" },
  { id: "rw-2", childId: "child-alex", childName: "Alex", rewardDate: "2026-04-12", rewardCategory: "achievement", description: "New book voucher for school attendance achievement", childChosenReward: true, fairAndConsistent: true, linkedToBehaviourPlan: true, childResponse: "very_positive" },
  { id: "rw-3", childId: "child-jordan", childName: "Jordan", rewardDate: "2026-04-08", rewardCategory: "effort", description: "Extra screen time for effort in managing emotions", childChosenReward: true, fairAndConsistent: true, linkedToBehaviourPlan: true, childResponse: "positive" },
  { id: "rw-4", childId: "child-jordan", childName: "Jordan", rewardDate: "2026-04-15", rewardCategory: "kindness", description: "Chose team bowling trip for being kind to peers", childChosenReward: true, fairAndConsistent: true, linkedToBehaviourPlan: true, childResponse: "very_positive" },
  { id: "rw-5", childId: "child-morgan", childName: "Morgan", rewardDate: "2026-04-10", rewardCategory: "responsibility", description: "Cinema trip for consistent room tidying", childChosenReward: true, fairAndConsistent: true, linkedToBehaviourPlan: true, childResponse: "very_positive" },
  { id: "rw-6", childId: "child-morgan", childName: "Morgan", rewardDate: "2026-04-18", rewardCategory: "progress", description: "New art supplies for sustained progress in key working sessions", childChosenReward: true, fairAndConsistent: true, linkedToBehaviourPlan: true, childResponse: "very_positive" },
];

const DEMO_OUTCOMES: BehaviourOutcome[] = [
  { id: "bo-1", childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-15", behaviourTrend: "improved", positiveIncidentsCount: 12, negativeIncidentsCount: 1, restraintCount: 0, deEscalationSuccessful: true, childReportedFeeling: "positive" },
  { id: "bo-2", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-04-15", behaviourTrend: "significantly_improved", positiveIncidentsCount: 15, negativeIncidentsCount: 2, restraintCount: 0, deEscalationSuccessful: true, childReportedFeeling: "very_positive" },
  { id: "bo-3", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-04-15", behaviourTrend: "improved", positiveIncidentsCount: 10, negativeIncidentsCount: 0, restraintCount: 0, deEscalationSuccessful: true, childReportedFeeling: "positive" },
];

const DEMO_TRAINING: StaffReinforcementTraining[] = [
  { id: "st-1", staffId: "staff-sarah", staffName: "Sarah Johnson", positiveBehaviourSupport: true, therapeuticCareApproach: true, deEscalationTechniques: true, rewardSystemDesign: true, traumaInformedPraise: true, consistencyInApproach: true },
  { id: "st-2", staffId: "staff-tom", staffName: "Tom Richards", positiveBehaviourSupport: true, therapeuticCareApproach: true, deEscalationTechniques: true, rewardSystemDesign: true, traumaInformedPraise: true, consistencyInApproach: true },
  { id: "st-3", staffId: "staff-lisa", staffName: "Lisa Williams", positiveBehaviourSupport: true, therapeuticCareApproach: true, deEscalationTechniques: true, rewardSystemDesign: true, traumaInformedPraise: true, consistencyInApproach: true },
  { id: "st-4", staffId: "staff-darren", staffName: "Darren Laville", positiveBehaviourSupport: true, therapeuticCareApproach: true, deEscalationTechniques: true, rewardSystemDesign: true, traumaInformedPraise: true, consistencyInApproach: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generatePositiveReinforcementRewardsIntelligence(
    DEMO_PRAISE,
    DEMO_REWARDS,
    DEMO_OUTCOMES,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        praiseTypeLabels: Object.fromEntries(
          (["verbal", "written", "public_recognition", "reward_token", "special_privilege", "activity_reward", "certificate", "other"] as const).map(
            (t) => [t, getPraiseTypeLabel(t)],
          ),
        ),
        rewardCategoryLabels: Object.fromEntries(
          (["daily_behaviour", "weekly_target", "achievement", "effort", "kindness", "responsibility", "progress", "other"] as const).map(
            (c) => [c, getRewardCategoryLabel(c)],
          ),
        ),
        behaviourTrendLabels: Object.fromEntries(
          (["significantly_improved", "improved", "stable", "declined", "significantly_declined"] as const).map(
            (t) => [t, getBehaviourTrendLabel(t)],
          ),
        ),
        childResponseLabels: Object.fromEntries(
          (["very_positive", "positive", "neutral", "negative", "not_recorded"] as const).map(
            (r) => [r, getChildResponseLabel(r)],
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

  const { praise, rewards, outcomes, training, homeId, periodStart, periodEnd } = body as {
    praise?: PraiseRecord[];
    rewards?: RewardRecord[];
    outcomes?: BehaviourOutcome[];
    training?: StaffReinforcementTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generatePositiveReinforcementRewardsIntelligence(
    praise ?? [],
    rewards ?? [],
    outcomes ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
