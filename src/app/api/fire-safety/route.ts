import { NextResponse } from "next/server";
import {
  generateFireSafetyIntelligence,
} from "@/lib/fire-safety";
import type {
  FireSafetyRecord,
  FireSafetyPolicy,
  FireSafetyStaffTraining,
} from "@/lib/fire-safety";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

function generateDemoData(): {
  records: FireSafetyRecord[];
  policy: FireSafetyPolicy;
  training: FireSafetyStaffTraining[];
} {
  const records: FireSafetyRecord[] = [
    // Alex — fire drills and equipment checks
    { id: "rec-001", homeId: "oak-house", date: "2026-01-15", childId: "child-alex", childName: "Alex", category: "fire_drill", outcome: "fully_compliant", drillCompletedSuccessfully: true, allChildrenAccounted: true, evacuationTimeRecorded: true, equipmentFunctional: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-002", homeId: "oak-house", date: "2026-02-10", childId: "child-alex", childName: "Alex", category: "equipment_check", outcome: "fully_compliant", drillCompletedSuccessfully: true, allChildrenAccounted: true, evacuationTimeRecorded: true, equipmentFunctional: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-003", homeId: "oak-house", date: "2026-03-05", childId: "child-alex", childName: "Alex", category: "risk_assessment", outcome: "fully_compliant", drillCompletedSuccessfully: true, allChildrenAccounted: true, evacuationTimeRecorded: true, equipmentFunctional: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-004", homeId: "oak-house", date: "2026-04-12", childId: "child-alex", childName: "Alex", category: "evacuation_plan", outcome: "fully_compliant", drillCompletedSuccessfully: true, allChildrenAccounted: true, evacuationTimeRecorded: true, equipmentFunctional: true, documentationComplete: true, timelyRecording: true },

    // Jordan — mixed outcomes, some issues
    { id: "rec-005", homeId: "oak-house", date: "2026-01-20", childId: "child-jordan", childName: "Jordan", category: "fire_alarm_test", outcome: "fully_compliant", drillCompletedSuccessfully: true, allChildrenAccounted: true, evacuationTimeRecorded: true, equipmentFunctional: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-006", homeId: "oak-house", date: "2026-02-18", childId: "child-jordan", childName: "Jordan", category: "staff_training_session", outcome: "minor_issue", drillCompletedSuccessfully: true, allChildrenAccounted: true, evacuationTimeRecorded: false, equipmentFunctional: true, documentationComplete: true, timelyRecording: false },
    { id: "rec-007", homeId: "oak-house", date: "2026-03-15", childId: "child-jordan", childName: "Jordan", category: "fire_door_check", outcome: "minor_issue", drillCompletedSuccessfully: true, allChildrenAccounted: true, evacuationTimeRecorded: true, equipmentFunctional: false, documentationComplete: true, timelyRecording: true },
    { id: "rec-008", homeId: "oak-house", date: "2026-04-20", childId: "child-jordan", childName: "Jordan", category: "emergency_lighting_check", outcome: "fully_compliant", drillCompletedSuccessfully: true, allChildrenAccounted: true, evacuationTimeRecorded: true, equipmentFunctional: true, documentationComplete: true, timelyRecording: true },

    // Morgan — good overall
    { id: "rec-009", homeId: "oak-house", date: "2026-02-05", childId: "child-morgan", childName: "Morgan", category: "fire_drill", outcome: "fully_compliant", drillCompletedSuccessfully: true, allChildrenAccounted: true, evacuationTimeRecorded: true, equipmentFunctional: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-010", homeId: "oak-house", date: "2026-03-10", childId: "child-morgan", childName: "Morgan", category: "equipment_check", outcome: "fully_compliant", drillCompletedSuccessfully: true, allChildrenAccounted: true, evacuationTimeRecorded: true, equipmentFunctional: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-011", homeId: "oak-house", date: "2026-04-08", childId: "child-morgan", childName: "Morgan", category: "risk_assessment", outcome: "fully_compliant", drillCompletedSuccessfully: true, allChildrenAccounted: true, evacuationTimeRecorded: true, equipmentFunctional: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-012", homeId: "oak-house", date: "2026-05-01", childId: "child-morgan", childName: "Morgan", category: "fire_alarm_test", outcome: "fully_compliant", drillCompletedSuccessfully: true, allChildrenAccounted: true, evacuationTimeRecorded: true, equipmentFunctional: true, documentationComplete: true, timelyRecording: true },
  ];

  const policy: FireSafetyPolicy = {
    fireSafetyPolicy: true,
    evacuationProcedure: true,
    fireRiskAssessmentPolicy: true,
    equipmentMaintenancePolicy: true,
    drillFrequencyGuidance: true,
    emergencyLightingPolicy: true,
    fireAlarmTestingPolicy: true,
  };

  const training: FireSafetyStaffTraining[] = [
    { staffId: "staff-sarah", fireWardenTraining: true, evacuationProcedureKnowledge: true, fireExtinguisherUse: true, fireRiskAssessment: true, alarmSystemKnowledge: true, firstAidFireInjury: true },
    { staffId: "staff-tom", fireWardenTraining: true, evacuationProcedureKnowledge: true, fireExtinguisherUse: true, fireRiskAssessment: true, alarmSystemKnowledge: true, firstAidFireInjury: false },
    { staffId: "staff-lisa", fireWardenTraining: true, evacuationProcedureKnowledge: true, fireExtinguisherUse: true, fireRiskAssessment: false, alarmSystemKnowledge: true, firstAidFireInjury: true },
    { staffId: "staff-darren", fireWardenTraining: true, evacuationProcedureKnowledge: true, fireExtinguisherUse: true, fireRiskAssessment: true, alarmSystemKnowledge: true, firstAidFireInjury: true },
  ];

  return { records, policy, training };
}

// ── GET Handler ──────────────────────────────────────────────────────────

export async function GET() {
  const { records, policy, training } = generateDemoData();

  const result = generateFireSafetyIntelligence(
    records,
    policy,
    training,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "fire-safety",
        version: "2.0.0",
      },
    },
  });
}
