// ══════════════════════════════════════════════════════════════════════════════
// API: /api/missing-from-care
//
// Missing From Care Intelligence (4-Evaluator Pattern)
//
// GET — Returns missing from care metrics with Oak House demo data
//       12 records across Alex/Jordan/Morgan, all 8 categories.
//       Returns: { data: { ...result, meta: { generatedAt, engine, version } } }
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generateMissingFromCareIntelligence,
} from "@/lib/missing-from-care";
import type {
  MissingFromCareRecord,
  MissingFromCarePolicy,
  StaffMissingFromCareTraining,
} from "@/lib/missing-from-care";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

function generateDemoData(): {
  records: MissingFromCareRecord[];
  policy: MissingFromCarePolicy;
  training: StaffMissingFromCareTraining[];
} {
  const records: MissingFromCareRecord[] = [
    // Alex — 4 records, mixed categories
    { id: "mfc-001", homeId: "home-oak", date: "2026-02-10", childId: "child-alex", childName: "Alex", category: "missing_episode", outcome: "resolved_safely", policeNotifiedTimely: true, returnInterviewCompleted: true, riskAssessmentUpdated: true, preventionPlanReviewed: true, documentationComplete: true, timelyRecording: true },
    { id: "mfc-002", homeId: "home-oak", date: "2026-03-15", childId: "child-alex", childName: "Alex", category: "return_interview", outcome: "resolved_safely", policeNotifiedTimely: true, returnInterviewCompleted: true, riskAssessmentUpdated: true, preventionPlanReviewed: true, documentationComplete: true, timelyRecording: true },
    { id: "mfc-003", homeId: "home-oak", date: "2026-04-02", childId: "child-alex", childName: "Alex", category: "risk_assessment", outcome: "resolved_with_concern", policeNotifiedTimely: true, returnInterviewCompleted: true, riskAssessmentUpdated: true, preventionPlanReviewed: false, documentationComplete: true, timelyRecording: true },
    { id: "mfc-004", homeId: "home-oak", date: "2026-05-01", childId: "child-alex", childName: "Alex", category: "prevention_plan", outcome: "ongoing_monitoring", policeNotifiedTimely: true, returnInterviewCompleted: true, riskAssessmentUpdated: true, preventionPlanReviewed: true, documentationComplete: true, timelyRecording: false },

    // Jordan — 4 records, some gaps
    { id: "mfc-005", homeId: "home-oak", date: "2026-02-20", childId: "child-jordan", childName: "Jordan", category: "absent_episode", outcome: "resolved_safely", policeNotifiedTimely: true, returnInterviewCompleted: true, riskAssessmentUpdated: true, preventionPlanReviewed: true, documentationComplete: true, timelyRecording: true },
    { id: "mfc-006", homeId: "home-oak", date: "2026-03-18", childId: "child-jordan", childName: "Jordan", category: "police_notification", outcome: "resolved_safely", policeNotifiedTimely: true, returnInterviewCompleted: true, riskAssessmentUpdated: false, preventionPlanReviewed: true, documentationComplete: false, timelyRecording: true },
    { id: "mfc-007", homeId: "home-oak", date: "2026-04-10", childId: "child-jordan", childName: "Jordan", category: "pattern_analysis", outcome: "ongoing_monitoring", policeNotifiedTimely: false, returnInterviewCompleted: true, riskAssessmentUpdated: true, preventionPlanReviewed: true, documentationComplete: true, timelyRecording: true },
    { id: "mfc-008", homeId: "home-oak", date: "2026-05-05", childId: "child-jordan", childName: "Jordan", category: "debrief_session", outcome: "resolved_safely", policeNotifiedTimely: true, returnInterviewCompleted: true, riskAssessmentUpdated: true, preventionPlanReviewed: true, documentationComplete: true, timelyRecording: true },

    // Morgan — 4 records, newer
    { id: "mfc-009", homeId: "home-oak", date: "2026-03-22", childId: "child-morgan", childName: "Morgan", category: "missing_episode", outcome: "escalated", policeNotifiedTimely: true, returnInterviewCompleted: true, riskAssessmentUpdated: true, preventionPlanReviewed: true, documentationComplete: true, timelyRecording: true },
    { id: "mfc-010", homeId: "home-oak", date: "2026-04-15", childId: "child-morgan", childName: "Morgan", category: "return_interview", outcome: "resolved_safely", policeNotifiedTimely: true, returnInterviewCompleted: false, riskAssessmentUpdated: true, preventionPlanReviewed: true, documentationComplete: true, timelyRecording: false },
    { id: "mfc-011", homeId: "home-oak", date: "2026-05-02", childId: "child-morgan", childName: "Morgan", category: "risk_assessment", outcome: "resolved_with_concern", policeNotifiedTimely: true, returnInterviewCompleted: true, riskAssessmentUpdated: false, preventionPlanReviewed: false, documentationComplete: true, timelyRecording: true },
    { id: "mfc-012", homeId: "home-oak", date: "2026-05-14", childId: "child-morgan", childName: "Morgan", category: "prevention_plan", outcome: "not_applicable", policeNotifiedTimely: true, returnInterviewCompleted: true, riskAssessmentUpdated: true, preventionPlanReviewed: true, documentationComplete: false, timelyRecording: true },
  ];

  const policy: MissingFromCarePolicy = {
    missingPersonsPolicy: true,
    policeNotificationProcedure: true,
    returnInterviewFramework: true,
    riskAssessmentPolicy: true,
    preventionStrategyPolicy: true,
    debriefProcedure: true,
    patternAnalysisPolicy: true,
  };

  const training: StaffMissingFromCareTraining[] = [
    { staffId: "staff-sarah", missingPersonsResponse: true, returnInterviewConduct: true, riskAssessmentSkills: true, policeNotificationProcess: true, patternRecognition: true, preventionPlanning: true },
    { staffId: "staff-tom", missingPersonsResponse: true, returnInterviewConduct: true, riskAssessmentSkills: true, policeNotificationProcess: false, patternRecognition: false, preventionPlanning: true },
    { staffId: "staff-lisa", missingPersonsResponse: true, returnInterviewConduct: true, riskAssessmentSkills: false, policeNotificationProcess: true, patternRecognition: true, preventionPlanning: false },
    { staffId: "staff-darren", missingPersonsResponse: true, returnInterviewConduct: true, riskAssessmentSkills: true, policeNotificationProcess: true, patternRecognition: true, preventionPlanning: true },
  ];

  return { records, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { records, policy, training } = generateDemoData();

  const result = generateMissingFromCareIntelligence(
    records,
    policy,
    training,
    "home-oak",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: { generatedAt: new Date().toISOString(), engine: "missing-from-care", version: "2.0.0" },
    },
  });
}
