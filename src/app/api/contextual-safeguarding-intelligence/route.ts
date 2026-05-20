import { NextResponse } from "next/server";
import { generateContextualSafeguardingIntelligence } from "@/lib/contextual-safeguarding";
import type { ContextualSafeguardingRecord, ContextualSafeguardingPolicy, StaffContextualSafeguardingTraining } from "@/lib/contextual-safeguarding";

const DEMO_RECORDS: ContextualSafeguardingRecord[] = [
  { id: "cs-001", homeId: "home-oak", date: "2026-01-15", childId: "child-alex", childName: "Alex", category: "peer_risk_assessment", outcome: "low_risk", riskAssessmentCompleted: true, protectiveFactorsIdentified: true, multiAgencyInvolved: true, safetyPlanInPlace: true, documentationComplete: true, timelyRecording: true },
  { id: "cs-002", homeId: "home-oak", date: "2026-02-10", childId: "child-alex", childName: "Alex", category: "online_safety_assessment", outcome: "no_risk_identified", riskAssessmentCompleted: true, protectiveFactorsIdentified: true, multiAgencyInvolved: true, safetyPlanInPlace: true, documentationComplete: true, timelyRecording: true },
  { id: "cs-003", homeId: "home-oak", date: "2026-03-05", childId: "child-alex", childName: "Alex", category: "community_risk_mapping", outcome: "no_risk_identified", riskAssessmentCompleted: true, protectiveFactorsIdentified: true, multiAgencyInvolved: true, safetyPlanInPlace: true, documentationComplete: true, timelyRecording: true },
  { id: "cs-004", homeId: "home-oak", date: "2026-04-01", childId: "child-alex", childName: "Alex", category: "school_safety_assessment", outcome: "no_risk_identified", riskAssessmentCompleted: true, protectiveFactorsIdentified: true, multiAgencyInvolved: true, safetyPlanInPlace: true, documentationComplete: true, timelyRecording: true },
  { id: "cs-005", homeId: "home-oak", date: "2026-01-20", childId: "child-jordan", childName: "Jordan", category: "gang_exploitation_screening", outcome: "moderate_risk", riskAssessmentCompleted: true, protectiveFactorsIdentified: true, multiAgencyInvolved: true, safetyPlanInPlace: true, documentationComplete: true, timelyRecording: true },
  { id: "cs-006", homeId: "home-oak", date: "2026-02-15", childId: "child-jordan", childName: "Jordan", category: "county_lines_assessment", outcome: "low_risk", riskAssessmentCompleted: true, protectiveFactorsIdentified: true, multiAgencyInvolved: true, safetyPlanInPlace: true, documentationComplete: true, timelyRecording: true },
  { id: "cs-007", homeId: "home-oak", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "environmental_mapping", outcome: "low_risk", riskAssessmentCompleted: true, protectiveFactorsIdentified: true, multiAgencyInvolved: true, safetyPlanInPlace: false, documentationComplete: true, timelyRecording: false },
  { id: "cs-008", homeId: "home-oak", date: "2026-04-10", childId: "child-jordan", childName: "Jordan", category: "peer_risk_assessment", outcome: "low_risk", riskAssessmentCompleted: true, protectiveFactorsIdentified: true, multiAgencyInvolved: true, safetyPlanInPlace: true, documentationComplete: true, timelyRecording: true },
  { id: "cs-009", homeId: "home-oak", date: "2026-02-01", childId: "child-morgan", childName: "Morgan", category: "family_network_analysis", outcome: "no_risk_identified", riskAssessmentCompleted: true, protectiveFactorsIdentified: true, multiAgencyInvolved: true, safetyPlanInPlace: true, documentationComplete: true, timelyRecording: true },
  { id: "cs-010", homeId: "home-oak", date: "2026-03-15", childId: "child-morgan", childName: "Morgan", category: "online_safety_assessment", outcome: "low_risk", riskAssessmentCompleted: true, protectiveFactorsIdentified: true, multiAgencyInvolved: true, safetyPlanInPlace: true, documentationComplete: true, timelyRecording: true },
  { id: "cs-011", homeId: "home-oak", date: "2026-04-10", childId: "child-morgan", childName: "Morgan", category: "school_safety_assessment", outcome: "no_risk_identified", riskAssessmentCompleted: true, protectiveFactorsIdentified: false, multiAgencyInvolved: true, safetyPlanInPlace: true, documentationComplete: true, timelyRecording: true },
  { id: "cs-012", homeId: "home-oak", date: "2026-05-01", childId: "child-morgan", childName: "Morgan", category: "community_risk_mapping", outcome: "low_risk", riskAssessmentCompleted: true, protectiveFactorsIdentified: true, multiAgencyInvolved: false, safetyPlanInPlace: true, documentationComplete: false, timelyRecording: true },
];

const DEMO_POLICY: ContextualSafeguardingPolicy = {
  contextualSafeguardingPolicy: true, peerRiskAssessmentPolicy: true, onlineSafetyPolicy: true,
  exploitationScreeningPolicy: true, communityMappingPolicy: true, multiAgencyProtocol: true, safetyPlanningPolicy: true,
};

const DEMO_STAFF: StaffContextualSafeguardingTraining[] = [
  { staffId: "staff-sarah", contextualSafeguardingKnowledge: true, exploitationAwareness: true, onlineSafetyCompetency: true, multiAgencyWorkingSkills: true, riskAssessmentSkills: true, safetyPlanningSkills: true },
  { staffId: "staff-tom", contextualSafeguardingKnowledge: true, exploitationAwareness: true, onlineSafetyCompetency: true, multiAgencyWorkingSkills: true, riskAssessmentSkills: true, safetyPlanningSkills: false },
  { staffId: "staff-lisa", contextualSafeguardingKnowledge: true, exploitationAwareness: true, onlineSafetyCompetency: true, multiAgencyWorkingSkills: true, riskAssessmentSkills: false, safetyPlanningSkills: true },
  { staffId: "staff-darren", contextualSafeguardingKnowledge: true, exploitationAwareness: true, onlineSafetyCompetency: true, multiAgencyWorkingSkills: true, riskAssessmentSkills: true, safetyPlanningSkills: true },
];

export async function GET() {
  const result = generateContextualSafeguardingIntelligence({
    homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-20",
    records: DEMO_RECORDS, policy: DEMO_POLICY, staff: DEMO_STAFF,
  });
  return NextResponse.json({ data: { ...result, meta: { generatedAt: new Date().toISOString(), engine: "contextual-safeguarding-intelligence", version: "2.0.0" } } });
}
