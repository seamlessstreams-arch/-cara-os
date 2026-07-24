// ══════════════════════════════════════════════════════════════════════════════
// Cara Education Attendance & Achievement Intelligence — Engine
//
// Deep-dive engine for attendance tracking, exclusion analysis, PEP quality,
// SEND support effectiveness, and achievement tracking across the home.
//
// Aligned to:
//   - CHR 2015 Reg 8 — The education standard
//   - CHR 2015 Reg 9 — Enjoyment & achievement
//   - SCCIF — Experiences & progress of children and young people
//   - Virtual School Head statutory guidance
//   - SEND Code of Practice 2015
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { below, meets } from "@/lib/metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type AttendanceStatus =
  | "present"
  | "authorised_absence"
  | "unauthorised_absence"
  | "excluded"
  | "late"
  | "school_holiday"
  | "EOTAS"; // Education Other Than At School

export type ExclusionType =
  | "fixed_term"
  | "permanent"
  | "internal"
  | "informal";

export type PEPStatus =
  | "current"
  | "overdue"
  | "draft"
  | "not_in_place";

export type SENDCategory =
  | "SEMH"   // Social, Emotional and Mental Health
  | "ASD"    // Autism Spectrum Disorder
  | "SpLD"   // Specific Learning Difficulty
  | "MLD"    // Moderate Learning Difficulty
  | "SLD"    // Severe Learning Difficulty
  | "SLCN"   // Speech, Language and Communication Needs
  | "PD"     // Physical Disability
  | "VI"     // Visual Impairment
  | "HI"     // Hearing Impairment
  | "MSI"    // Multi-Sensory Impairment
  | "none";

export type AchievementType =
  | "academic"
  | "vocational"
  | "personal"
  | "social"
  | "creative"
  | "physical"
  | "life_skills";

// ── Record Interfaces ──────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface ExclusionRecord {
  id: string;
  childId: string;
  childName: string;
  startDate: string;
  endDate?: string;
  exclusionType: ExclusionType;
  reason: string;
  daysExcluded: number;
  alternativeProvision: boolean;
  reintegrationMeeting: boolean;
  challengedByHome: boolean;
}

export interface PEPRecord {
  id: string;
  childId: string;
  childName: string;
  reviewDate: string;
  status: PEPStatus;
  virtualSchoolInvolved: boolean;
  childAttended: boolean;
  childVoiceRecorded: boolean;
  targetsSet: number;
  targetsAchieved: number;
  pupilPremiumSpend?: string;
  nextReviewDate: string;
}

export interface SENDSupportRecord {
  id: string;
  childId: string;
  childName: string;
  sendCategory: SENDCategory;
  ehcpInPlace: boolean;
  ehcpReviewDate?: string;
  supportDescription: string;
  providerName: string;
  hoursPerWeek: number;
  effectivenessRating: "excellent" | "good" | "adequate" | "poor";
  childView?: string;
}

export interface AchievementRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  achievementType: AchievementType;
  description: string;
  recognisedBy: string;
  celebrated: boolean;
  evidenceRecorded: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

// Rates are null where there was nothing to measure — no attendance marks in
// the period, no exclusions, no children on roll. Null is neither 0% nor 100%.
export interface AttendanceEvaluation {
  overallAttendanceRate: number | null;
  unauthorisedAbsenceRate: number | null;
  latenessRate: number | null;
  eotasDays: number;
  totalSchoolDays: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalUnauthorised: number;
  perChild: {
    childId: string;
    childName: string;
    attendanceRate: number | null;
    unauthorisedRate: number | null;
    latenessRate: number | null;
    eotasDays: number;
    totalDays: number;
    trend: "improving" | "stable" | "declining";
  }[];
}

export interface ExclusionEvaluation {
  totalExclusions: number;
  totalDaysLost: number;
  fixedTermCount: number;
  permanentCount: number;
  internalCount: number;
  informalCount: number;
  alternativeProvisionRate: number | null;
  reintegrationRate: number | null;
  homeChallengeRate: number | null;
  perChild: {
    childId: string;
    childName: string;
    exclusionCount: number;
    totalDays: number;
    types: ExclusionType[];
    challengedByHome: boolean;
  }[];
}

export interface PEPQualityEvaluation {
  pepCurrencyRate: number | null;
  virtualSchoolInvolvementRate: number;
  childAttendanceRate: number;
  childVoiceRate: number;
  targetAchievementRate: number;
  totalTargetsSet: number;
  totalTargetsAchieved: number;
  overduePEPs: number;
  draftPEPs: number;
  notInPlacePEPs: number;
  perChild: {
    childId: string;
    childName: string;
    pepStatus: PEPStatus;
    virtualSchoolInvolved: boolean;
    childAttended: boolean;
    childVoiceRecorded: boolean;
    targetsSet: number;
    targetsAchieved: number;
    nextReviewDate: string;
  }[];
}

export interface SENDSupportEvaluation {
  childrenWithSEND: number;
  sendCoverageRate: number | null;
  ehcpCount: number;
  ehcpCurrencyRate: number | null;
  averageHoursPerWeek: number;
  effectivenessBreakdown: {
    excellent: number;
    good: number;
    adequate: number;
    poor: number;
  };
  childVoiceCapturedRate: number;
  perChild: {
    childId: string;
    childName: string;
    sendCategory: SENDCategory;
    ehcpInPlace: boolean;
    ehcpCurrent: boolean;
    hoursPerWeek: number;
    effectivenessRating: string;
    hasChildView: boolean;
  }[];
}

export interface AchievementEvaluation {
  totalAchievements: number;
  achievementTypeBreakdown: Record<AchievementType, number>;
  typeVarietyScore: number;
  celebrationRate: number;
  evidenceRecordingRate: number;
  perChild: {
    childId: string;
    childName: string;
    achievementCount: number;
    types: AchievementType[];
    celebrationRate: number;
  }[];
}

export type OverallRating = "outstanding" | "good" | "requires_improvement" | "inadequate";

export interface EducationOutcomesIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  overallRating: OverallRating;
  breakdown: {
    attendance: { score: number; maxScore: 25 };
    exclusionManagement: { score: number; maxScore: 20 };
    pepQuality: { score: number; maxScore: 25 };
    sendSupport: { score: number; maxScore: 15 };
    achievements: { score: number; maxScore: 15 };
  };
  attendance: AttendanceEvaluation;
  exclusions: ExclusionEvaluation;
  pepQuality: PEPQualityEvaluation;
  sendSupport: SENDSupportEvaluation;
  achievements: AchievementEvaluation;
  childProfiles: {
    childId: string;
    childName: string;
    attendanceRate: number | null;
    pepStatus: PEPStatus;
    exclusionDays: number;
    achievementCount: number;
    sendCategory: SENDCategory;
  }[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: {
    regulation: string;
    description: string;
    status: "met" | "partially_met" | "not_met" | "not_evidenced";
  }[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const ATTENDANCE_TARGET = 95;        // 95% minimum for looked-after children
const ATTENDANCE_GOOD = 97;          // 97%+ is outstanding
const EXCLUSION_DAYS_CONCERN = 5;    // 5+ days lost triggers concern
const EHCP_REVIEW_MONTHS = 12;       // EHCP must be reviewed annually

/**
 * Percentage to one decimal place, or null when there is nothing to measure.
 * Same contract as `rate()`; this module reports to 0.1% so attendance figures
 * stay comparable with the school's own returns.
 */
function pct1(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

// ── 1. Evaluate Attendance ─────────────────────────────────────────────────

export function evaluateAttendance(
  records: AttendanceRecord[],
  childIds: string[],
  periodStart: string,
  periodEnd: string,
): AttendanceEvaluation {
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);

  // Filter records within period
  const periodRecords = records.filter(r => {
    const d = new Date(r.date);
    return d >= startDate && d <= endDate;
  });

  // Exclude school_holiday from countable days
  const countableRecords = periodRecords.filter(r => r.status !== "school_holiday");

  const totalSchoolDays = countableRecords.length;
  const totalPresent = countableRecords.filter(r =>
    r.status === "present" || r.status === "late" || r.status === "EOTAS",
  ).length;
  const totalLate = countableRecords.filter(r => r.status === "late").length;
  const totalUnauthorised = countableRecords.filter(r => r.status === "unauthorised_absence").length;
  const totalAbsent = countableRecords.filter(r =>
    r.status === "authorised_absence" || r.status === "unauthorised_absence" || r.status === "excluded",
  ).length;
  const eotasDays = countableRecords.filter(r => r.status === "EOTAS").length;

  const overallAttendanceRate = pct1(totalPresent, totalSchoolDays);
  const unauthorisedAbsenceRate = pct1(totalUnauthorised, totalSchoolDays);
  const latenessRate = pct1(totalLate, totalSchoolDays);

  // Per-child analysis
  const perChild = childIds.map(childId => {
    const childRecords = countableRecords.filter(r => r.childId === childId);
    const childName = childRecords.length > 0 ? childRecords[0].childName : childId;
    const childTotal = childRecords.length;
    const childPresent = childRecords.filter(r =>
      r.status === "present" || r.status === "late" || r.status === "EOTAS",
    ).length;
    const childLate = childRecords.filter(r => r.status === "late").length;
    const childUnauth = childRecords.filter(r => r.status === "unauthorised_absence").length;
    const childEOTAS = childRecords.filter(r => r.status === "EOTAS").length;

    // Trend: compare first half to second half
    const midDate = new Date((startDate.getTime() + endDate.getTime()) / 2);
    const firstHalf = childRecords.filter(r => new Date(r.date) <= midDate);
    const secondHalf = childRecords.filter(r => new Date(r.date) > midDate);

    // A half with no attendance records can't be scored — defaulting it to 1
    // (100%) invented a trend (an empty first half made any real second half
    // look like a decline, and vice versa). A trend needs data in BOTH halves.
    const firstRate = firstHalf.length > 0
      ? firstHalf.filter(r => r.status === "present" || r.status === "late" || r.status === "EOTAS").length / firstHalf.length
      : null;
    const secondRate = secondHalf.length > 0
      ? secondHalf.filter(r => r.status === "present" || r.status === "late" || r.status === "EOTAS").length / secondHalf.length
      : null;

    let trend: "improving" | "stable" | "declining" = "stable";
    if (firstRate !== null && secondRate !== null) {
      if (secondRate - firstRate > 0.03) trend = "improving";
      else if (firstRate - secondRate > 0.03) trend = "declining";
    }

    return {
      childId,
      childName,
      attendanceRate: pct1(childPresent, childTotal),
      unauthorisedRate: pct1(childUnauth, childTotal),
      latenessRate: pct1(childLate, childTotal),
      eotasDays: childEOTAS,
      totalDays: childTotal,
      trend,
    };
  });

  return {
    overallAttendanceRate,
    unauthorisedAbsenceRate,
    latenessRate,
    eotasDays,
    totalSchoolDays,
    totalPresent,
    totalAbsent,
    totalLate,
    totalUnauthorised,
    perChild,
  };
}

// ── 2. Evaluate Exclusions ─────────────────────────────────────────────────

export function evaluateExclusions(
  exclusions: ExclusionRecord[],
): ExclusionEvaluation {
  const totalExclusions = exclusions.length;
  const totalDaysLost = exclusions.reduce((s, e) => s + e.daysExcluded, 0);

  const fixedTermCount = exclusions.filter(e => e.exclusionType === "fixed_term").length;
  const permanentCount = exclusions.filter(e => e.exclusionType === "permanent").length;
  const internalCount = exclusions.filter(e => e.exclusionType === "internal").length;
  const informalCount = exclusions.filter(e => e.exclusionType === "informal").length;

  // Null when there were no exclusions — nothing to provide for, meet about or
  // challenge. The absence of exclusions is reported on its own terms below.
  const withAltProvision = exclusions.filter(e => e.alternativeProvision).length;
  const alternativeProvisionRate = pct1(withAltProvision, totalExclusions);

  const withReintegration = exclusions.filter(e => e.reintegrationMeeting).length;
  const reintegrationRate = pct1(withReintegration, totalExclusions);

  const challenged = exclusions.filter(e => e.challengedByHome).length;
  const homeChallengeRate = pct1(challenged, totalExclusions);

  // Per-child analysis
  const childMap = new Map<string, { childName: string; exclusions: ExclusionRecord[] }>();
  for (const exc of exclusions) {
    if (!childMap.has(exc.childId)) {
      childMap.set(exc.childId, { childName: exc.childName, exclusions: [] });
    }
    childMap.get(exc.childId)!.exclusions.push(exc);
  }

  const perChild = Array.from(childMap.entries()).map(([childId, data]) => ({
    childId,
    childName: data.childName,
    exclusionCount: data.exclusions.length,
    totalDays: data.exclusions.reduce((s, e) => s + e.daysExcluded, 0),
    types: [...new Set(data.exclusions.map(e => e.exclusionType))],
    challengedByHome: data.exclusions.some(e => e.challengedByHome),
  }));

  return {
    totalExclusions,
    totalDaysLost,
    fixedTermCount,
    permanentCount,
    internalCount,
    informalCount,
    alternativeProvisionRate,
    reintegrationRate,
    homeChallengeRate,
    perChild,
  };
}

// ── 3. Evaluate PEP Quality ────────────────────────────────────────────────

export function evaluatePEPQuality(
  peps: PEPRecord[],
  childIds: string[],
  referenceDate: string,
): PEPQualityEvaluation {
  // Get most recent PEP per child
  const latestPEPs = new Map<string, PEPRecord>();
  for (const pep of peps) {
    const existing = latestPEPs.get(pep.childId);
    if (!existing || new Date(pep.reviewDate) > new Date(existing.reviewDate)) {
      latestPEPs.set(pep.childId, pep);
    }
  }

  const relevantPEPs = childIds.map(id => latestPEPs.get(id)).filter((p): p is PEPRecord => p !== undefined);

  const currentCount = relevantPEPs.filter(p => p.status === "current").length;
  const overdueCount = relevantPEPs.filter(p => p.status === "overdue").length;
  const draftCount = relevantPEPs.filter(p => p.status === "draft").length;
  const notInPlaceCount = childIds.length - relevantPEPs.length +
    relevantPEPs.filter(p => p.status === "not_in_place").length;

  const pepCurrencyRate = pct1(currentCount, childIds.length);

  const vsInvolved = relevantPEPs.filter(p => p.virtualSchoolInvolved).length;
  const virtualSchoolInvolvementRate = relevantPEPs.length > 0
    ? Math.round((vsInvolved / relevantPEPs.length) * 1000) / 10
    : 0;

  const childAttended = relevantPEPs.filter(p => p.childAttended).length;
  const childAttendanceRate = relevantPEPs.length > 0
    ? Math.round((childAttended / relevantPEPs.length) * 1000) / 10
    : 0;

  const childVoice = relevantPEPs.filter(p => p.childVoiceRecorded).length;
  const childVoiceRate = relevantPEPs.length > 0
    ? Math.round((childVoice / relevantPEPs.length) * 1000) / 10
    : 0;

  const totalTargetsSet = relevantPEPs.reduce((s, p) => s + p.targetsSet, 0);
  const totalTargetsAchieved = relevantPEPs.reduce((s, p) => s + p.targetsAchieved, 0);
  const targetAchievementRate = totalTargetsSet > 0
    ? Math.round((totalTargetsAchieved / totalTargetsSet) * 1000) / 10
    : 0;

  const perChild = childIds.map(childId => {
    const pep = latestPEPs.get(childId);
    if (!pep) {
      return {
        childId,
        childName: childId,
        pepStatus: "not_in_place" as PEPStatus,
        virtualSchoolInvolved: false,
        childAttended: false,
        childVoiceRecorded: false,
        targetsSet: 0,
        targetsAchieved: 0,
        nextReviewDate: "",
      };
    }
    return {
      childId,
      childName: pep.childName,
      pepStatus: pep.status,
      virtualSchoolInvolved: pep.virtualSchoolInvolved,
      childAttended: pep.childAttended,
      childVoiceRecorded: pep.childVoiceRecorded,
      targetsSet: pep.targetsSet,
      targetsAchieved: pep.targetsAchieved,
      nextReviewDate: pep.nextReviewDate,
    };
  });

  return {
    pepCurrencyRate,
    virtualSchoolInvolvementRate,
    childAttendanceRate,
    childVoiceRate,
    targetAchievementRate,
    totalTargetsSet,
    totalTargetsAchieved,
    overduePEPs: overdueCount,
    draftPEPs: draftCount,
    notInPlacePEPs: notInPlaceCount,
    perChild,
  };
}

// ── 4. Evaluate SEND Support ───────────────────────────────────────────────

export function evaluateSENDSupport(
  supports: SENDSupportRecord[],
  childIds: string[],
): SENDSupportEvaluation {
  const childrenWithSEND = new Set(supports.filter(s => s.sendCategory !== "none").map(s => s.childId)).size;

  // Coverage: children with SEND who have at least one support record
  const childrenWithSupport = new Set(supports.map(s => s.childId)).size;
  const sendCoverageRate = pct1(childrenWithSupport, childrenWithSEND);

  const ehcpRecords = supports.filter(s => s.ehcpInPlace);
  const ehcpCount = new Set(ehcpRecords.map(s => s.childId)).size;

  // EHCP currency: review date within last 12 months from now
  const now = new Date();
  const ehcpCurrent = ehcpRecords.filter(s => {
    if (!s.ehcpReviewDate) return false;
    const reviewDate = new Date(s.ehcpReviewDate);
    const monthsAgo = (now.getFullYear() - reviewDate.getFullYear()) * 12 +
      (now.getMonth() - reviewDate.getMonth());
    return monthsAgo <= EHCP_REVIEW_MONTHS;
  });
  const uniqueCurrentEHCP = new Set(ehcpCurrent.map(s => s.childId)).size;
  const ehcpCurrencyRate = pct1(uniqueCurrentEHCP, ehcpCount);

  const averageHoursPerWeek = supports.length > 0
    ? Math.round((supports.reduce((s, r) => s + r.hoursPerWeek, 0) / supports.length) * 10) / 10
    : 0;

  const effectivenessBreakdown = {
    excellent: supports.filter(s => s.effectivenessRating === "excellent").length,
    good: supports.filter(s => s.effectivenessRating === "good").length,
    adequate: supports.filter(s => s.effectivenessRating === "adequate").length,
    poor: supports.filter(s => s.effectivenessRating === "poor").length,
  };

  const withChildView = supports.filter(s => s.childView !== undefined && s.childView !== "").length;
  const childVoiceCapturedRate = supports.length > 0
    ? Math.round((withChildView / supports.length) * 1000) / 10
    : 0;

  // Per-child analysis — aggregate by child
  const childMap = new Map<string, SENDSupportRecord[]>();
  for (const s of supports) {
    if (!childMap.has(s.childId)) childMap.set(s.childId, []);
    childMap.get(s.childId)!.push(s);
  }

  const perChild = Array.from(childMap.entries()).map(([childId, recs]) => {
    const primary = recs[0];
    const totalHours = recs.reduce((s, r) => s + r.hoursPerWeek, 0);
    // Best effectiveness rating
    const ratings = recs.map(r => r.effectivenessRating);
    const bestRating = ratings.includes("excellent") ? "excellent"
      : ratings.includes("good") ? "good"
        : ratings.includes("adequate") ? "adequate" : "poor";
    const hasView = recs.some(r => r.childView !== undefined && r.childView !== "");

    const ehcpRec = recs.find(r => r.ehcpInPlace);
    let ehcpCur = false;
    if (ehcpRec?.ehcpReviewDate) {
      const rd = new Date(ehcpRec.ehcpReviewDate);
      const months = (now.getFullYear() - rd.getFullYear()) * 12 + (now.getMonth() - rd.getMonth());
      ehcpCur = months <= EHCP_REVIEW_MONTHS;
    }

    return {
      childId,
      childName: primary.childName,
      sendCategory: primary.sendCategory,
      ehcpInPlace: recs.some(r => r.ehcpInPlace),
      ehcpCurrent: ehcpCur,
      hoursPerWeek: totalHours,
      effectivenessRating: bestRating,
      hasChildView: hasView,
    };
  });

  return {
    childrenWithSEND,
    sendCoverageRate,
    ehcpCount,
    ehcpCurrencyRate,
    averageHoursPerWeek,
    effectivenessBreakdown,
    childVoiceCapturedRate,
    perChild,
  };
}

// ── 5. Evaluate Achievements ───────────────────────────────────────────────

export function evaluateAchievements(
  achievements: AchievementRecord[],
): AchievementEvaluation {
  const totalAchievements = achievements.length;

  const allTypes: AchievementType[] = [
    "academic", "vocational", "personal", "social", "creative", "physical", "life_skills",
  ];

  const achievementTypeBreakdown = {} as Record<AchievementType, number>;
  for (const t of allTypes) {
    achievementTypeBreakdown[t] = achievements.filter(a => a.achievementType === t).length;
  }

  const typesPresent = allTypes.filter(t => achievementTypeBreakdown[t] > 0).length;
  const typeVarietyScore = allTypes.length > 0
    ? Math.round((typesPresent / allTypes.length) * 1000) / 10
    : 0;

  const celebrated = achievements.filter(a => a.celebrated).length;
  const celebrationRate = totalAchievements > 0
    ? Math.round((celebrated / totalAchievements) * 1000) / 10
    : 0;

  const evidenced = achievements.filter(a => a.evidenceRecorded).length;
  const evidenceRecordingRate = totalAchievements > 0
    ? Math.round((evidenced / totalAchievements) * 1000) / 10
    : 0;

  // Per-child
  const childMap = new Map<string, AchievementRecord[]>();
  for (const a of achievements) {
    if (!childMap.has(a.childId)) childMap.set(a.childId, []);
    childMap.get(a.childId)!.push(a);
  }

  const perChild = Array.from(childMap.entries()).map(([childId, recs]) => ({
    childId,
    childName: recs[0].childName,
    achievementCount: recs.length,
    types: [...new Set(recs.map(r => r.achievementType))],
    celebrationRate: recs.length > 0
      ? Math.round((recs.filter(r => r.celebrated).length / recs.length) * 1000) / 10
      : 0,
  }));

  return {
    totalAchievements,
    achievementTypeBreakdown,
    typeVarietyScore,
    celebrationRate,
    evidenceRecordingRate,
    perChild,
  };
}

// ── 6. Generate Full Intelligence ──────────────────────────────────────────

export function generateEducationOutcomesIntelligence(
  attendance: AttendanceRecord[],
  exclusions: ExclusionRecord[],
  peps: PEPRecord[],
  sendSupport: SENDSupportRecord[],
  achievements: AchievementRecord[],
  childIds: string[],
  childNames: Record<string, string>,
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): EducationOutcomesIntelligence {
  // Evaluate all domains
  const attendanceEval = evaluateAttendance(attendance, childIds, periodStart, periodEnd);
  const exclusionEval = evaluateExclusions(exclusions);
  const pepEval = evaluatePEPQuality(peps, childIds, referenceDate);
  const sendEval = evaluateSENDSupport(sendSupport, childIds);
  const achievementEval = evaluateAchievements(achievements);

  // ── Scoring ──

  // Attendance (25 points)
  let attendanceScore = 0;
  // Attendance rate (up to 12 points)
  if (meets(attendanceEval.overallAttendanceRate, ATTENDANCE_GOOD)) attendanceScore += 12;
  else if (meets(attendanceEval.overallAttendanceRate, ATTENDANCE_TARGET)) attendanceScore += 10;
  else if (meets(attendanceEval.overallAttendanceRate, 90)) attendanceScore += 6;
  else if (meets(attendanceEval.overallAttendanceRate, 85)) attendanceScore += 3;
  // else 0 — including when no attendance was marked at all

  // Unauthorised absence (up to 7 points)
  const unauthorisedRate = attendanceEval.unauthorisedAbsenceRate;
  if (unauthorisedRate !== null) {
    if (unauthorisedRate <= 1) attendanceScore += 7;
    else if (unauthorisedRate <= 3) attendanceScore += 5;
    else if (unauthorisedRate <= 5) attendanceScore += 3;
    else if (unauthorisedRate <= 8) attendanceScore += 1;
  }

  // Punctuality (up to 6 points)
  const overallLatenessRate = attendanceEval.latenessRate;
  if (overallLatenessRate !== null) {
    if (overallLatenessRate <= 1) attendanceScore += 6;
    else if (overallLatenessRate <= 3) attendanceScore += 4;
    else if (overallLatenessRate <= 5) attendanceScore += 2;
    else if (overallLatenessRate <= 8) attendanceScore += 1;
  }

  attendanceScore = Math.min(attendanceScore, 25);

  // Exclusion management (20 points)
  let exclusionScore = 0;
  // Exclusion rate — fewer exclusions is better (up to 8 points)
  if (exclusionEval.totalExclusions === 0) exclusionScore += 8;
  else if (exclusionEval.totalExclusions <= 1) exclusionScore += 6;
  else if (exclusionEval.totalExclusions <= 2) exclusionScore += 4;
  else if (exclusionEval.totalExclusions <= 3) exclusionScore += 2;

  // Challenge rate — home should advocate (up to 4 points)
  if (exclusionEval.totalExclusions === 0) {
    exclusionScore += 4; // No exclusions to challenge
  } else {
    if (meets(exclusionEval.homeChallengeRate, 80)) exclusionScore += 4;
    else if (meets(exclusionEval.homeChallengeRate, 50)) exclusionScore += 3;
    else if (meets(exclusionEval.homeChallengeRate, 0.1)) exclusionScore += 1;
  }

  // Reintegration meetings (up to 4 points)
  if (exclusionEval.totalExclusions === 0) {
    exclusionScore += 4;
  } else {
    if (meets(exclusionEval.reintegrationRate, 90)) exclusionScore += 4;
    else if (meets(exclusionEval.reintegrationRate, 70)) exclusionScore += 3;
    else if (meets(exclusionEval.reintegrationRate, 50)) exclusionScore += 2;
    else if (meets(exclusionEval.reintegrationRate, 0.1)) exclusionScore += 1;
  }

  // Alternative provision (up to 4 points)
  if (exclusionEval.totalExclusions === 0) {
    exclusionScore += 4;
  } else {
    if (meets(exclusionEval.alternativeProvisionRate, 90)) exclusionScore += 4;
    else if (meets(exclusionEval.alternativeProvisionRate, 70)) exclusionScore += 3;
    else if (meets(exclusionEval.alternativeProvisionRate, 50)) exclusionScore += 2;
    else if (meets(exclusionEval.alternativeProvisionRate, 0.1)) exclusionScore += 1;
  }

  exclusionScore = Math.min(exclusionScore, 20);

  // PEP quality (25 points)
  let pepScore = 0;
  // Currency (up to 10 points)
  if (meets(pepEval.pepCurrencyRate, 100)) pepScore += 10;
  else if (meets(pepEval.pepCurrencyRate, 80)) pepScore += 7;
  else if (meets(pepEval.pepCurrencyRate, 60)) pepScore += 4;
  else if (meets(pepEval.pepCurrencyRate, 0.1)) pepScore += 2;

  // Child participation — attendance at PEP (up to 5 points)
  if (pepEval.childAttendanceRate >= 100) pepScore += 5;
  else if (pepEval.childAttendanceRate >= 80) pepScore += 4;
  else if (pepEval.childAttendanceRate >= 50) pepScore += 2;
  else if (pepEval.childAttendanceRate > 0) pepScore += 1;

  // Child voice recorded (up to 5 points)
  if (pepEval.childVoiceRate >= 100) pepScore += 5;
  else if (pepEval.childVoiceRate >= 80) pepScore += 4;
  else if (pepEval.childVoiceRate >= 50) pepScore += 2;
  else if (pepEval.childVoiceRate > 0) pepScore += 1;

  // Target achievement (up to 5 points)
  if (pepEval.targetAchievementRate >= 70) pepScore += 5;
  else if (pepEval.targetAchievementRate >= 50) pepScore += 4;
  else if (pepEval.targetAchievementRate >= 30) pepScore += 2;
  else if (pepEval.targetAchievementRate > 0) pepScore += 1;

  pepScore = Math.min(pepScore, 25);

  // SEND support (15 points)
  let sendScore = 0;
  const hasSENDChildren = sendEval.childrenWithSEND > 0;

  if (hasSENDChildren) {
    // Coverage (up to 5 points)
    if (meets(sendEval.sendCoverageRate, 100)) sendScore += 5;
    else if (meets(sendEval.sendCoverageRate, 80)) sendScore += 4;
    else if (meets(sendEval.sendCoverageRate, 60)) sendScore += 2;
    else if (meets(sendEval.sendCoverageRate, 0.1)) sendScore += 1;

    // Effectiveness (up to 5 points)
    const totalRatings = sendSupport.length;
    const goodOrBetter = sendEval.effectivenessBreakdown.excellent + sendEval.effectivenessBreakdown.good;
    const effectivenessRate = totalRatings > 0 ? (goodOrBetter / totalRatings) * 100 : 0;
    if (effectivenessRate >= 80) sendScore += 5;
    else if (effectivenessRate >= 60) sendScore += 4;
    else if (effectivenessRate >= 40) sendScore += 2;
    else if (effectivenessRate > 0) sendScore += 1;

    // EHCP compliance (up to 5 points)
    if (sendEval.ehcpCount === 0) {
      sendScore += 5; // No EHCPs needed
    } else {
      if (meets(sendEval.ehcpCurrencyRate, 100)) sendScore += 5;
      else if (meets(sendEval.ehcpCurrencyRate, 80)) sendScore += 4;
      else if (meets(sendEval.ehcpCurrencyRate, 50)) sendScore += 2;
      else sendScore += 1;
    }
  } else {
    // No SEND children — full marks
    sendScore = 15;
  }

  sendScore = Math.min(sendScore, 15);

  // Achievements (15 points)
  let achievementScore = 0;
  // Recognition count (up to 5 points)
  const achievementsPerChild = childIds.length > 0 ? achievementEval.totalAchievements / childIds.length : 0;
  if (achievementsPerChild >= 3) achievementScore += 5;
  else if (achievementsPerChild >= 2) achievementScore += 4;
  else if (achievementsPerChild >= 1) achievementScore += 2;
  else if (achievementEval.totalAchievements > 0) achievementScore += 1;

  // Variety (up to 5 points)
  if (achievementEval.typeVarietyScore >= 70) achievementScore += 5;
  else if (achievementEval.typeVarietyScore >= 50) achievementScore += 4;
  else if (achievementEval.typeVarietyScore >= 30) achievementScore += 2;
  else if (achievementEval.typeVarietyScore > 0) achievementScore += 1;

  // Celebration rate (up to 5 points)
  if (achievementEval.celebrationRate >= 90) achievementScore += 5;
  else if (achievementEval.celebrationRate >= 70) achievementScore += 4;
  else if (achievementEval.celebrationRate >= 50) achievementScore += 2;
  else if (achievementEval.celebrationRate > 0) achievementScore += 1;

  achievementScore = Math.min(achievementScore, 15);

  // Overall
  const overallScore = attendanceScore + exclusionScore + pepScore + sendScore + achievementScore;
  let overallRating: OverallRating;
  if (overallScore >= 80) overallRating = "outstanding";
  else if (overallScore >= 60) overallRating = "good";
  else if (overallScore >= 40) overallRating = "requires_improvement";
  else overallRating = "inadequate";

  // ── Child Profiles ──

  const childProfiles = childIds.map(childId => {
    const attendChild = attendanceEval.perChild.find(c => c.childId === childId);
    const pepChild = pepEval.perChild.find(c => c.childId === childId);
    const excChild = exclusionEval.perChild.find(c => c.childId === childId);
    const achChild = achievementEval.perChild.find(c => c.childId === childId);
    const sendChild = sendEval.perChild.find(c => c.childId === childId);

    return {
      childId,
      childName: childNames[childId] ?? childId,
      attendanceRate: attendChild?.attendanceRate ?? null,
      pepStatus: pepChild?.pepStatus ?? ("not_in_place" as PEPStatus),
      exclusionDays: excChild?.totalDays ?? 0,
      achievementCount: achChild?.achievementCount ?? 0,
      sendCategory: sendChild?.sendCategory ?? ("none" as SENDCategory),
    };
  });

  // ── Strengths, Areas, Actions ──

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  // Attendance strengths/areas
  if (attendanceEval.overallAttendanceRate === null) {
    areasForImprovement.push("No attendance marks recorded in the period — school attendance cannot be evidenced.");
    actions.push("Obtain attendance registers from each child's school and record them against the placement.");
  } else if (attendanceEval.overallAttendanceRate >= ATTENDANCE_GOOD) {
    strengths.push(`Excellent overall attendance at ${attendanceEval.overallAttendanceRate}%, exceeding the ${ATTENDANCE_TARGET}% target.`);
  } else if (attendanceEval.overallAttendanceRate >= ATTENDANCE_TARGET) {
    strengths.push(`Attendance at ${attendanceEval.overallAttendanceRate}% meets the ${ATTENDANCE_TARGET}% target for looked-after children.`);
  } else {
    areasForImprovement.push(`Overall attendance at ${attendanceEval.overallAttendanceRate}% is below the ${ATTENDANCE_TARGET}% target.`);
    actions.push("Develop individual attendance improvement plans for children below 95%.");
  }

  if (meets(attendanceEval.unauthorisedAbsenceRate, 3.1)) {
    areasForImprovement.push(`Unauthorised absence rate of ${attendanceEval.unauthorisedAbsenceRate}% requires attention.`);
    actions.push("Review unauthorised absence reasons and implement targeted interventions.");
  }

  // Exclusion strengths/areas
  if (exclusionEval.totalExclusions === 0) {
    strengths.push("No exclusions during the period — strong advocacy and preventative work.");
  } else {
    if (exclusionEval.informalCount > 0) {
      areasForImprovement.push(`${exclusionEval.informalCount} informal exclusion(s) detected — these are unlawful and must be challenged.`);
      actions.push("Challenge all informal exclusions with the school and report to Virtual School Head.");
    }
    if (exclusionEval.totalDaysLost >= EXCLUSION_DAYS_CONCERN) {
      areasForImprovement.push(`${exclusionEval.totalDaysLost} school days lost to exclusion — significant impact on learning.`);
    }
    if (meets(exclusionEval.homeChallengeRate, 50.1)) {
      strengths.push("Home actively challenges exclusions — strong advocacy for children's educational rights.");
    }
    if (meets(exclusionEval.reintegrationRate, 80)) {
      strengths.push("High reintegration meeting rate following exclusions.");
    } else {
      actions.push("Ensure reintegration meetings are held following every exclusion.");
    }
  }

  // PEP strengths/areas
  if (meets(pepEval.pepCurrencyRate, 100)) {
    strengths.push("All PEPs are current — full compliance with termly review requirement.");
  } else if (below(pepEval.pepCurrencyRate, 100)) {
    areasForImprovement.push(`PEP currency rate is ${pepEval.pepCurrencyRate}% — all children must have current PEPs.`);
    actions.push("Schedule overdue PEP reviews with Virtual School Head as a matter of urgency.");
  }

  if (pepEval.childVoiceRate >= 80) {
    strengths.push("Strong child voice captured in PEP reviews — children are actively participating in their education planning.");
  } else if (pepEval.childVoiceRate < 50) {
    areasForImprovement.push("Child voice is insufficiently represented in PEP reviews.");
    actions.push("Prepare children before PEP meetings to ensure their views and aspirations are captured.");
  }

  if (pepEval.targetAchievementRate >= 50) {
    strengths.push(`${pepEval.targetAchievementRate}% PEP target achievement rate demonstrates good educational progress.`);
  }

  // SEND strengths/areas
  if (hasSENDChildren) {
    const poorSupport = sendEval.effectivenessBreakdown.poor;
    if (poorSupport > 0) {
      areasForImprovement.push(`${poorSupport} SEND support provision(s) rated as poor effectiveness.`);
      actions.push("Review poor-rated SEND provisions and explore alternative support arrangements.");
    }
    if (sendEval.childVoiceCapturedRate >= 80) {
      strengths.push("Children's views are well-captured in SEND support assessments.");
    }
  }

  // Achievement strengths/areas
  if (achievementEval.celebrationRate >= 80) {
    strengths.push("Achievements are consistently celebrated — supporting children's self-esteem and motivation.");
  } else if (achievementEval.celebrationRate < 50) {
    areasForImprovement.push("Achievement celebration rate is below 50% — children need their successes recognised.");
    actions.push("Implement a structured approach to celebrating all achievements, including non-academic successes.");
  }

  if (achievementEval.typeVarietyScore >= 60) {
    strengths.push("Broad range of achievement types recognised, reflecting Reg 9 enjoyment and achievement expectations.");
  } else if (achievementEval.typeVarietyScore < 30) {
    areasForImprovement.push("Achievement recognition is too narrowly focused — broaden to include vocational, creative, and life skills.");
  }

  // ── Regulatory Links ──

  const regulatoryLinks = buildRegulatoryLinks(
    attendanceEval, exclusionEval, pepEval, sendEval, achievementEval,
  );

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    overallRating,
    breakdown: {
      attendance: { score: attendanceScore, maxScore: 25 },
      exclusionManagement: { score: exclusionScore, maxScore: 20 },
      pepQuality: { score: pepScore, maxScore: 25 },
      sendSupport: { score: sendScore, maxScore: 15 },
      achievements: { score: achievementScore, maxScore: 15 },
    },
    attendance: attendanceEval,
    exclusions: exclusionEval,
    pepQuality: pepEval,
    sendSupport: sendEval,
    achievements: achievementEval,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Regulatory Links Builder ───────────────────────────────────────────────

function buildRegulatoryLinks(
  attendance: AttendanceEvaluation,
  exclusions: ExclusionEvaluation,
  pepQuality: PEPQualityEvaluation,
  sendSupport: SENDSupportEvaluation,
  achievements: AchievementEvaluation,
): EducationOutcomesIntelligence["regulatoryLinks"] {
  const links: EducationOutcomesIntelligence["regulatoryLinks"] = [];

  // Reg 8 — Education. With no attendance marks and no children on roll there
  // is nothing to judge against, so the standard is reported as not evidenced
  // rather than met or breached.
  const educationMeasured =
    attendance.overallAttendanceRate !== null || pepQuality.pepCurrencyRate !== null;
  const reg8Met = meets(attendance.overallAttendanceRate, ATTENDANCE_TARGET) &&
    meets(pepQuality.pepCurrencyRate, 80) &&
    exclusions.informalCount === 0;
  links.push({
    regulation: "CHR 2015 Reg 8",
    description: "The education standard — promote educational achievement, maintain school attendance, ensure PEP compliance.",
    status: !educationMeasured
      ? "not_evidenced"
      : reg8Met
        ? "met"
        : meets(attendance.overallAttendanceRate, 90) && meets(pepQuality.pepCurrencyRate, 60)
          ? "partially_met"
          : "not_met",
  });

  // Reg 9 — Enjoyment & Achievement
  const reg9Met = achievements.totalAchievements > 0 &&
    achievements.typeVarietyScore >= 40 &&
    achievements.celebrationRate >= 60;
  links.push({
    regulation: "CHR 2015 Reg 9",
    description: "Enjoyment and achievement — ensure children have opportunities to develop talents and pursue interests.",
    status: reg9Met ? "met" : achievements.totalAchievements > 0 ? "partially_met" : "not_met",
  });

  // SCCIF — Experiences & Progress
  const sccifMet = meets(attendance.overallAttendanceRate, ATTENDANCE_TARGET) &&
    meets(pepQuality.pepCurrencyRate, 100) &&
    pepQuality.childVoiceRate >= 80;
  links.push({
    regulation: "SCCIF Experiences & Progress",
    description: "Children make good progress in education from their starting points, with effective support from the home.",
    status: !educationMeasured
      ? "not_evidenced"
      : sccifMet
        ? "met"
        : meets(pepQuality.pepCurrencyRate, 60)
          ? "partially_met"
          : "not_met",
  });

  // Virtual School Head guidance
  const vsGuidanceMet = pepQuality.virtualSchoolInvolvementRate >= 80 &&
    meets(pepQuality.pepCurrencyRate, 100);
  links.push({
    regulation: "Virtual School Head Guidance",
    description: "Virtual School Head involved in PEP process, overseeing educational progress of looked-after children.",
    status: pepQuality.pepCurrencyRate === null
      ? "not_evidenced"
      : vsGuidanceMet
        ? "met"
        : pepQuality.virtualSchoolInvolvementRate >= 50
          ? "partially_met"
          : "not_met",
  });

  // SEND Code of Practice 2015
  if (sendSupport.childrenWithSEND > 0) {
    // An EHCP currency rate of null here means no EHCP is in place, so the
    // annual-review limb has nothing to fail against.
    const sendMet = meets(sendSupport.sendCoverageRate, 100) &&
      (sendSupport.ehcpCurrencyRate === null || sendSupport.ehcpCurrencyRate >= 100);
    links.push({
      regulation: "SEND Code of Practice 2015",
      description: "Children with SEND receive appropriate support, EHCPs are reviewed annually, and child voice is captured.",
      status: sendMet ? "met" : meets(sendSupport.sendCoverageRate, 80) ? "partially_met" : "not_met",
    });
  } else {
    links.push({
      regulation: "SEND Code of Practice 2015",
      description: "Children with SEND receive appropriate support, EHCPs are reviewed annually, and child voice is captured.",
      status: "met",
    });
  }

  return links;
}
