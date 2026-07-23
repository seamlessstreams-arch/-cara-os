// ══════════════════════════════════════════════════════════════════════════════
// CARA — PREMISES & SAFETY INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses buildings, building checks, maintenance items, vehicles and vehicle
// checks to surface premises safety compliance, overdue checks, certification
// expiry, and fleet readiness patterns.
//
// Regulatory: Reg 25 (premises and safety), Reg 24 (accommodation standards),
// Schedule 5 (environmental fitness), SCCIF: "Is the home safe?" and
// "Does the environment meet children's needs?"
// Fire safety compliance: Regulatory Reform (Fire Safety) Order 2005.
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate, rateOf } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export type BuildingStatus = "operational" | "restricted" | "closed";

export type CheckStatus = "due" | "completed" | "overdue" | "failed" | "waived";
export type CheckResult = "pass" | "fail" | "advisory" | null;
export type RiskLevel = "low" | "medium" | "high" | "critical" | null;

export type MaintenancePriority = "urgent" | "high" | "medium" | "low";
export type MaintenanceStatus = "open" | "scheduled" | "completed";

export type VehicleStatus = "available" | "in_use" | "restricted" | "off_road" | "disposed";
export type VehicleCheckResult = "pass" | "fail" | "advisory";

export interface BuildingInput {
  id: string;
  name: string;
  type: "residential" | "office" | "outbuilding";
  status: BuildingStatus;
  gas_cert_expiry: string | null;
  electrical_cert_expiry: string | null;
  fire_risk_assessment_date: string | null;
  epc_rating: string | null;
  last_full_inspection: string | null;
  next_inspection_due: string | null;
}

export interface BuildingCheckInput {
  id: string;
  building_id: string;
  area: string;
  check_type: string;
  check_date: string;
  due_date: string;
  responsible_person: string;
  status: CheckStatus;
  result: CheckResult;
  risk_level: RiskLevel;
  notes: string | null;
  action_required: string | null;
  action_due: string | null;
  manager_oversight: boolean;
}

export interface MaintenanceInput {
  id: string;
  title: string;
  category: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  due_date: string;
  assigned_to: string | null;
  recurring: boolean;
}

export interface VehicleInput {
  id: string;
  registration: string;
  make: string;
  model: string;
  status: VehicleStatus;
  mot_expiry: string | null;
  insurance_expiry: string | null;
  tax_expiry: string | null;
  next_service_due: string | null;
  mileage: number;
}

export interface VehicleCheckInput {
  id: string;
  vehicle_id: string;
  check_type: string;
  check_date: string;
  driver: string;
  overall_result: VehicleCheckResult;
  defects: string | null;
}

export interface PremisesSafetyIntelligenceInput {
  buildings: BuildingInput[];
  building_checks: BuildingCheckInput[];
  maintenance: MaintenanceInput[];
  vehicles: VehicleInput[];
  vehicle_checks: VehicleCheckInput[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface PremisesOverview {
  total_buildings: number;
  operational_buildings: number;
  total_checks: number;
  checks_completed: number;
  checks_overdue: number;
  checks_failed: number;
  check_completion_rate: number | null; // pct of non-waived checks completed; null when none apply
  fire_safety_compliant: boolean;      // fire risk assessment + gas cert valid
  certifications_expiring_soon: number; // within 90 days
  certifications_expired: number;
  maintenance_open: number;
  maintenance_urgent: number;
  maintenance_overdue: number;         // open items past due_date
  total_vehicles: number;
  vehicles_roadworthy: number;         // all docs valid + latest check pass
  vehicle_checks_today: number;
  vehicle_issues: number;              // advisory or fail on latest check
}

export interface BuildingProfile {
  building_id: string;
  building_name: string;
  building_type: string;
  status: BuildingStatus;
  checks_total: number;
  checks_completed: number;
  checks_overdue: number;
  checks_failed: number;
  gas_cert_days_until_expiry: number | null;
  electrical_cert_days_until_expiry: number | null;
  fire_risk_assessment_age_days: number | null;
  next_inspection_days: number | null;
  risk_flags: string[];
}

export interface CheckTypeAnalysis {
  check_type: string;
  total: number;
  completed: number;
  overdue: number;
  failed: number;
  pass_rate: number | null; // pct of completed that passed; null when none completed
}

export interface MaintenanceAnalysis {
  category: string;
  total: number;
  open: number;
  completed: number;
  urgent_count: number;
  overdue_count: number;
}

export interface VehicleProfile {
  vehicle_id: string;
  registration: string;
  label: string; // make + model
  status: VehicleStatus;
  mot_days_until_expiry: number | null;
  insurance_days_until_expiry: number | null;
  tax_days_until_expiry: number | null;
  service_days_until_due: number | null;
  latest_check_result: VehicleCheckResult | null;
  latest_check_date: string | null;
  mileage: number;
  risk_flags: string[];
}

export interface PremisesAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraPremisesInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface PremisesSafetyIntelligenceResult {
  overview: PremisesOverview;
  building_profiles: BuildingProfile[];
  check_analysis: CheckTypeAnalysis[];
  maintenance_analysis: MaintenanceAnalysis[];
  vehicle_profiles: VehicleProfile[];
  alerts: PremisesAlert[];
  insights: CaraPremisesInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysUntil(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
  );
}

export function daysSince(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
  );
}

// Fire-safety check types — these are the ones critical under fire safety law
const FIRE_SAFETY_CHECK_TYPES = new Set([
  "fire_alarm_test",
  "emergency_lighting",
  "fire_extinguisher",
  "fire_drill",
  "smoke_detector",
  "carbon_monoxide_detector",
]);

// ── Main Computation ────────────────────────────────────────────────────────

export function computePremisesSafetyIntelligence(
  input: PremisesSafetyIntelligenceInput,
): PremisesSafetyIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { buildings, building_checks, maintenance, vehicles, vehicle_checks } = input;

  // ── Index maps ─────────────────────────────────────────────────────────
  const checksByBuilding = new Map<string, BuildingCheckInput[]>();
  for (const c of building_checks) {
    const arr = checksByBuilding.get(c.building_id) ?? [];
    arr.push(c);
    checksByBuilding.set(c.building_id, arr);
  }

  const checksByVehicle = new Map<string, VehicleCheckInput[]>();
  for (const vc of vehicle_checks) {
    const arr = checksByVehicle.get(vc.vehicle_id) ?? [];
    arr.push(vc);
    checksByVehicle.set(vc.vehicle_id, arr);
  }

  // ── Building check overview ────────────────────────────────────────────
  const nonWaivedChecks = building_checks.filter((c) => c.status !== "waived");
  const completedChecks = building_checks.filter((c) => c.status === "completed");
  const overdueChecks = building_checks.filter((c) => c.status === "overdue");
  const failedChecks = building_checks.filter((c) => c.status === "completed" && c.result === "fail");
  // Null covers both "no checks recorded" and "every check waived" — neither is a pass.
  const checkCompletionRate = rateOf(completedChecks, nonWaivedChecks);

  // ── Certification expiry ───────────────────────────────────────────────
  let certificationsExpiringSoon = 0;
  let certificationsExpired = 0;
  let fireSafetyCompliant = true;

  for (const b of buildings) {
    if (b.status !== "operational") continue;

    const certDates = [
      { name: "gas_cert", date: b.gas_cert_expiry },
      { name: "electrical_cert", date: b.electrical_cert_expiry },
    ];

    for (const cert of certDates) {
      if (!cert.date) {
        // Missing cert on operational building = expired
        certificationsExpired++;
        if (cert.name === "gas_cert") fireSafetyCompliant = false;
        continue;
      }
      const daysLeft = daysUntil(today, cert.date);
      if (daysLeft < 0) {
        certificationsExpired++;
        if (cert.name === "gas_cert") fireSafetyCompliant = false;
      } else if (daysLeft <= 90) {
        certificationsExpiringSoon++;
      }
    }

    // Fire risk assessment must exist and be within 12 months
    if (!b.fire_risk_assessment_date) {
      fireSafetyCompliant = false;
    } else {
      const ageDays = daysSince(b.fire_risk_assessment_date, today);
      if (ageDays > 365) fireSafetyCompliant = false;
    }
  }

  // ── Maintenance ────────────────────────────────────────────────────────
  const openMaintenance = maintenance.filter((m) => m.status === "open");
  const urgentMaintenance = maintenance.filter(
    (m) => m.priority === "urgent" && m.status !== "completed",
  );
  const overdueMaintenance = maintenance.filter(
    (m) => m.status === "open" && daysUntil(today, m.due_date) < 0,
  );

  // ── Vehicles ───────────────────────────────────────────────────────────
  const activeVehicles = vehicles.filter(
    (v) => v.status !== "disposed" && v.status !== "off_road",
  );

  const vehicle_profiles: VehicleProfile[] = vehicles.map((v) => {
    const vChecks = (checksByVehicle.get(v.id) ?? [])
      .sort((a, b) => b.check_date.localeCompare(a.check_date));
    const latestCheck = vChecks[0] ?? null;

    const motDays = v.mot_expiry ? daysUntil(today, v.mot_expiry) : null;
    const insuranceDays = v.insurance_expiry ? daysUntil(today, v.insurance_expiry) : null;
    const taxDays = v.tax_expiry ? daysUntil(today, v.tax_expiry) : null;
    const serviceDays = v.next_service_due ? daysUntil(today, v.next_service_due) : null;

    const riskFlags: string[] = [];
    if (motDays !== null && motDays < 0) riskFlags.push("MOT expired");
    else if (motDays !== null && motDays <= 30) riskFlags.push("MOT expiring soon");
    if (insuranceDays !== null && insuranceDays < 0) riskFlags.push("Insurance expired");
    else if (insuranceDays !== null && insuranceDays <= 30) riskFlags.push("Insurance expiring soon");
    if (taxDays !== null && taxDays < 0) riskFlags.push("Tax expired");
    else if (taxDays !== null && taxDays <= 30) riskFlags.push("Tax expiring soon");
    if (serviceDays !== null && serviceDays < 0) riskFlags.push("Service overdue");
    if (latestCheck?.overall_result === "fail") riskFlags.push("Last check failed");
    if (latestCheck?.overall_result === "advisory") riskFlags.push("Advisory on last check");

    return {
      vehicle_id: v.id,
      registration: v.registration,
      label: `${v.make} ${v.model}`,
      status: v.status,
      mot_days_until_expiry: motDays,
      insurance_days_until_expiry: insuranceDays,
      tax_days_until_expiry: taxDays,
      service_days_until_due: serviceDays,
      latest_check_result: latestCheck?.overall_result ?? null,
      latest_check_date: latestCheck?.check_date ?? null,
      mileage: v.mileage,
      risk_flags: riskFlags,
    };
  });

  // Roadworthy: active vehicle with MOT/insurance/tax all valid AND latest check is pass
  const vehiclesRoadworthy = vehicle_profiles.filter((vp) => {
    const v = vehicles.find((vv) => vv.id === vp.vehicle_id)!;
    if (v.status === "disposed" || v.status === "off_road" || v.status === "restricted") return false;
    if (vp.mot_days_until_expiry !== null && vp.mot_days_until_expiry < 0) return false;
    if (vp.insurance_days_until_expiry !== null && vp.insurance_days_until_expiry < 0) return false;
    if (vp.tax_days_until_expiry !== null && vp.tax_days_until_expiry < 0) return false;
    if (vp.latest_check_result === "fail") return false;
    return true;
  }).length;

  const vehicleChecksToday = vehicle_checks.filter((vc) => vc.check_date === today).length;
  const vehicleIssues = vehicle_profiles.filter(
    (vp) => vp.latest_check_result === "fail" || vp.latest_check_result === "advisory",
  ).length;

  // ── Building profiles ──────────────────────────────────────────────────
  const building_profiles: BuildingProfile[] = buildings.map((b) => {
    const checks = checksByBuilding.get(b.id) ?? [];
    const completed = checks.filter((c) => c.status === "completed").length;
    const overdue = checks.filter((c) => c.status === "overdue").length;
    const failed = checks.filter((c) => c.status === "completed" && c.result === "fail").length;

    const gasDays = b.gas_cert_expiry ? daysUntil(today, b.gas_cert_expiry) : null;
    const elecDays = b.electrical_cert_expiry ? daysUntil(today, b.electrical_cert_expiry) : null;
    const fraAgeDays = b.fire_risk_assessment_date ? daysSince(b.fire_risk_assessment_date, today) : null;
    const inspDays = b.next_inspection_due ? daysUntil(today, b.next_inspection_due) : null;

    const riskFlags: string[] = [];
    if (gasDays !== null && gasDays < 0) riskFlags.push("Gas certificate expired");
    else if (gasDays !== null && gasDays <= 90) riskFlags.push("Gas certificate expiring soon");
    else if (gasDays === null && b.status === "operational") riskFlags.push("No gas certificate");

    if (elecDays !== null && elecDays < 0) riskFlags.push("Electrical certificate expired");
    else if (elecDays !== null && elecDays <= 90) riskFlags.push("Electrical certificate expiring soon");
    else if (elecDays === null && b.status === "operational") riskFlags.push("No electrical certificate");

    if (fraAgeDays !== null && fraAgeDays > 365) riskFlags.push("Fire risk assessment overdue (>12 months)");
    else if (fraAgeDays === null && b.status === "operational") riskFlags.push("No fire risk assessment");

    if (inspDays !== null && inspDays < 0) riskFlags.push("Full inspection overdue");

    if (overdue > 0) riskFlags.push(`${overdue} overdue check(s)`);
    if (failed > 0) riskFlags.push(`${failed} failed check(s)`);

    return {
      building_id: b.id,
      building_name: b.name,
      building_type: b.type,
      status: b.status,
      checks_total: checks.length,
      checks_completed: completed,
      checks_overdue: overdue,
      checks_failed: failed,
      gas_cert_days_until_expiry: gasDays,
      electrical_cert_days_until_expiry: elecDays,
      fire_risk_assessment_age_days: fraAgeDays,
      next_inspection_days: inspDays,
      risk_flags: riskFlags,
    };
  });

  // ── Check type analysis ────────────────────────────────────────────────
  const checkTypeMap = new Map<string, BuildingCheckInput[]>();
  for (const c of building_checks) {
    const arr = checkTypeMap.get(c.check_type) ?? [];
    arr.push(c);
    checkTypeMap.set(c.check_type, arr);
  }

  const check_analysis: CheckTypeAnalysis[] = [...checkTypeMap.entries()]
    .map(([check_type, checks]) => {
      const completed = checks.filter((c) => c.status === "completed").length;
      const overdue = checks.filter((c) => c.status === "overdue").length;
      const failed = checks.filter((c) => c.status === "completed" && c.result === "fail").length;
      const passed = checks.filter((c) => c.status === "completed" && c.result === "pass").length;
      return {
        check_type,
        total: checks.length,
        completed,
        overdue,
        failed,
        pass_rate: rate(passed, completed),
      };
    })
    // Worst pass rate first; types with nothing completed yet sort last.
    .sort((a, b) => {
      if (a.pass_rate === null || b.pass_rate === null) {
        return (a.pass_rate === null ? 1 : 0) - (b.pass_rate === null ? 1 : 0);
      }
      return a.pass_rate - b.pass_rate;
    });

  // ── Maintenance analysis ───────────────────────────────────────────────
  const maintCatMap = new Map<string, MaintenanceInput[]>();
  for (const m of maintenance) {
    const arr = maintCatMap.get(m.category) ?? [];
    arr.push(m);
    maintCatMap.set(m.category, arr);
  }

  const maintenance_analysis: MaintenanceAnalysis[] = [...maintCatMap.entries()]
    .map(([category, items]) => ({
      category,
      total: items.length,
      open: items.filter((i) => i.status === "open").length,
      completed: items.filter((i) => i.status === "completed").length,
      urgent_count: items.filter((i) => i.priority === "urgent" && i.status !== "completed").length,
      overdue_count: items.filter(
        (i) => i.status === "open" && daysUntil(today, i.due_date) < 0,
      ).length,
    }))
    .sort((a, b) => b.urgent_count - a.urgent_count || b.overdue_count - a.overdue_count);

  // ── Overview ───────────────────────────────────────────────────────────
  const overview: PremisesOverview = {
    total_buildings: buildings.length,
    operational_buildings: buildings.filter((b) => b.status === "operational").length,
    total_checks: building_checks.length,
    checks_completed: completedChecks.length,
    checks_overdue: overdueChecks.length,
    checks_failed: failedChecks.length,
    check_completion_rate: checkCompletionRate,
    fire_safety_compliant: fireSafetyCompliant,
    certifications_expiring_soon: certificationsExpiringSoon,
    certifications_expired: certificationsExpired,
    maintenance_open: openMaintenance.length,
    maintenance_urgent: urgentMaintenance.length,
    maintenance_overdue: overdueMaintenance.length,
    total_vehicles: vehicles.length,
    vehicles_roadworthy: vehiclesRoadworthy,
    vehicle_checks_today: vehicleChecksToday,
    vehicle_issues: vehicleIssues,
  };

  // ── Alerts ────────────────────────────────────────────────────────────
  const alerts: PremisesAlert[] = [];

  // Critical: expired certifications on operational buildings
  if (certificationsExpired > 0) {
    alerts.push({
      severity: "critical",
      message: `${certificationsExpired} certification(s) expired on operational building(s). Expired gas or electrical certificates are a serious regulatory breach under Reg 25 and may constitute an immediate safeguarding risk.`,
    });
  }

  // Critical: fire safety non-compliance
  if (!fireSafetyCompliant && buildings.some((b) => b.status === "operational")) {
    alerts.push({
      severity: "critical",
      message: `Fire safety compliance gap identified. Either the fire risk assessment is missing/overdue or the gas safety certificate has expired. This is a critical finding under the Regulatory Reform (Fire Safety) Order 2005.`,
    });
  }

  // Critical: failed building checks with high/critical risk
  const criticalFailures = building_checks.filter(
    (c) => c.result === "fail" && (c.risk_level === "high" || c.risk_level === "critical"),
  );
  if (criticalFailures.length > 0) {
    alerts.push({
      severity: "critical",
      message: `${criticalFailures.length} building check(s) failed with high/critical risk level. Failed safety checks require immediate remedial action and manager oversight.`,
    });
  }

  // High: overdue building checks
  if (overdueChecks.length > 0) {
    const types = [...new Set(overdueChecks.map((c) => c.check_type.replace(/_/g, " ")))].join(", ");
    alerts.push({
      severity: "high",
      message: `${overdueChecks.length} building check(s) overdue: ${types}. Overdue premises checks create gaps in safety evidence and will be noted by Reg 44 visitors and Ofsted inspectors.`,
    });
  }

  // High: expired vehicle documents
  const expiredVehicleDocs = vehicle_profiles.filter(
    (vp) =>
      (vp.mot_days_until_expiry !== null && vp.mot_days_until_expiry < 0) ||
      (vp.insurance_days_until_expiry !== null && vp.insurance_days_until_expiry < 0) ||
      (vp.tax_days_until_expiry !== null && vp.tax_days_until_expiry < 0),
  );
  if (expiredVehicleDocs.length > 0) {
    const regs = expiredVehicleDocs.map((vp) => vp.registration).join(", ");
    alerts.push({
      severity: "high",
      message: `${expiredVehicleDocs.length} vehicle(s) with expired documentation (${regs}). Vehicles with expired MOT, insurance or tax must not be used to transport young people.`,
    });
  }

  // Medium: urgent open maintenance
  if (urgentMaintenance.length > 0) {
    const titles = urgentMaintenance.map((m) => m.title).join(", ");
    alerts.push({
      severity: "medium",
      message: `${urgentMaintenance.length} urgent maintenance item(s) outstanding: ${titles}. Urgent maintenance should be actioned within 24 hours to maintain premises safety.`,
    });
  }

  // Medium: certifications expiring soon
  if (certificationsExpiringSoon > 0) {
    alerts.push({
      severity: "medium",
      message: `${certificationsExpiringSoon} building certification(s) expiring within 90 days. Schedule renewals now to avoid compliance gaps.`,
    });
  }

  // Medium: vehicle advisories
  const vehicleAdvisories = vehicle_profiles.filter(
    (vp) => vp.latest_check_result === "advisory",
  );
  if (vehicleAdvisories.length > 0) {
    alerts.push({
      severity: "medium",
      message: `${vehicleAdvisories.length} vehicle(s) with advisory notices. Review and address advisory items before they become failures.`,
    });
  }

  // Low: overdue maintenance
  if (overdueMaintenance.length > 0 && urgentMaintenance.length === 0) {
    alerts.push({
      severity: "low",
      message: `${overdueMaintenance.length} non-urgent maintenance item(s) overdue. Review the maintenance schedule and allocate resources to clear the backlog.`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraPremisesInsight[] = [];

  // Critical: any critical alert triggers Cara critical
  if (certificationsExpired > 0) {
    insights.push({
      severity: "critical",
      text: `${certificationsExpired} expired certification(s) on operational buildings. Ofsted inspectors and Reg 44 visitors will immediately flag expired safety certificates. This must be resolved before any inspection.`,
    });
  }

  // Critical: fire safety
  if (!fireSafetyCompliant && buildings.some((b) => b.status === "operational")) {
    insights.push({
      severity: "critical",
      text: `The home does not currently meet fire safety compliance. Under SCCIF, inspectors assess "Is the home safe?" — an outdated or missing fire risk assessment is a common reason for inadequate judgements in Leadership & Management.`,
    });
  }

  // Warning: low check completion
  if (below(checkCompletionRate, 80)) {
    insights.push({
      severity: "warning",
      text: `Building check completion rate is ${formatRate(checkCompletionRate)}. A strong home maintains a comprehensive evidence trail of premises checks. Aim for 100% completion to demonstrate proactive safety management.`,
    });
  }

  // Warning: failed checks
  if (failedChecks.length > 0) {
    insights.push({
      severity: "warning",
      text: `${failedChecks.length} building check(s) resulted in a "fail" outcome. Failed checks require documented follow-up, remedial action, and sign-off before the area can be considered safe.`,
    });
  }

  // Warning: fleet issues
  if (vehicleIssues > 0 && activeVehicles.length > 0) {
    const pct = Math.round((vehicleIssues / activeVehicles.length) * 100);
    insights.push({
      severity: "warning",
      text: `${pct}% of active vehicles have issues on their latest check. Vehicle safety is part of the home's duty of care — ensure all advisory and fail items are resolved promptly.`,
    });
  }

  // Positive: 100% check completion
  if (meets(checkCompletionRate, 100) && nonWaivedChecks.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${nonWaivedChecks.length} building checks completed. This demonstrates excellent premises safety oversight — a key indicator of strong management under SCCIF.`,
    });
  }

  // Positive: fire safety compliant
  if (fireSafetyCompliant && buildings.some((b) => b.status === "operational")) {
    insights.push({
      severity: "positive",
      text: `Fire safety compliance confirmed — fire risk assessment is current, gas certificate is valid. The home meets the Regulatory Reform (Fire Safety) Order 2005 requirements.`,
    });
  }

  // Positive: all vehicles roadworthy
  if (vehiclesRoadworthy === activeVehicles.length && activeVehicles.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${activeVehicles.length} active vehicle(s) are roadworthy with valid documentation and passing checks. Safe transport is maintained for young people.`,
    });
  }

  // Positive: no overdue maintenance
  if (overdueMaintenance.length === 0 && maintenance.length > 0) {
    insights.push({
      severity: "positive",
      text: `No overdue maintenance items. The premises maintenance programme is on track — this demonstrates proactive environmental management under Reg 25.`,
    });
  }

  // Positive: no certifications expiring
  if (certificationsExpiringSoon === 0 && certificationsExpired === 0 && buildings.length > 0) {
    insights.push({
      severity: "positive",
      text: `All building certifications are current with no upcoming expiries in the next 90 days. Certification compliance is fully maintained.`,
    });
  }

  return {
    overview,
    building_profiles,
    check_analysis,
    maintenance_analysis,
    vehicle_profiles,
    alerts,
    insights,
  };
}
