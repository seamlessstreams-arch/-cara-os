// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME LIVING ENVIRONMENT STANDARDS INTELLIGENCE ENGINE
// Cross-domain composite: assesses quality, safety, and personalisation of the
// physical living environment — cleanliness, maintenance, kitchen hygiene,
// bedroom personalisation, and room allocation suitability.
// Store keys: cleaningEntries, maintenance, kitchenHygieneChecks,
//             bedroomProfiles, roomAllocationRecords
// CHR 2015 Reg 25 (Premises), Reg 26 (Fire), Reg 27 (Hygiene),
// Reg 32 (Fitness of premises), Reg 6 (Quality of care).
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface CleaningEntryInput {
  id: string;
  area: string; // "communal" | "kitchen" | "bathroom" | "bedroom" | "office" | "external"
  date: string;
  completed: boolean;
  completed_by: string;
  quality_rating: number; // 1-5
  issues_noted: string | null;
  created_at: string;
}

export interface MaintenanceItemInput {
  id: string;
  title: string;
  category: string; // "plumbing" | "electrical" | "structural" | "decoration" | "furniture" | "safety" | "external"
  priority: string; // "urgent" | "high" | "medium" | "low"
  status: string; // "open" | "in_progress" | "completed" | "overdue"
  reported_date: string;
  completed_date: string | null;
  safety_risk: boolean;
  created_at: string;
}

export interface KitchenHygieneCheckInput {
  id: string;
  check_date: string;
  fridge_temp_ok: boolean;
  freezer_temp_ok: boolean;
  surfaces_clean: boolean;
  food_storage_compliant: boolean;
  pest_control_ok: boolean;
  fire_blanket_accessible: boolean;
  overall_pass: boolean;
  checked_by: string;
  created_at: string;
}

export interface BedroomProfileInput {
  id: string;
  child_id: string;
  personalised: boolean;
  child_chose_decor: boolean;
  adequate_storage: boolean;
  privacy_lock: boolean;
  condition: string; // "excellent" | "good" | "fair" | "poor"
  last_inspection_date: string | null;
  created_at: string;
}

export interface RoomAllocationInput {
  id: string;
  child_id: string;
  room_number: string;
  allocated_date: string;
  suitable_for_needs: boolean;
  risk_assessed: boolean;
  child_consulted: boolean;
  created_at: string;
}

export interface LivingEnvironmentStandardsInput {
  today: string;
  total_children: number;
  cleaning_entries: CleaningEntryInput[];
  maintenance_items: MaintenanceItemInput[];
  kitchen_hygiene_checks: KitchenHygieneCheckInput[];
  bedroom_profiles: BedroomProfileInput[];
  room_allocations: RoomAllocationInput[];
}

// ── Output types ────────────────────────────────────────────────────────────

export type LivingEnvironmentRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface LivingEnvironmentStandardsResult {
  environment_rating: LivingEnvironmentRating;
  environment_score: number;
  headline: string;

  // Cleaning metrics
  total_cleaning_entries: number;
  cleaning_completion_rate: number;
  cleaning_quality_avg: number;

  // Maintenance metrics
  total_maintenance_items: number;
  maintenance_completion_rate: number;
  overdue_maintenance_count: number;
  safety_maintenance_open: number;

  // Kitchen hygiene
  kitchen_hygiene_pass_rate: number;

  // Bedroom personalisation
  bedroom_personalisation_rate: number;
  bedroom_condition_good_rate: number;

  // Room allocation
  room_suitability_rate: number;
  room_risk_assessment_rate: number;
  child_consultation_rate: number;

  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): LivingEnvironmentRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeLivingEnvironmentStandards(
  input: LivingEnvironmentStandardsInput,
): LivingEnvironmentStandardsResult {
  const {
    today,
    total_children,
    cleaning_entries,
    maintenance_items,
    kitchen_hygiene_checks,
    bedroom_profiles,
    room_allocations,
  } = input;

  // ── Empty-result factory ──────────────────────────────────────────────
  const emptyResult = (
    rating: LivingEnvironmentRating,
    score: number,
    headline: string,
    concerns: string[],
  ): LivingEnvironmentStandardsResult => ({
    environment_rating: rating,
    environment_score: score,
    headline,
    total_cleaning_entries: 0,
    cleaning_completion_rate: 0,
    cleaning_quality_avg: 0,
    total_maintenance_items: 0,
    maintenance_completion_rate: 0,
    overdue_maintenance_count: 0,
    safety_maintenance_open: 0,
    kitchen_hygiene_pass_rate: 0,
    bedroom_personalisation_rate: 0,
    bedroom_condition_good_rate: 0,
    room_suitability_rate: 0,
    room_risk_assessment_rate: 0,
    child_consultation_rate: 0,
    strengths: [],
    concerns,
    recommendations: [],
    insights: [],
  });

  // ── Insufficient data guard ───────────────────────────────────────────
  const allEmpty =
    cleaning_entries.length === 0 &&
    maintenance_items.length === 0 &&
    kitchen_hygiene_checks.length === 0 &&
    bedroom_profiles.length === 0 &&
    room_allocations.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No living environment data available for analysis.",
      [],
    );
  }

  if (allEmpty && total_children > 0) {
    return emptyResult(
      "inadequate",
      15,
      "No living environment records despite children in placement — standards cannot be evidenced.",
      [
        "No cleaning, maintenance, kitchen hygiene, bedroom, or room allocation records exist despite children being in placement.",
      ],
    );
  }

  // ── Cleaning metrics ──────────────────────────────────────────────────
  const completedCleaningEntries = cleaning_entries.filter(c => c.completed);
  const cleaningCompletionRate = pct(completedCleaningEntries.length, cleaning_entries.length);

  const ratedEntries = cleaning_entries.filter(c => c.quality_rating >= 1 && c.quality_rating <= 5);
  const cleaningQualityAvg =
    ratedEntries.length > 0
      ? Math.round(
          (ratedEntries.reduce((sum, c) => sum + c.quality_rating, 0) / ratedEntries.length) * 10,
        ) / 10
      : 0;

  const cleaningIssuesCount = cleaning_entries.filter(
    c => c.issues_noted !== null && c.issues_noted.trim().length > 0,
  ).length;

  // ── Maintenance metrics ───────────────────────────────────────────────
  const completedMaintenance = maintenance_items.filter(m => m.status === "completed");
  const maintenanceCompletionRate = pct(completedMaintenance.length, maintenance_items.length);

  const overdueMaintenance = maintenance_items.filter(m => m.status === "overdue");
  const overdueMaintenanceCount = overdueMaintenance.length;

  const safetyMaintenanceOpen = maintenance_items.filter(
    m => m.safety_risk && (m.status === "open" || m.status === "in_progress" || m.status === "overdue"),
  ).length;

  const urgentOpenMaintenance = maintenance_items.filter(
    m => m.priority === "urgent" && m.status !== "completed",
  ).length;

  // ── Kitchen hygiene metrics ───────────────────────────────────────────
  const kitchenPassCount = kitchen_hygiene_checks.filter(c => c.overall_pass).length;
  const kitchenHygienePassRate = pct(kitchenPassCount, kitchen_hygiene_checks.length);

  const fridgeTempFailRate = pct(
    kitchen_hygiene_checks.filter(c => !c.fridge_temp_ok).length,
    kitchen_hygiene_checks.length,
  );
  const surfacesCleanRate = pct(
    kitchen_hygiene_checks.filter(c => c.surfaces_clean).length,
    kitchen_hygiene_checks.length,
  );
  const foodStorageRate = pct(
    kitchen_hygiene_checks.filter(c => c.food_storage_compliant).length,
    kitchen_hygiene_checks.length,
  );
  const fireBlanketRate = pct(
    kitchen_hygiene_checks.filter(c => c.fire_blanket_accessible).length,
    kitchen_hygiene_checks.length,
  );

  // ── Bedroom personalisation metrics ───────────────────────────────────
  const personalisedBedrooms = bedroom_profiles.filter(b => b.personalised);
  const bedroomPersonalisationRate = pct(personalisedBedrooms.length, bedroom_profiles.length);

  const goodConditionBedrooms = bedroom_profiles.filter(
    b => b.condition === "excellent" || b.condition === "good",
  );
  const bedroomConditionGoodRate = pct(goodConditionBedrooms.length, bedroom_profiles.length);

  const childChoseDecorRate = pct(
    bedroom_profiles.filter(b => b.child_chose_decor).length,
    bedroom_profiles.length,
  );
  const adequateStorageRate = pct(
    bedroom_profiles.filter(b => b.adequate_storage).length,
    bedroom_profiles.length,
  );
  const privacyLockRate = pct(
    bedroom_profiles.filter(b => b.privacy_lock).length,
    bedroom_profiles.length,
  );
  const poorConditionBedrooms = bedroom_profiles.filter(b => b.condition === "poor").length;

  // ── Room allocation metrics ───────────────────────────────────────────
  const suitableRooms = room_allocations.filter(r => r.suitable_for_needs);
  const roomSuitabilityRate = pct(suitableRooms.length, room_allocations.length);

  const riskAssessedRooms = room_allocations.filter(r => r.risk_assessed);
  const roomRiskAssessmentRate = pct(riskAssessedRooms.length, room_allocations.length);

  const consultedChildren = room_allocations.filter(r => r.child_consulted);
  const childConsultationRate = pct(consultedChildren.length, room_allocations.length);

  // ── Scoring (Base 52) ─────────────────────────────────────────────────
  let score = 52;

  // Bonus: Cleaning completion rate
  if (cleaningCompletionRate >= 95) score += 4;
  else if (cleaningCompletionRate >= 80) score += 2;

  // Bonus: Cleaning quality average
  if (cleaningQualityAvg >= 4.0) score += 3;
  else if (cleaningQualityAvg >= 3.0) score += 1;

  // Bonus: Maintenance completion rate
  if (maintenanceCompletionRate >= 90) score += 4;
  else if (maintenanceCompletionRate >= 75) score += 2;

  // Bonus: Kitchen hygiene pass rate
  if (kitchenHygienePassRate >= 100) score += 3;
  else if (kitchenHygienePassRate >= 85) score += 1;

  // Bonus: Bedroom personalisation rate
  if (bedroomPersonalisationRate >= 100) score += 3;
  else if (bedroomPersonalisationRate >= 80) score += 1;

  // Bonus: Bedroom condition good rate
  if (bedroomConditionGoodRate >= 90) score += 3;
  else if (bedroomConditionGoodRate >= 70) score += 1;

  // Bonus: Room suitability rate
  if (roomSuitabilityRate >= 100) score += 3;
  else if (roomSuitabilityRate >= 80) score += 1;

  // Bonus: Room risk assessment rate
  if (roomRiskAssessmentRate >= 100) score += 2;
  else if (roomRiskAssessmentRate >= 80) score += 1;

  // Bonus: Child consultation rate
  if (childConsultationRate >= 100) score += 3;
  else if (childConsultationRate >= 80) score += 1;

  // Penalty: Safety maintenance open
  if (safetyMaintenanceOpen > 0) score -= 5;

  // Penalty: Maintenance completion below 50%
  if (maintenanceCompletionRate < 50) score -= 5;

  // Penalty: Kitchen hygiene pass rate below 70%
  if (kitchenHygienePassRate < 70) score -= 5;

  // Penalty: Cleaning completion below 50%
  if (cleaningCompletionRate < 50) score -= 3;

  // Clamp final score
  score = clamp(score, 0, 100);

  // ── Rating ────────────────────────────────────────────────────────────
  const environment_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (cleaningCompletionRate >= 95 && cleaning_entries.length > 0) {
    strengths.push(
      `${cleaningCompletionRate}% cleaning completion rate — the home is consistently maintained to a high standard.`,
    );
  }
  if (cleaningQualityAvg >= 4.0 && ratedEntries.length > 0) {
    strengths.push(
      `Average cleaning quality rating of ${cleaningQualityAvg}/5 — quality is rigorously upheld across all areas.`,
    );
  }
  if (maintenanceCompletionRate >= 90 && maintenance_items.length > 0) {
    strengths.push(
      `${maintenanceCompletionRate}% maintenance completion — repairs and upkeep are addressed promptly.`,
    );
  }
  if (kitchenHygienePassRate >= 100 && kitchen_hygiene_checks.length > 0) {
    strengths.push(
      "100% kitchen hygiene pass rate — food safety and hygiene standards are exemplary.",
    );
  } else if (kitchenHygienePassRate >= 90 && kitchen_hygiene_checks.length > 0) {
    strengths.push(
      `${kitchenHygienePassRate}% kitchen hygiene pass rate — strong compliance with food safety requirements.`,
    );
  }
  if (bedroomPersonalisationRate >= 100 && bedroom_profiles.length > 0) {
    strengths.push(
      "Every bedroom is personalised — children are supported to make their rooms feel like home.",
    );
  } else if (bedroomPersonalisationRate >= 85 && bedroom_profiles.length > 0) {
    strengths.push(
      `${bedroomPersonalisationRate}% of bedrooms personalised — strong commitment to children's sense of belonging.`,
    );
  }
  if (childChoseDecorRate >= 90 && bedroom_profiles.length > 0) {
    strengths.push(
      `${childChoseDecorRate}% of children chose their own decor — child agency in living spaces is prioritised.`,
    );
  }
  if (roomSuitabilityRate >= 100 && room_allocations.length > 0) {
    strengths.push(
      "All room allocations assessed as suitable for individual needs — placement matching is thorough.",
    );
  }
  if (childConsultationRate >= 100 && room_allocations.length > 0) {
    strengths.push(
      "Every child was consulted on their room allocation — children's views are central to placement decisions.",
    );
  }
  if (roomRiskAssessmentRate >= 100 && room_allocations.length > 0) {
    strengths.push(
      "All room allocations have completed risk assessments — safety governance is comprehensive.",
    );
  }
  if (bedroomConditionGoodRate >= 90 && bedroom_profiles.length > 0) {
    strengths.push(
      `${bedroomConditionGoodRate}% of bedrooms in excellent or good condition — the physical environment is well-maintained.`,
    );
  }
  if (safetyMaintenanceOpen === 0 && maintenance_items.filter(m => m.safety_risk).length > 0) {
    strengths.push(
      "No open safety-related maintenance items — safety repairs are prioritised and resolved.",
    );
  }
  if (fireBlanketRate >= 100 && kitchen_hygiene_checks.length > 0) {
    strengths.push(
      "Fire blanket accessible at every kitchen hygiene check — fire safety in the kitchen is consistently maintained.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (safetyMaintenanceOpen > 0) {
    concerns.push(
      `${safetyMaintenanceOpen} safety-related maintenance item${safetyMaintenanceOpen !== 1 ? "s" : ""} remain open — this poses a direct risk to children and staff.`,
    );
  }
  if (urgentOpenMaintenance > 0) {
    concerns.push(
      `${urgentOpenMaintenance} urgent maintenance item${urgentOpenMaintenance !== 1 ? "s" : ""} not yet completed — urgent repairs must be prioritised.`,
    );
  }
  if (overdueMaintenanceCount > 0) {
    concerns.push(
      `${overdueMaintenanceCount} overdue maintenance item${overdueMaintenanceCount !== 1 ? "s" : ""} — repairs are falling behind schedule.`,
    );
  }
  if (maintenanceCompletionRate < 50 && maintenance_items.length > 0) {
    concerns.push(
      `Only ${maintenanceCompletionRate}% of maintenance items completed — significant backlog exists.`,
    );
  }
  if (kitchenHygienePassRate < 70 && kitchen_hygiene_checks.length > 0) {
    concerns.push(
      `Kitchen hygiene pass rate is ${kitchenHygienePassRate}% — food safety standards are not being met.`,
    );
  } else if (kitchenHygienePassRate < 85 && kitchen_hygiene_checks.length > 0) {
    concerns.push(
      `Kitchen hygiene pass rate is ${kitchenHygienePassRate}% — inconsistent compliance with food safety requirements.`,
    );
  }
  if (cleaningCompletionRate < 50 && cleaning_entries.length > 0) {
    concerns.push(
      `Only ${cleaningCompletionRate}% of scheduled cleaning completed — the home's cleanliness standards are inadequate.`,
    );
  } else if (cleaningCompletionRate < 80 && cleaning_entries.length > 0) {
    concerns.push(
      `Cleaning completion at ${cleaningCompletionRate}% — missed tasks risk a decline in living standards.`,
    );
  }
  if (cleaningQualityAvg < 3.0 && ratedEntries.length > 0) {
    concerns.push(
      `Average cleaning quality only ${cleaningQualityAvg}/5 — quality of completed cleaning is below acceptable standards.`,
    );
  }
  if (bedroomPersonalisationRate < 50 && bedroom_profiles.length > 0) {
    concerns.push(
      `Only ${bedroomPersonalisationRate}% of bedrooms personalised — children may not feel a sense of belonging in their living spaces.`,
    );
  }
  if (poorConditionBedrooms > 0) {
    concerns.push(
      `${poorConditionBedrooms} bedroom${poorConditionBedrooms !== 1 ? "s" : ""} rated in poor condition — physical environment does not meet minimum standards.`,
    );
  }
  if (roomSuitabilityRate < 80 && room_allocations.length > 0) {
    concerns.push(
      `Only ${roomSuitabilityRate}% of room allocations suitable for children's needs — placement matching needs review.`,
    );
  }
  if (roomRiskAssessmentRate < 80 && room_allocations.length > 0) {
    concerns.push(
      `Only ${roomRiskAssessmentRate}% of room allocations have risk assessments — gaps in safety governance.`,
    );
  }
  if (childConsultationRate < 50 && room_allocations.length > 0) {
    concerns.push(
      `Only ${childConsultationRate}% of children consulted on room allocation — children's voices are not being heard in placement decisions.`,
    );
  }
  if (privacyLockRate < 50 && bedroom_profiles.length > 0) {
    concerns.push(
      `Only ${privacyLockRate}% of bedrooms have privacy locks — children's right to privacy is not consistently upheld.`,
    );
  }
  if (cleaning_entries.length === 0 && total_children > 0) {
    concerns.push(
      "No cleaning records — cleanliness standards cannot be evidenced.",
    );
  }
  if (maintenance_items.length === 0 && total_children > 0) {
    concerns.push(
      "No maintenance records — premises upkeep cannot be evidenced.",
    );
  }
  if (kitchen_hygiene_checks.length === 0 && total_children > 0) {
    concerns.push(
      "No kitchen hygiene checks recorded — food safety compliance cannot be demonstrated.",
    );
  }
  if (bedroom_profiles.length === 0 && total_children > 0) {
    concerns.push(
      "No bedroom profiles — personalisation and condition of children's bedrooms cannot be assessed.",
    );
  }
  if (room_allocations.length === 0 && total_children > 0) {
    concerns.push(
      "No room allocation records — suitability and risk assessment of living arrangements cannot be evidenced.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;

  if (safetyMaintenanceOpen > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Resolve all open safety-related maintenance items immediately — safety hazards in the premises must be eliminated to protect children and staff.",
      urgency: "immediate",
      regulatory_ref: "Reg 25 — Premises",
    });
  }

  if (kitchenHygienePassRate < 70 && kitchen_hygiene_checks.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a comprehensive kitchen hygiene review and implement corrective actions — current pass rates indicate systemic non-compliance with food safety standards.",
      urgency: "immediate",
      regulatory_ref: "Reg 27 — Premises — hygiene",
    });
  } else if (kitchenHygienePassRate < 85 && kitchen_hygiene_checks.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address recurring kitchen hygiene failures — review fridge temperatures, food storage, and surface cleaning to achieve consistent compliance.",
      urgency: "soon",
      regulatory_ref: "Reg 27 — Premises — hygiene",
    });
  }

  if (kitchen_hygiene_checks.length === 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a regular kitchen hygiene check programme — documented evidence of food safety is a regulatory requirement.",
      urgency: "immediate",
      regulatory_ref: "Reg 27 — Premises — hygiene",
    });
  }

  if (fireBlanketRate < 100 && kitchen_hygiene_checks.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure the fire blanket is accessible at every kitchen check — gaps in fire safety equipment availability must be addressed immediately.",
      urgency: "immediate",
      regulatory_ref: "Reg 26 — Premises — fire",
    });
  }

  if (urgentOpenMaintenance > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Prioritise completion of all urgent maintenance items — delayed urgent repairs compromise the fitness and safety of the premises.",
      urgency: "immediate",
      regulatory_ref: "Reg 32 — Fitness of premises",
    });
  }

  if (maintenanceCompletionRate < 50 && maintenance_items.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and resource the maintenance programme — fewer than half of reported items have been completed, indicating a systemic failure in premises upkeep.",
      urgency: "immediate",
      regulatory_ref: "Reg 25 — Premises",
    });
  } else if (maintenanceCompletionRate < 75 && maintenance_items.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve maintenance completion rates — outstanding items should be triaged and scheduled to prevent further deterioration of the premises.",
      urgency: "soon",
      regulatory_ref: "Reg 25 — Premises",
    });
  }

  if (overdueMaintenanceCount >= 3) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Clear the backlog of overdue maintenance items — persistent overdue repairs undermine the quality and safety of the living environment.",
      urgency: "soon",
      regulatory_ref: "Reg 32 — Fitness of premises",
    });
  }

  if (cleaningCompletionRate < 50 && cleaning_entries.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review cleaning schedules and staff allocation — completion rates below 50% suggest resourcing or accountability issues that must be addressed.",
      urgency: "immediate",
      regulatory_ref: "Reg 27 — Premises — hygiene",
    });
  } else if (cleaningCompletionRate < 80 && cleaning_entries.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve cleaning schedule adherence — ensure all scheduled tasks are completed and quality-checked to maintain a consistently clean environment.",
      urgency: "soon",
      regulatory_ref: "Reg 27 — Premises — hygiene",
    });
  }

  if (cleaning_entries.length === 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a documented cleaning schedule with quality ratings — evidence of cleanliness standards is essential for regulatory compliance.",
      urgency: "immediate",
      regulatory_ref: "Reg 27 — Premises — hygiene",
    });
  }

  if (cleaningQualityAvg < 3.0 && ratedEntries.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Invest in cleaning quality improvement — provide staff training and audit cleaning standards to raise average quality above acceptable thresholds.",
      urgency: "soon",
      regulatory_ref: "Reg 6 — Quality of care",
    });
  }

  if (bedroomPersonalisationRate < 50 && bedroom_profiles.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Prioritise bedroom personalisation for all children — every child should be supported to make their room feel like their own space.",
      urgency: "soon",
      regulatory_ref: "Reg 25 — Premises",
    });
  } else if (bedroomPersonalisationRate < 80 && bedroom_profiles.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend bedroom personalisation efforts to remaining children — personalised living spaces are central to a sense of belonging.",
      urgency: "planned",
      regulatory_ref: "Reg 25 — Premises",
    });
  }

  if (bedroom_profiles.length === 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create bedroom profiles for all children — document personalisation, condition, storage, and privacy arrangements for each child's room.",
      urgency: "immediate",
      regulatory_ref: "Reg 25 — Premises",
    });
  }

  if (poorConditionBedrooms > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address bedrooms in poor condition as a priority — children should not live in rooms that do not meet basic standards of decoration and repair.",
      urgency: "immediate",
      regulatory_ref: "Reg 32 — Fitness of premises",
    });
  }

  if (privacyLockRate < 70 && bedroom_profiles.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review bedroom privacy arrangements — ensure all children have appropriate privacy locks unless a specific, documented risk assessment precludes this.",
      urgency: "soon",
      regulatory_ref: "Reg 25 — Premises",
    });
  }

  if (roomSuitabilityRate < 80 && room_allocations.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review room allocations where suitability concerns have been identified — each child's room must meet their individual needs.",
      urgency: "soon",
      regulatory_ref: "Reg 32 — Fitness of premises",
    });
  }

  if (room_allocations.length === 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Document room allocations with suitability, risk assessment, and child consultation records for all children in placement.",
      urgency: "immediate",
      regulatory_ref: "Reg 25 — Premises",
    });
  }

  if (roomRiskAssessmentRate < 80 && room_allocations.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete risk assessments for all room allocations — every child's living arrangement must be formally assessed for safety and suitability.",
      urgency: "soon",
      regulatory_ref: "Reg 25 — Premises",
    });
  }

  if (childConsultationRate < 50 && room_allocations.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Consult children on their room allocations — their views and preferences must be sought and documented in line with their rights.",
      urgency: "soon",
      regulatory_ref: "Reg 6 — Quality of care",
    });
  } else if (childConsultationRate < 80 && room_allocations.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend child consultation to cover all room allocation decisions — children should routinely be asked about their preferences and any concerns.",
      urgency: "planned",
      regulatory_ref: "Reg 6 — Quality of care",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];

  // Positive composite insights
  if (
    cleaningCompletionRate >= 95 &&
    cleaningQualityAvg >= 4.0 &&
    maintenanceCompletionRate >= 90 &&
    kitchenHygienePassRate >= 100 &&
    cleaning_entries.length > 0 &&
    maintenance_items.length > 0 &&
    kitchen_hygiene_checks.length > 0
  ) {
    insights.push({
      text: "The physical environment is maintained to an exemplary standard — cleaning, maintenance, and kitchen hygiene are all operating at the highest level. This would be recognised as outstanding practice at inspection.",
      severity: "positive",
    });
  }

  if (
    bedroomPersonalisationRate >= 100 &&
    childChoseDecorRate >= 90 &&
    bedroomConditionGoodRate >= 90 &&
    bedroom_profiles.length > 0
  ) {
    insights.push({
      text: "Bedroom personalisation is exceptional — every child has a personalised space, most chose their own decor, and rooms are in excellent or good condition. This demonstrates a truly child-centred approach to the living environment.",
      severity: "positive",
    });
  }

  if (
    roomSuitabilityRate >= 100 &&
    roomRiskAssessmentRate >= 100 &&
    childConsultationRate >= 100 &&
    room_allocations.length > 0
  ) {
    insights.push({
      text: "Room allocation governance is comprehensive — every allocation is suitable, risk-assessed, and includes documented child consultation. This evidences robust matching of children to their living arrangements.",
      severity: "positive",
    });
  }

  if (
    kitchenHygienePassRate >= 100 &&
    fireBlanketRate >= 100 &&
    surfacesCleanRate >= 100 &&
    foodStorageRate >= 100 &&
    kitchen_hygiene_checks.length > 0
  ) {
    insights.push({
      text: "Kitchen hygiene and fire safety are impeccable — all checks pass across temperature, surfaces, food storage, and fire equipment. This provides strong evidence of Reg 27 and Reg 26 compliance.",
      severity: "positive",
    });
  }

  // Warning insights
  if (
    cleaningCompletionRate < 80 &&
    cleaningQualityAvg < 3.0 &&
    cleaning_entries.length > 0
  ) {
    insights.push({
      text: `Cleaning completion is ${cleaningCompletionRate}% with average quality of ${cleaningQualityAvg}/5. Both volume and quality of cleaning are below standard — this would be a significant concern at inspection under Reg 27.`,
      severity: "warning",
    });
  }

  if (overdueMaintenanceCount >= 5) {
    insights.push({
      text: `${overdueMaintenanceCount} maintenance items are overdue. A backlog of this size suggests systemic issues with premises upkeep — inspectors would view this as evidence of inadequate management oversight under Reg 25.`,
      severity: "warning",
    });
  }

  if (
    bedroomPersonalisationRate < 50 &&
    childChoseDecorRate < 50 &&
    bedroom_profiles.length > 0
  ) {
    insights.push({
      text: `Only ${bedroomPersonalisationRate}% of bedrooms are personalised and ${childChoseDecorRate}% of children chose their decor. Children are not being given sufficient agency over their living spaces — this is inconsistent with the expectations of Reg 25 and Reg 6.`,
      severity: "warning",
    });
  }

  if (
    childConsultationRate < 50 &&
    roomRiskAssessmentRate < 50 &&
    room_allocations.length > 0
  ) {
    insights.push({
      text: `Only ${childConsultationRate}% of children consulted and ${roomRiskAssessmentRate}% of allocations risk-assessed. Room allocation governance has significant gaps that would be flagged during inspection.`,
      severity: "warning",
    });
  }

  // Critical insights
  if (safetyMaintenanceOpen >= 2) {
    insights.push({
      text: `${safetyMaintenanceOpen} safety-related maintenance items remain unresolved. This represents an active risk to children and staff and would be treated as a serious safeguarding and premises concern during inspection under Reg 25 and Reg 32.`,
      severity: "critical",
    });
  } else if (safetyMaintenanceOpen === 1) {
    insights.push({
      text: "One safety-related maintenance item remains open. While isolated, any unresolved safety repair must be treated with urgency — inspectors would expect immediate action under Reg 25.",
      severity: "critical",
    });
  }

  if (kitchenHygienePassRate < 50 && kitchen_hygiene_checks.length > 0) {
    insights.push({
      text: `Kitchen hygiene pass rate is only ${kitchenHygienePassRate}%. Fewer than half of checks are passing — this represents a serious food safety risk and potential regulatory breach under Reg 27.`,
      severity: "critical",
    });
  }

  if (
    maintenanceCompletionRate < 50 &&
    safetyMaintenanceOpen > 0 &&
    overdueMaintenanceCount >= 3 &&
    maintenance_items.length > 0
  ) {
    insights.push({
      text: `Maintenance completion is only ${maintenanceCompletionRate}% with ${safetyMaintenanceOpen} safety items open and ${overdueMaintenanceCount} overdue. The premises maintenance programme is failing — this combination of factors would likely result in a regulatory action under Reg 25 and Reg 32.`,
      severity: "critical",
    });
  }

  if (
    cleaningCompletionRate < 50 &&
    kitchenHygienePassRate < 70 &&
    cleaning_entries.length > 0 &&
    kitchen_hygiene_checks.length > 0
  ) {
    insights.push({
      text: `Both cleaning (${cleaningCompletionRate}%) and kitchen hygiene (${kitchenHygienePassRate}%) are critically low. The overall hygiene standards of the home are inadequate and present a risk to children's health under Reg 27.`,
      severity: "critical",
    });
  }

  if (poorConditionBedrooms >= 2 && bedroom_profiles.length > 0) {
    insights.push({
      text: `${poorConditionBedrooms} bedrooms are in poor condition. Multiple bedrooms failing to meet basic standards of repair and decoration indicates a failure to maintain the premises as a suitable home environment under Reg 32.`,
      severity: "critical",
    });
  }

  // Cross-domain insight: data completeness
  const domainsWithData = [
    cleaning_entries.length > 0,
    maintenance_items.length > 0,
    kitchen_hygiene_checks.length > 0,
    bedroom_profiles.length > 0,
    room_allocations.length > 0,
  ].filter(Boolean).length;

  if (domainsWithData <= 2 && total_children > 0) {
    insights.push({
      text: `Only ${domainsWithData} of 5 living environment domains have recorded data. Significant gaps in evidence would undermine any attempt to demonstrate compliance at inspection — the home cannot evidence the quality of its physical environment.`,
      severity: "warning",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (environment_rating === "outstanding") {
    headline = `Outstanding living environment — ${cleaningCompletionRate}% cleaning completion, ${kitchenHygienePassRate}% kitchen hygiene, ${bedroomPersonalisationRate}% bedrooms personalised.`;
  } else if (environment_rating === "good") {
    headline = concerns.length > 0
      ? `Good living environment — ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement identified.`
      : "Good living environment — cleanliness, maintenance, and personalisation are well-managed.";
  } else if (environment_rating === "adequate") {
    headline = `Living environment standards need improvement — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified across cleaning, maintenance, or personalisation.`;
  } else {
    headline = "Living environment is inadequate — significant gaps in cleanliness, safety, maintenance, or bedroom personalisation require urgent attention.";
  }

  // ── Return ────────────────────────────────────────────────────────────
  return {
    environment_rating,
    environment_score: score,
    headline,
    total_cleaning_entries: cleaning_entries.length,
    cleaning_completion_rate: cleaningCompletionRate,
    cleaning_quality_avg: cleaningQualityAvg,
    total_maintenance_items: maintenance_items.length,
    maintenance_completion_rate: maintenanceCompletionRate,
    overdue_maintenance_count: overdueMaintenanceCount,
    safety_maintenance_open: safetyMaintenanceOpen,
    kitchen_hygiene_pass_rate: kitchenHygienePassRate,
    bedroom_personalisation_rate: bedroomPersonalisationRate,
    bedroom_condition_good_rate: bedroomConditionGoodRate,
    room_suitability_rate: roomSuitabilityRate,
    room_risk_assessment_rate: roomRiskAssessmentRate,
    child_consultation_rate: childConsultationRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
