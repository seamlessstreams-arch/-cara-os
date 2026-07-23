// ══════════════════════════════════════════════════════════════════════════════
// Cara Staff Deployment Intelligence Engine
//
// Deterministic engine for analysing how effectively a children's home deploys
// its staff to meet children's needs. Covers staffing adequacy, agency
// minimisation, consistency of care, rota compliance, and incident management.
//
// Aligned to:
//   - CHR 2015 Reg 32 — Organisation of children's home (sufficient staff)
//   - CHR 2015 Reg 33 — Employment of staff
//   - Schedule 1 Standard 25 — Sufficient staff with right skills & experience
//   - SCCIF — Leadership and Management / Experiences and Progress of Children
//   - Working Together 2023 — Multi-agency safeguarding, staffing standards
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rate, rateOf } from "@/lib/metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type StaffRole =
  | "registered_manager"
  | "deputy_manager"
  | "senior_rsw"
  | "rsw"
  | "night_waking"
  | "bank"
  | "agency";

export type ShiftType =
  | "morning"
  | "afternoon"
  | "evening"
  | "waking_night"
  | "sleep_in"
  | "long_day";

export type DeploymentStatus =
  | "filled"
  | "unfilled"
  | "agency_cover"
  | "bank_cover"
  | "overtime";

export type OverallRating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Record Interfaces ──────────────────────────────────────────────────────

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  contractType: "permanent" | "fixed_term" | "bank" | "agency";
  startDate: string;
  keyChildren: string[];
}

export interface ShiftRota {
  date: string;
  shiftType: ShiftType;
  plannedStaff: string[];
  actualStaff: string[];
  status: DeploymentStatus;
  childrenPresent: number;
}

export interface AgencyUsage {
  date: string;
  agencyStaffId: string;
  reason: string;
  briefingCompleted: boolean;
  childrenKnown: boolean;
}

export interface StaffingIncident {
  date: string;
  type: "understaffed" | "lone_working" | "unplanned_absence" | "no_senior_on_shift";
  impact: string;
  resolution: string;
}

export interface ConsistencyRecord {
  childId: string;
  primaryKeyWorker: string;
  secondaryKeyWorker: string;
  staffContactCount: number;
  uniqueStaffCount: number;
  period: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

// Every rate below is null when its population is empty: no rota recorded is not
// a fully-staffed home, and no agency shift is not a perfectly-briefed one.
export interface StaffingAdequacyResult {
  fillRate: number | null;                // % of shifts filled, null = no shifts rostered
  averageStaffChildRatio: number | null;  // average ratio across shifts with children present
  shiftsUnderstaffed: number;             // count of unfilled shifts
  shiftsFilled: number;                   // count of filled shifts
  shiftsTotal: number;
  seniorOnShiftRate: number | null;       // % of shifts with senior/manager present
  statusBreakdown: Record<DeploymentStatus, number>;
}

export interface AgencyMinimisationResult {
  agencyUsageRate: number | null;         // % of total shift-staff that are agency
  agencyShiftsCount: number;              // total agency shift appearances
  briefingCompletionRate: number | null;  // % of agency uses with briefing completed
  childrenKnownRate: number | null;       // % of agency uses where staff knew children
  totalShiftStaff: number;               // total staff appearances across all shifts
  agencyReasons: Record<string, number>;  // breakdown by reason
}

export interface ConsistencyOfCareResult {
  averageUniqueStaffPerChild: number | null; // lower is better for consistency
  keyWorkerCoverage: number | null;       // % of children with primary key worker
  secondaryKeyWorkerCoverage: number | null; // % of children with secondary key worker
  averageContactsPerChild: number | null; // average staff contact count
  childConsistencyDetails: ChildConsistencyDetail[];
}

export interface ChildConsistencyDetail {
  childId: string;
  primaryKeyWorker: string;
  secondaryKeyWorker: string;
  staffContactCount: number;
  uniqueStaffCount: number;
  consistencyScore: number;               // 0-100, higher is better
}

export interface RotaComplianceResult {
  rotaPublishedOnTimeRate: number | null; // % of rotas published >= 7 days ahead
  shiftTypeDistribution: Record<ShiftType, number>;
  longDayComplianceRate: number | null;   // % of long days properly staffed, null = no long days rostered
  nightCoverRate: number | null;          // % of nights with waking cover, null = no nights rostered
}

export interface IncidentManagementResult {
  totalIncidents: number;
  incidentsByType: Record<string, number>;
  loneWorkingIncidents: number;
  understaffedIncidents: number;
  noSeniorIncidents: number;
  unplannedAbsenceIncidents: number;
  resolutionRate: number | null;          // % of incidents with resolution documented
}

export interface RegulatoryLink {
  regulation: string;
  requirement: string;
  // "not_evidenced" = nothing recorded to judge against, which is neither a pass
  // nor a breach. It is the honest answer for an empty register.
  status: "met" | "partially_met" | "not_met" | "not_evidenced";
  evidence: string;
}

export interface StaffDeploymentProfile {
  staffId: string;
  staffName: string;
  role: StaffRole;
  contractType: string;
  keyChildrenCount: number;
  shiftsWorked: number;
  isAgency: boolean;
  isBank: boolean;
  riskFlags: string[];
}

export interface StaffDeploymentIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  overallScore: number | null;            // 0-100 over the domains actually evidenced
  overallRating: OverallRating | "insufficient_data";
  componentScores: {
    staffingAdequacy: number;             // 0-25
    agencyMinimisation: number;           // 0-20
    consistencyOfCare: number;            // 0-25
    rotaCompliance: number;               // 0-15
    incidentManagement: number;           // 0-15
  };
  staffingAdequacy: StaffingAdequacyResult;
  agencyMinimisation: AgencyMinimisationResult;
  consistencyOfCare: ConsistencyOfCareResult;
  rotaCompliance: RotaComplianceResult;
  incidentManagement: IncidentManagementResult;
  strengths: string[];
  areasForImprovement: string[];
  recommendedActions: string[];
  regulatoryLinks: RegulatoryLink[];
  staffProfiles: StaffDeploymentProfile[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isInPeriod(dateStr: string, periodStart: string, periodEnd: string): boolean {
  const d = new Date(dateStr).getTime();
  return d >= new Date(periodStart).getTime() && d <= new Date(periodEnd).getTime();
}

const SENIOR_ROLES: StaffRole[] = ["registered_manager", "deputy_manager", "senior_rsw"];

// ── Core Function 1: Evaluate Staffing Adequacy ──────────────────────────

export function evaluateStaffingAdequacy(
  rotas: ShiftRota[],
  staffMembers: StaffMember[],
  periodStart: string,
  periodEnd: string,
): StaffingAdequacyResult {
  const periodRotas = rotas.filter(r => isInPeriod(r.date, periodStart, periodEnd));

  if (periodRotas.length === 0) {
    return {
      fillRate: null,
      averageStaffChildRatio: null,
      shiftsUnderstaffed: 0,
      shiftsFilled: 0,
      shiftsTotal: 0,
      seniorOnShiftRate: null,
      statusBreakdown: { filled: 0, unfilled: 0, agency_cover: 0, bank_cover: 0, overtime: 0 },
    };
  }

  const shiftsTotal = periodRotas.length;
  const shiftsFilled = periodRotas.filter(r => r.status !== "unfilled").length;
  const shiftsUnderstaffed = periodRotas.filter(r => r.status === "unfilled").length;
  const fillRate = rate(shiftsFilled, shiftsTotal);

  // Average staff:child ratio — only count shifts with children present
  const shiftsWithChildren = periodRotas.filter(r => r.childrenPresent > 0);
  const averageStaffChildRatio = shiftsWithChildren.length > 0
    ? Math.round((shiftsWithChildren.reduce((sum, r) => {
        return sum + (r.actualStaff.length / r.childrenPresent);
      }, 0) / shiftsWithChildren.length) * 100) / 100
    : null;

  // Senior on shift rate
  const staffRoleMap = new Map<string, StaffRole>();
  for (const sm of staffMembers) {
    staffRoleMap.set(sm.id, sm.role);
  }

  const shiftsWithSenior = periodRotas.filter(r =>
    r.actualStaff.some(sid => {
      const role = staffRoleMap.get(sid);
      return role !== undefined && SENIOR_ROLES.includes(role);
    })
  );
  const seniorOnShiftRate = rate(shiftsWithSenior.length, shiftsTotal);

  // Status breakdown
  const statusBreakdown: Record<DeploymentStatus, number> = {
    filled: 0, unfilled: 0, agency_cover: 0, bank_cover: 0, overtime: 0,
  };
  for (const r of periodRotas) {
    statusBreakdown[r.status]++;
  }

  return {
    fillRate,
    averageStaffChildRatio,
    shiftsUnderstaffed,
    shiftsFilled,
    shiftsTotal,
    seniorOnShiftRate,
    statusBreakdown,
  };
}

// ── Core Function 2: Evaluate Agency Minimisation ────────────────────────

export function evaluateAgencyMinimisation(
  agencyUsages: AgencyUsage[],
  rotas: ShiftRota[],
  periodStart: string,
  periodEnd: string,
): AgencyMinimisationResult {
  const periodUsages = agencyUsages.filter(a => isInPeriod(a.date, periodStart, periodEnd));
  const periodRotas = rotas.filter(r => isInPeriod(r.date, periodStart, periodEnd));

  // Total staff appearances across all shifts
  const totalShiftStaff = periodRotas.reduce((sum, r) => sum + r.actualStaff.length, 0);

  const agencyShiftsCount = periodUsages.length;
  // Null when no shift-staff were rostered at all — an unrostered period is not
  // a home with zero agency reliance.
  const agencyUsageRate = rate(agencyShiftsCount, totalShiftStaff);

  // Briefing completion — null when no agency staff were used (nothing to brief)
  const briefingCompleted = periodUsages.filter(u => u.briefingCompleted);
  const briefingCompletionRate = rateOf(briefingCompleted, periodUsages);

  // Children known rate
  const childrenKnown = periodUsages.filter(u => u.childrenKnown);
  const childrenKnownRate = rateOf(childrenKnown, periodUsages);

  // Reasons breakdown
  const agencyReasons: Record<string, number> = {};
  for (const u of periodUsages) {
    agencyReasons[u.reason] = (agencyReasons[u.reason] ?? 0) + 1;
  }

  return {
    agencyUsageRate,
    agencyShiftsCount,
    briefingCompletionRate,
    childrenKnownRate,
    totalShiftStaff,
    agencyReasons,
  };
}

// ── Core Function 3: Evaluate Consistency of Care ────────────────────────

export function evaluateConsistencyOfCare(
  consistencyRecords: ConsistencyRecord[],
): ConsistencyOfCareResult {
  if (consistencyRecords.length === 0) {
    return {
      averageUniqueStaffPerChild: null,
      keyWorkerCoverage: null,
      secondaryKeyWorkerCoverage: null,
      averageContactsPerChild: null,
      childConsistencyDetails: [],
    };
  }

  const totalChildren = consistencyRecords.length;

  // Key worker coverage
  const withPrimary = consistencyRecords.filter(c => c.primaryKeyWorker.length > 0);
  const keyWorkerCoverage = rateOf(withPrimary, consistencyRecords);

  const withSecondary = consistencyRecords.filter(c => c.secondaryKeyWorker.length > 0);
  const secondaryKeyWorkerCoverage = rateOf(withSecondary, consistencyRecords);

  // Averages
  const totalUnique = consistencyRecords.reduce((sum, c) => sum + c.uniqueStaffCount, 0);
  const averageUniqueStaffPerChild = Math.round((totalUnique / totalChildren) * 10) / 10;

  const totalContacts = consistencyRecords.reduce((sum, c) => sum + c.staffContactCount, 0);
  const averageContactsPerChild = Math.round((totalContacts / totalChildren) * 10) / 10;

  // Per-child details
  const childConsistencyDetails: ChildConsistencyDetail[] = consistencyRecords.map(c => {
    // Consistency score: penalise high unique staff count, reward key worker assignment
    let score = 100;
    if (c.uniqueStaffCount > 10) score -= 40;
    else if (c.uniqueStaffCount > 7) score -= 25;
    else if (c.uniqueStaffCount > 5) score -= 15;
    else if (c.uniqueStaffCount > 3) score -= 5;

    if (c.primaryKeyWorker.length === 0) score -= 20;
    if (c.secondaryKeyWorker.length === 0) score -= 10;

    if (c.staffContactCount < 10) score -= 10;

    score = Math.max(0, Math.min(100, score));

    return {
      childId: c.childId,
      primaryKeyWorker: c.primaryKeyWorker,
      secondaryKeyWorker: c.secondaryKeyWorker,
      staffContactCount: c.staffContactCount,
      uniqueStaffCount: c.uniqueStaffCount,
      consistencyScore: score,
    };
  });

  return {
    averageUniqueStaffPerChild,
    keyWorkerCoverage,
    secondaryKeyWorkerCoverage,
    averageContactsPerChild,
    childConsistencyDetails,
  };
}

// ── Core Function 4: Evaluate Rota Compliance ────────────────────────────

export function evaluateRotaCompliance(
  rotas: ShiftRota[],
  rotaPublishedDates: { weekStarting: string; publishedDate: string }[],
  periodStart: string,
  periodEnd: string,
): RotaComplianceResult {
  const periodRotas = rotas.filter(r => isInPeriod(r.date, periodStart, periodEnd));

  // Published on time: published at least 7 days before weekStarting
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const onTimeCount = rotaPublishedDates.filter(rp => {
    const weekStart = new Date(rp.weekStarting).getTime();
    const published = new Date(rp.publishedDate).getTime();
    return (weekStart - published) >= SEVEN_DAYS_MS;
  }).length;
  const rotaPublishedOnTimeRate = rate(onTimeCount, rotaPublishedDates.length);

  // Shift type distribution
  const shiftTypeDistribution: Record<ShiftType, number> = {
    morning: 0, afternoon: 0, evening: 0, waking_night: 0, sleep_in: 0, long_day: 0,
  };
  for (const r of periodRotas) {
    shiftTypeDistribution[r.shiftType]++;
  }

  // Long day compliance: long_day shifts that are filled
  const longDayShifts = periodRotas.filter(r => r.shiftType === "long_day");
  const longDayFilled = longDayShifts.filter(r => r.status !== "unfilled");
  const longDayComplianceRate = rateOf(longDayFilled, longDayShifts);

  // Night cover rate: waking_night + sleep_in shifts that are filled
  const nightShifts = periodRotas.filter(r => r.shiftType === "waking_night" || r.shiftType === "sleep_in");
  const nightFilled = nightShifts.filter(r => r.status !== "unfilled");
  const nightCoverRate = rateOf(nightFilled, nightShifts);

  return {
    rotaPublishedOnTimeRate,
    shiftTypeDistribution,
    longDayComplianceRate,
    nightCoverRate,
  };
}

// ── Core Function 5: Evaluate Incident Management ────────────────────────

export function evaluateIncidentManagement(
  incidents: StaffingIncident[],
  periodStart: string,
  periodEnd: string,
): IncidentManagementResult {
  const periodIncidents = incidents.filter(i => isInPeriod(i.date, periodStart, periodEnd));

  if (periodIncidents.length === 0) {
    return {
      totalIncidents: 0,
      incidentsByType: {},
      loneWorkingIncidents: 0,
      understaffedIncidents: 0,
      noSeniorIncidents: 0,
      unplannedAbsenceIncidents: 0,
      resolutionRate: null,
    };
  }

  const totalIncidents = periodIncidents.length;

  const incidentsByType: Record<string, number> = {};
  for (const inc of periodIncidents) {
    incidentsByType[inc.type] = (incidentsByType[inc.type] ?? 0) + 1;
  }

  const loneWorkingIncidents = periodIncidents.filter(i => i.type === "lone_working").length;
  const understaffedIncidents = periodIncidents.filter(i => i.type === "understaffed").length;
  const noSeniorIncidents = periodIncidents.filter(i => i.type === "no_senior_on_shift").length;
  const unplannedAbsenceIncidents = periodIncidents.filter(i => i.type === "unplanned_absence").length;

  const withResolution = periodIncidents.filter(i => i.resolution.length > 0);
  const resolutionRate = rate(withResolution.length, totalIncidents);

  return {
    totalIncidents,
    incidentsByType,
    loneWorkingIncidents,
    understaffedIncidents,
    noSeniorIncidents,
    unplannedAbsenceIncidents,
    resolutionRate,
  };
}

// ── Core Function 6: Generate Staff Deployment Intelligence ──────────────

export function generateStaffDeploymentIntelligence(
  staffMembers: StaffMember[],
  rotas: ShiftRota[],
  agencyUsages: AgencyUsage[],
  consistencyRecords: ConsistencyRecord[],
  incidents: StaffingIncident[],
  rotaPublishedDates: { weekStarting: string; publishedDate: string }[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): StaffDeploymentIntelligence {
  // Evaluate each component
  const staffingAdequacy = evaluateStaffingAdequacy(rotas, staffMembers, periodStart, periodEnd);
  const agencyMinimisation = evaluateAgencyMinimisation(agencyUsages, rotas, periodStart, periodEnd);
  const consistencyOfCare = evaluateConsistencyOfCare(consistencyRecords);
  const rotaCompliance = evaluateRotaCompliance(rotas, rotaPublishedDates, periodStart, periodEnd);
  const incidentManagement = evaluateIncidentManagement(incidents, periodStart, periodEnd);

  // Each sub-metric contributes its points to the denominator only when it was
  // actually measurable, so a domain with nothing recorded neither earns points
  // nor drags the home down — it is renormalised out of the overall score.
  let pointsAvailable = 0;
  const weigh = (measured: boolean, points: number): boolean => {
    if (measured) pointsAvailable += points;
    return measured;
  };

  // ── Score: Staffing Adequacy (0-25) ────────────────────────────────────
  let adequacyScore = 0;
  // Fill rate (up to 10 points)
  if (weigh(staffingAdequacy.fillRate !== null, 10)) {
    if (meets(staffingAdequacy.fillRate, 95)) adequacyScore += 10;
    else if (meets(staffingAdequacy.fillRate, 85)) adequacyScore += 7;
    else if (meets(staffingAdequacy.fillRate, 70)) adequacyScore += 4;
    else if (meets(staffingAdequacy.fillRate, 1)) adequacyScore += 2;
  }

  // Staff:child ratio — 0.5+ is good (up to 8 points)
  const staffChildRatio = staffingAdequacy.averageStaffChildRatio;
  if (weigh(staffChildRatio !== null, 8)) {
    if (meets(staffChildRatio, 0.5)) adequacyScore += 8;
    else if (meets(staffChildRatio, 0.4)) adequacyScore += 6;
    else if (meets(staffChildRatio, 0.3)) adequacyScore += 4;
    else if (staffChildRatio! > 0) adequacyScore += 2;
  }

  // Senior on shift (up to 7 points)
  if (weigh(staffingAdequacy.seniorOnShiftRate !== null, 7)) {
    if (meets(staffingAdequacy.seniorOnShiftRate, 90)) adequacyScore += 7;
    else if (meets(staffingAdequacy.seniorOnShiftRate, 75)) adequacyScore += 5;
    else if (meets(staffingAdequacy.seniorOnShiftRate, 50)) adequacyScore += 3;
    else if (meets(staffingAdequacy.seniorOnShiftRate, 1)) adequacyScore += 1;
  }

  // ── Score: Agency Minimisation (0-20) ──────────────────────────────────
  let agencyScore = 0;
  // Low agency usage rate (up to 8 points)
  const agencyUsage = agencyMinimisation.agencyUsageRate;
  if (weigh(agencyUsage !== null, 8)) {
    if (agencyUsage! <= 5) agencyScore += 8;
    else if (agencyUsage! <= 10) agencyScore += 6;
    else if (agencyUsage! <= 20) agencyScore += 4;
    else if (agencyUsage! <= 30) agencyScore += 2;
  }

  // Briefing completion (up to 6 points)
  if (weigh(agencyMinimisation.briefingCompletionRate !== null, 6)) {
    if (meets(agencyMinimisation.briefingCompletionRate, 95)) agencyScore += 6;
    else if (meets(agencyMinimisation.briefingCompletionRate, 80)) agencyScore += 4;
    else if (meets(agencyMinimisation.briefingCompletionRate, 60)) agencyScore += 2;
  }

  // Children known (up to 6 points)
  if (weigh(agencyMinimisation.childrenKnownRate !== null, 6)) {
    if (meets(agencyMinimisation.childrenKnownRate, 80)) agencyScore += 6;
    else if (meets(agencyMinimisation.childrenKnownRate, 60)) agencyScore += 4;
    else if (meets(agencyMinimisation.childrenKnownRate, 40)) agencyScore += 2;
  }

  // ── Score: Consistency of Care (0-25) ──────────────────────────────────
  let consistencyScore = 0;
  // Low unique staff per child (up to 10 points)
  if (weigh(consistencyOfCare.averageUniqueStaffPerChild !== null, 10)) {
    const unique = consistencyOfCare.averageUniqueStaffPerChild!;
    if (unique > 0 && unique <= 4) consistencyScore += 10;
    else if (unique > 0 && unique <= 6) consistencyScore += 7;
    else if (unique > 0 && unique <= 8) consistencyScore += 4;
    else if (unique > 0) consistencyScore += 2;
  }

  // Key worker coverage (up to 8 points)
  if (weigh(consistencyOfCare.keyWorkerCoverage !== null, 8)) {
    if (meets(consistencyOfCare.keyWorkerCoverage, 100)) consistencyScore += 8;
    else if (meets(consistencyOfCare.keyWorkerCoverage, 90)) consistencyScore += 6;
    else if (meets(consistencyOfCare.keyWorkerCoverage, 75)) consistencyScore += 4;
    else if (meets(consistencyOfCare.keyWorkerCoverage, 1)) consistencyScore += 2;
  }

  // Secondary key worker coverage (up to 7 points)
  if (weigh(consistencyOfCare.secondaryKeyWorkerCoverage !== null, 7)) {
    if (meets(consistencyOfCare.secondaryKeyWorkerCoverage, 100)) consistencyScore += 7;
    else if (meets(consistencyOfCare.secondaryKeyWorkerCoverage, 90)) consistencyScore += 5;
    else if (meets(consistencyOfCare.secondaryKeyWorkerCoverage, 75)) consistencyScore += 3;
    else if (meets(consistencyOfCare.secondaryKeyWorkerCoverage, 1)) consistencyScore += 1;
  }

  // ── Score: Rota Compliance (0-15) ──────────────────────────────────────
  let rotaScore = 0;
  // Published on time (up to 6 points)
  if (weigh(rotaCompliance.rotaPublishedOnTimeRate !== null, 6)) {
    if (meets(rotaCompliance.rotaPublishedOnTimeRate, 90)) rotaScore += 6;
    else if (meets(rotaCompliance.rotaPublishedOnTimeRate, 75)) rotaScore += 4;
    else if (meets(rotaCompliance.rotaPublishedOnTimeRate, 50)) rotaScore += 2;
  }

  // Night cover (up to 5 points)
  if (weigh(rotaCompliance.nightCoverRate !== null, 5)) {
    if (meets(rotaCompliance.nightCoverRate, 95)) rotaScore += 5;
    else if (meets(rotaCompliance.nightCoverRate, 80)) rotaScore += 3;
    else if (meets(rotaCompliance.nightCoverRate, 60)) rotaScore += 1;
  }

  // Long day compliance (up to 4 points)
  if (weigh(rotaCompliance.longDayComplianceRate !== null, 4)) {
    if (meets(rotaCompliance.longDayComplianceRate, 95)) rotaScore += 4;
    else if (meets(rotaCompliance.longDayComplianceRate, 80)) rotaScore += 3;
    else if (meets(rotaCompliance.longDayComplianceRate, 60)) rotaScore += 1;
  }

  // ── Score: Incident Management (0-15) ──────────────────────────────────
  // "No incidents" only counts in the home's favour when there was a rostered
  // period for incidents to occur in — otherwise it is silence, not safety.
  const hadPeriodActivity = staffingAdequacy.shiftsTotal > 0 || incidentManagement.totalIncidents > 0;
  let incidentScore = 0;
  // Low incident count (up to 7 points)
  if (weigh(hadPeriodActivity, 7)) {
    if (incidentManagement.totalIncidents === 0) incidentScore += 7;
    else if (incidentManagement.totalIncidents <= 2) incidentScore += 5;
    else if (incidentManagement.totalIncidents <= 5) incidentScore += 3;
    else if (incidentManagement.totalIncidents <= 10) incidentScore += 1;
  }

  // No lone working (up to 4 points)
  if (weigh(hadPeriodActivity, 4)) {
    if (incidentManagement.loneWorkingIncidents === 0) incidentScore += 4;
    else if (incidentManagement.loneWorkingIncidents <= 1) incidentScore += 2;
  }

  // Resolution rate (up to 4 points)
  if (weigh(incidentManagement.resolutionRate !== null, 4)) {
    if (meets(incidentManagement.resolutionRate, 95)) incidentScore += 4;
    else if (meets(incidentManagement.resolutionRate, 80)) incidentScore += 3;
    else if (meets(incidentManagement.resolutionRate, 60)) incidentScore += 2;
    else if (meets(incidentManagement.resolutionRate, 1)) incidentScore += 1;
  }

  const pointsEarned = adequacyScore + agencyScore + consistencyScore + rotaScore + incidentScore;
  const overallScore = rate(pointsEarned, pointsAvailable);

  // Rating
  let overallRating: OverallRating | "insufficient_data";
  if (overallScore === null) overallRating = "insufficient_data";
  else if (overallScore >= 80) overallRating = "outstanding";
  else if (overallScore >= 60) overallRating = "good";
  else if (overallScore >= 40) overallRating = "requires_improvement";
  else overallRating = "inadequate";

  // ── Strengths ───────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(staffingAdequacy.fillRate, 95))
    strengths.push("Excellent shift fill rate demonstrating robust staffing arrangements");
  if (agencyUsage !== null && agencyUsage <= 5)
    strengths.push("Minimal agency usage preserving consistency of care");
  if (agencyUsage !== null && agencyUsage <= 10 && meets(agencyMinimisation.briefingCompletionRate, 90))
    strengths.push("Agency staff consistently briefed prior to shifts");
  if (meets(consistencyOfCare.keyWorkerCoverage, 100))
    strengths.push("All children have an assigned primary key worker");
  if (consistencyOfCare.averageUniqueStaffPerChild !== null && consistencyOfCare.averageUniqueStaffPerChild > 0 && consistencyOfCare.averageUniqueStaffPerChild <= 4)
    strengths.push("Low turnover of staff around children promotes attachment and stability");
  if (meets(staffingAdequacy.seniorOnShiftRate, 90))
    strengths.push("Senior staff consistently present on shift providing leadership and oversight");
  if (hadPeriodActivity && incidentManagement.totalIncidents === 0)
    strengths.push("No staffing incidents recorded in the period");
  if (incidentManagement.loneWorkingIncidents === 0 && incidentManagement.totalIncidents > 0)
    strengths.push("No lone working incidents recorded");
  if (meets(rotaCompliance.rotaPublishedOnTimeRate, 90))
    strengths.push("Rotas consistently published on time supporting staff work-life balance");
  if (meets(rotaCompliance.nightCoverRate, 95))
    strengths.push("Night cover arrangements are robust and consistently maintained");

  // ── Areas for Improvement ───────────────────────────────────────────────
  const areasForImprovement: string[] = [];
  if (below(staffingAdequacy.fillRate, 85))
    areasForImprovement.push("Shift fill rate is below acceptable threshold — children may not always have sufficient staff");
  if (agencyUsage !== null && agencyUsage > 20)
    areasForImprovement.push("Over-reliance on agency staff undermines consistency and relationship-based care");
  if (below(agencyMinimisation.briefingCompletionRate, 80))
    areasForImprovement.push("Agency staff not consistently briefed about children's needs and risks");
  if (below(consistencyOfCare.keyWorkerCoverage, 100))
    areasForImprovement.push("Not all children have an assigned primary key worker");
  if (consistencyOfCare.averageUniqueStaffPerChild !== null && consistencyOfCare.averageUniqueStaffPerChild > 7)
    areasForImprovement.push("High number of unique staff members caring for each child reduces consistency");
  if (below(staffingAdequacy.seniorOnShiftRate, 75))
    areasForImprovement.push("Insufficient senior staff presence on shifts to provide guidance and oversight");
  if (incidentManagement.loneWorkingIncidents > 0)
    areasForImprovement.push("Lone working incidents require immediate review of staffing arrangements");
  if (below(rotaCompliance.rotaPublishedOnTimeRate, 75))
    areasForImprovement.push("Rotas not consistently published 7 days in advance");
  if (below(rotaCompliance.nightCoverRate, 80))
    areasForImprovement.push("Night cover arrangements have gaps that may compromise children's safety");
  if (below(incidentManagement.resolutionRate, 80))
    areasForImprovement.push("Staffing incidents not always resolved and documented promptly");
  if (staffingAdequacy.shiftsTotal === 0)
    areasForImprovement.push("No shifts recorded for the period — staffing sufficiency cannot be evidenced");
  if (consistencyOfCare.keyWorkerCoverage === null)
    areasForImprovement.push("No key worker records for the period — consistency of care cannot be evidenced");

  // ── Recommended Actions ─────────────────────────────────────────────────
  const recommendedActions: string[] = [];
  if (below(staffingAdequacy.fillRate, 90))
    recommendedActions.push("Review recruitment strategy to improve shift fill rate");
  if (agencyUsage !== null && agencyUsage > 15)
    recommendedActions.push("Develop agency reduction plan with targets and timescales");
  if (below(agencyMinimisation.briefingCompletionRate, 100))
    recommendedActions.push("Ensure all agency staff receive a full briefing before every shift");
  if (below(consistencyOfCare.keyWorkerCoverage, 100))
    recommendedActions.push("Assign primary key workers to all children without delay");
  if (below(consistencyOfCare.secondaryKeyWorkerCoverage, 100))
    recommendedActions.push("Assign secondary key workers to provide resilience in key worker arrangements");
  if (below(staffingAdequacy.seniorOnShiftRate, 80))
    recommendedActions.push("Adjust rota to ensure a senior member of staff is present on every shift");
  if (incidentManagement.loneWorkingIncidents > 0)
    recommendedActions.push("Conduct urgent lone working risk assessment and implement immediate mitigations");
  if (below(rotaCompliance.rotaPublishedOnTimeRate, 80))
    recommendedActions.push("Implement rota planning process to ensure 7-day advance publication");
  if (rotaCompliance.rotaPublishedOnTimeRate === null)
    recommendedActions.push("Record rota publication dates so advance-notice compliance can be evidenced");
  if (incidentManagement.noSeniorIncidents > 0)
    recommendedActions.push("Review and adjust rota to guarantee senior cover on all shifts");
  if (incidentManagement.understaffedIncidents > 2)
    recommendedActions.push("Investigate root causes of understaffing and develop contingency plan");

  // ── Regulatory Links ────────────────────────────────────────────────────
  const regulatoryLinks: RegulatoryLink[] = [
    {
      regulation: "CHR 2015 Reg 32",
      requirement: "Organisation of children's home — ensure sufficient staff at all times",
      status: staffingAdequacy.fillRate === null ? "not_evidenced"
        : meets(staffingAdequacy.fillRate, 90) && meets(staffingAdequacy.seniorOnShiftRate, 80) ? "met"
        : meets(staffingAdequacy.fillRate, 70) ? "partially_met" : "not_met",
      evidence: `Fill rate: ${formatRate(staffingAdequacy.fillRate, "not recorded")}. Senior on shift: ${formatRate(staffingAdequacy.seniorOnShiftRate, "not recorded")}. Staff:child ratio: ${staffingAdequacy.averageStaffChildRatio ?? "not recorded"}.`,
    },
    {
      regulation: "CHR 2015 Reg 33",
      requirement: "Employment of staff — competent staff, minimal agency reliance",
      status: agencyUsage === null ? "not_evidenced"
        : agencyUsage <= 10 && meets(agencyMinimisation.briefingCompletionRate, 90) ? "met"
        : agencyUsage <= 20 ? "partially_met" : "not_met",
      evidence: `Agency usage: ${formatRate(agencyUsage, "not recorded")}. Briefing rate: ${formatRate(agencyMinimisation.briefingCompletionRate, "no agency shifts")}.`,
    },
    {
      regulation: "Schedule 1 Standard 25",
      requirement: "Sufficient staff with the right skills, qualifications and experience",
      status: staffingAdequacy.fillRate === null ? "not_evidenced"
        : meets(staffingAdequacy.fillRate, 90) && meets(consistencyOfCare.keyWorkerCoverage, 90) ? "met"
        : meets(staffingAdequacy.fillRate, 70) ? "partially_met" : "not_met",
      evidence: `Fill rate: ${formatRate(staffingAdequacy.fillRate, "not recorded")}. Key worker coverage: ${formatRate(consistencyOfCare.keyWorkerCoverage, "not recorded")}.`,
    },
    {
      regulation: "SCCIF",
      requirement: "Leaders ensure staffing is sufficient and stable for children's needs",
      status: overallScore === null ? "not_evidenced"
        : meets(overallScore, 70) ? "met" : meets(overallScore, 50) ? "partially_met" : "not_met",
      evidence: `Overall deployment score: ${overallScore === null ? "not measurable" : `${overallScore}/100`} (${overallRating}).`,
    },
    {
      regulation: "Working Together 2023",
      requirement: "Organisations ensure sufficient trained staff to safeguard children",
      status: staffingAdequacy.fillRate === null ? "not_evidenced"
        : incidentManagement.loneWorkingIncidents === 0 && meets(staffingAdequacy.fillRate, 85) ? "met"
        : incidentManagement.loneWorkingIncidents <= 1 ? "partially_met" : "not_met",
      evidence: `Lone working incidents: ${incidentManagement.loneWorkingIncidents}. Fill rate: ${formatRate(staffingAdequacy.fillRate, "not recorded")}.`,
    },
  ];

  // ── Staff Profiles ──────────────────────────────────────────────────────
  const periodRotas = rotas.filter(r => isInPeriod(r.date, periodStart, periodEnd));
  const staffProfiles: StaffDeploymentProfile[] = staffMembers.map(sm => {
    const shiftsWorked = periodRotas.filter(r => r.actualStaff.includes(sm.id)).length;
    const isAgency = sm.contractType === "agency";
    const isBank = sm.contractType === "bank";

    const riskFlags: string[] = [];
    if (isAgency) riskFlags.push("Agency worker — continuity risk");
    if (isBank) riskFlags.push("Bank worker — limited availability");
    if (sm.keyChildren.length === 0 && !isAgency && !isBank)
      riskFlags.push("No key children assigned");
    if (shiftsWorked === 0) riskFlags.push("No shifts worked in period");

    return {
      staffId: sm.id,
      staffName: sm.name,
      role: sm.role,
      contractType: sm.contractType,
      keyChildrenCount: sm.keyChildren.length,
      shiftsWorked,
      isAgency,
      isBank,
      riskFlags,
    };
  });

  return {
    homeId,
    periodStart,
    periodEnd,
    generatedAt: referenceDate,
    overallScore,
    overallRating,
    componentScores: {
      staffingAdequacy: adequacyScore,
      agencyMinimisation: agencyScore,
      consistencyOfCare: consistencyScore,
      rotaCompliance: rotaScore,
      incidentManagement: incidentScore,
    },
    staffingAdequacy,
    agencyMinimisation,
    consistencyOfCare,
    rotaCompliance,
    incidentManagement,
    strengths,
    areasForImprovement,
    recommendedActions,
    regulatoryLinks,
    staffProfiles,
  };
}
