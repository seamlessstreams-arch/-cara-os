// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SLEEP QUALITY INTELLIGENCE ENGINE
// Pure deterministic engine: sleep disturbances, check compliance,
// pattern analysis, child-specific concerns, handover quality.
// CHR 2015 Reg 7/10: "Quality of care, positive relationships."
// SCCIF: "Children get a good night's sleep and feel rested."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface SleepDisturbanceInput {
  time: string;
  young_person: string;
  description: string;
  action_taken: string;
  duration: number; // minutes
}

export interface SleepLogInput {
  id: string;
  date: string;             // YYYY-MM-DD
  shift_type: string;       // sleep_in | waking_night
  staff_id: string;
  start_time: string;       // HH:MM
  end_time: string;         // HH:MM
  disturbance_level: string; // none | minor | moderate | significant
  disturbances: SleepDisturbanceInput[];
  checks_completed: string[];
  building_secure: boolean;
  alarms_set: boolean;
  handover_notes: string;
  morning_handover: string;
}

export interface HomeSleepQualityInput {
  today: string;            // YYYY-MM-DD
  sleep_logs: SleepLogInput[];
  total_children: number;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SleepQualityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DisturbanceProfile {
  total_disturbances: number;
  total_duration_mins: number;
  avg_per_night: number;
  level_distribution: Record<string, number>; // none, minor, moderate, significant
  none_rate: number;           // % of nights with no disturbances
  significant_rate: number;    // % with significant
  children_disturbed: Record<string, number>; // child_id → count
}

export interface CheckComplianceProfile {
  total_logs: number;
  avg_checks_per_night: number;
  logs_with_5_plus_checks: number;
  check_compliance_rate: number; // % with >= 5 checks
  building_secure_rate: number;  // %
  alarms_set_rate: number;       // %
}

export interface HandoverProfile {
  with_handover_notes: number;
  with_morning_handover: number;
  handover_rate: number;         // % with both handover notes and morning handover
}

export interface ShiftProfile {
  waking_nights: number;
  sleep_ins: number;
  waking_night_rate: number;     // %
  unique_staff: number;
  logs_last_7_days: number;
  logs_last_14_days: number;
}

export interface Insight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface Recommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string | null;
}

export interface HomeSleepQualityResult {
  sleep_rating: SleepQualityRating;
  sleep_score: number;
  headline: string;
  disturbances: DisturbanceProfile;
  check_compliance: CheckComplianceProfile;
  handover: HandoverProfile;
  shifts: ShiftProfile;
  strengths: string[];
  concerns: string[];
  recommendations: Recommendation[];
  insights: Insight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function ratingFromScore(score: number): SleepQualityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeSleepQuality(
  input: HomeSleepQualityInput,
): HomeSleepQualityResult {
  const { today, sleep_logs, total_children } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_children === 0 || sleep_logs.length === 0) {
    return {
      sleep_rating: "insufficient_data",
      sleep_score: 0,
      headline: total_children === 0
        ? "No children registered in the home."
        : "No sleep logs recorded.",
      disturbances: {
        total_disturbances: 0, total_duration_mins: 0, avg_per_night: 0,
        level_distribution: {}, none_rate: 0, significant_rate: 0,
        children_disturbed: {},
      },
      check_compliance: {
        total_logs: 0, avg_checks_per_night: 0, logs_with_5_plus_checks: 0,
        check_compliance_rate: 0, building_secure_rate: 0, alarms_set_rate: 0,
      },
      handover: {
        with_handover_notes: 0, with_morning_handover: 0, handover_rate: 0,
      },
      shifts: {
        waking_nights: 0, sleep_ins: 0, waking_night_rate: 0,
        unique_staff: 0, logs_last_7_days: 0, logs_last_14_days: 0,
      },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  const todayDate = today.slice(0, 10);

  // ── Disturbance Profile ───────────────────────────────────────────────
  const allDisturbances = sleep_logs.flatMap((l) => l.disturbances);
  const totalDuration = allDisturbances.reduce((s, d) => s + d.duration, 0);

  const levelDist: Record<string, number> = {};
  for (const l of sleep_logs) {
    levelDist[l.disturbance_level] = (levelDist[l.disturbance_level] || 0) + 1;
  }

  const noneNights = sleep_logs.filter((l) => l.disturbance_level === "none");
  const significantNights = sleep_logs.filter((l) => l.disturbance_level === "significant");

  const childrenDisturbed: Record<string, number> = {};
  for (const d of allDisturbances) {
    childrenDisturbed[d.young_person] = (childrenDisturbed[d.young_person] || 0) + 1;
  }

  const disturbances: DisturbanceProfile = {
    total_disturbances: allDisturbances.length,
    total_duration_mins: totalDuration,
    avg_per_night:
      sleep_logs.length > 0
        ? Math.round((allDisturbances.length / sleep_logs.length) * 10) / 10
        : 0,
    level_distribution: levelDist,
    none_rate: pct(noneNights.length, sleep_logs.length),
    significant_rate: pct(significantNights.length, sleep_logs.length),
    children_disturbed: childrenDisturbed,
  };

  // ── Check Compliance Profile ──────────────────────────────────────────
  const checkCounts = sleep_logs.map((l) => l.checks_completed.length);
  const avgChecks =
    checkCounts.length > 0
      ? Math.round((checkCounts.reduce((s, n) => s + n, 0) / checkCounts.length) * 10) / 10
      : 0;
  const with5Plus = sleep_logs.filter((l) => l.checks_completed.length >= 5);
  const buildingSecure = sleep_logs.filter((l) => l.building_secure);
  const alarmsSet = sleep_logs.filter((l) => l.alarms_set);

  const check_compliance: CheckComplianceProfile = {
    total_logs: sleep_logs.length,
    avg_checks_per_night: avgChecks,
    logs_with_5_plus_checks: with5Plus.length,
    check_compliance_rate: pct(with5Plus.length, sleep_logs.length),
    building_secure_rate: pct(buildingSecure.length, sleep_logs.length),
    alarms_set_rate: pct(alarmsSet.length, sleep_logs.length),
  };

  // ── Handover Profile ──────────────────────────────────────────────────
  const withHandover = sleep_logs.filter(
    (l) => l.handover_notes && l.handover_notes.trim().length > 0,
  );
  const withMorning = sleep_logs.filter(
    (l) => l.morning_handover && l.morning_handover.trim().length > 0,
  );
  const withBoth = sleep_logs.filter(
    (l) =>
      l.handover_notes && l.handover_notes.trim().length > 0 &&
      l.morning_handover && l.morning_handover.trim().length > 0,
  );

  const handover: HandoverProfile = {
    with_handover_notes: withHandover.length,
    with_morning_handover: withMorning.length,
    handover_rate: pct(withBoth.length, sleep_logs.length),
  };

  // ── Shift Profile ─────────────────────────────────────────────────────
  const wakingNights = sleep_logs.filter((l) => l.shift_type === "waking_night");
  const sleepIns = sleep_logs.filter((l) => l.shift_type === "sleep_in");
  const uniqueStaff = new Set(sleep_logs.map((l) => l.staff_id));

  const last7 = sleep_logs.filter(
    (l) => daysBetween(l.date, todayDate) >= 0 && daysBetween(l.date, todayDate) <= 7,
  );
  const last14 = sleep_logs.filter(
    (l) => daysBetween(l.date, todayDate) >= 0 && daysBetween(l.date, todayDate) <= 14,
  );

  const shifts: ShiftProfile = {
    waking_nights: wakingNights.length,
    sleep_ins: sleepIns.length,
    waking_night_rate: pct(wakingNights.length, sleep_logs.length),
    unique_staff: uniqueStaff.size,
    logs_last_7_days: last7.length,
    logs_last_14_days: last14.length,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  const BASE_SCORE = 52;
  let score = BASE_SCORE;

  // mod1: Disturbance level (±5)
  const mod1 =
    disturbances.none_rate >= 70 ? 5 :
    disturbances.none_rate >= 50 ? 3 :
    disturbances.none_rate >= 30 ? 1 :
    disturbances.significant_rate >= 30 ? -5 : -2;
  score += mod1;

  // mod2: Check compliance (±4)
  const mod2 =
    check_compliance.check_compliance_rate >= 90 ? 4 :
    check_compliance.check_compliance_rate >= 70 ? 2 :
    check_compliance.check_compliance_rate >= 50 ? 0 : -3;
  score += mod2;

  // mod3: Building security (±3)
  const mod3 =
    check_compliance.building_secure_rate >= 100 ? 3 :
    check_compliance.building_secure_rate >= 90 ? 1 : -3;
  score += mod3;

  // mod4: Handover quality (±3)
  const mod4 =
    handover.handover_rate >= 90 ? 3 :
    handover.handover_rate >= 70 ? 1 :
    handover.handover_rate >= 50 ? 0 : -2;
  score += mod4;

  // mod5: Logging frequency (±4)
  const mod5 =
    shifts.logs_last_7_days >= 7 ? 4 :
    shifts.logs_last_7_days >= 5 ? 2 :
    shifts.logs_last_7_days >= 3 ? 0 : -3;
  score += mod5;

  // mod6: Disturbance response (±3)
  const disturbancesWithAction = allDisturbances.filter(
    (d) => d.action_taken && d.action_taken.trim().length > 0,
  );
  const responseRate = pct(disturbancesWithAction.length, allDisturbances.length);
  const mod6 =
    allDisturbances.length === 0 ? 2 :
    responseRate >= 100 ? 3 :
    responseRate >= 80 ? 1 : -3;
  score += mod6;

  // mod7: Staff diversity (±3)
  const mod7 =
    uniqueStaff.size >= 3 ? 3 :
    uniqueStaff.size >= 2 ? 1 : -1;
  score += mod7;

  // mod8: Significant night rate (±3)
  const mod8 =
    disturbances.significant_rate === 0 ? 3 :
    disturbances.significant_rate <= 15 ? 1 :
    disturbances.significant_rate <= 30 ? -1 : -3;
  score += mod8;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  const sleep_rating = ratingFromScore(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (disturbances.none_rate >= 50)
    strengths.push(`${disturbances.none_rate}% of nights had no disturbances — children are sleeping well.`);
  if (check_compliance.check_compliance_rate >= 90)
    strengths.push(`${check_compliance.check_compliance_rate}% of nights have 5+ welfare checks — excellent compliance.`);
  if (check_compliance.building_secure_rate >= 100)
    strengths.push("Building confirmed secure on every night — consistent security practice.");
  if (handover.handover_rate >= 90)
    strengths.push(`${handover.handover_rate}% of logs have complete handover notes — strong communication.`);
  if (responseRate >= 100 && allDisturbances.length > 0)
    strengths.push("All disturbances have documented response actions — reflective, child-centred care.");
  if (uniqueStaff.size >= 3)
    strengths.push(`${uniqueStaff.size} different staff members covering nights — good rotation.`);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (disturbances.significant_rate > 20)
    concerns.push(`${disturbances.significant_rate}% of nights have significant disturbances — pattern requires clinical review.`);
  if (check_compliance.check_compliance_rate < 70)
    concerns.push(`Only ${check_compliance.check_compliance_rate}% of nights have 5+ welfare checks — below expected standard.`);
  if (check_compliance.building_secure_rate < 100)
    concerns.push(`Building security not confirmed on ${100 - check_compliance.building_secure_rate}% of nights.`);
  if (handover.handover_rate < 70)
    concerns.push(`Only ${handover.handover_rate}% of logs have complete handovers — information may be lost.`);
  if (shifts.logs_last_7_days < 5)
    concerns.push(`Only ${shifts.logs_last_7_days} sleep logs in last 7 days — expected nightly logging.`);

  // Check for children with repeated disturbances
  const frequentlyDisturbed = Object.entries(childrenDisturbed).filter(
    ([, count]) => count >= 3,
  );
  if (frequentlyDisturbed.length > 0)
    concerns.push(`${frequentlyDisturbed.length} child(ren) have 3+ disturbances — may need sleep hygiene or therapeutic review.`);

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: Recommendation[] = [];
  let rank = 1;

  if (frequentlyDisturbed.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Review sleep patterns for child(ren) with frequent disturbances. Consider CAMHS referral or BSP sleep strategy.`,
      urgency: "soon",
      regulatory_ref: "Reg 10",
    });

  if (disturbances.significant_rate > 20)
    recommendations.push({
      rank: rank++,
      recommendation: "High significant disturbance rate — discuss with therapist and review bedtime routines.",
      urgency: "soon",
      regulatory_ref: "Reg 7",
    });

  if (check_compliance.check_compliance_rate < 70)
    recommendations.push({
      rank: rank++,
      recommendation: "Ensure minimum 5 welfare checks per night are completed and documented.",
      urgency: "immediate",
      regulatory_ref: "Reg 25",
    });

  if (shifts.logs_last_7_days < 5)
    recommendations.push({
      rank: rank++,
      recommendation: "Ensure sleep logs are completed every night — missing logs are a compliance gap.",
      urgency: "immediate",
      regulatory_ref: "Reg 36",
    });

  if (handover.handover_rate < 70)
    recommendations.push({
      rank: rank++,
      recommendation: "Improve handover completion — both evening and morning notes should be documented.",
      urgency: "soon",
      regulatory_ref: null,
    });

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: Insight[] = [];

  if (frequentlyDisturbed.length > 0)
    insights.push({
      text: `${frequentlyDisturbed.length} child(ren) have recurring sleep disturbances. Ofsted will examine whether the home responds therapeutically — consider whether current strategies are effective.`,
      severity: "warning",
    });

  if (disturbances.none_rate >= 60)
    insights.push({
      text: `${disturbances.none_rate}% of nights are undisturbed — this suggests a calm, settled home environment where children feel safe enough to sleep well.`,
      severity: "positive",
    });

  if (disturbances.significant_rate >= 20)
    insights.push({
      text: `${disturbances.significant_rate}% of nights have significant disturbances. Persistent sleep disruption affects emotional regulation, education, and wellbeing — this is a safeguarding concern.`,
      severity: "critical",
    });

  if (check_compliance.check_compliance_rate >= 90 && handover.handover_rate >= 90)
    insights.push({
      text: `Excellent night-time governance: ${check_compliance.check_compliance_rate}% check compliance, ${handover.handover_rate}% handover completion. This demonstrates robust overnight care.`,
      severity: "positive",
    });

  // ── Headline ──────────────────────────────────────────────────────────
  const headline =
    sleep_rating === "outstanding"
      ? `Excellent sleep quality: ${disturbances.none_rate}% undisturbed nights, ${check_compliance.check_compliance_rate}% check compliance.`
      : sleep_rating === "good"
        ? `Good sleep environment with ${disturbances.avg_per_night} avg disturbances per night.`
        : sleep_rating === "adequate"
          ? `Sleep quality adequate but ${concerns.length > 0 ? concerns.length + " concern(s) identified" : "needs improvement"}.`
          : `Sleep quality requires attention — ${disturbances.significant_rate}% significant disturbance rate.`;

  return {
    sleep_rating,
    sleep_score: score,
    headline,
    disturbances,
    check_compliance,
    handover,
    shifts,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
