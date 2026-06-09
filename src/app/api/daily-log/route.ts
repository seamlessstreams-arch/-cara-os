import { NextRequest, NextResponse } from "next/server";
import { createDailyLog, type CreateDailyLogInput } from "@/lib/daily-log/daily-log-orchestrator";
import { persistRecord, persistAuditEntry } from "@/lib/orchestrator/record-persistence";

export const dynamic = "force-dynamic";
import {
  generateDailyLogIntelligence,
} from "@/lib/daily-log";
import type {
  DailyLogRecord,
  DailyLogPolicy,
  StaffDailyLogTraining,
} from "@/lib/daily-log";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

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

// ── POST: Create a daily log — Enter Once, Use Everywhere ───────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const required = ["child_id", "date", "mood", "key_events"];
  const missing = required.filter((f) => !body[f]);
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing: ${missing.join(", ")}`, fields: missing }, { status: 400 });
  }

  const input: CreateDailyLogInput = {
    child_id: body.child_id as string,
    date: body.date as string,
    staff_id: (body.staff_id as string) || "staff_darren",
    mood: body.mood as CreateDailyLogInput["mood"],
    engagement: Number(body.engagement) || 3,
    key_events: (body.key_events as string).trim(),
    concerns: ((body.concerns as string) || "").trim(),
    follow_up_needed: body.follow_up_needed === true,
    home_id: (body.home_id as string) || "home_oak",
    shift: body.shift as CreateDailyLogInput["shift"],
  };

  try {
    const result = createDailyLog(input);

    // ── Durable write-through (gated — no-op unless Supabase is configured) ──
    const log = result.log as Record<string, unknown>;
    let persisted = false;
    try {
      const [rec] = await Promise.all([
        persistRecord({
          ...log,
          reference: (log.id as string), // daily logs have no separate reference
          record_type: "daily_log",
          title: `Daily log — ${input.date}`,
          description: input.key_events,
          severity: null,
          data: { mood: log.mood, engagement_level: log.engagement_level, concerns: log.concerns, shift: log.shift, follow_up_needed: log.follow_up_needed },
        }),
        persistAuditEntry(result.audit_entry as Record<string, unknown>, "daily_log"),
      ]);
      persisted = rec.persisted;
    } catch { /* best-effort */ }

    return NextResponse.json({
      data: result.log,
      linked_updates: result.linked_updates,
      alerts: result.alerts,
      meta: { persisted },
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create daily log", detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
