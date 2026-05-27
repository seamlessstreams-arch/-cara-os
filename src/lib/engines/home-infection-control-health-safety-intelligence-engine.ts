// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME INFECTION CONTROL & HEALTH SAFETY INTELLIGENCE ENGINE
// Tracks infection management, medication administration accuracy, staff medication
// training, and first aid coverage to ensure children's health and safety.
// Pure deterministic engine. CHR 2015 Reg 12/31.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface InfectionRecordInput {
  id: string;
  date: string;
  severity: string;               // "mild" | "moderate" | "severe"
  status: string;                  // "active" | "resolved" | "monitoring"
  gp_consulted: boolean;
  control_measures_applied: boolean;
  other_cases: number;
}

export interface MarEntryInput {
  id: string;
  child_id: string;
  date: string;
  administered_correctly: boolean;
  missed: boolean;
  reason_for_miss: string | null;
}

export interface MedTrainingInput {
  id: string;
  staff_id: string;
  training_type: string;
  completed: boolean;
  expiry_date: string;
}

export interface FirstAiderInput {
  id: string;
  staff_id: string;
  qualification: string;
  expiry_date: string;
  is_current: boolean;
}

export interface InfectionControlInput {
  today: string;
  total_children: number;
  total_staff: number;
  infections: InfectionRecordInput[];
  mar_entries: MarEntryInput[];
  med_training: MedTrainingInput[];
  first_aiders: FirstAiderInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type InfectionControlRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface InfectionControlResult {
  infection_rating: InfectionControlRating;
  infection_score: number;
  headline: string;
  active_infections: number;
  mar_accuracy_rate: number;
  med_training_rate: number;
  first_aid_coverage: number;
  infection_resolution_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeInfectionControlHealthSafety(
  input: InfectionControlInput,
): InfectionControlResult {
  const { today, total_children, total_staff, infections, mar_entries, med_training, first_aiders } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_children === 0) {
    return {
      infection_rating: "insufficient_data",
      infection_score: 0,
      headline: "No children registered — insufficient data for infection control analysis.",
      active_infections: 0,
      mar_accuracy_rate: 0,
      med_training_rate: 0,
      first_aid_coverage: 0,
      infection_resolution_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Infection metrics ─────────────────────────────────────────────────
  const activeInfections = infections.filter(i => i.status === "active").length;
  const resolvedInfections = infections.filter(i => i.status === "resolved").length;
  const infectionResolutionRate = infections.length > 0
    ? pct(resolvedInfections, infections.length)
    : 0;

  // ── MAR metrics ───────────────────────────────────────────────────────
  const marCorrect = mar_entries.filter(m => m.administered_correctly && !m.missed).length;
  const marAccuracyRate = mar_entries.length > 0
    ? pct(marCorrect, mar_entries.length)
    : 0;
  const marMissed = mar_entries.filter(m => m.missed).length;
  const marMissRate = mar_entries.length > 0
    ? pct(marMissed, mar_entries.length)
    : 0;

  // ── Med training metrics ──────────────────────────────────────────────
  const validTraining = med_training.filter(
    t => t.completed && t.expiry_date >= today,
  ).length;
  const medTrainingRate = total_staff > 0
    ? pct(validTraining, total_staff)
    : 0;

  // ── First aid metrics ─────────────────────────────────────────────────
  const currentAiders = first_aiders.filter(a => a.is_current).length;
  const firstAidCoverage = total_staff > 0
    ? pct(currentAiders, total_staff)
    : 0;

  // ── Severe infection metrics ──────────────────────────────────────────
  const severeInfections = infections.filter(i => i.severity === "severe");

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52, 6 modifiers, max 82. Clamp 0-100.
  let score = 52;

  // Mod 1: Infection management (+-5)
  if (infections.length === 0) {
    score += 5;
  } else if (infections.every(i => i.status === "resolved")) {
    score += 4;
  } else if (infectionResolutionRate >= 80) {
    score += 2;
  } else if (infectionResolutionRate >= 60) {
    score += 0;
  } else {
    score -= 5;
  }

  // Mod 2: MAR accuracy (+-6)
  if (mar_entries.length === 0) {
    score += 2;
  } else if (marAccuracyRate >= 98) {
    score += 6;
  } else if (marAccuracyRate >= 95) {
    score += 3;
  } else if (marAccuracyRate >= 90) {
    score += 0;
  } else {
    score -= 6;
  }

  // Mod 3: Missed medication (+-5)
  if (mar_entries.length === 0) {
    score += 2;
  } else if (marMissRate <= 2) {
    score += 5;
  } else if (marMissRate <= 5) {
    score += 2;
  } else if (marMissRate <= 10) {
    score += 0;
  } else {
    score -= 5;
  }

  // Mod 4: Med training compliance (+-5)
  if (medTrainingRate >= 90) {
    score += 5;
  } else if (medTrainingRate >= 75) {
    score += 3;
  } else if (medTrainingRate >= 50) {
    score += 0;
  } else {
    score -= 5;
  }

  // Mod 5: First aid coverage (+-5)
  if (firstAidCoverage >= 50) {
    score += 5;
  } else if (firstAidCoverage >= 33) {
    score += 3;
  } else if (firstAidCoverage >= 20) {
    score += 0;
  } else {
    score -= 5;
  }

  // Mod 6: Infection severity control (+-4)
  if (infections.length === 0) {
    score += 4;
  } else if (severeInfections.length === 0) {
    score += 4;
  } else if (severeInfections.every(i => i.gp_consulted && i.control_measures_applied)) {
    score += 1;
  } else {
    score -= 4;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  let infection_rating: InfectionControlRating;
  if (score >= 80) infection_rating = "outstanding";
  else if (score >= 65) infection_rating = "good";
  else if (score >= 45) infection_rating = "adequate";
  else infection_rating = "inadequate";

  // ── Strengths / Concerns / Recommendations / Insights ─────────────────
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  const insights: { text: string; severity: string }[] = [];
  let rank = 0;

  // Strengths
  if (infections.length === 0) {
    strengths.push("No infections recorded — excellent infection control environment.");
  }
  if (infections.length > 0 && infectionResolutionRate === 100) {
    strengths.push("All recorded infections have been resolved — effective infection management.");
  }
  if (infections.length > 0 && infectionResolutionRate >= 80 && infectionResolutionRate < 100) {
    strengths.push(`Infection resolution rate at ${infectionResolutionRate}% — strong infection management practice.`);
  }
  if (mar_entries.length > 0 && marAccuracyRate >= 98) {
    strengths.push(`MAR accuracy rate at ${marAccuracyRate}% — medication administration is exemplary.`);
  }
  if (mar_entries.length > 0 && marAccuracyRate >= 95 && marAccuracyRate < 98) {
    strengths.push(`MAR accuracy rate at ${marAccuracyRate}% — medication administration is consistently reliable.`);
  }
  if (mar_entries.length > 0 && marMissRate <= 2) {
    strengths.push(`Missed medication rate at ${marMissRate}% — children receive their medications on schedule.`);
  }
  if (medTrainingRate >= 90) {
    strengths.push(`Medication training compliance at ${medTrainingRate}% — staff are well trained in medication administration.`);
  }
  if (firstAidCoverage >= 50) {
    strengths.push(`First aid coverage at ${firstAidCoverage}% of staff — strong first aid readiness across the team.`);
  }
  if (severeInfections.length === 0 && infections.length > 0) {
    strengths.push("No severe infections recorded — infection severity is well controlled.");
  }
  if (severeInfections.length > 0 && severeInfections.every(i => i.gp_consulted && i.control_measures_applied)) {
    strengths.push("All severe infections have GP consultation and control measures in place.");
  }

  // Concerns
  if (activeInfections > 0) {
    concerns.push(`${activeInfections} active infection${activeInfections > 1 ? "s" : ""} — ongoing infection control measures must be maintained.`);
  }
  if (infections.length > 0 && infectionResolutionRate < 60) {
    concerns.push(`Infection resolution rate at ${infectionResolutionRate}% — too many infections remain unresolved.`);
  }
  if (mar_entries.length > 0 && marAccuracyRate < 90) {
    concerns.push(`MAR accuracy rate at ${marAccuracyRate}% — medication administration errors are too frequent.`);
  }
  if (mar_entries.length > 0 && marMissRate > 10) {
    concerns.push(`Missed medication rate at ${marMissRate}% — children are not receiving medications as prescribed.`);
  }
  if (medTrainingRate < 50) {
    concerns.push(`Medication training compliance at ${medTrainingRate}% — more than half of staff lack current training.`);
  }
  if (firstAidCoverage < 20) {
    concerns.push(`First aid coverage at ${firstAidCoverage}% — critically low first aid capacity across the staff team.`);
  }
  if (severeInfections.length > 0 && !severeInfections.every(i => i.gp_consulted && i.control_measures_applied)) {
    const unmanaged = severeInfections.filter(i => !i.gp_consulted || !i.control_measures_applied).length;
    concerns.push(`${unmanaged} severe infection${unmanaged > 1 ? "s" : ""} without full GP consultation or control measures — children's health is at risk.`);
  }
  const spreadingInfections = infections.filter(i => i.other_cases > 0);
  if (spreadingInfections.length > 0) {
    concerns.push(`${spreadingInfections.length} infection${spreadingInfections.length > 1 ? "s" : ""} with additional cases reported — infection may be spreading within the home.`);
  }

  // Recommendations
  if (activeInfections > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Review and strengthen control measures for ${activeInfections} active infection${activeInfections > 1 ? "s" : ""} to prevent further spread.`,
      urgency: "immediate",
      regulatory_ref: "Reg 12",
    });
  }
  if (mar_entries.length > 0 && marAccuracyRate < 95) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Conduct a medication administration audit and provide refresher training to staff with errors.",
      urgency: marAccuracyRate < 90 ? "immediate" : "soon",
      regulatory_ref: "Reg 12",
    });
  }
  if (mar_entries.length > 0 && marMissRate > 5) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Investigate reasons for missed medications and implement systems to prevent recurrence.",
      urgency: marMissRate > 10 ? "immediate" : "soon",
      regulatory_ref: "Reg 12",
    });
  }
  if (medTrainingRate < 75) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Schedule medication training for untrained or expired staff to meet compliance requirements.",
      urgency: medTrainingRate < 50 ? "immediate" : "soon",
      regulatory_ref: "Reg 31",
    });
  }
  if (firstAidCoverage < 33) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Enrol additional staff on first aid courses to ensure adequate coverage across all shifts.",
      urgency: firstAidCoverage < 20 ? "immediate" : "soon",
      regulatory_ref: "Reg 31",
    });
  }
  if (severeInfections.length > 0 && !severeInfections.every(i => i.gp_consulted)) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Ensure GP consultation is obtained for all severe infections without delay.",
      urgency: "immediate",
      regulatory_ref: "Reg 12",
    });
  }
  if (spreadingInfections.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review infection control protocols and consider enhanced cleaning, isolation, and reporting to Public Health England.",
      urgency: "immediate",
      regulatory_ref: "Reg 12",
    });
  }

  // Insights
  if (infections.length === 0 && mar_entries.length > 0 && marAccuracyRate >= 98 && medTrainingRate >= 90 && firstAidCoverage >= 50) {
    insights.push({
      text: "Infection control, medication administration, training, and first aid are all at exemplary levels. This demonstrates an embedded culture of health and safety that Ofsted will recognise as outstanding practice under Reg 12.",
      severity: "positive",
    });
  }
  if (activeInfections >= 2) {
    insights.push({
      text: `${activeInfections} concurrent active infections require careful monitoring. Inspectors will examine whether the home acted swiftly to contain spread and protect other children. Ensure infection control protocols are visibly in operation.`,
      severity: "warning",
    });
  }
  if (severeInfections.length > 0 && !severeInfections.every(i => i.gp_consulted && i.control_measures_applied)) {
    insights.push({
      text: "Severe infections without full GP consultation and control measures represent a direct risk to children's health. Under Reg 12, the registered person must ensure that children receive appropriate health care. This gap will be a focus area for Ofsted.",
      severity: "critical",
    });
  }
  if (mar_entries.length > 0 && marAccuracyRate < 90) {
    insights.push({
      text: `MAR accuracy at ${marAccuracyRate}% falls below the expected standard. Medication errors can have serious consequences for children. Ofsted will examine whether systemic issues in medication management have been addressed under Reg 12.`,
      severity: "critical",
    });
  }
  if (mar_entries.length > 0 && marMissRate > 10) {
    insights.push({
      text: `Missed medication rate at ${marMissRate}% is significantly above acceptable levels. Children may not be receiving prescribed treatment, which could impact their health and wellbeing. This will be a regulatory concern under Reg 12.`,
      severity: "critical",
    });
  }
  if (medTrainingRate < 50) {
    insights.push({
      text: `Only ${medTrainingRate}% of staff have current medication training. Under Reg 31, staff must be suitably trained. Gaps in training increase the risk of medication errors and may indicate wider workforce development issues.`,
      severity: "critical",
    });
  }
  if (firstAidCoverage < 20) {
    insights.push({
      text: `First aid coverage at ${firstAidCoverage}% means the home may lack a qualified first aider on every shift. Under Reg 31, staff should be equipped to respond to medical emergencies. Low coverage is a health and safety risk.`,
      severity: "critical",
    });
  }
  if (mar_entries.length > 0 && marAccuracyRate >= 98 && marMissRate <= 2) {
    insights.push({
      text: `Medication administration is exemplary — ${marAccuracyRate}% accuracy with only ${marMissRate}% missed. Children are receiving their prescribed medications consistently and correctly. This is a hallmark of outstanding health care practice.`,
      severity: "positive",
    });
  }
  if (medTrainingRate >= 90 && firstAidCoverage >= 50) {
    insights.push({
      text: `Strong training compliance (${medTrainingRate}%) combined with high first aid coverage (${firstAidCoverage}%) demonstrates a well-prepared staff team. The home is well positioned to respond to health emergencies.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (infection_rating === "outstanding") {
    headline = `Outstanding infection control and health safety — ${infections.length === 0 ? "zero infections" : infectionResolutionRate + "% resolution rate"}, ${mar_entries.length > 0 ? marAccuracyRate + "% MAR accuracy" : "no medication issues"}, ${medTrainingRate}% training compliance, and ${firstAidCoverage}% first aid coverage.`;
  } else if (infection_rating === "good") {
    headline = `Good infection control and health safety — ${concerns.length > 0 ? concerns.length + " area" + (concerns.length > 1 ? "s" : "") + " for improvement identified" : "minor refinements recommended"}.`;
  } else if (infection_rating === "adequate") {
    headline = `Infection control and health safety requires attention — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified that need addressing to meet expected standards.`;
  } else {
    headline = `Infection control and health safety is inadequate — significant risks to children's health identified. Immediate action required.`;
  }

  return {
    infection_rating,
    infection_score: score,
    headline,
    active_infections: activeInfections,
    mar_accuracy_rate: marAccuracyRate,
    med_training_rate: medTrainingRate,
    first_aid_coverage: firstAidCoverage,
    infection_resolution_rate: infectionResolutionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
