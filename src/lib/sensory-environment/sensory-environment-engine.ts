// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Sensory & Therapeutic Environment Intelligence Engine
//
// Deterministic engine for evaluating sensory profiles, environmental
// adaptations, therapeutic space usage, and space quality across the home.
//
// Aligned to:
//   - CHR 2015 Reg 6  — Quality of care (tailored to individual needs)
//   - CHR 2015 Reg 25 — Premises (suitable, maintained, homely)
//   - SCCIF           — Quality of care standard (sensory/therapeutic)
//   - NICE CG128      — Autism: recognition, referral, diagnosis and management
//                        of adults on the autism spectrum (sensory guidance)
//   - UNCRC Article 31 — Right to leisure, play and recreational activities
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type SensoryNeed =
  | "noise_sensitivity"
  | "light_sensitivity"
  | "tactile_sensitivity"
  | "proprioceptive"
  | "vestibular"
  | "olfactory"
  | "gustatory"
  | "visual_stimulation"
  | "calming_input"
  | "movement_need";

export type SpaceType =
  | "bedroom"
  | "living_room"
  | "kitchen"
  | "bathroom"
  | "garden"
  | "quiet_room"
  | "sensory_room"
  | "activity_room"
  | "study_space"
  | "entrance";

export type AdaptationType =
  | "lighting_adjustment"
  | "noise_reduction"
  | "colour_scheme"
  | "texture_choice"
  | "equipment_provision"
  | "layout_change"
  | "temperature_control"
  | "scent_management"
  | "visual_timetable"
  | "safe_space_creation";

export type PersonalisationLevel =
  | "not_personalised"
  | "basic"
  | "moderate"
  | "highly_personalised";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ChildSensoryProfile {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  assessedBy: string;
  sensoryNeeds: SensoryNeed[];
  preferences: string[];
  triggers: string[];
  calmingStrategies: string[];
  sensoryDiet?: string[];
  reviewDate: string;
}

export interface SpaceAssessment {
  id: string;
  spaceType: SpaceType;
  assessmentDate: string;
  assessedBy: string;
  noiseLevel: "low" | "moderate" | "high";
  lightingQuality: "natural" | "adjustable" | "fixed" | "harsh";
  temperature: "comfortable" | "variable" | "uncomfortable";
  personalisationLevel: PersonalisationLevel;
  childFriendly: boolean;
  sensoryConsiderations: string[];
  improvementsNeeded: string[];
}

export interface EnvironmentalAdaptation {
  id: string;
  childId?: string;
  childName?: string;
  spaceType: SpaceType;
  adaptationType: AdaptationType;
  description: string;
  implementedDate: string;
  reviewDate: string;
  status: "active" | "planned" | "needs_review" | "removed";
  effectiveness: "effective" | "partially_effective" | "ineffective" | "not_yet_assessed";
  childFeedback?: string;
}

export interface TherapeuticSpaceUsage {
  id: string;
  spaceType: SpaceType;
  date: string;
  childId: string;
  childName: string;
  durationMinutes: number;
  purpose: string;
  staffSupported: boolean;
  childResponse: "positive" | "neutral" | "distressed";
  notes?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface SensoryProfilingResult {
  coverageRate: number;
  averageNeedsPerChild: number;
  triggerDocumentationRate: number;
  calmingStrategyDocumentationRate: number;
  sensoryDietRate: number;
  profiledChildIds: string[];
  unprofiledChildIds: string[];
}

export interface SpaceQualityResult {
  personalisationRate: number;
  childFriendlyRate: number;
  noiseQuality: number;
  lightingQuality: number;
  temperatureQuality: number;
  improvementBacklog: number;
  spacesAssessed: number;
}

export interface AdaptationsResult {
  adaptationCount: number;
  effectivenessRate: number;
  childSpecificRate: number;
  reviewCurrency: number;
  childFeedbackCaptureRate: number;
  activeAdaptations: number;
  plannedAdaptations: number;
  needsReviewCount: number;
}

export interface TherapeuticUsageResult {
  usageFrequency: number;
  spaceVariety: number;
  positiveResponseRate: number;
  staffSupportRate: number;
  perChildEngagement: {
    childId: string;
    childName: string;
    usageCount: number;
    totalMinutes: number;
    positiveRate: number;
  }[];
}

export interface ChildEnvironmentProfile {
  childId: string;
  childName: string;
  sensoryNeeds: SensoryNeed[];
  preferences: string[];
  triggers: string[];
  calmingStrategies: string[];
  hasSensoryDiet: boolean;
  adaptationsInPlace: number;
  effectiveAdaptations: number;
  spaceUsageCount: number;
  totalSpaceMinutes: number;
  positiveResponseRate: number;
  environmentalComfortScore: number;
}

export interface SensoryEnvironmentIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  sensoryProfiling: SensoryProfilingResult;
  spaceQuality: SpaceQualityResult;
  adaptations: AdaptationsResult;
  therapeuticUsage: TherapeuticUsageResult;
  childProfiles: ChildEnvironmentProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date.slice(0, 10) >= start.slice(0, 10) && date.slice(0, 10) <= end.slice(0, 10);
}

function daysBetween(earlier: string, later: string): number {
  const diff = new Date(later).getTime() - new Date(earlier).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

// ── Label Functions ────────────────────────────────────────────────────────

const SENSORY_NEED_LABELS: Record<SensoryNeed, string> = {
  noise_sensitivity: "Noise Sensitivity",
  light_sensitivity: "Light Sensitivity",
  tactile_sensitivity: "Tactile Sensitivity",
  proprioceptive: "Proprioceptive",
  vestibular: "Vestibular",
  olfactory: "Olfactory",
  gustatory: "Gustatory",
  visual_stimulation: "Visual Stimulation",
  calming_input: "Calming Input",
  movement_need: "Movement Need",
};

const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  bedroom: "Bedroom",
  living_room: "Living Room",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  garden: "Garden",
  quiet_room: "Quiet Room",
  sensory_room: "Sensory Room",
  activity_room: "Activity Room",
  study_space: "Study Space",
  entrance: "Entrance",
};

const ADAPTATION_TYPE_LABELS: Record<AdaptationType, string> = {
  lighting_adjustment: "Lighting Adjustment",
  noise_reduction: "Noise Reduction",
  colour_scheme: "Colour Scheme",
  texture_choice: "Texture Choice",
  equipment_provision: "Equipment Provision",
  layout_change: "Layout Change",
  temperature_control: "Temperature Control",
  scent_management: "Scent Management",
  visual_timetable: "Visual Timetable",
  safe_space_creation: "Safe Space Creation",
};

const PERSONALISATION_LEVEL_LABELS: Record<PersonalisationLevel, string> = {
  not_personalised: "Not Personalised",
  basic: "Basic",
  moderate: "Moderate",
  highly_personalised: "Highly Personalised",
};

export function getSensoryNeedLabel(need: SensoryNeed): string {
  return SENSORY_NEED_LABELS[need] ?? need.replace(/_/g, " ");
}

export function getSpaceTypeLabel(space: SpaceType): string {
  return SPACE_TYPE_LABELS[space] ?? space.replace(/_/g, " ");
}

export function getAdaptationTypeLabel(a: AdaptationType): string {
  return ADAPTATION_TYPE_LABELS[a] ?? a.replace(/_/g, " ");
}

export function getPersonalisationLevelLabel(level: PersonalisationLevel): string {
  return PERSONALISATION_LEVEL_LABELS[level] ?? level.replace(/_/g, " ");
}

// ── Function 1: Evaluate Child Sensory Profiles ────────────────────────────

export function evaluateChildSensoryProfiles(
  profiles: ChildSensoryProfile[],
  childIds: string[],
): SensoryProfilingResult {
  const profiledChildIds = [...new Set(profiles.map((p) => p.childId))];
  const unprofiledChildIds = childIds.filter(
    (id) => !profiledChildIds.includes(id),
  );
  const totalChildren = childIds.length;
  const coverageRate = pct(profiledChildIds.length, totalChildren);

  // Average sensory needs per profiled child
  const averageNeedsPerChild =
    profiles.length > 0
      ? Math.round(
          (profiles.reduce((sum, p) => sum + p.sensoryNeeds.length, 0) /
            profiles.length) *
            10,
        ) / 10
      : 0;

  // Trigger documentation: children with at least 1 trigger documented
  const childrenWithTriggers = profiles.filter(
    (p) => p.triggers.length > 0,
  ).length;
  const triggerDocumentationRate = pct(childrenWithTriggers, profiles.length);

  // Calming strategy documentation
  const childrenWithCalming = profiles.filter(
    (p) => p.calmingStrategies.length > 0,
  ).length;
  const calmingStrategyDocumentationRate = pct(
    childrenWithCalming,
    profiles.length,
  );

  // Sensory diet rate
  const childrenWithDiet = profiles.filter(
    (p) => p.sensoryDiet && p.sensoryDiet.length > 0,
  ).length;
  const sensoryDietRate = pct(childrenWithDiet, profiles.length);

  return {
    coverageRate,
    averageNeedsPerChild,
    triggerDocumentationRate,
    calmingStrategyDocumentationRate,
    sensoryDietRate,
    profiledChildIds,
    unprofiledChildIds,
  };
}

// ── Function 2: Evaluate Space Quality ─────────────────────────────────────

export function evaluateSpaceQuality(
  assessments: SpaceAssessment[],
): SpaceQualityResult {
  const total = assessments.length;
  if (total === 0) {
    return {
      personalisationRate: 0,
      childFriendlyRate: 0,
      noiseQuality: 0,
      lightingQuality: 0,
      temperatureQuality: 0,
      improvementBacklog: 0,
      spacesAssessed: 0,
    };
  }

  // Personalisation: moderate or highly_personalised
  const personalised = assessments.filter(
    (a) =>
      a.personalisationLevel === "moderate" ||
      a.personalisationLevel === "highly_personalised",
  ).length;
  const personalisationRate = pct(personalised, total);

  // Child-friendly
  const childFriendly = assessments.filter((a) => a.childFriendly).length;
  const childFriendlyRate = pct(childFriendly, total);

  // Noise quality: low = good, moderate = partial, high = bad
  const goodNoise = assessments.filter((a) => a.noiseLevel === "low").length;
  const noiseQuality = pct(goodNoise, total);

  // Lighting quality: natural or adjustable = good
  const goodLighting = assessments.filter(
    (a) => a.lightingQuality === "natural" || a.lightingQuality === "adjustable",
  ).length;
  const lightingQuality = pct(goodLighting, total);

  // Temperature quality: comfortable = good
  const goodTemp = assessments.filter(
    (a) => a.temperature === "comfortable",
  ).length;
  const temperatureQuality = pct(goodTemp, total);

  // Improvement backlog: total improvements needed
  const improvementBacklog = assessments.reduce(
    (sum, a) => sum + a.improvementsNeeded.length,
    0,
  );

  return {
    personalisationRate,
    childFriendlyRate,
    noiseQuality,
    lightingQuality,
    temperatureQuality,
    improvementBacklog,
    spacesAssessed: total,
  };
}

// ── Function 3: Evaluate Adaptations ───────────────────────────────────────

export function evaluateAdaptations(
  adaptations: EnvironmentalAdaptation[],
): AdaptationsResult {
  const total = adaptations.length;
  if (total === 0) {
    return {
      adaptationCount: 0,
      effectivenessRate: 0,
      childSpecificRate: 0,
      reviewCurrency: 0,
      childFeedbackCaptureRate: 0,
      activeAdaptations: 0,
      plannedAdaptations: 0,
      needsReviewCount: 0,
    };
  }

  const active = adaptations.filter((a) => a.status === "active");
  const planned = adaptations.filter((a) => a.status === "planned");
  const needsReview = adaptations.filter((a) => a.status === "needs_review");

  // Effectiveness: among assessed adaptations, those that are effective or partially effective
  const assessed = adaptations.filter(
    (a) => a.effectiveness !== "not_yet_assessed",
  );
  const effective = assessed.filter(
    (a) =>
      a.effectiveness === "effective" ||
      a.effectiveness === "partially_effective",
  );
  const effectivenessRate = pct(effective.length, assessed.length);

  // Child-specific: adaptations linked to a specific child
  const childSpecific = adaptations.filter(
    (a) => a.childId !== undefined && a.childId !== null && a.childId !== "",
  );
  const childSpecificRate = pct(childSpecific.length, total);

  // Review currency: adaptations with review date not past (relative to most recent implementation date)
  // Use a simpler approach: adaptations that are NOT in needs_review status
  const current = adaptations.filter((a) => a.status !== "needs_review");
  const reviewCurrency = pct(current.length, total);

  // Child feedback capture
  const withFeedback = adaptations.filter(
    (a) =>
      a.childFeedback !== undefined &&
      a.childFeedback !== null &&
      a.childFeedback !== "",
  );
  const childFeedbackCaptureRate = pct(withFeedback.length, total);

  return {
    adaptationCount: total,
    effectivenessRate,
    childSpecificRate,
    reviewCurrency,
    childFeedbackCaptureRate,
    activeAdaptations: active.length,
    plannedAdaptations: planned.length,
    needsReviewCount: needsReview.length,
  };
}

// ── Function 4: Evaluate Therapeutic Space Usage ───────────────────────────

export function evaluateTherapeuticSpaceUsage(
  usage: TherapeuticSpaceUsage[],
): TherapeuticUsageResult {
  const total = usage.length;
  if (total === 0) {
    return {
      usageFrequency: 0,
      spaceVariety: 0,
      positiveResponseRate: 0,
      staffSupportRate: 0,
      perChildEngagement: [],
    };
  }

  // Unique space types used
  const uniqueSpaces = new Set(usage.map((u) => u.spaceType));
  const spaceVariety = uniqueSpaces.size;

  // Positive response rate
  const positive = usage.filter((u) => u.childResponse === "positive").length;
  const positiveResponseRate = pct(positive, total);

  // Staff support rate
  const staffSupported = usage.filter((u) => u.staffSupported).length;
  const staffSupportRate = pct(staffSupported, total);

  // Per-child engagement
  const childMap = new Map<
    string,
    { childName: string; records: TherapeuticSpaceUsage[] }
  >();
  for (const u of usage) {
    const existing = childMap.get(u.childId);
    if (existing) {
      existing.records.push(u);
    } else {
      childMap.set(u.childId, { childName: u.childName, records: [u] });
    }
  }

  const perChildEngagement = Array.from(childMap.entries()).map(
    ([childId, data]) => {
      const positiveCount = data.records.filter(
        (r) => r.childResponse === "positive",
      ).length;
      return {
        childId,
        childName: data.childName,
        usageCount: data.records.length,
        totalMinutes: data.records.reduce(
          (sum, r) => sum + r.durationMinutes,
          0,
        ),
        positiveRate: pct(positiveCount, data.records.length),
      };
    },
  );

  return {
    usageFrequency: total,
    spaceVariety,
    positiveResponseRate,
    staffSupportRate,
    perChildEngagement,
  };
}

// ── Function 5: Build Child Environment Profiles ───────────────────────────

export function buildChildEnvironmentProfiles(
  profiles: ChildSensoryProfile[],
  adaptations: EnvironmentalAdaptation[],
  usage: TherapeuticSpaceUsage[],
  childIds: string[],
  childNames: string[],
): ChildEnvironmentProfile[] {
  return childIds.map((childId, index) => {
    const childName = childNames[index] ?? childId;
    const profile = profiles.find((p) => p.childId === childId);
    const childAdaptations = adaptations.filter(
      (a) => a.childId === childId && a.status === "active",
    );
    const childUsage = usage.filter((u) => u.childId === childId);

    const sensoryNeeds = profile?.sensoryNeeds ?? [];
    const preferences = profile?.preferences ?? [];
    const triggers = profile?.triggers ?? [];
    const calmingStrategies = profile?.calmingStrategies ?? [];
    const hasSensoryDiet =
      profile?.sensoryDiet !== undefined &&
      profile.sensoryDiet !== null &&
      profile.sensoryDiet.length > 0;

    const adaptationsInPlace = childAdaptations.length;
    const effectiveAdaptations = childAdaptations.filter(
      (a) => a.effectiveness === "effective",
    ).length;

    const spaceUsageCount = childUsage.length;
    const totalSpaceMinutes = childUsage.reduce(
      (sum, u) => sum + u.durationMinutes,
      0,
    );
    const positiveUsage = childUsage.filter(
      (u) => u.childResponse === "positive",
    ).length;
    const positiveResponseRate = pct(positiveUsage, spaceUsageCount);

    // Environmental comfort score (0-100):
    // - Has sensory profile (20 pts)
    // - Has adaptations in place (20 pts — proportional, max at 3+)
    // - Has effective adaptations (20 pts — proportional)
    // - Uses therapeutic spaces (20 pts — proportional, max at 5+)
    // - Positive response rate (20 pts — proportional)
    let comfortScore = 0;

    // Has profile
    if (profile) comfortScore += 20;

    // Adaptations in place (up to 20, max at 3+)
    comfortScore += Math.min(20, Math.round((adaptationsInPlace / 3) * 20));

    // Effective adaptations (up to 20)
    if (adaptationsInPlace > 0) {
      comfortScore += Math.round(
        (effectiveAdaptations / adaptationsInPlace) * 20,
      );
    }

    // Space usage (up to 20, max at 5+ sessions)
    comfortScore += Math.min(20, Math.round((spaceUsageCount / 5) * 20));

    // Positive response (up to 20)
    if (spaceUsageCount > 0) {
      comfortScore += Math.round((positiveResponseRate / 100) * 20);
    }

    const environmentalComfortScore = Math.min(100, Math.max(0, comfortScore));

    return {
      childId,
      childName,
      sensoryNeeds,
      preferences,
      triggers,
      calmingStrategies,
      hasSensoryDiet,
      adaptationsInPlace,
      effectiveAdaptations,
      spaceUsageCount,
      totalSpaceMinutes,
      positiveResponseRate,
      environmentalComfortScore,
    };
  });
}

// ── Function 6: Generate Full Intelligence ─────────────────────────────────

export function generateSensoryEnvironmentIntelligence(
  profiles: ChildSensoryProfile[],
  assessments: SpaceAssessment[],
  adaptations: EnvironmentalAdaptation[],
  usage: TherapeuticSpaceUsage[],
  childIds: string[],
  childNames: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): SensoryEnvironmentIntelligence {
  // Filter usage to period
  const periodUsage = usage.filter((u) =>
    inPeriod(u.date, periodStart, periodEnd),
  );

  // Run all evaluations
  const sensoryProfiling = evaluateChildSensoryProfiles(profiles, childIds);
  const spaceQuality = evaluateSpaceQuality(assessments);
  const adaptationsResult = evaluateAdaptations(adaptations);
  const therapeuticUsage = evaluateTherapeuticSpaceUsage(periodUsage);

  // Build child profiles
  const childProfiles = buildChildEnvironmentProfiles(
    profiles,
    adaptations,
    periodUsage,
    childIds,
    childNames,
  );

  // ── Scoring (100 points total) ───────────────────────────────────────────

  // 1. Sensory Profiling (25 pts)
  //    - Coverage rate (10 pts)
  //    - Documentation quality: triggers + calming + sensory diet (15 pts)
  const profilingCoverage = (sensoryProfiling.coverageRate / 100) * 10;
  const docQuality =
    ((sensoryProfiling.triggerDocumentationRate / 100) * 5) +
    ((sensoryProfiling.calmingStrategyDocumentationRate / 100) * 5) +
    ((sensoryProfiling.sensoryDietRate / 100) * 5);
  const profilingScore = Math.min(25, Math.round(profilingCoverage + docQuality));

  // 2. Space Quality (25 pts)
  //    - Personalisation (8 pts)
  //    - Child-friendliness (7 pts)
  //    - Environment (noise + lighting + temperature) (10 pts)
  const personalisationPts = (spaceQuality.personalisationRate / 100) * 8;
  const childFriendlyPts = (spaceQuality.childFriendlyRate / 100) * 7;
  const envAvg =
    assessments.length > 0
      ? (spaceQuality.noiseQuality +
          spaceQuality.lightingQuality +
          spaceQuality.temperatureQuality) /
        3
      : 0;
  const envPts = (envAvg / 100) * 10;
  const spaceScore = Math.min(
    25,
    Math.round(personalisationPts + childFriendlyPts + envPts),
  );

  // 3. Adaptations (25 pts)
  //    - Effectiveness (8 pts)
  //    - Currency (7 pts)
  //    - Child feedback (5 pts)
  //    - Having adaptations at all (5 pts — proportional, max at 5+ active)
  const effectivenessPts = (adaptationsResult.effectivenessRate / 100) * 8;
  const currencyPts = (adaptationsResult.reviewCurrency / 100) * 7;
  const feedbackPts = (adaptationsResult.childFeedbackCaptureRate / 100) * 5;
  const havingAdaptPts = Math.min(
    5,
    Math.round((adaptationsResult.activeAdaptations / 5) * 5),
  );
  const adaptScore = Math.min(
    25,
    Math.round(effectivenessPts + currencyPts + feedbackPts + havingAdaptPts),
  );

  // 4. Therapeutic Space Usage (25 pts)
  //    - Frequency (8 pts — proportional, max at 20+ sessions)
  //    - Engagement across children (7 pts)
  //    - Positive response (10 pts)
  const freqPts = Math.min(
    8,
    Math.round((therapeuticUsage.usageFrequency / 20) * 8),
  );
  const engagedChildren = therapeuticUsage.perChildEngagement.length;
  const engagementPts =
    childIds.length > 0
      ? Math.round((engagedChildren / childIds.length) * 7)
      : 0;
  const responsePts = (therapeuticUsage.positiveResponseRate / 100) * 10;
  const usageScore = Math.min(
    25,
    Math.round(freqPts + engagementPts + responsePts),
  );

  // Overall
  const overallScore = Math.min(
    100,
    Math.max(0, profilingScore + spaceScore + adaptScore + usageScore),
  );
  const rating: SensoryEnvironmentIntelligence["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths ────────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (sensoryProfiling.coverageRate === 100) {
    strengths.push(
      "All children have sensory profiles in place, ensuring individual needs are identified and documented.",
    );
  }
  if (sensoryProfiling.calmingStrategyDocumentationRate >= 80) {
    strengths.push(
      "Calming strategies are well-documented across children, supporting consistent de-escalation approaches.",
    );
  }
  if (sensoryProfiling.sensoryDietRate >= 80) {
    strengths.push(
      "Sensory diets are established for most children, providing structured sensory input throughout the day.",
    );
  }
  if (spaceQuality.personalisationRate >= 80) {
    strengths.push(
      "Living spaces are well-personalised, creating a homely and individual environment for each child.",
    );
  }
  if (spaceQuality.childFriendlyRate >= 80) {
    strengths.push(
      "The majority of spaces are assessed as child-friendly, supporting a comfortable living environment.",
    );
  }
  if (adaptationsResult.effectivenessRate >= 80) {
    strengths.push(
      "Environmental adaptations are largely effective, demonstrating responsive care practices.",
    );
  }
  if (adaptationsResult.childFeedbackCaptureRate >= 70) {
    strengths.push(
      "Child feedback on adaptations is regularly captured, ensuring their voice informs environmental decisions.",
    );
  }
  if (therapeuticUsage.positiveResponseRate >= 80) {
    strengths.push(
      "Children respond positively to therapeutic space usage, indicating effective sensory provision.",
    );
  }
  if (engagedChildren === childIds.length && childIds.length > 0) {
    strengths.push(
      "All children engage with therapeutic spaces, demonstrating equitable access to sensory resources.",
    );
  }

  // ── Areas for Improvement ────────────────────────────────────────────────
  const areasForImprovement: string[] = [];

  if (sensoryProfiling.coverageRate < 100) {
    areasForImprovement.push(
      `${sensoryProfiling.unprofiledChildIds.length} child(ren) lack sensory profiles — all children should have documented sensory assessments.`,
    );
  }
  if (sensoryProfiling.triggerDocumentationRate < 80) {
    areasForImprovement.push(
      "Trigger documentation is below 80% — improving this ensures staff can prevent sensory overload effectively.",
    );
  }
  if (sensoryProfiling.sensoryDietRate < 50) {
    areasForImprovement.push(
      "Fewer than half of children have sensory diets in place — consider developing structured sensory routines for each child.",
    );
  }
  if (spaceQuality.personalisationRate < 60) {
    areasForImprovement.push(
      "Many spaces lack personalisation — children should be involved in choosing colours, textures, and items for their environments.",
    );
  }
  if (spaceQuality.improvementBacklog > 3) {
    areasForImprovement.push(
      `${spaceQuality.improvementBacklog} space improvements are pending — prioritise these to enhance the physical environment.`,
    );
  }
  if (adaptationsResult.effectivenessRate < 60) {
    areasForImprovement.push(
      "Adaptation effectiveness is below 60% — review and adjust adaptations that are not meeting children's needs.",
    );
  }
  if (adaptationsResult.childFeedbackCaptureRate < 50) {
    areasForImprovement.push(
      "Child feedback on environmental adaptations is infrequently captured — ensure children's views shape their environment.",
    );
  }
  if (adaptationsResult.needsReviewCount > 0) {
    areasForImprovement.push(
      `${adaptationsResult.needsReviewCount} adaptation(s) need review — schedule timely reviews to maintain effectiveness.`,
    );
  }
  if (therapeuticUsage.positiveResponseRate < 60) {
    areasForImprovement.push(
      "Positive response rate to therapeutic spaces is low — reassess how spaces are being used and whether they meet individual needs.",
    );
  }
  if (engagedChildren < childIds.length && childIds.length > 0) {
    areasForImprovement.push(
      "Not all children are engaging with therapeutic spaces — explore barriers and encourage wider participation.",
    );
  }

  // ── Actions ──────────────────────────────────────────────────────────────
  const actions: string[] = [];

  if (sensoryProfiling.coverageRate < 100) {
    actions.push(
      "Complete sensory profiles for all unprofiled children within the next review cycle.",
    );
  }
  if (sensoryProfiling.sensoryDietRate < 80) {
    actions.push(
      "Develop sensory diet plans for children who do not yet have one, consulting with OT where appropriate.",
    );
  }
  if (spaceQuality.improvementBacklog > 0) {
    actions.push(
      "Address the pending space improvements, prioritising those affecting bedrooms and high-use areas.",
    );
  }
  if (adaptationsResult.needsReviewCount > 0) {
    actions.push(
      "Schedule adaptation reviews for all items flagged as needing review.",
    );
  }
  if (adaptationsResult.childFeedbackCaptureRate < 70) {
    actions.push(
      "Introduce a structured approach to capturing child feedback on environmental adaptations at each keywork session.",
    );
  }
  if (therapeuticUsage.positiveResponseRate < 70) {
    actions.push(
      "Review therapeutic space setups with input from children to improve engagement and positive outcomes.",
    );
  }
  if (engagedChildren < childIds.length && childIds.length > 0) {
    actions.push(
      "Create individual therapeutic space plans for children who are not currently engaging with available spaces.",
    );
  }
  if (spaceQuality.personalisationRate < 80) {
    actions.push(
      "Involve children in personalising shared spaces during upcoming house meetings.",
    );
  }

  // ── Regulatory Links ─────────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 6 — Quality of care: each child receives care tailored to their individual sensory and therapeutic needs.",
    "CHR 2015 Reg 25 — Premises: the environment is maintained, safe, and adapted to support children's wellbeing.",
    "SCCIF Quality of Care — The home ensures that children live in an environment that meets their physical, sensory, and emotional needs.",
    "NICE CG128 — Autism guidance: sensory sensitivities are identified, documented, and managed through appropriate environmental adaptations.",
    "UNCRC Article 31 — Children's right to rest, leisure, and play is supported through access to therapeutic and recreational spaces.",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    sensoryProfiling,
    spaceQuality,
    adaptations: adaptationsResult,
    therapeuticUsage,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
