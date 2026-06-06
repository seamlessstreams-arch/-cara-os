// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Home Atmosphere & Ethos Intelligence Engine
//
// Deterministic engine for evaluating warmth & culture, child experience,
// environment quality, and staff practice across the home.
//
// Aligned to:
//   - CHR 2015 Reg 6  — Quality of care
//   - CHR 2015 Reg 9  — Promoting positive behaviour
//   - SCCIF           — Experiences and progress of children
//   - NMS 7           — Accommodation
//   - UNCRC Article 12 — Right to be heard
//   - UNCRC Article 3  — Best interests of the child
//   - CA 1989 s22(4)  — Duty to safeguard and promote welfare
//   - Equality Act 2010
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type AtmosphereIndicator =
  | "warmth"
  | "homeliness"
  | "calm"
  | "safety"
  | "respect"
  | "fun"
  | "inclusion"
  | "privacy"
  | "predictability"
  | "nurture";

export type ObservationRating = "excellent" | "good" | "adequate" | "poor";

export type ObserverRole =
  | "reg44_visitor"
  | "social_worker"
  | "ofsted_inspector"
  | "manager"
  | "independent_visitor"
  | "child"
  | "staff";

export type EnvironmentArea =
  | "communal_lounge"
  | "kitchen_dining"
  | "bedrooms"
  | "garden_outdoor"
  | "bathrooms"
  | "entrance_hallway"
  | "study_quiet_area"
  | "sensory_room";

export type ChildFeedbackSentiment =
  | "very_positive"
  | "positive"
  | "neutral"
  | "negative"
  | "very_negative";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface AtmosphereObservation {
  id: string;
  observerRole: ObserverRole;
  observationDate: string;
  indicator: AtmosphereIndicator;
  rating: ObservationRating;
  area: EnvironmentArea | null;
  narrative: string | null;
  childrenPresent: boolean;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
}

export interface ChildAtmosphereFeedback {
  id: string;
  childId: string;
  childName: string;
  date: string;
  overallSentiment: ChildFeedbackSentiment;
  feelsAtHome: boolean;
  feelsListenedTo: boolean;
  feelsSafe: boolean;
  hasPrivacy: boolean;
  enjoysLivingHere: boolean;
  canBeThemselves: boolean;
  suggestionsForImprovement: string | null;
}

export interface EnvironmentAudit {
  id: string;
  auditDate: string;
  auditor: string;
  area: EnvironmentArea;
  clean: boolean;
  personalised: boolean;
  welcoming: boolean;
  ageAppropriate: boolean;
  sensoryConsidered: boolean;
  childContributed: boolean;
  repairsNeeded: boolean;
  repairsActioned: boolean | null;
}

export interface StaffCultureRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  therapeuticApproachUsed: boolean;
  childCentredLanguage: boolean;
  warmInteractionObserved: boolean;
  boundariesMaintained: boolean;
  deEscalationUsed: boolean | null;
  positiveReinforcementGiven: boolean;
  reflectivePractice: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface WarmthCultureResult {
  overallScore: number;
  totalObservations: number;
  excellentGoodRate: number;
  warmthScore: number;
  calmScore: number;
  respectScore: number;
  funScore: number;
  nurtureScore: number;
  indicatorDistribution: Record<AtmosphereIndicator, number>;
}

export interface ChildExperienceResult {
  overallScore: number;
  totalFeedback: number;
  positiveRate: number;
  feelsAtHomeRate: number;
  feelsListenedToRate: number;
  feelsSafeRate: number;
  hasPrivacyRate: number;
  enjoysLivingRate: number;
  canBeThemselvesRate: number;
}

export interface EnvironmentQualityResult {
  overallScore: number;
  totalAudits: number;
  cleanRate: number;
  personalisedRate: number;
  welcomingRate: number;
  childContributedRate: number;
  repairsActionedRate: number;
  sensoryConsideredRate: number;
}

export interface StaffPracticeResult {
  overallScore: number;
  totalRecords: number;
  therapeuticRate: number;
  childCentredRate: number;
  warmInteractionRate: number;
  positiveReinforcementRate: number;
  reflectiveRate: number;
  boundariesRate: number;
}

export interface ChildAtmosphereProfile {
  childId: string;
  childName: string;
  feedbackCount: number;
  positiveRate: number;
  feelsAtHome: boolean;
  feelsSafe: boolean;
  overallScore: number;
}

export interface HomeAtmosphereEthosIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  warmthCulture: WarmthCultureResult;
  childExperience: ChildExperienceResult;
  environmentQuality: EnvironmentQualityResult;
  staffPractice: StaffPracticeResult;
  childProfiles: ChildAtmosphereProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  return den === 0 ? 0 : Math.round((num / den) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

function ratingToNumeric(rating: ObservationRating): number {
  switch (rating) {
    case "excellent":
      return 100;
    case "good":
      return 75;
    case "adequate":
      return 50;
    case "poor":
      return 25;
  }
}

// ── Label Functions ────────────────────────────────────────────────────────

const ATMOSPHERE_INDICATOR_LABELS: Record<AtmosphereIndicator, string> = {
  warmth: "Warmth",
  homeliness: "Homeliness",
  calm: "Calm",
  safety: "Safety",
  respect: "Respect",
  fun: "Fun",
  inclusion: "Inclusion",
  privacy: "Privacy",
  predictability: "Predictability",
  nurture: "Nurture",
};

const OBSERVATION_RATING_LABELS: Record<ObservationRating, string> = {
  excellent: "Excellent",
  good: "Good",
  adequate: "Adequate",
  poor: "Poor",
};

const OBSERVER_ROLE_LABELS: Record<ObserverRole, string> = {
  reg44_visitor: "Reg 44 Visitor",
  social_worker: "Social Worker",
  ofsted_inspector: "Ofsted Inspector",
  manager: "Manager",
  independent_visitor: "Independent Visitor",
  child: "Child",
  staff: "Staff",
};

const ENVIRONMENT_AREA_LABELS: Record<EnvironmentArea, string> = {
  communal_lounge: "Communal Lounge",
  kitchen_dining: "Kitchen & Dining",
  bedrooms: "Bedrooms",
  garden_outdoor: "Garden & Outdoor",
  bathrooms: "Bathrooms",
  entrance_hallway: "Entrance & Hallway",
  study_quiet_area: "Study & Quiet Area",
  sensory_room: "Sensory Room",
};

const CHILD_FEEDBACK_SENTIMENT_LABELS: Record<ChildFeedbackSentiment, string> = {
  very_positive: "Very Positive",
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
  very_negative: "Very Negative",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getAtmosphereIndicatorLabel(indicator: AtmosphereIndicator): string {
  return ATMOSPHERE_INDICATOR_LABELS[indicator] ?? indicator.replace(/_/g, " ");
}

export function getObservationRatingLabel(rating: ObservationRating): string {
  return OBSERVATION_RATING_LABELS[rating] ?? rating.replace(/_/g, " ");
}

export function getObserverRoleLabel(role: ObserverRole): string {
  return OBSERVER_ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}

export function getEnvironmentAreaLabel(area: EnvironmentArea): string {
  return ENVIRONMENT_AREA_LABELS[area] ?? area.replace(/_/g, " ");
}

export function getChildFeedbackSentimentLabel(sentiment: ChildFeedbackSentiment): string {
  return CHILD_FEEDBACK_SENTIMENT_LABELS[sentiment] ?? sentiment.replace(/_/g, " ");
}

export function getRatingLabel(rating: Rating): string {
  return RATING_LABELS[rating] ?? rating.replace(/_/g, " ");
}

// ── Function 1: Evaluate Warmth & Culture (0-25) ──────────────────────────

export function evaluateWarmthCulture(
  observations: AtmosphereObservation[],
): WarmthCultureResult {
  const total = observations.length;

  const emptyDistribution: Record<AtmosphereIndicator, number> = {
    warmth: 0,
    homeliness: 0,
    calm: 0,
    safety: 0,
    respect: 0,
    fun: 0,
    inclusion: 0,
    privacy: 0,
    predictability: 0,
    nurture: 0,
  };

  if (total === 0) {
    return {
      overallScore: 0,
      totalObservations: 0,
      excellentGoodRate: 0,
      warmthScore: 0,
      calmScore: 0,
      respectScore: 0,
      funScore: 0,
      nurtureScore: 0,
      indicatorDistribution: emptyDistribution,
    };
  }

  // Indicator distribution
  const distribution = { ...emptyDistribution };
  for (const obs of observations) {
    distribution[obs.indicator]++;
  }

  // Excellent + good rate
  const excellentGood = observations.filter(
    (o) => o.rating === "excellent" || o.rating === "good",
  ).length;
  const excellentGoodRate = pct(excellentGood, total);

  // Warmth score: average numeric rating for warmth indicator observations
  const warmthObs = observations.filter((o) => o.indicator === "warmth");
  const warmthScore =
    warmthObs.length > 0
      ? Math.round(
          warmthObs.reduce((sum, o) => sum + ratingToNumeric(o.rating), 0) /
            warmthObs.length,
        )
      : 0;

  // Calm score: pct of calm+safety indicator observations rated excellent/good
  const calmSafetyObs = observations.filter(
    (o) => o.indicator === "calm" || o.indicator === "safety",
  );
  const calmSafetyGood = calmSafetyObs.filter(
    (o) => o.rating === "excellent" || o.rating === "good",
  ).length;
  const calmScore = pct(calmSafetyGood, calmSafetyObs.length);

  // Respect score: pct of respect indicator observations rated excellent/good
  const respectObs = observations.filter((o) => o.indicator === "respect");
  const respectGood = respectObs.filter(
    (o) => o.rating === "excellent" || o.rating === "good",
  ).length;
  const respectScore = pct(respectGood, respectObs.length);

  // Fun score: pct of fun indicator observations rated excellent/good
  const funObs = observations.filter((o) => o.indicator === "fun");
  const funGood = funObs.filter(
    (o) => o.rating === "excellent" || o.rating === "good",
  ).length;
  const funScore = pct(funGood, funObs.length);

  // Nurture score: pct of nurture indicator observations rated excellent/good
  const nurtureObs = observations.filter((o) => o.indicator === "nurture");
  const nurtureGood = nurtureObs.filter(
    (o) => o.rating === "excellent" || o.rating === "good",
  ).length;
  const nurtureScore = pct(nurtureGood, nurtureObs.length);

  // Scoring (0-25):
  // excellent+good rate (0-8)
  const egPts = Math.min(8, Math.round((excellentGoodRate / 100) * 8));
  // warmth observations (0-5)
  const warmthPts = Math.min(5, Math.round((warmthScore / 100) * 5));
  // calm/safety (0-4)
  const calmPts = Math.min(4, Math.round((calmScore / 100) * 4));
  // respect (0-4)
  const respectPts = Math.min(4, Math.round((respectScore / 100) * 4));
  // fun + nurture (0-4)
  const funNurtureAvg =
    funObs.length > 0 || nurtureObs.length > 0
      ? (funScore + nurtureScore) / 2
      : 0;
  const funNurturePts = Math.min(4, Math.round((funNurtureAvg / 100) * 4));

  const overallScore = Math.min(
    25,
    egPts + warmthPts + calmPts + respectPts + funNurturePts,
  );

  return {
    overallScore,
    totalObservations: total,
    excellentGoodRate,
    warmthScore,
    calmScore,
    respectScore,
    funScore,
    nurtureScore,
    indicatorDistribution: distribution,
  };
}

// ── Function 2: Evaluate Child Experience (0-25) ──────────────────────────

export function evaluateChildExperience(
  feedback: ChildAtmosphereFeedback[],
): ChildExperienceResult {
  const total = feedback.length;
  if (total === 0) {
    return {
      overallScore: 0,
      totalFeedback: 0,
      positiveRate: 0,
      feelsAtHomeRate: 0,
      feelsListenedToRate: 0,
      feelsSafeRate: 0,
      hasPrivacyRate: 0,
      enjoysLivingRate: 0,
      canBeThemselvesRate: 0,
    };
  }

  const positiveCount = feedback.filter(
    (f) =>
      f.overallSentiment === "very_positive" ||
      f.overallSentiment === "positive",
  ).length;
  const positiveRate = pct(positiveCount, total);

  const feelsAtHomeRate = pct(
    feedback.filter((f) => f.feelsAtHome).length,
    total,
  );
  const feelsListenedToRate = pct(
    feedback.filter((f) => f.feelsListenedTo).length,
    total,
  );
  const feelsSafeRate = pct(
    feedback.filter((f) => f.feelsSafe).length,
    total,
  );
  const hasPrivacyRate = pct(
    feedback.filter((f) => f.hasPrivacy).length,
    total,
  );
  const enjoysLivingRate = pct(
    feedback.filter((f) => f.enjoysLivingHere).length,
    total,
  );
  const canBeThemselvesRate = pct(
    feedback.filter((f) => f.canBeThemselves).length,
    total,
  );

  // Scoring (0-25):
  // positive sentiment rate (0-7)
  const posPts = Math.min(7, Math.round((positiveRate / 100) * 7));
  // feels safe (0-5)
  const safePts = Math.min(5, Math.round((feelsSafeRate / 100) * 5));
  // feels at home (0-4)
  const homePts = Math.min(4, Math.round((feelsAtHomeRate / 100) * 4));
  // listens (0-3)
  const listenPts = Math.min(3, Math.round((feelsListenedToRate / 100) * 3));
  // privacy (0-3)
  const privacyPts = Math.min(3, Math.round((hasPrivacyRate / 100) * 3));
  // enjoys + can be themselves (0-3)
  const enjoysSelfAvg = (enjoysLivingRate + canBeThemselvesRate) / 2;
  const enjoysSelfPts = Math.min(3, Math.round((enjoysSelfAvg / 100) * 3));

  const overallScore = Math.min(
    25,
    posPts + safePts + homePts + listenPts + privacyPts + enjoysSelfPts,
  );

  return {
    overallScore,
    totalFeedback: total,
    positiveRate,
    feelsAtHomeRate,
    feelsListenedToRate,
    feelsSafeRate,
    hasPrivacyRate,
    enjoysLivingRate,
    canBeThemselvesRate,
  };
}

// ── Function 3: Evaluate Environment Quality (0-25) ───────────────────────

export function evaluateEnvironmentQuality(
  audits: EnvironmentAudit[],
): EnvironmentQualityResult {
  const total = audits.length;
  if (total === 0) {
    return {
      overallScore: 0,
      totalAudits: 0,
      cleanRate: 0,
      personalisedRate: 0,
      welcomingRate: 0,
      childContributedRate: 0,
      repairsActionedRate: 0,
      sensoryConsideredRate: 0,
    };
  }

  const cleanRate = pct(audits.filter((a) => a.clean).length, total);
  const personalisedRate = pct(
    audits.filter((a) => a.personalised).length,
    total,
  );
  const welcomingRate = pct(
    audits.filter((a) => a.welcoming).length,
    total,
  );
  const childContributedRate = pct(
    audits.filter((a) => a.childContributed).length,
    total,
  );
  const sensoryConsideredRate = pct(
    audits.filter((a) => a.sensoryConsidered).length,
    total,
  );

  // Repairs actioned rate: among audits where repairs were needed, pct actioned
  const repairsNeeded = audits.filter((a) => a.repairsNeeded);
  const repairsActioned = repairsNeeded.filter(
    (a) => a.repairsActioned === true,
  ).length;
  const repairsActionedRate = pct(repairsActioned, repairsNeeded.length);

  // Scoring (0-25):
  // clean (0-6)
  const cleanPts = Math.min(6, Math.round((cleanRate / 100) * 6));
  // personalised (0-5)
  const personalPts = Math.min(5, Math.round((personalisedRate / 100) * 5));
  // welcoming (0-4)
  const welcomePts = Math.min(4, Math.round((welcomingRate / 100) * 4));
  // child contributed (0-4)
  const childContribPts = Math.min(
    4,
    Math.round((childContributedRate / 100) * 4),
  );
  // repairs actioned (0-3)
  const repairsPts = Math.min(3, Math.round((repairsActionedRate / 100) * 3));
  // sensory considered (0-3)
  const sensoryPts = Math.min(
    3,
    Math.round((sensoryConsideredRate / 100) * 3),
  );

  const overallScore = Math.min(
    25,
    cleanPts + personalPts + welcomePts + childContribPts + repairsPts + sensoryPts,
  );

  return {
    overallScore,
    totalAudits: total,
    cleanRate,
    personalisedRate,
    welcomingRate,
    childContributedRate,
    repairsActionedRate,
    sensoryConsideredRate,
  };
}

// ── Function 4: Evaluate Staff Practice (0-25) ───────────────────────────

export function evaluateStaffPractice(
  records: StaffCultureRecord[],
): StaffPracticeResult {
  const total = records.length;
  if (total === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      therapeuticRate: 0,
      childCentredRate: 0,
      warmInteractionRate: 0,
      positiveReinforcementRate: 0,
      reflectiveRate: 0,
      boundariesRate: 0,
    };
  }

  const therapeuticRate = pct(
    records.filter((r) => r.therapeuticApproachUsed).length,
    total,
  );
  const childCentredRate = pct(
    records.filter((r) => r.childCentredLanguage).length,
    total,
  );
  const warmInteractionRate = pct(
    records.filter((r) => r.warmInteractionObserved).length,
    total,
  );
  const positiveReinforcementRate = pct(
    records.filter((r) => r.positiveReinforcementGiven).length,
    total,
  );
  const reflectiveRate = pct(
    records.filter((r) => r.reflectivePractice).length,
    total,
  );
  const boundariesRate = pct(
    records.filter((r) => r.boundariesMaintained).length,
    total,
  );

  // Scoring (0-25):
  // therapeutic approach (0-7)
  const therapPts = Math.min(7, Math.round((therapeuticRate / 100) * 7));
  // child-centred language (0-6)
  const ccPts = Math.min(6, Math.round((childCentredRate / 100) * 6));
  // warm interaction (0-5)
  const warmPts = Math.min(5, Math.round((warmInteractionRate / 100) * 5));
  // positive reinforcement (0-4)
  const posPts = Math.min(
    4,
    Math.round((positiveReinforcementRate / 100) * 4),
  );
  // reflective (0-3)
  const reflPts = Math.min(3, Math.round((reflectiveRate / 100) * 3));

  const overallScore = Math.min(
    25,
    therapPts + ccPts + warmPts + posPts + reflPts,
  );

  return {
    overallScore,
    totalRecords: total,
    therapeuticRate,
    childCentredRate,
    warmInteractionRate,
    positiveReinforcementRate,
    reflectiveRate,
    boundariesRate,
  };
}

// ── Function 5: Build Child Atmosphere Profiles ───────────────────────────

export function buildChildAtmosphereProfiles(
  feedback: ChildAtmosphereFeedback[],
): ChildAtmosphereProfile[] {
  const childMap = new Map<
    string,
    { childName: string; records: ChildAtmosphereFeedback[] }
  >();

  for (const f of feedback) {
    const existing = childMap.get(f.childId);
    if (existing) {
      existing.records.push(f);
    } else {
      childMap.set(f.childId, { childName: f.childName, records: [f] });
    }
  }

  return Array.from(childMap.entries()).map(([childId, data]) => {
    const records = data.records;
    const feedbackCount = records.length;

    const positiveCount = records.filter(
      (r) =>
        r.overallSentiment === "very_positive" ||
        r.overallSentiment === "positive",
    ).length;
    const positiveRate = pct(positiveCount, feedbackCount);

    // Sort by date to get latest
    const sorted = [...records].sort((a, b) => (a.date > b.date ? 1 : -1));
    const latest = sorted[sorted.length - 1];

    // Overall score (0-10): weighted average of boolean fields from latest + positive rate
    // positiveRate contribution (0-4), feelsAtHome (0-1), feelsSafe (0-2),
    // feelsListenedTo (0-1), hasPrivacy (0-1), canBeThemselves (0-1)
    let score = 0;
    score += Math.round((positiveRate / 100) * 4);
    if (latest.feelsAtHome) score += 1;
    if (latest.feelsSafe) score += 2;
    if (latest.feelsListenedTo) score += 1;
    if (latest.hasPrivacy) score += 1;
    if (latest.canBeThemselves) score += 1;
    const overallScore = Math.min(10, Math.max(0, score));

    return {
      childId,
      childName: data.childName,
      feedbackCount,
      positiveRate,
      feelsAtHome: latest.feelsAtHome,
      feelsSafe: latest.feelsSafe,
      overallScore,
    };
  });
}

// ── Function 6: Generate Full Intelligence ────────────────────────────────

export function generateHomeAtmosphereEthosIntelligence(
  observations: AtmosphereObservation[],
  feedback: ChildAtmosphereFeedback[],
  audits: EnvironmentAudit[],
  staffRecords: StaffCultureRecord[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): HomeAtmosphereEthosIntelligence {
  // Filter data to period
  const periodObservations = observations.filter(
    (o) => withinPeriod(o.observationDate, periodStart, periodEnd),
  );
  const periodFeedback = feedback.filter(
    (f) => withinPeriod(f.date, periodStart, periodEnd),
  );
  const periodAudits = audits.filter(
    (a) => withinPeriod(a.auditDate, periodStart, periodEnd),
  );
  const periodStaff = staffRecords.filter(
    (r) => withinPeriod(r.date, periodStart, periodEnd),
  );

  // Run evaluations
  const warmthCulture = evaluateWarmthCulture(periodObservations);
  const childExperience = evaluateChildExperience(periodFeedback);
  const environmentQuality = evaluateEnvironmentQuality(periodAudits);
  const staffPractice = evaluateStaffPractice(periodStaff);

  // Build child profiles
  const childProfiles = buildChildAtmosphereProfiles(periodFeedback);

  // Overall score (0-100, capped)
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      warmthCulture.overallScore +
        childExperience.overallScore +
        environmentQuality.overallScore +
        staffPractice.overallScore,
    ),
  );
  const rating = getRating(overallScore);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (warmthCulture.excellentGoodRate >= 80 && warmthCulture.totalObservations > 0) {
    strengths.push(
      "The home demonstrates a consistently warm and positive atmosphere with the majority of observations rated excellent or good.",
    );
  }
  if (warmthCulture.warmthScore >= 80) {
    strengths.push(
      "Warmth is strongly embedded in the culture, with staff creating a genuinely caring environment.",
    );
  }
  if (warmthCulture.respectScore >= 80) {
    strengths.push(
      "Respect between staff and children is consistently observed, promoting dignity and positive relationships.",
    );
  }
  if (childExperience.positiveRate >= 80 && childExperience.totalFeedback > 0) {
    strengths.push(
      "Children overwhelmingly report positive experiences of living in the home.",
    );
  }
  if (childExperience.feelsSafeRate >= 90) {
    strengths.push(
      "Children consistently report feeling safe, which is fundamental to a positive living environment.",
    );
  }
  if (childExperience.feelsAtHomeRate >= 80) {
    strengths.push(
      "Children feel at home, indicating the environment successfully creates a sense of belonging.",
    );
  }
  if (childExperience.canBeThemselvesRate >= 80) {
    strengths.push(
      "Children feel they can be themselves, reflecting an inclusive and accepting culture.",
    );
  }
  if (environmentQuality.cleanRate >= 90 && environmentQuality.totalAudits > 0) {
    strengths.push(
      "The home is consistently maintained to a high standard of cleanliness.",
    );
  }
  if (environmentQuality.personalisedRate >= 80) {
    strengths.push(
      "Living spaces are personalised to children's tastes and preferences, creating a homely feel.",
    );
  }
  if (environmentQuality.childContributedRate >= 80) {
    strengths.push(
      "Children actively contribute to their environment, demonstrating meaningful participation.",
    );
  }
  if (staffPractice.therapeuticRate >= 80 && staffPractice.totalRecords > 0) {
    strengths.push(
      "Therapeutic approaches are well embedded in staff practice across the team.",
    );
  }
  if (staffPractice.warmInteractionRate >= 80) {
    strengths.push(
      "Warm interactions between staff and children are consistently observed, nurturing positive attachments.",
    );
  }
  if (staffPractice.reflectiveRate >= 80) {
    strengths.push(
      "Staff engage in reflective practice, continuously improving the quality of care.",
    );
  }

  // ── Areas for Improvement ──────────────────────────────────────────────
  const areasForImprovement: string[] = [];

  if (warmthCulture.excellentGoodRate < 60 && warmthCulture.totalObservations > 0) {
    areasForImprovement.push(
      "Fewer than 60% of atmosphere observations are rated excellent or good — the home needs to embed a more consistently positive culture.",
    );
  }
  if (warmthCulture.calmScore < 60 && warmthCulture.totalObservations > 0) {
    areasForImprovement.push(
      "Calm and safety scores indicate inconsistency — consider reviewing de-escalation approaches and daily routines.",
    );
  }
  if (warmthCulture.funScore < 50 && warmthCulture.totalObservations > 0) {
    areasForImprovement.push(
      "Fun and enjoyment are not strongly evidenced — ensure children have regular access to enjoyable activities.",
    );
  }
  if (childExperience.feelsSafeRate < 80 && childExperience.totalFeedback > 0) {
    areasForImprovement.push(
      "Not all children consistently feel safe — this must be urgently addressed as safety is a fundamental need.",
    );
  }
  if (childExperience.feelsListenedToRate < 70 && childExperience.totalFeedback > 0) {
    areasForImprovement.push(
      "Children do not consistently feel listened to — review how children's views are sought and acted upon.",
    );
  }
  if (childExperience.hasPrivacyRate < 70 && childExperience.totalFeedback > 0) {
    areasForImprovement.push(
      "Privacy concerns are raised by children — ensure each child has appropriate private space and time.",
    );
  }
  if (environmentQuality.personalisedRate < 60 && environmentQuality.totalAudits > 0) {
    areasForImprovement.push(
      "Many areas lack personalisation — involve children in decorating and personalising communal and private spaces.",
    );
  }
  if (environmentQuality.repairsActionedRate < 80 && environmentQuality.totalAudits > 0) {
    const repairsNeeded = audits.filter((a) => a.repairsNeeded).length;
    if (repairsNeeded > 0) {
      areasForImprovement.push(
        "Not all identified repairs have been actioned — outstanding maintenance issues affect the quality of the living environment.",
      );
    }
  }
  if (staffPractice.therapeuticRate < 70 && staffPractice.totalRecords > 0) {
    areasForImprovement.push(
      "Therapeutic approaches are not consistently used — consider additional training and supervision to embed therapeutic care.",
    );
  }
  if (staffPractice.childCentredRate < 70 && staffPractice.totalRecords > 0) {
    areasForImprovement.push(
      "Child-centred language is not used consistently across the team — address in supervision and team meetings.",
    );
  }
  if (staffPractice.reflectiveRate < 60 && staffPractice.totalRecords > 0) {
    areasForImprovement.push(
      "Reflective practice is not well embedded — ensure all staff have regular reflective supervision.",
    );
  }

  // ── Actions ────────────────────────────────────────────────────────────
  const actions: string[] = [];

  if (childExperience.feelsSafeRate < 80 && childExperience.totalFeedback > 0) {
    actions.push(
      "URGENT: Conduct individual sessions with all children to understand safety concerns and develop immediate action plans.",
    );
  }
  if (warmthCulture.excellentGoodRate < 50 && warmthCulture.totalObservations > 0) {
    actions.push(
      "URGENT: Review the home's culture and ethos with the entire staff team and develop an improvement plan.",
    );
  }
  if (childExperience.feelsListenedToRate < 70 && childExperience.totalFeedback > 0) {
    actions.push(
      "Strengthen children's participation by implementing regular house meetings and individual consultation sessions.",
    );
  }
  if (childExperience.hasPrivacyRate < 70 && childExperience.totalFeedback > 0) {
    actions.push(
      "Review privacy arrangements for each child and make adjustments to ensure appropriate private space and time.",
    );
  }
  if (environmentQuality.personalisedRate < 70 && environmentQuality.totalAudits > 0) {
    actions.push(
      "Work with each child to personalise their bedroom and involve children in decisions about communal spaces.",
    );
  }
  if (environmentQuality.childContributedRate < 60 && environmentQuality.totalAudits > 0) {
    actions.push(
      "Increase children's involvement in environmental decisions through house meetings and choice boards.",
    );
  }
  if (staffPractice.therapeuticRate < 70 && staffPractice.totalRecords > 0) {
    actions.push(
      "Arrange therapeutic care refresher training for all staff within the next review period.",
    );
  }
  if (staffPractice.childCentredRate < 70 && staffPractice.totalRecords > 0) {
    actions.push(
      "Include child-centred language as a standing agenda item in team meetings and supervision.",
    );
  }
  if (staffPractice.reflectiveRate < 60 && staffPractice.totalRecords > 0) {
    actions.push(
      "Schedule monthly reflective practice sessions for all staff members.",
    );
  }
  if (warmthCulture.funScore < 50 && warmthCulture.totalObservations > 0) {
    actions.push(
      "Develop a weekly activities programme that prioritises fun and enjoyment alongside therapeutic goals.",
    );
  }
  if (
    environmentQuality.repairsActionedRate < 80 &&
    environmentQuality.totalAudits > 0 &&
    audits.filter((a) => a.repairsNeeded).length > 0
  ) {
    actions.push(
      "Create a repairs tracker and ensure all outstanding maintenance issues are resolved within 14 days.",
    );
  }

  // ── Regulatory Links ───────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 6 — Quality of care: each child receives care that is focused on their individual needs and promotes their welfare.",
    "CHR 2015 Reg 9 — Promoting positive behaviour: the ethos of the home supports children's positive behaviour and emotional wellbeing.",
    "SCCIF — Experiences and progress of children: the home creates an environment where children feel safe, valued, and able to thrive.",
    "NMS 7 — Accommodation: the home provides comfortable, well-maintained accommodation that is homely and personalised.",
    "UNCRC Article 12 — Right to be heard: children's views and feelings are actively sought and taken into account in decisions affecting them.",
    "UNCRC Article 3 — Best interests of the child: all decisions about the child's environment and care prioritise their best interests.",
    "CA 1989 s22(4) — Duty to safeguard and promote the welfare of looked-after children.",
    "Equality Act 2010 — The home ensures an inclusive environment that respects and celebrates diversity.",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    warmthCulture,
    childExperience,
    environmentQuality,
    staffPractice,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
