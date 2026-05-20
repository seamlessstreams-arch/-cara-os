/* ──────────────────────────────────────────────────────────────
   Education Intelligence Engine

   Pure deterministic engine for evaluating education outcomes,
   PEP (Personal Education Plan) compliance, attendance, and
   attainment for looked-after children in residential care.

   Regulatory basis:
     - CHR 2015 Reg 8 — The education standard
     - Virtual School Head statutory role (Children Act 2004)
     - PEP requirements (termly reviews, Pupil Premium Plus)
     - DfE: Promoting the education of looked-after children
     - SEND Code of Practice 2015
     - School Admissions Code — priority for LAC
     - Children Act 1989 s22(3A) — duty to promote education

   Every looked-after child must have:
     1. School placement within 20 days of entering care
     2. Personal Education Plan (PEP) reviewed termly
     3. Pupil Premium Plus spend plan linked to targets
     4. Designated teacher identified and engaged
     5. Attendance target >=95%
     6. Exclusion monitoring and prevention
     7. Virtual School Head involvement

   No AI. No external calls. Pure input -> output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type EducationPlacement =
  | "mainstream_school"
  | "special_school"
  | "alternative_provision"
  | "home_education"
  | "pupil_referral_unit"
  | "further_education"
  | "awaiting_placement"
  | "neet";

export type AttainmentLevel =
  | "exceeding"
  | "expected"
  | "developing"
  | "below_expected"
  | "not_assessed";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const placementLabels: Record<EducationPlacement, string> = {
  mainstream_school: "Mainstream School",
  special_school: "Special School",
  alternative_provision: "Alternative Provision",
  home_education: "Home Education",
  pupil_referral_unit: "Pupil Referral Unit",
  further_education: "Further Education",
  awaiting_placement: "Awaiting Placement",
  neet: "NEET",
};

const attainmentLabels: Record<AttainmentLevel, string> = {
  exceeding: "Exceeding",
  expected: "Expected",
  developing: "Developing",
  below_expected: "Below Expected",
  not_assessed: "Not Assessed",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getPlacementLabel(placement: EducationPlacement): string {
  return placementLabels[placement];
}

export function getAttainmentLabel(level: AttainmentLevel): string {
  return attainmentLabels[level];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface EducationRecord {
  id: string;
  childId: string;
  childName: string;
  termDate: string;
  placement: EducationPlacement;
  attainment: AttainmentLevel;
  pepReviewedThisTerm: boolean;
  attendanceAbove95: boolean;
  pupilPremiumAllocated: boolean;
  designatedTeacherEngaged: boolean;
  exclusionThisTerm: boolean;
  virtualSchoolInvolved: boolean;
}

export interface EducationPolicy {
  id: string;
  educationStrategy: boolean;
  pepComplianceFramework: boolean;
  attendanceMonitoring: boolean;
  exclusionPrevention: boolean;
  pupilPremiumTracking: boolean;
  schoolLiaisonProtocol: boolean;
  regularReview: boolean;
}

export interface StaffEducationTraining {
  id: string;
  staffId: string;
  staffName: string;
  educationRegulations: boolean;
  pepProcess: boolean;
  attendanceSupport: boolean;
  senAwareness: boolean;
  virtualSchoolLiaison: boolean;
  educationAdvocacy: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface EducationQualityResult {
  totalRecords: number;
  attainmentRate: number;
  attendanceRate: number;
  noExclusionRate: number;
  designatedTeacherRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface EducationComplianceResult {
  totalRecords: number;
  pepRate: number;
  pupilPremiumRate: number;
  virtualSchoolRate: number;
  placementDiversityRatio: number;
  uniquePlacements: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface EducationPolicyResult {
  educationStrategy: boolean;
  pepComplianceFramework: boolean;
  attendanceMonitoring: boolean;
  exclusionPrevention: boolean;
  pupilPremiumTracking: boolean;
  schoolLiaisonProtocol: boolean;
  regularReview: boolean;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface StaffEducationReadinessResult {
  totalStaff: number;
  educationRegulationsRate: number;
  pepProcessRate: number;
  attendanceSupportRate: number;
  senAwarenessRate: number;
  virtualSchoolLiaisonRate: number;
  educationAdvocacyRate: number;
  score: number;
  strengths: string[];
  concerns: string[];
}

export interface ChildEducationProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  attainmentRate: number;
  attendanceRate: number;
  exclusionCount: number;
  educationScore: number;
}

export interface EducationIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  educationQuality: EducationQualityResult;
  educationCompliance: EducationComplianceResult;
  educationPolicy: EducationPolicyResult;
  staffReadiness: StaffEducationReadinessResult;
  childProfiles: ChildEducationProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Education Quality (0-25) ──────────────────────────────

export function evaluateEducationQuality(
  records: EducationRecord[],
): EducationQualityResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      attainmentRate: 0,
      attendanceRate: 0,
      noExclusionRate: 0,
      designatedTeacherRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No education records — quality cannot be assessed"],
    };
  }

  const attainmentCount = records.filter(
    (r) => r.attainment === "exceeding" || r.attainment === "expected",
  ).length;
  const attainmentRate = pct(attainmentCount, totalRecords);

  const attendanceCount = records.filter((r) => r.attendanceAbove95).length;
  const attendanceRate = pct(attendanceCount, totalRecords);

  const noExclusionCount = records.filter((r) => !r.exclusionThisTerm).length;
  const noExclusionRate = pct(noExclusionCount, totalRecords);

  const dtCount = records.filter((r) => r.designatedTeacherEngaged).length;
  const designatedTeacherRate = pct(dtCount, totalRecords);

  // Weights: attainmentRate 7 + attendanceRate 6 + noExclusionRate 6 + designatedTeacherRate 6 = 25
  let score = 0;
  score += (attainmentRate / 100) * 7;
  score += (attendanceRate / 100) * 6;
  score += (noExclusionRate / 100) * 6;
  score += (designatedTeacherRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (attainmentRate >= 80) {
    strengths.push("Strong attainment: " + attainmentRate + "% of records at expected or exceeding level");
  } else if (attainmentRate < 50) {
    concerns.push("Attainment at " + attainmentRate + "% — majority of children not meeting expected levels");
  }

  if (attendanceRate >= 80) {
    strengths.push("Excellent attendance: " + attendanceRate + "% of records above 95% target");
  } else if (attendanceRate < 50) {
    concerns.push("Attendance at " + attendanceRate + "% — majority of children below 95% target");
  }

  if (noExclusionRate >= 80) {
    strengths.push("Low exclusion rate: " + noExclusionRate + "% of records with no exclusion this term");
  } else if (noExclusionRate < 50) {
    concerns.push("Exclusion rate concerning: only " + noExclusionRate + "% of records free from exclusion");
  }

  if (designatedTeacherRate >= 80) {
    strengths.push("Strong designated teacher engagement: " + designatedTeacherRate + "% of records");
  } else if (designatedTeacherRate < 50) {
    concerns.push("Designated teacher engagement at " + designatedTeacherRate + "% — many children lack school liaison");
  }

  return {
    totalRecords,
    attainmentRate,
    attendanceRate,
    noExclusionRate,
    designatedTeacherRate,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 2: Education Compliance (0-25) ───────────────────────────

export function evaluateEducationCompliance(
  records: EducationRecord[],
): EducationComplianceResult {
  const totalRecords = records.length;

  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      pepRate: 0,
      pupilPremiumRate: 0,
      virtualSchoolRate: 0,
      placementDiversityRatio: 0,
      uniquePlacements: 0,
      score: 0,
      strengths: [],
      concerns: ["No education records — compliance cannot be assessed"],
    };
  }

  const pepCount = records.filter((r) => r.pepReviewedThisTerm).length;
  const pepRate = pct(pepCount, totalRecords);

  const ppCount = records.filter((r) => r.pupilPremiumAllocated).length;
  const pupilPremiumRate = pct(ppCount, totalRecords);

  const vsCount = records.filter((r) => r.virtualSchoolInvolved).length;
  const virtualSchoolRate = pct(vsCount, totalRecords);

  const uniquePlacementsSet = new Set(records.map((r) => r.placement));
  const uniquePlacements = uniquePlacementsSet.size;
  const placementDiversityRatio = Math.round((uniquePlacements / 8) * 100) / 100;

  // Weights: pepRate 8 + pupilPremiumRate 7 + virtualSchoolRate 5 + placementDiversityRatio 5 = 25
  let score = 0;
  score += (pepRate / 100) * 8;
  score += (pupilPremiumRate / 100) * 7;
  score += (virtualSchoolRate / 100) * 5;
  score += placementDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (pepRate >= 90) {
    strengths.push("Excellent PEP compliance: " + pepRate + "% of records with termly PEP review");
  } else if (pepRate < 50) {
    concerns.push("PEP compliance at " + pepRate + "% — statutory PEP reviews not consistently completed");
  }

  if (pupilPremiumRate >= 90) {
    strengths.push("Strong Pupil Premium allocation: " + pupilPremiumRate + "% of records with PP+ allocated");
  } else if (pupilPremiumRate < 50) {
    concerns.push("Pupil Premium allocation at " + pupilPremiumRate + "% — children may be missing PP+ funding");
  }

  if (virtualSchoolRate >= 80) {
    strengths.push("Good Virtual School involvement: " + virtualSchoolRate + "% of records");
  } else if (virtualSchoolRate < 50) {
    concerns.push("Virtual School involvement at " + virtualSchoolRate + "% — insufficient oversight from VSH");
  }

  if (uniquePlacements >= 6) {
    strengths.push("Comprehensive placement diversity: " + uniquePlacements + " of 8 placement types represented");
  } else if (uniquePlacements <= 2) {
    concerns.push("Only " + uniquePlacements + " placement type(s) recorded — limited placement diversity");
  }

  return {
    totalRecords,
    pepRate,
    pupilPremiumRate,
    virtualSchoolRate,
    placementDiversityRatio,
    uniquePlacements,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 3: Education Policy (0-25) ───────────────────────────────

export function evaluateEducationPolicy(
  policy: EducationPolicy | null,
): EducationPolicyResult {
  if (policy === null) {
    return {
      educationStrategy: false,
      pepComplianceFramework: false,
      attendanceMonitoring: false,
      exclusionPrevention: false,
      pupilPremiumTracking: false,
      schoolLiaisonProtocol: false,
      regularReview: false,
      score: 0,
      strengths: [],
      concerns: ["No education policy in place — URGENT: develop comprehensive education policy immediately"],
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.educationStrategy) score += 4;
  if (policy.pepComplianceFramework) score += 4;
  if (policy.attendanceMonitoring) score += 4;
  if (policy.exclusionPrevention) score += 4;
  if (policy.pupilPremiumTracking) score += 3;
  if (policy.schoolLiaisonProtocol) score += 3;
  if (policy.regularReview) score += 3;

  const strengths: string[] = [];
  const concerns: string[] = [];

  const trueCount = [
    policy.educationStrategy,
    policy.pepComplianceFramework,
    policy.attendanceMonitoring,
    policy.exclusionPrevention,
    policy.pupilPremiumTracking,
    policy.schoolLiaisonProtocol,
    policy.regularReview,
  ].filter(Boolean).length;

  if (trueCount === 7) {
    strengths.push("Complete education policy framework in place (7/7 components)");
  } else if (trueCount >= 5) {
    strengths.push("Good policy coverage: " + trueCount + "/7 education policy components in place");
  }

  if (!policy.educationStrategy) {
    concerns.push("No education strategy — staff may lack clear guidance on education priorities");
  }
  if (!policy.pepComplianceFramework) {
    concerns.push("No PEP compliance framework — PEP reviews may not be tracked effectively");
  }
  if (!policy.attendanceMonitoring) {
    concerns.push("No attendance monitoring policy — attendance issues may go undetected");
  }
  if (!policy.exclusionPrevention) {
    concerns.push("No exclusion prevention policy — children at risk of exclusion may lack support");
  }
  if (!policy.pupilPremiumTracking) {
    concerns.push("No Pupil Premium tracking — PP+ funding may not be allocated effectively");
  }
  if (!policy.schoolLiaisonProtocol) {
    concerns.push("No school liaison protocol — communication with schools may be inconsistent");
  }
  if (!policy.regularReview) {
    concerns.push("No regular review process — education policies may become outdated");
  }

  return {
    educationStrategy: policy.educationStrategy,
    pepComplianceFramework: policy.pepComplianceFramework,
    attendanceMonitoring: policy.attendanceMonitoring,
    exclusionPrevention: policy.exclusionPrevention,
    pupilPremiumTracking: policy.pupilPremiumTracking,
    schoolLiaisonProtocol: policy.schoolLiaisonProtocol,
    regularReview: policy.regularReview,
    score,
    strengths,
    concerns,
  };
}

// ── Evaluator 4: Staff Education Readiness (0-25) ──────────────────────

export function evaluateStaffEducationReadiness(
  training: StaffEducationTraining[],
): StaffEducationReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      educationRegulationsRate: 0,
      pepProcessRate: 0,
      attendanceSupportRate: 0,
      senAwarenessRate: 0,
      virtualSchoolLiaisonRate: 0,
      educationAdvocacyRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No staff training records — URGENT: schedule education training for all staff"],
    };
  }

  const regCount = training.filter((t) => t.educationRegulations).length;
  const educationRegulationsRate = pct(regCount, totalStaff);

  const pepCount = training.filter((t) => t.pepProcess).length;
  const pepProcessRate = pct(pepCount, totalStaff);

  const attCount = training.filter((t) => t.attendanceSupport).length;
  const attendanceSupportRate = pct(attCount, totalStaff);

  const senCount = training.filter((t) => t.senAwareness).length;
  const senAwarenessRate = pct(senCount, totalStaff);

  const vsCount = training.filter((t) => t.virtualSchoolLiaison).length;
  const virtualSchoolLiaisonRate = pct(vsCount, totalStaff);

  const advCount = training.filter((t) => t.educationAdvocacy).length;
  const educationAdvocacyRate = pct(advCount, totalStaff);

  // Weights: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (educationRegulationsRate / 100) * 6;
  score += (pepProcessRate / 100) * 5;
  score += (attendanceSupportRate / 100) * 5;
  score += (senAwarenessRate / 100) * 4;
  score += (virtualSchoolLiaisonRate / 100) * 3;
  score += (educationAdvocacyRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (educationRegulationsRate >= 80) {
    strengths.push("Strong education regulations knowledge: " + educationRegulationsRate + "% of staff");
  } else if (educationRegulationsRate < 50) {
    concerns.push("Education regulations training at " + educationRegulationsRate + "% — foundational training needed");
  }

  if (pepProcessRate >= 80) {
    strengths.push("Good PEP process understanding: " + pepProcessRate + "% of staff trained");
  } else if (pepProcessRate < 50) {
    concerns.push("PEP process training at " + pepProcessRate + "% — staff may not support PEP reviews effectively");
  }

  if (attendanceSupportRate >= 80) {
    strengths.push("Strong attendance support skills: " + attendanceSupportRate + "% of staff trained");
  } else if (attendanceSupportRate < 50) {
    concerns.push("Attendance support training at " + attendanceSupportRate + "% — staff may not address attendance barriers");
  }

  if (senAwarenessRate >= 80) {
    strengths.push("Good SEN awareness: " + senAwarenessRate + "% of staff knowledgeable");
  } else if (senAwarenessRate < 50) {
    concerns.push("SEN awareness at " + senAwarenessRate + "% — staff may not recognise additional needs");
  }

  if (virtualSchoolLiaisonRate >= 80) {
    strengths.push("Strong Virtual School liaison skills: " + virtualSchoolLiaisonRate + "% of staff trained");
  } else if (virtualSchoolLiaisonRate < 50) {
    concerns.push("Virtual School liaison at " + virtualSchoolLiaisonRate + "% — engagement with VSH may be limited");
  }

  if (educationAdvocacyRate >= 80) {
    strengths.push("Good education advocacy skills: " + educationAdvocacyRate + "% of staff competent");
  } else if (educationAdvocacyRate < 50) {
    concerns.push("Education advocacy at " + educationAdvocacyRate + "% — children's education may not be championed effectively");
  }

  return {
    totalStaff,
    educationRegulationsRate,
    pepProcessRate,
    attendanceSupportRate,
    senAwarenessRate,
    virtualSchoolLiaisonRate,
    educationAdvocacyRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Education Profiles ─────────────────────────────────────

export function buildChildEducationProfiles(
  records: EducationRecord[],
): ChildEducationProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<
    string,
    { childId: string; childName: string; records: EducationRecord[] }
  >();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const total = child.records.length;

    const attainmentCount = child.records.filter(
      (r) => r.attainment === "exceeding" || r.attainment === "expected",
    ).length;
    const attainmentRate = pct(attainmentCount, total);

    const attendanceCount = child.records.filter((r) => r.attendanceAbove95).length;
    const attendanceRate = pct(attendanceCount, total);

    const exclusionCount = child.records.filter((r) => r.exclusionThisTerm).length;

    // freq: >=10 records -> 2, >=5 -> 1, else 0
    let frequencyScore = 0;
    if (total >= 10) frequencyScore = 2;
    else if (total >= 5) frequencyScore = 1;

    // rate1 (attainmentRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    let rate1Score = 0;
    if (attainmentRate >= 80) rate1Score = 3;
    else if (attainmentRate >= 60) rate1Score = 2;
    else if (attainmentRate >= 40) rate1Score = 1;

    // rate2 (attendanceRate): same thresholds
    let rate2Score = 0;
    if (attendanceRate >= 80) rate2Score = 3;
    else if (attendanceRate >= 60) rate2Score = 2;
    else if (attendanceRate >= 40) rate2Score = 1;

    // noExclusion: 0 exclusions -> 2, else 0
    const noExclusionBonus = exclusionCount === 0 ? 2 : 0;

    const educationScore = Math.min(10, frequencyScore + rate1Score + rate2Score + noExclusionBonus);

    return {
      childId: child.childId,
      childName: child.childName,
      totalRecords: total,
      attainmentRate,
      attendanceRate,
      exclusionCount,
      educationScore,
    };
  });
}

// ── Orchestrator ───────────────────────────────────────────────────────

export function generateEducationIntelligence(
  records: EducationRecord[],
  policy: EducationPolicy | null,
  training: StaffEducationTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): EducationIntelligence {
  const assessedAt = new Date().toISOString();

  // Evaluate each layer
  const educationQuality = evaluateEducationQuality(records);
  const educationCompliance = evaluateEducationCompliance(records);
  const educationPolicy = evaluateEducationPolicy(policy);
  const staffReadiness = evaluateStaffEducationReadiness(training);

  // Build child profiles
  const childProfiles = buildChildEducationProfiles(records);

  // Overall score capped at 100
  const overallScore = Math.min(
    100,
    Math.round(
      educationQuality.score +
      educationCompliance.score +
      educationPolicy.score +
      staffReadiness.score,
    ),
  );

  const rating = getRating(overallScore);

  // Aggregate strengths
  const strengths = aggregateStrengths(
    educationQuality, educationCompliance, educationPolicy, staffReadiness, overallScore,
  );

  // Aggregate areas for improvement
  const areasForImprovement = aggregateAreasForImprovement(
    educationQuality, educationCompliance, educationPolicy, staffReadiness, overallScore,
  );

  // Generate actions
  const actions = generateActions(
    educationQuality, educationCompliance, educationPolicy, staffReadiness, records, childProfiles,
  );

  // Regulatory links
  const regulatoryLinks = generateRegulatoryLinks();

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    educationQuality,
    educationCompliance,
    educationPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Aggregate Strengths ────────────────────────────────────────────────

function aggregateStrengths(
  quality: EducationQualityResult,
  compliance: EducationComplianceResult,
  policy: EducationPolicyResult,
  staff: StaffEducationReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall education management rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall education management rated Good (" + overallScore + "/100)");
  }

  // Include evaluators with score >= 20
  if (quality.score >= 20) {
    strengths.push("Education quality is strong (score " + quality.score + "/25)");
  }
  if (compliance.score >= 20) {
    strengths.push("Education compliance is strong (score " + compliance.score + "/25)");
  }
  if (policy.score >= 20) {
    strengths.push("Education policy framework is robust (score " + policy.score + "/25)");
  }
  if (staff.score >= 20) {
    strengths.push("Staff education readiness is strong (score " + staff.score + "/25)");
  }

  strengths.push(...quality.strengths.slice(0, 2));
  strengths.push(...compliance.strengths.slice(0, 2));
  strengths.push(...policy.strengths.slice(0, 2));
  strengths.push(...staff.strengths.slice(0, 2));

  return strengths;
}

// ── Aggregate Areas for Improvement ────────────────────────────────────

function aggregateAreasForImprovement(
  quality: EducationQualityResult,
  compliance: EducationComplianceResult,
  policy: EducationPolicyResult,
  staff: StaffEducationReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall education management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall education management Requires Improvement (" + overallScore + "/100)");
  }

  // Include evaluators with score < 15
  if (quality.score < 15) {
    areas.push("Education quality needs improvement (score " + quality.score + "/25)");
  }
  if (compliance.score < 15) {
    areas.push("Education compliance needs improvement (score " + compliance.score + "/25)");
  }
  if (policy.score < 15) {
    areas.push("Education policy framework needs improvement (score " + policy.score + "/25)");
  }
  if (staff.score < 15) {
    areas.push("Staff education readiness needs improvement (score " + staff.score + "/25)");
  }

  areas.push(...quality.concerns);
  areas.push(...compliance.concerns);
  areas.push(...policy.concerns);
  areas.push(...staff.concerns);

  return areas;
}

// ── Generate Actions ───────────────────────────────────────────────────

function generateActions(
  quality: EducationQualityResult,
  compliance: EducationComplianceResult,
  policy: EducationPolicyResult,
  staff: StaffEducationReadinessResult,
  records: EducationRecord[],
  childProfiles: ChildEducationProfile[],
): string[] {
  const actions: string[] = [];

  // URGENT when policy score = 0
  if (policy.score === 0) {
    actions.push("URGENT: No education policy in place — develop and implement comprehensive education policy immediately");
  }

  // URGENT when staff score = 0
  if (staff.totalStaff === 0) {
    actions.push("URGENT: No staff education training records — schedule education competency training for all staff immediately");
  }

  // URGENT when exclusions are high
  const exclusionRecords = records.filter((r) => r.exclusionThisTerm);
  if (exclusionRecords.length > 0 && quality.noExclusionRate < 50) {
    actions.push("URGENT: " + exclusionRecords.length + " exclusion(s) recorded — review exclusion prevention strategy and support plans for affected children");
  }

  // Conditional on rates < 50
  if (quality.totalRecords > 0 && quality.attainmentRate < 50) {
    actions.push("HIGH: Attainment rate at " + quality.attainmentRate + "% — review educational support and consider additional tutoring or interventions");
  }

  if (quality.totalRecords > 0 && quality.attendanceRate < 50) {
    actions.push("HIGH: Attendance rate at " + quality.attendanceRate + "% — convene attendance strategy meetings with schools and address barriers");
  }

  if (compliance.totalRecords > 0 && compliance.pepRate < 50) {
    actions.push("HIGH: PEP compliance at " + compliance.pepRate + "% — schedule overdue PEP reviews with Virtual School Head urgently");
  }

  if (compliance.totalRecords > 0 && compliance.pupilPremiumRate < 50) {
    actions.push("HIGH: Pupil Premium allocation at " + compliance.pupilPremiumRate + "% — ensure PP+ funding is allocated for all eligible children");
  }

  if (quality.totalRecords > 0 && quality.designatedTeacherRate < 50) {
    actions.push("MEDIUM: Designated teacher engagement at " + quality.designatedTeacherRate + "% — contact schools to identify and engage designated teachers");
  }

  if (compliance.totalRecords > 0 && compliance.virtualSchoolRate < 50) {
    actions.push("MEDIUM: Virtual School involvement at " + compliance.virtualSchoolRate + "% — strengthen liaison with Virtual School Head");
  }

  if (staff.totalStaff > 0 && staff.educationRegulationsRate < 50) {
    actions.push("MEDIUM: Staff education training at " + staff.educationRegulationsRate + "% — schedule refresher training for all staff");
  }

  // Children with low scores
  const lowScoreChildren = childProfiles.filter((p) => p.educationScore <= 3);
  if (lowScoreChildren.length > 0) {
    actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low education scores — review individual education support plans");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Education management systems operating within expected standards.");
  }

  return actions;
}

// ── Regulatory Links ───────────────────────────────────────────────────

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015 Regulation 8 — The education standard for children's homes",
    "Virtual School Head statutory role (Children Act 2004) — oversight of LAC education",
    "PEP requirements — termly review of Personal Education Plans for all LAC",
    "DfE: Promoting the education of looked-after children — statutory guidance",
    "SEND Code of Practice 2015 — identifying and supporting additional needs",
    "School Admissions Code — priority admission for looked-after children",
    "Children Act 1989 s22(3A) — local authority duty to promote educational achievement",
  ];
}
