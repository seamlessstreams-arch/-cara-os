// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Life Story & Identity Work Engine
//
// Deterministic intelligence engine for evaluating life story work quality,
// identity support, cultural connection, memory keeping, and family links.
//
// Aligned to:
//   - CHR 2015 Reg 5  — Quality and purpose of care (identity)
//   - CHR 2015 Reg 7  — Children's wishes and feelings
//   - CHR 2015 Reg 14 — Care planning (life story work in care plan)
//   - SCCIF            — Identity and belonging, life story work
//   - UNCRC Article 8  — Right to identity
//   - UNCRC Article 30 — Right to culture, language, religion
//   - Children Act 1989 s.22(5)(c) — Cultural background
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type SessionType =
  | "life_story_book"
  | "memory_box"
  | "photograph_session"
  | "family_tree"
  | "timeline_work"
  | "identity_discussion"
  | "cultural_activity"
  | "letter_writing"
  | "creative_expression"
  | "other";

export type EngagementLevel = "high" | "moderate" | "low" | "refused";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Records ──────────────────────────────────────────────────────────

export interface LifeStoryRecord {
  id: string;
  childId: string;
  childName: string;
  sessionDate: string;
  sessionType: SessionType;
  completed: boolean;
  childLedContent: boolean;
  childEngagement: EngagementLevel;
  addedToLifeStoryBook: boolean;
  memoryBoxUpdated: boolean;
  photographsTaken: boolean;
  identityNeedsAddressed: boolean;
  culturalActivityIncluded: boolean;
  familyConnectionExplored: boolean;
}

export interface LifeStoryPolicy {
  id: string;
  lifeStoryWorkPolicy: boolean;
  childFriendlyMaterials: boolean;
  regularReviewSchedule: boolean;
  memoryKeepingProtocol: boolean;
  identityAssessmentFramework: boolean;
  culturalCompetencyPlan: boolean;
  familyConnectionProtocol: boolean;
}

export interface StaffLifeStoryTraining {
  id: string;
  staffId: string;
  staffName: string;
  lifeStoryWork: boolean;
  identitySupport: boolean;
  culturalCompetency: boolean;
  therapeuticApproach: boolean;
  memoryKeeping: boolean;
  familyWorkSkills: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface SessionQualityResult {
  overallScore: number;
  rating: Rating;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  childLedRate: number;
  engagementRate: number;
  documentationRate: number;
}

export interface IdentityCultureResult {
  overallScore: number;
  rating: Rating;
  identityAddressedRate: number;
  culturalActivityRate: number;
  familyExploredRate: number;
  photographRate: number;
}

export interface LifeStoryPolicyResult {
  overallScore: number;
  rating: Rating;
  lifeStoryWorkPolicy: boolean;
  childFriendlyMaterials: boolean;
  regularReviewSchedule: boolean;
  memoryKeepingProtocol: boolean;
  identityAssessmentFramework: boolean;
  culturalCompetencyPlan: boolean;
  familyConnectionProtocol: boolean;
}

export interface StaffLifeStoryReadinessResult {
  overallScore: number;
  rating: Rating;
  totalStaff: number;
  lifeStoryWorkRate: number;
  identitySupportRate: number;
  culturalCompetencyRate: number;
  therapeuticApproachRate: number;
  memoryKeepingRate: number;
  familyWorkSkillsRate: number;
}

export interface ChildLifeStoryProfile {
  childId: string;
  childName: string;
  totalSessions: number;
  completionRate: number;
  childLedRate: number;
  sessionTypesCovered: string[];
  overallScore: number;
}

export interface LifeStoryIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  sessionQuality: SessionQualityResult;
  identityCulture: IdentityCultureResult;
  lifeStoryPolicy: LifeStoryPolicyResult;
  staffReadiness: StaffLifeStoryReadinessResult;
  childProfiles: ChildLifeStoryProfile[];
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

export function getSessionTypeLabel(type: SessionType): string {
  const labels: Record<SessionType, string> = {
    life_story_book: "Life Story Book",
    memory_box: "Memory Box",
    photograph_session: "Photograph Session",
    family_tree: "Family Tree",
    timeline_work: "Timeline Work",
    identity_discussion: "Identity Discussion",
    cultural_activity: "Cultural Activity",
    letter_writing: "Letter Writing",
    creative_expression: "Creative Expression",
    other: "Other",
  };
  return labels[type] ?? type;
}

export function getEngagementLabel(level: EngagementLevel): string {
  const labels: Record<EngagementLevel, string> = {
    high: "High",
    moderate: "Moderate",
    low: "Low",
    refused: "Refused",
  };
  return labels[level] ?? level;
}

export function getRatingLabel(r: Rating): string {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_SESSION_TYPES: SessionType[] = [
  "life_story_book", "memory_box", "photograph_session", "family_tree",
  "timeline_work", "identity_discussion", "cultural_activity",
  "letter_writing", "creative_expression", "other",
];

// ── Evaluator 1: Session Quality (0-25) ────────────────────────────────────

export function evaluateSessionQuality(records: LifeStoryRecord[]): SessionQualityResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", totalSessions: 0, completedSessions: 0, completionRate: 0, childLedRate: 0, engagementRate: 0, documentationRate: 0 };
  }

  const completed = records.filter((r) => r.completed);
  const completedCount = completed.length;

  const completionRate = pct(completedCount, total);
  const childLedRate = pct(completed.filter((r) => r.childLedContent).length, completedCount);
  const engagementRate = pct(
    completed.filter((r) => r.childEngagement === "high" || r.childEngagement === "moderate").length,
    completedCount,
  );
  const documentationRate = pct(completed.filter((r) => r.addedToLifeStoryBook).length, completedCount);

  // Weighted: completionRate 7 + childLedRate 6 + engagementRate 6 + documentationRate 6 = 25
  const raw = (completionRate / 100) * 7 + (childLedRate / 100) * 6 + (engagementRate / 100) * 6 + (documentationRate / 100) * 6;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalSessions: total, completedSessions: completedCount, completionRate, childLedRate, engagementRate, documentationRate };
}

// ── Evaluator 2: Identity & Culture (0-25) ─────────────────────────────────

export function evaluateIdentityCulture(records: LifeStoryRecord[]): IdentityCultureResult {
  const completed = records.filter((r) => r.completed);
  const count = completed.length;

  if (count === 0) {
    return { overallScore: 0, rating: "inadequate", identityAddressedRate: 0, culturalActivityRate: 0, familyExploredRate: 0, photographRate: 0 };
  }

  const identityAddressedRate = pct(completed.filter((r) => r.identityNeedsAddressed).length, count);
  const culturalActivityRate = pct(completed.filter((r) => r.culturalActivityIncluded).length, count);
  const familyExploredRate = pct(completed.filter((r) => r.familyConnectionExplored).length, count);
  const photographRate = pct(completed.filter((r) => r.photographsTaken).length, count);

  // Weighted: identityAddressedRate 8 + culturalActivityRate 7 + familyExploredRate 5 + photographRate 5 = 25
  const raw = (identityAddressedRate / 100) * 8 + (culturalActivityRate / 100) * 7 + (familyExploredRate / 100) * 5 + (photographRate / 100) * 5;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), identityAddressedRate, culturalActivityRate, familyExploredRate, photographRate };
}

// ── Evaluator 3: Policy & Governance (0-25) ────────────────────────────────

export function evaluateLifeStoryPolicy(policy: LifeStoryPolicy | null): LifeStoryPolicyResult {
  if (!policy) {
    return { overallScore: 0, rating: "inadequate", lifeStoryWorkPolicy: false, childFriendlyMaterials: false, regularReviewSchedule: false, memoryKeepingProtocol: false, identityAssessmentFramework: false, culturalCompetencyPlan: false, familyConnectionProtocol: false };
  }

  // First 4 booleans at 4 points, last 3 at 3 points = 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.lifeStoryWorkPolicy) score += 4;
  if (policy.childFriendlyMaterials) score += 4;
  if (policy.regularReviewSchedule) score += 4;
  if (policy.memoryKeepingProtocol) score += 4;
  if (policy.identityAssessmentFramework) score += 3;
  if (policy.culturalCompetencyPlan) score += 3;
  if (policy.familyConnectionProtocol) score += 3;

  return {
    overallScore: score,
    rating: getRating(score * 4),
    lifeStoryWorkPolicy: policy.lifeStoryWorkPolicy,
    childFriendlyMaterials: policy.childFriendlyMaterials,
    regularReviewSchedule: policy.regularReviewSchedule,
    memoryKeepingProtocol: policy.memoryKeepingProtocol,
    identityAssessmentFramework: policy.identityAssessmentFramework,
    culturalCompetencyPlan: policy.culturalCompetencyPlan,
    familyConnectionProtocol: policy.familyConnectionProtocol,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ────────────────────────────────────

export function evaluateStaffLifeStoryReadiness(staff: StaffLifeStoryTraining[]): StaffLifeStoryReadinessResult {
  const count = staff.length;
  if (count === 0) {
    return { overallScore: 0, rating: "inadequate", totalStaff: 0, lifeStoryWorkRate: 0, identitySupportRate: 0, culturalCompetencyRate: 0, therapeuticApproachRate: 0, memoryKeepingRate: 0, familyWorkSkillsRate: 0 };
  }

  const lifeStoryWorkRate = pct(staff.filter((s) => s.lifeStoryWork).length, count);
  const identitySupportRate = pct(staff.filter((s) => s.identitySupport).length, count);
  const culturalCompetencyRate = pct(staff.filter((s) => s.culturalCompetency).length, count);
  const therapeuticApproachRate = pct(staff.filter((s) => s.therapeuticApproach).length, count);
  const memoryKeepingRate = pct(staff.filter((s) => s.memoryKeeping).length, count);
  const familyWorkSkillsRate = pct(staff.filter((s) => s.familyWorkSkills).length, count);

  // Weighted: 6+5+5+4+3+2 = 25
  const raw =
    (lifeStoryWorkRate / 100) * 6 +
    (identitySupportRate / 100) * 5 +
    (culturalCompetencyRate / 100) * 5 +
    (therapeuticApproachRate / 100) * 4 +
    (memoryKeepingRate / 100) * 3 +
    (familyWorkSkillsRate / 100) * 2;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalStaff: count, lifeStoryWorkRate, identitySupportRate, culturalCompetencyRate, therapeuticApproachRate, memoryKeepingRate, familyWorkSkillsRate };
}

// ── Child Profiles (0-10) ──────────────────────────────────────────────────

export function buildChildLifeStoryProfiles(records: LifeStoryRecord[]): ChildLifeStoryProfile[] {
  const grouped = new Map<string, LifeStoryRecord[]>();
  for (const r of records) {
    const arr = grouped.get(r.childId) || [];
    arr.push(r);
    grouped.set(r.childId, arr);
  }

  const profiles: ChildLifeStoryProfile[] = [];
  for (const [childId, recs] of grouped) {
    const childName = recs[0].childName;
    const totalSessions = recs.length;
    const completed = recs.filter((r) => r.completed);
    const completedCount = completed.length;

    const completionRate = pct(completedCount, totalSessions);
    const childLedRate = pct(completed.filter((r) => r.childLedContent).length, completedCount);

    const typesSet = new Set(completed.map((r) => r.sessionType));
    const sessionTypesCovered = [...typesSet];

    // Scoring: freq [>=10→2, >=5→1] + rate1 completionRate [>=80→3, >=60→2, >=40→1] + rate2 childLedRate [>=80→3, >=60→2, >=40→1] + diversity [>=4→2, >=2→1]
    let score = 0;

    // Frequency
    if (totalSessions >= 10) score += 2;
    else if (totalSessions >= 5) score += 1;

    // Rate 1: completionRate
    if (completionRate >= 80) score += 3;
    else if (completionRate >= 60) score += 2;
    else if (completionRate >= 40) score += 1;

    // Rate 2: childLedRate
    if (childLedRate >= 80) score += 3;
    else if (childLedRate >= 60) score += 2;
    else if (childLedRate >= 40) score += 1;

    // Diversity of session types
    const typeCount = sessionTypesCovered.length;
    if (typeCount >= 4) score += 2;
    else if (typeCount >= 2) score += 1;

    profiles.push({
      childId,
      childName,
      totalSessions,
      completionRate,
      childLedRate,
      sessionTypesCovered,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// ── Master Intelligence Generator ──────────────────────────────────────────

export function generateLifeStoryIntelligence(
  records: LifeStoryRecord[],
  policy: LifeStoryPolicy | null,
  staff: StaffLifeStoryTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): LifeStoryIntelligence {
  const sessionQuality = evaluateSessionQuality(records);
  const identityCulture = evaluateIdentityCulture(records);
  const lifeStoryPolicy = evaluateLifeStoryPolicy(policy);
  const staffReadiness = evaluateStaffLifeStoryReadiness(staff);
  const childProfiles = buildChildLifeStoryProfiles(records);

  const overallScore = Math.min(
    100,
    sessionQuality.overallScore + identityCulture.overallScore + lifeStoryPolicy.overallScore + staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (>=80%)
  const strengths: string[] = [];
  if (sessionQuality.completionRate >= 80) strengths.push("Strong session completion rate — life story work is being delivered consistently");
  if (sessionQuality.childLedRate >= 80) strengths.push("Excellent child-led approach — children are directing their own narrative");
  if (sessionQuality.engagementRate >= 80) strengths.push("High child engagement in life story sessions");
  if (sessionQuality.documentationRate >= 80) strengths.push("Life story books are being regularly updated with session outputs");
  if (identityCulture.identityAddressedRate >= 80) strengths.push("Identity needs are consistently addressed within sessions");
  if (identityCulture.culturalActivityRate >= 80) strengths.push("Cultural activities are well integrated into life story work");
  if (identityCulture.familyExploredRate >= 80) strengths.push("Family connections are being explored through life story sessions");
  if (identityCulture.photographRate >= 80) strengths.push("Photographs are being taken to preserve memories");
  if (staffReadiness.lifeStoryWorkRate >= 80) strengths.push("Staff are well trained in life story work methods");

  // Areas for improvement (<60%)
  const areasForImprovement: string[] = [];
  if (sessionQuality.completionRate < 60) areasForImprovement.push("Session completion rate needs improvement — too many sessions cancelled or missed");
  if (sessionQuality.childLedRate < 60) areasForImprovement.push("More sessions should be child-led to give children ownership of their narrative");
  if (sessionQuality.engagementRate < 60) areasForImprovement.push("Child engagement is low — consider different approaches or session types");
  if (sessionQuality.documentationRate < 60) areasForImprovement.push("Life story book documentation needs improvement");
  if (identityCulture.identityAddressedRate < 60) areasForImprovement.push("Identity needs are not being systematically addressed in sessions");
  if (identityCulture.culturalActivityRate < 60) areasForImprovement.push("Cultural activities are insufficiently integrated into life story work");
  if (identityCulture.familyExploredRate < 60) areasForImprovement.push("Family connections are not being adequately explored");
  if (identityCulture.photographRate < 60) areasForImprovement.push("More photographs should be taken to preserve memories for children");
  if (staffReadiness.lifeStoryWorkRate < 60) areasForImprovement.push("Staff training in life story work methods is insufficient");
  if (staffReadiness.culturalCompetencyRate < 60) areasForImprovement.push("Staff cultural competency training needs attention");

  // Actions
  const actions: string[] = [];
  if (lifeStoryPolicy.overallScore === 0) actions.push("URGENT: Establish a formal life story work policy — CHR 2015 Reg 5/14 require documented approach");
  if (staffReadiness.overallScore === 0) actions.push("URGENT: Provide life story work training to all staff — children's identity rights depend on skilled facilitation");
  if (sessionQuality.completionRate < 50) actions.push("Review scheduling and barriers to session completion — aim for at least 80% completion rate");
  if (sessionQuality.childLedRate < 50) actions.push("Train staff in child-led life story techniques — the child's voice must be central (UNCRC Article 8)");
  if (identityCulture.culturalActivityRate < 50) actions.push("Integrate cultural activities into life story sessions — UNCRC Article 30 and Children Act 1989 s.22(5)(c)");
  if (identityCulture.familyExploredRate < 50) actions.push("Ensure family connections are explored in life story work — maintain links where safe to do so");
  if (identityCulture.photographRate < 50) actions.push("Establish regular photograph sessions — children need visual memories preserved");
  if (staffReadiness.therapeuticApproachRate < 50) actions.push("Provide therapeutic life story work training — some children need trauma-informed approaches");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 5 — Quality and purpose of care (identity and belonging)",
    "CHR 2015 Reg 7 — Children's wishes and feelings",
    "CHR 2015 Reg 14 — Care planning (life story work in care plan)",
    "SCCIF — Identity and belonging, life story work",
    "UNCRC Article 8 — Right to identity",
    "UNCRC Article 30 — Right to culture, language, religion",
    "Children Act 1989 s.22(5)(c) — Cultural background",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    sessionQuality,
    identityCulture,
    lifeStoryPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
