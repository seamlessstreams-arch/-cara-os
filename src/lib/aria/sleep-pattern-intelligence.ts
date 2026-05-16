// ══════════════════════════════════════════════════════════════════════════════
// ARIA Intelligence Engine — Sleep Pattern Analysis
//
// Pure deterministic analysis of sleep data for looked-after children.
// Identifies:
//   - Sleep quality & duration adequacy (age-adjusted)
//   - Disruption patterns (night waking, settling difficulty, nightmares)
//   - Impact indicators (mood, behaviour, education next-day)
//   - Trends (improving, declining, stable)
//   - Regulatory alignment: CHR 2015 Reg 6 (Quality of Care), SCCIF Health
//
// No AI calls. Fully testable. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export interface SleepNight {
  date: string; // ISO date
  bedtime: string; // HH:MM (24h)
  settledTime: string; // HH:MM — when actually fell asleep
  wakeTime: string; // HH:MM — final wake
  nightWakings: number;
  nightmares: boolean;
  nightTerrors: boolean;
  wetBed: boolean;
  sleepwalking: boolean;
  medicationGiven: boolean;
  medicationName?: string;
  resistedBedtime: boolean;
  environmentalDisruption: boolean; // noise, other YP, etc.
  moodOnWake: "good" | "neutral" | "poor" | "distressed";
  staffNotes?: string;
  nextDayImpact?: "none" | "mild" | "moderate" | "severe";
}

export interface SleepInput {
  childId: string;
  childName: string;
  age: number;
  nights: SleepNight[];
  knownConditions?: string[]; // e.g. ADHD, anxiety, PTSD, ASD
  currentMedications?: string[];
  hasHealthPlan: boolean;
  gpNotifiedOfSleepIssues: boolean;
  sleepHygienePlanInPlace: boolean;
}

export interface SleepAssessment {
  childName: string;
  overallScore: number; // 0-100
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate";
  durationScore: number;
  qualityScore: number;
  consistencyScore: number;
  impactScore: number;
  averageDurationHours: number;
  recommendedDurationHours: { min: number; max: number };
  durationAdequacy: "sufficient" | "borderline" | "insufficient";
  averageSettlingMinutes: number;
  averageWakings: number;
  nightmareFrequency: number; // per week (normalised)
  trend: "improving" | "stable" | "declining";
  disruptionPatterns: DisruptionPattern[];
  concerns: SleepConcern[];
  strengths: SleepStrength[];
  regulatoryFlags: RegulatoryFlag[];
  recommendations: string[];
  summary: string;
}

export interface DisruptionPattern {
  type: string;
  frequency: "nightly" | "most_nights" | "weekly" | "occasional" | "rare";
  description: string;
  significance: "high" | "medium" | "low";
}

export interface SleepConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: string;
  description: string;
}

export interface SleepStrength {
  category: string;
  description: string;
}

export interface RegulatoryFlag {
  regulation: string;
  area: string;
  status: "met" | "partially_met" | "not_met";
  detail: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

// NHS recommended sleep durations by age (hours)
const RECOMMENDED_SLEEP: Record<number, { min: number; max: number }> = {
  5: { min: 9, max: 11 },
  6: { min: 9, max: 11 },
  7: { min: 9, max: 11 },
  8: { min: 9, max: 11 },
  9: { min: 9, max: 11 },
  10: { min: 9, max: 11 },
  11: { min: 9, max: 11 },
  12: { min: 9, max: 11 },
  13: { min: 8, max: 10 },
  14: { min: 8, max: 10 },
  15: { min: 8, max: 10 },
  16: { min: 8, max: 10 },
  17: { min: 8, max: 10 },
  18: { min: 7, max: 9 },
};

function getRecommended(age: number): { min: number; max: number } {
  if (age <= 5) return { min: 9, max: 11 };
  if (age >= 18) return { min: 7, max: 9 };
  return RECOMMENDED_SLEEP[age] ?? { min: 8, max: 10 };
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function analyseSleepPatterns(input: SleepInput): SleepAssessment {
  const { nights, childName, age } = input;
  const recommended = getRecommended(age);

  if (nights.length === 0) {
    return buildEmptyAssessment(input, recommended);
  }

  // ── Calculate durations ────────────────────────────────────────────────
  const durations = nights.map(n => calculateDuration(n.settledTime, n.wakeTime));
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

  // ── Duration score (0-100) ────────────────────────────────────────────
  const durationScore = scoreDuration(avgDuration, recommended);

  // ── Duration adequacy ─────────────────────────────────────────────────
  const durationAdequacy: "sufficient" | "borderline" | "insufficient" =
    avgDuration >= recommended.min ? "sufficient" :
    avgDuration >= recommended.min - 1 ? "borderline" : "insufficient";

  // ── Settling time ──────────────────────────────────────────────────────
  const settlingMinutes = nights.map(n => calculateSettlingMinutes(n.bedtime, n.settledTime));
  const avgSettling = settlingMinutes.reduce((a, b) => a + b, 0) / settlingMinutes.length;

  // ── Quality score (0-100) ─────────────────────────────────────────────
  const qualityScore = scoreQuality(nights);

  // ── Consistency score (0-100) ─────────────────────────────────────────
  const consistencyScore = scoreConsistency(nights, durations);

  // ── Impact score (0-100, higher = less negative impact) ───────────────
  const impactScore = scoreImpact(nights);

  // ── Average wakings ───────────────────────────────────────────────────
  const avgWakings = nights.reduce((a, n) => a + n.nightWakings, 0) / nights.length;

  // ── Nightmare frequency (per week) ────────────────────────────────────
  const nightsSpan = nights.length;
  const nightmareCount = nights.filter(n => n.nightmares).length;
  const nightmareFrequency = nightsSpan > 0 ? (nightmareCount / nightsSpan) * 7 : 0;

  // ── Trend analysis ────────────────────────────────────────────────────
  const trend = analyseTrend(nights, durations);

  // ── Disruption patterns ───────────────────────────────────────────────
  const disruptionPatterns = identifyDisruptionPatterns(nights);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns = identifyConcerns(input, avgDuration, recommended, avgSettling, avgWakings, nightmareFrequency, nights);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths = identifyStrengths(input, avgDuration, recommended, avgSettling, avgWakings, nights);

  // ── Regulatory flags ──────────────────────────────────────────────────
  const regulatoryFlags = assessRegulatory(input, avgDuration, recommended, concerns);

  // ── Overall score ─────────────────────────────────────────────────────
  const overallScore = Math.round(
    durationScore * 0.30 +
    qualityScore * 0.30 +
    consistencyScore * 0.20 +
    impactScore * 0.20
  );

  const overallRating = scoreToRating(overallScore);

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations = buildRecommendations(input, avgDuration, recommended, avgSettling, avgWakings, nightmareFrequency, concerns);

  // ── Summary ───────────────────────────────────────────────────────────
  const summary = buildSummary(childName, overallRating, avgDuration, recommended, trend, concerns.length);

  return {
    childName,
    overallScore,
    overallRating,
    durationScore,
    qualityScore,
    consistencyScore,
    impactScore,
    averageDurationHours: Math.round(avgDuration * 10) / 10,
    recommendedDurationHours: recommended,
    durationAdequacy,
    averageSettlingMinutes: Math.round(avgSettling),
    averageWakings: Math.round(avgWakings * 10) / 10,
    nightmareFrequency: Math.round(nightmareFrequency * 10) / 10,
    trend,
    disruptionPatterns,
    concerns,
    strengths,
    regulatoryFlags,
    recommendations,
    summary,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function calculateDuration(settledTime: string, wakeTime: string): number {
  const [sh, sm] = settledTime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let settledMinutes = sh * 60 + sm;
  let wakeMinutes = wh * 60 + wm;
  // If settled time is in the evening (>= 12:00) and wake is in the morning (< 12:00)
  if (settledMinutes > wakeMinutes) {
    wakeMinutes += 24 * 60;
  }
  return (wakeMinutes - settledMinutes) / 60;
}

function calculateSettlingMinutes(bedtime: string, settledTime: string): number {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [sh, sm] = settledTime.split(":").map(Number);
  let bedMinutes = bh * 60 + bm;
  let settledMinutes = sh * 60 + sm;
  if (settledMinutes < bedMinutes) {
    settledMinutes += 24 * 60;
  }
  return settledMinutes - bedMinutes;
}

function scoreDuration(avgDuration: number, recommended: { min: number; max: number }): number {
  if (avgDuration >= recommended.min && avgDuration <= recommended.max) return 100;
  if (avgDuration > recommended.max) {
    // Slight oversleep is fine, but excessive is not great
    const over = avgDuration - recommended.max;
    return Math.max(50, 100 - over * 15);
  }
  // Under recommended
  const deficit = recommended.min - avgDuration;
  if (deficit <= 0.5) return 85;
  if (deficit <= 1) return 70;
  if (deficit <= 1.5) return 55;
  if (deficit <= 2) return 40;
  return Math.max(10, 40 - (deficit - 2) * 20);
}

function scoreQuality(nights: SleepNight[]): number {
  if (nights.length === 0) return 50;
  let total = 0;
  for (const n of nights) {
    let nightScore = 100;
    // Deductions
    nightScore -= n.nightWakings * 12;
    if (n.nightmares) nightScore -= 15;
    if (n.nightTerrors) nightScore -= 20;
    if (n.sleepwalking) nightScore -= 10;
    if (n.wetBed) nightScore -= 8;
    if (n.resistedBedtime) nightScore -= 10;
    if (n.environmentalDisruption) nightScore -= 12;
    total += Math.max(0, nightScore);
  }
  return Math.round(total / nights.length);
}

function scoreConsistency(nights: SleepNight[], durations: number[]): number {
  if (nights.length < 3) return 50;

  // Bedtime consistency (standard deviation of bedtime in minutes)
  const bedtimeMinutes = nights.map(n => {
    const [h, m] = n.bedtime.split(":").map(Number);
    let mins = h * 60 + m;
    if (mins < 720) mins += 1440; // after midnight → next day reference
    return mins;
  });
  const bedtimeSD = standardDeviation(bedtimeMinutes);

  // Duration consistency
  const durationSD = standardDeviation(durations.map(d => d * 60)); // in minutes

  // Score: lower SD = better consistency
  let score = 100;
  // Bedtime: 0-15min SD = perfect, 30min = okay, 60+ = poor
  score -= Math.min(40, bedtimeSD * 1.0);
  // Duration: 0-15min SD = perfect, 45min+ = poor
  score -= Math.min(40, durationSD * 0.9);

  return Math.max(0, Math.round(score));
}

function scoreImpact(nights: SleepNight[]): number {
  if (nights.length === 0) return 50;
  let total = 0;
  for (const n of nights) {
    let nightScore = 100;
    // Mood on wake
    if (n.moodOnWake === "poor") nightScore -= 20;
    if (n.moodOnWake === "distressed") nightScore -= 40;
    if (n.moodOnWake === "neutral") nightScore -= 5;
    // Next day impact
    if (n.nextDayImpact === "mild") nightScore -= 10;
    if (n.nextDayImpact === "moderate") nightScore -= 25;
    if (n.nextDayImpact === "severe") nightScore -= 45;
    total += Math.max(0, nightScore);
  }
  return Math.round(total / nights.length);
}

function analyseTrend(nights: SleepNight[], durations: number[]): "improving" | "stable" | "declining" {
  if (nights.length < 6) return "stable";

  const half = Math.floor(nights.length / 2);
  const firstHalf = durations.slice(0, half);
  const secondHalf = durations.slice(half);

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  // Also look at quality indicators
  const firstQualityNights = nights.slice(0, half);
  const secondQualityNights = nights.slice(half);

  const firstWakings = firstQualityNights.reduce((a, n) => a + n.nightWakings, 0) / firstQualityNights.length;
  const secondWakings = secondQualityNights.reduce((a, n) => a + n.nightWakings, 0) / secondQualityNights.length;

  // Composite: duration improvement + waking reduction
  const durationDelta = secondAvg - firstAvg; // positive = more sleep = better
  const wakingDelta = firstWakings - secondWakings; // positive = fewer wakings = better

  const composite = durationDelta * 2 + wakingDelta * 3;

  if (composite > 1.5) return "improving";
  if (composite < -1.5) return "declining";
  return "stable";
}

function identifyDisruptionPatterns(nights: SleepNight[]): DisruptionPattern[] {
  const patterns: DisruptionPattern[] = [];
  if (nights.length === 0) return patterns;

  const totalNights = nights.length;

  // Night wakings
  const wakingNights = nights.filter(n => n.nightWakings > 0).length;
  const wakingRatio = wakingNights / totalNights;
  if (wakingRatio > 0.2) {
    patterns.push({
      type: "night_wakings",
      frequency: ratioToFrequency(wakingRatio),
      description: `Waking during the night on ${Math.round(wakingRatio * 100)}% of nights`,
      significance: wakingRatio > 0.7 ? "high" : wakingRatio > 0.4 ? "medium" : "low",
    });
  }

  // Nightmares
  const nightmareNights = nights.filter(n => n.nightmares).length;
  const nightmareRatio = nightmareNights / totalNights;
  if (nightmareRatio > 0.1) {
    patterns.push({
      type: "nightmares",
      frequency: ratioToFrequency(nightmareRatio),
      description: `Nightmares reported on ${Math.round(nightmareRatio * 100)}% of nights`,
      significance: nightmareRatio > 0.5 ? "high" : nightmareRatio > 0.25 ? "medium" : "low",
    });
  }

  // Bedtime resistance
  const resistanceNights = nights.filter(n => n.resistedBedtime).length;
  const resistanceRatio = resistanceNights / totalNights;
  if (resistanceRatio > 0.2) {
    patterns.push({
      type: "bedtime_resistance",
      frequency: ratioToFrequency(resistanceRatio),
      description: `Bedtime resistance on ${Math.round(resistanceRatio * 100)}% of nights`,
      significance: resistanceRatio > 0.6 ? "high" : resistanceRatio > 0.35 ? "medium" : "low",
    });
  }

  // Environmental disruption
  const envNights = nights.filter(n => n.environmentalDisruption).length;
  const envRatio = envNights / totalNights;
  if (envRatio > 0.15) {
    patterns.push({
      type: "environmental_disruption",
      frequency: ratioToFrequency(envRatio),
      description: `Environmental disruptions on ${Math.round(envRatio * 100)}% of nights`,
      significance: envRatio > 0.5 ? "high" : envRatio > 0.3 ? "medium" : "low",
    });
  }

  // Night terrors
  const terrorNights = nights.filter(n => n.nightTerrors).length;
  const terrorRatio = terrorNights / totalNights;
  if (terrorRatio > 0.05) {
    patterns.push({
      type: "night_terrors",
      frequency: ratioToFrequency(terrorRatio),
      description: `Night terrors on ${Math.round(terrorRatio * 100)}% of nights`,
      significance: terrorRatio > 0.3 ? "high" : terrorRatio > 0.15 ? "medium" : "low",
    });
  }

  // Sleepwalking
  const walkNights = nights.filter(n => n.sleepwalking).length;
  const walkRatio = walkNights / totalNights;
  if (walkRatio > 0.05) {
    patterns.push({
      type: "sleepwalking",
      frequency: ratioToFrequency(walkRatio),
      description: `Sleepwalking on ${Math.round(walkRatio * 100)}% of nights`,
      significance: walkRatio > 0.2 ? "high" : "medium",
    });
  }

  return patterns;
}

function identifyConcerns(
  input: SleepInput,
  avgDuration: number,
  recommended: { min: number; max: number },
  avgSettling: number,
  avgWakings: number,
  nightmareFreq: number,
  nights: SleepNight[],
): SleepConcern[] {
  const concerns: SleepConcern[] = [];

  // Critical: severe sleep deprivation
  if (avgDuration < recommended.min - 2) {
    concerns.push({
      severity: "critical",
      category: "sleep_deprivation",
      description: `Severe sleep deficit: averaging ${Math.round(avgDuration * 10) / 10}h vs recommended ${recommended.min}-${recommended.max}h`,
    });
  } else if (avgDuration < recommended.min - 1) {
    concerns.push({
      severity: "significant",
      category: "sleep_deprivation",
      description: `Sleep deficit: averaging ${Math.round(avgDuration * 10) / 10}h vs recommended ${recommended.min}-${recommended.max}h`,
    });
  } else if (avgDuration < recommended.min) {
    concerns.push({
      severity: "moderate",
      category: "sleep_deprivation",
      description: `Mild sleep deficit: averaging ${Math.round(avgDuration * 10) / 10}h vs recommended ${recommended.min}h minimum`,
    });
  }

  // High settling time
  if (avgSettling > 60) {
    concerns.push({
      severity: "significant",
      category: "settling_difficulty",
      description: `Average settling time of ${Math.round(avgSettling)} minutes indicates significant difficulty falling asleep`,
    });
  } else if (avgSettling > 40) {
    concerns.push({
      severity: "moderate",
      category: "settling_difficulty",
      description: `Elevated settling time: averaging ${Math.round(avgSettling)} minutes to fall asleep`,
    });
  }

  // Frequent wakings
  if (avgWakings >= 3) {
    concerns.push({
      severity: "significant",
      category: "night_wakings",
      description: `Frequent night wakings: averaging ${Math.round(avgWakings * 10) / 10} per night`,
    });
  } else if (avgWakings >= 2) {
    concerns.push({
      severity: "moderate",
      category: "night_wakings",
      description: `Repeated night wakings: averaging ${Math.round(avgWakings * 10) / 10} per night`,
    });
  }

  // Nightmare frequency
  if (nightmareFreq >= 4) {
    concerns.push({
      severity: "critical",
      category: "nightmares",
      description: `Very high nightmare frequency: approximately ${Math.round(nightmareFreq * 10) / 10} per week — may indicate trauma processing`,
    });
  } else if (nightmareFreq >= 2) {
    concerns.push({
      severity: "significant",
      category: "nightmares",
      description: `Elevated nightmare frequency: approximately ${Math.round(nightmareFreq * 10) / 10} per week`,
    });
  }

  // Severe next-day impact
  const severeImpactNights = nights.filter(n => n.nextDayImpact === "severe").length;
  if (severeImpactNights > 0 && nights.length > 0) {
    const ratio = severeImpactNights / nights.length;
    if (ratio > 0.3) {
      concerns.push({
        severity: "critical",
        category: "daytime_impact",
        description: `Severe daytime impact on ${Math.round(ratio * 100)}% of days — affecting functioning`,
      });
    } else if (ratio > 0.1) {
      concerns.push({
        severity: "significant",
        category: "daytime_impact",
        description: `Severe daytime impact noted on ${severeImpactNights} of ${nights.length} days`,
      });
    }
  }

  // Distressed wake mood
  const distressedMornings = nights.filter(n => n.moodOnWake === "distressed").length;
  if (distressedMornings > 0 && nights.length > 0) {
    const ratio = distressedMornings / nights.length;
    if (ratio > 0.3) {
      concerns.push({
        severity: "significant",
        category: "emotional_state",
        description: `Waking distressed on ${Math.round(ratio * 100)}% of mornings`,
      });
    }
  }

  // Medication dependency
  const medNights = nights.filter(n => n.medicationGiven).length;
  if (medNights > 0 && nights.length > 0) {
    const medRatio = medNights / nights.length;
    if (medRatio > 0.7) {
      concerns.push({
        severity: "moderate",
        category: "medication_use",
        description: `Sleep medication used on ${Math.round(medRatio * 100)}% of nights — monitor dependency`,
      });
    }
  }

  // No health plan when issues present
  if (!input.hasHealthPlan && concerns.length > 0) {
    concerns.push({
      severity: "moderate",
      category: "care_planning",
      description: "Sleep issues identified but no health plan in place addressing sleep",
    });
  }

  // GP not notified when significant issues
  if (!input.gpNotifiedOfSleepIssues && concerns.some(c => c.severity === "critical" || c.severity === "significant")) {
    concerns.push({
      severity: "significant",
      category: "health_referral",
      description: "Significant sleep issues present but GP has not been notified",
    });
  }

  return concerns;
}

function identifyStrengths(
  input: SleepInput,
  avgDuration: number,
  recommended: { min: number; max: number },
  avgSettling: number,
  avgWakings: number,
  nights: SleepNight[],
): SleepStrength[] {
  const strengths: SleepStrength[] = [];

  if (avgDuration >= recommended.min) {
    strengths.push({
      category: "duration",
      description: "Achieving recommended sleep duration for age",
    });
  }

  if (avgSettling <= 20) {
    strengths.push({
      category: "settling",
      description: "Good settling — falling asleep within 20 minutes",
    });
  }

  if (avgWakings < 0.5) {
    strengths.push({
      category: "continuity",
      description: "Good sleep continuity — minimal night wakings",
    });
  }

  const goodMornings = nights.filter(n => n.moodOnWake === "good").length;
  if (nights.length > 0 && goodMornings / nights.length > 0.7) {
    strengths.push({
      category: "mood",
      description: "Consistently waking in good mood",
    });
  }

  if (input.sleepHygienePlanInPlace) {
    strengths.push({
      category: "care_planning",
      description: "Sleep hygiene plan in place and being followed",
    });
  }

  const noResistance = nights.filter(n => !n.resistedBedtime).length;
  if (nights.length > 0 && noResistance / nights.length > 0.85) {
    strengths.push({
      category: "routine",
      description: "Good bedtime compliance — rarely resists bedtime",
    });
  }

  return strengths;
}

function assessRegulatory(
  input: SleepInput,
  avgDuration: number,
  recommended: { min: number; max: number },
  concerns: SleepConcern[],
): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  // CHR 2015 Reg 6(1) — Quality of care standard
  const hasCritical = concerns.some(c => c.severity === "critical");
  const hasSignificant = concerns.some(c => c.severity === "significant");
  flags.push({
    regulation: "CHR 2015 Reg 6(1)",
    area: "Health & Well-being",
    status: hasCritical ? "not_met" : hasSignificant ? "partially_met" : "met",
    detail: hasCritical
      ? "Critical sleep issues impacting child's health and well-being"
      : hasSignificant
      ? "Significant sleep concerns require attention to meet quality of care standard"
      : "Sleep needs being appropriately met",
  });

  // CHR 2015 Reg 6(2)(b)(i) — Physical health needs
  const sleepDeprivationPresent = avgDuration < recommended.min - 1;
  flags.push({
    regulation: "CHR 2015 Reg 6(2)(b)(i)",
    area: "Physical Health",
    status: sleepDeprivationPresent ? "not_met" : avgDuration < recommended.min ? "partially_met" : "met",
    detail: sleepDeprivationPresent
      ? "Significant sleep deprivation affecting physical health"
      : avgDuration < recommended.min
      ? "Borderline sleep duration — monitoring required"
      : "Adequate sleep supporting physical health",
  });

  // SCCIF — Health outcomes
  const healthPlanFlag: RegulatoryFlag = {
    regulation: "SCCIF",
    area: "Health Outcomes",
    status: (input.hasHealthPlan || concerns.length === 0) ? "met" : "partially_met",
    detail: !input.hasHealthPlan && concerns.length > 0
      ? "Sleep issues identified without a health plan to address them"
      : "Health arrangements support good sleep outcomes",
  };
  flags.push(healthPlanFlag);

  // GP referral
  if (hasCritical || hasSignificant) {
    flags.push({
      regulation: "CHR 2015 Reg 6(2)(b)",
      area: "Healthcare Access",
      status: input.gpNotifiedOfSleepIssues ? "met" : "not_met",
      detail: input.gpNotifiedOfSleepIssues
        ? "GP notified of sleep concerns"
        : "GP not yet notified of significant sleep issues — referral needed",
    });
  }

  return flags;
}

function buildRecommendations(
  input: SleepInput,
  avgDuration: number,
  recommended: { min: number; max: number },
  avgSettling: number,
  avgWakings: number,
  nightmareFreq: number,
  concerns: SleepConcern[],
): string[] {
  const recs: string[] = [];

  if (avgDuration < recommended.min) {
    recs.push(`Aim for earlier bedtime to achieve recommended ${recommended.min}–${recommended.max} hours`);
  }

  if (avgSettling > 40) {
    recs.push("Review bedtime routine — consider calming activities 30 minutes before bed");
  }

  if (avgWakings >= 2) {
    recs.push("Investigate causes of night waking — consider environment, anxiety, and physical comfort");
  }

  if (nightmareFreq >= 2) {
    recs.push("Frequent nightmares — consider referral to CAMHS or therapeutic support");
  }

  if (!input.sleepHygienePlanInPlace && concerns.length > 0) {
    recs.push("Develop a sleep hygiene plan tailored to this young person's needs");
  }

  if (!input.gpNotifiedOfSleepIssues && concerns.some(c => c.severity === "critical" || c.severity === "significant")) {
    recs.push("Refer sleep concerns to GP for assessment");
  }

  if (input.knownConditions?.includes("ADHD") || input.knownConditions?.includes("ASD")) {
    recs.push("Consider sensory environment adjustments for neurodivergent needs");
  }

  const envNights = input.nights.filter(n => n.environmentalDisruption).length;
  if (input.nights.length > 0 && envNights / input.nights.length > 0.3) {
    recs.push("Address environmental disruptions — review bedroom environment and home routines");
  }

  return recs;
}

function buildSummary(
  childName: string,
  rating: string,
  avgDuration: number,
  recommended: { min: number; max: number },
  trend: string,
  concernCount: number,
): string {
  const durationDesc = avgDuration >= recommended.min
    ? "achieving recommended sleep duration"
    : `averaging ${Math.round(avgDuration * 10) / 10}h (below recommended ${recommended.min}h minimum)`;

  const trendDesc = trend === "improving" ? "Sleep patterns are improving." :
    trend === "declining" ? "Sleep patterns are declining." : "";

  const concernDesc = concernCount === 0
    ? "No significant concerns identified."
    : `${concernCount} concern${concernCount > 1 ? "s" : ""} identified requiring attention.`;

  return `${childName} is ${durationDesc}. Overall rating: ${rating.replace(/_/g, " ")}. ${trendDesc} ${concernDesc}`.trim();
}

function buildEmptyAssessment(input: SleepInput, recommended: { min: number; max: number }): SleepAssessment {
  return {
    childName: input.childName,
    overallScore: 0,
    overallRating: "inadequate",
    durationScore: 0,
    qualityScore: 0,
    consistencyScore: 0,
    impactScore: 0,
    averageDurationHours: 0,
    recommendedDurationHours: recommended,
    durationAdequacy: "insufficient",
    averageSettlingMinutes: 0,
    averageWakings: 0,
    nightmareFrequency: 0,
    trend: "stable",
    disruptionPatterns: [],
    concerns: [{
      severity: "critical",
      category: "data_quality",
      description: "No sleep data recorded — unable to assess sleep patterns",
    }],
    strengths: [],
    regulatoryFlags: [{
      regulation: "CHR 2015 Reg 6(1)",
      area: "Health & Well-being",
      status: "not_met",
      detail: "No sleep monitoring data available to evidence quality of care",
    }],
    recommendations: ["Begin recording nightly sleep data to enable assessment"],
    summary: `${input.childName}: No sleep data available. Recording must begin to assess sleep health.`,
  };
}

// ── Utility ─────────────────────────────────────────────────────────────────

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function ratioToFrequency(ratio: number): "nightly" | "most_nights" | "weekly" | "occasional" | "rare" {
  if (ratio >= 0.9) return "nightly";
  if (ratio >= 0.6) return "most_nights";
  if (ratio >= 0.3) return "weekly";
  if (ratio >= 0.15) return "occasional";
  return "rare";
}

function scoreToRating(score: number): "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "adequate";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}
