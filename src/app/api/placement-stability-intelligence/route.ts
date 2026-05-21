import { NextResponse } from "next/server";
import { generatePlacementStabilityIntelligenceReport } from "@/lib/placement-stability/placement-stability-intelligence-engine";
import type { PlacementStabilityRecord, PlacementStabilityPolicy, StaffPlacementStabilityTraining } from "@/lib/placement-stability/placement-stability-intelligence-engine";

const DEMO_RECORDS: PlacementStabilityRecord[] = [
  { id: "ps-001", homeId: "home-oak", date: "2025-01-15", childId: "child-alex", childName: "Alex", category: "placement_review", outcome: "placement_sustained", matchingNeedsAssessed: true, stabilityPlanInPlace: true, childViewIncorporated: true, riskFactorsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "ps-002", homeId: "home-oak", date: "2025-02-10", childId: "child-alex", childName: "Alex", category: "stability_meeting", outcome: "placement_improved", matchingNeedsAssessed: true, stabilityPlanInPlace: true, childViewIncorporated: true, riskFactorsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "ps-003", homeId: "home-oak", date: "2025-03-05", childId: "child-alex", childName: "Alex", category: "matching_assessment", outcome: "placement_sustained", matchingNeedsAssessed: true, stabilityPlanInPlace: true, childViewIncorporated: true, riskFactorsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "ps-004", homeId: "home-oak", date: "2025-04-01", childId: "child-alex", childName: "Alex", category: "transition_planning", outcome: "placement_sustained", matchingNeedsAssessed: true, stabilityPlanInPlace: true, childViewIncorporated: true, riskFactorsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "ps-005", homeId: "home-oak", date: "2025-01-20", childId: "child-jordan", childName: "Jordan", category: "placement_support", outcome: "placement_improved", matchingNeedsAssessed: true, stabilityPlanInPlace: true, childViewIncorporated: true, riskFactorsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "ps-006", homeId: "home-oak", date: "2025-02-15", childId: "child-jordan", childName: "Jordan", category: "permanence_planning", outcome: "early_intervention", matchingNeedsAssessed: true, stabilityPlanInPlace: true, childViewIncorporated: true, riskFactorsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "ps-007", homeId: "home-oak", date: "2025-03-10", childId: "child-jordan", childName: "Jordan", category: "disruption_meeting", outcome: "placement_sustained", matchingNeedsAssessed: true, stabilityPlanInPlace: true, childViewIncorporated: true, riskFactorsIdentified: false, documentationComplete: true, timelyRecording: false },
  { id: "ps-008", homeId: "home-oak", date: "2025-04-10", childId: "child-jordan", childName: "Jordan", category: "unplanned_ending_review", outcome: "placement_at_risk", matchingNeedsAssessed: true, stabilityPlanInPlace: true, childViewIncorporated: true, riskFactorsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "ps-009", homeId: "home-oak", date: "2025-02-01", childId: "child-morgan", childName: "Morgan", category: "placement_review", outcome: "placement_sustained", matchingNeedsAssessed: true, stabilityPlanInPlace: true, childViewIncorporated: true, riskFactorsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "ps-010", homeId: "home-oak", date: "2025-03-15", childId: "child-morgan", childName: "Morgan", category: "stability_meeting", outcome: "placement_improved", matchingNeedsAssessed: true, stabilityPlanInPlace: true, childViewIncorporated: true, riskFactorsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "ps-011", homeId: "home-oak", date: "2025-04-10", childId: "child-morgan", childName: "Morgan", category: "matching_assessment", outcome: "early_intervention", matchingNeedsAssessed: true, stabilityPlanInPlace: false, childViewIncorporated: true, riskFactorsIdentified: true, documentationComplete: true, timelyRecording: true },
  { id: "ps-012", homeId: "home-oak", date: "2025-05-01", childId: "child-morgan", childName: "Morgan", category: "placement_support", outcome: "placement_sustained", matchingNeedsAssessed: true, stabilityPlanInPlace: true, childViewIncorporated: false, riskFactorsIdentified: true, documentationComplete: false, timelyRecording: true },
];

const DEMO_POLICY: PlacementStabilityPolicy = {
  placementStabilityPolicy: true, matchingProcedure: true, disruptionManagementPolicy: true,
  transitionPlanningFramework: true, unplannedEndingProtocol: true, permanencePlanningPolicy: true, placementReviewSchedule: true,
};

const DEMO_STAFF: StaffPlacementStabilityTraining[] = [
  { staffId: "staff-sarah", matchingAssessmentSkills: true, stabilityPlanningKnowledge: true, disruptionPreventionSkills: true, transitionSupportSkills: true, childParticipationSkills: true, permanencePlanningKnowledge: true },
  { staffId: "staff-tom", matchingAssessmentSkills: true, stabilityPlanningKnowledge: true, disruptionPreventionSkills: true, transitionSupportSkills: true, childParticipationSkills: true, permanencePlanningKnowledge: false },
  { staffId: "staff-lisa", matchingAssessmentSkills: true, stabilityPlanningKnowledge: true, disruptionPreventionSkills: true, transitionSupportSkills: true, childParticipationSkills: false, permanencePlanningKnowledge: true },
  { staffId: "staff-darren", matchingAssessmentSkills: true, stabilityPlanningKnowledge: true, disruptionPreventionSkills: true, transitionSupportSkills: true, childParticipationSkills: true, permanencePlanningKnowledge: true },
];

export async function GET() {
  const result = generatePlacementStabilityIntelligenceReport({
    homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
    records: DEMO_RECORDS, policy: DEMO_POLICY, staff: DEMO_STAFF,
  });
  return NextResponse.json({ data: { ...result, meta: { generatedAt: new Date().toISOString(), engine: "placement-stability-intelligence", version: "2.0.0" } } });
}
