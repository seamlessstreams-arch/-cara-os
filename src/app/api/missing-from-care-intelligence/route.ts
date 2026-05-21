import { NextResponse } from "next/server";
import { generateMissingFromCareIntelligenceResult } from "@/lib/missing-from-care/missing-from-care-intelligence-engine";
import type { MissingFromCareIntelligenceRecord, MissingFromCareIntelligencePolicy, StaffMissingFromCareIntelligenceTraining } from "@/lib/missing-from-care/missing-from-care-intelligence-engine";

const DEMO_RECORDS: MissingFromCareIntelligenceRecord[] = [
  { id: "mfci-001", homeId: "home-oak", date: "2025-02-10", childId: "child-alex", childName: "Alex", category: "missing_episode_response", outcome: "child_found_safe", immediateResponseFollowed: true, policeNotifiedAppropriately: true, returnInterviewCompleted: true, safetyPlanUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "mfci-002", homeId: "home-oak", date: "2025-03-15", childId: "child-alex", childName: "Alex", category: "return_home_interview", outcome: "child_returned_voluntarily", immediateResponseFollowed: true, policeNotifiedAppropriately: true, returnInterviewCompleted: true, safetyPlanUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "mfci-003", homeId: "home-oak", date: "2025-04-02", childId: "child-alex", childName: "Alex", category: "risk_assessment_review", outcome: "concerns_identified", immediateResponseFollowed: true, policeNotifiedAppropriately: true, returnInterviewCompleted: true, safetyPlanUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "mfci-004", homeId: "home-oak", date: "2025-05-01", childId: "child-alex", childName: "Alex", category: "safety_planning", outcome: "not_applicable", immediateResponseFollowed: true, policeNotifiedAppropriately: true, returnInterviewCompleted: true, safetyPlanUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "mfci-005", homeId: "home-oak", date: "2025-02-20", childId: "child-jordan", childName: "Jordan", category: "police_notification", outcome: "child_found_safe", immediateResponseFollowed: true, policeNotifiedAppropriately: true, returnInterviewCompleted: true, safetyPlanUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "mfci-006", homeId: "home-oak", date: "2025-03-18", childId: "child-jordan", childName: "Jordan", category: "multi_agency_response", outcome: "child_returned_voluntarily", immediateResponseFollowed: true, policeNotifiedAppropriately: true, returnInterviewCompleted: true, safetyPlanUpdated: false, documentationComplete: true, timelyRecording: false },
  { id: "mfci-007", homeId: "home-oak", date: "2025-04-10", childId: "child-jordan", childName: "Jordan", category: "missing_prevention", outcome: "ongoing_risk", immediateResponseFollowed: true, policeNotifiedAppropriately: true, returnInterviewCompleted: true, safetyPlanUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "mfci-008", homeId: "home-oak", date: "2025-05-05", childId: "child-jordan", childName: "Jordan", category: "pattern_analysis", outcome: "not_applicable", immediateResponseFollowed: true, policeNotifiedAppropriately: true, returnInterviewCompleted: true, safetyPlanUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "mfci-009", homeId: "home-oak", date: "2025-03-22", childId: "child-morgan", childName: "Morgan", category: "missing_episode_response", outcome: "concerns_identified", immediateResponseFollowed: true, policeNotifiedAppropriately: true, returnInterviewCompleted: true, safetyPlanUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "mfci-010", homeId: "home-oak", date: "2025-04-15", childId: "child-morgan", childName: "Morgan", category: "return_home_interview", outcome: "child_found_safe", immediateResponseFollowed: true, policeNotifiedAppropriately: false, returnInterviewCompleted: true, safetyPlanUpdated: true, documentationComplete: true, timelyRecording: true },
  { id: "mfci-011", homeId: "home-oak", date: "2025-05-02", childId: "child-morgan", childName: "Morgan", category: "risk_assessment_review", outcome: "ongoing_risk", immediateResponseFollowed: true, policeNotifiedAppropriately: true, returnInterviewCompleted: false, safetyPlanUpdated: true, documentationComplete: false, timelyRecording: true },
  { id: "mfci-012", homeId: "home-oak", date: "2025-06-14", childId: "child-morgan", childName: "Morgan", category: "safety_planning", outcome: "not_applicable", immediateResponseFollowed: true, policeNotifiedAppropriately: true, returnInterviewCompleted: true, safetyPlanUpdated: true, documentationComplete: true, timelyRecording: true },
];

const DEMO_POLICY: MissingFromCareIntelligencePolicy = {
  missingChildrenPolicy: true, returnHomeInterviewPolicy: true, policeNotificationProtocol: true,
  riskAssessmentFramework: true, preventionStrategy: true, multiAgencyMissingProtocol: true, debriefAndLearningPolicy: true,
};

const DEMO_STAFF: StaffMissingFromCareIntelligenceTraining[] = [
  { staffId: "staff-sarah", missingResponseProcedures: true, returnInterviewSkills: true, riskAssessmentSkills: true, policeNotificationKnowledge: true, preventionStrategies: true, deEscalationSkills: true },
  { staffId: "staff-tom", missingResponseProcedures: true, returnInterviewSkills: true, riskAssessmentSkills: true, policeNotificationKnowledge: true, preventionStrategies: true, deEscalationSkills: false },
  { staffId: "staff-lisa", missingResponseProcedures: true, returnInterviewSkills: true, riskAssessmentSkills: true, policeNotificationKnowledge: true, preventionStrategies: false, deEscalationSkills: true },
  { staffId: "staff-darren", missingResponseProcedures: true, returnInterviewSkills: true, riskAssessmentSkills: true, policeNotificationKnowledge: true, preventionStrategies: true, deEscalationSkills: true },
];

export async function GET() {
  const result = generateMissingFromCareIntelligenceResult({
    homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
    records: DEMO_RECORDS, policy: DEMO_POLICY, staff: DEMO_STAFF,
  });
  return NextResponse.json({ data: { ...result, meta: { generatedAt: new Date().toISOString(), engine: "missing-from-care-intelligence", version: "2.0.0" } } });
}
