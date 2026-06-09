// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Sensory & Therapeutic Environment Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateChildSensoryProfiles,
  evaluateSpaceQuality,
  evaluateAdaptations,
  evaluateTherapeuticSpaceUsage,
  buildChildEnvironmentProfiles,
  generateSensoryEnvironmentIntelligence,
  getSensoryNeedLabel,
  getSpaceTypeLabel,
  getAdaptationTypeLabel,
  getPersonalisationLevelLabel,
} from "../sensory-environment-engine";
import type {
  ChildSensoryProfile,
  SpaceAssessment,
  EnvironmentalAdaptation,
  TherapeuticSpaceUsage,
  SensoryNeed,
  SpaceType,
  AdaptationType,
  PersonalisationLevel,
} from "../sensory-environment-engine";

// ── Test Constants ───────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-01-31";
const REFERENCE_DATE = "2026-02-01";
const HOME_ID = "oak-house";

const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];
const CHILD_NAMES = ["Alex", "Jordan", "Morgan"];

// ── Chamberlain House Demo Data ──────────────────────────────────────────────────────
// Alex (14): noise sensitivity, calming input
// Jordan (13): tactile sensitivity
// Morgan (15): light sensitivity

const DEMO_PROFILES: ChildSensoryProfile[] = [
  {
    id: "sp-01",
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2025-11-15",
    assessedBy: "Sarah Johnson",
    sensoryNeeds: ["noise_sensitivity", "calming_input"],
    preferences: ["Weighted blanket", "Low background music", "Dim lighting in bedroom"],
    triggers: ["Loud sudden noises", "Crowded spaces", "Multiple conversations at once"],
    calmingStrategies: ["Weighted blanket", "Noise-cancelling headphones", "Deep breathing exercises", "Quiet room access"],
    sensoryDiet: ["Morning sensory circuit", "Afternoon proprioceptive break", "Evening wind-down routine"],
    reviewDate: "2026-05-15",
  },
  {
    id: "sp-02",
    childId: "child-jordan",
    childName: "Jordan",
    assessmentDate: "2025-12-01",
    assessedBy: "Lisa Williams",
    sensoryNeeds: ["tactile_sensitivity"],
    preferences: ["Soft cotton clothing only", "Smooth textures on furniture", "No tags on clothing"],
    triggers: ["Unexpected touch", "Rough fabric textures", "Sticky or wet textures"],
    calmingStrategies: ["Fidget toys", "Tactile comfort items", "Personal space reminders to peers"],
    sensoryDiet: ["Fidget breaks during study", "Tactile play in sensory room"],
    reviewDate: "2026-06-01",
  },
  {
    id: "sp-03",
    childId: "child-morgan",
    childName: "Morgan",
    assessmentDate: "2025-10-20",
    assessedBy: "Tom Richards",
    sensoryNeeds: ["light_sensitivity", "visual_stimulation"],
    preferences: ["Adjustable lighting", "Natural daylight when possible", "Coloured LED options in bedroom"],
    triggers: ["Harsh fluorescent lighting", "Flickering lights", "Bright screens in dark rooms"],
    calmingStrategies: ["Blue-light filtering glasses", "Adjustable desk lamp", "Nature projection lamp"],
    reviewDate: "2026-04-20",
  },
];

const DEMO_ASSESSMENTS: SpaceAssessment[] = [
  {
    id: "sa-01",
    spaceType: "bedroom",
    assessmentDate: "2025-12-10",
    assessedBy: "Sarah Johnson",
    noiseLevel: "low",
    lightingQuality: "adjustable",
    temperature: "comfortable",
    personalisationLevel: "highly_personalised",
    childFriendly: true,
    sensoryConsiderations: ["Blackout curtains fitted", "Noise-reducing carpet"],
    improvementsNeeded: [],
  },
  {
    id: "sa-02",
    spaceType: "living_room",
    assessmentDate: "2025-12-10",
    assessedBy: "Sarah Johnson",
    noiseLevel: "moderate",
    lightingQuality: "adjustable",
    temperature: "comfortable",
    personalisationLevel: "moderate",
    childFriendly: true,
    sensoryConsiderations: ["Soft furnishings to reduce echo"],
    improvementsNeeded: ["Install additional soft furnishings to reduce noise further"],
  },
  {
    id: "sa-03",
    spaceType: "kitchen",
    assessmentDate: "2025-12-10",
    assessedBy: "Darren Laville",
    noiseLevel: "high",
    lightingQuality: "fixed",
    temperature: "variable",
    personalisationLevel: "basic",
    childFriendly: true,
    sensoryConsiderations: ["Extractor fan noise can be triggering"],
    improvementsNeeded: ["Fit quieter extractor fan", "Add adjustable lighting"],
  },
  {
    id: "sa-04",
    spaceType: "quiet_room",
    assessmentDate: "2025-12-10",
    assessedBy: "Lisa Williams",
    noiseLevel: "low",
    lightingQuality: "adjustable",
    temperature: "comfortable",
    personalisationLevel: "highly_personalised",
    childFriendly: true,
    sensoryConsiderations: ["Sound-proofing installed", "Dimmable lights", "Soft textures throughout"],
    improvementsNeeded: [],
  },
  {
    id: "sa-05",
    spaceType: "sensory_room",
    assessmentDate: "2025-12-10",
    assessedBy: "Tom Richards",
    noiseLevel: "low",
    lightingQuality: "adjustable",
    temperature: "comfortable",
    personalisationLevel: "highly_personalised",
    childFriendly: true,
    sensoryConsiderations: ["Bubble tube", "Fibre optics", "Weighted blankets", "Tactile wall panels"],
    improvementsNeeded: [],
  },
  {
    id: "sa-06",
    spaceType: "garden",
    assessmentDate: "2025-12-10",
    assessedBy: "Darren Laville",
    noiseLevel: "moderate",
    lightingQuality: "natural",
    temperature: "variable",
    personalisationLevel: "moderate",
    childFriendly: true,
    sensoryConsiderations: ["Outdoor sensory path", "Trampoline for vestibular input"],
    improvementsNeeded: ["Add sheltered sensory area for adverse weather"],
  },
  {
    id: "sa-07",
    spaceType: "study_space",
    assessmentDate: "2025-12-10",
    assessedBy: "Sarah Johnson",
    noiseLevel: "low",
    lightingQuality: "adjustable",
    temperature: "comfortable",
    personalisationLevel: "moderate",
    childFriendly: true,
    sensoryConsiderations: ["Individual study booths with adjustable lighting"],
    improvementsNeeded: [],
  },
  {
    id: "sa-08",
    spaceType: "bathroom",
    assessmentDate: "2025-12-10",
    assessedBy: "Sarah Johnson",
    noiseLevel: "low",
    lightingQuality: "fixed",
    temperature: "comfortable",
    personalisationLevel: "basic",
    childFriendly: true,
    sensoryConsiderations: ["Non-slip surfaces"],
    improvementsNeeded: ["Install adjustable lighting to replace harsh fixed lighting"],
  },
];

const DEMO_ADAPTATIONS: EnvironmentalAdaptation[] = [
  {
    id: "ea-01",
    childId: "child-alex",
    childName: "Alex",
    spaceType: "bedroom",
    adaptationType: "noise_reduction",
    description: "Noise-cancelling headphones provided and sound-dampening panels installed",
    implementedDate: "2025-11-20",
    reviewDate: "2026-05-20",
    status: "active",
    effectiveness: "effective",
    childFeedback: "Really helps when it gets noisy — I use them every evening",
  },
  {
    id: "ea-02",
    childId: "child-alex",
    childName: "Alex",
    spaceType: "quiet_room",
    adaptationType: "safe_space_creation",
    description: "Dedicated calm corner with weighted blanket and soft lighting",
    implementedDate: "2025-11-25",
    reviewDate: "2026-05-25",
    status: "active",
    effectiveness: "effective",
    childFeedback: "My favourite place when I need to chill out",
  },
  {
    id: "ea-03",
    childId: "child-jordan",
    childName: "Jordan",
    spaceType: "bedroom",
    adaptationType: "texture_choice",
    description: "All bedding replaced with smooth cotton, no tags, soft-touch surfaces",
    implementedDate: "2025-12-05",
    reviewDate: "2026-06-05",
    status: "active",
    effectiveness: "effective",
    childFeedback: "Much better now — I can sleep properly",
  },
  {
    id: "ea-04",
    childId: "child-jordan",
    childName: "Jordan",
    spaceType: "living_room",
    adaptationType: "equipment_provision",
    description: "Fidget toy basket available in communal area",
    implementedDate: "2025-12-10",
    reviewDate: "2026-06-10",
    status: "active",
    effectiveness: "partially_effective",
    childFeedback: "I like the fidget spinner but the others are boring",
  },
  {
    id: "ea-05",
    childId: "child-morgan",
    childName: "Morgan",
    spaceType: "bedroom",
    adaptationType: "lighting_adjustment",
    description: "Dimmable LED strip lights with colour options installed",
    implementedDate: "2025-10-25",
    reviewDate: "2026-04-25",
    status: "active",
    effectiveness: "effective",
    childFeedback: "Love the blue light setting — helps me relax before bed",
  },
  {
    id: "ea-06",
    childId: "child-morgan",
    childName: "Morgan",
    spaceType: "study_space",
    adaptationType: "lighting_adjustment",
    description: "Blue-light filter fitted on study screen and adjustable desk lamp provided",
    implementedDate: "2025-10-30",
    reviewDate: "2026-04-30",
    status: "active",
    effectiveness: "effective",
    childFeedback: "No more headaches when doing homework",
  },
  {
    id: "ea-07",
    spaceType: "kitchen",
    adaptationType: "noise_reduction",
    description: "Plan to replace extractor fan with quieter model",
    implementedDate: "2026-01-15",
    reviewDate: "2026-07-15",
    status: "planned",
    effectiveness: "not_yet_assessed",
  },
  {
    id: "ea-08",
    spaceType: "living_room",
    adaptationType: "visual_timetable",
    description: "Daily visual timetable displayed in living room for all children",
    implementedDate: "2025-09-01",
    reviewDate: "2026-03-01",
    status: "active",
    effectiveness: "effective",
  },
  {
    id: "ea-09",
    childId: "child-alex",
    childName: "Alex",
    spaceType: "sensory_room",
    adaptationType: "equipment_provision",
    description: "Weighted lap pad for sensory room use",
    implementedDate: "2025-12-15",
    reviewDate: "2026-06-15",
    status: "active",
    effectiveness: "effective",
    childFeedback: "I take it in when I need to calm down — it works",
  },
  {
    id: "ea-10",
    childId: "child-morgan",
    childName: "Morgan",
    spaceType: "bathroom",
    adaptationType: "lighting_adjustment",
    description: "Motion-activated gentle night light for bathroom visits",
    implementedDate: "2025-11-10",
    reviewDate: "2026-02-10",
    status: "needs_review",
    effectiveness: "partially_effective",
    childFeedback: "It helps but sometimes the motion sensor is too sensitive",
  },
];

const DEMO_USAGE: TherapeuticSpaceUsage[] = [
  // Alex — regular sensory room user, quiet room user
  { id: "tu-01", spaceType: "sensory_room", date: "2026-01-03", childId: "child-alex", childName: "Alex", durationMinutes: 30, purpose: "Calming after school", staffSupported: true, childResponse: "positive", notes: "Used weighted blanket and bubble tube" },
  { id: "tu-02", spaceType: "quiet_room", date: "2026-01-05", childId: "child-alex", childName: "Alex", durationMinutes: 20, purpose: "Self-regulation", staffSupported: false, childResponse: "positive" },
  { id: "tu-03", spaceType: "sensory_room", date: "2026-01-10", childId: "child-alex", childName: "Alex", durationMinutes: 45, purpose: "Anxiety management", staffSupported: true, childResponse: "positive", notes: "Extended session — was very dysregulated" },
  { id: "tu-04", spaceType: "quiet_room", date: "2026-01-14", childId: "child-alex", childName: "Alex", durationMinutes: 15, purpose: "Break from group activity", staffSupported: false, childResponse: "positive" },
  { id: "tu-05", spaceType: "sensory_room", date: "2026-01-18", childId: "child-alex", childName: "Alex", durationMinutes: 30, purpose: "Sensory diet session", staffSupported: true, childResponse: "positive" },
  { id: "tu-06", spaceType: "garden", date: "2026-01-20", childId: "child-alex", childName: "Alex", durationMinutes: 40, purpose: "Outdoor sensory path and trampoline", staffSupported: true, childResponse: "positive" },
  { id: "tu-07", spaceType: "sensory_room", date: "2026-01-25", childId: "child-alex", childName: "Alex", durationMinutes: 25, purpose: "Wind-down before bed", staffSupported: true, childResponse: "positive" },
  { id: "tu-08", spaceType: "quiet_room", date: "2026-01-28", childId: "child-alex", childName: "Alex", durationMinutes: 20, purpose: "Self-regulation after conflict", staffSupported: true, childResponse: "neutral", notes: "Took longer to settle than usual" },

  // Jordan — sensory room, activity room
  { id: "tu-09", spaceType: "sensory_room", date: "2026-01-04", childId: "child-jordan", childName: "Jordan", durationMinutes: 20, purpose: "Tactile exploration", staffSupported: true, childResponse: "positive", notes: "Enjoyed tactile wall panels" },
  { id: "tu-10", spaceType: "activity_room", date: "2026-01-08", childId: "child-jordan", childName: "Jordan", durationMinutes: 35, purpose: "Proprioceptive play", staffSupported: true, childResponse: "positive" },
  { id: "tu-11", spaceType: "sensory_room", date: "2026-01-12", childId: "child-jordan", childName: "Jordan", durationMinutes: 25, purpose: "Calming session", staffSupported: false, childResponse: "neutral" },
  { id: "tu-12", spaceType: "garden", date: "2026-01-16", childId: "child-jordan", childName: "Jordan", durationMinutes: 30, purpose: "Outdoor play", staffSupported: true, childResponse: "positive" },
  { id: "tu-13", spaceType: "sensory_room", date: "2026-01-22", childId: "child-jordan", childName: "Jordan", durationMinutes: 20, purpose: "Pre-bedtime calming", staffSupported: true, childResponse: "positive" },
  { id: "tu-14", spaceType: "activity_room", date: "2026-01-27", childId: "child-jordan", childName: "Jordan", durationMinutes: 40, purpose: "Movement and gross motor activity", staffSupported: true, childResponse: "positive" },

  // Morgan — quiet room, sensory room (light-focused)
  { id: "tu-15", spaceType: "quiet_room", date: "2026-01-02", childId: "child-morgan", childName: "Morgan", durationMinutes: 25, purpose: "Reading in gentle lighting", staffSupported: false, childResponse: "positive" },
  { id: "tu-16", spaceType: "sensory_room", date: "2026-01-07", childId: "child-morgan", childName: "Morgan", durationMinutes: 30, purpose: "Light therapy session", staffSupported: true, childResponse: "positive" },
  { id: "tu-17", spaceType: "quiet_room", date: "2026-01-11", childId: "child-morgan", childName: "Morgan", durationMinutes: 15, purpose: "Headache recovery — low light", staffSupported: false, childResponse: "neutral" },
  { id: "tu-18", spaceType: "sensory_room", date: "2026-01-15", childId: "child-morgan", childName: "Morgan", durationMinutes: 35, purpose: "Fibre optic and bubble tube relaxation", staffSupported: true, childResponse: "positive" },
  { id: "tu-19", spaceType: "garden", date: "2026-01-19", childId: "child-morgan", childName: "Morgan", durationMinutes: 45, purpose: "Natural light exposure and outdoor activity", staffSupported: true, childResponse: "positive" },
  { id: "tu-20", spaceType: "sensory_room", date: "2026-01-24", childId: "child-morgan", childName: "Morgan", durationMinutes: 20, purpose: "Evening wind-down", staffSupported: true, childResponse: "positive" },
  { id: "tu-21", spaceType: "quiet_room", date: "2026-01-30", childId: "child-morgan", childName: "Morgan", durationMinutes: 20, purpose: "Self-regulation", staffSupported: false, childResponse: "positive" },

  // Out-of-period record (should be filtered)
  { id: "tu-22", spaceType: "sensory_room", date: "2025-12-15", childId: "child-alex", childName: "Alex", durationMinutes: 30, purpose: "December session", staffSupported: true, childResponse: "positive" },
];

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateChildSensoryProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateChildSensoryProfiles", () => {
  it("returns 100% coverage when all children have profiles", () => {
    const result = evaluateChildSensoryProfiles(DEMO_PROFILES, CHILD_IDS);
    expect(result.coverageRate).toBe(100);
  });

  it("identifies unprofiled children correctly", () => {
    const result = evaluateChildSensoryProfiles(DEMO_PROFILES, CHILD_IDS);
    expect(result.unprofiledChildIds).toEqual([]);
    expect(result.profiledChildIds).toHaveLength(3);
  });

  it("calculates average needs per child", () => {
    // Alex: 2, Jordan: 1, Morgan: 2 => avg = 5/3 = 1.7
    const result = evaluateChildSensoryProfiles(DEMO_PROFILES, CHILD_IDS);
    expect(result.averageNeedsPerChild).toBe(1.7);
  });

  it("calculates trigger documentation rate", () => {
    // All 3 have triggers
    const result = evaluateChildSensoryProfiles(DEMO_PROFILES, CHILD_IDS);
    expect(result.triggerDocumentationRate).toBe(100);
  });

  it("calculates calming strategy documentation rate", () => {
    const result = evaluateChildSensoryProfiles(DEMO_PROFILES, CHILD_IDS);
    expect(result.calmingStrategyDocumentationRate).toBe(100);
  });

  it("calculates sensory diet rate", () => {
    // Alex and Jordan have sensory diets, Morgan does not
    const result = evaluateChildSensoryProfiles(DEMO_PROFILES, CHILD_IDS);
    expect(result.sensoryDietRate).toBe(67);
  });

  it("handles partial coverage", () => {
    const partial = DEMO_PROFILES.slice(0, 1); // only Alex
    const result = evaluateChildSensoryProfiles(partial, CHILD_IDS);
    expect(result.coverageRate).toBe(33);
    expect(result.unprofiledChildIds).toEqual(["child-jordan", "child-morgan"]);
  });

  it("handles empty profiles array", () => {
    const result = evaluateChildSensoryProfiles([], CHILD_IDS);
    expect(result.coverageRate).toBe(0);
    expect(result.averageNeedsPerChild).toBe(0);
    expect(result.triggerDocumentationRate).toBe(0);
    expect(result.calmingStrategyDocumentationRate).toBe(0);
    expect(result.sensoryDietRate).toBe(0);
  });

  it("handles empty child IDs array", () => {
    const result = evaluateChildSensoryProfiles(DEMO_PROFILES, []);
    expect(result.coverageRate).toBe(0);
    expect(result.unprofiledChildIds).toEqual([]);
  });

  it("handles profiles with no triggers", () => {
    const noTriggers: ChildSensoryProfile[] = [
      { ...DEMO_PROFILES[0], triggers: [] },
      { ...DEMO_PROFILES[1], triggers: [] },
    ];
    const result = evaluateChildSensoryProfiles(noTriggers, CHILD_IDS.slice(0, 2));
    expect(result.triggerDocumentationRate).toBe(0);
  });

  it("handles profiles with no calming strategies", () => {
    const noCalming: ChildSensoryProfile[] = [
      { ...DEMO_PROFILES[0], calmingStrategies: [] },
    ];
    const result = evaluateChildSensoryProfiles(noCalming, ["child-alex"]);
    expect(result.calmingStrategyDocumentationRate).toBe(0);
  });

  it("handles profiles with no sensory diet", () => {
    const noDiet: ChildSensoryProfile[] = [
      { ...DEMO_PROFILES[0], sensoryDiet: undefined },
    ];
    const result = evaluateChildSensoryProfiles(noDiet, ["child-alex"]);
    expect(result.sensoryDietRate).toBe(0);
  });

  it("handles profiles with empty sensory diet", () => {
    const emptyDiet: ChildSensoryProfile[] = [
      { ...DEMO_PROFILES[0], sensoryDiet: [] },
    ];
    const result = evaluateChildSensoryProfiles(emptyDiet, ["child-alex"]);
    expect(result.sensoryDietRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluateSpaceQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSpaceQuality", () => {
  it("counts assessed spaces correctly", () => {
    const result = evaluateSpaceQuality(DEMO_ASSESSMENTS);
    expect(result.spacesAssessed).toBe(8);
  });

  it("calculates personalisation rate", () => {
    // highly_personalised: bedroom, quiet_room, sensory_room = 3
    // moderate: living_room, garden, study_space = 3
    // basic: kitchen, bathroom = 2
    // => 6 out of 8 = 75%
    const result = evaluateSpaceQuality(DEMO_ASSESSMENTS);
    expect(result.personalisationRate).toBe(75);
  });

  it("calculates child-friendly rate", () => {
    // All 8 are child-friendly
    const result = evaluateSpaceQuality(DEMO_ASSESSMENTS);
    expect(result.childFriendlyRate).toBe(100);
  });

  it("calculates noise quality", () => {
    // low: bedroom, quiet_room, sensory_room, study_space, bathroom = 5
    // moderate: living_room, garden = 2
    // high: kitchen = 1
    // => 5/8 = 63%
    const result = evaluateSpaceQuality(DEMO_ASSESSMENTS);
    expect(result.noiseQuality).toBe(63);
  });

  it("calculates lighting quality", () => {
    // natural: garden = 1
    // adjustable: bedroom, living_room, quiet_room, sensory_room, study_space = 5
    // fixed: kitchen, bathroom = 2
    // => 6/8 = 75%
    const result = evaluateSpaceQuality(DEMO_ASSESSMENTS);
    expect(result.lightingQuality).toBe(75);
  });

  it("calculates temperature quality", () => {
    // comfortable: bedroom, living_room, quiet_room, sensory_room, study_space, bathroom = 6
    // variable: kitchen, garden = 2
    // => 6/8 = 75%
    const result = evaluateSpaceQuality(DEMO_ASSESSMENTS);
    expect(result.temperatureQuality).toBe(75);
  });

  it("counts improvement backlog", () => {
    // living_room: 1, kitchen: 2, garden: 1, bathroom: 1 = 5
    const result = evaluateSpaceQuality(DEMO_ASSESSMENTS);
    expect(result.improvementBacklog).toBe(5);
  });

  it("handles empty assessments", () => {
    const result = evaluateSpaceQuality([]);
    expect(result.spacesAssessed).toBe(0);
    expect(result.personalisationRate).toBe(0);
    expect(result.childFriendlyRate).toBe(0);
    expect(result.noiseQuality).toBe(0);
    expect(result.lightingQuality).toBe(0);
    expect(result.temperatureQuality).toBe(0);
    expect(result.improvementBacklog).toBe(0);
  });

  it("handles a single perfect assessment", () => {
    const perfect: SpaceAssessment[] = [{
      id: "sa-x",
      spaceType: "sensory_room",
      assessmentDate: "2025-12-01",
      assessedBy: "Test",
      noiseLevel: "low",
      lightingQuality: "adjustable",
      temperature: "comfortable",
      personalisationLevel: "highly_personalised",
      childFriendly: true,
      sensoryConsiderations: [],
      improvementsNeeded: [],
    }];
    const result = evaluateSpaceQuality(perfect);
    expect(result.personalisationRate).toBe(100);
    expect(result.childFriendlyRate).toBe(100);
    expect(result.noiseQuality).toBe(100);
    expect(result.lightingQuality).toBe(100);
    expect(result.temperatureQuality).toBe(100);
    expect(result.improvementBacklog).toBe(0);
  });

  it("handles worst-case assessment", () => {
    const worst: SpaceAssessment[] = [{
      id: "sa-y",
      spaceType: "kitchen",
      assessmentDate: "2025-12-01",
      assessedBy: "Test",
      noiseLevel: "high",
      lightingQuality: "harsh",
      temperature: "uncomfortable",
      personalisationLevel: "not_personalised",
      childFriendly: false,
      sensoryConsiderations: [],
      improvementsNeeded: ["Fix everything"],
    }];
    const result = evaluateSpaceQuality(worst);
    expect(result.personalisationRate).toBe(0);
    expect(result.childFriendlyRate).toBe(0);
    expect(result.noiseQuality).toBe(0);
    expect(result.lightingQuality).toBe(0);
    expect(result.temperatureQuality).toBe(0);
    expect(result.improvementBacklog).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateAdaptations
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAdaptations", () => {
  it("counts total adaptations", () => {
    const result = evaluateAdaptations(DEMO_ADAPTATIONS);
    expect(result.adaptationCount).toBe(10);
  });

  it("counts active adaptations", () => {
    // ea-01 through ea-06, ea-08, ea-09 = 8 active
    const result = evaluateAdaptations(DEMO_ADAPTATIONS);
    expect(result.activeAdaptations).toBe(8);
  });

  it("counts planned adaptations", () => {
    // ea-07 = 1 planned
    const result = evaluateAdaptations(DEMO_ADAPTATIONS);
    expect(result.plannedAdaptations).toBe(1);
  });

  it("counts needs-review adaptations", () => {
    // ea-10 = 1 needs review
    const result = evaluateAdaptations(DEMO_ADAPTATIONS);
    expect(result.needsReviewCount).toBe(1);
  });

  it("calculates effectiveness rate", () => {
    // Assessed: 9 (all except ea-07 which is not_yet_assessed)
    // Effective or partially: ea-01(e), ea-02(e), ea-03(e), ea-04(pe), ea-05(e), ea-06(e), ea-08(e), ea-09(e), ea-10(pe) = 9
    // => 9/9 = 100%
    const result = evaluateAdaptations(DEMO_ADAPTATIONS);
    expect(result.effectivenessRate).toBe(100);
  });

  it("calculates child-specific rate", () => {
    // ea-01 to ea-06, ea-09, ea-10 have childId (8) ; ea-07, ea-08 do not (2)
    // => 8/10 = 80%
    const result = evaluateAdaptations(DEMO_ADAPTATIONS);
    expect(result.childSpecificRate).toBe(80);
  });

  it("calculates review currency", () => {
    // needs_review: ea-10 = 1. All others NOT needs_review = 9
    // => 9/10 = 90%
    const result = evaluateAdaptations(DEMO_ADAPTATIONS);
    expect(result.reviewCurrency).toBe(90);
  });

  it("calculates child feedback capture rate", () => {
    // With feedback: ea-01, ea-02, ea-03, ea-04, ea-05, ea-06, ea-09, ea-10 = 8
    // Without: ea-07, ea-08 = 2
    // => 8/10 = 80%
    const result = evaluateAdaptations(DEMO_ADAPTATIONS);
    expect(result.childFeedbackCaptureRate).toBe(80);
  });

  it("handles empty adaptations", () => {
    const result = evaluateAdaptations([]);
    expect(result.adaptationCount).toBe(0);
    expect(result.effectivenessRate).toBe(0);
    expect(result.childSpecificRate).toBe(0);
    expect(result.reviewCurrency).toBe(0);
    expect(result.childFeedbackCaptureRate).toBe(0);
    expect(result.activeAdaptations).toBe(0);
    expect(result.plannedAdaptations).toBe(0);
    expect(result.needsReviewCount).toBe(0);
  });

  it("handles all ineffective adaptations", () => {
    const ineffective: EnvironmentalAdaptation[] = [
      { ...DEMO_ADAPTATIONS[0], effectiveness: "ineffective" },
      { ...DEMO_ADAPTATIONS[1], effectiveness: "ineffective" },
    ];
    const result = evaluateAdaptations(ineffective);
    expect(result.effectivenessRate).toBe(0);
  });

  it("handles all not-yet-assessed adaptations", () => {
    const notAssessed: EnvironmentalAdaptation[] = [
      { ...DEMO_ADAPTATIONS[0], effectiveness: "not_yet_assessed" },
    ];
    const result = evaluateAdaptations(notAssessed);
    // No assessed adaptations, so effectivenessRate = 0 (0/0)
    expect(result.effectivenessRate).toBe(0);
  });

  it("handles adaptations with no child feedback", () => {
    const noFeedback: EnvironmentalAdaptation[] = [
      { ...DEMO_ADAPTATIONS[0], childFeedback: undefined },
      { ...DEMO_ADAPTATIONS[1], childFeedback: "" },
    ];
    const result = evaluateAdaptations(noFeedback);
    expect(result.childFeedbackCaptureRate).toBe(0);
  });

  it("handles adaptations with no childId", () => {
    const noChild: EnvironmentalAdaptation[] = [
      { ...DEMO_ADAPTATIONS[0], childId: undefined },
      { ...DEMO_ADAPTATIONS[1], childId: "" },
    ];
    const result = evaluateAdaptations(noChild);
    expect(result.childSpecificRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateTherapeuticSpaceUsage
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateTherapeuticSpaceUsage", () => {
  // Use only in-period usage records (exclude tu-22)
  const periodUsage = DEMO_USAGE.filter(
    (u) => u.date >= PERIOD_START && u.date <= PERIOD_END,
  );

  it("counts usage frequency", () => {
    const result = evaluateTherapeuticSpaceUsage(periodUsage);
    expect(result.usageFrequency).toBe(21);
  });

  it("counts space variety", () => {
    // sensory_room, quiet_room, garden, activity_room = 4
    const result = evaluateTherapeuticSpaceUsage(periodUsage);
    expect(result.spaceVariety).toBe(4);
  });

  it("calculates positive response rate", () => {
    // Count positives in periodUsage
    const positives = periodUsage.filter((u) => u.childResponse === "positive").length;
    const expected = Math.round((positives / 21) * 100);
    const result = evaluateTherapeuticSpaceUsage(periodUsage);
    expect(result.positiveResponseRate).toBe(expected);
  });

  it("calculates staff support rate", () => {
    const staffSupported = periodUsage.filter((u) => u.staffSupported).length;
    const expected = Math.round((staffSupported / 21) * 100);
    const result = evaluateTherapeuticSpaceUsage(periodUsage);
    expect(result.staffSupportRate).toBe(expected);
  });

  it("generates per-child engagement data", () => {
    const result = evaluateTherapeuticSpaceUsage(periodUsage);
    expect(result.perChildEngagement).toHaveLength(3);
  });

  it("calculates Alex engagement correctly", () => {
    const result = evaluateTherapeuticSpaceUsage(periodUsage);
    const alex = result.perChildEngagement.find((c) => c.childId === "child-alex");
    expect(alex).toBeDefined();
    expect(alex!.usageCount).toBe(8);
    expect(alex!.childName).toBe("Alex");
  });

  it("calculates Jordan engagement correctly", () => {
    const result = evaluateTherapeuticSpaceUsage(periodUsage);
    const jordan = result.perChildEngagement.find((c) => c.childId === "child-jordan");
    expect(jordan).toBeDefined();
    expect(jordan!.usageCount).toBe(6);
  });

  it("calculates Morgan engagement correctly", () => {
    const result = evaluateTherapeuticSpaceUsage(periodUsage);
    const morgan = result.perChildEngagement.find((c) => c.childId === "child-morgan");
    expect(morgan).toBeDefined();
    expect(morgan!.usageCount).toBe(7);
  });

  it("calculates per-child total minutes", () => {
    const result = evaluateTherapeuticSpaceUsage(periodUsage);
    const alex = result.perChildEngagement.find((c) => c.childId === "child-alex");
    // 30 + 20 + 45 + 15 + 30 + 40 + 25 + 20 = 225
    expect(alex!.totalMinutes).toBe(225);
  });

  it("calculates per-child positive rate", () => {
    const result = evaluateTherapeuticSpaceUsage(periodUsage);
    const alex = result.perChildEngagement.find((c) => c.childId === "child-alex");
    // Alex: 7 positive, 1 neutral out of 8 = 88% (rounds to 88)
    expect(alex!.positiveRate).toBe(88);
  });

  it("handles empty usage", () => {
    const result = evaluateTherapeuticSpaceUsage([]);
    expect(result.usageFrequency).toBe(0);
    expect(result.spaceVariety).toBe(0);
    expect(result.positiveResponseRate).toBe(0);
    expect(result.staffSupportRate).toBe(0);
    expect(result.perChildEngagement).toEqual([]);
  });

  it("handles all distressed responses", () => {
    const distressed: TherapeuticSpaceUsage[] = [
      { ...periodUsage[0], childResponse: "distressed" },
      { ...periodUsage[1], childResponse: "distressed" },
    ];
    const result = evaluateTherapeuticSpaceUsage(distressed);
    expect(result.positiveResponseRate).toBe(0);
  });

  it("handles single usage record", () => {
    const single: TherapeuticSpaceUsage[] = [periodUsage[0]];
    const result = evaluateTherapeuticSpaceUsage(single);
    expect(result.usageFrequency).toBe(1);
    expect(result.spaceVariety).toBe(1);
    expect(result.perChildEngagement).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. buildChildEnvironmentProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildEnvironmentProfiles", () => {
  const periodUsage = DEMO_USAGE.filter(
    (u) => u.date >= PERIOD_START && u.date <= PERIOD_END,
  );

  it("returns a profile for each child", () => {
    const result = buildChildEnvironmentProfiles(
      DEMO_PROFILES, DEMO_ADAPTATIONS, periodUsage, CHILD_IDS, CHILD_NAMES,
    );
    expect(result).toHaveLength(3);
  });

  it("populates Alex sensory needs", () => {
    const result = buildChildEnvironmentProfiles(
      DEMO_PROFILES, DEMO_ADAPTATIONS, periodUsage, CHILD_IDS, CHILD_NAMES,
    );
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.sensoryNeeds).toEqual(["noise_sensitivity", "calming_input"]);
  });

  it("populates Jordan preferences", () => {
    const result = buildChildEnvironmentProfiles(
      DEMO_PROFILES, DEMO_ADAPTATIONS, periodUsage, CHILD_IDS, CHILD_NAMES,
    );
    const jordan = result.find((p) => p.childId === "child-jordan");
    expect(jordan!.preferences).toContain("Soft cotton clothing only");
  });

  it("populates Morgan triggers", () => {
    const result = buildChildEnvironmentProfiles(
      DEMO_PROFILES, DEMO_ADAPTATIONS, periodUsage, CHILD_IDS, CHILD_NAMES,
    );
    const morgan = result.find((p) => p.childId === "child-morgan");
    expect(morgan!.triggers).toContain("Harsh fluorescent lighting");
  });

  it("correctly identifies children with sensory diets", () => {
    const result = buildChildEnvironmentProfiles(
      DEMO_PROFILES, DEMO_ADAPTATIONS, periodUsage, CHILD_IDS, CHILD_NAMES,
    );
    const alex = result.find((p) => p.childId === "child-alex");
    const jordan = result.find((p) => p.childId === "child-jordan");
    const morgan = result.find((p) => p.childId === "child-morgan");
    expect(alex!.hasSensoryDiet).toBe(true);
    expect(jordan!.hasSensoryDiet).toBe(true);
    expect(morgan!.hasSensoryDiet).toBe(false);
  });

  it("counts active adaptations per child", () => {
    const result = buildChildEnvironmentProfiles(
      DEMO_PROFILES, DEMO_ADAPTATIONS, periodUsage, CHILD_IDS, CHILD_NAMES,
    );
    const alex = result.find((p) => p.childId === "child-alex");
    // Alex active adaptations: ea-01, ea-02, ea-09 = 3
    expect(alex!.adaptationsInPlace).toBe(3);
  });

  it("counts effective adaptations per child", () => {
    const result = buildChildEnvironmentProfiles(
      DEMO_PROFILES, DEMO_ADAPTATIONS, periodUsage, CHILD_IDS, CHILD_NAMES,
    );
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.effectiveAdaptations).toBe(3);
  });

  it("calculates space usage count per child", () => {
    const result = buildChildEnvironmentProfiles(
      DEMO_PROFILES, DEMO_ADAPTATIONS, periodUsage, CHILD_IDS, CHILD_NAMES,
    );
    const jordan = result.find((p) => p.childId === "child-jordan");
    expect(jordan!.spaceUsageCount).toBe(6);
  });

  it("calculates total space minutes per child", () => {
    const result = buildChildEnvironmentProfiles(
      DEMO_PROFILES, DEMO_ADAPTATIONS, periodUsage, CHILD_IDS, CHILD_NAMES,
    );
    const morgan = result.find((p) => p.childId === "child-morgan");
    // 25 + 30 + 15 + 35 + 45 + 20 + 20 = 190
    expect(morgan!.totalSpaceMinutes).toBe(190);
  });

  it("calculates positive response rate per child", () => {
    const result = buildChildEnvironmentProfiles(
      DEMO_PROFILES, DEMO_ADAPTATIONS, periodUsage, CHILD_IDS, CHILD_NAMES,
    );
    const morgan = result.find((p) => p.childId === "child-morgan");
    // Morgan: 6 positive, 1 neutral out of 7 = 86%
    expect(morgan!.positiveResponseRate).toBe(86);
  });

  it("calculates environmental comfort score for a well-supported child", () => {
    const result = buildChildEnvironmentProfiles(
      DEMO_PROFILES, DEMO_ADAPTATIONS, periodUsage, CHILD_IDS, CHILD_NAMES,
    );
    const alex = result.find((p) => p.childId === "child-alex");
    // Alex: profile (20) + adaptations 3/3*20=20 + effective 3/3*20=20 + usage 8/5*20=min(20,32)=20 + positive 88/100*20=18 = 98
    expect(alex!.environmentalComfortScore).toBe(98);
  });

  it("handles child with no profile", () => {
    const result = buildChildEnvironmentProfiles(
      [], DEMO_ADAPTATIONS, periodUsage, ["child-unknown"], ["Unknown"],
    );
    expect(result[0].sensoryNeeds).toEqual([]);
    expect(result[0].hasSensoryDiet).toBe(false);
    expect(result[0].environmentalComfortScore).toBeLessThanOrEqual(100);
  });

  it("handles child with no adaptations or usage", () => {
    const result = buildChildEnvironmentProfiles(
      DEMO_PROFILES, [], [], CHILD_IDS, CHILD_NAMES,
    );
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.adaptationsInPlace).toBe(0);
    expect(alex!.spaceUsageCount).toBe(0);
    // Only has profile (20), rest is 0
    expect(alex!.environmentalComfortScore).toBe(20);
  });

  it("assigns correct child name even if not found in profiles", () => {
    const result = buildChildEnvironmentProfiles(
      [], [], [], ["child-new"], ["New Child"],
    );
    expect(result[0].childName).toBe("New Child");
  });

  it("clamps environmental comfort score to 0-100 range", () => {
    const result = buildChildEnvironmentProfiles(
      DEMO_PROFILES, DEMO_ADAPTATIONS, periodUsage, CHILD_IDS, CHILD_NAMES,
    );
    for (const profile of result) {
      expect(profile.environmentalComfortScore).toBeGreaterThanOrEqual(0);
      expect(profile.environmentalComfortScore).toBeLessThanOrEqual(100);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateSensoryEnvironmentIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateSensoryEnvironmentIntelligence", () => {
  const result = generateSensoryEnvironmentIntelligence(
    DEMO_PROFILES,
    DEMO_ASSESSMENTS,
    DEMO_ADAPTATIONS,
    DEMO_USAGE,
    CHILD_IDS,
    CHILD_NAMES,
    HOME_ID,
    PERIOD_START,
    PERIOD_END,
    REFERENCE_DATE,
  );

  it("returns homeId", () => {
    expect(result.homeId).toBe(HOME_ID);
  });

  it("returns period dates", () => {
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.referenceDate).toBe(REFERENCE_DATE);
  });

  it("calculates overall score between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("assigns a valid rating", () => {
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes sensory profiling results", () => {
    expect(result.sensoryProfiling).toBeDefined();
    expect(result.sensoryProfiling.coverageRate).toBe(100);
  });

  it("includes space quality results", () => {
    expect(result.spaceQuality).toBeDefined();
    expect(result.spaceQuality.spacesAssessed).toBe(8);
  });

  it("includes adaptations results", () => {
    expect(result.adaptations).toBeDefined();
    expect(result.adaptations.adaptationCount).toBe(10);
  });

  it("includes therapeutic usage results", () => {
    expect(result.therapeuticUsage).toBeDefined();
    expect(result.therapeuticUsage.usageFrequency).toBeGreaterThan(0);
  });

  it("includes child profiles", () => {
    expect(result.childProfiles).toHaveLength(3);
  });

  it("generates at least one strength", () => {
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates regulatory links", () => {
    expect(result.regulatoryLinks).toHaveLength(5);
  });

  it("regulatory links reference CHR 2015 Reg 6", () => {
    expect(result.regulatoryLinks.some((r) => r.includes("Reg 6"))).toBe(true);
  });

  it("regulatory links reference CHR 2015 Reg 25", () => {
    expect(result.regulatoryLinks.some((r) => r.includes("Reg 25"))).toBe(true);
  });

  it("regulatory links reference SCCIF", () => {
    expect(result.regulatoryLinks.some((r) => r.includes("SCCIF"))).toBe(true);
  });

  it("regulatory links reference NICE CG128", () => {
    expect(result.regulatoryLinks.some((r) => r.includes("NICE CG128"))).toBe(true);
  });

  it("regulatory links reference UNCRC Article 31", () => {
    expect(result.regulatoryLinks.some((r) => r.includes("UNCRC Article 31"))).toBe(true);
  });

  it("filters usage to period (excludes out-of-period records)", () => {
    // tu-22 is December 2025, so period usage should be 21
    expect(result.therapeuticUsage.usageFrequency).toBe(21);
  });

  it("generates actions list when improvements needed", () => {
    // With demo data, some actions should be generated (e.g., sensory diet < 80%)
    expect(result.actions).toBeDefined();
    expect(Array.isArray(result.actions)).toBe(true);
  });

  it("generates areas for improvement list", () => {
    expect(result.areasForImprovement).toBeDefined();
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Scoring & Rating
// ══════════════════════════════════════════════════════════════════════════════

describe("scoring and rating", () => {
  it("rates outstanding when score >= 80", () => {
    const result = generateSensoryEnvironmentIntelligence(
      DEMO_PROFILES, DEMO_ASSESSMENTS, DEMO_ADAPTATIONS, DEMO_USAGE,
      CHILD_IDS, CHILD_NAMES, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    if (result.overallScore >= 80) {
      expect(result.rating).toBe("outstanding");
    }
  });

  it("rates inadequate with no data", () => {
    const result = generateSensoryEnvironmentIntelligence(
      [], [], [], [], CHILD_IDS, CHILD_NAMES, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("rates requires_improvement with minimal data", () => {
    const minimal: ChildSensoryProfile[] = [DEMO_PROFILES[0]];
    const minAdapt: EnvironmentalAdaptation[] = [DEMO_ADAPTATIONS[0]];
    const minUsage: TherapeuticSpaceUsage[] = [DEMO_USAGE[0]];
    const result = generateSensoryEnvironmentIntelligence(
      minimal, DEMO_ASSESSMENTS.slice(0, 2), minAdapt, minUsage,
      CHILD_IDS, CHILD_NAMES, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(80);
  });

  it("score is sum of four components capped at 100", () => {
    const result = generateSensoryEnvironmentIntelligence(
      DEMO_PROFILES, DEMO_ASSESSMENTS, DEMO_ADAPTATIONS, DEMO_USAGE,
      CHILD_IDS, CHILD_NAMES, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("all empty children still produces valid output", () => {
    const result = generateSensoryEnvironmentIntelligence(
      [], [], [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.childProfiles).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Strengths & Areas Logic
// ══════════════════════════════════════════════════════════════════════════════

describe("strengths and areas for improvement logic", () => {
  it("identifies strength when all children profiled", () => {
    const result = generateSensoryEnvironmentIntelligence(
      DEMO_PROFILES, DEMO_ASSESSMENTS, DEMO_ADAPTATIONS, DEMO_USAGE,
      CHILD_IDS, CHILD_NAMES, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some((s) => s.includes("sensory profiles"))).toBe(true);
  });

  it("identifies area when child not profiled", () => {
    const result = generateSensoryEnvironmentIntelligence(
      DEMO_PROFILES.slice(0, 1), DEMO_ASSESSMENTS, DEMO_ADAPTATIONS, DEMO_USAGE,
      CHILD_IDS, CHILD_NAMES, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.areasForImprovement.some((a) => a.includes("lack sensory profiles"))).toBe(true);
  });

  it("generates action for incomplete sensory profiles", () => {
    const result = generateSensoryEnvironmentIntelligence(
      DEMO_PROFILES.slice(0, 1), DEMO_ASSESSMENTS, DEMO_ADAPTATIONS, DEMO_USAGE,
      CHILD_IDS, CHILD_NAMES, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("unprofiled"))).toBe(true);
  });

  it("generates action for improvement backlog", () => {
    const result = generateSensoryEnvironmentIntelligence(
      DEMO_PROFILES, DEMO_ASSESSMENTS, DEMO_ADAPTATIONS, DEMO_USAGE,
      CHILD_IDS, CHILD_NAMES, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    // DEMO_ASSESSMENTS has 5 improvements in backlog
    expect(result.actions.some((a) => a.includes("pending space improvements"))).toBe(true);
  });

  it("generates action for adaptation reviews", () => {
    const result = generateSensoryEnvironmentIntelligence(
      DEMO_PROFILES, DEMO_ASSESSMENTS, DEMO_ADAPTATIONS, DEMO_USAGE,
      CHILD_IDS, CHILD_NAMES, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.actions.some((a) => a.includes("adaptation reviews"))).toBe(true);
  });

  it("identifies calming strategy strength when >= 80%", () => {
    const result = generateSensoryEnvironmentIntelligence(
      DEMO_PROFILES, DEMO_ASSESSMENTS, DEMO_ADAPTATIONS, DEMO_USAGE,
      CHILD_IDS, CHILD_NAMES, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some((s) => s.includes("Calming strategies"))).toBe(true);
  });

  it("identifies adaptation effectiveness strength when >= 80%", () => {
    const result = generateSensoryEnvironmentIntelligence(
      DEMO_PROFILES, DEMO_ASSESSMENTS, DEMO_ADAPTATIONS, DEMO_USAGE,
      CHILD_IDS, CHILD_NAMES, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some((s) => s.includes("adaptations are largely effective"))).toBe(true);
  });

  it("identifies positive response strength when >= 80%", () => {
    const result = generateSensoryEnvironmentIntelligence(
      DEMO_PROFILES, DEMO_ASSESSMENTS, DEMO_ADAPTATIONS, DEMO_USAGE,
      CHILD_IDS, CHILD_NAMES, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    const positives = DEMO_USAGE.filter(
      (u) => u.date >= PERIOD_START && u.date <= PERIOD_END && u.childResponse === "positive",
    ).length;
    const rate = Math.round((positives / 21) * 100);
    if (rate >= 80) {
      expect(result.strengths.some((s) => s.includes("respond positively"))).toBe(true);
    }
  });

  it("identifies child feedback strength when >= 70%", () => {
    const result = generateSensoryEnvironmentIntelligence(
      DEMO_PROFILES, DEMO_ASSESSMENTS, DEMO_ADAPTATIONS, DEMO_USAGE,
      CHILD_IDS, CHILD_NAMES, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.strengths.some((s) => s.includes("Child feedback on adaptations"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Edge Cases
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles single child with comprehensive data", () => {
    const result = generateSensoryEnvironmentIntelligence(
      [DEMO_PROFILES[0]], DEMO_ASSESSMENTS, [DEMO_ADAPTATIONS[0]], [DEMO_USAGE[0]],
      ["child-alex"], ["Alex"], HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.childProfiles).toHaveLength(1);
    expect(result.childProfiles[0].childName).toBe("Alex");
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("handles period with no usage records", () => {
    const result = generateSensoryEnvironmentIntelligence(
      DEMO_PROFILES, DEMO_ASSESSMENTS, DEMO_ADAPTATIONS, DEMO_USAGE,
      CHILD_IDS, CHILD_NAMES, HOME_ID, "2024-01-01", "2024-01-31", "2024-02-01",
    );
    expect(result.therapeuticUsage.usageFrequency).toBe(0);
  });

  it("handles duplicate profiles (uses all)", () => {
    const dupes = [...DEMO_PROFILES, DEMO_PROFILES[0]];
    const result = evaluateChildSensoryProfiles(dupes, CHILD_IDS);
    // Still only 3 unique child IDs profiled
    expect(result.profiledChildIds).toHaveLength(3);
    expect(result.coverageRate).toBe(100);
  });

  it("handles very large number of adaptations", () => {
    const many: EnvironmentalAdaptation[] = Array.from({ length: 50 }, (_, i) => ({
      ...DEMO_ADAPTATIONS[0],
      id: `ea-bulk-${i}`,
      effectiveness: i % 3 === 0 ? "effective" as const : "partially_effective" as const,
    }));
    const result = evaluateAdaptations(many);
    expect(result.adaptationCount).toBe(50);
    expect(result.effectivenessRate).toBe(100);
  });

  it("handles usage with only distressed responses", () => {
    const distressed: TherapeuticSpaceUsage[] = DEMO_USAGE.slice(0, 5).map((u) => ({
      ...u,
      childResponse: "distressed" as const,
    }));
    const result = evaluateTherapeuticSpaceUsage(distressed);
    expect(result.positiveResponseRate).toBe(0);
  });

  it("handles assessments with all harsh/high/uncomfortable", () => {
    const poor: SpaceAssessment[] = DEMO_ASSESSMENTS.map((a) => ({
      ...a,
      noiseLevel: "high" as const,
      lightingQuality: "harsh" as const,
      temperature: "uncomfortable" as const,
      personalisationLevel: "not_personalised" as const,
      childFriendly: false,
    }));
    const result = evaluateSpaceQuality(poor);
    expect(result.personalisationRate).toBe(0);
    expect(result.childFriendlyRate).toBe(0);
    expect(result.noiseQuality).toBe(0);
    expect(result.lightingQuality).toBe(0);
    expect(result.temperatureQuality).toBe(0);
  });

  it("environmental comfort score is 0 for completely unsupported child", () => {
    const result = buildChildEnvironmentProfiles(
      [], [], [], ["child-unknown"], ["Unknown"],
    );
    expect(result[0].environmentalComfortScore).toBe(0);
  });

  it("handles adaptations with removed status", () => {
    const removed: EnvironmentalAdaptation[] = [
      { ...DEMO_ADAPTATIONS[0], status: "removed" },
    ];
    const result = evaluateAdaptations(removed);
    expect(result.activeAdaptations).toBe(0);
    expect(result.adaptationCount).toBe(1);
  });

  it("child profile only counts active adaptations", () => {
    const mixed: EnvironmentalAdaptation[] = [
      { ...DEMO_ADAPTATIONS[0], childId: "child-alex", status: "active" },
      { ...DEMO_ADAPTATIONS[1], childId: "child-alex", status: "removed" },
      { ...DEMO_ADAPTATIONS[6], childId: "child-alex", status: "planned" },
    ];
    const result = buildChildEnvironmentProfiles(
      DEMO_PROFILES, mixed, [], ["child-alex"], ["Alex"],
    );
    expect(result[0].adaptationsInPlace).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("label functions", () => {
  it("getSensoryNeedLabel returns correct labels", () => {
    expect(getSensoryNeedLabel("noise_sensitivity")).toBe("Noise Sensitivity");
    expect(getSensoryNeedLabel("light_sensitivity")).toBe("Light Sensitivity");
    expect(getSensoryNeedLabel("tactile_sensitivity")).toBe("Tactile Sensitivity");
    expect(getSensoryNeedLabel("proprioceptive")).toBe("Proprioceptive");
    expect(getSensoryNeedLabel("vestibular")).toBe("Vestibular");
    expect(getSensoryNeedLabel("olfactory")).toBe("Olfactory");
    expect(getSensoryNeedLabel("gustatory")).toBe("Gustatory");
    expect(getSensoryNeedLabel("visual_stimulation")).toBe("Visual Stimulation");
    expect(getSensoryNeedLabel("calming_input")).toBe("Calming Input");
    expect(getSensoryNeedLabel("movement_need")).toBe("Movement Need");
  });

  it("getSpaceTypeLabel returns correct labels", () => {
    expect(getSpaceTypeLabel("bedroom")).toBe("Bedroom");
    expect(getSpaceTypeLabel("living_room")).toBe("Living Room");
    expect(getSpaceTypeLabel("sensory_room")).toBe("Sensory Room");
    expect(getSpaceTypeLabel("quiet_room")).toBe("Quiet Room");
    expect(getSpaceTypeLabel("activity_room")).toBe("Activity Room");
    expect(getSpaceTypeLabel("study_space")).toBe("Study Space");
  });

  it("getAdaptationTypeLabel returns correct labels", () => {
    expect(getAdaptationTypeLabel("lighting_adjustment")).toBe("Lighting Adjustment");
    expect(getAdaptationTypeLabel("noise_reduction")).toBe("Noise Reduction");
    expect(getAdaptationTypeLabel("safe_space_creation")).toBe("Safe Space Creation");
    expect(getAdaptationTypeLabel("visual_timetable")).toBe("Visual Timetable");
  });

  it("getPersonalisationLevelLabel returns correct labels", () => {
    expect(getPersonalisationLevelLabel("not_personalised")).toBe("Not Personalised");
    expect(getPersonalisationLevelLabel("basic")).toBe("Basic");
    expect(getPersonalisationLevelLabel("moderate")).toBe("Moderate");
    expect(getPersonalisationLevelLabel("highly_personalised")).toBe("Highly Personalised");
  });
});
