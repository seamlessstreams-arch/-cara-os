import { NextResponse } from "next/server";
import {
  generateInspectionIntelligence,
} from "@/lib/inspection";
import type { InspectionRecord, InspectionPolicy, StaffInspectionTraining } from "@/lib/inspection";

// ── Demo Data ──────────────────────────────────────────────────────────────

const demoRecords: InspectionRecord[] = [
  // Alex — strong evidence and preparation
  { id: "insp-1", homeId: "oak-house", date: "2026-02-05", childId: "child-alex", childName: "Alex", category: "overall_effectiveness", outcome: "good", evidenceDocumented: true, actionPlanCreated: true, staffPrepared: true, childViewIncluded: true, documentationComplete: true, timelyRecording: true },
  { id: "insp-2", homeId: "oak-house", date: "2026-03-12", childId: "child-alex", childName: "Alex", category: "quality_of_care", outcome: "outstanding", evidenceDocumented: true, actionPlanCreated: true, staffPrepared: true, childViewIncluded: true, documentationComplete: true, timelyRecording: true },
  { id: "insp-3", homeId: "oak-house", date: "2026-04-08", childId: "child-alex", childName: "Alex", category: "safety_of_children", outcome: "good", evidenceDocumented: true, actionPlanCreated: true, staffPrepared: true, childViewIncluded: true, documentationComplete: true, timelyRecording: false },
  { id: "insp-4", homeId: "oak-house", date: "2026-05-01", childId: "child-alex", childName: "Alex", category: "leadership_management", outcome: "good", evidenceDocumented: true, actionPlanCreated: true, staffPrepared: true, childViewIncluded: false, documentationComplete: true, timelyRecording: true },

  // Jordan — some gaps in process
  { id: "insp-5", homeId: "oak-house", date: "2026-02-20", childId: "child-jordan", childName: "Jordan", category: "outcomes_for_children", outcome: "good", evidenceDocumented: true, actionPlanCreated: true, staffPrepared: true, childViewIncluded: true, documentationComplete: true, timelyRecording: true },
  { id: "insp-6", homeId: "oak-house", date: "2026-03-18", childId: "child-jordan", childName: "Jordan", category: "education_achievement", outcome: "requires_improvement", evidenceDocumented: true, actionPlanCreated: false, staffPrepared: true, childViewIncluded: true, documentationComplete: false, timelyRecording: true },
  { id: "insp-7", homeId: "oak-house", date: "2026-04-22", childId: "child-jordan", childName: "Jordan", category: "health_wellbeing", outcome: "good", evidenceDocumented: false, actionPlanCreated: true, staffPrepared: true, childViewIncluded: true, documentationComplete: true, timelyRecording: true },
  { id: "insp-8", homeId: "oak-house", date: "2026-05-10", childId: "child-jordan", childName: "Jordan", category: "transitions_planning", outcome: "good", evidenceDocumented: true, actionPlanCreated: true, staffPrepared: true, childViewIncluded: true, documentationComplete: true, timelyRecording: true },

  // Morgan — newer, fewer records
  { id: "insp-9", homeId: "oak-house", date: "2026-03-25", childId: "child-morgan", childName: "Morgan", category: "overall_effectiveness", outcome: "good", evidenceDocumented: true, actionPlanCreated: true, staffPrepared: true, childViewIncluded: true, documentationComplete: true, timelyRecording: true },
  { id: "insp-10", homeId: "oak-house", date: "2026-04-15", childId: "child-morgan", childName: "Morgan", category: "quality_of_care", outcome: "good", evidenceDocumented: true, actionPlanCreated: true, staffPrepared: false, childViewIncluded: true, documentationComplete: true, timelyRecording: false },
  { id: "insp-11", homeId: "oak-house", date: "2026-05-02", childId: "child-morgan", childName: "Morgan", category: "safety_of_children", outcome: "good", evidenceDocumented: true, actionPlanCreated: false, staffPrepared: true, childViewIncluded: true, documentationComplete: true, timelyRecording: true },
  { id: "insp-12", homeId: "oak-house", date: "2026-05-15", childId: "child-morgan", childName: "Morgan", category: "leadership_management", outcome: "outstanding", evidenceDocumented: true, actionPlanCreated: true, staffPrepared: true, childViewIncluded: true, documentationComplete: false, timelyRecording: true },
];

const demoPolicy: InspectionPolicy = {
  inspectionReadinessPolicy: true,
  selfAssessmentFramework: true,
  actionPlanningProcedure: true,
  evidenceCollectionPolicy: true,
  notificationProtocol: true,
  staffPreparationGuidance: true,
  continuousImprovementPolicy: true,
};

const demoStaff: StaffInspectionTraining[] = [
  { staffId: "staff-sarah", inspectionReadiness: true, evidencePresentation: true, regulatoryKnowledge: true, selfAssessment: true, actionPlanDevelopment: true, qualityAssurance: true },
  { staffId: "staff-tom", inspectionReadiness: true, evidencePresentation: true, regulatoryKnowledge: true, selfAssessment: false, actionPlanDevelopment: false, qualityAssurance: true },
  { staffId: "staff-lisa", inspectionReadiness: true, evidencePresentation: true, regulatoryKnowledge: false, selfAssessment: true, actionPlanDevelopment: true, qualityAssurance: false },
  { staffId: "staff-darren", inspectionReadiness: true, evidencePresentation: true, regulatoryKnowledge: true, selfAssessment: true, actionPlanDevelopment: true, qualityAssurance: true },
];

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateInspectionIntelligence(
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
      meta: { generatedAt: new Date().toISOString(), engine: "inspection", version: "2.0.0" },
    },
  });
}
