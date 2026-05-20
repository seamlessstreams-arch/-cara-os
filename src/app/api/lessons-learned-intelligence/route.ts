import { NextResponse } from "next/server";
import { generateLessonsLearnedIntelligence } from "@/lib/lessons-learned";
import type { LessonsLearnedRecord, LessonsLearnedPolicy, StaffLessonsLearnedTraining } from "@/lib/lessons-learned";

const DEMO_RECORDS: LessonsLearnedRecord[] = [
  { id: "ll-001", homeId: "home-oak", date: "2026-01-15", childId: "child-alex", childName: "Alex", category: "incident_debrief", outcome: "fully_embedded", rootCauseIdentified: true, lessonsDocumented: true, staffBriefingCompleted: true, improvementMeasurable: true, documentationComplete: true, timelyRecording: true },
  { id: "ll-002", homeId: "home-oak", date: "2026-02-10", childId: "child-alex", childName: "Alex", category: "complaint_learning", outcome: "fully_embedded", rootCauseIdentified: true, lessonsDocumented: true, staffBriefingCompleted: true, improvementMeasurable: true, documentationComplete: true, timelyRecording: true },
  { id: "ll-003", homeId: "home-oak", date: "2026-03-05", childId: "child-alex", childName: "Alex", category: "safeguarding_review", outcome: "partially_embedded", rootCauseIdentified: true, lessonsDocumented: true, staffBriefingCompleted: true, improvementMeasurable: false, documentationComplete: true, timelyRecording: true },
  { id: "ll-004", homeId: "home-oak", date: "2026-04-01", childId: "child-alex", childName: "Alex", category: "practice_improvement", outcome: "fully_embedded", rootCauseIdentified: true, lessonsDocumented: true, staffBriefingCompleted: true, improvementMeasurable: true, documentationComplete: true, timelyRecording: true },
  { id: "ll-005", homeId: "home-oak", date: "2026-01-20", childId: "child-jordan", childName: "Jordan", category: "policy_update", outcome: "fully_embedded", rootCauseIdentified: true, lessonsDocumented: true, staffBriefingCompleted: true, improvementMeasurable: true, documentationComplete: true, timelyRecording: true },
  { id: "ll-006", homeId: "home-oak", date: "2026-02-15", childId: "child-jordan", childName: "Jordan", category: "training_outcome", outcome: "action_planned", rootCauseIdentified: true, lessonsDocumented: true, staffBriefingCompleted: false, improvementMeasurable: true, documentationComplete: true, timelyRecording: true },
  { id: "ll-007", homeId: "home-oak", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "near_miss_analysis", outcome: "fully_embedded", rootCauseIdentified: true, lessonsDocumented: true, staffBriefingCompleted: true, improvementMeasurable: true, documentationComplete: true, timelyRecording: false },
  { id: "ll-008", homeId: "home-oak", date: "2026-04-10", childId: "child-jordan", childName: "Jordan", category: "external_inspection_learning", outcome: "fully_embedded", rootCauseIdentified: true, lessonsDocumented: true, staffBriefingCompleted: true, improvementMeasurable: true, documentationComplete: true, timelyRecording: true },
  { id: "ll-009", homeId: "home-oak", date: "2026-02-01", childId: "child-morgan", childName: "Morgan", category: "incident_debrief", outcome: "fully_embedded", rootCauseIdentified: true, lessonsDocumented: true, staffBriefingCompleted: true, improvementMeasurable: true, documentationComplete: true, timelyRecording: true },
  { id: "ll-010", homeId: "home-oak", date: "2026-03-15", childId: "child-morgan", childName: "Morgan", category: "complaint_learning", outcome: "partially_embedded", rootCauseIdentified: true, lessonsDocumented: true, staffBriefingCompleted: true, improvementMeasurable: true, documentationComplete: true, timelyRecording: true },
  { id: "ll-011", homeId: "home-oak", date: "2026-04-10", childId: "child-morgan", childName: "Morgan", category: "safeguarding_review", outcome: "fully_embedded", rootCauseIdentified: false, lessonsDocumented: true, staffBriefingCompleted: true, improvementMeasurable: true, documentationComplete: true, timelyRecording: true },
  { id: "ll-012", homeId: "home-oak", date: "2026-05-01", childId: "child-morgan", childName: "Morgan", category: "practice_improvement", outcome: "action_planned", rootCauseIdentified: true, lessonsDocumented: false, staffBriefingCompleted: true, improvementMeasurable: true, documentationComplete: false, timelyRecording: true },
];

const DEMO_POLICY: LessonsLearnedPolicy = {
  lessonsLearnedPolicy: true, postIncidentReviewPolicy: true, complaintLearningPolicy: true,
  practiceImprovementFramework: true, knowledgeSharingPolicy: true, externalLearningIntegration: true, auditAndReviewSchedule: true,
};

const DEMO_STAFF: StaffLessonsLearnedTraining[] = [
  { staffId: "staff-sarah", reflectivePracticeSkills: true, rootCauseAnalysisKnowledge: true, documentationSkills: true, improvementPlanningSkills: true, debriefFacilitationSkills: true, knowledgeSharingAbility: true },
  { staffId: "staff-tom", reflectivePracticeSkills: true, rootCauseAnalysisKnowledge: true, documentationSkills: true, improvementPlanningSkills: true, debriefFacilitationSkills: true, knowledgeSharingAbility: false },
  { staffId: "staff-lisa", reflectivePracticeSkills: true, rootCauseAnalysisKnowledge: true, documentationSkills: true, improvementPlanningSkills: true, debriefFacilitationSkills: false, knowledgeSharingAbility: true },
  { staffId: "staff-darren", reflectivePracticeSkills: true, rootCauseAnalysisKnowledge: true, documentationSkills: true, improvementPlanningSkills: true, debriefFacilitationSkills: true, knowledgeSharingAbility: true },
];

export async function GET() {
  const result = generateLessonsLearnedIntelligence({
    homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-20",
    records: DEMO_RECORDS, policy: DEMO_POLICY, staff: DEMO_STAFF,
  });
  return NextResponse.json({ data: { ...result, meta: { generatedAt: new Date().toISOString(), engine: "lessons-learned-intelligence", version: "2.0.0" } } });
}
