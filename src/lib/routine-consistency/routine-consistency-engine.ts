// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Routine & Consistency Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// Therapeutic care research consistently demonstrates that predictable,
// consistent daily routines are fundamental to recovery for children who have
// experienced trauma. This engine analyses the quality, consistency, and
// therapeutic value of routines within the children's home.
//
// Regulatory framework:
//   CHR 2015 Reg 6(2)(b)(iii) — Routines appropriate to child's situation
//   CHR 2015 Reg 9             — Quality of care (daily life experience)
//   SCCIF                      — "Children experience consistent care"
//   NICE CG29                  — Promoting quality of life for LAC
//   Attachment Theory           — Predictability supports secure attachment
//   DDP / PACE Model            — Safety through consistency and attunement
//
// Key requirements:
//   1. Consistent morning routines (wake, breakfast, school readiness)
//   2. Structured after-school time (homework, activities, free time)
//   3. Positive evening routines (dinner, family time, wind-down, bed)
//   4. Weekend structure that balances activity and rest
//   5. Personalised routine adaptations per child's needs
//   6. Staff consistency in routine delivery
//   7. Routine disruptions identified, minimised, and recovered from
//   8. Children's voice in shaping their routines
//   9. Mealtimes as positive social occasions (not just food)
//  10. Transition points handled with care (leaving, returning, handovers)
//
// Scoring breakdown (0–100):
//   Morning routine consistency:   20  — Wake/breakfast/school readiness
//   Evening routine consistency:   20  — Dinner/wind-down/bedtime
//   Mealtime regularity:          15  — Regular times, social quality
//   Activity/education routine:    15  — Structured time, homework support
//   Staff consistency:             15  — Same staff, handover quality
//   Child voice & adaptation:      15  — Personalised, child-led adjustments
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type RoutinePhase =
  | "morning"
  | "school_run"
  | "after_school"
  | "evening"
  | "bedtime"
  | "weekend_morning"
  | "weekend_afternoon"
  | "weekend_evening";

export type RoutineQuality =
  | "excellent"     // calm, predictable, child felt safe
  | "good"          // mostly smooth, minor wobbles managed well
  | "mixed"         // some disruption, required staff intervention
  | "poor"          // significant disruption, child distressed
  | "not_recorded"; // missing record

export type DisruptionType =
  | "staff_change"        // unfamiliar staff on shift
  | "child_refusal"       // child refused to follow routine
  | "external_event"      // contact, court, appointment disrupted flow
  | "incident"            // behavioural incident interrupted
  | "absence"             // child absent (missing, hospital, etc.)
  | "emergency"           // fire alarm, police visit, etc.
  | "scheduling_conflict" // activities clashed with routine
  | "transition"          // new child, placement move, staff leaving
  | "illness";            // staff or child illness

export type AdaptationType =
  | "sensory_need"        // sensory accommodations in routine
  | "anxiety_support"     // extra time, check-ins for anxious child
  | "medication_timing"   // routine adjusted around medication
  | "contact_schedule"    // routine flexed for family contact
  | "education_need"      // homework support, tutoring integration
  | "sleep_difficulty"    // adjusted bedtime for sleep issues
  | "cultural_religious"  // prayer times, dietary routine needs
  | "therapeutic_need";   // therapy appointment integration

// ── Data Models ───────────────────────────────────────────────────────────────

export interface RoutineChild {
  id: string;
  name: string;
  dateOfBirth: string;
  currentPlacement: boolean;
  agreedBedtime: string;          // e.g., "21:00"
  agreedWakeTime: string;         // e.g., "07:00"
  schoolStartTime?: string;       // e.g., "08:45"
  adaptations: AdaptationType[];
  routinePreferences: string[];   // child-expressed preferences
}

export interface RoutineRecord {
  id: string;
  date: string;
  childId: string;
  phase: RoutinePhase;
  quality: RoutineQuality;
  staffOnDuty: string[];          // staff IDs present
  startedOnTime: boolean;
  completedOnTime: boolean;
  childCooperated: boolean;
  childMood: "positive" | "neutral" | "anxious" | "distressed" | "dysregulated";
  adaptationsUsed: AdaptationType[];
  disruptions: DisruptionType[];
  notes?: string;
}

export interface StaffShiftRecord {
  id: string;
  date: string;
  staffId: string;
  staffName: string;
  shiftType: "morning" | "afternoon" | "evening" | "waking_night" | "long_day";
  isRegularStaff: boolean;        // vs. agency or unfamiliar cover
  handoverCompleted: boolean;
  handoverQuality?: "thorough" | "adequate" | "brief" | "missed";
}

export interface RoutinePreferenceRecord {
  id: string;
  childId: string;
  date: string;
  preference: string;
  implemented: boolean;
  implementedDate?: string;
  childFeedback?: "happy" | "neutral" | "unhappy";
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface PhaseConsistencyResult {
  phase: RoutinePhase;
  phaseLabel: string;
  totalRecords: number;
  excellentOrGoodRate: number;
  onTimeRate: number;
  cooperationRate: number;
  disruptionRate: number;
  averageMood: number;            // 1-5 mapped from mood
}

export interface MorningRoutineResult {
  totalRecords: number;
  onTimeRate: number;
  qualityRate: number;            // excellent + good %
  cooperationRate: number;
  commonDisruptions: { type: DisruptionType; count: number }[];
  schoolReadinessRate: number;    // % of school mornings started on time
}

export interface EveningRoutineResult {
  totalRecords: number;
  onTimeRate: number;
  qualityRate: number;
  cooperationRate: number;
  bedtimeComplianceRate: number;  // % within 15min of agreed bedtime
  windDownQuality: number;        // % of evenings rated excellent/good
  commonDisruptions: { type: DisruptionType; count: number }[];
}

export interface StaffConsistencyResult {
  regularStaffRate: number;       // % of shifts covered by regular staff
  handoverCompletionRate: number;
  handoverQualityRate: number;    // thorough or adequate %
  averageStaffPerShift: number;
  staffTurnoverImpact: number;    // count of disruptions from staff_change
}

export interface ChildRoutineProfile {
  childId: string;
  childName: string;
  morningQualityRate: number;
  eveningQualityRate: number;
  overallCooperationRate: number;
  disruptionCount: number;
  adaptationsUsed: AdaptationType[];
  preferencesImplemented: number;
  preferencesTotal: number;
  primaryConcern?: string;
}

export interface RoutineConsistencyResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  morningRoutine: MorningRoutineResult;
  eveningRoutine: EveningRoutineResult;
  phaseBreakdown: PhaseConsistencyResult[];
  staffConsistency: StaffConsistencyResult;
  childProfiles: ChildRoutineProfile[];
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Labels ────────────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<RoutinePhase, string> = {
  morning: "Morning Routine",
  school_run: "School Run",
  after_school: "After School",
  evening: "Evening Routine",
  bedtime: "Bedtime",
  weekend_morning: "Weekend Morning",
  weekend_afternoon: "Weekend Afternoon",
  weekend_evening: "Weekend Evening",
};

const DISRUPTION_LABELS: Record<DisruptionType, string> = {
  staff_change: "Staff Change",
  child_refusal: "Child Refusal",
  external_event: "External Event",
  incident: "Behavioural Incident",
  absence: "Absence",
  emergency: "Emergency",
  scheduling_conflict: "Scheduling Conflict",
  transition: "Transition",
  illness: "Illness",
};

const ADAPTATION_LABELS: Record<AdaptationType, string> = {
  sensory_need: "Sensory Accommodation",
  anxiety_support: "Anxiety Support",
  medication_timing: "Medication Timing",
  contact_schedule: "Contact Schedule",
  education_need: "Education Need",
  sleep_difficulty: "Sleep Difficulty",
  cultural_religious: "Cultural/Religious",
  therapeutic_need: "Therapeutic Need",
};

export function getPhaseLabel(p: RoutinePhase): string {
  return PHASE_LABELS[p] ?? p.replace(/_/g, " ");
}

export function getDisruptionLabel(d: DisruptionType): string {
  return DISRUPTION_LABELS[d] ?? d.replace(/_/g, " ");
}

export function getAdaptationLabel(a: AdaptationType): string {
  return ADAPTATION_LABELS[a] ?? a.replace(/_/g, " ");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date.slice(0, 10) >= start.slice(0, 10) && date.slice(0, 10) <= end.slice(0, 10);
}

function moodToScore(mood: RoutineRecord["childMood"]): number {
  switch (mood) {
    case "positive": return 5;
    case "neutral": return 4;
    case "anxious": return 3;
    case "distressed": return 2;
    case "dysregulated": return 1;
  }
}

function isGoodQuality(q: RoutineQuality): boolean {
  return q === "excellent" || q === "good";
}

function countDisruptions(records: RoutineRecord[]): Map<DisruptionType, number> {
  const counts = new Map<DisruptionType, number>();
  for (const r of records) {
    for (const d of r.disruptions) {
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
  }
  return counts;
}

// ── Core Functions ────────────────────────────────────────────────────────────

export function evaluateMorningRoutine(
  children: RoutineChild[],
  records: RoutineRecord[],
  periodStart: string,
  periodEnd: string,
): MorningRoutineResult {
  const placed = children.filter((c) => c.currentPlacement);
  const morningRecords = records.filter(
    (r) =>
      inPeriod(r.date, periodStart, periodEnd) &&
      (r.phase === "morning" || r.phase === "school_run") &&
      placed.some((c) => c.id === r.childId),
  );

  const totalRecords = morningRecords.length;
  const onTime = morningRecords.filter((r) => r.startedOnTime).length;
  const onTimeRate = pct(onTime, totalRecords);
  const good = morningRecords.filter((r) => isGoodQuality(r.quality)).length;
  const qualityRate = pct(good, totalRecords);
  const cooperative = morningRecords.filter((r) => r.childCooperated).length;
  const cooperationRate = pct(cooperative, totalRecords);

  const disruptions = countDisruptions(morningRecords);
  const commonDisruptions = Array.from(disruptions.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // School readiness: school_run records that started on time
  const schoolRuns = morningRecords.filter((r) => r.phase === "school_run");
  const schoolOnTime = schoolRuns.filter((r) => r.startedOnTime).length;
  const schoolReadinessRate = pct(schoolOnTime, schoolRuns.length);

  return {
    totalRecords,
    onTimeRate,
    qualityRate,
    cooperationRate,
    commonDisruptions,
    schoolReadinessRate,
  };
}

export function evaluateEveningRoutine(
  children: RoutineChild[],
  records: RoutineRecord[],
  periodStart: string,
  periodEnd: string,
): EveningRoutineResult {
  const placed = children.filter((c) => c.currentPlacement);
  const eveningRecords = records.filter(
    (r) =>
      inPeriod(r.date, periodStart, periodEnd) &&
      (r.phase === "evening" || r.phase === "bedtime") &&
      placed.some((c) => c.id === r.childId),
  );

  const totalRecords = eveningRecords.length;
  const onTime = eveningRecords.filter((r) => r.completedOnTime).length;
  const onTimeRate = pct(onTime, totalRecords);
  const good = eveningRecords.filter((r) => isGoodQuality(r.quality)).length;
  const qualityRate = pct(good, totalRecords);
  const cooperative = eveningRecords.filter((r) => r.childCooperated).length;
  const cooperationRate = pct(cooperative, totalRecords);

  // Bedtime compliance — bedtime records completed on time
  const bedtimeRecords = eveningRecords.filter((r) => r.phase === "bedtime");
  const bedtimeOnTime = bedtimeRecords.filter((r) => r.completedOnTime).length;
  const bedtimeComplianceRate = pct(bedtimeOnTime, bedtimeRecords.length);

  // Wind-down quality — evening (not bedtime) records
  const windDownRecords = eveningRecords.filter((r) => r.phase === "evening");
  const windDownGood = windDownRecords.filter((r) => isGoodQuality(r.quality)).length;
  const windDownQuality = pct(windDownGood, windDownRecords.length);

  const disruptions = countDisruptions(eveningRecords);
  const commonDisruptions = Array.from(disruptions.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalRecords,
    onTimeRate,
    qualityRate,
    cooperationRate,
    bedtimeComplianceRate,
    windDownQuality,
    commonDisruptions,
  };
}

export function evaluatePhaseBreakdown(
  children: RoutineChild[],
  records: RoutineRecord[],
  periodStart: string,
  periodEnd: string,
): PhaseConsistencyResult[] {
  const placed = children.filter((c) => c.currentPlacement);
  const periodRecords = records.filter(
    (r) =>
      inPeriod(r.date, periodStart, periodEnd) &&
      placed.some((c) => c.id === r.childId),
  );

  const phases: RoutinePhase[] = [
    "morning", "school_run", "after_school", "evening",
    "bedtime", "weekend_morning", "weekend_afternoon", "weekend_evening",
  ];

  return phases.map((phase) => {
    const phaseRecords = periodRecords.filter((r) => r.phase === phase);
    const totalRecords = phaseRecords.length;
    const good = phaseRecords.filter((r) => isGoodQuality(r.quality)).length;
    const onTime = phaseRecords.filter((r) => r.startedOnTime && r.completedOnTime).length;
    const cooperative = phaseRecords.filter((r) => r.childCooperated).length;
    const disrupted = phaseRecords.filter((r) => r.disruptions.length > 0).length;
    const moodTotal = phaseRecords.reduce((sum, r) => sum + moodToScore(r.childMood), 0);

    return {
      phase,
      phaseLabel: getPhaseLabel(phase),
      totalRecords,
      excellentOrGoodRate: pct(good, totalRecords),
      onTimeRate: pct(onTime, totalRecords),
      cooperationRate: pct(cooperative, totalRecords),
      disruptionRate: pct(disrupted, totalRecords),
      averageMood: totalRecords === 0 ? 0 : Math.round((moodTotal / totalRecords) * 10) / 10,
    };
  }).filter((p) => p.totalRecords > 0);
}

export function evaluateStaffConsistency(
  shifts: StaffShiftRecord[],
  records: RoutineRecord[],
  periodStart: string,
  periodEnd: string,
): StaffConsistencyResult {
  const periodShifts = shifts.filter((s) => inPeriod(s.date, periodStart, periodEnd));
  const periodRecords = records.filter((r) => inPeriod(r.date, periodStart, periodEnd));

  const totalShifts = periodShifts.length;
  const regularShifts = periodShifts.filter((s) => s.isRegularStaff).length;
  const regularStaffRate = pct(regularShifts, totalShifts);

  const handoversExpected = periodShifts.length;
  const handoversCompleted = periodShifts.filter((s) => s.handoverCompleted).length;
  const handoverCompletionRate = pct(handoversCompleted, handoversExpected);

  const handoversWithQuality = periodShifts.filter((s) => s.handoverQuality);
  const goodHandovers = handoversWithQuality.filter(
    (s) => s.handoverQuality === "thorough" || s.handoverQuality === "adequate",
  ).length;
  const handoverQualityRate = pct(goodHandovers, handoversWithQuality.length);

  // Average unique staff per day
  const dayStaffMap = new Map<string, Set<string>>();
  for (const s of periodShifts) {
    const existing = dayStaffMap.get(s.date) ?? new Set();
    existing.add(s.staffId);
    dayStaffMap.set(s.date, existing);
  }
  const totalDays = dayStaffMap.size;
  const totalStaffDays = Array.from(dayStaffMap.values()).reduce(
    (sum, set) => sum + set.size, 0,
  );
  const averageStaffPerShift = totalDays === 0
    ? 0
    : Math.round((totalStaffDays / totalDays) * 10) / 10;

  // Staff change disruptions
  const staffChangeDisruptions = periodRecords.filter(
    (r) => r.disruptions.includes("staff_change"),
  ).length;

  return {
    regularStaffRate,
    handoverCompletionRate,
    handoverQualityRate,
    averageStaffPerShift,
    staffTurnoverImpact: staffChangeDisruptions,
  };
}

export function buildChildRoutineProfiles(
  children: RoutineChild[],
  records: RoutineRecord[],
  preferences: RoutinePreferenceRecord[],
  periodStart: string,
  periodEnd: string,
): ChildRoutineProfile[] {
  const placed = children.filter((c) => c.currentPlacement);
  const periodRecords = records.filter((r) => inPeriod(r.date, periodStart, periodEnd));
  const periodPrefs = preferences.filter((p) => inPeriod(p.date, periodStart, periodEnd));

  return placed.map((child) => {
    const childRecords = periodRecords.filter((r) => r.childId === child.id);
    const morningRecords = childRecords.filter(
      (r) => r.phase === "morning" || r.phase === "school_run",
    );
    const eveningRecords = childRecords.filter(
      (r) => r.phase === "evening" || r.phase === "bedtime",
    );

    const morningGood = morningRecords.filter((r) => isGoodQuality(r.quality)).length;
    const morningQualityRate = pct(morningGood, morningRecords.length);

    const eveningGood = eveningRecords.filter((r) => isGoodQuality(r.quality)).length;
    const eveningQualityRate = pct(eveningGood, eveningRecords.length);

    const cooperative = childRecords.filter((r) => r.childCooperated).length;
    const overallCooperationRate = pct(cooperative, childRecords.length);

    const disruptionCount = childRecords.filter(
      (r) => r.disruptions.length > 0,
    ).length;

    // Adaptations used across the period
    const adaptationsUsed = [
      ...new Set(childRecords.flatMap((r) => r.adaptationsUsed)),
    ] as AdaptationType[];

    // Preferences
    const childPrefs = periodPrefs.filter((p) => p.childId === child.id);
    const preferencesTotal = childPrefs.length;
    const preferencesImplemented = childPrefs.filter((p) => p.implemented).length;

    // Primary concern
    let primaryConcern: string | undefined;
    if (morningQualityRate < 50 && morningRecords.length > 0) {
      primaryConcern = "Morning routine quality below 50% — review support strategies";
    } else if (eveningQualityRate < 50 && eveningRecords.length > 0) {
      primaryConcern = "Evening routine quality below 50% — review bedtime support";
    } else if (overallCooperationRate < 40 && childRecords.length > 0) {
      primaryConcern = "Low cooperation rate — consider therapeutic approach review";
    } else if (
      childRecords.length > 0 &&
      childRecords.filter((r) => r.childMood === "dysregulated" || r.childMood === "distressed").length >
        childRecords.length * 0.3
    ) {
      primaryConcern = "Frequent distress/dysregulation during routines — therapeutic review needed";
    } else if (disruptionCount > childRecords.length * 0.4) {
      primaryConcern = "High disruption rate — review routine structure and support";
    }

    return {
      childId: child.id,
      childName: child.name,
      morningQualityRate,
      eveningQualityRate,
      overallCooperationRate,
      disruptionCount,
      adaptationsUsed,
      preferencesImplemented,
      preferencesTotal,
      primaryConcern,
    };
  });
}

// ── Main Intelligence Function ────────────────────────────────────────────────

export function generateRoutineConsistencyIntelligence(
  children: RoutineChild[],
  records: RoutineRecord[],
  shifts: StaffShiftRecord[],
  preferences: RoutinePreferenceRecord[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): RoutineConsistencyResult {
  const morningRoutine = evaluateMorningRoutine(children, records, periodStart, periodEnd);
  const eveningRoutine = evaluateEveningRoutine(children, records, periodStart, periodEnd);
  const phaseBreakdown = evaluatePhaseBreakdown(children, records, periodStart, periodEnd);
  const staffConsistency = evaluateStaffConsistency(shifts, records, periodStart, periodEnd);
  const childProfiles = buildChildRoutineProfiles(children, records, preferences, periodStart, periodEnd);

  // ── Scoring ──────────────────────────────────────────────────────────────

  // 1. Morning routine consistency (20)
  let morningScore = 0;
  if (morningRoutine.qualityRate >= 80) morningScore += 8;
  else if (morningRoutine.qualityRate >= 60) morningScore += 5;
  else if (morningRoutine.qualityRate >= 40) morningScore += 2;

  if (morningRoutine.onTimeRate >= 85) morningScore += 6;
  else if (morningRoutine.onTimeRate >= 70) morningScore += 4;
  else if (morningRoutine.onTimeRate >= 50) morningScore += 2;

  if (morningRoutine.schoolReadinessRate >= 90) morningScore += 6;
  else if (morningRoutine.schoolReadinessRate >= 75) morningScore += 4;
  else if (morningRoutine.schoolReadinessRate >= 50) morningScore += 2;

  morningScore = Math.min(morningScore, 20);

  // 2. Evening routine consistency (20)
  let eveningScore = 0;
  if (eveningRoutine.qualityRate >= 80) eveningScore += 7;
  else if (eveningRoutine.qualityRate >= 60) eveningScore += 4;
  else if (eveningRoutine.qualityRate >= 40) eveningScore += 2;

  if (eveningRoutine.bedtimeComplianceRate >= 85) eveningScore += 7;
  else if (eveningRoutine.bedtimeComplianceRate >= 70) eveningScore += 4;
  else if (eveningRoutine.bedtimeComplianceRate >= 50) eveningScore += 2;

  if (eveningRoutine.windDownQuality >= 80) eveningScore += 6;
  else if (eveningRoutine.windDownQuality >= 60) eveningScore += 3;
  else if (eveningRoutine.windDownQuality >= 40) eveningScore += 1;

  eveningScore = Math.min(eveningScore, 20);

  // 3. Mealtime regularity (15) — use "evening" and "morning" records
  // as proxy (mealtimes are embedded in morning/evening routine quality)
  let mealtimeScore = 0;
  const allPhaseRecords = phaseBreakdown;
  const mealtimePhases = allPhaseRecords.filter(
    (p) => p.phase === "morning" || p.phase === "evening" || p.phase === "weekend_morning" || p.phase === "weekend_evening",
  );
  const avgMealtimeOnTime = mealtimePhases.length > 0
    ? mealtimePhases.reduce((sum, p) => sum + p.onTimeRate, 0) / mealtimePhases.length
    : 0;
  if (avgMealtimeOnTime >= 85) mealtimeScore += 8;
  else if (avgMealtimeOnTime >= 70) mealtimeScore += 5;
  else if (avgMealtimeOnTime >= 50) mealtimeScore += 2;

  const avgMealtimeMood = mealtimePhases.length > 0
    ? mealtimePhases.reduce((sum, p) => sum + p.averageMood, 0) / mealtimePhases.length
    : 0;
  if (avgMealtimeMood >= 4.0) mealtimeScore += 7;
  else if (avgMealtimeMood >= 3.0) mealtimeScore += 4;
  else if (avgMealtimeMood >= 2.0) mealtimeScore += 1;

  mealtimeScore = Math.min(mealtimeScore, 15);

  // 4. Activity / education routine (15)
  let activityScore = 0;
  const activityPhases = allPhaseRecords.filter(
    (p) => p.phase === "after_school" || p.phase === "weekend_afternoon",
  );
  const avgActivityQuality = activityPhases.length > 0
    ? activityPhases.reduce((sum, p) => sum + p.excellentOrGoodRate, 0) / activityPhases.length
    : 0;
  if (avgActivityQuality >= 80) activityScore += 8;
  else if (avgActivityQuality >= 60) activityScore += 5;
  else if (avgActivityQuality >= 40) activityScore += 2;

  const avgActivityCooperation = activityPhases.length > 0
    ? activityPhases.reduce((sum, p) => sum + p.cooperationRate, 0) / activityPhases.length
    : 0;
  if (avgActivityCooperation >= 80) activityScore += 7;
  else if (avgActivityCooperation >= 60) activityScore += 4;
  else if (avgActivityCooperation >= 40) activityScore += 2;

  activityScore = Math.min(activityScore, 15);

  // 5. Staff consistency (15)
  let staffScore = 0;
  if (staffConsistency.regularStaffRate >= 85) staffScore += 5;
  else if (staffConsistency.regularStaffRate >= 70) staffScore += 3;
  else if (staffConsistency.regularStaffRate >= 50) staffScore += 1;

  if (staffConsistency.handoverCompletionRate >= 95) staffScore += 5;
  else if (staffConsistency.handoverCompletionRate >= 80) staffScore += 3;
  else if (staffConsistency.handoverCompletionRate >= 60) staffScore += 1;

  if (staffConsistency.handoverQualityRate >= 80) staffScore += 5;
  else if (staffConsistency.handoverQualityRate >= 60) staffScore += 3;
  else if (staffConsistency.handoverQualityRate >= 40) staffScore += 1;

  staffScore = Math.min(staffScore, 15);

  // 6. Child voice & adaptation (15)
  let voiceScore = 0;
  const totalPrefs = childProfiles.reduce((sum, p) => sum + p.preferencesTotal, 0);
  const totalImplemented = childProfiles.reduce((sum, p) => sum + p.preferencesImplemented, 0);
  const implementationRate = pct(totalImplemented, totalPrefs);
  if (implementationRate >= 80) voiceScore += 8;
  else if (implementationRate >= 60) voiceScore += 5;
  else if (implementationRate >= 40) voiceScore += 2;

  // Adaptations in use
  const placed = children.filter((c) => c.currentPlacement);
  const childrenWithAdaptations = placed.filter((c) => c.adaptations.length > 0).length;
  const childrenUsingAdaptations = childProfiles.filter(
    (p) => p.adaptationsUsed.length > 0,
  ).length;
  const adaptationRate = pct(childrenUsingAdaptations, childrenWithAdaptations);
  if (childrenWithAdaptations === 0 || adaptationRate >= 80) voiceScore += 7;
  else if (adaptationRate >= 60) voiceScore += 4;
  else if (adaptationRate >= 40) voiceScore += 2;

  voiceScore = Math.min(voiceScore, 15);

  const overallScore = Math.min(
    100,
    Math.max(
      0,
      morningScore + eveningScore + mealtimeScore + activityScore + staffScore + voiceScore,
    ),
  );

  const rating: RoutineConsistencyResult["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths / Areas / Actions ─────────────────────────────────────────
  const strengths: string[] = [];
  const areasForDevelopment: string[] = [];
  const immediateActions: string[] = [];

  if (morningRoutine.qualityRate >= 80) {
    strengths.push("Consistently high-quality morning routines support school readiness");
  }
  if (eveningRoutine.bedtimeComplianceRate >= 85) {
    strengths.push("Bedtime routines well-established — children settling consistently");
  }
  if (staffConsistency.regularStaffRate >= 85) {
    strengths.push("High staff consistency — children experience predictable care");
  }
  if (implementationRate >= 80) {
    strengths.push("Children's routine preferences actively implemented");
  }
  if (morningRoutine.schoolReadinessRate >= 90) {
    strengths.push("Excellent school readiness — children leaving on time consistently");
  }
  if (eveningRoutine.windDownQuality >= 80) {
    strengths.push("Effective wind-down routines support emotional regulation before bed");
  }
  if (strengths.length === 0) {
    strengths.push("No significant strengths identified — routine consistency needs review");
  }

  if (morningRoutine.qualityRate < 60) {
    areasForDevelopment.push(
      `Morning routine quality at ${morningRoutine.qualityRate}% — review transition support`,
    );
  }
  if (eveningRoutine.bedtimeComplianceRate < 70) {
    areasForDevelopment.push(
      `Bedtime compliance at ${eveningRoutine.bedtimeComplianceRate}% — review bedtime strategies`,
    );
  }
  if (staffConsistency.regularStaffRate < 70) {
    areasForDevelopment.push(
      `Regular staff rate at ${staffConsistency.regularStaffRate}% — reduce reliance on agency/cover`,
    );
  }
  if (staffConsistency.handoverCompletionRate < 80) {
    areasForDevelopment.push("Handover completion rate needs improvement for routine continuity");
  }
  if (implementationRate < 60 && totalPrefs > 0) {
    areasForDevelopment.push("Children's routine preferences not consistently implemented");
  }
  if (areasForDevelopment.length === 0) {
    areasForDevelopment.push("No significant areas for development identified");
  }

  // Immediate actions
  const childrenWithConcerns = childProfiles.filter((p) => p.primaryConcern);
  if (childrenWithConcerns.length > 0) {
    for (const child of childrenWithConcerns) {
      if (child.primaryConcern?.includes("dysregulation") || child.primaryConcern?.includes("therapeutic")) {
        immediateActions.push(
          `URGENT: ${child.childName} — ${child.primaryConcern}`,
        );
      } else {
        immediateActions.push(
          `HIGH: ${child.childName} — ${child.primaryConcern}`,
        );
      }
    }
  }
  if (morningRoutine.schoolReadinessRate < 70) {
    immediateActions.push(
      "HIGH: School readiness below 70% — review morning routine structure and staffing",
    );
  }
  if (staffConsistency.handoverCompletionRate < 60) {
    immediateActions.push(
      "HIGH: Handover completion below 60% — critical for routine continuity",
    );
  }
  if (immediateActions.length === 0) {
    immediateActions.push(
      "No immediate actions required — routines are consistently maintained",
    );
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 6(2)(b)(iii) — Routines appropriate to child's situation",
    "CHR 2015 Reg 9 — Quality of care (daily life experience)",
    "SCCIF — Children experience consistent, stable care",
    "NICE CG29 — Promoting quality of life for looked-after children",
    "Attachment Theory — Predictability and consistency support secure attachment",
    "PACE Model — Safety through consistent, attuned care",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    morningRoutine,
    eveningRoutine,
    phaseBreakdown,
    staffConsistency,
    childProfiles,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
  };
}
