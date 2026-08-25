import { above, below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME UTILITY BILLS & COST MANAGEMENT INTELLIGENCE ENGINE
// Monitors how well the home manages utility costs, energy efficiency,
// bill payment timeliness, budget adherence, and sustainability awareness.
// Measures utility cost monitoring, energy efficiency tracking, bill payment
// timeliness, budget adherence, and sustainability awareness.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Business planning and financial viability),
// CHR 2015 Reg 5 (Statement of purpose and home fitness),
// SCCIF: "Leadership and management ensure effective use of resources".
// Store keys: utilityBillRecords, energyEfficiencyRecords,
//             billPaymentRecords, utilityBudgetRecords,
//             sustainabilityRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface UtilityBillRecordInput {
  id: string;
  utility_type: "electricity" | "gas" | "water" | "internet" | "telephone" | "waste" | "oil" | "other";
  provider: string;
  billing_period_start: string;
  billing_period_end: string;
  amount_gbp: number;
  previous_period_amount_gbp: number | null;
  meter_reading_taken: boolean;
  meter_reading_date: string | null;
  usage_units: number | null;
  usage_unit_type: string | null;
  cost_per_unit: number | null;
  standing_charge_gbp: number | null;
  tariff_reviewed: boolean;
  best_deal_confirmed: boolean;
  variance_from_budget_pct: number | null;
  reviewed_by: string;
  review_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface EnergyEfficiencyRecordInput {
  id: string;
  assessment_date: string;
  area_assessed: string;
  insulation_adequate: boolean;
  draught_proofing_ok: boolean;
  heating_system_efficient: boolean;
  lighting_efficient: boolean;
  appliances_energy_rated: boolean;
  thermostat_programmed: boolean;
  windows_double_glazed: boolean;
  energy_certificate_current: boolean;
  efficiency_score: number | null; // 1-5
  improvements_identified: string[];
  improvements_completed: boolean;
  completion_date: string | null;
  estimated_annual_saving_gbp: number | null;
  assessed_by: string;
  created_at: string;
}

export interface BillPaymentRecordInput {
  id: string;
  utility_type: "electricity" | "gas" | "water" | "internet" | "telephone" | "waste" | "oil" | "other";
  provider: string;
  invoice_date: string;
  due_date: string;
  payment_date: string | null;
  amount_gbp: number;
  paid_on_time: boolean;
  payment_method: "direct_debit" | "bank_transfer" | "card" | "cheque" | "other";
  late_payment_fee_gbp: number | null;
  dispute_raised: boolean;
  dispute_resolved: boolean;
  dispute_resolution_date: string | null;
  approved_by: string;
  created_at: string;
}

export interface UtilityBudgetRecordInput {
  id: string;
  financial_year: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  utility_type: "electricity" | "gas" | "water" | "internet" | "telephone" | "waste" | "oil" | "all";
  budgeted_amount_gbp: number;
  actual_amount_gbp: number;
  variance_gbp: number;
  variance_pct: number | null;
  within_budget: boolean;
  overspend_reason: string | null;
  corrective_action_taken: string | null;
  corrective_action_effective: boolean;
  reviewed_by: string;
  review_date: string;
  created_at: string;
}

export interface SustainabilityRecordInput {
  id: string;
  initiative_date: string;
  initiative_type: "recycling" | "energy_reduction" | "water_conservation" | "waste_minimisation" | "renewable_energy" | "education" | "green_procurement" | "other";
  description: string;
  children_involved: boolean;
  children_awareness_activity: boolean;
  staff_trained: boolean;
  measurable_impact: boolean;
  impact_description: string | null;
  estimated_saving_gbp: number | null;
  ongoing: boolean;
  review_date: string | null;
  reviewed: boolean;
  created_at: string;
}

export interface UtilityBillsCostManagementInput {
  today: string;
  total_children: number;
  cost_monitoring_records: UtilityBillRecordInput[];
  energy_efficiency_records: EnergyEfficiencyRecordInput[];
  bill_payment_records: BillPaymentRecordInput[];
  budget_records: UtilityBudgetRecordInput[];
  sustainability_records: SustainabilityRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type UtilityBillsRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface UtilityBillsInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface UtilityBillsRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface UtilityBillsCostManagementResult {
  utility_rating: UtilityBillsRating;
  utility_score: number | null;
  headline: string;
  total_bill_records: number;
  total_payment_records: number;
  cost_monitoring_rate: number | null;
  energy_efficiency_rate: number | null;
  bill_payment_rate: number | null;
  budget_adherence_rate: number | null;
  sustainability_rate: number | null;
  child_awareness_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: UtilityBillsRecommendation[];
  insights: UtilityBillsInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): UtilityBillsRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: UtilityBillsRating,
  score: number,
  headline: string,
): UtilityBillsCostManagementResult {
  return {
    utility_rating: rating,
    utility_score: score,
    headline,
    total_bill_records: 0,
    total_payment_records: 0,
    cost_monitoring_rate: null,
    energy_efficiency_rate: null,
    bill_payment_rate: null,
    budget_adherence_rate: null,
    sustainability_rate: null,
    child_awareness_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeUtilityBillsCostManagement(
  input: UtilityBillsCostManagementInput,
): UtilityBillsCostManagementResult {
  const {
    total_children,
    cost_monitoring_records,
    energy_efficiency_records,
    bill_payment_records,
    budget_records,
    sustainability_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    cost_monitoring_records.length === 0 &&
    energy_efficiency_records.length === 0 &&
    bill_payment_records.length === 0 &&
    budget_records.length === 0 &&
    sustainability_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess utility bills and cost management.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No utility bills or cost management data recorded despite children on placement — financial management of utilities requires urgent attention.",
      ),
      concerns: [
        "No utility bill records, energy efficiency assessments, bill payment tracking, budget monitoring, or sustainability initiatives exist despite children being on placement — the home cannot evidence adequate financial management of utilities or responsible resource stewardship.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of utility bills, energy efficiency assessments, bill payment tracking, budget monitoring, and sustainability initiatives to evidence the home's financial management of utilities and compliance with business planning requirements.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Business planning and financial viability",
        },
        {
          rank: 2,
          recommendation:
            "Establish a utility cost monitoring framework with regular tariff reviews, meter readings, budget tracking, and energy efficiency assessments to demonstrate responsible financial stewardship and ensure resources are used effectively for children's benefit.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Statement of purpose",
        },
      ],
      insights: [
        {
          text: "The complete absence of utility cost management records means the home cannot demonstrate financial viability, responsible resource management, or compliance with Reg 25 business planning requirements. Ofsted expects leaders to ensure effective use of resources to benefit children.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Cost monitoring metrics ---
  const totalBillRecords = cost_monitoring_records.length;

  const meterReadingsTaken = cost_monitoring_records.filter((r) => r.meter_reading_taken).length;
  const meterReadingRate = rate(meterReadingsTaken, totalBillRecords);

  const tariffsReviewed = cost_monitoring_records.filter((r) => r.tariff_reviewed).length;
  const tariffReviewRate = rate(tariffsReviewed, totalBillRecords);

  const bestDealConfirmed = cost_monitoring_records.filter((r) => r.best_deal_confirmed).length;
  const bestDealRate = rate(bestDealConfirmed, totalBillRecords);

  const billsReviewed = cost_monitoring_records.filter((r) => r.review_date !== null && r.review_date !== "").length;

  // Composite cost monitoring rate: meter readings + tariff review + best deal + bill review
  const costMonitoringNumerator = meterReadingsTaken + tariffsReviewed + bestDealConfirmed + billsReviewed;
  const costMonitoringDenominator = totalBillRecords * 4;
  const costMonitoringRate = rate(costMonitoringNumerator, costMonitoringDenominator);

  // Cost variance analysis
  const billsWithPrevious = cost_monitoring_records.filter(
    (r) => r.previous_period_amount_gbp !== null && r.previous_period_amount_gbp! > 0,
  );
  let costIncreaseCount = 0;
  for (const bill of billsWithPrevious) {
    const prev = bill.previous_period_amount_gbp!;
    if (bill.amount_gbp > prev * 1.1) costIncreaseCount++;
  }
  const significantIncreaseRate = rate(costIncreaseCount, billsWithPrevious.length);

  // --- Energy efficiency metrics ---
  const totalEfficiencyRecords = energy_efficiency_records.length;

  const efficiencyChecks = [
    (e: EnergyEfficiencyRecordInput) => e.insulation_adequate,
    (e: EnergyEfficiencyRecordInput) => e.draught_proofing_ok,
    (e: EnergyEfficiencyRecordInput) => e.heating_system_efficient,
    (e: EnergyEfficiencyRecordInput) => e.lighting_efficient,
    (e: EnergyEfficiencyRecordInput) => e.appliances_energy_rated,
    (e: EnergyEfficiencyRecordInput) => e.thermostat_programmed,
    (e: EnergyEfficiencyRecordInput) => e.windows_double_glazed,
    (e: EnergyEfficiencyRecordInput) => e.energy_certificate_current,
  ];
  const totalEffChecksPossible = totalEfficiencyRecords * efficiencyChecks.length;
  let totalEffChecksPassed = 0;
  for (const rec of energy_efficiency_records) {
    for (const check of efficiencyChecks) {
      if (check(rec)) totalEffChecksPassed++;
    }
  }
  const energyEfficiencyRate = rate(totalEffChecksPassed, totalEffChecksPossible);

  const improvementsIdentified = energy_efficiency_records.filter(
    (e) => e.improvements_identified.length > 0,
  ).length;
  const improvementsCompleted = energy_efficiency_records.filter(
    (e) => e.improvements_identified.length > 0 && e.improvements_completed,
  ).length;
  const improvementCompletionRate = rate(improvementsCompleted, improvementsIdentified);

  const effScoreSum = energy_efficiency_records.reduce(
    (sum, e) => sum + (e.efficiency_score ?? 0),
    0,
  );
  const avgEfficiencyScore =
    totalEfficiencyRecords > 0
      ? Math.round((effScoreSum / totalEfficiencyRecords) * 100) / 100
      : null;

  const certificatesCurrent = energy_efficiency_records.filter(
    (e) => e.energy_certificate_current,
  ).length;
  const certificateRate = rate(certificatesCurrent, totalEfficiencyRecords);

  // --- Bill payment metrics ---
  const totalPaymentRecords = bill_payment_records.length;

  const paidOnTime = bill_payment_records.filter((b) => b.paid_on_time).length;
  const billPaymentRate = rate(paidOnTime, totalPaymentRecords);

  const directDebitPayments = bill_payment_records.filter(
    (b) => b.payment_method === "direct_debit",
  ).length;
  const directDebitRate = rate(directDebitPayments, totalPaymentRecords);

  const lateFeesIncurred = bill_payment_records.filter(
    (b) => b.late_payment_fee_gbp !== null && b.late_payment_fee_gbp! > 0,
  ).length;
  const lateFeeRate = rate(lateFeesIncurred, totalPaymentRecords);

  const totalLateFees = bill_payment_records.reduce(
    (sum, b) => sum + (b.late_payment_fee_gbp ?? 0),
    0,
  );

  const disputesRaised = bill_payment_records.filter((b) => b.dispute_raised).length;
  const disputesResolved = bill_payment_records.filter(
    (b) => b.dispute_raised && b.dispute_resolved,
  ).length;
  const disputeResolutionRate = rate(disputesResolved, disputesRaised);

  // --- Budget adherence metrics ---
  const totalBudgetRecords = budget_records.length;

  const withinBudget = budget_records.filter((b) => b.within_budget).length;
  const budgetAdherenceRate = rate(withinBudget, totalBudgetRecords);

  const overspendRecords = budget_records.filter((b) => !b.within_budget);
  const correctiveActionTaken = overspendRecords.filter(
    (b) => b.corrective_action_taken !== null && b.corrective_action_taken !== "",
  ).length;
  const correctiveActionRate = rate(correctiveActionTaken, overspendRecords.length);

  const correctiveActionEffective = overspendRecords.filter(
    (b) => b.corrective_action_effective,
  ).length;
  const correctiveEffectivenessRate = rate(correctiveActionEffective, overspendRecords.length);

  // --- Sustainability metrics ---
  const totalSustainabilityRecords = sustainability_records.length;

  const childrenInvolved = sustainability_records.filter(
    (s) => s.children_involved,
  ).length;
  const childInvolvementRate = rate(childrenInvolved, totalSustainabilityRecords);

  const childAwarenessActivities = sustainability_records.filter(
    (s) => s.children_awareness_activity,
  ).length;
  const childAwarenessRate = rate(childAwarenessActivities, totalSustainabilityRecords);

  const staffTrained = sustainability_records.filter(
    (s) => s.staff_trained,
  ).length;
  const staffTrainingRate = rate(staffTrained, totalSustainabilityRecords);

  const measurableImpact = sustainability_records.filter(
    (s) => s.measurable_impact,
  ).length;
  const measurableImpactRate = rate(measurableImpact, totalSustainabilityRecords);

  const reviewedInitiatives = sustainability_records.filter(
    (s) => s.reviewed,
  ).length;

  // Composite sustainability rate: children involved + awareness + staff trained + measurable impact + reviewed
  const sustainabilityNumerator = childrenInvolved + childAwarenessActivities + staffTrained + measurableImpact + reviewedInitiatives;
  const sustainabilityDenominator = totalSustainabilityRecords * 5;
  const sustainabilityRate = rate(sustainabilityNumerator, sustainabilityDenominator);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: costMonitoringRate (>=90: +5, >=70: +3) ---
  if (meets(costMonitoringRate, 90)) score += 5;
  else if (meets(costMonitoringRate, 70)) score += 3;

  // --- Bonus 2: energyEfficiencyRate (>=90: +5, >=70: +3) ---
  if (meets(energyEfficiencyRate, 90)) score += 5;
  else if (meets(energyEfficiencyRate, 70)) score += 3;

  // --- Bonus 3: billPaymentRate (>=95: +5, >=80: +3) ---
  if (meets(billPaymentRate, 95)) score += 5;
  else if (meets(billPaymentRate, 80)) score += 3;

  // --- Bonus 4: budgetAdherenceRate (>=90: +5, >=70: +3) ---
  if (meets(budgetAdherenceRate, 90)) score += 5;
  else if (meets(budgetAdherenceRate, 70)) score += 3;

  // --- Bonus 5: sustainabilityRate (>=80: +4, >=60: +2) ---
  if (meets(sustainabilityRate, 80)) score += 4;
  else if (meets(sustainabilityRate, 60)) score += 2;

  // --- Bonus 6: childAwarenessRate (>=80: +4, >=50: +2) ---
  if (meets(childAwarenessRate, 80)) score += 4;
  else if (meets(childAwarenessRate, 50)) score += 2;

  // Max bonuses: 5+5+5+5+4+4 = 28 ✓

  // ── Penalties (4 guarded) ─────────────────────────────────────────────

  // billPaymentRate < 60 → -5
  if (below(billPaymentRate, 60) && totalPaymentRecords > 0) score -= 5;

  // budgetAdherenceRate < 40 → -5
  if (below(budgetAdherenceRate, 40) && totalBudgetRecords > 0) score -= 5;

  // costMonitoringRate < 40 → -4
  if (below(costMonitoringRate, 40) && totalBillRecords > 0) score -= 4;

  // energyEfficiencyRate < 40 → -4
  if (below(energyEfficiencyRate, 40) && totalEfficiencyRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const utility_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(costMonitoringRate, 90) && totalBillRecords > 0) {
    strengths.push(
      `${costMonitoringRate}% cost monitoring compliance — utility bills are consistently reviewed with meter readings taken, tariffs compared, and best deals confirmed, demonstrating proactive financial stewardship.`,
    );
  } else if (meets(costMonitoringRate, 70) && totalBillRecords > 0) {
    strengths.push(
      `${costMonitoringRate}% cost monitoring compliance — the home generally maintains good oversight of utility costs with regular reviews and tariff checks.`,
    );
  }

  if (meets(energyEfficiencyRate, 90) && totalEfficiencyRecords > 0) {
    strengths.push(
      `${energyEfficiencyRate}% energy efficiency compliance — the home consistently meets high standards across insulation, heating, lighting, appliances, and building fabric, minimising energy waste and costs.`,
    );
  } else if (meets(energyEfficiencyRate, 70) && totalEfficiencyRecords > 0) {
    strengths.push(
      `${energyEfficiencyRate}% energy efficiency compliance — the majority of energy efficiency standards are met across the home's assessed areas.`,
    );
  }

  if (meets(billPaymentRate, 95) && totalPaymentRecords > 0) {
    strengths.push(
      `${billPaymentRate}% bill payment timeliness — virtually all utility bills are paid on time, avoiding late fees and demonstrating excellent financial administration.`,
    );
  } else if (meets(billPaymentRate, 80) && totalPaymentRecords > 0) {
    strengths.push(
      `${billPaymentRate}% bill payment timeliness — the home maintains generally good payment practices for utility bills.`,
    );
  }

  if (meets(budgetAdherenceRate, 90) && totalBudgetRecords > 0) {
    strengths.push(
      `${budgetAdherenceRate}% budget adherence — utility spending is consistently within budgeted amounts, demonstrating strong financial planning and cost control aligned with Reg 25 requirements.`,
    );
  } else if (meets(budgetAdherenceRate, 70) && totalBudgetRecords > 0) {
    strengths.push(
      `${budgetAdherenceRate}% budget adherence — the home generally maintains utility spending within budgeted limits.`,
    );
  }

  if (meets(sustainabilityRate, 80) && totalSustainabilityRecords > 0) {
    strengths.push(
      `${sustainabilityRate}% sustainability programme quality — the home runs comprehensive sustainability initiatives involving children and staff, with measurable environmental impact and regular review.`,
    );
  } else if (meets(sustainabilityRate, 60) && totalSustainabilityRecords > 0) {
    strengths.push(
      `${sustainabilityRate}% sustainability programme quality — the home operates meaningful sustainability initiatives with reasonable scope and engagement.`,
    );
  }

  if (meets(childAwarenessRate, 80) && totalSustainabilityRecords > 0) {
    strengths.push(
      `${childAwarenessRate}% child awareness engagement — children are actively involved in sustainability education and awareness activities, building life skills around responsible resource use.`,
    );
  } else if (meets(childAwarenessRate, 50) && totalSustainabilityRecords > 0) {
    strengths.push(
      `${childAwarenessRate}% child awareness engagement — children participate in some sustainability education and awareness activities.`,
    );
  }

  if (meets(directDebitRate, 90) && totalPaymentRecords > 0) {
    strengths.push(
      `${directDebitRate}% of bills paid via direct debit — automated payment ensures consistency and reduces risk of missed payments.`,
    );
  }

  if (meets(bestDealRate, 90) && totalBillRecords > 0) {
    strengths.push(
      `${bestDealRate}% of utility tariffs confirmed as best available deal — the home actively ensures value for money in its utility procurement.`,
    );
  }

  if (meets(improvementCompletionRate, 90) && improvementsIdentified > 0) {
    strengths.push(
      `${improvementCompletionRate}% of identified energy efficiency improvements completed — the home follows through on opportunities to reduce energy waste and costs.`,
    );
  }

  if (meets(disputeResolutionRate, 90) && disputesRaised > 0) {
    strengths.push(
      `${disputeResolutionRate}% of billing disputes resolved — the home effectively challenges and resolves incorrect or disputed utility charges.`,
    );
  }

  if (meets(staffTrainingRate, 90) && totalSustainabilityRecords > 0) {
    strengths.push(
      `${staffTrainingRate}% staff training rate on sustainability — staff are consistently trained in energy-saving and sustainability practices, supporting a whole-home approach to resource management.`,
    );
  }

  if (meets(measurableImpactRate, 80) && totalSustainabilityRecords > 0) {
    strengths.push(
      `${measurableImpactRate}% of sustainability initiatives demonstrate measurable impact — the home tracks and evidences the real-world effect of its environmental programmes.`,
    );
  }

  if (meets(meterReadingRate, 90) && totalBillRecords > 0) {
    strengths.push(
      `${meterReadingRate}% meter reading compliance — regular readings ensure bills are based on actual usage rather than estimates, supporting accurate cost monitoring.`,
    );
  }

  if (meets(correctiveActionRate, 90) && overspendRecords.length > 0) {
    strengths.push(
      `${correctiveActionRate}% corrective action taken on budget overspends — the home responds proactively to spending variances with documented corrective measures.`,
    );
  }

  if ((avgEfficiencyScore ?? 0) >= 4.0 && totalEfficiencyRecords > 0) {
    strengths.push(
      `Average energy efficiency score of ${avgEfficiencyScore}/5 — the home consistently achieves high efficiency ratings across its energy assessments.`,
    );
  } else if ((avgEfficiencyScore ?? 0) >= 3.5 && totalEfficiencyRecords > 0) {
    strengths.push(
      `Average energy efficiency score of ${avgEfficiencyScore}/5 — the home generally achieves reasonable efficiency across assessed areas.`,
    );
  }

  if (meets(childInvolvementRate, 80) && totalSustainabilityRecords > 0) {
    strengths.push(
      `${childInvolvementRate}% child involvement in sustainability initiatives — children are active participants in the home's environmental programmes, building independence skills and responsibility.`,
    );
  }

  if (lateFeeRate === 0 && totalPaymentRecords > 0) {
    strengths.push(
      "Zero late payment fees incurred — all utility bills paid within terms, demonstrating financial discipline and protecting the home from unnecessary costs.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(costMonitoringRate, 40) && totalBillRecords > 0) {
    concerns.push(
      `Only ${costMonitoringRate}% cost monitoring compliance — the majority of utility bills are not being properly reviewed, with tariffs uncompared and meter readings not taken. The home cannot evidence it is achieving value for money on utility expenditure.`,
    );
  } else if (below(costMonitoringRate, 70) && meets(costMonitoringRate, 40) && totalBillRecords > 0) {
    concerns.push(
      `Cost monitoring compliance at ${costMonitoringRate}% — utility bill oversight is inconsistent, with gaps in meter reading, tariff review, and best-deal confirmation.`,
    );
  }

  if (below(energyEfficiencyRate, 40) && totalEfficiencyRecords > 0) {
    concerns.push(
      `Only ${energyEfficiencyRate}% energy efficiency compliance — significant deficiencies in insulation, heating, lighting, or building fabric mean the home is wasting energy and incurring unnecessary costs that reduce resources available for children's care.`,
    );
  } else if (below(energyEfficiencyRate, 70) && meets(energyEfficiencyRate, 40) && totalEfficiencyRecords > 0) {
    concerns.push(
      `Energy efficiency compliance at ${energyEfficiencyRate}% — some efficiency standards are not consistently met, resulting in avoidable energy waste and higher costs.`,
    );
  }

  if (below(billPaymentRate, 60) && totalPaymentRecords > 0) {
    concerns.push(
      `Only ${billPaymentRate}% bill payment timeliness — the majority of utility bills are not paid on time, incurring late fees and potentially risking service disconnection. This undermines the home's financial stability and viability.`,
    );
  } else if (below(billPaymentRate, 80) && meets(billPaymentRate, 60) && totalPaymentRecords > 0) {
    concerns.push(
      `Bill payment timeliness at ${billPaymentRate}% — a significant proportion of utility bills are paid late, incurring avoidable late fees and indicating weak financial administration.`,
    );
  }

  if (below(budgetAdherenceRate, 40) && totalBudgetRecords > 0) {
    concerns.push(
      `Only ${budgetAdherenceRate}% budget adherence — utility spending is consistently exceeding budgets, raising serious questions about the home's financial planning and viability under Reg 25.`,
    );
  } else if (below(budgetAdherenceRate, 70) && meets(budgetAdherenceRate, 40) && totalBudgetRecords > 0) {
    concerns.push(
      `Budget adherence at ${budgetAdherenceRate}% — utility spending frequently exceeds budgets, suggesting cost control measures are insufficient.`,
    );
  }

  if (below(sustainabilityRate, 40) && totalSustainabilityRecords > 0) {
    concerns.push(
      `Only ${sustainabilityRate}% sustainability programme quality — sustainability initiatives lack child involvement, staff training, measurable outcomes, and regular review, meaning the home cannot evidence a meaningful approach to environmental responsibility.`,
    );
  } else if (below(sustainabilityRate, 60) && meets(sustainabilityRate, 40) && totalSustainabilityRecords > 0) {
    concerns.push(
      `Sustainability programme quality at ${sustainabilityRate}% — initiatives exist but lack comprehensive engagement, measurable impact, or consistent review.`,
    );
  }

  if (below(childAwarenessRate, 30) && totalSustainabilityRecords > 0) {
    concerns.push(
      `Only ${childAwarenessRate}% child awareness engagement — children are largely excluded from sustainability awareness and education activities, missing opportunities to develop life skills around responsible resource use.`,
    );
  } else if (below(childAwarenessRate, 50) && meets(childAwarenessRate, 30) && totalSustainabilityRecords > 0) {
    concerns.push(
      `Child awareness engagement at ${childAwarenessRate}% — fewer than half of sustainability initiatives include children's awareness activities.`,
    );
  }

  if (totalLateFees > 0 && totalPaymentRecords > 0) {
    concerns.push(
      `Total late payment fees of £${totalLateFees.toFixed(2)} incurred — these represent avoidable costs that reduce resources available for children's direct care and wellbeing.`,
    );
  }

  if (above(significantIncreaseRate, 50) && billsWithPrevious.length > 0) {
    concerns.push(
      `${significantIncreaseRate}% of utility bills show significant cost increases (>10% from previous period) — unmanaged cost escalation may threaten financial viability and resource allocation for children.`,
    );
  }

  if (below(improvementCompletionRate, 50) && improvementsIdentified > 0) {
    concerns.push(
      `Only ${improvementCompletionRate}% of identified energy efficiency improvements completed — opportunities to reduce costs and improve the home environment are not being followed through.`,
    );
  }

  if (below(correctiveActionRate, 50) && overspendRecords.length > 0) {
    concerns.push(
      `Only ${correctiveActionRate}% corrective action taken on budget overspends — the home identifies overspending but fails to take corrective measures to bring spending back within budget.`,
    );
  }

  if (below(meterReadingRate, 50) && totalBillRecords > 0) {
    concerns.push(
      `Only ${meterReadingRate}% meter reading rate — without regular readings, the home may be billed on estimates which could result in significant over- or under-payment.`,
    );
  }

  if (totalBillRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No utility bill monitoring records exist despite children being on placement — the home cannot evidence that utility costs are being tracked, reviewed, or managed to ensure value for money.",
    );
  }

  if (totalBudgetRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No utility budget records exist — the home cannot demonstrate budget planning or adherence monitoring for utility expenditure, a core requirement of Reg 25 financial management.",
    );
  }

  if (totalPaymentRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No bill payment records exist — the home cannot evidence that utility bills are being paid on time or that payment processes are managed effectively.",
    );
  }

  if (below(certificateRate, 50) && totalEfficiencyRecords > 0) {
    concerns.push(
      `Only ${certificateRate}% of energy efficiency assessments have current energy certificates — an up-to-date energy performance certificate is required and demonstrates compliance with environmental standards.`,
    );
  }

  if ((avgEfficiencyScore ?? 0) < 2.5 && totalEfficiencyRecords > 0) {
    concerns.push(
      `Average energy efficiency score at only ${avgEfficiencyScore}/5 — the home is consistently underperforming on energy efficiency, leading to waste and higher operating costs.`,
    );
  } else if ((avgEfficiencyScore ?? 0) < 3.0 && (avgEfficiencyScore ?? 0) >= 2.5 && totalEfficiencyRecords > 0) {
    concerns.push(
      `Average energy efficiency score at ${avgEfficiencyScore}/5 — efficiency across the home is below acceptable standards, indicating systematic issues requiring investment.`,
    );
  }

  if (below(staffTrainingRate, 40) && totalSustainabilityRecords > 0) {
    concerns.push(
      `Only ${staffTrainingRate}% staff training rate on sustainability practices — without trained staff, sustainability initiatives lack consistent implementation and children miss out on learning from role models.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: UtilityBillsRecommendation[] = [];
  let rank = 0;

  if (below(billPaymentRate, 60) && totalPaymentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and improve bill payment processes — late payments risk service disconnection, incur unnecessary fees, and indicate poor financial administration. Establish direct debit arrangements where possible and implement payment tracking with clear accountability.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Business planning and financial viability",
    });
  }

  if (below(budgetAdherenceRate, 40) && totalBudgetRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an immediate review of utility budgets and spending — persistent overspending on utilities threatens the home's financial viability. Identify root causes of budget overruns and implement robust cost control measures with regular monitoring.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Business planning and financial viability",
    });
  }

  if (below(costMonitoringRate, 40) && totalBillRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement comprehensive utility cost monitoring — establish regular meter readings, systematic tariff reviews, and best-deal comparisons for all utility types. Without active monitoring, the home cannot evidence value for money or identify cost-saving opportunities.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Business planning and financial viability",
    });
  }

  if (below(energyEfficiencyRate, 40) && totalEfficiencyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission a comprehensive energy efficiency review of the property — address insulation, heating systems, lighting, and building fabric deficiencies that are driving unnecessary energy waste and costs. Prioritise improvements by cost-benefit impact.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Statement of purpose",
    });
  }

  if (totalBillRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement immediate recording and review of all utility bills — document provider details, costs, meter readings, tariff reviews, and cost comparisons to establish baseline cost monitoring.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Business planning and financial viability",
    });
  }

  if (totalBudgetRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish utility budgets with quarterly monitoring — set realistic budgets for each utility type and implement regular variance analysis to ensure financial planning compliance under Reg 25.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Business planning and financial viability",
    });
  }

  if (totalPaymentRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commence recording of all utility bill payments — document payment dates, amounts, methods, and timeliness to evidence effective financial administration.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Business planning and financial viability",
    });
  }

  if (meets(billPaymentRate, 60) && below(billPaymentRate, 80) && totalPaymentRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve bill payment timeliness to at least 80% — review payment scheduling and consider switching to direct debit for regular bills to reduce late payments and associated fees.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Business planning and financial viability",
    });
  }

  if (meets(budgetAdherenceRate, 40) && below(budgetAdherenceRate, 70) && totalBudgetRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen budget adherence by implementing monthly cost tracking and early-warning alerts when spending approaches budget limits — review and adjust budgets where necessary to ensure they are realistic.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Business planning and financial viability",
    });
  }

  if (meets(costMonitoringRate, 40) && below(costMonitoringRate, 70) && totalBillRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve cost monitoring consistency — ensure all bills receive meter readings, tariff reviews, best-deal checks, and documented management review. Assign clear accountability for each step.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Business planning and financial viability",
    });
  }

  if (below(improvementCompletionRate, 50) && improvementsIdentified > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a tracker for energy efficiency improvements — ensure identified opportunities are prioritised by cost-benefit and completed within agreed timescales to reduce ongoing waste.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Statement of purpose",
    });
  }

  if (below(correctiveActionRate, 50) && overspendRecords.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a requirement for documented corrective action whenever utility spending exceeds budget — identifying overspends without acting on them fails to demonstrate effective financial management.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Business planning and financial viability",
    });
  }

  if (below(childAwarenessRate, 50) && totalSustainabilityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Integrate children's awareness activities into sustainability initiatives — teach children about energy conservation, water saving, and responsible resource use as part of preparing them for independence.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (meets(energyEfficiencyRate, 40) && below(energyEfficiencyRate, 70) && totalEfficiencyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve energy efficiency standards — address specific areas where the property falls short on insulation, heating efficiency, lighting, and appliance ratings to reduce costs and environmental impact.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Statement of purpose",
    });
  }

  if (below(sustainabilityRate, 60) && meets(sustainabilityRate, 40) && totalSustainabilityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance sustainability programme quality — ensure initiatives include staff training, children's involvement, measurable impact tracking, and regular review to build a genuine culture of environmental responsibility.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (below(staffTrainingRate, 60) && totalSustainabilityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide sustainability training for staff — staff who understand energy-saving practices and environmental responsibility are better equipped to model and teach these behaviours to children.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  if (below(meterReadingRate, 70) && totalBillRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a regular meter reading schedule for all utilities — accurate readings prevent estimated billing, enable trend analysis, and support proactive cost management.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Business planning and financial viability",
    });
  }

  if (below(tariffReviewRate, 70) && totalBillRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement annual tariff reviews for all utility providers — switching to more competitive tariffs can generate significant savings that benefit children's care budgets.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Business planning and financial viability",
    });
  }

  if (totalSustainabilityRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop and implement sustainability initiatives — introduce recycling, energy reduction, and water conservation programmes that involve children, building their understanding of environmental responsibility and preparing them for independent living.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Leadership and management",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: UtilityBillsInsight[] = [];

  // -- Critical insights --

  if (below(billPaymentRate, 60) && totalPaymentRecords > 0) {
    insights.push({
      text: `Only ${billPaymentRate}% bill payment timeliness. Persistent late payment of utility bills risks service disconnection, incurs unnecessary late fees, and is a significant indicator of poor financial management. Ofsted expects homes to demonstrate financial viability and responsible administration under Reg 25.`,
      severity: "critical",
    });
  }

  if (below(budgetAdherenceRate, 40) && totalBudgetRecords > 0) {
    insights.push({
      text: `Only ${budgetAdherenceRate}% budget adherence. Consistent utility budget overruns indicate fundamental issues with financial planning and cost control. Under Reg 25, the home must demonstrate that it is financially viable and that resources are managed effectively for children's benefit.`,
      severity: "critical",
    });
  }

  if (below(costMonitoringRate, 40) && totalBillRecords > 0) {
    insights.push({
      text: `Only ${costMonitoringRate}% cost monitoring compliance. Without systematic bill review, meter readings, and tariff comparisons, the home cannot evidence that it is achieving value for money on utility expenditure. This represents a failure to demonstrate effective resource management.`,
      severity: "critical",
    });
  }

  if (below(energyEfficiencyRate, 40) && totalEfficiencyRecords > 0) {
    insights.push({
      text: `Only ${energyEfficiencyRate}% energy efficiency compliance. Poor energy efficiency directly increases operating costs, reducing the resources available for children's care. It also affects children's comfort and wellbeing through inadequate heating, insulation, or ventilation.`,
      severity: "critical",
    });
  }

  if (totalBillRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No utility bill monitoring records exist despite children being on placement. Without cost tracking, the home cannot demonstrate compliance with Reg 25 business planning requirements or evidence that resources are being used effectively.",
      severity: "critical",
    });
  }

  if (totalBudgetRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No utility budget records exist. Ofsted expects registered providers to have clear financial plans demonstrating viability. The absence of budgeting for utilities — a major operational cost — is a fundamental gap in business planning evidence.",
      severity: "critical",
    });
  }

  if (totalPaymentRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No bill payment tracking exists. Without payment records, the home cannot evidence that bills are paid on time or that financial administration processes are effective. Late payments risk service interruption and undermine financial stability.",
      severity: "critical",
    });
  }

  if (totalLateFees > 100 && totalPaymentRecords > 0) {
    insights.push({
      text: `Total late payment fees of £${totalLateFees.toFixed(2)} represent a waste of resources that should be directed toward children's care. Every pound spent on avoidable late fees is a pound diverted from activities, equipment, or support that could benefit children directly.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (meets(costMonitoringRate, 40) && below(costMonitoringRate, 70) && totalBillRecords > 0) {
    insights.push({
      text: `Cost monitoring compliance at ${costMonitoringRate}% — improving but inconsistent. Gaps in meter readings, tariff reviews, or best-deal checks mean the home may not be identifying all available savings or spotting billing errors.`,
      severity: "warning",
    });
  }

  if (meets(energyEfficiencyRate, 40) && below(energyEfficiencyRate, 70) && totalEfficiencyRecords > 0) {
    insights.push({
      text: `Energy efficiency compliance at ${energyEfficiencyRate}% — some areas of the property are not meeting efficiency standards. Each unaddressed inefficiency contributes to higher operating costs and may affect children's comfort.`,
      severity: "warning",
    });
  }

  if (meets(billPaymentRate, 60) && below(billPaymentRate, 80) && totalPaymentRecords > 0) {
    insights.push({
      text: `Bill payment timeliness at ${billPaymentRate}% — some payments are consistently late. While services are not at immediate risk, late fees accumulate and the pattern suggests administrative processes need tightening.`,
      severity: "warning",
    });
  }

  if (meets(budgetAdherenceRate, 40) && below(budgetAdherenceRate, 70) && totalBudgetRecords > 0) {
    insights.push({
      text: `Budget adherence at ${budgetAdherenceRate}% — utility spending is frequently exceeding planned budgets. While occasional variances are expected, a pattern of overspending requires investigation into root causes and budget realism.`,
      severity: "warning",
    });
  }

  if (meets(sustainabilityRate, 40) && below(sustainabilityRate, 60) && totalSustainabilityRecords > 0) {
    insights.push({
      text: `Sustainability programme quality at ${sustainabilityRate}% — initiatives exist but lack comprehensive engagement, measurable outcomes, or consistent review. A stronger sustainability programme demonstrates responsible leadership and provides valuable learning for children.`,
      severity: "warning",
    });
  }

  if (meets(childAwarenessRate, 30) && below(childAwarenessRate, 50) && totalSustainabilityRecords > 0) {
    insights.push({
      text: `Child awareness engagement at ${childAwarenessRate}% — opportunities to involve children in understanding energy use, costs, and sustainability are being underutilised. These skills are important preparation for independent living.`,
      severity: "warning",
    });
  }

  if (meets(improvementCompletionRate, 30) && below(improvementCompletionRate, 70) && improvementsIdentified > 0) {
    insights.push({
      text: `Energy efficiency improvement completion at ${improvementCompletionRate}% — identified opportunities to reduce costs and improve the property are not being consistently followed through. Each incomplete improvement represents ongoing waste.`,
      severity: "warning",
    });
  }

  if (above(significantIncreaseRate, 30) && significantIncreaseRate! <= 50 && billsWithPrevious.length > 0) {
    insights.push({
      text: `${significantIncreaseRate}% of utility bills show significant cost increases from previous periods — while some increases reflect market conditions, the pattern warrants investigation to identify controllable factors.`,
      severity: "warning",
    });
  }

  if (meets(correctiveActionRate, 30) && below(correctiveActionRate, 70) && overspendRecords.length > 0) {
    insights.push({
      text: `Corrective action rate on overspends at ${correctiveActionRate}% — not all budget variances are being addressed with documented corrective measures, weakening the home's financial management evidence.`,
      severity: "warning",
    });
  }

  if (meets(meterReadingRate, 40) && below(meterReadingRate, 70) && totalBillRecords > 0) {
    insights.push({
      text: `Meter reading rate at ${meterReadingRate}% — inconsistent readings mean some bills may be based on estimates rather than actual usage, making it difficult to identify trends or wastage.`,
      severity: "warning",
    });
  }

  // Utility type cost analysis
  const utilityTypeCosts: Record<string, number> = {};
  for (const bill of cost_monitoring_records) {
    utilityTypeCosts[bill.utility_type] = (utilityTypeCosts[bill.utility_type] ?? 0) + bill.amount_gbp;
  }
  const topCosts = Object.entries(utilityTypeCosts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topCosts.length > 0) {
    const formatted = topCosts
      .map(([type, cost]) => `${type.replace(/_/g, " ")} (£${cost.toFixed(2)})`)
      .join(", ");
    insights.push({
      text: `Highest utility costs by type: ${formatted}. Understanding cost distribution enables targeted efficiency improvements and budget allocation — focus cost reduction efforts on the largest spending categories.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (utility_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding utility bills and cost management — costs are actively monitored, bills paid on time, budgets adhered to, energy efficiency is high, and sustainability initiatives involve children meaningfully. This is strong evidence for Reg 25 compliance and effective resource stewardship.",
      severity: "positive",
    });
  }

  if (meets(costMonitoringRate, 90) && meets(bestDealRate, 90) && totalBillRecords > 0) {
    insights.push({
      text: `${costMonitoringRate}% cost monitoring with ${bestDealRate}% best-deal confirmation — the combination of thorough bill review and active tariff management demonstrates that the home maximises value for money on utility expenditure, directly benefiting children's care budgets.`,
      severity: "positive",
    });
  }

  if (meets(billPaymentRate, 95) && lateFeeRate === 0 && totalPaymentRecords > 0) {
    insights.push({
      text: `${billPaymentRate}% bill payment timeliness with zero late fees — exemplary financial administration ensures no resources are wasted on avoidable charges. This demonstrates the strong financial discipline expected under Reg 25.`,
      severity: "positive",
    });
  }

  if (meets(budgetAdherenceRate, 90) && totalBudgetRecords > 0) {
    insights.push({
      text: `${budgetAdherenceRate}% budget adherence — utility spending is consistently managed within planned limits, demonstrating that the home's financial planning is realistic, monitored, and controlled effectively.`,
      severity: "positive",
    });
  }

  if (meets(energyEfficiencyRate, 90) && totalEfficiencyRecords > 0) {
    insights.push({
      text: `${energyEfficiencyRate}% energy efficiency compliance — the home's property is maintained to high efficiency standards, minimising energy waste and ensuring children live in well-insulated, well-heated, and comfortable environments.`,
      severity: "positive",
    });
  }

  if (meets(sustainabilityRate, 80) && meets(childAwarenessRate, 80) && totalSustainabilityRecords > 0) {
    insights.push({
      text: `${sustainabilityRate}% sustainability quality with ${childAwarenessRate}% child awareness — the home operates a comprehensive sustainability programme that actively engages children in environmental learning, building valuable independence skills and civic responsibility.`,
      severity: "positive",
    });
  }

  if (meets(childAwarenessRate, 80) && totalSustainabilityRecords > 0) {
    insights.push({
      text: `${childAwarenessRate}% child awareness engagement in sustainability — children are regularly involved in understanding energy use, costs, and environmental impact. This practical life skills education prepares them for managing household costs independently in the future.`,
      severity: "positive",
    });
  }

  if (meets(improvementCompletionRate, 90) && improvementsIdentified > 0) {
    insights.push({
      text: `${improvementCompletionRate}% energy efficiency improvement completion — the home consistently acts on identified opportunities to improve energy performance, demonstrating a proactive approach to cost reduction and environmental responsibility.`,
      severity: "positive",
    });
  }

  if (meets(directDebitRate, 90) && meets(billPaymentRate, 95) && totalPaymentRecords > 0) {
    insights.push({
      text: `${directDebitRate}% direct debit usage with ${billPaymentRate}% on-time payment — the home has established reliable, automated payment processes that ensure financial obligations are met consistently without administrative burden.`,
      severity: "positive",
    });
  }

  if (meets(correctiveActionRate, 90) && meets(correctiveEffectivenessRate, 80) && overspendRecords.length > 0) {
    insights.push({
      text: `${correctiveActionRate}% corrective action rate with ${correctiveEffectivenessRate}% effectiveness — when budget overruns occur, the home takes effective corrective action. This demonstrates the responsive financial management Ofsted expects under Reg 25.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (utility_rating === "outstanding") {
    headline =
      "Outstanding utility bills and cost management — costs are actively monitored, bills paid on time, budgets adhered to, and sustainability initiatives engage children effectively.";
  } else if (utility_rating === "good") {
    headline = `Good utility bills and cost management — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (utility_rating === "adequate") {
    headline = `Adequate utility bills and cost management — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure effective financial management and resource stewardship.`;
  } else {
    headline = `Utility bills and cost management is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure financial viability and responsible resource management.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    utility_rating,
    utility_score: score,
    headline,
    total_bill_records: totalBillRecords,
    total_payment_records: totalPaymentRecords,
    cost_monitoring_rate: costMonitoringRate,
    energy_efficiency_rate: energyEfficiencyRate,
    bill_payment_rate: billPaymentRate,
    budget_adherence_rate: budgetAdherenceRate,
    sustainability_rate: sustainabilityRate,
    child_awareness_rate: childAwarenessRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
