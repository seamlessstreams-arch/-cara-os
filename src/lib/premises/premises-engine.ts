// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PREMISES & PHYSICAL ENVIRONMENT INTELLIGENCE ENGINE
//
// Tracks building safety, fire drills, maintenance schedules, ligature
// assessments, environmental risk assessments, and the overall physical
// environment for children's residential homes.
//
// Regulatory basis:
//   - CHR 2015 Reg 25 (premises)
//   - CHR 2015 Reg 12 (protection of children — including physical safety)
//   - Health and Safety at Work Act 1974
//   - Regulatory Reform (Fire Safety) Order 2005
//   - SCCIF — "the home is well maintained and homely"
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type CheckCategory =
  | "fire_safety"
  | "fire_drill"
  | "ligature_assessment"
  | "water_temperature"
  | "gas_safety"
  | "electrical_safety"
  | "pat_testing"
  | "legionella"
  | "asbestos"
  | "building_maintenance"
  | "garden_outdoor"
  | "vehicle"
  | "cctv"
  | "alarm_system"
  | "first_aid_supplies"
  | "risk_assessment"
  | "accessibility"
  | "decoration_homeliness";

export type CheckStatus = "passed" | "failed" | "overdue" | "due_soon" | "not_due";
export type Urgency = "critical" | "high" | "medium" | "low";
export type MaintenanceStatus = "reported" | "scheduled" | "in_progress" | "completed" | "deferred";

export interface PremisesCheck {
  id: string;
  homeId: string;
  category: CheckCategory;
  checkName: string;
  lastCompletedDate: string; // ISO date
  nextDueDate: string;       // ISO date
  frequencyDays: number;     // how often the check recurs
  status: CheckStatus;
  completedBy?: string;
  outcome?: "satisfactory" | "unsatisfactory" | "action_required";
  notes?: string;
}

export interface MaintenanceRequest {
  id: string;
  homeId: string;
  category: CheckCategory;
  description: string;
  reportedDate: string;
  reportedBy: string;
  urgency: Urgency;
  status: MaintenanceStatus;
  completedDate?: string;
  completedBy?: string;
  daysOpen?: number; // calculated field
}

export interface FireDrillRecord {
  id: string;
  homeId: string;
  date: string;
  timeOfDay: "day" | "evening" | "night";
  evacuationTimeMinutes: number;
  allChildrenAccountedFor: boolean;
  allStaffParticipated: boolean;
  childrenPresent: number;
  staffPresent: number;
  issuesIdentified: string[];
  actionsTaken: string[];
  conductedBy: string;
}

export interface EnvironmentalRisk {
  id: string;
  homeId: string;
  riskArea: string;
  riskDescription: string;
  riskLevel: Urgency;
  identifiedDate: string;
  mitigationInPlace: boolean;
  mitigationDescription?: string;
  reviewDate: string;
  status: "open" | "mitigated" | "closed" | "accepted";
}

// ── Label helpers ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<CheckCategory, string> = {
  fire_safety: "Fire Safety",
  fire_drill: "Fire Drill",
  ligature_assessment: "Ligature Assessment",
  water_temperature: "Water Temperature",
  gas_safety: "Gas Safety",
  electrical_safety: "Electrical Safety",
  pat_testing: "PAT Testing",
  legionella: "Legionella",
  asbestos: "Asbestos Survey",
  building_maintenance: "Building Maintenance",
  garden_outdoor: "Garden & Outdoor",
  vehicle: "Vehicle",
  cctv: "CCTV",
  alarm_system: "Alarm System",
  first_aid_supplies: "First Aid Supplies",
  risk_assessment: "Risk Assessment",
  accessibility: "Accessibility",
  decoration_homeliness: "Decoration & Homeliness",
};

export function getCategoryLabel(category: CheckCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

// ── Helper ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round((msB - msA) / (1000 * 60 * 60 * 24));
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

// ── 1. Compliance Checks ───────────────────────────────────────────────────

export interface ComplianceResult {
  totalChecks: number;
  passed: number;
  failed: number;
  overdue: number;
  dueSoon: number;
  notDue: number;
  complianceRate: number; // % of checks that are passed or not_due
  overdueChecks: { id: string; category: CheckCategory; checkName: string; nextDueDate: string; daysPastDue: number }[];
  dueSoonChecks: { id: string; category: CheckCategory; checkName: string; nextDueDate: string; daysUntilDue: number }[];
  failedChecks: { id: string; category: CheckCategory; checkName: string; lastCompletedDate: string; notes?: string }[];
  categoryBreakdown: { category: CheckCategory; label: string; total: number; passed: number; failed: number; overdue: number }[];
}

export function evaluateComplianceChecks(
  checks: PremisesCheck[],
  referenceDate: string,
): ComplianceResult {
  const passed = checks.filter((c) => c.status === "passed").length;
  const failed = checks.filter((c) => c.status === "failed").length;
  const overdue = checks.filter((c) => c.status === "overdue").length;
  const dueSoon = checks.filter((c) => c.status === "due_soon").length;
  const notDue = checks.filter((c) => c.status === "not_due").length;

  const complianceRate = checks.length > 0
    ? pct(passed + notDue, checks.length)
    : 0;

  const overdueChecks = checks
    .filter((c) => c.status === "overdue")
    .map((c) => ({
      id: c.id,
      category: c.category,
      checkName: c.checkName,
      nextDueDate: c.nextDueDate,
      daysPastDue: Math.max(0, daysBetween(c.nextDueDate, referenceDate)),
    }))
    .sort((a, b) => b.daysPastDue - a.daysPastDue);

  const dueSoonChecks = checks
    .filter((c) => c.status === "due_soon")
    .map((c) => ({
      id: c.id,
      category: c.category,
      checkName: c.checkName,
      nextDueDate: c.nextDueDate,
      daysUntilDue: Math.max(0, daysBetween(referenceDate, c.nextDueDate)),
    }))
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const failedChecks = checks
    .filter((c) => c.status === "failed")
    .map((c) => ({
      id: c.id,
      category: c.category,
      checkName: c.checkName,
      lastCompletedDate: c.lastCompletedDate,
      notes: c.notes,
    }));

  // Category breakdown
  const catMap = new Map<CheckCategory, { total: number; passed: number; failed: number; overdue: number }>();
  for (const c of checks) {
    const entry = catMap.get(c.category) ?? { total: 0, passed: 0, failed: 0, overdue: 0 };
    entry.total++;
    if (c.status === "passed" || c.status === "not_due") entry.passed++;
    if (c.status === "failed") entry.failed++;
    if (c.status === "overdue") entry.overdue++;
    catMap.set(c.category, entry);
  }
  const categoryBreakdown = Array.from(catMap.entries())
    .map(([category, data]) => ({ category, label: getCategoryLabel(category), ...data }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    totalChecks: checks.length,
    passed,
    failed,
    overdue,
    dueSoon,
    notDue,
    complianceRate,
    overdueChecks,
    dueSoonChecks,
    failedChecks,
    categoryBreakdown,
  };
}

// ── 2. Maintenance ─────────────────────────────────────────────────────────

export interface MaintenanceResult {
  totalRequests: number;
  open: number;
  completed: number;
  deferred: number;
  avgResolutionDays: number;
  criticalOpen: number;
  highOpen: number;
  completionRate: number;
  openRequests: { id: string; category: CheckCategory; description: string; urgency: Urgency; reportedDate: string; daysOpen: number }[];
  urgencyBreakdown: { urgency: Urgency; total: number; open: number; completed: number }[];
}

export function evaluateMaintenance(
  requests: MaintenanceRequest[],
  referenceDate: string,
): MaintenanceResult {
  const open = requests.filter((r) => ["reported", "scheduled", "in_progress"].includes(r.status)).length;
  const completed = requests.filter((r) => r.status === "completed").length;
  const deferred = requests.filter((r) => r.status === "deferred").length;

  const completedWithDates = requests.filter((r) => r.status === "completed" && r.completedDate);
  const avgResolutionDays = completedWithDates.length > 0
    ? Math.round(
        completedWithDates.reduce((sum, r) => sum + daysBetween(r.reportedDate, r.completedDate!), 0)
        / completedWithDates.length
      )
    : 0;

  const criticalOpen = requests.filter(
    (r) => r.urgency === "critical" && ["reported", "scheduled", "in_progress"].includes(r.status)
  ).length;
  const highOpen = requests.filter(
    (r) => r.urgency === "high" && ["reported", "scheduled", "in_progress"].includes(r.status)
  ).length;

  const completionRate = requests.length > 0 ? pct(completed, requests.length) : 0;

  const openRequests = requests
    .filter((r) => ["reported", "scheduled", "in_progress"].includes(r.status))
    .map((r) => ({
      id: r.id,
      category: r.category,
      description: r.description,
      urgency: r.urgency,
      reportedDate: r.reportedDate,
      daysOpen: daysBetween(r.reportedDate, referenceDate),
    }))
    .sort((a, b) => {
      const urgRank: Record<Urgency, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgRank[a.urgency] - urgRank[b.urgency] || b.daysOpen - a.daysOpen;
    });

  // Urgency breakdown
  const urgMap = new Map<Urgency, { total: number; open: number; completed: number }>();
  for (const r of requests) {
    const entry = urgMap.get(r.urgency) ?? { total: 0, open: 0, completed: 0 };
    entry.total++;
    if (["reported", "scheduled", "in_progress"].includes(r.status)) entry.open++;
    if (r.status === "completed") entry.completed++;
    urgMap.set(r.urgency, entry);
  }
  const urgencyBreakdown = (["critical", "high", "medium", "low"] as Urgency[])
    .filter((u) => urgMap.has(u))
    .map((urgency) => ({ urgency, ...urgMap.get(urgency)! }));

  return {
    totalRequests: requests.length,
    open,
    completed,
    deferred,
    avgResolutionDays,
    criticalOpen,
    highOpen,
    completionRate,
    openRequests,
    urgencyBreakdown,
  };
}

// ── 3. Fire Drills ─────────────────────────────────────────────────────────

export interface FireDrillResult {
  totalDrills: number;
  drillsInPeriod: number;
  avgEvacuationTime: number;
  allChildrenAccountedForRate: number;
  allStaffParticipatedRate: number;
  issuesIdentifiedCount: number;
  nightDrillsConducted: number;
  eveningDrillsConducted: number;
  dayDrillsConducted: number;
  drillFrequencyAdequate: boolean; // at least 1 per quarter
  drillsByTimeOfDay: { timeOfDay: string; count: number; avgEvacTime: number }[];
}

export function evaluateFireDrills(
  drills: FireDrillRecord[],
  periodStart: string,
  periodEnd: string,
): FireDrillResult {
  const inRange = drills.filter((d) => inPeriod(d.date, periodStart, periodEnd));

  const avgEvacuationTime = inRange.length > 0
    ? Math.round(inRange.reduce((s, d) => s + d.evacuationTimeMinutes, 0) / inRange.length * 10) / 10
    : 0;

  const allChildrenAccountedForRate = inRange.length > 0
    ? pct(inRange.filter((d) => d.allChildrenAccountedFor).length, inRange.length)
    : 0;

  const allStaffParticipatedRate = inRange.length > 0
    ? pct(inRange.filter((d) => d.allStaffParticipated).length, inRange.length)
    : 0;

  const issuesIdentifiedCount = inRange.reduce((s, d) => s + d.issuesIdentified.length, 0);

  const night = inRange.filter((d) => d.timeOfDay === "night");
  const evening = inRange.filter((d) => d.timeOfDay === "evening");
  const day = inRange.filter((d) => d.timeOfDay === "day");

  // At least 1 drill per quarter (roughly 1 per 3 months = ~4 per year)
  const periodDays = daysBetween(periodStart, periodEnd);
  const expectedDrills = Math.max(1, Math.floor(periodDays / 90));
  const drillFrequencyAdequate = inRange.length >= expectedDrills;

  const drillsByTimeOfDay = [
    { timeOfDay: "day", count: day.length, avgEvacTime: day.length > 0 ? Math.round(day.reduce((s, d) => s + d.evacuationTimeMinutes, 0) / day.length * 10) / 10 : 0 },
    { timeOfDay: "evening", count: evening.length, avgEvacTime: evening.length > 0 ? Math.round(evening.reduce((s, d) => s + d.evacuationTimeMinutes, 0) / evening.length * 10) / 10 : 0 },
    { timeOfDay: "night", count: night.length, avgEvacTime: night.length > 0 ? Math.round(night.reduce((s, d) => s + d.evacuationTimeMinutes, 0) / night.length * 10) / 10 : 0 },
  ];

  return {
    totalDrills: drills.length,
    drillsInPeriod: inRange.length,
    avgEvacuationTime,
    allChildrenAccountedForRate,
    allStaffParticipatedRate,
    issuesIdentifiedCount,
    nightDrillsConducted: night.length,
    eveningDrillsConducted: evening.length,
    dayDrillsConducted: day.length,
    drillFrequencyAdequate,
    drillsByTimeOfDay,
  };
}

// ── 4. Environmental Risks ─────────────────────────────────────────────────

export interface EnvironmentalRiskResult {
  totalRisks: number;
  openRisks: number;
  mitigatedRisks: number;
  closedRisks: number;
  acceptedRisks: number;
  criticalOpen: number;
  highOpen: number;
  mitigationRate: number; // % of open+mitigated that have mitigation
  overdueReviews: { id: string; riskArea: string; riskLevel: Urgency; reviewDate: string; daysPastDue: number }[];
  risksByLevel: { level: Urgency; total: number; open: number; mitigated: number }[];
}

export function evaluateEnvironmentalRisks(
  risks: EnvironmentalRisk[],
  referenceDate: string,
): EnvironmentalRiskResult {
  const open = risks.filter((r) => r.status === "open").length;
  const mitigated = risks.filter((r) => r.status === "mitigated").length;
  const closed = risks.filter((r) => r.status === "closed").length;
  const accepted = risks.filter((r) => r.status === "accepted").length;

  const criticalOpen = risks.filter((r) => r.riskLevel === "critical" && r.status === "open").length;
  const highOpen = risks.filter((r) => r.riskLevel === "high" && r.status === "open").length;

  const activeRisks = risks.filter((r) => r.status === "open" || r.status === "mitigated");
  const withMitigation = activeRisks.filter((r) => r.mitigationInPlace);
  const mitigationRate = activeRisks.length > 0 ? pct(withMitigation.length, activeRisks.length) : 100;

  const overdueReviews = risks
    .filter((r) => (r.status === "open" || r.status === "mitigated") && r.reviewDate < referenceDate)
    .map((r) => ({
      id: r.id,
      riskArea: r.riskArea,
      riskLevel: r.riskLevel,
      reviewDate: r.reviewDate,
      daysPastDue: daysBetween(r.reviewDate, referenceDate),
    }))
    .sort((a, b) => b.daysPastDue - a.daysPastDue);

  const levelMap = new Map<Urgency, { total: number; open: number; mitigated: number }>();
  for (const r of risks) {
    const entry = levelMap.get(r.riskLevel) ?? { total: 0, open: 0, mitigated: 0 };
    entry.total++;
    if (r.status === "open") entry.open++;
    if (r.status === "mitigated") entry.mitigated++;
    levelMap.set(r.riskLevel, entry);
  }
  const risksByLevel = (["critical", "high", "medium", "low"] as Urgency[])
    .filter((l) => levelMap.has(l))
    .map((level) => ({ level, ...levelMap.get(level)! }));

  return {
    totalRisks: risks.length,
    openRisks: open,
    mitigatedRisks: mitigated,
    closedRisks: closed,
    acceptedRisks: accepted,
    criticalOpen,
    highOpen,
    mitigationRate,
    overdueReviews,
    risksByLevel,
  };
}

// ── 5. Integration: generatePremisesIntelligence ───────────────────────────

export type PremisesRating = "outstanding" | "good" | "requires_improvement" | "inadequate";

export interface PremisesIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  compliance: ComplianceResult;
  maintenance: MaintenanceResult;
  fireDrills: FireDrillResult;
  environmentalRisks: EnvironmentalRiskResult;
  overallScore: number;
  rating: PremisesRating;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

export function generatePremisesIntelligence(
  checks: PremisesCheck[],
  maintenanceRequests: MaintenanceRequest[],
  fireDrills: FireDrillRecord[],
  environmentalRisks: EnvironmentalRisk[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): PremisesIntelligenceResult {
  const compliance = evaluateComplianceChecks(checks, referenceDate);
  const maintenance = evaluateMaintenance(maintenanceRequests, referenceDate);
  const drills = evaluateFireDrills(fireDrills, periodStart, periodEnd);
  const risks = evaluateEnvironmentalRisks(environmentalRisks, referenceDate);

  // ── Score calculation ──────────────────────────────────────────────────

  // Compliance (30 points)
  let complianceScore = 0;
  if (compliance.totalChecks > 0) {
    if (compliance.complianceRate >= 95) complianceScore = 30;
    else if (compliance.complianceRate >= 85) complianceScore = 24;
    else if (compliance.complianceRate >= 70) complianceScore = 16;
    else complianceScore = 8;
    // Deduct for overdue checks
    complianceScore = Math.max(0, complianceScore - compliance.overdue * 2);
    // Deduct heavily for failed checks
    complianceScore = Math.max(0, complianceScore - compliance.failed * 4);
  }

  // Maintenance (25 points)
  let maintenanceScore = 0;
  if (maintenance.totalRequests > 0) {
    if (maintenance.completionRate >= 90) maintenanceScore = 20;
    else if (maintenance.completionRate >= 70) maintenanceScore = 14;
    else if (maintenance.completionRate >= 50) maintenanceScore = 8;
    else maintenanceScore = 4;
    // Bonus for quick resolution
    if (maintenance.avgResolutionDays <= 7) maintenanceScore += 5;
    else if (maintenance.avgResolutionDays <= 14) maintenanceScore += 3;
    // Deduct for critical/high open
    maintenanceScore = Math.max(0, maintenanceScore - maintenance.criticalOpen * 5 - maintenance.highOpen * 2);
  } else {
    // No maintenance requests could mean well-maintained or unreported
    maintenanceScore = 15;
  }
  maintenanceScore = Math.min(25, maintenanceScore);

  // Fire drills (25 points)
  let drillScore = 0;
  if (drills.drillsInPeriod > 0) {
    if (drills.drillFrequencyAdequate) drillScore += 10;
    else drillScore += 4;
    if (drills.allChildrenAccountedForRate === 100) drillScore += 5;
    else if (drills.allChildrenAccountedForRate >= 80) drillScore += 3;
    if (drills.allStaffParticipatedRate === 100) drillScore += 3;
    else if (drills.allStaffParticipatedRate >= 80) drillScore += 2;
    if (drills.avgEvacuationTime <= 3) drillScore += 4;
    else if (drills.avgEvacuationTime <= 5) drillScore += 2;
    // Bonus for variety (night + evening drills)
    if (drills.nightDrillsConducted > 0) drillScore += 2;
    if (drills.eveningDrillsConducted > 0) drillScore += 1;
  }
  drillScore = Math.min(25, drillScore);

  // Environmental risks (20 points)
  let riskScore = 0;
  if (risks.totalRisks > 0) {
    if (risks.criticalOpen === 0 && risks.highOpen === 0) riskScore += 10;
    else if (risks.criticalOpen === 0) riskScore += 6;
    else riskScore += 2;
    if (risks.mitigationRate >= 90) riskScore += 5;
    else if (risks.mitigationRate >= 70) riskScore += 3;
    if (risks.overdueReviews.length === 0) riskScore += 5;
    else if (risks.overdueReviews.length <= 2) riskScore += 2;
  } else {
    riskScore = 14; // No risks tracked — moderate default
  }
  riskScore = Math.min(20, riskScore);

  const overallScore = Math.min(100, complianceScore + maintenanceScore + drillScore + riskScore);

  const rating: PremisesRating =
    overallScore >= 80 ? "outstanding"
    : overallScore >= 60 ? "good"
    : overallScore >= 40 ? "requires_improvement"
    : "inadequate";

  // ── Strengths ──────────────────────────────────────────────────────────

  const strengths: string[] = [];
  if (compliance.complianceRate >= 90 && compliance.totalChecks > 0)
    strengths.push("Strong compliance with premises safety checks.");
  if (drills.drillFrequencyAdequate && drills.drillsInPeriod > 0)
    strengths.push("Fire drill frequency meets regulatory expectations.");
  if (drills.allChildrenAccountedForRate === 100 && drills.drillsInPeriod > 0)
    strengths.push("All children accounted for in every fire drill.");
  if (maintenance.completionRate >= 80 && maintenance.totalRequests > 0)
    strengths.push("Good maintenance completion rate demonstrates responsive property management.");
  if (risks.criticalOpen === 0 && risks.highOpen === 0 && risks.totalRisks > 0)
    strengths.push("No critical or high environmental risks currently open.");
  if (drills.nightDrillsConducted > 0 && drills.eveningDrillsConducted > 0)
    strengths.push("Fire drills conducted across different times of day including evenings and nights.");
  if (strengths.length === 0)
    strengths.push("Premises monitoring is in place and data is being recorded.");

  // ── Areas for improvement ──────────────────────────────────────────────

  const areasForImprovement: string[] = [];
  if (compliance.overdue > 0)
    areasForImprovement.push(`${compliance.overdue} premises check(s) are overdue and need immediate attention.`);
  if (compliance.failed > 0)
    areasForImprovement.push(`${compliance.failed} check(s) have failed and require remedial action.`);
  if (!drills.drillFrequencyAdequate && drills.totalDrills > 0)
    areasForImprovement.push("Fire drill frequency does not meet the expected schedule.");
  if (drills.drillsInPeriod === 0)
    areasForImprovement.push("No fire drills were conducted during this period.");
  if (maintenance.criticalOpen > 0)
    areasForImprovement.push(`${maintenance.criticalOpen} critical maintenance request(s) remain open.`);
  if (risks.criticalOpen > 0)
    areasForImprovement.push(`${risks.criticalOpen} critical environmental risk(s) remain open and unmitigated.`);
  if (risks.overdueReviews.length > 0)
    areasForImprovement.push(`${risks.overdueReviews.length} environmental risk review(s) are overdue.`);
  if (drills.nightDrillsConducted === 0 && drills.drillsInPeriod > 0)
    areasForImprovement.push("No night-time fire drill has been conducted — this is needed to test night evacuation readiness.");

  // ── Suggested actions ──────────────────────────────────────────────────

  const actions: string[] = [];
  if (compliance.overdue > 0)
    actions.push("Complete all overdue premises checks within 7 days and update the record.");
  if (compliance.failed > 0)
    actions.push("Commission remedial work for all failed checks and set a review date.");
  if (maintenance.criticalOpen > 0)
    actions.push("Escalate critical maintenance requests to the provider for urgent resolution.");
  if (risks.criticalOpen > 0)
    actions.push("Review and mitigate all critical environmental risks immediately.");
  if (drills.drillsInPeriod === 0)
    actions.push("Schedule and conduct a fire drill within the next 14 days.");
  if (drills.nightDrillsConducted === 0 && drills.drillsInPeriod > 0)
    actions.push("Conduct a night-time fire drill to assess evacuation readiness out of hours.");

  const regulatoryLinks = [
    "Children's Homes (England) Regulations 2015 — Regulation 25 (premises)",
    "Children's Homes (England) Regulations 2015 — Regulation 12 (protection of children)",
    "Health and Safety at Work Act 1974",
    "Regulatory Reform (Fire Safety) Order 2005",
    "SCCIF — The effectiveness of leaders and managers: well-maintained, homely premises",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    compliance,
    maintenance,
    fireDrills: drills,
    environmentalRisks: risks,
    overallScore,
    rating,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
