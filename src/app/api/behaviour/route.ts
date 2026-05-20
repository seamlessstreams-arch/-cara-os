import { NextResponse } from "next/server";
import {
  generateBehaviourIntelligence,
} from "@/lib/behaviour";
import type { BehaviourRecord, BehaviourPolicy, StaffBehaviourTraining } from "@/lib/behaviour";

// ── Demo Data ──────────────────────────────────────────────────────────────

const demoRecords: BehaviourRecord[] = [
  // Alex — strong positive behaviour approach
  { id: "beh-1", childId: "child-alex", childName: "Alex", recordDate: "2026-02-10", category: "positive_reinforcement", positiveApproachUsed: true, deEscalationAttempted: true, childViewCaptured: true, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },
  { id: "beh-2", childId: "child-alex", childName: "Alex", recordDate: "2026-03-05", category: "de_escalation", positiveApproachUsed: true, deEscalationAttempted: true, childViewCaptured: true, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },
  { id: "beh-3", childId: "child-alex", childName: "Alex", recordDate: "2026-03-22", category: "behaviour_support_plan", positiveApproachUsed: true, deEscalationAttempted: true, childViewCaptured: true, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },
  { id: "beh-4", childId: "child-alex", childName: "Alex", recordDate: "2026-04-15", category: "restorative_practice", positiveApproachUsed: true, deEscalationAttempted: true, childViewCaptured: false, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },

  // Jordan — mixed results, some gaps
  { id: "beh-5", childId: "child-jordan", childName: "Jordan", recordDate: "2026-02-18", category: "de_escalation", positiveApproachUsed: true, deEscalationAttempted: true, childViewCaptured: true, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },
  { id: "beh-6", childId: "child-jordan", childName: "Jordan", recordDate: "2026-03-10", category: "risk_assessment", positiveApproachUsed: true, deEscalationAttempted: true, childViewCaptured: false, supportPlanFollowed: false, documentationComplete: true, timelyRecording: false },
  { id: "beh-7", childId: "child-jordan", childName: "Jordan", recordDate: "2026-04-02", category: "therapeutic_intervention", positiveApproachUsed: false, deEscalationAttempted: true, childViewCaptured: true, supportPlanFollowed: true, documentationComplete: false, timelyRecording: true },
  { id: "beh-8", childId: "child-jordan", childName: "Jordan", recordDate: "2026-04-25", category: "child_consultation", positiveApproachUsed: true, deEscalationAttempted: false, childViewCaptured: true, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },

  // Morgan — newer, fewer records
  { id: "beh-9", childId: "child-morgan", childName: "Morgan", recordDate: "2026-03-15", category: "positive_reinforcement", positiveApproachUsed: true, deEscalationAttempted: true, childViewCaptured: true, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },
  { id: "beh-10", childId: "child-morgan", childName: "Morgan", recordDate: "2026-04-08", category: "staff_debriefing", positiveApproachUsed: true, deEscalationAttempted: true, childViewCaptured: true, supportPlanFollowed: false, documentationComplete: true, timelyRecording: false },
  { id: "beh-11", childId: "child-morgan", childName: "Morgan", recordDate: "2026-04-28", category: "behaviour_support_plan", positiveApproachUsed: true, deEscalationAttempted: true, childViewCaptured: false, supportPlanFollowed: true, documentationComplete: true, timelyRecording: true },
  { id: "beh-12", childId: "child-morgan", childName: "Morgan", recordDate: "2026-05-10", category: "restorative_practice", positiveApproachUsed: false, deEscalationAttempted: true, childViewCaptured: true, supportPlanFollowed: true, documentationComplete: false, timelyRecording: true },
];

const demoPolicy: BehaviourPolicy = {
  id: "pol-beh-1",
  behaviourManagementPolicy: true,
  positiveReinforcementFramework: true,
  deEscalationProtocol: true,
  restraintReductionPlan: true,
  childParticipationGuidance: true,
  debriefingProcedure: true,
  reviewSchedule: true,
};

const demoStaff: StaffBehaviourTraining[] = [
  { id: "t-1", staffId: "staff-sarah", staffName: "Sarah Johnson", positiveApproaches: true, deEscalationSkills: true, traumaInformedPractice: true, restorativePractice: true, riskAssessment: true, recordKeeping: true },
  { id: "t-2", staffId: "staff-tom", staffName: "Tom Richards", positiveApproaches: true, deEscalationSkills: true, traumaInformedPractice: true, restorativePractice: false, riskAssessment: false, recordKeeping: true },
  { id: "t-3", staffId: "staff-lisa", staffName: "Lisa Williams", positiveApproaches: true, deEscalationSkills: true, traumaInformedPractice: false, restorativePractice: true, riskAssessment: true, recordKeeping: false },
  { id: "t-4", staffId: "staff-darren", staffName: "Darren Laville", positiveApproaches: true, deEscalationSkills: true, traumaInformedPractice: true, restorativePractice: true, riskAssessment: true, recordKeeping: true },
];

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateBehaviourIntelligence(
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
      meta: { generatedAt: new Date().toISOString(), engine: "behaviour", version: "2.0.0" },
    },
  });
}
