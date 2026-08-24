// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME PREMISES SAFETY INTELLIGENCE ENGINE
// Home-level: analyses building certifications, premises checks, vehicle
// compliance, and maintenance responsiveness to assess premises safety.
// CHR 2015 Reg 25. SCCIF: "Safe."
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface BuildingInput {
  id: string;
  gas_cert_expiry: string;
  electrical_cert_expiry: string;
  fire_risk_assessment_date: string;
}

export interface BuildingCheckInput {
  status: string;              // due | completed | overdue
  result: string;              // pass | fail | ""
  has_action_required: boolean;
}

export interface VehicleInput {
  id: string;
  mot_expiry: string;
  insurance_expiry: string;
  tax_expiry: string;
  next_service_due: string;
}

export interface VehicleCheckInput {
  overall_result: string;      // pass | advisory | fail
  has_defects: boolean;
}

export interface MaintenanceInput {
  priority: string;            // urgent | high | medium | low
  status: string;              // open | completed | scheduled
  due_date: string;
}

export interface HomePremisesInput {
  today: string;
  buildings: BuildingInput[];
  building_checks: BuildingCheckInput[];
  vehicles: VehicleInput[];
  vehicle_checks: VehicleCheckInput[];
  maintenance: MaintenanceInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type PremisesRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CertificationProfile {
  buildings_count: number;
  gas_current: boolean;
  electrical_current: boolean;
  fire_risk_current: boolean;
  all_current: boolean;
  expired_count: number;
}

export interface CheckProfile {
  total_checks: number;
  completed_count: number;
  overdue_count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  pass_rate: number | null;
  fail_count: number;
}

export interface VehicleProfile {
  total_vehicles: number;
  all_compliant: boolean;
  expired_count: number;
  checks_pass_count: number;
  checks_advisory_count: number;
  checks_fail_count: number;
}

export interface MaintenanceProfile {
  total_items: number;
  open_count: number;
  overdue_count: number;
  urgent_open_count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  completion_rate: number | null;
}

export interface PremisesInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface PremisesRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomePremisesResult {
  premises_rating: PremisesRating;
  premises_score: number;
  headline: string;
  certification_profile: CertificationProfile;
  check_profile: CheckProfile;
  vehicle_profile: VehicleProfile;
  maintenance_profile: MaintenanceProfile;
  strengths: string[];
  concerns: string[];
  recommendations: PremisesRecommendation[];
  insights: PremisesInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): PremisesRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomePremisesSafety(
  input: HomePremisesInput,
): HomePremisesResult {
  const { today, buildings, building_checks, vehicles, vehicle_checks, maintenance } = input;

  // Insufficient data
  if (buildings.length === 0 && building_checks.length === 0 &&
      vehicles.length === 0 && vehicle_checks.length === 0 &&
      maintenance.length === 0) {
    return {
      premises_rating: "insufficient_data",
      premises_score: 0,
      headline: "No premises data found — building, vehicle, and maintenance records not available.",
      certification_profile: emptyCertProfile(),
      check_profile: emptyCheckProfile(),
      vehicle_profile: emptyVehicleProfile(),
      maintenance_profile: emptyMaintenanceProfile(),
      strengths: [],
      concerns: ["No premises data — Ofsted expects the home to evidence safe, well-maintained premises."],
      recommendations: [{ rank: 1, recommendation: "Establish premises records including building certifications, daily checks, vehicle compliance, and maintenance tracking.", urgency: "immediate", regulatory_ref: "Reg 25" }],
      insights: [{ text: "No premises safety data found. Ofsted will assess the physical environment, fire safety, vehicle compliance, and maintenance. Without records, the home cannot evidence that premises meet the required standard.", severity: "critical" }],
    };
  }

  // ── Certification Profile ─────────────────────────────────────────
  const fireRiskCutoff = new Date(today);
  fireRiskCutoff.setDate(fireRiskCutoff.getDate() - 365);
  const fireRiskCutoffStr = fireRiskCutoff.toISOString().slice(0, 10);

  let gasCurrent = true;
  let electricalCurrent = true;
  let fireRiskCurrent = true;
  let expiredCertCount = 0;

  for (const b of buildings) {
    if (b.gas_cert_expiry < today) { gasCurrent = false; expiredCertCount++; }
    if (b.electrical_cert_expiry < today) { electricalCurrent = false; expiredCertCount++; }
    if (b.fire_risk_assessment_date < fireRiskCutoffStr) { fireRiskCurrent = false; expiredCertCount++; }
  }

  const allCertsCurrent = gasCurrent && electricalCurrent && fireRiskCurrent;

  const certProfile: CertificationProfile = {
    buildings_count: buildings.length,
    gas_current: gasCurrent,
    electrical_current: electricalCurrent,
    fire_risk_current: fireRiskCurrent,
    all_current: allCertsCurrent,
    expired_count: expiredCertCount,
  };

  // ── Check Profile ─────────────────────────────────────────────────
  const completedChecks = building_checks.filter(c => c.status === "completed");
  const overdueChecks = building_checks.filter(c => c.status === "overdue");
  const passChecks = completedChecks.filter(c => c.result === "pass");
  const failChecks = completedChecks.filter(c => c.result === "fail");
  const passRate = rate(passChecks.length, completedChecks.length);

  const checkProfile: CheckProfile = {
    total_checks: building_checks.length,
    completed_count: completedChecks.length,
    overdue_count: overdueChecks.length,
    pass_rate: passRate,
    fail_count: failChecks.length,
  };

  // ── Vehicle Profile ───────────────────────────────────────────────
  let vehicleExpiredCount = 0;
  for (const v of vehicles) {
    if (v.mot_expiry < today) vehicleExpiredCount++;
    if (v.insurance_expiry < today) vehicleExpiredCount++;
    if (v.tax_expiry < today) vehicleExpiredCount++;
  }
  const allVehiclesCompliant = vehicleExpiredCount === 0;

  const vPassCount = vehicle_checks.filter(c => c.overall_result === "pass").length;
  const vAdvisoryCount = vehicle_checks.filter(c => c.overall_result === "advisory").length;
  const vFailCount = vehicle_checks.filter(c => c.overall_result === "fail").length;

  const vehicleProfile: VehicleProfile = {
    total_vehicles: vehicles.length,
    all_compliant: allVehiclesCompliant,
    expired_count: vehicleExpiredCount,
    checks_pass_count: vPassCount,
    checks_advisory_count: vAdvisoryCount,
    checks_fail_count: vFailCount,
  };

  // ── Maintenance Profile ───────────────────────────────────────────
  const overdueMaintenanceItems = maintenance.filter(m =>
    m.status !== "completed" && m.due_date < today,
  );
  const openItems = maintenance.filter(m => m.status === "open");
  const urgentOpen = openItems.filter(m => m.priority === "urgent");
  const dueItems = maintenance.filter(m => m.due_date <= today);
  const completedDue = dueItems.filter(m => m.status === "completed").length;
  const completionRate = rate(completedDue, dueItems.length);

  const maintenanceProfile: MaintenanceProfile = {
    total_items: maintenance.length,
    open_count: openItems.length,
    overdue_count: overdueMaintenanceItems.length,
    urgent_open_count: urgentOpen.length,
    completion_rate: completionRate,
  };

  // ── Scoring ───────────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52+28 = 80
  let score = 52;

  // 1. Building certifications (±5)
  if (buildings.length > 0) {
    if (allCertsCurrent) score += 5;
    else if (expiredCertCount <= 1) score += 1;
    else score -= 4;
  }

  // 2. Building check completion (±4)
  if (building_checks.length > 0) {
    if (overdueChecks.length === 0) score += 4;
    else if (overdueChecks.length === 1) score += 1;
    else score -= 3;
  }

  // 3. Building check pass rate (±3)
  if (completedChecks.length > 0) {
    if (meets(passRate, 80)) score += 3;
    else if (meets(passRate, 60)) score += 1;
    else score -= 2;
  }

  // 4. Vehicle compliance (±4)
  if (vehicles.length > 0) {
    if (allVehiclesCompliant) score += 4;
    else if (vehicleExpiredCount <= 1) score += 1;
    else score -= 3;
  }

  // 5. Vehicle check results (±3)
  if (vehicle_checks.length > 0) {
    if (vFailCount === 0 && vAdvisoryCount === 0) score += 3;
    else if (vFailCount === 0) score += 1;
    else score -= 2;
  }

  // 6. Maintenance overdue (±3)
  if (maintenance.length > 0) {
    if (overdueMaintenanceItems.length === 0) score += 3;
    else if (overdueMaintenanceItems.length === 1) score += 1;
    else score -= 2;
  }

  // 7. Urgent maintenance (±3)
  if (maintenance.length > 0) {
    if (urgentOpen.length === 0) score += 3;
    else if (urgentOpen.length === 1) score += 1;
    else score -= 2;
  }

  // 8. Maintenance completion (±3)
  if (dueItems.length > 0) {
    if (meets(completionRate, 80)) score += 3;
    else if (meets(completionRate, 50)) score += 1;
    else score -= 1;
  } else if (maintenance.length > 0) {
    score += 1; // all future items, none overdue
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (allCertsCurrent && buildings.length > 0) strengths.push("All building certifications current — gas, electrical, and fire risk assessment up to date.");
  if (overdueChecks.length === 0 && building_checks.length > 0) strengths.push("No overdue premises checks — systematic monitoring programme in place.");
  if (meets(passRate, 80) && completedChecks.length > 0) strengths.push(`${formatRate(passRate)} premises check pass rate — building is well-maintained.`);
  if (allVehiclesCompliant && vehicles.length > 0) strengths.push("All vehicles fully compliant — MOT, insurance, and tax current.");
  if (vFailCount === 0 && vAdvisoryCount === 0 && vehicle_checks.length > 0) strengths.push("All vehicle checks passed — fleet in good condition.");
  if (overdueMaintenanceItems.length === 0 && maintenance.length > 0) strengths.push("No overdue maintenance items — responsive maintenance programme.");
  if (urgentOpen.length === 0 && maintenance.length > 0) strengths.push("No outstanding urgent maintenance — safety issues addressed promptly.");

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (!gasCurrent && buildings.length > 0) concerns.push("Gas safety certificate expired — this is a legal requirement and immediate safety risk.");
  if (!electricalCurrent && buildings.length > 0) concerns.push("Electrical installation certificate expired — rewiring inspection overdue.");
  if (!fireRiskCurrent && buildings.length > 0) concerns.push("Fire risk assessment is over 12 months old — must be reviewed annually.");
  if (overdueChecks.length > 0) concerns.push(`${overdueChecks.length} premises check${overdueChecks.length > 1 ? "s" : ""} overdue — safety monitoring gaps.`);
  if (failChecks.length > 0) concerns.push(`${failChecks.length} premises check${failChecks.length > 1 ? "s" : ""} failed — action required.`);
  if (vehicleExpiredCount > 0) concerns.push(`${vehicleExpiredCount} vehicle document${vehicleExpiredCount > 1 ? "s" : ""} expired — vehicles may not be roadworthy or legal.`);
  if (vFailCount > 0) concerns.push(`${vFailCount} vehicle check${vFailCount > 1 ? "s" : ""} failed — safety defects identified.`);
  if (overdueMaintenanceItems.length > 0) concerns.push(`${overdueMaintenanceItems.length} maintenance item${overdueMaintenanceItems.length > 1 ? "s" : ""} overdue — repairs not completed on time.`);
  if (urgentOpen.length > 0) concerns.push(`${urgentOpen.length} urgent maintenance item${urgentOpen.length > 1 ? "s" : ""} outstanding — safety risk.`);

  // ── Recommendations ───────────────────────────────────────────────
  const recs: PremisesRecommendation[] = [];
  let rank = 1;

  if (!gasCurrent && buildings.length > 0) {
    recs.push({ rank: rank++, recommendation: "Arrange gas safety inspection immediately — expired certificate is a legal offence.", urgency: "immediate", regulatory_ref: "Reg 25" });
  }
  if (!fireRiskCurrent && buildings.length > 0) {
    recs.push({ rank: rank++, recommendation: "Commission a fire risk assessment — annual review is required.", urgency: "immediate", regulatory_ref: "Reg 25" });
  }
  if (vehicleExpiredCount > 0) {
    recs.push({ rank: rank++, recommendation: "Renew expired vehicle documents — vehicles must not be used until compliant.", urgency: "immediate", regulatory_ref: "Reg 25" });
  }
  if (overdueChecks.length > 1) {
    recs.push({ rank: rank++, recommendation: `Complete ${overdueChecks.length} overdue premises checks — assign responsible staff and set deadlines.`, urgency: "soon", regulatory_ref: "Reg 25" });
  }
  if (urgentOpen.length > 0) {
    recs.push({ rank: rank++, recommendation: `Resolve ${urgentOpen.length} urgent maintenance item${urgentOpen.length > 1 ? "s" : ""} — these represent active safety risks.`, urgency: "immediate", regulatory_ref: "Reg 25" });
  }

  // ── Insights ──────────────────────────────────────────────────────
  const insights: PremisesInsight[] = [];

  if (allCertsCurrent && overdueChecks.length === 0 && allVehiclesCompliant && overdueMaintenanceItems.length === 0) {
    insights.push({ text: `All certifications current, no overdue checks, vehicles compliant, and maintenance on schedule. This evidences outstanding premises management — Ofsted will see a home that takes the physical environment seriously and keeps children safe.`, severity: "positive" });
  }
  if (!gasCurrent || !electricalCurrent) {
    insights.push({ text: `Expired building certification${(!gasCurrent && !electricalCurrent) ? "s" : ""}. This is not just a regulatory concern — it is a potential safety hazard. Ofsted will treat expired gas or electrical certificates as a serious leadership failure.`, severity: "critical" });
  }
  if (vehicleExpiredCount > 0) {
    insights.push({ text: `${vehicleExpiredCount} vehicle document${vehicleExpiredCount > 1 ? "s" : ""} expired. Vehicles with expired MOT or insurance must not be used to transport children. Ofsted will check vehicle compliance during inspection.`, severity: "critical" });
  }
  if (overdueChecks.length > 0 && failChecks.length > 0) {
    insights.push({ text: `${overdueChecks.length} overdue checks and ${failChecks.length} failed checks. The combination of missed checks and known failures suggests premises monitoring is not being prioritised. Ofsted expects a systematic approach to environmental safety.`, severity: "warning" });
  }
  if (urgentOpen.length >= 2) {
    insights.push({ text: `${urgentOpen.length} urgent maintenance items unresolved. Multiple urgent safety issues suggest the home is not responding quickly enough to identified hazards. Children's safety may be compromised.`, severity: "critical" });
  }

  // ── Headline ──────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding premises safety — all certifications current, ${formatRate(passRate)} check pass rate, and no overdue maintenance.`;
  } else if (rating === "good") {
    headline = `Good premises management — certifications maintained with minor areas for improvement.`;
  } else if (rating === "adequate") {
    headline = "Adequate premises safety — gaps in certifications, checks, or maintenance need addressing.";
  } else {
    headline = "Premises safety is inadequate — expired certifications, overdue checks, or unresolved maintenance represent safety risks.";
  }

  return {
    premises_rating: rating,
    premises_score: score,
    headline,
    certification_profile: certProfile,
    check_profile: checkProfile,
    vehicle_profile: vehicleProfile,
    maintenance_profile: maintenanceProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ──────────────────────────────────────────────────────────

function emptyCertProfile(): CertificationProfile {
  return {
    buildings_count: 0, gas_current: false, electrical_current: false,
    fire_risk_current: false, all_current: false, expired_count: 0,
  };
}

function emptyCheckProfile(): CheckProfile {
  return { total_checks: 0, completed_count: 0, overdue_count: 0, pass_rate: 0, fail_count: 0 };
}

function emptyVehicleProfile(): VehicleProfile {
  return {
    total_vehicles: 0, all_compliant: false, expired_count: 0,
    checks_pass_count: 0, checks_advisory_count: 0, checks_fail_count: 0,
  };
}

function emptyMaintenanceProfile(): MaintenanceProfile {
  return { total_items: 0, open_count: 0, overdue_count: 0, urgent_open_count: 0, completion_rate: 0 };
}
