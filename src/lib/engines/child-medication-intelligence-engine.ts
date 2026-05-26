// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD MEDICATION INTELLIGENCE ENGINE
// Per-child: medication safety analysis — adherence rates, refusal patterns,
// timeliness, witnessing compliance, PRN usage, stock management, errors.
// CHR 2015 Reg 23 (Health), Reg 12 (Safe administration). SCCIF: "Health."
// Pure deterministic — no DB, no LLM, no side effects.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type MedType = "regular" | "prn" | "controlled" | "topical" | "inhaler" | "injection" | "other";
export type AdminStatus = "given" | "refused" | "withheld" | "not_available" | "self_administered" | "late" | "missed" | "scheduled";
export type ErrorSeverity = "no_harm" | "low" | "moderate" | "severe" | "death";
export type ErrorStatus = "reported" | "under_investigation" | "action_required" | "closed" | "escalated";

export interface MedicationInput {
  id: string;
  name: string;
  type: MedType;
  dosage: string;
  frequency: string;
  is_active: boolean;
  stock_count: number | null;
  stock_last_checked: string | null;
  start_date: string;
  end_date: string | null;
}

export interface AdministrationInput {
  id: string;
  medication_id: string;
  scheduled_time: string;
  actual_time: string | null;
  status: AdminStatus;
  administered_by: string | null;
  witnessed_by: string | null;
  dose_given: string | null;
  reason_not_given: string | null;
  prn_reason: string | null;
  prn_effectiveness: string | null;
}

export interface MedErrorInput {
  id: string;
  date_occurred: string;
  error_type: string;
  severity: ErrorSeverity;
  status: ErrorStatus;
  has_remedial_actions: boolean;
  remedial_actions_completed: number;
  remedial_actions_total: number;
}

export interface ChildMedicationInput {
  today: string;
  child_id: string;
  child_name: string;
  medications: MedicationInput[];
  administrations: AdministrationInput[];
  errors: MedErrorInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type MedicationSafetyRating = "outstanding" | "good" | "adequate" | "inadequate" | "no_medications";

export interface AdherenceProfile {
  adherence_rate_30d: number;          // 0-100 (given+self_admin / total non-scheduled)
  adherence_rate_7d: number;
  refusal_count_30d: number;
  refusal_count_7d: number;
  refusal_rate_30d: number;
  late_count_30d: number;
  late_rate_30d: number;
  missed_count_30d: number;
  missed_rate_30d: number;
  total_administrations_30d: number;
  total_administrations_7d: number;
  adherence_trend: "improving" | "stable" | "declining" | "insufficient_data";
}

export interface WitnessingProfile {
  witnessing_rate_30d: number;         // 0-100
  unwitnessed_count_30d: number;
  controlled_drug_witnessing_rate: number;
}

export interface PRNProfile {
  prn_count_30d: number;
  prn_count_7d: number;
  prn_trend: "increasing" | "stable" | "decreasing" | "insufficient_data";
  effectiveness_recorded_rate: number;
  reason_recorded_rate: number;
  prn_medications: { name: string; count_30d: number }[];
}

export interface TimelinesProfile {
  on_time_rate_30d: number;            // within 30 mins of scheduled
  avg_delay_minutes: number | null;
  max_delay_minutes: number | null;
}

export interface StockProfile {
  medications_with_stock: number;
  stock_low_count: number;             // <7 days estimated supply
  stock_checked_recently: number;      // checked within 7 days
  stock_check_rate: number;
}

export interface ErrorProfile {
  total_errors_90d: number;
  errors_30d: number;
  open_errors: number;
  highest_severity: ErrorSeverity | null;
  remedial_completion_rate: number;
}

export interface MedicationDetail {
  medication_id: string;
  name: string;
  type: MedType;
  dosage: string;
  frequency: string;
  is_active: boolean;
  administrations_30d: number;
  adherence_rate: number;
  refusal_count: number;
  late_count: number;
  missed_count: number;
  witnessing_rate: number;
}

export interface ChildMedicationResult {
  generated_at: string;
  child_id: string;
  child_name: string;
  medication_safety_rating: MedicationSafetyRating;
  medication_safety_score: number;
  headline: string;
  active_medication_count: number;
  has_controlled_drugs: boolean;
  adherence: AdherenceProfile;
  witnessing: WitnessingProfile;
  prn: PRNProfile;
  timeliness: TimelinesProfile;
  stock: StockProfile;
  errors: ErrorProfile;
  medication_details: MedicationDetail[];
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: "immediate" | "soon" | "planned"; regulatory_ref: string | null }[];
  insights: { severity: "critical" | "warning" | "positive"; text: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function pct(num: number, den: number): number {
  return den === 0 ? 0 : Math.round((num / den) * 100);
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

const SEVERITY_ORDER: Record<string, number> = {
  no_harm: 0, low: 1, moderate: 2, severe: 3, death: 4,
};

// ── Main Compute Function ───────────────────────────────────────────────────

export function computeChildMedication(input: ChildMedicationInput): ChildMedicationResult {
  const { today, child_id, child_name, medications, administrations, errors } = input;

  const activeMeds = medications.filter((m) => m.is_active);
  const hasControlled = activeMeds.some((m) => m.type === "controlled");

  // ── No medications path ─────────────────────────────────────────────────
  if (medications.length === 0) {
    return {
      generated_at: today,
      child_id,
      child_name,
      medication_safety_rating: "no_medications",
      medication_safety_score: 0,
      headline: `${child_name} — no_medications: No medication records on file.`,
      active_medication_count: 0,
      has_controlled_drugs: false,
      adherence: {
        adherence_rate_30d: 0, adherence_rate_7d: 0,
        refusal_count_30d: 0, refusal_count_7d: 0, refusal_rate_30d: 0,
        late_count_30d: 0, late_rate_30d: 0,
        missed_count_30d: 0, missed_rate_30d: 0,
        total_administrations_30d: 0, total_administrations_7d: 0,
        adherence_trend: "insufficient_data",
      },
      witnessing: { witnessing_rate_30d: 0, unwitnessed_count_30d: 0, controlled_drug_witnessing_rate: 0 },
      prn: { prn_count_30d: 0, prn_count_7d: 0, prn_trend: "insufficient_data", effectiveness_recorded_rate: 0, reason_recorded_rate: 0, prn_medications: [] },
      timeliness: { on_time_rate_30d: 0, avg_delay_minutes: null, max_delay_minutes: null },
      stock: { medications_with_stock: 0, stock_low_count: 0, stock_checked_recently: 0, stock_check_rate: 0 },
      errors: { total_errors_90d: 0, errors_30d: 0, open_errors: 0, highest_severity: null, remedial_completion_rate: 0 },
      medication_details: [],
      strengths: [],
      concerns: ["No medication records found for this child."],
      recommendations: [],
      insights: [{ severity: "positive", text: `${child_name} has no medications on record — no medication safety risks to manage.` }],
    };
  }

  // ── Time windows ────────────────────────────────────────────────────────
  const admins30d = administrations.filter((a) => {
    const d = dateOnly(a.scheduled_time);
    return daysBetween(d, today) >= 0 && daysBetween(d, today) <= 30 && a.status !== "scheduled";
  });
  const admins7d = administrations.filter((a) => {
    const d = dateOnly(a.scheduled_time);
    return daysBetween(d, today) >= 0 && daysBetween(d, today) <= 7 && a.status !== "scheduled";
  });

  // Prior 30d window for trend (days 31-60)
  const adminsPrior30d = administrations.filter((a) => {
    const d = dateOnly(a.scheduled_time);
    const gap = daysBetween(d, today);
    return gap > 30 && gap <= 60 && a.status !== "scheduled";
  });

  // ── Adherence ───────────────────────────────────────────────────────────
  const given30d = admins30d.filter((a) => a.status === "given" || a.status === "self_administered").length;
  const refused30d = admins30d.filter((a) => a.status === "refused").length;
  const late30d = admins30d.filter((a) => a.status === "late").length;
  const missed30d = admins30d.filter((a) => a.status === "missed").length;

  const given7d = admins7d.filter((a) => a.status === "given" || a.status === "self_administered").length;
  const refused7d = admins7d.filter((a) => a.status === "refused").length;

  const adherenceRate30d = pct(given30d + late30d, admins30d.length); // late still counts as given
  const adherenceRate7d = pct(given7d + admins7d.filter((a) => a.status === "late").length, admins7d.length);

  const givenPrior = adminsPrior30d.filter((a) => a.status === "given" || a.status === "self_administered" || a.status === "late").length;
  const adherenceRatePrior = pct(givenPrior, adminsPrior30d.length);

  let adherenceTrend: "improving" | "stable" | "declining" | "insufficient_data" = "insufficient_data";
  if (admins30d.length >= 5 && adminsPrior30d.length >= 5) {
    const diff = adherenceRate30d - adherenceRatePrior;
    if (diff >= 5) adherenceTrend = "improving";
    else if (diff <= -5) adherenceTrend = "declining";
    else adherenceTrend = "stable";
  }

  const adherence: AdherenceProfile = {
    adherence_rate_30d: adherenceRate30d,
    adherence_rate_7d: adherenceRate7d,
    refusal_count_30d: refused30d,
    refusal_count_7d: refused7d,
    refusal_rate_30d: pct(refused30d, admins30d.length),
    late_count_30d: late30d,
    late_rate_30d: pct(late30d, admins30d.length),
    missed_count_30d: missed30d,
    missed_rate_30d: pct(missed30d, admins30d.length),
    total_administrations_30d: admins30d.length,
    total_administrations_7d: admins7d.length,
    adherence_trend: adherenceTrend,
  };

  // ── Witnessing ──────────────────────────────────────────────────────────
  const givenAdmins30d = admins30d.filter((a) => a.status === "given" || a.status === "self_administered" || a.status === "late");
  const witnessed30d = givenAdmins30d.filter((a) => !!a.witnessed_by).length;
  const witnessingRate30d = pct(witnessed30d, givenAdmins30d.length);

  // Controlled drug witnessing
  const controlledMedIds = new Set(activeMeds.filter((m) => m.type === "controlled").map((m) => m.id));
  const controlledAdmins = givenAdmins30d.filter((a) => controlledMedIds.has(a.medication_id));
  const controlledWitnessed = controlledAdmins.filter((a) => !!a.witnessed_by).length;
  const controlledWitnessingRate = pct(controlledWitnessed, controlledAdmins.length);

  const witnessing: WitnessingProfile = {
    witnessing_rate_30d: witnessingRate30d,
    unwitnessed_count_30d: givenAdmins30d.length - witnessed30d,
    controlled_drug_witnessing_rate: controlledWitnessingRate,
  };

  // ── PRN ─────────────────────────────────────────────────────────────────
  const prnMedIds = new Set(activeMeds.filter((m) => m.type === "prn").map((m) => m.id));
  const prnAdmins30d = admins30d.filter((a) => prnMedIds.has(a.medication_id));
  const prnAdmins7d = admins7d.filter((a) => prnMedIds.has(a.medication_id));
  const prnAdminsPrior = adminsPrior30d.filter((a) => prnMedIds.has(a.medication_id));

  let prnTrend: "increasing" | "stable" | "decreasing" | "insufficient_data" = "insufficient_data";
  if (prnAdmins30d.length + prnAdminsPrior.length >= 3) {
    const diff = prnAdmins30d.length - prnAdminsPrior.length;
    if (diff >= 2) prnTrend = "increasing";
    else if (diff <= -2) prnTrend = "decreasing";
    else prnTrend = "stable";
  }

  const prnWithEffectiveness = prnAdmins30d.filter((a) => !!a.prn_effectiveness).length;
  const prnWithReason = prnAdmins30d.filter((a) => !!a.prn_reason).length;

  // PRN by medication
  const prnByMed = new Map<string, number>();
  for (const a of prnAdmins30d) {
    const med = activeMeds.find((m) => m.id === a.medication_id);
    const name = med?.name ?? "Unknown";
    prnByMed.set(name, (prnByMed.get(name) ?? 0) + 1);
  }

  const prn: PRNProfile = {
    prn_count_30d: prnAdmins30d.length,
    prn_count_7d: prnAdmins7d.length,
    prn_trend: prnTrend,
    effectiveness_recorded_rate: pct(prnWithEffectiveness, prnAdmins30d.length),
    reason_recorded_rate: pct(prnWithReason, prnAdmins30d.length),
    prn_medications: Array.from(prnByMed.entries())
      .map(([name, count_30d]) => ({ name, count_30d }))
      .sort((a, b) => b.count_30d - a.count_30d),
  };

  // ── Timeliness ──────────────────────────────────────────────────────────
  const timedAdmins = givenAdmins30d.filter((a) => a.actual_time);
  const delays: number[] = [];
  for (const a of timedAdmins) {
    const sched = new Date(a.scheduled_time).getTime();
    const actual = new Date(a.actual_time!).getTime();
    const delayMins = Math.max(0, Math.round((actual - sched) / 60_000));
    delays.push(delayMins);
  }
  const onTime30d = delays.filter((d) => d <= 30).length;

  const timeliness: TimelinesProfile = {
    on_time_rate_30d: pct(onTime30d, delays.length),
    avg_delay_minutes: avg(delays),
    max_delay_minutes: delays.length > 0 ? Math.max(...delays) : null,
  };

  // ── Stock ───────────────────────────────────────────────────────────────
  const medsWithStock = activeMeds.filter((m) => m.stock_count !== null);
  const stockLow = medsWithStock.filter((m) => m.stock_count !== null && m.stock_count < 7);
  const recentlyChecked = medsWithStock.filter((m) => {
    if (!m.stock_last_checked) return false;
    return daysBetween(m.stock_last_checked, today) <= 7;
  });

  const stock: StockProfile = {
    medications_with_stock: medsWithStock.length,
    stock_low_count: stockLow.length,
    stock_checked_recently: recentlyChecked.length,
    stock_check_rate: pct(recentlyChecked.length, medsWithStock.length),
  };

  // ── Errors ──────────────────────────────────────────────────────────────
  const errors90d = errors.filter((e) => daysBetween(e.date_occurred, today) >= 0 && daysBetween(e.date_occurred, today) <= 90);
  const errors30d = errors90d.filter((e) => daysBetween(e.date_occurred, today) <= 30);
  const openErrors = errors.filter((e) => e.status !== "closed");

  let highestSeverity: ErrorSeverity | null = null;
  for (const e of errors90d) {
    if (!highestSeverity || SEVERITY_ORDER[e.severity] > SEVERITY_ORDER[highestSeverity]) {
      highestSeverity = e.severity;
    }
  }

  const remedialTotal = errors90d.reduce((s, e) => s + e.remedial_actions_total, 0);
  const remedialDone = errors90d.reduce((s, e) => s + e.remedial_actions_completed, 0);

  const errorProfile: ErrorProfile = {
    total_errors_90d: errors90d.length,
    errors_30d: errors30d.length,
    open_errors: openErrors.length,
    highest_severity: highestSeverity,
    remedial_completion_rate: pct(remedialDone, remedialTotal),
  };

  // ── Per-medication details ──────────────────────────────────────────────
  const medicationDetails: MedicationDetail[] = activeMeds.map((med) => {
    const medAdmins = admins30d.filter((a) => a.medication_id === med.id);
    const medGiven = medAdmins.filter((a) => a.status === "given" || a.status === "self_administered" || a.status === "late");
    const medWitnessed = medGiven.filter((a) => !!a.witnessed_by);
    return {
      medication_id: med.id,
      name: med.name,
      type: med.type,
      dosage: med.dosage,
      frequency: med.frequency,
      is_active: true,
      administrations_30d: medAdmins.length,
      adherence_rate: pct(medGiven.length, medAdmins.length),
      refusal_count: medAdmins.filter((a) => a.status === "refused").length,
      late_count: medAdmins.filter((a) => a.status === "late").length,
      missed_count: medAdmins.filter((a) => a.status === "missed").length,
      witnessing_rate: pct(medWitnessed.length, medGiven.length),
    };
  }).sort((a, b) => a.adherence_rate - b.adherence_rate); // worst adherence first

  // ── Scoring ─────────────────────────────────────────────────────────────
  let score = 50;

  // Adherence (+/- up to 20)
  if (adherenceRate30d >= 95) score += 20;
  else if (adherenceRate30d >= 85) score += 12;
  else if (adherenceRate30d >= 70) score += 5;
  else if (adherenceRate30d >= 50) score -= 5;
  else if (admins30d.length > 0) score -= 15;

  // Witnessing (+/- up to 10)
  if (witnessingRate30d >= 95) score += 10;
  else if (witnessingRate30d >= 80) score += 5;
  else if (witnessingRate30d < 50 && givenAdmins30d.length > 0) score -= 10;

  // Controlled drug witnessing (critical)
  if (hasControlled && controlledWitnessingRate < 100 && controlledAdmins.length > 0) score -= 10;

  // Timeliness (+/- up to 8)
  if (timeliness.on_time_rate_30d >= 95) score += 8;
  else if (timeliness.on_time_rate_30d >= 80) score += 4;
  else if (timeliness.on_time_rate_30d < 60 && delays.length > 0) score -= 5;

  // Refusals (penalty)
  if (refused30d >= 5) score -= 8;
  else if (refused30d >= 3) score -= 4;

  // Missed doses (heavy penalty)
  if (missed30d >= 3) score -= 12;
  else if (missed30d >= 1) score -= 6;

  // Errors (heavy penalty)
  if (errors30d.length >= 2) score -= 15;
  else if (errors30d.length === 1) score -= 8;
  if (highestSeverity === "severe" || highestSeverity === "death") score -= 10;
  if (openErrors.length >= 2) score -= 5;

  // PRN documentation
  if (prnAdmins30d.length > 0) {
    if (prn.effectiveness_recorded_rate >= 90 && prn.reason_recorded_rate >= 90) score += 5;
    else if (prn.reason_recorded_rate < 50) score -= 5;
  }

  // Stock management
  if (medsWithStock.length > 0 && stock.stock_check_rate >= 80) score += 3;
  if (stockLow.length > 0) score -= 3;

  // Trend adjustment
  if (adherenceTrend === "improving") score += 3;
  if (adherenceTrend === "declining") score -= 5;

  // No recent administrations when active meds exist
  if (activeMeds.length > 0 && admins7d.length === 0 && activeMeds.some((m) => m.type === "regular")) {
    score -= 10;
  }

  score = clamp(Math.round(score), 0, 100);

  // ── Rating ──────────────────────────────────────────────────────────────
  let rating: MedicationSafetyRating;
  if (score >= 80) rating = "outstanding";
  else if (score >= 65) rating = "good";
  else if (score >= 45) rating = "adequate";
  else rating = "inadequate";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (adherenceRate30d >= 95 && admins30d.length >= 10) strengths.push(`Excellent medication adherence at ${adherenceRate30d}% over 30 days.`);
  if (witnessingRate30d >= 95 && givenAdmins30d.length >= 5) strengths.push(`Strong witnessing compliance at ${witnessingRate30d}% — all administrations properly observed.`);
  if (hasControlled && controlledWitnessingRate === 100 && controlledAdmins.length > 0) strengths.push("100% witnessing rate for controlled drugs — full regulatory compliance.");
  if (timeliness.on_time_rate_30d >= 95 && delays.length >= 5) strengths.push(`${timeliness.on_time_rate_30d}% of administrations on time — excellent timeliness.`);
  if (refused30d === 0 && admins30d.length >= 10) strengths.push("No medication refusals in 30 days — consistent engagement.");
  if (missed30d === 0 && admins30d.length >= 10) strengths.push("No missed doses in 30 days — reliable administration.");
  if (errors90d.length === 0 && admins30d.length > 0) strengths.push("No medication errors recorded in 90 days — safe practice.");
  if (prnAdmins30d.length > 0 && prn.effectiveness_recorded_rate >= 90) strengths.push("PRN effectiveness consistently documented — good clinical practice.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (adherenceRate30d < 70 && admins30d.length >= 5) concerns.push(`Low medication adherence at ${adherenceRate30d}% — health outcomes at risk (Reg 23).`);
  if (refused30d >= 3) concerns.push(`${refused30d} medication refusals in 30 days — pattern requires review.`);
  if (missed30d >= 2) concerns.push(`${missed30d} missed doses in 30 days — potential safeguarding concern (Reg 23).`);
  if (witnessingRate30d < 80 && givenAdmins30d.length >= 5) concerns.push(`Witnessing rate only ${witnessingRate30d}% — ${witnessing.unwitnessed_count_30d} unwitnessed administrations.`);
  if (hasControlled && controlledWitnessingRate < 100 && controlledAdmins.length > 0) concerns.push("Controlled drugs administered without witness — regulatory breach (Reg 12).");
  if (errors30d.length > 0) concerns.push(`${errors30d.length} medication error(s) in last 30 days — investigation required.`);
  if (highestSeverity === "severe" || highestSeverity === "death") concerns.push("Severe medication error recorded — critical patient safety concern.");
  if (openErrors.length > 0) concerns.push(`${openErrors.length} medication error(s) still open — remedial actions outstanding.`);
  if (timeliness.on_time_rate_30d < 70 && delays.length >= 5) concerns.push(`Only ${timeliness.on_time_rate_30d}% on-time administration — timeliness needs improvement.`);
  if (stockLow.length > 0) concerns.push(`${stockLow.length} medication(s) with low stock (<7 doses) — reorder needed.`);
  if (activeMeds.length > 0 && admins7d.length === 0 && activeMeds.some((m) => m.type === "regular")) {
    concerns.push("No medication administrations recorded in last 7 days despite active regular medications.");
  }
  if (adherenceTrend === "declining") concerns.push("Medication adherence is declining compared to prior period.");

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: ChildMedicationResult["recommendations"] = [];
  let rank = 0;

  if (missed30d >= 2) recs.push({ rank: ++rank, recommendation: `Review missed dose protocol — ${missed30d} missed doses in 30 days. Ensure staff understand escalation pathway.`, urgency: "immediate", regulatory_ref: "Reg 23" });
  if (hasControlled && controlledWitnessingRate < 100 && controlledAdmins.length > 0) recs.push({ rank: ++rank, recommendation: "Ensure all controlled drug administrations are witnessed and countersigned. Immediate audit required.", urgency: "immediate", regulatory_ref: "Reg 12" });
  if (errors30d.length > 0) recs.push({ rank: ++rank, recommendation: "Complete investigation of recent medication error(s) and implement remedial actions.", urgency: "immediate", regulatory_ref: "Reg 23" });
  if (refused30d >= 3) recs.push({ rank: ++rank, recommendation: `Consider medication review with prescriber — ${refused30d} refusals may indicate side effects or disengagement.`, urgency: "soon", regulatory_ref: "Reg 23" });
  if (witnessingRate30d < 80 && givenAdmins30d.length >= 5) recs.push({ rank: ++rank, recommendation: `Improve witnessing compliance — currently ${witnessingRate30d}%. Brief all staff on witnessing protocol.`, urgency: "soon", regulatory_ref: "Reg 12" });
  if (timeliness.on_time_rate_30d < 70 && delays.length >= 5) recs.push({ rank: ++rank, recommendation: "Review medication administration scheduling to improve timeliness.", urgency: "soon", regulatory_ref: "Reg 23" });
  if (stockLow.length > 0) recs.push({ rank: ++rank, recommendation: `Reorder low-stock medications (${stockLow.length} medication(s) below 7-dose threshold).`, urgency: "soon", regulatory_ref: "Reg 23" });
  if (prnAdmins30d.length > 0 && prn.effectiveness_recorded_rate < 70) recs.push({ rank: ++rank, recommendation: "Improve PRN effectiveness documentation — clinical review needs outcome evidence.", urgency: "planned", regulatory_ref: "Reg 23" });
  if (activeMeds.length > 0 && admins7d.length === 0 && activeMeds.some((m) => m.type === "regular")) recs.push({ rank: ++rank, recommendation: "Investigate gap in medication recording — no administrations in past 7 days despite active prescriptions.", urgency: "immediate", regulatory_ref: "Reg 23" });

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: ChildMedicationResult["insights"] = [];

  if (errors30d.length > 0 || (highestSeverity && SEVERITY_ORDER[highestSeverity] >= 2)) {
    insights.push({ severity: "critical", text: `ARIA detects ${errors90d.length} medication error(s) in 90 days${highestSeverity ? ` (highest severity: ${highestSeverity})` : ""}. Ofsted inspectors will scrutinise error management and learning — ensure remedial actions are documented.` });
  }
  if (missed30d >= 2) {
    insights.push({ severity: "critical", text: `${missed30d} missed doses in 30 days. Under Reg 23, homes must ensure children receive prescribed medication. Missed doses represent a direct compliance risk.` });
  }
  if (hasControlled && controlledWitnessingRate < 100 && controlledAdmins.length > 0) {
    insights.push({ severity: "critical", text: "Controlled drug administration without witnessing is a serious regulatory breach under Reg 12. This would be flagged as a priority area in any inspection." });
  }
  if (adherenceTrend === "declining") {
    insights.push({ severity: "warning", text: `Medication adherence trend is declining for ${child_name}. Consider whether this relates to placement stability, relationship with staff, or side effects.` });
  }
  if (refused30d >= 3) {
    insights.push({ severity: "warning", text: `Pattern of ${refused30d} refusals may indicate ${child_name} is struggling with medication acceptance. Therapeutic approach recommended — explore underlying feelings about medication.` });
  }
  if (rating === "outstanding") {
    insights.push({ severity: "positive", text: `Outstanding medication safety for ${child_name}. Adherence, witnessing, timeliness, and documentation all meet the highest standards — evidence of excellent Reg 23 compliance.` });
  } else if (rating === "good" && errors90d.length === 0) {
    insights.push({ severity: "positive", text: `Good medication safety practice for ${child_name} with no errors in 90 days. Minor improvements in ${witnessingRate30d < 95 ? "witnessing" : "timeliness"} would elevate to outstanding.` });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [`${child_name} — ${rating}`];
  if (admins30d.length > 0) {
    parts.push(`${adherenceRate30d}% adherence`);
    if (refused30d > 0) parts.push(`${refused30d} refusals`);
    if (missed30d > 0) parts.push(`${missed30d} missed`);
    if (errors30d.length > 0) parts.push(`${errors30d.length} error(s)`);
  } else if (activeMeds.length > 0) {
    parts.push("no administrations recorded in 30 days");
  }
  const headline = parts.join(": ").replace(/: /, ": ") + ".";

  return {
    generated_at: today,
    child_id,
    child_name,
    medication_safety_rating: rating,
    medication_safety_score: score,
    headline,
    active_medication_count: activeMeds.length,
    has_controlled_drugs: hasControlled,
    adherence,
    witnessing,
    prn,
    timeliness,
    stock,
    errors: errorProfile,
    medication_details: medicationDetails,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}
