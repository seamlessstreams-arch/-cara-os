import { NextResponse } from "next/server";
import { isLiveTenant } from "@/lib/db/live-mode";
import { generateRiskAssessmentIntelligence } from "@/lib/risk-assessment";
import type { RiskAssessmentRecord, RiskAssessmentPolicy, StaffRiskAssessmentTraining } from "@/lib/risk-assessment";

import { seedDay } from "@/lib/seed-date";
// ── Demo Data ─────────────────────────────────────────────────────────────

const DEMO_RECORDS: RiskAssessmentRecord[] = [
  { id: "ra-001", homeId: "home-oak", date: seedDay(3), childId: "child-alex", childName: "Alex", category: "initial_assessment", outcome: "risk_reduced", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true },
  { id: "ra-002", homeId: "home-oak", date: seedDay(-4), childId: "child-jordan", childName: "Jordan", category: "review_assessment", outcome: "controls_adequate", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true },
  { id: "ra-003", homeId: "home-oak", date: seedDay(-11), childId: "child-morgan", childName: "Morgan", category: "dynamic_risk_update", outcome: "risk_maintained", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: false, documentationComplete: true, timelyRecording: true },
  { id: "ra-004", homeId: "home-oak", date: seedDay(-18), childId: "child-alex", childName: "Alex", category: "positive_risk_taking", outcome: "risk_reduced", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true },
  { id: "ra-005", homeId: "home-oak", date: seedDay(-25), childId: "child-jordan", childName: "Jordan", category: "incident_triggered", outcome: "risk_increased", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true },
  { id: "ra-006", homeId: "home-oak", date: seedDay(-32), childId: "child-morgan", childName: "Morgan", category: "placement_risk", outcome: "controls_adequate", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: false, multiAgencyInput: true, documentationComplete: true, timelyRecording: false },
  { id: "ra-007", homeId: "home-oak", date: seedDay(-39), childId: "child-alex", childName: "Alex", category: "community_risk", outcome: "risk_maintained", controlMeasuresIdentified: true, childViewIncluded: false, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true },
  { id: "ra-008", homeId: "home-oak", date: seedDay(-46), childId: "child-jordan", childName: "Jordan", category: "environmental_risk", outcome: "risk_reduced", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true },
  { id: "ra-009", homeId: "home-oak", date: seedDay(-53), childId: "child-morgan", childName: "Morgan", category: "initial_assessment", outcome: "risk_reduced", controlMeasuresIdentified: false, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: false, timelyRecording: true },
  { id: "ra-010", homeId: "home-oak", date: seedDay(-60), childId: "child-alex", childName: "Alex", category: "review_assessment", outcome: "controls_adequate", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true },
  { id: "ra-011", homeId: "home-oak", date: seedDay(-67), childId: "child-jordan", childName: "Jordan", category: "dynamic_risk_update", outcome: "risk_maintained", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: false, documentationComplete: true, timelyRecording: true },
  { id: "ra-012", homeId: "home-oak", date: seedDay(-74), childId: "child-morgan", childName: "Morgan", category: "positive_risk_taking", outcome: "risk_reduced", controlMeasuresIdentified: true, childViewIncluded: true, reviewDateSet: true, multiAgencyInput: true, documentationComplete: true, timelyRecording: true },
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
  // Live tenants: was leaking fabricated Alex/Jordan/Morgan risk-assessment
  // records unconditionally until 2026-07-29. Return an empty analysis on live.
  const live = isLiveTenant();
  const emptyPolicy: RiskAssessmentPolicy = {
    riskAssessmentPolicy: false,
    dynamicRiskUpdatePolicy: false,
    positiveRiskTakingPolicy: false,
    incidentTriggeredReviewPolicy: false,
    communityRiskPolicy: false,
    environmentalRiskPolicy: false,
    multiAgencyRiskSharingPolicy: false,
  };
  const result = generateRiskAssessmentIntelligence({
    homeId: "home-oak",
    periodStart: seedDay(-130),
    periodEnd: seedDay(9),
    records: live ? [] : DEMO_RECORDS,
    policy: live ? emptyPolicy : DEMO_POLICY,
    staff: live ? [] : DEMO_STAFF,
  });

  return NextResponse.json({
    data: {
      ...result,
      meta: { generatedAt: new Date().toISOString(), engine: "risk-assessment", version: "2.0.0" },
      ...(live && { live_no_data: true }),
    },
  });
}
