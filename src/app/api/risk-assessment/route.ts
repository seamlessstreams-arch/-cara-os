import { NextResponse } from "next/server";
import { generateRiskAssessmentIntelligence } from "@/lib/risk-assessment";
import type { RiskAssessmentRecord, RiskAssessmentPolicy, StaffRiskAssessmentTraining } from "@/lib/risk-assessment";

// ── Demo Data ─────────────────────────────────────────────────────────────

const DEMO_RECORDS: RiskAssessmentRecord[] = [
  { id: "ra-001", homeId: "home-oak", date: "2026-05-14", childId: "child-alex", childName: "Alex", category: "initial_assessment", outcome: "risk_reduced", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true },
  { id: "ra-002", homeId: "home-oak", date: "2026-05-07", childId: "child-jordan", childName: "Jordan", category: "review_assessment", outcome: "controls_adequate", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true },
  { id: "ra-003", homeId: "home-oak", date: "2026-04-30", childId: "child-morgan", childName: "Morgan", category: "dynamic_risk_update", outcome: "risk_maintained", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: false, documentationComplete: true, timelyRecording: true },
  { id: "ra-004", homeId: "home-oak", date: "2026-04-23", childId: "child-alex", childName: "Alex", category: "positive_risk_taking", outcome: "risk_reduced", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true },
  { id: "ra-005", homeId: "home-oak", date: "2026-04-16", childId: "child-jordan", childName: "Jordan", category: "incident_triggered", outcome: "risk_increased", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true },
  { id: "ra-006", homeId: "home-oak", date: "2026-04-09", childId: "child-morgan", childName: "Morgan", category: "placement_risk", outcome: "controls_adequate", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: false, multiAgencyInput: true, documentationComplete: true, timelyRecording: false },
  { id: "ra-007", homeId: "home-oak", date: "2026-04-02", childId: "child-alex", childName: "Alex", category: "community_risk", outcome: "risk_maintained", controlMeasuresIdentified: true, childViewIncluded: false, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true },
  { id: "ra-008", homeId: "home-oak", date: "2026-03-26", childId: "child-jordan", childName: "Jordan", category: "environmental_risk", outcome: "risk_reduced", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true },
  { id: "ra-009", homeId: "home-oak", date: "2026-03-19", childId: "child-morgan", childName: "Morgan", category: "initial_assessment", outcome: "risk_reduced", controlMeasuresIdentified: false, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: false, timelyRecording: true },
  { id: "ra-010", homeId: "home-oak", date: "2026-03-12", childId: "child-alex", childName: "Alex", category: "review_assessment", outcome: "controls_adequate", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true },
  { id: "ra-011", homeId: "home-oak", date: "2026-03-05", childId: "child-jordan", childName: "Jordan", category: "dynamic_risk_update", outcome: "risk_maintained", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: false, documentationComplete: true, timelyRecording: true },
  { id: "ra-012", homeId: "home-oak", date: "2026-02-26", childId: "child-morgan", childName: "Morgan", category: "positive_risk_taking", outcome: "risk_reduced", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true },
];

const DEMO_POLICY: RiskAssessmentPolicy = {
  riskAssessmentPolicy: true,
  dynamicRiskUpdatePolicy: true,
  positiveRiskTakingPolicy: true,
  incidentTriggeredReviewPolicy: true,
  communityRiskPolicy: true,
  environmentalRiskPolicy: true,
  multiAgencyRiskSharingPolicy: true,
};

const DEMO_STAFF: StaffRiskAssessmentTraining[] = [
  { staffId: "staff-sarah", riskAssessmentSkills: true, dynamicRiskManagement: true, positiveRiskTaking: true, incidentRiskAnalysis: true, childViewInRisk: true, multiAgencyRiskSharing: true },
  { staffId: "staff-tom", riskAssessmentSkills: true, dynamicRiskManagement: true, positiveRiskTaking: true, incidentRiskAnalysis: true, childViewInRisk: true, multiAgencyRiskSharing: false },
  { staffId: "staff-lisa", riskAssessmentSkills: true, dynamicRiskManagement: true, positiveRiskTaking: true, incidentRiskAnalysis: true, childViewInRisk: true, multiAgencyRiskSharing: true },
  { staffId: "staff-darren", riskAssessmentSkills: true, dynamicRiskManagement: true, positiveRiskTaking: true, incidentRiskAnalysis: true, childViewInRisk: true, multiAgencyRiskSharing: true },
];

// ── Handler ───────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateRiskAssessmentIntelligence({
    homeId: "home-oak",
    periodStart: "2026-01-01",
    periodEnd: "2026-05-20",
    records: DEMO_RECORDS,
    policy: DEMO_POLICY,
    staff: DEMO_STAFF,
  });

  return NextResponse.json({
    data: {
      ...result,
      meta: { generatedAt: new Date().toISOString(), engine: "risk-assessment", version: "2.0.0" },
    },
  });
}
