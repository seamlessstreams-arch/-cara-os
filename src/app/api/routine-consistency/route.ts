// ══════════════════════════════════════════════════════════════════════════════
// API: /api/routine-consistency
//
// Routine & Consistency Intelligence
//
// GET  — Returns routine consistency assessment with realistic Oak House data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateRoutineConsistencyIntelligence,
  getPhaseLabel,
  getDisruptionLabel,
  getAdaptationLabel,
} from "@/lib/routine-consistency";
import type {
  RoutineChild,
  RoutineRecord,
  StaffShiftRecord,
  RoutinePreferenceRecord,
} from "@/lib/routine-consistency";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

const DEMO_CHILDREN: RoutineChild[] = [
  {
    id: "child-alex",
    name: "Alex",
    dateOfBirth: "2012-03-15",
    currentPlacement: true,
    agreedBedtime: "21:00",
    agreedWakeTime: "07:00",
    schoolStartTime: "08:45",
    adaptations: ["anxiety_support", "education_need"],
    routinePreferences: ["Music while getting ready", "Toast not cereal for breakfast", "Gaming after homework only"],
  },
  {
    id: "child-jordan",
    name: "Jordan",
    dateOfBirth: "2013-07-22",
    currentPlacement: true,
    agreedBedtime: "20:30",
    agreedWakeTime: "07:15",
    schoolStartTime: "08:45",
    adaptations: ["sensory_need"],
    routinePreferences: ["Quiet time before bed", "Dimmed lights in morning", "Phone charging downstairs at night"],
  },
  {
    id: "child-morgan",
    name: "Morgan",
    dateOfBirth: "2010-12-01",
    currentPlacement: true,
    agreedBedtime: "21:30",
    agreedWakeTime: "07:00",
    schoolStartTime: "08:30",
    adaptations: ["cultural_religious", "sleep_difficulty"],
    routinePreferences: ["Prayer time before bed", "Later wake on Fridays after Isha", "Own alarm clock"],
  },
];

// Helper
function rec(
  overrides: Partial<RoutineRecord> & { id: string; date: string; childId: string; phase: RoutineRecord["phase"] },
): RoutineRecord {
  return {
    quality: "good",
    staffOnDuty: ["staff-sarah"],
    startedOnTime: true,
    completedOnTime: true,
    childCooperated: true,
    childMood: "positive",
    adaptationsUsed: [],
    disruptions: [],
    ...overrides,
  };
}

const DEMO_RECORDS: RoutineRecord[] = [
  // ── Week 1: January 13-17 ──────────────────────────────────────────────
  // Monday - Excellent start to term
  rec({ id: "rr-001", date: "2026-01-13", childId: "child-alex", phase: "morning", quality: "excellent", adaptationsUsed: ["anxiety_support"], notes: "Music on as Alex gets ready — settled and calm" }),
  rec({ id: "rr-002", date: "2026-01-13", childId: "child-alex", phase: "school_run", quality: "good" }),
  rec({ id: "rr-003", date: "2026-01-13", childId: "child-alex", phase: "after_school", quality: "good", adaptationsUsed: ["education_need"], notes: "Homework completed with staff support before gaming" }),
  rec({ id: "rr-004", date: "2026-01-13", childId: "child-alex", phase: "evening", quality: "excellent", staffOnDuty: ["staff-lisa"] }),
  rec({ id: "rr-005", date: "2026-01-13", childId: "child-alex", phase: "bedtime", quality: "good", staffOnDuty: ["staff-lisa"] }),

  rec({ id: "rr-006", date: "2026-01-13", childId: "child-jordan", phase: "morning", quality: "good", adaptationsUsed: ["sensory_need"], notes: "Lights dimmed, quiet start — Jordan calm" }),
  rec({ id: "rr-007", date: "2026-01-13", childId: "child-jordan", phase: "school_run", quality: "good" }),
  rec({ id: "rr-008", date: "2026-01-13", childId: "child-jordan", phase: "after_school", quality: "good" }),
  rec({ id: "rr-009", date: "2026-01-13", childId: "child-jordan", phase: "evening", quality: "excellent", staffOnDuty: ["staff-lisa"] }),
  rec({ id: "rr-010", date: "2026-01-13", childId: "child-jordan", phase: "bedtime", quality: "excellent", adaptationsUsed: ["sensory_need"], staffOnDuty: ["staff-lisa"], notes: "Reading lamp, quiet wind-down — asleep by 20:40" }),

  rec({ id: "rr-011", date: "2026-01-13", childId: "child-morgan", phase: "morning", quality: "excellent" }),
  rec({ id: "rr-012", date: "2026-01-13", childId: "child-morgan", phase: "school_run", quality: "excellent" }),
  rec({ id: "rr-013", date: "2026-01-13", childId: "child-morgan", phase: "after_school", quality: "good" }),
  rec({ id: "rr-014", date: "2026-01-13", childId: "child-morgan", phase: "evening", quality: "excellent", adaptationsUsed: ["cultural_religious"], staffOnDuty: ["staff-lisa"], notes: "Prayer time respected before dinner" }),
  rec({ id: "rr-015", date: "2026-01-13", childId: "child-morgan", phase: "bedtime", quality: "excellent", adaptationsUsed: ["cultural_religious", "sleep_difficulty"], staffOnDuty: ["staff-lisa"], notes: "Isha prayer, then melatonin, settled by 21:45" }),

  // Wednesday - Mixed day for Alex (contact upset)
  rec({ id: "rr-016", date: "2026-01-15", childId: "child-alex", phase: "morning", quality: "good", adaptationsUsed: ["anxiety_support"] }),
  rec({ id: "rr-017", date: "2026-01-15", childId: "child-alex", phase: "school_run", quality: "good" }),
  rec({ id: "rr-018", date: "2026-01-15", childId: "child-alex", phase: "after_school", quality: "mixed", childMood: "anxious", disruptions: ["external_event"], notes: "Phone contact with mum — Alex upset, refused homework" }),
  rec({ id: "rr-019", date: "2026-01-15", childId: "child-alex", phase: "evening", quality: "good", notes: "Staff used PACE — Alex regulated by dinner time" }),
  rec({ id: "rr-020", date: "2026-01-15", childId: "child-alex", phase: "bedtime", quality: "good" }),

  rec({ id: "rr-021", date: "2026-01-15", childId: "child-jordan", phase: "morning", quality: "good", adaptationsUsed: ["sensory_need"] }),
  rec({ id: "rr-022", date: "2026-01-15", childId: "child-jordan", phase: "school_run", quality: "good" }),
  rec({ id: "rr-023", date: "2026-01-15", childId: "child-jordan", phase: "evening", quality: "excellent" }),
  rec({ id: "rr-024", date: "2026-01-15", childId: "child-jordan", phase: "bedtime", quality: "excellent", adaptationsUsed: ["sensory_need"] }),

  rec({ id: "rr-025", date: "2026-01-15", childId: "child-morgan", phase: "morning", quality: "excellent" }),
  rec({ id: "rr-026", date: "2026-01-15", childId: "child-morgan", phase: "school_run", quality: "good" }),
  rec({ id: "rr-027", date: "2026-01-15", childId: "child-morgan", phase: "evening", quality: "excellent", adaptationsUsed: ["cultural_religious"] }),
  rec({ id: "rr-028", date: "2026-01-15", childId: "child-morgan", phase: "bedtime", quality: "good", adaptationsUsed: ["sleep_difficulty"] }),

  // Saturday - Weekend
  rec({ id: "rr-029", date: "2026-01-18", childId: "child-alex", phase: "weekend_morning", quality: "excellent", notes: "Lie-in until 8:30, then cooked own breakfast" }),
  rec({ id: "rr-030", date: "2026-01-18", childId: "child-alex", phase: "weekend_afternoon", quality: "excellent", notes: "Football with friends, then gaming" }),
  rec({ id: "rr-031", date: "2026-01-18", childId: "child-alex", phase: "weekend_evening", quality: "good" }),
  rec({ id: "rr-032", date: "2026-01-18", childId: "child-jordan", phase: "weekend_morning", quality: "good", adaptationsUsed: ["sensory_need"] }),
  rec({ id: "rr-033", date: "2026-01-18", childId: "child-jordan", phase: "weekend_afternoon", quality: "good" }),
  rec({ id: "rr-034", date: "2026-01-18", childId: "child-morgan", phase: "weekend_morning", quality: "excellent" }),
  rec({ id: "rr-035", date: "2026-01-18", childId: "child-morgan", phase: "weekend_afternoon", quality: "excellent" }),
  rec({ id: "rr-036", date: "2026-01-18", childId: "child-morgan", phase: "weekend_evening", quality: "excellent", adaptationsUsed: ["cultural_religious"] }),

  // ── Week 5: February 10-14 ─────────────────────────────────────────────
  rec({ id: "rr-037", date: "2026-02-10", childId: "child-alex", phase: "morning", quality: "good", adaptationsUsed: ["anxiety_support"] }),
  rec({ id: "rr-038", date: "2026-02-10", childId: "child-alex", phase: "school_run", quality: "good" }),
  rec({ id: "rr-039", date: "2026-02-10", childId: "child-alex", phase: "evening", quality: "good" }),
  rec({ id: "rr-040", date: "2026-02-10", childId: "child-alex", phase: "bedtime", quality: "excellent" }),
  rec({ id: "rr-041", date: "2026-02-10", childId: "child-jordan", phase: "morning", quality: "good", adaptationsUsed: ["sensory_need"] }),
  rec({ id: "rr-042", date: "2026-02-10", childId: "child-jordan", phase: "evening", quality: "good" }),
  rec({ id: "rr-043", date: "2026-02-10", childId: "child-jordan", phase: "bedtime", quality: "good" }),
  rec({ id: "rr-044", date: "2026-02-10", childId: "child-morgan", phase: "morning", quality: "excellent" }),
  rec({ id: "rr-045", date: "2026-02-10", childId: "child-morgan", phase: "school_run", quality: "good" }),
  rec({ id: "rr-046", date: "2026-02-10", childId: "child-morgan", phase: "evening", quality: "excellent", adaptationsUsed: ["cultural_religious"] }),
  rec({ id: "rr-047", date: "2026-02-10", childId: "child-morgan", phase: "bedtime", quality: "good", adaptationsUsed: ["sleep_difficulty"] }),

  // ── Week 9: March 10 — Agency staff day (disrupted for Jordan) ─────────
  rec({ id: "rr-048", date: "2026-03-10", childId: "child-alex", phase: "morning", quality: "good" }),
  rec({ id: "rr-049", date: "2026-03-10", childId: "child-alex", phase: "school_run", quality: "good" }),
  rec({ id: "rr-050", date: "2026-03-10", childId: "child-alex", phase: "evening", quality: "good" }),
  rec({ id: "rr-051", date: "2026-03-10", childId: "child-alex", phase: "bedtime", quality: "good" }),
  rec({ id: "rr-052", date: "2026-03-10", childId: "child-jordan", phase: "morning", quality: "mixed", childMood: "anxious", disruptions: ["staff_change"], childCooperated: false, notes: "Jordan anxious — unfamiliar agency staff on morning shift" }),
  rec({ id: "rr-053", date: "2026-03-10", childId: "child-jordan", phase: "evening", quality: "mixed", childMood: "anxious", disruptions: ["staff_change"] }),
  rec({ id: "rr-054", date: "2026-03-10", childId: "child-jordan", phase: "bedtime", quality: "poor", completedOnTime: false, childMood: "distressed", disruptions: ["staff_change"], notes: "Jordan very unsettled — wanted Lisa, not sleeping until 22:15" }),
  rec({ id: "rr-055", date: "2026-03-10", childId: "child-morgan", phase: "morning", quality: "good" }),
  rec({ id: "rr-056", date: "2026-03-10", childId: "child-morgan", phase: "evening", quality: "good", adaptationsUsed: ["cultural_religious"] }),
  rec({ id: "rr-057", date: "2026-03-10", childId: "child-morgan", phase: "bedtime", quality: "excellent", adaptationsUsed: ["sleep_difficulty"] }),

  // ── Week 13: April 7 — Good routine week ───────────────────────────────
  rec({ id: "rr-058", date: "2026-04-07", childId: "child-alex", phase: "morning", quality: "excellent", adaptationsUsed: ["anxiety_support"] }),
  rec({ id: "rr-059", date: "2026-04-07", childId: "child-alex", phase: "school_run", quality: "excellent" }),
  rec({ id: "rr-060", date: "2026-04-07", childId: "child-alex", phase: "after_school", quality: "good", adaptationsUsed: ["education_need"] }),
  rec({ id: "rr-061", date: "2026-04-07", childId: "child-alex", phase: "evening", quality: "excellent" }),
  rec({ id: "rr-062", date: "2026-04-07", childId: "child-alex", phase: "bedtime", quality: "excellent" }),
  rec({ id: "rr-063", date: "2026-04-07", childId: "child-jordan", phase: "morning", quality: "good", adaptationsUsed: ["sensory_need"] }),
  rec({ id: "rr-064", date: "2026-04-07", childId: "child-jordan", phase: "school_run", quality: "good" }),
  rec({ id: "rr-065", date: "2026-04-07", childId: "child-jordan", phase: "evening", quality: "good" }),
  rec({ id: "rr-066", date: "2026-04-07", childId: "child-jordan", phase: "bedtime", quality: "excellent", adaptationsUsed: ["sensory_need"] }),
  rec({ id: "rr-067", date: "2026-04-07", childId: "child-morgan", phase: "morning", quality: "excellent" }),
  rec({ id: "rr-068", date: "2026-04-07", childId: "child-morgan", phase: "school_run", quality: "excellent" }),
  rec({ id: "rr-069", date: "2026-04-07", childId: "child-morgan", phase: "after_school", quality: "excellent" }),
  rec({ id: "rr-070", date: "2026-04-07", childId: "child-morgan", phase: "evening", quality: "excellent", adaptationsUsed: ["cultural_religious"] }),
  rec({ id: "rr-071", date: "2026-04-07", childId: "child-morgan", phase: "bedtime", quality: "excellent", adaptationsUsed: ["cultural_religious", "sleep_difficulty"] }),

  // ── Week 17: May 5 — Bank holiday Monday ───────────────────────────────
  rec({ id: "rr-072", date: "2026-05-04", childId: "child-alex", phase: "weekend_morning", quality: "good" }),
  rec({ id: "rr-073", date: "2026-05-04", childId: "child-alex", phase: "weekend_afternoon", quality: "excellent" }),
  rec({ id: "rr-074", date: "2026-05-04", childId: "child-jordan", phase: "weekend_morning", quality: "good" }),
  rec({ id: "rr-075", date: "2026-05-04", childId: "child-jordan", phase: "weekend_afternoon", quality: "good" }),
  rec({ id: "rr-076", date: "2026-05-04", childId: "child-morgan", phase: "weekend_morning", quality: "excellent" }),
  rec({ id: "rr-077", date: "2026-05-04", childId: "child-morgan", phase: "weekend_afternoon", quality: "excellent" }),
  rec({ id: "rr-078", date: "2026-05-04", childId: "child-morgan", phase: "weekend_evening", quality: "excellent", adaptationsUsed: ["cultural_religious"] }),

  // ── Alex refused morning — March 5 ─────────────────────────────────────
  rec({ id: "rr-079", date: "2026-03-05", childId: "child-alex", phase: "morning", quality: "mixed", startedOnTime: false, childMood: "anxious", disruptions: ["child_refusal"], notes: "Alex refused to get up — anxiety about school test" }),
  rec({ id: "rr-080", date: "2026-03-05", childId: "child-alex", phase: "school_run", quality: "mixed", startedOnTime: false }),
  rec({ id: "rr-081", date: "2026-03-05", childId: "child-alex", phase: "evening", quality: "good" }),
  rec({ id: "rr-082", date: "2026-03-05", childId: "child-alex", phase: "bedtime", quality: "good" }),
];

const DEMO_SHIFTS: StaffShiftRecord[] = [
  // Jan 13
  { id: "ds-001", date: "2026-01-13", staffId: "staff-sarah", staffName: "Sarah Johnson", shiftType: "morning", isRegularStaff: true, handoverCompleted: true, handoverQuality: "thorough" },
  { id: "ds-002", date: "2026-01-13", staffId: "staff-lisa", staffName: "Lisa Williams", shiftType: "evening", isRegularStaff: true, handoverCompleted: true, handoverQuality: "thorough" },
  // Jan 15
  { id: "ds-003", date: "2026-01-15", staffId: "staff-sarah", staffName: "Sarah Johnson", shiftType: "morning", isRegularStaff: true, handoverCompleted: true, handoverQuality: "thorough" },
  { id: "ds-004", date: "2026-01-15", staffId: "staff-tom", staffName: "Tom Richards", shiftType: "evening", isRegularStaff: true, handoverCompleted: true, handoverQuality: "adequate" },
  // Jan 18 (weekend)
  { id: "ds-005", date: "2026-01-18", staffId: "staff-sarah", staffName: "Sarah Johnson", shiftType: "long_day", isRegularStaff: true, handoverCompleted: true, handoverQuality: "thorough" },
  // Feb 10
  { id: "ds-006", date: "2026-02-10", staffId: "staff-sarah", staffName: "Sarah Johnson", shiftType: "morning", isRegularStaff: true, handoverCompleted: true, handoverQuality: "thorough" },
  { id: "ds-007", date: "2026-02-10", staffId: "staff-tom", staffName: "Tom Richards", shiftType: "evening", isRegularStaff: true, handoverCompleted: true, handoverQuality: "adequate" },
  // Mar 5
  { id: "ds-008", date: "2026-03-05", staffId: "staff-lisa", staffName: "Lisa Williams", shiftType: "morning", isRegularStaff: true, handoverCompleted: true, handoverQuality: "thorough" },
  { id: "ds-009", date: "2026-03-05", staffId: "staff-tom", staffName: "Tom Richards", shiftType: "evening", isRegularStaff: true, handoverCompleted: true, handoverQuality: "thorough" },
  // Mar 10 — Agency cover day
  { id: "ds-010", date: "2026-03-10", staffId: "staff-agency1", staffName: "Agency Worker", shiftType: "long_day", isRegularStaff: false, handoverCompleted: true, handoverQuality: "brief" },
  // Apr 7
  { id: "ds-011", date: "2026-04-07", staffId: "staff-sarah", staffName: "Sarah Johnson", shiftType: "morning", isRegularStaff: true, handoverCompleted: true, handoverQuality: "thorough" },
  { id: "ds-012", date: "2026-04-07", staffId: "staff-lisa", staffName: "Lisa Williams", shiftType: "evening", isRegularStaff: true, handoverCompleted: true, handoverQuality: "thorough" },
  // May 4 (weekend)
  { id: "ds-013", date: "2026-05-04", staffId: "staff-tom", staffName: "Tom Richards", shiftType: "long_day", isRegularStaff: true, handoverCompleted: true, handoverQuality: "adequate" },
];

const DEMO_PREFERENCES: RoutinePreferenceRecord[] = [
  { id: "rp-001", childId: "child-alex", date: "2026-01-10", preference: "Music while getting ready in the morning", implemented: true, implementedDate: "2026-01-12", childFeedback: "happy" },
  { id: "rp-002", childId: "child-alex", date: "2026-01-10", preference: "Toast not cereal for breakfast", implemented: true, implementedDate: "2026-01-11", childFeedback: "happy" },
  { id: "rp-003", childId: "child-alex", date: "2026-03-01", preference: "Gaming time after homework only — Alex agreed", implemented: true, implementedDate: "2026-03-02", childFeedback: "neutral" },
  { id: "rp-004", childId: "child-jordan", date: "2026-01-15", preference: "Quiet wind-down before bed with reading lamp only", implemented: true, implementedDate: "2026-01-16", childFeedback: "happy" },
  { id: "rp-005", childId: "child-jordan", date: "2026-01-15", preference: "Dimmed lights in morning — sensory sensitivity", implemented: true, implementedDate: "2026-01-16", childFeedback: "happy" },
  { id: "rp-006", childId: "child-jordan", date: "2026-02-01", preference: "Phone charging downstairs overnight", implemented: true, implementedDate: "2026-02-02", childFeedback: "happy" },
  { id: "rp-007", childId: "child-morgan", date: "2026-01-20", preference: "Prayer time before bed — 10 minutes of quiet", implemented: true, implementedDate: "2026-01-20", childFeedback: "happy" },
  { id: "rp-008", childId: "child-morgan", date: "2026-02-01", preference: "Later bedtime on Fridays for Isha prayer", implemented: true, implementedDate: "2026-02-05", childFeedback: "happy" },
  { id: "rp-009", childId: "child-morgan", date: "2026-03-10", preference: "Own alarm clock to wake independently", implemented: true, implementedDate: "2026-03-12", childFeedback: "happy" },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateRoutineConsistencyIntelligence(
    DEMO_CHILDREN,
    DEMO_RECORDS,
    DEMO_SHIFTS,
    DEMO_PREFERENCES,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  // Enrich phase breakdown with labels
  const enrichedPhases = result.phaseBreakdown.map((p) => ({
    ...p,
    phaseLabel: getPhaseLabel(p.phase),
  }));

  // Enrich disruptions with labels
  const enrichedMorningDisruptions = result.morningRoutine.commonDisruptions.map((d) => ({
    ...d,
    typeLabel: getDisruptionLabel(d.type),
  }));
  const enrichedEveningDisruptions = result.eveningRoutine.commonDisruptions.map((d) => ({
    ...d,
    typeLabel: getDisruptionLabel(d.type),
  }));

  // Enrich child profile adaptations with labels
  const enrichedProfiles = result.childProfiles.map((p) => ({
    ...p,
    adaptationLabels: p.adaptationsUsed.map((a) => getAdaptationLabel(a)),
  }));

  return NextResponse.json({
    data: {
      ...result,
      phaseBreakdown: enrichedPhases,
      morningRoutine: {
        ...result.morningRoutine,
        commonDisruptions: enrichedMorningDisruptions,
      },
      eveningRoutine: {
        ...result.eveningRoutine,
        commonDisruptions: enrichedEveningDisruptions,
      },
      childProfiles: enrichedProfiles,
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    children, records, shifts, preferences,
    homeId, periodStart, periodEnd,
  } = body as {
    children?: RoutineChild[];
    records?: RoutineRecord[];
    shifts?: StaffShiftRecord[];
    preferences?: RoutinePreferenceRecord[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!children || !Array.isArray(children) || children.length === 0) {
    return NextResponse.json({ error: "children array is required" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateRoutineConsistencyIntelligence(
    children,
    records ?? [],
    shifts ?? [],
    preferences ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
