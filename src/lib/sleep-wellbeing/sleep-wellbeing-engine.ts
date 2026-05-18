// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Sleep & Wellbeing Monitoring Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// "Children looked after should be healthy — physically, emotionally
//  and mentally. Their health needs, including sleep, should be
//  identified and met."
// — SCCIF 2023
//
// Regulatory framework:
//   CHR 2015 Reg 10          — Health and wellbeing of children
//   CHR 2015 Reg 6           — Quality of care standard
//   CHR 2015 Reg 34          — Night-time staffing arrangements
//   SCCIF                    — "Experiences and progress of children"
//   Working Together 2023    — Promoting children's welfare
//   NICE CG170               — Sleep disorders in children and young people
//
// Key requirements:
//   1. Children's sleep needs are assessed and understood
//   2. Personalised sleep plans in place where needed
//   3. Night checks completed consistently
//   4. Bedtime routines followed to promote good sleep hygiene
//   5. Nocturnal disturbances responded to promptly and compassionately
//   6. Staff support children effectively during the night
//   7. Children's wellbeing is monitored at bedtime and on waking
//   8. Sleep quality data used to inform care planning
//   9. Patterns of poor sleep investigated and addressed
//  10. Therapeutic/sensory support provided where appropriate
//
// Scoring breakdown (0-100):
//   Sleep quality:          30  — Good night rate, overall sleep quality
//   Disturbances:           20  — Frequency, settled-after rate
//   Night care:             30  — Night checks, routines, wellbeing improvement
//   Sleep plans:            20  — Coverage, currency, bedtime adherence
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type SleepQuality = "good" | "fair" | "poor" | "very_poor";

export type DisturbanceType =
  | "nightmare"
  | "night_terror"
  | "insomnia"
  | "anxiety"
  | "noise"
  | "peer_disturbance"
  | "medical"
  | "enuresis"
  | "wandering"
  | "phone_use"
  | "homesickness"
  | "other";

export type SupportProvided =
  | "reassurance"
  | "warm_drink"
  | "quiet_activity"
  | "medication"
  | "sensory_support"
  | "stayed_with_child"
  | "therapeutic_technique"
  | "called_on_call"
  | "none_needed";

export type WellbeingIndicator =
  | "settled"
  | "unsettled"
  | "distressed"
  | "regulated_with_support"
  | "dysregulated";

// ── Data Models ───────────────────────────────────────────────────────────────

export interface NightDisturbance {
  time: string; // HH:MM
  type: DisturbanceType;
  durationMinutes: number;
  supportProvided: SupportProvided[];
  childSettledAfter: boolean;
  staffResponse: string; // brief description
}

export interface NightRecord {
  id: string;
  homeId: string;
  date: string; // the night of (e.g. "2025-01-15" = night of 15th-16th)
  childId: string;
  childName: string;
  bedtime: string; // HH:MM format
  settledTime?: string; // HH:MM — when actually fell asleep
  wakeTime?: string; // HH:MM
  sleepQuality: SleepQuality;
  disturbances: NightDisturbance[];
  staffOnNight: string;
  wellbeingAtBedtime: WellbeingIndicator;
  wellbeingOnWaking: WellbeingIndicator;
  bedtimeRoutineFollowed: boolean;
  nightCheckCompleted: boolean;
  notes?: string;
}

export interface SleepPlan {
  childId: string;
  childName: string;
  targetBedtime: string; // HH:MM
  targetWakeTime: string;
  knownSleepIssues: string[];
  strategies: string[];
  lastReviewedDate: string;
  reviewDueDate: string;
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface SleepQualityResult {
  totalRecords: number;
  childMetrics: {
    childId: string;
    childName: string;
    totalNights: number;
    avgSleepHours: number;
    goodNightRate: number;
    poorNightRate: number;
    avgDisturbancesPerNight: number;
    sleepQualityDistribution: Record<SleepQuality, number>;
  }[];
  overallAvgSleepHours: number;
  overallGoodNightRate: number;
  overallPoorNightRate: number;
  overallAvgDisturbancesPerNight: number;
  overallSleepQualityDistribution: Record<SleepQuality, number>;
  overallSleepScore: number; // 0-100
}

export interface DisturbanceResult {
  totalDisturbances: number;
  disturbancesByType: Record<string, number>;
  avgDuration: number;
  settledAfterRate: number;
  mostCommonType: DisturbanceType | null;
  disturbancesByChild: {
    childId: string;
    childName: string;
    count: number;
    types: DisturbanceType[];
  }[];
  timeOfNightDistribution: {
    early: number;  // before 00:00
    middle: number; // 00:00 - 04:00
    late: number;   // after 04:00
  };
}

export interface NightCareResult {
  nightCheckCompletionRate: number;
  bedtimeRoutineRate: number;
  supportProvidedDistribution: Record<string, number>;
  avgResponseToDisturbance: number; // average duration minutes across disturbances
  wellbeingImprovementRate: number; // children who went from unsettled/distressed → settled on waking
}

export interface SleepPlanResult {
  totalPlans: number;
  plansUpToDate: number;
  overduePlans: number;
  bedtimeAdherenceRate: number;
  childrenWithoutPlans: {
    childId: string;
    childName: string;
  }[];
}

export interface ChildSleepProfile {
  childId: string;
  childName: string;
  avgSleepHours: number;
  avgSleepQuality: string; // weighted label
  disturbanceFrequency: number; // per night
  commonDisturbanceTypes: DisturbanceType[];
  hasSleepPlan: boolean;
  bedtimeAdherence: number; // percentage
  wellbeingTrend: "improving" | "stable" | "declining";
}

export interface SleepWellbeingResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  sleepQuality: SleepQualityResult;
  disturbances: DisturbanceResult;
  nightCare: NightCareResult;
  sleepPlans: SleepPlanResult;
  childProfiles: ChildSleepProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const SLEEP_QUALITY_LABELS: Record<SleepQuality, string> = {
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  very_poor: "Very Poor",
};

const DISTURBANCE_TYPE_LABELS: Record<DisturbanceType, string> = {
  nightmare: "Nightmare",
  night_terror: "Night Terror",
  insomnia: "Insomnia",
  anxiety: "Anxiety",
  noise: "Noise",
  peer_disturbance: "Peer Disturbance",
  medical: "Medical",
  enuresis: "Enuresis",
  wandering: "Wandering",
  phone_use: "Phone Use",
  homesickness: "Homesickness",
  other: "Other",
};

const SUPPORT_LABELS: Record<SupportProvided, string> = {
  reassurance: "Reassurance",
  warm_drink: "Warm Drink",
  quiet_activity: "Quiet Activity",
  medication: "Medication",
  sensory_support: "Sensory Support",
  stayed_with_child: "Stayed with Child",
  therapeutic_technique: "Therapeutic Technique",
  called_on_call: "Called On-Call",
  none_needed: "None Needed",
};

const WELLBEING_LABELS: Record<WellbeingIndicator, string> = {
  settled: "Settled",
  unsettled: "Unsettled",
  distressed: "Distressed",
  regulated_with_support: "Regulated with Support",
  dysregulated: "Dysregulated",
};

// ── Label Functions ──────────────────────────────────────────────────────────

export function getSleepQualityLabel(q: SleepQuality): string {
  return SLEEP_QUALITY_LABELS[q] ?? q.replace(/_/g, " ");
}

export function getDisturbanceTypeLabel(t: DisturbanceType): string {
  return DISTURBANCE_TYPE_LABELS[t] ?? t.replace(/_/g, " ");
}

export function getSupportLabel(s: SupportProvided): string {
  return SUPPORT_LABELS[s] ?? s.replace(/_/g, " ");
}

export function getWellbeingLabel(w: WellbeingIndicator): string {
  return WELLBEING_LABELS[w] ?? w.replace(/_/g, " ");
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function daysBetween(earlier: string, later: string): number {
  const diff = new Date(later).getTime() - new Date(earlier).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculates sleep hours from bedtime/settledTime and wakeTime.
 * Handles overnight spans (e.g. 21:30 to 07:00 = 9.5h).
 * Uses settledTime if available, otherwise bedtime.
 */
function calculateSleepHours(record: NightRecord): number {
  const start = record.settledTime ?? record.bedtime;
  const wake = record.wakeTime;
  if (!start || !wake) return 0;

  const [sh, sm] = start.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);

  let startMins = sh * 60 + sm;
  let wakeMins = wh * 60 + wm;

  // If wake is earlier than start, it's the next day
  if (wakeMins <= startMins) {
    wakeMins += 24 * 60;
  }

  const hours = (wakeMins - startMins) / 60;
  return Math.round(hours * 10) / 10;
}

/**
 * Classifies a disturbance time into early/middle/late.
 * early: before 00:00 (midnight), middle: 00:00-04:00, late: after 04:00
 */
function classifyTimeOfNight(time: string): "early" | "middle" | "late" {
  const [h] = time.split(":").map(Number);
  // Times like 20:00-23:59 are "early" (before midnight)
  if (h >= 20 || h === 0) return h >= 20 ? "early" : "middle";
  if (h >= 1 && h < 4) return "middle";
  if (h === 0) return "middle";
  return "late"; // 04:00+
}

/**
 * Calculate bedtime adherence: how close actual bedtime is to target.
 * Returns percentage — 100% if within 15 min, degrades after that.
 */
function bedtimeAdherenceScore(actual: string, target: string): number {
  const [ah, am] = actual.split(":").map(Number);
  const [th, tm] = target.split(":").map(Number);
  const actualMins = ah * 60 + am;
  const targetMins = th * 60 + tm;
  const diff = Math.abs(actualMins - targetMins);
  if (diff <= 15) return 100;
  if (diff <= 30) return 80;
  if (diff <= 60) return 50;
  return 20;
}

// ── Core Functions ───────────────────────────────────────────────────────────

export function evaluateSleepQuality(
  records: NightRecord[],
  periodStart: string,
  periodEnd: string,
): SleepQualityResult {
  const filtered = records.filter((r) => inPeriod(r.date, periodStart, periodEnd));
  const totalRecords = filtered.length;

  // Group by child
  const childMap = new Map<string, NightRecord[]>();
  for (const r of filtered) {
    const existing = childMap.get(r.childId) ?? [];
    existing.push(r);
    childMap.set(r.childId, existing);
  }

  const childMetrics = Array.from(childMap.entries()).map(([childId, recs]) => {
    const childName = recs[0].childName;
    const totalNights = recs.length;
    const sleepHours = recs.map(calculateSleepHours).filter((h) => h > 0);
    const avgSleepHours = sleepHours.length > 0
      ? Math.round((sleepHours.reduce((s, h) => s + h, 0) / sleepHours.length) * 10) / 10
      : 0;

    const goodNights = recs.filter((r) => r.sleepQuality === "good").length;
    const poorNights = recs.filter((r) => r.sleepQuality === "poor" || r.sleepQuality === "very_poor").length;
    const totalDisturbances = recs.reduce((s, r) => s + r.disturbances.length, 0);

    const dist: Record<SleepQuality, number> = { good: 0, fair: 0, poor: 0, very_poor: 0 };
    for (const r of recs) dist[r.sleepQuality]++;

    return {
      childId,
      childName,
      totalNights,
      avgSleepHours,
      goodNightRate: pct(goodNights, totalNights),
      poorNightRate: pct(poorNights, totalNights),
      avgDisturbancesPerNight: totalNights > 0
        ? Math.round((totalDisturbances / totalNights) * 100) / 100
        : 0,
      sleepQualityDistribution: dist,
    };
  });

  // Overall metrics
  const allSleepHours = filtered.map(calculateSleepHours).filter((h) => h > 0);
  const overallAvgSleepHours = allSleepHours.length > 0
    ? Math.round((allSleepHours.reduce((s, h) => s + h, 0) / allSleepHours.length) * 10) / 10
    : 0;

  const overallGoodNights = filtered.filter((r) => r.sleepQuality === "good").length;
  const overallPoorNights = filtered.filter((r) => r.sleepQuality === "poor" || r.sleepQuality === "very_poor").length;
  const overallTotalDisturbances = filtered.reduce((s, r) => s + r.disturbances.length, 0);

  const overallDist: Record<SleepQuality, number> = { good: 0, fair: 0, poor: 0, very_poor: 0 };
  for (const r of filtered) overallDist[r.sleepQuality]++;

  // Sleep score 0-100 based on good night rate and avg sleep hours
  const goodRate = totalRecords > 0 ? overallGoodNights / totalRecords : 0;
  const hoursScore = Math.min(1, overallAvgSleepHours / 9); // 9h is ideal for teens
  const overallSleepScore = totalRecords > 0
    ? Math.round((goodRate * 70 + hoursScore * 30))
    : 0;

  return {
    totalRecords,
    childMetrics,
    overallAvgSleepHours,
    overallGoodNightRate: pct(overallGoodNights, totalRecords),
    overallPoorNightRate: pct(overallPoorNights, totalRecords),
    overallAvgDisturbancesPerNight: totalRecords > 0
      ? Math.round((overallTotalDisturbances / totalRecords) * 100) / 100
      : 0,
    overallSleepQualityDistribution: overallDist,
    overallSleepScore,
  };
}

export function evaluateDisturbances(
  records: NightRecord[],
  periodStart: string,
  periodEnd: string,
): DisturbanceResult {
  const filtered = records.filter((r) => inPeriod(r.date, periodStart, periodEnd));
  const allDisturbances = filtered.flatMap((r) => r.disturbances);
  const totalDisturbances = allDisturbances.length;

  // By type
  const disturbancesByType: Record<string, number> = {};
  for (const d of allDisturbances) {
    disturbancesByType[d.type] = (disturbancesByType[d.type] ?? 0) + 1;
  }

  // Avg duration
  const avgDuration = totalDisturbances > 0
    ? Math.round((allDisturbances.reduce((s, d) => s + d.durationMinutes, 0) / totalDisturbances) * 10) / 10
    : 0;

  // Settled after rate
  const settledCount = allDisturbances.filter((d) => d.childSettledAfter).length;
  const settledAfterRate = pct(settledCount, totalDisturbances);

  // Most common type
  let mostCommonType: DisturbanceType | null = null;
  let maxCount = 0;
  for (const [type, count] of Object.entries(disturbancesByType)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonType = type as DisturbanceType;
    }
  }

  // By child
  const childMap = new Map<string, { childName: string; disturbances: NightDisturbance[] }>();
  for (const r of filtered) {
    if (r.disturbances.length > 0) {
      const existing = childMap.get(r.childId);
      if (existing) {
        existing.disturbances.push(...r.disturbances);
      } else {
        childMap.set(r.childId, { childName: r.childName, disturbances: [...r.disturbances] });
      }
    }
  }

  const disturbancesByChild = Array.from(childMap.entries()).map(([childId, data]) => ({
    childId,
    childName: data.childName,
    count: data.disturbances.length,
    types: [...new Set(data.disturbances.map((d) => d.type))],
  }));

  // Time of night distribution
  const timeOfNightDistribution = { early: 0, middle: 0, late: 0 };
  for (const d of allDisturbances) {
    const period = classifyTimeOfNight(d.time);
    timeOfNightDistribution[period]++;
  }

  return {
    totalDisturbances,
    disturbancesByType,
    avgDuration,
    settledAfterRate,
    mostCommonType,
    disturbancesByChild,
    timeOfNightDistribution,
  };
}

export function evaluateNightCare(
  records: NightRecord[],
  periodStart: string,
  periodEnd: string,
): NightCareResult {
  const filtered = records.filter((r) => inPeriod(r.date, periodStart, periodEnd));
  const totalRecords = filtered.length;

  // Night check completion rate
  const nightChecksCompleted = filtered.filter((r) => r.nightCheckCompleted).length;
  const nightCheckCompletionRate = pct(nightChecksCompleted, totalRecords);

  // Bedtime routine rate
  const routinesFollowed = filtered.filter((r) => r.bedtimeRoutineFollowed).length;
  const bedtimeRoutineRate = pct(routinesFollowed, totalRecords);

  // Support provided distribution
  const supportDist: Record<string, number> = {};
  const allDisturbances = filtered.flatMap((r) => r.disturbances);
  for (const d of allDisturbances) {
    for (const s of d.supportProvided) {
      supportDist[s] = (supportDist[s] ?? 0) + 1;
    }
  }

  // Average response to disturbance (avg duration)
  const avgResponseToDisturbance = allDisturbances.length > 0
    ? Math.round((allDisturbances.reduce((s, d) => s + d.durationMinutes, 0) / allDisturbances.length) * 10) / 10
    : 0;

  // Wellbeing improvement rate: children who went from unsettled/distressed at bedtime to settled on waking
  const negativeAtBedtime = filtered.filter(
    (r) => r.wellbeingAtBedtime === "unsettled" || r.wellbeingAtBedtime === "distressed" || r.wellbeingAtBedtime === "dysregulated",
  );
  const improvedByWaking = negativeAtBedtime.filter(
    (r) => r.wellbeingOnWaking === "settled" || r.wellbeingOnWaking === "regulated_with_support",
  ).length;
  const wellbeingImprovementRate = pct(improvedByWaking, negativeAtBedtime.length);

  return {
    nightCheckCompletionRate,
    bedtimeRoutineRate,
    supportProvidedDistribution: supportDist,
    avgResponseToDisturbance,
    wellbeingImprovementRate,
  };
}

export function evaluateSleepPlans(
  records: NightRecord[],
  sleepPlans: SleepPlan[],
  referenceDate: string,
): SleepPlanResult {
  const totalPlans = sleepPlans.length;

  // Plans up to date vs overdue
  const plansUpToDate = sleepPlans.filter((p) => p.reviewDueDate >= referenceDate).length;
  const overduePlans = totalPlans - plansUpToDate;

  // Bedtime adherence: compare actual bedtimes with target bedtimes for children with plans
  const planMap = new Map<string, SleepPlan>();
  for (const p of sleepPlans) {
    planMap.set(p.childId, p);
  }

  let totalAdherence = 0;
  let adherenceCount = 0;
  for (const r of records) {
    const plan = planMap.get(r.childId);
    if (plan) {
      totalAdherence += bedtimeAdherenceScore(r.bedtime, plan.targetBedtime);
      adherenceCount++;
    }
  }
  const bedtimeAdherenceRate = adherenceCount > 0
    ? Math.round(totalAdherence / adherenceCount)
    : 0;

  // Children who appear in records but have no sleep plan
  const childIdsInRecords = [...new Set(records.map((r) => r.childId))];
  const childrenWithPlans = new Set(sleepPlans.map((p) => p.childId));
  const childrenWithoutPlans = childIdsInRecords
    .filter((id) => !childrenWithPlans.has(id))
    .map((id) => {
      const rec = records.find((r) => r.childId === id);
      return { childId: id, childName: rec?.childName ?? id };
    });

  return {
    totalPlans,
    plansUpToDate,
    overduePlans,
    bedtimeAdherenceRate,
    childrenWithoutPlans,
  };
}

export function buildChildSleepProfiles(
  records: NightRecord[],
  sleepPlans: SleepPlan[],
  periodStart: string,
  periodEnd: string,
): ChildSleepProfile[] {
  const filtered = records.filter((r) => inPeriod(r.date, periodStart, periodEnd));

  // Group by child
  const childMap = new Map<string, NightRecord[]>();
  for (const r of filtered) {
    const existing = childMap.get(r.childId) ?? [];
    existing.push(r);
    childMap.set(r.childId, existing);
  }

  const planMap = new Map<string, SleepPlan>();
  for (const p of sleepPlans) {
    planMap.set(p.childId, p);
  }

  return Array.from(childMap.entries()).map(([childId, recs]) => {
    const childName = recs[0].childName;
    const sleepHours = recs.map(calculateSleepHours).filter((h) => h > 0);
    const avgSleepHours = sleepHours.length > 0
      ? Math.round((sleepHours.reduce((s, h) => s + h, 0) / sleepHours.length) * 10) / 10
      : 0;

    // Weighted quality score
    const qualityScores: Record<SleepQuality, number> = { good: 4, fair: 3, poor: 2, very_poor: 1 };
    const totalQuality = recs.reduce((s, r) => s + qualityScores[r.sleepQuality], 0);
    const avgQualityScore = recs.length > 0 ? totalQuality / recs.length : 0;
    let avgSleepQuality: string;
    if (avgQualityScore >= 3.5) avgSleepQuality = "good";
    else if (avgQualityScore >= 2.5) avgSleepQuality = "fair";
    else if (avgQualityScore >= 1.5) avgSleepQuality = "poor";
    else avgSleepQuality = "very_poor";

    // Disturbance frequency
    const totalDisturbances = recs.reduce((s, r) => s + r.disturbances.length, 0);
    const disturbanceFrequency = recs.length > 0
      ? Math.round((totalDisturbances / recs.length) * 100) / 100
      : 0;

    // Common disturbance types
    const typeCounts: Record<string, number> = {};
    for (const r of recs) {
      for (const d of r.disturbances) {
        typeCounts[d.type] = (typeCounts[d.type] ?? 0) + 1;
      }
    }
    const commonDisturbanceTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type as DisturbanceType);

    // Sleep plan
    const plan = planMap.get(childId);
    const hasSleepPlan = !!plan;

    // Bedtime adherence
    let bedtimeAdherence = 0;
    if (plan) {
      const adherences = recs.map((r) => bedtimeAdherenceScore(r.bedtime, plan.targetBedtime));
      bedtimeAdherence = adherences.length > 0
        ? Math.round(adherences.reduce((s, a) => s + a, 0) / adherences.length)
        : 0;
    }

    // Wellbeing trend — compare first half vs second half of period
    const sorted = [...recs].sort((a, b) => a.date.localeCompare(b.date));
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const qualityToNum = (q: SleepQuality) => qualityScores[q];
    const firstAvg = firstHalf.length > 0
      ? firstHalf.reduce((s, r) => s + qualityToNum(r.sleepQuality), 0) / firstHalf.length
      : 0;
    const secondAvg = secondHalf.length > 0
      ? secondHalf.reduce((s, r) => s + qualityToNum(r.sleepQuality), 0) / secondHalf.length
      : 0;

    let wellbeingTrend: "improving" | "stable" | "declining";
    if (secondAvg - firstAvg >= 0.3) wellbeingTrend = "improving";
    else if (firstAvg - secondAvg >= 0.3) wellbeingTrend = "declining";
    else wellbeingTrend = "stable";

    return {
      childId,
      childName,
      avgSleepHours,
      avgSleepQuality,
      disturbanceFrequency,
      commonDisturbanceTypes,
      hasSleepPlan,
      bedtimeAdherence,
      wellbeingTrend,
    };
  });
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generateSleepWellbeingIntelligence(
  records: NightRecord[],
  sleepPlans: SleepPlan[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): SleepWellbeingResult {
  const sleepQuality = evaluateSleepQuality(records, periodStart, periodEnd);
  const disturbances = evaluateDisturbances(records, periodStart, periodEnd);
  const nightCare = evaluateNightCare(records, periodStart, periodEnd);
  const sleepPlansResult = evaluateSleepPlans(records, sleepPlans, referenceDate);
  const childProfiles = buildChildSleepProfiles(records, sleepPlans, periodStart, periodEnd);

  // ── Scoring ──────────────────────────────────────────────────────────

  // No data → zero score
  const hasData = sleepQuality.totalRecords > 0;

  // 1. Sleep quality (30)
  let sleepScore = 0;
  if (hasData) {
    if (sleepQuality.overallGoodNightRate >= 80) sleepScore = 30;
    else if (sleepQuality.overallGoodNightRate >= 60) sleepScore = 22;
    else if (sleepQuality.overallGoodNightRate >= 40) sleepScore = 14;
    else sleepScore = 6;
  }

  // 2. Disturbances (20) — inverted: fewer disturbances + high settled rate = better
  let disturbanceScore = 0;
  if (hasData) {
    const avgDist = sleepQuality.overallAvgDisturbancesPerNight;
    const settledRate = disturbances.settledAfterRate;
    // Low disturbance base score
    let distBase = 0;
    if (avgDist <= 0.2) distBase = 12;
    else if (avgDist <= 0.5) distBase = 9;
    else if (avgDist <= 1.0) distBase = 6;
    else distBase = 3;
    // Settled-after bonus
    let settledBonus = 0;
    if (disturbances.totalDisturbances > 0) {
      if (settledRate >= 90) settledBonus = 8;
      else if (settledRate >= 75) settledBonus = 6;
      else if (settledRate >= 50) settledBonus = 4;
      else settledBonus = 2;
    } else {
      // No disturbances at all — full bonus
      settledBonus = 8;
    }
    disturbanceScore = Math.min(20, distBase + settledBonus);
  }

  // 3. Night care (30)
  let nightCareScore = 0;
  if (hasData) {
    // Night check completion (15)
    if (nightCare.nightCheckCompletionRate >= 95) nightCareScore += 15;
    else if (nightCare.nightCheckCompletionRate >= 85) nightCareScore += 11;
    else if (nightCare.nightCheckCompletionRate >= 70) nightCareScore += 7;
    else nightCareScore += 3;
    // Bedtime routine (8)
    if (nightCare.bedtimeRoutineRate >= 90) nightCareScore += 8;
    else if (nightCare.bedtimeRoutineRate >= 75) nightCareScore += 6;
    else if (nightCare.bedtimeRoutineRate >= 60) nightCareScore += 4;
    else nightCareScore += 2;
    // Wellbeing improvement (7)
    if (nightCare.wellbeingImprovementRate >= 70) nightCareScore += 7;
    else if (nightCare.wellbeingImprovementRate >= 50) nightCareScore += 5;
    else if (nightCare.wellbeingImprovementRate >= 30) nightCareScore += 3;
    else nightCareScore += 1;
  }

  // 4. Sleep plans (20)
  let planScore = 0;
  if (sleepPlansResult.totalPlans > 0 || sleepPlansResult.childrenWithoutPlans.length > 0) {
    // All children have plans (8)
    if (sleepPlansResult.childrenWithoutPlans.length === 0 && sleepPlansResult.totalPlans > 0) planScore += 8;
    else if (sleepPlansResult.childrenWithoutPlans.length <= 1) planScore += 5;
    else planScore += 2;
    // Plans up to date (6)
    if (sleepPlansResult.totalPlans > 0) {
      const upToDateRate = pct(sleepPlansResult.plansUpToDate, sleepPlansResult.totalPlans);
      if (upToDateRate >= 100) planScore += 6;
      else if (upToDateRate >= 75) planScore += 4;
      else planScore += 2;
    }
    // Bedtime adherence (6)
    if (sleepPlansResult.bedtimeAdherenceRate >= 85) planScore += 6;
    else if (sleepPlansResult.bedtimeAdherenceRate >= 70) planScore += 4;
    else if (sleepPlansResult.bedtimeAdherenceRate >= 50) planScore += 2;
    else planScore += 1;
  }

  const overallScore = Math.min(100, Math.max(0,
    sleepScore + disturbanceScore + nightCareScore + planScore,
  ));

  const rating: SleepWellbeingResult["rating"] =
    overallScore >= 80 ? "outstanding"
    : overallScore >= 60 ? "good"
    : overallScore >= 40 ? "requires_improvement"
    : "inadequate";

  // ── Strengths / Areas / Actions ──────────────────────────────────────

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  if (sleepQuality.overallGoodNightRate >= 80) {
    strengths.push("Excellent sleep quality — over 80% of nights rated good");
  } else if (sleepQuality.overallGoodNightRate >= 60) {
    strengths.push("Good sleep quality — majority of nights rated good");
  }
  if (nightCare.nightCheckCompletionRate >= 95) {
    strengths.push("Night checks completed consistently — above 95% completion rate");
  }
  if (nightCare.bedtimeRoutineRate >= 90) {
    strengths.push("Bedtime routines followed consistently — promoting good sleep hygiene");
  }
  if (disturbances.settledAfterRate >= 90 && disturbances.totalDisturbances > 0) {
    strengths.push("Staff respond effectively to disturbances — over 90% of children settle after support");
  }
  if (nightCare.wellbeingImprovementRate >= 70) {
    strengths.push("Strong wellbeing improvement — children who arrive unsettled are supported to settle by morning");
  }
  if (sleepPlansResult.childrenWithoutPlans.length === 0 && sleepPlansResult.totalPlans > 0) {
    strengths.push("All children have personalised sleep plans in place");
  }
  if (sleepPlansResult.overduePlans === 0 && sleepPlansResult.totalPlans > 0) {
    strengths.push("All sleep plans reviewed and up to date");
  }
  if (strengths.length === 0) {
    strengths.push("No significant strengths identified — sleep and wellbeing monitoring requires attention");
  }

  // Areas for improvement
  if (sleepQuality.overallGoodNightRate < 60) {
    areasForImprovement.push(
      `Good night rate at ${sleepQuality.overallGoodNightRate}% — investigate causes of poor sleep and develop targeted strategies`,
    );
  }
  if (nightCare.nightCheckCompletionRate < 95) {
    areasForImprovement.push(
      `Night check completion at ${nightCare.nightCheckCompletionRate}% — ensure all night checks are recorded consistently`,
    );
  }
  if (nightCare.bedtimeRoutineRate < 90) {
    areasForImprovement.push(
      `Bedtime routine adherence at ${nightCare.bedtimeRoutineRate}% — reinforce importance of consistent routines`,
    );
  }
  if (disturbances.settledAfterRate < 75 && disturbances.totalDisturbances > 0) {
    areasForImprovement.push(
      `Only ${disturbances.settledAfterRate}% of children settle after disturbance — review night-time support strategies`,
    );
  }
  if (sleepPlansResult.overduePlans > 0) {
    areasForImprovement.push(
      `${sleepPlansResult.overduePlans} sleep plan${sleepPlansResult.overduePlans !== 1 ? "s" : ""} overdue for review — schedule reviews promptly`,
    );
  }
  if (areasForImprovement.length === 0) {
    areasForImprovement.push("No significant areas for improvement identified");
  }

  // Immediate actions
  if (sleepPlansResult.childrenWithoutPlans.length > 0) {
    const names = sleepPlansResult.childrenWithoutPlans.map((c) => c.childName).join(", ");
    actions.push(
      `HIGH: ${sleepPlansResult.childrenWithoutPlans.length} child${sleepPlansResult.childrenWithoutPlans.length !== 1 ? "ren" : ""} without sleep plans (${names}) — create plans immediately`,
    );
  }
  if (nightCare.nightCheckCompletionRate < 80) {
    actions.push(
      "URGENT: Night check completion below 80% — address with night staff immediately to ensure children's safety",
    );
  }
  if (sleepQuality.overallPoorNightRate >= 50) {
    actions.push(
      "HIGH: Over half of nights rated poor/very poor — convene team meeting to review night-time care approach",
    );
  }
  // Check for children with very poor sleep patterns
  for (const profile of childProfiles) {
    if (profile.avgSleepQuality === "very_poor" || profile.avgSleepQuality === "poor") {
      actions.push(
        `HIGH: ${profile.childName} has consistently ${profile.avgSleepQuality.replace("_", " ")} sleep — review care plan and consider referral to CAMHS/sleep specialist`,
      );
    }
  }
  if (actions.length === 0) {
    actions.push("No immediate actions required — sleep and wellbeing monitoring is well maintained");
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 10 — Health and wellbeing of children",
    "CHR 2015 Reg 6 — Quality of care standard",
    "CHR 2015 Reg 34 — Night-time staffing arrangements",
    "SCCIF — Experiences and progress of children",
    "Working Together 2023 — Promoting children's welfare",
    "NICE CG170 — Sleep disorders in children and young people",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    sleepQuality,
    disturbances,
    nightCare,
    sleepPlans: sleepPlansResult,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
