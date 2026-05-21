import { NextResponse } from "next/server";
import {
  generateStaffSupervisionEffectivenessIntelligence,
} from "@/lib/staff-supervision-effectiveness/staff-supervision-effectiveness-intelligence-engine";
import type {
  StaffSupervisionEffectivenessRecord,
  StaffSupervisionEffectivenessPolicy,
  StaffSupervisionEffectivenessTraining,
} from "@/lib/staff-supervision-effectiveness/staff-supervision-effectiveness-intelligence-engine";

const DEMO_RECORDS: StaffSupervisionEffectivenessRecord[] = [
  { id: "sse-001", homeId: "home-oak", date: "2025-01-20", staffId: "staff-sarah", staffName: "Sarah Johnson", supervisorId: "staff-darren", supervisorName: "Darren Laville", category: "formal_supervision", outcome: "highly_effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentationComplete: true, timelyRecording: true },
  { id: "sse-002", homeId: "home-oak", date: "2025-02-18", staffId: "staff-sarah", staffName: "Sarah Johnson", supervisorId: "staff-darren", supervisorName: "Darren Laville", category: "reflective_practice", outcome: "effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentationComplete: true, timelyRecording: true },
  { id: "sse-003", homeId: "home-oak", date: "2025-03-15", staffId: "staff-sarah", staffName: "Sarah Johnson", supervisorId: "staff-darren", supervisorName: "Darren Laville", category: "safeguarding_supervision", outcome: "highly_effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentationComplete: true, timelyRecording: true },
  { id: "sse-004", homeId: "home-oak", date: "2025-04-10", staffId: "staff-sarah", staffName: "Sarah Johnson", supervisorId: "staff-darren", supervisorName: "Darren Laville", category: "case_discussion", outcome: "effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentationComplete: true, timelyRecording: true },
  { id: "sse-005", homeId: "home-oak", date: "2025-01-25", staffId: "staff-tom", staffName: "Tom Richards", supervisorId: "staff-darren", supervisorName: "Darren Laville", category: "formal_supervision", outcome: "effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentationComplete: true, timelyRecording: true },
  { id: "sse-006", homeId: "home-oak", date: "2025-02-22", staffId: "staff-tom", staffName: "Tom Richards", supervisorId: "staff-darren", supervisorName: "Darren Laville", category: "clinical_supervision", outcome: "partially_effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: false, documentationComplete: true, timelyRecording: true },
  { id: "sse-007", homeId: "home-oak", date: "2025-03-20", staffId: "staff-tom", staffName: "Tom Richards", supervisorId: "staff-darren", supervisorName: "Darren Laville", category: "performance_review", outcome: "effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentationComplete: true, timelyRecording: false },
  { id: "sse-008", homeId: "home-oak", date: "2025-04-15", staffId: "staff-tom", staffName: "Tom Richards", supervisorId: "staff-darren", supervisorName: "Darren Laville", category: "peer_supervision", outcome: "effective", safeguardingDiscussed: true, wellbeingChecked: false, actionPointsSet: true, previousActionsReviewed: true, documentationComplete: true, timelyRecording: true },
  { id: "sse-009", homeId: "home-oak", date: "2025-02-05", staffId: "staff-lisa", staffName: "Lisa Williams", supervisorId: "staff-darren", supervisorName: "Darren Laville", category: "formal_supervision", outcome: "highly_effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentationComplete: true, timelyRecording: true },
  { id: "sse-010", homeId: "home-oak", date: "2025-03-08", staffId: "staff-lisa", staffName: "Lisa Williams", supervisorId: "staff-darren", supervisorName: "Darren Laville", category: "management_oversight", outcome: "effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentationComplete: true, timelyRecording: true },
  { id: "sse-011", homeId: "home-oak", date: "2025-04-02", staffId: "staff-lisa", staffName: "Lisa Williams", supervisorId: "staff-darren", supervisorName: "Darren Laville", category: "reflective_practice", outcome: "effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentationComplete: false, timelyRecording: true },
  { id: "sse-012", homeId: "home-oak", date: "2025-05-10", staffId: "staff-lisa", staffName: "Lisa Williams", supervisorId: "staff-darren", supervisorName: "Darren Laville", category: "safeguarding_supervision", outcome: "highly_effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: false, previousActionsReviewed: true, documentationComplete: true, timelyRecording: true },
];

const DEMO_POLICY: StaffSupervisionEffectivenessPolicy = {
  supervisionFramework: true, frequencyStandards: true, safeguardingRequirement: true, reflectivePracticePolicy: true,
  supervisionRecordTemplate: true, escalationProcedure: true, newStarterSupervisionPolicy: true,
};

const DEMO_TRAINING: StaffSupervisionEffectivenessTraining[] = [
  { staffId: "staff-darren", supervisionFacilitationSkills: true, reflectivePracticeKnowledge: true, safeguardingSupervisionSkills: true, performanceManagementSkills: true, mentoringCoachingSkills: true, documentationStandards: true },
  { staffId: "staff-senior-1", supervisionFacilitationSkills: true, reflectivePracticeKnowledge: true, safeguardingSupervisionSkills: true, performanceManagementSkills: true, mentoringCoachingSkills: true, documentationStandards: false },
  { staffId: "staff-senior-2", supervisionFacilitationSkills: true, reflectivePracticeKnowledge: true, safeguardingSupervisionSkills: true, performanceManagementSkills: true, mentoringCoachingSkills: false, documentationStandards: true },
  { staffId: "staff-senior-3", supervisionFacilitationSkills: true, reflectivePracticeKnowledge: true, safeguardingSupervisionSkills: true, performanceManagementSkills: false, mentoringCoachingSkills: true, documentationStandards: true },
];

export async function GET() {
  const result = generateStaffSupervisionEffectivenessIntelligence({
    homeId: "home-oak", periodStart: "2025-01-01", periodEnd: "2025-12-31",
    records: DEMO_RECORDS, policy: DEMO_POLICY, training: DEMO_TRAINING,
  });
  return NextResponse.json({ data: { ...result, meta: { generatedAt: new Date().toISOString(), engine: "staff-supervision-effectiveness-intelligence", version: "2.0.0" } } });
}
