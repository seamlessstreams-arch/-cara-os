// ══════════════════════════════════════════════════════════════════════════════
// Cara Education Achievement Intelligence Engine
//
// Evaluates educational outcomes, attendance, PEP quality, academic progress,
// school stability, and exclusion impact for looked-after children.
//
// Regulatory basis:
//   - CHR 2015 Reg 8 (education standard)
//   - NMS 8 (education)
//   - Virtual School Head guidance
//   - SCCIF — education outcomes for looked-after children
//   - DfE Promoting the Educational Achievement of Looked After Children
//   - UNCRC Article 28 (right to education)
//   - UNCRC Article 29 (aims of education)
//   - SEND Code of Practice 2015
//
// Pure deterministic engine — no AI, no external calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Type Definitions ─────────────────────────────────────────────────────────

export type SchoolType =
  | "mainstream"
  | "special"
  | "pupil_referral_unit"
  | "alternative_provision"
  | "home_educated"
  | "not_in_education";

export type AttendanceStatus =
  | "present"
  | "authorised_absence"
  | "unauthorised_absence"
  | "excluded"
  | "late";

export type PEPStatus =
  | "current"
  | "overdue"
  | "not_started"
  | "completed";

export type PEPQuality =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

export type AcademicProgress =
  | "exceeding"
  | "expected"
  | "below_expected"
  | "significantly_below"
  | "not_assessed";

export type ExclusionType =
  | "fixed_term"
  | "permanent"
  | "internal";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ─────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  status: AttendanceStatus;
  schoolName: string;
}

export interface PEPRecord {
  id: string;
  childId: string;
  childName: string;
  pepDate: string;
  status: PEPStatus;
  quality: PEPQuality;
  childViewsIncluded: boolean;
  targetsSMART: boolean;
  virtualSchoolInvolved: boolean;
  ppFundingUsed: boolean;
  reviewDate: string;
}

export interface AcademicOutcome {
  id: string;
  childId: string;
  childName: string;
  subject: string;
  progress: AcademicProgress;
  assessmentDate: string;
  predictedGrade?: string;
  achievedGrade?: string;
}

export interface SchoolStability {
  id: string;
  childId: string;
  childName: string;
  schoolType: SchoolType;
  currentSchoolName: string;
  schoolChangesInYear: number;
  reasonForChange?: string;
  daysOutOfEducation: number;
}

export interface ExclusionRecord {
  id: string;
  childId: string;
  childName: string;
  exclusionType: ExclusionType;
  durationDays: number | null;
  reason: string;
  alternativeProvisionArranged: boolean;
  reintegrationPlanInPlace: boolean;
}

// ── Result Interfaces ────────────────────────────────────────────────────────

export interface AttendanceResult {
  overallScore: number | null; // 0-25
  totalRecords: number;
  attendanceRate: number | null;
  unauthorisedAbsenceRate: number | null;
  persistentAbsenceChildren: number;
  lateRate: number | null;
  exclusionDays: number | null;
}

export interface PEPQualityResult {
  overallScore: number | null; // 0-25
  totalPEPs: number;
  currentRate: number | null;
  qualityDistribution: Record<PEPQuality, number>;
  childViewsRate: number | null;
  smartTargetsRate: number | null;
  virtualSchoolInvolvedRate: number | null;
  ppFundingUsedRate: number | null;
}

export interface AcademicProgressResult {
  overallScore: number | null; // 0-25
  totalOutcomes: number;
  exceedingExpectedRate: number | null;
  belowExpectedRate: number | null;
  subjectCoverage: number | null;
  uniqueSubjects: string[];
}

export interface SchoolStabilityResult {
  overallScore: number | null; // 0-25
  totalChildren: number;
  totalDaysOutOfEducation: number;
  averageDaysOutOfEducation: number;
  totalSchoolChanges: number;
  childrenWithMultipleChanges: number;
  exclusionImpactDays: number | null;
  notInEducationCount: number;
}

export interface ChildEducationProfile {
  childId: string;
  childName: string;
  attendanceRate: number | null;
  pepStatus: PEPStatus | "none";
  academicProgress: AcademicProgress | "none";
  schoolType: SchoolType | "unknown";
  daysOutOfEducation: number;
  exclusionCount: number;
  overallScore: number | null; // 0-10
}

export interface EducationAchievementIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number | null;
  rating: Rating;
  attendance: AttendanceResult;
  pepQuality: PEPQualityResult;
  academicProgress: AcademicProgressResult;
  schoolStability: SchoolStabilityResult;
  childProfiles: ChildEducationProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Label Functions ──────────────────────────────────────────────────────────

const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
  mainstream: "Mainstream",
  special: "Special School",
  pupil_referral_unit: "Pupil Referral Unit",
  alternative_provision: "Alternative Provision",
  home_educated: "Home Educated",
  not_in_education: "Not in Education",
};

const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  authorised_absence: "Authorised Absence",
  unauthorised_absence: "Unauthorised Absence",
  excluded: "Excluded",
  late: "Late",
};

const PEP_STATUS_LABELS: Record<PEPStatus, string> = {
  current: "Current",
  overdue: "Overdue",
  not_started: "Not Started",
  completed: "Completed",
};

const PEP_QUALITY_LABELS: Record<PEPQuality, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

const ACADEMIC_PROGRESS_LABELS: Record<AcademicProgress, string> = {
  exceeding: "Exceeding",
  expected: "Expected",
  below_expected: "Below Expected",
  significantly_below: "Significantly Below",
  not_assessed: "Not Assessed",
};

const EXCLUSION_TYPE_LABELS: Record<ExclusionType, string> = {
  fixed_term: "Fixed Term",
  permanent: "Permanent",
  internal: "Internal",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getSchoolTypeLabel(t: SchoolType): string {
  return SCHOOL_TYPE_LABELS[t] ?? t;
}

export function getAttendanceStatusLabel(s: AttendanceStatus): string {
  return ATTENDANCE_STATUS_LABELS[s] ?? s;
}

export function getPEPStatusLabel(s: PEPStatus): string {
  return PEP_STATUS_LABELS[s] ?? s;
}

export function getPEPQualityLabel(q: PEPQuality): string {
  return PEP_QUALITY_LABELS[q] ?? q;
}

export function getAcademicProgressLabel(p: AcademicProgress): string {
  return ACADEMIC_PROGRESS_LABELS[p] ?? p;
}

export function getExclusionTypeLabel(t: ExclusionType): string {
  return EXCLUSION_TYPE_LABELS[t] ?? t;
}

export function getRatingLabel(r: Rating): string {
  return RATING_LABELS[r] ?? r;
}

// ── Utility ──────────────────────────────────────────────────────────────────

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluation Functions ─────────────────────────────────────────────────────

/**
 * Evaluates attendance rates, unauthorised absence, and persistent absence.
 * Max score: 25
 * Empty data = 0 (no attendance records is a concern)
 */
export function evaluateAttendance(
  attendance: AttendanceRecord[],
): AttendanceResult {
  if (attendance.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      attendanceRate: 0,
      unauthorisedAbsenceRate: 0,
      persistentAbsenceChildren: 0,
      lateRate: 0,
      exclusionDays: 0,
    };
  }

  let score = 0;

  // Attendance rate (present + late count as attending)
  const present = attendance.filter(
    (a) => a.status === "present" || a.status === "late",
  ).length;
  const attendanceRate = pct(present, attendance.length);

  // +10 for ≥ 95%, +7 for ≥ 90%, +4 for ≥ 85%, +2 for ≥ 80%
  if (attendanceRate >= 95) score += 10;
  else if (attendanceRate >= 90) score += 7;
  else if (attendanceRate >= 85) score += 4;
  else if (attendanceRate >= 80) score += 2;

  // Unauthorised absence rate
  const unauthorised = attendance.filter(
    (a) => a.status === "unauthorised_absence",
  ).length;
  const unauthorisedAbsenceRate = pct(unauthorised, attendance.length);

  // +5 for 0%, +3 for < 3%, +1 for < 5%
  if (unauthorisedAbsenceRate === 0) score += 5;
  else if (unauthorisedAbsenceRate <= 3) score += 3;
  else if (unauthorisedAbsenceRate <= 5) score += 1;

  // Persistent absence (children with < 90% attendance)
  const childAttendance = new Map<string, { present: number; total: number }>();
  for (const a of attendance) {
    const entry = childAttendance.get(a.childId) ?? { present: 0, total: 0 };
    entry.total += 1;
    if (a.status === "present" || a.status === "late") {
      entry.present += 1;
    }
    childAttendance.set(a.childId, entry);
  }
  let persistentAbsenceChildren = 0;
  childAttendance.forEach((entry) => {
    if (pct(entry.present, entry.total) < 90) {
      persistentAbsenceChildren += 1;
    }
  });

  // +5 for no persistent absence, +3 for ≤ 1 child
  if (persistentAbsenceChildren === 0) score += 5;
  else if (persistentAbsenceChildren <= 1) score += 3;

  // Late rate
  const late = attendance.filter((a) => a.status === "late").length;
  const lateRate = pct(late, attendance.length);

  // +3 for < 3% late, +1 for < 5%
  if (lateRate < 3) score += 3;
  else if (lateRate < 5) score += 1;

  // Exclusion days
  const excluded = attendance.filter((a) => a.status === "excluded").length;

  // +2 for no exclusion days
  if (excluded === 0) score += 2;

  return {
    overallScore: Math.min(score, 25),
    totalRecords: attendance.length,
    attendanceRate,
    unauthorisedAbsenceRate,
    persistentAbsenceChildren,
    lateRate,
    exclusionDays: excluded,
  };
}

/**
 * Evaluates PEP quality — currency, quality distribution, child views,
 * SMART targets, virtual school involvement, and PP funding usage.
 * Max score: 25
 * Empty data = 0 (no PEPs is a regulatory failing)
 */
export function evaluatePEPQuality(
  peps: PEPRecord[],
): PEPQualityResult {
  const qualityDistribution: Record<PEPQuality, number> = {
    outstanding: 0,
    good: 0,
    requires_improvement: 0,
    inadequate: 0,
  };

  if (peps.length === 0) {
    return {
      overallScore: 0,
      totalPEPs: 0,
      currentRate: 0,
      qualityDistribution,
      childViewsRate: 0,
      smartTargetsRate: 0,
      virtualSchoolInvolvedRate: 0,
      ppFundingUsedRate: 0,
    };
  }

  let score = 0;

  // PEP currency (current or completed = current)
  const current = peps.filter(
    (p) => p.status === "current" || p.status === "completed",
  ).length;
  const currentRate = pct(current, peps.length);

  // +5 for 100% current, +3 for ≥ 80%
  if (currentRate >= 100) score += 5;
  else if (currentRate >= 80) score += 3;
  else if (currentRate >= 60) score += 1;

  // Quality distribution
  for (const p of peps) {
    qualityDistribution[p.quality] += 1;
  }
  const goodOrOutstanding = qualityDistribution.outstanding + qualityDistribution.good;
  const goodRate = pct(goodOrOutstanding, peps.length);

  // +5 for ≥ 90% good/outstanding, +3 for ≥ 70%
  if (goodRate >= 90) score += 5;
  else if (goodRate >= 70) score += 3;
  else if (goodRate >= 50) score += 1;

  // Child views included
  const childViews = peps.filter((p) => p.childViewsIncluded).length;
  const childViewsRate = pct(childViews, peps.length);

  // +4 for 100%, +2 for ≥ 80%
  if (childViewsRate >= 100) score += 4;
  else if (childViewsRate >= 80) score += 2;

  // SMART targets
  const smartTargets = peps.filter((p) => p.targetsSMART).length;
  const smartTargetsRate = pct(smartTargets, peps.length);

  // +4 for 100%, +2 for ≥ 80%
  if (smartTargetsRate >= 100) score += 4;
  else if (smartTargetsRate >= 80) score += 2;

  // Virtual school involvement
  const vsInvolved = peps.filter((p) => p.virtualSchoolInvolved).length;
  const virtualSchoolInvolvedRate = pct(vsInvolved, peps.length);

  // +4 for 100%, +2 for ≥ 80%
  if (virtualSchoolInvolvedRate >= 100) score += 4;
  else if (virtualSchoolInvolvedRate >= 80) score += 2;

  // PP funding used
  const ppUsed = peps.filter((p) => p.ppFundingUsed).length;
  const ppFundingUsedRate = pct(ppUsed, peps.length);

  // +3 for ≥ 80%, +1 for ≥ 50%
  if (ppFundingUsedRate >= 80) score += 3;
  else if (ppFundingUsedRate >= 50) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalPEPs: peps.length,
    currentRate,
    qualityDistribution,
    childViewsRate,
    smartTargetsRate,
    virtualSchoolInvolvedRate,
    ppFundingUsedRate,
  };
}

/**
 * Evaluates academic progress — expected/exceeding rates and subject coverage.
 * Max score: 25
 * Empty data = 0 (no outcomes recorded is a concern)
 */
export function evaluateAcademicProgress(
  outcomes: AcademicOutcome[],
): AcademicProgressResult {
  if (outcomes.length === 0) {
    return {
      overallScore: 0,
      totalOutcomes: 0,
      exceedingExpectedRate: 0,
      belowExpectedRate: 0,
      subjectCoverage: 0,
      uniqueSubjects: [],
    };
  }

  let score = 0;

  // Assessed outcomes only (exclude not_assessed)
  const assessed = outcomes.filter((o) => o.progress !== "not_assessed");
  const assessedCount = assessed.length;

  // Exceeding + expected rate
  const exceedingExpected = assessed.filter(
    (o) => o.progress === "exceeding" || o.progress === "expected",
  ).length;
  const exceedingExpectedRate = pct(exceedingExpected, assessedCount);

  // +10 for ≥ 80%, +7 for ≥ 60%, +4 for ≥ 40%
  if (exceedingExpectedRate >= 80) score += 10;
  else if (exceedingExpectedRate >= 60) score += 7;
  else if (exceedingExpectedRate >= 40) score += 4;
  else if (exceedingExpectedRate > 0) score += 1;

  // Below expected rate
  const belowExpected = assessed.filter(
    (o) =>
      o.progress === "below_expected" ||
      o.progress === "significantly_below",
  ).length;
  const belowExpectedRate = pct(belowExpected, assessedCount);

  // +5 for 0% below, +3 for < 20%, +1 for < 40%
  if (assessedCount > 0 && belowExpectedRate === 0) score += 5;
  else if (belowExpectedRate < 20) score += 3;
  else if (belowExpectedRate < 40) score += 1;

  // Subject coverage
  const uniqueSubjects = Array.from(
    new Set(outcomes.map((o) => o.subject.toLowerCase())),
  );
  const subjectCoverage = uniqueSubjects.length;

  // +5 for ≥ 5 subjects, +3 for ≥ 3, +1 for ≥ 1
  if (subjectCoverage >= 5) score += 5;
  else if (subjectCoverage >= 3) score += 3;
  else if (subjectCoverage >= 1) score += 1;

  // Bonus for exceeding in core subjects (English, Maths, Science)
  const coreSubjects = ["english", "maths", "mathematics", "science"];
  const coreExceeding = assessed.filter(
    (o) =>
      coreSubjects.includes(o.subject.toLowerCase()) &&
      o.progress === "exceeding",
  ).length;
  if (coreExceeding >= 2) score += 5;
  else if (coreExceeding >= 1) score += 3;

  return {
    overallScore: Math.min(score, 25),
    totalOutcomes: outcomes.length,
    exceedingExpectedRate,
    belowExpectedRate,
    subjectCoverage,
    uniqueSubjects,
  };
}

/**
 * Evaluates school stability — days out of education, school changes,
 * and exclusion impact.
 * Max score: 25
 * Empty data = 25 (no stability records means all children are in stable placements)
 */
export function evaluateSchoolStability(
  stability: SchoolStability[],
  exclusions: ExclusionRecord[],
): SchoolStabilityResult {
  if (stability.length === 0) {
    return {
      overallScore: 25,
      totalChildren: 0,
      totalDaysOutOfEducation: 0,
      averageDaysOutOfEducation: 0,
      totalSchoolChanges: 0,
      childrenWithMultipleChanges: 0,
      exclusionImpactDays: 0,
      notInEducationCount: 0,
    };
  }

  let score = 25; // Start at max and deduct

  const totalChildren = stability.length;

  // Days out of education
  const totalDaysOut = stability.reduce(
    (sum, s) => sum + s.daysOutOfEducation,
    0,
  );
  const avgDaysOut = Math.round(totalDaysOut / totalChildren);

  // Deduct for days out of education
  if (avgDaysOut > 20) score -= 8;
  else if (avgDaysOut > 10) score -= 5;
  else if (avgDaysOut > 5) score -= 3;
  else if (avgDaysOut > 0) score -= 1;

  // School changes
  const totalChanges = stability.reduce(
    (sum, s) => sum + s.schoolChangesInYear,
    0,
  );
  const childrenWithMultipleChanges = stability.filter(
    (s) => s.schoolChangesInYear > 1,
  ).length;

  // Deduct for school changes
  if (totalChanges > stability.length * 2) score -= 6;
  else if (totalChanges > stability.length) score -= 4;
  else if (totalChanges > 0) score -= 2;

  // Deduct for children with multiple changes
  if (childrenWithMultipleChanges > 0) score -= 2;

  // Exclusion impact
  const exclusionDays = exclusions.reduce(
    (sum, e) => sum + e.durationDays,
    0,
  );

  if (exclusionDays > 15) score -= 5;
  else if (exclusionDays > 5) score -= 3;
  else if (exclusionDays > 0) score -= 1;

  // Permanent exclusions — severe penalty
  const permanentExclusions = exclusions.filter(
    (e) => e.exclusionType === "permanent",
  ).length;
  if (permanentExclusions > 0) score -= 4;

  // Not in education
  const notInEd = stability.filter(
    (s) => s.schoolType === "not_in_education",
  ).length;
  if (notInEd > 0) score -= 3;

  return {
    overallScore: Math.max(0, Math.min(score, 25)),
    totalChildren,
    totalDaysOutOfEducation: totalDaysOut,
    averageDaysOutOfEducation: avgDaysOut,
    totalSchoolChanges: totalChanges,
    childrenWithMultipleChanges,
    exclusionImpactDays: exclusionDays,
    notInEducationCount: notInEd,
  };
}

// ── Child Profiles ───────────────────────────────────────────────────────────

export function buildChildEducationProfiles(
  attendance: AttendanceRecord[],
  peps: PEPRecord[],
  outcomes: AcademicOutcome[],
  stability: SchoolStability[],
  exclusions: ExclusionRecord[],
): ChildEducationProfile[] {
  // Gather unique child IDs from all sources
  const childIds = new Set<string>();
  for (const a of attendance) childIds.add(a.childId);
  for (const p of peps) childIds.add(p.childId);
  for (const o of outcomes) childIds.add(o.childId);
  for (const s of stability) childIds.add(s.childId);
  for (const e of exclusions) childIds.add(e.childId);

  // Build a name lookup
  const nameMap = new Map<string, string>();
  for (const a of attendance) nameMap.set(a.childId, a.childName);
  for (const p of peps) nameMap.set(p.childId, p.childName);
  for (const o of outcomes) nameMap.set(o.childId, o.childName);
  for (const s of stability) nameMap.set(s.childId, s.childName);
  for (const e of exclusions) nameMap.set(e.childId, e.childName);

  return Array.from(childIds).map((childId) => {
    const childAttendance = attendance.filter((a) => a.childId === childId);
    const childPeps = peps.filter((p) => p.childId === childId);
    const childOutcomes = outcomes
      .filter((o) => o.childId === childId)
      .filter((o) => o.progress !== "not_assessed");
    const childStability = stability.find((s) => s.childId === childId);
    const childExclusions = exclusions.filter((e) => e.childId === childId);

    // Attendance rate
    const presentOrLate = childAttendance.filter(
      (a) => a.status === "present" || a.status === "late",
    ).length;
    const attendanceRate = childAttendance.length > 0
      ? pct(presentOrLate, childAttendance.length)
      : 0;

    // Latest PEP status
    const latestPep = childPeps.length > 0
      ? childPeps.reduce((latest, p) =>
          p.pepDate > latest.pepDate ? p : latest,
        )
      : null;
    const pepStatus: PEPStatus | "none" = latestPep ? latestPep.status : "none";

    // Predominant academic progress
    let academicProgress: AcademicProgress | "none" = "none";
    if (childOutcomes.length > 0) {
      const progressCounts: Record<string, number> = {};
      for (const o of childOutcomes) {
        progressCounts[o.progress] = (progressCounts[o.progress] ?? 0) + 1;
      }
      let maxCount = 0;
      const progressKeys = Object.keys(progressCounts);
      for (const progress of progressKeys) {
        if (progressCounts[progress] > maxCount) {
          maxCount = progressCounts[progress];
          academicProgress = progress as AcademicProgress;
        }
      }
    }

    // School type
    const schoolType: SchoolType | "unknown" = childStability
      ? childStability.schoolType
      : "unknown";

    // Days out of education
    const daysOutOfEducation = childStability
      ? childStability.daysOutOfEducation
      : 0;

    // Exclusion count
    const exclusionCount = childExclusions.length;

    // Score 0-10
    let profileScore = 3;

    // Attendance
    if (attendanceRate >= 95) profileScore += 2;
    else if (attendanceRate >= 90) profileScore += 1;
    else if (attendanceRate < 80 && childAttendance.length > 0) profileScore -= 1;

    // PEP
    if (pepStatus === "current" || pepStatus === "completed") profileScore += 1;
    else if (pepStatus === "overdue") profileScore -= 1;

    // Academic progress
    if (academicProgress === "exceeding") profileScore += 2;
    else if (academicProgress === "expected") profileScore += 1;
    else if (academicProgress === "significantly_below") profileScore -= 1;

    // Days out of education
    if (daysOutOfEducation === 0) profileScore += 1;
    else if (daysOutOfEducation > 10) profileScore -= 1;

    // Exclusions
    if (exclusionCount > 0) profileScore -= 1;

    return {
      childId,
      childName: nameMap.get(childId) ?? "Unknown",
      attendanceRate,
      pepStatus,
      academicProgress,
      schoolType,
      daysOutOfEducation,
      exclusionCount,
      overallScore: Math.max(0, Math.min(profileScore, 10)),
    };
  });
}

// ── Strengths / Areas / Actions ──────────────────────────────────────────────

function generateStrengths(
  att: AttendanceResult,
  pep: PEPQualityResult,
  academic: AcademicProgressResult,
  stab: SchoolStabilityResult,
): string[] {
  const strengths: string[] = [];

  if (att.attendanceRate >= 95) {
    strengths.push(
      "Excellent attendance rate — children consistently attending school at above-average levels",
    );
  } else if (att.attendanceRate >= 90 && att.totalRecords > 0) {
    strengths.push(
      "Good attendance levels — above the persistent absence threshold across the home",
    );
  }

  if (att.unauthorisedAbsenceRate === 0 && att.totalRecords > 0) {
    strengths.push(
      "Zero unauthorised absences — strong partnership between home and schools",
    );
  }

  if (pep.currentRate >= 100 && pep.totalPEPs > 0) {
    strengths.push(
      "All PEPs are current — meeting statutory requirement for termly review",
    );
  }

  if (pep.childViewsRate >= 100 && pep.totalPEPs > 0) {
    strengths.push(
      "Child views consistently included in all PEPs — children actively shaping their education plans",
    );
  }

  if (pep.smartTargetsRate >= 100 && pep.totalPEPs > 0) {
    strengths.push(
      "All PEP targets are SMART — clear, measurable goals supporting academic progress",
    );
  }

  if (pep.virtualSchoolInvolvedRate >= 100 && pep.totalPEPs > 0) {
    strengths.push(
      "Virtual school head involved in all PEPs — effective multi-agency collaboration",
    );
  }

  if (academic.exceedingExpectedRate >= 80 && academic.totalOutcomes > 0) {
    strengths.push(
      "Excellent academic progress — the majority of children exceeding or meeting expected levels",
    );
  } else if (academic.exceedingExpectedRate >= 60 && academic.totalOutcomes > 0) {
    strengths.push(
      "Good academic progress — most children making expected or better progress",
    );
  }

  if (academic.subjectCoverage >= 5) {
    strengths.push(
      "Strong subject coverage — academic outcomes recorded across a broad curriculum",
    );
  }

  if (stab.totalDaysOutOfEducation === 0 && stab.totalChildren > 0) {
    strengths.push(
      "No days out of education — all children have continuous educational provision",
    );
  }

  if (stab.exclusionImpactDays === 0 && stab.totalChildren > 0) {
    strengths.push(
      "No exclusion days — positive behaviour in school maintained",
    );
  }

  if (stab.notInEducationCount === 0 && stab.totalChildren > 0) {
    strengths.push(
      "All children in educational placements — no NEET children",
    );
  }

  return strengths;
}

function generateAreasForImprovement(
  att: AttendanceResult,
  pep: PEPQualityResult,
  academic: AcademicProgressResult,
  stab: SchoolStabilityResult,
): string[] {
  const areas: string[] = [];

  if (att.attendanceRate < 90 && att.totalRecords > 0) {
    areas.push(
      `Attendance at ${att.attendanceRate}% — below the 90% threshold. Address barriers to attendance for individual children`,
    );
  }

  if (att.unauthorisedAbsenceRate > 3 && att.totalRecords > 0) {
    areas.push(
      `Unauthorised absence rate at ${att.unauthorisedAbsenceRate}% — needs immediate attention to prevent escalation`,
    );
  }

  if (att.persistentAbsenceChildren > 0) {
    areas.push(
      `${att.persistentAbsenceChildren} child(ren) with persistent absence (below 90%) — individual attendance plans needed`,
    );
  }

  if (pep.currentRate < 100 && pep.totalPEPs > 0) {
    areas.push(
      `Only ${pep.currentRate}% of PEPs are current — statutory requirement is termly review for all LAC`,
    );
  }

  if (pep.childViewsRate < 100 && pep.totalPEPs > 0) {
    areas.push(
      `Child views included in only ${pep.childViewsRate}% of PEPs — all children should contribute their voice`,
    );
  }

  if (pep.smartTargetsRate < 100 && pep.totalPEPs > 0) {
    areas.push(
      `SMART targets in only ${pep.smartTargetsRate}% of PEPs — all targets should be specific, measurable, achievable, relevant, and time-bound`,
    );
  }

  if (academic.belowExpectedRate > 30 && academic.totalOutcomes > 0) {
    areas.push(
      `${academic.belowExpectedRate}% of academic outcomes below expected — additional support and intervention needed`,
    );
  }

  if (stab.totalDaysOutOfEducation > 0) {
    areas.push(
      `${stab.totalDaysOutOfEducation} total days out of education — every day matters for looked-after children`,
    );
  }

  if (stab.childrenWithMultipleChanges > 0) {
    areas.push(
      `${stab.childrenWithMultipleChanges} child(ren) experienced multiple school changes — school stability is critical for educational achievement`,
    );
  }

  if (stab.exclusionImpactDays > 0) {
    areas.push(
      `${stab.exclusionImpactDays} days lost to exclusions — explore restorative and alternative approaches`,
    );
  }

  if (stab.notInEducationCount > 0) {
    areas.push(
      `${stab.notInEducationCount} child(ren) not in education — urgent action required to secure educational provision`,
    );
  }

  if (att.totalRecords === 0) {
    areas.push(
      "No attendance records — attendance monitoring must be in place for all children",
    );
  }

  if (pep.totalPEPs === 0) {
    areas.push(
      "No PEP records — Personal Education Plans are a statutory requirement for all looked-after children",
    );
  }

  return areas;
}

function generateActions(
  att: AttendanceResult,
  pep: PEPQualityResult,
  academic: AcademicProgressResult,
  stab: SchoolStabilityResult,
): string[] {
  const actions: string[] = [];

  if (att.totalRecords === 0) {
    actions.push(
      "URGENT: Implement attendance tracking for all children — Reg 8 requires the home to promote educational attendance",
    );
  }

  if (pep.totalPEPs === 0) {
    actions.push(
      "URGENT: Initiate PEPs for all children — statutory requirement under the Virtual School Head guidance",
    );
  }

  if (att.persistentAbsenceChildren > 0) {
    actions.push(
      "Create individual attendance improvement plans for children with persistent absence — liaise with schools and virtual school head",
    );
  }

  if (att.unauthorisedAbsenceRate > 3 && att.totalRecords > 0) {
    actions.push(
      "Review unauthorised absence patterns — identify root causes and develop targeted support strategies",
    );
  }

  if (pep.currentRate < 100 && pep.totalPEPs > 0) {
    actions.push(
      "Schedule overdue PEP reviews immediately — ensure virtual school head and designated teacher are invited",
    );
  }

  if (pep.childViewsRate < 100 && pep.totalPEPs > 0) {
    actions.push(
      "Ensure all children contribute to their PEP — use child-friendly methods to capture views and aspirations",
    );
  }

  if (pep.ppFundingUsedRate < 50 && pep.totalPEPs > 0) {
    actions.push(
      "Review Pupil Premium Plus usage — ensure funding is targeted at improving educational outcomes for each child",
    );
  }

  if (academic.belowExpectedRate > 30 && academic.totalOutcomes > 0) {
    actions.push(
      "Commission additional tutoring or intervention for children below expected progress — consider PP+ funding",
    );
  }

  if (academic.totalOutcomes === 0) {
    actions.push(
      "Establish academic progress tracking — request assessment data from schools for all children",
    );
  }

  if (stab.notInEducationCount > 0) {
    actions.push(
      "URGENT: Work with virtual school head to secure educational placements for NEET children within 20 school days",
    );
  }

  if (stab.exclusionImpactDays > 5) {
    actions.push(
      "Review exclusion patterns — engage with schools on restorative approaches and ensure alternative provision is in place",
    );
  }

  if (stab.childrenWithMultipleChanges > 0) {
    actions.push(
      "Review reasons for school changes — ensure placement stability plans include educational continuity",
    );
  }

  return actions;
}

// ── Main Intelligence Function ───────────────────────────────────────────────

export function generateEducationAchievementIntelligence(
  attendance: AttendanceRecord[],
  peps: PEPRecord[],
  outcomes: AcademicOutcome[],
  stability: SchoolStability[],
  exclusions: ExclusionRecord[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): EducationAchievementIntelligence {
  const attResult = evaluateAttendance(attendance);
  const pepResult = evaluatePEPQuality(peps);
  const academicResult = evaluateAcademicProgress(outcomes);
  const stabResult = evaluateSchoolStability(stability, exclusions);

  const overallScore =
    attResult.overallScore +
    pepResult.overallScore +
    academicResult.overallScore +
    stabResult.overallScore;

  const childProfiles = buildChildEducationProfiles(
    attendance,
    peps,
    outcomes,
    stability,
    exclusions,
  );

  const strengths = generateStrengths(
    attResult,
    pepResult,
    academicResult,
    stabResult,
  );
  const areasForImprovement = generateAreasForImprovement(
    attResult,
    pepResult,
    academicResult,
    stabResult,
  );
  const actions = generateActions(
    attResult,
    pepResult,
    academicResult,
    stabResult,
  );

  const regulatoryLinks = [
    "CHR 2015 Reg 8 — education standard requiring the registered person to promote educational achievement",
    "NMS 8 — education: children make measurable progress in their education",
    "Virtual School Head guidance — oversight of PEPs, attendance, and PP+ funding",
    "SCCIF — inspection of education outcomes and progress for looked-after children",
    "DfE Promoting the Educational Achievement of Looked After Children — statutory guidance",
    "UNCRC Article 28 — right to education on the basis of equal opportunity",
    "UNCRC Article 29 — education directed to the development of the child's fullest potential",
    "SEND Code of Practice 2015 — additional support for children with special educational needs",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore: Math.min(overallScore, 100),
    rating: getRating(overallScore),
    attendance: attResult,
    pepQuality: pepResult,
    academicProgress: academicResult,
    schoolStability: stabResult,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
