// ══════════════════════════════════════════════════════════════════════════════
// Cara HR Files — Workforce & Training Compliance Engine
//
// Deterministic engine for tracking staff training compliance, supervision
// schedules, workforce analytics, and CHR 2015 staffing requirements.
//
// Regulation references:
//   - CHR 2015 Reg 33: Employment of staff (sufficient/suitable)
//   - CHR 2015 Reg 32: Fitness of workers
//   - CHR 2015 Reg 13: Leadership & management
//   - SCCIF: Management & Leadership domain
//
// Tracks:
//   - Mandatory training (induction, safeguarding, first aid, restraint, etc.)
//   - Supervision frequency (monthly as minimum standard)
//   - Qualification progress (Level 3/4/5 Diploma)
//   - Workforce metrics (vacancy, turnover, sickness)
//   - Probation management
//   - Return to work after absence
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import type { Role } from "../permissions/types";
import { isAtLeast } from "../permissions/role-rules";
import { rate } from "../metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type TrainingCategory =
  | "induction"               // 14-day induction programme
  | "safeguarding_basic"      // Level 1 safeguarding (all staff)
  | "safeguarding_advanced"   // Level 3 safeguarding (DSL/TL+)
  | "first_aid"              // First aid at work (3-year renewal)
  | "medication"             // Medication administration
  | "fire_safety"            // Fire marshal / awareness
  | "food_hygiene"           // Level 2 food hygiene
  | "manual_handling"        // Moving and handling
  | "data_protection"        // GDPR/DPA awareness
  | "equality_diversity"     // E&D training
  | "restraint"              // Physical intervention (PRICE/TCI)
  | "attachment_trauma"      // Attachment and trauma-informed care
  | "cse_cce"               // CSE/CCE awareness
  | "mental_health"          // Mental health awareness
  | "prevent"               // Prevent duty
  | "substance_misuse"      // Substance misuse awareness
  | "online_safety"         // E-safety and online exploitation
  | "complaints_handling"   // Reg 40 complaints
  | "record_keeping"        // Documentation standards
  | "health_safety"         // H&S awareness
  | "lone_working"          // Lone working policy
  | "whistleblowing";       // Whistleblowing/raising concerns

export type TrainingStatus =
  | "not_started"
  | "booked"
  | "in_progress"
  | "completed"
  | "expired"
  | "exempt";

export type SupervisionType =
  | "formal"                 // scheduled 1:1 supervision
  | "group"                  // team meeting / group supervision
  | "observation"            // observed practice
  | "reflective"             // reflective practice session
  | "ad_hoc";               // unscheduled discussion (incident-driven)

export type AbsenceType =
  | "sickness"
  | "annual_leave"
  | "compassionate"
  | "maternity_paternity"
  | "unpaid"
  | "training"
  | "suspended";

export type ProbationStatus =
  | "in_progress"
  | "extended"
  | "passed"
  | "failed";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface StaffMember {
  id: string;
  name: string;
  role: Role;
  homeId: string;
  startDate: string;
  contractHours: number;
  isAgency: boolean;
  training: TrainingRecord[];
  supervisions: SupervisionRecord[];
  absences: AbsenceRecord[];
  probation?: ProbationRecord;
  qualificationLevel?: number;   // e.g., 3, 4, 5 (NVQ/Diploma)
  qualificationTarget?: number;
  qualificationDeadline?: string;
}

export interface TrainingRecord {
  category: TrainingCategory;
  status: TrainingStatus;
  completedAt?: string;
  expiresAt?: string;
  bookedFor?: string;
  provider?: string;
  certificateRef?: string;
}

export interface SupervisionRecord {
  id: string;
  type: SupervisionType;
  date: string;
  supervisorId: string;
  supervisorName: string;
  durationMinutes: number;
  topics: string[];
  actionPoints: number;
  actionPointsCompleted: number;
  signedOff: boolean;
}

export interface AbsenceRecord {
  type: AbsenceType;
  startDate: string;
  endDate?: string;           // null = ongoing
  daysLost: number;
  returnToWorkCompleted?: boolean;
  fitNoteProvided?: boolean;
  reason?: string;
}

export interface ProbationRecord {
  startDate: string;
  expectedEndDate: string;
  status: ProbationStatus;
  reviews: { date: string; outcome: string; reviewedBy: string }[];
  extendedUntil?: string;
  passedDate?: string;
  failedDate?: string;
  failedReason?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface TrainingComplianceResult {
  staffId: string;
  staffName: string;
  overallCompliant: boolean;
  completionRate: number | null; // %; null = no training required of this role
  mandatoryComplete: number;
  mandatoryTotal: number;
  expired: TrainingCategory[];
  missing: TrainingCategory[];
  expiringSoon: TrainingCategory[];  // within 30 days
  nextActions: string[];
}

export interface SupervisionComplianceResult {
  staffId: string;
  staffName: string;
  isCompliant: boolean;
  lastSupervisionDate: string | null;
  daysSinceLastSupervision: number | null;
  supervisionsInPeriod: number;     // in last 3 months
  frequency: "monthly" | "less_than_monthly" | "none";
  actionPointsOutstanding: number;
  nextDue: string;
}

// Every rate below is null when its population is empty — an unstaffed or
// unestablished home has nothing to measure, which is not the same as a
// perfect score.
export interface WorkforceMetrics {
  totalStaff: number;
  fullTimeEquivalent: number;
  vacancyRate: number | null;            // %
  turnoverRate: number | null;           // % (leavers in 12 months / avg headcount)
  sicknessRate: number | null;           // % (days lost / total available days)
  agencyUsage: number | null;            // %
  averageTenure: number | null;          // months
  trainingComplianceRate: number | null; // %
  supervisionComplianceRate: number | null; // %
  qualificationRate: number | null;      // % at/above required level; null = no staff hold a target
  probationPassRate: number | null;      // %; null = nobody on probation
  staffWithExpiredTraining: number;
  staffOverdueSupervision: number;
}

// ── Configuration ──────────────────────────────────────────────────────────

// Training that ALL staff must complete
const MANDATORY_ALL: TrainingCategory[] = [
  "induction",
  "safeguarding_basic",
  "first_aid",
  "fire_safety",
  "data_protection",
  "equality_diversity",
  "health_safety",
  "prevent",
  "online_safety",
];

// Additional mandatory for care staff (RSW+)
const MANDATORY_CARE: TrainingCategory[] = [
  "medication",
  "restraint",
  "attachment_trauma",
  "cse_cce",
  "mental_health",
  "record_keeping",
];

// Roles requiring advanced safeguarding
const ADVANCED_SAFEGUARDING_ROLES: Role[] = [
  "team_leader",
  "senior_rsw",
  "deputy_manager",
  "registered_manager",
];

// Training renewal periods (years)
const TRAINING_RENEWAL: Partial<Record<TrainingCategory, number>> = {
  first_aid: 3,
  safeguarding_basic: 1,
  safeguarding_advanced: 2,
  restraint: 1,
  fire_safety: 1,
  food_hygiene: 3,
  medication: 1,
  prevent: 3,
  online_safety: 1,
  data_protection: 1,
};

// Maximum days between supervisions before non-compliant
const MAX_SUPERVISION_GAP_DAYS = 42; // 6 weeks (monthly with flex)

// ── Core: Evaluate Training Compliance ────────────────────────────────────

export function evaluateTrainingCompliance(
  staff: StaffMember,
  now?: string,
): TrainingComplianceResult {
  const currentDate = now ? new Date(now) : new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  // Determine required training
  const required = getMandatoryTraining(staff.role);
  const expired: TrainingCategory[] = [];
  const missing: TrainingCategory[] = [];
  const expiringSoon: TrainingCategory[] = [];
  const nextActions: string[] = [];
  let completedCount = 0;

  for (const category of required) {
    const record = staff.training.find(t => t.category === category);

    if (!record || record.status === "not_started") {
      missing.push(category);
      nextActions.push(`Book ${formatTrainingName(category)}`);
    } else if (record.status === "expired") {
      expired.push(category);
      nextActions.push(`Renew expired ${formatTrainingName(category)}`);
    } else if (record.status === "completed" || record.status === "exempt") {
      // Check if approaching expiry
      if (record.expiresAt) {
        const expiryDate = new Date(record.expiresAt);
        if (expiryDate < currentDate) {
          expired.push(category);
          nextActions.push(`Renew expired ${formatTrainingName(category)}`);
        } else if (expiryDate.getTime() - currentDate.getTime() < thirtyDaysMs) {
          expiringSoon.push(category);
          nextActions.push(`${formatTrainingName(category)} expiring soon — book renewal`);
          completedCount++;
        } else {
          completedCount++;
        }
      } else {
        completedCount++;
      }
    } else if (record.status === "booked" || record.status === "in_progress") {
      // Not yet complete
      missing.push(category);
      if (record.bookedFor) {
        nextActions.push(`${formatTrainingName(category)} booked for ${record.bookedFor}`);
      }
    }
  }

  const completionRate = rate(completedCount, required.length);

  return {
    staffId: staff.id,
    staffName: staff.name,
    overallCompliant: expired.length === 0 && missing.length === 0,
    completionRate,
    mandatoryComplete: completedCount,
    mandatoryTotal: required.length,
    expired,
    missing,
    expiringSoon,
    nextActions,
  };
}

// ── Core: Evaluate Supervision Compliance ─────────────────────────────────

export function evaluateSupervisionCompliance(
  staff: StaffMember,
  now?: string,
): SupervisionComplianceResult {
  const currentDate = now ? new Date(now) : new Date();
  const threeMonthsMs = 90 * 24 * 60 * 60 * 1000;

  // Get formal supervisions (not ad_hoc or group)
  const formalSupervisions = staff.supervisions
    .filter(s => s.type === "formal" || s.type === "reflective")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const lastSupervision = formalSupervisions[0] ?? null;
  const lastDate = lastSupervision ? lastSupervision.date : null;
  const daysSinceLast = lastDate
    ? Math.floor((currentDate.getTime() - new Date(lastDate).getTime()) / (24 * 60 * 60 * 1000))
    : null;

  // Count supervisions in last 3 months
  const recentCutoff = new Date(currentDate.getTime() - threeMonthsMs);
  const supervisionsInPeriod = formalSupervisions.filter(
    s => new Date(s.date) >= recentCutoff,
  ).length;

  // Determine frequency
  let frequency: "monthly" | "less_than_monthly" | "none";
  if (supervisionsInPeriod >= 3) frequency = "monthly";
  else if (supervisionsInPeriod > 0) frequency = "less_than_monthly";
  else frequency = "none";

  // Outstanding action points
  const actionPointsOutstanding = staff.supervisions.reduce(
    (sum, s) => sum + (s.actionPoints - s.actionPointsCompleted),
    0,
  );

  // Next due date (last supervision + 28 days, or now if overdue)
  const nextDue = lastDate
    ? new Date(new Date(lastDate).getTime() + 28 * 24 * 60 * 60 * 1000).toISOString()
    : currentDate.toISOString();

  const isCompliant = daysSinceLast !== null && daysSinceLast <= MAX_SUPERVISION_GAP_DAYS;

  return {
    staffId: staff.id,
    staffName: staff.name,
    isCompliant,
    lastSupervisionDate: lastDate,
    daysSinceLastSupervision: daysSinceLast,
    supervisionsInPeriod,
    frequency,
    actionPointsOutstanding,
    nextDue,
  };
}

// ── Core: Calculate Workforce Metrics ─────────────────────────────────────

export function calculateWorkforceMetrics(
  staff: StaffMember[],
  establishedPosts: number,
  leaversInPeriod: number = 0,
  now?: string,
): WorkforceMetrics {
  const currentDate = now ? new Date(now) : new Date();

  const totalStaff = staff.length;
  const fullTimeEquivalent = staff.reduce((sum, s) => sum + (s.contractHours / 37.5), 0);
  const vacancies = Math.max(0, establishedPosts - totalStaff);
  const vacancyRate = rate(vacancies, establishedPosts);

  const avgHeadcount = totalStaff; // simplified
  const turnoverRate = rate(leaversInPeriod, avgHeadcount);

  // Sickness rate
  const totalDaysLost = staff.reduce(
    (sum, s) => sum + s.absences.filter(a => a.type === "sickness").reduce((d, a) => d + a.daysLost, 0),
    0,
  );
  const totalAvailableDays = totalStaff * 260; // approx working days per year
  const sicknessRate = totalAvailableDays > 0
    ? Math.round((totalDaysLost / totalAvailableDays) * 1000) / 10
    : null;

  // Agency usage
  const agencyCount = staff.filter(s => s.isAgency).length;
  const agencyUsage = rate(agencyCount, totalStaff);

  // Average tenure
  const tenureMonths = staff.map(s => {
    const start = new Date(s.startDate);
    return (currentDate.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000);
  });
  const averageTenure = tenureMonths.length > 0
    ? Math.round(tenureMonths.reduce((a, b) => a + b, 0) / tenureMonths.length)
    : null;

  // Training compliance
  const trainingResults = staff.map(s => evaluateTrainingCompliance(s, now));
  const trainingCompliant = trainingResults.filter(r => r.overallCompliant).length;
  const trainingComplianceRate = rate(trainingCompliant, totalStaff);

  // Supervision compliance
  const supervisionResults = staff.map(s => evaluateSupervisionCompliance(s, now));
  const supervisionCompliant = supervisionResults.filter(r => r.isCompliant).length;
  const supervisionComplianceRate = rate(supervisionCompliant, totalStaff);

  // Qualification rate
  const staffWithTarget = staff.filter(s => s.qualificationTarget);
  const atOrAboveTarget = staffWithTarget.filter(s =>
    (s.qualificationLevel ?? 0) >= (s.qualificationTarget ?? 0),
  ).length;
  const qualificationRate = rate(atOrAboveTarget, staffWithTarget.length);

  // Probation pass rate
  const probationStaff = staff.filter(s => s.probation);
  const probationPassed = probationStaff.filter(s => s.probation?.status === "passed").length;
  const probationPassRate = rate(probationPassed, probationStaff.length);

  return {
    totalStaff,
    fullTimeEquivalent: Math.round(fullTimeEquivalent * 10) / 10,
    vacancyRate,
    turnoverRate,
    sicknessRate,
    agencyUsage,
    averageTenure,
    trainingComplianceRate,
    supervisionComplianceRate,
    qualificationRate,
    probationPassRate,
    staffWithExpiredTraining: trainingResults.filter(r => r.expired.length > 0).length,
    staffOverdueSupervision: supervisionResults.filter(r => !r.isCompliant).length,
  };
}

// ── Core: Identify Training Gaps ──────────────────────────────────────────

export interface TrainingGap {
  category: TrainingCategory;
  staffAffected: number;
  staffNames: string[];
  urgency: "critical" | "high" | "medium" | "low";
  recommendation: string;
}

export function identifyTrainingGaps(
  staff: StaffMember[],
  now?: string,
): TrainingGap[] {
  const gaps: Map<TrainingCategory, { staffNames: string[]; isExpired: boolean }> = new Map();

  for (const member of staff) {
    const result = evaluateTrainingCompliance(member, now);
    for (const category of result.expired) {
      const existing = gaps.get(category) ?? { staffNames: [], isExpired: true };
      existing.staffNames.push(member.name);
      existing.isExpired = true;
      gaps.set(category, existing);
    }
    for (const category of result.missing) {
      const existing = gaps.get(category) ?? { staffNames: [], isExpired: false };
      existing.staffNames.push(member.name);
      gaps.set(category, existing);
    }
  }

  return Array.from(gaps.entries()).map(([category, data]) => {
    const urgency = getTrainingUrgency(category, data.isExpired, data.staffNames.length, staff.length);
    return {
      category,
      staffAffected: data.staffNames.length,
      staffNames: data.staffNames,
      urgency,
      recommendation: buildTrainingRecommendation(category, data.staffNames.length, urgency),
    };
  }).sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function getMandatoryTraining(role: Role): TrainingCategory[] {
  const required = [...MANDATORY_ALL];

  // Care roles need additional training
  const careRoles: Role[] = ["rsw", "senior_rsw", "waking_night", "team_leader", "deputy_manager", "registered_manager"];
  if (careRoles.includes(role)) {
    required.push(...MANDATORY_CARE);
  }

  // Advanced safeguarding for TL+
  if (ADVANCED_SAFEGUARDING_ROLES.includes(role)) {
    required.push("safeguarding_advanced");
  }

  return required;
}

export function getTrainingRenewalYears(category: TrainingCategory): number | null {
  return TRAINING_RENEWAL[category] ?? null;
}

export function formatTrainingName(category: TrainingCategory): string {
  const names: Record<TrainingCategory, string> = {
    induction: "Induction Programme",
    safeguarding_basic: "Safeguarding (Level 1)",
    safeguarding_advanced: "Safeguarding (Level 3/DSL)",
    first_aid: "First Aid at Work",
    medication: "Medication Administration",
    fire_safety: "Fire Safety",
    food_hygiene: "Food Hygiene (L2)",
    manual_handling: "Manual Handling",
    data_protection: "Data Protection (GDPR)",
    equality_diversity: "Equality & Diversity",
    restraint: "Physical Intervention (PRICE)",
    attachment_trauma: "Attachment & Trauma",
    cse_cce: "CSE/CCE Awareness",
    mental_health: "Mental Health Awareness",
    prevent: "Prevent Duty",
    substance_misuse: "Substance Misuse",
    online_safety: "Online Safety",
    complaints_handling: "Complaints Handling",
    record_keeping: "Record Keeping",
    health_safety: "Health & Safety",
    lone_working: "Lone Working",
    whistleblowing: "Whistleblowing",
  };
  return names[category];
}

function getTrainingUrgency(
  category: TrainingCategory,
  isExpired: boolean,
  affected: number,
  totalStaff: number,
): "critical" | "high" | "medium" | "low" {
  // Critical: safeguarding expired for any staff
  if (isExpired && (category === "safeguarding_basic" || category === "safeguarding_advanced")) {
    return "critical";
  }
  // Critical: restraint expired and >50% affected
  if (isExpired && category === "restraint" && affected > totalStaff * 0.5) {
    return "critical";
  }
  // High: any mandatory expired
  if (isExpired) return "high";
  // Medium: missing for >25% of staff
  if (affected > totalStaff * 0.25) return "medium";
  return "low";
}

function buildTrainingRecommendation(
  category: TrainingCategory,
  affected: number,
  urgency: string,
): string {
  const name = formatTrainingName(category);
  if (urgency === "critical") {
    return `URGENT: ${name} expired for ${affected} staff. Book immediately — potential Ofsted compliance failure.`;
  }
  if (urgency === "high") {
    return `${name} expired for ${affected} staff. Book within 7 days to restore compliance.`;
  }
  if (affected > 3) {
    return `Consider group booking for ${name} — ${affected} staff need this training.`;
  }
  return `Schedule ${name} for ${affected} staff member${affected > 1 ? "s" : ""}.`;
}
