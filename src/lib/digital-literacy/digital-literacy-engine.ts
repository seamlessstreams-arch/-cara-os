// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Digital Literacy & Online Engagement Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// This module is DISTINCT from online-safety (src/lib/online-safety/) which
// covers risk and harm prevention. This module focuses on POSITIVE digital
// engagement: skills development, online learning, device access equity,
// and digital citizenship.
//
// Regulatory framework:
//   CHR 2015 Reg 8           — Education (includes digital skills as education)
//   CHR 2015 Reg 9           — Enjoyment & achievement (digital creativity)
//   UNCRC Article 17         — Access to information & mass media
//   SCCIF                    — Experiences & progress (digital inclusion)
//   DfE Digital Standards    — Computing curriculum & digital skills benchmarks
//
// Key requirements:
//   1. Assess and develop each child's digital skills
//   2. Equitable access to appropriate devices
//   3. Support positive online learning and engagement
//   4. Develop digital citizenship and responsibility
//   5. Age-appropriate independence in digital activities
//   6. Balance between educational, creative, and social usage
//   7. Track progress in digital competence over time
//   8. Ensure device access agreements are current
//   9. Recognise and celebrate positive digital engagement
//   10. Link digital skills to education and career pathways
//
// Scoring breakdown (0–100):
//   Digital skills:          30 — Assessment coverage, skill levels, gaps
//   Device access:           20 — Equity, agreements, appropriateness
//   Online learning:         25 — Frequency, variety, positive outcomes
//   Digital citizenship:     25 — Demonstration rate, area coverage
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type DigitalSkillCategory =
  | "online_safety_awareness"
  | "communication"
  | "content_creation"
  | "information_literacy"
  | "coding"
  | "productivity_tools"
  | "social_media_literacy"
  | "digital_wellbeing"
  | "privacy_management"
  | "critical_thinking";

export type SkillLevel =
  | "beginner"
  | "developing"
  | "competent"
  | "proficient"
  | "advanced";

export type DeviceType =
  | "smartphone"
  | "tablet"
  | "laptop"
  | "desktop"
  | "gaming_console"
  | "smart_speaker";

export type AccessLevel =
  | "supervised"
  | "monitored"
  | "independent_with_checks"
  | "fully_independent";

// ── Data Models ───────────────────────────────────────────────────────────────

export interface DigitalSkillRating {
  category: DigitalSkillCategory;
  level: SkillLevel;
  notes?: string;
}

export interface DigitalSkillAssessment {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  assessedBy: string;
  skills: DigitalSkillRating[];
  overallLevel: SkillLevel;
  developmentGoals: string[];
  reviewDate: string;
}

export interface DeviceAccessRecord {
  id: string;
  childId: string;
  childName: string;
  deviceType: DeviceType;
  accessLevel: AccessLevel;
  agreementSigned: boolean;
  agreementDate?: string;
  reviewDate: string;
  restrictionsInPlace: string[];
  ageAppropriate: boolean;
}

export interface OnlineLearningRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  platform: string;
  activityType: "educational" | "creative" | "social" | "research" | "career_exploration";
  durationMinutes: number;
  supervised: boolean;
  outcomePositive: boolean;
  notes?: string;
}

export interface DigitalCitizenshipRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  area:
    | "kindness_online"
    | "digital_footprint"
    | "critical_evaluation"
    | "reporting_concerns"
    | "respecting_privacy"
    | "balanced_usage";
  demonstratedPositively: boolean;
  context: string;
  staffWitnessedBy: string;
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface DigitalSkillsResult {
  totalChildren: number;
  childrenWithAssessment: number;
  assessmentRate: number;
  averageSkillLevel: number;
  skillLevelDistribution: { level: SkillLevel; count: number }[];
  skillGaps: DigitalSkillCategory[];
  developmentGoalCount: number;
  overdueReviews: number;
}

export interface DeviceAccessResult {
  totalChildren: number;
  childrenWithAccess: number;
  accessRate: number;
  agreementComplianceRate: number;
  ageAppropriateRate: number;
  deviceTypeBreakdown: { deviceType: DeviceType; count: number }[];
  accessLevelBreakdown: { accessLevel: AccessLevel; count: number }[];
  overdueReviews: number;
  childrenWithoutAccess: string[];
}

export interface OnlineLearningResult {
  totalSessions: number;
  sessionsPerChild: number;
  activityTypeBreakdown: { activityType: string; count: number }[];
  activityTypeCount: number;
  positiveOutcomeRate: number;
  supervisedRate: number;
  averageDuration: number;
  totalLearningMinutes: number;
  childrenWithNoLearning: string[];
}

export interface DigitalCitizenshipResult {
  totalRecords: number;
  positiveRate: number;
  areaCoverage: number;
  totalAreas: number;
  areaBreakdown: { area: string; positiveCount: number; totalCount: number }[];
  childrenWithRecords: number;
  childrenWithNoRecords: string[];
}

export interface ChildDigitalProfile {
  childId: string;
  childName: string;
  hasAssessment: boolean;
  overallSkillLevel?: SkillLevel;
  skillLevelNumeric?: number;
  deviceAccessCount: number;
  agreementsSigned: number;
  learningSessionCount: number;
  learningMinutes: number;
  positiveOutcomes: number;
  citizenshipScore: number;
  citizenshipPositiveRate: number;
  strengths: string[];
  developmentAreas: string[];
}

export interface DigitalLiteracyIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  digitalSkills: DigitalSkillsResult;
  deviceAccess: DeviceAccessResult;
  onlineLearning: OnlineLearningResult;
  digitalCitizenship: DigitalCitizenshipResult;
  childProfiles: ChildDigitalProfile[];
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_SKILL_CATEGORIES: DigitalSkillCategory[] = [
  "online_safety_awareness",
  "communication",
  "content_creation",
  "information_literacy",
  "coding",
  "productivity_tools",
  "social_media_literacy",
  "digital_wellbeing",
  "privacy_management",
  "critical_thinking",
];

const ALL_CITIZENSHIP_AREAS: DigitalCitizenshipRecord["area"][] = [
  "kindness_online",
  "digital_footprint",
  "critical_evaluation",
  "reporting_concerns",
  "respecting_privacy",
  "balanced_usage",
];

const SKILL_LEVEL_VALUES: Record<SkillLevel, number> = {
  beginner: 1,
  developing: 2,
  competent: 3,
  proficient: 4,
  advanced: 5,
};

const SKILL_CATEGORY_LABELS: Record<DigitalSkillCategory, string> = {
  online_safety_awareness: "Online Safety Awareness",
  communication: "Digital Communication",
  content_creation: "Content Creation",
  information_literacy: "Information Literacy",
  coding: "Coding & Programming",
  productivity_tools: "Productivity Tools",
  social_media_literacy: "Social Media Literacy",
  digital_wellbeing: "Digital Wellbeing",
  privacy_management: "Privacy Management",
  critical_thinking: "Critical Thinking Online",
};

const CITIZENSHIP_AREA_LABELS: Record<DigitalCitizenshipRecord["area"], string> = {
  kindness_online: "Kindness Online",
  digital_footprint: "Digital Footprint Awareness",
  critical_evaluation: "Critical Evaluation",
  reporting_concerns: "Reporting Concerns",
  respecting_privacy: "Respecting Privacy",
  balanced_usage: "Balanced Usage",
};

export function getSkillCategoryLabel(c: DigitalSkillCategory): string {
  return SKILL_CATEGORY_LABELS[c] ?? c.replace(/_/g, " ");
}

export function getCitizenshipAreaLabel(a: DigitalCitizenshipRecord["area"]): string {
  return CITIZENSHIP_AREA_LABELS[a] ?? a.replace(/_/g, " ");
}

export function getSkillLevelValue(level: SkillLevel): number {
  return SKILL_LEVEL_VALUES[level] ?? 0;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date.slice(0, 10) >= start.slice(0, 10) && date.slice(0, 10) <= end.slice(0, 10);
}

function averageSkillLevelNumeric(skills: DigitalSkillRating[]): number {
  if (skills.length === 0) return 0;
  const sum = skills.reduce((acc, s) => acc + SKILL_LEVEL_VALUES[s.level], 0);
  return Math.round((sum / skills.length) * 10) / 10;
}

// ── Core Functions ────────────────────────────────────────────────────────────

/**
 * Evaluates digital skills assessment coverage and quality.
 * Examines: assessment coverage, average skill levels, skill gaps,
 * development goal tracking, and overdue reviews.
 */
export function evaluateDigitalSkills(
  assessments: DigitalSkillAssessment[],
  childIds: string[],
  referenceDate?: string,
): DigitalSkillsResult {
  const totalChildren = childIds.length;

  // Get latest assessment per child
  const latestMap = new Map<string, DigitalSkillAssessment>();
  for (const a of assessments) {
    if (!childIds.includes(a.childId)) continue;
    const existing = latestMap.get(a.childId);
    if (!existing || a.assessmentDate > existing.assessmentDate) {
      latestMap.set(a.childId, a);
    }
  }

  const childrenWithAssessment = latestMap.size;
  const assessmentRate = pct(childrenWithAssessment, totalChildren);

  // Average skill level across all latest assessments
  const allSkillValues: number[] = [];
  for (const a of latestMap.values()) {
    for (const s of a.skills) {
      allSkillValues.push(SKILL_LEVEL_VALUES[s.level]);
    }
  }
  const averageSkillLevel =
    allSkillValues.length === 0
      ? 0
      : Math.round((allSkillValues.reduce((a, b) => a + b, 0) / allSkillValues.length) * 10) / 10;

  // Skill level distribution (overall levels)
  const levelCounts = new Map<SkillLevel, number>();
  for (const a of latestMap.values()) {
    levelCounts.set(a.overallLevel, (levelCounts.get(a.overallLevel) ?? 0) + 1);
  }
  const skillLevelDistribution: { level: SkillLevel; count: number }[] = (
    ["beginner", "developing", "competent", "proficient", "advanced"] as SkillLevel[]
  ).map((level) => ({
    level,
    count: levelCounts.get(level) ?? 0,
  }));

  // Skill gaps: categories not covered by any child's assessment
  const coveredCategories = new Set<DigitalSkillCategory>();
  for (const a of latestMap.values()) {
    for (const s of a.skills) {
      coveredCategories.add(s.category);
    }
  }
  const skillGaps = ALL_SKILL_CATEGORIES.filter((c) => !coveredCategories.has(c));

  // Development goals
  let developmentGoalCount = 0;
  for (const a of latestMap.values()) {
    developmentGoalCount += a.developmentGoals.length;
  }

  // Overdue reviews
  const refDate = referenceDate ?? new Date().toISOString().split("T")[0];
  const overdueReviews = Array.from(latestMap.values()).filter(
    (a) => a.reviewDate < refDate,
  ).length;

  return {
    totalChildren,
    childrenWithAssessment,
    assessmentRate,
    averageSkillLevel,
    skillLevelDistribution,
    skillGaps,
    developmentGoalCount,
    overdueReviews,
  };
}

/**
 * Evaluates device access equity and compliance.
 * Examines: device access coverage, agreement compliance,
 * age-appropriateness, restriction reviews, and equity.
 */
export function evaluateDeviceAccess(
  records: DeviceAccessRecord[],
  childIds: string[],
  referenceDate?: string,
): DeviceAccessResult {
  const totalChildren = childIds.length;

  // Filter to relevant children
  const relevantRecords = records.filter((r) => childIds.includes(r.childId));

  // Children with at least one device access record
  const childrenWithAccessSet = new Set(relevantRecords.map((r) => r.childId));
  const childrenWithAccess = childrenWithAccessSet.size;
  const accessRate = pct(childrenWithAccess, totalChildren);

  // Agreement compliance
  const totalRecords = relevantRecords.length;
  const signedAgreements = relevantRecords.filter((r) => r.agreementSigned).length;
  const agreementComplianceRate = pct(signedAgreements, totalRecords);

  // Age appropriateness
  const ageAppropriateCount = relevantRecords.filter((r) => r.ageAppropriate).length;
  const ageAppropriateRate = pct(ageAppropriateCount, totalRecords);

  // Device type breakdown
  const deviceCounts = new Map<DeviceType, number>();
  for (const r of relevantRecords) {
    deviceCounts.set(r.deviceType, (deviceCounts.get(r.deviceType) ?? 0) + 1);
  }
  const deviceTypeBreakdown = Array.from(deviceCounts.entries())
    .map(([deviceType, count]) => ({ deviceType, count }))
    .sort((a, b) => b.count - a.count);

  // Access level breakdown
  const accessLevelCounts = new Map<AccessLevel, number>();
  for (const r of relevantRecords) {
    accessLevelCounts.set(r.accessLevel, (accessLevelCounts.get(r.accessLevel) ?? 0) + 1);
  }
  const accessLevelBreakdown = (
    ["supervised", "monitored", "independent_with_checks", "fully_independent"] as AccessLevel[]
  ).map((accessLevel) => ({
    accessLevel,
    count: accessLevelCounts.get(accessLevel) ?? 0,
  }));

  // Overdue reviews
  const refDate = referenceDate ?? new Date().toISOString().split("T")[0];
  const overdueReviews = relevantRecords.filter((r) => r.reviewDate < refDate).length;

  // Children without access
  const childrenWithoutAccess = childIds.filter(
    (id) => !childrenWithAccessSet.has(id),
  );

  return {
    totalChildren,
    childrenWithAccess,
    accessRate,
    agreementComplianceRate,
    ageAppropriateRate,
    deviceTypeBreakdown,
    accessLevelBreakdown,
    overdueReviews,
    childrenWithoutAccess,
  };
}

/**
 * Evaluates online learning engagement.
 * Examines: learning frequency, variety of activities,
 * positive outcome rate, supervised rate, and duration.
 */
export function evaluateOnlineLearning(
  learning: OnlineLearningRecord[],
  childIds: string[],
  periodStart?: string,
  periodEnd?: string,
): OnlineLearningResult {
  // Filter to relevant children and period
  let relevantRecords = learning.filter((r) => childIds.includes(r.childId));
  if (periodStart && periodEnd) {
    relevantRecords = relevantRecords.filter((r) =>
      inPeriod(r.date, periodStart, periodEnd),
    );
  }

  const totalSessions = relevantRecords.length;
  const totalChildren = childIds.length;
  const sessionsPerChild =
    totalChildren === 0
      ? 0
      : Math.round((totalSessions / totalChildren) * 10) / 10;

  // Activity type breakdown
  const actTypeCounts = new Map<string, number>();
  for (const r of relevantRecords) {
    actTypeCounts.set(r.activityType, (actTypeCounts.get(r.activityType) ?? 0) + 1);
  }
  const activityTypeBreakdown = Array.from(actTypeCounts.entries())
    .map(([activityType, count]) => ({ activityType, count }))
    .sort((a, b) => b.count - a.count);

  const activityTypeCount = actTypeCounts.size;

  // Positive outcome rate
  const positiveCount = relevantRecords.filter((r) => r.outcomePositive).length;
  const positiveOutcomeRate = pct(positiveCount, totalSessions);

  // Supervised rate
  const supervisedCount = relevantRecords.filter((r) => r.supervised).length;
  const supervisedRate = pct(supervisedCount, totalSessions);

  // Duration stats
  const totalLearningMinutes = relevantRecords.reduce((s, r) => s + r.durationMinutes, 0);
  const averageDuration =
    totalSessions === 0
      ? 0
      : Math.round((totalLearningMinutes / totalSessions) * 10) / 10;

  // Children with no learning
  const childrenInLearning = new Set(relevantRecords.map((r) => r.childId));
  const childrenWithNoLearning = childIds.filter((id) => !childrenInLearning.has(id));

  return {
    totalSessions,
    sessionsPerChild,
    activityTypeBreakdown,
    activityTypeCount,
    positiveOutcomeRate,
    supervisedRate,
    averageDuration,
    totalLearningMinutes,
    childrenWithNoLearning,
  };
}

/**
 * Evaluates digital citizenship demonstrations.
 * Examines: positive demonstration rate, area coverage,
 * per-child patterns.
 */
export function evaluateDigitalCitizenship(
  records: DigitalCitizenshipRecord[],
  childIds: string[],
  periodStart?: string,
  periodEnd?: string,
): DigitalCitizenshipResult {
  // Filter to relevant children and period
  let relevantRecords = records.filter((r) => childIds.includes(r.childId));
  if (periodStart && periodEnd) {
    relevantRecords = relevantRecords.filter((r) =>
      inPeriod(r.date, periodStart, periodEnd),
    );
  }

  const totalRecords = relevantRecords.length;

  // Positive rate
  const positiveCount = relevantRecords.filter((r) => r.demonstratedPositively).length;
  const positiveRate = pct(positiveCount, totalRecords);

  // Area coverage
  const coveredAreas = new Set(relevantRecords.map((r) => r.area));
  const areaCoverage = coveredAreas.size;
  const totalAreas = ALL_CITIZENSHIP_AREAS.length;

  // Area breakdown
  const areaStats = new Map<string, { positive: number; total: number }>();
  for (const r of relevantRecords) {
    const existing = areaStats.get(r.area) ?? { positive: 0, total: 0 };
    existing.total += 1;
    if (r.demonstratedPositively) existing.positive += 1;
    areaStats.set(r.area, existing);
  }
  const areaBreakdown = ALL_CITIZENSHIP_AREAS.map((area) => {
    const stats = areaStats.get(area);
    return {
      area,
      positiveCount: stats?.positive ?? 0,
      totalCount: stats?.total ?? 0,
    };
  });

  // Children with records
  const childrenWithRecordsSet = new Set(relevantRecords.map((r) => r.childId));
  const childrenWithRecords = childrenWithRecordsSet.size;
  const childrenWithNoRecords = childIds.filter(
    (id) => !childrenWithRecordsSet.has(id),
  );

  return {
    totalRecords,
    positiveRate,
    areaCoverage,
    totalAreas,
    areaBreakdown,
    childrenWithRecords,
    childrenWithNoRecords,
  };
}

/**
 * Builds per-child digital profiles combining all data sources.
 */
export function buildChildDigitalProfiles(
  assessments: DigitalSkillAssessment[],
  access: DeviceAccessRecord[],
  learning: OnlineLearningRecord[],
  citizenship: DigitalCitizenshipRecord[],
  childIds: string[],
  childNames: Record<string, string>,
  periodStart?: string,
  periodEnd?: string,
): ChildDigitalProfile[] {
  return childIds.map((childId) => {
    const childName = childNames[childId] ?? childId;

    // Latest assessment
    const childAssessments = assessments
      .filter((a) => a.childId === childId)
      .sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));
    const latest = childAssessments[0];
    const hasAssessment = !!latest;
    const overallSkillLevel = latest?.overallLevel;
    const skillLevelNumeric = latest
      ? averageSkillLevelNumeric(latest.skills)
      : undefined;

    // Device access
    const childAccess = access.filter((r) => r.childId === childId);
    const deviceAccessCount = childAccess.length;
    const agreementsSigned = childAccess.filter((r) => r.agreementSigned).length;

    // Learning records
    let childLearning = learning.filter((r) => r.childId === childId);
    if (periodStart && periodEnd) {
      childLearning = childLearning.filter((r) =>
        inPeriod(r.date, periodStart, periodEnd),
      );
    }
    const learningSessionCount = childLearning.length;
    const learningMinutes = childLearning.reduce((s, r) => s + r.durationMinutes, 0);
    const positiveOutcomes = childLearning.filter((r) => r.outcomePositive).length;

    // Citizenship
    let childCitizenship = citizenship.filter((r) => r.childId === childId);
    if (periodStart && periodEnd) {
      childCitizenship = childCitizenship.filter((r) =>
        inPeriod(r.date, periodStart, periodEnd),
      );
    }
    const totalCitizenship = childCitizenship.length;
    const positiveCitizenship = childCitizenship.filter(
      (r) => r.demonstratedPositively,
    ).length;
    const citizenshipScore = totalCitizenship;
    const citizenshipPositiveRate = pct(positiveCitizenship, totalCitizenship);

    // Strengths
    const strengths: string[] = [];
    if (latest) {
      const highSkills = latest.skills.filter(
        (s) =>
          s.level === "proficient" || s.level === "advanced",
      );
      for (const s of highSkills) {
        strengths.push(
          `Strong ${getSkillCategoryLabel(s.category).toLowerCase()} skills`,
        );
      }
    }
    if (learningSessionCount >= 5) {
      strengths.push("Active online learner");
    }
    if (citizenshipPositiveRate >= 80 && totalCitizenship >= 2) {
      strengths.push("Excellent digital citizenship");
    }

    // Development areas
    const developmentAreas: string[] = [];
    if (!hasAssessment) {
      developmentAreas.push("Needs digital skills assessment");
    }
    if (latest) {
      const lowSkills = latest.skills.filter(
        (s) => s.level === "beginner",
      );
      for (const s of lowSkills) {
        developmentAreas.push(
          `Develop ${getSkillCategoryLabel(s.category).toLowerCase()}`,
        );
      }
    }
    if (deviceAccessCount === 0) {
      developmentAreas.push("No device access recorded");
    }
    if (learningSessionCount === 0) {
      developmentAreas.push("No online learning sessions recorded");
    }
    if (totalCitizenship === 0) {
      developmentAreas.push("No digital citizenship observations recorded");
    }

    return {
      childId,
      childName,
      hasAssessment,
      overallSkillLevel,
      skillLevelNumeric,
      deviceAccessCount,
      agreementsSigned,
      learningSessionCount,
      learningMinutes,
      positiveOutcomes,
      citizenshipScore,
      citizenshipPositiveRate,
      strengths,
      developmentAreas,
    };
  });
}

/**
 * Generates the full Digital Literacy Intelligence report.
 * Combines all sub-evaluations into a scored, rated intelligence output.
 */
export function generateDigitalLiteracyIntelligence(
  assessments: DigitalSkillAssessment[],
  access: DeviceAccessRecord[],
  learning: OnlineLearningRecord[],
  citizenship: DigitalCitizenshipRecord[],
  childIds: string[],
  childNames: Record<string, string>,
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate?: string,
): DigitalLiteracyIntelligenceResult {
  const refDate = referenceDate ?? periodEnd;

  const digitalSkills = evaluateDigitalSkills(assessments, childIds, refDate);
  const deviceAccess = evaluateDeviceAccess(access, childIds, refDate);
  const onlineLearning = evaluateOnlineLearning(
    learning,
    childIds,
    periodStart,
    periodEnd,
  );
  const digitalCitizenship = evaluateDigitalCitizenship(
    citizenship,
    childIds,
    periodStart,
    periodEnd,
  );
  const childProfiles = buildChildDigitalProfiles(
    assessments,
    access,
    learning,
    citizenship,
    childIds,
    childNames,
    periodStart,
    periodEnd,
  );

  // ── Scoring ──────────────────────────────────────────────────────────────

  // Guard: if no children, everything is 0
  if (childIds.length === 0) {
    return {
      homeId,
      periodStart,
      periodEnd,
      overallScore: 0,
      rating: "inadequate" as const,
      digitalSkills,
      deviceAccess,
      onlineLearning,
      digitalCitizenship,
      childProfiles,
      strengths: [],
      areasForDevelopment: [],
      immediateActions: [],
      regulatoryLinks: [
        "CHR 2015 Reg 8 — Education: digital skills form part of children's educational development",
        "CHR 2015 Reg 9 — Enjoyment & Achievement: digital creativity and online engagement support achievement",
        "UNCRC Article 17 — Access to Information: children have the right to access information through digital media",
        "SCCIF — Experiences & Progress: inspectors assess digital inclusion and progress in digital competence",
        "DfE Digital Standards — Computing curriculum benchmarks apply to looked-after children's education",
      ],
    };
  }

  // 1. Digital skills (30 points)
  let skillsScore = 0;

  // Assessment coverage (up to 12 points)
  if (digitalSkills.assessmentRate === 100) skillsScore += 12;
  else if (digitalSkills.assessmentRate >= 80) skillsScore += 9;
  else if (digitalSkills.assessmentRate >= 50) skillsScore += 5;
  else if (digitalSkills.assessmentRate > 0) skillsScore += 2;

  // Skill levels (up to 10 points)
  if (digitalSkills.averageSkillLevel >= 4) skillsScore += 10;
  else if (digitalSkills.averageSkillLevel >= 3) skillsScore += 7;
  else if (digitalSkills.averageSkillLevel >= 2) skillsScore += 4;
  else if (digitalSkills.averageSkillLevel > 0) skillsScore += 2;

  // Skill gaps penalty / coverage bonus (up to 8 points)
  const gapRatio =
    ALL_SKILL_CATEGORIES.length > 0
      ? digitalSkills.skillGaps.length / ALL_SKILL_CATEGORIES.length
      : 0;
  if (gapRatio === 0) skillsScore += 8;
  else if (gapRatio <= 0.2) skillsScore += 6;
  else if (gapRatio <= 0.4) skillsScore += 4;
  else if (gapRatio <= 0.6) skillsScore += 2;

  skillsScore = Math.min(skillsScore, 30);

  // 2. Device access (20 points)
  let accessScore = 0;

  // Access equity (up to 8 points)
  if (deviceAccess.accessRate === 100) accessScore += 8;
  else if (deviceAccess.accessRate >= 80) accessScore += 6;
  else if (deviceAccess.accessRate >= 50) accessScore += 3;
  else if (deviceAccess.accessRate > 0) accessScore += 1;

  // Agreement compliance (up to 6 points)
  if (deviceAccess.agreementComplianceRate === 100) accessScore += 6;
  else if (deviceAccess.agreementComplianceRate >= 80) accessScore += 4;
  else if (deviceAccess.agreementComplianceRate >= 50) accessScore += 2;

  // Age appropriateness (up to 6 points)
  if (deviceAccess.ageAppropriateRate === 100) accessScore += 6;
  else if (deviceAccess.ageAppropriateRate >= 80) accessScore += 4;
  else if (deviceAccess.ageAppropriateRate >= 50) accessScore += 2;

  accessScore = Math.min(accessScore, 20);

  // 3. Online learning (25 points)
  let learningScore = 0;

  // Frequency / sessions per child (up to 8 points)
  if (onlineLearning.sessionsPerChild >= 5) learningScore += 8;
  else if (onlineLearning.sessionsPerChild >= 3) learningScore += 6;
  else if (onlineLearning.sessionsPerChild >= 1) learningScore += 3;
  else if (onlineLearning.sessionsPerChild > 0) learningScore += 1;

  // Variety — number of activity types (up to 7 points)
  if (onlineLearning.activityTypeCount >= 5) learningScore += 7;
  else if (onlineLearning.activityTypeCount >= 4) learningScore += 5;
  else if (onlineLearning.activityTypeCount >= 3) learningScore += 4;
  else if (onlineLearning.activityTypeCount >= 2) learningScore += 2;
  else if (onlineLearning.activityTypeCount >= 1) learningScore += 1;

  // Positive outcomes (up to 6 points)
  if (onlineLearning.positiveOutcomeRate >= 90) learningScore += 6;
  else if (onlineLearning.positiveOutcomeRate >= 75) learningScore += 4;
  else if (onlineLearning.positiveOutcomeRate >= 50) learningScore += 2;

  // Children all engaged (up to 4 points)
  if (onlineLearning.childrenWithNoLearning.length === 0) learningScore += 4;
  else if (
    onlineLearning.childrenWithNoLearning.length <
    childIds.length
  )
    learningScore += 2;

  learningScore = Math.min(learningScore, 25);

  // 4. Digital citizenship (25 points)
  let citizenshipScore = 0;

  // Positive demonstration rate (up to 10 points)
  if (digitalCitizenship.positiveRate >= 90) citizenshipScore += 10;
  else if (digitalCitizenship.positiveRate >= 75) citizenshipScore += 7;
  else if (digitalCitizenship.positiveRate >= 50) citizenshipScore += 4;
  else if (digitalCitizenship.positiveRate > 0) citizenshipScore += 2;

  // Area coverage (up to 9 points)
  const areaCoverageRate = pct(
    digitalCitizenship.areaCoverage,
    digitalCitizenship.totalAreas,
  );
  if (areaCoverageRate === 100) citizenshipScore += 9;
  else if (areaCoverageRate >= 80) citizenshipScore += 7;
  else if (areaCoverageRate >= 50) citizenshipScore += 4;
  else if (areaCoverageRate > 0) citizenshipScore += 2;

  // Children participation (up to 6 points)
  const citizenshipParticipationRate = pct(
    digitalCitizenship.childrenWithRecords,
    childIds.length,
  );
  if (citizenshipParticipationRate === 100) citizenshipScore += 6;
  else if (citizenshipParticipationRate >= 80) citizenshipScore += 4;
  else if (citizenshipParticipationRate >= 50) citizenshipScore += 2;

  citizenshipScore = Math.min(citizenshipScore, 25);

  // ── Total Score ─────────────────────────────────────────────────────────
  const overallScore = Math.min(
    100,
    Math.max(0, skillsScore + accessScore + learningScore + citizenshipScore),
  );

  // ── Rating ──────────────────────────────────────────────────────────────
  const rating: DigitalLiteracyIntelligenceResult["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths / Areas / Actions ─────────────────────────────────────────
  const strengths: string[] = [];
  const areasForDevelopment: string[] = [];
  const immediateActions: string[] = [];

  // Strengths
  if (digitalSkills.assessmentRate === 100) {
    strengths.push("All children have digital skills assessments");
  }
  if (digitalSkills.averageSkillLevel >= 3) {
    strengths.push("Average digital skill level at competent or above");
  }
  if (digitalSkills.skillGaps.length === 0) {
    strengths.push("Comprehensive coverage across all digital skill categories");
  }
  if (deviceAccess.accessRate === 100) {
    strengths.push("All children have equitable device access");
  }
  if (deviceAccess.agreementComplianceRate === 100) {
    strengths.push("All device access agreements signed and current");
  }
  if (onlineLearning.positiveOutcomeRate >= 80) {
    strengths.push(
      `High positive outcome rate from online learning (${onlineLearning.positiveOutcomeRate}%)`,
    );
  }
  if (onlineLearning.activityTypeCount >= 4) {
    strengths.push("Good variety of online learning activities");
  }
  if (digitalCitizenship.positiveRate >= 80 && digitalCitizenship.totalRecords > 0) {
    strengths.push(
      `Strong digital citizenship — ${digitalCitizenship.positiveRate}% positive demonstrations`,
    );
  }
  if (
    digitalCitizenship.areaCoverage === digitalCitizenship.totalAreas &&
    digitalCitizenship.totalRecords > 0
  ) {
    strengths.push("Digital citizenship observed across all areas");
  }

  // Areas for development
  if (digitalSkills.assessmentRate < 100) {
    areasForDevelopment.push(
      `Digital skills assessments needed for ${digitalSkills.totalChildren - digitalSkills.childrenWithAssessment} child${
        digitalSkills.totalChildren - digitalSkills.childrenWithAssessment !== 1 ? "ren" : ""
      }`,
    );
  }
  if (digitalSkills.skillGaps.length > 0) {
    areasForDevelopment.push(
      `Skill gaps in: ${digitalSkills.skillGaps.map((g) => getSkillCategoryLabel(g).toLowerCase()).join(", ")}`,
    );
  }
  if (deviceAccess.childrenWithoutAccess.length > 0) {
    areasForDevelopment.push(
      `${deviceAccess.childrenWithoutAccess.length} child${deviceAccess.childrenWithoutAccess.length !== 1 ? "ren" : ""} without device access records`,
    );
  }
  if (deviceAccess.agreementComplianceRate < 100 && deviceAccess.agreementComplianceRate > 0) {
    areasForDevelopment.push("Not all device access agreements are signed");
  }
  if (onlineLearning.childrenWithNoLearning.length > 0) {
    areasForDevelopment.push(
      `${onlineLearning.childrenWithNoLearning.length} child${onlineLearning.childrenWithNoLearning.length !== 1 ? "ren" : ""} with no online learning activity`,
    );
  }
  if (onlineLearning.activityTypeCount < 3 && onlineLearning.totalSessions > 0) {
    areasForDevelopment.push(
      "Limited variety of online learning activities — diversify activity types",
    );
  }
  if (digitalCitizenship.childrenWithNoRecords.length > 0) {
    areasForDevelopment.push(
      `Digital citizenship not recorded for ${digitalCitizenship.childrenWithNoRecords.length} child${
        digitalCitizenship.childrenWithNoRecords.length !== 1 ? "ren" : ""
      }`,
    );
  }
  if (
    digitalCitizenship.areaCoverage < digitalCitizenship.totalAreas &&
    digitalCitizenship.totalRecords > 0
  ) {
    const uncovered = ALL_CITIZENSHIP_AREAS.filter(
      (a) => !new Set(citizenship.map((r) => r.area)).has(a),
    );
    if (uncovered.length > 0) {
      areasForDevelopment.push(
        `Digital citizenship gaps in: ${uncovered.map((a) => getCitizenshipAreaLabel(a).toLowerCase()).join(", ")}`,
      );
    }
  }

  // Immediate actions
  if (digitalSkills.assessmentRate === 0) {
    immediateActions.push(
      "Urgently complete digital skills assessments for all children",
    );
  }
  if (digitalSkills.overdueReviews > 0) {
    immediateActions.push(
      `Review ${digitalSkills.overdueReviews} overdue digital skills assessment${
        digitalSkills.overdueReviews !== 1 ? "s" : ""
      }`,
    );
  }
  if (deviceAccess.accessRate === 0) {
    immediateActions.push(
      "Establish device access records and agreements for all children",
    );
  }
  if (deviceAccess.overdueReviews > 0) {
    immediateActions.push(
      `Review ${deviceAccess.overdueReviews} overdue device access agreement${
        deviceAccess.overdueReviews !== 1 ? "s" : ""
      }`,
    );
  }
  if (deviceAccess.ageAppropriateRate < 100 && deviceAccess.ageAppropriateRate > 0) {
    immediateActions.push(
      "Review device access for age-appropriateness concerns",
    );
  }
  if (
    onlineLearning.positiveOutcomeRate < 50 &&
    onlineLearning.totalSessions > 0
  ) {
    immediateActions.push(
      "Low positive outcome rate — review online learning approach and support",
    );
  }
  if (
    digitalCitizenship.positiveRate < 50 &&
    digitalCitizenship.totalRecords > 0
  ) {
    immediateActions.push(
      "Low positive digital citizenship rate — consider targeted support sessions",
    );
  }

  // ── Regulatory Links ───────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 8 — Education: digital skills form part of children's educational development",
    "CHR 2015 Reg 9 — Enjoyment & Achievement: digital creativity and online engagement support achievement",
    "UNCRC Article 17 — Access to Information: children have the right to access information through digital media",
    "SCCIF — Experiences & Progress: inspectors assess digital inclusion and progress in digital competence",
    "DfE Digital Standards — Computing curriculum benchmarks apply to looked-after children's education",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    digitalSkills,
    deviceAccess,
    onlineLearning,
    digitalCitizenship,
    childProfiles,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
  };
}
