import { NextResponse } from "next/server";
import { generateHealthIntelligenceResult } from "@/lib/health";
import type { HealthIntelligenceRecord, HealthIntelligencePolicy, StaffHealthIntelligenceTraining } from "@/lib/health";

const DEMO_RECORDS: HealthIntelligenceRecord[] = [
  { id: "hi-001", homeId: "home-oak", date: "2025-01-20", childId: "child-alex", childName: "Alex", category: "health_assessment", outcome: "health_improved", healthNeedsAssessed: true, consentObtained: true, childViewIncluded: true, followUpPlanned: true, documentationComplete: true, timelyRecording: true },
  { id: "hi-002", homeId: "home-oak", date: "2025-03-05", childId: "child-alex", childName: "Alex", category: "dental_check", outcome: "health_maintained", healthNeedsAssessed: true, consentObtained: true, childViewIncluded: true, followUpPlanned: true, documentationComplete: true, timelyRecording: true },
  { id: "hi-003", homeId: "home-oak", date: "2025-05-12", childId: "child-alex", childName: "Alex", category: "mental_health_screening", outcome: "health_maintained", healthNeedsAssessed: true, consentObtained: true, childViewIncluded: true, followUpPlanned: true, documentationComplete: true, timelyRecording: false },
  { id: "hi-004", homeId: "home-oak", date: "2025-07-18", childId: "child-alex", childName: "Alex", category: "immunisation_review", outcome: "health_improved", healthNeedsAssessed: true, consentObtained: true, childViewIncluded: false, followUpPlanned: true, documentationComplete: true, timelyRecording: true },
  { id: "hi-005", homeId: "home-oak", date: "2025-02-10", childId: "child-jordan", childName: "Jordan", category: "medical_appointment", outcome: "health_concern_identified", healthNeedsAssessed: true, consentObtained: true, childViewIncluded: true, followUpPlanned: true, documentationComplete: true, timelyRecording: true },
  { id: "hi-006", homeId: "home-oak", date: "2025-04-22", childId: "child-jordan", childName: "Jordan", category: "health_action_plan", outcome: "health_improved", healthNeedsAssessed: true, consentObtained: true, childViewIncluded: true, followUpPlanned: true, documentationComplete: true, timelyRecording: true },
  { id: "hi-007", homeId: "home-oak", date: "2025-06-15", childId: "child-jordan", childName: "Jordan", category: "medication_review", outcome: "health_maintained", healthNeedsAssessed: true, consentObtained: true, childViewIncluded: true, followUpPlanned: false, documentationComplete: true, timelyRecording: true },
  { id: "hi-008", homeId: "home-oak", date: "2025-09-01", childId: "child-jordan", childName: "Jordan", category: "health_promotion", outcome: "health_improved", healthNeedsAssessed: true, consentObtained: false, childViewIncluded: true, followUpPlanned: true, documentationComplete: true, timelyRecording: true },
  { id: "hi-009", homeId: "home-oak", date: "2025-01-30", childId: "child-morgan", childName: "Morgan", category: "health_assessment", outcome: "health_maintained", healthNeedsAssessed: true, consentObtained: true, childViewIncluded: true, followUpPlanned: true, documentationComplete: true, timelyRecording: true },
  { id: "hi-010", homeId: "home-oak", date: "2025-04-05", childId: "child-morgan", childName: "Morgan", category: "dental_check", outcome: "health_maintained", healthNeedsAssessed: true, consentObtained: true, childViewIncluded: true, followUpPlanned: true, documentationComplete: false, timelyRecording: true },
  { id: "hi-011", homeId: "home-oak", date: "2025-06-20", childId: "child-morgan", childName: "Morgan", category: "mental_health_screening", outcome: "health_concern_identified", healthNeedsAssessed: true, consentObtained: true, childViewIncluded: false, followUpPlanned: true, documentationComplete: true, timelyRecording: true },
  { id: "hi-012", homeId: "home-oak", date: "2025-10-10", childId: "child-morgan", childName: "Morgan", category: "medication_review", outcome: "health_improved", healthNeedsAssessed: false, consentObtained: true, childViewIncluded: true, followUpPlanned: true, documentationComplete: true, timelyRecording: true },
];

const DEMO_POLICY: HealthIntelligencePolicy = {
  healthCarePolicy: true, consentToTreatmentPolicy: true, medicationManagementPolicy: true,
  mentalHealthSupportPolicy: true, healthPromotionPolicy: true, dentalHealthPolicy: true, immunisationTrackingPolicy: true,
};

const DEMO_STAFF: StaffHealthIntelligenceTraining[] = [
  { staffId: "staff-sarah", healthAssessmentKnowledge: true, medicationAdministration: true, mentalHealthAwareness: true, firstAidTraining: true, healthPromotionSkills: true, consentProcedures: true },
  { staffId: "staff-tom", healthAssessmentKnowledge: true, medicationAdministration: true, mentalHealthAwareness: true, firstAidTraining: true, healthPromotionSkills: true, consentProcedures: false },
  { staffId: "staff-lisa", healthAssessmentKnowledge: true, medicationAdministration: true, mentalHealthAwareness: true, firstAidTraining: false, healthPromotionSkills: true, consentProcedures: true },
  { staffId: "staff-darren", healthAssessmentKnowledge: true, medicationAdministration: true, mentalHealthAwareness: true, firstAidTraining: true, healthPromotionSkills: true, consentProcedures: true },
];

export async function GET() {
  const result = generateHealthIntelligenceResult({
    homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
    records: DEMO_RECORDS, policy: DEMO_POLICY, staff: DEMO_STAFF,
  });
  return NextResponse.json({ data: { ...result, meta: { generatedAt: new Date().toISOString(), engine: "health-intelligence", version: "2.0.0" } } });
}
