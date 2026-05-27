// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MEDICATION MANAGEMENT INTELLIGENCE ENGINE
// Home-level: aggregates medication administration, errors, witnessing,
// stock management, and compliance across all children.
// CHR 2015 Reg 23: "Health needs — including medication."
// SCCIF: "Children's health needs, including any medication, are managed
//         effectively and the arrangements for the administration of
//         medication are safe."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface MedicationInput {
  id: string;
  child_id: string;
  name: string;
  type: string;                       // regular | prn | controlled | topical | ...
  dosage: string;
  frequency: string;
  is_active: boolean;
  stock_count: number | null;
  stock_last_checked: string | null;  // ISO date
  prescriber: string;
  start_date: string;
  end_date: string | null;
  special_instructions: string;
}

export interface MedicationAdminInput {
  id: string;
  medication_id: string;
  child_id: string;
  scheduled_time: string;             // ISO datetime
  actual_time: string | null;
  status: string;                     // given | refused | withheld | late | missed | scheduled | ...
  administered_by: string | null;
  witnessed_by: string | null;
  dose_given: string | null;
  reason_not_given: string | null;
  notes: string | null;
  prn_reason: string | null;
  prn_effectiveness: string | null;
}

export interface MedicationErrorInput {
  id: string;
  child_id: string;
  date_occurred: string;
  error_type: string;                 // wrong_dose | omission | wrong_time | wrong_medication | ...
  severity: string;                   // minor | moderate | serious | critical
  status: string;                     // open | investigating | closed | ...
  root_cause: string;
  remedial_actions_count: number;
}

export interface HomeMedicationManagementInput {
  today: string;
  medications: MedicationInput[];
  administrations: MedicationAdminInput[];
  errors: MedicationErrorInput[];
  total_children: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type MedicationManagementRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AdministrationProfile {
  total_scheduled: number;
  total_given: number;
  total_late: number;
  total_refused: number;
  total_missed: number;
  total_withheld: number;
  compliance_rate: number;            // given / (scheduled that aren't status "scheduled")
  on_time_rate: number;               // given / (given + late)
  refusal_rate: number;
}

export interface WitnessingProfile {
  total_administered: number;         // given + late
  witnessed_count: number;
  witnessing_rate: number;
}

export interface StockProfile {
  active_medications: number;
  with_stock_data: number;
  low_stock_count: number;            // stock_count <= 7
  stock_check_rate: number;           // checked in last 7 days
  overdue_stock_checks: number;
}

export interface ErrorProfile {
  total_errors_90d: number;
  by_severity: Record<string, number>;
  open_errors: number;
  error_rate: number;                 // errors per 100 administrations
}

export interface MedicationCoverageProfile {
  children_on_medication: number;
  children_without: number;
  active_medications: number;
  regular_count: number;
  prn_count: number;
  controlled_count: number;
}

export interface HomeMedicationManagementResult {
  medication_rating: MedicationManagementRating;
  medication_score: number;
  headline: string;
  administration: AdministrationProfile;
  witnessing: WitnessingProfile;
  stock: StockProfile;
  errors: ErrorProfile;
  coverage: MedicationCoverageProfile;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeMedicationManagement(
  input: HomeMedicationManagementInput,
): HomeMedicationManagementResult {
  const { today, medications, administrations, errors, total_children } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_children === 0 || medications.length === 0) {
    return {
      medication_rating: "insufficient_data",
      medication_score: 0,
      headline: "No medication data available for analysis.",
      administration: { total_scheduled: 0, total_given: 0, total_late: 0, total_refused: 0, total_missed: 0, total_withheld: 0, compliance_rate: 0, on_time_rate: 0, refusal_rate: 0 },
      witnessing: { total_administered: 0, witnessed_count: 0, witnessing_rate: 0 },
      stock: { active_medications: 0, with_stock_data: 0, low_stock_count: 0, stock_check_rate: 0, overdue_stock_checks: 0 },
      errors: { total_errors_90d: 0, by_severity: {}, open_errors: 0, error_rate: 0 },
      coverage: { children_on_medication: 0, children_without: 0, active_medications: 0, regular_count: 0, prn_count: 0, controlled_count: 0 },
      strengths: [],
      concerns: ["No medication data recorded — unable to assess medication management."],
      recommendations: [],
      insights: [],
    };
  }

  // ── Filter to active medications ──────────────────────────────────────
  const activeMeds = medications.filter(m => m.is_active);
  const childrenOnMed = new Set(activeMeds.map(m => m.child_id));
  const regularCount = activeMeds.filter(m => m.type === "regular").length;
  const prnCount = activeMeds.filter(m => m.type === "prn").length;
  const controlledCount = activeMeds.filter(m => m.type === "controlled").length;

  // ── Administrations (90 days) ─────────────────────────────────────────
  const admins90d = administrations.filter(a => {
    const schedDate = a.scheduled_time.slice(0, 10);
    return daysBetween(schedDate, today) >= 0 && daysBetween(schedDate, today) <= 90 && a.status !== "scheduled";
  });

  const totalScheduled = admins90d.length;
  const given = admins90d.filter(a => a.status === "given").length;
  const late = admins90d.filter(a => a.status === "late").length;
  const refused = admins90d.filter(a => a.status === "refused").length;
  const missed = admins90d.filter(a => a.status === "missed").length;
  const withheld = admins90d.filter(a => a.status === "withheld").length;

  const complianceRate = pct(given + late, totalScheduled);
  const onTimeRate = pct(given, given + late);
  const refusalRate = pct(refused, totalScheduled);

  // ── Witnessing ────────────────────────────────────────────────────────
  const administered = admins90d.filter(a => a.status === "given" || a.status === "late");
  const witnessed = administered.filter(a => a.witnessed_by && a.witnessed_by.trim() !== "");
  const witnessingRate = pct(witnessed.length, administered.length);

  // ── Stock management ──────────────────────────────────────────────────
  const withStockData = activeMeds.filter(m => m.stock_count !== null && m.stock_count !== undefined);
  const lowStock = withStockData.filter(m => (m.stock_count ?? 0) <= 7);
  const checkedRecently = activeMeds.filter(m => {
    if (!m.stock_last_checked) return false;
    return daysBetween(m.stock_last_checked, today) <= 7;
  });
  const stockCheckRate = pct(checkedRecently.length, activeMeds.length);
  const overdueStockChecks = activeMeds.filter(m => {
    if (!m.stock_last_checked) return true;
    return daysBetween(m.stock_last_checked, today) > 7;
  }).length;

  // ── Errors (90 days) ──────────────────────────────────────────────────
  const errors90d = errors.filter(e => daysBetween(e.date_occurred, today) >= 0 && daysBetween(e.date_occurred, today) <= 90);
  const bySeverity: Record<string, number> = {};
  for (const e of errors90d) {
    bySeverity[e.severity] = (bySeverity[e.severity] ?? 0) + 1;
  }
  const openErrors = errors90d.filter(e => e.status === "open" || e.status === "investigating").length;
  const errorRate = totalScheduled > 0 ? Math.round((errors90d.length / totalScheduled) * 100) : 0;

  // ── Build profiles ────────────────────────────────────────────────────
  const administration: AdministrationProfile = {
    total_scheduled: totalScheduled,
    total_given: given,
    total_late: late,
    total_refused: refused,
    total_missed: missed,
    total_withheld: withheld,
    compliance_rate: complianceRate,
    on_time_rate: onTimeRate,
    refusal_rate: refusalRate,
  };

  const witnessing: WitnessingProfile = {
    total_administered: administered.length,
    witnessed_count: witnessed.length,
    witnessing_rate: witnessingRate,
  };

  const stock: StockProfile = {
    active_medications: activeMeds.length,
    with_stock_data: withStockData.length,
    low_stock_count: lowStock.length,
    stock_check_rate: stockCheckRate,
    overdue_stock_checks: overdueStockChecks,
  };

  const errorProfile: ErrorProfile = {
    total_errors_90d: errors90d.length,
    by_severity: bySeverity,
    open_errors: openErrors,
    error_rate: errorRate,
  };

  const coverage: MedicationCoverageProfile = {
    children_on_medication: childrenOnMed.size,
    children_without: total_children - childrenOnMed.size,
    active_medications: activeMeds.length,
    regular_count: regularCount,
    prn_count: prnCount,
    controlled_count: controlledCount,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52 + max bonuses 28 = 80 (outstanding threshold)
  let score = 52;

  // mod1: Compliance rate (±5)
  if (complianceRate >= 95) score += 5;
  else if (complianceRate >= 85) score += 2;
  else if (complianceRate >= 70) score += 0;
  else if (complianceRate >= 50) score -= 3;
  else score -= 5;

  // mod2: On-time rate (±4)
  if (onTimeRate >= 90) score += 4;
  else if (onTimeRate >= 75) score += 2;
  else if (onTimeRate >= 60) score += 0;
  else if (onTimeRate >= 40) score -= 2;
  else score -= 4;

  // mod3: Witnessing rate (±4)
  if (witnessingRate >= 95) score += 4;
  else if (witnessingRate >= 80) score += 2;
  else if (witnessingRate >= 60) score += 0;
  else if (witnessingRate >= 40) score -= 2;
  else score -= 4;

  // mod4: Error rate (±4)
  if (errors90d.length === 0) score += 4;
  else if (errorRate <= 2) score += 2;
  else if (errorRate <= 5) score += 0;
  else if (errorRate <= 10) score -= 2;
  else score -= 4;

  // mod5: Stock management (±3)
  if (stockCheckRate >= 90 && lowStock.length === 0) score += 3;
  else if (stockCheckRate >= 70) score += 1;
  else if (stockCheckRate >= 50) score += 0;
  else if (stockCheckRate >= 30) score -= 1;
  else score -= 3;

  // mod6: Refusal management (±3)
  if (refusalRate === 0) score += 3;
  else if (refusalRate <= 5) score += 1;
  else if (refusalRate <= 10) score += 0;
  else if (refusalRate <= 20) score -= 1;
  else score -= 3;

  // mod7: PRN documentation (±3) — PRN administrations with reason AND effectiveness documented
  const prnAdmins = admins90d.filter(a => {
    const med = medications.find(m => m.id === a.medication_id);
    return med?.type === "prn" && (a.status === "given" || a.status === "late");
  });
  const prnDocumented = prnAdmins.filter(a => a.prn_reason && a.prn_reason.trim() !== "" && a.prn_effectiveness && a.prn_effectiveness.trim() !== "");
  const prnDocRate = pct(prnDocumented.length, prnAdmins.length);
  if (prnAdmins.length === 0) score += 2;  // no PRN needed — neutral-positive
  else if (prnDocRate >= 90) score += 3;
  else if (prnDocRate >= 70) score += 1;
  else if (prnDocRate >= 50) score += 0;
  else if (prnDocRate >= 30) score -= 1;
  else score -= 3;

  // mod8: Open error resolution (±2)
  if (errors90d.length === 0) score += 2;
  else if (openErrors === 0) score += 2;
  else if (pct(openErrors, errors90d.length) <= 25) score += 0;
  else score -= 2;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  let medication_rating: MedicationManagementRating;
  if (score >= 80) medication_rating = "outstanding";
  else if (score >= 65) medication_rating = "good";
  else if (score >= 45) medication_rating = "adequate";
  else medication_rating = "inadequate";

  // ── Strengths / Concerns / Recommendations / Insights ─────────────────
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  const insights: { text: string; severity: string }[] = [];
  let rank = 0;

  // Strengths
  if (complianceRate >= 95) strengths.push(`Excellent medication compliance at ${complianceRate}% — every scheduled administration is being completed.`);
  if (witnessingRate >= 95) strengths.push(`Outstanding witnessing rate at ${witnessingRate}% — dual-signature practice is embedded.`);
  if (errors90d.length === 0) strengths.push("No medication errors recorded in the last 90 days — strong safety culture.");
  if (onTimeRate >= 90) strengths.push(`${onTimeRate}% of medications given on time — excellent time management.`);
  if (prnAdmins.length > 0 && prnDocRate >= 90) strengths.push(`PRN documentation at ${prnDocRate}% — reason and effectiveness recorded for each use.`);
  if (stockCheckRate >= 90 && lowStock.length === 0) strengths.push("Stock levels healthy and checks completed on time — pharmacy liaison is effective.");

  // Concerns
  if (complianceRate < 70) concerns.push(`Medication compliance at ${complianceRate}% is below acceptable threshold. Children may not be receiving prescribed treatment.`);
  if (missed > 0) concerns.push(`${missed} missed administration${missed > 1 ? "s" : ""} in 90 days. Missed doses represent a direct risk to children's health.`);
  if (witnessingRate < 60) concerns.push(`Witnessing rate at ${witnessingRate}% — insufficient dual-checking could mask errors.`);
  if (errors90d.length > 0 && (bySeverity["serious"] ?? 0) + (bySeverity["critical"] ?? 0) > 0) {
    concerns.push(`${(bySeverity["serious"] ?? 0) + (bySeverity["critical"] ?? 0)} serious/critical medication error${((bySeverity["serious"] ?? 0) + (bySeverity["critical"] ?? 0)) > 1 ? "s" : ""} in 90 days — immediate review required.`);
  }
  if (openErrors > 0) concerns.push(`${openErrors} medication error${openErrors > 1 ? "s" : ""} still open/under investigation.`);
  if (lowStock.length > 0) concerns.push(`${lowStock.length} medication${lowStock.length > 1 ? "s" : ""} with low stock (≤7 days supply). Risk of missed doses if not reordered.`);
  if (refusalRate > 10) concerns.push(`Refusal rate at ${refusalRate}% — persistent refusals need therapeutic exploration and prescriber review.`);

  // Recommendations
  if (complianceRate < 85) {
    recommendations.push({ rank: ++rank, recommendation: "Implement medication round checklists and shift-leader sign-off to improve compliance.", urgency: complianceRate < 70 ? "immediate" : "soon", regulatory_ref: "Reg 23" });
  }
  if (witnessingRate < 80) {
    recommendations.push({ rank: ++rank, recommendation: "Ensure all medication administrations are witnessed by a second trained staff member.", urgency: witnessingRate < 60 ? "immediate" : "soon", regulatory_ref: "Reg 23" });
  }
  if (lowStock.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Reorder medications with low stock and establish automatic reorder triggers.", urgency: "soon", regulatory_ref: "Reg 23" });
  }
  if (overdueStockChecks > 0) {
    recommendations.push({ rank: ++rank, recommendation: `${overdueStockChecks} medication${overdueStockChecks > 1 ? "s" : ""} overdue for stock check — complete weekly stock audits.`, urgency: "soon", regulatory_ref: "Reg 23" });
  }
  if (openErrors > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Close outstanding medication error investigations and implement lessons learned.", urgency: "immediate", regulatory_ref: "Reg 23" });
  }
  if (prnAdmins.length > 0 && prnDocRate < 70) {
    recommendations.push({ rank: ++rank, recommendation: "Improve PRN documentation — record reason for use and effectiveness each time.", urgency: "soon", regulatory_ref: "Reg 23" });
  }
  if (refusalRate > 5 && refusalRate <= 20) {
    recommendations.push({ rank: ++rank, recommendation: "Review persistent medication refusals with prescriber and explore therapeutic approaches.", urgency: "planned", regulatory_ref: "Reg 23" });
  }

  // ARIA Insights
  if (complianceRate >= 95 && witnessingRate >= 95 && errors90d.length === 0) {
    insights.push({ text: "Medication management is exemplary. High compliance, universal witnessing, and zero errors demonstrate a well-embedded safety culture. This is a key strength for Ofsted inspection.", severity: "positive" });
  }
  if (late > 0 && late >= given * 0.1) {
    insights.push({ text: `${late} late administrations detected — ${pct(late, given + late)}% of administered doses. Late medication can reduce therapeutic effectiveness. Consider reviewing shift timing, handover processes, and staffing at medication rounds.`, severity: "warning" });
  }
  if (errors90d.length >= 3) {
    insights.push({ text: `${errors90d.length} medication errors in 90 days signals a systemic issue. This will be flagged at Ofsted inspection as a leadership and management concern. Root cause analysis across all errors should identify common factors.`, severity: "critical" });
  }
  if (refusalRate > 10) {
    insights.push({ text: `Persistent medication refusals (${refusalRate}%) may indicate therapeutic resistance, side effects, or relationship issues. A multi-disciplinary approach — involving prescriber, CAMHS, and key worker — can help children understand the purpose of their medication.`, severity: "warning" });
  }
  if (prnAdmins.length >= 5 && prnAdmins.length > administered.length * 0.3) {
    insights.push({ text: `High PRN usage (${prnAdmins.length} administrations) may indicate unmanaged symptoms or insufficient regular medication review. Consider prescriber review to adjust regular prescriptions.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (medication_rating === "outstanding") {
    headline = `Medication management is outstanding — ${complianceRate}% compliance with ${errors90d.length === 0 ? "zero errors" : "minimal errors"} across ${activeMeds.length} active medications.`;
  } else if (medication_rating === "good") {
    headline = `Good medication management — ${complianceRate}% compliance. ${concerns.length > 0 ? concerns.length + " area" + (concerns.length > 1 ? "s" : "") + " for improvement." : "Minor refinements possible."}`;
  } else if (medication_rating === "adequate") {
    headline = `Medication management requires attention — compliance at ${complianceRate}% with ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified.`;
  } else {
    headline = `Medication management is inadequate — significant risks identified. ${missed > 0 ? missed + " missed dose" + (missed > 1 ? "s" : "") + "." : ""} Immediate action required.`;
  }

  return {
    medication_rating,
    medication_score: score,
    headline,
    administration,
    witnessing,
    stock,
    errors: errorProfile,
    coverage,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
