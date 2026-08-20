// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME NOISE & SOUND MANAGEMENT INTELLIGENCE ENGINE
// Monitors the home's sound environment quality including noise level monitoring,
// quiet hours compliance, sensory-friendly environment adaptations, sound
// insulation adequacy, and child comfort with noise levels.
// Measures noise monitoring rate, quiet hours compliance, sensory environment
// adaptation, sound insulation adequacy, child comfort, and staff awareness.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Premises), Reg 5 (Placing authority/child welfare).
// SCCIF: "Experiences and progress", "Living in the home".
// Store keys: noiseMonitoringRecords, quietHoursRecords,
//             sensoryEnvironmentRecords, soundInsulationRecords,
//             childComfortRecords
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, meets } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface NoiseMonitoringRecordInput {
  id: string;
  date: string;
  time_of_day: "morning" | "afternoon" | "evening" | "night";
  location: "bedroom" | "communal_area" | "kitchen" | "bathroom" | "garden" | "hallway" | "study_room" | "other";
  decibel_reading: number;
  acceptable_level: boolean;
  source_identified: boolean;
  source_type: "children" | "staff" | "equipment" | "external" | "building" | "other";
  action_taken: boolean;
  action_description: string;
  staff_member: string;
  monitoring_method: "meter" | "observation" | "complaint_response" | "routine_check";
  notes: string;
  created_at: string;
}

export interface QuietHoursRecordInput {
  id: string;
  date: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
  compliant: boolean;
  disruptions_count: number;
  disruption_type: "child_disturbance" | "staff_activity" | "external_noise" | "equipment" | "visitor" | "none";
  duration_of_disruption_minutes: number;
  children_affected_count: number;
  resolution_effective: boolean;
  staff_responded_promptly: boolean;
  child_feedback_obtained: boolean;
  notes: string;
  created_at: string;
}

export interface SensoryEnvironmentRecordInput {
  id: string;
  date: string;
  child_id: string;
  adaptation_type: "noise_cancelling_equipment" | "quiet_space" | "sound_proofing" | "white_noise" | "music_therapy" | "sensory_room" | "ear_defenders" | "schedule_adjustment" | "other";
  adaptation_in_place: boolean;
  child_using_adaptation: boolean;
  effectiveness_rating: number; // 1-5
  child_feedback_positive: boolean;
  reviewed_with_child: boolean;
  linked_to_care_plan: boolean;
  professional_recommended: boolean;
  notes: string;
  created_at: string;
}

export interface SoundInsulationRecordInput {
  id: string;
  date: string;
  location: "bedroom" | "communal_area" | "kitchen" | "bathroom" | "hallway" | "study_room" | "other";
  insulation_type: "walls" | "floors" | "ceilings" | "windows" | "doors" | "other";
  condition: "excellent" | "good" | "fair" | "poor" | "failed";
  meets_standard: boolean;
  last_inspected: string;
  maintenance_needed: boolean;
  maintenance_scheduled: boolean;
  maintenance_completed: boolean;
  impact_on_children: "none" | "minor" | "moderate" | "significant";
  notes: string;
  created_at: string;
}

export interface ChildComfortRecordInput {
  id: string;
  child_id: string;
  date: string;
  comfort_level: "very_comfortable" | "comfortable" | "neutral" | "uncomfortable" | "very_uncomfortable";
  noise_sensitivity: "low" | "moderate" | "high" | "very_high";
  sleep_disrupted_by_noise: boolean;
  specific_noise_concerns: string[];
  feels_heard_about_noise: boolean;
  preferred_noise_level: "very_quiet" | "quiet" | "moderate" | "doesnt_mind";
  staff_responsive_to_concerns: boolean;
  adaptations_helpful: boolean;
  overall_satisfaction: number; // 1-5
  notes: string;
  created_at: string;
}

export interface NoiseSoundInput {
  today: string;
  total_children: number;
  noise_monitoring_records: NoiseMonitoringRecordInput[];
  quiet_hours_records: QuietHoursRecordInput[];
  sensory_environment_records: SensoryEnvironmentRecordInput[];
  sound_insulation_records: SoundInsulationRecordInput[];
  child_comfort_records: ChildComfortRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type NoiseSoundRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface NoiseSoundInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface NoiseSoundRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface NoiseSoundResult {
  noise_rating: NoiseSoundRating;
  noise_score: number;
  headline: string;
  total_monitoring_records: number;
  total_quiet_hours_records: number;
  total_sensory_environment_records: number;
  total_insulation_records: number;
  total_comfort_records: number;
  // quiet_hours_compliance_rate uses pct() directly (deterministic 0 on empty)
  // and staff_awareness_rate is a manual composite over multiple numerators.
  // The four composite rates below are null on empty: no records ⇒ no signal.
  // "0% noise monitoring / 0% sensory environment / 0% sound insulation /
  // 0% child comfort" would read as an actively hostile living environment,
  // not "unmeasured". Fab-0 doctrine.
  noise_monitoring_rate: number | null;
  quiet_hours_compliance_rate: number;
  sensory_environment_rate: number | null;
  sound_insulation_rate: number | null;
  child_comfort_rate: number | null;
  staff_awareness_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: NoiseSoundRecommendation[];
  insights: NoiseSoundInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): NoiseSoundRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: NoiseSoundRating,
  score: number,
  headline: string,
): NoiseSoundResult {
  return {
    noise_rating: rating,
    noise_score: score,
    headline,
    total_monitoring_records: 0,
    total_quiet_hours_records: 0,
    total_sensory_environment_records: 0,
    total_insulation_records: 0,
    total_comfort_records: 0,
    noise_monitoring_rate: null,
    quiet_hours_compliance_rate: 0,
    sensory_environment_rate: null,
    sound_insulation_rate: null,
    child_comfort_rate: null,
    staff_awareness_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeNoiseSoundManagement(
  input: NoiseSoundInput,
): NoiseSoundResult {
  const {
    total_children,
    noise_monitoring_records,
    quiet_hours_records,
    sensory_environment_records,
    sound_insulation_records,
    child_comfort_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    noise_monitoring_records.length === 0 &&
    quiet_hours_records.length === 0 &&
    sensory_environment_records.length === 0 &&
    sound_insulation_records.length === 0 &&
    child_comfort_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess noise and sound management.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No noise and sound management data recorded despite children on placement — noise monitoring, quiet hours compliance, and child comfort with the sound environment require urgent attention.",
      ),
      concerns: [
        "No noise monitoring records, quiet hours records, sensory environment adaptations, sound insulation records, or child comfort records exist despite children being on placement — the home cannot evidence that the sound environment supports children's wellbeing and rest.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured noise monitoring, quiet hours compliance tracking, sensory environment adaptations, sound insulation assessments, and child comfort surveys to evidence that the home's sound environment is safe, comfortable, and conducive to rest and wellbeing.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises",
        },
        {
          rank: 2,
          recommendation:
            "Obtain children's views on noise levels and sound comfort within the home as a matter of urgency — children's experiences of the sound environment are central to their wellbeing and must inform any noise management strategy.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Placing authority/child welfare",
        },
      ],
      insights: [
        {
          text: "The complete absence of noise and sound management records means the home cannot demonstrate that the living environment supports children's need for rest, sleep, study, and sensory comfort. This represents a significant gap in evidencing that premises are suitable and that children's welfare is promoted.",
          severity: "critical",
        },
      ],
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NOISE MONITORING METRICS
  // ══════════════════════════════════════════════════════════════════════════

  const totalMonitoringRecords = noise_monitoring_records.length;

  // Acceptable noise level rate
  const acceptableNoiseLevels = noise_monitoring_records.filter(
    (r) => r.acceptable_level,
  ).length;
  const acceptableNoiseRate = pct(acceptableNoiseLevels, totalMonitoringRecords);

  // Source identification rate
  const sourceIdentified = noise_monitoring_records.filter(
    (r) => r.source_identified,
  ).length;
  const sourceIdentificationRate = pct(sourceIdentified, totalMonitoringRecords);

  // Action taken rate (when noise was unacceptable)
  // If all noise is acceptable, no action was needed — treat as 100%
  const unacceptableNoise = noise_monitoring_records.filter(
    (r) => !r.acceptable_level,
  );
  const actionTakenOnUnacceptable = unacceptableNoise.filter(
    (r) => r.action_taken,
  ).length;
  const actionTakenRate =
    unacceptableNoise.length === 0 && totalMonitoringRecords > 0
      ? 100
      : pct(actionTakenOnUnacceptable, unacceptableNoise.length);

  // Meter-based monitoring rate (professional vs observation)
  const meterBasedMonitoring = noise_monitoring_records.filter(
    (r) => r.monitoring_method === "meter",
  ).length;
  const meterMonitoringRate = pct(meterBasedMonitoring, totalMonitoringRecords);

  // Night-time monitoring coverage
  const nightMonitoring = noise_monitoring_records.filter(
    (r) => r.time_of_day === "night",
  ).length;
  const nightMonitoringRate = pct(nightMonitoring, totalMonitoringRecords);

  // Location diversity — how many distinct locations monitored
  const monitoredLocations = new Set(
    noise_monitoring_records.map((r) => r.location),
  ).size;
  const locationCoverage = monitoredLocations >= 5 ? 100 : pct(monitoredLocations, 5);

  // Composite noise monitoring rate
  // Weight: 40% acceptable levels, 25% source identification, 20% action taken, 15% location coverage
  const noiseMonitoringRate: number | null =
    totalMonitoringRecords > 0
      ? Math.round(
          acceptableNoiseRate * 0.4 +
          sourceIdentificationRate * 0.25 +
          actionTakenRate * 0.2 +
          locationCoverage * 0.15,
        )
      : null;

  // ══════════════════════════════════════════════════════════════════════════
  // QUIET HOURS METRICS
  // ══════════════════════════════════════════════════════════════════════════

  const totalQuietHoursRecords = quiet_hours_records.length;

  // Compliance rate
  const compliantQuietHours = quiet_hours_records.filter(
    (r) => r.compliant,
  ).length;
  const quietHoursComplianceRate = pct(compliantQuietHours, totalQuietHoursRecords);

  // Zero-disruption nights
  const zeroDisruptionNights = quiet_hours_records.filter(
    (r) => r.disruptions_count === 0,
  ).length;
  const zeroDisruptionRate = pct(zeroDisruptionNights, totalQuietHoursRecords);

  // Resolution effectiveness (for non-compliant records)
  const nonCompliantRecords = quiet_hours_records.filter((r) => !r.compliant);

  // Staff prompt response rate
  const staffRespondedPromptly = quiet_hours_records.filter(
    (r) => r.disruptions_count > 0 && r.staff_responded_promptly,
  );
  const disruptedQuietHours = quiet_hours_records.filter(
    (r) => r.disruptions_count > 0,
  );
  const staffPromptResponseRate = pct(
    staffRespondedPromptly.length,
    disruptedQuietHours.length,
  );

  // Average disruption duration (minutes) for non-compliant
  const totalDisruptionMinutes = nonCompliantRecords.reduce(
    (sum, r) => sum + r.duration_of_disruption_minutes,
    0,
  );
  const avgDisruptionMinutes: number | null =
    nonCompliantRecords.length > 0
      ? Math.round(totalDisruptionMinutes / nonCompliantRecords.length)
      : null;

  // ══════════════════════════════════════════════════════════════════════════
  // SENSORY ENVIRONMENT METRICS
  // ══════════════════════════════════════════════════════════════════════════

  const totalSensoryRecords = sensory_environment_records.length;

  // Adaptations in place rate
  const adaptationsInPlace = sensory_environment_records.filter(
    (r) => r.adaptation_in_place,
  ).length;
  const adaptationInPlaceRate = pct(adaptationsInPlace, totalSensoryRecords);

  // Effectiveness rating average
  const effectivenessSum = sensory_environment_records
    .filter((r) => r.adaptation_in_place)
    .reduce((sum, r) => sum + r.effectiveness_rating, 0);
  const avgEffectiveness: number | null =
    adaptationsInPlace > 0
      ? Math.round((effectivenessSum / adaptationsInPlace) * 100) / 100
      : null;

  // Child feedback positive rate
  const positiveFeedbackSensory = sensory_environment_records.filter(
    (r) => r.adaptation_in_place && r.child_feedback_positive,
  ).length;
  const sensoryPositiveFeedbackRate = pct(positiveFeedbackSensory, adaptationsInPlace);

  // Reviewed with child rate
  const reviewedWithChild = sensory_environment_records.filter(
    (r) => r.reviewed_with_child,
  ).length;
  const reviewedWithChildRate = pct(reviewedWithChild, totalSensoryRecords);

  // Linked to care plan rate
  const linkedToCarePlan = sensory_environment_records.filter(
    (r) => r.linked_to_care_plan,
  ).length;
  const linkedToCarePlanRate = pct(linkedToCarePlan, totalSensoryRecords);

  // Composite sensory environment rate
  // Weight: 30% in place, 25% child feedback, 25% reviewed with child, 20% linked to care plan
  const sensoryEnvironmentRate: number | null =
    totalSensoryRecords > 0
      ? Math.round(
          adaptationInPlaceRate * 0.3 +
          sensoryPositiveFeedbackRate * 0.25 +
          reviewedWithChildRate * 0.25 +
          linkedToCarePlanRate * 0.2,
        )
      : null;

  // ══════════════════════════════════════════════════════════════════════════
  // SOUND INSULATION METRICS
  // ══════════════════════════════════════════════════════════════════════════

  const totalInsulationRecords = sound_insulation_records.length;

  // Meets standard rate
  const meetsStandard = sound_insulation_records.filter(
    (r) => r.meets_standard,
  ).length;
  const meetsStandardRate = pct(meetsStandard, totalInsulationRecords);

  // Good/excellent condition rate
  const goodCondition = sound_insulation_records.filter(
    (r) => r.condition === "excellent" || r.condition === "good",
  ).length;
  const goodConditionRate = pct(goodCondition, totalInsulationRecords);

  // Failed/poor condition count
  const poorOrFailed = sound_insulation_records.filter(
    (r) => r.condition === "poor" || r.condition === "failed",
  ).length;
  const poorConditionRate = pct(poorOrFailed, totalInsulationRecords);

  // Maintenance needed vs scheduled
  const maintenanceNeeded = sound_insulation_records.filter(
    (r) => r.maintenance_needed,
  ).length;
  const maintenanceScheduled = sound_insulation_records.filter(
    (r) => r.maintenance_needed && r.maintenance_scheduled,
  ).length;
  const maintenanceCompletedCount = sound_insulation_records.filter(
    (r) => r.maintenance_needed && r.maintenance_completed,
  ).length;
  const maintenanceScheduledRate = pct(maintenanceScheduled, maintenanceNeeded);
  const maintenanceCompletionRate = pct(maintenanceCompletedCount, maintenanceNeeded);

  // Impact on children
  const significantImpact = sound_insulation_records.filter(
    (r) => r.impact_on_children === "significant",
  ).length;
  const noImpact = sound_insulation_records.filter(
    (r) => r.impact_on_children === "none",
  ).length;
  const noImpactRate = pct(noImpact, totalInsulationRecords);

  // Composite sound insulation rate
  // Weight: 40% meets standard, 30% good condition, 30% no impact
  const soundInsulationRate: number | null =
    totalInsulationRecords > 0
      ? Math.round(
          meetsStandardRate * 0.4 +
          goodConditionRate * 0.3 +
          noImpactRate * 0.3,
        )
      : null;

  // ══════════════════════════════════════════════════════════════════════════
  // CHILD COMFORT METRICS
  // ══════════════════════════════════════════════════════════════════════════

  const totalComfortRecords = child_comfort_records.length;

  // Comfortable / very comfortable rate
  const comfortableChildren = child_comfort_records.filter(
    (r) =>
      r.comfort_level === "very_comfortable" || r.comfort_level === "comfortable",
  ).length;
  const comfortableRate = pct(comfortableChildren, totalComfortRecords);

  // Uncomfortable / very uncomfortable rate
  const uncomfortableChildren = child_comfort_records.filter(
    (r) =>
      r.comfort_level === "very_uncomfortable" ||
      r.comfort_level === "uncomfortable",
  ).length;
  const uncomfortableRate = pct(uncomfortableChildren, totalComfortRecords);

  // Sleep disrupted by noise rate
  const sleepDisrupted = child_comfort_records.filter(
    (r) => r.sleep_disrupted_by_noise,
  ).length;
  const sleepDisruptionRate = pct(sleepDisrupted, totalComfortRecords);

  // Child feels heard about noise rate
  const feelsHeard = child_comfort_records.filter(
    (r) => r.feels_heard_about_noise,
  ).length;
  const feelsHeardRate = pct(feelsHeard, totalComfortRecords);

  // Staff responsive to concerns rate
  const staffResponsive = child_comfort_records.filter(
    (r) => r.staff_responsive_to_concerns,
  ).length;
  const staffResponsiveRate = pct(staffResponsive, totalComfortRecords);

  // Average overall satisfaction
  const satisfactionSum = child_comfort_records.reduce(
    (sum, r) => sum + r.overall_satisfaction,
    0,
  );
  const avgSatisfaction: number | null =
    totalComfortRecords > 0
      ? Math.round((satisfactionSum / totalComfortRecords) * 100) / 100
      : null;

  // High sensitivity children count
  const highSensitivity = child_comfort_records.filter(
    (r) => r.noise_sensitivity === "high" || r.noise_sensitivity === "very_high",
  ).length;
  const highSensitivityRate = pct(highSensitivity, totalComfortRecords);

  // Unique children surveyed
  const uniqueChildrenSurveyed = new Set(
    child_comfort_records.map((r) => r.child_id),
  ).size;
  const comfortSurveyCoverage =
    total_children > 0 ? pct(uniqueChildrenSurveyed, total_children) : 0;

  // Composite child comfort rate
  // Weight: 35% comfortable rate, 25% feels heard, 25% staff responsive, 15% satisfaction >=4
  const highSatisfactionRecords = child_comfort_records.filter(
    (r) => r.overall_satisfaction >= 4,
  ).length;
  const highSatisfactionRate = pct(highSatisfactionRecords, totalComfortRecords);

  const childComfortRate: number | null =
    totalComfortRecords > 0
      ? Math.round(
          comfortableRate * 0.35 +
          feelsHeardRate * 0.25 +
          staffResponsiveRate * 0.25 +
          highSatisfactionRate * 0.15,
        )
      : null;

  // ══════════════════════════════════════════════════════════════════════════
  // STAFF AWARENESS COMPOSITE
  // ══════════════════════════════════════════════════════════════════════════

  // Staff awareness combines: source identification, action taken, prompt response,
  // staff responsive to child concerns, and reviews with children
  const staffAwarenessNumerators: number[] = [];
  const staffAwarenessDenominators: number[] = [];

  if (totalMonitoringRecords > 0) {
    staffAwarenessNumerators.push(sourceIdentified);
    staffAwarenessDenominators.push(totalMonitoringRecords);
  }
  if (unacceptableNoise.length > 0) {
    staffAwarenessNumerators.push(actionTakenOnUnacceptable);
    staffAwarenessDenominators.push(unacceptableNoise.length);
  }
  if (disruptedQuietHours.length > 0) {
    staffAwarenessNumerators.push(staffRespondedPromptly.length);
    staffAwarenessDenominators.push(disruptedQuietHours.length);
  }
  if (totalComfortRecords > 0) {
    staffAwarenessNumerators.push(staffResponsive);
    staffAwarenessDenominators.push(totalComfortRecords);
  }
  if (totalSensoryRecords > 0) {
    staffAwarenessNumerators.push(reviewedWithChild);
    staffAwarenessDenominators.push(totalSensoryRecords);
  }

  const totalStaffAwarenessNum = staffAwarenessNumerators.reduce((a, b) => a + b, 0);
  const totalStaffAwarenessDen = staffAwarenessDenominators.reduce((a, b) => a + b, 0);
  const staffAwarenessRate = pct(totalStaffAwarenessNum, totalStaffAwarenessDen);

  // ══════════════════════════════════════════════════════════════════════════
  // SCORING: base 52, max bonuses +28, 4 penalties
  // ══════════════════════════════════════════════════════════════════════════

  let score = 52;

  // --- Bonus 1: noiseMonitoringRate (>=90: +4, >=70: +2) ---
  if (meets(noiseMonitoringRate, 90)) score += 4;
  else if (meets(noiseMonitoringRate, 70)) score += 2;

  // --- Bonus 2: quietHoursComplianceRate (>=95: +5, >=80: +3) ---
  if (quietHoursComplianceRate >= 95) score += 5;
  else if (quietHoursComplianceRate >= 80) score += 3;

  // --- Bonus 3: sensoryEnvironmentRate (>=90: +4, >=70: +2) ---
  if (meets(sensoryEnvironmentRate, 90)) score += 4;
  else if (meets(sensoryEnvironmentRate, 70)) score += 2;

  // --- Bonus 4: soundInsulationRate (>=90: +3, >=70: +1) ---
  if (meets(soundInsulationRate, 90)) score += 3;
  else if (meets(soundInsulationRate, 70)) score += 1;

  // --- Bonus 5: childComfortRate (>=90: +4, >=70: +2) ---
  if (meets(childComfortRate, 90)) score += 4;
  else if (meets(childComfortRate, 70)) score += 2;

  // --- Bonus 6: staffAwarenessRate (>=90: +3, >=70: +1) ---
  if (staffAwarenessRate >= 90) score += 3;
  else if (staffAwarenessRate >= 70) score += 1;

  // --- Bonus 7: comfortSurveyCoverage (>=100: +3, >=80: +1) ---
  if (comfortSurveyCoverage >= 100) score += 3;
  else if (comfortSurveyCoverage >= 80) score += 1;

  // --- Bonus 8: avgSatisfaction (>=4.5: +2, >=3.5: +1) ---
  if (meets(avgSatisfaction, 4.5)) score += 2;
  else if (meets(avgSatisfaction, 3.5)) score += 1;

  // ── Penalties (guarded by array.length > 0) ──────────────────────────

  // Penalty 1: quiet hours compliance below 50%
  if (quietHoursComplianceRate < 50 && totalQuietHoursRecords > 0) score -= 6;

  // Penalty 2: child comfort rate below 40%
  if (below(childComfortRate, 40) && totalComfortRecords > 0) score -= 5;

  // Penalty 3: sound insulation poor/failed rate above 30%
  if (poorConditionRate > 30 && totalInsulationRecords > 0) score -= 4;

  // Penalty 4: sleep disruption rate above 40%
  if (sleepDisruptionRate > 40 && totalComfortRecords > 0) score -= 3;

  score = clamp(score, 0, 100);

  const noise_rating = toRating(score);

  // ══════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ══════════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];

  // Noise monitoring strengths
  if (acceptableNoiseRate >= 90 && totalMonitoringRecords > 0) {
    strengths.push(
      `${acceptableNoiseRate}% of noise monitoring readings at acceptable levels — the home maintains a consistently appropriate sound environment for children.`,
    );
  } else if (acceptableNoiseRate >= 70 && totalMonitoringRecords > 0) {
    strengths.push(
      `${acceptableNoiseRate}% of noise readings at acceptable levels — the home generally maintains a suitable sound environment.`,
    );
  }

  if (sourceIdentificationRate >= 90 && totalMonitoringRecords > 0) {
    strengths.push(`${sourceIdentificationRate}% noise source identification rate — staff consistently identify noise sources, demonstrating strong awareness.`);
  }

  if (actionTakenRate >= 90 && unacceptableNoise.length > 0) {
    strengths.push(`${actionTakenRate}% action taken on unacceptable noise — staff respond effectively when noise levels are problematic.`);
  }

  // Quiet hours strengths
  if (quietHoursComplianceRate >= 95 && totalQuietHoursRecords > 0) {
    strengths.push(
      `${quietHoursComplianceRate}% quiet hours compliance — the home consistently maintains appropriate quiet periods, supporting children's rest and sleep.`,
    );
  } else if (quietHoursComplianceRate >= 80 && totalQuietHoursRecords > 0) {
    strengths.push(
      `${quietHoursComplianceRate}% quiet hours compliance — the home demonstrates strong commitment to protecting children's quiet time and sleep routines.`,
    );
  }

  if (zeroDisruptionRate >= 80 && totalQuietHoursRecords > 0) {
    strengths.push(`${zeroDisruptionRate}% of quiet hours had zero disruptions — children benefit from consistently peaceful rest periods.`);
  }

  if (staffPromptResponseRate >= 90 && disruptedQuietHours.length > 0) {
    strengths.push(`${staffPromptResponseRate}% prompt staff response to quiet hours disruptions — staff respond quickly to protect children's rest.`);
  }

  // Sensory environment strengths
  if (adaptationInPlaceRate >= 90 && totalSensoryRecords > 0) {
    strengths.push(
      `${adaptationInPlaceRate}% of sensory adaptations in place — the home is thorough in implementing recommended sensory environment adjustments.`,
    );
  } else if (adaptationInPlaceRate >= 70 && totalSensoryRecords > 0) {
    strengths.push(
      `${adaptationInPlaceRate}% of sensory adaptations in place — the home shows good commitment to meeting children's individual sensory needs.`,
    );
  }

  if (sensoryPositiveFeedbackRate >= 90 && adaptationsInPlace > 0) {
    strengths.push(`${sensoryPositiveFeedbackRate}% positive child feedback on sensory adaptations — children confirm adaptations genuinely help their sound comfort.`);
  }

  if (linkedToCarePlanRate >= 90 && totalSensoryRecords > 0) {
    strengths.push(`${linkedToCarePlanRate}% of sensory adaptations linked to care plans — sound adjustments are integrated into individualised care.`);
  }

  // Sound insulation strengths
  if (meetsStandardRate >= 90 && totalInsulationRecords > 0) {
    strengths.push(
      `${meetsStandardRate}% of sound insulation meets required standards — the home's physical environment effectively manages noise transmission between spaces.`,
    );
  } else if (meetsStandardRate >= 70 && totalInsulationRecords > 0) {
    strengths.push(
      `${meetsStandardRate}% of sound insulation meets standards — the majority of the home provides adequate sound separation between spaces.`,
    );
  }

  if (maintenanceCompletionRate >= 90 && maintenanceNeeded > 0) {
    strengths.push(`${maintenanceCompletionRate}% of insulation maintenance completed — the home promptly addresses sound insulation issues.`);
  }

  // Child comfort strengths
  if (comfortableRate >= 90 && totalComfortRecords > 0) {
    strengths.push(
      `${comfortableRate}% of children report being comfortable or very comfortable with noise levels — the home provides a sound environment that children experience positively.`,
    );
  } else if (comfortableRate >= 70 && totalComfortRecords > 0) {
    strengths.push(
      `${comfortableRate}% of children comfortable with noise levels — the majority of children experience a suitable sound environment.`,
    );
  }

  if (feelsHeardRate >= 90 && totalComfortRecords > 0) {
    strengths.push(
      `${feelsHeardRate}% of children feel heard about noise concerns — the home actively listens to and acts on children's views about the sound environment.`,
    );
  } else if (feelsHeardRate >= 70 && totalComfortRecords > 0) {
    strengths.push(
      `${feelsHeardRate}% of children feel heard about noise concerns — the home generally listens to children's views on the sound environment.`,
    );
  }

  if (meets(avgSatisfaction, 4.5) && totalComfortRecords > 0) {
    strengths.push(`Average noise comfort satisfaction at ${avgSatisfaction}/5 — children are highly satisfied with the home's sound environment.`);
  } else if (meets(avgSatisfaction, 3.5) && totalComfortRecords > 0) {
    strengths.push(`Noise comfort satisfaction averaging ${avgSatisfaction}/5 — children are generally satisfied with the sound environment.`);
  }

  if (comfortSurveyCoverage >= 100 && total_children > 0) {
    strengths.push("Every child has been surveyed about noise comfort — all children's voices are captured regarding the sound environment.");
  } else if (comfortSurveyCoverage >= 80 && total_children > 0) {
    strengths.push(`${comfortSurveyCoverage}% of children surveyed about noise comfort — strong coverage ensuring most children's views are heard.`);
  }

  // Staff awareness strengths
  if (staffAwarenessRate >= 90 && totalStaffAwarenessDen > 0) {
    strengths.push(`${staffAwarenessRate}% staff awareness composite — staff consistently identify noise issues, take action, respond to disruptions, and engage with children about sound comfort.`);
  } else if (staffAwarenessRate >= 70 && totalStaffAwarenessDen > 0) {
    strengths.push(`${staffAwarenessRate}% staff awareness — good awareness of noise issues and responsiveness to children's sound environment needs.`);
  }

  if (sleepDisruptionRate === 0 && totalComfortRecords > 0) {
    strengths.push("No children report sleep disruption due to noise — the home successfully protects children's sleep from noise disturbance.");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ══════════════════════════════════════════════════════════════════════════

  const concerns: string[] = [];

  // Noise monitoring concerns
  if (acceptableNoiseRate < 40 && totalMonitoringRecords > 0) {
    concerns.push(
      `Only ${acceptableNoiseRate}% of noise monitoring readings at acceptable levels — the home's sound environment is frequently unsuitable for children's comfort, rest, and study.`,
    );
  } else if (
    acceptableNoiseRate >= 40 &&
    acceptableNoiseRate < 70 &&
    totalMonitoringRecords > 0
  ) {
    concerns.push(
      `Noise at acceptable levels only ${acceptableNoiseRate}% of the time — the home's sound environment is inconsistent and may affect children's wellbeing.`,
    );
  }

  if (sourceIdentificationRate < 50 && totalMonitoringRecords > 0) {
    concerns.push(
      `Only ${sourceIdentificationRate}% of noise sources identified — staff are not consistently identifying the causes of noise, making it difficult to address recurring issues.`,
    );
  }

  if (actionTakenRate < 50 && unacceptableNoise.length > 0) {
    concerns.push(
      `Action taken on only ${actionTakenRate}% of unacceptable noise instances — noise problems are being recorded but not addressed, exposing children to ongoing discomfort.`,
    );
  }

  // Quiet hours concerns
  if (quietHoursComplianceRate < 50 && totalQuietHoursRecords > 0) {
    concerns.push(
      `Only ${quietHoursComplianceRate}% quiet hours compliance — the majority of quiet periods are being disrupted, directly impacting children's rest and sleep. This is a significant welfare concern.`,
    );
  } else if (
    quietHoursComplianceRate >= 50 &&
    quietHoursComplianceRate < 80 &&
    totalQuietHoursRecords > 0
  ) {
    concerns.push(
      `Quiet hours compliance at ${quietHoursComplianceRate}% — too many quiet periods are being disrupted, undermining children's ability to rest and sleep properly.`,
    );
  }

  if (above(avgDisruptionMinutes, 30) && nonCompliantRecords.length > 0) {
    concerns.push(`Average quiet hours disruption lasts ${avgDisruptionMinutes} minutes — prolonged disruptions significantly impact children's rest.`);
  }

  if (staffPromptResponseRate < 50 && disruptedQuietHours.length > 0) {
    concerns.push(`Staff responded promptly to only ${staffPromptResponseRate}% of quiet hours disruptions — delayed responses prolong the impact on children's rest.`);
  }

  // Sensory environment concerns
  if (adaptationInPlaceRate < 50 && totalSensoryRecords > 0) {
    concerns.push(`Only ${adaptationInPlaceRate}% of sensory adaptations in place — children with identified sensory needs are not receiving required environmental adjustments.`);
  } else if (adaptationInPlaceRate >= 50 && adaptationInPlaceRate < 70 && totalSensoryRecords > 0) {
    concerns.push(`Sensory adaptation rate at ${adaptationInPlaceRate}% — not all children's identified sensory needs are being met through environmental adjustments.`);
  }

  if (reviewedWithChildRate < 50 && totalSensoryRecords > 0) {
    concerns.push(`Only ${reviewedWithChildRate}% of sensory adaptations reviewed with the child — children's views are not being consistently sought about adaptations affecting their daily experience.`);
  }

  if (below(avgEffectiveness, 2.5) && adaptationsInPlace > 0) {
    concerns.push(`Sensory adaptation effectiveness averaging only ${avgEffectiveness}/5 — current adaptations are not working well and need review.`);
  }

  // Sound insulation concerns
  if (meetsStandardRate < 50 && totalInsulationRecords > 0) {
    concerns.push(`Only ${meetsStandardRate}% of sound insulation meets standards — inadequate noise separation affects children's privacy and comfort.`);
  } else if (meetsStandardRate >= 50 && meetsStandardRate < 70 && totalInsulationRecords > 0) {
    concerns.push(`Sound insulation at ${meetsStandardRate}% standard compliance — some areas allow excessive noise transfer, affecting children's comfort.`);
  }

  if (poorConditionRate > 30 && totalInsulationRecords > 0) {
    concerns.push(`${poorConditionRate}% of sound insulation in poor or failed condition — significant infrastructure issues contributing to noise problems.`);
  } else if (poorConditionRate > 15 && poorConditionRate <= 30 && totalInsulationRecords > 0) {
    concerns.push(`${poorConditionRate}% of sound insulation in poor or failed condition — some areas require maintenance.`);
  }

  if (significantImpact > 0 && totalInsulationRecords > 0) {
    concerns.push(`${significantImpact} insulation area${significantImpact !== 1 ? "s have" : " has"} significant impact on children — priority remediation required.`);
  }

  // Child comfort concerns
  if (uncomfortableRate > 30 && totalComfortRecords > 0) {
    concerns.push(`${uncomfortableRate}% of children uncomfortable or very uncomfortable with noise — a significant proportion negatively affected by the sound environment.`);
  } else if (uncomfortableRate > 15 && uncomfortableRate <= 30 && totalComfortRecords > 0) {
    concerns.push(`${uncomfortableRate}% of children uncomfortable with noise levels — some children negatively affected by noise in the home.`);
  }

  if (sleepDisruptionRate > 40 && totalComfortRecords > 0) {
    concerns.push(`${sleepDisruptionRate}% of children report noise-disrupted sleep — directly impacting health, education, and emotional wellbeing.`);
  } else if (sleepDisruptionRate > 20 && sleepDisruptionRate <= 40 && totalComfortRecords > 0) {
    concerns.push(`${sleepDisruptionRate}% of children report noise-disrupted sleep — targeted interventions may be required.`);
  }

  if (feelsHeardRate < 50 && totalComfortRecords > 0) {
    concerns.push(`Only ${feelsHeardRate}% of children feel heard about noise concerns — undermining their sense of agency and trust.`);
  } else if (feelsHeardRate >= 50 && feelsHeardRate < 70 && totalComfortRecords > 0) {
    concerns.push(`Only ${feelsHeardRate}% of children feel heard about noise concerns — not all views being taken seriously.`);
  }

  if (staffResponsiveRate < 50 && totalComfortRecords > 0) {
    concerns.push(`Staff responsiveness to noise concerns at only ${staffResponsiveRate}% — children's noise issues are not being addressed.`);
  }

  if (below(avgSatisfaction, 2.5) && totalComfortRecords > 0) {
    concerns.push(`Average noise satisfaction at only ${avgSatisfaction}/5 — children are dissatisfied with the sound environment, requiring urgent attention.`);
  } else if (meets(avgSatisfaction, 2.5) && below(avgSatisfaction, 3.0) && totalComfortRecords > 0) {
    concerns.push(`Noise satisfaction averaging ${avgSatisfaction}/5 — below an acceptable level.`);
  }

  if (comfortSurveyCoverage < 50 && total_children > 0 && totalComfortRecords > 0) {
    concerns.push(`Only ${comfortSurveyCoverage}% of children surveyed about noise comfort — incomplete picture of children's experience.`);
  }

  // Staff awareness concerns
  if (staffAwarenessRate < 40 && totalStaffAwarenessDen > 0) {
    concerns.push(`Staff awareness composite at only ${staffAwarenessRate}% — staff not consistently identifying noise issues, taking action, or engaging with children about sound comfort.`);
  } else if (staffAwarenessRate >= 40 && staffAwarenessRate < 70 && totalStaffAwarenessDen > 0) {
    concerns.push(`Staff awareness at ${staffAwarenessRate}% — inconsistency in noise identification, disruption response, and child engagement about sound comfort.`);
  }

  // Cross-domain concerns
  if (totalComfortRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push("No child comfort surveys recorded despite children on placement — the home has no evidence of children's views on the sound environment.");
  }

  if (totalQuietHoursRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push("No quiet hours compliance records — the home cannot evidence that quiet periods are monitored to support children's rest and sleep.");
  }

  if (totalMonitoringRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push("No noise monitoring records — impossible to identify and address sound environment issues systematically.");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ══════════════════════════════════════════════════════════════════════════

  const recommendations: NoiseSoundRecommendation[] = [];
  let rank = 0;

  // Immediate recommendations

  if (quietHoursComplianceRate < 50 && totalQuietHoursRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Urgently review quiet hours management — establish clear protocols, ensure staff enforce boundaries, identify disruption sources, and implement strategies to protect rest periods.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 25 — Premises" });
  }

  if (sleepDisruptionRate > 40 && totalComfortRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Address noise-related sleep disruption immediately — identify specific noise sources, implement targeted interventions (insulation, schedule adjustments, ear defenders), and monitor improvement.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5 — Child welfare" });
  }

  if (uncomfortableRate > 30 && totalComfortRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Address children's noise discomfort — consult individually with each uncomfortable child, understand concerns, and develop personalised sound environment plans integrated into care arrangements.", urgency: "immediate", regulatory_ref: "SCCIF — Experiences and progress" });
  }

  if (poorConditionRate > 30 && totalInsulationRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Commission urgent assessment and repair of sound insulation in poor or failed condition — inadequate soundproofing compromises children's privacy, rest, and comfort.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 25 — Premises" });
  }

  if (adaptationInPlaceRate < 50 && totalSensoryRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Implement all outstanding sensory adaptations — children with identified sound sensitivity needs must have recommended adaptations in place. Remove barriers and track progress.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 5 — Child welfare" });
  }

  if (feelsHeardRate < 50 && totalComfortRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Develop structured approach to hearing children's noise concerns — ensure regular opportunities to share views, log and action concerns, and show tangible responses.", urgency: "immediate", regulatory_ref: "SCCIF — Voice of the child" });
  }

  if (actionTakenRate < 50 && unacceptableNoise.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Ensure staff act on all unacceptable noise levels — monitoring without intervention does not protect children. Every reading must trigger a documented response.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 25 — Premises" });
  }

  if (staffAwarenessRate < 40 && totalStaffAwarenessDen > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Deliver targeted noise awareness training — covering identification, impact on wellbeing, quiet hours enforcement, sensory needs, and responsive practice.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 33 — Staff training" });
  }

  if (totalComfortRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({ rank: ++rank, recommendation: "Implement regular child comfort surveys covering noise and sound — without children's feedback, the home cannot evidence the sound environment meets their needs.", urgency: "immediate", regulatory_ref: "SCCIF — Voice of the child" });
  }

  if (totalQuietHoursRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({ rank: ++rank, recommendation: "Begin recording quiet hours compliance — the home must evidence that quiet periods support children's rest, sleep, and study. Record nightly.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 25 — Premises" });
  }

  // Soon recommendations

  if (quietHoursComplianceRate >= 50 && quietHoursComplianceRate < 80 && totalQuietHoursRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Improve quiet hours compliance towards 80% — analyse disruption patterns and implement targeted strategies to reduce non-compliance.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 25 — Premises" });
  }

  if (sleepDisruptionRate > 20 && sleepDisruptionRate <= 40 && totalComfortRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Investigate noise-related sleep disruption — work with affected children to understand specific issues and develop individualised solutions.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 5 — Child welfare" });
  }

  if (meetsStandardRate >= 50 && meetsStandardRate < 70 && totalInsulationRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Develop sound insulation improvement plan targeting areas below standard — prioritise bedrooms and study spaces.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 25 — Premises" });
  }

  if (maintenanceScheduledRate < 50 && maintenanceNeeded > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Schedule all outstanding sound insulation maintenance — delays prolong children's exposure to excessive noise transmission.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 25 — Premises" });
  }

  if (adaptationInPlaceRate >= 50 && adaptationInPlaceRate < 70 && totalSensoryRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Review and implement outstanding sensory adaptations — ensure all children with sound-related needs have adaptations in place and regularly reviewed.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 5 — Child welfare" });
  }

  if (staffAwarenessRate >= 40 && staffAwarenessRate < 70 && totalStaffAwarenessDen > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Strengthen staff noise awareness — include in team meetings, supervision, and handovers.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 33 — Staff training" });
  }

  // Planned recommendations

  if (acceptableNoiseRate >= 40 && acceptableNoiseRate < 70 && totalMonitoringRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Develop a noise reduction plan targeting the times and locations with highest unacceptable readings.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 25 — Premises" });
  }

  if (meterMonitoringRate < 30 && totalMonitoringRecords > 3) {
    recommendations.push({ rank: ++rank, recommendation: "Increase decibel meter monitoring — objective measurement provides more reliable data than observation alone.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 25 — Premises" });
  }

  if (comfortSurveyCoverage >= 50 && comfortSurveyCoverage < 80 && total_children > 0 && totalComfortRecords > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Extend noise comfort surveys to cover all children — ensure every child can share views on the sound environment.", urgency: "planned", regulatory_ref: "SCCIF — Voice of the child" });
  }

  if (highSensitivityRate > 30 && totalComfortRecords > 0 && totalSensoryRecords === 0) {
    recommendations.push({ rank: ++rank, recommendation: "Children with high noise sensitivity identified but no sensory adaptations recorded — develop individual sensory plans.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 5 — Child welfare" });
  }

  if (nightMonitoringRate < 10 && totalMonitoringRecords > 3) {
    recommendations.push({ rank: ++rank, recommendation: "Increase night-time noise monitoring — current coverage insufficient to evidence appropriate sleep environments.", urgency: "planned", regulatory_ref: "CHR 2015 Reg 25 — Premises" });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ══════════════════════════════════════════════════════════════════════════

  const insights: NoiseSoundInsight[] = [];

  // -- Critical insights --

  if (quietHoursComplianceRate < 50 && totalQuietHoursRecords > 0) {
    insights.push({
      text: `Only ${quietHoursComplianceRate}% quiet hours compliance. The majority of quiet periods are being disrupted, directly undermining children's ability to rest and sleep. Under CHR 2015 Reg 25, the home must ensure premises provide an environment conducive to rest — persistent quiet hours disruption represents a failure to meet this requirement.`,
      severity: "critical",
    });
  }

  if (sleepDisruptionRate > 40 && totalComfortRecords > 0) {
    insights.push({
      text: `${sleepDisruptionRate}% of children report noise-disrupted sleep. Sleep is fundamental to children's physical health, emotional regulation, and educational attainment. Widespread noise-related sleep disruption indicates a systemic sound management failure that directly harms children's welfare.`,
      severity: "critical",
    });
  }

  if (below(childComfortRate, 40) && totalComfortRecords > 0) {
    insights.push({
      text: `Child comfort composite at only ${childComfortRate}%. When comfort, voice, staff responsiveness, and satisfaction are considered together, the home is failing to provide a sound environment that meets children's needs. This is a fundamental premises and welfare concern.`,
      severity: "critical",
    });
  }

  if (poorConditionRate > 30 && totalInsulationRecords > 0) {
    insights.push({
      text: `${poorConditionRate}% of sound insulation in poor or failed condition. Deficient soundproofing compromises children's privacy, disrupts sleep, and makes it difficult for children to study or relax. This is a premises suitability issue under CHR 2015 Reg 25.`,
      severity: "critical",
    });
  }

  if (totalComfortRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No child comfort records exist despite children being on placement. The home cannot demonstrate that it understands children's experience of the sound environment. Children's views are essential to evidencing that premises support their wellbeing.",
      severity: "critical",
    });
  }

  if (adaptationInPlaceRate < 50 && totalSensoryRecords > 0) {
    insights.push({
      text: `Only ${adaptationInPlaceRate}% of sensory adaptations in place. Children with identified sound sensitivity needs are not receiving required environmental adjustments, directly impacting their comfort.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    quietHoursComplianceRate >= 50 &&
    quietHoursComplianceRate < 80 &&
    totalQuietHoursRecords > 0
  ) {
    insights.push({
      text: `Quiet hours compliance at ${quietHoursComplianceRate}% — improving but not yet at a level that consistently protects children's rest. Analysing disruption patterns and implementing targeted strategies could yield significant improvement.`,
      severity: "warning",
    });
  }

  if (
    acceptableNoiseRate >= 40 &&
    acceptableNoiseRate < 70 &&
    totalMonitoringRecords > 0
  ) {
    insights.push({
      text: `Acceptable noise levels at ${acceptableNoiseRate}% — the home's sound environment is inconsistent. Identifying the times, locations, and sources of unacceptable noise is key to improving the experience for children.`,
      severity: "warning",
    });
  }

  if (
    sleepDisruptionRate > 20 &&
    sleepDisruptionRate <= 40 &&
    totalComfortRecords > 0
  ) {
    insights.push({
      text: `${sleepDisruptionRate}% of children report noise-disrupted sleep. Even moderate levels of sleep disruption can affect children's health, mood, and educational outcomes. Targeted interventions for affected children are warranted.`,
      severity: "warning",
    });
  }

  if (staffAwarenessRate >= 40 && staffAwarenessRate < 70 && totalStaffAwarenessDen > 0) {
    insights.push({
      text: `Staff awareness composite at ${staffAwarenessRate}% — gaps in consistency around noise identification, action-taking, disruption response, and engaging with children. Training and supervision focus could improve this.`,
      severity: "warning",
    });
  }

  if (meetsStandardRate >= 50 && meetsStandardRate < 70 && totalInsulationRecords > 0) {
    insights.push({
      text: `Sound insulation at ${meetsStandardRate}% standard compliance — some areas allow noise transfer affecting children's comfort and privacy. Prioritising bedrooms and study areas would have the greatest impact.`,
      severity: "warning",
    });
  }

  if (meets(avgSatisfaction, 2.5) && below(avgSatisfaction, 3.5) && totalComfortRecords > 0) {
    insights.push({
      text: `Average noise satisfaction at ${avgSatisfaction}/5 — children's satisfaction with the sound environment is mediocre. Understanding specific aspects affecting satisfaction could guide targeted improvements.`,
      severity: "warning",
    });
  }

  if (meets(avgEffectiveness, 2.5) && below(avgEffectiveness, 3.5) && adaptationsInPlace > 0) {
    insights.push({
      text: `Sensory adaptation effectiveness averaging ${avgEffectiveness}/5 — adaptations are in place but not working optimally. Reviewing individual adaptations with each child could make a real difference.`,
      severity: "warning",
    });
  }

  // Analyse adaptation type diversity
  const adaptationTypeCounts: Record<string, number> = {};
  for (const r of sensory_environment_records) {
    adaptationTypeCounts[r.adaptation_type] =
      (adaptationTypeCounts[r.adaptation_type] ?? 0) + 1;
  }
  const uniqueAdaptationTypes = Object.keys(adaptationTypeCounts).length;
  if (totalSensoryRecords > 3 && uniqueAdaptationTypes <= 2) {
    insights.push({
      text: `Sensory adaptations limited to only ${uniqueAdaptationTypes} type${uniqueAdaptationTypes !== 1 ? "s" : ""} — a broader range of adaptations (noise-cancelling equipment, quiet spaces, white noise, music therapy, schedule adjustments) would better address the diversity of children's sound sensitivity needs.`,
      severity: "warning",
    });
  }

  // Analyse noise source patterns
  const sourceTypeCounts: Record<string, number> = {};
  for (const r of noise_monitoring_records.filter((r) => !r.acceptable_level)) {
    sourceTypeCounts[r.source_type] = (sourceTypeCounts[r.source_type] ?? 0) + 1;
  }
  const topSource = Object.entries(sourceTypeCounts).sort(
    (a, b) => b[1] - a[1],
  )[0];
  if (topSource && unacceptableNoise.length > 3) {
    const topSourcePct = pct(topSource[1], unacceptableNoise.length);
    if (topSourcePct >= 50) {
      insights.push({
        text: `${topSourcePct}% of unacceptable noise comes from "${topSource[0]}" sources — this dominant noise source should be the primary focus of the home's noise reduction strategy.`,
        severity: "warning",
      });
    }
  }

  // -- Positive insights --

  if (noise_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding noise and sound management — noise monitoring is proactive, quiet hours are consistently maintained, sensory adaptations are effective, sound insulation is well-maintained, and children report high comfort and satisfaction with the sound environment. This contributes positively to children's rest, sleep, study, and overall wellbeing.",
      severity: "positive",
    });
  }

  if (
    quietHoursComplianceRate >= 95 &&
    zeroDisruptionRate >= 80 &&
    totalQuietHoursRecords > 0
  ) {
    insights.push({
      text: `${quietHoursComplianceRate}% quiet hours compliance with ${zeroDisruptionRate}% of periods entirely disruption-free — children benefit from consistently peaceful rest periods, supporting their health, emotional regulation, and readiness to engage with education and activities.`,
      severity: "positive",
    });
  }

  if (
    comfortableRate >= 90 &&
    feelsHeardRate >= 90 &&
    totalComfortRecords > 0
  ) {
    insights.push({
      text: `${comfortableRate}% of children comfortable with noise levels and ${feelsHeardRate}% feel heard about noise concerns — the home has created a sound environment where children feel comfortable and empowered to influence their living conditions.`,
      severity: "positive",
    });
  }

  if (
    sleepDisruptionRate === 0 &&
    totalComfortRecords > 0
  ) {
    insights.push({
      text: "No children report noise-related sleep disruption — the home successfully protects children's sleep environment, supporting their physical health, emotional wellbeing, and educational engagement.",
      severity: "positive",
    });
  }

  if (
    adaptationInPlaceRate >= 90 &&
    sensoryPositiveFeedbackRate >= 90 &&
    totalSensoryRecords > 0 &&
    adaptationsInPlace > 0
  ) {
    insights.push({
      text: `${adaptationInPlaceRate}% of sensory adaptations in place with ${sensoryPositiveFeedbackRate}% positive child feedback — children's individual sound sensitivity needs are being met effectively, demonstrating person-centred care.`,
      severity: "positive",
    });
  }

  if (
    meetsStandardRate >= 90 &&
    goodConditionRate >= 90 &&
    totalInsulationRecords > 0
  ) {
    insights.push({
      text: `${meetsStandardRate}% sound insulation at standard with ${goodConditionRate}% in good or excellent condition — the home's physical infrastructure effectively supports a comfortable sound environment for children.`,
      severity: "positive",
    });
  }

  if (staffAwarenessRate >= 90 && totalStaffAwarenessDen > 0) {
    insights.push({
      text: `Staff awareness composite at ${staffAwarenessRate}% — staff demonstrate consistently strong practice in identifying noise issues, taking action, and engaging with children about sound comfort.`,
      severity: "positive",
    });
  }

  if (comfortSurveyCoverage >= 100 && total_children > 0 && totalComfortRecords > 0) {
    insights.push({
      text: "Every child has been surveyed about noise comfort — an inclusive approach ensuring no child's voice is missed regarding the sound environment.",
      severity: "positive",
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HEADLINE
  // ══════════════════════════════════════════════════════════════════════════

  let headline: string;

  if (noise_rating === "outstanding") {
    headline =
      "Outstanding noise and sound management — the home maintains a comfortable sound environment with strong quiet hours compliance, effective sensory adaptations, sound insulation, and high child comfort and satisfaction.";
  } else if (noise_rating === "good") {
    headline = `Good noise and sound management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (noise_rating === "adequate") {
    headline = `Adequate noise and sound management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure the sound environment consistently supports children's wellbeing, rest, and comfort.`;
  } else {
    headline = `Noise and sound management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to protect children's rest, sleep, sensory comfort, and overall wellbeing.`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RETURN
  // ══════════════════════════════════════════════════════════════════════════

  return {
    noise_rating,
    noise_score: score,
    headline,
    total_monitoring_records: totalMonitoringRecords,
    total_quiet_hours_records: totalQuietHoursRecords,
    total_sensory_environment_records: totalSensoryRecords,
    total_insulation_records: totalInsulationRecords,
    total_comfort_records: totalComfortRecords,
    noise_monitoring_rate: noiseMonitoringRate,
    quiet_hours_compliance_rate: quietHoursComplianceRate,
    sensory_environment_rate: sensoryEnvironmentRate,
    sound_insulation_rate: soundInsulationRate,
    child_comfort_rate: childComfortRate,
    staff_awareness_rate: staffAwarenessRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
