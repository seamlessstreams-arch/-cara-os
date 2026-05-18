// ══════════════════════════════════════════════════════════════════════════════
// SHIFT PATTERN & STAFF DEPLOYMENT INTELLIGENCE ENGINE
//
// Pure deterministic engine for analysing shift patterns, staffing adequacy,
// fatigue risk, Key Worker availability, and deployment optimisation.
//
// Regulatory basis:
//   - CHR 2015, Reg 32(3)(b) — Sufficient competent staff at all times
//   - CHR 2015, Reg 33(4)(a) — Staff support, training, supervision
//   - Working Time Regulations 1998 — Max 48hr weeks, 11hr rest periods
//   - SCCIF: Effectiveness of leaders & managers → workforce deployment
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type ShiftType =
  | "day"
  | "evening"
  | "night"
  | "waking_night"
  | "sleep_in"
  | "long_day"
  | "split";

export type StaffRole =
  | "registered_manager"
  | "deputy_manager"
  | "senior_rcw"
  | "residential_child_worker"
  | "team_leader"
  | "waking_night_staff"
  | "agency";

export type FatigueRiskLevel = "low" | "moderate" | "high" | "critical";

export type DeploymentConcern =
  | "understaffed"
  | "lone_working"
  | "no_senior_cover"
  | "excessive_agency"
  | "key_worker_absence"
  | "fatigue_risk"
  | "insufficient_rest"
  | "overtime_breach"
  | "competency_gap";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ShiftRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  shiftType: ShiftType;
  date: string; // ISO date (YYYY-MM-DD)
  startTime: string; // HH:MM (24hr)
  endTime: string; // HH:MM (24hr)
  isAgency: boolean;
  childrenPresent: number;
  cancelled?: boolean;
  swapped?: boolean;
}

export interface StaffProfile {
  id: string;
  name: string;
  role: StaffRole;
  contractedHoursPerWeek: number;
  isAgency: boolean;
  keyWorkerFor: string[]; // child IDs
  qualifications: string[];
  canWorkAlone: boolean;
  maxConsecutiveDays: number; // contractual limit
}

export interface HomeShiftRequirements {
  homeId: string;
  registeredCapacity: number;
  currentOccupancy: number;
  minimumStaffDay: number;
  minimumStaffEvening: number;
  minimumStaffNight: number;
  requireSeniorOnShift: boolean;
  maximumAgencyPercentage: number; // e.g. 30 = 30%
  keyWorkerContactMinDaysPerWeek: number; // how often KW must work with child
}

// ── Fatigue Analysis ───────────────────────────────────────────────────────

export interface FatigueAssessment {
  staffId: string;
  staffName: string;
  riskLevel: FatigueRiskLevel;
  totalHoursThisWeek: number;
  consecutiveDaysWorked: number;
  shortestRestGapHours: number;
  breachesIdentified: string[];
  recommendation: string;
}

// ── Key Worker Availability ────────────────────────────────────────────────

export interface KeyWorkerAvailability {
  childId: string;
  childName: string;
  keyWorkerId: string;
  keyWorkerName: string;
  daysOnShiftTogether: number;
  requiredDays: number;
  gapDays: number;
  isCompliant: boolean;
  concern?: string;
}

// ── Shift Coverage Analysis ────────────────────────────────────────────────

export interface ShiftCoverageResult {
  date: string;
  shiftType: ShiftType;
  requiredStaff: number;
  actualStaff: number;
  seniorPresent: boolean;
  agencyCount: number;
  agencyPercentage: number;
  isCovered: boolean;
  concerns: DeploymentConcern[];
  staffOnShift: string[];
}

// ── Deployment Intelligence Result ─────────────────────────────────────────

export interface DeploymentIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  assessedAt: string;

  // Summary scores
  overallScore: number; // 0-100
  complianceRating: "compliant" | "minor_concerns" | "significant_concerns" | "non_compliant";

  // Coverage analysis
  totalShiftsAnalysed: number;
  coveredShifts: number;
  uncoveredShifts: number;
  coveragePercentage: number;

  // Staffing metrics
  averageStaffPerShift: number;
  agencyUsagePercentage: number;
  seniorCoveragePercentage: number;

  // Fatigue risk
  fatigueAssessments: FatigueAssessment[];
  staffAtHighFatigueRisk: number;

  // Key Worker compliance
  keyWorkerAvailability: KeyWorkerAvailability[];
  keyWorkerComplianceRate: number;

  // Shift coverage breakdown
  coverageByShiftType: ShiftCoverageResult[];

  // Concerns & actions
  concerns: { concern: DeploymentConcern; count: number; severity: "low" | "medium" | "high" }[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Helper: Parse time to minutes from midnight ────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// ── Helper: Calculate shift duration in hours ──────────────────────────────

export function calculateShiftDurationHours(start: string, end: string): number {
  let startMins = timeToMinutes(start);
  let endMins = timeToMinutes(end);

  // Handle overnight shifts (end < start means crosses midnight)
  if (endMins <= startMins) {
    endMins += 24 * 60;
  }

  return (endMins - startMins) / 60;
}

// ── Helper: Calculate rest gap between shifts ──────────────────────────────

export function calculateRestGapHours(
  shift1End: string,
  shift1Date: string,
  shift2Start: string,
  shift2Date: string,
): number {
  const date1 = new Date(`${shift1Date}T${shift1End}:00`);
  const date2 = new Date(`${shift2Date}T${shift2Start}:00`);

  // If shift1 ends after midnight (overnight), add a day
  const endMins = timeToMinutes(shift1End);
  const startMins = timeToMinutes(shift2Start);

  if (endMins < timeToMinutes("06:00") && shift1Date === shift2Date) {
    // Shift 1 ended early morning same day shift 2 starts — they're consecutive
  }

  const diffMs = date2.getTime() - date1.getTime();
  return diffMs / (1000 * 60 * 60);
}

// ── Core: Evaluate Fatigue Risk ────────────────────────────────────────────

export function evaluateFatigueRisk(
  staff: StaffProfile,
  shifts: ShiftRecord[],
  weekStartDate: string,
): FatigueAssessment {
  const staffShifts = shifts
    .filter((s) => s.staffId === staff.id && !s.cancelled)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  // Calculate total hours this week
  let totalHours = 0;
  for (const shift of staffShifts) {
    totalHours += calculateShiftDurationHours(shift.startTime, shift.endTime);
  }

  // Calculate consecutive days worked
  const uniqueDays = [...new Set(staffShifts.map((s) => s.date))].sort();
  let maxConsecutive = 0;
  let currentStreak = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
      maxConsecutive = Math.max(maxConsecutive, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  maxConsecutive = Math.max(maxConsecutive, currentStreak);

  // Calculate shortest rest gap between consecutive shifts
  let shortestRestGap = Infinity;
  for (let i = 1; i < staffShifts.length; i++) {
    const gap = calculateRestGapHours(
      staffShifts[i - 1].endTime,
      staffShifts[i - 1].date,
      staffShifts[i].startTime,
      staffShifts[i].date,
    );
    if (gap > 0 && gap < shortestRestGap) {
      shortestRestGap = gap;
    }
  }
  if (shortestRestGap === Infinity) shortestRestGap = 24;

  // Identify breaches
  const breaches: string[] = [];

  if (totalHours > 48) {
    breaches.push(`Working Time breach: ${totalHours.toFixed(1)}hrs exceeds 48hr weekly limit`);
  }
  if (shortestRestGap < 11) {
    breaches.push(
      `Rest period breach: ${shortestRestGap.toFixed(1)}hr rest gap is below 11hr minimum`,
    );
  }
  if (maxConsecutive > staff.maxConsecutiveDays) {
    breaches.push(
      `Consecutive days breach: ${maxConsecutive} days exceeds ${staff.maxConsecutiveDays} day limit`,
    );
  }
  if (totalHours > 60) {
    breaches.push(`Excessive hours: ${totalHours.toFixed(1)}hrs in one week is unsafe`);
  }

  // Determine risk level
  let riskLevel: FatigueRiskLevel = "low";
  if (breaches.length >= 3 || totalHours > 60 || shortestRestGap < 8) {
    riskLevel = "critical";
  } else if (breaches.length >= 2 || totalHours > 48 || shortestRestGap < 11) {
    riskLevel = "high";
  } else if (totalHours > 40 || maxConsecutive > 5 || shortestRestGap < 13) {
    riskLevel = "moderate";
  }

  // Generate recommendation
  let recommendation: string;
  switch (riskLevel) {
    case "critical":
      recommendation = `${staff.name} must not be rostered for additional shifts. Immediate management review required. Working Time Regulations breach identified.`;
      break;
    case "high":
      recommendation = `${staff.name} approaching unsafe working pattern. Reduce hours next week and ensure minimum 11hr rest between shifts.`;
      break;
    case "moderate":
      recommendation = `Monitor ${staff.name}'s working pattern. Consider reducing consecutive days or providing additional rest day.`;
      break;
    default:
      recommendation = `${staff.name}'s working pattern is within safe limits.`;
  }

  return {
    staffId: staff.id,
    staffName: staff.name,
    riskLevel,
    totalHoursThisWeek: Math.round(totalHours * 10) / 10,
    consecutiveDaysWorked: maxConsecutive,
    shortestRestGapHours: Math.round(shortestRestGap * 10) / 10,
    breachesIdentified: breaches,
    recommendation,
  };
}

// ── Core: Evaluate Key Worker Availability ─────────────────────────────────

export function evaluateKeyWorkerAvailability(
  staff: StaffProfile[],
  shifts: ShiftRecord[],
  children: { id: string; name: string }[],
  requirements: HomeShiftRequirements,
): KeyWorkerAvailability[] {
  const results: KeyWorkerAvailability[] = [];

  for (const child of children) {
    const keyWorker = staff.find((s) => s.keyWorkerFor.includes(child.id));
    if (!keyWorker) continue;

    // Count days where key worker was on shift (and not cancelled)
    const kwShifts = shifts.filter(
      (s) => s.staffId === keyWorker.id && !s.cancelled,
    );
    const kwDaysOnShift = new Set(kwShifts.map((s) => s.date)).size;

    const required = requirements.keyWorkerContactMinDaysPerWeek;
    const gap = Math.max(0, required - kwDaysOnShift);
    const isCompliant = kwDaysOnShift >= required;

    let concern: string | undefined;
    if (!isCompliant) {
      concern = `${keyWorker.name} was on shift ${kwDaysOnShift} days this week (minimum ${required} required for ${child.name})`;
    }

    results.push({
      childId: child.id,
      childName: child.name,
      keyWorkerId: keyWorker.id,
      keyWorkerName: keyWorker.name,
      daysOnShiftTogether: kwDaysOnShift,
      requiredDays: required,
      gapDays: gap,
      isCompliant,
      concern,
    });
  }

  return results;
}

// ── Core: Analyse Shift Coverage ───────────────────────────────────────────

export function analyseShiftCoverage(
  shifts: ShiftRecord[],
  requirements: HomeShiftRequirements,
): ShiftCoverageResult[] {
  // Group shifts by date + type
  const grouped = new Map<string, ShiftRecord[]>();

  for (const shift of shifts) {
    if (shift.cancelled) continue;
    const key = `${shift.date}|${shift.shiftType}`;
    const existing = grouped.get(key) || [];
    existing.push(shift);
    grouped.set(key, existing);
  }

  const results: ShiftCoverageResult[] = [];

  for (const [key, shiftGroup] of grouped) {
    const [date, shiftType] = key.split("|") as [string, ShiftType];
    const actualStaff = shiftGroup.length;
    const agencyCount = shiftGroup.filter((s) => s.isAgency).length;
    const agencyPercentage = actualStaff > 0 ? Math.round((agencyCount / actualStaff) * 100) : 0;

    // Determine required staff based on shift type
    let requiredStaff: number;
    switch (shiftType) {
      case "day":
      case "long_day":
      case "split":
        requiredStaff = requirements.minimumStaffDay;
        break;
      case "evening":
        requiredStaff = requirements.minimumStaffEvening;
        break;
      case "night":
      case "waking_night":
      case "sleep_in":
        requiredStaff = requirements.minimumStaffNight;
        break;
      default:
        requiredStaff = requirements.minimumStaffDay;
    }

    // Check senior cover
    const seniorRoles: StaffRole[] = ["registered_manager", "deputy_manager", "senior_rcw", "team_leader"];
    const seniorPresent = shiftGroup.some((s) => seniorRoles.includes(s.role));

    // Identify concerns
    const concerns: DeploymentConcern[] = [];

    if (actualStaff < requiredStaff) {
      concerns.push("understaffed");
    }
    // Lone working is only a concern during active supervision (day/evening).
    // Waking night and sleep-in with 1 staff is standard practice.
    const activeSupervisionShifts: ShiftType[] = ["day", "evening", "long_day", "split"];
    if (actualStaff === 1 && requirements.currentOccupancy > 0 && activeSupervisionShifts.includes(shiftType)) {
      concerns.push("lone_working");
    }
    if (requirements.requireSeniorOnShift && !seniorPresent) {
      concerns.push("no_senior_cover");
    }
    if (agencyPercentage > requirements.maximumAgencyPercentage) {
      concerns.push("excessive_agency");
    }

    const isCovered = concerns.length === 0;

    results.push({
      date,
      shiftType,
      requiredStaff,
      actualStaff,
      seniorPresent,
      agencyCount,
      agencyPercentage,
      isCovered,
      concerns,
      staffOnShift: shiftGroup.map((s) => s.staffName),
    });
  }

  return results.sort((a, b) => a.date.localeCompare(b.date));
}

// ── Main: Generate Deployment Intelligence ─────────────────────────────────

export function generateDeploymentIntelligence(
  shifts: ShiftRecord[],
  staff: StaffProfile[],
  children: { id: string; name: string }[],
  requirements: HomeShiftRequirements,
  periodStart: string,
  periodEnd: string,
): DeploymentIntelligenceResult {
  const assessedAt = new Date().toISOString();

  // 1. Shift Coverage Analysis
  const coverageResults = analyseShiftCoverage(shifts, requirements);
  const totalShiftsAnalysed = coverageResults.length;
  const coveredShifts = coverageResults.filter((r) => r.isCovered).length;
  const uncoveredShifts = totalShiftsAnalysed - coveredShifts;
  const coveragePercentage =
    totalShiftsAnalysed > 0 ? Math.round((coveredShifts / totalShiftsAnalysed) * 100) : 100;

  // 2. Staffing metrics
  const totalStaffOnAllShifts = coverageResults.reduce((sum, r) => sum + r.actualStaff, 0);
  const averageStaffPerShift =
    totalShiftsAnalysed > 0
      ? Math.round((totalStaffOnAllShifts / totalShiftsAnalysed) * 10) / 10
      : 0;

  const totalAgency = coverageResults.reduce((sum, r) => sum + r.agencyCount, 0);
  const agencyUsagePercentage =
    totalStaffOnAllShifts > 0 ? Math.round((totalAgency / totalStaffOnAllShifts) * 100) : 0;

  const seniorCoveredShifts = coverageResults.filter((r) => r.seniorPresent).length;
  const seniorCoveragePercentage =
    totalShiftsAnalysed > 0 ? Math.round((seniorCoveredShifts / totalShiftsAnalysed) * 100) : 100;

  // 3. Fatigue Risk Assessment
  const fatigueAssessments = staff
    .filter((s) => !s.isAgency)
    .map((s) => evaluateFatigueRisk(s, shifts, periodStart));

  const staffAtHighFatigueRisk = fatigueAssessments.filter(
    (a) => a.riskLevel === "high" || a.riskLevel === "critical",
  ).length;

  // 4. Key Worker Availability
  const keyWorkerAvailability = evaluateKeyWorkerAvailability(staff, shifts, children, requirements);
  const kwCompliant = keyWorkerAvailability.filter((k) => k.isCompliant).length;
  const keyWorkerComplianceRate =
    keyWorkerAvailability.length > 0
      ? Math.round((kwCompliant / keyWorkerAvailability.length) * 100)
      : 100;

  // 5. Aggregate concerns
  const allConcerns = coverageResults.flatMap((r) => r.concerns);
  const concernCounts = new Map<DeploymentConcern, number>();
  for (const concern of allConcerns) {
    concernCounts.set(concern, (concernCounts.get(concern) || 0) + 1);
  }

  // Add fatigue concerns
  if (staffAtHighFatigueRisk > 0) {
    concernCounts.set("fatigue_risk", staffAtHighFatigueRisk);
  }

  const fatigueBreaches = fatigueAssessments.filter((a) => a.shortestRestGapHours < 11);
  if (fatigueBreaches.length > 0) {
    concernCounts.set("insufficient_rest", fatigueBreaches.length);
  }

  const overtimeBreaches = fatigueAssessments.filter((a) => a.totalHoursThisWeek > 48);
  if (overtimeBreaches.length > 0) {
    concernCounts.set("overtime_breach", overtimeBreaches.length);
  }

  // Key worker concerns
  const kwNonCompliant = keyWorkerAvailability.filter((k) => !k.isCompliant);
  if (kwNonCompliant.length > 0) {
    concernCounts.set("key_worker_absence", kwNonCompliant.length);
  }

  const concerns = [...concernCounts.entries()].map(([concern, count]) => ({
    concern,
    count,
    severity: getSeverity(concern, count),
  }));

  // 6. Generate immediate actions
  const immediateActions = generateImmediateActions(
    concerns,
    fatigueAssessments,
    kwNonCompliant,
    coverageResults,
  );

  // 7. Calculate overall score
  const overallScore = calculateOverallScore(
    coveragePercentage,
    agencyUsagePercentage,
    seniorCoveragePercentage,
    staffAtHighFatigueRisk,
    keyWorkerComplianceRate,
    concerns,
  );

  // 8. Determine compliance rating
  const complianceRating = getComplianceRating(overallScore);

  // 9. Regulatory links
  const regulatoryLinks = generateRegulatoryLinks(concerns);

  return {
    homeId: requirements.homeId,
    periodStart,
    periodEnd,
    assessedAt,
    overallScore,
    complianceRating,
    totalShiftsAnalysed,
    coveredShifts,
    uncoveredShifts,
    coveragePercentage,
    averageStaffPerShift,
    agencyUsagePercentage,
    seniorCoveragePercentage,
    fatigueAssessments,
    staffAtHighFatigueRisk,
    keyWorkerAvailability,
    keyWorkerComplianceRate,
    coverageByShiftType: coverageResults,
    concerns,
    immediateActions,
    regulatoryLinks,
  };
}

// ── Scoring ────────────────────────────────────────────────────────────────

function calculateOverallScore(
  coveragePercentage: number,
  agencyPercentage: number,
  seniorCoverage: number,
  highFatigueStaff: number,
  kwCompliance: number,
  concerns: { concern: DeploymentConcern; count: number; severity: "low" | "medium" | "high" }[],
): number {
  let score = 100;

  // Coverage penalty (most critical)
  score -= Math.max(0, 100 - coveragePercentage) * 1.5;

  // Agency overuse penalty
  if (agencyPercentage > 30) score -= (agencyPercentage - 30) * 0.5;

  // Senior coverage penalty
  score -= Math.max(0, 100 - seniorCoverage) * 0.3;

  // Fatigue risk penalty
  score -= highFatigueStaff * 8;

  // Key Worker compliance penalty
  score -= Math.max(0, 100 - kwCompliance) * 0.4;

  // High severity concerns
  const highSeverity = concerns.filter((c) => c.severity === "high");
  score -= highSeverity.length * 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getComplianceRating(
  score: number,
): "compliant" | "minor_concerns" | "significant_concerns" | "non_compliant" {
  if (score >= 85) return "compliant";
  if (score >= 70) return "minor_concerns";
  if (score >= 50) return "significant_concerns";
  return "non_compliant";
}

function getSeverity(
  concern: DeploymentConcern,
  count: number,
): "low" | "medium" | "high" {
  const highSeverityConcerns: DeploymentConcern[] = [
    "lone_working",
    "fatigue_risk",
    "insufficient_rest",
    "overtime_breach",
  ];
  const mediumSeverityConcerns: DeploymentConcern[] = [
    "understaffed",
    "no_senior_cover",
    "key_worker_absence",
  ];

  if (highSeverityConcerns.includes(concern)) return "high";
  if (mediumSeverityConcerns.includes(concern) && count >= 3) return "high";
  if (mediumSeverityConcerns.includes(concern)) return "medium";
  if (count >= 5) return "medium";
  return "low";
}

// ── Action Generation ──────────────────────────────────────────────────────

function generateImmediateActions(
  concerns: { concern: DeploymentConcern; count: number; severity: "low" | "medium" | "high" }[],
  fatigueAssessments: FatigueAssessment[],
  kwNonCompliant: KeyWorkerAvailability[],
  coverageResults: ShiftCoverageResult[],
): string[] {
  const actions: string[] = [];

  // Critical: Lone working
  const loneWorking = concerns.find((c) => c.concern === "lone_working");
  if (loneWorking) {
    actions.push(
      `IMMEDIATE: ${loneWorking.count} lone working shift(s) identified. Review rota to ensure minimum two staff on all shifts when children are present.`,
    );
  }

  // Critical: Fatigue
  const criticalFatigue = fatigueAssessments.filter((a) => a.riskLevel === "critical");
  for (const fa of criticalFatigue) {
    actions.push(
      `URGENT: ${fa.staffName} at critical fatigue risk (${fa.totalHoursThisWeek}hrs this week). Do not roster for additional shifts.`,
    );
  }

  // High: Understaffed
  const understaffed = concerns.find((c) => c.concern === "understaffed");
  if (understaffed) {
    const uncoveredDates = coverageResults
      .filter((r) => r.concerns.includes("understaffed"))
      .map((r) => r.date)
      .slice(0, 3);
    actions.push(
      `HIGH: ${understaffed.count} understaffed shift(s). Priority dates: ${uncoveredDates.join(", ")}. Arrange cover or authorise overtime.`,
    );
  }

  // High: No senior cover
  const noSenior = concerns.find((c) => c.concern === "no_senior_cover");
  if (noSenior) {
    actions.push(
      `HIGH: ${noSenior.count} shift(s) without senior staff present. Ensure Team Leader or above is rostered on all shifts.`,
    );
  }

  // Medium: Agency overuse
  const excessiveAgency = concerns.find((c) => c.concern === "excessive_agency");
  if (excessiveAgency) {
    actions.push(
      `MEDIUM: Agency staff usage exceeds threshold on ${excessiveAgency.count} shift(s). Review recruitment pipeline and consider overtime for permanent staff.`,
    );
  }

  // Medium: Key Worker availability
  if (kwNonCompliant.length > 0) {
    const childNames = kwNonCompliant.map((k) => k.childName).slice(0, 3).join(", ");
    actions.push(
      `MEDIUM: Key Worker contact target not met for ${kwNonCompliant.length} child(ren) (${childNames}). Adjust rota to prioritise KW presence.`,
    );
  }

  // Rest period breaches
  const restBreaches = concerns.find((c) => c.concern === "insufficient_rest");
  if (restBreaches) {
    actions.push(
      `HIGH: ${restBreaches.count} staff member(s) have rest periods below 11 hours (Working Time Regulations breach). Adjust following shifts immediately.`,
    );
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Staffing deployment is within acceptable parameters.");
  }

  return actions;
}

// ── Regulatory Links ───────────────────────────────────────────────────────

function generateRegulatoryLinks(
  concerns: { concern: DeploymentConcern; count: number; severity: "low" | "medium" | "high" }[],
): string[] {
  const links = new Set<string>();

  links.add("CHR 2015, Reg 32(3)(b) — Fitness of staff: sufficient staff of appropriate experience and qualifications");

  for (const { concern } of concerns) {
    switch (concern) {
      case "understaffed":
      case "lone_working":
        links.add("CHR 2015, Reg 32(3)(b) — Sufficient staff deployed at all times");
        links.add("SCCIF: Effectiveness of leaders and managers — Workforce deployment");
        break;
      case "fatigue_risk":
      case "insufficient_rest":
      case "overtime_breach":
        links.add("Working Time Regulations 1998, Reg 10 — Minimum 11hr daily rest period");
        links.add("Working Time Regulations 1998, Reg 4 — Maximum 48hr average weekly working time");
        links.add("CHR 2015, Reg 33(4)(a) — Support, supervision and training to perform duties");
        break;
      case "no_senior_cover":
        links.add("CHR 2015, Reg 32(2) — Registered person must ensure competent supervision");
        break;
      case "excessive_agency":
        links.add("SCCIF: Effectiveness of leaders — Workforce stability and consistency");
        links.add("CHR 2015, Reg 32(3)(b) — Staff of appropriate experience");
        break;
      case "key_worker_absence":
        links.add("CHR 2015, Reg 5 — Positive relationships: consistent adult figures");
        links.add("SCCIF: Experiences and progress — Quality of relationships with staff");
        break;
      case "competency_gap":
        links.add("CHR 2015, Reg 32(3)(a) — Staff have appropriate qualifications, skills, and experience");
        break;
    }
  }

  return [...links];
}

// ── Utility: Get compliance rating label ───────────────────────────────────

export function getComplianceRatingLabel(
  rating: "compliant" | "minor_concerns" | "significant_concerns" | "non_compliant",
): string {
  switch (rating) {
    case "compliant":
      return "Compliant";
    case "minor_concerns":
      return "Minor Concerns";
    case "significant_concerns":
      return "Significant Concerns";
    case "non_compliant":
      return "Non-Compliant";
  }
}

// ── Utility: Get fatigue risk label ────────────────────────────────────────

export function getFatigueRiskLabel(level: FatigueRiskLevel): string {
  switch (level) {
    case "low":
      return "Low Risk";
    case "moderate":
      return "Moderate Risk";
    case "high":
      return "High Risk";
    case "critical":
      return "Critical Risk";
  }
}

// ── Utility: Get shift type label ──────────────────────────────────────────

export function getShiftTypeLabel(type: ShiftType): string {
  switch (type) {
    case "day":
      return "Day Shift";
    case "evening":
      return "Evening Shift";
    case "night":
      return "Night Shift";
    case "waking_night":
      return "Waking Night";
    case "sleep_in":
      return "Sleep-In";
    case "long_day":
      return "Long Day";
    case "split":
      return "Split Shift";
  }
}
