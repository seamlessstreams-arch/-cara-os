import { NextResponse } from "next/server";
import {
  generateTrainingIntelligence,
} from "@/lib/training";
import type { TrainingRecord, TrainingPolicy, StaffTrainingCompetency } from "@/lib/training";

// ── Demo Data ──────────────────────────────────────────────────────────────

const demoRecords: TrainingRecord[] = [
  // Sarah — excellent training record
  { id: "tr-1", homeId: "oak-house", date: "2026-02-05", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "safeguarding", outcome: "completed", completedOnTime: true, assessmentPassed: true, practicalComponentDone: true, certificateObtained: true, documentationComplete: true, timelyRecording: true },
  { id: "tr-2", homeId: "oak-house", date: "2026-02-20", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "first_aid", outcome: "completed", completedOnTime: true, assessmentPassed: true, practicalComponentDone: true, certificateObtained: true, documentationComplete: true, timelyRecording: true },
  { id: "tr-3", homeId: "oak-house", date: "2026-03-10", staffId: "staff-sarah", staffName: "Sarah Johnson", category: "restraint_techniques", outcome: "completed", completedOnTime: true, assessmentPassed: true, practicalComponentDone: true, certificateObtained: true, documentationComplete: true, timelyRecording: false },

  // Tom — some gaps
  { id: "tr-4", homeId: "oak-house", date: "2026-02-15", staffId: "staff-tom", staffName: "Tom Richards", category: "medication_management", outcome: "completed", completedOnTime: true, assessmentPassed: true, practicalComponentDone: false, certificateObtained: true, documentationComplete: true, timelyRecording: true },
  { id: "tr-5", homeId: "oak-house", date: "2026-03-05", staffId: "staff-tom", staffName: "Tom Richards", category: "fire_safety", outcome: "completed", completedOnTime: true, assessmentPassed: false, practicalComponentDone: true, certificateObtained: true, documentationComplete: false, timelyRecording: true },
  { id: "tr-6", homeId: "oak-house", date: "2026-04-01", staffId: "staff-tom", staffName: "Tom Richards", category: "health_and_safety", outcome: "in_progress", completedOnTime: false, assessmentPassed: false, practicalComponentDone: false, certificateObtained: false, documentationComplete: true, timelyRecording: true },

  // Lisa — mixed results
  { id: "tr-7", homeId: "oak-house", date: "2026-02-28", staffId: "staff-lisa", staffName: "Lisa Williams", category: "equality_diversity", outcome: "completed", completedOnTime: true, assessmentPassed: true, practicalComponentDone: true, certificateObtained: true, documentationComplete: true, timelyRecording: true },
  { id: "tr-8", homeId: "oak-house", date: "2026-03-15", staffId: "staff-lisa", staffName: "Lisa Williams", category: "therapeutic_care", outcome: "completed", completedOnTime: true, assessmentPassed: true, practicalComponentDone: true, certificateObtained: false, documentationComplete: true, timelyRecording: false },
  { id: "tr-9", homeId: "oak-house", date: "2026-04-10", staffId: "staff-lisa", staffName: "Lisa Williams", category: "safeguarding", outcome: "completed", completedOnTime: true, assessmentPassed: true, practicalComponentDone: false, certificateObtained: true, documentationComplete: false, timelyRecording: true },

  // Darren — strong overall
  { id: "tr-10", homeId: "oak-house", date: "2026-01-20", staffId: "staff-darren", staffName: "Darren Laville", category: "safeguarding", outcome: "completed", completedOnTime: true, assessmentPassed: true, practicalComponentDone: true, certificateObtained: true, documentationComplete: true, timelyRecording: true },
  { id: "tr-11", homeId: "oak-house", date: "2026-03-01", staffId: "staff-darren", staffName: "Darren Laville", category: "restraint_techniques", outcome: "completed", completedOnTime: true, assessmentPassed: true, practicalComponentDone: true, certificateObtained: true, documentationComplete: true, timelyRecording: true },
  { id: "tr-12", homeId: "oak-house", date: "2026-04-15", staffId: "staff-darren", staffName: "Darren Laville", category: "medication_management", outcome: "completed", completedOnTime: true, assessmentPassed: true, practicalComponentDone: true, certificateObtained: true, documentationComplete: true, timelyRecording: true },
];

const demoPolicy: TrainingPolicy = {
  mandatoryTrainingPolicy: true,
  trainingNeedsAnalysis: true,
  refresherSchedulePolicy: true,
  inductionTrainingFramework: true,
  trainingRecordKeeping: true,
  externalTrainingApproval: true,
  trainingBudgetPolicy: true,
};

const demoStaff: StaffTrainingCompetency[] = [
  { staffId: "staff-sarah", trainingNeedsAssessment: true, deliverySkills: true, complianceMonitoring: true, recordManagement: true, qualityAssurance: true, budgetManagement: true },
  { staffId: "staff-tom", trainingNeedsAssessment: true, deliverySkills: true, complianceMonitoring: true, recordManagement: false, qualityAssurance: false, budgetManagement: true },
  { staffId: "staff-lisa", trainingNeedsAssessment: true, deliverySkills: true, complianceMonitoring: false, recordManagement: true, qualityAssurance: true, budgetManagement: false },
  { staffId: "staff-darren", trainingNeedsAssessment: true, deliverySkills: true, complianceMonitoring: true, recordManagement: true, qualityAssurance: true, budgetManagement: true },
];

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateTrainingIntelligence(
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
      meta: { generatedAt: new Date().toISOString(), engine: "training", version: "2.0.0" },
    },
  });
}
