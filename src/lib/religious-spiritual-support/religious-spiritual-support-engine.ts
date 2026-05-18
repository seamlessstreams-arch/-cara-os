// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Religious & Spiritual Support Intelligence Engine
//
// Evaluates how well children's religious, spiritual, and faith-based needs
// are recognised, assessed, supported, and celebrated within the home.
//
// Regulatory basis:
//   - CHR 2015 Reg 10 (duty to promote contact and support religious/spiritual
//     needs)
//   - SCCIF (experiences and progress of children)
//   - NMS 4 (individual care including religious and spiritual needs)
//   - Equality Act 2010 (protection from discrimination on grounds of religion
//     or belief)
//   - UNCRC Article 14 (freedom of thought, conscience and religion)
//   - UNCRC Article 30 (right of minority children to practise their own
//     religion)
//   - Human Rights Act 1998 Article 9 (freedom of thought, conscience and
//     religion)
//
// Pure deterministic engine — no AI, no external calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Type Definitions ─────────────────────────────────────────────────────────

export type FaithBackground =
  | "christianity"
  | "islam"
  | "judaism"
  | "hinduism"
  | "sikhism"
  | "buddhism"
  | "no_religion"
  | "spiritual_not_religious"
  | "other"
  | "not_recorded";

export type SupportType =
  | "worship_access"
  | "dietary_observance"
  | "festival_celebration"
  | "prayer_space"
  | "religious_education"
  | "faith_leader_contact"
  | "cultural_observance"
  | "pastoral_support";

export type SupportQuality =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "not_provided";

export type ChildPreference =
  | "actively_practising"
  | "interested"
  | "indifferent"
  | "private"
  | "declined";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ─────────────────────────────────────────────────────────

export interface ChildFaithProfile {
  id: string;
  childId: string;
  childName: string;
  faithBackground: FaithBackground;
  childPreference: ChildPreference;
  needsAssessed: boolean;
  needsDocumented: boolean;
  supportPlanInPlace: boolean;
  lastReviewDate: string | null;
  reviewDue: boolean;
}

export interface ReligiousSupportActivity {
  id: string;
  childId: string;
  childName: string;
  date: string;
  supportType: SupportType;
  quality: SupportQuality;
  childInitiated: boolean;
  childFeedbackPositive: boolean | null;
  facilitatedBy: string;
}

export interface FestivalObservance {
  id: string;
  childId: string;
  childName: string;
  festivalName: string;
  date: string;
  observed: boolean;
  childInvolved: boolean;
  culturallyAppropriate: boolean;
}

export interface StaffDiversityTraining {
  id: string;
  staffId: string;
  staffName: string;
  faithAwareness: boolean;
  culturalCompetence: boolean;
  antiDiscrimination: boolean;
  childRightsTraining: boolean;
}

// ── Result Interfaces ────────────────────────────────────────────────────────

export interface NeedsAssessmentResult {
  overallScore: number; // 0-25
  totalProfiles: number;
  needsAssessedRate: number;
  needsDocumentedRate: number;
  supportPlanRate: number;
  reviewCurrentRate: number;
  preferenceRecordedRate: number;
}

export interface SupportProvisionResult {
  overallScore: number; // 0-25
  totalActivities: number;
  excellentGoodRate: number;
  childInitiatedRate: number;
  positiveFeedbackRate: number;
  supportTypeVariety: number;
  regularityScore: number;
}

export interface FestivalInclusionResult {
  overallScore: number; // 0-25
  totalFestivals: number;
  observedRate: number;
  childInvolvedRate: number;
  culturallyAppropriateRate: number;
  childrenCoveredRate: number;
}

export interface StaffCompetenceResult {
  overallScore: number; // 0-25
  totalStaff: number;
  faithAwarenessRate: number;
  culturalCompetenceRate: number;
  antiDiscriminationRate: number;
  childRightsRate: number;
  overallCompetenceRate: number;
}

export interface ChildFaithProfileResult {
  childId: string;
  childName: string;
  faithBackground: FaithBackground;
  childPreference: ChildPreference;
  needsAssessed: boolean;
  supportPlanInPlace: boolean;
  activitiesCount: number;
  festivalsCount: number;
  overallScore: number; // 0-10
}

export interface ReligiousSpiritualSupportIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  needsAssessment: NeedsAssessmentResult;
  supportProvision: SupportProvisionResult;
  festivalInclusion: FestivalInclusionResult;
  staffCompetence: StaffCompetenceResult;
  childProfiles: ChildFaithProfileResult[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Label Maps ──────────────────────────────────────────────────────────────

const FAITH_BACKGROUND_LABELS: Record<FaithBackground, string> = {
  christianity: "Christianity",
  islam: "Islam",
  judaism: "Judaism",
  hinduism: "Hinduism",
  sikhism: "Sikhism",
  buddhism: "Buddhism",
  no_religion: "No Religion",
  spiritual_not_religious: "Spiritual (Not Religious)",
  other: "Other",
  not_recorded: "Not Recorded",
};

const SUPPORT_TYPE_LABELS: Record<SupportType, string> = {
  worship_access: "Worship Access",
  dietary_observance: "Dietary Observance",
  festival_celebration: "Festival Celebration",
  prayer_space: "Prayer Space",
  religious_education: "Religious Education",
  faith_leader_contact: "Faith Leader Contact",
  cultural_observance: "Cultural Observance",
  pastoral_support: "Pastoral Support",
};

const SUPPORT_QUALITY_LABELS: Record<SupportQuality, string> = {
  excellent: "Excellent",
  good: "Good",
  adequate: "Adequate",
  poor: "Poor",
  not_provided: "Not Provided",
};

const CHILD_PREFERENCE_LABELS: Record<ChildPreference, string> = {
  actively_practising: "Actively Practising",
  interested: "Interested",
  indifferent: "Indifferent",
  private: "Private",
  declined: "Declined",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// ── Label Functions ──────────────────────────────────────────────────────────

export function getFaithBackgroundLabel(f: FaithBackground): string {
  return FAITH_BACKGROUND_LABELS[f] ?? f;
}

export function getSupportTypeLabel(s: SupportType): string {
  return SUPPORT_TYPE_LABELS[s] ?? s;
}

export function getSupportQualityLabel(q: SupportQuality): string {
  return SUPPORT_QUALITY_LABELS[q] ?? q;
}

export function getChildPreferenceLabel(p: ChildPreference): string {
  return CHILD_PREFERENCE_LABELS[p] ?? p;
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
 * Evaluates how well children's religious/spiritual needs are assessed.
 * Considers: needs assessed, needs documented, support plan, review current,
 *            child preference recorded.
 * Max score: 25
 *
 * Scoring breakdown:
 *   Needs assessed rate       → 0-7
 *   Needs documented rate     → 0-6
 *   Support plan in place     → 0-5
 *   Review current            → 0-4
 *   Child preference recorded → 0-3
 */
export function evaluateNeedsAssessment(
  profiles: ChildFaithProfile[],
): NeedsAssessmentResult {
  if (profiles.length === 0) {
    return {
      overallScore: 0,
      totalProfiles: 0,
      needsAssessedRate: 0,
      needsDocumentedRate: 0,
      supportPlanRate: 0,
      reviewCurrentRate: 0,
      preferenceRecordedRate: 0,
    };
  }

  let score = 0;

  // Needs assessed rate (0-7)
  const assessed = profiles.filter((p) => p.needsAssessed).length;
  const needsAssessedRate = pct(assessed, profiles.length);
  if (needsAssessedRate >= 90) score += 7;
  else if (needsAssessedRate >= 70) score += 5;
  else if (needsAssessedRate >= 50) score += 3;
  else if (needsAssessedRate > 0) score += 1;

  // Needs documented rate (0-6)
  const documented = profiles.filter((p) => p.needsDocumented).length;
  const needsDocumentedRate = pct(documented, profiles.length);
  if (needsDocumentedRate >= 90) score += 6;
  else if (needsDocumentedRate >= 70) score += 4;
  else if (needsDocumentedRate >= 50) score += 2;
  else if (needsDocumentedRate > 0) score += 1;

  // Support plan in place rate (0-5)
  const withPlan = profiles.filter((p) => p.supportPlanInPlace).length;
  const supportPlanRate = pct(withPlan, profiles.length);
  if (supportPlanRate >= 90) score += 5;
  else if (supportPlanRate >= 70) score += 4;
  else if (supportPlanRate >= 50) score += 2;
  else if (supportPlanRate > 0) score += 1;

  // Review current rate (0-4) — reviews not overdue
  const reviewCurrent = profiles.filter((p) => !p.reviewDue).length;
  const reviewCurrentRate = pct(reviewCurrent, profiles.length);
  if (reviewCurrentRate >= 90) score += 4;
  else if (reviewCurrentRate >= 70) score += 3;
  else if (reviewCurrentRate >= 50) score += 2;
  else if (reviewCurrentRate > 0) score += 1;

  // Child preference recorded rate (0-3) — faithBackground is not "not_recorded"
  const preferenceRecorded = profiles.filter(
    (p) => p.faithBackground !== "not_recorded",
  ).length;
  const preferenceRecordedRate = pct(preferenceRecorded, profiles.length);
  if (preferenceRecordedRate >= 90) score += 3;
  else if (preferenceRecordedRate >= 70) score += 2;
  else if (preferenceRecordedRate >= 50) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalProfiles: profiles.length,
    needsAssessedRate,
    needsDocumentedRate,
    supportPlanRate,
    reviewCurrentRate,
    preferenceRecordedRate,
  };
}

/**
 * Evaluates how well religious/spiritual support is being provided.
 * Returns 25 if no children need support (no profiles with active faith needs).
 * Returns 0 if profiles with needs exist but no activities recorded.
 * Max score: 25
 *
 * Scoring breakdown:
 *   Excellent/good rate      → 0-7
 *   Child-initiated supported → 0-6
 *   Positive feedback rate   → 0-5
 *   Variety of support types → 0-4
 *   Regularity               → 0-3
 */
export function evaluateSupportProvision(
  activities: ReligiousSupportActivity[],
  profiles: ChildFaithProfile[],
): SupportProvisionResult {
  // Check if any children have active faith needs
  const childrenWithNeeds = profiles.filter(
    (p) =>
      p.faithBackground !== "no_religion" &&
      p.faithBackground !== "not_recorded" &&
      p.childPreference !== "declined" &&
      p.childPreference !== "indifferent",
  );

  if (childrenWithNeeds.length === 0) {
    // No children need religious/spiritual support
    return {
      overallScore: 25,
      totalActivities: activities.length,
      excellentGoodRate: 0,
      childInitiatedRate: 0,
      positiveFeedbackRate: 0,
      supportTypeVariety: 0,
      regularityScore: 0,
    };
  }

  if (activities.length === 0) {
    return {
      overallScore: 0,
      totalActivities: 0,
      excellentGoodRate: 0,
      childInitiatedRate: 0,
      positiveFeedbackRate: 0,
      supportTypeVariety: 0,
      regularityScore: 0,
    };
  }

  let score = 0;

  // Excellent/good rate (0-7)
  const excellentGood = activities.filter(
    (a) => a.quality === "excellent" || a.quality === "good",
  ).length;
  const excellentGoodRate = pct(excellentGood, activities.length);
  if (excellentGoodRate >= 80) score += 7;
  else if (excellentGoodRate >= 60) score += 5;
  else if (excellentGoodRate >= 40) score += 3;
  else if (excellentGoodRate > 0) score += 1;

  // Child-initiated rate (0-6)
  const childInitiated = activities.filter((a) => a.childInitiated).length;
  const childInitiatedRate = pct(childInitiated, activities.length);
  if (childInitiatedRate >= 70) score += 6;
  else if (childInitiatedRate >= 50) score += 4;
  else if (childInitiatedRate >= 30) score += 2;
  else if (childInitiatedRate > 0) score += 1;

  // Positive feedback rate (0-5) — among those with feedback
  const withFeedback = activities.filter(
    (a) => a.childFeedbackPositive !== null,
  );
  const positiveFeedback = withFeedback.filter(
    (a) => a.childFeedbackPositive === true,
  ).length;
  const positiveFeedbackRate =
    withFeedback.length > 0 ? pct(positiveFeedback, withFeedback.length) : 0;
  if (withFeedback.length > 0) {
    if (positiveFeedbackRate >= 80) score += 5;
    else if (positiveFeedbackRate >= 60) score += 3;
    else if (positiveFeedbackRate >= 40) score += 2;
    else if (positiveFeedbackRate > 0) score += 1;
  }

  // Support type variety (0-4)
  const uniqueTypes = new Set(activities.map((a) => a.supportType));
  const supportTypeVariety = uniqueTypes.size;
  if (supportTypeVariety >= 5) score += 4;
  else if (supportTypeVariety >= 3) score += 3;
  else if (supportTypeVariety >= 2) score += 2;
  else if (supportTypeVariety >= 1) score += 1;

  // Regularity (0-3) — average activities per child with needs
  const childrenWithActivities = new Set(activities.map((a) => a.childId));
  const coverageRate = pct(childrenWithActivities.size, childrenWithNeeds.length);
  const avgPerChild = activities.length / childrenWithNeeds.length;
  let regularityScore = 0;
  if (coverageRate >= 80 && avgPerChild >= 2) regularityScore = 3;
  else if (coverageRate >= 60 && avgPerChild >= 1) regularityScore = 2;
  else if (coverageRate > 0) regularityScore = 1;
  score += regularityScore;

  return {
    overallScore: Math.min(score, 25),
    totalActivities: activities.length,
    excellentGoodRate,
    childInitiatedRate,
    positiveFeedbackRate,
    supportTypeVariety,
    regularityScore,
  };
}

/**
 * Evaluates inclusion of religious/cultural festivals.
 * Returns 25 if no festivals are due (empty festivals array and no profiles).
 * Returns 0 if profiles exist but no festivals recorded.
 * Max score: 25
 *
 * Scoring breakdown:
 *   Observed rate                → 0-8
 *   Child involved rate          → 0-6
 *   Culturally appropriate rate  → 0-6
 *   Coverage across children     → 0-5
 */
export function evaluateFestivalInclusion(
  festivals: FestivalObservance[],
  profiles: ChildFaithProfile[],
): FestivalInclusionResult {
  if (festivals.length === 0 && profiles.length === 0) {
    return {
      overallScore: 25,
      totalFestivals: 0,
      observedRate: 0,
      childInvolvedRate: 0,
      culturallyAppropriateRate: 0,
      childrenCoveredRate: 0,
    };
  }

  if (festivals.length === 0 && profiles.length > 0) {
    return {
      overallScore: 0,
      totalFestivals: 0,
      observedRate: 0,
      childInvolvedRate: 0,
      culturallyAppropriateRate: 0,
      childrenCoveredRate: 0,
    };
  }

  let score = 0;

  // Observed rate (0-8)
  const observed = festivals.filter((f) => f.observed).length;
  const observedRate = pct(observed, festivals.length);
  if (observedRate >= 90) score += 8;
  else if (observedRate >= 70) score += 6;
  else if (observedRate >= 50) score += 4;
  else if (observedRate > 0) score += 2;

  // Child involved rate (0-6)
  const childInvolved = festivals.filter((f) => f.childInvolved).length;
  const childInvolvedRate = pct(childInvolved, festivals.length);
  if (childInvolvedRate >= 90) score += 6;
  else if (childInvolvedRate >= 70) score += 4;
  else if (childInvolvedRate >= 50) score += 3;
  else if (childInvolvedRate > 0) score += 1;

  // Culturally appropriate rate (0-6)
  const culturallyAppropriate = festivals.filter(
    (f) => f.culturallyAppropriate,
  ).length;
  const culturallyAppropriateRate = pct(
    culturallyAppropriate,
    festivals.length,
  );
  if (culturallyAppropriateRate >= 90) score += 6;
  else if (culturallyAppropriateRate >= 70) score += 4;
  else if (culturallyAppropriateRate >= 50) score += 3;
  else if (culturallyAppropriateRate > 0) score += 1;

  // Coverage across children (0-5)
  const uniqueChildren = new Set(festivals.map((f) => f.childId));
  const childrenCoveredRate =
    profiles.length > 0 ? pct(uniqueChildren.size, profiles.length) : 0;
  if (childrenCoveredRate >= 80) score += 5;
  else if (childrenCoveredRate >= 60) score += 3;
  else if (childrenCoveredRate >= 40) score += 2;
  else if (childrenCoveredRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalFestivals: festivals.length,
    observedRate,
    childInvolvedRate,
    culturallyAppropriateRate,
    childrenCoveredRate,
  };
}

/**
 * Evaluates staff diversity and faith training competence.
 * Max score: 25
 *
 * Scoring breakdown:
 *   Faith awareness rate        → 0-7
 *   Cultural competence rate    → 0-6
 *   Anti-discrimination rate    → 0-5
 *   Child rights training rate  → 0-4
 *   Overall competence          → 0-3
 */
export function evaluateStaffCompetence(
  staff: StaffDiversityTraining[],
): StaffCompetenceResult {
  if (staff.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      faithAwarenessRate: 0,
      culturalCompetenceRate: 0,
      antiDiscriminationRate: 0,
      childRightsRate: 0,
      overallCompetenceRate: 0,
    };
  }

  let score = 0;
  const total = staff.length;

  // Faith awareness rate (0-7)
  const faithAware = staff.filter((s) => s.faithAwareness).length;
  const faithAwarenessRate = pct(faithAware, total);
  if (faithAwarenessRate >= 90) score += 7;
  else if (faithAwarenessRate >= 70) score += 5;
  else if (faithAwarenessRate >= 50) score += 3;
  else if (faithAwarenessRate > 0) score += 1;

  // Cultural competence rate (0-6)
  const culturalComp = staff.filter((s) => s.culturalCompetence).length;
  const culturalCompetenceRate = pct(culturalComp, total);
  if (culturalCompetenceRate >= 90) score += 6;
  else if (culturalCompetenceRate >= 70) score += 4;
  else if (culturalCompetenceRate >= 50) score += 3;
  else if (culturalCompetenceRate > 0) score += 1;

  // Anti-discrimination rate (0-5)
  const antiDisc = staff.filter((s) => s.antiDiscrimination).length;
  const antiDiscriminationRate = pct(antiDisc, total);
  if (antiDiscriminationRate >= 90) score += 5;
  else if (antiDiscriminationRate >= 70) score += 4;
  else if (antiDiscriminationRate >= 50) score += 2;
  else if (antiDiscriminationRate > 0) score += 1;

  // Child rights training rate (0-4)
  const childRights = staff.filter((s) => s.childRightsTraining).length;
  const childRightsRate = pct(childRights, total);
  if (childRightsRate >= 90) score += 4;
  else if (childRightsRate >= 70) score += 3;
  else if (childRightsRate >= 50) score += 2;
  else if (childRightsRate > 0) score += 1;

  // Overall competence rate (0-3) — staff with ALL four trainings
  const fullyTrained = staff.filter(
    (s) =>
      s.faithAwareness &&
      s.culturalCompetence &&
      s.antiDiscrimination &&
      s.childRightsTraining,
  ).length;
  const overallCompetenceRate = pct(fullyTrained, total);
  if (overallCompetenceRate >= 80) score += 3;
  else if (overallCompetenceRate >= 50) score += 2;
  else if (overallCompetenceRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: total,
    faithAwarenessRate,
    culturalCompetenceRate,
    antiDiscriminationRate,
    childRightsRate,
    overallCompetenceRate,
  };
}

// ── Child Profiles ───────────────────────────────────────────────────────────

export function buildChildFaithProfiles(
  profiles: ChildFaithProfile[],
  activities: ReligiousSupportActivity[],
  festivals: FestivalObservance[],
): ChildFaithProfileResult[] {
  return profiles.map((profile) => {
    const childActivities = activities.filter(
      (a) => a.childId === profile.childId,
    );
    const childFestivals = festivals.filter(
      (f) => f.childId === profile.childId,
    );

    // Profile score 0-10
    let profileScore = 0;

    // Needs assessed (0-2)
    if (profile.needsAssessed) profileScore += 1;
    if (profile.needsDocumented) profileScore += 1;

    // Support plan (0-2)
    if (profile.supportPlanInPlace) profileScore += 2;

    // Review current (0-1)
    if (!profile.reviewDue) profileScore += 1;

    // Activities (0-2)
    if (childActivities.length >= 3) profileScore += 2;
    else if (childActivities.length >= 1) profileScore += 1;

    // Activity quality (0-1)
    const goodActivities = childActivities.filter(
      (a) => a.quality === "excellent" || a.quality === "good",
    );
    if (childActivities.length > 0 && pct(goodActivities.length, childActivities.length) >= 70) {
      profileScore += 1;
    }

    // Festival participation (0-1)
    if (childFestivals.length > 0) profileScore += 1;

    return {
      childId: profile.childId,
      childName: profile.childName,
      faithBackground: profile.faithBackground,
      childPreference: profile.childPreference,
      needsAssessed: profile.needsAssessed,
      supportPlanInPlace: profile.supportPlanInPlace,
      activitiesCount: childActivities.length,
      festivalsCount: childFestivals.length,
      overallScore: Math.max(0, Math.min(profileScore, 10)),
    };
  });
}

// ── Strengths / Areas / Actions ──────────────────────────────────────────────

function generateStrengths(
  needs: NeedsAssessmentResult,
  provision: SupportProvisionResult,
  festivals: FestivalInclusionResult,
  staff: StaffCompetenceResult,
): string[] {
  const strengths: string[] = [];

  if (needs.needsAssessedRate >= 90 && needs.totalProfiles > 0) {
    strengths.push(
      "Excellent needs assessment coverage — the religious and spiritual needs of all children are assessed",
    );
  }

  if (needs.supportPlanRate >= 90 && needs.totalProfiles > 0) {
    strengths.push(
      "Support plans are in place for all children — demonstrating proactive care planning for spiritual needs",
    );
  }

  if (needs.preferenceRecordedRate >= 90 && needs.totalProfiles > 0) {
    strengths.push(
      "Children's faith backgrounds and preferences are consistently recorded — respecting their right to freedom of belief",
    );
  }

  if (needs.reviewCurrentRate >= 90 && needs.totalProfiles > 0) {
    strengths.push(
      "Reviews are up to date — ensuring support remains relevant and responsive to changing needs",
    );
  }

  if (provision.excellentGoodRate >= 80 && provision.totalActivities > 0) {
    strengths.push(
      "High quality religious and spiritual support — the majority of activities are rated excellent or good",
    );
  }

  if (provision.childInitiatedRate >= 70 && provision.totalActivities > 0) {
    strengths.push(
      "Children are actively initiating their own religious and spiritual activities — promoting agency and ownership",
    );
  }

  if (provision.positiveFeedbackRate >= 80 && provision.totalActivities > 0) {
    strengths.push(
      "Positive child feedback on religious and spiritual support — activities are meaningful and valued",
    );
  }

  if (provision.supportTypeVariety >= 5) {
    strengths.push(
      "Excellent variety of religious and spiritual support — children access diverse forms of engagement",
    );
  }

  if (festivals.observedRate >= 90 && festivals.totalFestivals > 0) {
    strengths.push(
      "Religious festivals are consistently observed — children's faith traditions are celebrated and respected",
    );
  }

  if (festivals.childInvolvedRate >= 90 && festivals.totalFestivals > 0) {
    strengths.push(
      "Children are actively involved in festival celebrations — participation is genuine and child-centred",
    );
  }

  if (festivals.culturallyAppropriateRate >= 90 && festivals.totalFestivals > 0) {
    strengths.push(
      "Festival celebrations are culturally appropriate — demonstrating respect for authentic religious practices",
    );
  }

  if (staff.faithAwarenessRate >= 90 && staff.totalStaff > 0) {
    strengths.push(
      "Strong faith awareness across the staff team — all staff understand and respect children's religious needs",
    );
  }

  if (staff.overallCompetenceRate >= 80 && staff.totalStaff > 0) {
    strengths.push(
      "Excellent overall staff competence — the majority of staff are fully trained in faith, culture, anti-discrimination, and child rights",
    );
  }

  if (staff.antiDiscriminationRate >= 90 && staff.totalStaff > 0) {
    strengths.push(
      "Anti-discrimination training completed across the team — protecting children from religious discrimination",
    );
  }

  return strengths;
}

function generateAreasForImprovement(
  needs: NeedsAssessmentResult,
  provision: SupportProvisionResult,
  festivals: FestivalInclusionResult,
  staff: StaffCompetenceResult,
): string[] {
  const areas: string[] = [];

  if (needs.totalProfiles === 0) {
    areas.push(
      "No faith profiles recorded — children's religious and spiritual backgrounds must be assessed and documented",
    );
  }

  if (needs.needsAssessedRate < 70 && needs.totalProfiles > 0) {
    areas.push(
      `Only ${needs.needsAssessedRate}% of children have had their religious/spiritual needs assessed — all children should have a faith needs assessment`,
    );
  }

  if (needs.needsDocumentedRate < 70 && needs.totalProfiles > 0) {
    areas.push(
      `Documentation rate at ${needs.needsDocumentedRate}% — all assessed needs should be formally documented`,
    );
  }

  if (needs.supportPlanRate < 70 && needs.totalProfiles > 0) {
    areas.push(
      `Support plans in place for only ${needs.supportPlanRate}% of children — all children with faith needs should have a support plan`,
    );
  }

  if (needs.reviewCurrentRate < 70 && needs.totalProfiles > 0) {
    areas.push(
      `Only ${needs.reviewCurrentRate}% of reviews are current — regular review of religious/spiritual support is needed`,
    );
  }

  if (provision.totalActivities === 0 && needs.totalProfiles > 0) {
    areas.push(
      "No religious or spiritual support activities recorded — children with faith needs must have access to appropriate support",
    );
  }

  if (provision.excellentGoodRate < 60 && provision.totalActivities > 0) {
    areas.push(
      `Quality of support at ${provision.excellentGoodRate}% excellent/good — the quality of religious/spiritual activities should be improved`,
    );
  }

  if (provision.childInitiatedRate < 50 && provision.totalActivities > 0) {
    areas.push(
      `Child-initiated rate at ${provision.childInitiatedRate}% — more support activities should be led by children's own wishes`,
    );
  }

  if (festivals.totalFestivals === 0 && needs.totalProfiles > 0) {
    areas.push(
      "No festival observances recorded — children's religious festivals should be recognised and celebrated",
    );
  }

  if (festivals.observedRate < 70 && festivals.totalFestivals > 0) {
    areas.push(
      `Festival observance rate at ${festivals.observedRate}% — all relevant festivals should be properly observed`,
    );
  }

  if (festivals.childrenCoveredRate < 60 && festivals.totalFestivals > 0) {
    areas.push(
      `Festival coverage across children at ${festivals.childrenCoveredRate}% — ensure all children with faith backgrounds have their festivals recognised`,
    );
  }

  if (staff.totalStaff === 0) {
    areas.push(
      "No staff diversity training records — all staff should have faith awareness and cultural competence training",
    );
  }

  if (staff.faithAwarenessRate < 70 && staff.totalStaff > 0) {
    areas.push(
      `Faith awareness at ${staff.faithAwarenessRate}% — more staff need training on religious and spiritual needs`,
    );
  }

  if (staff.culturalCompetenceRate < 70 && staff.totalStaff > 0) {
    areas.push(
      `Cultural competence at ${staff.culturalCompetenceRate}% — staff require further cultural competence training`,
    );
  }

  if (staff.antiDiscriminationRate < 70 && staff.totalStaff > 0) {
    areas.push(
      `Anti-discrimination training at ${staff.antiDiscriminationRate}% — all staff must complete anti-discrimination training`,
    );
  }

  return areas;
}

function generateActions(
  needs: NeedsAssessmentResult,
  provision: SupportProvisionResult,
  festivals: FestivalInclusionResult,
  staff: StaffCompetenceResult,
): string[] {
  const actions: string[] = [];

  if (needs.totalProfiles === 0) {
    actions.push(
      "URGENT: Complete religious and spiritual needs assessments for all children — CHR 2015 Reg 10 and UNCRC Article 14 require this",
    );
  }

  if (needs.needsAssessedRate < 70 && needs.totalProfiles > 0) {
    actions.push(
      "Complete outstanding faith needs assessments — ensure every child's religious and spiritual background is assessed",
    );
  }

  if (needs.supportPlanRate < 70 && needs.totalProfiles > 0) {
    actions.push(
      "Develop support plans for all children with religious/spiritual needs — plans should be specific and regularly reviewed",
    );
  }

  if (needs.reviewCurrentRate < 70 && needs.totalProfiles > 0) {
    actions.push(
      "Schedule reviews for overdue religious/spiritual support plans — ensure support remains relevant",
    );
  }

  if (provision.totalActivities === 0 && needs.totalProfiles > 0) {
    actions.push(
      "URGENT: Implement religious and spiritual support activities — children must have access to worship, prayer, and faith-based activities (NMS 4)",
    );
  }

  if (provision.excellentGoodRate < 60 && provision.totalActivities > 0) {
    actions.push(
      "Improve the quality of religious/spiritual support — seek child feedback and engage with faith communities for authentic provision",
    );
  }

  if (provision.childInitiatedRate < 50 && provision.totalActivities > 0) {
    actions.push(
      "Encourage child-initiated religious and spiritual activities — ask children about their wishes and enable them to lead",
    );
  }

  if (festivals.totalFestivals === 0 && needs.totalProfiles > 0) {
    actions.push(
      "URGENT: Create a religious festival calendar — ensure all children's significant dates are recognised and celebrated",
    );
  }

  if (festivals.observedRate < 70 && festivals.totalFestivals > 0) {
    actions.push(
      "Improve festival observance — ensure all recorded festivals are properly observed with child involvement",
    );
  }

  if (staff.totalStaff === 0) {
    actions.push(
      "URGENT: Implement staff diversity training programme — all staff must have faith awareness and anti-discrimination training",
    );
  }

  if (staff.faithAwarenessRate < 70 && staff.totalStaff > 0) {
    actions.push(
      "Deliver faith awareness training for all staff — Equality Act 2010 requires understanding of religion and belief",
    );
  }

  if (staff.culturalCompetenceRate < 70 && staff.totalStaff > 0) {
    actions.push(
      "Provide cultural competence training — staff must be equipped to support children from diverse faith backgrounds",
    );
  }

  if (staff.antiDiscriminationRate < 70 && staff.totalStaff > 0) {
    actions.push(
      "Complete anti-discrimination training for all staff — this is a legal requirement under the Equality Act 2010",
    );
  }

  if (staff.childRightsRate < 70 && staff.totalStaff > 0) {
    actions.push(
      "Deliver child rights training — staff must understand UNCRC Article 14 (freedom of religion) and Article 30 (minority rights)",
    );
  }

  return actions;
}

// ── Main Intelligence Function ───────────────────────────────────────────────

export function generateReligiousSpiritualSupportIntelligence(
  profiles: ChildFaithProfile[],
  activities: ReligiousSupportActivity[],
  festivals: FestivalObservance[],
  staff: StaffDiversityTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ReligiousSpiritualSupportIntelligence {
  const needsResult = evaluateNeedsAssessment(profiles);
  const provisionResult = evaluateSupportProvision(activities, profiles);
  const festivalResult = evaluateFestivalInclusion(festivals, profiles);
  const staffResult = evaluateStaffCompetence(staff);

  const overallScore =
    needsResult.overallScore +
    provisionResult.overallScore +
    festivalResult.overallScore +
    staffResult.overallScore;

  const childProfiles = buildChildFaithProfiles(profiles, activities, festivals);

  const strengths = generateStrengths(
    needsResult,
    provisionResult,
    festivalResult,
    staffResult,
  );
  const areasForImprovement = generateAreasForImprovement(
    needsResult,
    provisionResult,
    festivalResult,
    staffResult,
  );
  const actions = generateActions(
    needsResult,
    provisionResult,
    festivalResult,
    staffResult,
  );

  const regulatoryLinks = [
    "CHR 2015 Reg 10 — duty to promote contact and support children's religious and spiritual needs",
    "SCCIF — experiences and progress of children including spiritual development",
    "NMS 4 — individual care in children's homes including religious and spiritual needs",
    "Equality Act 2010 — protection from discrimination on grounds of religion or belief",
    "UNCRC Article 14 — freedom of thought, conscience and religion",
    "UNCRC Article 30 — right of minority children to practise their own religion",
    "Human Rights Act 1998 Article 9 — freedom of thought, conscience and religion",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore: Math.min(overallScore, 100),
    rating: getRating(overallScore),
    needsAssessment: needsResult,
    supportProvision: provisionResult,
    festivalInclusion: festivalResult,
    staffCompetence: staffResult,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
