import { NextResponse } from "next/server";
import { generateRegSelfAssessmentIntelligence } from "@/lib/regulatory-self-assessment";
import type { RegSelfAssessmentRecord, RegSelfAssessmentPolicy, StaffRegSelfAssessmentTraining } from "@/lib/regulatory-self-assessment";

const DEMO_RECORDS: RegSelfAssessmentRecord[] = [
  { id: "rsa-001", homeId: "home-oak", date: "2026-01-10", childId: "child-alex", childName: "Alex", category: "regulation_area_review", outcome: "outstanding_evidence", evidenceRobust: true, selfAssessmentAccurate: true, actionPlanAligned: true, improvementEvidenced: true, documentationComplete: true, timelyRecording: true },
  { id: "rsa-002", homeId: "home-oak", date: "2026-02-05", childId: "child-alex", childName: "Alex", category: "evidence_gathering", outcome: "good_evidence", evidenceRobust: true, selfAssessmentAccurate: true, actionPlanAligned: true, improvementEvidenced: true, documentationComplete: true, timelyRecording: true },
  { id: "rsa-003", homeId: "home-oak", date: "2026-03-12", childId: "child-alex", childName: "Alex", category: "action_plan_tracking", outcome: "outstanding_evidence", evidenceRobust: true, selfAssessmentAccurate: true, actionPlanAligned: true, improvementEvidenced: true, documentationComplete: true, timelyRecording: true },
  { id: "rsa-004", homeId: "home-oak", date: "2026-04-01", childId: "child-alex", childName: "Alex", category: "improvement_monitoring", outcome: "good_evidence", evidenceRobust: true, selfAssessmentAccurate: true, actionPlanAligned: true, improvementEvidenced: true, documentationComplete: true, timelyRecording: true },
  { id: "rsa-005", homeId: "home-oak", date: "2026-01-20", childId: "child-jordan", childName: "Jordan", category: "external_feedback_integration", outcome: "outstanding_evidence", evidenceRobust: true, selfAssessmentAccurate: true, actionPlanAligned: true, improvementEvidenced: true, documentationComplete: true, timelyRecording: true },
  { id: "rsa-006", homeId: "home-oak", date: "2026-02-15", childId: "child-jordan", childName: "Jordan", category: "compliance_gap_analysis", outcome: "good_evidence", evidenceRobust: true, selfAssessmentAccurate: true, actionPlanAligned: true, improvementEvidenced: true, documentationComplete: true, timelyRecording: true },
  { id: "rsa-007", homeId: "home-oak", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "self_assessment_report", outcome: "partial_evidence", evidenceRobust: false, selfAssessmentAccurate: true, actionPlanAligned: true, improvementEvidenced: true, documentationComplete: true, timelyRecording: false },
  { id: "rsa-008", homeId: "home-oak", date: "2026-04-10", childId: "child-jordan", childName: "Jordan", category: "inspection_preparation", outcome: "outstanding_evidence", evidenceRobust: true, selfAssessmentAccurate: true, actionPlanAligned: true, improvementEvidenced: true, documentationComplete: true, timelyRecording: true },
  { id: "rsa-009", homeId: "home-oak", date: "2026-02-01", childId: "child-morgan", childName: "Morgan", category: "regulation_area_review", outcome: "good_evidence", evidenceRobust: true, selfAssessmentAccurate: true, actionPlanAligned: true, improvementEvidenced: true, documentationComplete: true, timelyRecording: true },
  { id: "rsa-010", homeId: "home-oak", date: "2026-03-15", childId: "child-morgan", childName: "Morgan", category: "evidence_gathering", outcome: "outstanding_evidence", evidenceRobust: true, selfAssessmentAccurate: true, actionPlanAligned: true, improvementEvidenced: true, documentationComplete: true, timelyRecording: true },
  { id: "rsa-011", homeId: "home-oak", date: "2026-04-10", childId: "child-morgan", childName: "Morgan", category: "action_plan_tracking", outcome: "good_evidence", evidenceRobust: true, selfAssessmentAccurate: true, actionPlanAligned: true, improvementEvidenced: false, documentationComplete: false, timelyRecording: true },
  { id: "rsa-012", homeId: "home-oak", date: "2026-05-01", childId: "child-morgan", childName: "Morgan", category: "compliance_gap_analysis", outcome: "partial_evidence", evidenceRobust: true, selfAssessmentAccurate: false, actionPlanAligned: true, improvementEvidenced: true, documentationComplete: true, timelyRecording: true },
];

const DEMO_POLICY: RegSelfAssessmentPolicy = {
  selfAssessmentPolicy: true, evidenceGatheringPolicy: true, actionPlanPolicy: true,
  improvementMonitoringPolicy: true, externalFeedbackPolicy: true, inspectionPreparationPolicy: true, complianceReviewSchedule: true,
};

const DEMO_STAFF: StaffRegSelfAssessmentTraining[] = [
  { staffId: "staff-sarah", selfAssessmentKnowledge: true, evidenceGatheringSkills: true, actionPlanningSkills: true, regulatoryFrameworkKnowledge: true, inspectionPreparationSkills: true, qualityImprovementSkills: true },
  { staffId: "staff-tom", selfAssessmentKnowledge: true, evidenceGatheringSkills: true, actionPlanningSkills: true, regulatoryFrameworkKnowledge: true, inspectionPreparationSkills: true, qualityImprovementSkills: false },
  { staffId: "staff-lisa", selfAssessmentKnowledge: true, evidenceGatheringSkills: true, actionPlanningSkills: true, regulatoryFrameworkKnowledge: true, inspectionPreparationSkills: false, qualityImprovementSkills: true },
  { staffId: "staff-darren", selfAssessmentKnowledge: true, evidenceGatheringSkills: true, actionPlanningSkills: true, regulatoryFrameworkKnowledge: true, inspectionPreparationSkills: true, qualityImprovementSkills: true },
];

export async function GET() {
  const result = generateRegSelfAssessmentIntelligence({
    homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-21",
    records: DEMO_RECORDS, policy: DEMO_POLICY, staff: DEMO_STAFF,
  });
  return NextResponse.json({ data: { ...result, meta: { generatedAt: new Date().toISOString(), engine: "regulatory-self-assessment-intelligence", version: "2.0.0" } } });
}
