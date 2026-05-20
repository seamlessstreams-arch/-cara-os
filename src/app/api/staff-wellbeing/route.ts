import { NextResponse } from "next/server";
import {
  generateStaffWellbeingIntelligence,
} from "@/lib/staff-wellbeing";
import type { StaffWellbeingRecord, StaffWellbeingPolicy, StaffWellbeingTraining } from "@/lib/staff-wellbeing";

// ── Demo Data ──────────────────────────────────────────────────────────────

const demoRecords: StaffWellbeingRecord[] = [
  // Sarah Johnson — well-supported, strong supervision
  { id: "sw-1", homeId: "oak-house", date: "2026-02-10", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "supervision_support", outcome: "thriving", supervisionReceived: true, wellbeingChecked: true, debriefOffered: true, supportAccessed: true, documentationComplete: true, timelyRecording: true },
  { id: "sw-2", homeId: "oak-house", date: "2026-03-14", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "emotional_wellbeing", outcome: "thriving", supervisionReceived: true, wellbeingChecked: true, debriefOffered: true, supportAccessed: true, documentationComplete: true, timelyRecording: true },
  { id: "sw-3", homeId: "oak-house", date: "2026-04-18", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "work_life_balance", outcome: "managing", supervisionReceived: true, wellbeingChecked: true, debriefOffered: true, supportAccessed: false, documentationComplete: true, timelyRecording: true },

  // Tom Richards — some gaps in support access
  { id: "sw-4", homeId: "oak-house", date: "2026-02-20", staffId: "staff-tom", staffName: "Tom Richards", category: "workload_management", outcome: "managing", supervisionReceived: true, wellbeingChecked: true, debriefOffered: false, supportAccessed: false, documentationComplete: true, timelyRecording: true },
  { id: "sw-5", homeId: "oak-house", date: "2026-03-22", staffId: "staff-tom", staffName: "Tom Richards", category: "resilience_support", outcome: "struggling", supervisionReceived: true, wellbeingChecked: false, debriefOffered: true, supportAccessed: true, documentationComplete: false, timelyRecording: true },
  { id: "sw-6", homeId: "oak-house", date: "2026-05-01", staffId: "staff-tom", staffName: "Tom Richards", category: "team_cohesion", outcome: "managing", supervisionReceived: true, wellbeingChecked: true, debriefOffered: true, supportAccessed: true, documentationComplete: true, timelyRecording: false },

  // Lisa Williams — newer, fewer records, good engagement
  { id: "sw-7", homeId: "oak-house", date: "2026-03-05", staffId: "staff-lisa", staffName: "Lisa Williams", category: "professional_development", outcome: "thriving", supervisionReceived: true, wellbeingChecked: true, debriefOffered: true, supportAccessed: true, documentationComplete: true, timelyRecording: true },
  { id: "sw-8", homeId: "oak-house", date: "2026-04-10", staffId: "staff-lisa", staffName: "Lisa Williams", category: "recognition_reward", outcome: "managing", supervisionReceived: true, wellbeingChecked: true, debriefOffered: false, supportAccessed: true, documentationComplete: true, timelyRecording: true },
  { id: "sw-9", homeId: "oak-house", date: "2026-05-12", staffId: "staff-lisa", staffName: "Lisa Williams", category: "emotional_wellbeing", outcome: "thriving", supervisionReceived: true, wellbeingChecked: true, debriefOffered: true, supportAccessed: true, documentationComplete: true, timelyRecording: false },

  // Darren Laville — RM, strong across the board
  { id: "sw-10", homeId: "oak-house", date: "2026-02-15", staffId: "staff-darren", staffName: "Darren Laville", category: "supervision_support", outcome: "thriving", supervisionReceived: true, wellbeingChecked: true, debriefOffered: true, supportAccessed: true, documentationComplete: true, timelyRecording: true },
  { id: "sw-11", homeId: "oak-house", date: "2026-03-28", staffId: "staff-darren", staffName: "Darren Laville", category: "workload_management", outcome: "managing", supervisionReceived: true, wellbeingChecked: true, debriefOffered: true, supportAccessed: true, documentationComplete: true, timelyRecording: true },
  { id: "sw-12", homeId: "oak-house", date: "2026-05-08", staffId: "staff-darren", staffName: "Darren Laville", category: "team_cohesion", outcome: "thriving", supervisionReceived: true, wellbeingChecked: true, debriefOffered: true, supportAccessed: true, documentationComplete: true, timelyRecording: true },
];

const demoPolicy: StaffWellbeingPolicy = {
  staffWellbeingPolicy: true,
  supervisionFramework: true,
  debriefingProtocol: true,
  employeeAssistanceProgramme: true,
  workloadManagementPolicy: true,
  sicknessAbsencePolicy: true,
  recognitionScheme: true,
};

const demoStaff: StaffWellbeingTraining[] = [
  { staffId: "staff-sarah", supervisionDelivery: true, wellbeingAssessment: true, debriefingSkills: true, stressManagement: true, teamBuilding: true, conflictMediation: true },
  { staffId: "staff-tom", supervisionDelivery: true, wellbeingAssessment: true, debriefingSkills: true, stressManagement: false, teamBuilding: false, conflictMediation: true },
  { staffId: "staff-lisa", supervisionDelivery: true, wellbeingAssessment: true, debriefingSkills: false, stressManagement: true, teamBuilding: true, conflictMediation: false },
  { staffId: "staff-darren", supervisionDelivery: true, wellbeingAssessment: true, debriefingSkills: true, stressManagement: true, teamBuilding: true, conflictMediation: true },
];

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateStaffWellbeingIntelligence(
    demoRecords,
    demoPolicy,
    demoStaff,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: { generatedAt: new Date().toISOString(), engine: "staff-wellbeing", version: "2.0.0" },
    },
  });
}
