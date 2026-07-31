// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STAFF ROTA & ADEQUATE STAFFING INTELLIGENCE ENGINE
// Monitors staffing adequacy — shift coverage completeness, staff-to-child
// ratios, overtime management, agency staff usage, and rota planning quality.
// STAFF-FOCUSED ENGINE: uses total_staff from store.staff, NOT total_children.
// Pure deterministic engine — no imports, no LLM, no external deps.
// Ofsted CHR 2015 Reg 16 (Workforce), Reg 32 (Fitness of workers).
// SCCIF: "Leadership and management — adequate staffing."
// HOME-LEVEL engine.
// Store keys: shiftCoverageRecords, ratioComplianceRecords,
//             overtimeRecords, agencyUsageRecords, rotaPlanningRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ShiftCoverageRecordInput {
  id: string;
  date: string;
  shift_type: "day" | "evening" | "night" | "waking_night" | "sleep_in" | "split" | "other";
  planned_staff_count: number;
  actual_staff_count: number;
  shift_fully_covered: boolean;
  vacancy_reason: string | null; // "sickness" | "annual_leave" | "vacancy" | "training" | "no_show" | "other" | null
  cover_arranged: boolean;
  cover_type: string | null; // "internal_overtime" | "bank_staff" | "agency" | "manager_cover" | null
  handover_completed: boolean;
  handover_quality_rating: number; // 1-5
  lone_working_occurred: boolean;
  lone_working_risk_assessed: boolean;
  shift_incidents_count: number;
  staff_member_ids: string[];
  notes: string | null;
  created_at: string;
}

export interface RatioComplianceRecordInput {
  id: string;
  date: string;
  time_period: "morning" | "afternoon" | "evening" | "night" | "full_day";
  children_present: number;
  staff_on_duty: number;
  required_ratio: string; // e.g. "1:2", "1:3"
  actual_ratio: string;
  ratio_met: boolean;
  ratio_breach_duration_minutes: number;
  breach_reason: string | null;
  corrective_action_taken: boolean;
  corrective_action_detail: string | null;
  senior_staff_on_duty: boolean;
  qualified_staff_count: number;
  manager_notified: boolean;
  created_at: string;
}

export interface OvertimeRecordInput {
  id: string;
  staff_id: string;
  staff_name: string;
  date: string;
  overtime_hours: number;
  overtime_reason: string; // "short_staffing" | "emergency" | "sickness_cover" | "planned_activity" | "incident" | "other"
  overtime_approved: boolean;
  approved_by: string | null;
  consecutive_days_worked: number;
  rest_period_compliant: boolean;
  fatigue_risk_acknowledged: boolean;
  working_time_directive_compliant: boolean;
  total_weekly_hours: number;
  notes: string | null;
  created_at: string;
}

export interface AgencyUsageRecordInput {
  id: string;
  date: string;
  agency_name: string;
  agency_staff_name: string;
  shift_type: "day" | "evening" | "night" | "waking_night" | "other";
  hours_worked: number;
  usage_reason: string; // "vacancy" | "sickness" | "annual_leave" | "training" | "emergency" | "other"
  agency_staff_known_to_home: boolean;
  agency_staff_inducted: boolean;
  dbs_verified: boolean;
  children_briefed: boolean;
  feedback_collected: boolean;
  feedback_rating: number | null; // 1-5
  cost: number;
  repeat_booking: boolean;
  created_at: string;
}

export interface RotaPlanningRecordInput {
  id: string;
  week_commencing: string;
  rota_published_date: string;
  days_advance_published: number;
  all_shifts_filled: boolean;
  unfilled_shifts_count: number;
  skill_mix_adequate: boolean;
  senior_cover_every_shift: boolean;
  staff_preferences_considered: boolean;
  fairness_score: number; // 1-5 — equitable distribution of unsocial hours
  contingency_plan_in_place: boolean;
  rota_approved_by_manager: boolean;
  staff_consulted: boolean;
  changes_after_publication: number;
  notes: string | null;
  created_at: string;
}

export interface StaffRotaInput {
  today: string;
  total_staff: number;
  shift_coverage_records: ShiftCoverageRecordInput[];
  ratio_compliance_records: RatioComplianceRecordInput[];
  overtime_records: OvertimeRecordInput[];
  agency_usage_records: AgencyUsageRecordInput[];
  rota_planning_records: RotaPlanningRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type StaffRotaRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface StaffRotaInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface StaffRotaRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface StaffRotaResult {
  staffing_rating: StaffRotaRating;
  staffing_score: number;
  headline: string;
  total_shift_records: number;
  total_ratio_records: number;
  total_overtime_records: number;
  total_agency_records: number;
  total_rota_records: number;
  shift_coverage_rate: number;
  ratio_compliance_rate: number;
  overtime_rate: number;
  agency_usage_rate: number;
  rota_planning_rate: number;
  staff_satisfaction_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: StaffRotaRecommendation[];
  insights: StaffRotaInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): StaffRotaRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: StaffRotaRating,
  score: number,
  headline: string,
): StaffRotaResult {
  return {
    staffing_rating: rating,
    staffing_score: score,
    headline,
    total_shift_records: 0,
    total_ratio_records: 0,
    total_overtime_records: 0,
    total_agency_records: 0,
    total_rota_records: 0,
    shift_coverage_rate: 0,
    ratio_compliance_rate: 0,
    overtime_rate: 0,
    agency_usage_rate: 0,
    rota_planning_rate: 0,
    staff_satisfaction_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeStaffRotaAdequateStaffing(
  input: StaffRotaInput,
): StaffRotaResult {
  const {
    total_staff,
    shift_coverage_records,
    ratio_compliance_records,
    overtime_records,
    agency_usage_records,
    rota_planning_records,
  } = input;

  // ── Special case: all empty + 0 staff → insufficient_data ──────────
  const allEmpty =
    shift_coverage_records.length === 0 &&
    ratio_compliance_records.length === 0 &&
    overtime_records.length === 0 &&
    agency_usage_records.length === 0 &&
    rota_planning_records.length === 0;

  if (allEmpty && total_staff === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No staff on record — insufficient data to assess staffing adequacy and rota management.",
    );
  }

  // ── Special case: all empty + staff > 0 → inadequate ───────────────
  if (allEmpty && total_staff > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No staffing or rota data recorded despite staff on establishment — staffing adequacy monitoring requires urgent attention.",
      ),
      concerns: [
        "No shift coverage records, ratio compliance data, overtime tracking, agency usage monitoring, or rota planning records exist despite staff being on the establishment — the home cannot evidence adequate staffing levels, safe ratios, or effective workforce management.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of shift coverage, staff-to-child ratios, overtime usage, agency staffing, and rota planning to evidence the home's workforce management and staffing adequacy.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 16 — Workforce",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every shift is documented with planned vs actual staffing levels, ratio compliance is monitored, and rotas are published with appropriate lead times and skill-mix coverage.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 32 — Fitness of workers",
        },
      ],
      insights: [
        {
          text: "The complete absence of staffing and rota records means Ofsted cannot verify that children are cared for by sufficient, suitable staff at all times. This represents a fundamental gap in Reg 16 and Reg 32 compliance evidence.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Shift coverage metrics ---
  const totalShiftRecords = shift_coverage_records.length;

  const shiftsCovered = shift_coverage_records.filter((r) => r.shift_fully_covered).length;
  const shiftCoverageRate = pct(shiftsCovered, totalShiftRecords);

  const handoversCompleted = shift_coverage_records.filter((r) => r.handover_completed).length;
  const handoverRate = pct(handoversCompleted, totalShiftRecords);

  const handoverQualitySum = shift_coverage_records.reduce(
    (sum, r) => sum + r.handover_quality_rating,
    0,
  );
  // fab-0: null when no records — no shifts means no handover quality to average.
  const avgHandoverQuality: number | null =
    totalShiftRecords > 0
      ? Math.round((handoverQualitySum / totalShiftRecords) * 100) / 100
      : null;

  const loneWorkingShifts = shift_coverage_records.filter((r) => r.lone_working_occurred).length;
  const loneWorkingRate = pct(loneWorkingShifts, totalShiftRecords);

  const loneWorkingAssessed = shift_coverage_records.filter(
    (r) => r.lone_working_occurred && r.lone_working_risk_assessed,
  ).length;
  const loneWorkingAssessmentRate = pct(loneWorkingAssessed, loneWorkingShifts);

  const coverArrangedWhenNeeded = shift_coverage_records.filter(
    (r) => !r.shift_fully_covered && r.cover_arranged,
  ).length;
  const uncoveredShifts = shift_coverage_records.filter((r) => !r.shift_fully_covered).length;
  const coverArrangementRate = pct(coverArrangedWhenNeeded, uncoveredShifts);

  const totalShiftIncidents = shift_coverage_records.reduce(
    (sum, r) => sum + r.shift_incidents_count,
    0,
  );

  // Vacancy reasons analysis
  const vacancyReasons: Record<string, number> = {};
  for (const r of shift_coverage_records) {
    if (r.vacancy_reason) {
      vacancyReasons[r.vacancy_reason] = (vacancyReasons[r.vacancy_reason] ?? 0) + 1;
    }
  }

  // --- Ratio compliance metrics ---
  const totalRatioRecords = ratio_compliance_records.length;

  const ratiosMet = ratio_compliance_records.filter((r) => r.ratio_met).length;
  const ratioComplianceRate = pct(ratiosMet, totalRatioRecords);

  const ratioBreaches = ratio_compliance_records.filter((r) => !r.ratio_met).length;

  const totalBreachMinutes = ratio_compliance_records.reduce(
    (sum, r) => sum + r.ratio_breach_duration_minutes,
    0,
  );

  const correctiveActionTaken = ratio_compliance_records.filter(
    (r) => !r.ratio_met && r.corrective_action_taken,
  ).length;
  const correctiveActionRate = pct(correctiveActionTaken, ratioBreaches);

  const seniorOnDuty = ratio_compliance_records.filter((r) => r.senior_staff_on_duty).length;
  const seniorCoverRate = pct(seniorOnDuty, totalRatioRecords);

  const managerNotifiedOfBreaches = ratio_compliance_records.filter(
    (r) => !r.ratio_met && r.manager_notified,
  ).length;
  const breachNotificationRate = pct(managerNotifiedOfBreaches, ratioBreaches);

  // --- Overtime metrics (inverted: lower overtime = better) ---
  const totalOvertimeRecords = overtime_records.length;

  const overtimeApproved = overtime_records.filter((r) => r.overtime_approved).length;
  const overtimeApprovalRate = pct(overtimeApproved, totalOvertimeRecords);

  const restCompliant = overtime_records.filter((r) => r.rest_period_compliant).length;
  const restComplianceRate = pct(restCompliant, totalOvertimeRecords);

  const wtdCompliant = overtime_records.filter(
    (r) => r.working_time_directive_compliant,
  ).length;
  const wtdComplianceRate = pct(wtdCompliant, totalOvertimeRecords);

  const fatigueAcknowledged = overtime_records.filter(
    (r) => r.fatigue_risk_acknowledged,
  ).length;
  const fatigueAcknowledgementRate = pct(fatigueAcknowledged, totalOvertimeRecords);

  // Staff with consecutive days > 6
  const highConsecutiveDays = overtime_records.filter(
    (r) => r.consecutive_days_worked > 6,
  ).length;
  const highConsecutiveRate = pct(highConsecutiveDays, totalOvertimeRecords);

  // Staff exceeding 48 hours weekly
  const excessiveWeeklyHours = overtime_records.filter(
    (r) => r.total_weekly_hours > 48,
  ).length;
  const excessiveHoursRate = pct(excessiveWeeklyHours, totalOvertimeRecords);

  // Overtime rate: percentage of shifts that required overtime (inverted — lower is better)
  const overtimeRate =
    total_staff > 0
      ? pct(totalOvertimeRecords, total_staff)
      : 0;

  // --- Agency usage metrics (inverted: lower agency = better) ---
  const totalAgencyRecords = agency_usage_records.length;

  const totalAgencyHours = agency_usage_records.reduce(
    (sum, r) => sum + r.hours_worked,
    0,
  );

  const agencyInducted = agency_usage_records.filter((r) => r.agency_staff_inducted).length;
  const agencyInductionRate = pct(agencyInducted, totalAgencyRecords);

  const agencyDbsVerified = agency_usage_records.filter((r) => r.dbs_verified).length;
  const agencyDbsRate = pct(agencyDbsVerified, totalAgencyRecords);

  const agencyKnownToHome = agency_usage_records.filter(
    (r) => r.agency_staff_known_to_home,
  ).length;
  const agencyFamiliarityRate = pct(agencyKnownToHome, totalAgencyRecords);

  const childrenBriefedForAgency = agency_usage_records.filter(
    (r) => r.children_briefed,
  ).length;
  const childrenBriefedRate = pct(childrenBriefedForAgency, totalAgencyRecords);

  const agencyFeedbackCollected = agency_usage_records.filter(
    (r) => r.feedback_collected,
  ).length;
  const agencyFeedbackRate = pct(agencyFeedbackCollected, totalAgencyRecords);

  const totalAgencyCost = agency_usage_records.reduce((sum, r) => sum + r.cost, 0);

  // Agency usage rate: proportion of agency shifts among total establishment (inverted — lower is better)
  const agencyUsageRate =
    total_staff > 0
      ? pct(totalAgencyRecords, total_staff)
      : 0;

  // --- Rota planning metrics ---
  const totalRotaRecords = rota_planning_records.length;

  const rotasPublishedOnTime = rota_planning_records.filter(
    (r) => r.days_advance_published >= 7,
  ).length;
  const rotaPublicationRate = pct(rotasPublishedOnTime, totalRotaRecords);

  const allShiftsFilled = rota_planning_records.filter((r) => r.all_shifts_filled).length;
  const rotaFillRate = pct(allShiftsFilled, totalRotaRecords);

  const skillMixAdequate = rota_planning_records.filter(
    (r) => r.skill_mix_adequate,
  ).length;
  const skillMixRate = pct(skillMixAdequate, totalRotaRecords);

  const seniorCoverEveryShift = rota_planning_records.filter(
    (r) => r.senior_cover_every_shift,
  ).length;
  const seniorCoverRotaRate = pct(seniorCoverEveryShift, totalRotaRecords);

  const preferencesConsidered = rota_planning_records.filter(
    (r) => r.staff_preferences_considered,
  ).length;
  const preferencesRate = pct(preferencesConsidered, totalRotaRecords);

  const contingencyInPlace = rota_planning_records.filter(
    (r) => r.contingency_plan_in_place,
  ).length;
  const contingencyRate = pct(contingencyInPlace, totalRotaRecords);

  const rotaApproved = rota_planning_records.filter(
    (r) => r.rota_approved_by_manager,
  ).length;
  const rotaApprovalRate = pct(rotaApproved, totalRotaRecords);

  const staffConsulted = rota_planning_records.filter((r) => r.staff_consulted).length;
  const staffConsultationRate = pct(staffConsulted, totalRotaRecords);

  const fairnessScoreSum = rota_planning_records.reduce(
    (sum, r) => sum + r.fairness_score,
    0,
  );
  // fab-0: null when no rota records to average.
  const avgFairnessScore: number | null =
    totalRotaRecords > 0
      ? Math.round((fairnessScoreSum / totalRotaRecords) * 100) / 100
      : null;

  const totalChangesAfterPub = rota_planning_records.reduce(
    (sum, r) => sum + r.changes_after_publication,
    0,
  );
  // fab-0: null when no rota records to average.
  const avgChangesPerRota: number | null =
    totalRotaRecords > 0
      ? Math.round((totalChangesAfterPub / totalRotaRecords) * 100) / 100
      : null;

  const totalUnfilledShifts = rota_planning_records.reduce(
    (sum, r) => sum + r.unfilled_shifts_count,
    0,
  );

  // Composite rota planning rate: published on time + all filled + skill mix + senior cover + approved
  const rotaPlanningNumerator =
    rotasPublishedOnTime + allShiftsFilled + skillMixAdequate + seniorCoverEveryShift + rotaApproved;
  const rotaPlanningDenominator = totalRotaRecords * 5;
  const rotaPlanningRate = pct(rotaPlanningNumerator, rotaPlanningDenominator);

  // --- Staff satisfaction rate (composite from preferences, consultation, fairness) ---
  const staffSatisfactionNumerator = preferencesConsidered + staffConsulted;
  const staffSatisfactionDenominator = totalRotaRecords * 2;
  const staffSatisfactionRate = pct(staffSatisfactionNumerator, staffSatisfactionDenominator);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: shiftCoverageRate (>=95: +4, >=80: +2) ---
  if (shiftCoverageRate >= 95) score += 4;
  else if (shiftCoverageRate >= 80) score += 2;

  // --- Bonus 2: ratioComplianceRate (>=95: +4, >=80: +2) ---
  if (ratioComplianceRate >= 95) score += 4;
  else if (ratioComplianceRate >= 80) score += 2;

  // --- Bonus 3: rotaPlanningRate (>=90: +4, >=70: +2) ---
  if (rotaPlanningRate >= 90) score += 4;
  else if (rotaPlanningRate >= 70) score += 2;

  // --- Bonus 4: handoverRate (>=95: +3, >=80: +1) ---
  if (handoverRate >= 95) score += 3;
  else if (handoverRate >= 80) score += 1;

  // --- Bonus 5: wtdComplianceRate (>=95: +3, >=80: +1) ---
  if (wtdComplianceRate >= 95) score += 3;
  else if (wtdComplianceRate >= 80) score += 1;

  // --- Bonus 6: agencyInductionRate (>=95: +3, >=75: +1) ---
  if (agencyInductionRate >= 95) score += 3;
  else if (agencyInductionRate >= 75) score += 1;

  // --- Bonus 7: seniorCoverRate (>=90: +3, >=70: +1) ---
  if (seniorCoverRate >= 90) score += 3;
  else if (seniorCoverRate >= 70) score += 1;

  // --- Bonus 8: staffSatisfactionRate (>=90: +2, >=70: +1) ---
  if (staffSatisfactionRate >= 90) score += 2;
  else if (staffSatisfactionRate >= 70) score += 1;

  // --- Bonus 9: contingencyRate (>=90: +2, >=70: +1) ---
  if (contingencyRate >= 90) score += 2;
  else if (contingencyRate >= 70) score += 1;

  // ── Penalties (guarded by array.length > 0) ───────────────────────────

  // Penalty 1: shiftCoverageRate < 60 → -5
  if (shiftCoverageRate < 60 && shift_coverage_records.length > 0) score -= 5;

  // Penalty 2: ratioComplianceRate < 60 → -5
  if (ratioComplianceRate < 60 && ratio_compliance_records.length > 0) score -= 5;

  // Penalty 3: excessiveHoursRate > 30 → -4
  if (excessiveHoursRate > 30 && overtime_records.length > 0) score -= 4;

  // Penalty 4: rotaPlanningRate < 40 → -4
  if (rotaPlanningRate < 40 && rota_planning_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const staffing_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (shiftCoverageRate >= 95 && totalShiftRecords > 0) {
    strengths.push(
      `${shiftCoverageRate}% shift coverage — virtually all shifts are fully staffed, ensuring children are cared for by sufficient staff at all times. This demonstrates excellent workforce planning and management.`,
    );
  } else if (shiftCoverageRate >= 80 && totalShiftRecords > 0) {
    strengths.push(
      `${shiftCoverageRate}% shift coverage — the home maintains good staffing levels across the majority of shifts, with effective cover arrangements in place.`,
    );
  }

  if (ratioComplianceRate >= 95 && totalRatioRecords > 0) {
    strengths.push(
      `${ratioComplianceRate}% ratio compliance — staff-to-child ratios are consistently met, ensuring children receive adequate supervision and individualised attention at all times.`,
    );
  } else if (ratioComplianceRate >= 80 && totalRatioRecords > 0) {
    strengths.push(
      `${ratioComplianceRate}% ratio compliance — the home generally maintains safe staff-to-child ratios across shifts and time periods.`,
    );
  }

  if (handoverRate >= 95 && totalShiftRecords > 0) {
    strengths.push(
      `${handoverRate}% handover completion — shift handovers are consistently completed, ensuring continuity of care and seamless information transfer between staff teams.`,
    );
  } else if (handoverRate >= 80 && totalShiftRecords > 0) {
    strengths.push(
      `${handoverRate}% handover completion — the majority of shift handovers are completed, supporting good continuity of care.`,
    );
  }

  if (rotaPlanningRate >= 90 && totalRotaRecords > 0) {
    strengths.push(
      `${rotaPlanningRate}% rota planning quality — rotas are published on time with adequate skill mix, senior cover, and manager approval. Staff can plan their lives with confidence, reducing turnover risk.`,
    );
  } else if (rotaPlanningRate >= 70 && totalRotaRecords > 0) {
    strengths.push(
      `${rotaPlanningRate}% rota planning quality — the home generally plans rotas effectively with good advance notice and skill mix consideration.`,
    );
  }

  if (wtdComplianceRate >= 95 && totalOvertimeRecords > 0) {
    strengths.push(
      `${wtdComplianceRate}% Working Time Directive compliance — staff are consistently working within legal limits, protecting their wellbeing and ensuring they are not fatigued when caring for children.`,
    );
  } else if (wtdComplianceRate >= 80 && totalOvertimeRecords > 0) {
    strengths.push(
      `${wtdComplianceRate}% Working Time Directive compliance — the home generally manages staff hours within legal requirements.`,
    );
  }

  if (restComplianceRate >= 95 && totalOvertimeRecords > 0) {
    strengths.push(
      `${restComplianceRate}% rest period compliance — staff consistently receive adequate rest between shifts, reducing fatigue risk and maintaining care quality.`,
    );
  } else if (restComplianceRate >= 80 && totalOvertimeRecords > 0) {
    strengths.push(
      `${restComplianceRate}% rest period compliance — rest periods are generally maintained between shifts.`,
    );
  }

  if (agencyInductionRate >= 95 && totalAgencyRecords > 0) {
    strengths.push(
      `${agencyInductionRate}% agency staff induction rate — all agency workers are fully inducted before working with children, ensuring they understand the home's policies, procedures, and individual children's needs.`,
    );
  } else if (agencyInductionRate >= 75 && totalAgencyRecords > 0) {
    strengths.push(
      `${agencyInductionRate}% agency staff induction rate — most agency staff receive appropriate induction before working with children.`,
    );
  }

  if (agencyDbsRate >= 95 && totalAgencyRecords > 0) {
    strengths.push(
      `${agencyDbsRate}% agency DBS verification — the home consistently verifies enhanced DBS checks for all agency staff before they have contact with children.`,
    );
  }

  if (seniorCoverRate >= 90 && totalRatioRecords > 0) {
    strengths.push(
      `${seniorCoverRate}% senior staff presence on shift — experienced staff are consistently available to provide leadership, oversight, and support during shifts.`,
    );
  } else if (seniorCoverRate >= 70 && totalRatioRecords > 0) {
    strengths.push(
      `${seniorCoverRate}% senior staff presence — the home generally ensures senior or experienced staff are available across shifts.`,
    );
  }

  if (staffSatisfactionRate >= 90 && totalRotaRecords > 0) {
    strengths.push(
      `${staffSatisfactionRate}% staff satisfaction indicators — staff preferences are considered and staff are consulted about rota planning, promoting workforce wellbeing, retention, and engagement.`,
    );
  } else if (staffSatisfactionRate >= 70 && totalRotaRecords > 0) {
    strengths.push(
      `${staffSatisfactionRate}% staff satisfaction indicators — the home generally considers staff preferences and consults on rota arrangements.`,
    );
  }

  if (contingencyRate >= 90 && totalRotaRecords > 0) {
    strengths.push(
      `${contingencyRate}% contingency planning in rotas — the home proactively plans for staffing emergencies, ensuring children's care is not compromised by unplanned absences.`,
    );
  } else if (contingencyRate >= 70 && totalRotaRecords > 0) {
    strengths.push(
      `${contingencyRate}% contingency planning — most rota periods have contingency arrangements in place for unexpected staffing shortfalls.`,
    );
  }

  if (coverArrangementRate >= 90 && uncoveredShifts > 0) {
    strengths.push(
      `${coverArrangementRate}% of uncovered shifts had alternative cover arranged — the home is effective at responding to staffing gaps and maintaining safe staffing levels.`,
    );
  }

  if (overtimeApprovalRate >= 95 && totalOvertimeRecords > 0) {
    strengths.push(
      `${overtimeApprovalRate}% overtime approval rate — all overtime is properly authorised, demonstrating good governance and management oversight of additional working hours.`,
    );
  }

  if (agencyFamiliarityRate >= 80 && totalAgencyRecords > 0) {
    strengths.push(
      `${agencyFamiliarityRate}% of agency staff are known to the home — using familiar agency workers provides children with greater consistency and reduces the disruption of unfamiliar adults entering their living space.`,
    );
  }

  if (childrenBriefedRate >= 90 && totalAgencyRecords > 0) {
    strengths.push(
      `${childrenBriefedRate}% of agency placements had children briefed — children are consistently informed when agency staff will be working, respecting their right to know who is in their home.`,
    );
  }

  if (totalRotaRecords > 0 && avgFairnessScore !== null && avgFairnessScore >= 4.0) {
    strengths.push(
      `Average fairness score of ${avgFairnessScore}/5 — unsocial hours and demanding shifts are distributed equitably among staff, promoting workforce morale and reducing burnout risk.`,
    );
  }

  if (skillMixRate >= 90 && totalRotaRecords > 0) {
    strengths.push(
      `${skillMixRate}% of rotas have adequate skill mix — the home ensures each shift has the right combination of skills, experience, and qualifications to meet children's assessed needs.`,
    );
  }

  if (rotaPublicationRate >= 90 && totalRotaRecords > 0) {
    strengths.push(
      `${rotaPublicationRate}% of rotas published at least 7 days in advance — staff have adequate notice to plan their personal lives, contributing to work-life balance and staff retention.`,
    );
  }

  if (totalShiftRecords > 0 && avgHandoverQuality !== null && avgHandoverQuality >= 4.0) {
    strengths.push(
      `Average handover quality rating of ${avgHandoverQuality}/5 — shift handovers are thorough and effective, ensuring incoming staff have the information they need to provide consistent, safe care.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (shiftCoverageRate < 60 && totalShiftRecords > 0) {
    concerns.push(
      `Only ${shiftCoverageRate}% shift coverage — a significant proportion of shifts are not fully staffed. This places children at risk of inadequate supervision and reduces the quality of individualised care they receive.`,
    );
  } else if (shiftCoverageRate < 80 && shiftCoverageRate >= 60 && totalShiftRecords > 0) {
    concerns.push(
      `Shift coverage at ${shiftCoverageRate}% — some shifts are not fully staffed, potentially compromising the home's ability to meet children's assessed needs and maintain safe ratios.`,
    );
  }

  if (ratioComplianceRate < 60 && totalRatioRecords > 0) {
    concerns.push(
      `Only ${ratioComplianceRate}% ratio compliance — staff-to-child ratios are frequently breached. Children are not receiving the level of supervision and attention required by their assessed needs and the home's statement of purpose.`,
    );
  } else if (ratioComplianceRate < 80 && ratioComplianceRate >= 60 && totalRatioRecords > 0) {
    concerns.push(
      `Ratio compliance at ${ratioComplianceRate}% — staff-to-child ratios are not consistently maintained across all time periods, creating periods where children may not receive adequate attention.`,
    );
  }

  if (excessiveHoursRate > 30 && totalOvertimeRecords > 0) {
    concerns.push(
      `${excessiveHoursRate}% of overtime records show staff exceeding 48 hours per week — excessive working hours increase fatigue risk, impair professional judgement, and compromise the quality of care provided to children.`,
    );
  } else if (excessiveHoursRate > 15 && excessiveHoursRate <= 30 && totalOvertimeRecords > 0) {
    concerns.push(
      `${excessiveHoursRate}% of overtime records show weekly hours exceeding 48 — some staff are working beyond recommended limits, which may impact their ability to provide consistent, high-quality care.`,
    );
  }

  if (highConsecutiveRate > 30 && totalOvertimeRecords > 0) {
    concerns.push(
      `${highConsecutiveRate}% of overtime records show staff working more than 6 consecutive days — extended work periods without adequate rest compromise staff wellbeing and the quality of care children receive.`,
    );
  } else if (highConsecutiveRate > 15 && highConsecutiveRate <= 30 && totalOvertimeRecords > 0) {
    concerns.push(
      `${highConsecutiveRate}% of overtime records show more than 6 consecutive days worked — some staff are not receiving adequate rest periods between working stretches.`,
    );
  }

  if (rotaPlanningRate < 40 && totalRotaRecords > 0) {
    concerns.push(
      `Rota planning quality at only ${rotaPlanningRate}% — rotas are not published on time, shifts are left unfilled, skill mix is inadequate, and manager oversight is insufficient. This undermines workforce stability and children's experience of consistent care.`,
    );
  } else if (rotaPlanningRate < 70 && rotaPlanningRate >= 40 && totalRotaRecords > 0) {
    concerns.push(
      `Rota planning quality at ${rotaPlanningRate}% — there are gaps in rota management including issues with publication timing, shift filling, skill mix, or managerial approval.`,
    );
  }

  if (handoverRate < 60 && totalShiftRecords > 0) {
    concerns.push(
      `Only ${handoverRate}% handover completion — incomplete handovers risk critical information being lost between shifts, potentially compromising children's safety and care continuity.`,
    );
  } else if (handoverRate < 80 && handoverRate >= 60 && totalShiftRecords > 0) {
    concerns.push(
      `Handover completion at ${handoverRate}% — some shift handovers are not completed, creating risks to continuity of care and information transfer.`,
    );
  }

  if (restComplianceRate < 60 && totalOvertimeRecords > 0) {
    concerns.push(
      `Only ${restComplianceRate}% rest period compliance — staff are frequently not receiving adequate rest between shifts. Fatigued staff pose a risk to children's safety and their own wellbeing.`,
    );
  } else if (restComplianceRate < 80 && restComplianceRate >= 60 && totalOvertimeRecords > 0) {
    concerns.push(
      `Rest period compliance at ${restComplianceRate}% — some staff are not receiving sufficient rest between shifts, which may impact their alertness and care quality.`,
    );
  }

  if (agencyInductionRate < 60 && totalAgencyRecords > 0) {
    concerns.push(
      `Only ${agencyInductionRate}% agency staff induction rate — agency workers are entering the home without proper induction, meaning they may not understand children's individual needs, behaviour plans, or the home's safeguarding procedures.`,
    );
  } else if (agencyInductionRate < 75 && agencyInductionRate >= 60 && totalAgencyRecords > 0) {
    concerns.push(
      `Agency induction rate at ${agencyInductionRate}% — not all agency staff receive adequate induction before working with children.`,
    );
  }

  if (agencyDbsRate < 80 && totalAgencyRecords > 0) {
    concerns.push(
      `Only ${agencyDbsRate}% agency DBS verification — some agency staff are working with children without verified enhanced DBS checks. This is a serious safeguarding concern under Reg 32.`,
    );
  }

  if (seniorCoverRate < 50 && totalRatioRecords > 0) {
    concerns.push(
      `Only ${seniorCoverRate}% senior staff presence on shift — many shifts lack experienced leadership, leaving less experienced staff without adequate support and guidance.`,
    );
  } else if (seniorCoverRate < 70 && seniorCoverRate >= 50 && totalRatioRecords > 0) {
    concerns.push(
      `Senior staff presence at ${seniorCoverRate}% — some shifts lack senior cover, which may reduce the quality of decision-making and staff support.`,
    );
  }

  if (loneWorkingRate > 20 && totalShiftRecords > 0) {
    concerns.push(
      `Lone working occurring on ${loneWorkingRate}% of shifts — frequent lone working increases risk to both staff and children and may indicate systemic staffing shortfalls.`,
    );
  }

  if (loneWorkingAssessmentRate < 80 && loneWorkingShifts > 0) {
    concerns.push(
      `Only ${loneWorkingAssessmentRate}% of lone working instances risk assessed — when lone working occurs, it must be formally risk assessed to protect both staff and children.`,
    );
  }

  if (staffSatisfactionRate < 50 && totalRotaRecords > 0) {
    concerns.push(
      `Staff satisfaction indicators at only ${staffSatisfactionRate}% — staff preferences are not being considered and staff are not consulted about rota arrangements, which may contribute to low morale, disengagement, and higher turnover.`,
    );
  } else if (staffSatisfactionRate < 70 && staffSatisfactionRate >= 50 && totalRotaRecords > 0) {
    concerns.push(
      `Staff satisfaction indicators at ${staffSatisfactionRate}% — rota arrangements do not consistently consider staff preferences or consultation.`,
    );
  }

  if (childrenBriefedRate < 60 && totalAgencyRecords > 0) {
    concerns.push(
      `Only ${childrenBriefedRate}% of agency placements had children briefed — children have a right to know who is working in their home. Not informing them undermines their sense of security and control.`,
    );
  }

  if (totalShiftRecords === 0 && total_staff > 0 && !allEmpty) {
    concerns.push(
      "No shift coverage records exist despite staff being on the establishment — the home cannot evidence that shifts are adequately staffed or that coverage gaps are managed.",
    );
  }

  if (totalRatioRecords === 0 && total_staff > 0 && !allEmpty) {
    concerns.push(
      "No ratio compliance records exist — the home cannot evidence that staff-to-child ratios are monitored or maintained at safe levels.",
    );
  }

  if (totalRotaRecords === 0 && total_staff > 0 && !allEmpty) {
    concerns.push(
      "No rota planning records exist — the home cannot evidence structured workforce planning, skill-mix management, or equitable shift distribution.",
    );
  }

  if (totalRotaRecords > 0 && avgFairnessScore !== null && avgFairnessScore < 2.5) {
    concerns.push(
      `Average fairness score at only ${avgFairnessScore}/5 — unsocial hours and demanding shifts are not distributed equitably, which may cause resentment, staff turnover, and workforce instability.`,
    );
  }

  if (totalRotaRecords > 0 && avgChangesPerRota !== null && avgChangesPerRota > 5) {
    concerns.push(
      `Average of ${avgChangesPerRota} changes per published rota — excessive post-publication changes undermine staff confidence in the rota, create uncertainty, and may indicate poor planning.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: StaffRotaRecommendation[] = [];
  let rank = 0;

  if (shiftCoverageRate < 60 && totalShiftRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review staffing establishment and recruitment strategy — when less than 60% of shifts are fully covered, children's safety and the quality of their daily experience are directly compromised. Explore recruitment drives, retention incentives, and partnership with reliable agencies.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (ratioComplianceRate < 60 && totalRatioRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement immediate measures to maintain safe staff-to-child ratios at all times — ratio breaches must be treated as safeguarding concerns. Review minimum staffing levels in the Statement of Purpose and ensure they are met on every shift.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (excessiveHoursRate > 30 && totalOvertimeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address excessive working hours immediately — staff working beyond 48 hours per week are at heightened risk of fatigue, burnout, and making errors. Review overtime management, cap excessive hours, and ensure adequate staffing levels without reliance on overtime.",
      urgency: "immediate",
      regulatory_ref: "Working Time Regulations 1998 / CHR 2015 Reg 32",
    });
  }

  if (rotaPlanningRate < 40 && totalRotaRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul rota planning processes — rotas must be published at least 7 days in advance with all shifts filled, adequate skill mix, senior cover, and manager approval. Poor rota management directly affects staff morale, retention, and the consistency of care children receive.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (agencyDbsRate < 80 && totalAgencyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately ensure all agency staff have verified enhanced DBS checks before any contact with children — this is a non-negotiable safeguarding requirement. No agency worker should enter the home without confirmed DBS status.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32 — Fitness of workers",
    });
  }

  if (handoverRate < 60 && totalShiftRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Mandate completion of shift handovers with standardised handover documentation — without effective handovers, incoming staff lack critical information about children's needs, incidents, and ongoing concerns.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (restComplianceRate < 60 && totalOvertimeRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all staff receive adequate rest periods between shifts — fatigued staff pose a risk to children's safety. Review shift patterns, reduce overtime dependency, and implement rest period monitoring.",
      urgency: "immediate",
      regulatory_ref: "Working Time Regulations 1998 / CHR 2015 Reg 32",
    });
  }

  if (agencyInductionRate < 60 && totalAgencyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all agency staff complete a full induction before working with children — induction must cover safeguarding procedures, individual children's needs, behaviour plans, and emergency protocols.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32 — Fitness of workers",
    });
  }

  if (totalShiftRecords === 0 && total_staff > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement immediate recording of shift coverage data — without shift records, the home cannot evidence adequate staffing or demonstrate that shifts are properly managed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (totalRatioRecords === 0 && total_staff > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commence systematic monitoring of staff-to-child ratios across all time periods — ratio compliance is a fundamental requirement for children's safety and quality of care.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (totalRotaRecords === 0 && total_staff > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish structured rota planning with advance publication, skill-mix assessment, and contingency arrangements — effective workforce planning is essential for consistent staffing.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (seniorCoverRate < 50 && totalRatioRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure senior or experienced staff are present on every shift — less experienced staff require on-site leadership and guidance, particularly during complex situations and emergencies.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (loneWorkingRate > 20 && totalShiftRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and reduce the frequency of lone working — children's homes should not routinely rely on lone working. Assess root causes and increase staffing to eliminate unsafe lone working practices.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (childrenBriefedRate < 60 && totalAgencyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children are always informed when agency staff will be working in their home — this respects children's right to feel safe and in control of their living environment.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    shiftCoverageRate >= 60 &&
    shiftCoverageRate < 80 &&
    totalShiftRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve shift coverage above 80% — review recruitment, retention, and cover arrangements to reduce the frequency of under-staffed shifts.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (
    ratioComplianceRate >= 60 &&
    ratioComplianceRate < 80 &&
    totalRatioRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve ratio compliance above 80% — review minimum staffing levels and ensure they match children's assessed needs across all time periods.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (
    rotaPlanningRate >= 40 &&
    rotaPlanningRate < 70 &&
    totalRotaRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance rota planning quality — ensure rotas are published with adequate notice, all shifts are filled, skill mix is assessed, and contingency plans are in place.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (
    handoverRate >= 60 &&
    handoverRate < 80 &&
    totalShiftRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve handover completion above 80% — review handover processes and ensure protected time is allocated for thorough information exchange between shifts.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (
    staffSatisfactionRate >= 50 &&
    staffSatisfactionRate < 70 &&
    totalRotaRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve staff satisfaction with rota arrangements — increase consultation, consider preferences where operationally possible, and ensure fairness in shift distribution to support retention and morale.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (
    agencyInductionRate >= 60 &&
    agencyInductionRate < 75 &&
    totalAgencyRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve agency induction completion above 75% — review the induction process to ensure it is practical, comprehensive, and completed before agency staff commence work.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 32 — Fitness of workers",
    });
  }

  if (agencyFeedbackRate < 70 && totalAgencyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Collect feedback after every agency placement — systematic feedback enables the home to identify unsuitable agency staff, reward good performance, and build a pool of trusted, familiar agency workers.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 32 — Fitness of workers",
    });
  }

  if (contingencyRate < 70 && totalRotaRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure contingency plans are in place for every rota period — document arrangements for managing sickness, emergencies, and unplanned absences to maintain safe staffing at all times.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 16 — Workforce",
    });
  }

  if (totalRotaRecords > 0 && avgFairnessScore !== null && avgFairnessScore < 3.0 && avgFairnessScore >= 2.0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review the fairness of shift distribution — ensure unsocial hours, weekends, and demanding shifts are shared equitably to prevent staff burnout and promote a fair workplace culture.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (totalRotaRecords > 0 && avgChangesPerRota !== null && avgChangesPerRota > 5) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reduce post-publication rota changes — frequent changes undermine staff confidence and work-life balance. Review planning processes to improve rota stability.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: StaffRotaInsight[] = [];

  // -- Critical insights --

  if (shiftCoverageRate < 60 && totalShiftRecords > 0) {
    insights.push({
      text: `Only ${shiftCoverageRate}% shift coverage. Ofsted expects children's homes to be adequately staffed at all times. When shifts are frequently under-staffed, children's supervision, individualised care, and engagement in activities are all compromised. This is a fundamental Reg 16 concern.`,
      severity: "critical",
    });
  }

  if (ratioComplianceRate < 60 && totalRatioRecords > 0) {
    insights.push({
      text: `Only ${ratioComplianceRate}% ratio compliance. Persistent ratio breaches mean children are not receiving the level of adult attention and supervision required by their assessed needs. In a Reg 44 or Reg 45 inspection, this would be identified as a significant shortfall in Reg 16 compliance.`,
      severity: "critical",
    });
  }

  if (excessiveHoursRate > 30 && totalOvertimeRecords > 0) {
    insights.push({
      text: `${excessiveHoursRate}% of overtime records show staff exceeding 48 weekly hours. Chronic overwork leads to fatigue, reduced attentiveness, impaired decision-making, and increased risk of incidents. The Working Time Regulations exist to protect both staff and the children they care for.`,
      severity: "critical",
    });
  }

  if (rotaPlanningRate < 40 && totalRotaRecords > 0) {
    insights.push({
      text: `Rota planning quality at only ${rotaPlanningRate}%. Poor rota management is frequently a root cause of staffing shortfalls. When rotas are not published on time, shifts remain unfilled, skill mix is not considered, and managers do not approve the final plan — the entire staffing infrastructure is compromised.`,
      severity: "critical",
    });
  }

  if (agencyDbsRate < 80 && totalAgencyRecords > 0) {
    insights.push({
      text: `Only ${agencyDbsRate}% agency DBS verification. Allowing agency staff to work with looked-after children without verified enhanced DBS checks is a serious safeguarding failure. Reg 32 requires that all workers are fit to work with children — unverified DBS status is unacceptable.`,
      severity: "critical",
    });
  }

  if (totalShiftRecords === 0 && total_staff > 0 && !allEmpty) {
    insights.push({
      text: "No shift coverage records exist despite staff being on the establishment. Without shift data, the home cannot demonstrate to Ofsted or the responsible individual that staffing levels are adequate, or that gaps are managed proactively. This is a fundamental evidence gap.",
      severity: "critical",
    });
  }

  if (totalRatioRecords === 0 && total_staff > 0 && !allEmpty) {
    insights.push({
      text: "No ratio compliance records exist. Staff-to-child ratios are a core safety measure. Without systematic monitoring, the home cannot evidence that children receive adequate supervision, and any ratio breach goes unrecorded and unmanaged.",
      severity: "critical",
    });
  }

  if (highConsecutiveRate > 30 && totalOvertimeRecords > 0) {
    insights.push({
      text: `${highConsecutiveRate}% of overtime records show staff working more than 6 consecutive days. Extended work periods without breaks contribute to staff burnout, increase sick leave, and undermine the quality of therapeutic care. This pattern often indicates chronic understaffing.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    shiftCoverageRate >= 60 &&
    shiftCoverageRate < 80 &&
    totalShiftRecords > 0
  ) {
    insights.push({
      text: `Shift coverage at ${shiftCoverageRate}% — improving but not yet at the level required for consistent care quality. Some shifts remain under-staffed, which may affect the home's ability to deliver individualised care and planned activities.`,
      severity: "warning",
    });
  }

  if (
    ratioComplianceRate >= 60 &&
    ratioComplianceRate < 80 &&
    totalRatioRecords > 0
  ) {
    insights.push({
      text: `Ratio compliance at ${ratioComplianceRate}% — some time periods experience ratio breaches. Review whether specific shifts (e.g. evenings, weekends, nights) are consistently under-staffed and adjust planning accordingly.`,
      severity: "warning",
    });
  }

  if (
    rotaPlanningRate >= 40 &&
    rotaPlanningRate < 70 &&
    totalRotaRecords > 0
  ) {
    insights.push({
      text: `Rota planning quality at ${rotaPlanningRate}% — there are gaps in the planning process. Effective rota management requires advance publication, skill-mix assessment, senior cover, and manager approval as minimum standards.`,
      severity: "warning",
    });
  }

  if (
    handoverRate >= 60 &&
    handoverRate < 80 &&
    totalShiftRecords > 0
  ) {
    insights.push({
      text: `Handover completion at ${handoverRate}% — some handovers are missed. Incomplete handovers are a recognised risk factor for information loss, which can lead to missed medication, unmanaged risks, or inconsistent care delivery.`,
      severity: "warning",
    });
  }

  if (
    restComplianceRate >= 60 &&
    restComplianceRate < 80 &&
    totalOvertimeRecords > 0
  ) {
    insights.push({
      text: `Rest period compliance at ${restComplianceRate}% — some staff are not receiving adequate rest between shifts. Consider whether shift patterns, overtime expectations, or staffing shortfalls are preventing proper rest.`,
      severity: "warning",
    });
  }

  if (
    seniorCoverRate >= 50 &&
    seniorCoverRate < 70 &&
    totalRatioRecords > 0
  ) {
    insights.push({
      text: `Senior staff presence at ${seniorCoverRate}% — some shifts lack experienced leadership. This may result in less experienced staff making unsupported decisions during complex or high-risk situations.`,
      severity: "warning",
    });
  }

  if (
    staffSatisfactionRate >= 50 &&
    staffSatisfactionRate < 70 &&
    totalRotaRecords > 0
  ) {
    insights.push({
      text: `Staff satisfaction indicators at ${staffSatisfactionRate}% — rota arrangements do not consistently consider staff preferences or involve consultation. Poor work-life balance is a leading cause of staff turnover in children's homes.`,
      severity: "warning",
    });
  }

  if (loneWorkingRate > 10 && loneWorkingRate <= 20 && totalShiftRecords > 0) {
    insights.push({
      text: `Lone working occurring on ${loneWorkingRate}% of shifts — while occasional lone working may be unavoidable, the frequency should be minimised. Each instance requires a risk assessment and clear escalation procedures.`,
      severity: "warning",
    });
  }

  if (
    agencyInductionRate >= 60 &&
    agencyInductionRate < 75 &&
    totalAgencyRecords > 0
  ) {
    insights.push({
      text: `Agency induction rate at ${agencyInductionRate}% — some agency staff are working without full induction. Even experienced agency workers need home-specific induction covering individual children's needs and the home's protocols.`,
      severity: "warning",
    });
  }

  if (agencyFeedbackRate < 70 && agencyFeedbackRate > 0 && totalAgencyRecords > 0) {
    insights.push({
      text: `Agency feedback collection at only ${agencyFeedbackRate}% — without systematic feedback, the home cannot build a reliable pool of trusted agency workers or identify those who are unsuitable.`,
      severity: "warning",
    });
  }

  if (
    totalRotaRecords > 0 &&
    avgFairnessScore !== null &&
    avgFairnessScore >= 2.5 &&
    avgFairnessScore < 3.5
  ) {
    insights.push({
      text: `Average fairness score at ${avgFairnessScore}/5 — the distribution of unsocial hours and demanding shifts is perceived as uneven. Inequitable rota distribution erodes team cohesion and contributes to staff dissatisfaction.`,
      severity: "warning",
    });
  }

  if (totalRotaRecords > 0 && avgChangesPerRota !== null && avgChangesPerRota > 3 && avgChangesPerRota <= 5) {
    insights.push({
      text: `Average of ${avgChangesPerRota} post-publication rota changes — while some flexibility is necessary, frequent changes suggest planning gaps. Consider whether earlier identification of absences or better contingency planning could reduce changes.`,
      severity: "warning",
    });
  }

  // Vacancy reason analysis
  const topVacancyReasons = Object.entries(vacancyReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topVacancyReasons.length > 0) {
    const formatted = topVacancyReasons
      .map(([reason, count]) => `${reason.replace(/_/g, " ")} (${count})`)
      .join(", ");
    insights.push({
      text: `Top vacancy reasons: ${formatted}. Understanding the root causes of shift vacancies enables targeted workforce strategies — persistent sickness may indicate wellbeing issues, while vacancy-driven gaps point to recruitment needs.`,
      severity: "warning",
    });
  }

  // Agency usage pattern analysis
  if (totalAgencyRecords > 0 && total_staff > 0) {
    const agencyProportion = pct(totalAgencyRecords, totalAgencyRecords + totalShiftRecords);
    if (agencyProportion > 30) {
      insights.push({
        text: `Agency usage represents ${agencyProportion}% of recorded staffing activity — high agency dependency undermines children's experience of consistent, relational care. Children need to build trusted relationships with familiar staff, not adjust to a rotating cast of agency workers.`,
        severity: "warning",
      });
    }
  }

  // Total agency cost insight — gated on totalAgencyCost>0 which requires records.
  if (totalAgencyCost > 0 && totalAgencyRecords > 0) {
    const avgCostPerShift = Math.round(totalAgencyCost / totalAgencyRecords);
    insights.push({
      text: `Total agency spend of £${totalAgencyCost.toLocaleString()} across ${totalAgencyRecords} placements (avg £${avgCostPerShift}/shift). Reducing agency reliance through improved recruitment and retention would redirect resources to benefit children's direct care experience.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (staffing_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding staffing adequacy — shifts are consistently fully covered, ratios are maintained, overtime is well managed, agency use is minimised, and rota planning is proactive and inclusive. This is strong evidence for Reg 16 and Reg 32 compliance and effective leadership.",
      severity: "positive",
    });
  }

  if (
    shiftCoverageRate >= 95 &&
    ratioComplianceRate >= 95 &&
    totalShiftRecords > 0 &&
    totalRatioRecords > 0
  ) {
    insights.push({
      text: `${shiftCoverageRate}% shift coverage with ${ratioComplianceRate}% ratio compliance — the home maintains excellent staffing levels with safe ratios consistently met. Children benefit from adequate supervision and individualised attention at all times.`,
      severity: "positive",
    });
  }

  if (
    totalShiftRecords > 0 &&
    avgHandoverQuality !== null &&
    handoverRate >= 95 &&
    avgHandoverQuality >= 4.0
  ) {
    insights.push({
      text: `${handoverRate}% handover completion with average quality of ${avgHandoverQuality}/5 — shift handovers are consistently thorough and effective, ensuring seamless continuity of care and information transfer.`,
      severity: "positive",
    });
  }

  if (
    rotaPlanningRate >= 90 &&
    totalRotaRecords > 0
  ) {
    insights.push({
      text: `${rotaPlanningRate}% rota planning quality — rotas are published on time with adequate skill mix, senior cover, contingency plans, and managerial oversight. This reflects proactive, well-organised workforce management.`,
      severity: "positive",
    });
  }

  if (
    wtdComplianceRate >= 95 &&
    restComplianceRate >= 95 &&
    totalOvertimeRecords > 0
  ) {
    insights.push({
      text: `${wtdComplianceRate}% WTD compliance with ${restComplianceRate}% rest compliance — the home effectively manages working hours and rest periods, protecting staff from fatigue and maintaining care quality.`,
      severity: "positive",
    });
  }

  if (
    totalRotaRecords > 0 &&
    avgFairnessScore !== null &&
    staffSatisfactionRate >= 90 &&
    avgFairnessScore >= 4.0
  ) {
    insights.push({
      text: `${staffSatisfactionRate}% staff satisfaction with fairness score of ${avgFairnessScore}/5 — staff feel consulted, their preferences are considered, and shifts are distributed equitably. This promotes workforce stability and staff retention.`,
      severity: "positive",
    });
  }

  if (
    agencyInductionRate >= 95 &&
    agencyDbsRate >= 95 &&
    totalAgencyRecords > 0
  ) {
    insights.push({
      text: `${agencyInductionRate}% agency induction with ${agencyDbsRate}% DBS verification — the home maintains rigorous vetting and induction standards for agency staff, ensuring they are fit and prepared to work with children.`,
      severity: "positive",
    });
  }

  if (
    seniorCoverRate >= 90 &&
    totalRatioRecords > 0
  ) {
    insights.push({
      text: `${seniorCoverRate}% senior staff presence across shifts — experienced leadership is consistently available to guide practice, support less experienced staff, and make informed decisions during complex situations.`,
      severity: "positive",
    });
  }

  if (
    contingencyRate >= 90 &&
    totalRotaRecords > 0
  ) {
    insights.push({
      text: `${contingencyRate}% contingency planning — the home proactively prepares for staffing emergencies, demonstrating organisational resilience and commitment to maintaining safe staffing under all circumstances.`,
      severity: "positive",
    });
  }

  if (
    overtimeApprovalRate >= 95 &&
    totalOvertimeRecords > 0
  ) {
    insights.push({
      text: `${overtimeApprovalRate}% overtime approval rate — all additional working hours are properly authorised, demonstrating good governance and management oversight of workforce deployment.`,
      severity: "positive",
    });
  }

  if (
    coverArrangementRate >= 90 &&
    uncoveredShifts > 0
  ) {
    insights.push({
      text: `${coverArrangementRate}% of coverage gaps had alternative arrangements made — the home responds effectively to staffing shortfalls, demonstrating resilience and commitment to maintaining safe staffing levels for children.`,
      severity: "positive",
    });
  }

  if (
    childrenBriefedRate >= 90 &&
    totalAgencyRecords > 0
  ) {
    insights.push({
      text: `${childrenBriefedRate}% of agency placements had children informed — the home consistently respects children's right to know who is working in their home, supporting their sense of security and control.`,
      severity: "positive",
    });
  }

  if (
    skillMixRate >= 90 &&
    totalRotaRecords > 0
  ) {
    insights.push({
      text: `${skillMixRate}% skill mix adequacy — each shift is planned with the right combination of skills, experience, and qualifications to meet children's diverse and complex needs.`,
      severity: "positive",
    });
  }

  if (
    agencyFamiliarityRate >= 80 &&
    totalAgencyRecords > 0
  ) {
    insights.push({
      text: `${agencyFamiliarityRate}% of agency staff are known to the home — children benefit from the consistency of familiar agency workers who understand the home's routines and individual children's needs.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (staffing_rating === "outstanding") {
    headline =
      "Outstanding staffing adequacy — shifts are consistently covered, ratios maintained, overtime well managed, and rota planning is proactive with good staff engagement.";
  } else if (staffing_rating === "good") {
    headline = `Good staffing adequacy — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (staffing_rating === "adequate") {
    headline = `Adequate staffing — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure consistent, safe staffing levels.`;
  } else {
    headline = `Staffing adequacy is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children are cared for by sufficient, suitable staff.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    staffing_rating,
    staffing_score: score,
    headline,
    total_shift_records: totalShiftRecords,
    total_ratio_records: totalRatioRecords,
    total_overtime_records: totalOvertimeRecords,
    total_agency_records: totalAgencyRecords,
    total_rota_records: totalRotaRecords,
    shift_coverage_rate: shiftCoverageRate,
    ratio_compliance_rate: ratioComplianceRate,
    overtime_rate: overtimeRate,
    agency_usage_rate: agencyUsageRate,
    rota_planning_rate: rotaPlanningRate,
    staff_satisfaction_rate: staffSatisfactionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
