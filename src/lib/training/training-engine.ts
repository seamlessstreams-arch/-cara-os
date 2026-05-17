// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Training & Development Engine
//
// Deterministic engine for managing mandatory training compliance,
// qualifications, CPD tracking, and staff development in children's homes.
//
// Aligned to:
//   - CHR 2015 Reg 33 — Employment of staff (fitness & qualifications)
//   - CHR 2015 Schedule 2 — Fitness of workers
//   - SCCIF — Leadership & management (training & qualifications)
//   - Working Together 2023 — Safeguarding training requirements
//   - Level 3 Diploma requirement (within 2 years of start)
//   - Restraint training (BILD-certified, annual refresh)
//   - First Aid at Work (3-year renewal)
//   - Safeguarding levels (refreshed at prescribed intervals)
//
// Key requirements:
//   - All staff trained in core competencies before lone working
//   - Mandatory training matrix with expiry tracking
//   - Level 3 Diploma completion tracked (2-year deadline)
//   - CPD logged and evidenced (minimum hours per year)
//   - Induction programme completed within probation
//   - Specialist training for specific needs of children placed
//   - Training compliance reported to Reg 44 visitor
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type TrainingCategory =
  | "safeguarding"
  | "first_aid"
  | "medication"
  | "restraint"
  | "fire_safety"
  | "food_hygiene"
  | "health_safety"
  | "data_protection"
  | "equality_diversity"
  | "mental_health"
  | "attachment_trauma"
  | "csea"            // child sexual exploitation & abuse
  | "county_lines"
  | "missing_children"
  | "self_harm_suicide"
  | "de_escalation"
  | "record_keeping"
  | "complaints_handling"
  | "whistle_blowing"
  | "lone_working"
  | "specialist";     // home-specific

export type TrainingStatus =
  | "current"
  | "expiring_soon"   // within 30 days
  | "expired"
  | "not_started"
  | "in_progress"
  | "booked";

export type QualificationLevel =
  | "level_3_diploma"
  | "level_4_diploma"
  | "level_5_diploma"
  | "degree"
  | "masters"
  | "social_work_qualification"
  | "management_qualification"
  | "other";

export type QualificationStatus =
  | "achieved"
  | "in_progress"
  | "not_started"
  | "overdue";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface StaffTrainingRecord {
  staffId: string;
  staffName: string;
  role: string;
  startDate: string;
  inductionCompleted: boolean;
  inductionCompletedDate?: string;
  canWorkAlone: boolean;
  trainings: TrainingCompletion[];
  qualifications: Qualification[];
  cpdHoursThisYear: number;
  cpdTarget: number;
  supervisionUpToDate: boolean;
}

export interface TrainingCompletion {
  category: TrainingCategory;
  courseName: string;
  completedDate?: string;
  expiryDate?: string;
  provider?: string;
  certificateRef?: string;
  status: TrainingStatus;
  mandatory: boolean;
  bookedDate?: string;
}

export interface Qualification {
  type: QualificationLevel;
  title: string;
  status: QualificationStatus;
  startDate?: string;
  achievedDate?: string;
  deadline?: string;        // 2 years from employment start for L3
  provider?: string;
  percentComplete?: number;
}

export interface MandatoryTrainingItem {
  category: TrainingCategory;
  name: string;
  refreshPeriodMonths: number;     // 0 = one-off (no refresh)
  requiredBeforeLoneWorking: boolean;
  requiredForAllStaff: boolean;
  requiredForRoles?: string[];     // if not all staff
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface StaffTrainingComplianceResult {
  staffId: string;
  staffName: string;
  role: string;
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  overallComplianceRate: number;   // % of mandatory training current
  mandatoryTrainingCurrent: number;
  mandatoryTrainingTotal: number;
  expiredCount: number;
  expiringSoonCount: number;
  inductionComplete: boolean;
  qualificationOnTrack: boolean;
  cpdOnTrack: boolean;
  canWorkAlone: boolean;
  loneWorkingRequirementsMet: boolean;
}

export interface HomeTrainingMetrics {
  homeId: string;
  staffCount: number;
  overallComplianceRate: number;
  fullyCompliantStaff: number;
  staffWithExpiredTraining: number;
  staffWithExpiringSoon: number;
  inductionCompletionRate: number;
  qualificationRate: number;        // % with L3+ or on track
  averageCpdHours: number;
  cpdComplianceRate: number;        // % meeting target
  loneWorkingAuthorised: number;
  restraintTrainingCurrent: number;
  safeguardingCurrent: number;
  firstAidCurrent: number;
  categoryCompliance: { category: string; currentCount: number; totalRequired: number; rate: number }[];
  staffNeedingAttention: { staffName: string; expiredCount: number; issues: string[] }[];
  upcomingExpiries: { staffName: string; category: string; expiryDate: string }[];
  complianceIssues: string[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const EXPIRY_WARNING_DAYS = 30;
const CPD_MINIMUM_HOURS = 20;         // minimum CPD hours per year
const INDUCTION_DEADLINE_DAYS = 90;   // 3 months (probation period)
const LEVEL_3_DEADLINE_MONTHS = 24;   // 2 years from start

export const MANDATORY_TRAINING: MandatoryTrainingItem[] = [
  { category: "safeguarding", name: "Safeguarding Children (Level 3)", refreshPeriodMonths: 12, requiredBeforeLoneWorking: true, requiredForAllStaff: true },
  { category: "first_aid", name: "First Aid at Work", refreshPeriodMonths: 36, requiredBeforeLoneWorking: true, requiredForAllStaff: true },
  { category: "medication", name: "Medication Administration", refreshPeriodMonths: 12, requiredBeforeLoneWorking: true, requiredForAllStaff: true },
  { category: "restraint", name: "Physical Intervention (BILD)", refreshPeriodMonths: 12, requiredBeforeLoneWorking: true, requiredForAllStaff: true },
  { category: "fire_safety", name: "Fire Safety Awareness", refreshPeriodMonths: 12, requiredBeforeLoneWorking: true, requiredForAllStaff: true },
  { category: "food_hygiene", name: "Food Hygiene Level 2", refreshPeriodMonths: 36, requiredBeforeLoneWorking: false, requiredForAllStaff: true },
  { category: "health_safety", name: "Health & Safety", refreshPeriodMonths: 12, requiredBeforeLoneWorking: false, requiredForAllStaff: true },
  { category: "data_protection", name: "Data Protection & GDPR", refreshPeriodMonths: 12, requiredBeforeLoneWorking: false, requiredForAllStaff: true },
  { category: "equality_diversity", name: "Equality, Diversity & Inclusion", refreshPeriodMonths: 24, requiredBeforeLoneWorking: false, requiredForAllStaff: true },
  { category: "mental_health", name: "Mental Health Awareness", refreshPeriodMonths: 24, requiredBeforeLoneWorking: false, requiredForAllStaff: true },
  { category: "attachment_trauma", name: "Attachment & Trauma-Informed Care", refreshPeriodMonths: 24, requiredBeforeLoneWorking: false, requiredForAllStaff: true },
  { category: "csea", name: "CSE & Online Safety", refreshPeriodMonths: 12, requiredBeforeLoneWorking: true, requiredForAllStaff: true },
  { category: "county_lines", name: "County Lines & Criminal Exploitation", refreshPeriodMonths: 12, requiredBeforeLoneWorking: false, requiredForAllStaff: true },
  { category: "missing_children", name: "Missing from Care Procedures", refreshPeriodMonths: 12, requiredBeforeLoneWorking: true, requiredForAllStaff: true },
  { category: "self_harm_suicide", name: "Self-Harm & Suicide Prevention", refreshPeriodMonths: 12, requiredBeforeLoneWorking: true, requiredForAllStaff: true },
  { category: "de_escalation", name: "De-escalation & Conflict Resolution", refreshPeriodMonths: 12, requiredBeforeLoneWorking: true, requiredForAllStaff: true },
  { category: "record_keeping", name: "Record Keeping & Report Writing", refreshPeriodMonths: 0, requiredBeforeLoneWorking: false, requiredForAllStaff: true },
  { category: "lone_working", name: "Lone Working Procedures", refreshPeriodMonths: 12, requiredBeforeLoneWorking: true, requiredForAllStaff: true },
];

// ── Core: Evaluate Staff Training Compliance ──────────────────────────────

export function evaluateStaffTrainingCompliance(
  record: StaffTrainingRecord,
  now?: string,
): StaffTrainingComplianceResult {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const warningThreshold = currentTime + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000;
  const issues: string[] = [];
  const warnings: string[] = [];

  // Determine which mandatory trainings apply
  const applicableTraining = MANDATORY_TRAINING.filter(mt =>
    mt.requiredForAllStaff || (mt.requiredForRoles?.includes(record.role))
  );

  // Check each mandatory training
  let currentCount = 0;
  let expiredCount = 0;
  let expiringSoonCount = 0;

  for (const required of applicableTraining) {
    const completion = record.trainings.find(t => t.category === required.category);

    if (!completion || completion.status === "not_started") {
      issues.push(`${required.name} — not completed`);
      continue;
    }

    if (completion.status === "expired") {
      expiredCount++;
      issues.push(`${required.name} — expired`);
      continue;
    }

    if (completion.status === "expiring_soon") {
      expiringSoonCount++;
      warnings.push(`${required.name} — expiring soon`);
      currentCount++;
      continue;
    }

    if (completion.status === "current" || completion.status === "booked") {
      currentCount++;
      continue;
    }

    if (completion.status === "in_progress") {
      // Count as partially meeting requirement
      warnings.push(`${required.name} — in progress`);
    }
  }

  const mandatoryTrainingTotal = applicableTraining.length;
  const overallComplianceRate = mandatoryTrainingTotal > 0
    ? Math.round((currentCount / mandatoryTrainingTotal) * 100)
    : 100;

  // Induction
  const inductionComplete = record.inductionCompleted;
  if (!inductionComplete) {
    const daysSinceStart = (currentTime - new Date(record.startDate).getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceStart > INDUCTION_DEADLINE_DAYS) {
      issues.push("Induction not completed within probation period");
    } else {
      warnings.push(`Induction in progress (${Math.round(INDUCTION_DEADLINE_DAYS - daysSinceStart)} days remaining)`);
    }
  }

  // Qualification (Level 3 minimum)
  const hasLevel3Plus = record.qualifications.some(q =>
    (q.type === "level_3_diploma" || q.type === "level_4_diploma" || q.type === "level_5_diploma" || q.type === "degree" || q.type === "masters" || q.type === "social_work_qualification") &&
    q.status === "achieved"
  );
  const level3InProgress = record.qualifications.some(q =>
    q.type === "level_3_diploma" && q.status === "in_progress"
  );
  const level3Overdue = record.qualifications.some(q =>
    q.type === "level_3_diploma" && q.status === "overdue"
  );

  let qualificationOnTrack = hasLevel3Plus || level3InProgress;
  if (level3Overdue) {
    qualificationOnTrack = false;
    issues.push("Level 3 Diploma overdue (must achieve within 2 years)");
  } else if (!hasLevel3Plus && !level3InProgress) {
    const monthsSinceStart = (currentTime - new Date(record.startDate).getTime()) / (30.44 * 24 * 60 * 60 * 1000);
    if (monthsSinceStart > 6) {
      warnings.push("Level 3 Diploma not yet started (required within 2 years)");
    }
  }

  // CPD
  const cpdOnTrack = record.cpdHoursThisYear >= record.cpdTarget * 0.5; // on track if at least 50% by mid-year
  if (record.cpdHoursThisYear < record.cpdTarget * 0.25) {
    warnings.push(`Low CPD hours (${record.cpdHoursThisYear}/${record.cpdTarget}h target)`);
  }

  // Lone working authorisation
  const loneWorkingRequirements = MANDATORY_TRAINING.filter(mt => mt.requiredBeforeLoneWorking);
  const loneWorkingMet = loneWorkingRequirements.every(req => {
    const completion = record.trainings.find(t => t.category === req.category);
    return completion && (completion.status === "current" || completion.status === "expiring_soon");
  });

  if (record.canWorkAlone && !loneWorkingMet) {
    issues.push("Lone working authorised but required training not current");
  }

  return {
    staffId: record.staffId,
    staffName: record.staffName,
    role: record.role,
    isCompliant: issues.length === 0,
    issues,
    warnings,
    overallComplianceRate,
    mandatoryTrainingCurrent: currentCount,
    mandatoryTrainingTotal,
    expiredCount,
    expiringSoonCount,
    inductionComplete,
    qualificationOnTrack,
    cpdOnTrack,
    canWorkAlone: record.canWorkAlone,
    loneWorkingRequirementsMet: loneWorkingMet,
  };
}

// ── Core: Calculate Home Training Metrics ────────────────────────────────

export function calculateHomeTrainingMetrics(
  staffRecords: StaffTrainingRecord[],
  homeId: string,
  now?: string,
): HomeTrainingMetrics {
  const currentTime = now ? new Date(now).getTime() : Date.now();

  const results = staffRecords.map(r => evaluateStaffTrainingCompliance(r, now));

  const staffCount = staffRecords.length;
  const fullyCompliantStaff = results.filter(r => r.isCompliant).length;
  const overallComplianceRate = staffCount > 0
    ? Math.round((fullyCompliantStaff / staffCount) * 100)
    : 100;

  const staffWithExpiredTraining = results.filter(r => r.expiredCount > 0).length;
  const staffWithExpiringSoon = results.filter(r => r.expiringSoonCount > 0).length;

  // Induction rate
  const inductionComplete = staffRecords.filter(r => r.inductionCompleted).length;
  const inductionCompletionRate = staffCount > 0
    ? Math.round((inductionComplete / staffCount) * 100)
    : 100;

  // Qualification rate (L3+ achieved or on track)
  const qualifiedOrOnTrack = results.filter(r => r.qualificationOnTrack).length;
  const qualificationRate = staffCount > 0
    ? Math.round((qualifiedOrOnTrack / staffCount) * 100)
    : 100;

  // CPD
  const totalCpdHours = staffRecords.reduce((s, r) => s + r.cpdHoursThisYear, 0);
  const averageCpdHours = staffCount > 0 ? Math.round((totalCpdHours / staffCount) * 10) / 10 : 0;
  const cpdCompliant = results.filter(r => r.cpdOnTrack).length;
  const cpdComplianceRate = staffCount > 0
    ? Math.round((cpdCompliant / staffCount) * 100)
    : 100;

  // Specific category counts
  const loneWorkingAuthorised = results.filter(r => r.canWorkAlone && r.loneWorkingRequirementsMet).length;

  const restraintTrainingCurrent = staffRecords.filter(r =>
    r.trainings.some(t => t.category === "restraint" && t.status === "current")
  ).length;

  const safeguardingCurrent = staffRecords.filter(r =>
    r.trainings.some(t => t.category === "safeguarding" && t.status === "current")
  ).length;

  const firstAidCurrent = staffRecords.filter(r =>
    r.trainings.some(t => t.category === "first_aid" && t.status === "current")
  ).length;

  // Category compliance breakdown
  const categoryCompliance = MANDATORY_TRAINING
    .filter(mt => mt.requiredForAllStaff)
    .map(mt => {
      const currentCount = staffRecords.filter(r =>
        r.trainings.some(t => t.category === mt.category && (t.status === "current" || t.status === "expiring_soon"))
      ).length;
      return {
        category: mt.name,
        currentCount,
        totalRequired: staffCount,
        rate: staffCount > 0 ? Math.round((currentCount / staffCount) * 100) : 100,
      };
    })
    .sort((a, b) => a.rate - b.rate);

  // Staff needing attention
  const staffNeedingAttention = results
    .filter(r => r.expiredCount > 0 || r.issues.length > 0)
    .map(r => ({ staffName: r.staffName, expiredCount: r.expiredCount, issues: r.issues }))
    .sort((a, b) => b.expiredCount - a.expiredCount)
    .slice(0, 5);

  // Upcoming expiries (next 30 days)
  const warningThreshold = currentTime + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000;
  const upcomingExpiries: { staffName: string; category: string; expiryDate: string }[] = [];
  for (const record of staffRecords) {
    for (const training of record.trainings) {
      if (training.expiryDate && training.status === "expiring_soon") {
        upcomingExpiries.push({
          staffName: record.staffName,
          category: training.courseName,
          expiryDate: training.expiryDate,
        });
      }
    }
  }
  upcomingExpiries.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  // Compliance issues
  const allIssues = results.flatMap(r => r.issues);
  const complianceIssues = [...new Set(allIssues)];

  return {
    homeId,
    staffCount,
    overallComplianceRate,
    fullyCompliantStaff,
    staffWithExpiredTraining,
    staffWithExpiringSoon,
    inductionCompletionRate,
    qualificationRate,
    averageCpdHours,
    cpdComplianceRate,
    loneWorkingAuthorised,
    restraintTrainingCurrent,
    safeguardingCurrent,
    firstAidCurrent,
    categoryCompliance,
    staffNeedingAttention,
    upcomingExpiries: upcomingExpiries.slice(0, 10),
    complianceIssues,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────

export function getTrainingCategoryLabel(category: TrainingCategory): string {
  const labels: Record<TrainingCategory, string> = {
    safeguarding: "Safeguarding",
    first_aid: "First Aid",
    medication: "Medication",
    restraint: "Restraint (PI)",
    fire_safety: "Fire Safety",
    food_hygiene: "Food Hygiene",
    health_safety: "Health & Safety",
    data_protection: "Data Protection",
    equality_diversity: "Equality & Diversity",
    mental_health: "Mental Health",
    attachment_trauma: "Attachment & Trauma",
    csea: "CSE & Online Safety",
    county_lines: "County Lines",
    missing_children: "Missing Children",
    self_harm_suicide: "Self-Harm Prevention",
    de_escalation: "De-escalation",
    record_keeping: "Record Keeping",
    complaints_handling: "Complaints",
    whistle_blowing: "Whistleblowing",
    lone_working: "Lone Working",
    specialist: "Specialist",
  };
  return labels[category] ?? category;
}

export function getTrainingStatusLabel(status: TrainingStatus): string {
  const labels: Record<TrainingStatus, string> = {
    current: "Current",
    expiring_soon: "Expiring Soon",
    expired: "Expired",
    not_started: "Not Started",
    in_progress: "In Progress",
    booked: "Booked",
  };
  return labels[status] ?? status;
}

export function getQualificationStatusLabel(status: QualificationStatus): string {
  const labels: Record<QualificationStatus, string> = {
    achieved: "Achieved",
    in_progress: "In Progress",
    not_started: "Not Started",
    overdue: "Overdue",
  };
  return labels[status] ?? status;
}
