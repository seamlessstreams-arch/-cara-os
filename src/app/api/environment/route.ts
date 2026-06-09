import { NextResponse } from "next/server";
import {
  generateEnvironmentIntelligence,
} from "@/lib/environment";
import type {
  EnvironmentRecord,
  EnvironmentPolicy,
  StaffEnvironmentTraining,
} from "@/lib/environment";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  records: EnvironmentRecord[];
  policy: EnvironmentPolicy;
  training: StaffEnvironmentTraining[];
} {
  const records: EnvironmentRecord[] = [
    // Alex — bedroom, communal, outdoor, safety
    { id: "rec-001", childId: "child-alex", childName: "Alex", date: "2026-01-15", category: "bedroom_personalisation", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: true },
    { id: "rec-002", childId: "child-alex", childName: "Alex", date: "2026-02-03", category: "communal_spaces", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: true },
    { id: "rec-003", childId: "child-alex", childName: "Alex", date: "2026-02-20", category: "outdoor_areas", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: true },
    { id: "rec-004", childId: "child-alex", childName: "Alex", date: "2026-03-10", category: "safety_compliance", adequate: true, childInvolved: false, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: false },
    { id: "rec-005", childId: "child-alex", childName: "Alex", date: "2026-03-25", category: "cleanliness_hygiene", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: true },
    { id: "rec-006", childId: "child-alex", childName: "Alex", date: "2026-04-05", category: "maintenance_repairs", adequate: true, childInvolved: false, actionTaken: true, documented: true, timelyCompletion: false, childFeedbackSought: false },
    { id: "rec-007", childId: "child-alex", childName: "Alex", date: "2026-04-18", category: "accessibility", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: true },
    { id: "rec-008", childId: "child-alex", childName: "Alex", date: "2026-05-02", category: "sensory_environment", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: true },

    // Jordan — mixed outcomes
    { id: "rec-009", childId: "child-jordan", childName: "Jordan", date: "2026-01-20", category: "bedroom_personalisation", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: true },
    { id: "rec-010", childId: "child-jordan", childName: "Jordan", date: "2026-02-10", category: "communal_spaces", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: true },
    { id: "rec-011", childId: "child-jordan", childName: "Jordan", date: "2026-02-28", category: "outdoor_areas", adequate: false, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: false },
    { id: "rec-012", childId: "child-jordan", childName: "Jordan", date: "2026-03-15", category: "safety_compliance", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: false, childFeedbackSought: true },
    { id: "rec-013", childId: "child-jordan", childName: "Jordan", date: "2026-04-01", category: "cleanliness_hygiene", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: true },
    { id: "rec-014", childId: "child-jordan", childName: "Jordan", date: "2026-04-20", category: "maintenance_repairs", adequate: true, childInvolved: false, actionTaken: false, documented: false, timelyCompletion: false, childFeedbackSought: false },
    { id: "rec-015", childId: "child-jordan", childName: "Jordan", date: "2026-05-05", category: "sensory_environment", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: true },

    // Morgan — good overall
    { id: "rec-016", childId: "child-morgan", childName: "Morgan", date: "2026-01-25", category: "bedroom_personalisation", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: true },
    { id: "rec-017", childId: "child-morgan", childName: "Morgan", date: "2026-02-15", category: "communal_spaces", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: true },
    { id: "rec-018", childId: "child-morgan", childName: "Morgan", date: "2026-03-05", category: "outdoor_areas", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: true },
    { id: "rec-019", childId: "child-morgan", childName: "Morgan", date: "2026-03-20", category: "safety_compliance", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: true },
    { id: "rec-020", childId: "child-morgan", childName: "Morgan", date: "2026-04-10", category: "cleanliness_hygiene", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: false },
    { id: "rec-021", childId: "child-morgan", childName: "Morgan", date: "2026-04-28", category: "accessibility", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: true },
    { id: "rec-022", childId: "child-morgan", childName: "Morgan", date: "2026-05-10", category: "sensory_environment", adequate: true, childInvolved: true, actionTaken: true, documented: true, timelyCompletion: true, childFeedbackSought: true },
  ];

  const policy: EnvironmentPolicy = {
    id: "pol-001",
    environmentPolicy: true,
    bedroomStandards: true,
    communalSpaceGuidelines: true,
    outdoorAreaMaintenance: true,
    healthSafetyCompliance: true,
    accessibilityPlan: true,
    regularInspectionSchedule: true,
  };

  const training: StaffEnvironmentTraining[] = [
    { id: "tr-001", staffId: "staff-sarah", staffName: "Sarah Johnson", environmentalAwareness: true, healthSafetyKnowledge: true, maintenanceSkills: true, childParticipation: true, riskAssessment: true, infectionControl: true },
    { id: "tr-002", staffId: "staff-tom", staffName: "Tom Richards", environmentalAwareness: true, healthSafetyKnowledge: true, maintenanceSkills: true, childParticipation: true, riskAssessment: true, infectionControl: false },
    { id: "tr-003", staffId: "staff-lisa", staffName: "Lisa Williams", environmentalAwareness: true, healthSafetyKnowledge: true, maintenanceSkills: false, childParticipation: true, riskAssessment: true, infectionControl: true },
    { id: "tr-004", staffId: "staff-darren", staffName: "Darren Laville", environmentalAwareness: true, healthSafetyKnowledge: true, maintenanceSkills: true, childParticipation: true, riskAssessment: true, infectionControl: true },
  ];

  return { records, policy, training };
}

// ── GET Handler ──────────────────────────────────────────────────────────

export async function GET() {
  const { records, policy, training } = generateDemoData();

  const result = generateEnvironmentIntelligence(
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
        engine: "environment-intelligence",
        version: "1.0.0",
      },
    },
  });
}
