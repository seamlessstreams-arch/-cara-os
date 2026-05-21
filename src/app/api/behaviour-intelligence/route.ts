import { NextResponse } from "next/server";
import {
  generateBehaviourIntelligenceReport,
  type BehaviourIntelligenceRecord,
  type BehaviourIntelligencePolicy,
  type StaffBehaviourIntelligenceTraining,
} from "@/lib/behaviour/behaviour-intelligence-engine";

// ── Oak House demo data ───────────────────────────────────────────────────

const DEMO_RECORDS: BehaviourIntelligenceRecord[] = [
  { id: "bi-001", homeId: "home-oak-house", date: "2025-02-10", childId: "child-alex", childName: "Alex", category: "positive_reinforcement", outcome: "behaviour_improved", childViewIncluded: true, deEscalationAttempted: true, positiveReinforcementUsed: true, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },
  { id: "bi-002", homeId: "home-oak-house", date: "2025-03-05", childId: "child-alex", childName: "Alex", category: "de_escalation", outcome: "behaviour_improved", childViewIncluded: true, deEscalationAttempted: true, positiveReinforcementUsed: true, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },
  { id: "bi-003", homeId: "home-oak-house", date: "2025-04-12", childId: "child-alex", childName: "Alex", category: "behaviour_support_plan", outcome: "behaviour_maintained", childViewIncluded: true, deEscalationAttempted: true, positiveReinforcementUsed: false, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },
  { id: "bi-004", homeId: "home-oak-house", date: "2025-05-20", childId: "child-alex", childName: "Alex", category: "restorative_practice", outcome: "behaviour_improved", childViewIncluded: true, deEscalationAttempted: true, positiveReinforcementUsed: true, supportPlanFollowed: true, documentationComplete: true, timelyRecording: false },
  { id: "bi-005", homeId: "home-oak-house", date: "2025-02-18", childId: "child-jordan", childName: "Jordan", category: "physical_intervention", outcome: "partial_improvement", childViewIncluded: true, deEscalationAttempted: true, positiveReinforcementUsed: true, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },
  { id: "bi-006", homeId: "home-oak-house", date: "2025-03-22", childId: "child-jordan", childName: "Jordan", category: "sanctions_review", outcome: "behaviour_maintained", childViewIncluded: true, deEscalationAttempted: false, positiveReinforcementUsed: false, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },
  { id: "bi-007", homeId: "home-oak-house", date: "2025-05-10", childId: "child-jordan", childName: "Jordan", category: "reward_system", outcome: "behaviour_improved", childViewIncluded: true, deEscalationAttempted: true, positiveReinforcementUsed: true, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },
  { id: "bi-008", homeId: "home-oak-house", date: "2025-06-15", childId: "child-jordan", childName: "Jordan", category: "behaviour_analysis", outcome: "partial_improvement", childViewIncluded: false, deEscalationAttempted: true, positiveReinforcementUsed: false, supportPlanFollowed: true, documentationComplete: false, timelyRecording: true },
  { id: "bi-009", homeId: "home-oak-house", date: "2025-03-01", childId: "child-morgan", childName: "Morgan", category: "positive_reinforcement", outcome: "behaviour_improved", childViewIncluded: true, deEscalationAttempted: true, positiveReinforcementUsed: true, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },
  { id: "bi-010", homeId: "home-oak-house", date: "2025-04-28", childId: "child-morgan", childName: "Morgan", category: "de_escalation", outcome: "behaviour_improved", childViewIncluded: true, deEscalationAttempted: true, positiveReinforcementUsed: true, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },
  { id: "bi-011", homeId: "home-oak-house", date: "2025-06-01", childId: "child-morgan", childName: "Morgan", category: "behaviour_support_plan", outcome: "behaviour_maintained", childViewIncluded: true, deEscalationAttempted: true, positiveReinforcementUsed: true, supportPlanFollowed: false, documentationComplete: true, timelyRecording: true },
  { id: "bi-012", homeId: "home-oak-house", date: "2025-07-10", childId: "child-morgan", childName: "Morgan", category: "restorative_practice", outcome: "behaviour_improved", childViewIncluded: true, deEscalationAttempted: true, positiveReinforcementUsed: true, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },
];

const DEMO_POLICY: BehaviourIntelligencePolicy = {
  behaviourSupportPolicy: true,
  physicalInterventionPolicy: true,
  restorativePracticePolicy: true,
  deEscalationFramework: true,
  rewardAndSanctionsPolicy: true,
  behaviourAnalysisPolicy: true,
  postIncidentLearningPolicy: true,
};

const DEMO_STAFF: StaffBehaviourIntelligenceTraining[] = [
  { staffId: "staff-sarah", behaviourManagementKnowledge: true, deEscalationSkills: true, restorativePracticeSkills: true, physicalInterventionTraining: true, traumaInformedApproach: true, behaviourAnalysisSkills: true },
  { staffId: "staff-tom", behaviourManagementKnowledge: true, deEscalationSkills: true, restorativePracticeSkills: true, physicalInterventionTraining: true, traumaInformedApproach: false, behaviourAnalysisSkills: true },
  { staffId: "staff-lisa", behaviourManagementKnowledge: true, deEscalationSkills: true, restorativePracticeSkills: true, physicalInterventionTraining: false, traumaInformedApproach: true, behaviourAnalysisSkills: false },
  { staffId: "staff-darren", behaviourManagementKnowledge: true, deEscalationSkills: true, restorativePracticeSkills: true, physicalInterventionTraining: true, traumaInformedApproach: true, behaviourAnalysisSkills: true },
];

export async function GET() {
  const result = generateBehaviourIntelligenceReport({
    homeId: "home-oak-house",
    periodStart: "2025-01-01",
    periodEnd: "2025-12-31",
    records: DEMO_RECORDS,
    policy: DEMO_POLICY,
    staff: DEMO_STAFF,
  });

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "behaviour-intelligence-engine",
        version: "1.0.0",
      },
    },
  });
}
