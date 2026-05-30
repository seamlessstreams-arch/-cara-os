// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FIRST AID KIT & MEDICAL SUPPLIES INTELLIGENCE ENGINE
// Monitors first aid kit checks, medical supply stock adequacy, expiry date
// monitoring, kit accessibility and location compliance, staff first aid
// training currency, and children's awareness of first aid arrangements.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 14 (Arrangements for health), Reg 25 (Premises and safety).
// SCCIF: "Children are safe" — safety domain, first aid provision.
// Store keys: kitCheckRecords, stockRecords, expiryRecords,
//             accessibilityRecords, trainingRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface KitCheckInput {
  id: string;
  kit_id: string;
  kit_name: string;
  kit_location: string;
  check_date: string;
  checked_by: string;
  check_type: "routine" | "monthly" | "quarterly" | "post_incident" | "restock";
  all_items_present: boolean;
  items_missing: number;
  items_damaged: number;
  items_replaced: number;
  seal_intact: boolean;
  cleanliness_acceptable: boolean;
  signage_visible: boolean;
  check_documented: boolean;
  issues_found: number;
  issues_resolved: number;
  next_check_due: string | null;
  check_overdue: boolean;
  created_at: string;
}

export interface StockInput {
  id: string;
  item_name: string;
  item_category: "bandages" | "dressings" | "antiseptic" | "medication" | "equipment" | "ppe" | "burns" | "eye_wash" | "other";
  kit_id: string;
  required_quantity: number;
  current_quantity: number;
  minimum_threshold: number;
  reorder_placed: boolean;
  reorder_date: string | null;
  supplier_name: string;
  unit_cost: number;
  last_audit_date: string;
  audit_matched_records: boolean;
  is_critical_item: boolean;
  created_at: string;
}

export interface ExpiryInput {
  id: string;
  item_name: string;
  item_category: string;
  kit_id: string;
  batch_number: string;
  expiry_date: string;
  is_expired: boolean;
  days_until_expiry: number;
  replacement_ordered: boolean;
  replacement_received: boolean;
  disposed_correctly: boolean;
  flagged_in_check: boolean;
  created_at: string;
}

export interface AccessibilityInput {
  id: string;
  kit_id: string;
  kit_name: string;
  location: string;
  floor_level: string;
  is_accessible_24hr: boolean;
  is_clearly_signed: boolean;
  is_wall_mounted: boolean;
  is_unlocked: boolean;
  distance_from_main_area_metres: number;
  last_location_audit_date: string;
  location_compliant: boolean;
  children_know_location: boolean;
  staff_know_location: boolean;
  visitors_informed: boolean;
  meets_hse_guidance: boolean;
  created_at: string;
}

export interface TrainingInput {
  id: string;
  staff_id: string;
  staff_name: string;
  training_type: "first_aid_at_work" | "emergency_first_aid" | "paediatric_first_aid" | "mental_health_first_aid" | "anaphylaxis" | "epilepsy" | "asthma" | "refresher";
  provider: string;
  certification_date: string;
  expiry_date: string;
  is_expired: boolean;
  days_until_expiry: number;
  is_current: boolean;
  is_paediatric_qualified: boolean;
  refresher_completed: boolean;
  practical_assessment_passed: boolean;
  created_at: string;
}

// ── Main Input ──────────────────────────────────────────────────────────────

export interface FirstAidKitMedicalSuppliesInput {
  today: string;
  total_children: number;
  total_staff: number;
  kit_check_records: KitCheckInput[];
  stock_records: StockInput[];
  expiry_records: ExpiryInput[];
  accessibility_records: AccessibilityInput[];
  training_records: TrainingInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type FirstAidKitRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface FirstAidKitInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface FirstAidKitRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface FirstAidKitMedicalSuppliesResult {
  first_aid_rating: FirstAidKitRating;
  first_aid_score: number;
  headline: string;
  total_kits: number;
  total_stock_items: number;
  total_expiry_items: number;
  total_trained_staff: number;
  kit_check_rate: number;
  stock_adequacy_rate: number;
  expiry_monitoring_rate: number;
  accessibility_rate: number;
  staff_training_rate: number;
  child_awareness_rate: number;
  critical_stock_adequacy_rate: number;
  expired_items_count: number;
  near_expiry_items_count: number;
  paediatric_trained_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: FirstAidKitRecommendation[];
  insights: FirstAidKitInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): FirstAidKitRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: FirstAidKitRating,
  score: number,
  headline: string,
): FirstAidKitMedicalSuppliesResult {
  return {
    first_aid_rating: rating,
    first_aid_score: score,
    headline,
    total_kits: 0,
    total_stock_items: 0,
    total_expiry_items: 0,
    total_trained_staff: 0,
    kit_check_rate: 0,
    stock_adequacy_rate: 0,
    expiry_monitoring_rate: 0,
    accessibility_rate: 0,
    staff_training_rate: 0,
    child_awareness_rate: 0,
    critical_stock_adequacy_rate: 0,
    expired_items_count: 0,
    near_expiry_items_count: 0,
    paediatric_trained_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeFirstAidKitMedicalSupplies(
  input: FirstAidKitMedicalSuppliesInput,
): FirstAidKitMedicalSuppliesResult {
  const {
    total_children,
    total_staff,
    kit_check_records,
    stock_records,
    expiry_records,
    accessibility_records,
    training_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    kit_check_records.length === 0 &&
    stock_records.length === 0 &&
    expiry_records.length === 0 &&
    accessibility_records.length === 0 &&
    training_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess first aid kit and medical supplies provision.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No first aid kit checks, stock records, expiry monitoring, accessibility audits, or staff training records exist despite children on placement — first aid provision requires urgent attention.",
      ),
      concerns: [
        "No first aid kit checks, medical supply stock records, expiry monitoring, accessibility audits, or staff first aid training records exist despite children being on placement — the home cannot evidence safe and compliant first aid provision.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement an immediate first aid kit audit programme — every kit must be checked, contents verified, expiry dates logged, and accessibility confirmed to meet the duty to safeguard children's health under Reg 14.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
        },
        {
          rank: 2,
          recommendation:
            "Ensure all staff hold current, valid first aid qualifications including paediatric first aid — the home must have sufficient trained first aiders to respond to emergencies at all times.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
        },
      ],
      insights: [
        {
          text: "The complete absence of first aid and medical supply records means the home cannot demonstrate that children have access to safe, well-stocked, and properly maintained first aid provision. Ofsted expects robust evidence of first aid arrangements under Reg 14 and Reg 25, and the lack of any records represents a fundamental compliance failure.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Kit check rate ---
  // Unique kits that have been checked
  const uniqueKitsChecked = new Set(kit_check_records.map((k) => k.kit_id));
  const totalUniqueKits = uniqueKitsChecked.size;

  const totalChecks = kit_check_records.length;
  const checksWithAllPresent = kit_check_records.filter(
    (k) => k.all_items_present,
  ).length;
  const checksDocumented = kit_check_records.filter(
    (k) => k.check_documented,
  ).length;
  const checkDocumentationRate = pct(checksDocumented, totalChecks);

  const checksWithSealIntact = kit_check_records.filter(
    (k) => k.seal_intact,
  ).length;
  const sealIntactRate = pct(checksWithSealIntact, totalChecks);

  const checksWithCleanKit = kit_check_records.filter(
    (k) => k.cleanliness_acceptable,
  ).length;
  const cleanlinessRate = pct(checksWithCleanKit, totalChecks);

  const checksWithVisibleSignage = kit_check_records.filter(
    (k) => k.signage_visible,
  ).length;
  const signageRate = pct(checksWithVisibleSignage, totalChecks);

  const overdueChecks = kit_check_records.filter(
    (k) => k.check_overdue,
  ).length;
  const kitCheckOverdueCount = overdueChecks;

  const totalIssuesFound = kit_check_records.reduce(
    (sum, k) => sum + k.issues_found,
    0,
  );
  const totalIssuesResolved = kit_check_records.reduce(
    (sum, k) => sum + k.issues_resolved,
    0,
  );
  const issueResolutionRate = pct(totalIssuesResolved, totalIssuesFound);

  const totalItemsMissing = kit_check_records.reduce(
    (sum, k) => sum + k.items_missing,
    0,
  );
  const totalItemsDamaged = kit_check_records.reduce(
    (sum, k) => sum + k.items_damaged,
    0,
  );
  const totalItemsReplaced = kit_check_records.reduce(
    (sum, k) => sum + k.items_replaced,
    0,
  );

  // Kit check rate: percentage of checks where all items present and documented
  const compliantChecks = kit_check_records.filter(
    (k) => k.all_items_present && k.check_documented,
  ).length;
  const kitCheckRate = pct(compliantChecks, totalChecks);

  // --- Stock adequacy rate ---
  const totalStockItems = stock_records.length;
  const stockItemsAdequate = stock_records.filter(
    (s) => s.current_quantity >= s.minimum_threshold,
  ).length;
  const stockAdequacyRate = pct(stockItemsAdequate, totalStockItems);

  const criticalItems = stock_records.filter((s) => s.is_critical_item);
  const criticalItemsAdequate = criticalItems.filter(
    (s) => s.current_quantity >= s.minimum_threshold,
  ).length;
  const criticalStockAdequacyRate = pct(
    criticalItemsAdequate,
    criticalItems.length,
  );

  const stockBelowMinimum = stock_records.filter(
    (s) => s.current_quantity < s.minimum_threshold,
  ).length;
  const criticalStockBelowMinimum = criticalItems.filter(
    (s) => s.current_quantity < s.minimum_threshold,
  ).length;

  const stockAuditMatched = stock_records.filter(
    (s) => s.audit_matched_records,
  ).length;
  const stockAuditAccuracyRate = pct(stockAuditMatched, totalStockItems);

  const reordersPending = stock_records.filter(
    (s) => s.current_quantity < s.minimum_threshold && !s.reorder_placed,
  ).length;

  // Items completely out of stock
  const outOfStockItems = stock_records.filter(
    (s) => s.current_quantity === 0,
  ).length;
  const criticalOutOfStock = criticalItems.filter(
    (s) => s.current_quantity === 0,
  ).length;

  // --- Expiry monitoring rate ---
  const totalExpiryItems = expiry_records.length;
  const expiredItems = expiry_records.filter((e) => e.is_expired).length;
  const nearExpiryItems = expiry_records.filter(
    (e) => !e.is_expired && e.days_until_expiry <= 30,
  ).length;
  const validExpiryItems = expiry_records.filter(
    (e) => !e.is_expired && e.days_until_expiry > 30,
  ).length;

  // Items expired but not yet replaced
  const expiredNotReplaced = expiry_records.filter(
    (e) => e.is_expired && !e.replacement_received,
  ).length;
  const expiredAndDisposed = expiry_records.filter(
    (e) => e.is_expired && e.disposed_correctly,
  ).length;
  const expiredDisposalRate = pct(
    expiredAndDisposed,
    expiredItems,
  );

  const expiredFlaggedInCheck = expiry_records.filter(
    (e) => e.is_expired && e.flagged_in_check,
  ).length;
  const expiryDetectionRate = pct(expiredFlaggedInCheck, expiredItems);

  const replacementsOrdered = expiry_records.filter(
    (e) => (e.is_expired || e.days_until_expiry <= 30) && e.replacement_ordered,
  ).length;
  const totalNeedingReplacement = expiredItems + nearExpiryItems;
  const replacementOrderRate = pct(replacementsOrdered, totalNeedingReplacement);

  // Expiry monitoring rate: percentage of items that are not expired
  const expiryMonitoringRate =
    totalExpiryItems > 0 ? pct(totalExpiryItems - expiredItems, totalExpiryItems) : 0;

  // --- Accessibility rate ---
  const totalAccessibilityAudits = accessibility_records.length;
  const accessibleKits = accessibility_records.filter(
    (a) => a.is_accessible_24hr,
  ).length;
  const signedKits = accessibility_records.filter(
    (a) => a.is_clearly_signed,
  ).length;
  const unlockedKits = accessibility_records.filter(
    (a) => a.is_unlocked,
  ).length;
  const locationCompliantKits = accessibility_records.filter(
    (a) => a.location_compliant,
  ).length;
  const meetsHseKits = accessibility_records.filter(
    (a) => a.meets_hse_guidance,
  ).length;
  const childrenKnowLocation = accessibility_records.filter(
    (a) => a.children_know_location,
  ).length;
  const staffKnowLocation = accessibility_records.filter(
    (a) => a.staff_know_location,
  ).length;
  const visitorsInformed = accessibility_records.filter(
    (a) => a.visitors_informed,
  ).length;

  // Full accessibility: accessible 24hr, clearly signed, unlocked, location compliant
  const fullyAccessibleKits = accessibility_records.filter(
    (a) =>
      a.is_accessible_24hr &&
      a.is_clearly_signed &&
      a.is_unlocked &&
      a.location_compliant,
  ).length;
  const accessibilityRate = pct(fullyAccessibleKits, totalAccessibilityAudits);

  const hseComplianceRate = pct(meetsHseKits, totalAccessibilityAudits);

  const staffLocationAwarenessRate = pct(
    staffKnowLocation,
    totalAccessibilityAudits,
  );

  // Child awareness rate: children know where the kits are
  const childAwarenessRate = pct(childrenKnowLocation, totalAccessibilityAudits);

  // Average distance from main area
  const totalDistance = accessibility_records.reduce(
    (sum, a) => sum + a.distance_from_main_area_metres,
    0,
  );
  const avgDistanceMetres =
    totalAccessibilityAudits > 0
      ? Math.round((totalDistance / totalAccessibilityAudits) * 10) / 10
      : 0;

  // Kits too far from main area (> 50 metres)
  const kitsTooFar = accessibility_records.filter(
    (a) => a.distance_from_main_area_metres > 50,
  ).length;

  // --- Staff training rate ---
  const totalTrainingRecords = training_records.length;
  const uniqueTrainedStaff = new Set(
    training_records.map((t) => t.staff_id),
  ).size;
  const currentTraining = training_records.filter(
    (t) => t.is_current,
  ).length;
  const expiredTraining = training_records.filter(
    (t) => t.is_expired,
  ).length;
  const nearExpiryTraining = training_records.filter(
    (t) => !t.is_expired && t.days_until_expiry <= 60,
  ).length;

  // Staff training rate: percentage of staff with current training
  const uniqueStaffWithCurrentTraining = new Set(
    training_records
      .filter((t) => t.is_current)
      .map((t) => t.staff_id),
  ).size;
  const staffTrainingRate =
    total_staff > 0 ? pct(uniqueStaffWithCurrentTraining, total_staff) : 0;

  // Paediatric first aid qualified
  const paediatricQualified = training_records.filter(
    (t) => t.is_paediatric_qualified && t.is_current,
  ).length;
  const uniquePaediatricStaff = new Set(
    training_records
      .filter((t) => t.is_paediatric_qualified && t.is_current)
      .map((t) => t.staff_id),
  ).size;
  const paediatricTrainedRate =
    total_staff > 0 ? pct(uniquePaediatricStaff, total_staff) : 0;

  // Refresher compliance
  const refreshersNeeded = training_records.filter(
    (t) => t.is_current && !t.refresher_completed,
  ).length;
  const refreshersCompleted = training_records.filter(
    (t) => t.refresher_completed,
  ).length;
  const refresherComplianceRate = pct(
    refreshersCompleted,
    training_records.filter((t) => t.is_current).length,
  );

  // Practical assessment pass rate
  const practicalAssessmentsPassed = training_records.filter(
    (t) => t.practical_assessment_passed,
  ).length;
  const practicalPassRate = pct(practicalAssessmentsPassed, totalTrainingRecords);

  // Training type distribution
  const trainingTypeCounts: Record<string, number> = {};
  for (const t of training_records.filter((t) => t.is_current)) {
    trainingTypeCounts[t.training_type] =
      (trainingTypeCounts[t.training_type] ?? 0) + 1;
  }

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: kitCheckRate (>=95: +5, >=80: +3, >=60: +1) ---
  if (kitCheckRate >= 95) score += 5;
  else if (kitCheckRate >= 80) score += 3;
  else if (kitCheckRate >= 60) score += 1;

  // --- Bonus 2: stockAdequacyRate (>=95: +5, >=80: +3, >=60: +1) ---
  if (stockAdequacyRate >= 95) score += 5;
  else if (stockAdequacyRate >= 80) score += 3;
  else if (stockAdequacyRate >= 60) score += 1;

  // --- Bonus 3: expiryMonitoringRate (>=98: +5, >=90: +3, >=75: +1) ---
  if (expiryMonitoringRate >= 98) score += 5;
  else if (expiryMonitoringRate >= 90) score += 3;
  else if (expiryMonitoringRate >= 75) score += 1;

  // --- Bonus 4: accessibilityRate (>=100: +4, >=80: +2) ---
  if (accessibilityRate >= 100) score += 4;
  else if (accessibilityRate >= 80) score += 2;

  // --- Bonus 5: staffTrainingRate (>=100: +4, >=80: +2) ---
  if (staffTrainingRate >= 100) score += 4;
  else if (staffTrainingRate >= 80) score += 2;

  // --- Bonus 6: childAwarenessRate (>=90: +3, >=70: +1) ---
  if (childAwarenessRate >= 90) score += 3;
  else if (childAwarenessRate >= 70) score += 1;

  // --- Bonus 7: paediatricTrainedRate (>=80: +2) ---
  if (paediatricTrainedRate >= 80) score += 2;

  // max bonuses = 5+5+5+4+4+3+2 = 28

  // ── Penalties ─────────────────────────────────────────────────────────

  // Penalty 1: kitCheckRate < 50 and checks exist → -5
  if (kitCheckRate < 50 && totalChecks > 0) score -= 5;

  // Penalty 2: expiredItems > 0 and critical stock below minimum → -5
  if (expiredItems > 0 && criticalStockBelowMinimum > 0) score -= 5;

  // Penalty 3: staffTrainingRate < 50 and staff exist → -4
  if (staffTrainingRate < 50 && total_staff > 0) score -= 4;

  // Penalty 4: accessibilityRate < 50 and audits exist → -4
  if (accessibilityRate < 50 && totalAccessibilityAudits > 0) score -= 4;

  score = clamp(score, 0, 100);

  const first_aid_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (kitCheckRate >= 95 && totalChecks > 0) {
    strengths.push(
      "First aid kit checks are exemplary — all kits are fully stocked, documented, and maintained to the highest standard, ensuring children have reliable access to first aid provision at all times.",
    );
  } else if (kitCheckRate >= 80 && totalChecks > 0) {
    strengths.push(
      `${kitCheckRate}% of kit checks are fully compliant — the home maintains strong first aid kit checking practice with consistent documentation.`,
    );
  } else if (kitCheckRate >= 60 && totalChecks > 0) {
    strengths.push(
      `${kitCheckRate}% kit check compliance — the home demonstrates regular first aid kit monitoring, though some checks identify gaps.`,
    );
  }

  if (stockAdequacyRate >= 95 && totalStockItems > 0) {
    strengths.push(
      "Medical supply stock is exceptionally well managed — all items are at or above minimum threshold levels, demonstrating proactive stock management that ensures readiness for emergencies.",
    );
  } else if (stockAdequacyRate >= 80 && totalStockItems > 0) {
    strengths.push(
      `${stockAdequacyRate}% stock adequacy — the home maintains good medical supply levels with the majority of items above minimum thresholds.`,
    );
  }

  if (criticalStockAdequacyRate >= 100 && criticalItems.length > 0) {
    strengths.push(
      "All critical medical supply items are fully stocked — the home prioritises the availability of essential items that may be needed in a medical emergency.",
    );
  } else if (criticalStockAdequacyRate >= 90 && criticalItems.length > 0) {
    strengths.push(
      `${criticalStockAdequacyRate}% critical item stock adequacy — essential medical supplies are well maintained with very few items below threshold.`,
    );
  }

  if (expiryMonitoringRate >= 98 && totalExpiryItems > 0) {
    strengths.push(
      "Outstanding expiry monitoring — virtually all medical supplies are within their use-by dates, demonstrating rigorous expiry management that protects children from ineffective or unsafe products.",
    );
  } else if (expiryMonitoringRate >= 90 && totalExpiryItems > 0) {
    strengths.push(
      `${expiryMonitoringRate}% of medical supplies within date — strong expiry monitoring ensures the vast majority of items are safe and effective.`,
    );
  }

  if (accessibilityRate >= 100 && totalAccessibilityAudits > 0) {
    strengths.push(
      "Every first aid kit meets full accessibility standards — all kits are accessible 24 hours, clearly signed, unlocked, and in compliant locations, ensuring immediate access in emergencies.",
    );
  } else if (accessibilityRate >= 80 && totalAccessibilityAudits > 0) {
    strengths.push(
      `${accessibilityRate}% of first aid kits meet full accessibility standards — the home ensures strong accessibility for the majority of its kits.`,
    );
  }

  if (staffTrainingRate >= 100 && total_staff > 0) {
    strengths.push(
      "Every member of staff holds current first aid training — the home has complete coverage ensuring a trained first aider is always available to respond to children's medical needs.",
    );
  } else if (staffTrainingRate >= 80 && total_staff > 0) {
    strengths.push(
      `${staffTrainingRate}% of staff have current first aid training — strong training coverage means a trained first aider is almost always available on shift.`,
    );
  }

  if (paediatricTrainedRate >= 80 && total_staff > 0) {
    strengths.push(
      `${paediatricTrainedRate}% of staff are paediatric first aid qualified — excellent coverage of age-appropriate first aid skills tailored to working with children and young people.`,
    );
  } else if (paediatricTrainedRate >= 50 && total_staff > 0) {
    strengths.push(
      `${paediatricTrainedRate}% paediatric first aid coverage — a good proportion of staff hold paediatric-specific qualifications relevant to the children's home context.`,
    );
  }

  if (childAwarenessRate >= 90 && totalAccessibilityAudits > 0) {
    strengths.push(
      `${childAwarenessRate}% of children know where first aid kits are located — outstanding awareness ensures children can direct staff or access help quickly in an emergency.`,
    );
  } else if (childAwarenessRate >= 70 && totalAccessibilityAudits > 0) {
    strengths.push(
      `${childAwarenessRate}% child awareness of first aid kit locations — good practice in ensuring children know where to find first aid provision.`,
    );
  }

  if (hseComplianceRate >= 100 && totalAccessibilityAudits > 0) {
    strengths.push(
      "All first aid kit locations meet HSE guidance — the home's first aid provision fully complies with Health and Safety Executive requirements for workplace first aid.",
    );
  } else if (hseComplianceRate >= 80 && totalAccessibilityAudits > 0) {
    strengths.push(
      `${hseComplianceRate}% HSE compliance for kit locations — the home demonstrates strong adherence to health and safety guidance for first aid provision.`,
    );
  }

  if (checkDocumentationRate >= 95 && totalChecks > 0) {
    strengths.push(
      "Kit check documentation is exemplary — nearly all checks are fully documented, providing a robust audit trail that evidences the home's commitment to first aid safety.",
    );
  }

  if (issueResolutionRate >= 90 && totalIssuesFound > 0) {
    strengths.push(
      `${issueResolutionRate}% of issues identified during kit checks have been resolved — the home acts promptly to address problems, maintaining kit readiness.`,
    );
  }

  if (stockAuditAccuracyRate >= 95 && totalStockItems > 0) {
    strengths.push(
      `${stockAuditAccuracyRate}% stock audit accuracy — physical stock matches records, demonstrating reliable inventory management.`,
    );
  }

  if (refresherComplianceRate >= 90 && currentTraining > 0) {
    strengths.push(
      `${refresherComplianceRate}% refresher training compliance — staff maintain first aid skills through regular refresher training.`,
    );
  }

  if (staffLocationAwarenessRate >= 100 && totalAccessibilityAudits > 0) {
    strengths.push(
      "All staff know every first aid kit location — comprehensive awareness ensures rapid response capability.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (kitCheckRate < 50 && totalChecks > 0) {
    concerns.push(
      `Only ${kitCheckRate}% of first aid kit checks are fully compliant — the majority of checks reveal missing items or lack documentation, meaning the home cannot evidence that kits are reliably maintained and ready for use.`,
    );
  } else if (kitCheckRate < 80 && kitCheckRate >= 50 && totalChecks > 0) {
    concerns.push(
      `Kit check compliance at ${kitCheckRate}% — a significant proportion of kit checks identify missing items or incomplete documentation, raising questions about the reliability of first aid provision.`,
    );
  }

  if (stockAdequacyRate < 50 && totalStockItems > 0) {
    concerns.push(
      `Only ${stockAdequacyRate}% of medical supply items are at adequate stock levels — the majority of items are below minimum thresholds, creating serious risks if multiple first aid incidents occur simultaneously.`,
    );
  } else if (stockAdequacyRate < 80 && stockAdequacyRate >= 50 && totalStockItems > 0) {
    concerns.push(
      `Stock adequacy at ${stockAdequacyRate}% — a notable proportion of medical supplies are below minimum thresholds, which may compromise the home's ability to respond to first aid needs.`,
    );
  }

  if (criticalStockBelowMinimum > 0) {
    concerns.push(
      `${criticalStockBelowMinimum} critical medical supply item${criticalStockBelowMinimum !== 1 ? "s are" : " is"} below minimum stock levels — critical items are essential for emergency response and must be maintained above threshold at all times.`,
    );
  }

  if (criticalOutOfStock > 0) {
    concerns.push(
      `${criticalOutOfStock} critical medical supply item${criticalOutOfStock !== 1 ? "s are" : " is"} completely out of stock — this represents an immediate risk to children's safety as essential emergency supplies are unavailable.`,
    );
  }

  if (outOfStockItems > 0 && outOfStockItems > criticalOutOfStock) {
    concerns.push(
      `${outOfStockItems} medical supply item${outOfStockItems !== 1 ? "s are" : " is"} completely out of stock — any depleted item reduces the home's first aid capability.`,
    );
  }

  if (expiredItems > 0) {
    concerns.push(
      `${expiredItems} medical supply item${expiredItems !== 1 ? "s have" : " has"} passed ${expiredItems !== 1 ? "their" : "its"} expiry date — expired items must be removed and replaced immediately.`,
    );
  }

  if (nearExpiryItems >= 3) {
    concerns.push(
      `${nearExpiryItems} item${nearExpiryItems !== 1 ? "s" : ""} within 30 days of expiry — proactive replacement needed to prevent items expiring in active kits.`,
    );
  }

  if (expiredNotReplaced > 0) {
    concerns.push(
      `${expiredNotReplaced} expired item${expiredNotReplaced !== 1 ? "s" : ""} not yet replaced — expired items must be replaced promptly to maintain kit readiness.`,
    );
  }

  if (accessibilityRate < 50 && totalAccessibilityAudits > 0) {
    concerns.push(
      `Only ${accessibilityRate}% of first aid kits meet full accessibility standards — the majority of kits fail to meet basic requirements for 24-hour access, clear signage, or appropriate location, potentially delaying emergency response.`,
    );
  } else if (accessibilityRate < 80 && accessibilityRate >= 50 && totalAccessibilityAudits > 0) {
    concerns.push(
      `Accessibility rate at ${accessibilityRate}% — some first aid kits do not meet full accessibility standards, which could impede rapid access during emergencies.`,
    );
  }

  if (staffTrainingRate < 50 && total_staff > 0) {
    concerns.push(
      `Only ${staffTrainingRate}% of staff have current first aid training — the home may have insufficient trained first aiders available on shift, creating a significant risk that no qualified responder is available during a medical emergency.`,
    );
  } else if (staffTrainingRate < 80 && staffTrainingRate >= 50 && total_staff > 0) {
    concerns.push(
      `Staff training coverage at ${staffTrainingRate}% — gaps in first aid training mean some shifts may lack a trained first aider, compromising the home's emergency response capacity.`,
    );
  }

  if (paediatricTrainedRate < 30 && total_staff > 0 && totalTrainingRecords > 0) {
    concerns.push(
      `Only ${paediatricTrainedRate}% of staff have paediatric first aid qualifications — given the home cares for children, a higher proportion of paediatric-trained staff is essential to respond appropriately to children's specific medical needs.`,
    );
  }

  if (childAwarenessRate < 50 && totalAccessibilityAudits > 0) {
    concerns.push(
      `Only ${childAwarenessRate}% of children know where first aid kits are located — children must be aware of where to find or direct others to first aid provision, particularly in situations where they may need to seek help independently.`,
    );
  } else if (childAwarenessRate < 70 && childAwarenessRate >= 50 && totalAccessibilityAudits > 0) {
    concerns.push(
      `Child awareness of kit locations at ${childAwarenessRate}% — not all children know where first aid kits are located, reducing their ability to access or direct others to help.`,
    );
  }

  if (kitCheckOverdueCount > 0) {
    concerns.push(
      `${kitCheckOverdueCount} first aid kit check${kitCheckOverdueCount !== 1 ? "s are" : " is"} overdue — without regular checks, kits may contain missing, damaged, or expired items that compromise readiness.`,
    );
  }

  if (expiredTraining > 0) {
    concerns.push(
      `${expiredTraining} staff first aid training record${expiredTraining !== 1 ? "s have" : " has"} expired — staff with expired qualifications cannot be counted as trained first aiders and may not have the current skills needed for effective emergency response.`,
    );
  }

  if (nearExpiryTraining > 0) {
    concerns.push(
      `${nearExpiryTraining} staff training qualification${nearExpiryTraining !== 1 ? "s are" : " is"} due to expire within 60 days — renewal must be arranged promptly to maintain coverage.`,
    );
  }

  if (reordersPending > 0) {
    concerns.push(
      `${reordersPending} stock item${reordersPending !== 1 ? "s are" : " is"} below minimum threshold with no reorder placed — without timely reordering, stock depletion will continue to worsen.`,
    );
  }

  if (kitsTooFar > 0) {
    concerns.push(
      `${kitsTooFar} first aid kit${kitsTooFar !== 1 ? "s are" : " is"} located more than 50 metres from the main living area — excessive distance may delay access during emergencies and does not align with HSE guidance on kit proximity.`,
    );
  }

  if (stockAuditAccuracyRate < 70 && totalStockItems > 0) {
    concerns.push(
      `Stock audit accuracy at only ${stockAuditAccuracyRate}% — physical stock does not match records for a significant proportion of items, indicating poor inventory management that may mask actual shortages.`,
    );
  }

  if (checkDocumentationRate < 70 && totalChecks > 0) {
    concerns.push(
      `Only ${checkDocumentationRate}% of kit checks are documented — undocumented checks cannot evidence compliance and leave the home unable to demonstrate systematic first aid maintenance to inspectors.`,
    );
  }

  if (issueResolutionRate < 50 && totalIssuesFound > 0) {
    concerns.push(
      `Only ${issueResolutionRate}% of issues found during kit checks have been resolved — outstanding issues accumulate and progressively degrade kit quality and readiness.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: FirstAidKitRecommendation[] = [];
  let rank = 0;

  if (criticalOutOfStock > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately source and restock all critical medical supply items that are out of stock — children must have access to essential emergency supplies at all times. Emergency procurement channels should be activated if standard suppliers cannot deliver within 24 hours.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
    });
  }

  if (expiredItems > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Remove all expired medical supplies from first aid kits immediately and order replacements — expired items may be ineffective or cause harm. Implement a systematic expiry tracking process with advance alerts at 60, 30, and 7 days before expiry.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (staffTrainingRate < 50 && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently arrange first aid training for all untrained staff — the home must ensure sufficient trained first aiders are available on every shift to respond to medical emergencies. Prioritise paediatric first aid given the children's home context.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
    });
  }

  if (accessibilityRate < 50 && totalAccessibilityAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and rectify first aid kit accessibility — kits must be accessible 24 hours a day, clearly signed, unlocked, and in compliant locations. Any locked or inaccessible kits must be relocated or made available immediately.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (kitCheckRate < 50 && totalChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a robust first aid kit checking schedule — all kits must be checked at least monthly with documented evidence of contents, condition, and any actions taken. Assign named staff to each kit and use a standardised check template.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
    });
  }

  if (criticalStockBelowMinimum > 0 && criticalOutOfStock === 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Restock all critical medical supply items to above minimum threshold levels — critical items such as adrenaline auto-injectors, burn dressings, and sterile wound closures must be maintained at adequate levels for immediate use.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
    });
  }

  if (expiredTraining > 3) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule renewal training for all staff with expired first aid qualifications — expired training means staff skills may have degraded and they cannot be counted as qualified first aiders for regulatory purposes.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
    });
  }

  if (
    kitCheckRate >= 50 &&
    kitCheckRate < 80 &&
    totalChecks > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve first aid kit check compliance to at least 80% — ensure every check confirms all items are present, undamaged, and within date, and that the check itself is properly documented.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
    });
  }

  if (
    stockAdequacyRate >= 50 &&
    stockAdequacyRate < 80 &&
    totalStockItems > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and improve medical supply stock management — implement automated reorder points and establish relationships with reliable suppliers to prevent stock levels falling below minimum thresholds.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
    });
  }

  if (stockAdequacyRate < 50 && totalStockItems > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently restock all medical supplies below minimum thresholds — more than half of stock items are below safe levels, creating a significant risk that the home cannot adequately respond to first aid needs.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
    });
  }

  if (
    accessibilityRate >= 50 &&
    accessibilityRate < 80 &&
    totalAccessibilityAudits > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address first aid kit accessibility gaps — review each kit location against HSE guidance and ensure all kits are accessible around the clock, clearly signed, and in compliant positions within the home.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (
    staffTrainingRate >= 50 &&
    staffTrainingRate < 80 &&
    total_staff > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend first aid training to all staff — aim for 100% coverage to ensure at least one trained first aider is always on shift. Include paediatric first aid as standard training for all care staff.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
    });
  }

  if (childAwarenessRate < 70 && totalAccessibilityAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve children's awareness of first aid kit locations — incorporate kit location information into induction processes, display clear location maps, and revisit awareness during regular house meetings.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Children are safe",
    });
  }

  if (kitCheckOverdueCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue first aid kit checks immediately — overdue checks mean kits may contain expired or missing items. Set calendar reminders and assign responsibility for each kit to a named staff member.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
    });
  }

  if (nearExpiryTraining > 3) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Book renewal training for all staff whose qualifications expire within 60 days — proactive scheduling prevents training gaps and ensures continuous first aider availability.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
    });
  }

  if (reordersPending > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Place reorders for all stock items below minimum thresholds — implement an automated reorder system that triggers procurement when stock levels approach minimum thresholds.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
    });
  }

  if (paediatricTrainedRate < 50 && total_staff > 0 && totalTrainingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase paediatric first aid training coverage — given the home provides care for children, a higher proportion of staff should hold paediatric-specific first aid qualifications to ensure age-appropriate emergency response.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
    });
  }

  if (
    childAwarenessRate >= 70 &&
    childAwarenessRate < 90 &&
    totalAccessibilityAudits > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Further improve children's first aid awareness — consider age-appropriate first aid education sessions to build children's confidence in knowing how and where to access help.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Children are safe",
    });
  }

  if (stockAuditAccuracyRate < 80 && totalStockItems > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve stock audit accuracy — implement barcode or digital tracking for medical supplies so that physical stock consistently matches recorded levels. Discrepancies should be investigated and resolved within 24 hours.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
    });
  }

  if (checkDocumentationRate < 80 && totalChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve kit check documentation rates — every check must be recorded with date, checker name, findings, and actions taken. Use a standardised digital form to simplify documentation and create a reliable audit trail.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
    });
  }

  if (kitsTooFar > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Relocate first aid kits that are more than 50 metres from main living areas — HSE guidance recommends kits should be within easy reach. Consider installing additional satellite kits in high-traffic areas.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (refresherComplianceRate < 70 && currentTraining > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve refresher training completion — regular refreshers ensure staff skills remain current. Incorporate scenario-based practice sessions to reinforce learning.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 14 — Arrangements for health care",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: FirstAidKitInsight[] = [];

  // -- Critical insights --

  if (criticalOutOfStock > 0) {
    insights.push({
      text: `${criticalOutOfStock} critical medical supply item${criticalOutOfStock !== 1 ? "s are" : " is"} completely out of stock. Critical items — such as wound dressings, antiseptic, and emergency equipment — must be available at all times. An empty critical stock line means the home cannot provide a safe emergency response. Ofsted would view this as a serious Reg 14 compliance failure.`,
      severity: "critical",
    });
  }

  if (expiredItems > 0 && expiredNotReplaced > 0) {
    insights.push({
      text: `${expiredItems} expired item${expiredItems !== 1 ? "s" : ""} found with ${expiredNotReplaced} not yet replaced. Expired medical supplies may be degraded, contaminated, or ineffective. Using expired items on a child could cause harm or provide a false sense of security during an emergency. This is a direct Reg 25 safety concern.`,
      severity: "critical",
    });
  } else if (expiredItems > 0) {
    insights.push({
      text: `${expiredItems} expired medical supply item${expiredItems !== 1 ? "s" : ""} detected in active kits. Expired products must be removed, disposed of correctly, and replaced. Even if replacements are on order, expired items remaining in kits risk being used during an emergency.`,
      severity: "critical",
    });
  }

  if (staffTrainingRate < 50 && total_staff > 0) {
    insights.push({
      text: `Only ${staffTrainingRate}% of staff hold current first aid qualifications. The home cannot guarantee that a trained first aider will be present on every shift, which is a fundamental requirement under Reg 14. In a medical emergency involving a child, the absence of a qualified responder could have catastrophic consequences.`,
      severity: "critical",
    });
  }

  if (accessibilityRate < 50 && totalAccessibilityAudits > 0) {
    insights.push({
      text: `Only ${accessibilityRate}% of first aid kits meet full accessibility standards. Kits that are locked, poorly signed, or in non-compliant locations cannot be accessed quickly in an emergency. Every minute of delay in accessing first aid equipment during a serious incident increases the risk of harm to children.`,
      severity: "critical",
    });
  }

  if (kitCheckRate < 50 && totalChecks > 0) {
    insights.push({
      text: `Kit check compliance at only ${kitCheckRate}%. Without reliable kit checks, the home cannot evidence that first aid kits are maintained, stocked, and ready for use. Ofsted expects documented evidence of systematic kit maintenance under Reg 14 and Reg 25.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    kitCheckRate >= 50 &&
    kitCheckRate < 80 &&
    totalChecks > 0
  ) {
    insights.push({
      text: `Kit check compliance at ${kitCheckRate}% — improving but not yet at the 80%+ level that would demonstrate consistent practice. Each non-compliant check represents a time when a kit may have been used with missing or damaged items.`,
      severity: "warning",
    });
  }

  if (
    stockAdequacyRate >= 50 &&
    stockAdequacyRate < 80 &&
    totalStockItems > 0
  ) {
    insights.push({
      text: `Stock adequacy at ${stockAdequacyRate}% — some items are below minimum thresholds. While the majority of stock is adequate, any shortfall could compromise the home's ability to respond to multiple incidents or specific injury types.`,
      severity: "warning",
    });
  }

  if (
    expiryMonitoringRate >= 75 &&
    expiryMonitoringRate < 90 &&
    totalExpiryItems > 0
  ) {
    insights.push({
      text: `Expiry monitoring at ${expiryMonitoringRate}% — some items have passed their use-by dates. A systematic approach to expiry tracking with advance warning alerts would help prevent items expiring unnoticed.`,
      severity: "warning",
    });
  }

  if (
    accessibilityRate >= 50 &&
    accessibilityRate < 80 &&
    totalAccessibilityAudits > 0
  ) {
    insights.push({
      text: `Kit accessibility at ${accessibilityRate}% — some kits do not fully meet the standard for 24-hour access, clear signage, and compliant location. Partial compliance means that in some areas of the home, rapid first aid access is not assured.`,
      severity: "warning",
    });
  }

  if (
    staffTrainingRate >= 50 &&
    staffTrainingRate < 80 &&
    total_staff > 0
  ) {
    insights.push({
      text: `Staff training coverage at ${staffTrainingRate}% — gaps exist that could leave some shifts without a trained first aider. Analyse rota patterns against trained staff availability to ensure continuous coverage.`,
      severity: "warning",
    });
  }

  if (
    childAwarenessRate >= 50 &&
    childAwarenessRate < 70 &&
    totalAccessibilityAudits > 0
  ) {
    insights.push({
      text: `Child awareness at ${childAwarenessRate}% — some children may not know where to find first aid provision. Building this awareness through induction, regular reminders, and visual signage empowers children to access or direct others to help.`,
      severity: "warning",
    });
  }

  if (nearExpiryItems >= 5) {
    insights.push({
      text: `${nearExpiryItems} items expiring within 30 days. A cluster of near-expiry items suggests batch procurement without staggered replacement scheduling. Consider diversifying suppliers or ordering smaller quantities more frequently to smooth expiry dates across the year.`,
      severity: "warning",
    });
  }

  if (kitCheckOverdueCount > 0 && kitCheckOverdueCount >= 2) {
    insights.push({
      text: `${kitCheckOverdueCount} kit checks are overdue. Multiple overdue checks indicate a systemic issue with the checking schedule — whether caused by staffing pressures, unclear responsibility, or lack of reminders, the pattern must be addressed to prevent check compliance declining further.`,
      severity: "warning",
    });
  }

  if (expiredTraining > 0 && nearExpiryTraining > 0) {
    insights.push({
      text: `${expiredTraining} training qualification${expiredTraining !== 1 ? "s" : ""} expired and ${nearExpiryTraining} expiring soon. This combination suggests training renewal is not being managed proactively. A training matrix with automated renewal alerts would prevent qualification gaps.`,
      severity: "warning",
    });
  }

  if (
    stockAuditAccuracyRate >= 50 &&
    stockAuditAccuracyRate < 80 &&
    totalStockItems > 0
  ) {
    insights.push({
      text: `Stock audit accuracy at ${stockAuditAccuracyRate}% — discrepancies between recorded and actual stock levels undermine confidence in stock data. The home may believe it has adequate stock when physical quantities tell a different story.`,
      severity: "warning",
    });
  }

  // Analysis of training type distribution
  const topTrainingTypes = Object.entries(trainingTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topTrainingTypes.length > 0 && currentTraining >= 3) {
    const typeStr = topTrainingTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Active training profile: ${typeStr}. Consider whether the portfolio covers the full range of medical scenarios the home may encounter, including specialist conditions relevant to current children.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (first_aid_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding first aid and medical supply management — kits are systematically checked, supplies are well stocked and in date, kits are accessible, and staff hold current qualifications. This comprehensive approach ensures children have reliable access to safe, effective first aid provision and is strong evidence of compliance with Reg 14 and Reg 25.",
      severity: "positive",
    });
  }

  if (kitCheckRate >= 95 && checkDocumentationRate >= 95 && totalChecks > 0) {
    insights.push({
      text: "Kit checks are exemplary with near-complete documentation — a gold-standard maintenance regime providing powerful evidence of systematic safety management for Ofsted.",
      severity: "positive",
    });
  }

  if (
    stockAdequacyRate >= 95 &&
    criticalStockAdequacyRate >= 100 &&
    totalStockItems > 0 &&
    criticalItems.length > 0
  ) {
    insights.push({
      text: `Outstanding stock management with 100% critical item availability and ${stockAdequacyRate}% overall adequacy — the home maintains exceptional medical supply readiness, ensuring every emergency scenario can be effectively responded to.`,
      severity: "positive",
    });
  }

  if (
    expiryMonitoringRate >= 98 &&
    totalExpiryItems > 0
  ) {
    insights.push({
      text: `Expiry monitoring at ${expiryMonitoringRate}% — virtually no items have passed their expiry dates. This rigorous approach to shelf-life management means children are always treated with safe, effective medical supplies.`,
      severity: "positive",
    });
  }

  if (accessibilityRate >= 100 && hseComplianceRate >= 100 && totalAccessibilityAudits > 0) {
    insights.push({
      text: "Every first aid kit meets full accessibility and HSE compliance standards — accessible 24 hours, clearly signed, unlocked, and in compliant locations, ensuring immediate emergency access.",
      severity: "positive",
    });
  }

  if (staffTrainingRate >= 100 && paediatricTrainedRate >= 80 && total_staff > 0) {
    insights.push({
      text: `100% staff training with ${paediatricTrainedRate}% paediatric qualified — every shift has qualified first aiders with child-specific skills, demonstrating exceptional commitment to children's safety.`,
      severity: "positive",
    });
  }

  if (childAwarenessRate >= 90 && staffLocationAwarenessRate >= 100 && totalAccessibilityAudits > 0) {
    insights.push({
      text: `${childAwarenessRate}% child awareness with 100% staff awareness of kit locations — both children and staff know where to find first aid provision, enabling rapid emergency response.`,
      severity: "positive",
    });
  }

  if (issueResolutionRate >= 95 && totalIssuesFound > 0) {
    insights.push({
      text: `${issueResolutionRate}% of kit check issues resolved — the home identifies and promptly resolves problems, demonstrating a responsive safety culture.`,
      severity: "positive",
    });
  }

  if (
    refresherComplianceRate >= 90 &&
    practicalPassRate >= 90 &&
    currentTraining > 0 &&
    totalTrainingRecords > 0
  ) {
    insights.push({
      text: `${refresherComplianceRate}% refresher compliance with ${practicalPassRate}% practical assessment pass rate — staff maintain skills through regular refreshers and practical assessments, ensuring competence is current and demonstrable.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (first_aid_rating === "outstanding") {
    headline =
      "Outstanding first aid and medical supply provision — kits are systematically maintained, supplies are well stocked and in date, accessibility is assured, and all staff are trained to respond to emergencies.";
  } else if (first_aid_rating === "good") {
    headline = `Good first aid provision — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (first_aid_rating === "adequate") {
    headline = `Adequate first aid provision — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children have reliable access to safe, effective first aid at all times.`;
  } else {
    headline = `First aid provision is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's safety and compliance with Reg 14 and Reg 25.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    first_aid_rating,
    first_aid_score: score,
    headline,
    total_kits: totalUniqueKits,
    total_stock_items: totalStockItems,
    total_expiry_items: totalExpiryItems,
    total_trained_staff: uniqueTrainedStaff,
    kit_check_rate: kitCheckRate,
    stock_adequacy_rate: stockAdequacyRate,
    expiry_monitoring_rate: expiryMonitoringRate,
    accessibility_rate: accessibilityRate,
    staff_training_rate: staffTrainingRate,
    child_awareness_rate: childAwarenessRate,
    critical_stock_adequacy_rate: criticalStockAdequacyRate,
    expired_items_count: expiredItems,
    near_expiry_items_count: nearExpiryItems,
    paediatric_trained_rate: paediatricTrainedRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
