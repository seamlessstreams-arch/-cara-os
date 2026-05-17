// ══════════════════════════════════════════════════════════════════════════════
// Sanctions & Rewards — API Route
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateChildSanctionCompliance,
  calculateHomeSanctionsMetrics,
} from "@/lib/sanctions";
import type { ChildBehaviourProfile, SanctionRecord, RewardRecord } from "@/lib/sanctions";

// ── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_SANCTIONS: SanctionRecord[] = [
  {
    id: "sanc-001",
    homeId: "home-oak",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-10T14:00:00Z",
    type: "loss_of_privilege",
    description: "No gaming for evening due to aggressive behaviour towards Casey",
    reason: "Physical aggression — pushed Casey during argument over TV remote",
    behaviour: "aggression",
    duration: "remainder of evening",
    status: "completed",
    childInformed: true,
    childView: "I think its unfair but I understand why. Casey was annoying me though.",
    childAgreed: false,
    deEscalationAttempted: true,
    deEscalationMethods: ["verbal redirection", "offered cool-down time", "offered alternative activity"],
    proportionality: "proportionate",
    linkedToBehaviour: true,
    recordedBy: "staff-jb-01",
    reviewedByManager: true,
    managerNotes: "Appropriate response. De-escalation well attempted. Discussed with Alex in keywork.",
    isProhibited: false,
    timeOfDay: "evening",
    witnesses: ["staff-kl-02"],
    parentCarerInformed: false,
    socialWorkerInformed: false,
  },
  {
    id: "sanc-002",
    homeId: "home-oak",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-05T16:00:00Z",
    type: "reduced_screen_time",
    description: "Screen time reduced by 1 hour for refusing to do homework",
    reason: "Persistent refusal to engage with homework despite multiple prompts",
    behaviour: "defiance",
    duration: "1 hour",
    status: "completed",
    childInformed: true,
    childView: "I hate homework. Its stupid.",
    childAgreed: false,
    deEscalationAttempted: true,
    deEscalationMethods: ["verbal encouragement", "offered help with homework", "offered break first"],
    proportionality: "proportionate",
    linkedToBehaviour: true,
    recordedBy: "staff-kl-02",
    reviewedByManager: true,
    managerNotes: "Proportionate. Consider whether homework expectations are realistic for Alex.",
    isProhibited: false,
    timeOfDay: "afternoon",
    witnesses: [],
    parentCarerInformed: false,
    socialWorkerInformed: false,
  },
  {
    id: "sanc-003",
    homeId: "home-oak",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-14T20:00:00Z",
    type: "early_bedtime",
    description: "30 minutes early bedtime after repeated swearing at staff",
    reason: "Persistent verbal abuse towards staff member despite warnings",
    behaviour: "verbal_abuse",
    duration: "30 minutes early",
    status: "completed",
    childInformed: true,
    childView: "Whatever. I dont care.",
    childAgreed: false,
    deEscalationAttempted: true,
    deEscalationMethods: ["verbal warning", "offered quiet space", "reminder of expectations"],
    proportionality: "proportionate",
    linkedToBehaviour: true,
    recordedBy: "staff-jb-01",
    reviewedByManager: true,
    managerNotes: "Appropriate. Jordan was tired — consider whether late nights are contributing.",
    isProhibited: false,
    timeOfDay: "evening",
    witnesses: ["staff-kl-02"],
    parentCarerInformed: false,
    socialWorkerInformed: false,
  },
  {
    id: "sanc-004",
    homeId: "home-oak",
    childId: "child-sam",
    childName: "Sam",
    date: "2026-05-12T15:00:00Z",
    type: "reparation",
    description: "Sam to help clean up mess made in living room",
    reason: "Deliberately threw food during tea time",
    behaviour: "property_damage",
    duration: "15 minutes",
    status: "completed",
    childInformed: true,
    childView: "I was angry. I will clean it up.",
    childAgreed: true,
    deEscalationAttempted: true,
    deEscalationMethods: ["verbal prompt", "reminder of house rules"],
    proportionality: "proportionate",
    linkedToBehaviour: true,
    recordedBy: "staff-rm-01",
    reviewedByManager: true,
    managerNotes: "Good restorative approach. Sam engaged well with cleaning up.",
    isProhibited: false,
    timeOfDay: "afternoon",
    witnesses: ["staff-jb-01"],
    parentCarerInformed: false,
    socialWorkerInformed: false,
  },
];

const DEMO_REWARDS: RewardRecord[] = [
  { id: "rew-001", homeId: "home-oak", childId: "child-alex", childName: "Alex", date: "2026-05-16T09:00:00Z", type: "verbal_praise", description: "Great morning routine — up and ready on time", reason: "Positive routine", awardedBy: "staff-jb-01" },
  { id: "rew-002", homeId: "home-oak", childId: "child-alex", childName: "Alex", date: "2026-05-14T15:00:00Z", type: "activity_reward", description: "Extra 30 mins gaming for completing all homework this week", reason: "Consistent homework effort", awardedBy: "staff-kl-02" },
  { id: "rew-003", homeId: "home-oak", childId: "child-alex", childName: "Alex", date: "2026-05-12T10:00:00Z", type: "verbal_praise", description: "Well done helping Casey with maths homework", reason: "Kindness and helpfulness", awardedBy: "staff-jb-01" },
  { id: "rew-004", homeId: "home-oak", childId: "child-alex", childName: "Alex", date: "2026-05-09T17:00:00Z", type: "points_token", description: "5 points for managing anger well when frustrated", reason: "Emotional regulation", awardedBy: "staff-rm-01" },
  { id: "rew-005", homeId: "home-oak", childId: "child-alex", childName: "Alex", date: "2026-05-07T09:00:00Z", type: "verbal_praise", description: "Excellent behaviour at school all week", reason: "School achievement", awardedBy: "staff-jb-01" },

  { id: "rew-006", homeId: "home-oak", childId: "child-jordan", childName: "Jordan", date: "2026-05-16T10:00:00Z", type: "extra_privilege", description: "Later bedtime on Friday for good week", reason: "Consistent positive behaviour", awardedBy: "staff-rm-01" },
  { id: "rew-007", homeId: "home-oak", childId: "child-jordan", childName: "Jordan", date: "2026-05-13T14:00:00Z", type: "verbal_praise", description: "Brilliant effort in cooking dinner", reason: "Life skills engagement", awardedBy: "staff-kl-02" },
  { id: "rew-008", homeId: "home-oak", childId: "child-jordan", childName: "Jordan", date: "2026-05-10T09:00:00Z", type: "certificate", description: "Star of the week for helping new child settle in", reason: "Empathy and welcome", awardedBy: "staff-rm-01" },

  { id: "rew-009", homeId: "home-oak", childId: "child-sam", childName: "Sam", date: "2026-05-15T16:00:00Z", type: "special_outing", description: "Trip to cinema for 2 weeks incident-free", reason: "Sustained positive behaviour", awardedBy: "staff-rm-01" },
  { id: "rew-010", homeId: "home-oak", childId: "child-sam", childName: "Sam", date: "2026-05-11T10:00:00Z", type: "verbal_praise", description: "Used words instead of actions when frustrated", reason: "Emotional regulation progress", awardedBy: "staff-jb-01" },
  { id: "rew-011", homeId: "home-oak", childId: "child-sam", childName: "Sam", date: "2026-05-08T09:00:00Z", type: "points_token", description: "10 points for completing morning routine independently all week", reason: "Independence", awardedBy: "staff-kl-02" },

  { id: "rew-012", homeId: "home-oak", childId: "child-casey", childName: "Casey", date: "2026-05-16T14:00:00Z", type: "verbal_praise", description: "Amazing artwork — displayed in living room", reason: "Creative expression", awardedBy: "staff-jb-01" },
  { id: "rew-013", homeId: "home-oak", childId: "child-casey", childName: "Casey", date: "2026-05-13T10:00:00Z", type: "activity_reward", description: "Choice of Friday night film for being helpful all week", reason: "Helpfulness", awardedBy: "staff-rm-01" },
  { id: "rew-014", homeId: "home-oak", childId: "child-casey", childName: "Casey", date: "2026-05-09T09:00:00Z", type: "pocket_money_bonus", description: "£2 bonus for exceptional effort at school", reason: "Academic achievement", awardedBy: "staff-rm-01" },
];

const DEMO_PROFILES: ChildBehaviourProfile[] = [
  {
    childId: "child-alex",
    childName: "Alex",
    homeId: "home-oak",
    sanctions: DEMO_SANCTIONS.filter(s => s.childId === "child-alex"),
    rewards: DEMO_REWARDS.filter(r => r.childId === "child-alex"),
    behaviourPlanInPlace: true,
    behaviourPlanReviewDate: "2026-07-01T00:00:00Z",
    positiveHandlingPlanExists: true,
    keyBehaviourTargets: ["Manage anger without aggression", "Use words to express frustration", "Complete homework with support"],
  },
  {
    childId: "child-jordan",
    childName: "Jordan",
    homeId: "home-oak",
    sanctions: DEMO_SANCTIONS.filter(s => s.childId === "child-jordan"),
    rewards: DEMO_REWARDS.filter(r => r.childId === "child-jordan"),
    behaviourPlanInPlace: true,
    behaviourPlanReviewDate: "2026-06-15T00:00:00Z",
    positiveHandlingPlanExists: false,
    keyBehaviourTargets: ["Reduce swearing", "Manage frustration with staff", "Maintain positive bedtime routine"],
  },
  {
    childId: "child-sam",
    childName: "Sam",
    homeId: "home-oak",
    sanctions: DEMO_SANCTIONS.filter(s => s.childId === "child-sam"),
    rewards: DEMO_REWARDS.filter(r => r.childId === "child-sam"),
    behaviourPlanInPlace: true,
    behaviourPlanReviewDate: "2026-08-01T00:00:00Z",
    positiveHandlingPlanExists: true,
    keyBehaviourTargets: ["Express anger verbally not physically", "Engage with mealtimes positively"],
  },
  {
    childId: "child-casey",
    childName: "Casey",
    homeId: "home-oak",
    sanctions: DEMO_SANCTIONS.filter(s => s.childId === "child-casey"),
    rewards: DEMO_REWARDS.filter(r => r.childId === "child-casey"),
    behaviourPlanInPlace: false,
    positiveHandlingPlanExists: false,
    keyBehaviourTargets: [],
  },
];

// ── Handler ───────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") || "home-oak";
  const mode = searchParams.get("mode") || "dashboard";
  const childId = searchParams.get("childId");
  const now = new Date().toISOString();

  if (mode === "child" && childId) {
    const profile = DEMO_PROFILES.find(p => p.childId === childId && p.homeId === homeId);
    if (!profile) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }
    const result = evaluateChildSanctionCompliance(profile, now);
    return NextResponse.json(result);
  }

  if (mode === "metrics") {
    const metrics = calculateHomeSanctionsMetrics(DEMO_PROFILES, homeId, now);
    return NextResponse.json(metrics);
  }

  // Dashboard mode
  const metrics = calculateHomeSanctionsMetrics(DEMO_PROFILES, homeId, now);
  const childSummaries = DEMO_PROFILES
    .filter(p => p.homeId === homeId)
    .map(p => {
      const result = evaluateChildSanctionCompliance(p, now);
      return {
        childId: p.childId,
        childName: p.childName,
        totalSanctions30Days: result.totalSanctions30Days,
        totalRewards30Days: result.totalRewards30Days,
        rewardToSanctionRatio: result.rewardToSanctionRatio,
        isCompliant: result.isCompliant,
        escalatingPattern: result.escalatingPattern,
        behaviourPlanInPlace: p.behaviourPlanInPlace,
        issues: result.issues.length,
        warnings: result.warnings.length,
      };
    });

  const recentSanctions = DEMO_SANCTIONS
    .filter(s => s.homeId === homeId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(s => ({
      id: s.id,
      childName: s.childName,
      date: s.date,
      type: s.type,
      behaviour: s.behaviour,
      proportionality: s.proportionality,
      deEscalationAttempted: s.deEscalationAttempted,
      reviewedByManager: s.reviewedByManager,
    }));

  return NextResponse.json({
    metrics: {
      totalSanctions30Days: metrics.totalSanctions30Days,
      totalRewards30Days: metrics.totalRewards30Days,
      rewardToSanctionRatio: metrics.rewardToSanctionRatio,
      overallComplianceRate: metrics.overallComplianceRate,
      prohibitedPunishmentCount: metrics.prohibitedPunishmentCount,
      childViewRecordedRate: metrics.childViewRecordedRate,
      deEscalationAttemptRate: metrics.deEscalationAttemptRate,
      proportionalityRate: metrics.proportionalityRate,
      managerReviewRate: metrics.managerReviewRate,
      trendDirection: metrics.trendDirection,
      averageSanctionsPerMonth: metrics.averageSanctionsPerMonth,
    },
    children: childSummaries,
    recentSanctions,
    topBehaviours: metrics.topBehaviours,
    complianceIssues: metrics.complianceIssues,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, profile, profiles, homeId, now } = body;

  if (action === "evaluate" && profile) {
    const result = evaluateChildSanctionCompliance(profile, now);
    return NextResponse.json(result);
  }

  if (action === "metrics" && profiles) {
    const result = calculateHomeSanctionsMetrics(profiles, homeId || "home-oak", now);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
