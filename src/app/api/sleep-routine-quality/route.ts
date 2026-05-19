import { NextResponse } from "next/server";
import {
  generateSleepRoutineQualityIntelligence,
  getSleepQualityLabel,
  getRoutineAdherenceLabel,
  getNightIssueLabel,
  getRatingLabel,
} from "@/lib/sleep-routine-quality";
import type {
  SleepRecord,
  SleepPolicy,
  StaffSleepTraining,
} from "@/lib/sleep-routine-quality";

const DEMO_RECORDS: SleepRecord[] = [
  { id: "sr-1", childId: "child-alex", childName: "Alex", recordDate: "2026-04-01", sleepQuality: "good", hoursSlept: 9, routineAdherence: "fully_followed", nightIssue: "none", windDownCompleted: true, screenFreeBeforeBed: true, environmentComfortable: true, childSatisfied: true, staffNightCheckCompleted: true, recordedTimely: true },
  { id: "sr-2", childId: "child-alex", childName: "Alex", recordDate: "2026-04-02", sleepQuality: "excellent", hoursSlept: 9.5, routineAdherence: "fully_followed", nightIssue: "none", windDownCompleted: true, screenFreeBeforeBed: true, environmentComfortable: true, childSatisfied: true, staffNightCheckCompleted: true, recordedTimely: true },
  { id: "sr-3", childId: "child-alex", childName: "Alex", recordDate: "2026-04-03", sleepQuality: "good", hoursSlept: 8.5, routineAdherence: "mostly_followed", nightIssue: "none", windDownCompleted: true, screenFreeBeforeBed: true, environmentComfortable: true, childSatisfied: true, staffNightCheckCompleted: true, recordedTimely: true },
  { id: "sr-4", childId: "child-jordan", childName: "Jordan", recordDate: "2026-04-01", sleepQuality: "good", hoursSlept: 8, routineAdherence: "fully_followed", nightIssue: "none", windDownCompleted: true, screenFreeBeforeBed: true, environmentComfortable: true, childSatisfied: true, staffNightCheckCompleted: true, recordedTimely: true },
  { id: "sr-5", childId: "child-jordan", childName: "Jordan", recordDate: "2026-04-02", sleepQuality: "excellent", hoursSlept: 9, routineAdherence: "fully_followed", nightIssue: "none", windDownCompleted: true, screenFreeBeforeBed: true, environmentComfortable: true, childSatisfied: true, staffNightCheckCompleted: true, recordedTimely: true },
  { id: "sr-6", childId: "child-jordan", childName: "Jordan", recordDate: "2026-04-03", sleepQuality: "good", hoursSlept: 8.5, routineAdherence: "mostly_followed", nightIssue: "difficulty_settling", windDownCompleted: true, screenFreeBeforeBed: true, environmentComfortable: true, childSatisfied: true, staffNightCheckCompleted: true, recordedTimely: true },
  { id: "sr-7", childId: "child-morgan", childName: "Morgan", recordDate: "2026-04-01", sleepQuality: "excellent", hoursSlept: 9, routineAdherence: "fully_followed", nightIssue: "none", windDownCompleted: true, screenFreeBeforeBed: true, environmentComfortable: true, childSatisfied: true, staffNightCheckCompleted: true, recordedTimely: true },
  { id: "sr-8", childId: "child-morgan", childName: "Morgan", recordDate: "2026-04-02", sleepQuality: "good", hoursSlept: 8, routineAdherence: "fully_followed", nightIssue: "none", windDownCompleted: true, screenFreeBeforeBed: true, environmentComfortable: true, childSatisfied: true, staffNightCheckCompleted: true, recordedTimely: true },
];

const DEMO_POLICY: SleepPolicy = {
  id: "sp-1",
  bedtimeRoutinePolicy: true,
  individualSleepPlans: true,
  screenTimeLimits: true,
  sleepEnvironmentStandards: true,
  nightStaffProtocol: true,
  sleepHygieneEducation: true,
  regularSleepReview: true,
};

const DEMO_TRAINING: StaffSleepTraining[] = [
  { id: "st-1", staffId: "staff-sarah", staffName: "Sarah Johnson", sleepHygiene: true, bedtimeRoutines: true, nightSupport: true, sleepDisorders: true, screenTimeManagement: true, environmentalFactors: true },
  { id: "st-2", staffId: "staff-tom", staffName: "Tom Richards", sleepHygiene: true, bedtimeRoutines: true, nightSupport: true, sleepDisorders: true, screenTimeManagement: true, environmentalFactors: true },
  { id: "st-3", staffId: "staff-lisa", staffName: "Lisa Williams", sleepHygiene: true, bedtimeRoutines: true, nightSupport: true, sleepDisorders: true, screenTimeManagement: true, environmentalFactors: true },
  { id: "st-4", staffId: "staff-darren", staffName: "Darren Laville", sleepHygiene: true, bedtimeRoutines: true, nightSupport: true, sleepDisorders: true, screenTimeManagement: true, environmentalFactors: true },
];

export async function GET() {
  const result = generateSleepRoutineQualityIntelligence(
    DEMO_RECORDS, DEMO_POLICY, DEMO_TRAINING, "oak-house", "2026-01-01", "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        sleepQualityLabels: Object.fromEntries(
          (["excellent", "good", "fair", "poor", "very_poor"] as const).map((s) => [s, getSleepQualityLabel(s)]),
        ),
        routineAdherenceLabels: Object.fromEntries(
          (["fully_followed", "mostly_followed", "partially_followed", "not_followed"] as const).map((r) => [r, getRoutineAdherenceLabel(r)]),
        ),
        nightIssueLabels: Object.fromEntries(
          (["difficulty_settling", "night_waking", "nightmares", "early_waking", "sleepwalking", "refusal_to_sleep", "screen_use", "none"] as const).map((n) => [n, getNightIssueLabel(n)]),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map((r) => [r, getRatingLabel(r)]),
        ),
      },
    },
  });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { records, policy, training, homeId, periodStart, periodEnd } = body as {
    records?: SleepRecord[]; policy?: SleepPolicy | null; training?: StaffSleepTraining[];
    homeId?: string; periodStart?: string; periodEnd?: string;
  };

  if (!periodStart || !periodEnd) return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });

  const result = generateSleepRoutineQualityIntelligence(
    records ?? [], policy ?? null, training ?? [], homeId ?? "unknown", periodStart, periodEnd,
  );

  return NextResponse.json({ data: result });
}
