import { NextResponse } from "next/server";
import {
  generateKeyWorkingIntelligence,
} from "@/lib/key-working";
import type { KeyWorkingRecord, KeyWorkingPolicy, StaffKeyWorkingTraining } from "@/lib/key-working";

// ── Demo Data ──────────────────────────────────────────────────────────────

const demoRecords: KeyWorkingRecord[] = [
  // Alex — well-engaged, diverse sessions
  { id: "kw-1", homeId: "home-oak", date: "2026-02-05", childId: "child-alex", childName: "Alex", category: "formal_keywork", outcome: "completed", childEngaged: true, childViewRecorded: true, goalsAddressed: true, moodImproved: true, documentationComplete: true, timelyRecording: true },
  { id: "kw-2", homeId: "home-oak", date: "2026-03-12", childId: "child-alex", childName: "Alex", category: "informal_check_in", outcome: "completed", childEngaged: true, childViewRecorded: true, goalsAddressed: true, moodImproved: true, documentationComplete: true, timelyRecording: true },
  { id: "kw-3", homeId: "home-oak", date: "2026-04-08", childId: "child-alex", childName: "Alex", category: "direct_work", outcome: "completed", childEngaged: true, childViewRecorded: true, goalsAddressed: true, moodImproved: true, documentationComplete: true, timelyRecording: false },
  { id: "kw-4", homeId: "home-oak", date: "2026-05-01", childId: "child-alex", childName: "Alex", category: "life_story_work", outcome: "completed", childEngaged: true, childViewRecorded: true, goalsAddressed: true, moodImproved: false, documentationComplete: true, timelyRecording: true },

  // Jordan — some gaps in engagement
  { id: "kw-5", homeId: "home-oak", date: "2026-02-20", childId: "child-jordan", childName: "Jordan", category: "goal_review", outcome: "completed", childEngaged: true, childViewRecorded: true, goalsAddressed: true, moodImproved: true, documentationComplete: true, timelyRecording: true },
  { id: "kw-6", homeId: "home-oak", date: "2026-03-18", childId: "child-jordan", childName: "Jordan", category: "crisis_support", outcome: "partially_completed", childEngaged: true, childViewRecorded: false, goalsAddressed: true, moodImproved: true, documentationComplete: false, timelyRecording: true },
  { id: "kw-7", homeId: "home-oak", date: "2026-04-22", childId: "child-jordan", childName: "Jordan", category: "preparation_session", outcome: "completed", childEngaged: false, childViewRecorded: true, goalsAddressed: true, moodImproved: true, documentationComplete: true, timelyRecording: true },
  { id: "kw-8", homeId: "home-oak", date: "2026-05-10", childId: "child-jordan", childName: "Jordan", category: "celebration_session", outcome: "completed", childEngaged: true, childViewRecorded: true, goalsAddressed: true, moodImproved: true, documentationComplete: true, timelyRecording: true },

  // Morgan — newer, fewer records
  { id: "kw-9", homeId: "home-oak", date: "2026-03-25", childId: "child-morgan", childName: "Morgan", category: "formal_keywork", outcome: "completed", childEngaged: true, childViewRecorded: true, goalsAddressed: true, moodImproved: true, documentationComplete: true, timelyRecording: true },
  { id: "kw-10", homeId: "home-oak", date: "2026-04-15", childId: "child-morgan", childName: "Morgan", category: "informal_check_in", outcome: "child_declined", childEngaged: false, childViewRecorded: false, goalsAddressed: false, moodImproved: false, documentationComplete: true, timelyRecording: false },
  { id: "kw-11", homeId: "home-oak", date: "2026-05-02", childId: "child-morgan", childName: "Morgan", category: "direct_work", outcome: "completed", childEngaged: true, childViewRecorded: true, goalsAddressed: true, moodImproved: true, documentationComplete: true, timelyRecording: true },
  { id: "kw-12", homeId: "home-oak", date: "2026-05-15", childId: "child-morgan", childName: "Morgan", category: "goal_review", outcome: "completed", childEngaged: true, childViewRecorded: true, goalsAddressed: true, moodImproved: true, documentationComplete: false, timelyRecording: true },
];

const demoPolicy: KeyWorkingPolicy = {
  keyWorkingPolicy: true,
  sessionFrequencyGuidance: true,
  childParticipationFramework: true,
  carePlanLinkagePolicy: true,
  supervisionOfKeywork: true,
  keyworkerAllocationPolicy: true,
  recordKeepingStandard: true,
};

const demoStaff: StaffKeyWorkingTraining[] = [
  { staffId: "staff-sarah", relationshipBuilding: true, therapeuticApproaches: true, childVoiceCapture: true, carePlanKnowledge: true, recordKeeping: true, crisisSupport: true },
  { staffId: "staff-tom", relationshipBuilding: true, therapeuticApproaches: true, childVoiceCapture: true, carePlanKnowledge: false, recordKeeping: false, crisisSupport: true },
  { staffId: "staff-lisa", relationshipBuilding: true, therapeuticApproaches: true, childVoiceCapture: false, carePlanKnowledge: true, recordKeeping: true, crisisSupport: false },
  { staffId: "staff-darren", relationshipBuilding: true, therapeuticApproaches: true, childVoiceCapture: true, carePlanKnowledge: true, recordKeeping: true, crisisSupport: true },
];

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateKeyWorkingIntelligence({
    homeId: "home-oak",
    periodStart: "2026-01-01",
    periodEnd: "2026-05-20",
    records: demoRecords,
    policy: demoPolicy,
    staff: demoStaff,
  });

  return NextResponse.json({
    data: {
      ...result,
      meta: { generatedAt: new Date().toISOString(), engine: "key-working", version: "2.0.0" },
    },
  });
}
