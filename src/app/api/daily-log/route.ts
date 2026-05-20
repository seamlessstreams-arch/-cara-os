import { NextResponse } from "next/server";
import {
  generateDailyLogIntelligence,
} from "@/lib/daily-log";
import type {
  DailyLogRecord,
  DailyLogPolicy,
  StaffDailyLogTraining,
} from "@/lib/daily-log";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

function generateDemoData(): {
  records: DailyLogRecord[];
  policy: DailyLogPolicy;
  training: StaffDailyLogTraining[];
} {
  const records: DailyLogRecord[] = [
    // Alex — morning and education records
    { id: "rec-001", childId: "child-alex", childName: "Alex", logDate: "2026-03-10", category: "morning_routine", detailedObservation: true, childMoodRecorded: true, keyworkerInformed: true, actionFollowedUp: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-002", childId: "child-alex", childName: "Alex", logDate: "2026-03-12", category: "education_update", detailedObservation: true, childMoodRecorded: true, keyworkerInformed: true, actionFollowedUp: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-003", childId: "child-alex", childName: "Alex", logDate: "2026-03-15", category: "health_observation", detailedObservation: true, childMoodRecorded: false, keyworkerInformed: true, actionFollowedUp: true, documentationComplete: true, timelyRecording: false },
    { id: "rec-004", childId: "child-alex", childName: "Alex", logDate: "2026-03-20", category: "emotional_wellbeing", detailedObservation: true, childMoodRecorded: true, keyworkerInformed: true, actionFollowedUp: true, documentationComplete: true, timelyRecording: true },

    // Jordan — mixed quality
    { id: "rec-005", childId: "child-jordan", childName: "Jordan", logDate: "2026-03-08", category: "morning_routine", detailedObservation: true, childMoodRecorded: true, keyworkerInformed: true, actionFollowedUp: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-006", childId: "child-jordan", childName: "Jordan", logDate: "2026-03-14", category: "social_interaction", detailedObservation: true, childMoodRecorded: true, keyworkerInformed: false, actionFollowedUp: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-007", childId: "child-jordan", childName: "Jordan", logDate: "2026-03-18", category: "evening_routine", detailedObservation: false, childMoodRecorded: true, keyworkerInformed: true, actionFollowedUp: false, documentationComplete: true, timelyRecording: true },
    { id: "rec-008", childId: "child-jordan", childName: "Jordan", logDate: "2026-03-22", category: "significant_event", detailedObservation: true, childMoodRecorded: true, keyworkerInformed: true, actionFollowedUp: true, documentationComplete: true, timelyRecording: true },

    // Morgan — good overall
    { id: "rec-009", childId: "child-morgan", childName: "Morgan", logDate: "2026-03-09", category: "morning_routine", detailedObservation: true, childMoodRecorded: true, keyworkerInformed: true, actionFollowedUp: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-010", childId: "child-morgan", childName: "Morgan", logDate: "2026-03-13", category: "education_update", detailedObservation: true, childMoodRecorded: true, keyworkerInformed: true, actionFollowedUp: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-011", childId: "child-morgan", childName: "Morgan", logDate: "2026-03-17", category: "night_observation", detailedObservation: true, childMoodRecorded: true, keyworkerInformed: true, actionFollowedUp: true, documentationComplete: true, timelyRecording: true },
    { id: "rec-012", childId: "child-morgan", childName: "Morgan", logDate: "2026-03-25", category: "health_observation", detailedObservation: true, childMoodRecorded: false, keyworkerInformed: true, actionFollowedUp: true, documentationComplete: false, timelyRecording: true },
  ];

  const policy: DailyLogPolicy = {
    id: "pol-001",
    dailyRecordingPolicy: true,
    observationFramework: true,
    handoverProtocol: true,
    significantEventsProcedure: true,
    childParticipationGuidance: true,
    qualityAssuranceProcess: true,
    reviewSchedule: true,
  };

  const training: StaffDailyLogTraining[] = [
    { id: "tr-001", staffId: "staff-sarah", staffName: "Sarah Johnson", observationSkills: true, recordKeeping: true, childCommunication: true, safeguardingAwareness: true, handoverPractice: true, reflectiveWriting: true },
    { id: "tr-002", staffId: "staff-tom", staffName: "Tom Richards", observationSkills: true, recordKeeping: true, childCommunication: true, safeguardingAwareness: true, handoverPractice: true, reflectiveWriting: false },
    { id: "tr-003", staffId: "staff-lisa", staffName: "Lisa Williams", observationSkills: true, recordKeeping: true, childCommunication: false, safeguardingAwareness: true, handoverPractice: true, reflectiveWriting: true },
    { id: "tr-004", staffId: "staff-darren", staffName: "Darren Laville", observationSkills: true, recordKeeping: true, childCommunication: true, safeguardingAwareness: true, handoverPractice: true, reflectiveWriting: true },
  ];

  return { records, policy, training };
}

// ── GET Handler ──────────────────────────────────────────────────────────

export async function GET() {
  const { records, policy, training } = generateDemoData();

  const result = generateDailyLogIntelligence(
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
        engine: "daily-log",
        version: "2.0.0",
      },
    },
  });
}
