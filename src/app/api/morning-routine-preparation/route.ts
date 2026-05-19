import { NextResponse } from "next/server";
import {
  generateMorningRoutinePreparationIntelligence,
  getRoutineElementLabel,
  getCompletionStatusLabel,
  getRatingLabel,
} from "@/lib/morning-routine-preparation";
import type {
  MorningRecord,
  MorningPolicy,
  StaffMorningTraining,
} from "@/lib/morning-routine-preparation";

const DEMO_RECORDS: MorningRecord[] = [
  { id: "mr-1", childId: "child-alex", childName: "Alex", recordDate: "2026-04-01", routineElement: "wake_up", completionStatus: "completed_independently", onTimeForSchool: true, breakfastEaten: true, staffSupported: true, moodPositive: true, documentedInLog: true, parentCarerInformed: true },
  { id: "mr-2", childId: "child-alex", childName: "Alex", recordDate: "2026-04-02", routineElement: "breakfast", completionStatus: "completed_independently", onTimeForSchool: true, breakfastEaten: true, staffSupported: true, moodPositive: true, documentedInLog: true, parentCarerInformed: true },
  { id: "mr-3", childId: "child-alex", childName: "Alex", recordDate: "2026-04-03", routineElement: "uniform_preparation", completionStatus: "completed_with_support", onTimeForSchool: true, breakfastEaten: true, staffSupported: true, moodPositive: true, documentedInLog: true, parentCarerInformed: false },
  { id: "mr-4", childId: "child-jordan", childName: "Jordan", recordDate: "2026-04-01", routineElement: "personal_hygiene", completionStatus: "completed_independently", onTimeForSchool: true, breakfastEaten: true, staffSupported: true, moodPositive: true, documentedInLog: true, parentCarerInformed: true },
  { id: "mr-5", childId: "child-jordan", childName: "Jordan", recordDate: "2026-04-02", routineElement: "bag_packed", completionStatus: "completed_with_support", onTimeForSchool: true, breakfastEaten: true, staffSupported: true, moodPositive: true, documentedInLog: true, parentCarerInformed: true },
  { id: "mr-6", childId: "child-jordan", childName: "Jordan", recordDate: "2026-04-03", routineElement: "emotional_check_in", completionStatus: "completed_independently", onTimeForSchool: false, breakfastEaten: true, staffSupported: true, moodPositive: false, documentedInLog: true, parentCarerInformed: true },
  { id: "mr-7", childId: "child-morgan", childName: "Morgan", recordDate: "2026-04-01", routineElement: "transport_ready", completionStatus: "completed_independently", onTimeForSchool: true, breakfastEaten: true, staffSupported: true, moodPositive: true, documentedInLog: true, parentCarerInformed: true },
  { id: "mr-8", childId: "child-morgan", childName: "Morgan", recordDate: "2026-04-02", routineElement: "medication", completionStatus: "completed_independently", onTimeForSchool: true, breakfastEaten: true, staffSupported: true, moodPositive: true, documentedInLog: true, parentCarerInformed: true },
];

const DEMO_POLICY: MorningPolicy = {
  id: "mp-1",
  morningRoutinePolicy: true,
  breakfastStandards: true,
  schoolReadinessProtocol: true,
  punctualityTracking: true,
  individualRoutinePlans: true,
  staffHandoverProcess: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffMorningTraining[] = [
  { id: "mt-1", staffId: "staff-sarah", staffName: "Sarah Johnson", morningRoutineManagement: true, breakfastNutrition: true, emotionalRegulation: true, timeManagement: true, schoolLiaison: true, handoverPractice: true },
  { id: "mt-2", staffId: "staff-tom", staffName: "Tom Richards", morningRoutineManagement: true, breakfastNutrition: true, emotionalRegulation: true, timeManagement: true, schoolLiaison: true, handoverPractice: true },
  { id: "mt-3", staffId: "staff-lisa", staffName: "Lisa Williams", morningRoutineManagement: true, breakfastNutrition: true, emotionalRegulation: true, timeManagement: true, schoolLiaison: true, handoverPractice: true },
  { id: "mt-4", staffId: "staff-darren", staffName: "Darren Laville", morningRoutineManagement: true, breakfastNutrition: true, emotionalRegulation: true, timeManagement: true, schoolLiaison: true, handoverPractice: true },
];

export async function GET() {
  const result = generateMorningRoutinePreparationIntelligence(
    DEMO_RECORDS, DEMO_POLICY, DEMO_TRAINING, "oak-house", "2026-01-01", "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        routineElementLabels: Object.fromEntries(
          (["wake_up", "personal_hygiene", "breakfast", "medication", "uniform_preparation", "bag_packed", "transport_ready", "emotional_check_in"] as const).map((r) => [r, getRoutineElementLabel(r)]),
        ),
        completionStatusLabels: Object.fromEntries(
          (["completed_independently", "completed_with_support", "partially_completed", "not_completed", "refused"] as const).map((c) => [c, getCompletionStatusLabel(c)]),
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
    records?: MorningRecord[]; policy?: MorningPolicy | null; training?: StaffMorningTraining[];
    homeId?: string; periodStart?: string; periodEnd?: string;
  };

  if (!periodStart || !periodEnd) return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });

  const result = generateMorningRoutinePreparationIntelligence(
    records ?? [], policy ?? null, training ?? [], homeId ?? "unknown", periodStart, periodEnd,
  );

  return NextResponse.json({ data: result });
}
