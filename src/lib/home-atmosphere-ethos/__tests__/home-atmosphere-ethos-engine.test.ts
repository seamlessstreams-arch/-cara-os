// ══════════════════════════════════════════════════════════════════════════════
// Cara — Home Atmosphere & Ethos Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  getRating,
  evaluateWarmthCulture,
  evaluateChildExperience,
  evaluateEnvironmentQuality,
  evaluateStaffPractice,
  buildChildAtmosphereProfiles,
  generateHomeAtmosphereEthosIntelligence,
  getAtmosphereIndicatorLabel,
  getObservationRatingLabel,
  getObserverRoleLabel,
  getEnvironmentAreaLabel,
  getChildFeedbackSentimentLabel,
  getRatingLabel,
} from "../home-atmosphere-ethos-engine";
import type {
  AtmosphereObservation,
  ChildAtmosphereFeedback,
  EnvironmentAudit,
  StaffCultureRecord,
  AtmosphereIndicator,
  ObservationRating,
  ObserverRole,
  EnvironmentArea,
  ChildFeedbackSentiment,
  Rating,
} from "../home-atmosphere-ethos-engine";

// ── Test Constants ───────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-01-31";
const HOME_ID = "oak-house";

// ── Demo Data — Atmosphere Observations ─────────────────────────────────────

const DEMO_OBSERVATIONS: AtmosphereObservation[] = [
  { id: "obs-01", observerRole: "reg44_visitor", observationDate: "2026-01-05", indicator: "warmth", rating: "excellent", area: "communal_lounge", narrative: "Children relaxed and chatting with staff in the lounge.", childrenPresent: true, timeOfDay: "afternoon" },
  { id: "obs-02", observerRole: "reg44_visitor", observationDate: "2026-01-05", indicator: "homeliness", rating: "good", area: "kitchen_dining", narrative: "Kitchen felt welcoming, children's artwork displayed.", childrenPresent: true, timeOfDay: "afternoon" },
  { id: "obs-03", observerRole: "reg44_visitor", observationDate: "2026-01-05", indicator: "calm", rating: "excellent", area: "communal_lounge", narrative: "Quiet, calm atmosphere with low background music.", childrenPresent: true, timeOfDay: "evening" },
  { id: "obs-04", observerRole: "social_worker", observationDate: "2026-01-10", indicator: "safety", rating: "good", area: "entrance_hallway", narrative: "Secure entry, children aware of procedures.", childrenPresent: false, timeOfDay: "morning" },
  { id: "obs-05", observerRole: "social_worker", observationDate: "2026-01-10", indicator: "respect", rating: "excellent", area: "communal_lounge", narrative: "Staff addressed children by name, tone consistently warm.", childrenPresent: true, timeOfDay: "morning" },
  { id: "obs-06", observerRole: "manager", observationDate: "2026-01-12", indicator: "fun", rating: "good", area: "garden_outdoor", narrative: "Children playing football with staff after school.", childrenPresent: true, timeOfDay: "afternoon" },
  { id: "obs-07", observerRole: "manager", observationDate: "2026-01-12", indicator: "inclusion", rating: "excellent", area: "kitchen_dining", narrative: "All children participated in meal prep regardless of ability.", childrenPresent: true, timeOfDay: "evening" },
  { id: "obs-08", observerRole: "independent_visitor", observationDate: "2026-01-15", indicator: "privacy", rating: "good", area: "bedrooms", narrative: "Children have locks on bedroom doors, knock-before-entering policy observed.", childrenPresent: true, timeOfDay: "afternoon" },
  { id: "obs-09", observerRole: "child", observationDate: "2026-01-18", indicator: "predictability", rating: "good", area: null, narrative: "Routines feel consistent and I know what to expect.", childrenPresent: true, timeOfDay: "morning" },
  { id: "obs-10", observerRole: "staff", observationDate: "2026-01-20", indicator: "nurture", rating: "excellent", area: "communal_lounge", narrative: "Staff read bedtime stories to younger children.", childrenPresent: true, timeOfDay: "evening" },
  { id: "obs-11", observerRole: "manager", observationDate: "2026-01-22", indicator: "warmth", rating: "good", area: "kitchen_dining", narrative: "Staff and children baking together.", childrenPresent: true, timeOfDay: "afternoon" },
  { id: "obs-12", observerRole: "ofsted_inspector", observationDate: "2026-01-25", indicator: "respect", rating: "good", area: "communal_lounge", narrative: "Mutual respect evident between children and staff.", childrenPresent: true, timeOfDay: "morning" },
  { id: "obs-13", observerRole: "reg44_visitor", observationDate: "2026-01-28", indicator: "nurture", rating: "good", area: "bedrooms", narrative: "Staff supported a child with bedtime routine patiently.", childrenPresent: true, timeOfDay: "night" },
  { id: "obs-14", observerRole: "staff", observationDate: "2026-01-30", indicator: "calm", rating: "good", area: "study_quiet_area", narrative: "Quiet study hour was peaceful and productive.", childrenPresent: true, timeOfDay: "evening" },
  { id: "obs-15", observerRole: "manager", observationDate: "2026-01-15", indicator: "fun", rating: "excellent", area: "sensory_room", narrative: "Children laughing during sensory play session.", childrenPresent: true, timeOfDay: "afternoon" },
];

// ── Demo Data — Child Feedback ──────────────────────────────────────────────

const DEMO_FEEDBACK: ChildAtmosphereFeedback[] = [
  { id: "fb-01", childId: "child-alex", childName: "Alex", date: "2026-01-08", overallSentiment: "very_positive", feelsAtHome: true, feelsListenedTo: true, feelsSafe: true, hasPrivacy: true, enjoysLivingHere: true, canBeThemselves: true, suggestionsForImprovement: null },
  { id: "fb-02", childId: "child-alex", childName: "Alex", date: "2026-01-22", overallSentiment: "positive", feelsAtHome: true, feelsListenedTo: true, feelsSafe: true, hasPrivacy: true, enjoysLivingHere: true, canBeThemselves: true, suggestionsForImprovement: "More games nights" },
  { id: "fb-03", childId: "child-jordan", childName: "Jordan", date: "2026-01-08", overallSentiment: "positive", feelsAtHome: true, feelsListenedTo: true, feelsSafe: true, hasPrivacy: true, enjoysLivingHere: true, canBeThemselves: true, suggestionsForImprovement: null },
  { id: "fb-04", childId: "child-jordan", childName: "Jordan", date: "2026-01-22", overallSentiment: "positive", feelsAtHome: true, feelsListenedTo: false, feelsSafe: true, hasPrivacy: true, enjoysLivingHere: true, canBeThemselves: true, suggestionsForImprovement: "Sometimes I don't feel heard in house meetings" },
  { id: "fb-05", childId: "child-morgan", childName: "Morgan", date: "2026-01-08", overallSentiment: "neutral", feelsAtHome: false, feelsListenedTo: true, feelsSafe: true, hasPrivacy: false, enjoysLivingHere: false, canBeThemselves: true, suggestionsForImprovement: "I need more time alone" },
  { id: "fb-06", childId: "child-morgan", childName: "Morgan", date: "2026-01-22", overallSentiment: "positive", feelsAtHome: true, feelsListenedTo: true, feelsSafe: true, hasPrivacy: true, enjoysLivingHere: true, canBeThemselves: true, suggestionsForImprovement: null },
];

// ── Demo Data — Environment Audits ──────────────────────────────────────────

const DEMO_AUDITS: EnvironmentAudit[] = [
  { id: "ea-01", auditDate: "2026-01-05", auditor: "Sarah Johnson", area: "communal_lounge", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: true, repairsNeeded: false, repairsActioned: null },
  { id: "ea-02", auditDate: "2026-01-05", auditor: "Sarah Johnson", area: "kitchen_dining", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: true, repairsNeeded: true, repairsActioned: true },
  { id: "ea-03", auditDate: "2026-01-05", auditor: "Tom Richards", area: "bedrooms", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: true, repairsNeeded: false, repairsActioned: null },
  { id: "ea-04", auditDate: "2026-01-05", auditor: "Tom Richards", area: "garden_outdoor", clean: true, personalised: false, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: false, repairsNeeded: true, repairsActioned: false },
  { id: "ea-05", auditDate: "2026-01-05", auditor: "Lisa Williams", area: "bathrooms", clean: true, personalised: false, welcoming: false, ageAppropriate: true, sensoryConsidered: false, childContributed: false, repairsNeeded: true, repairsActioned: true },
  { id: "ea-06", auditDate: "2026-01-05", auditor: "Lisa Williams", area: "entrance_hallway", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: false, childContributed: true, repairsNeeded: false, repairsActioned: null },
  { id: "ea-07", auditDate: "2026-01-05", auditor: "Sarah Johnson", area: "study_quiet_area", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: true, repairsNeeded: false, repairsActioned: null },
  { id: "ea-08", auditDate: "2026-01-05", auditor: "Tom Richards", area: "sensory_room", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: true, repairsNeeded: false, repairsActioned: null },
];

// ── Demo Data — Staff Culture Records ───────────────────────────────────────

const DEMO_STAFF: StaffCultureRecord[] = [
  { id: "sc-01", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-01-05", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: null, positiveReinforcementGiven: true, reflectivePractice: true },
  { id: "sc-02", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-01-15", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: true, positiveReinforcementGiven: true, reflectivePractice: true },
  { id: "sc-03", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-01-25", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: null, positiveReinforcementGiven: true, reflectivePractice: true },
  { id: "sc-04", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-01-05", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: true, positiveReinforcementGiven: true, reflectivePractice: true },
  { id: "sc-05", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-01-15", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: null, positiveReinforcementGiven: true, reflectivePractice: false },
  { id: "sc-06", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-01-25", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: true, positiveReinforcementGiven: true, reflectivePractice: true },
  { id: "sc-07", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-01-05", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: null, positiveReinforcementGiven: true, reflectivePractice: true },
  { id: "sc-08", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-01-15", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: false, positiveReinforcementGiven: true, reflectivePractice: true },
  { id: "sc-09", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-01-25", therapeuticApproachUsed: false, childCentredLanguage: true, warmInteractionObserved: false, boundariesMaintained: true, deEscalationUsed: null, positiveReinforcementGiven: true, reflectivePractice: true },
];

// ══════════════════════════════════════════════════════════════════════════════
// 1. pct helper
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// 2. getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Label Functions — Every Value
// ══════════════════════════════════════════════════════════════════════════════

describe("getAtmosphereIndicatorLabel", () => {
  const cases: [AtmosphereIndicator, string][] = [
    ["warmth", "Warmth"],
    ["homeliness", "Homeliness"],
    ["calm", "Calm"],
    ["safety", "Safety"],
    ["respect", "Respect"],
    ["fun", "Fun"],
    ["inclusion", "Inclusion"],
    ["privacy", "Privacy"],
    ["predictability", "Predictability"],
    ["nurture", "Nurture"],
  ];
  it.each(cases)("returns '%s' → '%s'", (value, label) => {
    expect(getAtmosphereIndicatorLabel(value)).toBe(label);
  });
});

describe("getObservationRatingLabel", () => {
  const cases: [ObservationRating, string][] = [
    ["excellent", "Excellent"],
    ["good", "Good"],
    ["adequate", "Adequate"],
    ["poor", "Poor"],
  ];
  it.each(cases)("returns '%s' → '%s'", (value, label) => {
    expect(getObservationRatingLabel(value)).toBe(label);
  });
});

describe("getObserverRoleLabel", () => {
  const cases: [ObserverRole, string][] = [
    ["reg44_visitor", "Reg 44 Visitor"],
    ["social_worker", "Social Worker"],
    ["ofsted_inspector", "Ofsted Inspector"],
    ["manager", "Manager"],
    ["independent_visitor", "Independent Visitor"],
    ["child", "Child"],
    ["staff", "Staff"],
  ];
  it.each(cases)("returns '%s' → '%s'", (value, label) => {
    expect(getObserverRoleLabel(value)).toBe(label);
  });
});

describe("getEnvironmentAreaLabel", () => {
  const cases: [EnvironmentArea, string][] = [
    ["communal_lounge", "Communal Lounge"],
    ["kitchen_dining", "Kitchen & Dining"],
    ["bedrooms", "Bedrooms"],
    ["garden_outdoor", "Garden & Outdoor"],
    ["bathrooms", "Bathrooms"],
    ["entrance_hallway", "Entrance & Hallway"],
    ["study_quiet_area", "Study & Quiet Area"],
    ["sensory_room", "Sensory Room"],
  ];
  it.each(cases)("returns '%s' → '%s'", (value, label) => {
    expect(getEnvironmentAreaLabel(value)).toBe(label);
  });
});

describe("getChildFeedbackSentimentLabel", () => {
  const cases: [ChildFeedbackSentiment, string][] = [
    ["very_positive", "Very Positive"],
    ["positive", "Positive"],
    ["neutral", "Neutral"],
    ["negative", "Negative"],
    ["very_negative", "Very Negative"],
  ];
  it.each(cases)("returns '%s' → '%s'", (value, label) => {
    expect(getChildFeedbackSentimentLabel(value)).toBe(label);
  });
});

describe("getRatingLabel", () => {
  const cases: [Rating, string][] = [
    ["outstanding", "Outstanding"],
    ["good", "Good"],
    ["requires_improvement", "Requires Improvement"],
    ["inadequate", "Inadequate"],
  ];
  it.each(cases)("returns '%s' → '%s'", (value, label) => {
    expect(getRatingLabel(value)).toBe(label);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateWarmthCulture
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateWarmthCulture", () => {
  it("returns zero scores for empty data", () => {
    const result = evaluateWarmthCulture([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalObservations).toBe(0);
    expect(result.excellentGoodRate).toBeNull();
    expect(result.warmthScore).toBe(0);
    expect(result.calmScore).toBe(0);
    expect(result.respectScore).toBe(0);
    expect(result.funScore).toBe(0);
    expect(result.nurtureScore).toBe(0);
  });

  it("counts total observations", () => {
    const result = evaluateWarmthCulture(DEMO_OBSERVATIONS);
    expect(result.totalObservations).toBe(15);
  });

  it("calculates excellent+good rate", () => {
    // All 15 are excellent or good in demo data
    const result = evaluateWarmthCulture(DEMO_OBSERVATIONS);
    expect(result.excellentGoodRate).toBe(100);
  });

  it("calculates warmth score as average numeric rating", () => {
    // obs-01: warmth excellent (100), obs-11: warmth good (75)
    // average = (100+75)/2 = 87.5, rounded = 88
    const result = evaluateWarmthCulture(DEMO_OBSERVATIONS);
    expect(result.warmthScore).toBe(88);
  });

  it("calculates calm score from calm+safety indicators", () => {
    // obs-03: calm excellent, obs-04: safety good, obs-14: calm good => all excellent/good => 100%
    const result = evaluateWarmthCulture(DEMO_OBSERVATIONS);
    expect(result.calmScore).toBe(100);
  });

  it("calculates respect score", () => {
    // obs-05: respect excellent, obs-12: respect good => 2/2 = 100%
    const result = evaluateWarmthCulture(DEMO_OBSERVATIONS);
    expect(result.respectScore).toBe(100);
  });

  it("calculates fun score", () => {
    // obs-06: fun good, obs-15: fun excellent => 2/2 = 100%
    const result = evaluateWarmthCulture(DEMO_OBSERVATIONS);
    expect(result.funScore).toBe(100);
  });

  it("calculates nurture score", () => {
    // obs-10: nurture excellent, obs-13: nurture good => 2/2 = 100%
    const result = evaluateWarmthCulture(DEMO_OBSERVATIONS);
    expect(result.nurtureScore).toBe(100);
  });

  it("calculates indicator distribution", () => {
    const result = evaluateWarmthCulture(DEMO_OBSERVATIONS);
    expect(result.indicatorDistribution.warmth).toBe(2);
    expect(result.indicatorDistribution.calm).toBe(2);
    expect(result.indicatorDistribution.respect).toBe(2);
    expect(result.indicatorDistribution.fun).toBe(2);
    expect(result.indicatorDistribution.nurture).toBe(2);
    expect(result.indicatorDistribution.homeliness).toBe(1);
    expect(result.indicatorDistribution.safety).toBe(1);
    expect(result.indicatorDistribution.inclusion).toBe(1);
    expect(result.indicatorDistribution.privacy).toBe(1);
    expect(result.indicatorDistribution.predictability).toBe(1);
  });

  it("gives perfect score (25) for all excellent data", () => {
    const perfect: AtmosphereObservation[] = [
      { id: "p1", observerRole: "manager", observationDate: "2026-01-01", indicator: "warmth", rating: "excellent", area: null, narrative: null, childrenPresent: true, timeOfDay: "morning" },
      { id: "p2", observerRole: "manager", observationDate: "2026-01-01", indicator: "calm", rating: "excellent", area: null, narrative: null, childrenPresent: true, timeOfDay: "morning" },
      { id: "p3", observerRole: "manager", observationDate: "2026-01-01", indicator: "respect", rating: "excellent", area: null, narrative: null, childrenPresent: true, timeOfDay: "morning" },
      { id: "p4", observerRole: "manager", observationDate: "2026-01-01", indicator: "fun", rating: "excellent", area: null, narrative: null, childrenPresent: true, timeOfDay: "morning" },
      { id: "p5", observerRole: "manager", observationDate: "2026-01-01", indicator: "nurture", rating: "excellent", area: null, narrative: null, childrenPresent: true, timeOfDay: "morning" },
    ];
    const result = evaluateWarmthCulture(perfect);
    expect(result.overallScore).toBe(25);
  });

  it("gives low score for all poor data", () => {
    const poor: AtmosphereObservation[] = [
      { id: "p1", observerRole: "manager", observationDate: "2026-01-01", indicator: "warmth", rating: "poor", area: null, narrative: null, childrenPresent: true, timeOfDay: "morning" },
      { id: "p2", observerRole: "manager", observationDate: "2026-01-01", indicator: "calm", rating: "poor", area: null, narrative: null, childrenPresent: true, timeOfDay: "morning" },
      { id: "p3", observerRole: "manager", observationDate: "2026-01-01", indicator: "respect", rating: "poor", area: null, narrative: null, childrenPresent: true, timeOfDay: "morning" },
      { id: "p4", observerRole: "manager", observationDate: "2026-01-01", indicator: "fun", rating: "poor", area: null, narrative: null, childrenPresent: true, timeOfDay: "morning" },
      { id: "p5", observerRole: "manager", observationDate: "2026-01-01", indicator: "nurture", rating: "poor", area: null, narrative: null, childrenPresent: true, timeOfDay: "morning" },
    ];
    const result = evaluateWarmthCulture(poor);
    expect(result.overallScore).toBeLessThan(10);
    expect(result.excellentGoodRate).toBe(0);
  });

  it("handles mixed ratings correctly", () => {
    const mixed: AtmosphereObservation[] = [
      { id: "m1", observerRole: "manager", observationDate: "2026-01-01", indicator: "warmth", rating: "excellent", area: null, narrative: null, childrenPresent: true, timeOfDay: "morning" },
      { id: "m2", observerRole: "manager", observationDate: "2026-01-01", indicator: "warmth", rating: "poor", area: null, narrative: null, childrenPresent: true, timeOfDay: "morning" },
    ];
    const result = evaluateWarmthCulture(mixed);
    expect(result.excellentGoodRate).toBe(50);
    // warmth score: (100 + 25) / 2 = 62.5 = 63 rounded
    expect(result.warmthScore).toBe(63);
  });

  it("overall score is capped at 25", () => {
    const result = evaluateWarmthCulture(DEMO_OBSERVATIONS);
    expect(result.overallScore).toBeLessThanOrEqual(25);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("handles single observation", () => {
    const single: AtmosphereObservation[] = [DEMO_OBSERVATIONS[0]];
    const result = evaluateWarmthCulture(single);
    expect(result.totalObservations).toBe(1);
    expect(result.warmthScore).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. evaluateChildExperience
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateChildExperience", () => {
  it("returns zero scores for empty data", () => {
    const result = evaluateChildExperience([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalFeedback).toBe(0);
    expect(result.positiveRate).toBeNull();
    expect(result.feelsAtHomeRate).toBeNull();
    expect(result.feelsListenedToRate).toBeNull();
    expect(result.feelsSafeRate).toBeNull();
    expect(result.hasPrivacyRate).toBeNull();
    expect(result.enjoysLivingRate).toBeNull();
    expect(result.canBeThemselvesRate).toBeNull();
  });

  it("counts total feedback", () => {
    const result = evaluateChildExperience(DEMO_FEEDBACK);
    expect(result.totalFeedback).toBe(6);
  });

  it("calculates positive rate (positive + very_positive)", () => {
    // fb-01: very_positive, fb-02: positive, fb-03: positive, fb-04: positive, fb-05: neutral, fb-06: positive
    // => 5 / 6 = 83%
    const result = evaluateChildExperience(DEMO_FEEDBACK);
    expect(result.positiveRate).toBe(83);
  });

  it("calculates feels at home rate", () => {
    // All true except fb-05 => 5/6 = 83%
    const result = evaluateChildExperience(DEMO_FEEDBACK);
    expect(result.feelsAtHomeRate).toBe(83);
  });

  it("calculates feels listened to rate", () => {
    // All true except fb-04 => 5/6 = 83%
    const result = evaluateChildExperience(DEMO_FEEDBACK);
    expect(result.feelsListenedToRate).toBe(83);
  });

  it("calculates feels safe rate", () => {
    // All true => 6/6 = 100%
    const result = evaluateChildExperience(DEMO_FEEDBACK);
    expect(result.feelsSafeRate).toBe(100);
  });

  it("calculates has privacy rate", () => {
    // All true except fb-05 => 5/6 = 83%
    const result = evaluateChildExperience(DEMO_FEEDBACK);
    expect(result.hasPrivacyRate).toBe(83);
  });

  it("calculates enjoys living rate", () => {
    // All true except fb-05 => 5/6 = 83%
    const result = evaluateChildExperience(DEMO_FEEDBACK);
    expect(result.enjoysLivingRate).toBe(83);
  });

  it("calculates can be themselves rate", () => {
    // All true => 6/6 = 100%
    const result = evaluateChildExperience(DEMO_FEEDBACK);
    expect(result.canBeThemselvesRate).toBe(100);
  });

  it("gives perfect score (25) for all positive data", () => {
    const perfect: ChildAtmosphereFeedback[] = [
      { id: "p1", childId: "c1", childName: "A", date: "2026-01-01", overallSentiment: "very_positive", feelsAtHome: true, feelsListenedTo: true, feelsSafe: true, hasPrivacy: true, enjoysLivingHere: true, canBeThemselves: true, suggestionsForImprovement: null },
    ];
    const result = evaluateChildExperience(perfect);
    expect(result.overallScore).toBe(25);
  });

  it("gives low score for all negative data", () => {
    const negative: ChildAtmosphereFeedback[] = [
      { id: "n1", childId: "c1", childName: "A", date: "2026-01-01", overallSentiment: "very_negative", feelsAtHome: false, feelsListenedTo: false, feelsSafe: false, hasPrivacy: false, enjoysLivingHere: false, canBeThemselves: false, suggestionsForImprovement: "Everything" },
    ];
    const result = evaluateChildExperience(negative);
    expect(result.overallScore).toBe(0);
    expect(result.positiveRate).toBe(0);
    expect(result.feelsSafeRate).toBe(0);
  });

  it("overall score is capped at 25", () => {
    const result = evaluateChildExperience(DEMO_FEEDBACK);
    expect(result.overallScore).toBeLessThanOrEqual(25);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("handles single feedback entry", () => {
    const single: ChildAtmosphereFeedback[] = [DEMO_FEEDBACK[0]];
    const result = evaluateChildExperience(single);
    expect(result.totalFeedback).toBe(1);
    expect(result.positiveRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. evaluateEnvironmentQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEnvironmentQuality", () => {
  it("returns zero scores for empty data", () => {
    const result = evaluateEnvironmentQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAudits).toBe(0);
    expect(result.cleanRate).toBeNull();
    expect(result.personalisedRate).toBeNull();
    expect(result.welcomingRate).toBeNull();
    expect(result.childContributedRate).toBeNull();
    expect(result.repairsActionedRate).toBeNull();
    expect(result.sensoryConsideredRate).toBeNull();
  });

  it("counts total audits", () => {
    const result = evaluateEnvironmentQuality(DEMO_AUDITS);
    expect(result.totalAudits).toBe(8);
  });

  it("calculates clean rate", () => {
    // All 8 are clean => 100%
    const result = evaluateEnvironmentQuality(DEMO_AUDITS);
    expect(result.cleanRate).toBe(100);
  });

  it("calculates personalised rate", () => {
    // ea-04 (garden) and ea-05 (bathrooms) are false => 6/8 = 75%
    const result = evaluateEnvironmentQuality(DEMO_AUDITS);
    expect(result.personalisedRate).toBe(75);
  });

  it("calculates welcoming rate", () => {
    // ea-05 (bathrooms) is false => 7/8 = 88%
    const result = evaluateEnvironmentQuality(DEMO_AUDITS);
    expect(result.welcomingRate).toBe(88);
  });

  it("calculates child contributed rate", () => {
    // ea-04 (garden) and ea-05 (bathrooms) are false => 6/8 = 75%
    const result = evaluateEnvironmentQuality(DEMO_AUDITS);
    expect(result.childContributedRate).toBe(75);
  });

  it("calculates repairs actioned rate", () => {
    // Repairs needed: ea-02, ea-04, ea-05. Actioned: ea-02 (true), ea-04 (false), ea-05 (true) => 2/3 = 67%
    const result = evaluateEnvironmentQuality(DEMO_AUDITS);
    expect(result.repairsActionedRate).toBe(67);
  });

  it("calculates sensory considered rate", () => {
    // ea-05 (bathrooms) and ea-06 (entrance) are false => 6/8 = 75%
    const result = evaluateEnvironmentQuality(DEMO_AUDITS);
    expect(result.sensoryConsideredRate).toBe(75);
  });

  it("gives perfect score for all-good data", () => {
    const perfect: EnvironmentAudit[] = [
      { id: "p1", auditDate: "2026-01-01", auditor: "Test", area: "communal_lounge", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: true, repairsNeeded: false, repairsActioned: null },
    ];
    const result = evaluateEnvironmentQuality(perfect);
    // No repairs needed => repairsActionedRate = 0 (0 of 0)
    // Score: clean 6 + personal 5 + welcome 4 + child 4 + repairs 0 + sensory 3 = 22
    expect(result.overallScore).toBe(22);
    expect(result.cleanRate).toBe(100);
  });

  it("gives zero score for all-poor data", () => {
    const poor: EnvironmentAudit[] = [
      { id: "p1", auditDate: "2026-01-01", auditor: "Test", area: "communal_lounge", clean: false, personalised: false, welcoming: false, ageAppropriate: false, sensoryConsidered: false, childContributed: false, repairsNeeded: true, repairsActioned: false },
    ];
    const result = evaluateEnvironmentQuality(poor);
    expect(result.overallScore).toBe(0);
    expect(result.cleanRate).toBe(0);
    expect(result.repairsActionedRate).toBe(0);
  });

  it("handles repairs where none needed", () => {
    const noRepairs: EnvironmentAudit[] = [
      { id: "p1", auditDate: "2026-01-01", auditor: "Test", area: "communal_lounge", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: true, repairsNeeded: false, repairsActioned: null },
    ];
    const result = evaluateEnvironmentQuality(noRepairs);
    expect(result.repairsActionedRate).toBeNull();
  });

  it("handles all repairs actioned", () => {
    const allActioned: EnvironmentAudit[] = [
      { id: "p1", auditDate: "2026-01-01", auditor: "Test", area: "communal_lounge", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: true, repairsNeeded: true, repairsActioned: true },
      { id: "p2", auditDate: "2026-01-01", auditor: "Test", area: "bedrooms", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: true, repairsNeeded: true, repairsActioned: true },
    ];
    const result = evaluateEnvironmentQuality(allActioned);
    expect(result.repairsActionedRate).toBe(100);
  });

  it("overall score is capped at 25", () => {
    const result = evaluateEnvironmentQuality(DEMO_AUDITS);
    expect(result.overallScore).toBeLessThanOrEqual(25);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. evaluateStaffPractice
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffPractice", () => {
  it("returns zero scores for empty data", () => {
    const result = evaluateStaffPractice([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.therapeuticRate).toBeNull();
    expect(result.childCentredRate).toBeNull();
    expect(result.warmInteractionRate).toBeNull();
    expect(result.positiveReinforcementRate).toBeNull();
    expect(result.reflectiveRate).toBeNull();
    expect(result.boundariesRate).toBeNull();
  });

  it("counts total records", () => {
    const result = evaluateStaffPractice(DEMO_STAFF);
    expect(result.totalRecords).toBe(9);
  });

  it("calculates therapeutic rate", () => {
    // All true except sc-09 => 8/9 = 89%
    const result = evaluateStaffPractice(DEMO_STAFF);
    expect(result.therapeuticRate).toBe(89);
  });

  it("calculates child-centred rate", () => {
    // All true => 9/9 = 100%
    const result = evaluateStaffPractice(DEMO_STAFF);
    expect(result.childCentredRate).toBe(100);
  });

  it("calculates warm interaction rate", () => {
    // All true except sc-09 => 8/9 = 89%
    const result = evaluateStaffPractice(DEMO_STAFF);
    expect(result.warmInteractionRate).toBe(89);
  });

  it("calculates positive reinforcement rate", () => {
    // All true => 9/9 = 100%
    const result = evaluateStaffPractice(DEMO_STAFF);
    expect(result.positiveReinforcementRate).toBe(100);
  });

  it("calculates reflective rate", () => {
    // All true except sc-05 => 8/9 = 89%
    const result = evaluateStaffPractice(DEMO_STAFF);
    expect(result.reflectiveRate).toBe(89);
  });

  it("calculates boundaries rate", () => {
    // All true => 9/9 = 100%
    const result = evaluateStaffPractice(DEMO_STAFF);
    expect(result.boundariesRate).toBe(100);
  });

  it("gives perfect score (25) for all-good data", () => {
    const perfect: StaffCultureRecord[] = [
      { id: "p1", staffId: "s1", staffName: "A", date: "2026-01-01", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: true, positiveReinforcementGiven: true, reflectivePractice: true },
    ];
    const result = evaluateStaffPractice(perfect);
    expect(result.overallScore).toBe(25);
  });

  it("gives zero score for all-poor data", () => {
    const poor: StaffCultureRecord[] = [
      { id: "p1", staffId: "s1", staffName: "A", date: "2026-01-01", therapeuticApproachUsed: false, childCentredLanguage: false, warmInteractionObserved: false, boundariesMaintained: false, deEscalationUsed: false, positiveReinforcementGiven: false, reflectivePractice: false },
    ];
    const result = evaluateStaffPractice(poor);
    expect(result.overallScore).toBe(0);
  });

  it("handles mixed data correctly", () => {
    const mixed: StaffCultureRecord[] = [
      { id: "m1", staffId: "s1", staffName: "A", date: "2026-01-01", therapeuticApproachUsed: true, childCentredLanguage: true, warmInteractionObserved: false, boundariesMaintained: true, deEscalationUsed: null, positiveReinforcementGiven: false, reflectivePractice: false },
      { id: "m2", staffId: "s2", staffName: "B", date: "2026-01-01", therapeuticApproachUsed: false, childCentredLanguage: false, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: true, positiveReinforcementGiven: true, reflectivePractice: true },
    ];
    const result = evaluateStaffPractice(mixed);
    expect(result.therapeuticRate).toBe(50);
    expect(result.childCentredRate).toBe(50);
    expect(result.warmInteractionRate).toBe(50);
  });

  it("overall score is capped at 25", () => {
    const result = evaluateStaffPractice(DEMO_STAFF);
    expect(result.overallScore).toBeLessThanOrEqual(25);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. buildChildAtmosphereProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildAtmosphereProfiles", () => {
  it("returns one profile per unique child", () => {
    const result = buildChildAtmosphereProfiles(DEMO_FEEDBACK);
    expect(result).toHaveLength(3);
  });

  it("populates Alex profile correctly", () => {
    const result = buildChildAtmosphereProfiles(DEMO_FEEDBACK);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex).toBeDefined();
    expect(alex!.childName).toBe("Alex");
    expect(alex!.feedbackCount).toBe(2);
    expect(alex!.positiveRate).toBe(100);
  });

  it("uses latest feedback for boolean fields", () => {
    const result = buildChildAtmosphereProfiles(DEMO_FEEDBACK);
    const morgan = result.find((p) => p.childId === "child-morgan");
    expect(morgan).toBeDefined();
    // Latest feedback (fb-06): feelsAtHome=true, feelsSafe=true
    expect(morgan!.feelsAtHome).toBe(true);
    expect(morgan!.feelsSafe).toBe(true);
  });

  it("calculates positive rate for Morgan", () => {
    const result = buildChildAtmosphereProfiles(DEMO_FEEDBACK);
    const morgan = result.find((p) => p.childId === "child-morgan");
    // fb-05: neutral, fb-06: positive => 1/2 = 50%
    expect(morgan!.positiveRate).toBe(50);
  });

  it("calculates overall score (0-10)", () => {
    const result = buildChildAtmosphereProfiles(DEMO_FEEDBACK);
    const alex = result.find((p) => p.childId === "child-alex");
    // positiveRate=100% => 4, feelsAtHome=true=>1, feelsSafe=true=>2, feelsListenedTo=true=>1, hasPrivacy=true=>1, canBeThemselves=true=>1 = 10
    expect(alex!.overallScore).toBe(10);
  });

  it("handles empty feedback", () => {
    const result = buildChildAtmosphereProfiles([]);
    expect(result).toHaveLength(0);
  });

  it("handles single feedback per child", () => {
    const single: ChildAtmosphereFeedback[] = [DEMO_FEEDBACK[0]];
    const result = buildChildAtmosphereProfiles(single);
    expect(result).toHaveLength(1);
    expect(result[0].feedbackCount).toBe(1);
  });

  it("clamps overall score to 0-10", () => {
    const result = buildChildAtmosphereProfiles(DEMO_FEEDBACK);
    for (const profile of result) {
      expect(profile.overallScore).toBeGreaterThanOrEqual(0);
      expect(profile.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it("handles child with all negative feedback", () => {
    const negative: ChildAtmosphereFeedback[] = [
      { id: "n1", childId: "c1", childName: "Test", date: "2026-01-01", overallSentiment: "very_negative", feelsAtHome: false, feelsListenedTo: false, feelsSafe: false, hasPrivacy: false, enjoysLivingHere: false, canBeThemselves: false, suggestionsForImprovement: null },
    ];
    const result = buildChildAtmosphereProfiles(negative);
    expect(result[0].positiveRate).toBe(0);
    expect(result[0].overallScore).toBe(0);
    expect(result[0].feelsAtHome).toBe(false);
    expect(result[0].feelsSafe).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. generateHomeAtmosphereEthosIntelligence — Structure
// ══════════════════════════════════════════════════════════════════════════════

describe("generateHomeAtmosphereEthosIntelligence — structure", () => {
  const result = generateHomeAtmosphereEthosIntelligence(
    DEMO_OBSERVATIONS,
    DEMO_FEEDBACK,
    DEMO_AUDITS,
    DEMO_STAFF,
    HOME_ID,
    PERIOD_START,
    PERIOD_END,
  );

  it("returns homeId", () => {
    expect(result.homeId).toBe(HOME_ID);
  });

  it("returns period dates", () => {
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("calculates overall score between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("assigns a valid rating", () => {
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes warmthCulture result", () => {
    expect(result.warmthCulture).toBeDefined();
    expect(result.warmthCulture.totalObservations).toBe(15);
  });

  it("includes childExperience result", () => {
    expect(result.childExperience).toBeDefined();
    expect(result.childExperience.totalFeedback).toBe(6);
  });

  it("includes environmentQuality result", () => {
    expect(result.environmentQuality).toBeDefined();
    expect(result.environmentQuality.totalAudits).toBe(8);
  });

  it("includes staffPractice result", () => {
    expect(result.staffPractice).toBeDefined();
    expect(result.staffPractice.totalRecords).toBe(9);
  });

  it("includes childProfiles", () => {
    expect(result.childProfiles).toHaveLength(3);
  });

  it("generates regulatory links", () => {
    expect(result.regulatoryLinks).toHaveLength(8);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. Scoring & Rating Thresholds
// ══════════════════════════════════════════════════════════════════════════════

describe("scoring and rating thresholds", () => {
  it("demo data produces a good or outstanding rating", () => {
    const result = generateHomeAtmosphereEthosIntelligence(
      DEMO_OBSERVATIONS, DEMO_FEEDBACK, DEMO_AUDITS, DEMO_STAFF,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(["outstanding", "good"]).toContain(result.rating);
  });

  it("rates inadequate with no data", () => {
    const result = generateHomeAtmosphereEthosIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("overall score is sum of four sub-domain scores, capped at 100", () => {
    const result = generateHomeAtmosphereEthosIntelligence(
      DEMO_OBSERVATIONS, DEMO_FEEDBACK, DEMO_AUDITS, DEMO_STAFF,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    const expected = result.warmthCulture.overallScore +
      result.childExperience.overallScore +
      result.environmentQuality.overallScore +
      result.staffPractice.overallScore;
    expect(result.overallScore).toBe(Math.min(100, Math.max(0, expected)));
  });

  it("each sub-domain is 0-25", () => {
    const result = generateHomeAtmosphereEthosIntelligence(
      DEMO_OBSERVATIONS, DEMO_FEEDBACK, DEMO_AUDITS, DEMO_STAFF,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.warmthCulture.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.warmthCulture.overallScore).toBeLessThanOrEqual(25);
    expect(result.childExperience.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.childExperience.overallScore).toBeLessThanOrEqual(25);
    expect(result.environmentQuality.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.environmentQuality.overallScore).toBeLessThanOrEqual(25);
    expect(result.staffPractice.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.staffPractice.overallScore).toBeLessThanOrEqual(25);
  });

  it("empty data produces all zero sub-domains", () => {
    const result = generateHomeAtmosphereEthosIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.warmthCulture.overallScore).toBe(0);
    expect(result.childExperience.overallScore).toBe(0);
    expect(result.environmentQuality.overallScore).toBe(0);
    expect(result.staffPractice.overallScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. Strengths, Areas, Actions
// ══════════════════════════════════════════════════════════════════════════════

describe("strengths, areas for improvement, and actions", () => {
  it("identifies warmth culture strength when excellent+good rate >= 80%", () => {
    const result = generateHomeAtmosphereEthosIntelligence(
      DEMO_OBSERVATIONS, DEMO_FEEDBACK, DEMO_AUDITS, DEMO_STAFF,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("warm and positive atmosphere"))).toBe(true);
  });

  it("identifies children feeling safe as strength when >= 90%", () => {
    const result = generateHomeAtmosphereEthosIntelligence(
      DEMO_OBSERVATIONS, DEMO_FEEDBACK, DEMO_AUDITS, DEMO_STAFF,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("feeling safe"))).toBe(true);
  });

  it("identifies therapeutic approaches strength", () => {
    const result = generateHomeAtmosphereEthosIntelligence(
      DEMO_OBSERVATIONS, DEMO_FEEDBACK, DEMO_AUDITS, DEMO_STAFF,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("Therapeutic approaches"))).toBe(true);
  });

  it("generates URGENT action when safety rate < 80%", () => {
    const unsafeFeedback: ChildAtmosphereFeedback[] = [
      { id: "u1", childId: "c1", childName: "A", date: "2026-01-01", overallSentiment: "negative", feelsAtHome: false, feelsListenedTo: false, feelsSafe: false, hasPrivacy: false, enjoysLivingHere: false, canBeThemselves: false, suggestionsForImprovement: null },
      { id: "u2", childId: "c2", childName: "B", date: "2026-01-01", overallSentiment: "positive", feelsAtHome: true, feelsListenedTo: true, feelsSafe: true, hasPrivacy: true, enjoysLivingHere: true, canBeThemselves: true, suggestionsForImprovement: null },
    ];
    const result = generateHomeAtmosphereEthosIntelligence(
      DEMO_OBSERVATIONS, unsafeFeedback, DEMO_AUDITS, DEMO_STAFF,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.startsWith("URGENT:"))).toBe(true);
  });

  it("generates URGENT action when atmosphere quality < 50%", () => {
    const poorObs: AtmosphereObservation[] = [
      { id: "p1", observerRole: "manager", observationDate: "2026-01-01", indicator: "warmth", rating: "poor", area: null, narrative: null, childrenPresent: true, timeOfDay: "morning" },
      { id: "p2", observerRole: "manager", observationDate: "2026-01-01", indicator: "calm", rating: "poor", area: null, narrative: null, childrenPresent: true, timeOfDay: "morning" },
      { id: "p3", observerRole: "manager", observationDate: "2026-01-01", indicator: "respect", rating: "adequate", area: null, narrative: null, childrenPresent: true, timeOfDay: "morning" },
    ];
    const result = generateHomeAtmosphereEthosIntelligence(
      poorObs, DEMO_FEEDBACK, DEMO_AUDITS, DEMO_STAFF,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("culture and ethos"))).toBe(true);
  });

  it("identifies area when children do not feel listened to", () => {
    const poorListenFeedback: ChildAtmosphereFeedback[] = [
      { id: "l1", childId: "c1", childName: "A", date: "2026-01-01", overallSentiment: "neutral", feelsAtHome: true, feelsListenedTo: false, feelsSafe: true, hasPrivacy: true, enjoysLivingHere: true, canBeThemselves: true, suggestionsForImprovement: null },
      { id: "l2", childId: "c2", childName: "B", date: "2026-01-01", overallSentiment: "neutral", feelsAtHome: true, feelsListenedTo: false, feelsSafe: true, hasPrivacy: true, enjoysLivingHere: true, canBeThemselves: true, suggestionsForImprovement: null },
    ];
    const result = generateHomeAtmosphereEthosIntelligence(
      DEMO_OBSERVATIONS, poorListenFeedback, DEMO_AUDITS, DEMO_STAFF,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement.some((a) => a.includes("listened to"))).toBe(true);
  });

  it("generates action for therapeutic training when rate < 70%", () => {
    const poorStaff: StaffCultureRecord[] = [
      { id: "s1", staffId: "s1", staffName: "A", date: "2026-01-01", therapeuticApproachUsed: false, childCentredLanguage: false, warmInteractionObserved: false, boundariesMaintained: true, deEscalationUsed: null, positiveReinforcementGiven: true, reflectivePractice: false },
      { id: "s2", staffId: "s2", staffName: "B", date: "2026-01-01", therapeuticApproachUsed: false, childCentredLanguage: false, warmInteractionObserved: true, boundariesMaintained: true, deEscalationUsed: null, positiveReinforcementGiven: true, reflectivePractice: false },
    ];
    const result = generateHomeAtmosphereEthosIntelligence(
      DEMO_OBSERVATIONS, DEMO_FEEDBACK, DEMO_AUDITS, poorStaff,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions.some((a) => a.includes("therapeutic care refresher"))).toBe(true);
  });

  it("demo data generates appropriate strengths (not empty)", () => {
    const result = generateHomeAtmosphereEthosIntelligence(
      DEMO_OBSERVATIONS, DEMO_FEEDBACK, DEMO_AUDITS, DEMO_STAFF,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("empty data generates no strengths", () => {
    const result = generateHomeAtmosphereEthosIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.strengths).toHaveLength(0);
  });

  it("empty data generates no areas for improvement", () => {
    const result = generateHomeAtmosphereEthosIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.areasForImprovement).toHaveLength(0);
  });

  it("empty data generates no actions", () => {
    const result = generateHomeAtmosphereEthosIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.actions).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. Regulatory Links
// ══════════════════════════════════════════════════════════════════════════════

describe("regulatory links", () => {
  const result = generateHomeAtmosphereEthosIntelligence(
    DEMO_OBSERVATIONS, DEMO_FEEDBACK, DEMO_AUDITS, DEMO_STAFF,
    HOME_ID, PERIOD_START, PERIOD_END,
  );

  it("includes CHR 2015 Reg 6", () => {
    expect(result.regulatoryLinks.some((r) => r.includes("Reg 6"))).toBe(true);
  });

  it("includes CHR 2015 Reg 9", () => {
    expect(result.regulatoryLinks.some((r) => r.includes("Reg 9"))).toBe(true);
  });

  it("includes SCCIF", () => {
    expect(result.regulatoryLinks.some((r) => r.includes("SCCIF"))).toBe(true);
  });

  it("includes NMS 7", () => {
    expect(result.regulatoryLinks.some((r) => r.includes("NMS 7"))).toBe(true);
  });

  it("includes UNCRC Article 12", () => {
    expect(result.regulatoryLinks.some((r) => r.includes("UNCRC Article 12"))).toBe(true);
  });

  it("includes UNCRC Article 3", () => {
    expect(result.regulatoryLinks.some((r) => r.includes("UNCRC Article 3"))).toBe(true);
  });

  it("includes CA 1989 s22(4)", () => {
    expect(result.regulatoryLinks.some((r) => r.includes("CA 1989 s22(4)"))).toBe(true);
  });

  it("includes Equality Act 2010", () => {
    expect(result.regulatoryLinks.some((r) => r.includes("Equality Act 2010"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. Period Filtering
// ══════════════════════════════════════════════════════════════════════════════

describe("period filtering", () => {
  it("filters observations outside period", () => {
    const outOfPeriod: AtmosphereObservation[] = [
      { ...DEMO_OBSERVATIONS[0], observationDate: "2025-12-15" },
    ];
    const result = generateHomeAtmosphereEthosIntelligence(
      outOfPeriod, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.warmthCulture.totalObservations).toBe(0);
  });

  it("filters feedback outside period", () => {
    const outOfPeriod: ChildAtmosphereFeedback[] = [
      { ...DEMO_FEEDBACK[0], date: "2025-12-15" },
    ];
    const result = generateHomeAtmosphereEthosIntelligence(
      [], outOfPeriod, [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.childExperience.totalFeedback).toBe(0);
  });

  it("filters audits outside period", () => {
    const outOfPeriod: EnvironmentAudit[] = [
      { ...DEMO_AUDITS[0], auditDate: "2025-12-15" },
    ];
    const result = generateHomeAtmosphereEthosIntelligence(
      [], [], outOfPeriod, [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.environmentQuality.totalAudits).toBe(0);
  });

  it("filters staff records outside period", () => {
    const outOfPeriod: StaffCultureRecord[] = [
      { ...DEMO_STAFF[0], date: "2025-12-15" },
    ];
    const result = generateHomeAtmosphereEthosIntelligence(
      [], [], [], outOfPeriod, HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.staffPractice.totalRecords).toBe(0);
  });

  it("includes boundary dates in period", () => {
    const startDate: AtmosphereObservation[] = [
      { ...DEMO_OBSERVATIONS[0], observationDate: "2026-01-01" },
    ];
    const endDate: AtmosphereObservation[] = [
      { ...DEMO_OBSERVATIONS[0], observationDate: "2026-01-31" },
    ];
    const r1 = generateHomeAtmosphereEthosIntelligence(
      startDate, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    const r2 = generateHomeAtmosphereEthosIntelligence(
      endDate, [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(r1.warmthCulture.totalObservations).toBe(1);
    expect(r2.warmthCulture.totalObservations).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. Edge Cases
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles all data from a single child", () => {
    const singleChildFeedback: ChildAtmosphereFeedback[] = [DEMO_FEEDBACK[0]];
    const result = generateHomeAtmosphereEthosIntelligence(
      DEMO_OBSERVATIONS, singleChildFeedback, DEMO_AUDITS, DEMO_STAFF,
      HOME_ID, PERIOD_START, PERIOD_END,
    );
    expect(result.childProfiles).toHaveLength(1);
    expect(result.childProfiles[0].childName).toBe("Alex");
  });

  it("handles observation with null area", () => {
    const nullArea: AtmosphereObservation[] = [
      { ...DEMO_OBSERVATIONS[0], area: null },
    ];
    const result = evaluateWarmthCulture(nullArea);
    expect(result.totalObservations).toBe(1);
  });

  it("handles observation with null narrative", () => {
    const nullNarrative: AtmosphereObservation[] = [
      { ...DEMO_OBSERVATIONS[0], narrative: null },
    ];
    const result = evaluateWarmthCulture(nullNarrative);
    expect(result.totalObservations).toBe(1);
  });

  it("handles feedback with null suggestions", () => {
    const result = evaluateChildExperience(DEMO_FEEDBACK);
    expect(result.totalFeedback).toBe(6);
  });

  it("handles staff record with null deEscalation", () => {
    const result = evaluateStaffPractice(DEMO_STAFF);
    expect(result.totalRecords).toBe(9);
  });

  it("handles large dataset without error", () => {
    const largeObs: AtmosphereObservation[] = Array.from({ length: 100 }, (_, i) => ({
      ...DEMO_OBSERVATIONS[0],
      id: `large-obs-${i}`,
      observationDate: "2026-01-15",
    }));
    const result = evaluateWarmthCulture(largeObs);
    expect(result.totalObservations).toBe(100);
  });

  it("child profile overall score is 0 for all-negative child", () => {
    const negative: ChildAtmosphereFeedback[] = [
      { id: "n1", childId: "c1", childName: "Test", date: "2026-01-01", overallSentiment: "very_negative", feelsAtHome: false, feelsListenedTo: false, feelsSafe: false, hasPrivacy: false, enjoysLivingHere: false, canBeThemselves: false, suggestionsForImprovement: null },
    ];
    const profiles = buildChildAtmosphereProfiles(negative);
    expect(profiles[0].overallScore).toBe(0);
  });

  it("child profile overall score is 10 for all-positive child", () => {
    const positive: ChildAtmosphereFeedback[] = [
      { id: "p1", childId: "c1", childName: "Test", date: "2026-01-01", overallSentiment: "very_positive", feelsAtHome: true, feelsListenedTo: true, feelsSafe: true, hasPrivacy: true, enjoysLivingHere: true, canBeThemselves: true, suggestionsForImprovement: null },
    ];
    const profiles = buildChildAtmosphereProfiles(positive);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("handles environment audit with repairs needed but not actioned", () => {
    const notActioned: EnvironmentAudit[] = [
      { id: "na1", auditDate: "2026-01-01", auditor: "Test", area: "communal_lounge", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: true, repairsNeeded: true, repairsActioned: false },
    ];
    const result = evaluateEnvironmentQuality(notActioned);
    expect(result.repairsActionedRate).toBe(0);
  });

  it("handles environment audit with repairsActioned null when needed", () => {
    const nullActioned: EnvironmentAudit[] = [
      { id: "na1", auditDate: "2026-01-01", auditor: "Test", area: "communal_lounge", clean: true, personalised: true, welcoming: true, ageAppropriate: true, sensoryConsidered: true, childContributed: true, repairsNeeded: true, repairsActioned: null },
    ];
    const result = evaluateEnvironmentQuality(nullActioned);
    expect(result.repairsActionedRate).toBe(0);
  });
});
