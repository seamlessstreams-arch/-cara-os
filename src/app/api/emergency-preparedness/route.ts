import { NextResponse } from "next/server";
import {
  generateEmergencyPreparednessIntelligence,
} from "@/lib/emergency-preparedness";
import type {
  EmergencyDrill,
  EmergencyPolicy,
  StaffEmergencyTraining,
} from "@/lib/emergency-preparedness";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

function buildDemoData(): {
  drills: EmergencyDrill[];
  policy: EmergencyPolicy;
  training: StaffEmergencyTraining[];
} {
  const drills: EmergencyDrill[] = [
    {
      id: "drill-001",
      drillDate: "2026-01-15",
      drillType: "fire_drill",
      readinessLevel: "excellent",
      allStaffParticipated: true,
      childrenBriefed: true,
      completedWithinTarget: true,
      documentedProperly: true,
      debriefConducted: true,
      improvementsIdentified: false,
    },
    {
      id: "drill-002",
      drillDate: "2026-02-10",
      drillType: "evacuation_exercise",
      readinessLevel: "good",
      allStaffParticipated: true,
      childrenBriefed: true,
      completedWithinTarget: true,
      documentedProperly: true,
      debriefConducted: true,
      improvementsIdentified: true,
    },
    {
      id: "drill-003",
      drillDate: "2026-02-28",
      drillType: "lockdown_procedure",
      readinessLevel: "good",
      allStaffParticipated: true,
      childrenBriefed: true,
      completedWithinTarget: true,
      documentedProperly: true,
      debriefConducted: true,
      improvementsIdentified: false,
    },
    {
      id: "drill-004",
      drillDate: "2026-03-12",
      drillType: "first_aid_scenario",
      readinessLevel: "developing",
      allStaffParticipated: false,
      childrenBriefed: false,
      completedWithinTarget: false,
      documentedProperly: true,
      debriefConducted: true,
      improvementsIdentified: true,
    },
    {
      id: "drill-005",
      drillDate: "2026-03-25",
      drillType: "missing_child_protocol",
      readinessLevel: "excellent",
      allStaffParticipated: true,
      childrenBriefed: true,
      completedWithinTarget: true,
      documentedProperly: true,
      debriefConducted: true,
      improvementsIdentified: true,
    },
    {
      id: "drill-006",
      drillDate: "2026-04-08",
      drillType: "medical_emergency",
      readinessLevel: "good",
      allStaffParticipated: true,
      childrenBriefed: true,
      completedWithinTarget: true,
      documentedProperly: true,
      debriefConducted: false,
      improvementsIdentified: false,
    },
    {
      id: "drill-007",
      drillDate: "2026-04-22",
      drillType: "utility_failure",
      readinessLevel: "limited",
      allStaffParticipated: false,
      childrenBriefed: false,
      completedWithinTarget: false,
      documentedProperly: false,
      debriefConducted: false,
      improvementsIdentified: true,
    },
    {
      id: "drill-008",
      drillDate: "2026-05-05",
      drillType: "fire_drill",
      readinessLevel: "excellent",
      allStaffParticipated: true,
      childrenBriefed: true,
      completedWithinTarget: true,
      documentedProperly: true,
      debriefConducted: true,
      improvementsIdentified: false,
    },
    {
      id: "drill-009",
      drillDate: "2026-05-12",
      drillType: "severe_weather",
      readinessLevel: "developing",
      allStaffParticipated: true,
      childrenBriefed: true,
      completedWithinTarget: false,
      documentedProperly: true,
      debriefConducted: true,
      improvementsIdentified: true,
    },
    {
      id: "drill-010",
      drillDate: "2026-05-18",
      drillType: "lockdown_procedure",
      readinessLevel: "good",
      allStaffParticipated: true,
      childrenBriefed: true,
      completedWithinTarget: true,
      documentedProperly: true,
      debriefConducted: true,
      improvementsIdentified: false,
    },
  ];

  const policy: EmergencyPolicy = {
    id: "policy-oak-house",
    fireEvacuationPlan: true,
    lockdownProcedure: true,
    missingChildProtocol: true,
    medicalEmergencyPlan: true,
    businessContinuityPlan: true,
    emergencyContactSystem: true,
    regularReview: true,
  };

  const training: StaffEmergencyTraining[] = [
    {
      id: "train-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      firstAidCertified: true,
      fireMarshallTrained: true,
      evacuationProcedures: true,
      emergencyProtocols: true,
      safeguardingInEmergencies: true,
      communicationInCrisis: true,
    },
    {
      id: "train-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      firstAidCertified: true,
      fireMarshallTrained: false,
      evacuationProcedures: true,
      emergencyProtocols: true,
      safeguardingInEmergencies: true,
      communicationInCrisis: false,
    },
    {
      id: "train-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      firstAidCertified: true,
      fireMarshallTrained: true,
      evacuationProcedures: true,
      emergencyProtocols: true,
      safeguardingInEmergencies: false,
      communicationInCrisis: true,
    },
    {
      id: "train-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      firstAidCertified: true,
      fireMarshallTrained: true,
      evacuationProcedures: true,
      emergencyProtocols: true,
      safeguardingInEmergencies: true,
      communicationInCrisis: true,
    },
  ];

  return { drills, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { drills, policy, training } = buildDemoData();

  const result = generateEmergencyPreparednessIntelligence(
    drills,
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
        engine: "emergency-preparedness",
        version: "1.0.0",
      },
    },
  });
}
