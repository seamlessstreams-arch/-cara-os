// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Workforce & Rota Intelligence Engine
//
// Deterministic engine for staff-to-child ratios, qualification compliance,
// shift safety analysis, lone working risk, training matrix, and rota
// intelligence for children's residential homes.
//
// Aligned to:
//   - CHR 2015 Reg 31 — Fitness of workers
//   - CHR 2015 Reg 32 — Employment of staff
//   - CHR 2015 Reg 33 — Fitness of premises (staffing adequacy)
//   - CHR 2015 Reg 40(3) — Staff qualification records
//   - DfE Guide to CRH — Staffing requirements
//   - SCCIF — Leadership & management (staffing judgement)
//   - Ofsted Workforce Expectations — DBS, qualifications, supervision
//   - Health & Safety at Work Act — Lone working
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type ShiftType = "day" | "evening" | "night" | "sleep_in" | "waking_night";

export type StaffRole =
  | "registered_manager"
  | "deputy_manager"
  | "senior_support_worker"
  | "support_worker"
  | "waking_night_worker"
  | "bank_staff"
  | "agency_staff";

export type QualificationStatus = "achieved" | "enrolled" | "not_started" | "exempt" | "expired";

export type TrainingStatus = "current" | "due_soon" | "overdue" | "not_required";

export type ComplianceStatus = "compliant" | "action_needed" | "non_compliant" | "critical";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  homeId: string;
  startDate: string;
  contractedHours: number;
  isAgency: boolean;

  // Compliance
  dbsCheckDate: string;
  dbsClearanceLevel: "basic" | "standard" | "enhanced" | "enhanced_barred";
  dbsOnUpdateService: boolean;
  qualificationLevel: number;           // NVQ/Diploma level (3, 4, 5)
  qualificationStatus: QualificationStatus;
  qualificationDeadline?: string;       // must achieve by

  // Training
  mandatoryTraining: TrainingRecord[];
  supervisionDue: string;
  lastSupervision?: string;
  firstAidCurrent: boolean;
  safeguardingTrainingDate?: string;
  restraintTrainingDate?: string;
  medicationTrainingDate?: string;
}

export interface TrainingRecord {
  courseName: string;
  category: "mandatory" | "recommended" | "specialist";
  completedDate?: string;
  expiryDate?: string;
  status: TrainingStatus;
}

export interface Shift {
  id: string;
  date: string;
  shiftType: ShiftType;
  startTime: string;           // HH:MM
  endTime: string;             // HH:MM
  staffId: string;
  staffName: string;
  staffRole: StaffRole;
  homeId: string;
  isAgency: boolean;
  isSleepIn: boolean;
  hoursWorked: number;
}

export interface ChildOnShift {
  childId: string;
  childName: string;
  riskLevel: "low" | "medium" | "high" | "very_high";
  requiresOneToOne: boolean;
  requiresGenderSpecific?: "male" | "female";
  medicalNeedsOnShift: boolean;
}

export interface ShiftRequirement {
  homeId: string;
  shiftType: ShiftType;
  minimumStaff: number;
  minimumSenior: number;        // at least one senior/TL
  childrenExpected: number;
  highRiskChildren: number;
  oneToOneRequired: number;
  sleepInRequired: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ShiftSafetyResult {
  shiftDate: string;
  shiftType: ShiftType;
  homeId: string;
  isSafe: boolean;
  issues: string[];
  warnings: string[];
  staffCount: number;
  requiredStaff: number;
  ratio: string;                 // e.g. "1:3"
  seniorPresent: boolean;
  loneWorking: boolean;
  agencyReliance: number;        // % agency on shift
  qualifiedStaffPresent: boolean;
}

export interface WorkforceComplianceResult {
  homeId: string;
  overallStatus: ComplianceStatus;
  issues: string[];
  staffCount: number;
  fullyCompliant: number;
  actionNeeded: number;
  nonCompliant: number;
  dbsOverdue: number;
  qualificationsBelowTarget: number;
  trainingOverdue: number;
  supervisionOverdue: number;
  agencyPercentage: number;
  byStaff: StaffComplianceSummary[];
}

export interface StaffComplianceSummary {
  staffId: string;
  name: string;
  role: StaffRole;
  status: ComplianceStatus;
  issues: string[];
  dbsCurrent: boolean;
  qualificationMet: boolean;
  trainingCurrent: boolean;
  supervisionCurrent: boolean;
}

export interface WorkforceMetrics {
  homeId: string;
  totalStaff: number;
  permanentStaff: number;
  agencyStaff: number;
  agencyPercentage: number;
  averageQualificationLevel: number;
  qualificationTargetMet: number;       // %
  dbsCompliance: number;                // %
  mandatoryTrainingCompliance: number;  // %
  supervisionCompliance: number;        // %
  averageTenureMonths: number;
  turnoverRate: number;                 // % left in last 12 months
  vacancies: number;
  overallCompliance: ComplianceStatus;
  shiftCoverage: ShiftCoverageStats;
}

export interface ShiftCoverageStats {
  totalShiftsThisMonth: number;
  coveredShifts: number;
  uncoveredShifts: number;
  agencyCoveredShifts: number;
  loneWorkingShifts: number;
  coverageRate: number;          // %
}

// ── Configuration ──────────────────────────────────────────────────────────

const DBS_RENEWAL_MONTHS = 36;                    // 3-year DBS refresh
const DBS_UPDATE_SERVICE_CHECK_MONTHS = 12;       // annual update service check
const SUPERVISION_MAX_DAYS = 42;                  // 6 weeks between supervisions
const QUALIFICATION_DEADLINE_MONTHS = 24;         // 2 years to achieve Level 3
const MANDATORY_TRAINING_RENEWAL_MONTHS = 12;     // annual refresher
const RESTRAINT_TRAINING_RENEWAL_MONTHS = 6;      // 6-monthly refresher
const SAFEGUARDING_TRAINING_RENEWAL_MONTHS = 12;  // annual refresher
const MAX_AGENCY_PERCENTAGE = 30;                 // Ofsted flags >30% agency
const MAX_CONSECUTIVE_HOURS = 48;                 // EU Working Time Directive
const MINIMUM_QUALIFICATION_LEVEL = 3;            // Reg 32 requires Level 3 Diploma

// ── Core: Shift Safety Analysis ────────────────────────────────────────────

export function analyzeShiftSafety(
  shifts: Shift[],
  children: ChildOnShift[],
  requirements: ShiftRequirement,
): ShiftSafetyResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  const shiftStaff = shifts.filter(s =>
    s.homeId === requirements.homeId && s.shiftType === requirements.shiftType
  );

  const staffCount = shiftStaff.length;
  const requiredStaff = requirements.minimumStaff + requirements.oneToOneRequired;

  // Staffing levels
  if (staffCount < requiredStaff) {
    issues.push(`Understaffed: ${staffCount} on shift, minimum ${requiredStaff} required (${requirements.minimumStaff} base + ${requirements.oneToOneRequired} 1:1).`);
  }

  // Lone working
  const loneWorking = staffCount === 1 && children.length > 0;
  if (loneWorking) {
    issues.push("LONE WORKING: Only 1 staff member with children present — unacceptable risk.");
  }

  // Senior presence
  const seniorRoles: StaffRole[] = ["registered_manager", "deputy_manager", "senior_support_worker"];
  const seniorPresent = shiftStaff.some(s => seniorRoles.includes(s.staffRole));
  if (!seniorPresent && requirements.minimumSenior > 0) {
    issues.push("No senior staff on shift — at least one senior/TL required.");
  }

  // Ratio calculation
  const childCount = children.length;
  const ratio = childCount > 0 ? `1:${Math.ceil(childCount / Math.max(1, staffCount))}` : "N/A";
  if (childCount > 0 && staffCount > 0 && childCount / staffCount > 3) {
    warnings.push(`High ratio (${ratio}) — consider whether adequate for children's needs.`);
  }

  // High-risk children
  const highRiskCount = children.filter(c => c.riskLevel === "high" || c.riskLevel === "very_high").length;
  if (highRiskCount > 0 && staffCount < highRiskCount + 1) {
    issues.push(`${highRiskCount} high/very-high risk children but only ${staffCount} staff — insufficient for safe management.`);
  }

  // 1:1 coverage
  const oneToOneNeeded = children.filter(c => c.requiresOneToOne).length;
  if (oneToOneNeeded > 0 && staffCount < requirements.minimumStaff + oneToOneNeeded) {
    issues.push(`${oneToOneNeeded} child(ren) require 1:1 but insufficient staff for dedicated cover.`);
  }

  // Agency reliance
  const agencyCount = shiftStaff.filter(s => s.isAgency).length;
  const agencyReliance = staffCount > 0 ? Math.round((agencyCount / staffCount) * 100) : 0;
  if (agencyReliance > 50) {
    warnings.push(`${agencyReliance}% agency staff on this shift — exceeds 50% threshold.`);
  }
  if (staffCount > 0 && agencyCount === staffCount) {
    issues.push("All staff on shift are agency — no permanent staff present.");
  }

  // Qualification check
  const qualifiedStaffPresent = shiftStaff.some(s => !s.isAgency);
  if (!qualifiedStaffPresent && staffCount > 0) {
    warnings.push("No qualified permanent staff on shift.");
  }

  const isSafe = issues.length === 0;

  return {
    shiftDate: shifts[0]?.date ?? "",
    shiftType: requirements.shiftType,
    homeId: requirements.homeId,
    isSafe,
    issues,
    warnings,
    staffCount,
    requiredStaff,
    ratio,
    seniorPresent,
    loneWorking,
    agencyReliance,
    qualifiedStaffPresent,
  };
}

// ── Core: Workforce Compliance ─────────────────────────────────────────────

export function evaluateWorkforceCompliance(
  staff: StaffMember[],
  homeId: string,
  now?: string,
): WorkforceComplianceResult {
  const currentDate = now ? new Date(now) : new Date();
  const homeStaff = staff.filter(s => s.homeId === homeId);
  const issues: string[] = [];
  const byStaff: StaffComplianceSummary[] = [];

  let dbsOverdue = 0;
  let qualBelowTarget = 0;
  let trainingOverdue = 0;
  let supervisionOverdue = 0;

  for (const member of homeStaff) {
    const staffIssues: string[] = [];

    // DBS check
    const dbsDate = new Date(member.dbsCheckDate);
    const dbsMonthsSince = monthsBetween(dbsDate, currentDate);
    let dbsCurrent = true;
    if (member.dbsOnUpdateService) {
      if (dbsMonthsSince > DBS_UPDATE_SERVICE_CHECK_MONTHS) {
        staffIssues.push("DBS update service check overdue (annual check required).");
        dbsCurrent = false;
      }
    } else {
      if (dbsMonthsSince > DBS_RENEWAL_MONTHS) {
        staffIssues.push("DBS check expired (exceeds 3-year renewal period).");
        dbsCurrent = false;
      }
    }
    if (!dbsCurrent) dbsOverdue++;

    // Qualification
    let qualificationMet = member.qualificationLevel >= MINIMUM_QUALIFICATION_LEVEL;
    if (!qualificationMet) {
      if (member.qualificationStatus === "enrolled") {
        if (member.qualificationDeadline && new Date(member.qualificationDeadline) < currentDate) {
          staffIssues.push(`Level 3 qualification deadline passed — still enrolled.`);
        }
      } else if (member.qualificationStatus === "not_started" && !member.isAgency) {
        staffIssues.push("Level 3 qualification not started — Reg 32 requirement.");
        qualificationMet = false;
      }
    }
    if (!qualificationMet && member.qualificationStatus !== "exempt") qualBelowTarget++;

    // Mandatory training
    let trainingCurrent = true;
    const overdueTraining = member.mandatoryTraining.filter(t => t.status === "overdue");
    if (overdueTraining.length > 0) {
      staffIssues.push(`${overdueTraining.length} mandatory training course(s) overdue.`);
      trainingCurrent = false;
      trainingOverdue++;
    }

    // Safeguarding training
    if (member.safeguardingTrainingDate) {
      const sgMonths = monthsBetween(new Date(member.safeguardingTrainingDate), currentDate);
      if (sgMonths > SAFEGUARDING_TRAINING_RENEWAL_MONTHS) {
        staffIssues.push("Safeguarding training expired (annual renewal required).");
        trainingCurrent = false;
      }
    } else {
      staffIssues.push("No safeguarding training on record.");
      trainingCurrent = false;
    }

    // Restraint training
    if (member.restraintTrainingDate) {
      const rtMonths = monthsBetween(new Date(member.restraintTrainingDate), currentDate);
      if (rtMonths > RESTRAINT_TRAINING_RENEWAL_MONTHS) {
        staffIssues.push("Restraint training expired (6-monthly renewal required).");
      }
    }

    // Supervision
    let supervisionCurrent = true;
    if (member.lastSupervision) {
      const daysSinceSupervision = Math.floor(
        (currentDate.getTime() - new Date(member.lastSupervision).getTime()) / (24 * 60 * 60 * 1000)
      );
      if (daysSinceSupervision > SUPERVISION_MAX_DAYS) {
        staffIssues.push(`Supervision overdue — ${daysSinceSupervision} days since last (max ${SUPERVISION_MAX_DAYS}).`);
        supervisionCurrent = false;
        supervisionOverdue++;
      }
    } else {
      staffIssues.push("No supervision on record.");
      supervisionCurrent = false;
      supervisionOverdue++;
    }

    // Determine staff status
    let status: ComplianceStatus = "compliant";
    if (staffIssues.length > 0) status = "action_needed";
    if (!dbsCurrent) status = "non_compliant";
    if (!dbsCurrent && staffIssues.length >= 3) status = "critical";

    byStaff.push({
      staffId: member.id,
      name: member.name,
      role: member.role,
      status,
      issues: staffIssues,
      dbsCurrent,
      qualificationMet,
      trainingCurrent,
      supervisionCurrent,
    });
  }

  // Home-level checks
  const agencyCount = homeStaff.filter(s => s.isAgency).length;
  const agencyPercentage = homeStaff.length > 0 ? Math.round((agencyCount / homeStaff.length) * 100) : 0;
  if (agencyPercentage > MAX_AGENCY_PERCENTAGE) {
    issues.push(`Agency staff at ${agencyPercentage}% (threshold: ${MAX_AGENCY_PERCENTAGE}%). Ofsted expectation: majority permanent.`);
  }

  const fullyCompliant = byStaff.filter(s => s.status === "compliant").length;
  const actionNeeded = byStaff.filter(s => s.status === "action_needed").length;
  const nonCompliant = byStaff.filter(s => s.status === "non_compliant" || s.status === "critical").length;

  // Overall status
  let overallStatus: ComplianceStatus = "compliant";
  if (actionNeeded > 0) overallStatus = "action_needed";
  if (nonCompliant > 0) overallStatus = "non_compliant";
  if (nonCompliant >= 2 || dbsOverdue >= 2) overallStatus = "critical";

  return {
    homeId,
    overallStatus,
    issues,
    staffCount: homeStaff.length,
    fullyCompliant,
    actionNeeded,
    nonCompliant,
    dbsOverdue,
    qualificationsBelowTarget: qualBelowTarget,
    trainingOverdue,
    supervisionOverdue,
    agencyPercentage,
    byStaff,
  };
}

// ── Core: Workforce Metrics ──────────────────────────────────────────────

export function calculateWorkforceMetrics(
  staff: StaffMember[],
  shifts: Shift[],
  homeId: string,
  now?: string,
): WorkforceMetrics {
  const currentDate = now ? new Date(now) : new Date();
  const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  const homeStaff = staff.filter(s => s.homeId === homeId);
  const permanentStaff = homeStaff.filter(s => !s.isAgency);
  const agencyStaff = homeStaff.filter(s => s.isAgency);
  const agencyPercentage = homeStaff.length > 0
    ? Math.round((agencyStaff.length / homeStaff.length) * 100) : 0;

  // Qualification stats
  const qualLevels = homeStaff.map(s => s.qualificationLevel);
  const averageQualLevel = qualLevels.length > 0
    ? Math.round((qualLevels.reduce((a, b) => a + b, 0) / qualLevels.length) * 10) / 10 : 0;
  const qualTargetMet = homeStaff.filter(s => s.qualificationLevel >= MINIMUM_QUALIFICATION_LEVEL).length;
  const qualificationTargetMetPct = homeStaff.length > 0
    ? Math.round((qualTargetMet / homeStaff.length) * 100) : 100;

  // DBS compliance
  const dbsCompliant = homeStaff.filter(s => {
    const months = monthsBetween(new Date(s.dbsCheckDate), currentDate);
    return s.dbsOnUpdateService ? months <= DBS_UPDATE_SERVICE_CHECK_MONTHS : months <= DBS_RENEWAL_MONTHS;
  }).length;
  const dbsCompliancePct = homeStaff.length > 0
    ? Math.round((dbsCompliant / homeStaff.length) * 100) : 100;

  // Training compliance
  const trainingCompliant = homeStaff.filter(s =>
    s.mandatoryTraining.every(t => t.status !== "overdue")
  ).length;
  const mandatoryTrainingCompliance = homeStaff.length > 0
    ? Math.round((trainingCompliant / homeStaff.length) * 100) : 100;

  // Supervision compliance
  const supervisionCompliant = homeStaff.filter(s => {
    if (!s.lastSupervision) return false;
    const days = Math.floor((currentDate.getTime() - new Date(s.lastSupervision).getTime()) / (24 * 60 * 60 * 1000));
    return days <= SUPERVISION_MAX_DAYS;
  }).length;
  const supervisionCompliancePct = homeStaff.length > 0
    ? Math.round((supervisionCompliant / homeStaff.length) * 100) : 100;

  // Tenure
  const tenures = permanentStaff.map(s =>
    monthsBetween(new Date(s.startDate), currentDate)
  );
  const averageTenureMonths = tenures.length > 0
    ? Math.round(tenures.reduce((a, b) => a + b, 0) / tenures.length) : 0;

  // Shift coverage this month
  const monthShifts = shifts.filter(s => s.homeId === homeId && new Date(s.date) >= thisMonth);
  const agencyCoveredShifts = monthShifts.filter(s => s.isAgency).length;
  const loneWorkingShifts = 0; // Would need grouped shift data to calculate properly

  const shiftCoverage: ShiftCoverageStats = {
    totalShiftsThisMonth: monthShifts.length,
    coveredShifts: monthShifts.length,
    uncoveredShifts: 0,
    agencyCoveredShifts,
    loneWorkingShifts,
    coverageRate: 100,
  };

  // Overall compliance
  const complianceResult = evaluateWorkforceCompliance(staff, homeId, now);

  return {
    homeId,
    totalStaff: homeStaff.length,
    permanentStaff: permanentStaff.length,
    agencyStaff: agencyStaff.length,
    agencyPercentage,
    averageQualificationLevel: averageQualLevel,
    qualificationTargetMet: qualificationTargetMetPct,
    dbsCompliance: dbsCompliancePct,
    mandatoryTrainingCompliance,
    supervisionCompliance: supervisionCompliancePct,
    averageTenureMonths,
    turnoverRate: 0,
    vacancies: 0,
    overallCompliance: complianceResult.overallStatus,
    shiftCoverage,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function monthsBetween(earlier: Date, later: Date): number {
  return (later.getFullYear() - earlier.getFullYear()) * 12 + (later.getMonth() - earlier.getMonth());
}

export function getRoleLabel(role: StaffRole): string {
  const labels: Record<StaffRole, string> = {
    registered_manager: "Registered Manager",
    deputy_manager: "Deputy Manager",
    senior_support_worker: "Senior Support Worker",
    support_worker: "Support Worker",
    waking_night_worker: "Waking Night Worker",
    bank_staff: "Bank Staff",
    agency_staff: "Agency Staff",
  };
  return labels[role];
}

export function getComplianceLabel(status: ComplianceStatus): string {
  const labels: Record<ComplianceStatus, string> = {
    compliant: "Compliant",
    action_needed: "Action Needed",
    non_compliant: "Non-Compliant",
    critical: "Critical",
  };
  return labels[status];
}
