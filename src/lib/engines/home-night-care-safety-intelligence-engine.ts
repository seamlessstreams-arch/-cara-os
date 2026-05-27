// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME NIGHT CARE & SAFETY INTELLIGENCE ENGINE
// Home-level: aggregates night checks, handovers, night anxiety support,
// bedtime routines, wake-up routines across all children.
// CHR 2015 Reg 12/25: Night care and safety.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface NightCheckInput {
  id: string;
  date: string;
  time: string;
  child_id: string;
  staff_id: string;
  sleep_status: string;       // sleeping | awake_settled | awake_unsettled | distressed | not_in_room | asleep_restless
  check_type: string;         // scheduled | additional | concern_follow_up
  concern_raised: boolean;
  room_temp_ok: boolean;
}

export interface NightStaffHandoverInput {
  id: string;
  date: string;
  risk_briefing_count: number;
  specific_concerns_count: number;
  children_at_home_count: number;
  morning_handover_complete: boolean;
}

export interface NightAnxietySupportInput {
  id: string;
  child_id: string;
  record_date: string;
  anxiety_level: string;      // settled | mild | moderate | severe | crisis
  do_strategies_count: number;
  do_not_strategies_count: number;
  child_voice: string;
  child_preferences: string;
  external_referral_active: string | null;
  review_date: string;
}

export interface BedtimeRoutineInput {
  id: string;
  child_id: string;
  effectiveness_rating: number; // 1-5
  child_agreed: boolean;
  routine_steps_count: number;
  pre_bed_rituals_count: number;
  reviewed_date: string;
}

export interface WakeUpRoutineInput {
  id: string;
  child_id: string;
  effectivenessRating: number; // 1-5
  childAgreed: boolean;
  wakeUpSteps_count: number;
  reviewedDate: string;
}

export interface HomeNightCareSafetyInput {
  today: string;
  night_checks: NightCheckInput[];
  night_staff_handovers: NightStaffHandoverInput[];
  night_anxiety_support_records: NightAnxietySupportInput[];
  bedtime_routines: BedtimeRoutineInput[];
  wake_up_routines: WakeUpRoutineInput[];
  total_children: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type NightCareRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface NightCheckSummary {
  total_checks_30d: number;
  checks_per_child: number;
  room_temp_ok_rate: number;
  concern_raised_count: number;
  concern_follow_up_rate: number;
  scheduled_count: number;
  additional_count: number;
  children_checked: number;
}

export interface HandoverSummary {
  total_handovers: number;
  completion_rate: number;
  avg_risk_briefing_count: number;
  avg_concerns_documented: number;
  avg_children_covered: number;
}

export interface AnxietySupportSummary {
  total_records: number;
  child_coverage: number;
  avg_strategies: number;
  severe_crisis_with_referral_rate: number;
  child_voice_rate: number;
  child_preferences_rate: number;
}

export interface BedtimeRoutineSummary {
  total_routines: number;
  child_coverage: number;
  avg_effectiveness: number;
  child_agreed_rate: number;
  avg_steps: number;
  overdue_reviews: number;
}

export interface WakeUpRoutineSummary {
  total_routines: number;
  child_coverage: number;
  avg_effectiveness: number;
  child_agreed_rate: number;
  avg_steps: number;
  overdue_reviews: number;
}

export interface SleepQualitySummary {
  sleeping_rate: number;
  settled_rate: number;
  distressed_rate: number;
  not_in_room_rate: number;
  concern_resolution_rate: number;
}

export interface ChildVoiceSummary {
  anxiety_voice_rate: number;
  bedtime_agreed_rate: number;
  wakeup_agreed_rate: number;
  anxiety_preferences_rate: number;
}

export interface ReviewComplianceSummary {
  anxiety_overdue: number;
  bedtime_overdue: number;
  wakeup_overdue: number;
  total_overdue: number;
}

export interface HomeNightCareSafetyResult {
  night_care_rating: NightCareRating;
  night_care_score: number;
  headline: string;
  night_checks: NightCheckSummary;
  handovers: HandoverSummary;
  anxiety_support: AnxietySupportSummary;
  bedtime_routines: BedtimeRoutineSummary;
  wake_up_routines: WakeUpRoutineSummary;
  sleep_quality: SleepQualitySummary;
  child_voice: ChildVoiceSummary;
  review_compliance: ReviewComplianceSummary;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
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

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeNightCareSafety(
  input: HomeNightCareSafetyInput,
): HomeNightCareSafetyResult {
  const {
    today, night_checks, night_staff_handovers,
    night_anxiety_support_records, bedtime_routines,
    wake_up_routines, total_children,
  } = input;

  // ── Insufficient data guard ──────────────────────────────────────────
  if (
    total_children === 0 &&
    night_checks.length === 0 &&
    night_staff_handovers.length === 0 &&
    night_anxiety_support_records.length === 0 &&
    bedtime_routines.length === 0 &&
    wake_up_routines.length === 0
  ) {
    return {
      night_care_rating: "insufficient_data",
      night_care_score: 0,
      headline: "No night care data available for analysis.",
      night_checks: { total_checks_30d: 0, checks_per_child: 0, room_temp_ok_rate: 0, concern_raised_count: 0, concern_follow_up_rate: 0, scheduled_count: 0, additional_count: 0, children_checked: 0 },
      handovers: { total_handovers: 0, completion_rate: 0, avg_risk_briefing_count: 0, avg_concerns_documented: 0, avg_children_covered: 0 },
      anxiety_support: { total_records: 0, child_coverage: 0, avg_strategies: 0, severe_crisis_with_referral_rate: 0, child_voice_rate: 0, child_preferences_rate: 0 },
      bedtime_routines: { total_routines: 0, child_coverage: 0, avg_effectiveness: 0, child_agreed_rate: 0, avg_steps: 0, overdue_reviews: 0 },
      wake_up_routines: { total_routines: 0, child_coverage: 0, avg_effectiveness: 0, child_agreed_rate: 0, avg_steps: 0, overdue_reviews: 0 },
      sleep_quality: { sleeping_rate: 0, settled_rate: 0, distressed_rate: 0, not_in_room_rate: 0, concern_resolution_rate: 0 },
      child_voice: { anxiety_voice_rate: 0, bedtime_agreed_rate: 0, wakeup_agreed_rate: 0, anxiety_preferences_rate: 0 },
      review_compliance: { anxiety_overdue: 0, bedtime_overdue: 0, wakeup_overdue: 0, total_overdue: 0 },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Night check analysis (last 30 days) ──────────────────────────────
  const nc30 = night_checks.filter(c => daysBetween(c.date, today) >= 0 && daysBetween(c.date, today) <= 30);
  const ncChildIds = new Set(nc30.map(c => c.child_id));
  const ncChecksPerChild = total_children > 0 ? Math.round((nc30.length / total_children) * 10) / 10 : 0;
  const ncTempOk = nc30.filter(c => c.room_temp_ok).length;
  const ncTempOkRate = pct(ncTempOk, nc30.length);
  const ncConcernRaised = nc30.filter(c => c.concern_raised).length;
  const ncConcernFollowUps = nc30.filter(c => c.check_type === "concern_follow_up").length;
  const ncConcernFollowUpRate = pct(ncConcernFollowUps, ncConcernRaised);
  const ncScheduled = nc30.filter(c => c.check_type === "scheduled").length;
  const ncAdditional = nc30.filter(c => c.check_type === "additional").length;

  const nightChecksSummary: NightCheckSummary = {
    total_checks_30d: nc30.length,
    checks_per_child: ncChecksPerChild,
    room_temp_ok_rate: ncTempOkRate,
    concern_raised_count: ncConcernRaised,
    concern_follow_up_rate: ncConcernFollowUpRate,
    scheduled_count: ncScheduled,
    additional_count: ncAdditional,
    children_checked: ncChildIds.size,
  };

  // ── Handover analysis ───────────────────────────────────────────────
  const hoComplete = night_staff_handovers.filter(h => h.morning_handover_complete).length;
  const hoCompletionRate = pct(hoComplete, night_staff_handovers.length);
  const hoAvgRiskBriefing = night_staff_handovers.length > 0
    ? Math.round((night_staff_handovers.reduce((s, h) => s + h.risk_briefing_count, 0) / night_staff_handovers.length) * 10) / 10
    : 0;
  const hoAvgConcerns = night_staff_handovers.length > 0
    ? Math.round((night_staff_handovers.reduce((s, h) => s + h.specific_concerns_count, 0) / night_staff_handovers.length) * 10) / 10
    : 0;
  const hoAvgChildCovered = night_staff_handovers.length > 0
    ? Math.round((night_staff_handovers.reduce((s, h) => s + h.children_at_home_count, 0) / night_staff_handovers.length) * 10) / 10
    : 0;

  const handoversSummary: HandoverSummary = {
    total_handovers: night_staff_handovers.length,
    completion_rate: hoCompletionRate,
    avg_risk_briefing_count: hoAvgRiskBriefing,
    avg_concerns_documented: hoAvgConcerns,
    avg_children_covered: hoAvgChildCovered,
  };

  // ── Night anxiety support analysis ──────────────────────────────────
  const nasChildIds = new Set(night_anxiety_support_records.map(r => r.child_id));
  const nasCoverage = pct(nasChildIds.size, total_children);
  const nasAvgStrategies = night_anxiety_support_records.length > 0
    ? Math.round(night_anxiety_support_records.reduce((s, r) => s + r.do_strategies_count + r.do_not_strategies_count, 0) / night_anxiety_support_records.length)
    : 0;
  const nasSevereCrisis = night_anxiety_support_records.filter(r => r.anxiety_level === "severe" || r.anxiety_level === "crisis");
  const nasSCWithReferral = nasSevereCrisis.filter(r => r.external_referral_active !== null && r.external_referral_active !== "").length;
  const nasSCReferralRate = pct(nasSCWithReferral, nasSevereCrisis.length);
  const nasVoice = night_anxiety_support_records.filter(r => r.child_voice && r.child_voice.trim().length > 0).length;
  const nasVoiceRate = pct(nasVoice, night_anxiety_support_records.length);
  const nasPrefs = night_anxiety_support_records.filter(r => r.child_preferences && r.child_preferences.trim().length > 0).length;
  const nasPrefsRate = pct(nasPrefs, night_anxiety_support_records.length);

  const anxietySupportSummary: AnxietySupportSummary = {
    total_records: night_anxiety_support_records.length,
    child_coverage: nasCoverage,
    avg_strategies: nasAvgStrategies,
    severe_crisis_with_referral_rate: nasSCReferralRate,
    child_voice_rate: nasVoiceRate,
    child_preferences_rate: nasPrefsRate,
  };

  // ── Bedtime routine analysis ────────────────────────────────────────
  const brChildIds = new Set(bedtime_routines.map(r => r.child_id));
  const brCoverage = pct(brChildIds.size, total_children);
  const brAvgEff = bedtime_routines.length > 0
    ? Math.round((bedtime_routines.reduce((s, r) => s + r.effectiveness_rating, 0) / bedtime_routines.length) * 10) / 10
    : 0;
  const brAgreed = bedtime_routines.filter(r => r.child_agreed).length;
  const brAgreedRate = pct(brAgreed, bedtime_routines.length);
  const brAvgSteps = bedtime_routines.length > 0
    ? Math.round(bedtime_routines.reduce((s, r) => s + r.routine_steps_count + r.pre_bed_rituals_count, 0) / bedtime_routines.length)
    : 0;
  const brOverdue = bedtime_routines.filter(r => daysBetween(r.reviewed_date, today) > 90).length;

  const bedtimeRoutinesSummary: BedtimeRoutineSummary = {
    total_routines: bedtime_routines.length,
    child_coverage: brCoverage,
    avg_effectiveness: brAvgEff,
    child_agreed_rate: brAgreedRate,
    avg_steps: brAvgSteps,
    overdue_reviews: brOverdue,
  };

  // ── Wake-up routine analysis ────────────────────────────────────────
  const wuChildIds = new Set(wake_up_routines.map(r => r.child_id));
  const wuCoverage = pct(wuChildIds.size, total_children);
  const wuAvgEff = wake_up_routines.length > 0
    ? Math.round((wake_up_routines.reduce((s, r) => s + r.effectivenessRating, 0) / wake_up_routines.length) * 10) / 10
    : 0;
  const wuAgreed = wake_up_routines.filter(r => r.childAgreed).length;
  const wuAgreedRate = pct(wuAgreed, wake_up_routines.length);
  const wuAvgSteps = wake_up_routines.length > 0
    ? Math.round(wake_up_routines.reduce((s, r) => s + r.wakeUpSteps_count, 0) / wake_up_routines.length)
    : 0;
  const wuOverdue = wake_up_routines.filter(r => daysBetween(r.reviewedDate, today) > 90).length;

  const wakeUpRoutinesSummary: WakeUpRoutineSummary = {
    total_routines: wake_up_routines.length,
    child_coverage: wuCoverage,
    avg_effectiveness: wuAvgEff,
    child_agreed_rate: wuAgreedRate,
    avg_steps: wuAvgSteps,
    overdue_reviews: wuOverdue,
  };

  // ── Sleep quality analysis (from night checks) ──────────────────────
  const ncSleeping = nc30.filter(c => c.sleep_status === "sleeping").length;
  const ncSettled = nc30.filter(c => c.sleep_status === "awake_settled").length;
  const ncDistressed = nc30.filter(c => c.sleep_status === "distressed").length;
  const ncNotInRoom = nc30.filter(c => c.sleep_status === "not_in_room").length;
  const sleepingRate = pct(ncSleeping, nc30.length);
  const settledRate = pct(ncSettled, nc30.length);
  const distressedRate = pct(ncDistressed, nc30.length);
  const notInRoomRate = pct(ncNotInRoom, nc30.length);
  // Concern resolution: if concerns were raised and follow-ups done
  const concernResolutionRate = ncConcernFollowUpRate;

  const sleepQualitySummary: SleepQualitySummary = {
    sleeping_rate: sleepingRate,
    settled_rate: settledRate,
    distressed_rate: distressedRate,
    not_in_room_rate: notInRoomRate,
    concern_resolution_rate: concernResolutionRate,
  };

  // ── Child voice summary ─────────────────────────────────────────────
  const childVoiceSummary: ChildVoiceSummary = {
    anxiety_voice_rate: nasVoiceRate,
    bedtime_agreed_rate: brAgreedRate,
    wakeup_agreed_rate: wuAgreedRate,
    anxiety_preferences_rate: nasPrefsRate,
  };

  // ── Review compliance summary ───────────────────────────────────────
  const nasOverdue = night_anxiety_support_records.filter(r => daysBetween(r.review_date, today) > 90).length;

  const reviewComplianceSummary: ReviewComplianceSummary = {
    anxiety_overdue: nasOverdue,
    bedtime_overdue: brOverdue,
    wakeup_overdue: wuOverdue,
    total_overdue: nasOverdue + brOverdue + wuOverdue,
  };

  // ══════════════════════════════════════════════════════════════════════
  // SCORING — base 52 + 8 modifiers (max ±28) → max 80
  // ══════════════════════════════════════════════════════════════════════

  let score = 52;

  // ── Mod 1: Night Check Completeness & Frequency (±5) ────────────────
  {
    let m = 0;
    if (nc30.length > 0) {
      // Checks per child: >=20 excellent, >=10 good
      if (ncChecksPerChild >= 20) m += 2;
      else if (ncChecksPerChild >= 10) m += 1;
      else m -= 1;

      // Room temp ok rate
      if (ncTempOkRate >= 95) m += 1;
      else if (ncTempOkRate < 70) m -= 1;

      // Concern follow-up rate
      if (ncConcernRaised > 0) {
        if (ncConcernFollowUpRate >= 80) m += 1;
        else if (ncConcernFollowUpRate < 40) m -= 1;
      } else {
        m += 1; // No concerns raised is fine
      }

      // Scheduled vs additional balance: having some additional checks is good practice
      const additionalRate = pct(ncAdditional, nc30.length);
      if (additionalRate >= 10 && additionalRate <= 40) m += 1;
      else if (ncScheduled === 0) m -= 1;
    } else {
      if (total_children >= 2) m -= 3;
    }
    score += Math.max(-5, Math.min(5, m));
  }

  // ── Mod 2: Handover Quality (±4) ───────────────────────────────────
  {
    let m = 0;
    if (night_staff_handovers.length > 0) {
      // Morning handover completion rate
      if (hoCompletionRate >= 90) m += 2;
      else if (hoCompletionRate >= 70) m += 1;
      else m -= 1;

      // Risk briefing thoroughness
      if (hoAvgRiskBriefing >= 2) m += 1;
      else if (hoAvgRiskBriefing < 1) m -= 1;

      // Specific concerns documentation
      if (hoAvgConcerns >= 1) m += 1;
      else m -= 1;
    } else {
      if (total_children >= 2) m -= 2;
    }
    score += Math.max(-4, Math.min(4, m));
  }

  // ── Mod 3: Night Anxiety Support Coverage (±3) ──────────────────────
  {
    let m = 0;
    if (night_anxiety_support_records.length > 0) {
      // Child coverage
      if (nasCoverage >= 80) m += 1;
      else if (nasCoverage < 40) m -= 1;

      // Strategy richness
      if (nasAvgStrategies >= 6) m += 1;
      else if (nasAvgStrategies < 3) m -= 1;

      // Severe/crisis with external referral
      if (nasSevereCrisis.length > 0) {
        if (nasSCReferralRate >= 80) m += 1;
        else if (nasSCReferralRate < 40) m -= 1;
      } else {
        m += 1; // No severe/crisis — good
      }
    } else {
      if (total_children >= 3) m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 4: Bedtime Routine Coverage & Quality (±4) ──────────────────
  {
    let m = 0;
    if (bedtime_routines.length > 0) {
      // Child coverage
      if (brCoverage >= 80) m += 1;
      else if (brCoverage < 40) m -= 1;

      // Effectiveness rating average (1-5)
      if (brAvgEff >= 4) m += 1;
      else if (brAvgEff < 2.5) m -= 1;

      // Child agreed rate
      if (brAgreedRate >= 80) m += 1;
      else if (brAgreedRate < 40) m -= 1;

      // Richness: routine_steps + pre_bed_rituals
      if (brAvgSteps >= 6) m += 1;
      else if (brAvgSteps < 3) m -= 1;
    } else {
      if (total_children >= 2) m -= 2;
    }
    score += Math.max(-4, Math.min(4, m));
  }

  // ── Mod 5: Wake-Up Routine Coverage & Quality (±3) ──────────────────
  {
    let m = 0;
    if (wake_up_routines.length > 0) {
      // Child coverage
      if (wuCoverage >= 80) m += 1;
      else if (wuCoverage < 40) m -= 1;

      // Effectiveness rating average
      if (wuAvgEff >= 4) m += 1;
      else if (wuAvgEff < 2.5) m -= 1;

      // Child agreed rate & steps richness combined
      if (wuAgreedRate >= 80 && wuAvgSteps >= 4) m += 1;
      else if (wuAgreedRate < 40) m -= 1;
    } else {
      if (total_children >= 2) m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 6: Sleep Quality & Concern Management (±3) ──────────────────
  {
    let m = 0;
    if (nc30.length > 0) {
      // Good sleep statuses (sleeping + awake_settled)
      const goodRate = pct(ncSleeping + ncSettled, nc30.length);
      if (goodRate >= 85) m += 2;
      else if (goodRate >= 65) m += 1;
      else if (goodRate < 40) m -= 1;

      // Distressed / not_in_room as negatives
      const badRate = pct(ncDistressed + ncNotInRoom, nc30.length);
      if (badRate > 20) m -= 2;
      else if (badRate > 10) m -= 1;
      else if (badRate === 0) m += 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 7: Child Voice Across Night Care (±3) ──────────────────────
  {
    let m = 0;
    const voiceSources: number[] = [];
    if (night_anxiety_support_records.length > 0) voiceSources.push(nasVoiceRate);
    if (bedtime_routines.length > 0) voiceSources.push(brAgreedRate);
    if (wake_up_routines.length > 0) voiceSources.push(wuAgreedRate);
    if (night_anxiety_support_records.length > 0) voiceSources.push(nasPrefsRate);

    if (voiceSources.length > 0) {
      const avgVoice = Math.round(voiceSources.reduce((s, v) => s + v, 0) / voiceSources.length);
      if (avgVoice >= 90) m += 3;
      else if (avgVoice >= 70) m += 2;
      else if (avgVoice >= 50) m += 1;
      else if (avgVoice < 30) m -= 2;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Mod 8: Review Compliance (±3) ──────────────────────────────────
  {
    let m = 0;
    const totalOverdue = nasOverdue + brOverdue + wuOverdue;
    const totalReviewable = night_anxiety_support_records.length + bedtime_routines.length + wake_up_routines.length;

    if (totalReviewable > 0) {
      if (totalOverdue === 0) m += 3;
      else if (totalOverdue <= 2) m += 1;
      else if (totalOverdue >= 5) m -= 2;
      else m -= 1;
    }
    score += Math.max(-3, Math.min(3, m));
  }

  // ── Clamp ────────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, score));

  // ── Rating ───────────────────────────────────────────────────────────
  let night_care_rating: NightCareRating;
  if (score >= 80) night_care_rating = "outstanding";
  else if (score >= 65) night_care_rating = "good";
  else if (score >= 45) night_care_rating = "adequate";
  else night_care_rating = "inadequate";

  // ══════════════════════════════════════════════════════════════════════
  // NARRATIVE
  // ══════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: HomeNightCareSafetyResult["recommendations"] = [];
  const insights: HomeNightCareSafetyResult["insights"] = [];
  let rank = 0;

  // Night checks
  if (nc30.length > 0 && ncChecksPerChild >= 20) {
    strengths.push(`Excellent night check frequency — ${ncChecksPerChild} checks per child in the last 30 days.`);
  }
  if (nc30.length > 0 && ncTempOkRate >= 95) {
    strengths.push(`Room temperature compliance is excellent — ${ncTempOkRate}% of checks confirm safe temperatures.`);
  }
  if (nc30.length === 0 && total_children >= 2) {
    concerns.push("No night checks recorded in the last 30 days — night safety cannot be evidenced.");
    recommendations.push({ rank: ++rank, recommendation: "Implement scheduled night checks immediately to comply with Regulation 25 night care requirements.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 25" });
  }
  if (nc30.length > 0 && ncTempOkRate < 70) {
    concerns.push(`Low room temperature compliance — only ${ncTempOkRate}% of night checks confirm safe room temperatures.`);
    recommendations.push({ rank: ++rank, recommendation: "Audit room temperatures and heating systems to ensure all bedrooms meet safe temperature standards.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 25" });
  }

  // Handovers
  if (night_staff_handovers.length > 0 && hoCompletionRate >= 90) {
    strengths.push(`Strong handover practice — ${hoCompletionRate}% of morning handovers completed.`);
  }
  if (night_staff_handovers.length > 0 && hoCompletionRate < 70) {
    concerns.push(`Handover completion rate is low — only ${hoCompletionRate}% of morning handovers completed.`);
    recommendations.push({ rank: ++rank, recommendation: "Review handover procedures and ensure both evening-to-night and morning handovers are consistently completed.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  }
  if (night_staff_handovers.length === 0 && total_children >= 2) {
    concerns.push("No night staff handover records — continuity of care overnight cannot be evidenced.");
    recommendations.push({ rank: ++rank, recommendation: "Establish and record night staff handover procedures to ensure continuity of care.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  }

  // Anxiety support
  if (night_anxiety_support_records.length > 0 && nasCoverage >= 80 && nasAvgStrategies >= 6) {
    strengths.push(`Comprehensive night anxiety support — ${nasCoverage}% child coverage with an average of ${nasAvgStrategies} strategies per child.`);
  }
  if (nasSevereCrisis.length > 0 && nasSCReferralRate < 40) {
    concerns.push(`${nasSevereCrisis.length} child(ren) with severe/crisis anxiety lack external referral support.`);
    recommendations.push({ rank: ++rank, recommendation: "Ensure all children with severe or crisis-level night anxiety have active external referrals in place.", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 12" });
  }

  // Bedtime routines
  if (bedtime_routines.length > 0 && brCoverage >= 80 && brAvgEff >= 4) {
    strengths.push(`Effective bedtime routines — ${brCoverage}% coverage with average effectiveness rating of ${brAvgEff}/5.`);
  }
  if (bedtime_routines.length === 0 && total_children >= 2) {
    concerns.push("No bedtime routines documented — individualised night care cannot be evidenced.");
    recommendations.push({ rank: ++rank, recommendation: "Develop individualised bedtime routines for all children in consultation with each child.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  }

  // Wake-up routines
  if (wake_up_routines.length > 0 && wuCoverage >= 80 && wuAvgEff >= 4) {
    strengths.push(`Effective wake-up routines — ${wuCoverage}% coverage with average effectiveness rating of ${wuAvgEff}/5.`);
  }
  if (wake_up_routines.length === 0 && total_children >= 2) {
    concerns.push("No wake-up routines documented — morning care transitions are unstructured.");
    recommendations.push({ rank: ++rank, recommendation: "Develop individualised wake-up routines for all children.", urgency: "planned", regulatory_ref: null });
  }

  // Review compliance
  if (reviewComplianceSummary.total_overdue >= 5) {
    concerns.push(`${reviewComplianceSummary.total_overdue} night care records are overdue for review — compliance risk.`);
    recommendations.push({ rank: ++rank, recommendation: "Schedule reviews for all overdue night care records to maintain regulatory compliance.", urgency: "soon", regulatory_ref: "CHR 2015 Reg 12" });
  }

  // ── ARIA Insights ────────────────────────────────────────────────────
  if (nc30.length >= 10) {
    if (distressedRate >= 15) {
      insights.push({ text: `${distressedRate}% of night checks record children as distressed — review individual night care plans and consider CAMHS referral.`, severity: "critical" });
    }
    if (notInRoomRate >= 10) {
      insights.push({ text: `${notInRoomRate}% of night checks find children not in their rooms — assess safety and missing from care risks.`, severity: "warning" });
    }
  }
  if (night_staff_handovers.length >= 5 && hoCompletionRate < 50) {
    insights.push({ text: `Morning handover completion rate is critically low at ${hoCompletionRate}% — night-to-day continuity is compromised.`, severity: "critical" });
  }
  if (nc30.length > 0 && sleepingRate >= 80 && distressedRate === 0 && notInRoomRate === 0) {
    insights.push({ text: "Children are consistently sleeping well with no distress or absences recorded — excellent night care environment.", severity: "positive" });
  }
  if (bedtime_routines.length > 0 && brAgreedRate >= 90 && wake_up_routines.length > 0 && wuAgreedRate >= 90) {
    insights.push({ text: "Both bedtime and wake-up routines have strong child agreement — evidence of child-centred night care practice.", severity: "positive" });
  }

  // ── Headline ─────────────────────────────────────────────────────────
  let headline: string;
  if (night_care_rating === "outstanding") {
    headline = "Night care and safety practice is outstanding with strong monitoring, handovers, and child voice throughout.";
  } else if (night_care_rating === "good") {
    headline = "Good night care foundations with opportunities to strengthen monitoring or routine coverage.";
  } else if (night_care_rating === "adequate") {
    headline = "Night care practice is developing but gaps exist in checks, handovers, or routine documentation.";
  } else {
    headline = "Significant night care gaps — children's safety and wellbeing overnight may not be adequately evidenced.";
  }

  return {
    night_care_rating,
    night_care_score: score,
    headline,
    night_checks: nightChecksSummary,
    handovers: handoversSummary,
    anxiety_support: anxietySupportSummary,
    bedtime_routines: bedtimeRoutinesSummary,
    wake_up_routines: wakeUpRoutinesSummary,
    sleep_quality: sleepQualitySummary,
    child_voice: childVoiceSummary,
    review_compliance: reviewComplianceSummary,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
