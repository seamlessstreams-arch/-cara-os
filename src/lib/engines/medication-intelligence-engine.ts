// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION ADMINISTRATION INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses medication adherence, refusals, timeliness, witnessing compliance,
// PRN usage patterns, stock management, and controlled drug oversight.
//
// Regulatory: Reg 23 (Health & therapeutic provision — correct medication),
// Reg 12 (Health & safety — safe storage & administration),
// Children's Homes Regulations 2015 + Ofsted SCCIF: Health domain.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ChildInput {
  id: string;
  name: string;
}

export type MedicationType = "regular" | "prn" | "controlled" | "topical" | "inhaler" | "injection" | "other";
export type AdminStatus = "given" | "refused" | "withheld" | "not_available" | "self_administered" | "late" | "missed" | "scheduled";

export interface MedicationInput {
  id: string;
  child_id: string;
  name: string;
  type: MedicationType;
  dosage: string;
  is_active: boolean;
  stock_count: number | null;
  stock_last_checked: string | null;
}

export interface AdministrationInput {
  id: string;
  medication_id: string;
  child_id: string;
  scheduled_time: string; // ISO datetime
  actual_time: string | null;
  status: AdminStatus;
  administered_by: string | null;
  witnessed_by: string | null;
  dose_given: string | null;
  reason_not_given: string | null;
  prn_reason: string | null;
  prn_effectiveness: string | null;
}

export interface MedicationIntelligenceInput {
  children: ChildInput[];
  medications: MedicationInput[];
  administrations: AdministrationInput[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface MedicationOverview {
  total_active_medications: number;
  total_administrations_30d: number;
  adherence_rate: number;         // 0-100 (given + self_administered / total non-scheduled)
  refusal_rate: number;           // 0-100
  late_rate: number;              // 0-100
  missed_rate: number;            // 0-100
  witnessing_rate: number;        // 0-100 (has witnessed_by)
  prn_administrations_30d: number;
  controlled_drug_count: number;
  stock_check_compliance: number; // 0-100 (checked within 7 days)
}

export interface ChildMedicationProfile {
  child_id: string;
  child_name: string;
  active_medications: number;
  administrations_30d: number;
  adherence_rate: number;
  refusal_count_30d: number;
  late_count_30d: number;
  missed_count_30d: number;
  prn_uses_30d: number;
  compliance_status: "excellent" | "good" | "concerns" | "critical";
}

export interface MedicationDetail {
  medication_id: string;
  medication_name: string;
  child_name: string;
  type: MedicationType;
  administrations_30d: number;
  adherence_rate: number;
  refusal_count: number;
  late_count: number;
  missed_count: number;
  stock_count: number | null;
  stock_low: boolean; // <7 days supply
}

export interface PRNAnalysis {
  total_prn_30d: number;
  by_medication: { name: string; count: number }[];
  effectiveness_rate: number; // pct with reported effectiveness
}

export interface MedicationAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraMedicationInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface MedicationIntelligenceResult {
  overview: MedicationOverview;
  child_profiles: ChildMedicationProfile[];
  medication_details: MedicationDetail[];
  prn_analysis: PRNAnalysis;
  alerts: MedicationAlert[];
  insights: CaraMedicationInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msB - msA) / 86_400_000);
}

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function pctOf(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

function dateOnly(isoDatetime: string): string {
  return isoDatetime.slice(0, 10);
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeMedicationIntelligence(input: MedicationIntelligenceInput): MedicationIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { children, medications, administrations } = input;

  const activeMeds = medications.filter((m) => m.is_active);

  // Filter administrations to last 30 days, exclude "scheduled" (future doses)
  const admins30d = administrations.filter((a) => {
    const adminDate = dateOnly(a.scheduled_time);
    return daysBetween(adminDate, today) <= 30 && a.status !== "scheduled";
  });

  const total30d = admins30d.length;

  // Core counts
  const given = admins30d.filter((a) => a.status === "given" || a.status === "self_administered").length;
  const refused = admins30d.filter((a) => a.status === "refused").length;
  const late = admins30d.filter((a) => a.status === "late").length;
  const missed = admins30d.filter((a) => a.status === "missed").length;
  const witnessed = admins30d.filter((a) => a.witnessed_by != null && a.witnessed_by.length > 0).length;

  // PRN
  const prnMedIds = new Set(activeMeds.filter((m) => m.type === "prn").map((m) => m.id));
  const prnAdmins30d = admins30d.filter((a) => prnMedIds.has(a.medication_id));

  // Stock check compliance (checked within 7 days)
  const stockChecked = activeMeds.filter(
    (m) => m.stock_last_checked && daysBetween(m.stock_last_checked, today) <= 7,
  ).length;

  // Controlled drugs
  const controlledCount = activeMeds.filter((m) => m.type === "controlled").length;

  // Adherence = (given + self_administered + late) / total — late still counts as administered
  const adhered = given + late;

  const overview: MedicationOverview = {
    total_active_medications: activeMeds.length,
    total_administrations_30d: total30d,
    adherence_rate: pctOf(adhered, total30d),
    refusal_rate: pctOf(refused, total30d),
    late_rate: pctOf(late, total30d),
    missed_rate: pctOf(missed, total30d),
    witnessing_rate: pctOf(witnessed, total30d),
    prn_administrations_30d: prnAdmins30d.length,
    controlled_drug_count: controlledCount,
    stock_check_compliance: activeMeds.length > 0 ? pctOf(stockChecked, activeMeds.length) : 100,
  };

  // ── Child Profiles ────────────────────────────────────────────────────
  const child_profiles: ChildMedicationProfile[] = children
    .filter((c) => activeMeds.some((m) => m.child_id === c.id))
    .map((child) => {
      const childAdmins = admins30d.filter((a) => a.child_id === child.id);
      const childTotal = childAdmins.length;
      const childGiven = childAdmins.filter((a) => a.status === "given" || a.status === "self_administered").length;
      const childLate = childAdmins.filter((a) => a.status === "late").length;
      const childRefused = childAdmins.filter((a) => a.status === "refused").length;
      const childMissed = childAdmins.filter((a) => a.status === "missed").length;
      const childPrn = childAdmins.filter((a) => prnMedIds.has(a.medication_id)).length;
      const adherence = pctOf(childGiven + childLate, childTotal);

      let compliance_status: "excellent" | "good" | "concerns" | "critical";
      if (adherence >= 95 && childRefused === 0 && childMissed === 0) compliance_status = "excellent";
      else if (adherence >= 85) compliance_status = "good";
      else if (adherence >= 70) compliance_status = "concerns";
      else compliance_status = "critical";

      return {
        child_id: child.id,
        child_name: child.name,
        active_medications: activeMeds.filter((m) => m.child_id === child.id).length,
        administrations_30d: childTotal,
        adherence_rate: adherence,
        refusal_count_30d: childRefused,
        late_count_30d: childLate,
        missed_count_30d: childMissed,
        prn_uses_30d: childPrn,
        compliance_status,
      };
    });

  // ── Medication Details ────────────────────────────────────────────────
  const medication_details: MedicationDetail[] = activeMeds.map((med) => {
    const medAdmins = admins30d.filter((a) => a.medication_id === med.id);
    const medTotal = medAdmins.length;
    const medGiven = medAdmins.filter((a) => a.status === "given" || a.status === "self_administered").length;
    const medLate = medAdmins.filter((a) => a.status === "late").length;
    const medRefused = medAdmins.filter((a) => a.status === "refused").length;
    const medMissed = medAdmins.filter((a) => a.status === "missed").length;

    const childName = children.find((c) => c.id === med.child_id)?.name ?? "Unknown";

    // Low stock: less than 7 units
    const stockLow = med.stock_count != null && med.stock_count < 7;

    return {
      medication_id: med.id,
      medication_name: med.name,
      child_name: childName,
      type: med.type,
      administrations_30d: medTotal,
      adherence_rate: pctOf(medGiven + medLate, medTotal),
      refusal_count: medRefused,
      late_count: medLate,
      missed_count: medMissed,
      stock_count: med.stock_count,
      stock_low: stockLow,
    };
  });

  // ── PRN Analysis ──────────────────────────────────────────────────────
  const prnByMed = new Map<string, number>();
  for (const a of prnAdmins30d) {
    const med = activeMeds.find((m) => m.id === a.medication_id);
    const name = med?.name ?? "Unknown";
    prnByMed.set(name, (prnByMed.get(name) ?? 0) + 1);
  }
  const withEffectiveness = prnAdmins30d.filter(
    (a) => a.prn_effectiveness != null && a.prn_effectiveness.trim().length > 0,
  ).length;

  const prn_analysis: PRNAnalysis = {
    total_prn_30d: prnAdmins30d.length,
    by_medication: [...prnByMed.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    effectiveness_rate: prnAdmins30d.length > 0 ? pctOf(withEffectiveness, prnAdmins30d.length) : 100,
  };

  // ── Alerts ─────────────────────────────────────────────────────────────
  const alerts: MedicationAlert[] = [];

  // Critical: missed medications
  if (missed > 0) {
    alerts.push({
      severity: "critical",
      message: `${missed} medication dose${missed > 1 ? "s" : ""} missed in 30 days — each missed dose must be reported and investigated`,
    });
  }

  // High: multiple refusals for one child
  for (const profile of child_profiles) {
    if (profile.refusal_count_30d >= 3) {
      alerts.push({
        severity: "high",
        message: `${profile.child_name} refused medication ${profile.refusal_count_30d} times in 30 days — review approach, consider child's voice, and discuss with prescriber`,
      });
    }
  }

  // High: low stock on active medication
  const lowStockMeds = medication_details.filter((m) => m.stock_low);
  if (lowStockMeds.length > 0) {
    alerts.push({
      severity: "high",
      message: `${lowStockMeds.length} medication${lowStockMeds.length > 1 ? "s" : ""} running low on stock — reorder from pharmacy immediately`,
    });
  }

  // Medium: witnessing below 100%
  if (total30d >= 3 && overview.witnessing_rate < 100) {
    alerts.push({
      severity: "medium",
      message: `Witnessing rate is ${overview.witnessing_rate}% — all medication administration must be witnessed by a second trained staff member`,
    });
  }

  // Medium: stock checks overdue
  const uncheckedMeds = activeMeds.filter(
    (m) => !m.stock_last_checked || daysBetween(m.stock_last_checked, today) > 7,
  );
  if (uncheckedMeds.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${uncheckedMeds.length} medication stock count${uncheckedMeds.length > 1 ? "s" : ""} overdue — weekly stock checks required`,
    });
  }

  // Low: high late rate
  if (total30d >= 5 && overview.late_rate > 20) {
    alerts.push({
      severity: "low",
      message: `${overview.late_rate}% of administrations were late — review scheduling and shift handover procedures`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraMedicationInsight[] = [];

  // Critical: missed doses
  if (missed > 0) {
    insights.push({
      severity: "critical",
      text: `${missed} missed dose${missed > 1 ? "s" : ""} in 30 days. Reg 23 requires the home to ensure all health needs are met. Each missed dose must be investigated, prescriber notified, and recorded on the Medication Administration Record.`,
    });
  }

  // Warning: refusals pattern
  const totalRefusals = child_profiles.reduce((sum, p) => sum + p.refusal_count_30d, 0);
  if (totalRefusals >= 2) {
    insights.push({
      severity: "warning",
      text: `${totalRefusals} medication refusal${totalRefusals > 1 ? "s" : ""} recorded. Explore reasons therapeutically — is this about control, side effects, or understanding? Document the child's voice and ensure prescriber reviews are booked.`,
    });
  }

  // Warning: PRN frequency high
  if (prnAdmins30d.length >= 5) {
    insights.push({
      severity: "warning",
      text: `${prnAdmins30d.length} PRN administrations in 30 days. High PRN use may indicate undertreated symptoms or emerging patterns. Review with prescriber whether regular medication adjustment is needed.`,
    });
  }

  // Positive: excellent adherence
  if (total30d >= 5 && overview.adherence_rate >= 95 && refused === 0 && missed === 0) {
    insights.push({
      severity: "positive",
      text: `${overview.adherence_rate}% medication adherence with zero refusals and zero missed doses. Excellent practice demonstrating robust medication management under Reg 23.`,
    });
  }

  // Positive: full witnessing
  if (total30d >= 5 && overview.witnessing_rate === 100) {
    insights.push({
      severity: "positive",
      text: `100% witnessing compliance across all ${total30d} administrations. Dual-staff witnessing provides safeguarding assurance and reduces medication error risk.`,
    });
  }

  // Positive: PRN effectiveness documented
  if (prnAdmins30d.length >= 2 && prn_analysis.effectiveness_rate === 100) {
    insights.push({
      severity: "positive",
      text: `PRN effectiveness documented for 100% of administrations. This supports evidence-based prescribing reviews and demonstrates thoughtful medication management.`,
    });
  }

  return {
    overview,
    child_profiles,
    medication_details,
    prn_analysis,
    alerts,
    insights,
  };
}
