import { NextResponse } from "next/server";
import { generateAriaLearningIntelligence } from "@/lib/aria-learning";
import type {
  AriaLearningRecord,
  AriaLearningPolicy,
  StaffAriaLearningTraining,
} from "@/lib/aria-learning";

// ── Demo Data ─────────────────────────────────────────────────────────────

const DEMO_RECORDS: AriaLearningRecord[] = [
  // Alex — task completion, cost analysis, capability assessment
  { id: "al-001", homeId: "home-oak", date: "2026-01-15", childId: "child-alex", childName: "Alex", category: "agent_task_completion", outcome: "meets_target", taskCompletedAccurately: true, costEfficiencyMaintained: true, learningDocumented: true, qualityAssurancePassed: true, documentationComplete: true, timelyRecording: true },
  { id: "al-002", homeId: "home-oak", date: "2026-02-10", childId: "child-alex", childName: "Alex", category: "cost_reduction_analysis", outcome: "exceeds_target", taskCompletedAccurately: true, costEfficiencyMaintained: true, learningDocumented: true, qualityAssurancePassed: true, documentationComplete: true, timelyRecording: true },
  { id: "al-003", homeId: "home-oak", date: "2026-03-05", childId: "child-alex", childName: "Alex", category: "agent_capability_assessment", outcome: "meets_target", taskCompletedAccurately: true, costEfficiencyMaintained: true, learningDocumented: true, qualityAssurancePassed: true, documentationComplete: true, timelyRecording: true },
  { id: "al-004", homeId: "home-oak", date: "2026-04-01", childId: "child-alex", childName: "Alex", category: "performance_benchmark", outcome: "meets_target", taskCompletedAccurately: true, costEfficiencyMaintained: true, learningDocumented: true, qualityAssurancePassed: true, documentationComplete: true, timelyRecording: true },

  // Jordan — learning patterns, knowledge base, resolution tier
  { id: "al-005", homeId: "home-oak", date: "2026-01-20", childId: "child-jordan", childName: "Jordan", category: "learning_pattern_identification", outcome: "meets_target", taskCompletedAccurately: true, costEfficiencyMaintained: true, learningDocumented: true, qualityAssurancePassed: true, documentationComplete: true, timelyRecording: true },
  { id: "al-006", homeId: "home-oak", date: "2026-02-15", childId: "child-jordan", childName: "Jordan", category: "knowledge_base_update", outcome: "approaching_target", taskCompletedAccurately: true, costEfficiencyMaintained: true, learningDocumented: true, qualityAssurancePassed: true, documentationComplete: true, timelyRecording: true },
  { id: "al-007", homeId: "home-oak", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "resolution_tier_evaluation", outcome: "meets_target", taskCompletedAccurately: true, costEfficiencyMaintained: true, learningDocumented: true, qualityAssurancePassed: true, documentationComplete: true, timelyRecording: false },
  { id: "al-008", homeId: "home-oak", date: "2026-04-10", childId: "child-jordan", childName: "Jordan", category: "replacement_readiness_review", outcome: "meets_target", taskCompletedAccurately: true, costEfficiencyMaintained: true, learningDocumented: true, qualityAssurancePassed: true, documentationComplete: true, timelyRecording: true },

  // Morgan — mixed categories
  { id: "al-009", homeId: "home-oak", date: "2026-02-01", childId: "child-morgan", childName: "Morgan", category: "agent_task_completion", outcome: "meets_target", taskCompletedAccurately: true, costEfficiencyMaintained: true, learningDocumented: true, qualityAssurancePassed: true, documentationComplete: true, timelyRecording: true },
  { id: "al-010", homeId: "home-oak", date: "2026-03-15", childId: "child-morgan", childName: "Morgan", category: "cost_reduction_analysis", outcome: "meets_target", taskCompletedAccurately: true, costEfficiencyMaintained: true, learningDocumented: true, qualityAssurancePassed: true, documentationComplete: true, timelyRecording: true },
  { id: "al-011", homeId: "home-oak", date: "2026-04-10", childId: "child-morgan", childName: "Morgan", category: "learning_pattern_identification", outcome: "approaching_target", taskCompletedAccurately: false, costEfficiencyMaintained: true, learningDocumented: true, qualityAssurancePassed: true, documentationComplete: true, timelyRecording: true },
  { id: "al-012", homeId: "home-oak", date: "2026-05-01", childId: "child-morgan", childName: "Morgan", category: "knowledge_base_update", outcome: "meets_target", taskCompletedAccurately: true, costEfficiencyMaintained: false, learningDocumented: true, qualityAssurancePassed: true, documentationComplete: false, timelyRecording: true },
];

const DEMO_POLICY: AriaLearningPolicy = {
  agentLearningPolicy: true,
  costReductionFramework: true,
  qualityAssurancePolicy: true,
  dataProtectionForAgents: true,
  performanceBenchmarkingPolicy: true,
  humanOversightPolicy: true,
  agentCapabilityReviewPolicy: true,
};

const DEMO_STAFF: StaffAriaLearningTraining[] = [
  { staffId: "staff-sarah", agentManagementKnowledge: true, costAnalysisSkills: true, qualityAssuranceSkills: true, dataInterpretationSkills: true, performanceMonitoringSkills: true, humanOversightCapability: true },
  { staffId: "staff-tom", agentManagementKnowledge: true, costAnalysisSkills: true, qualityAssuranceSkills: true, dataInterpretationSkills: true, performanceMonitoringSkills: true, humanOversightCapability: false },
  { staffId: "staff-lisa", agentManagementKnowledge: true, costAnalysisSkills: true, qualityAssuranceSkills: true, dataInterpretationSkills: true, performanceMonitoringSkills: false, humanOversightCapability: true },
  { staffId: "staff-darren", agentManagementKnowledge: true, costAnalysisSkills: true, qualityAssuranceSkills: true, dataInterpretationSkills: true, performanceMonitoringSkills: true, humanOversightCapability: true },
];

// ── Handler ───────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateAriaLearningIntelligence({
    homeId: "home-oak",
    periodStart: "2026-01-01",
    periodEnd: "2026-05-21",
    records: DEMO_RECORDS,
    policy: DEMO_POLICY,
    staff: DEMO_STAFF,
  });

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "aria-learning-intelligence",
        version: "2.0.0",
      },
    },
  });
}
