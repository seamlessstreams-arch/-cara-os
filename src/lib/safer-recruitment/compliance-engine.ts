// ══════════════════════════════════════════════════════════════════════════════
// Cara Safer Recruitment — Compliance Engine
//
// Deterministic engine for tracking recruitment compliance against CHR 2015
// Regulation 34 (Fitness of workers) and Schedule 2 requirements.
//
// Every person working in a children's home must have completed:
//   - Enhanced DBS with barred list check
//   - Two satisfactory references (one from most recent employer)
//   - Full employment history with gaps explained
//   - Proof of identity (passport, birth certificate, driving licence)
//   - Proof of right to work
//   - Health declaration
//   - Qualification verification
//   - Interview assessment
//   - Risk assessment (if any concerns)
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import type { Role } from "../permissions/types";
import { rate } from "../metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type RecruitmentStage =
  | "vacancy_posted"
  | "application_received"
  | "shortlisted"
  | "interview_scheduled"
  | "interview_completed"
  | "conditional_offer"
  | "pre_start_checks"
  | "final_clearance"
  | "onboarding"
  | "appointed"
  | "withdrawn"
  | "rejected";

export type CheckType =
  | "enhanced_dbs"
  | "barred_list"
  | "reference_1"
  | "reference_2"
  | "employment_history"
  | "identity_proof"
  | "right_to_work"
  | "health_declaration"
  | "qualification_verification"
  | "interview_assessment"
  | "overseas_police_check"
  | "prohibition_check"     // teaching prohibition
  | "disqualification_check"
  | "driving_licence"       // if driving role
  | "risk_assessment";

export type CheckStatus =
  | "not_started"
  | "requested"
  | "received"
  | "satisfactory"
  | "unsatisfactory"
  | "concerns_noted"
  | "expired"
  | "waived";              // only with RM sign-off and documented reason

export type ComplianceSeverity = "blocker" | "warning" | "info";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface CandidateChecklist {
  candidateId: string;
  candidateName: string;
  role: string;
  stage: RecruitmentStage;
  checks: RecruitmentCheck[];
  gapsExplained: boolean;
  interviewDate?: string;
  offerDate?: string;
  startDate?: string;
  homeId: string;
}

export interface RecruitmentCheck {
  type: CheckType;
  status: CheckStatus;
  requestedAt?: string;
  receivedAt?: string;
  expiresAt?: string;
  verifiedBy?: string;
  notes?: string;
  documentRef?: string;
  waiverReason?: string;
  waiverApprovedBy?: string;
}

export interface ComplianceIssue {
  severity: ComplianceSeverity;
  code: string;
  message: string;
  checkType?: CheckType;
  recommendation: string;
  regulationRef: string;
}

export interface ComplianceResult {
  candidateId: string;
  stage: RecruitmentStage;
  isCompliant: boolean;
  canProgress: boolean;
  canStart: boolean;
  issues: ComplianceIssue[];
  completedChecks: number;
  totalRequired: number;
  completionPercentage: number | null;
  nextActions: string[];
  reg34Compliant: boolean;
  schedule2Complete: boolean;
}

// ── Required Checks Configuration ─────────────────────────────────────────

const ALWAYS_REQUIRED: CheckType[] = [
  "enhanced_dbs",
  "barred_list",
  "reference_1",
  "reference_2",
  "employment_history",
  "identity_proof",
  "right_to_work",
  "health_declaration",
  "interview_assessment",
];

const CONDITIONAL_CHECKS: { check: CheckType; condition: string }[] = [
  { check: "overseas_police_check", condition: "lived_overseas_12_months" },
  { check: "prohibition_check", condition: "teaching_role" },
  { check: "disqualification_check", condition: "early_years_role" },
  { check: "driving_licence", condition: "driving_required" },
  { check: "qualification_verification", condition: "qualifications_required" },
];

// Checks that must be complete BEFORE start date
const PRE_START_MANDATORY: CheckType[] = [
  "enhanced_dbs",
  "barred_list",
  "reference_1",
  "reference_2",
  "identity_proof",
  "right_to_work",
  "health_declaration",
];

// ── Core: Evaluate Compliance ──────────────────────────────────────────────

export function evaluateCompliance(
  checklist: CandidateChecklist,
  conditions: string[] = [],
): ComplianceResult {
  const issues: ComplianceIssue[] = [];
  const nextActions: string[] = [];

  // Determine required checks based on conditions
  const requiredChecks = getRequiredChecks(conditions);

  // Evaluate each required check
  let completedCount = 0;
  for (const checkType of requiredChecks) {
    const check = checklist.checks.find(c => c.type === checkType);

    if (!check || check.status === "not_started") {
      const issue = buildIssue(checkType, "not_started", checklist.stage);
      if (issue) issues.push(issue);
      nextActions.push(`Initiate ${formatCheckName(checkType)}`);
    } else if (check.status === "requested") {
      if (isPreStartMandatory(checkType) && isNearStart(checklist.startDate)) {
        issues.push({
          severity: "warning",
          code: `${checkType.toUpperCase()}_PENDING`,
          message: `${formatCheckName(checkType)} has been requested but not yet received.`,
          checkType,
          recommendation: `Chase ${formatCheckName(checkType)} — start date approaching.`,
          regulationRef: "Schedule 2, CHR 2015",
        });
      }
      nextActions.push(`Chase ${formatCheckName(checkType)}`);
    } else if (check.status === "satisfactory" || check.status === "waived") {
      completedCount++;
    } else if (check.status === "received") {
      // Received but not yet verified
      completedCount++; // count as partial
      nextActions.push(`Verify ${formatCheckName(checkType)}`);
    } else if (check.status === "unsatisfactory") {
      issues.push({
        severity: "blocker",
        code: `${checkType.toUpperCase()}_UNSATISFACTORY`,
        message: `${formatCheckName(checkType)} returned unsatisfactory result.`,
        checkType,
        recommendation: "Conduct risk assessment before proceeding. Consider withdrawing offer.",
        regulationRef: "Reg 34(1), CHR 2015",
      });
    } else if (check.status === "concerns_noted") {
      issues.push({
        severity: "warning",
        code: `${checkType.toUpperCase()}_CONCERNS`,
        message: `${formatCheckName(checkType)} has concerns noted.`,
        checkType,
        recommendation: "Complete risk assessment. Document decision to proceed or withdraw.",
        regulationRef: "Reg 34(1), CHR 2015",
      });
      if (!checklist.checks.find(c => c.type === "risk_assessment" && c.status === "satisfactory")) {
        nextActions.push("Complete risk assessment for noted concerns");
      }
    } else if (check.status === "expired") {
      issues.push({
        severity: "blocker",
        code: `${checkType.toUpperCase()}_EXPIRED`,
        message: `${formatCheckName(checkType)} has expired and must be renewed.`,
        checkType,
        recommendation: `Request updated ${formatCheckName(checkType)}.`,
        regulationRef: "Schedule 2, CHR 2015",
      });
      nextActions.push(`Renew expired ${formatCheckName(checkType)}`);
    }
  }

  // Employment history gaps
  if (!checklist.gapsExplained) {
    issues.push({
      severity: isAdvancedStage(checklist.stage) ? "blocker" : "warning",
      code: "GAPS_UNEXPLAINED",
      message: "Employment history has unexplained gaps.",
      recommendation: "Obtain written explanation for all gaps in employment history.",
      regulationRef: "Schedule 2(3), CHR 2015",
    });
    nextActions.push("Obtain gap explanations from candidate");
  }

  // Determine overall compliance status
  const blockers = issues.filter(i => i.severity === "blocker");
  const canProgress = blockers.length === 0;
  const canStart = canStartWork(checklist, requiredChecks);
  const reg34Compliant = blockers.length === 0 && checklist.gapsExplained;
  const schedule2Complete = completedCount >= requiredChecks.length;

  return {
    candidateId: checklist.candidateId,
    stage: checklist.stage,
    isCompliant: issues.length === 0,
    canProgress,
    canStart,
    issues,
    completedChecks: completedCount,
    totalRequired: requiredChecks.length,
    completionPercentage: rate(completedCount, requiredChecks.length),
    nextActions,
    reg34Compliant,
    schedule2Complete,
  };
}

// ── Core: Check Start Date Readiness ───────────────────────────────────────

export function checkStartReadiness(
  checklist: CandidateChecklist,
  conditions: string[] = [],
): { ready: boolean; blockers: string[]; warnings: string[] } {
  const blockers: string[] = [];
  const warnings: string[] = [];

  for (const checkType of PRE_START_MANDATORY) {
    const check = checklist.checks.find(c => c.type === checkType);
    if (!check || !["satisfactory", "received", "waived"].includes(check.status)) {
      blockers.push(`${formatCheckName(checkType)} not complete — cannot start.`);
    }
  }

  // Employment history
  if (!checklist.gapsExplained) {
    blockers.push("Employment history gaps not explained — cannot start.");
  }

  // Conditional checks that are also pre-start
  if (conditions.includes("lived_overseas_12_months")) {
    const overseas = checklist.checks.find(c => c.type === "overseas_police_check");
    if (!overseas || !["satisfactory", "received", "waived"].includes(overseas.status)) {
      blockers.push("Overseas police check not complete — cannot start.");
    }
  }

  // DBS update service check
  const dbs = checklist.checks.find(c => c.type === "enhanced_dbs");
  if (dbs?.expiresAt && new Date(dbs.expiresAt) < new Date()) {
    blockers.push("DBS check has expired — must be renewed before start.");
  }

  // Warnings for non-blocking incomplete checks
  const qualCheck = checklist.checks.find(c => c.type === "qualification_verification");
  if (conditions.includes("qualifications_required") && (!qualCheck || qualCheck.status !== "satisfactory")) {
    warnings.push("Qualification verification pending — can start but must be completed within probation.");
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
  };
}

// ── Core: Calculate Pipeline Metrics ───────────────────────────────────────

export interface PipelineMetrics {
  totalCandidates: number;
  byStage: Record<RecruitmentStage, number>;
  averageTimeToHire: number | null;  // days; null = nobody appointed yet
  blockedCount: number;
  clearanceRate: number | null;      // % reaching appointed; null = nobody in the pipeline
  overdueChecks: number;
  expiringChecks: number;          // within 30 days
}

export function calculatePipelineMetrics(
  candidates: CandidateChecklist[],
  now?: string,
): PipelineMetrics {
  const currentDate = now ? new Date(now) : new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const byStage: Record<RecruitmentStage, number> = {
    vacancy_posted: 0,
    application_received: 0,
    shortlisted: 0,
    interview_scheduled: 0,
    interview_completed: 0,
    conditional_offer: 0,
    pre_start_checks: 0,
    final_clearance: 0,
    onboarding: 0,
    appointed: 0,
    withdrawn: 0,
    rejected: 0,
  };

  let blockedCount = 0;
  let overdueChecks = 0;
  let expiringChecks = 0;
  let totalDaysToHire = 0;
  let appointedCount = 0;

  for (const candidate of candidates) {
    byStage[candidate.stage]++;

    // Check for blocks
    const compliance = evaluateCompliance(candidate);
    if (!compliance.canProgress && isActiveStage(candidate.stage)) {
      blockedCount++;
    }

    // Check for overdue/expiring checks
    for (const check of candidate.checks) {
      if (check.status === "requested" && check.requestedAt) {
        const requestedDate = new Date(check.requestedAt);
        const daysSinceRequest = (currentDate.getTime() - requestedDate.getTime()) / (24 * 60 * 60 * 1000);
        if (daysSinceRequest > 14) overdueChecks++;
      }
      if (check.expiresAt) {
        const expiryDate = new Date(check.expiresAt);
        const daysUntilExpiry = (expiryDate.getTime() - currentDate.getTime());
        if (daysUntilExpiry > 0 && daysUntilExpiry < thirtyDaysMs) expiringChecks++;
        if (daysUntilExpiry <= 0) overdueChecks++;
      }
    }

    // Time to hire
    if (candidate.stage === "appointed" && candidate.offerDate && candidate.startDate) {
      const offerDate = new Date(candidate.offerDate);
      const startDate = new Date(candidate.startDate);
      totalDaysToHire += (startDate.getTime() - offerDate.getTime()) / (24 * 60 * 60 * 1000);
      appointedCount++;
    }
  }

  const activeCandidates = candidates.filter(c => isActiveStage(c.stage)).length;
  const clearanceRate = rate(appointedCount, activeCandidates + appointedCount);

  return {
    totalCandidates: candidates.length,
    byStage,
    averageTimeToHire: appointedCount > 0 ? Math.round(totalDaysToHire / appointedCount) : null,
    blockedCount,
    clearanceRate,
    overdueChecks,
    expiringChecks,
  };
}

// ── Core: DBS Renewal Tracker ──────────────────────────────────────────────

export interface DBSRenewalItem {
  staffId: string;
  staffName: string;
  homeId: string;
  dbsNumber: string;
  issuedAt: string;
  expiresAt: string;
  daysUntilExpiry: number;
  status: "valid" | "expiring_soon" | "expired";
  onUpdateService: boolean;
}

export function checkDBSRenewals(
  staff: { id: string; name: string; homeId: string; dbs: RecruitmentCheck }[],
  now?: string,
): DBSRenewalItem[] {
  const currentDate = now ? new Date(now) : new Date();

  return staff
    .filter(s => s.dbs.expiresAt)
    .map(s => {
      const expiryDate = new Date(s.dbs.expiresAt!);
      const daysUntilExpiry = Math.floor(
        (expiryDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000),
      );

      let status: "valid" | "expiring_soon" | "expired";
      if (daysUntilExpiry <= 0) status = "expired";
      else if (daysUntilExpiry <= 60) status = "expiring_soon";
      else status = "valid";

      return {
        staffId: s.id,
        staffName: s.name,
        homeId: s.homeId,
        dbsNumber: s.dbs.documentRef ?? "",
        issuedAt: s.dbs.receivedAt ?? "",
        expiresAt: s.dbs.expiresAt!,
        daysUntilExpiry,
        status,
        onUpdateService: s.dbs.notes?.includes("update_service") ?? false,
      };
    })
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getRequiredChecks(conditions: string[]): CheckType[] {
  const required = [...ALWAYS_REQUIRED];

  for (const { check, condition } of CONDITIONAL_CHECKS) {
    if (conditions.includes(condition)) {
      required.push(check);
    }
  }

  return required;
}

function isPreStartMandatory(checkType: CheckType): boolean {
  return PRE_START_MANDATORY.includes(checkType);
}

function isNearStart(startDate?: string): boolean {
  if (!startDate) return false;
  const start = new Date(startDate);
  const now = new Date();
  const daysUntilStart = (start.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
  return daysUntilStart <= 14;
}

function isAdvancedStage(stage: RecruitmentStage): boolean {
  return ["conditional_offer", "pre_start_checks", "final_clearance", "onboarding", "appointed"].includes(stage);
}

function isActiveStage(stage: RecruitmentStage): boolean {
  return !["withdrawn", "rejected", "appointed"].includes(stage);
}

function canStartWork(checklist: CandidateChecklist, requiredChecks: CheckType[]): boolean {
  for (const checkType of PRE_START_MANDATORY) {
    const check = checklist.checks.find(c => c.type === checkType);
    if (!check || !["satisfactory", "received", "waived"].includes(check.status)) {
      return false;
    }
  }
  return checklist.gapsExplained;
}

function buildIssue(
  checkType: CheckType,
  status: string,
  stage: RecruitmentStage,
): ComplianceIssue | null {
  const severity: ComplianceSeverity = isAdvancedStage(stage) && isPreStartMandatory(checkType)
    ? "blocker"
    : "warning";

  return {
    severity,
    code: `${checkType.toUpperCase()}_MISSING`,
    message: `${formatCheckName(checkType)} has not been initiated.`,
    checkType,
    recommendation: `Request ${formatCheckName(checkType)} from candidate/provider.`,
    regulationRef: isPreStartMandatory(checkType) ? "Schedule 2, CHR 2015" : "Reg 34(1), CHR 2015",
  };
}

function formatCheckName(checkType: CheckType): string {
  const names: Record<CheckType, string> = {
    enhanced_dbs: "Enhanced DBS Check",
    barred_list: "Barred List Check",
    reference_1: "Reference 1",
    reference_2: "Reference 2",
    employment_history: "Full Employment History",
    identity_proof: "Proof of Identity",
    right_to_work: "Right to Work",
    health_declaration: "Health Declaration",
    qualification_verification: "Qualification Verification",
    interview_assessment: "Interview Assessment",
    overseas_police_check: "Overseas Police Check",
    prohibition_check: "Teaching Prohibition Check",
    disqualification_check: "Disqualification Check",
    driving_licence: "Driving Licence Check",
    risk_assessment: "Risk Assessment",
  };
  return names[checkType] ?? checkType;
}

export { formatCheckName, getRequiredChecks };
