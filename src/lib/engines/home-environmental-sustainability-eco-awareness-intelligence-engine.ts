import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ENVIRONMENTAL SUSTAINABILITY & ECO-AWARENESS INTELLIGENCE ENGINE
// Monitors the home's environmental sustainability practices including energy
// usage tracking, recycling compliance, eco-education programmes, sustainability
// practices, and carbon footprint monitoring.
// Measures energy efficiency, recycling rates, eco-education engagement,
// sustainability practice adoption, carbon awareness, and child participation.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 12 (Enjoyment & achievement), Reg 6 (Quality and purpose of care).
// SCCIF: "Quality of care", "Living in the home".
// Store keys: energyUsageRecords, recyclingRecords, ecoEducationRecords,
//             sustainabilityPracticeRecords, carbonFootprintRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface EnergyUsageRecordInput {
  id: string;
  period_start: string;
  period_end: string;
  energy_type: "electricity" | "gas" | "solar" | "water" | "other";
  usage_kwh: number;
  target_kwh: number;
  cost_gbp: number;
  within_target: boolean;
  energy_saving_measures_active: number;
  energy_saving_measures_total: number;
  smart_meter_installed: boolean;
  reading_verified: boolean;
  notes: string;
  created_at: string;
}

export interface RecyclingRecordInput {
  id: string;
  date: string;
  recycling_type: "paper" | "plastic" | "glass" | "metal" | "organic" | "electronic" | "textile" | "general";
  compliant: boolean;
  contamination_found: boolean;
  weight_kg: number;
  child_participated: boolean;
  child_id: string | null;
  bins_correctly_used: boolean;
  collection_missed: boolean;
  notes: string;
  created_at: string;
}

export interface EcoEducationRecordInput {
  id: string;
  child_id: string;
  date: string;
  programme_name: string;
  programme_type: "workshop" | "project" | "trip" | "lesson" | "campaign" | "gardening" | "other";
  attended: boolean;
  engaged: boolean;
  learning_outcome_met: boolean;
  child_feedback_positive: boolean;
  duration_minutes: number;
  facilitator: string;
  linked_to_curriculum: boolean;
  created_at: string;
}

export interface SustainabilityPracticeRecordInput {
  id: string;
  practice_name: string;
  category: "energy" | "waste" | "water" | "food" | "transport" | "biodiversity" | "purchasing" | "other";
  implemented: boolean;
  implementation_date: string | null;
  review_date: string | null;
  effectiveness_rating: number; // 1-5
  children_involved: boolean;
  staff_trained: boolean;
  documented: boolean;
  cost_saving_gbp: number;
  notes: string;
  created_at: string;
}

export interface CarbonFootprintRecordInput {
  id: string;
  period_start: string;
  period_end: string;
  category: "energy" | "transport" | "waste" | "food" | "water" | "other";
  co2_kg: number;
  target_co2_kg: number;
  within_target: boolean;
  offset_applied: boolean;
  offset_kg: number;
  reduction_actions_planned: number;
  reduction_actions_completed: number;
  children_aware: boolean;
  notes: string;
  created_at: string;
}

export interface EnvironmentalSustainabilityEcoAwarenessInput {
  today: string;
  total_children: number;
  energy_usage_records: EnergyUsageRecordInput[];
  recycling_records: RecyclingRecordInput[];
  eco_education_records: EcoEducationRecordInput[];
  sustainability_practice_records: SustainabilityPracticeRecordInput[];
  carbon_footprint_records: CarbonFootprintRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SustainabilityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SustainabilityInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface SustainabilityRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface EnvironmentalSustainabilityEcoAwarenessResult {
  sustainability_rating: SustainabilityRating;
  sustainability_score: number | null;
  headline: string;
  total_energy_records: number;
  total_recycling_records: number;
  total_eco_education_records: number;
  total_sustainability_practices: number;
  total_carbon_records: number;
  energy_efficiency_rate: number | null;
  recycling_compliance_rate: number | null;
  eco_education_engagement_rate: number | null;
  sustainability_practice_score: number | null;
  carbon_awareness_rate: number | null;
  child_participation_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: SustainabilityRecommendation[];
  insights: SustainabilityInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): SustainabilityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: SustainabilityRating,
  score: number,
  headline: string,
): EnvironmentalSustainabilityEcoAwarenessResult {
  return {
    sustainability_rating: rating,
    sustainability_score: score,
    headline,
    total_energy_records: 0,
    total_recycling_records: 0,
    total_eco_education_records: 0,
    total_sustainability_practices: 0,
    total_carbon_records: 0,
    energy_efficiency_rate: null,
    recycling_compliance_rate: null,
    eco_education_engagement_rate: null,
    sustainability_practice_score: 0,
    carbon_awareness_rate: null,
    child_participation_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeEnvironmentalSustainabilityEcoAwareness(
  input: EnvironmentalSustainabilityEcoAwarenessInput,
): EnvironmentalSustainabilityEcoAwarenessResult {
  const {
    total_children,
    energy_usage_records,
    recycling_records,
    eco_education_records,
    sustainability_practice_records,
    carbon_footprint_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    energy_usage_records.length === 0 &&
    recycling_records.length === 0 &&
    eco_education_records.length === 0 &&
    sustainability_practice_records.length === 0 &&
    carbon_footprint_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess environmental sustainability and eco-awareness.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No environmental sustainability or eco-awareness data recorded despite children on placement — sustainability practices and eco-education require urgent attention.",
      ),
      concerns: [
        "No energy usage records, recycling records, eco-education programmes, sustainability practices, or carbon footprint records exist despite children being on placement — the home cannot evidence environmental responsibility or eco-awareness education.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of energy usage, recycling compliance, eco-education programmes, sustainability practices, and carbon footprint monitoring to evidence the home's environmental responsibility and children's eco-awareness.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
        },
        {
          rank: 2,
          recommendation:
            "Develop an eco-education programme that engages children in understanding sustainability, recycling, energy conservation, and environmental responsibility as part of their personal development.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 12 — Enjoyment and achievement",
        },
      ],
      insights: [
        {
          text: "The complete absence of environmental sustainability records means the home cannot demonstrate environmental responsibility, eco-awareness education for children, or commitment to sustainable practice. This represents a gap in quality of care and children's personal development.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Energy efficiency metrics ---
  const totalEnergyRecords = energy_usage_records.length;
  const withinTargetEnergy = energy_usage_records.filter((e) => e.within_target).length;
  const energyEfficiencyRate = rate(withinTargetEnergy, totalEnergyRecords);

  const smartMeterCount = energy_usage_records.filter((e) => e.smart_meter_installed).length;
  const smartMeterRate = rate(smartMeterCount, totalEnergyRecords);

  const totalSavingMeasuresActive = energy_usage_records.reduce(
    (sum, e) => sum + e.energy_saving_measures_active,
    0,
  );
  const totalSavingMeasuresTotal = energy_usage_records.reduce(
    (sum, e) => sum + e.energy_saving_measures_total,
    0,
  );
  const savingMeasuresRate = rate(totalSavingMeasuresActive, totalSavingMeasuresTotal);

  // --- Recycling compliance metrics ---
  const totalRecyclingRecords = recycling_records.length;
  const compliantRecycling = recycling_records.filter((r) => r.compliant).length;
  const recyclingComplianceRate = rate(compliantRecycling, totalRecyclingRecords);

  const contaminatedRecycling = recycling_records.filter((r) => r.contamination_found).length;
  const contaminationRate = rate(contaminatedRecycling, totalRecyclingRecords);

  const missedCollections = recycling_records.filter((r) => r.collection_missed).length;
  const missedCollectionRate = rate(missedCollections, totalRecyclingRecords);

  const childRecyclingParticipation = recycling_records.filter((r) => r.child_participated).length;

  // --- Eco-education metrics ---
  const totalEcoEducationRecords = eco_education_records.length;
  const attendedEcoEducation = eco_education_records.filter((e) => e.attended).length;

  const engagedEcoEducation = eco_education_records.filter((e) => e.attended && e.engaged).length;
  const ecoEducationEngagementRate = rate(engagedEcoEducation, totalEcoEducationRecords);

  const learningOutcomeMet = eco_education_records.filter(
    (e) => e.attended && e.learning_outcome_met,
  ).length;
  const learningOutcomeRate = rate(learningOutcomeMet, totalEcoEducationRecords);

  const uniqueChildrenInEcoEd = new Set(
    eco_education_records.filter((e) => e.attended).map((e) => e.child_id),
  ).size;
  const ecoEdChildCoverage = total_children > 0 ? rate(uniqueChildrenInEcoEd, total_children) : 0;

  // --- Sustainability practice metrics ---
  const totalSustainabilityPractices = sustainability_practice_records.length;
  const implementedPractices = sustainability_practice_records.filter((p) => p.implemented).length;
  const practiceImplementationRate = rate(implementedPractices, totalSustainabilityPractices);

  const documentedPractices = sustainability_practice_records.filter(
    (p) => p.implemented && p.documented,
  ).length;
  const documentedRate = rate(documentedPractices, totalSustainabilityPractices);

  const childrenInvolved = sustainability_practice_records.filter(
    (p) => p.implemented && p.children_involved,
  ).length;
  const childrenInvolvedRate = rate(childrenInvolved, totalSustainabilityPractices);

  const staffTrained = sustainability_practice_records.filter(
    (p) => p.implemented && p.staff_trained,
  ).length;
  const staffTrainedRate = rate(staffTrained, totalSustainabilityPractices);

  const effectivenessSum = sustainability_practice_records
    .filter((p) => p.implemented)
    .reduce((sum, p) => sum + p.effectiveness_rating, 0);
  const avgEffectiveness =
    implementedPractices > 0
      ? Math.round((effectivenessSum / implementedPractices) * 100) / 100
      : null;

  // Compute composite sustainability_practice_score
  // Average of implementation rate, documentation rate, children involvement, staff training
  const sustainabilityPracticeScore =
    totalSustainabilityPractices > 0 ? Math.round(
          (practiceImplementationRate! + documentedRate! + childrenInvolvedRate! + staffTrainedRate!) / 4) : null;

  // --- Carbon footprint metrics ---
  const totalCarbonRecords = carbon_footprint_records.length;
  const withinTargetCarbon = carbon_footprint_records.filter((c) => c.within_target).length;
  const carbonTargetRate = rate(withinTargetCarbon, totalCarbonRecords);

  const childrenAwareCarbon = carbon_footprint_records.filter((c) => c.children_aware).length;
  const carbonAwarenessRate = rate(childrenAwareCarbon, totalCarbonRecords);

  const totalReductionPlanned = carbon_footprint_records.reduce(
    (sum, c) => sum + c.reduction_actions_planned,
    0,
  );
  const totalReductionCompleted = carbon_footprint_records.reduce(
    (sum, c) => sum + c.reduction_actions_completed,
    0,
  );
  const reductionCompletionRate = rate(totalReductionCompleted, totalReductionPlanned);

  // --- Child participation composite ---
  // Composite across recycling participation, eco-education attendance, and sustainability involvement
  const childParticipationNumerators: number[] = [];
  const childParticipationDenominators: number[] = [];

  if (totalRecyclingRecords > 0) {
    childParticipationNumerators.push(childRecyclingParticipation);
    childParticipationDenominators.push(totalRecyclingRecords);
  }
  if (totalEcoEducationRecords > 0) {
    childParticipationNumerators.push(attendedEcoEducation);
    childParticipationDenominators.push(totalEcoEducationRecords);
  }
  if (totalSustainabilityPractices > 0) {
    childParticipationNumerators.push(childrenInvolved);
    childParticipationDenominators.push(totalSustainabilityPractices);
  }
  if (totalCarbonRecords > 0) {
    childParticipationNumerators.push(childrenAwareCarbon);
    childParticipationDenominators.push(totalCarbonRecords);
  }

  const totalChildParticNum = childParticipationNumerators.reduce((a, b) => a + b, 0);
  const totalChildParticDenom = childParticipationDenominators.reduce((a, b) => a + b, 0);
  const childParticipationRate = rate(totalChildParticNum, totalChildParticDenom);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: energyEfficiencyRate (>=90: +4, >=70: +2) ---
  if (meets(energyEfficiencyRate, 90)) score += 4;
  else if (meets(energyEfficiencyRate, 70)) score += 2;

  // --- Bonus 2: recyclingComplianceRate (>=95: +4, >=80: +2) ---
  if (meets(recyclingComplianceRate, 95)) score += 4;
  else if (meets(recyclingComplianceRate, 80)) score += 2;

  // --- Bonus 3: ecoEducationEngagementRate (>=90: +3, >=70: +1) ---
  if (meets(ecoEducationEngagementRate, 90)) score += 3;
  else if (meets(ecoEducationEngagementRate, 70)) score += 1;

  // --- Bonus 4: sustainabilityPracticeScore (>=80: +3, >=60: +1) ---
  if ((sustainabilityPracticeScore ?? 0) >= 80) score += 3;
  else if ((sustainabilityPracticeScore ?? 0) >= 60) score += 1;

  // --- Bonus 5: carbonAwarenessRate (>=90: +3, >=70: +1) ---
  if (meets(carbonAwarenessRate, 90)) score += 3;
  else if (meets(carbonAwarenessRate, 70)) score += 1;

  // --- Bonus 6: childParticipationRate (>=90: +3, >=70: +1) ---
  if (meets(childParticipationRate, 90)) score += 3;
  else if (meets(childParticipationRate, 70)) score += 1;

  // --- Bonus 7: reductionCompletionRate (>=90: +3, >=70: +1) ---
  if (meets(reductionCompletionRate, 90)) score += 3;
  else if (meets(reductionCompletionRate, 70)) score += 1;

  // --- Bonus 8: savingMeasuresRate (>=90: +3, >=70: +1) ---
  if (meets(savingMeasuresRate, 90)) score += 3;
  else if (meets(savingMeasuresRate, 70)) score += 1;

  // --- Bonus 9: avgEffectiveness (>=4.0: +2, >=3.0: +1) ---
  if ((avgEffectiveness ?? 0) >= 4.0) score += 2;
  else if ((avgEffectiveness ?? 0) >= 3.0) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // energyEfficiencyRate < 40 → -5 (guarded)
  if (below(energyEfficiencyRate, 40) && totalEnergyRecords > 0) score -= 5;

  // recyclingComplianceRate < 50 → -5 (guarded)
  if (below(recyclingComplianceRate, 50) && totalRecyclingRecords > 0) score -= 5;

  // ecoEducationEngagementRate < 40 → -5 (guarded)
  if (below(ecoEducationEngagementRate, 40) && totalEcoEducationRecords > 0) score -= 5;

  // childParticipationRate < 30 → -3 (guarded)
  if (below(childParticipationRate, 30) && totalChildParticDenom > 0) score -= 3;

  score = clamp(score, 0, 100);

  const sustainability_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(energyEfficiencyRate, 90) && totalEnergyRecords > 0) {
    strengths.push(
      `${energyEfficiencyRate}% of energy usage within target — the home demonstrates excellent energy management and conservation.`,
    );
  } else if (meets(energyEfficiencyRate, 70) && totalEnergyRecords > 0) {
    strengths.push(
      `${energyEfficiencyRate}% energy efficiency rate — the home is managing energy consumption well against its targets.`,
    );
  }

  if (meets(recyclingComplianceRate, 95) && totalRecyclingRecords > 0) {
    strengths.push(
      `${recyclingComplianceRate}% recycling compliance — the home demonstrates exemplary waste management and recycling practices.`,
    );
  } else if (meets(recyclingComplianceRate, 80) && totalRecyclingRecords > 0) {
    strengths.push(
      `${recyclingComplianceRate}% recycling compliance rate — strong commitment to recycling and waste reduction across the home.`,
    );
  }

  if (meets(ecoEducationEngagementRate, 90) && totalEcoEducationRecords > 0) {
    strengths.push(
      `${ecoEducationEngagementRate}% eco-education engagement — children are actively participating in and benefiting from environmental education programmes.`,
    );
  } else if (meets(ecoEducationEngagementRate, 70) && totalEcoEducationRecords > 0) {
    strengths.push(
      `${ecoEducationEngagementRate}% eco-education engagement rate — good levels of children's involvement in environmental awareness activities.`,
    );
  }

  if ((sustainabilityPracticeScore ?? 0) >= 80 && totalSustainabilityPractices > 0) {
    strengths.push(
      `Sustainability practice score at ${sustainabilityPracticeScore}% — practices are well-implemented, documented, and involve both staff and children.`,
    );
  } else if ((sustainabilityPracticeScore ?? 0) >= 60 && totalSustainabilityPractices > 0) {
    strengths.push(
      `Sustainability practice score at ${sustainabilityPracticeScore}% — the home has a reasonable framework of sustainability practices in place.`,
    );
  }

  if (meets(carbonAwarenessRate, 90) && totalCarbonRecords > 0) {
    strengths.push(
      `${carbonAwarenessRate}% carbon awareness rate — children are well-informed about the home's carbon footprint and reduction efforts.`,
    );
  } else if (meets(carbonAwarenessRate, 70) && totalCarbonRecords > 0) {
    strengths.push(
      `${carbonAwarenessRate}% carbon awareness — good levels of children's awareness of carbon footprint monitoring and reduction.`,
    );
  }

  if (meets(childParticipationRate, 90) && totalChildParticDenom > 0) {
    strengths.push(
      `${childParticipationRate}% child participation across sustainability activities — children are genuinely engaged in the home's environmental efforts.`,
    );
  } else if (meets(childParticipationRate, 70) && totalChildParticDenom > 0) {
    strengths.push(
      `${childParticipationRate}% child participation in environmental activities — good engagement across recycling, eco-education, and sustainability practices.`,
    );
  }

  if (meets(reductionCompletionRate, 90) && totalReductionPlanned > 0) {
    strengths.push(
      `${reductionCompletionRate}% of carbon reduction actions completed — the home follows through on its environmental commitments.`,
    );
  } else if (meets(reductionCompletionRate, 70) && totalReductionPlanned > 0) {
    strengths.push(
      `${reductionCompletionRate}% of planned carbon reduction actions completed — the home generally delivers on its environmental improvement plans.`,
    );
  }

  if (meets(savingMeasuresRate, 90) && totalSavingMeasuresTotal > 0) {
    strengths.push(
      `${savingMeasuresRate}% of energy saving measures active — comprehensive implementation of conservation technology and practices.`,
    );
  } else if (meets(savingMeasuresRate, 70) && totalSavingMeasuresTotal > 0) {
    strengths.push(
      `${savingMeasuresRate}% of energy saving measures active — good adoption of energy conservation measures across the home.`,
    );
  }

  if ((avgEffectiveness ?? 0) >= 4.0 && implementedPractices > 0) {
    strengths.push(
      `Sustainability practices averaging ${avgEffectiveness}/5 effectiveness — implemented practices are delivering measurable environmental benefits.`,
    );
  } else if ((avgEffectiveness ?? 0) >= 3.0 && implementedPractices > 0) {
    strengths.push(
      `Sustainability practices averaging ${avgEffectiveness}/5 effectiveness — practices are having a positive environmental impact.`,
    );
  }

  if (meets(smartMeterRate, 90) && totalEnergyRecords > 0) {
    strengths.push(
      "Smart meters installed across virtually all energy monitoring points — enabling real-time tracking and data-driven energy management.",
    );
  }

  if (contaminationRate === 0 && totalRecyclingRecords > 0) {
    strengths.push(
      "Zero recycling contamination recorded — excellent sorting discipline demonstrating effective eco-education and staff engagement.",
    );
  }

  if (meets(learningOutcomeRate, 90) && totalEcoEducationRecords > 0) {
    strengths.push(
      `${learningOutcomeRate}% of eco-education sessions achieving learning outcomes — children are genuinely developing environmental knowledge and skills.`,
    );
  }

  if (meets(ecoEdChildCoverage, 100) && total_children > 0) {
    strengths.push(
      "Every child has participated in eco-education activities — environmental awareness is embedded in the home's approach to personal development.",
    );
  } else if (meets(ecoEdChildCoverage, 80) && total_children > 0) {
    strengths.push(
      `${ecoEdChildCoverage}% of children have participated in eco-education — strong coverage ensuring most children develop environmental awareness.`,
    );
  }

  if (meets(carbonTargetRate, 90) && totalCarbonRecords > 0) {
    strengths.push(
      `${carbonTargetRate}% of carbon records within target — the home is successfully managing and reducing its carbon footprint.`,
    );
  }

  const totalCostSaving = sustainability_practice_records.reduce(
    (sum, p) => sum + p.cost_saving_gbp,
    0,
  );
  if (totalCostSaving > 0) {
    strengths.push(
      `Sustainability practices have generated a total estimated cost saving — environmental responsibility is also delivering financial benefits.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(energyEfficiencyRate, 40) && totalEnergyRecords > 0) {
    concerns.push(
      `Only ${energyEfficiencyRate}% of energy usage within target — the home is significantly exceeding energy consumption targets, indicating poor energy management.`,
    );
  } else if (below(energyEfficiencyRate, 70) && meets(energyEfficiencyRate, 40) && totalEnergyRecords > 0) {
    concerns.push(
      `Energy efficiency at ${energyEfficiencyRate}% — the home is not consistently meeting energy usage targets, suggesting scope for improved conservation.`,
    );
  }

  if (below(recyclingComplianceRate, 50) && totalRecyclingRecords > 0) {
    concerns.push(
      `Only ${recyclingComplianceRate}% recycling compliance — the majority of recycling records show non-compliance, indicating a fundamental failure in waste management.`,
    );
  } else if (below(recyclingComplianceRate, 80) && meets(recyclingComplianceRate, 50) && totalRecyclingRecords > 0) {
    concerns.push(
      `Recycling compliance at ${recyclingComplianceRate}% — inconsistent recycling practices require attention to improve waste management across the home.`,
    );
  }

  if (below(ecoEducationEngagementRate, 40) && totalEcoEducationRecords > 0) {
    concerns.push(
      `Only ${ecoEducationEngagementRate}% eco-education engagement — children are not meaningfully participating in environmental education, missing opportunities for personal development.`,
    );
  } else if (below(ecoEducationEngagementRate, 70) && meets(ecoEducationEngagementRate, 40) && totalEcoEducationRecords > 0) {
    concerns.push(
      `Eco-education engagement at ${ecoEducationEngagementRate}% — not all children are engaging with environmental education programmes.`,
    );
  }

  if ((sustainabilityPracticeScore ?? 0) < 40 && totalSustainabilityPractices > 0) {
    concerns.push(
      `Sustainability practice score at only ${sustainabilityPracticeScore}% — sustainability practices are poorly implemented, undocumented, or failing to involve staff and children.`,
    );
  } else if ((sustainabilityPracticeScore ?? 0) < 60 && (sustainabilityPracticeScore ?? 0) >= 40 && totalSustainabilityPractices > 0) {
    concerns.push(
      `Sustainability practice score at ${sustainabilityPracticeScore}% — implementation, documentation, or involvement of staff and children in sustainability practices needs improvement.`,
    );
  }

  if (below(carbonAwarenessRate, 50) && totalCarbonRecords > 0) {
    concerns.push(
      `Only ${carbonAwarenessRate}% carbon awareness — the majority of children are not being informed about the home's carbon footprint, missing an important educational opportunity.`,
    );
  } else if (below(carbonAwarenessRate, 70) && meets(carbonAwarenessRate, 50) && totalCarbonRecords > 0) {
    concerns.push(
      `Carbon awareness at ${carbonAwarenessRate}% — not all children are engaged in understanding the home's environmental impact and reduction efforts.`,
    );
  }

  if (below(childParticipationRate, 30) && totalChildParticDenom > 0) {
    concerns.push(
      `Only ${childParticipationRate}% child participation in environmental activities — children are not engaged in the home's sustainability efforts, undermining both environmental practice and personal development.`,
    );
  } else if (below(childParticipationRate, 70) && meets(childParticipationRate, 30) && totalChildParticDenom > 0) {
    concerns.push(
      `Child participation in environmental activities at ${childParticipationRate}% — not all children are involved in recycling, eco-education, or sustainability initiatives.`,
    );
  }

  if (meets(contaminationRate, 30) && totalRecyclingRecords > 0) {
    concerns.push(
      `Recycling contamination found in ${contaminationRate}% of records — high contamination rates indicate poor sorting practices and inadequate waste management training.`,
    );
  } else if (meets(contaminationRate, 15) && below(contaminationRate, 30) && totalRecyclingRecords > 0) {
    concerns.push(
      `Recycling contamination at ${contaminationRate}% — some contamination in recycling streams suggests sorting practices need reinforcement.`,
    );
  }

  if (meets(missedCollectionRate, 20) && totalRecyclingRecords > 0) {
    concerns.push(
      `${missedCollectionRate}% of waste collections missed — missed collections may indicate poor scheduling or communication about collection arrangements.`,
    );
  }

  if (below(reductionCompletionRate, 50) && totalReductionPlanned > 0) {
    concerns.push(
      `Only ${reductionCompletionRate}% of carbon reduction actions completed — planned environmental improvements are not being followed through.`,
    );
  } else if (below(reductionCompletionRate, 70) && meets(reductionCompletionRate, 50) && totalReductionPlanned > 0) {
    concerns.push(
      `Carbon reduction action completion at ${reductionCompletionRate}% — some planned environmental improvements are not being delivered.`,
    );
  }

  if (below(ecoEdChildCoverage, 50) && total_children > 0 && totalEcoEducationRecords > 0) {
    concerns.push(
      `Only ${ecoEdChildCoverage}% of children have participated in eco-education — many children are missing out on environmental awareness development.`,
    );
  }

  if (below(staffTrainedRate, 50) && totalSustainabilityPractices > 0) {
    concerns.push(
      `Only ${staffTrainedRate}% of sustainability practices have associated staff training — staff may not be equipped to model and promote environmental responsibility.`,
    );
  }

  if (below(savingMeasuresRate, 50) && totalSavingMeasuresTotal > 0) {
    concerns.push(
      `Only ${savingMeasuresRate}% of energy saving measures are active — the home is not utilising available conservation technology and practices.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: SustainabilityRecommendation[] = [];
  let rank = 0;

  if (below(energyEfficiencyRate, 40) && totalEnergyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review energy consumption against targets — identify the primary sources of excess usage and implement immediate conservation measures including smart meter monitoring, timed heating, and LED lighting.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (below(recyclingComplianceRate, 50) && totalRecyclingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a comprehensive recycling improvement plan — ensure all bins are correctly labelled, staff and children receive waste sorting training, and recycling compliance is monitored weekly.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (below(ecoEducationEngagementRate, 40) && totalEcoEducationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review the eco-education programme to increase engagement — involve children in designing activities, link sessions to their interests, and use practical hands-on approaches such as gardening, cooking with seasonal produce, or wildlife projects.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Enjoyment and achievement",
    });
  }

  if (below(childParticipationRate, 30) && totalChildParticDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop strategies to increase children's participation in environmental activities — explore barriers to engagement and create age-appropriate, enjoyable sustainability activities that children want to join.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (below(carbonAwarenessRate, 50) && totalCarbonRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase children's awareness of the home's carbon footprint — create visual displays, hold regular discussions about environmental impact, and involve children in setting and monitoring carbon reduction targets.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Enjoyment and achievement",
    });
  }

  if (meets(contaminationRate, 30) && totalRecyclingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address high recycling contamination rates through targeted training — provide visual guides at bin locations, run sorting workshops with children, and implement regular audits to identify and correct contamination sources.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (below(reductionCompletionRate, 50) && totalReductionPlanned > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a carbon reduction action tracker with assigned owners and deadlines — planned improvements must be followed through to demonstrate genuine commitment to environmental responsibility.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (below(staffTrainedRate, 50) && totalSustainabilityPractices > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all staff receive sustainability training — staff cannot effectively model and promote environmental responsibility without understanding the home's sustainability practices and their role in delivering them.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33 — Staff training",
    });
  }

  if (below(savingMeasuresRate, 50) && totalSavingMeasuresTotal > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Activate available energy saving measures — the home has conservation technology available but not in use. Review and activate smart meters, timers, and efficiency measures to reduce energy consumption.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (
    meets(energyEfficiencyRate, 40) &&
    below(energyEfficiencyRate, 70) &&
    totalEnergyRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop an energy reduction plan targeting the areas of highest excess — monitor usage trends weekly and set incremental targets to improve efficiency towards the 70% threshold.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (
    meets(recyclingComplianceRate, 50) &&
    below(recyclingComplianceRate, 80) &&
    totalRecyclingRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve recycling compliance to at least 80% — review the main areas of non-compliance and implement targeted actions including better signage, staff champions, and children's recycling teams.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (
    meets(ecoEducationEngagementRate, 40) &&
    below(ecoEducationEngagementRate, 70) &&
    totalEcoEducationRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Diversify eco-education approaches to increase engagement — consider outdoor learning, community environmental projects, partnerships with local conservation groups, or eco-themed reward schemes.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — Enjoyment and achievement",
    });
  }

  if (
    below(ecoEdChildCoverage, 80) &&
    meets(ecoEdChildCoverage, 50) &&
    total_children > 0 &&
    totalEcoEducationRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend eco-education coverage to reach all children — identify children who have not yet participated and create accessible, engaging opportunities tailored to their interests and abilities.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — Enjoyment and achievement",
    });
  }

  if (
    meets(childParticipationRate, 30) &&
    below(childParticipationRate, 70) &&
    totalChildParticDenom > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase children's involvement in sustainability activities through creative engagement — consider eco-champions programmes, sustainability challenges, or linking environmental activities to pocket money or rewards.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    meets(carbonAwarenessRate, 50) &&
    below(carbonAwarenessRate, 70) &&
    totalCarbonRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enhance carbon awareness activities — create interactive carbon footprint displays, involve children in monitoring and reporting, and celebrate reductions achieved through collective effort.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 12 — Enjoyment and achievement",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: SustainabilityInsight[] = [];

  // -- Critical insights --

  if (below(energyEfficiencyRate, 40) && totalEnergyRecords > 0) {
    insights.push({
      text: `Only ${energyEfficiencyRate}% of energy usage within target. Excessive energy consumption not only increases costs but signals a lack of environmental responsibility. Ofsted considers the living environment as part of quality of care — poor energy management reflects on the home's overall governance.`,
      severity: "critical",
    });
  }

  if (below(recyclingComplianceRate, 50) && totalRecyclingRecords > 0) {
    insights.push({
      text: `Only ${recyclingComplianceRate}% recycling compliance. Widespread non-compliance with recycling indicates a failure in environmental practices that affects the quality of the living environment and misses opportunities to educate children about environmental responsibility.`,
      severity: "critical",
    });
  }

  if (below(ecoEducationEngagementRate, 40) && totalEcoEducationRecords > 0) {
    insights.push({
      text: `Only ${ecoEducationEngagementRate}% eco-education engagement. Low engagement in environmental education means children are not developing the awareness and skills needed to understand their environmental responsibilities — this is a missed opportunity in their personal development.`,
      severity: "critical",
    });
  }

  if (below(childParticipationRate, 30) && totalChildParticDenom > 0) {
    insights.push({
      text: `Child participation in environmental activities at only ${childParticipationRate}%. Children are not meaningfully involved in the home's sustainability efforts, missing valuable learning experiences and the chance to develop responsibility and life skills around environmental care.`,
      severity: "critical",
    });
  }

  if (totalEcoEducationRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No eco-education records despite children being on placement. Environmental awareness is an important aspect of personal development — the home should develop a programme of eco-education activities that supports children's understanding of sustainability.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    meets(energyEfficiencyRate, 40) &&
    below(energyEfficiencyRate, 70) &&
    totalEnergyRecords > 0
  ) {
    insights.push({
      text: `Energy efficiency at ${energyEfficiencyRate}% — improving but the home is still not consistently meeting its energy targets. Reviewing usage patterns and activating additional conservation measures could bring significant improvement.`,
      severity: "warning",
    });
  }

  if (
    meets(recyclingComplianceRate, 50) &&
    below(recyclingComplianceRate, 80) &&
    totalRecyclingRecords > 0
  ) {
    insights.push({
      text: `Recycling compliance at ${recyclingComplianceRate}% — while improving, inconsistent compliance means the home is not fully meeting its environmental responsibilities. Targeted training and monitoring would help.`,
      severity: "warning",
    });
  }

  if (
    meets(ecoEducationEngagementRate, 40) &&
    below(ecoEducationEngagementRate, 70) &&
    totalEcoEducationRecords > 0
  ) {
    insights.push({
      text: `Eco-education engagement at ${ecoEducationEngagementRate}% — some children are benefiting from environmental education but many are not yet engaged. Diversifying approaches and linking to children's interests may improve participation.`,
      severity: "warning",
    });
  }

  if (
    (sustainabilityPracticeScore ?? 0) >= 40 &&
    (sustainabilityPracticeScore ?? 0) < 60 &&
    totalSustainabilityPractices > 0
  ) {
    insights.push({
      text: `Sustainability practice score at ${sustainabilityPracticeScore}% — practices exist but gaps in implementation, documentation, staff training, or children's involvement mean sustainability is not yet embedded across the home.`,
      severity: "warning",
    });
  }

  if (
    meets(carbonAwarenessRate, 50) &&
    below(carbonAwarenessRate, 70) &&
    totalCarbonRecords > 0
  ) {
    insights.push({
      text: `Carbon awareness at ${carbonAwarenessRate}% — while some children are engaged in understanding the home's environmental impact, broader awareness and involvement in carbon reduction efforts would strengthen this area.`,
      severity: "warning",
    });
  }

  if (
    meets(childParticipationRate, 30) &&
    below(childParticipationRate, 70) &&
    totalChildParticDenom > 0
  ) {
    insights.push({
      text: `Child participation in environmental activities at ${childParticipationRate}% — while some children engage, many are not involved. Consider whether activities are accessible, enjoyable, and relevant to encourage broader participation.`,
      severity: "warning",
    });
  }

  if (
    meets(reductionCompletionRate, 50) &&
    below(reductionCompletionRate, 70) &&
    totalReductionPlanned > 0
  ) {
    insights.push({
      text: `Carbon reduction action completion at ${reductionCompletionRate}% — some planned improvements are not being delivered. Without follow-through, carbon reduction targets become aspirational rather than achievable.`,
      severity: "warning",
    });
  }

  if (
    meets(contaminationRate, 15) &&
    below(contaminationRate, 30) &&
    totalRecyclingRecords > 0
  ) {
    insights.push({
      text: `Recycling contamination at ${contaminationRate}% — moderate contamination suggests sorting practices need reinforcement. Visual guides and regular audits could reduce this significantly.`,
      severity: "warning",
    });
  }

  if (
    (avgEffectiveness ?? 0) >= 2.0 &&
    (avgEffectiveness ?? 0) < 3.0 &&
    implementedPractices > 0
  ) {
    insights.push({
      text: `Sustainability practice effectiveness averaging ${avgEffectiveness}/5 — practices are in place but not yet delivering strong environmental outcomes. Review and strengthen underperforming practices.`,
      severity: "warning",
    });
  }

  // Identify most common sustainability categories
  const categoryCounts: Record<string, number> = {};
  for (const p of sustainability_practice_records) {
    categoryCounts[p.category] = (categoryCounts[p.category] ?? 0) + 1;
  }
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topCategories.length > 0 && totalSustainabilityPractices > 3) {
    const allCategories = ["energy", "waste", "water", "food", "transport", "biodiversity", "purchasing"];
    const missingCategories = allCategories.filter(
      (c) => !categoryCounts[c] || categoryCounts[c] === 0,
    );
    if (missingCategories.length >= 3) {
      insights.push({
        text: `Sustainability practices concentrated in ${topCategories.map(([c]) => c).join(", ")} — no recorded practices in ${missingCategories.join(", ")}. A broader approach across all environmental domains would strengthen the home's overall sustainability profile.`,
        severity: "warning",
      });
    }
  }

  // -- Positive insights --

  if (sustainability_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding environmental sustainability and eco-awareness — energy is managed efficiently, recycling compliance is high, children are engaged in eco-education, and sustainability practices are well-implemented. This contributes positively to the quality of care and children's personal development.",
      severity: "positive",
    });
  }

  if (
    meets(energyEfficiencyRate, 90) &&
    meets(savingMeasuresRate, 90) &&
    totalEnergyRecords > 0 &&
    totalSavingMeasuresTotal > 0
  ) {
    insights.push({
      text: `Excellent energy management with ${energyEfficiencyRate}% efficiency and ${savingMeasuresRate}% of saving measures active — the home demonstrates a comprehensive approach to energy conservation that controls costs and models environmental responsibility.`,
      severity: "positive",
    });
  }

  if (
    meets(recyclingComplianceRate, 95) &&
    contaminationRate === 0 &&
    totalRecyclingRecords > 0
  ) {
    insights.push({
      text: `${recyclingComplianceRate}% recycling compliance with zero contamination — exemplary waste management demonstrating genuine commitment to environmental responsibility across the entire home.`,
      severity: "positive",
    });
  }

  if (
    meets(ecoEducationEngagementRate, 90) &&
    meets(learningOutcomeRate, 90) &&
    totalEcoEducationRecords > 0
  ) {
    insights.push({
      text: `${ecoEducationEngagementRate}% eco-education engagement with ${learningOutcomeRate}% achieving learning outcomes — environmental education is genuinely developing children's knowledge, skills, and environmental consciousness.`,
      severity: "positive",
    });
  }

  if (
    meets(childParticipationRate, 90) &&
    totalChildParticDenom > 0
  ) {
    insights.push({
      text: `${childParticipationRate}% child participation across environmental activities — children are fully engaged in the home's sustainability journey, developing important life skills and environmental responsibility.`,
      severity: "positive",
    });
  }

  if (
    meets(carbonTargetRate, 90) &&
    meets(reductionCompletionRate, 90) &&
    totalCarbonRecords > 0 &&
    totalReductionPlanned > 0
  ) {
    insights.push({
      text: `${carbonTargetRate}% within carbon targets and ${reductionCompletionRate}% of reduction actions completed — the home demonstrates genuine commitment to reducing its environmental impact through measurable action.`,
      severity: "positive",
    });
  }

  if (
    meets(ecoEdChildCoverage, 100) &&
    total_children > 0 &&
    totalEcoEducationRecords > 0
  ) {
    insights.push({
      text: "Every child has participated in eco-education — environmental awareness is a truly inclusive part of the home's approach to children's development. This demonstrates that sustainability education is not tokenistic but embedded in practice.",
      severity: "positive",
    });
  }

  if (
    (sustainabilityPracticeScore ?? 0) >= 80 &&
    (avgEffectiveness ?? 0) >= 4.0 &&
    totalSustainabilityPractices > 0
  ) {
    insights.push({
      text: `Sustainability practice score at ${sustainabilityPracticeScore}% with effectiveness averaging ${avgEffectiveness}/5 — practices are well-implemented, documented, and delivering strong environmental outcomes. The home can evidence a mature and effective approach to sustainability.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (sustainability_rating === "outstanding") {
    headline =
      "Outstanding environmental sustainability and eco-awareness — energy is managed efficiently, recycling compliance is strong, children are engaged in eco-education, and sustainability practices are well-embedded.";
  } else if (sustainability_rating === "good") {
    headline = `Good environmental sustainability and eco-awareness — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (sustainability_rating === "adequate") {
    headline = `Adequate environmental sustainability and eco-awareness — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure effective environmental practices and children's eco-awareness.`;
  } else {
    headline = `Environmental sustainability and eco-awareness is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to improve environmental practices, energy management, and children's eco-education.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    sustainability_rating,
    sustainability_score: score,
    headline,
    total_energy_records: totalEnergyRecords,
    total_recycling_records: totalRecyclingRecords,
    total_eco_education_records: totalEcoEducationRecords,
    total_sustainability_practices: totalSustainabilityPractices,
    total_carbon_records: totalCarbonRecords,
    energy_efficiency_rate: energyEfficiencyRate,
    recycling_compliance_rate: recyclingComplianceRate,
    eco_education_engagement_rate: ecoEducationEngagementRate,
    sustainability_practice_score: sustainabilityPracticeScore,
    carbon_awareness_rate: carbonAwarenessRate,
    child_participation_rate: childParticipationRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
