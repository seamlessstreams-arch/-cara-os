// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Education & PEP Tracking — Intelligence Engine
//
// Deterministic engine for monitoring education attendance, Personal Education
// Plan compliance, attainment progress, and school liaison tracking.
//
// Aligned to:
//   - CHR 2015 Reg 8 — The education standard
//   - Virtual School Head statutory role (Children Act 2004)
//   - PEP requirements (termly reviews, Pupil Premium Plus allocation)
//   - DfE: Promoting the education of looked-after children
//
// Every looked-after child must have:
//   1. School placement within 20 days of entering care
//   2. Personal Education Plan (PEP) reviewed termly (3x per year)
//   3. Pupil Premium Plus (PP+) spend plan linked to targets
//   4. Designated teacher identified and engaged
//   5. Attendance target ≥95% (unless medical exemption)
//   6. Exclusion monitoring and prevention
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type EducationStatus =
  | "enrolled_mainstream"
  | "enrolled_special"
  | "alternative_provision"
  | "home_educated"
  | "awaiting_placement"
  | "excluded_fixed"
  | "excluded_permanent"
  | "elective_home_education"
  | "neet";               // not in education, employment, or training (16+)

export type KeyStage = "eyfs" | "ks1" | "ks2" | "ks3" | "ks4" | "ks5" | "post_16";

export type AttainmentLevel =
  | "significantly_below"    // 2+ years below
  | "below"                  // 1 year below
  | "age_expected"           // working at expected level
  | "above"                  // exceeding expectations
  | "well_above";            // significantly exceeding

export type PEPStatus =
  | "current"            // reviewed within term
  | "due"                // review due this term
  | "overdue"            // not reviewed this term
  | "not_started";       // no PEP in place

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ChildEducationRecord {
  childId: string;
  childName: string;
  homeId: string;
  dateOfBirth: string;
  keyStage: KeyStage;

  // School
  educationStatus: EducationStatus;
  schoolName: string;
  schoolType: "mainstream" | "special" | "pru" | "ap" | "other";
  designatedTeacher: string;
  designatedTeacherEmail?: string;
  yearGroup: number;

  // PEP
  pepStatus: PEPStatus;
  lastPEPDate?: string;
  nextPEPDue?: string;
  pepTargets: PEPTarget[];
  pupilPremiumAllocation: number;     // £ for this term
  pupilPremiumSpent: number;

  // Attendance
  attendancePercentage: number;       // current term
  sessionsAttended: number;
  sessionsPossible: number;
  authorisedAbsences: number;
  unauthorisedAbsences: number;

  // Attainment
  attainmentLevels: SubjectAttainment[];
  senStatus: "none" | "sen_support" | "ehcp";
  ehcpInPlace: boolean;

  // Exclusions
  exclusions: ExclusionRecord[];

  // Engagement
  homeworkCompletion: number;         // %
  extracurricularActivities: string[];
  aspirations: string;
}

export interface PEPTarget {
  id: string;
  subject: string;
  target: string;
  progress: "not_started" | "in_progress" | "achieved" | "revised";
  ppFunded: boolean;                  // funded by Pupil Premium Plus
  evidence?: string;
}

export interface SubjectAttainment {
  subject: string;
  currentLevel: AttainmentLevel;
  targetLevel: AttainmentLevel;
  progress: "below_target" | "on_track" | "above_target";
  lastAssessed: string;
}

export interface ExclusionRecord {
  date: string;
  type: "fixed_term" | "permanent" | "informal";
  days: number;
  reason: string;
  alternativeProvision: boolean;
  returnMeetingHeld: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface EducationComplianceResult {
  childId: string;
  childName: string;
  isCompliant: boolean;
  issues: string[];
  pepCompliant: boolean;
  attendanceCompliant: boolean;
  attendancePercentage: number;
  exclusionConcerns: boolean;
  ppSpendOnTrack: boolean;
  targetProgress: number;            // % targets on track or achieved
  recommendations: string[];
}

export interface HomeEducationMetrics {
  homeId: string;
  childCount: number;
  averageAttendance: number;         // %
  pepComplianceRate: number;         // %
  exclusionCount: number;
  exclusionDays: number;
  averageTargetProgress: number;     // %
  childrenBelowExpected: number;
  childrenAtExpected: number;
  childrenAboveExpected: number;
  totalPPAllocation: number;         // £
  totalPPSpent: number;              // £
  ppUtilisationRate: number;         // %
  concerns: { childId: string; childName: string; concern: string }[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const ATTENDANCE_TARGET = 95;          // 95% minimum
const ATTENDANCE_CONCERN = 90;         // below 90% = persistent absence
const PEP_TERM_WEEKS = 13;            // ~13 weeks per term
const PP_SPEND_TARGET_RATE = 80;       // should spend 80%+ of allocation

// ── Core: Evaluate Education Compliance ──────────────────────────────────

export function evaluateEducationCompliance(
  record: ChildEducationRecord,
  now?: string,
): EducationComplianceResult {
  const currentDate = now ? new Date(now) : new Date();
  const issues: string[] = [];
  const recommendations: string[] = [];

  // PEP compliance
  let pepCompliant = record.pepStatus === "current";
  if (!pepCompliant) {
    if (record.pepStatus === "overdue") {
      issues.push("PEP overdue — must be reviewed termly.");
      recommendations.push("Schedule PEP review urgently with Virtual School and designated teacher.");
    } else if (record.pepStatus === "not_started") {
      issues.push("No PEP in place — statutory requirement for all LAC.");
      recommendations.push("URGENT: Initiate PEP with Virtual School Head immediately.");
    } else if (record.pepStatus === "due") {
      recommendations.push("PEP review due this term — schedule before term end.");
    }
  }

  // Attendance
  const attendanceCompliant = record.attendancePercentage >= ATTENDANCE_TARGET;
  if (!attendanceCompliant) {
    if (record.attendancePercentage < ATTENDANCE_CONCERN) {
      issues.push(`Persistent absence: ${record.attendancePercentage}% attendance (target: ${ATTENDANCE_TARGET}%).`);
      recommendations.push("Attendance below 90% — convene attendance strategy meeting with school.");
    } else {
      issues.push(`Attendance below target: ${record.attendancePercentage}% (target: ${ATTENDANCE_TARGET}%).`);
      recommendations.push("Monitor attendance closely. Discuss barriers with child and school.");
    }
  }

  // Exclusions
  const recentExclusions = record.exclusions.filter(e => {
    const excDate = new Date(e.date);
    const threeMonthsAgo = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    return excDate >= threeMonthsAgo;
  });
  const exclusionConcerns = recentExclusions.length > 0;
  if (exclusionConcerns) {
    const totalDays = recentExclusions.reduce((s, e) => s + e.days, 0);
    issues.push(`${recentExclusions.length} exclusion(s) in last 3 months (${totalDays} days lost).`);
    recommendations.push("Review behaviour support plan with school. Consider managed move if pattern continues.");
  }

  // Informal exclusions (illegal)
  const informalExclusions = record.exclusions.filter(e => e.type === "informal");
  if (informalExclusions.length > 0) {
    issues.push("Informal exclusion detected — this is unlawful. Challenge with school.");
    recommendations.push("Report informal exclusion to Virtual School Head and consider formal complaint.");
  }

  // PP spend
  const ppSpendOnTrack = record.pupilPremiumAllocation === 0 ||
    (record.pupilPremiumSpent / record.pupilPremiumAllocation) * 100 >= PP_SPEND_TARGET_RATE;
  if (!ppSpendOnTrack && record.pupilPremiumAllocation > 0) {
    const spendRate = Math.round((record.pupilPremiumSpent / record.pupilPremiumAllocation) * 100);
    issues.push(`PP+ utilisation low: ${spendRate}% spent (target: ${PP_SPEND_TARGET_RATE}%+).`);
    recommendations.push("Review PP+ spend plan with school. Ensure funding is targeted to PEP objectives.");
  }

  // Target progress
  const totalTargets = record.pepTargets.length;
  const onTrackTargets = record.pepTargets.filter(t =>
    t.progress === "in_progress" || t.progress === "achieved",
  ).length;
  const targetProgress = totalTargets > 0 ? Math.round((onTrackTargets / totalTargets) * 100) : 100;

  if (targetProgress < 50 && totalTargets > 0) {
    recommendations.push("Less than 50% of PEP targets on track — review targets at next PEP.");
  }

  // Attainment concerns
  const belowCount = record.attainmentLevels.filter(a => a.progress === "below_target").length;
  if (belowCount >= 2) {
    recommendations.push(`${belowCount} subjects below target — consider tutoring or additional support.`);
  }

  // SEN/EHCP
  if (record.senStatus === "ehcp" && !record.ehcpInPlace) {
    issues.push("EHCP identified as needed but not in place.");
    recommendations.push("Chase EHCP application with LA SEND team.");
  }

  const isCompliant = issues.length === 0;

  return {
    childId: record.childId,
    childName: record.childName,
    isCompliant,
    issues,
    pepCompliant,
    attendanceCompliant,
    attendancePercentage: record.attendancePercentage,
    exclusionConcerns,
    ppSpendOnTrack,
    targetProgress,
    recommendations,
  };
}

// ── Core: Home Education Metrics ─────────────────────────────────────────

export function calculateHomeEducationMetrics(
  records: ChildEducationRecord[],
  homeId: string,
  now?: string,
): HomeEducationMetrics {
  const homeRecords = records.filter(r => r.homeId === homeId);

  // Attendance
  const averageAttendance = homeRecords.length > 0
    ? Math.round(homeRecords.reduce((s, r) => s + r.attendancePercentage, 0) / homeRecords.length)
    : 100;

  // PEP compliance
  const pepCompliant = homeRecords.filter(r => r.pepStatus === "current").length;
  const pepComplianceRate = homeRecords.length > 0
    ? Math.round((pepCompliant / homeRecords.length) * 100)
    : 100;

  // Exclusions
  const allExclusions = homeRecords.flatMap(r => r.exclusions);
  const exclusionCount = allExclusions.length;
  const exclusionDays = allExclusions.reduce((s, e) => s + e.days, 0);

  // Target progress
  const allTargets = homeRecords.flatMap(r => r.pepTargets);
  const onTrack = allTargets.filter(t => t.progress === "in_progress" || t.progress === "achieved").length;
  const averageTargetProgress = allTargets.length > 0
    ? Math.round((onTrack / allTargets.length) * 100)
    : 100;

  // Attainment distribution
  const allAttainment = homeRecords.flatMap(r => r.attainmentLevels);
  const childrenBelowExpected = homeRecords.filter(r =>
    r.attainmentLevels.some(a => a.currentLevel === "significantly_below" || a.currentLevel === "below"),
  ).length;
  const childrenAtExpected = homeRecords.filter(r =>
    r.attainmentLevels.every(a => a.currentLevel === "age_expected") && r.attainmentLevels.length > 0,
  ).length;
  const childrenAboveExpected = homeRecords.filter(r =>
    r.attainmentLevels.some(a => a.currentLevel === "above" || a.currentLevel === "well_above"),
  ).length;

  // Pupil Premium
  const totalPPAllocation = homeRecords.reduce((s, r) => s + r.pupilPremiumAllocation, 0);
  const totalPPSpent = homeRecords.reduce((s, r) => s + r.pupilPremiumSpent, 0);
  const ppUtilisationRate = totalPPAllocation > 0
    ? Math.round((totalPPSpent / totalPPAllocation) * 100)
    : 100;

  // Concerns
  const concerns: { childId: string; childName: string; concern: string }[] = [];
  for (const record of homeRecords) {
    if (record.attendancePercentage < ATTENDANCE_CONCERN) {
      concerns.push({ childId: record.childId, childName: record.childName, concern: `Persistent absence (${record.attendancePercentage}%)` });
    }
    if (record.pepStatus === "overdue" || record.pepStatus === "not_started") {
      concerns.push({ childId: record.childId, childName: record.childName, concern: `PEP ${record.pepStatus}` });
    }
    if (record.exclusions.length > 0) {
      concerns.push({ childId: record.childId, childName: record.childName, concern: `${record.exclusions.length} exclusion(s)` });
    }
  }

  return {
    homeId,
    childCount: homeRecords.length,
    averageAttendance,
    pepComplianceRate,
    exclusionCount,
    exclusionDays,
    averageTargetProgress,
    childrenBelowExpected,
    childrenAtExpected,
    childrenAboveExpected,
    totalPPAllocation,
    totalPPSpent,
    ppUtilisationRate,
    concerns,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function getEducationStatusLabel(status: EducationStatus): string {
  const labels: Record<EducationStatus, string> = {
    enrolled_mainstream: "Enrolled (Mainstream)",
    enrolled_special: "Enrolled (Special School)",
    alternative_provision: "Alternative Provision",
    home_educated: "Home Educated",
    awaiting_placement: "Awaiting School Placement",
    excluded_fixed: "Fixed-Term Exclusion",
    excluded_permanent: "Permanently Excluded",
    elective_home_education: "Elective Home Education",
    neet: "NEET (16+)",
  };
  return labels[status];
}

export function getKeyStageLabel(ks: KeyStage): string {
  const labels: Record<KeyStage, string> = {
    eyfs: "Early Years Foundation Stage",
    ks1: "Key Stage 1 (Y1-Y2)",
    ks2: "Key Stage 2 (Y3-Y6)",
    ks3: "Key Stage 3 (Y7-Y9)",
    ks4: "Key Stage 4 (Y10-Y11)",
    ks5: "Key Stage 5 (Y12-Y13)",
    post_16: "Post-16",
  };
  return labels[ks];
}

export function getAttainmentLabel(level: AttainmentLevel): string {
  const labels: Record<AttainmentLevel, string> = {
    significantly_below: "Significantly Below Expected",
    below: "Below Expected",
    age_expected: "Age Expected",
    above: "Above Expected",
    well_above: "Well Above Expected",
  };
  return labels[level];
}
