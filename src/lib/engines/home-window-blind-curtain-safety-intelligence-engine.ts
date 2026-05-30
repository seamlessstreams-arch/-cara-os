// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME WINDOW, BLIND & CURTAIN SAFETY INTELLIGENCE ENGINE
// Monitors window restrictor checks, blind cord safety, curtain condition,
// blackout provision, and child safety compliance across the home.
// Measures window restrictor integrity, blind cord elimination/safety,
// curtain condition and suitability, blackout provision for sleep, and
// inspection compliance with scheduled safety checks.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Premises — maintained to a standard that is appropriate
// for the care and accommodation of children and consistent with their needs).
// SCCIF: "Children live in a home that is safe; staff manage risks well."
// Store keys: windowRestrictorRecords, blindCordRecords,
//             curtainConditionRecords, blackoutRecords,
//             windowSafetyInspectionRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface WindowRestrictorRecordInput {
  id: string;
  room_id: string;
  room_name: string;
  floor_level: number; // 0=ground, 1=first, 2=second etc.
  check_date: string;
  restrictor_fitted: boolean;
  restrictor_functional: boolean;
  restrictor_type: "screw_lock" | "cable" | "friction_hinge" | "key_lock" | "safety_catch" | "none" | "other";
  opening_within_100mm: boolean; // restrictor limits opening to <= 100mm
  key_accessible_to_staff_only: boolean;
  checked_by: string;
  issue_identified: boolean;
  issue_description: string | null;
  issue_resolved: boolean;
  resolution_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface BlindCordRecordInput {
  id: string;
  room_id: string;
  room_name: string;
  check_date: string;
  blind_type: "roller" | "venetian" | "vertical" | "roman" | "pleated" | "none" | "other";
  cord_present: boolean;
  cord_secured: boolean; // cord cleated/tied out of reach if present
  cord_free_alternative: boolean; // cordless blind or wand-operated
  child_accessible: boolean; // can a child reach the cord
  safety_device_fitted: boolean; // cord cleat, breakaway device, etc.
  compliant: boolean; // overall cord safety compliance
  checked_by: string;
  issue_identified: boolean;
  issue_description: string | null;
  issue_resolved: boolean;
  resolution_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface CurtainConditionRecordInput {
  id: string;
  room_id: string;
  room_name: string;
  check_date: string;
  curtain_present: boolean;
  curtain_clean: boolean;
  curtain_intact: boolean; // no tears, damage
  rail_secure: boolean; // curtain rail/pole secure
  hooks_safe: boolean; // no sharp hooks or exposed fixings
  fire_retardant: boolean;
  appropriate_length: boolean; // not trailing on floor (trip hazard)
  child_safe_rail: boolean; // breakaway rail if needed for ligature risk
  overall_condition: "good" | "fair" | "poor" | "unsuitable";
  checked_by: string;
  issue_identified: boolean;
  issue_description: string | null;
  issue_resolved: boolean;
  resolution_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface BlackoutRecordInput {
  id: string;
  room_id: string;
  room_name: string;
  child_id: string | null;
  check_date: string;
  blackout_provided: boolean;
  blackout_type: "blackout_blind" | "blackout_curtain" | "blackout_lining" | "window_film" | "none" | "other";
  blackout_effective: boolean; // adequately blocks light
  child_specific_need: boolean; // child has a documented need for blackout
  need_met: boolean; // if child_specific_need, is it being met
  seasonal_review_completed: boolean;
  checked_by: string;
  issue_identified: boolean;
  issue_description: string | null;
  issue_resolved: boolean;
  resolution_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface WindowSafetyInspectionRecordInput {
  id: string;
  inspection_date: string;
  inspector: string;
  inspection_type: "routine" | "annual" | "post_incident" | "pre_admission" | "regulatory" | "other";
  total_windows_checked: number;
  total_windows_compliant: number;
  total_blinds_checked: number;
  total_blinds_compliant: number;
  total_curtains_checked: number;
  total_curtains_compliant: number;
  actions_required: number;
  actions_completed: number;
  overall_pass: boolean;
  next_inspection_due: string | null;
  notes: string | null;
  created_at: string;
}

export interface WindowBlindCurtainSafetyInput {
  today: string;
  total_children: number;
  window_restrictor_records: WindowRestrictorRecordInput[];
  blind_cord_records: BlindCordRecordInput[];
  curtain_condition_records: CurtainConditionRecordInput[];
  blackout_records: BlackoutRecordInput[];
  inspection_records: WindowSafetyInspectionRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type WindowBlindCurtainRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface WindowBlindCurtainInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface WindowBlindCurtainRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface WindowBlindCurtainSafetyResult {
  window_safety_rating: WindowBlindCurtainRating;
  window_safety_score: number;
  headline: string;
  total_restrictor_records: number;
  total_blind_records: number;
  total_curtain_records: number;
  total_blackout_records: number;
  total_inspection_records: number;
  window_restrictor_rate: number;
  blind_cord_safety_rate: number;
  curtain_condition_rate: number;
  blackout_provision_rate: number;
  child_safety_rate: number;
  inspection_compliance_rate: number;
  window_restrictor_records: WindowRestrictorRecordInput[];
  blind_cord_records: BlindCordRecordInput[];
  curtain_condition_records: CurtainConditionRecordInput[];
  blackout_records: BlackoutRecordInput[];
  inspection_records: WindowSafetyInspectionRecordInput[];
  strengths: string[];
  concerns: string[];
  recommendations: WindowBlindCurtainRecommendation[];
  insights: WindowBlindCurtainInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): WindowBlindCurtainRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: WindowBlindCurtainRating,
  score: number,
  headline: string,
): WindowBlindCurtainSafetyResult {
  return {
    window_safety_rating: rating,
    window_safety_score: score,
    headline,
    total_restrictor_records: 0,
    total_blind_records: 0,
    total_curtain_records: 0,
    total_blackout_records: 0,
    total_inspection_records: 0,
    window_restrictor_rate: 0,
    blind_cord_safety_rate: 0,
    curtain_condition_rate: 0,
    blackout_provision_rate: 0,
    child_safety_rate: 0,
    inspection_compliance_rate: 0,
    window_restrictor_records: [],
    blind_cord_records: [],
    curtain_condition_records: [],
    blackout_records: [],
    inspection_records: [],
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeWindowBlindCurtainSafety(
  input: WindowBlindCurtainSafetyInput,
): WindowBlindCurtainSafetyResult {
  const {
    today,
    total_children,
    window_restrictor_records,
    blind_cord_records,
    curtain_condition_records,
    blackout_records,
    inspection_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    window_restrictor_records.length === 0 &&
    blind_cord_records.length === 0 &&
    curtain_condition_records.length === 0 &&
    blackout_records.length === 0 &&
    inspection_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess window, blind and curtain safety.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No window, blind or curtain safety data recorded despite children on placement — safety compliance requires urgent attention.",
      ),
      concerns: [
        "No window restrictor checks, blind cord safety assessments, curtain condition records, blackout provision reviews, or safety inspections exist despite children being on placement — the home cannot evidence that windows, blinds and curtains are safe for children.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement immediate window restrictor checks across all rooms accessible to children — restrictors must be fitted, functional, and limit openings to 100mm or less on all upper-floor windows and any ground-floor windows where a fall risk exists.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises",
        },
        {
          rank: 2,
          recommendation:
            "Conduct an urgent blind cord safety audit — identify and eliminate all accessible blind cords or fit approved safety devices. Blind cord strangulation is a foreseeable risk that must be mitigated immediately.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises",
        },
      ],
      insights: [
        {
          text: "The complete absence of window, blind and curtain safety records means Ofsted cannot verify that the home meets Reg 25 premises safety requirements. Window restrictors, blind cord safety, and curtain condition are fundamental physical safety checks that must be evidenced.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  const totalRestrictorRecords = window_restrictor_records.length;
  const totalBlindRecords = blind_cord_records.length;
  const totalCurtainRecords = curtain_condition_records.length;
  const totalBlackoutRecords = blackout_records.length;
  const totalInspectionRecords = inspection_records.length;

  // --- Window restrictor metrics ---
  // A restrictor record passes if: fitted + functional + opening within 100mm
  const restrictorCompliant = window_restrictor_records.filter(
    (r) => r.restrictor_fitted && r.restrictor_functional && r.opening_within_100mm,
  ).length;
  const windowRestrictorRate = pct(restrictorCompliant, totalRestrictorRecords);

  const restrictorsFitted = window_restrictor_records.filter((r) => r.restrictor_fitted).length;
  const restrictorFittedRate = pct(restrictorsFitted, totalRestrictorRecords);

  const restrictorsFunctional = window_restrictor_records.filter(
    (r) => r.restrictor_fitted && r.restrictor_functional,
  ).length;
  const restrictorFunctionalRate = pct(restrictorsFunctional, totalRestrictorRecords);

  const openingCompliant = window_restrictor_records.filter(
    (r) => r.restrictor_fitted && r.opening_within_100mm,
  ).length;
  const openingComplianceRate = pct(openingCompliant, totalRestrictorRecords);

  const keysSecure = window_restrictor_records.filter(
    (r) => r.restrictor_fitted && r.key_accessible_to_staff_only,
  ).length;
  const keySecurityRate = pct(keysSecure, restrictorsFitted || 1);

  const restrictorIssues = window_restrictor_records.filter((r) => r.issue_identified).length;
  const restrictorIssuesResolved = window_restrictor_records.filter(
    (r) => r.issue_identified && r.issue_resolved,
  ).length;
  const restrictorIssueResolutionRate = pct(restrictorIssuesResolved, restrictorIssues);

  // Upper floor windows (floor_level >= 1) — these are critical
  const upperFloorRecords = window_restrictor_records.filter((r) => r.floor_level >= 1);
  const upperFloorCompliant = upperFloorRecords.filter(
    (r) => r.restrictor_fitted && r.restrictor_functional && r.opening_within_100mm,
  ).length;
  const upperFloorComplianceRate = pct(upperFloorCompliant, upperFloorRecords.length);

  // --- Blind cord safety metrics ---
  const blindsCompliant = blind_cord_records.filter((r) => r.compliant).length;
  const blindCordSafetyRate = pct(blindsCompliant, totalBlindRecords);

  const cordFreeCount = blind_cord_records.filter((r) => r.cord_free_alternative).length;
  const cordFreeRate = pct(cordFreeCount, totalBlindRecords);

  const cordPresentCount = blind_cord_records.filter((r) => r.cord_present).length;
  const cordsSecured = blind_cord_records.filter(
    (r) => r.cord_present && r.cord_secured,
  ).length;
  const cordSecuredRate = pct(cordsSecured, cordPresentCount);

  const childAccessibleCords = blind_cord_records.filter(
    (r) => r.cord_present && r.child_accessible,
  ).length;
  const childAccessibleCordRate = pct(childAccessibleCords, totalBlindRecords);

  const safetyDevicesFitted = blind_cord_records.filter(
    (r) => r.cord_present && r.safety_device_fitted,
  ).length;
  const safetyDeviceRate = pct(safetyDevicesFitted, cordPresentCount || 1);

  const blindIssues = blind_cord_records.filter((r) => r.issue_identified).length;
  const blindIssuesResolved = blind_cord_records.filter(
    (r) => r.issue_identified && r.issue_resolved,
  ).length;
  const blindIssueResolutionRate = pct(blindIssuesResolved, blindIssues);

  // --- Curtain condition metrics ---
  const curtainChecks = [
    (c: CurtainConditionRecordInput) => c.curtain_clean,
    (c: CurtainConditionRecordInput) => c.curtain_intact,
    (c: CurtainConditionRecordInput) => c.rail_secure,
    (c: CurtainConditionRecordInput) => c.hooks_safe,
    (c: CurtainConditionRecordInput) => c.fire_retardant,
    (c: CurtainConditionRecordInput) => c.appropriate_length,
    (c: CurtainConditionRecordInput) => c.child_safe_rail,
  ];
  const curtainsPresent = curtain_condition_records.filter((c) => c.curtain_present);
  const totalCurtainChecksPossible = curtainsPresent.length * curtainChecks.length;
  let totalCurtainChecksPassed = 0;
  for (const rec of curtainsPresent) {
    for (const check of curtainChecks) {
      if (check(rec)) totalCurtainChecksPassed++;
    }
  }
  const curtainConditionRate = pct(totalCurtainChecksPassed, totalCurtainChecksPossible);

  const curtainsGoodCondition = curtain_condition_records.filter(
    (c) => c.overall_condition === "good",
  ).length;
  const curtainsFairCondition = curtain_condition_records.filter(
    (c) => c.overall_condition === "fair",
  ).length;
  const curtainsPoorCondition = curtain_condition_records.filter(
    (c) => c.overall_condition === "poor",
  ).length;
  const curtainsUnsuitable = curtain_condition_records.filter(
    (c) => c.overall_condition === "unsuitable",
  ).length;

  const fireRetardantCount = curtainsPresent.filter((c) => c.fire_retardant).length;
  const fireRetardantRate = pct(fireRetardantCount, curtainsPresent.length);

  const railSecureCount = curtainsPresent.filter((c) => c.rail_secure).length;
  const railSecureRate = pct(railSecureCount, curtainsPresent.length);

  const childSafeRailCount = curtainsPresent.filter((c) => c.child_safe_rail).length;
  const childSafeRailRate = pct(childSafeRailCount, curtainsPresent.length);

  const curtainIssues = curtain_condition_records.filter((c) => c.issue_identified).length;
  const curtainIssuesResolved = curtain_condition_records.filter(
    (c) => c.issue_identified && c.issue_resolved,
  ).length;
  const curtainIssueResolutionRate = pct(curtainIssuesResolved, curtainIssues);

  // --- Blackout provision metrics ---
  const blackoutProvided = blackout_records.filter((r) => r.blackout_provided).length;
  const blackoutProvisionRate = pct(blackoutProvided, totalBlackoutRecords);

  const blackoutEffective = blackout_records.filter(
    (r) => r.blackout_provided && r.blackout_effective,
  ).length;
  const blackoutEffectivenessRate = pct(blackoutEffective, blackoutProvided || 1);

  const childSpecificNeeds = blackout_records.filter((r) => r.child_specific_need);
  const childNeedsMet = childSpecificNeeds.filter((r) => r.need_met).length;
  const childNeedMetRate = pct(childNeedsMet, childSpecificNeeds.length);

  const seasonalReviews = blackout_records.filter(
    (r) => r.seasonal_review_completed,
  ).length;
  const seasonalReviewRate = pct(seasonalReviews, totalBlackoutRecords);

  const blackoutIssues = blackout_records.filter((r) => r.issue_identified).length;
  const blackoutIssuesResolved = blackout_records.filter(
    (r) => r.issue_identified && r.issue_resolved,
  ).length;
  const blackoutIssueResolutionRate = pct(blackoutIssuesResolved, blackoutIssues);

  // --- Child safety composite rate ---
  // Child safety = combination of: upper-floor restrictor compliance,
  // cord-free/safe blinds, child-safe curtain rails, and child-specific
  // blackout needs being met
  let childSafetyNumerator = 0;
  let childSafetyDenominator = 0;

  if (upperFloorRecords.length > 0) {
    childSafetyNumerator += upperFloorComplianceRate;
    childSafetyDenominator++;
  }
  if (totalBlindRecords > 0) {
    // Penalise if child-accessible cords exist
    const blindChildSafety = childAccessibleCords === 0 ? 100 : pct(totalBlindRecords - childAccessibleCords, totalBlindRecords);
    childSafetyNumerator += blindChildSafety;
    childSafetyDenominator++;
  }
  if (curtainsPresent.length > 0) {
    childSafetyNumerator += childSafeRailRate;
    childSafetyDenominator++;
  }
  if (childSpecificNeeds.length > 0) {
    childSafetyNumerator += childNeedMetRate;
    childSafetyDenominator++;
  }

  const childSafetyRate = childSafetyDenominator > 0
    ? Math.round(childSafetyNumerator / childSafetyDenominator)
    : 0;

  // --- Inspection compliance metrics ---
  const inspectionsPassed = inspection_records.filter((r) => r.overall_pass).length;
  const inspectionPassRate = pct(inspectionsPassed, totalInspectionRecords);

  const inspectionActionsRequired = inspection_records.reduce(
    (sum, r) => sum + r.actions_required, 0,
  );
  const inspectionActionsCompleted = inspection_records.reduce(
    (sum, r) => sum + r.actions_completed, 0,
  );
  const inspectionActionCompletionRate = pct(
    inspectionActionsCompleted, inspectionActionsRequired,
  );

  // Check if inspections are overdue
  const overdueInspections = inspection_records.filter((r) => {
    if (!r.next_inspection_due) return false;
    return r.next_inspection_due < today;
  }).length;

  const inspectionComplianceRate = totalInspectionRecords > 0
    ? Math.round(
        (inspectionPassRate * 0.5 +
          inspectionActionCompletionRate * 0.3 +
          (overdueInspections === 0 ? 100 : pct(totalInspectionRecords - overdueInspections, totalInspectionRecords)) * 0.2),
      )
    : 0;

  // ── Overall issue resolution across all domains ───────────────────────
  const totalIssues = restrictorIssues + blindIssues + curtainIssues + blackoutIssues;
  const totalIssuesResolved = restrictorIssuesResolved + blindIssuesResolved +
    curtainIssuesResolved + blackoutIssuesResolved;
  const overallIssueResolutionRate = pct(totalIssuesResolved, totalIssues);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: windowRestrictorRate (>=90: +5, >=70: +2) ---
  if (windowRestrictorRate >= 90) score += 5;
  else if (windowRestrictorRate >= 70) score += 2;

  // --- Bonus 2: blindCordSafetyRate (>=90: +5, >=70: +2) ---
  if (blindCordSafetyRate >= 90) score += 5;
  else if (blindCordSafetyRate >= 70) score += 2;

  // --- Bonus 3: curtainConditionRate (>=90: +4, >=70: +2) ---
  if (curtainConditionRate >= 90) score += 4;
  else if (curtainConditionRate >= 70) score += 2;

  // --- Bonus 4: blackoutProvisionRate (>=90: +3, >=70: +1) ---
  if (blackoutProvisionRate >= 90) score += 3;
  else if (blackoutProvisionRate >= 70) score += 1;

  // --- Bonus 5: childSafetyRate (>=90: +4, >=70: +2) ---
  if (childSafetyRate >= 90) score += 4;
  else if (childSafetyRate >= 70) score += 2;

  // --- Bonus 6: inspectionComplianceRate (>=90: +4, >=70: +2) ---
  if (inspectionComplianceRate >= 90) score += 4;
  else if (inspectionComplianceRate >= 70) score += 2;

  // --- Bonus 7: overallIssueResolutionRate (>=90: +3, >=70: +1) ---
  if (overallIssueResolutionRate >= 90 && totalIssues > 0) score += 3;
  else if (overallIssueResolutionRate >= 70 && totalIssues > 0) score += 1;

  // Max bonuses = 5+5+4+3+4+4+3 = 28

  // ── Penalties (4 guarded) ─────────────────────────────────────────────

  // windowRestrictorRate < 50 → -8
  if (windowRestrictorRate < 50 && totalRestrictorRecords > 0) score -= 8;

  // blindCordSafetyRate < 50 → -8
  if (blindCordSafetyRate < 50 && totalBlindRecords > 0) score -= 8;

  // childAccessibleCords present → -6
  if (childAccessibleCords > 0 && totalBlindRecords > 0) score -= 6;

  // inspectionComplianceRate < 50 → -5
  if (inspectionComplianceRate < 50 && totalInspectionRecords > 0) score -= 5;

  score = clamp(score, 0, 100);

  const window_safety_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (windowRestrictorRate >= 90 && totalRestrictorRecords > 0) {
    strengths.push(
      `${windowRestrictorRate}% window restrictor compliance — all checked windows have fitted, functional restrictors limiting openings to 100mm or less, demonstrating robust physical safety measures.`,
    );
  } else if (windowRestrictorRate >= 70 && totalRestrictorRecords > 0) {
    strengths.push(
      `${windowRestrictorRate}% window restrictor compliance — the majority of windows have compliant restrictors in place.`,
    );
  }

  if (upperFloorComplianceRate >= 90 && upperFloorRecords.length > 0) {
    strengths.push(
      `${upperFloorComplianceRate}% upper-floor window compliance — all upper-floor windows have functional restrictors, addressing the highest-risk fall locations.`,
    );
  } else if (upperFloorComplianceRate >= 70 && upperFloorRecords.length > 0) {
    strengths.push(
      `${upperFloorComplianceRate}% of upper-floor windows are fully compliant with restrictor requirements.`,
    );
  }

  if (blindCordSafetyRate >= 90 && totalBlindRecords > 0) {
    strengths.push(
      `${blindCordSafetyRate}% blind cord safety compliance — blinds across the home meet safety standards with cords eliminated or secured, mitigating strangulation risk.`,
    );
  } else if (blindCordSafetyRate >= 70 && totalBlindRecords > 0) {
    strengths.push(
      `${blindCordSafetyRate}% blind cord safety compliance — the majority of blinds meet cord safety requirements.`,
    );
  }

  if (cordFreeRate >= 90 && totalBlindRecords > 0) {
    strengths.push(
      `${cordFreeRate}% of blinds are cordless alternatives — the home has proactively eliminated cord strangulation risk by adopting cord-free designs.`,
    );
  } else if (cordFreeRate >= 70 && totalBlindRecords > 0) {
    strengths.push(
      `${cordFreeRate}% of blinds use cord-free alternatives — good progress towards eliminating cord strangulation risk.`,
    );
  }

  if (curtainConditionRate >= 90 && curtainsPresent.length > 0) {
    strengths.push(
      `${curtainConditionRate}% curtain condition compliance — curtains are clean, intact, fire retardant, and safely fitted with secure rails and appropriate lengths.`,
    );
  } else if (curtainConditionRate >= 70 && curtainsPresent.length > 0) {
    strengths.push(
      `${curtainConditionRate}% curtain condition compliance — the majority of curtains meet safety and condition standards.`,
    );
  }

  if (fireRetardantRate >= 90 && curtainsPresent.length > 0) {
    strengths.push(
      `${fireRetardantRate}% of curtains are fire retardant — the home meets fire safety requirements for soft furnishings.`,
    );
  } else if (fireRetardantRate >= 70 && curtainsPresent.length > 0) {
    strengths.push(
      `${fireRetardantRate}% of curtains are fire retardant — good compliance with fire safety standards for window coverings.`,
    );
  }

  if (childSafeRailRate >= 90 && curtainsPresent.length > 0) {
    strengths.push(
      `${childSafeRailRate}% of curtain rails are child-safe — breakaway or anti-ligature rails fitted where appropriate, demonstrating awareness of ligature risk.`,
    );
  } else if (childSafeRailRate >= 70 && curtainsPresent.length > 0) {
    strengths.push(
      `${childSafeRailRate}% of curtain rails meet child safety standards — good coverage of anti-ligature provisions.`,
    );
  }

  if (blackoutProvisionRate >= 90 && totalBlackoutRecords > 0) {
    strengths.push(
      `${blackoutProvisionRate}% blackout provision — children's bedrooms have effective blackout measures supporting sleep quality and wellbeing.`,
    );
  } else if (blackoutProvisionRate >= 70 && totalBlackoutRecords > 0) {
    strengths.push(
      `${blackoutProvisionRate}% blackout provision — the majority of children's rooms have appropriate blackout measures in place.`,
    );
  }

  if (childNeedMetRate >= 90 && childSpecificNeeds.length > 0) {
    strengths.push(
      `${childNeedMetRate}% of children with documented blackout needs have those needs met — the home responds to individual sleep requirements effectively.`,
    );
  } else if (childNeedMetRate >= 70 && childSpecificNeeds.length > 0) {
    strengths.push(
      `${childNeedMetRate}% of child-specific blackout needs are being met — generally responsive to individual sleep requirements.`,
    );
  }

  if (inspectionComplianceRate >= 90 && totalInspectionRecords > 0) {
    strengths.push(
      `${inspectionComplianceRate}% inspection compliance — scheduled safety inspections are completed, passed, and actions are followed through, evidencing a systematic approach to premises safety.`,
    );
  } else if (inspectionComplianceRate >= 70 && totalInspectionRecords > 0) {
    strengths.push(
      `${inspectionComplianceRate}% inspection compliance — the home maintains a generally effective inspection regime.`,
    );
  }

  if (overallIssueResolutionRate >= 90 && totalIssues > 0) {
    strengths.push(
      `${overallIssueResolutionRate}% of identified safety issues resolved — the home demonstrates responsive maintenance and prompt remediation of window, blind and curtain defects.`,
    );
  } else if (overallIssueResolutionRate >= 70 && totalIssues > 0) {
    strengths.push(
      `${overallIssueResolutionRate}% of identified safety issues resolved — the majority of defects are being addressed.`,
    );
  }

  if (childAccessibleCords === 0 && totalBlindRecords > 0) {
    strengths.push(
      "Zero child-accessible blind cords across the home — strangulation risk from blind cords has been fully eliminated, reflecting excellent child safety practice.",
    );
  }

  if (keySecurityRate >= 90 && restrictorsFitted > 0) {
    strengths.push(
      `${keySecurityRate}% of restrictor keys are accessible to staff only — children cannot override window safety measures, maintaining the integrity of fall prevention.`,
    );
  }

  if (seasonalReviewRate >= 90 && totalBlackoutRecords > 0) {
    strengths.push(
      `${seasonalReviewRate}% seasonal blackout reviews completed — the home adapts blackout provision to seasonal light changes, supporting children's sleep throughout the year.`,
    );
  }

  if (overdueInspections === 0 && totalInspectionRecords > 0) {
    strengths.push(
      "No overdue safety inspections — the home maintains its inspection schedule, ensuring continuous monitoring of window, blind and curtain safety.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (windowRestrictorRate < 50 && totalRestrictorRecords > 0) {
    concerns.push(
      `Only ${windowRestrictorRate}% window restrictor compliance — the majority of checked windows do not have fully compliant restrictors. This represents a significant fall risk, particularly for upper-floor windows, and is a direct breach of Reg 25 premises safety requirements.`,
    );
  } else if (windowRestrictorRate < 70 && windowRestrictorRate >= 50 && totalRestrictorRecords > 0) {
    concerns.push(
      `Window restrictor compliance at ${windowRestrictorRate}% — a notable proportion of windows do not have fully compliant restrictors, creating avoidable fall risk.`,
    );
  }

  if (upperFloorComplianceRate < 50 && upperFloorRecords.length > 0) {
    concerns.push(
      `Only ${upperFloorComplianceRate}% of upper-floor windows are fully compliant — upper-floor windows present the greatest fall risk and must be prioritised for immediate remediation.`,
    );
  } else if (upperFloorComplianceRate < 70 && upperFloorComplianceRate >= 50 && upperFloorRecords.length > 0) {
    concerns.push(
      `Upper-floor window compliance at ${upperFloorComplianceRate}% — some upper-floor windows lack fully functional restrictors, which is unacceptable given the severity of potential falls.`,
    );
  }

  if (blindCordSafetyRate < 50 && totalBlindRecords > 0) {
    concerns.push(
      `Only ${blindCordSafetyRate}% blind cord safety compliance — the majority of blinds do not meet safety standards. Blind cords are a known strangulation hazard and this represents a serious child safety failure.`,
    );
  } else if (blindCordSafetyRate < 70 && blindCordSafetyRate >= 50 && totalBlindRecords > 0) {
    concerns.push(
      `Blind cord safety compliance at ${blindCordSafetyRate}% — a significant number of blinds do not meet cord safety requirements, creating foreseeable strangulation risk.`,
    );
  }

  if (childAccessibleCords > 0 && totalBlindRecords > 0) {
    concerns.push(
      `${childAccessibleCords} blind cord${childAccessibleCords !== 1 ? "s" : ""} accessible to children — any child-accessible blind cord represents an immediate strangulation hazard. These must be eliminated, secured, or replaced with cordless alternatives without delay.`,
    );
  }

  if (curtainConditionRate < 50 && curtainsPresent.length > 0) {
    concerns.push(
      `Only ${curtainConditionRate}% curtain condition compliance — curtains across the home have significant safety and condition issues including insecure rails, missing fire retardancy, or trailing lengths creating trip hazards.`,
    );
  } else if (curtainConditionRate < 70 && curtainConditionRate >= 50 && curtainsPresent.length > 0) {
    concerns.push(
      `Curtain condition compliance at ${curtainConditionRate}% — some curtains have safety or condition issues requiring attention.`,
    );
  }

  if (curtainsUnsuitable > 0) {
    concerns.push(
      `${curtainsUnsuitable} curtain${curtainsUnsuitable !== 1 ? "s" : ""} rated as unsuitable — these require immediate replacement as they present safety or hygiene risks.`,
    );
  }

  if (curtainsPoorCondition > 0) {
    concerns.push(
      `${curtainsPoorCondition} curtain${curtainsPoorCondition !== 1 ? "s" : ""} in poor condition — these should be replaced or repaired promptly to maintain appropriate living standards.`,
    );
  }

  if (fireRetardantRate < 50 && curtainsPresent.length > 0) {
    concerns.push(
      `Only ${fireRetardantRate}% of curtains are fire retardant — a majority of curtains do not meet fire safety requirements, increasing fire spread risk in children's bedrooms and living areas.`,
    );
  } else if (fireRetardantRate < 70 && fireRetardantRate >= 50 && curtainsPresent.length > 0) {
    concerns.push(
      `Fire retardant compliance at ${fireRetardantRate}% — a notable proportion of curtains do not meet fire safety standards.`,
    );
  }

  if (childSafeRailRate < 50 && curtainsPresent.length > 0) {
    concerns.push(
      `Only ${childSafeRailRate}% of curtain rails are child-safe — inadequate anti-ligature provision on curtain rails creates foreseeable risk, particularly in bedrooms and private spaces.`,
    );
  } else if (childSafeRailRate < 70 && childSafeRailRate >= 50 && curtainsPresent.length > 0) {
    concerns.push(
      `Child-safe rail coverage at ${childSafeRailRate}% — some curtain rails lack anti-ligature or breakaway features.`,
    );
  }

  if (blackoutProvisionRate < 50 && totalBlackoutRecords > 0) {
    concerns.push(
      `Only ${blackoutProvisionRate}% blackout provision — the majority of children's rooms lack adequate blackout measures, potentially affecting sleep quality, health and wellbeing.`,
    );
  } else if (blackoutProvisionRate < 70 && blackoutProvisionRate >= 50 && totalBlackoutRecords > 0) {
    concerns.push(
      `Blackout provision at ${blackoutProvisionRate}% — some children's rooms lack adequate blackout measures.`,
    );
  }

  if (childNeedMetRate < 50 && childSpecificNeeds.length > 0) {
    concerns.push(
      `Only ${childNeedMetRate}% of children with documented blackout needs have those needs met — failing to meet individualised sleep requirements directly impacts children's health and wellbeing.`,
    );
  } else if (childNeedMetRate < 70 && childNeedMetRate >= 50 && childSpecificNeeds.length > 0) {
    concerns.push(
      `Only ${childNeedMetRate}% of child-specific blackout needs met — some children's documented sleep environment requirements are not being fulfilled.`,
    );
  }

  if (inspectionComplianceRate < 50 && totalInspectionRecords > 0) {
    concerns.push(
      `Inspection compliance at only ${inspectionComplianceRate}% — safety inspections are failing, actions are not being completed, or inspections are overdue. The home cannot evidence systematic premises safety management.`,
    );
  } else if (inspectionComplianceRate < 70 && inspectionComplianceRate >= 50 && totalInspectionRecords > 0) {
    concerns.push(
      `Inspection compliance at ${inspectionComplianceRate}% — some inspections are not fully meeting standards or actions are outstanding.`,
    );
  }

  if (overdueInspections > 0 && totalInspectionRecords > 0) {
    concerns.push(
      `${overdueInspections} safety inspection${overdueInspections !== 1 ? "s" : ""} overdue — delayed inspections mean safety issues may go undetected, increasing risk to children.`,
    );
  }

  if (overallIssueResolutionRate < 50 && totalIssues > 0) {
    concerns.push(
      `Only ${overallIssueResolutionRate}% of identified safety issues resolved — the majority of known defects across windows, blinds and curtains remain unresolved, creating persistent safety risks.`,
    );
  } else if (overallIssueResolutionRate < 70 && overallIssueResolutionRate >= 50 && totalIssues > 0) {
    concerns.push(
      `Issue resolution rate at ${overallIssueResolutionRate}% — a significant number of known defects remain unresolved.`,
    );
  }

  if (totalRestrictorRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No window restrictor check records exist despite children being on placement — the home cannot evidence that windows are safe and restrictors are functional.",
    );
  }

  if (totalBlindRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No blind cord safety records exist — the home cannot evidence that blind cord strangulation risk has been assessed and mitigated.",
    );
  }

  if (totalInspectionRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No formal safety inspection records exist — the home lacks evidence of systematic, scheduled window and blind safety inspections.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: WindowBlindCurtainRecommendation[] = [];
  let rank = 0;

  if (childAccessibleCords > 0 && totalBlindRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Eliminate all child-accessible blind cords immediately — replace corded blinds with cordless alternatives, fit breakaway cord connectors, or secure cords permanently out of children's reach. Blind cord strangulation is a foreseeable and preventable fatality risk.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (windowRestrictorRate < 50 && totalRestrictorRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently fit and repair window restrictors across all rooms — ensure every window accessible to children has a functional restrictor limiting opening to 100mm or less. Prioritise upper-floor windows where fall risk is greatest.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (upperFloorComplianceRate < 50 && upperFloorRecords.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address upper-floor window restrictor failures as a matter of immediate priority — upper-floor falls present severe injury or fatality risk. Every upper-floor window must have a functional, tested restrictor before children have unsupervised access.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (blindCordSafetyRate < 50 && totalBlindRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an emergency blind cord safety audit — replace non-compliant blinds with cord-free alternatives or fit approved safety devices to all remaining corded blinds. Document all actions taken.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (curtainsUnsuitable > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Replace all curtains rated as unsuitable immediately — unsuitable curtains may present fire, ligature, or hygiene risks and must be removed from children's rooms.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (fireRetardantRate < 50 && curtainsPresent.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Replace non-fire-retardant curtains with compliant alternatives — curtains that do not meet fire safety standards increase the speed of fire spread and risk to children's lives.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalRestrictorRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement immediate window restrictor checks for every window in the home — document restrictor type, functionality, and opening width. Prioritise upper-floor windows and rooms occupied by children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalBlindRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an immediate blind cord safety assessment for every blind in the home — document cord presence, accessibility, and safety measures in place. Eliminate or secure all cords.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (childSafeRailRate < 50 && curtainsPresent.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Install anti-ligature or breakaway curtain rails in all children's bedrooms and private spaces — standard curtain rails can be used as ligature points and must be replaced with child-safe alternatives.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (overallIssueResolutionRate < 50 && totalIssues > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Clear the backlog of unresolved window, blind and curtain safety issues — implement a tracking system with named owners and deadlines for each outstanding defect.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (windowRestrictorRate >= 50 && windowRestrictorRate < 70 && totalRestrictorRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve window restrictor compliance to at least 70% — systematically address non-compliant windows, focusing on rooms where children spend unsupervised time.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (blindCordSafetyRate >= 50 && blindCordSafetyRate < 70 && totalBlindRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve blind cord safety compliance to at least 70% — prioritise replacement of remaining corded blinds with cord-free alternatives in children's bedrooms.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (curtainConditionRate < 50 && curtainsPresent.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address widespread curtain condition issues — replace damaged, unhygienic, or unsafe curtains and ensure all new installations are fire retardant with secure, child-safe fittings.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (blackoutProvisionRate < 50 && totalBlackoutRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children's bedrooms have adequate blackout provision — effective blackout supports children's sleep quality and wellbeing, particularly during summer months.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Children's wellbeing",
    });
  }

  if (childNeedMetRate < 50 && childSpecificNeeds.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Meet all documented child-specific blackout needs immediately — where a child's care plan identifies a blackout requirement, failure to provide it represents a gap in individualised care.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (inspectionComplianceRate < 50 && totalInspectionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul the safety inspection regime — ensure inspections are completed on schedule, all identified actions are tracked to completion, and the home can evidence systematic premises safety management.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (overdueInspections > 0 && totalInspectionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue safety inspections without further delay — overdue inspections mean the home cannot evidence current safety compliance and defects may go undetected.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (totalInspectionRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a formal, scheduled inspection programme for window, blind and curtain safety — inspections should be routine, documented, and include actionable outcomes.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (curtainConditionRate >= 50 && curtainConditionRate < 70 && curtainsPresent.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve curtain condition compliance — address specific safety and condition shortfalls identified during checks and schedule regular curtain maintenance reviews.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (blackoutProvisionRate >= 50 && blackoutProvisionRate < 70 && totalBlackoutRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend blackout provision to all children's bedrooms — consider each child's preferences and sleep needs when selecting blackout solutions.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Children's wellbeing",
    });
  }

  if (seasonalReviewRate < 70 && totalBlackoutRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement seasonal reviews of blackout provision — light levels change significantly between seasons and blackout effectiveness should be reassessed accordingly.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Children's wellbeing",
    });
  }

  if (fireRetardantRate >= 50 && fireRetardantRate < 70 && curtainsPresent.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Replace remaining non-fire-retardant curtains during the next scheduled refurbishment cycle — prioritise children's bedrooms and communal areas.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (keySecurityRate < 70 && restrictorsFitted > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all restrictor keys are stored securely and accessible only to staff — children should not be able to override window safety measures.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: WindowBlindCurtainInsight[] = [];

  // -- Critical insights --

  if (childAccessibleCords > 0 && totalBlindRecords > 0) {
    insights.push({
      text: `${childAccessibleCords} blind cord${childAccessibleCords !== 1 ? "s" : ""} accessible to children. Blind cord strangulation is a leading cause of accidental death in young children. Every child-accessible cord represents an immediate, foreseeable fatality risk that Ofsted will regard as a fundamental premises safety failure under Reg 25.`,
      severity: "critical",
    });
  }

  if (windowRestrictorRate < 50 && totalRestrictorRecords > 0) {
    insights.push({
      text: `Only ${windowRestrictorRate}% window restrictor compliance. Window falls are a significant cause of serious injury to children. Non-functional or absent restrictors on windows accessible to children represent a direct breach of the home's duty to maintain safe premises under Reg 25.`,
      severity: "critical",
    });
  }

  if (upperFloorComplianceRate < 50 && upperFloorRecords.length > 0) {
    insights.push({
      text: `Only ${upperFloorComplianceRate}% of upper-floor windows are compliant. Falls from upper-floor windows can result in fatal or life-changing injuries. This is the highest-priority physical safety deficiency in the home and requires immediate rectification before any child has unsupervised access.`,
      severity: "critical",
    });
  }

  if (blindCordSafetyRate < 50 && totalBlindRecords > 0) {
    insights.push({
      text: `Only ${blindCordSafetyRate}% blind cord safety compliance. The majority of blinds in the home do not meet cord safety standards. Given that blind cord strangulation can occur in seconds, this pattern of non-compliance represents a systemic premises safety failure.`,
      severity: "critical",
    });
  }

  if (fireRetardantRate < 50 && curtainsPresent.length > 0) {
    insights.push({
      text: `Only ${fireRetardantRate}% of curtains are fire retardant. Non-fire-retardant curtains accelerate fire spread and increase the time available for safe evacuation. In a children's home where children may need additional support to evacuate, this is a critical fire safety deficiency.`,
      severity: "critical",
    });
  }

  if (childSafeRailRate < 50 && curtainsPresent.length > 0) {
    insights.push({
      text: `Only ${childSafeRailRate}% of curtain rails are child-safe. Standard curtain rails and poles can be used as ligature points. In residential childcare settings where some children may be at risk of self-harm, anti-ligature provisions are essential safety measures.`,
      severity: "critical",
    });
  }

  if (totalRestrictorRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No window restrictor check records exist despite children being on placement. Window restrictor checks are fundamental to premises safety under Reg 25. Without records, the home cannot demonstrate that windows are safe or that fall risks have been assessed and mitigated.",
      severity: "critical",
    });
  }

  if (totalBlindRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No blind cord safety records exist. Blind cords are a recognised strangulation hazard in settings where children live. The absence of any assessment records means the home has not evidenced that this foreseeable risk has been identified and managed.",
      severity: "critical",
    });
  }

  if (overallIssueResolutionRate < 50 && totalIssues > 0) {
    insights.push({
      text: `Only ${overallIssueResolutionRate}% of identified safety issues resolved. When known safety defects are left unresolved, the home is knowingly allowing children to be exposed to hazards. Ofsted will view unresolved safety issues as evidence of inadequate premises management.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (windowRestrictorRate >= 50 && windowRestrictorRate < 70 && totalRestrictorRecords > 0) {
    insights.push({
      text: `Window restrictor compliance at ${windowRestrictorRate}% — improving but not yet at the level expected. Some windows remain non-compliant, creating avoidable risk. Review which rooms require priority attention and track compliance improvements.`,
      severity: "warning",
    });
  }

  if (blindCordSafetyRate >= 50 && blindCordSafetyRate < 70 && totalBlindRecords > 0) {
    insights.push({
      text: `Blind cord safety compliance at ${blindCordSafetyRate}% — progress is being made but a significant proportion of blinds still present cord safety concerns. Accelerate the transition to cord-free alternatives where possible.`,
      severity: "warning",
    });
  }

  if (curtainConditionRate >= 50 && curtainConditionRate < 70 && curtainsPresent.length > 0) {
    insights.push({
      text: `Curtain condition compliance at ${curtainConditionRate}% — some curtains have condition or safety issues. Regular condition checks and timely replacement of worn curtains maintain both safety standards and living environment quality.`,
      severity: "warning",
    });
  }

  if (blackoutProvisionRate >= 50 && blackoutProvisionRate < 70 && totalBlackoutRecords > 0) {
    insights.push({
      text: `Blackout provision at ${blackoutProvisionRate}% — some children's rooms lack adequate blackout measures. Sleep quality research demonstrates that blackout provision significantly improves sleep onset, duration, and quality in children.`,
      severity: "warning",
    });
  }

  if (inspectionComplianceRate >= 50 && inspectionComplianceRate < 70 && totalInspectionRecords > 0) {
    insights.push({
      text: `Inspection compliance at ${inspectionComplianceRate}% — the inspection regime is partially effective but actions are not fully completed or inspections are not consistently achieving pass status. Strengthen the inspection-to-action loop.`,
      severity: "warning",
    });
  }

  if (overallIssueResolutionRate >= 50 && overallIssueResolutionRate < 70 && totalIssues > 0) {
    insights.push({
      text: `Issue resolution rate at ${overallIssueResolutionRate}% — some identified defects persist. Implement a formal maintenance request system with escalation paths for unresolved safety items.`,
      severity: "warning",
    });
  }

  if (childNeedMetRate >= 50 && childNeedMetRate < 70 && childSpecificNeeds.length > 0) {
    insights.push({
      text: `Only ${childNeedMetRate}% of child-specific blackout needs met — when a child's care plan identifies a need for blackout provision, failing to meet it represents a gap between documented need and delivered care.`,
      severity: "warning",
    });
  }

  if (seasonalReviewRate < 50 && totalBlackoutRecords > 0) {
    insights.push({
      text: `Only ${seasonalReviewRate}% of blackout provision has been seasonally reviewed. Light levels change dramatically between winter and summer, affecting whether existing blackout measures remain effective.`,
      severity: "warning",
    });
  }

  if (overdueInspections > 0 && totalInspectionRecords > 0) {
    insights.push({
      text: `${overdueInspections} safety inspection${overdueInspections !== 1 ? "s are" : " is"} overdue. Delayed inspections create a gap in safety assurance — hazards introduced since the last inspection may go undetected until an incident occurs.`,
      severity: "warning",
    });
  }

  if (fireRetardantRate >= 50 && fireRetardantRate < 70 && curtainsPresent.length > 0) {
    insights.push({
      text: `Fire retardant compliance at ${fireRetardantRate}% — while improving, a proportion of curtains still do not meet fire safety requirements. Prioritise replacement during refurbishment or when curtains reach end of life.`,
      severity: "warning",
    });
  }

  if (keySecurityRate < 70 && restrictorsFitted > 0) {
    insights.push({
      text: `Key security rate at ${keySecurityRate}% — some restrictor keys may be accessible to children, potentially allowing them to override window safety measures. Review key storage procedures and staff awareness.`,
      severity: "warning",
    });
  }

  // Restrictor type analysis
  const restrictorTypes: Record<string, number> = {};
  for (const r of window_restrictor_records) {
    const label = r.restrictor_type.replace(/_/g, " ");
    restrictorTypes[label] = (restrictorTypes[label] ?? 0) + 1;
  }
  const topTypes = Object.entries(restrictorTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topTypes.length > 1) {
    const formatted = topTypes
      .map(([type, count]) => `${type} (${count})`)
      .join(", ");
    insights.push({
      text: `Restrictor types in use: ${formatted}. A mix of restrictor types is common but consistency aids staff familiarity and maintenance planning. Consider standardising on a single approved type during replacement cycles.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (window_safety_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding window, blind and curtain safety — restrictors are compliant, blind cords are eliminated or secured, curtains meet safety and condition standards, blackout provision supports children's sleep, and inspections evidence systematic premises safety management. This is strong evidence for Reg 25 compliance.",
      severity: "positive",
    });
  }

  if (windowRestrictorRate >= 90 && totalRestrictorRecords > 0) {
    insights.push({
      text: `${windowRestrictorRate}% window restrictor compliance — the home maintains excellent fall prevention measures. Functional, tested restrictors on all windows demonstrate that children's physical safety is prioritised and premises are maintained to the required standard.`,
      severity: "positive",
    });
  }

  if (blindCordSafetyRate >= 90 && totalBlindRecords > 0) {
    insights.push({
      text: `${blindCordSafetyRate}% blind cord safety compliance — the home has effectively eliminated or mitigated blind cord strangulation risk. This reflects proactive, child-centred premises management that Ofsted expects under Reg 25.`,
      severity: "positive",
    });
  }

  if (childAccessibleCords === 0 && cordFreeRate >= 90 && totalBlindRecords > 0) {
    insights.push({
      text: `Zero child-accessible cords with ${cordFreeRate}% cord-free blinds — the home has taken the best-practice approach of eliminating cords entirely rather than relying on secondary safety devices. This represents exemplary child safety practice.`,
      severity: "positive",
    });
  }

  if (curtainConditionRate >= 90 && curtainsPresent.length > 0) {
    insights.push({
      text: `${curtainConditionRate}% curtain condition compliance — curtains throughout the home are clean, intact, safely fitted, fire retardant, and maintained to a high standard. This contributes to both safety and a homely, well-maintained living environment.`,
      severity: "positive",
    });
  }

  if (inspectionComplianceRate >= 90 && totalInspectionRecords > 0) {
    insights.push({
      text: `${inspectionComplianceRate}% inspection compliance — the home's systematic inspection programme evidences proactive premises safety management. Regular inspections with completed actions demonstrate continuous monitoring and improvement.`,
      severity: "positive",
    });
  }

  if (childSafetyRate >= 90 && childSafetyDenominator > 0) {
    insights.push({
      text: `${childSafetyRate}% composite child safety rate — the home achieves excellent scores across upper-floor window compliance, blind cord elimination, child-safe curtain rails, and individualised blackout provision. Children's specific safety needs are being met comprehensively.`,
      severity: "positive",
    });
  }

  if (overallIssueResolutionRate >= 90 && totalIssues > 0) {
    insights.push({
      text: `${overallIssueResolutionRate}% of identified safety issues resolved — the home responds promptly and effectively to safety defects, demonstrating that premises maintenance supports children's safety rather than allowing risks to persist.`,
      severity: "positive",
    });
  }

  if (blackoutProvisionRate >= 90 && blackoutEffectivenessRate >= 90 && totalBlackoutRecords > 0) {
    insights.push({
      text: `${blackoutProvisionRate}% blackout provision with ${blackoutEffectivenessRate}% effectiveness — children's bedrooms are well-equipped to support quality sleep through effective light management, contributing to health and wellbeing outcomes.`,
      severity: "positive",
    });
  }

  if (childNeedMetRate >= 90 && childSpecificNeeds.length > 0) {
    insights.push({
      text: `${childNeedMetRate}% of child-specific blackout needs met — the home delivers individualised environmental adjustments that respond to each child's documented requirements, evidencing personalised care delivery.`,
      severity: "positive",
    });
  }

  if (
    overdueInspections === 0 &&
    inspectionPassRate >= 90 &&
    totalInspectionRecords > 0
  ) {
    insights.push({
      text: `No overdue inspections and ${inspectionPassRate}% pass rate — the home maintains an exemplary inspection schedule with consistently positive outcomes, demonstrating that safety standards are sustained between inspections.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (window_safety_rating === "outstanding") {
    headline =
      "Outstanding window, blind and curtain safety — restrictors are compliant, cord risks eliminated, curtains well maintained, and inspections evidence systematic premises safety management.";
  } else if (window_safety_rating === "good") {
    headline = `Good window, blind and curtain safety — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (window_safety_rating === "adequate") {
    headline = `Adequate window, blind and curtain safety — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's physical safety is maintained.`;
  } else {
    headline = `Window, blind and curtain safety is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to meet Reg 25 premises safety requirements.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    window_safety_rating,
    window_safety_score: score,
    headline,
    total_restrictor_records: totalRestrictorRecords,
    total_blind_records: totalBlindRecords,
    total_curtain_records: totalCurtainRecords,
    total_blackout_records: totalBlackoutRecords,
    total_inspection_records: totalInspectionRecords,
    window_restrictor_rate: windowRestrictorRate,
    blind_cord_safety_rate: blindCordSafetyRate,
    curtain_condition_rate: curtainConditionRate,
    blackout_provision_rate: blackoutProvisionRate,
    child_safety_rate: childSafetyRate,
    inspection_compliance_rate: inspectionComplianceRate,
    window_restrictor_records,
    blind_cord_records,
    curtain_condition_records,
    blackout_records,
    inspection_records,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
