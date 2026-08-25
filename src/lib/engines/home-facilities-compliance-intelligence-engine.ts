// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME FACILITIES COMPLIANCE INTELLIGENCE ENGINE
// Pure deterministic engine: fire equipment checks, water hygiene, window
// restrictor compliance, and pest control management.
// CHR 2015 Reg 25: Premises. Health & Safety at Work Act. Fire Safety Order 2005.
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface FireCheckInput {
  id: string;
  last_inspected_date: string;
  next_inspection_due: string;
  result: string;                // pass | fail | needs_attention | out_of_service
  compliance_status: string;     // compliant | non_compliant | requires_action | expired
  defect_noted_present: boolean;
}

export interface WaterHygieneInput {
  id: string;
  date: string;
  compliance: string;            // compliant | non_compliant | borderline | not_applicable
  action_required_present: boolean;
  action_completed: boolean;
  next_due_date: string;
}

export interface WindowCheckInput {
  id: string;
  inspection_date: string;
  restrictor_present: boolean;
  restrictor_working: boolean;
  opening_compliance: boolean;
  outcome: string;               // pass | fail | advisory | urgent_action
  next_due_date: string;
  floor_above_ground: boolean;
}

export interface PestControlInput {
  id: string;
  record_date: string;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  child_safety_measures_count: number;
  flags_count: number;
}

export interface HomeFacilitiesComplianceInput {
  today: string;
  fire_checks: FireCheckInput[];
  water_hygiene_records: WaterHygieneInput[];
  window_checks: WindowCheckInput[];
  pest_records: PestControlInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type FacilitiesRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface FireProfile {
  total_checks: number;
  /** null when the population is empty — nothing measured, not 0%. */
  pass_rate: number | null;
  overdue_inspections: number;
  /** null when the population is empty — nothing measured, not 0%. */
  compliant_rate: number | null;
}

export interface WaterProfile {
  total_checks: number;
  /** null when the population is empty — nothing measured, not 0%. */
  compliance_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  action_completion_rate: number | null;
  overdue_checks: number;
}

export interface WindowProfile {
  total_checks: number;
  /** null when the population is empty — nothing measured, not 0%. */
  restrictor_compliance_rate: number | null;
  overdue_checks: number;
  above_ground_count: number;
}

export interface PestProfile {
  total_records: number;
  /** null when the population is empty — nothing measured, not 0%. */
  follow_up_completion_rate: number | null;
  flags_total: number;
}

export interface Insight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface Recommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeFacilitiesComplianceResult {
  facilities_rating: FacilitiesRating;
  facilities_score: number;
  headline: string;
  fire: FireProfile;
  water: WaterProfile;
  windows: WindowProfile;
  pest: PestProfile;
  strengths: string[];
  concerns: string[];
  recommendations: Recommendation[];
  insights: Insight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function ratingFromScore(score: number): FacilitiesRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Headlines ───────────────────────────────────────────────────────────────

const HEADLINES: Record<FacilitiesRating, string> = {
  outstanding:
    "Exemplary facilities compliance — fire, water, window and environmental standards all exceeded.",
  good:
    "Strong facilities management — most compliance requirements met.",
  adequate:
    "Facilities compliance meets minimum standards but needs attention.",
  inadequate:
    "Critical facilities compliance failures — urgent remediation required.",
  insufficient_data:
    "No facilities compliance data available for analysis.",
};

// ── Empty profiles ──────────────────────────────────────────────────────────

function emptyFire(): FireProfile {
  return { total_checks: 0, pass_rate: null, overdue_inspections: 0, compliant_rate: null };
}

function emptyWater(): WaterProfile {
  return { total_checks: 0, compliance_rate: null, action_completion_rate: null, overdue_checks: 0 };
}

function emptyWindows(): WindowProfile {
  return { total_checks: 0, restrictor_compliance_rate: 0, overdue_checks: 0, above_ground_count: 0 };
}

function emptyPest(): PestProfile {
  return { total_records: 0, follow_up_completion_rate: 0, flags_total: 0 };
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeFacilitiesCompliance(
  input: HomeFacilitiesComplianceInput,
): HomeFacilitiesComplianceResult {
  const { today, fire_checks, water_hygiene_records, window_checks, pest_records } = input;

  // ── Insufficient data guard (non-safety: 0 data = insufficient_data) ──
  if (
    fire_checks.length === 0 &&
    water_hygiene_records.length === 0 &&
    window_checks.length === 0 &&
    pest_records.length === 0
  ) {
    return {
      facilities_rating: "insufficient_data",
      facilities_score: 0,
      headline: HEADLINES.insufficient_data,
      fire: emptyFire(),
      water: emptyWater(),
      windows: emptyWindows(),
      pest: emptyPest(),
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Fire profile ──────────────────────────────────────────────────────
  const firePassCount = fire_checks.filter((f) => f.result === "pass").length;
  const firePassRate = rate(firePassCount, fire_checks.length);
  const fireOverdue = fire_checks.filter(
    (f) => f.next_inspection_due && daysBetween(f.next_inspection_due, today) > 0,
  ).length;
  const fireTimely = fire_checks.filter(
    (f) => f.next_inspection_due && daysBetween(f.next_inspection_due, today) <= 0,
  ).length;
  const fireTimelyRate = rate(fireTimely, fire_checks.length);
  const fireCompliant = fire_checks.filter(
    (f) => f.compliance_status === "compliant",
  ).length;
  const fireCompliantRate = rate(fireCompliant, fire_checks.length);

  const fire: FireProfile = {
    total_checks: fire_checks.length,
    pass_rate: firePassRate,
    overdue_inspections: fireOverdue,
    compliant_rate: fireCompliantRate,
  };

  // ── Water profile ─────────────────────────────────────────────────────
  const waterCompliant = water_hygiene_records.filter(
    (w) => w.compliance === "compliant",
  ).length;
  const waterComplianceRate = rate(waterCompliant, water_hygiene_records.length);
  const waterWithAction = water_hygiene_records.filter(
    (w) => w.action_required_present,
  );
  const waterActionCompleted = waterWithAction.filter(
    (w) => w.action_completed,
  ).length;
  const waterActionCompletionRate = rate(
    waterActionCompleted,
    waterWithAction.length,
  );
  const waterOverdue = water_hygiene_records.filter(
    (w) => w.next_due_date && daysBetween(w.next_due_date, today) > 0,
  ).length;

  const water: WaterProfile = {
    total_checks: water_hygiene_records.length,
    compliance_rate: waterComplianceRate,
    action_completion_rate: waterActionCompletionRate,
    overdue_checks: waterOverdue,
  };

  // ── Window profile ────────────────────────────────────────────────────
  const aboveGround = window_checks.filter((w) => w.floor_above_ground);
  const aboveGroundCompliant = aboveGround.filter(
    (w) => w.restrictor_present && w.restrictor_working && w.opening_compliance,
  ).length;
  const restrictorComplianceRate = rate(aboveGroundCompliant, aboveGround.length);
  const windowOverdue = window_checks.filter(
    (w) => w.next_due_date && daysBetween(w.next_due_date, today) > 0,
  ).length;
  const windowTimely = window_checks.filter(
    (w) => w.next_due_date && daysBetween(w.next_due_date, today) <= 0,
  ).length;
  const windowTimelyRate = rate(windowTimely, window_checks.length);

  const windows: WindowProfile = {
    total_checks: window_checks.length,
    restrictor_compliance_rate: restrictorComplianceRate,
    overdue_checks: windowOverdue,
    above_ground_count: aboveGround.length,
  };

  // ── Pest profile ──────────────────────────────────────────────────────
  const pestNeedingFollowUp = pest_records.filter((p) => p.follow_up_required);
  const pestFollowUpCompleted = pestNeedingFollowUp.filter(
    (p) => p.follow_up_completed,
  ).length;
  const pestFollowUpRate = rate(pestFollowUpCompleted, pestNeedingFollowUp.length);
  const pestFlagsTotal = pest_records.reduce(
    (sum, p) => sum + p.flags_count,
    0,
  );

  const pest: PestProfile = {
    total_records: pest_records.length,
    follow_up_completion_rate: pestFollowUpRate,
    flags_total: pestFlagsTotal,
  };

  // ══════════════════════════════════════════════════════════════════════
  // SCORING — Base 52 + max bonuses 28 = 80 for outstanding
  // ══════════════════════════════════════════════════════════════════════
  let score = 52;

  // Mod 1: Fire equipment compliance (±5)
  // Rate of fire checks with result "pass". No checks → -3 (fire is statutory)
  let mod1: number;
  if (fire_checks.length === 0) {
    mod1 = -3;
  } else if (meets(firePassRate, 95)) {
    mod1 = 5;
  } else if (meets(firePassRate, 85)) {
    mod1 = 3;
  } else if (meets(firePassRate, 70)) {
    mod1 = 0;
  } else {
    mod1 = -5;
  }
  score += mod1;

  // Mod 2: Fire inspection timeliness (±3)
  // Rate where next_inspection_due is not past today. No checks → -2
  let mod2: number;
  if (fire_checks.length === 0) {
    mod2 = -2;
  } else if (meets(fireTimelyRate, 95)) {
    mod2 = 3;
  } else if (meets(fireTimelyRate, 80)) {
    mod2 = 1;
  } else if (meets(fireTimelyRate, 60)) {
    mod2 = 0;
  } else {
    mod2 = -3;
  }
  score += mod2;

  // Mod 3: Water hygiene compliance (±4)
  // Rate of water checks with compliance "compliant". No checks → -2
  let mod3: number;
  if (water_hygiene_records.length === 0) {
    mod3 = -2;
  } else if (meets(waterComplianceRate, 95)) {
    mod3 = 4;
  } else if (meets(waterComplianceRate, 85)) {
    mod3 = 2;
  } else if (meets(waterComplianceRate, 70)) {
    mod3 = 0;
  } else {
    mod3 = -4;
  }
  score += mod3;

  // Mod 4: Water action completion (±3)
  // Rate where action_required that has been completed. None required → +2
  let mod4: number;
  if (waterWithAction.length === 0) {
    mod4 = 2;
  } else if (meets(waterActionCompletionRate, 90)) {
    mod4 = 3;
  } else if (meets(waterActionCompletionRate, 70)) {
    mod4 = 1;
  } else if (meets(waterActionCompletionRate, 50)) {
    mod4 = 0;
  } else {
    mod4 = -3;
  }
  score += mod4;

  // Mod 5: Window restrictor compliance (±4)
  // Rate of above-ground windows with restrictor_present && restrictor_working && opening_compliance
  // No above-ground windows → +1
  let mod5: number;
  if (aboveGround.length === 0) {
    mod5 = 1;
  } else if (meets(restrictorComplianceRate, 100)) {
    mod5 = 4;
  } else if (meets(restrictorComplianceRate, 90)) {
    mod5 = 2;
  } else if (meets(restrictorComplianceRate, 70)) {
    mod5 = 0;
  } else {
    mod5 = -4;
  }
  score += mod5;

  // Mod 6: Window check timeliness (±3)
  // Rate where next_due_date is not past today. No checks → 0
  let mod6: number;
  if (window_checks.length === 0) {
    mod6 = 0;
  } else if (meets(windowTimelyRate, 95)) {
    mod6 = 3;
  } else if (meets(windowTimelyRate, 80)) {
    mod6 = 1;
  } else if (meets(windowTimelyRate, 60)) {
    mod6 = 0;
  } else {
    mod6 = -3;
  }
  score += mod6;

  // Mod 7: Pest control follow-up (±3)
  // Rate of pest records needing follow-up that have been completed. None needed → +1
  let mod7: number;
  if (pestNeedingFollowUp.length === 0) {
    mod7 = 1;
  } else if (meets(pestFollowUpRate, 90)) {
    mod7 = 3;
  } else if (meets(pestFollowUpRate, 70)) {
    mod7 = 1;
  } else if (meets(pestFollowUpRate, 50)) {
    mod7 = 0;
  } else {
    mod7 = -3;
  }
  score += mod7;

  // Mod 8: Overall defect management (±3)
  // Combined rate of fire defects addressed + water actions completed + window remedials addressed
  // Fire defects "addressed" = defect_noted_present && result !== "fail"
  // Water defects = action_required_present, completed = action_completed
  // Window defects = outcome is "fail" or "urgent_action", addressed = has restrictor_present (we approximate by checking outcome !== "fail" && outcome !== "urgent_action")
  // Actually: window checks with outcome === "fail" or "urgent_action" count as defects;
  // those that don't are "addressed" — but the spec says "window remedials addressed"
  // Let's follow the spec precisely:
  //   fire: checks with defect_noted_present that also have result !== "fail"
  //   water: action_required_present with action_completed
  //   window: outcome === "fail" or "urgent_action" count as defects; outcome !== those are addressed
  // We combine: total defects = fire defects + water actions + window defects
  //             addressed = fire addressed + water completed + window addressed (non-fail/urgent)
  const fireDefects = fire_checks.filter((f) => f.defect_noted_present);
  const fireDefectsAddressed = fireDefects.filter(
    (f) => f.result !== "fail",
  ).length;
  const windowDefects = window_checks.filter(
    (w) => w.outcome === "fail" || w.outcome === "urgent_action",
  );
  const windowDefectsAddressed = 0; // If outcome is already fail/urgent_action, it's NOT addressed
  // Actually: total defects = all items needing attention; addressed = those resolved.
  // For windows: defects are fail/urgent_action outcomes. They are by definition unaddressed.
  // But we also need to count window checks where outcome was originally bad but is now resolved.
  // Since we only have current state, a window with outcome "pass" or "advisory" is not a defect.
  // Let's count: total defects across domains, addressed across domains
  const totalDefects =
    fireDefects.length + waterWithAction.length + windowDefects.length;
  const totalAddressed =
    fireDefectsAddressed + waterActionCompleted + windowDefectsAddressed;
  const defectRate = rate(totalAddressed, totalDefects);

  let mod8: number;
  if (totalDefects === 0) {
    mod8 = 2;
  } else if (meets(defectRate, 90)) {
    mod8 = 3;
  } else if (meets(defectRate, 70)) {
    mod8 = 1;
  } else if (meets(defectRate, 50)) {
    mod8 = 0;
  } else {
    mod8 = -3;
  }
  score += mod8;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  const facilities_rating = ratingFromScore(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (fire_checks.length > 0 && meets(firePassRate, 95))
    strengths.push(
      `${formatRate(firePassRate)} fire equipment pass rate — excellent maintenance standards.`,
    );
  if (fire_checks.length > 0 && fireOverdue === 0)
    strengths.push(
      "All fire inspections are within their due dates — no overdue equipment.",
    );
  if (water_hygiene_records.length > 0 && meets(waterComplianceRate, 95))
    strengths.push(
      `${formatRate(waterComplianceRate)} water hygiene compliance rate — legionella and temperature controls effective.`,
    );
  if (waterWithAction.length > 0 && meets(waterActionCompletionRate, 90))
    strengths.push(
      `${formatRate(waterActionCompletionRate)} of water hygiene actions completed — responsive follow-through.`,
    );
  if (waterWithAction.length === 0 && water_hygiene_records.length > 0)
    strengths.push(
      "No water hygiene actions required — all checks within parameters.",
    );
  if (aboveGround.length > 0 && meets(restrictorComplianceRate, 100))
    strengths.push(
      "100% window restrictor compliance on above-ground floors — child safety maximised.",
    );
  if (window_checks.length > 0 && windowOverdue === 0)
    strengths.push(
      "All window checks within schedule — no overdue inspections.",
    );
  if (pestNeedingFollowUp.length > 0 && meets(pestFollowUpRate, 90))
    strengths.push(
      `${formatRate(pestFollowUpRate)} pest control follow-ups completed — proactive environmental management.`,
    );
  if (pestNeedingFollowUp.length === 0 && pest_records.length > 0)
    strengths.push(
      "No pest control follow-ups required — effective prevention programme.",
    );
  if (totalDefects > 0 && meets(defectRate, 90))
    strengths.push(
      `${formatRate(defectRate)} of identified defects addressed across all domains — strong defect management.`,
    );
  if (totalDefects === 0)
    strengths.push(
      "No defects identified across fire, water, or window checks.",
    );

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (fire_checks.length === 0)
    concerns.push(
      "No fire equipment checks recorded — fire safety is a statutory requirement under the Fire Safety Order 2005.",
    );
  if (fire_checks.length > 0 && below(firePassRate, 70))
    concerns.push(
      `Only ${formatRate(firePassRate)} fire equipment pass rate — significant equipment failures detected.`,
    );
  if (fireOverdue > 0)
    concerns.push(
      `${fireOverdue} fire inspection(s) overdue — equipment may not be serviceable.`,
    );
  if (water_hygiene_records.length === 0)
    concerns.push(
      "No water hygiene records — legionella risk assessment and monitoring are statutory requirements.",
    );
  if (water_hygiene_records.length > 0 && below(waterComplianceRate, 70))
    concerns.push(
      `Only ${formatRate(waterComplianceRate)} water hygiene compliance — temperature or quality failures present.`,
    );
  if (waterWithAction.length > 0 && below(waterActionCompletionRate, 50))
    concerns.push(
      `Only ${formatRate(waterActionCompletionRate)} of water hygiene actions completed — remedial work stalling.`,
    );
  if (aboveGround.length > 0 && below(restrictorComplianceRate, 70))
    concerns.push(
      `Only ${formatRate(restrictorComplianceRate)} window restrictor compliance on upper floors — child fall risk.`,
    );
  if (windowOverdue > 0)
    concerns.push(
      `${windowOverdue} window check(s) overdue — restrictor integrity unknown.`,
    );
  if (pestNeedingFollowUp.length > 0 && below(pestFollowUpRate, 50))
    concerns.push(
      `Only ${formatRate(pestFollowUpRate)} pest control follow-ups completed — infestation risk persists.`,
    );
  if (pestFlagsTotal > 0)
    concerns.push(
      `${pestFlagsTotal} pest control flag(s) raised — environmental health concerns noted.`,
    );
  if (totalDefects > 0 && below(defectRate, 50))
    concerns.push(
      `Only ${formatRate(defectRate)} of defects addressed — systemic defect management failures across fire, water, and window domains.`,
    );

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: Recommendation[] = [];
  let rank = 1;

  if (fire_checks.length === 0)
    recommendations.push({
      rank: rank++,
      recommendation:
        "Establish a fire equipment check programme immediately — extinguishers, alarms, and emergency lighting must be inspected regularly.",
      urgency: "immediate",
      regulatory_ref: "Fire Safety Order 2005",
    });

  if (fireOverdue > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Complete ${fireOverdue} overdue fire equipment inspection(s) — expired checks represent a compliance gap.`,
      urgency: "immediate",
      regulatory_ref: "Fire Safety Order 2005",
    });

  if (fire_checks.length > 0 && below(firePassRate, 70))
    recommendations.push({
      rank: rank++,
      recommendation:
        "Review and remediate fire equipment failures — arrange contractor attendance for non-compliant items.",
      urgency: "immediate",
      regulatory_ref: "Fire Safety Order 2005",
    });

  if (water_hygiene_records.length === 0)
    recommendations.push({
      rank: rank++,
      recommendation:
        "Implement water hygiene monitoring — temperature checks, flushing records, and legionella risk assessment required.",
      urgency: "immediate",
      regulatory_ref: "HSE L8 / Reg 25",
    });

  if (waterWithAction.length > 0 && below(waterActionCompletionRate, 50))
    recommendations.push({
      rank: rank++,
      recommendation:
        "Prioritise completion of outstanding water hygiene actions — incomplete remedials increase legionella risk.",
      urgency: "immediate",
      regulatory_ref: "HSE L8 / Reg 25",
    });

  if (aboveGround.length > 0 && below(restrictorComplianceRate, 70))
    recommendations.push({
      rank: rank++,
      recommendation:
        "Fit or repair window restrictors on all above-ground windows — 100mm rule must be met to prevent child falls.",
      urgency: "immediate",
      regulatory_ref: "Reg 25 / BS EN 14351",
    });

  if (windowOverdue > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Schedule ${windowOverdue} overdue window restrictor check(s) — restrictor integrity must be verified.`,
      urgency: "soon",
      regulatory_ref: "Reg 25",
    });

  if (pestNeedingFollowUp.length > 0 && below(pestFollowUpRate, 50))
    recommendations.push({
      rank: rank++,
      recommendation:
        "Complete outstanding pest control follow-ups — unresolved treatments may not have been effective.",
      urgency: "soon",
      regulatory_ref: "Reg 25 / Environmental Health",
    });

  if (totalDefects > 0 && below(defectRate, 70))
    recommendations.push({
      rank: rank++,
      recommendation:
        "Implement a centralised defect tracking system — fire, water, and window defects must be closed out systematically.",
      urgency: "planned",
      regulatory_ref: "Reg 25",
    });

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: Insight[] = [];

  if (
    fire_checks.length > 0 &&
    meets(firePassRate, 95) &&
    fireOverdue === 0 &&
    water_hygiene_records.length > 0 &&
    meets(waterComplianceRate, 95) &&
    (aboveGround.length === 0 || meets(restrictorComplianceRate, 100)) &&
    windowOverdue === 0
  ) {
    insights.push({
      text: "Fire, water, and window compliance all at or above target. This evidences an outstanding facilities management programme — Ofsted will see a home that takes environmental safety seriously.",
      severity: "positive",
    });
  }

  if (fire_checks.length === 0 && water_hygiene_records.length === 0) {
    insights.push({
      text: "No fire equipment or water hygiene records. Both are statutory requirements. Ofsted will treat this as a fundamental leadership and management failure — Reg 25 requires evidence of premises safety.",
      severity: "critical",
    });
  } else if (fire_checks.length === 0) {
    insights.push({
      text: "No fire equipment checks on record. The Fire Safety Order 2005 requires regular inspection of all fire safety equipment. Ofsted inspectors will check extinguisher tags and alarm test logs.",
      severity: "critical",
    });
  }

  if (aboveGround.length > 0 && below(restrictorComplianceRate, 70)) {
    insights.push({
      text: `Only ${formatRate(restrictorComplianceRate)} of above-ground windows meet restrictor compliance. Window falls are a serious safeguarding risk — Ofsted expects 100% compliance with the 100mm opening rule on all floors above ground.`,
      severity: "critical",
    });
  }

  if (waterWithAction.length > 0 && below(waterActionCompletionRate, 50)) {
    insights.push({
      text: `Only ${formatRate(waterActionCompletionRate)} of water hygiene actions completed. Legionella is a serious health risk — incomplete remedials suggest the risk assessment is not being actively managed.`,
      severity: "warning",
    });
  }

  if (
    water_hygiene_records.length > 0 &&
    meets(waterComplianceRate, 95) &&
    (waterWithAction.length === 0 || meets(waterActionCompletionRate, 90))
  ) {
    insights.push({
      text: `Water hygiene compliance at ${formatRate(waterComplianceRate)} with actions well-managed. This demonstrates effective legionella risk management that meets HSE L8 guidance.`,
      severity: "positive",
    });
  }

  if (pestFlagsTotal >= 3) {
    insights.push({
      text: `${pestFlagsTotal} pest control flags across ${pest_records.length} record(s). Multiple flags suggest a persistent environmental health issue that requires escalation to the responsible individual.`,
      severity: "warning",
    });
  }

  if (totalDefects > 0 && below(defectRate, 50)) {
    insights.push({
      text: `Only ${formatRate(defectRate)} of defects addressed across fire, water, and window checks. Systematic failure to close out defects indicates premises management is not being prioritised — Ofsted will note this as a leadership concern.`,
      severity: "critical",
    });
  }

  return {
    facilities_rating,
    facilities_score: score,
    headline: HEADLINES[facilities_rating],
    fire,
    water,
    windows,
    pest,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
