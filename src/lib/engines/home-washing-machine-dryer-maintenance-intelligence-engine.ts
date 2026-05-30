// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME WASHING MACHINE & DRYER MAINTENANCE INTELLIGENCE ENGINE
// Measures appliance servicing schedules, breakdown response, child laundry
// access, hygiene cycle compliance, energy efficiency, and child independence
// in using laundry facilities safely and confidently.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Premises — accommodation must be maintained to a good
// standard, equipment must be safe and suitable for purpose).
// CHR 2015 Reg 5 (Engagement with parents, carers, and professionals —
// ensuring the home environment supports children's daily living skills).
// SCCIF: "Children live in a home that is well maintained and comfortable"
//        "Children develop independence and life skills"
//        "Experiences of children and young people — daily living"
// Store keys: servicingRecords, breakdownRecords, childAccessRecords,
//             hygieneCycleRecords, energyRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ServicingRecordInput {
  id: string;
  appliance_id: string;
  appliance_type: "washing_machine" | "dryer" | "washer_dryer_combo";
  appliance_location: string;
  service_type: "annual_service" | "quarterly_check" | "manufacturer_recall" | "ppm" | "safety_inspection" | "descale" | "filter_clean";
  service_date: string;
  next_service_due: string | null;
  service_overdue: boolean;
  engineer_name: string;
  engineer_qualified: boolean;
  parts_replaced: boolean;
  parts_description: string;
  passed_safety_check: boolean;
  certificate_on_file: boolean;
  cost_gbp: number;
  notes: string;
  created_at: string;
}

export interface BreakdownRecordInput {
  id: string;
  appliance_id: string;
  appliance_type: "washing_machine" | "dryer" | "washer_dryer_combo";
  reported_date: string;
  reported_by: "child" | "staff" | "visitor" | "contractor";
  fault_description: string;
  severity: "minor" | "moderate" | "major" | "safety_critical";
  response_date: string | null;
  resolved_date: string | null;
  resolved: boolean;
  response_within_24h: boolean;
  response_within_48h: boolean;
  temporary_arrangement_provided: boolean;
  impact_on_children: "none" | "minor_inconvenience" | "significant_disruption" | "health_hygiene_risk";
  root_cause: string;
  preventable: boolean;
  repeat_fault: boolean;
  created_at: string;
}

export interface ChildAccessRecordInput {
  id: string;
  child_id: string;
  child_age: number;
  access_type: "independent" | "supervised" | "staff_only" | "supported";
  can_use_washing_machine: boolean;
  can_use_dryer: boolean;
  trained_on_appliance_use: boolean;
  training_date: string | null;
  risk_assessment_completed: boolean;
  risk_assessment_date: string | null;
  child_preference_respected: boolean;
  laundry_schedule_agreed: boolean;
  personal_items_separated: boolean;
  child_satisfaction_rating: number; // 1-5
  barriers_to_access: string[];
  independence_goal_set: boolean;
  independence_goal_met: boolean;
  created_at: string;
}

export interface HygieneCycleRecordInput {
  id: string;
  appliance_id: string;
  appliance_type: "washing_machine" | "dryer" | "washer_dryer_combo";
  cycle_type: "hot_wash_60" | "hot_wash_90" | "anti_bacterial" | "drum_clean" | "descale" | "sanitise";
  scheduled_date: string;
  completed_date: string | null;
  completed: boolean;
  completed_on_time: boolean;
  temperature_verified: boolean;
  detergent_type: "standard" | "anti_bacterial" | "hypoallergenic" | "eco" | "specialist";
  infection_control_compliant: boolean;
  recorded_by: string;
  notes: string;
  created_at: string;
}

export interface EnergyRecordInput {
  id: string;
  appliance_id: string;
  appliance_type: "washing_machine" | "dryer" | "washer_dryer_combo";
  energy_rating: "A+++" | "A++" | "A+" | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "unknown";
  age_years: number;
  average_cycles_per_week: number;
  eco_mode_available: boolean;
  eco_mode_used_percentage: number; // 0-100
  water_consumption_litres_per_cycle: number;
  energy_kwh_per_cycle: number;
  last_efficiency_check_date: string | null;
  efficiency_check_overdue: boolean;
  replacement_recommended: boolean;
  replacement_reason: string;
  annual_cost_estimate_gbp: number;
  created_at: string;
}

export interface WashingMachineDryerMaintenanceInput {
  today: string;
  total_children: number;
  servicing_records: ServicingRecordInput[];
  breakdown_records: BreakdownRecordInput[];
  child_access_records: ChildAccessRecordInput[];
  hygiene_cycle_records: HygieneCycleRecordInput[];
  energy_records: EnergyRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type WashingMachineDryerRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface WashingMachineDryerInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface WashingMachineDryerRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface WashingMachineDryerMaintenanceResult {
  appliance_rating: WashingMachineDryerRating;
  appliance_score: number;
  headline: string;
  total_appliances: number;
  servicing_rate: number;
  breakdown_response_rate: number;
  child_access_rate: number;
  hygiene_cycle_rate: number;
  energy_efficiency_rate: number;
  child_independence_rate: number;
  average_appliance_age: number;
  breakdown_resolution_avg_hours: number;
  strengths: string[];
  concerns: string[];
  recommendations: WashingMachineDryerRecommendation[];
  insights: WashingMachineDryerInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): WashingMachineDryerRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  const msA = Date.parse(a);
  const msB = Date.parse(b);
  if (isNaN(msA) || isNaN(msB)) return 0;
  return Math.abs(Math.round((msB - msA) / 86_400_000));
}

function hoursBetween(a: string, b: string): number {
  const msA = Date.parse(a);
  const msB = Date.parse(b);
  if (isNaN(msA) || isNaN(msB)) return 0;
  return Math.abs(Math.round((msB - msA) / 3_600_000));
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: WashingMachineDryerRating,
  score: number,
  headline: string,
): WashingMachineDryerMaintenanceResult {
  return {
    appliance_rating: rating,
    appliance_score: score,
    headline,
    total_appliances: 0,
    servicing_rate: 0,
    breakdown_response_rate: 0,
    child_access_rate: 0,
    hygiene_cycle_rate: 0,
    energy_efficiency_rate: 0,
    child_independence_rate: 0,
    average_appliance_age: 0,
    breakdown_resolution_avg_hours: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeWashingMachineDryerMaintenance(
  input: WashingMachineDryerMaintenanceInput,
): WashingMachineDryerMaintenanceResult {
  const {
    today,
    total_children,
    servicing_records,
    breakdown_records,
    child_access_records,
    hygiene_cycle_records,
    energy_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    servicing_records.length === 0 &&
    breakdown_records.length === 0 &&
    child_access_records.length === 0 &&
    hygiene_cycle_records.length === 0 &&
    energy_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement and no appliance data recorded — insufficient data to assess washing machine and dryer maintenance.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No washing machine or dryer maintenance data recorded despite children on placement — appliance servicing, hygiene compliance, and child access require urgent attention.",
      ),
      concerns: [
        "No servicing records, breakdown logs, child access records, hygiene cycle records, or energy efficiency data exist despite children being on placement — the home cannot evidence that laundry appliances are safe, maintained, hygienic, or accessible to children.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement a structured servicing schedule for all washing machines and dryers with documented safety inspections, engineer certificates, and preventive maintenance to ensure appliances are safe and fit for purpose.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
        },
        {
          rank: 2,
          recommendation:
            "Establish child laundry access assessments for every child to identify independence goals, training needs, and any barriers preventing children from managing their own laundry as part of developing daily living skills.",
          urgency: "immediate",
          regulatory_ref: "SCCIF — Children develop independence and life skills",
        },
      ],
      insights: [
        {
          text: "The complete absence of laundry appliance maintenance and access records means the home cannot demonstrate that washing machines and dryers are safely maintained, hygienically operated, or accessible to children. Ofsted expects premises to be maintained to a good standard (Reg 25) and for children to develop independence in daily living tasks. The absence of any records in this area represents a fundamental gap in both premises safety and independence planning.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute unique appliances from energy_records ─────────────────────

  const uniqueApplianceIds = new Set<string>();
  for (const s of servicing_records) uniqueApplianceIds.add(s.appliance_id);
  for (const b of breakdown_records) uniqueApplianceIds.add(b.appliance_id);
  for (const h of hygiene_cycle_records) uniqueApplianceIds.add(h.appliance_id);
  for (const e of energy_records) uniqueApplianceIds.add(e.appliance_id);
  const totalAppliances = uniqueApplianceIds.size;

  // ══════════════════════════════════════════════════════════════════════
  // 1. SERVICING RATE
  // ══════════════════════════════════════════════════════════════════════

  const totalServicingRecords = servicing_records.length;

  // Servicing compliance: records not overdue
  const servicingCompliant = servicing_records.filter(
    (s) => !s.service_overdue,
  ).length;
  const servicingRate = pct(servicingCompliant, totalServicingRecords);

  // Safety check pass rate
  const servicingPassedSafety = servicing_records.filter(
    (s) => s.passed_safety_check,
  ).length;
  const safetyPassRate = pct(servicingPassedSafety, totalServicingRecords);

  // Certificate on file rate
  const certificatesOnFile = servicing_records.filter(
    (s) => s.certificate_on_file,
  ).length;
  const certificateRate = pct(certificatesOnFile, totalServicingRecords);

  // Qualified engineer rate
  const qualifiedEngineerServices = servicing_records.filter(
    (s) => s.engineer_qualified,
  ).length;
  const qualifiedEngineerRate = pct(qualifiedEngineerServices, totalServicingRecords);

  // Overdue servicing count
  const overdueServicing = servicing_records.filter(
    (s) => s.service_overdue,
  ).length;

  // Unique appliances with at least one service record
  const appliancesServiced = new Set(
    servicing_records.map((s) => s.appliance_id),
  ).size;
  const applianceServicingCoverage = totalAppliances > 0
    ? pct(appliancesServiced, totalAppliances)
    : 0;

  // ══════════════════════════════════════════════════════════════════════
  // 2. BREAKDOWN RESPONSE RATE
  // ══════════════════════════════════════════════════════════════════════

  const totalBreakdowns = breakdown_records.length;

  // Breakdowns responded to within 24h
  const respondedWithin24h = breakdown_records.filter(
    (b) => b.response_within_24h,
  ).length;
  const breakdownResponseRate = pct(respondedWithin24h, totalBreakdowns);

  // Breakdowns responded to within 48h
  const respondedWithin48h = breakdown_records.filter(
    (b) => b.response_within_48h,
  ).length;
  const breakdownResponse48hRate = pct(respondedWithin48h, totalBreakdowns);

  // Resolution rate
  const resolvedBreakdowns = breakdown_records.filter(
    (b) => b.resolved,
  ).length;
  const breakdownResolutionRate = pct(resolvedBreakdowns, totalBreakdowns);

  // Average resolution time in hours (for resolved breakdowns)
  const resolutionHours: number[] = [];
  for (const b of breakdown_records) {
    if (b.resolved && b.reported_date && b.resolved_date) {
      const hrs = hoursBetween(b.reported_date, b.resolved_date);
      resolutionHours.push(hrs);
    }
  }
  const breakdownResolutionAvgHours =
    resolutionHours.length > 0
      ? Math.round(
          resolutionHours.reduce((sum, h) => sum + h, 0) /
            resolutionHours.length,
        )
      : 0;

  // Temporary arrangement provision rate
  const tempArrangementProvided = breakdown_records.filter(
    (b) => b.temporary_arrangement_provided,
  ).length;
  const tempArrangementRate = pct(tempArrangementProvided, totalBreakdowns);

  // Safety critical breakdowns still unresolved
  const unresolvedSafetyCritical = breakdown_records.filter(
    (b) => b.severity === "safety_critical" && !b.resolved,
  ).length;

  // Repeat faults
  const repeatFaults = breakdown_records.filter(
    (b) => b.repeat_fault,
  ).length;
  const repeatFaultRate = pct(repeatFaults, totalBreakdowns);

  // Preventable breakdowns
  const preventableBreakdowns = breakdown_records.filter(
    (b) => b.preventable,
  ).length;
  const preventableRate = pct(preventableBreakdowns, totalBreakdowns);

  // Health/hygiene impact breakdowns
  const healthHygieneImpact = breakdown_records.filter(
    (b) => b.impact_on_children === "health_hygiene_risk",
  ).length;

  // Significant disruption or worse
  const significantDisruption = breakdown_records.filter(
    (b) =>
      b.impact_on_children === "significant_disruption" ||
      b.impact_on_children === "health_hygiene_risk",
  ).length;

  // ══════════════════════════════════════════════════════════════════════
  // 3. CHILD ACCESS RATE
  // ══════════════════════════════════════════════════════════════════════

  const totalChildAccessRecords = child_access_records.length;

  // Children with access (can use either washing machine or dryer)
  const childrenWithAccess = child_access_records.filter(
    (c) => c.can_use_washing_machine || c.can_use_dryer,
  ).length;
  const childAccessRate = pct(childrenWithAccess, totalChildAccessRecords);

  // Unique children covered by access records
  const uniqueChildrenWithAccess = new Set(
    child_access_records.map((c) => c.child_id),
  ).size;
  const childAccessCoverage = total_children > 0
    ? pct(uniqueChildrenWithAccess, total_children)
    : 0;

  // Training completion rate
  const childrenTrained = child_access_records.filter(
    (c) => c.trained_on_appliance_use,
  ).length;
  const trainingRate = pct(childrenTrained, totalChildAccessRecords);

  // Risk assessment completion rate
  const riskAssessmentsCompleted = child_access_records.filter(
    (c) => c.risk_assessment_completed,
  ).length;
  const riskAssessmentRate = pct(riskAssessmentsCompleted, totalChildAccessRecords);

  // Child preference respected rate
  const preferencesRespected = child_access_records.filter(
    (c) => c.child_preference_respected,
  ).length;
  const preferenceRate = pct(preferencesRespected, totalChildAccessRecords);

  // Laundry schedule agreed rate
  const schedulesAgreed = child_access_records.filter(
    (c) => c.laundry_schedule_agreed,
  ).length;
  const scheduleAgreedRate = pct(schedulesAgreed, totalChildAccessRecords);

  // Personal items separated rate
  const personalItemsSeparated = child_access_records.filter(
    (c) => c.personal_items_separated,
  ).length;
  const personalSeparationRate = pct(personalItemsSeparated, totalChildAccessRecords);

  // Child satisfaction average (1-5)
  const satisfactionSum = child_access_records.reduce(
    (sum, c) => sum + c.child_satisfaction_rating,
    0,
  );
  const satisfactionAvg =
    totalChildAccessRecords > 0
      ? Math.round((satisfactionSum / totalChildAccessRecords) * 100) / 100
      : 0;

  // Children with barriers
  const childrenWithBarriers = child_access_records.filter(
    (c) => c.barriers_to_access.length > 0,
  ).length;
  const barriersRate = pct(childrenWithBarriers, totalChildAccessRecords);

  // ══════════════════════════════════════════════════════════════════════
  // 4. CHILD INDEPENDENCE RATE
  // ══════════════════════════════════════════════════════════════════════

  // Children with independent or supported access
  const independentChildren = child_access_records.filter(
    (c) => c.access_type === "independent" || c.access_type === "supported",
  ).length;
  const childIndependenceRate = pct(independentChildren, totalChildAccessRecords);

  // Independence goals set
  const independenceGoalsSet = child_access_records.filter(
    (c) => c.independence_goal_set,
  ).length;
  const independenceGoalSetRate = pct(independenceGoalsSet, totalChildAccessRecords);

  // Independence goals met
  const independenceGoalsMet = child_access_records.filter(
    (c) => c.independence_goal_met,
  ).length;
  const independenceGoalMetRate = pct(
    independenceGoalsMet,
    independenceGoalsSet > 0 ? independenceGoalsSet : 1,
  );

  // Age-appropriate access analysis
  const ageAppropriateIndependence = child_access_records.filter(
    (c) =>
      c.child_age >= 14 &&
      (c.access_type === "independent" || c.access_type === "supported"),
  ).length;
  const olderChildren = child_access_records.filter(
    (c) => c.child_age >= 14,
  ).length;
  const ageAppropriateRate = olderChildren > 0
    ? pct(ageAppropriateIndependence, olderChildren)
    : 0;

  // ══════════════════════════════════════════════════════════════════════
  // 5. HYGIENE CYCLE RATE
  // ══════════════════════════════════════════════════════════════════════

  const totalHygieneCycles = hygiene_cycle_records.length;

  // Completed cycles
  const completedHygieneCycles = hygiene_cycle_records.filter(
    (h) => h.completed,
  ).length;
  const hygieneCycleRate = pct(completedHygieneCycles, totalHygieneCycles);

  // On-time completion rate
  const onTimeHygieneCycles = hygiene_cycle_records.filter(
    (h) => h.completed && h.completed_on_time,
  ).length;
  const hygieneOnTimeRate = pct(onTimeHygieneCycles, totalHygieneCycles);

  // Temperature verification rate
  const temperatureVerified = hygiene_cycle_records.filter(
    (h) => h.completed && h.temperature_verified,
  ).length;
  const temperatureVerificationRate = pct(temperatureVerified, completedHygieneCycles);

  // Infection control compliance rate
  const infectionControlCompliant = hygiene_cycle_records.filter(
    (h) => h.infection_control_compliant,
  ).length;
  const infectionControlRate = pct(infectionControlCompliant, totalHygieneCycles);

  // Overdue (scheduled but not completed on time)
  const overdueHygieneCycles = hygiene_cycle_records.filter(
    (h) => !h.completed && !h.completed_on_time,
  ).length;

  // Unique appliances with hygiene cycles
  const appliancesWithHygieneCycles = new Set(
    hygiene_cycle_records.map((h) => h.appliance_id),
  ).size;
  const hygieneCoveragePct = totalAppliances > 0
    ? pct(appliancesWithHygieneCycles, totalAppliances)
    : 0;

  // Cycle type distribution
  const hotWashCycles = hygiene_cycle_records.filter(
    (h) =>
      h.cycle_type === "hot_wash_60" ||
      h.cycle_type === "hot_wash_90" ||
      h.cycle_type === "anti_bacterial" ||
      h.cycle_type === "sanitise",
  ).length;
  const hotWashPct = pct(hotWashCycles, totalHygieneCycles);

  // ══════════════════════════════════════════════════════════════════════
  // 6. ENERGY EFFICIENCY RATE
  // ══════════════════════════════════════════════════════════════════════

  const totalEnergyRecords = energy_records.length;

  // Appliances with good energy rating (A or better)
  const goodEnergyRatings = ["A+++", "A++", "A+", "A"];
  const energyEfficientAppliances = energy_records.filter(
    (e) => goodEnergyRatings.indexOf(e.energy_rating) !== -1,
  ).length;
  const energyEfficiencyRate = pct(energyEfficientAppliances, totalEnergyRecords);

  // Average appliance age
  const totalAge = energy_records.reduce((sum, e) => sum + e.age_years, 0);
  const averageApplianceAge =
    totalEnergyRecords > 0
      ? Math.round((totalAge / totalEnergyRecords) * 10) / 10
      : 0;

  // Eco mode usage
  const ecoModeAvailable = energy_records.filter(
    (e) => e.eco_mode_available,
  ).length;
  const ecoModeUsageSum = energy_records
    .filter((e) => e.eco_mode_available)
    .reduce((sum, e) => sum + e.eco_mode_used_percentage, 0);
  const ecoModeUsageAvg =
    ecoModeAvailable > 0
      ? Math.round(ecoModeUsageSum / ecoModeAvailable)
      : 0;

  // Efficiency check compliance
  const efficiencyChecksOverdue = energy_records.filter(
    (e) => e.efficiency_check_overdue,
  ).length;
  const efficiencyCheckRate = totalEnergyRecords > 0
    ? pct(totalEnergyRecords - efficiencyChecksOverdue, totalEnergyRecords)
    : 0;

  // Appliances recommended for replacement
  const replacementRecommended = energy_records.filter(
    (e) => e.replacement_recommended,
  ).length;

  // Old appliances (>10 years)
  const oldAppliances = energy_records.filter(
    (e) => e.age_years > 10,
  ).length;

  // Very old appliances (>15 years)
  const veryOldAppliances = energy_records.filter(
    (e) => e.age_years > 15,
  ).length;

  // Total annual cost estimate
  const totalAnnualCost = energy_records.reduce(
    (sum, e) => sum + e.annual_cost_estimate_gbp,
    0,
  );
  const avgAnnualCostPerAppliance =
    totalEnergyRecords > 0
      ? Math.round((totalAnnualCost / totalEnergyRecords) * 100) / 100
      : 0;

  // Poor energy ratings (D or worse)
  const poorEnergyRatings = ["D", "E", "F", "G"];
  const poorRatedAppliances = energy_records.filter(
    (e) => poorEnergyRatings.indexOf(e.energy_rating) !== -1,
  ).length;

  // ══════════════════════════════════════════════════════════════════════
  // SCORING: base 52, max bonuses +28, 4 guarded penalties
  // ══════════════════════════════════════════════════════════════════════

  let score = 52;

  // --- Bonus 1: servicingRate (>=95: +5, >=80: +3) ---
  if (servicingRate >= 95 && totalServicingRecords > 0) score += 5;
  else if (servicingRate >= 80 && totalServicingRecords > 0) score += 3;

  // --- Bonus 2: breakdownResponseRate (>=90: +5, >=70: +3) ---
  if (breakdownResponseRate >= 90 && totalBreakdowns > 0) score += 5;
  else if (breakdownResponseRate >= 70 && totalBreakdowns > 0) score += 3;

  // --- Bonus 3: childAccessRate (>=90: +4, >=70: +2) ---
  if (childAccessRate >= 90 && totalChildAccessRecords > 0) score += 4;
  else if (childAccessRate >= 70 && totalChildAccessRecords > 0) score += 2;

  // --- Bonus 4: hygieneCycleRate (>=95: +5, >=80: +3) ---
  if (hygieneCycleRate >= 95 && totalHygieneCycles > 0) score += 5;
  else if (hygieneCycleRate >= 80 && totalHygieneCycles > 0) score += 3;

  // --- Bonus 5: energyEfficiencyRate (>=80: +4, >=60: +2) ---
  if (energyEfficiencyRate >= 80 && totalEnergyRecords > 0) score += 4;
  else if (energyEfficiencyRate >= 60 && totalEnergyRecords > 0) score += 2;

  // --- Bonus 6: childIndependenceRate (>=80: +5, >=60: +3) ---
  if (childIndependenceRate >= 80 && totalChildAccessRecords > 0) score += 5;
  else if (childIndependenceRate >= 60 && totalChildAccessRecords > 0) score += 3;

  // ── Penalties (4 guarded) ─────────────────────────────────────────────

  // Penalty 1: servicingRate < 50 → -6
  if (servicingRate < 50 && totalServicingRecords > 0) score -= 6;

  // Penalty 2: breakdownResponseRate < 50 → -5
  if (breakdownResponseRate < 50 && totalBreakdowns > 0) score -= 5;

  // Penalty 3: hygieneCycleRate < 50 → -5
  if (hygieneCycleRate < 50 && totalHygieneCycles > 0) score -= 5;

  // Penalty 4: unresolvedSafetyCritical > 0 → -6
  if (unresolvedSafetyCritical > 0) score -= 6;

  score = clamp(score, 0, 100);

  const appliance_rating = toRating(score);

  // ══════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ══════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];

  if (servicingRate >= 95 && totalServicingRecords > 0) {
    strengths.push(
      "Appliance servicing is fully up to date — the home demonstrates excellent preventive maintenance ensuring all washing machines and dryers are safe and operational.",
    );
  } else if (servicingRate >= 80 && totalServicingRecords > 0) {
    strengths.push(
      `${servicingRate}% servicing compliance — strong maintenance scheduling keeps the majority of appliances safely maintained and within service intervals.`,
    );
  }

  if (breakdownResponseRate >= 90 && totalBreakdowns > 0) {
    strengths.push(
      `${breakdownResponseRate}% of breakdowns responded to within 24 hours — the home demonstrates rapid response to appliance failures, minimising disruption to children's laundry access.`,
    );
  } else if (breakdownResponseRate >= 70 && totalBreakdowns > 0) {
    strengths.push(
      `${breakdownResponseRate}% breakdown response within 24 hours — good responsiveness when appliances fail, ensuring children are not left without laundry facilities for extended periods.`,
    );
  }

  if (childAccessRate >= 90 && totalChildAccessRecords > 0) {
    strengths.push(
      `${childAccessRate}% of children have access to laundry facilities — the home ensures almost every child can wash and dry their own clothes, supporting dignity and independence.`,
    );
  } else if (childAccessRate >= 70 && totalChildAccessRecords > 0) {
    strengths.push(
      `${childAccessRate}% child access to laundry facilities — most children can use washing machines or dryers, supporting their daily living skills development.`,
    );
  }

  if (hygieneCycleRate >= 95 && totalHygieneCycles > 0) {
    strengths.push(
      "Hygiene cycle compliance is exemplary — all scheduled hot washes, anti-bacterial cycles, and sanitisation routines are being completed, ensuring appliances meet infection control standards.",
    );
  } else if (hygieneCycleRate >= 80 && totalHygieneCycles > 0) {
    strengths.push(
      `${hygieneCycleRate}% of hygiene cycles completed — strong compliance with scheduled sanitisation and hot wash routines maintains good appliance hygiene.`,
    );
  }

  if (energyEfficiencyRate >= 80 && totalEnergyRecords > 0) {
    strengths.push(
      `${energyEfficiencyRate}% of appliances have energy ratings of A or better — the home demonstrates commitment to energy-efficient laundry provision, reducing environmental impact and operating costs.`,
    );
  } else if (energyEfficiencyRate >= 60 && totalEnergyRecords > 0) {
    strengths.push(
      `${energyEfficiencyRate}% of appliances are energy-efficient (rated A or better) — the majority of laundry appliances meet modern efficiency standards.`,
    );
  }

  if (childIndependenceRate >= 80 && totalChildAccessRecords > 0) {
    strengths.push(
      `${childIndependenceRate}% of children manage laundry independently or with minimal support — the home excels at building practical independence skills that prepare children for adult life.`,
    );
  } else if (childIndependenceRate >= 60 && totalChildAccessRecords > 0) {
    strengths.push(
      `${childIndependenceRate}% of children have independent or supported laundry access — good progress in developing children's self-care and daily living competencies.`,
    );
  }

  if (safetyPassRate >= 100 && certificateRate >= 100 && totalServicingRecords > 0) {
    strengths.push(
      "Every serviced appliance has passed its safety check with certificates on file — exemplary documentation and safety compliance.",
    );
  }

  if (breakdownResolutionRate >= 90 && tempArrangementRate >= 80 && totalBreakdowns > 0) {
    strengths.push(
      `${breakdownResolutionRate}% of breakdowns fully resolved with ${tempArrangementRate}% temporary arrangements — thorough follow-through ensures children always have laundry access.`,
    );
  }

  if (trainingRate >= 90 && riskAssessmentRate >= 90 && totalChildAccessRecords > 0) {
    strengths.push(
      `${trainingRate}% trained and ${riskAssessmentRate}% risk assessed — children are well prepared to use laundry equipment safely and confidently.`,
    );
  }

  if (satisfactionAvg >= 4.0 && preferenceRate >= 90 && totalChildAccessRecords > 0) {
    strengths.push(
      `Child satisfaction averages ${satisfactionAvg}/5 with ${preferenceRate}% preferences respected — children report high satisfaction and feel their laundry choices are valued.`,
    );
  }

  if (infectionControlRate >= 95 && totalHygieneCycles > 0) {
    strengths.push(
      `${infectionControlRate}% infection control compliance — rigorous hygiene standards in laundry operations.`,
    );
  }

  if (independenceGoalMetRate >= 80 && ageAppropriateRate >= 90 && independenceGoalsSet > 0 && olderChildren > 0) {
    strengths.push(
      `${independenceGoalMetRate}% of independence goals met and ${ageAppropriateRate}% of 14+ manage laundry — strong life skills development preparing young people for leaving care.`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ══════════════════════════════════════════════════════════════════════

  const concerns: string[] = [];

  if (servicingRate < 50 && totalServicingRecords > 0) {
    concerns.push(
      `Only ${servicingRate}% of servicing records are compliant — the majority of laundry appliances have overdue servicing, creating safety risks and potential equipment failure.`,
    );
  } else if (servicingRate < 80 && servicingRate >= 50 && totalServicingRecords > 0) {
    concerns.push(
      `Servicing compliance at ${servicingRate}% — some appliances have overdue maintenance which could affect their safety and reliability.`,
    );
  }

  if (breakdownResponseRate < 50 && totalBreakdowns > 0) {
    concerns.push(
      `Only ${breakdownResponseRate}% of breakdowns responded to within 24 hours — slow response to appliance failures leaves children without access to clean laundry and undermines the home's duty to maintain premises.`,
    );
  } else if (breakdownResponseRate < 70 && breakdownResponseRate >= 50 && totalBreakdowns > 0) {
    concerns.push(
      `Breakdown response rate at ${breakdownResponseRate}% within 24 hours — a significant number of breakdowns are not addressed promptly, risking extended disruption to children.`,
    );
  }

  if (childAccessRate < 50 && totalChildAccessRecords > 0) {
    concerns.push(
      `Only ${childAccessRate}% of children have access to laundry facilities — more than half of children cannot independently wash or dry their own clothes, limiting their independence and dignity.`,
    );
  } else if (childAccessRate < 70 && childAccessRate >= 50 && totalChildAccessRecords > 0) {
    concerns.push(
      `Child laundry access at ${childAccessRate}% — a notable proportion of children lack direct access to washing machines or dryers.`,
    );
  }

  if (hygieneCycleRate < 50 && totalHygieneCycles > 0) {
    concerns.push(
      `Only ${hygieneCycleRate}% of scheduled hygiene cycles completed — the majority of sanitisation and hot wash routines are not being carried out, posing infection control and hygiene risks.`,
    );
  } else if (hygieneCycleRate < 80 && hygieneCycleRate >= 50 && totalHygieneCycles > 0) {
    concerns.push(
      `Hygiene cycle completion at ${hygieneCycleRate}% — some scheduled sanitisation cycles are being missed, which could compromise appliance hygiene over time.`,
    );
  }

  if (energyEfficiencyRate < 40 && totalEnergyRecords > 0) {
    concerns.push(
      `Only ${energyEfficiencyRate}% of appliances meet modern energy efficiency standards — the majority of laundry equipment is inefficient, resulting in higher running costs and greater environmental impact.`,
    );
  } else if (energyEfficiencyRate < 60 && energyEfficiencyRate >= 40 && totalEnergyRecords > 0) {
    concerns.push(
      `Energy efficiency at ${energyEfficiencyRate}% — a notable proportion of laundry appliances do not meet modern energy efficiency standards and may benefit from planned replacement.`,
    );
  }

  if (childIndependenceRate < 40 && totalChildAccessRecords > 0) {
    concerns.push(
      `Only ${childIndependenceRate}% of children manage laundry independently or with support — the majority of children are not developing practical laundry skills, which may leave them unprepared for independent living.`,
    );
  } else if (childIndependenceRate < 60 && childIndependenceRate >= 40 && totalChildAccessRecords > 0) {
    concerns.push(
      `Child independence in laundry at ${childIndependenceRate}% — a significant number of children are not yet developing the laundry skills they will need for adult life.`,
    );
  }

  if (unresolvedSafetyCritical > 0) {
    concerns.push(
      `${unresolvedSafetyCritical} safety-critical breakdown${unresolvedSafetyCritical !== 1 ? "s remain" : " remains"} unresolved — appliances with safety-critical faults must be immediately taken out of service and repaired or replaced to prevent harm to children.`,
    );
  }

  if (overdueServicing > 0 && totalServicingRecords > 0) {
    concerns.push(
      `${overdueServicing} service record${overdueServicing !== 1 ? "s are" : " is"} overdue — appliances may not be safe or operating efficiently.`,
    );
  }

  if (repeatFaultRate > 30 && preventableRate > 40 && totalBreakdowns > 0) {
    concerns.push(
      `${repeatFaultRate}% repeat faults and ${preventableRate}% preventable breakdowns — recurring, avoidable failures indicate systemic maintenance gaps.`,
    );
  } else if (repeatFaultRate > 30 && totalBreakdowns > 0) {
    concerns.push(
      `${repeatFaultRate}% of breakdowns are repeat faults — recurring issues suggest root causes are not being properly addressed.`,
    );
  }

  if (healthHygieneImpact > 0) {
    concerns.push(
      `${healthHygieneImpact} breakdown${healthHygieneImpact !== 1 ? "s have" : " has"} caused health or hygiene risks to children — a serious safeguarding and welfare concern.`,
    );
  }

  if (trainingRate < 50 && riskAssessmentRate < 50 && totalChildAccessRecords > 0) {
    concerns.push(
      `Only ${trainingRate}% trained and ${riskAssessmentRate}% risk assessed — most children lack proper preparation and risk consideration for using laundry appliances safely.`,
    );
  } else if (trainingRate < 50 && totalChildAccessRecords > 0) {
    concerns.push(
      `Only ${trainingRate}% of children have received appliance training — most children have not been taught how to safely use washing machines and dryers.`,
    );
  }

  if (satisfactionAvg < 2.5 && totalChildAccessRecords > 0) {
    concerns.push(
      `Child satisfaction with laundry access averages only ${satisfactionAvg}/5 — children are dissatisfied with how their laundry needs are being met.`,
    );
  }

  if (infectionControlRate < 70 && totalHygieneCycles > 0) {
    concerns.push(
      `Infection control compliance at only ${infectionControlRate}% — a significant proportion of hygiene cycles do not meet infection control standards.`,
    );
  }

  if (veryOldAppliances > 0 || replacementRecommended > 0) {
    const parts: string[] = [];
    if (veryOldAppliances > 0) parts.push(`${veryOldAppliances} over 15 years old`);
    if (replacementRecommended > 0) parts.push(`${replacementRecommended} flagged for replacement`);
    concerns.push(
      `Appliance stock concerns: ${parts.join(", ")} — ageing or failing appliances increase breakdown risk and reduce energy efficiency.`,
    );
  }

  if (safetyPassRate < 80 && totalServicingRecords > 0) {
    concerns.push(
      `Only ${safetyPassRate}% of serviced appliances passed safety checks — appliances that fail safety checks must not be used until faults are rectified.`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ══════════════════════════════════════════════════════════════════════

  const recommendations: WashingMachineDryerRecommendation[] = [];
  let rank = 0;

  // --- Immediate recommendations ---

  if (unresolvedSafetyCritical > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately take all appliances with unresolved safety-critical faults out of service and arrange emergency repair or replacement — children must not use appliances with known safety hazards.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (servicingRate < 50 && totalServicingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently bring all appliance servicing up to date — overdue maintenance on the majority of washing machines and dryers creates unacceptable safety risks. Implement a preventive maintenance calendar with automatic reminders.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (hygieneCycleRate < 50 && totalHygieneCycles > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently implement and complete all scheduled hygiene cycles — the majority of sanitisation routines are overdue, creating infection control risks. Assign named responsibility for hygiene cycle compliance.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (breakdownResponseRate < 50 && totalBreakdowns > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish an urgent response protocol for appliance breakdowns with a maximum 24-hour response target — slow response leaves children without access to clean laundry and undermines hygiene standards.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (healthHygieneImpact > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all breakdowns that resulted in health or hygiene risks to children — implement preventive measures and contingency plans to ensure appliance failures never compromise children's hygiene or welfare.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (safetyPassRate < 80 && totalServicingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all appliances that failed safety checks are immediately taken out of service until faults are rectified — no appliance should be available for use without a current safety pass.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (childAccessRate < 50 && totalChildAccessRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently assess all children's laundry access needs and remove barriers preventing children from washing and drying their own clothes — lack of access undermines children's dignity and independence.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Children develop independence and life skills",
    });
  }

  // --- Soon recommendations ---

  if (servicingRate >= 50 && servicingRate < 80 && totalServicingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve servicing compliance to at least 80% — implement a structured maintenance schedule with documented inspections and automated due-date tracking for all appliances.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (breakdownResponseRate >= 50 && breakdownResponseRate < 70 && totalBreakdowns > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve breakdown response times — establish clear escalation procedures and maintain contractor contact details so that all faults are responded to within 24 hours.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (hygieneCycleRate >= 50 && hygieneCycleRate < 80 && totalHygieneCycles > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve hygiene cycle completion to at least 80% — assign named responsibility for each scheduled hygiene cycle and implement a tracking system to ensure no cycles are missed.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (childAccessRate >= 50 && childAccessRate < 70 && totalChildAccessRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend laundry access to more children — assess barriers preventing children from using facilities and provide targeted training and support to enable wider access.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Children develop independence and life skills",
    });
  }

  if (childIndependenceRate < 60 && totalChildAccessRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop structured independence plans for children's laundry skills — set individual goals, provide age-appropriate training, and progressively reduce supervision as competence develops.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Children develop independence and life skills",
    });
  }

  if (repeatFaultRate > 30 || (preventableRate > 40 && totalBreakdowns > 0)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate repeat and preventable breakdown patterns — strengthen preventive maintenance with regular filter cleaning, descaling, and root cause analysis to reduce avoidable failures.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (trainingRate < 70 && riskAssessmentRate < 70 && totalChildAccessRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide appliance training and complete risk assessments for all children — ensure safe, confident use of washing machines and dryers with documented safety consideration.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  } else if (trainingRate < 70 && totalChildAccessRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide appliance safety training to all children covering temperature selection, load capacity, and detergent use.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with parents, carers and professionals",
    });
  }

  if (certificateRate < 80 && infectionControlRate < 80 && totalServicingRecords > 0 && totalHygieneCycles > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all service certificates are filed and improve infection control compliance in hygiene cycles — maintain complete auditable records and documented verification of sanitisation protocols.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  } else if (certificateRate < 80 && totalServicingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all service certificates are filed and accessible for every appliance.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  // --- Planned recommendations ---

  if (energyEfficiencyRate < 60 && totalEnergyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a planned appliance replacement programme prioritising the least energy-efficient appliances — modern A-rated appliances will reduce running costs, lower environmental impact, and provide more reliable performance.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (veryOldAppliances > 0 || replacementRecommended > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Prioritise replacement of ageing and flagged appliances — very old or failing appliances are unreliable, lack modern safety features, and consume more energy and water.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (ecoModeUsageAvg < 50 && ecoModeAvailable > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase use of eco mode settings on equipped appliances — encourage staff and children to use eco programmes for everyday laundry to reduce energy consumption and environmental impact.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (temperatureVerificationRate < 80 && completedHygieneCycles > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement routine temperature verification for all hygiene cycles — confirm that sanitisation washes are reaching the required temperatures to effectively eliminate bacteria and maintain infection control standards.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises and safety",
    });
  }

  if (satisfactionAvg < 3.0 && totalChildAccessRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Consult with children about their laundry experience and address sources of dissatisfaction — children's feedback should directly inform improvements to laundry arrangements.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences of children and young people",
    });
  }

  if (independenceGoalSetRate < 70 && totalChildAccessRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Set individual laundry independence goals for all children — goals should be age-appropriate, reviewed regularly, and form part of each child's pathway plan for daily living skills.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Children develop independence and life skills",
    });
  }

  if (ageAppropriateRate < 70 && olderChildren > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all young people aged 14+ can manage their own laundry independently or with minimal support — laundry competence is a fundamental life skill for leaving care.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Children develop independence and life skills",
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ══════════════════════════════════════════════════════════════════════

  const insights: WashingMachineDryerInsight[] = [];

  // -- Critical insights --

  if (unresolvedSafetyCritical > 0) {
    insights.push({
      text: `${unresolvedSafetyCritical} safety-critical fault${unresolvedSafetyCritical !== 1 ? "s remain" : " remains"} unresolved. Appliances with known safety defects pose immediate risk to children. Ofsted will view this as a serious Reg 25 failure.`,
      severity: "critical",
    });
  }

  if (servicingRate < 50 && totalServicingRecords > 0) {
    insights.push({
      text: `Only ${servicingRate}% servicing compliance. The majority of laundry appliances have overdue servicing — the home cannot demonstrate safe maintenance under Reg 25.`,
      severity: "critical",
    });
  }

  if (hygieneCycleRate < 50 && totalHygieneCycles > 0) {
    insights.push({
      text: `Only ${hygieneCycleRate}% of hygiene cycles completed. Appliances without regular sanitisation can harbour bacteria and allergens that transfer to children's clothing, creating direct infection control risks.`,
      severity: "critical",
    });
  }

  if (breakdownResponseRate < 50 && totalBreakdowns > 0) {
    insights.push({
      text: `Only ${breakdownResponseRate}% of breakdowns responded to within 24 hours. Extended periods without laundry facilities affect children's access to clean clothing, impacting dignity and self-esteem.`,
      severity: "critical",
    });
  }

  if (healthHygieneImpact > 0) {
    insights.push({
      text: `${healthHygieneImpact} breakdown${healthHygieneImpact !== 1 ? "s have" : " has"} caused health or hygiene risks to children. Each incident should be investigated as a potential safeguarding concern.`,
      severity: "critical",
    });
  }

  if (childAccessRate < 50 && totalChildAccessRecords > 0) {
    insights.push({
      text: `Only ${childAccessRate}% of children have laundry access. SCCIF expects children to develop daily living skills — when most children cannot access facilities, the home prevents development of fundamental self-care competencies.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (servicingRate >= 50 && servicingRate < 80 && totalServicingRecords > 0) {
    insights.push({
      text: `Servicing compliance at ${servicingRate}% — some appliances still have overdue maintenance, representing incremental safety risk.`,
      severity: "warning",
    });
  }

  if (breakdownResponseRate >= 50 && breakdownResponseRate < 70 && totalBreakdowns > 0) {
    insights.push({
      text: `Breakdown response at ${breakdownResponseRate}% within 24 hours — delays beyond 24 hours should trigger contingency plans to ensure children have access to clean clothing.`,
      severity: "warning",
    });
  }

  if (hygieneCycleRate >= 50 && hygieneCycleRate < 80 && totalHygieneCycles > 0) {
    insights.push({
      text: `Hygiene cycle completion at ${hygieneCycleRate}% — missed sanitisation routines allow bacterial build-up in drums and seals.`,
      severity: "warning",
    });
  }

  if (childAccessRate >= 50 && childAccessRate < 70 && totalChildAccessRecords > 0) {
    insights.push({
      text: `Child laundry access at ${childAccessRate}% — each child without access misses opportunities to develop self-care skills essential for leaving care readiness.`,
      severity: "warning",
    });
  }

  if (childIndependenceRate >= 40 && childIndependenceRate < 60 && totalChildAccessRecords > 0) {
    insights.push({
      text: `Child independence at ${childIndependenceRate}% — a significant proportion remain reliant on staff. Laundry independence should be a progressive goal in each child's care plan.`,
      severity: "warning",
    });
  }

  if (energyEfficiencyRate >= 40 && energyEfficiencyRate < 60 && totalEnergyRecords > 0) {
    insights.push({
      text: `Energy efficiency at ${energyEfficiencyRate}% — inefficient appliances cost more to run. Replacement presents an opportunity to improve sustainability and reliability.`,
      severity: "warning",
    });
  }

  if ((repeatFaultRate > 30 || preventableRate > 40) && totalBreakdowns > 0) {
    const parts: string[] = [];
    if (repeatFaultRate > 30) parts.push(`${repeatFaultRate}% repeat faults`);
    if (preventableRate > 40) parts.push(`${preventableRate}% preventable`);
    insights.push({
      text: `${parts.join(" and ")} — regular filter cleaning, descaling, root cause analysis, and timely replacement would reduce breakdown frequency.`,
      severity: "warning",
    });
  }

  if (satisfactionAvg >= 2.5 && satisfactionAvg < 3.5 && totalChildAccessRecords > 0) {
    insights.push({
      text: `Child satisfaction with laundry averages ${satisfactionAvg}/5 — children's experience of laundry arrangements is mediocre. Consulting children about what would improve their experience could reveal practical changes that make a meaningful difference to daily life.`,
      severity: "warning",
    });
  }

  if (oldAppliances > 0 && veryOldAppliances === 0) {
    insights.push({
      text: `${oldAppliances} appliance${oldAppliances !== 1 ? "s are" : " is"} over 10 years old. While not yet critical, ageing appliances have higher failure rates and lower energy efficiency. Consider including these in a planned replacement programme.`,
      severity: "warning",
    });
  }

  // Child access type distribution
  const accessTypeCounts: Record<string, number> = {};
  for (const c of child_access_records) {
    accessTypeCounts[c.access_type] = (accessTypeCounts[c.access_type] ?? 0) + 1;
  }
  const topAccessTypes = Object.entries(accessTypeCounts).sort((a, b) => b[1] - a[1]);
  if (topAccessTypes.length > 0 && totalChildAccessRecords >= 3) {
    const accessStr = topAccessTypes.map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`).join(", ");
    insights.push({
      text: `Child access levels: ${accessStr}. A progression from supervised to independent access, matched to age and ability, demonstrates high-quality independence planning.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (appliance_rating === "outstanding") {
    insights.push({
      text: "Outstanding washing machine and dryer maintenance — appliances are safely serviced, breakdowns resolved swiftly, hygiene standards rigorous, and children have strong access to develop laundry independence. This evidences strong Reg 25 and SCCIF compliance.",
      severity: "positive",
    });
  }

  if (servicingRate >= 95 && safetyPassRate >= 100 && certificateRate >= 100 && totalServicingRecords > 0) {
    insights.push({
      text: "Exemplary servicing — all appliances serviced on schedule with 100% safety checks passed and certificates on file, providing immediate Ofsted assurance of Reg 25 compliance.",
      severity: "positive",
    });
  }

  if (breakdownResponseRate >= 90 && breakdownResolutionRate >= 90 && totalBreakdowns > 0) {
    insights.push({
      text: `${breakdownResponseRate}% responded within 24 hours and ${breakdownResolutionRate}% fully resolved — rapid, thorough breakdown response ensures children always have laundry access.`,
      severity: "positive",
    });
  }

  if (childAccessRate >= 90 && childIndependenceRate >= 80 && totalChildAccessRecords > 0) {
    insights.push({
      text: `${childAccessRate}% access and ${childIndependenceRate}% independence — children manage their own washing with confidence, building practical life skills while their preferences are respected.`,
      severity: "positive",
    });
  }

  if (hygieneCycleRate >= 95 && infectionControlRate >= 95 && totalHygieneCycles > 0) {
    insights.push({
      text: "Exemplary hygiene cycle compliance with strong infection control — rigorous appliance hygiene protects children from cross-contamination.",
      severity: "positive",
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  // HEADLINE
  // ══════════════════════════════════════════════════════════════════════

  let headline = "";

  if (appliance_rating === "outstanding") {
    headline =
      "Washing machine and dryer maintenance is outstanding — appliances are safely serviced, breakdowns are resolved swiftly, hygiene standards are rigorous, and children have strong access to develop laundry independence.";
  } else if (appliance_rating === "good") {
    headline =
      "Washing machine and dryer maintenance is good — servicing, hygiene compliance, and child access are generally well managed with some areas for development.";
  } else if (appliance_rating === "adequate") {
    headline =
      "Washing machine and dryer maintenance is adequate — basic maintenance is in place but significant improvements are needed in servicing compliance, breakdown response, hygiene cycles, or child access.";
  } else {
    headline =
      "Washing machine and dryer maintenance is inadequate — critical gaps in appliance servicing, breakdown response, hygiene compliance, or child access require urgent attention.";
  }

  // ══════════════════════════════════════════════════════════════════════
  // RETURN RESULT
  // ══════════════════════════════════════════════════════════════════════

  return {
    appliance_rating,
    appliance_score: score,
    headline,
    total_appliances: totalAppliances,
    servicing_rate: servicingRate,
    breakdown_response_rate: breakdownResponseRate,
    child_access_rate: childAccessRate,
    hygiene_cycle_rate: hygieneCycleRate,
    energy_efficiency_rate: energyEfficiencyRate,
    child_independence_rate: childIndependenceRate,
    average_appliance_age: averageApplianceAge,
    breakdown_resolution_avg_hours: breakdownResolutionAvgHours,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
