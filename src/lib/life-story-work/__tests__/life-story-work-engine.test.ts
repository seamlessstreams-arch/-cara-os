// ==============================================================================
// Tests — Life Story Work Intelligence Engine
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  generateLifeStoryWorkIntelligence,
  evaluateSessionQuality,
  evaluateMemoryRecordKeeping,
  evaluateLifeStoryPolicy,
  evaluateStaffLifeStoryReadiness,
  buildChildLifeStoryProfiles,
  getRating,
  getSessionTypeLabel,
  getEngagementLevelLabel,
  getMemoryItemTypeLabel,
  getRatingLabel,
} from "../life-story-work-engine";
import type {
  LifeStorySession,
  MemoryRecord,
  LifeStoryPolicy,
  StaffLifeStoryTraining,
} from "../life-story-work-engine";

// -- Factories ----------------------------------------------------------------

let _sid = 0;
function makeSession(overrides: Partial<LifeStorySession> = {}): LifeStorySession {
  _sid++;
  return {
    id: `ls-${_sid}`,
    childId: "child-a",
    childName: "Alex",
    sessionDate: "2026-03-01",
    sessionType: "life_story_book",
    facilitator: "Sarah Johnson",
    durationMinutes: 45,
    engagementLevel: "highly_engaged",
    therapeuticApproachUsed: true,
    childLedPace: true,
    recordedInCasefile: true,
    followUpPlanned: true,
    ...overrides,
  };
}

let _rid = 0;
function makeRecord(overrides: Partial<MemoryRecord> = {}): MemoryRecord {
  _rid++;
  return {
    id: `mr-${_rid}`,
    childId: "child-a",
    childName: "Alex",
    itemType: "photograph",
    dateAdded: "2026-03-01",
    securelyStored: true,
    childAccessible: true,
    qualityChecked: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<LifeStoryPolicy> = {}): LifeStoryPolicy {
  return {
    id: "lsp-1",
    lifeStoryWorkPolicy: true,
    identitySupportFramework: true,
    therapeuticApproachGuidance: true,
    memoryKeepingProtocol: true,
    culturalSensitivityGuidance: true,
    childConsentProcess: true,
    regularReviewSchedule: true,
    ...overrides,
  };
}

let _tid = 0;
function makeTraining(overrides: Partial<StaffLifeStoryTraining> = {}): StaffLifeStoryTraining {
  _tid++;
  return {
    id: `lst-${_tid}`,
    staffId: `staff-${_tid}`,
    staffName: `Staff ${_tid}`,
    lifeStoryWork: true,
    therapeuticNarrative: true,
    traumaInformed: true,
    culturalSensitivity: true,
    childLedApproach: true,
    memoryKeeping: true,
    ...overrides,
  };
}

// =============================================================================
// pct()
// =============================================================================

// =============================================================================
// getRating()
// =============================================================================

describe("getRating", () => {
  it("returns outstanding for >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// =============================================================================
// Label getters
// =============================================================================

describe("label getters", () => {
  it("getSessionTypeLabel returns correct labels", () => {
    expect(getSessionTypeLabel("life_story_book")).toBe("Life Story Book");
    expect(getSessionTypeLabel("memory_box")).toBe("Memory Box");
    expect(getSessionTypeLabel("photo_work")).toBe("Photo Work");
    expect(getSessionTypeLabel("therapeutic_narrative")).toBe("Therapeutic Narrative");
    expect(getSessionTypeLabel("timeline_work")).toBe("Timeline Work");
    expect(getSessionTypeLabel("family_tree")).toBe("Family Tree");
    expect(getSessionTypeLabel("identity_exploration")).toBe("Identity Exploration");
    expect(getSessionTypeLabel("digital_story")).toBe("Digital Story");
  });

  it("getEngagementLevelLabel returns correct labels", () => {
    expect(getEngagementLevelLabel("highly_engaged")).toBe("Highly Engaged");
    expect(getEngagementLevelLabel("engaged")).toBe("Engaged");
    expect(getEngagementLevelLabel("partially_engaged")).toBe("Partially Engaged");
    expect(getEngagementLevelLabel("reluctant")).toBe("Reluctant");
    expect(getEngagementLevelLabel("refused")).toBe("Refused");
  });

  it("getMemoryItemTypeLabel returns correct labels", () => {
    expect(getMemoryItemTypeLabel("photograph")).toBe("Photograph");
    expect(getMemoryItemTypeLabel("letter")).toBe("Letter");
    expect(getMemoryItemTypeLabel("certificate")).toBe("Certificate");
    expect(getMemoryItemTypeLabel("artwork")).toBe("Artwork");
    expect(getMemoryItemTypeLabel("report")).toBe("Report");
    expect(getMemoryItemTypeLabel("keepsake")).toBe("Keepsake");
    expect(getMemoryItemTypeLabel("digital_media")).toBe("Digital Media");
    expect(getMemoryItemTypeLabel("other")).toBe("Other");
  });

  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// =============================================================================
// evaluateSessionQuality
// =============================================================================

describe("evaluateSessionQuality", () => {
  it("returns all zeros for empty sessions", () => {
    const r = evaluateSessionQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalSessions).toBe(0);
    expect(r.engagementRate).toBeNull();
    expect(r.therapeuticRate).toBeNull();
    expect(r.childLedRate).toBeNull();
    expect(r.recordedRate).toBeNull();
    expect(r.followUpRate).toBeNull();
  });

  it("scores 25 for perfect sessions", () => {
    const sessions = Array.from({ length: 10 }, () => makeSession());
    const r = evaluateSessionQuality(sessions);
    expect(r.overallScore).toBe(25);
    expect(r.totalSessions).toBe(10);
    expect(r.engagementRate).toBe(100);
    expect(r.therapeuticRate).toBe(100);
    expect(r.childLedRate).toBe(100);
    expect(r.recordedRate).toBe(100);
    expect(r.followUpRate).toBe(100);
  });

  it("counts highly_engaged and engaged as positive engagement", () => {
    const sessions = [
      makeSession({ engagementLevel: "highly_engaged" }),
      makeSession({ engagementLevel: "engaged" }),
      makeSession({ engagementLevel: "partially_engaged" }),
      makeSession({ engagementLevel: "reluctant" }),
      makeSession({ engagementLevel: "refused" }),
    ];
    expect(evaluateSessionQuality(sessions).engagementRate).toBe(40); // 2/5
  });

  it("scores engagement tiers: ≥80→7, ≥60→5, ≥40→3, >0→1", () => {
    // 100% → 7
    const full = Array.from({ length: 5 }, () => makeSession({ engagementLevel: "highly_engaged" }));
    const r100 = evaluateSessionQuality(full);
    expect(r100.engagementRate).toBe(100);

    // 60% → 5
    const sixtyPct = [
      makeSession({ engagementLevel: "engaged" }),
      makeSession({ engagementLevel: "engaged" }),
      makeSession({ engagementLevel: "engaged" }),
      makeSession({ engagementLevel: "reluctant" }),
      makeSession({ engagementLevel: "refused" }),
    ];
    expect(evaluateSessionQuality(sixtyPct).engagementRate).toBe(60);

    // 20% → 1
    const low = [
      makeSession({ engagementLevel: "engaged" }),
      makeSession({ engagementLevel: "reluctant" }),
      makeSession({ engagementLevel: "reluctant" }),
      makeSession({ engagementLevel: "refused" }),
      makeSession({ engagementLevel: "refused" }),
    ];
    expect(evaluateSessionQuality(low).engagementRate).toBe(20);
  });

  it("scores therapeutic approach tiers", () => {
    // 100% → 6
    const all = Array.from({ length: 5 }, () => makeSession({ therapeuticApproachUsed: true }));
    expect(evaluateSessionQuality(all).therapeuticRate).toBe(100);

    // 50% → 3
    const half = [
      makeSession({ therapeuticApproachUsed: true }),
      makeSession({ therapeuticApproachUsed: false }),
    ];
    expect(evaluateSessionQuality(half).therapeuticRate).toBe(50);
  });

  it("scores child-led pace tiers", () => {
    const all = Array.from({ length: 5 }, () => makeSession({ childLedPace: true }));
    expect(evaluateSessionQuality(all).childLedRate).toBe(100);
  });

  it("scores combined recorded + follow-up", () => {
    // All recorded, no follow-up → combined = 50 → 3
    const sessions = Array.from({ length: 5 }, () =>
      makeSession({ recordedInCasefile: true, followUpPlanned: false }),
    );
    const r = evaluateSessionQuality(sessions);
    expect(r.recordedRate).toBe(100);
    expect(r.followUpRate).toBe(0);
  });

  it("caps at 25", () => {
    const sessions = Array.from({ length: 20 }, () => makeSession());
    expect(evaluateSessionQuality(sessions).overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single session", () => {
    const r = evaluateSessionQuality([makeSession()]);
    expect(r.totalSessions).toBe(1);
    expect(r.overallScore).toBeGreaterThan(0);
  });
});

// =============================================================================
// evaluateMemoryRecordKeeping
// =============================================================================

describe("evaluateMemoryRecordKeeping", () => {
  it("returns all zeros for empty records", () => {
    const r = evaluateMemoryRecordKeeping([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalItems).toBe(0);
    expect(r.secureStorageRate).toBeNull();
    expect(r.childAccessRate).toBeNull();
    expect(r.qualityCheckedRate).toBeNull();
  });

  it("scores 25 for perfect records", () => {
    const records = Array.from({ length: 5 }, () => makeRecord());
    const r = evaluateMemoryRecordKeeping(records);
    expect(r.overallScore).toBe(25); // 8+9+8
    expect(r.totalItems).toBe(5);
    expect(r.secureStorageRate).toBe(100);
    expect(r.childAccessRate).toBe(100);
    expect(r.qualityCheckedRate).toBe(100);
  });

  it("scores secure storage tiers: ≥90→8, ≥70→6, ≥50→4, >0→2", () => {
    // 80% → 6
    const records = [
      makeRecord({ securelyStored: true }),
      makeRecord({ securelyStored: true }),
      makeRecord({ securelyStored: true }),
      makeRecord({ securelyStored: true }),
      makeRecord({ securelyStored: false }),
    ];
    expect(evaluateMemoryRecordKeeping(records).secureStorageRate).toBe(80);
  });

  it("scores child access tiers: ≥90→9, ≥70→7, ≥50→4, >0→2", () => {
    // 100% → 9
    const records = Array.from({ length: 5 }, () => makeRecord({ childAccessible: true }));
    expect(evaluateMemoryRecordKeeping(records).childAccessRate).toBe(100);

    // 50% → 4
    const half = [
      makeRecord({ childAccessible: true }),
      makeRecord({ childAccessible: false }),
    ];
    expect(evaluateMemoryRecordKeeping(half).childAccessRate).toBe(50);
  });

  it("scores quality checked tiers: ≥90→8, ≥70→6, ≥50→4, >0→2", () => {
    // 75% → 6
    const records = [
      makeRecord({ qualityChecked: true }),
      makeRecord({ qualityChecked: true }),
      makeRecord({ qualityChecked: true }),
      makeRecord({ qualityChecked: false }),
    ];
    expect(evaluateMemoryRecordKeeping(records).qualityCheckedRate).toBe(75);
  });

  it("caps at 25", () => {
    const records = Array.from({ length: 20 }, () => makeRecord());
    expect(evaluateMemoryRecordKeeping(records).overallScore).toBeLessThanOrEqual(25);
  });

  it("handles all false = 0 rates but non-zero score (>0 tier)", () => {
    const records = [
      makeRecord({ securelyStored: false, childAccessible: false, qualityChecked: false }),
    ];
    const r = evaluateMemoryRecordKeeping(records);
    expect(r.secureStorageRate).toBe(0);
    expect(r.childAccessRate).toBe(0);
    expect(r.qualityCheckedRate).toBe(0);
    expect(r.overallScore).toBe(0);
  });

  it("handles single record", () => {
    const r = evaluateMemoryRecordKeeping([makeRecord()]);
    expect(r.totalItems).toBe(1);
    expect(r.overallScore).toBe(25);
  });
});

// =============================================================================
// evaluateLifeStoryPolicy
// =============================================================================

describe("evaluateLifeStoryPolicy", () => {
  it("returns all zeros/false for null policy", () => {
    const r = evaluateLifeStoryPolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.lifeStoryWorkPolicy).toBe(false);
    expect(r.identitySupportFramework).toBe(false);
    expect(r.therapeuticApproachGuidance).toBe(false);
    expect(r.memoryKeepingProtocol).toBe(false);
    expect(r.culturalSensitivityGuidance).toBe(false);
    expect(r.childConsentProcess).toBe(false);
    expect(r.regularReviewSchedule).toBe(false);
  });

  it("scores 25 for fully compliant policy", () => {
    const r = evaluateLifeStoryPolicy(makePolicy());
    expect(r.overallScore).toBe(25); // 4+4+4+4+3+3+3
  });

  it("scores individual booleans at correct weights", () => {
    // lifeStoryWorkPolicy = 4
    expect(evaluateLifeStoryPolicy(makePolicy({
      lifeStoryWorkPolicy: true, identitySupportFramework: false, therapeuticApproachGuidance: false,
      memoryKeepingProtocol: false, culturalSensitivityGuidance: false, childConsentProcess: false,
      regularReviewSchedule: false,
    })).overallScore).toBe(4);

    // identitySupportFramework = 4
    expect(evaluateLifeStoryPolicy(makePolicy({
      lifeStoryWorkPolicy: false, identitySupportFramework: true, therapeuticApproachGuidance: false,
      memoryKeepingProtocol: false, culturalSensitivityGuidance: false, childConsentProcess: false,
      regularReviewSchedule: false,
    })).overallScore).toBe(4);

    // therapeuticApproachGuidance = 4
    expect(evaluateLifeStoryPolicy(makePolicy({
      lifeStoryWorkPolicy: false, identitySupportFramework: false, therapeuticApproachGuidance: true,
      memoryKeepingProtocol: false, culturalSensitivityGuidance: false, childConsentProcess: false,
      regularReviewSchedule: false,
    })).overallScore).toBe(4);

    // memoryKeepingProtocol = 4
    expect(evaluateLifeStoryPolicy(makePolicy({
      lifeStoryWorkPolicy: false, identitySupportFramework: false, therapeuticApproachGuidance: false,
      memoryKeepingProtocol: true, culturalSensitivityGuidance: false, childConsentProcess: false,
      regularReviewSchedule: false,
    })).overallScore).toBe(4);

    // culturalSensitivityGuidance = 3
    expect(evaluateLifeStoryPolicy(makePolicy({
      lifeStoryWorkPolicy: false, identitySupportFramework: false, therapeuticApproachGuidance: false,
      memoryKeepingProtocol: false, culturalSensitivityGuidance: true, childConsentProcess: false,
      regularReviewSchedule: false,
    })).overallScore).toBe(3);

    // childConsentProcess = 3
    expect(evaluateLifeStoryPolicy(makePolicy({
      lifeStoryWorkPolicy: false, identitySupportFramework: false, therapeuticApproachGuidance: false,
      memoryKeepingProtocol: false, culturalSensitivityGuidance: false, childConsentProcess: true,
      regularReviewSchedule: false,
    })).overallScore).toBe(3);

    // regularReviewSchedule = 3
    expect(evaluateLifeStoryPolicy(makePolicy({
      lifeStoryWorkPolicy: false, identitySupportFramework: false, therapeuticApproachGuidance: false,
      memoryKeepingProtocol: false, culturalSensitivityGuidance: false, childConsentProcess: false,
      regularReviewSchedule: true,
    })).overallScore).toBe(3);
  });

  it("scores 4-point items only = 16", () => {
    const r = evaluateLifeStoryPolicy(makePolicy({
      lifeStoryWorkPolicy: true, identitySupportFramework: true, therapeuticApproachGuidance: true,
      memoryKeepingProtocol: true, culturalSensitivityGuidance: false, childConsentProcess: false,
      regularReviewSchedule: false,
    }));
    expect(r.overallScore).toBe(16);
  });

  it("scores 3-point items only = 9", () => {
    const r = evaluateLifeStoryPolicy(makePolicy({
      lifeStoryWorkPolicy: false, identitySupportFramework: false, therapeuticApproachGuidance: false,
      memoryKeepingProtocol: false, culturalSensitivityGuidance: true, childConsentProcess: true,
      regularReviewSchedule: true,
    }));
    expect(r.overallScore).toBe(9);
  });

  it("all false = 0", () => {
    const r = evaluateLifeStoryPolicy(makePolicy({
      lifeStoryWorkPolicy: false, identitySupportFramework: false, therapeuticApproachGuidance: false,
      memoryKeepingProtocol: false, culturalSensitivityGuidance: false, childConsentProcess: false,
      regularReviewSchedule: false,
    }));
    expect(r.overallScore).toBe(0);
  });

  it("reflects boolean values in result", () => {
    const r = evaluateLifeStoryPolicy(makePolicy({
      lifeStoryWorkPolicy: true, identitySupportFramework: false,
      therapeuticApproachGuidance: true, memoryKeepingProtocol: false,
      culturalSensitivityGuidance: true, childConsentProcess: false,
      regularReviewSchedule: true,
    }));
    expect(r.lifeStoryWorkPolicy).toBe(true);
    expect(r.identitySupportFramework).toBe(false);
    expect(r.therapeuticApproachGuidance).toBe(true);
    expect(r.memoryKeepingProtocol).toBe(false);
    expect(r.culturalSensitivityGuidance).toBe(true);
    expect(r.childConsentProcess).toBe(false);
    expect(r.regularReviewSchedule).toBe(true);
    expect(r.overallScore).toBe(14); // 4+4+3+3
  });
});

// =============================================================================
// evaluateStaffLifeStoryReadiness
// =============================================================================

describe("evaluateStaffLifeStoryReadiness", () => {
  it("returns all zeros for empty training", () => {
    const r = evaluateStaffLifeStoryReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.lifeStoryWorkRate).toBeNull();
    expect(r.therapeuticNarrativeRate).toBeNull();
    expect(r.traumaInformedRate).toBeNull();
    expect(r.culturalSensitivityRate).toBeNull();
    expect(r.childLedApproachRate).toBeNull();
    expect(r.memoryKeepingRate).toBeNull();
  });

  it("scores 25 for fully trained staff", () => {
    const staff = Array.from({ length: 5 }, () => makeTraining());
    const r = evaluateStaffLifeStoryReadiness(staff);
    expect(r.overallScore).toBe(25); // 6+5+5+4+3+2
    expect(r.totalStaff).toBe(5);
  });

  it("scores staff with no training as 0", () => {
    const untrained = [makeTraining({
      lifeStoryWork: false, therapeuticNarrative: false, traumaInformed: false,
      culturalSensitivity: false, childLedApproach: false, memoryKeeping: false,
    })];
    const r = evaluateStaffLifeStoryReadiness(untrained);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(1);
  });

  it("scores life story work tiers: ≥90→6, ≥70→4, ≥50→3, >0→1", () => {
    // 75% → 4
    const staff = [
      makeTraining({ lifeStoryWork: true }),
      makeTraining({ lifeStoryWork: true }),
      makeTraining({ lifeStoryWork: true }),
      makeTraining({ lifeStoryWork: false }),
    ];
    expect(evaluateStaffLifeStoryReadiness(staff).lifeStoryWorkRate).toBe(75);
  });

  it("scores child-led approach tiers: ≥90→3, ≥70→2, ≥50→1, <50→0", () => {
    // 40% → 0 (below 50)
    const staff = [
      makeTraining({ childLedApproach: true }),
      makeTraining({ childLedApproach: true }),
      makeTraining({ childLedApproach: false }),
      makeTraining({ childLedApproach: false }),
      makeTraining({ childLedApproach: false }),
    ];
    expect(evaluateStaffLifeStoryReadiness(staff).childLedApproachRate).toBe(40);
  });

  it("scores memory keeping tiers: ≥90→2, ≥70→1, <70→0", () => {
    // 50% → 0 (below 70)
    const staff = [
      makeTraining({ memoryKeeping: true }),
      makeTraining({ memoryKeeping: false }),
    ];
    expect(evaluateStaffLifeStoryReadiness(staff).memoryKeepingRate).toBe(50);
  });

  it("caps at 25", () => {
    const staff = Array.from({ length: 20 }, () => makeTraining());
    expect(evaluateStaffLifeStoryReadiness(staff).overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single fully trained staff = 25", () => {
    const r = evaluateStaffLifeStoryReadiness([makeTraining()]);
    expect(r.overallScore).toBe(25);
  });
});

// =============================================================================
// buildChildLifeStoryProfiles
// =============================================================================

describe("buildChildLifeStoryProfiles", () => {
  it("returns empty array for no sessions or records", () => {
    expect(buildChildLifeStoryProfiles([], []).length).toBe(0);
  });

  it("builds profile from sessions only", () => {
    const sessions = [
      makeSession({ childId: "c1", childName: "Alex" }),
      makeSession({ childId: "c1", childName: "Alex" }),
      makeSession({ childId: "c1", childName: "Alex" }),
    ];
    const profiles = buildChildLifeStoryProfiles(sessions, []);
    expect(profiles.length).toBe(1);
    expect(profiles[0].childId).toBe("c1");
    expect(profiles[0].totalSessions).toBe(3);
    expect(profiles[0].totalMemoryItems).toBe(0);
  });

  it("builds profile from records only", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "Alex" }),
      makeRecord({ childId: "c1", childName: "Alex" }),
    ];
    const profiles = buildChildLifeStoryProfiles([], records);
    expect(profiles.length).toBe(1);
    expect(profiles[0].totalSessions).toBe(0);
    expect(profiles[0].totalMemoryItems).toBe(2);
  });

  it("merges sessions and records for same child", () => {
    const sessions = [makeSession({ childId: "c1", childName: "Alex" })];
    const records = [makeRecord({ childId: "c1", childName: "Alex" })];
    const profiles = buildChildLifeStoryProfiles(sessions, records);
    expect(profiles.length).toBe(1);
    expect(profiles[0].totalSessions).toBe(1);
    expect(profiles[0].totalMemoryItems).toBe(1);
  });

  it("creates separate profiles for different children", () => {
    const sessions = [
      makeSession({ childId: "c1", childName: "Alex" }),
      makeSession({ childId: "c2", childName: "Jordan" }),
    ];
    const records = [makeRecord({ childId: "c3", childName: "Morgan" })];
    const profiles = buildChildLifeStoryProfiles(sessions, records);
    expect(profiles.length).toBe(3);
  });

  it("scores session frequency: ≥5→3, ≥3→2, ≥1→1", () => {
    const v5 = Array.from({ length: 5 }, () => makeSession({ childId: "c1", childName: "Alex" }));
    const p5 = buildChildLifeStoryProfiles(v5, []);
    expect(p5[0].totalSessions).toBe(5);

    const v3 = Array.from({ length: 3 }, () => makeSession({ childId: "c2", childName: "Jordan" }));
    const p3 = buildChildLifeStoryProfiles(v3, []);
    expect(p3[0].totalSessions).toBe(3);

    const v1 = [makeSession({ childId: "c3", childName: "Morgan" })];
    const p1 = buildChildLifeStoryProfiles(v1, []);
    expect(p1[0].totalSessions).toBe(1);
  });

  it("scores engagement from sessions", () => {
    const sessions = Array.from({ length: 5 }, () =>
      makeSession({ childId: "c1", childName: "Alex", engagementLevel: "highly_engaged" }),
    );
    const p = buildChildLifeStoryProfiles(sessions, []);
    expect(p[0].engagementRate).toBe(100);
  });

  it("scores therapeutic rate from sessions", () => {
    const sessions = [
      makeSession({ childId: "c1", childName: "Alex", therapeuticApproachUsed: true }),
      makeSession({ childId: "c1", childName: "Alex", therapeuticApproachUsed: false }),
    ];
    const p = buildChildLifeStoryProfiles(sessions, []);
    expect(p[0].therapeuticRate).toBe(50);
  });

  it("scores memory items: ≥5→2, ≥1→1, 0→0", () => {
    const records5 = Array.from({ length: 5 }, () => makeRecord({ childId: "c1", childName: "Alex" }));
    const p5 = buildChildLifeStoryProfiles([], records5);
    expect(p5[0].totalMemoryItems).toBe(5);

    const records1 = [makeRecord({ childId: "c2", childName: "Jordan" })];
    const p1 = buildChildLifeStoryProfiles([], records1);
    expect(p1[0].totalMemoryItems).toBe(1);
  });

  it("caps profile score at 10", () => {
    const sessions = Array.from({ length: 10 }, () => makeSession({ childId: "c1", childName: "Alex" }));
    const records = Array.from({ length: 10 }, () => makeRecord({ childId: "c1", childName: "Alex" }));
    const p = buildChildLifeStoryProfiles(sessions, records);
    expect(p[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("perfect child profile scores 10", () => {
    const sessions = Array.from({ length: 5 }, () =>
      makeSession({ childId: "c1", childName: "Alex", engagementLevel: "highly_engaged", therapeuticApproachUsed: true }),
    );
    const records = Array.from({ length: 5 }, () => makeRecord({ childId: "c1", childName: "Alex" }));
    const p = buildChildLifeStoryProfiles(sessions, records);
    expect(p[0].overallScore).toBe(10);
  });
});

// =============================================================================
// generateLifeStoryWorkIntelligence
// =============================================================================

describe("generateLifeStoryWorkIntelligence", () => {
  const base = {
    homeId: "oak-house",
    periodStart: "2026-01-01",
    periodEnd: "2026-05-19",
  };

  it("returns inadequate (0) for all empty inputs", () => {
    const r = generateLifeStoryWorkIntelligence([], [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
    expect(r.sessionQuality.overallScore).toBe(0);
    expect(r.memoryRecordKeeping.overallScore).toBe(0);
    expect(r.lifeStoryPolicy.overallScore).toBe(0);
    expect(r.staffReadiness.overallScore).toBe(0);
    expect(r.childProfiles).toEqual([]);
  });

  it("returns outstanding (100) for perfect inputs", () => {
    const sessions = Array.from({ length: 10 }, () => makeSession());
    const records = Array.from({ length: 5 }, () => makeRecord());
    const policy = makePolicy();
    const training = Array.from({ length: 5 }, () => makeTraining());

    const r = generateLifeStoryWorkIntelligence(sessions, records, policy, training, base.homeId, base.periodStart, base.periodEnd);
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });

  it("caps overallScore at 100", () => {
    const sessions = Array.from({ length: 20 }, () => makeSession());
    const records = Array.from({ length: 20 }, () => makeRecord());
    const r = generateLifeStoryWorkIntelligence(sessions, records, makePolicy(), Array.from({ length: 10 }, () => makeTraining()), base.homeId, base.periodStart, base.periodEnd);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes homeId and period dates", () => {
    const r = generateLifeStoryWorkIntelligence([], [], null, [], "test-home", "2026-01-01", "2026-06-30");
    expect(r.homeId).toBe("test-home");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-06-30");
  });

  it("produces child profiles from sessions and records", () => {
    const sessions = [
      makeSession({ childId: "c1", childName: "Alex" }),
      makeSession({ childId: "c2", childName: "Jordan" }),
    ];
    const records = [makeRecord({ childId: "c1", childName: "Alex" })];
    const r = generateLifeStoryWorkIntelligence(sessions, records, null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.childProfiles.length).toBe(2);
  });

  // -- Strengths
  it("generates strength for high engagement", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ engagementLevel: "highly_engaged" }));
    const r = generateLifeStoryWorkIntelligence(sessions, [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.strengths.some((s) => s.includes("engaged"))).toBe(true);
  });

  it("generates strength for therapeutic approach", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ therapeuticApproachUsed: true }));
    const r = generateLifeStoryWorkIntelligence(sessions, [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.strengths.some((s) => s.includes("Therapeutic"))).toBe(true);
  });

  it("generates strength for child-led pace", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession({ childLedPace: true }));
    const r = generateLifeStoryWorkIntelligence(sessions, [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.strengths.some((s) => s.includes("child-led"))).toBe(true);
  });

  it("generates strength for secure storage", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ securelyStored: true }));
    const r = generateLifeStoryWorkIntelligence([], records, null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.strengths.some((s) => s.includes("securely stored"))).toBe(true);
  });

  it("generates strength for staff training", () => {
    const training = Array.from({ length: 5 }, () => makeTraining({ lifeStoryWork: true }));
    const r = generateLifeStoryWorkIntelligence([], [], null, training, base.homeId, base.periodStart, base.periodEnd);
    expect(r.strengths.some((s) => s.includes("life story work"))).toBe(true);
  });

  it("does not generate strengths for empty data", () => {
    const r = generateLifeStoryWorkIntelligence([], [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.strengths.length).toBe(0);
  });

  // -- Actions
  it("generates action for no sessions", () => {
    const r = generateLifeStoryWorkIntelligence([], [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.actions.some((a) => a.includes("No life story work sessions"))).toBe(true);
  });

  it("generates action for no records", () => {
    const r = generateLifeStoryWorkIntelligence([], [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.actions.some((a) => a.includes("No memory items"))).toBe(true);
  });

  it("generates URGENT action for no policy", () => {
    const r = generateLifeStoryWorkIntelligence([], [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT action for no training", () => {
    const r = generateLifeStoryWorkIntelligence([], [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });

  it("does not generate empty-data actions when data exists", () => {
    const sessions = [makeSession()];
    const records = [makeRecord()];
    const r = generateLifeStoryWorkIntelligence(sessions, records, makePolicy(), [makeTraining()], base.homeId, base.periodStart, base.periodEnd);
    expect(r.actions.some((a) => a.includes("No life story work sessions"))).toBe(false);
    expect(r.actions.some((a) => a.startsWith("URGENT"))).toBe(false);
  });

  // -- Regulatory
  it("always includes 7 regulatory links", () => {
    const r = generateLifeStoryWorkIntelligence([], [], null, [], base.homeId, base.periodStart, base.periodEnd);
    expect(r.regulatoryLinks.length).toBe(7);
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 10"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Care Planning Regulations"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("NMS 3"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("UNCRC Article 8"))).toBe(true);
  });

  // -- Rating thresholds
  it("produces good rating for 75 score", () => {
    const sessions = Array.from({ length: 5 }, () => makeSession());
    const records = Array.from({ length: 5 }, () => makeRecord());
    const training = Array.from({ length: 5 }, () => makeTraining());
    // 25 + 25 + 0 (no policy) + 25 = 75 → good
    const r = generateLifeStoryWorkIntelligence(sessions, records, null, training, base.homeId, base.periodStart, base.periodEnd);
    expect(r.overallScore).toBe(75);
    expect(r.rating).toBe("good");
  });

  it("produces requires_improvement for moderate data", () => {
    // Policy only = 25, partial sessions
    const sessions = [
      makeSession({ engagementLevel: "reluctant", therapeuticApproachUsed: false, childLedPace: false, recordedInCasefile: false, followUpPlanned: false }),
      makeSession({ engagementLevel: "engaged", therapeuticApproachUsed: true, childLedPace: true, recordedInCasefile: true, followUpPlanned: true }),
    ];
    // engagement: 50%→3, therapeutic: 50%→3, childLed: 50%→3, combined: (50+50)/2=50→3 = 12
    // records empty = 0, policy = 25, staff = partial
    const training = [makeTraining({
      lifeStoryWork: true, therapeuticNarrative: false, traumaInformed: false,
      culturalSensitivity: false, childLedApproach: false, memoryKeeping: false,
    })];
    // lsw: 100→6, tn: 0→0, ti: 0→0, cs: 0→0, cla: 0→0, mk: 0→0 = 6
    // Total: 12 + 0 + 25 + 6 = 43
    const r = generateLifeStoryWorkIntelligence(sessions, [], makePolicy(), training, base.homeId, base.periodStart, base.periodEnd);
    expect(r.overallScore).toBe(43);
    expect(r.rating).toBe("requires_improvement");
  });
});
