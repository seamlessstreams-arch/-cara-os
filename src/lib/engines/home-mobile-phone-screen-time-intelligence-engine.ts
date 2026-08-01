// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME MOBILE PHONE & SCREEN TIME INTELLIGENCE ENGINE
// Monitors how well the home manages children's screen time, age-appropriate
// content monitoring, device usage agreements, digital wellbeing support, and
// child self-regulation of technology use.
// Measures screen time management, content monitoring, usage agreements,
// digital wellbeing, self-regulation development, and child satisfaction.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Engaging with the wider system — contact and safeguarding),
// CHR 2015 Reg 7 (Protection of children — safeguarding and online safety).
// SCCIF: "Children's experiences are positive" — digital experiences.
// Store keys: screenTimeRecords, contentMonitoringRecords,
//             usageAgreementRecords, digitalWellbeingRecords,
//             selfRegulationRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ScreenTimeRecordInput {
  id: string;
  child_id: string;
  date: string;
  agreed_limit_minutes: number;
  actual_usage_minutes: number;
  device_type: "smartphone" | "tablet" | "laptop" | "desktop" | "gaming_console" | "smart_tv" | "other";
  usage_categories: string[];
  limit_adhered_to: boolean;
  staff_prompted_break: boolean;
  child_self_managed: boolean;
  bedtime_device_handover: boolean;
  weekend_or_holiday: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface ContentMonitoringRecordInput {
  id: string;
  child_id: string;
  date: string;
  monitoring_type: "routine_check" | "concern_raised" | "parental_controls_review" | "app_review" | "browsing_history" | "social_media_check" | "other";
  age_appropriate_content: boolean;
  inappropriate_content_found: boolean;
  content_description: string | null;
  action_taken: string | null;
  child_informed: boolean;
  child_age_years: number;
  filters_active: boolean;
  safeguarding_referral_needed: boolean;
  safeguarding_referral_made: boolean;
  discussion_with_child: boolean;
  staff_member: string;
  created_at: string;
}

export interface UsageAgreementRecordInput {
  id: string;
  child_id: string;
  agreement_date: string;
  agreement_type: "initial" | "review" | "update" | "renewal";
  covers_screen_time_limits: boolean;
  covers_content_boundaries: boolean;
  covers_social_media_rules: boolean;
  covers_online_safety: boolean;
  covers_device_care: boolean;
  covers_consequences: boolean;
  child_contributed: boolean;
  child_signed: boolean;
  carer_signed: boolean;
  social_worker_informed: boolean;
  review_date_set: string | null;
  agreement_active: boolean;
  created_at: string;
}

export interface DigitalWellbeingRecordInput {
  id: string;
  child_id: string;
  date: string;
  session_type: "one_to_one" | "group" | "workshop" | "informal_discussion" | "online_safety_lesson" | "peer_mentoring" | "other";
  topic: "screen_time_balance" | "online_safety" | "cyberbullying" | "digital_footprint" | "healthy_relationships_online" | "gaming_moderation" | "sleep_and_screens" | "body_image" | "other";
  child_engaged: boolean;
  child_feedback_positive: boolean;
  learning_outcomes_achieved: boolean;
  follow_up_planned: boolean;
  follow_up_completed: boolean;
  external_resource_used: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface SelfRegulationRecordInput {
  id: string;
  child_id: string;
  date: string;
  assessment_type: "observation" | "self_report" | "staff_assessment" | "review_meeting" | "other";
  can_identify_overuse: boolean;
  takes_voluntary_breaks: boolean;
  follows_agreed_limits: boolean;
  asks_for_help_when_struggling: boolean;
  balances_screen_offline_activities: boolean;
  recognises_impact_on_mood: boolean;
  self_regulation_score: number | null; // 1-5
  improvement_since_last: "improved" | "maintained" | "declined" | "first_assessment";
  support_plan_in_place: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface MobilePhoneScreenTimeInput {
  today: string;
  total_children: number;
  screen_time_records: ScreenTimeRecordInput[];
  content_monitoring_records: ContentMonitoringRecordInput[];
  usage_agreement_records: UsageAgreementRecordInput[];
  digital_wellbeing_records: DigitalWellbeingRecordInput[];
  self_regulation_records: SelfRegulationRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type MobilePhoneScreenTimeRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface ScreenTimeInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface ScreenTimeRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface MobilePhoneScreenTimeResult {
  screen_time_rating: MobilePhoneScreenTimeRating;
  screen_time_score: number | null;
  headline: string;
  total_screen_time_records: number;
  total_content_checks: number;
  screen_time_management_rate: number | null;
  content_monitoring_rate: number | null;
  usage_agreement_rate: number | null;
  digital_wellbeing_rate: number | null;
  self_regulation_rate: number | null;
  child_satisfaction_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: ScreenTimeRecommendation[];
  insights: ScreenTimeInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): MobilePhoneScreenTimeRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: MobilePhoneScreenTimeRating,
  score: number,
  headline: string,
): MobilePhoneScreenTimeResult {
  return {
    screen_time_rating: rating,
    screen_time_score: score,
    headline,
    total_screen_time_records: 0,
    total_content_checks: 0,
    screen_time_management_rate: 0,
    content_monitoring_rate: 0,
    usage_agreement_rate: 0,
    digital_wellbeing_rate: 0,
    self_regulation_rate: 0,
    child_satisfaction_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeMobilePhoneScreenTime(
  input: MobilePhoneScreenTimeInput,
): MobilePhoneScreenTimeResult {
  const {
    total_children,
    screen_time_records,
    content_monitoring_records,
    usage_agreement_records,
    digital_wellbeing_records,
    self_regulation_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    screen_time_records.length === 0 &&
    content_monitoring_records.length === 0 &&
    usage_agreement_records.length === 0 &&
    digital_wellbeing_records.length === 0 &&
    self_regulation_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess mobile phone and screen time management.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No mobile phone or screen time management data recorded despite children on placement — digital safety monitoring requires urgent attention.",
      ),
      concerns: [
        "No screen time records, content monitoring, usage agreements, digital wellbeing sessions, or self-regulation assessments exist despite children being on placement — the home cannot evidence adequate management of children's digital lives or online safety.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of screen time management, content monitoring, device usage agreements, digital wellbeing education, and self-regulation assessments to evidence the home's approach to children's online safety and digital wellbeing.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has a documented device usage agreement with age-appropriate screen time limits, content boundaries, and online safety rules, developed with the child's participation.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
        },
      ],
      insights: [
        {
          text: "The complete absence of mobile phone and screen time management records means Ofsted cannot verify that children's online safety is being managed, content is age-appropriate, or digital wellbeing is supported. This represents a fundamental gap in Reg 5 and Reg 7 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Screen time management metrics ---
  const totalScreenTimeRecords = screen_time_records.length;

  const limitAdhered = screen_time_records.filter((r) => r.limit_adhered_to).length;
  const limitAdherenceRate = pct(limitAdhered, totalScreenTimeRecords);

  const bedtimeHandover = screen_time_records.filter((r) => r.bedtime_device_handover).length;
  const bedtimeHandoverRate = pct(bedtimeHandover, totalScreenTimeRecords);

  const childSelfManaged = screen_time_records.filter((r) => r.child_self_managed).length;
  const selfManagedRate = pct(childSelfManaged, totalScreenTimeRecords);

  const staffPromptedBreak = screen_time_records.filter((r) => r.staff_prompted_break).length;
  const staffPromptedBreakRate = pct(staffPromptedBreak, totalScreenTimeRecords);

  // Over-limit records: actual > agreed by more than 15 minutes
  const overLimitRecords = screen_time_records.filter(
    (r) => r.actual_usage_minutes > r.agreed_limit_minutes + 15,
  ).length;
  const overLimitRate = pct(overLimitRecords, totalScreenTimeRecords);

  // Average daily usage
  const totalUsageMinutes = screen_time_records.reduce((sum, r) => sum + r.actual_usage_minutes, 0);
  const avgDailyUsageMinutes =
    totalScreenTimeRecords > 0
      ? Math.round(totalUsageMinutes / totalScreenTimeRecords)
      : null;

  // Screen time management composite: limit adherence + bedtime handover
  const screenTimeManagementNumerator = limitAdhered + bedtimeHandover;
  const screenTimeManagementDenominator = totalScreenTimeRecords * 2;
  const screenTimeManagementRate = pct(screenTimeManagementNumerator, screenTimeManagementDenominator);

  // --- Content monitoring metrics ---
  const totalContentChecks = content_monitoring_records.length;

  const ageAppropriateContent = content_monitoring_records.filter((r) => r.age_appropriate_content).length;
  const ageAppropriateRate = pct(ageAppropriateContent, totalContentChecks);

  const inappropriateFound = content_monitoring_records.filter((r) => r.inappropriate_content_found).length;
  const inappropriateContentRate = pct(inappropriateFound, totalContentChecks);

  const filtersActive = content_monitoring_records.filter((r) => r.filters_active).length;
  const filtersActiveRate = pct(filtersActive, totalContentChecks);

  const discussionWithChild = content_monitoring_records.filter((r) => r.discussion_with_child).length;
  const discussionRate = pct(discussionWithChild, totalContentChecks);

  const childInformed = content_monitoring_records.filter((r) => r.child_informed).length;
  const childInformedRate = pct(childInformed, totalContentChecks);

  // Safeguarding referral compliance
  const safeguardingNeeded = content_monitoring_records.filter((r) => r.safeguarding_referral_needed).length;
  const safeguardingMade = content_monitoring_records.filter(
    (r) => r.safeguarding_referral_needed && r.safeguarding_referral_made,
  ).length;
  const safeguardingComplianceRate = pct(safeguardingMade, safeguardingNeeded);

  // Content monitoring composite: age-appropriate + filters active + child informed
  const contentMonitoringNumerator = ageAppropriateContent + filtersActive + childInformed;
  const contentMonitoringDenominator = totalContentChecks * 3;
  const contentMonitoringRate = pct(contentMonitoringNumerator, contentMonitoringDenominator);

  // --- Usage agreement metrics ---
  const totalAgreements = usage_agreement_records.length;

  const activeAgreements = usage_agreement_records.filter((r) => r.agreement_active).length;

  const uniqueChildrenWithAgreements = new Set(
    usage_agreement_records.filter((r) => r.agreement_active).map((r) => r.child_id),
  ).size;
  const agreementCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithAgreements, total_children) : 0;

  const childContributed = usage_agreement_records.filter((r) => r.child_contributed).length;
  const childContributionRate = pct(childContributed, totalAgreements);

  const childSigned = usage_agreement_records.filter((r) => r.child_signed).length;
  const childSignedRate = pct(childSigned, totalAgreements);

  const agreementChecks = [
    (a: UsageAgreementRecordInput) => a.covers_screen_time_limits,
    (a: UsageAgreementRecordInput) => a.covers_content_boundaries,
    (a: UsageAgreementRecordInput) => a.covers_social_media_rules,
    (a: UsageAgreementRecordInput) => a.covers_online_safety,
    (a: UsageAgreementRecordInput) => a.covers_device_care,
    (a: UsageAgreementRecordInput) => a.covers_consequences,
  ];
  const totalAgreementChecksPossible = totalAgreements * agreementChecks.length;
  let totalAgreementChecksPassed = 0;
  for (const rec of usage_agreement_records) {
    for (const check of agreementChecks) {
      if (check(rec)) totalAgreementChecksPassed++;
    }
  }
  const agreementComprehensivenessRate = pct(totalAgreementChecksPassed, totalAgreementChecksPossible);

  const socialWorkerInformed = usage_agreement_records.filter((r) => r.social_worker_informed).length;
  const socialWorkerInformedRate = pct(socialWorkerInformed, totalAgreements);

  // Usage agreement composite: coverage + child contributed + comprehensive
  const usageAgreementRate =
    totalAgreements > 0
      ? Math.round((agreementCoverageRate + childContributionRate + agreementComprehensivenessRate) / 3)
      : null;

  // --- Digital wellbeing metrics ---
  const totalWellbeingSessions = digital_wellbeing_records.length;

  const childEngaged = digital_wellbeing_records.filter((r) => r.child_engaged).length;
  const childEngagementRate = pct(childEngaged, totalWellbeingSessions);

  const childFeedbackPositive = digital_wellbeing_records.filter((r) => r.child_feedback_positive).length;
  const childSatisfactionRate = pct(childFeedbackPositive, totalWellbeingSessions);

  const learningOutcomesAchieved = digital_wellbeing_records.filter((r) => r.learning_outcomes_achieved).length;
  const learningOutcomesRate = pct(learningOutcomesAchieved, totalWellbeingSessions);

  const followUpPlanned = digital_wellbeing_records.filter((r) => r.follow_up_planned).length;
  const followUpCompleted = digital_wellbeing_records.filter(
    (r) => r.follow_up_planned && r.follow_up_completed,
  ).length;
  const followUpCompletionRate = pct(followUpCompleted, followUpPlanned);

  const externalResourceUsed = digital_wellbeing_records.filter((r) => r.external_resource_used).length;
  const externalResourceRate = pct(externalResourceUsed, totalWellbeingSessions);

  // Digital wellbeing composite: engaged + learning outcomes + follow-up
  const digitalWellbeingNumerator = childEngaged + learningOutcomesAchieved + followUpCompleted;
  const digitalWellbeingDenominator = totalWellbeingSessions + totalWellbeingSessions + followUpPlanned;
  const digitalWellbeingRate =
    digitalWellbeingDenominator > 0
      ? pct(digitalWellbeingNumerator, digitalWellbeingDenominator)
      : null;

  // --- Self-regulation metrics ---
  const totalSelfRegRecords = self_regulation_records.length;

  const selfRegChecks = [
    (s: SelfRegulationRecordInput) => s.can_identify_overuse,
    (s: SelfRegulationRecordInput) => s.takes_voluntary_breaks,
    (s: SelfRegulationRecordInput) => s.follows_agreed_limits,
    (s: SelfRegulationRecordInput) => s.asks_for_help_when_struggling,
    (s: SelfRegulationRecordInput) => s.balances_screen_offline_activities,
    (s: SelfRegulationRecordInput) => s.recognises_impact_on_mood,
  ];
  const totalSelfRegChecksPossible = totalSelfRegRecords * selfRegChecks.length;
  let totalSelfRegChecksPassed = 0;
  for (const rec of self_regulation_records) {
    for (const check of selfRegChecks) {
      if (check(rec)) totalSelfRegChecksPassed++;
    }
  }
  const selfRegulationRate = pct(totalSelfRegChecksPassed, totalSelfRegChecksPossible);

  const selfRegScoreSum = self_regulation_records.reduce((sum, r) => sum + (r.self_regulation_score ?? 0), 0);
  const avgSelfRegScore =
    totalSelfRegRecords > 0
      ? Math.round((selfRegScoreSum / totalSelfRegRecords) * 100) / 100
      : null;

  const improved = self_regulation_records.filter((r) => r.improvement_since_last === "improved").length;
  const improvementRate = pct(improved, totalSelfRegRecords);

  const declined = self_regulation_records.filter((r) => r.improvement_since_last === "declined").length;
  const declinedRate = pct(declined, totalSelfRegRecords);

  const supportPlanInPlace = self_regulation_records.filter((r) => r.support_plan_in_place).length;
  const supportPlanRate = pct(supportPlanInPlace, totalSelfRegRecords);

  // ── Scoring: base 52, max bonuses +28, 4 guarded penalties ─────────

  let score = 52;

  // --- Bonus 1: screenTimeManagementRate (>=90: +5, >=70: +3) ---
  if (screenTimeManagementRate >= 90) score += 5;
  else if (screenTimeManagementRate >= 70) score += 3;

  // --- Bonus 2: contentMonitoringRate (>=90: +5, >=70: +3) ---
  if (contentMonitoringRate >= 90) score += 5;
  else if (contentMonitoringRate >= 70) score += 3;

  // --- Bonus 3: usageAgreementRate (>=85: +5, >=65: +2) ---
  if ((usageAgreementRate ?? 0) >= 85) score += 5;
  else if ((usageAgreementRate ?? 0) >= 65) score += 2;

  // --- Bonus 4: digitalWellbeingRate (>=85: +4, >=65: +2) ---
  if ((digitalWellbeingRate ?? 0) >= 85) score += 4;
  else if ((digitalWellbeingRate ?? 0) >= 65) score += 2;

  // --- Bonus 5: selfRegulationRate (>=85: +5, >=65: +2) ---
  if (selfRegulationRate >= 85) score += 5;
  else if (selfRegulationRate >= 65) score += 2;

  // --- Bonus 6: childSatisfactionRate (>=90: +4, >=70: +2) ---
  if (childSatisfactionRate >= 90) score += 4;
  else if (childSatisfactionRate >= 70) score += 2;

  // ── Penalties (4 guarded) ─────────────────────────────────────────

  // Penalty 1: screenTimeManagementRate < 40 → -5
  if (screenTimeManagementRate < 40 && totalScreenTimeRecords > 0) score -= 5;

  // Penalty 2: contentMonitoringRate < 40 → -5
  if (contentMonitoringRate < 40 && totalContentChecks > 0) score -= 5;

  // Penalty 3: safeguarding referral missed → -5
  if (safeguardingNeeded > 0 && safeguardingComplianceRate < 100) score -= 5;

  // Penalty 4: overLimitRate > 50 → -3
  if (overLimitRate > 50 && totalScreenTimeRecords > 0) score -= 3;

  score = clamp(score, 0, 100);

  const screen_time_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (screenTimeManagementRate >= 90 && totalScreenTimeRecords > 0) {
    strengths.push(
      `${screenTimeManagementRate}% screen time management compliance — children's screen time limits are consistently upheld and devices are managed effectively at bedtime, promoting healthy digital habits.`,
    );
  } else if (screenTimeManagementRate >= 70 && totalScreenTimeRecords > 0) {
    strengths.push(
      `${screenTimeManagementRate}% screen time management — the home generally maintains effective screen time boundaries for children.`,
    );
  }

  if (contentMonitoringRate >= 90 && totalContentChecks > 0) {
    strengths.push(
      `${contentMonitoringRate}% content monitoring effectiveness — age-appropriate content is consistently ensured, filters are active, and children are informed about monitoring, demonstrating transparent safeguarding practice.`,
    );
  } else if (contentMonitoringRate >= 70 && totalContentChecks > 0) {
    strengths.push(
      `${contentMonitoringRate}% content monitoring — the home maintains generally effective oversight of children's digital content.`,
    );
  }

  if ((usageAgreementRate ?? 0) >= 85 && totalAgreements > 0) {
    strengths.push(
      `${usageAgreementRate}% usage agreement quality — comprehensive, child-contributed agreements are in place covering screen time limits, content boundaries, online safety, and consequences.`,
    );
  } else if ((usageAgreementRate ?? 0) >= 65 && totalAgreements > 0) {
    strengths.push(
      `${usageAgreementRate}% usage agreement quality — most children have adequate device usage agreements in place.`,
    );
  }

  if ((digitalWellbeingRate ?? 0) >= 85 && totalWellbeingSessions > 0) {
    strengths.push(
      `${digitalWellbeingRate}% digital wellbeing effectiveness — children are actively engaged in digital wellbeing education with strong learning outcomes and consistent follow-up.`,
    );
  } else if ((digitalWellbeingRate ?? 0) >= 65 && totalWellbeingSessions > 0) {
    strengths.push(
      `${digitalWellbeingRate}% digital wellbeing effectiveness — the home provides generally effective digital wellbeing education for children.`,
    );
  }

  if (selfRegulationRate >= 85 && totalSelfRegRecords > 0) {
    strengths.push(
      `${selfRegulationRate}% self-regulation capability — children demonstrate strong ability to manage their own screen time, recognise overuse, take voluntary breaks, and balance online and offline activities.`,
    );
  } else if (selfRegulationRate >= 65 && totalSelfRegRecords > 0) {
    strengths.push(
      `${selfRegulationRate}% self-regulation capability — most children show developing skills in managing their own screen time and digital habits.`,
    );
  }

  if (childSatisfactionRate >= 90 && totalWellbeingSessions > 0) {
    strengths.push(
      `${childSatisfactionRate}% positive child feedback on digital wellbeing support — children feel the home's approach to screen time and digital safety is fair, supportive, and helpful.`,
    );
  } else if (childSatisfactionRate >= 70 && totalWellbeingSessions > 0) {
    strengths.push(
      `${childSatisfactionRate}% positive child feedback — most children report positive experiences with the home's digital wellbeing approach.`,
    );
  }

  if (limitAdherenceRate >= 90 && totalScreenTimeRecords > 0) {
    strengths.push(
      `${limitAdherenceRate}% screen time limit adherence — children consistently stay within agreed limits, reflecting effective boundary-setting and child cooperation.`,
    );
  } else if (limitAdherenceRate >= 70 && totalScreenTimeRecords > 0) {
    strengths.push(
      `${limitAdherenceRate}% screen time limit adherence — the majority of children's screen time stays within agreed boundaries.`,
    );
  }

  if (bedtimeHandoverRate >= 90 && totalScreenTimeRecords > 0) {
    strengths.push(
      `${bedtimeHandoverRate}% bedtime device handover compliance — devices are consistently collected before bedtime, supporting children's sleep hygiene and protecting against unsupervised nighttime use.`,
    );
  } else if (bedtimeHandoverRate >= 70 && totalScreenTimeRecords > 0) {
    strengths.push(
      `${bedtimeHandoverRate}% bedtime device handover — devices are generally collected before bedtime for most children.`,
    );
  }

  if (filtersActiveRate >= 90 && totalContentChecks > 0) {
    strengths.push(
      `${filtersActiveRate}% of devices have active content filters — age-appropriate filtering is consistently maintained across children's devices, providing a strong first line of digital safeguarding.`,
    );
  } else if (filtersActiveRate >= 70 && totalContentChecks > 0) {
    strengths.push(
      `${filtersActiveRate}% of devices have active content filters — filtering is generally maintained across children's devices.`,
    );
  }

  if (childContributionRate >= 90 && totalAgreements > 0) {
    strengths.push(
      `${childContributionRate}% child contribution to usage agreements — children are actively involved in setting their own digital boundaries, fostering ownership and self-regulation.`,
    );
  } else if (childContributionRate >= 70 && totalAgreements > 0) {
    strengths.push(
      `${childContributionRate}% child contribution to usage agreements — most children participate in developing their device usage boundaries.`,
    );
  }

  if (safeguardingComplianceRate === 100 && safeguardingNeeded > 0) {
    strengths.push(
      `100% safeguarding referral compliance — all identified online safety concerns requiring referral were actioned promptly, demonstrating robust safeguarding practice.`,
    );
  }

  if (selfManagedRate >= 70 && totalScreenTimeRecords > 0) {
    strengths.push(
      `${selfManagedRate}% of screen time sessions self-managed by children — children are developing independence in managing their own digital habits, reflecting the home's focus on building self-regulation skills.`,
    );
  }

  if (discussionRate >= 90 && totalContentChecks > 0) {
    strengths.push(
      `${discussionRate}% of content checks include discussion with the child — the home uses monitoring as an educational opportunity rather than a purely restrictive measure, building trust and understanding.`,
    );
  }

  if (improvementRate >= 70 && totalSelfRegRecords > 0) {
    strengths.push(
      `${improvementRate}% of children show improvement in self-regulation — the home's approach to digital wellbeing is having a measurable positive impact on children's ability to manage their own screen time.`,
    );
  }

  if (agreementComprehensivenessRate >= 90 && totalAgreements > 0) {
    strengths.push(
      `${agreementComprehensivenessRate}% agreement comprehensiveness — usage agreements thoroughly cover screen time limits, content boundaries, social media rules, online safety, device care, and consequences.`,
    );
  }

  if (followUpCompletionRate >= 90 && followUpPlanned > 0) {
    strengths.push(
      `${followUpCompletionRate}% digital wellbeing follow-up completion — planned follow-up actions from wellbeing sessions are consistently completed, ensuring learning is reinforced over time.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (screenTimeManagementRate < 40 && totalScreenTimeRecords > 0) {
    concerns.push(
      `Only ${screenTimeManagementRate}% screen time management compliance — screen time limits are frequently exceeded and bedtime device collection is inconsistent, leaving children exposed to unmanaged digital access and undermining sleep hygiene.`,
    );
  } else if (screenTimeManagementRate < 70 && screenTimeManagementRate >= 40 && totalScreenTimeRecords > 0) {
    concerns.push(
      `Screen time management at ${screenTimeManagementRate}% — inconsistent enforcement of screen time limits and bedtime device collection may affect children's digital wellbeing and sleep patterns.`,
    );
  }

  if (contentMonitoringRate < 40 && totalContentChecks > 0) {
    concerns.push(
      `Only ${contentMonitoringRate}% content monitoring effectiveness — age-appropriate content is not being consistently ensured, filters are not maintained, and children are not informed about monitoring. This represents a significant safeguarding gap.`,
    );
  } else if (contentMonitoringRate < 70 && contentMonitoringRate >= 40 && totalContentChecks > 0) {
    concerns.push(
      `Content monitoring at ${contentMonitoringRate}% — some areas of content oversight are inconsistent, potentially leaving children exposed to inappropriate material.`,
    );
  }

  if ((usageAgreementRate ?? 0) < 40 && totalAgreements > 0) {
    concerns.push(
      `Only ${usageAgreementRate}% usage agreement quality — agreements lack comprehensiveness, child participation, or adequate coverage. Children do not have clear, jointly-agreed digital boundaries.`,
    );
  } else if ((usageAgreementRate ?? 0) < 65 && (usageAgreementRate ?? 0) >= 40 && totalAgreements > 0) {
    concerns.push(
      `Usage agreement quality at ${usageAgreementRate}% — agreements need improvement in coverage, child involvement, or comprehensiveness.`,
    );
  }

  if ((digitalWellbeingRate ?? 0) < 40 && totalWellbeingSessions > 0) {
    concerns.push(
      `Only ${digitalWellbeingRate}% digital wellbeing effectiveness — children are not engaging with digital wellbeing education, learning outcomes are not being achieved, and follow-up is inconsistent. Children are not being equipped to navigate the digital world safely.`,
    );
  } else if ((digitalWellbeingRate ?? 0) < 65 && (digitalWellbeingRate ?? 0) >= 40 && totalWellbeingSessions > 0) {
    concerns.push(
      `Digital wellbeing effectiveness at ${digitalWellbeingRate}% — sessions need improvement in engagement, learning outcomes, or follow-up to better support children's digital safety skills.`,
    );
  }

  if (selfRegulationRate < 40 && totalSelfRegRecords > 0) {
    concerns.push(
      `Only ${selfRegulationRate}% self-regulation capability — children are struggling to identify overuse, take voluntary breaks, follow agreed limits, or balance screen time with offline activities. Intensive support is needed to develop healthy digital habits.`,
    );
  } else if (selfRegulationRate < 65 && selfRegulationRate >= 40 && totalSelfRegRecords > 0) {
    concerns.push(
      `Self-regulation at ${selfRegulationRate}% — children need additional support to develop the skills needed to manage their own screen time and digital habits independently.`,
    );
  }

  if (childSatisfactionRate < 50 && totalWellbeingSessions > 0) {
    concerns.push(
      `Only ${childSatisfactionRate}% positive child feedback on digital wellbeing — children do not feel the home's approach to screen time and digital safety is fair or helpful, which may indicate overly restrictive or poorly communicated policies.`,
    );
  } else if (childSatisfactionRate < 70 && childSatisfactionRate >= 50 && totalWellbeingSessions > 0) {
    concerns.push(
      `Child satisfaction with digital wellbeing approach at ${childSatisfactionRate}% — a significant proportion of children are not reporting positive experiences.`,
    );
  }

  if (safeguardingNeeded > 0 && safeguardingComplianceRate < 100) {
    const missed = safeguardingNeeded - safeguardingMade;
    concerns.push(
      `${missed} safeguarding referral${missed !== 1 ? "s" : ""} not made despite online safety concerns being identified — this is a serious safeguarding failure that must be addressed immediately.`,
    );
  }

  if (overLimitRate > 50 && totalScreenTimeRecords > 0) {
    concerns.push(
      `${overLimitRate}% of screen time sessions exceed agreed limits by more than 15 minutes — children are routinely exceeding their agreed boundaries, suggesting limits are either unenforceable or not being monitored.`,
    );
  } else if (overLimitRate > 30 && overLimitRate <= 50 && totalScreenTimeRecords > 0) {
    concerns.push(
      `${overLimitRate}% of sessions exceed agreed limits — some children regularly exceed their screen time boundaries.`,
    );
  }

  if (bedtimeHandoverRate < 50 && totalScreenTimeRecords > 0) {
    concerns.push(
      `Only ${bedtimeHandoverRate}% bedtime device handover — devices are frequently not collected before bedtime, leaving children with unsupervised nighttime access that affects sleep and creates safeguarding risks.`,
    );
  } else if (bedtimeHandoverRate < 70 && bedtimeHandoverRate >= 50 && totalScreenTimeRecords > 0) {
    concerns.push(
      `Bedtime device handover at ${bedtimeHandoverRate}% — devices are not consistently collected before bedtime for all children.`,
    );
  }

  if (filtersActiveRate < 50 && totalContentChecks > 0) {
    concerns.push(
      `Only ${filtersActiveRate}% of devices have active content filters — the majority of children's devices lack age-appropriate filtering, creating significant safeguarding risks.`,
    );
  } else if (filtersActiveRate < 70 && filtersActiveRate >= 50 && totalContentChecks > 0) {
    concerns.push(
      `Content filters active on ${filtersActiveRate}% of devices — not all children's devices have appropriate filtering in place.`,
    );
  }

  if (agreementCoverageRate < 50 && total_children > 0 && totalAgreements > 0) {
    concerns.push(
      `Only ${agreementCoverageRate}% of children have active usage agreements — many children lack clear, documented digital boundaries.`,
    );
  }

  if (declinedRate > 30 && totalSelfRegRecords > 0) {
    concerns.push(
      `${declinedRate}% of children show declining self-regulation — some children's ability to manage their own screen time is deteriorating, requiring targeted intervention.`,
    );
  }

  if (totalScreenTimeRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No screen time records exist despite children being on placement — the home cannot evidence that children's device usage is being monitored or managed.",
    );
  }

  if (totalContentChecks === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No content monitoring records exist — the home cannot evidence that children's online content is being checked for age-appropriateness or that safeguarding risks are being identified.",
    );
  }

  if (totalAgreements === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No device usage agreements exist — children do not have documented, agreed digital boundaries covering screen time, content, social media, and online safety.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: ScreenTimeRecommendation[] = [];
  let rank = 0;

  if (safeguardingNeeded > 0 && safeguardingComplianceRate < 100) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately review all identified online safety concerns where safeguarding referrals were not made — complete outstanding referrals, investigate why they were missed, and reinforce safeguarding protocols with all staff.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (screenTimeManagementRate < 40 && totalScreenTimeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently reinstate effective screen time management — establish clear, enforceable limits for each child, implement consistent bedtime device collection, and ensure staff actively monitor and support children's compliance with agreed boundaries.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (contentMonitoringRate < 40 && totalContentChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement robust content monitoring across all children's devices — activate age-appropriate filters, establish regular monitoring schedules, inform children about monitoring practices transparently, and ensure all staff understand their safeguarding responsibilities regarding online content.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (totalScreenTimeRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin immediate recording of children's screen time usage — document agreed limits, actual usage, device types, bedtime handover, and any concerns to evidence effective digital management.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (totalContentChecks === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commence regular content monitoring for all children's devices — check age-appropriateness of content, review parental controls, and document findings to evidence online safeguarding.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (totalAgreements === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create individualised device usage agreements for every child — involve children in developing agreements covering screen time limits, content boundaries, social media rules, online safety, device care, and consequences.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (bedtimeHandoverRate < 50 && totalScreenTimeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a consistent bedtime device collection routine — all devices should be collected at an agreed time before bed to protect children's sleep and prevent unsupervised nighttime online access.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (filtersActiveRate < 50 && totalContentChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Activate and maintain age-appropriate content filters on all children's devices — review current filtering software, ensure it is operational, and establish regular checks to confirm filters remain active.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (overLimitRate > 50 && totalScreenTimeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and reset screen time limits with each child — current limits may be unrealistic or unenforced. Work with children to agree realistic, age-appropriate limits and establish clear structures for adherence.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (selfRegulationRate < 40 && totalSelfRegRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop targeted self-regulation support plans for children struggling with screen time management — provide coaching, visual timers, graduated independence, and positive reinforcement for healthy digital behaviour.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Children's experiences",
    });
  }

  if (childSatisfactionRate < 50 && totalWellbeingSessions > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Consult children individually about their experiences with the home's digital policies — low satisfaction may indicate policies feel punitive rather than supportive. Redesign approaches with children's input to balance safety with autonomy.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    (usageAgreementRate ?? 0) >= 40 &&
    (usageAgreementRate ?? 0) < 65 &&
    totalAgreements > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve device usage agreements — ensure they comprehensively cover all areas (screen time, content, social media, online safety, device care, consequences) and involve children meaningfully in their development.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (
    (digitalWellbeingRate ?? 0) >= 40 &&
    (digitalWellbeingRate ?? 0) < 65 &&
    totalWellbeingSessions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance digital wellbeing sessions — focus on improving child engagement, ensuring learning outcomes are achieved, and completing planned follow-up actions to reinforce learning.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Children's experiences",
    });
  }

  if (
    screenTimeManagementRate >= 40 &&
    screenTimeManagementRate < 70 &&
    totalScreenTimeRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen screen time management to achieve consistent compliance above 70% — review barriers to limit adherence and bedtime device collection, and provide staff with clear protocols.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (
    contentMonitoringRate >= 40 &&
    contentMonitoringRate < 70 &&
    totalContentChecks > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve content monitoring practices — ensure all three elements (age-appropriate content verification, active filters, child information) are consistently delivered across all monitoring checks.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Protection of children",
    });
  }

  if (
    selfRegulationRate >= 40 &&
    selfRegulationRate < 65 &&
    totalSelfRegRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Continue building children's self-regulation skills through structured support — use age-appropriate strategies to help children develop awareness of their own screen time patterns and the skills to manage them independently.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Children's experiences",
    });
  }

  if (
    childSatisfactionRate >= 50 &&
    childSatisfactionRate < 70 &&
    totalWellbeingSessions > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Seek regular child feedback on the home's digital approach and adapt policies accordingly — aim to increase positive feedback above 70% by making digital wellbeing feel supportive rather than restrictive.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (discussionRate < 70 && totalContentChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the proportion of content monitoring checks that include discussion with children — use monitoring as an educational opportunity to build digital literacy and trust.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Children's experiences",
    });
  }

  if (
    agreementCoverageRate < 50 &&
    total_children > 0 &&
    totalAgreements > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend device usage agreements to cover all children on placement — every child should have an individualised, active agreement that sets clear expectations and boundaries for device use.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  if (socialWorkerInformedRate < 70 && totalAgreements > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure social workers are informed when device usage agreements are created or updated — this supports multi-agency working and ensures placing authorities are aware of the home's digital management approach.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider system",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: ScreenTimeInsight[] = [];

  // -- Critical insights --

  if (safeguardingNeeded > 0 && safeguardingComplianceRate < 100) {
    insights.push({
      text: `Safeguarding referrals were not made for all identified online safety concerns. When content monitoring reveals potential safeguarding risks, referral is mandatory under Reg 7. Failure to refer places children at continued risk and represents a serious regulatory breach.`,
      severity: "critical",
    });
  }

  if (screenTimeManagementRate < 40 && totalScreenTimeRecords > 0) {
    insights.push({
      text: `Only ${screenTimeManagementRate}% screen time management compliance. Unmanaged screen time in residential care creates multiple risks: exposure to inappropriate content, disrupted sleep, reduced physical activity, social isolation, and vulnerability to online exploitation. Effective screen time management is a safeguarding imperative.`,
      severity: "critical",
    });
  }

  if (contentMonitoringRate < 40 && totalContentChecks > 0) {
    insights.push({
      text: `Only ${contentMonitoringRate}% content monitoring effectiveness. Children in care are disproportionately vulnerable to online risks including grooming, exploitation, and exposure to harmful content. Inadequate content monitoring leaves children unprotected and fails the home's Reg 7 obligations.`,
      severity: "critical",
    });
  }

  if (overLimitRate > 50 && totalScreenTimeRecords > 0) {
    insights.push({
      text: `${overLimitRate}% of screen time sessions exceed agreed limits by more than 15 minutes. When children routinely exceed agreed boundaries, it suggests either the limits are unrealistic, enforcement is inconsistent, or children lack the self-regulation skills to manage their own usage. All three possibilities require urgent review.`,
      severity: "critical",
    });
  }

  if (bedtimeHandoverRate < 40 && totalScreenTimeRecords > 0) {
    insights.push({
      text: `Only ${bedtimeHandoverRate}% bedtime device handover. Children having unsupervised access to devices at night creates safeguarding risks including contact with unknown individuals, exposure to harmful content, sleep deprivation, and inability for staff to fulfil their duty of care during sleeping hours.`,
      severity: "critical",
    });
  }

  if (totalScreenTimeRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No screen time records exist despite children being on placement. Without usage tracking, the home cannot evidence that children's digital access is being managed, limits are in place, or that screen time is not adversely affecting children's health, sleep, or wellbeing.",
      severity: "critical",
    });
  }

  if (totalContentChecks === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No content monitoring records exist. The absence of any documented content checks means Ofsted cannot verify that the home is fulfilling its safeguarding obligations regarding children's online safety. This is a fundamental gap in Reg 7 compliance.",
      severity: "critical",
    });
  }

  if (totalAgreements === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No device usage agreements exist. Without documented agreements, children lack clear boundaries for device use, and the home cannot evidence that expectations have been communicated, agreed, and understood. Agreements are essential for both safeguarding and promoting self-regulation.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    screenTimeManagementRate >= 40 &&
    screenTimeManagementRate < 70 &&
    totalScreenTimeRecords > 0
  ) {
    insights.push({
      text: `Screen time management at ${screenTimeManagementRate}% — improving but inconsistent. Some children are not benefiting from effective digital boundaries. Review whether staffing patterns, competing demands, or individual resistance are creating barriers to consistent management.`,
      severity: "warning",
    });
  }

  if (
    contentMonitoringRate >= 40 &&
    contentMonitoringRate < 70 &&
    totalContentChecks > 0
  ) {
    insights.push({
      text: `Content monitoring at ${contentMonitoringRate}% — some areas of online safeguarding are inconsistent. Gaps in filtering, age-appropriateness checks, or child communication create vulnerabilities that could expose children to harmful content or contacts.`,
      severity: "warning",
    });
  }

  if (
    (usageAgreementRate ?? 0) >= 40 &&
    (usageAgreementRate ?? 0) < 65 &&
    totalAgreements > 0
  ) {
    insights.push({
      text: `Usage agreement quality at ${usageAgreementRate}% — agreements may lack important areas of coverage, child involvement, or comprehensiveness. Strong agreements provide the foundation for all other aspects of digital management.`,
      severity: "warning",
    });
  }

  if (
    (digitalWellbeingRate ?? 0) >= 40 &&
    (digitalWellbeingRate ?? 0) < 65 &&
    totalWellbeingSessions > 0
  ) {
    insights.push({
      text: `Digital wellbeing effectiveness at ${digitalWellbeingRate}% — wellbeing sessions are not consistently achieving their objectives. Children need engaging, relevant digital wellbeing education to navigate the online world safely and develop healthy habits.`,
      severity: "warning",
    });
  }

  if (
    selfRegulationRate >= 40 &&
    selfRegulationRate < 65 &&
    totalSelfRegRecords > 0
  ) {
    insights.push({
      text: `Self-regulation at ${selfRegulationRate}% — children are developing some skills but need continued support. The goal is for children to leave care with the ability to manage their own digital habits independently. Current levels suggest more structured support is needed.`,
      severity: "warning",
    });
  }

  if (
    childSatisfactionRate >= 50 &&
    childSatisfactionRate < 70 &&
    totalWellbeingSessions > 0
  ) {
    insights.push({
      text: `Child satisfaction at ${childSatisfactionRate}% — a notable proportion of children do not feel positively about the home's digital approach. Effective digital management should feel supportive and empowering, not punitive or controlling.`,
      severity: "warning",
    });
  }

  if (
    overLimitRate > 30 &&
    overLimitRate <= 50 &&
    totalScreenTimeRecords > 0
  ) {
    insights.push({
      text: `${overLimitRate}% of sessions exceed agreed limits. While not yet critical, a pattern of exceeding limits suggests emerging difficulties with boundary adherence that could escalate without intervention.`,
      severity: "warning",
    });
  }

  if (
    bedtimeHandoverRate >= 40 &&
    bedtimeHandoverRate < 70 &&
    totalScreenTimeRecords > 0
  ) {
    insights.push({
      text: `Bedtime device handover at ${bedtimeHandoverRate}% — devices are not consistently collected before bedtime. Inconsistent handover creates an unequal experience for children and leaves some with unsupervised nighttime access.`,
      severity: "warning",
    });
  }

  if (declinedRate > 30 && totalSelfRegRecords > 0) {
    insights.push({
      text: `${declinedRate}% of children show declining self-regulation since their last assessment. This deterioration may be linked to changes in placement, peer influence, new devices, or emerging mental health needs. Individual reviews are recommended.`,
      severity: "warning",
    });
  }

  if (
    followUpCompletionRate >= 50 &&
    followUpCompletionRate < 70 &&
    followUpPlanned > 0
  ) {
    insights.push({
      text: `Follow-up completion rate at ${followUpCompletionRate}% — some planned actions from digital wellbeing sessions are not being completed, which means learning opportunities are being lost.`,
      severity: "warning",
    });
  }

  // Device type analysis
  const deviceTypes: Record<string, number> = {};
  for (const r of screen_time_records) {
    deviceTypes[r.device_type] = (deviceTypes[r.device_type] ?? 0) + 1;
  }
  const topDevices = Object.entries(deviceTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topDevices.length > 0) {
    const formatted = topDevices
      .map(([type, count]) => `${type.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most used device types: ${formatted}. Understanding device preferences helps tailor monitoring approaches and usage agreements — different devices present different safeguarding risks and usage patterns.`,
      severity: "warning",
    });
  }

  // Topic analysis for wellbeing sessions
  const wellbeingTopics: Record<string, number> = {};
  for (const r of digital_wellbeing_records) {
    wellbeingTopics[r.topic] = (wellbeingTopics[r.topic] ?? 0) + 1;
  }
  const topTopics = Object.entries(wellbeingTopics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topTopics.length > 0) {
    const formatted = topTopics
      .map(([topic, count]) => `${topic.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Most covered wellbeing topics: ${formatted}. Ensure the home covers the full range of digital wellbeing topics proportionate to children's assessed risks and developmental stages.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (screen_time_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding mobile phone and screen time management — children have clear, child-contributed usage agreements, content is actively monitored with transparency, digital wellbeing education is effective, and children are developing strong self-regulation skills. This is strong evidence for Reg 5 and Reg 7 compliance.",
      severity: "positive",
    });
  }

  if (
    screenTimeManagementRate >= 90 &&
    bedtimeHandoverRate >= 90 &&
    totalScreenTimeRecords > 0
  ) {
    insights.push({
      text: `${screenTimeManagementRate}% screen time management with ${bedtimeHandoverRate}% bedtime handover compliance — the home has established a consistent, effective framework for managing children's digital access that balances safety with appropriate autonomy.`,
      severity: "positive",
    });
  }

  if (
    contentMonitoringRate >= 90 &&
    filtersActiveRate >= 90 &&
    totalContentChecks > 0
  ) {
    insights.push({
      text: `${contentMonitoringRate}% content monitoring with ${filtersActiveRate}% active filters — the home maintains robust online safeguarding with consistent content checks, active filtering, and transparent communication with children about monitoring practices.`,
      severity: "positive",
    });
  }

  if (
    (usageAgreementRate ?? 0) >= 85 &&
    childContributionRate >= 90 &&
    totalAgreements > 0
  ) {
    insights.push({
      text: `${usageAgreementRate}% agreement quality with ${childContributionRate}% child contribution — comprehensive, child-centred usage agreements demonstrate that the home treats digital management as a collaborative process. Ofsted views this as evidence of genuinely participative practice.`,
      severity: "positive",
    });
  }

  if (
    (digitalWellbeingRate ?? 0) >= 85 &&
    childSatisfactionRate >= 90 &&
    totalWellbeingSessions > 0
  ) {
    insights.push({
      text: `${digitalWellbeingRate}% wellbeing effectiveness with ${childSatisfactionRate}% positive child feedback — the home delivers high-quality digital wellbeing education that children value. This equips children with the knowledge and skills they need for safe digital participation beyond care.`,
      severity: "positive",
    });
  }

  if (
    selfRegulationRate >= 85 &&
    totalSelfRegRecords > 0
  ) {
    insights.push({
      text: `${selfRegulationRate}% self-regulation capability — children demonstrate strong ability to manage their own digital habits. This reflects the home's investment in building independence and preparing children for self-sufficient technology use in adulthood.`,
      severity: "positive",
    });
  }

  if (
    childSatisfactionRate >= 90 &&
    totalWellbeingSessions > 0
  ) {
    insights.push({
      text: `${childSatisfactionRate}% positive child feedback on digital wellbeing — children feel the home's approach is fair, supportive, and helpful. Policies that children endorse are far more effective than those imposed without consultation.`,
      severity: "positive",
    });
  }

  if (safeguardingComplianceRate === 100 && safeguardingNeeded > 0) {
    insights.push({
      text: `100% safeguarding referral compliance across ${safeguardingNeeded} identified concern${safeguardingNeeded !== 1 ? "s" : ""} — the home acts decisively when online safety risks are identified, demonstrating robust Reg 7 safeguarding practice.`,
      severity: "positive",
    });
  }

  if (
    improvementRate >= 70 &&
    totalSelfRegRecords > 0
  ) {
    insights.push({
      text: `${improvementRate}% of children show improving self-regulation — the home's approach to building digital self-management skills is producing measurable positive outcomes. Children are becoming more capable of managing their own screen time independently.`,
      severity: "positive",
    });
  }

  if (
    followUpCompletionRate >= 90 &&
    followUpPlanned > 0
  ) {
    insights.push({
      text: `${followUpCompletionRate}% of digital wellbeing follow-up actions completed — the home consistently reinforces learning from wellbeing sessions, demonstrating a sustained commitment to building children's digital literacy and safety awareness.`,
      severity: "positive",
    });
  }

  if (
    limitAdherenceRate >= 90 &&
    selfManagedRate >= 70 &&
    totalScreenTimeRecords > 0
  ) {
    insights.push({
      text: `${limitAdherenceRate}% limit adherence with ${selfManagedRate}% self-managed — children are not only staying within their agreed limits but managing their own usage independently. This is the gold standard for digital wellbeing in residential care.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (screen_time_rating === "outstanding") {
    headline =
      "Outstanding mobile phone and screen time management — children's digital access is well managed, content is monitored, agreements are comprehensive, and children are developing strong self-regulation skills.";
  } else if (screen_time_rating === "good") {
    headline = `Good mobile phone and screen time management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (screen_time_rating === "adequate") {
    headline = `Adequate mobile phone and screen time management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's digital safety and wellbeing.`;
  } else {
    headline = `Mobile phone and screen time management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to protect children's digital safety and promote healthy screen time habits.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    screen_time_rating,
    screen_time_score: score,
    headline,
    total_screen_time_records: totalScreenTimeRecords,
    total_content_checks: totalContentChecks,
    screen_time_management_rate: screenTimeManagementRate,
    content_monitoring_rate: contentMonitoringRate,
    usage_agreement_rate: usageAgreementRate,
    digital_wellbeing_rate: digitalWellbeingRate,
    self_regulation_rate: selfRegulationRate,
    child_satisfaction_rate: childSatisfactionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
