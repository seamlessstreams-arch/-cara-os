import { above, below, meanOf, meets, rate } from "@/lib/metrics/rate";
// ==============================================================================
// Life Story Work Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how well the home supports children's life story work:
//   1. Session Quality (frequency, engagement, therapeutic approach)
//   2. Memory & Record Keeping (life story books, memory boxes, photographs)
//   3. Policy & Governance (life story work policy, identity support)
//   4. Staff Readiness (training, therapeutic skills, cultural sensitivity)
//
// Regulatory: CHR 2015 Reg 10, CHR 2015 Reg 12, SCCIF, Children Act 1989,
//             Care Planning Regulations 2010, NMS 3, UNCRC Article 8
// ==============================================================================

// -- Type unions ---------------------------------------------------------------

export type SessionType =
  | "life_story_book"
  | "memory_box"
  | "photo_work"
  | "therapeutic_narrative"
  | "timeline_work"
  | "family_tree"
  | "identity_exploration"
  | "digital_story";

export type EngagementLevel =
  | "highly_engaged"
  | "engaged"
  | "partially_engaged"
  | "reluctant"
  | "refused";

export type MemoryItemType =
  | "photograph"
  | "letter"
  | "certificate"
  | "artwork"
  | "report"
  | "keepsake"
  | "digital_media"
  | "other";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label maps ----------------------------------------------------------------

const sessionTypeLabels: Record<SessionType, string> = {
  life_story_book: "Life Story Book",
  memory_box: "Memory Box",
  photo_work: "Photo Work",
  therapeutic_narrative: "Therapeutic Narrative",
  timeline_work: "Timeline Work",
  family_tree: "Family Tree",
  identity_exploration: "Identity Exploration",
  digital_story: "Digital Story",
};

const engagementLevelLabels: Record<EngagementLevel, string> = {
  highly_engaged: "Highly Engaged",
  engaged: "Engaged",
  partially_engaged: "Partially Engaged",
  reluctant: "Reluctant",
  refused: "Refused",
};

const memoryItemTypeLabels: Record<MemoryItemType, string> = {
  photograph: "Photograph",
  letter: "Letter",
  certificate: "Certificate",
  artwork: "Artwork",
  report: "Report",
  keepsake: "Keepsake",
  digital_media: "Digital Media",
  other: "Other",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label getters -------------------------------------------------------------

export function getSessionTypeLabel(s: SessionType): string {
  return sessionTypeLabels[s] ?? s;
}
export function getEngagementLevelLabel(e: EngagementLevel): string {
  return engagementLevelLabels[e] ?? e;
}
export function getMemoryItemTypeLabel(m: MemoryItemType): string {
  return memoryItemTypeLabels[m] ?? m;
}
export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// -- Input interfaces ----------------------------------------------------------

export interface LifeStorySession {
  id: string;
  childId: string;
  childName: string;
  sessionDate: string;
  sessionType: SessionType;
  facilitator: string;
  durationMinutes: number;
  engagementLevel: EngagementLevel;
  therapeuticApproachUsed: boolean;
  childLedPace: boolean;
  recordedInCasefile: boolean;
  followUpPlanned: boolean;
}

export interface MemoryRecord {
  id: string;
  childId: string;
  childName: string;
  itemType: MemoryItemType;
  dateAdded: string;
  securelyStored: boolean;
  childAccessible: boolean;
  qualityChecked: boolean;
}

export interface LifeStoryPolicy {
  id: string;
  lifeStoryWorkPolicy: boolean;
  identitySupportFramework: boolean;
  therapeuticApproachGuidance: boolean;
  memoryKeepingProtocol: boolean;
  culturalSensitivityGuidance: boolean;
  childConsentProcess: boolean;
  regularReviewSchedule: boolean;
}

export interface StaffLifeStoryTraining {
  id: string;
  staffId: string;
  staffName: string;
  lifeStoryWork: boolean;
  therapeuticNarrative: boolean;
  traumaInformed: boolean;
  culturalSensitivity: boolean;
  childLedApproach: boolean;
  memoryKeeping: boolean;
}

// -- Result interfaces ---------------------------------------------------------

export interface SessionQualityResult {
  overallScore: number;
  totalSessions: number;
  /** null when the population is empty — nothing measured, not 0%. */
  engagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  therapeuticRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childLedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  recordedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  followUpRate: number | null;
}

export interface MemoryRecordKeepingResult {
  overallScore: number;
  totalItems: number;
  /** null when the population is empty — nothing measured, not 0%. */
  secureStorageRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childAccessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  qualityCheckedRate: number | null;
}

export interface LifeStoryPolicyResult {
  overallScore: number;
  lifeStoryWorkPolicy: boolean;
  identitySupportFramework: boolean;
  therapeuticApproachGuidance: boolean;
  memoryKeepingProtocol: boolean;
  culturalSensitivityGuidance: boolean;
  childConsentProcess: boolean;
  regularReviewSchedule: boolean;
}

export interface StaffLifeStoryReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  lifeStoryWorkRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  therapeuticNarrativeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  traumaInformedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  culturalSensitivityRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childLedApproachRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  memoryKeepingRate: number | null;
}

export interface ChildLifeStoryProfile {
  childId: string;
  childName: string;
  totalSessions: number;
  totalMemoryItems: number;
  /** null when this child has no measurable population for it. */
  engagementRate: number | null;
  /** null when this child has no measurable population for it. */
  therapeuticRate: number | null;
  overallScore: number;
}

export interface LifeStoryWorkIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  sessionQuality: SessionQualityResult;
  memoryRecordKeeping: MemoryRecordKeepingResult;
  lifeStoryPolicy: LifeStoryPolicyResult;
  staffReadiness: StaffLifeStoryReadinessResult;
  childProfiles: ChildLifeStoryProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers -------------------------------------------------------------------

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Evaluators ----------------------------------------------------------------

/**
 * Evaluates life story session quality.
 * Empty = 0 (no sessions = no life story work evidence).
 *
 *   Engagement rate (highly_engaged + engaged)  → 0-7
 *   Therapeutic approach rate                    → 0-6
 *   Child-led pace rate                          → 0-6
 *   Recorded + follow-up combined rate           → 0-6
 */
export function evaluateSessionQuality(
  sessions: LifeStorySession[],
): SessionQualityResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      engagementRate: null,
      therapeuticRate: null,
      childLedRate: null,
      recordedRate: null,
      followUpRate: null,
    };
  }

  let score = 0;

  const engaged = sessions.filter(
    (s) => s.engagementLevel === "highly_engaged" || s.engagementLevel === "engaged",
  ).length;
  const engagementRate = rate(engaged, sessions.length);
  if (meets(engagementRate, 80)) score += 7;
  else if (meets(engagementRate, 60)) score += 5;
  else if (meets(engagementRate, 40)) score += 3;
  else if (above(engagementRate, 0)) score += 1;

  const therapeutic = sessions.filter((s) => s.therapeuticApproachUsed).length;
  const therapeuticRate = rate(therapeutic, sessions.length);
  if (meets(therapeuticRate, 90)) score += 6;
  else if (meets(therapeuticRate, 70)) score += 4;
  else if (meets(therapeuticRate, 50)) score += 3;
  else if (above(therapeuticRate, 0)) score += 1;

  const childLed = sessions.filter((s) => s.childLedPace).length;
  const childLedRate = rate(childLed, sessions.length);
  if (meets(childLedRate, 90)) score += 6;
  else if (meets(childLedRate, 70)) score += 4;
  else if (meets(childLedRate, 50)) score += 3;
  else if (above(childLedRate, 0)) score += 1;

  const recorded = sessions.filter((s) => s.recordedInCasefile).length;
  const recordedRate = rate(recorded, sessions.length);
  const followUp = sessions.filter((s) => s.followUpPlanned).length;
  const followUpRate = rate(followUp, sessions.length);
  const combinedRate = meanOf([recordedRate, followUpRate]) ?? 0; // unmeasured earns no bonus
  if (combinedRate >= 90) score += 6;
  else if (combinedRate >= 70) score += 4;
  else if (combinedRate >= 50) score += 3;
  else if (combinedRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalSessions: sessions.length,
    engagementRate,
    therapeuticRate,
    childLedRate,
    recordedRate,
    followUpRate,
  };
}

/**
 * Evaluates memory and record keeping.
 * Empty = 0 (no memory items = no evidence of memory work).
 *
 *   Secure storage rate         → 0-8
 *   Child accessible rate       → 0-9
 *   Quality checked rate        → 0-8
 */
export function evaluateMemoryRecordKeeping(
  records: MemoryRecord[],
): MemoryRecordKeepingResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalItems: 0,
      secureStorageRate: null,
      childAccessRate: null,
      qualityCheckedRate: null,
    };
  }

  let score = 0;

  const secure = records.filter((r) => r.securelyStored).length;
  const secureStorageRate = rate(secure, records.length);
  if (meets(secureStorageRate, 90)) score += 8;
  else if (meets(secureStorageRate, 70)) score += 6;
  else if (meets(secureStorageRate, 50)) score += 4;
  else if (above(secureStorageRate, 0)) score += 2;

  const accessible = records.filter((r) => r.childAccessible).length;
  const childAccessRate = rate(accessible, records.length);
  if (meets(childAccessRate, 90)) score += 9;
  else if (meets(childAccessRate, 70)) score += 7;
  else if (meets(childAccessRate, 50)) score += 4;
  else if (above(childAccessRate, 0)) score += 2;

  const checked = records.filter((r) => r.qualityChecked).length;
  const qualityCheckedRate = rate(checked, records.length);
  if (meets(qualityCheckedRate, 90)) score += 8;
  else if (meets(qualityCheckedRate, 70)) score += 6;
  else if (meets(qualityCheckedRate, 50)) score += 4;
  else if (above(qualityCheckedRate, 0)) score += 2;

  return {
    overallScore: Math.min(score, 25),
    totalItems: records.length,
    secureStorageRate,
    childAccessRate,
    qualityCheckedRate,
  };
}

/**
 * Evaluates life story work policy and governance.
 * Null = 0 (no policy = no governance framework).
 *
 *   lifeStoryWorkPolicy          → 0-4
 *   identitySupportFramework     → 0-4
 *   therapeuticApproachGuidance  → 0-4
 *   memoryKeepingProtocol        → 0-4
 *   culturalSensitivityGuidance  → 0-3
 *   childConsentProcess          → 0-3
 *   regularReviewSchedule        → 0-3
 */
export function evaluateLifeStoryPolicy(
  policy: LifeStoryPolicy | null,
): LifeStoryPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      lifeStoryWorkPolicy: false,
      identitySupportFramework: false,
      therapeuticApproachGuidance: false,
      memoryKeepingProtocol: false,
      culturalSensitivityGuidance: false,
      childConsentProcess: false,
      regularReviewSchedule: false,
    };
  }

  let score = 0;

  if (policy.lifeStoryWorkPolicy) score += 4;
  if (policy.identitySupportFramework) score += 4;
  if (policy.therapeuticApproachGuidance) score += 4;
  if (policy.memoryKeepingProtocol) score += 4;
  if (policy.culturalSensitivityGuidance) score += 3;
  if (policy.childConsentProcess) score += 3;
  if (policy.regularReviewSchedule) score += 3;

  return {
    overallScore: Math.min(score, 25),
    lifeStoryWorkPolicy: policy.lifeStoryWorkPolicy,
    identitySupportFramework: policy.identitySupportFramework,
    therapeuticApproachGuidance: policy.therapeuticApproachGuidance,
    memoryKeepingProtocol: policy.memoryKeepingProtocol,
    culturalSensitivityGuidance: policy.culturalSensitivityGuidance,
    childConsentProcess: policy.childConsentProcess,
    regularReviewSchedule: policy.regularReviewSchedule,
  };
}

/**
 * Evaluates staff training on life story work.
 * Empty = 0 (no trained staff = no readiness).
 *
 *   Life story work rate          → 0-6
 *   Therapeutic narrative rate    → 0-5
 *   Trauma informed rate          → 0-5
 *   Cultural sensitivity rate     → 0-4
 *   Child-led approach rate       → 0-3
 *   Memory keeping rate           → 0-2
 */
export function evaluateStaffLifeStoryReadiness(
  training: StaffLifeStoryTraining[],
): StaffLifeStoryReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      lifeStoryWorkRate: null,
      therapeuticNarrativeRate: null,
      traumaInformedRate: null,
      culturalSensitivityRate: null,
      childLedApproachRate: null,
      memoryKeepingRate: null,
    };
  }

  let score = 0;

  const lsw = training.filter((t) => t.lifeStoryWork).length;
  const lifeStoryWorkRate = rate(lsw, training.length);
  if (meets(lifeStoryWorkRate, 90)) score += 6;
  else if (meets(lifeStoryWorkRate, 70)) score += 4;
  else if (meets(lifeStoryWorkRate, 50)) score += 3;
  else if (above(lifeStoryWorkRate, 0)) score += 1;

  const tn = training.filter((t) => t.therapeuticNarrative).length;
  const therapeuticNarrativeRate = rate(tn, training.length);
  if (meets(therapeuticNarrativeRate, 90)) score += 5;
  else if (meets(therapeuticNarrativeRate, 70)) score += 3;
  else if (meets(therapeuticNarrativeRate, 50)) score += 2;
  else if (above(therapeuticNarrativeRate, 0)) score += 1;

  const ti = training.filter((t) => t.traumaInformed).length;
  const traumaInformedRate = rate(ti, training.length);
  if (meets(traumaInformedRate, 90)) score += 5;
  else if (meets(traumaInformedRate, 70)) score += 3;
  else if (meets(traumaInformedRate, 50)) score += 2;
  else if (above(traumaInformedRate, 0)) score += 1;

  const cs = training.filter((t) => t.culturalSensitivity).length;
  const culturalSensitivityRate = rate(cs, training.length);
  if (meets(culturalSensitivityRate, 90)) score += 4;
  else if (meets(culturalSensitivityRate, 70)) score += 3;
  else if (meets(culturalSensitivityRate, 50)) score += 2;
  else if (above(culturalSensitivityRate, 0)) score += 1;

  const cla = training.filter((t) => t.childLedApproach).length;
  const childLedApproachRate = rate(cla, training.length);
  if (meets(childLedApproachRate, 90)) score += 3;
  else if (meets(childLedApproachRate, 70)) score += 2;
  else if (meets(childLedApproachRate, 50)) score += 1;

  const mk = training.filter((t) => t.memoryKeeping).length;
  const memoryKeepingRate = rate(mk, training.length);
  if (meets(memoryKeepingRate, 90)) score += 2;
  else if (meets(memoryKeepingRate, 70)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: training.length,
    lifeStoryWorkRate,
    therapeuticNarrativeRate,
    traumaInformedRate,
    culturalSensitivityRate,
    childLedApproachRate,
    memoryKeepingRate,
  };
}

// -- Child Profiles ------------------------------------------------------------

export function buildChildLifeStoryProfiles(
  sessions: LifeStorySession[],
  records: MemoryRecord[],
): ChildLifeStoryProfile[] {
  const childMap = new Map<
    string,
    { childId: string; childName: string; sessions: LifeStorySession[]; records: MemoryRecord[] }
  >();

  for (const s of sessions) {
    if (!childMap.has(s.childId)) {
      childMap.set(s.childId, { childId: s.childId, childName: s.childName, sessions: [], records: [] });
    }
    childMap.get(s.childId)!.sessions.push(s);
  }

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, sessions: [], records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((entry) => {
    let score = 0;

    // Session frequency (0-3)
    if (entry.sessions.length >= 5) score += 3;
    else if (entry.sessions.length >= 3) score += 2;
    else if (entry.sessions.length >= 1) score += 1;

    // Engagement (0-3)
    const engaged = entry.sessions.filter(
      (s) => s.engagementLevel === "highly_engaged" || s.engagementLevel === "engaged",
    ).length;
    const engagementRate = rate(engaged, entry.sessions.length);
    if (meets(engagementRate, 80)) score += 3;
    else if (meets(engagementRate, 50)) score += 2;
    else if (above(engagementRate, 0)) score += 1;

    // Therapeutic approach (0-2)
    const therapeutic = entry.sessions.filter((s) => s.therapeuticApproachUsed).length;
    const therapeuticRate = rate(therapeutic, entry.sessions.length);
    if (meets(therapeuticRate, 80)) score += 2;
    else if (meets(therapeuticRate, 50)) score += 1;

    // Memory items (0-2)
    if (entry.records.length >= 5) score += 2;
    else if (entry.records.length >= 1) score += 1;

    return {
      childId: entry.childId,
      childName: entry.childName,
      totalSessions: entry.sessions.length,
      totalMemoryItems: entry.records.length,
      engagementRate,
      therapeuticRate,
      overallScore: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Main generator ------------------------------------------------------------

export function generateLifeStoryWorkIntelligence(
  sessions: LifeStorySession[],
  records: MemoryRecord[],
  policy: LifeStoryPolicy | null,
  training: StaffLifeStoryTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): LifeStoryWorkIntelligence {
  const sessionQuality = evaluateSessionQuality(sessions);
  const memoryRecordKeeping = evaluateMemoryRecordKeeping(records);
  const lifeStoryPolicy = evaluateLifeStoryPolicy(policy);
  const staffReadiness = evaluateStaffLifeStoryReadiness(training);

  const rawScore =
    sessionQuality.overallScore +
    memoryRecordKeeping.overallScore +
    lifeStoryPolicy.overallScore +
    staffReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  const childProfiles = buildChildLifeStoryProfiles(sessions, records);

  // -- Strengths ---------------------------------------------------------------
  const strengths: string[] = [];

  if (meets(sessionQuality.engagementRate, 80) && sessions.length > 0) {
    strengths.push(
      "Children highly engaged in life story work sessions",
    );
  }
  if (meets(sessionQuality.therapeuticRate, 90) && sessions.length > 0) {
    strengths.push(
      "Therapeutic approaches consistently used in life story sessions",
    );
  }
  if (meets(sessionQuality.childLedRate, 90) && sessions.length > 0) {
    strengths.push(
      "Life story work consistently child-led at the child's pace",
    );
  }
  if (meets(memoryRecordKeeping.secureStorageRate, 90) && records.length > 0) {
    strengths.push(
      "Memory items securely stored and well maintained",
    );
  }
  if (meets(memoryRecordKeeping.childAccessRate, 90) && records.length > 0) {
    strengths.push(
      "Children have good access to their memory items and life story materials",
    );
  }
  if (meets(staffReadiness.lifeStoryWorkRate, 90) && training.length > 0) {
    strengths.push(
      "Staff team fully trained in life story work approaches",
    );
  }
  if (meets(staffReadiness.traumaInformedRate, 90) && training.length > 0) {
    strengths.push(
      "Staff team trained in trauma-informed life story work",
    );
  }
  if (lifeStoryPolicy.childConsentProcess && policy) {
    strengths.push(
      "Child consent process embedded in life story work practice",
    );
  }

  // -- Areas for improvement ---------------------------------------------------
  const areasForImprovement: string[] = [];

  if (below(sessionQuality.engagementRate, 60) && sessions.length > 0) {
    areasForImprovement.push(
      "Child engagement in life story sessions needs improvement — review approaches and timing",
    );
  }
  if (below(sessionQuality.recordedRate, 70) && sessions.length > 0) {
    areasForImprovement.push(
      "Life story sessions not consistently recorded in casefiles",
    );
  }
  if (below(memoryRecordKeeping.qualityCheckedRate, 70) && records.length > 0) {
    areasForImprovement.push(
      "Quality checking of memory items needs strengthening",
    );
  }
  if (below(staffReadiness.therapeuticNarrativeRate, 70) && training.length > 0) {
    areasForImprovement.push(
      "Staff training on therapeutic narrative approaches needs improvement",
    );
  }
  if (below(staffReadiness.culturalSensitivityRate, 70) && training.length > 0) {
    areasForImprovement.push(
      "Staff cultural sensitivity training for life story work needs strengthening",
    );
  }

  // -- Actions -----------------------------------------------------------------
  const actions: string[] = [];

  if (sessions.length === 0) {
    actions.push(
      "No life story work sessions recorded — ensure all children are offered regular life story work",
    );
  }
  if (records.length === 0) {
    actions.push(
      "No memory items recorded — develop memory boxes and life story books for each child",
    );
  }
  if (!policy) {
    actions.push(
      "URGENT: No life story work policy in place — develop and implement a life story work policy",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: No staff life story work training records — deliver training on life story work approaches",
    );
  }
  if (below(sessionQuality.followUpRate, 70) && sessions.length > 0) {
    actions.push(
      "Improve follow-up planning after life story sessions to maintain continuity",
    );
  }
  if (below(memoryRecordKeeping.secureStorageRate, 80) && records.length > 0) {
    actions.push(
      "Review secure storage arrangements for children's memory items",
    );
  }
  if (below(sessionQuality.childLedRate, 70) && sessions.length > 0) {
    actions.push(
      "Ensure life story work is consistently child-led and at the child's pace",
    );
  }

  // -- Regulatory links --------------------------------------------------------
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 10 — The health and wellbeing standard (identity and emotional wellbeing)",
    "CHR 2015 Reg 12 — The positive relationships standard",
    "SCCIF — Social Care Common Inspection Framework (identity and life story)",
    "Children Act 1989 — Welfare of looked-after children",
    "Care Planning Regulations 2010 — Care and placement planning",
    "NMS 3 — National Minimum Standards (placement planning and life story)",
    "UNCRC Article 8 — Right to preservation of identity",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    sessionQuality,
    memoryRecordKeeping,
    lifeStoryPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
