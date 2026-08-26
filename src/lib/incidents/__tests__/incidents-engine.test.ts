import { describe, it, expect } from "vitest";
import {
  getRating,
  getIncidentCategoryLabel,
  getIncidentOutcomeLabel,
  getRatingLabel,
  evaluateIncidentQuality,
  evaluateIncidentCompliance,
  evaluateIncidentPolicy,
  evaluateStaffIncidentReadiness,
  buildChildIncidentProfiles,
  generateIncidentIntelligence,
} from "../incidents-engine";
import type {
  IncidentRecord,
  IncidentPolicy,
  StaffIncidentTraining,
} from "../incidents-engine";

// ── Helpers ───────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<IncidentRecord> = {}): IncidentRecord {
  return {
    id: "inc-001",
    homeId: "home-oak",
    date: "2026-05-01",
    childId: "child-alex",
    childName: "Alex",
    category: "physical_incident",
    outcome: "resolved_safely",
    deEscalationAttempted: true,
    childViewRecorded: true,
    debriefConducted: true,
    lessonsIdentified: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makeFullPolicy(): IncidentPolicy {
  return {
    incidentManagementPolicy: true,
    deEscalationGuidance: true,
    restraintPolicy: true,
    postIncidentDebriefPolicy: true,
    childViewInIncidentPolicy: true,
    notificationProcedure: true,
    lessonsLearnedFramework: true,
  };
}

function makeFullStaff(): StaffIncidentTraining {
  return {
    staffId: "staff-sarah",
    deEscalationSkills: true,
    incidentRecording: true,
    restraintCertification: true,
    postIncidentSupport: true,
    childProtectionAwareness: true,
    conflictResolution: true,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });
  it("returns good for >= 60", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });
  it("returns requires_improvement for >= 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });
  it("returns inadequate for < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("getIncidentCategoryLabel", () => {
  it("maps physical_incident", () => {
    expect(getIncidentCategoryLabel("physical_incident")).toBe("Physical Incident");
  });
  it("maps verbal_incident", () => {
    expect(getIncidentCategoryLabel("verbal_incident")).toBe("Verbal Incident");
  });
  it("maps self_harm", () => {
    expect(getIncidentCategoryLabel("self_harm")).toBe("Self-Harm");
  });
  it("maps all 8 categories", () => {
    const cats = ["physical_incident", "verbal_incident", "self_harm", "absconding", "substance_misuse", "criminal_behaviour", "bullying", "property_damage"] as const;
    for (const c of cats) {
      expect(getIncidentCategoryLabel(c)).toBeTruthy();
    }
  });
});

describe("getIncidentOutcomeLabel", () => {
  it("maps resolved_safely", () => {
    expect(getIncidentOutcomeLabel("resolved_safely")).toBe("Resolved Safely");
  });
  it("maps de_escalated", () => {
    expect(getIncidentOutcomeLabel("de_escalated")).toBe("De-Escalated");
  });
  it("maps all 5 outcomes", () => {
    const outcomes = ["resolved_safely", "de_escalated", "restraint_used", "external_referral", "not_applicable"] as const;
    for (const o of outcomes) {
      expect(getIncidentOutcomeLabel(o)).toBeTruthy();
    }
  });
});

describe("getRatingLabel", () => {
  it("maps outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("maps requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("maps good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });
  it("maps inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 1: Quality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIncidentQuality", () => {
  it("scores 25 for perfect records", () => {
    const records = Array.from({ length: 5 }, (_, i) => makeRecord({ id: `inc-${i}` }));
    const result = evaluateIncidentQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.deEscalationAttemptedRate).toBe(100);
    expect(result.childViewRecordedRate).toBe(100);
    expect(result.debriefConductedRate).toBe(100);
    expect(result.lessonsIdentifiedRate).toBe(100);
  });

  it("scores 0 for empty records", () => {
    const result = evaluateIncidentQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
  });

  it("scores 0 for all-false quality flags", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `inc-${i}`, deEscalationAttempted: false, childViewRecorded: false, debriefConducted: false, lessonsIdentified: false })
    );
    const result = evaluateIncidentQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("weights deEscalationAttempted highest (7)", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `inc-${i}`, deEscalationAttempted: true, childViewRecorded: false, debriefConducted: false, lessonsIdentified: false })
    );
    const result = evaluateIncidentQuality(records);
    expect(result.overallScore).toBe(7);
  });

  it("weights childViewRecorded at 6", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `inc-${i}`, deEscalationAttempted: false, childViewRecorded: true, debriefConducted: false, lessonsIdentified: false })
    );
    const result = evaluateIncidentQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("weights debriefConducted at 6", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `inc-${i}`, deEscalationAttempted: false, childViewRecorded: false, debriefConducted: true, lessonsIdentified: false })
    );
    const result = evaluateIncidentQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("weights lessonsIdentified at 6", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `inc-${i}`, deEscalationAttempted: false, childViewRecorded: false, debriefConducted: false, lessonsIdentified: true })
    );
    const result = evaluateIncidentQuality(records);
    expect(result.overallScore).toBe(6);
  });

  it("handles mixed data", () => {
    const records = [
      makeRecord({ id: "inc-1" }),
      makeRecord({ id: "inc-2", childViewRecorded: false, lessonsIdentified: false }),
    ];
    const result = evaluateIncidentQuality(records);
    expect(result.deEscalationAttemptedRate).toBe(100);
    expect(result.childViewRecordedRate).toBe(50);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("returns correct totalRecords", () => {
    const records = Array.from({ length: 7 }, (_, i) => makeRecord({ id: `inc-${i}` }));
    expect(evaluateIncidentQuality(records).totalRecords).toBe(7);
  });

  it("never exceeds 25", () => {
    const records = Array.from({ length: 100 }, (_, i) => makeRecord({ id: `inc-${i}` }));
    expect(evaluateIncidentQuality(records).overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: Compliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIncidentCompliance", () => {
  it("scores 25 for perfect records with all 8 categories", () => {
    const cats = ["physical_incident", "verbal_incident", "self_harm", "absconding", "substance_misuse", "criminal_behaviour", "bullying", "property_damage"] as const;
    const records = cats.map((cat, i) => makeRecord({ id: `inc-${i}`, category: cat }));
    const result = evaluateIncidentCompliance(records);
    expect(result.overallScore).toBe(25);
    expect(result.categoryDiversityRatio).toBe(1);
    expect(result.uniqueCategories).toBe(8);
  });

  it("scores 0 for empty records", () => {
    const result = evaluateIncidentCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.uniqueCategories).toBe(0);
  });

  it("scores 0 for all-false compliance flags with one category", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `inc-${i}`, documentationComplete: false, timelyRecording: false, deEscalationAttempted: false })
    );
    const result = evaluateIncidentCompliance(records);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.deEscalationAttemptedRate).toBe(0);
    // Only 1 category (physical_incident) → ratio = 0.13
    expect(result.categoryDiversityRatio).toBe(0.13);
  });

  it("weights documentation highest (8)", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `inc-${i}`, documentationComplete: true, timelyRecording: false, deEscalationAttempted: false })
    );
    const result = evaluateIncidentCompliance(records);
    expect(result.documentationRate).toBe(100);
    // 8 (doc) + 0 (timely) + 0 (deesc) + ~0.63 (1 cat / 8 * 5) = ~8.6
    expect(result.overallScore).toBeGreaterThanOrEqual(8);
  });

  it("calculates categoryDiversityRatio correctly", () => {
    const records = [
      makeRecord({ id: "inc-1", category: "physical_incident" }),
      makeRecord({ id: "inc-2", category: "verbal_incident" }),
      makeRecord({ id: "inc-3", category: "self_harm" }),
      makeRecord({ id: "inc-4", category: "absconding" }),
    ];
    const result = evaluateIncidentCompliance(records);
    expect(result.uniqueCategories).toBe(4);
    expect(result.categoryDiversityRatio).toBe(0.5);
  });

  it("categoryDiversityRatio is 0.25 for 2 of 8 categories", () => {
    const records = [
      makeRecord({ id: "inc-1", category: "physical_incident" }),
      makeRecord({ id: "inc-2", category: "verbal_incident" }),
    ];
    const result = evaluateIncidentCompliance(records);
    expect(result.categoryDiversityRatio).toBe(0.25);
    expect(result.uniqueCategories).toBe(2);
  });

  it("returns totalRecords", () => {
    const records = Array.from({ length: 3 }, (_, i) => makeRecord({ id: `inc-${i}` }));
    expect(evaluateIncidentCompliance(records).totalRecords).toBe(3);
  });

  it("handles mixed compliance data", () => {
    const records = [
      makeRecord({ id: "inc-1", documentationComplete: true, timelyRecording: true }),
      makeRecord({ id: "inc-2", documentationComplete: false, timelyRecording: false }),
    ];
    const result = evaluateIncidentCompliance(records);
    expect(result.documentationRate).toBe(50);
    expect(result.timelyRecordingRate).toBe(50);
  });

  it("never exceeds 25", () => {
    const cats = ["physical_incident", "verbal_incident", "self_harm", "absconding", "substance_misuse", "criminal_behaviour", "bullying", "property_damage"] as const;
    const records = Array.from({ length: 50 }, (_, i) => makeRecord({ id: `inc-${i}`, category: cats[i % cats.length] }));
    expect(evaluateIncidentCompliance(records).overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: Policy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIncidentPolicy", () => {
  it("scores 25 for all true", () => {
    const result = evaluateIncidentPolicy(makeFullPolicy());
    expect(result.overallScore).toBe(25);
  });

  it("scores 0 for null", () => {
    const result = evaluateIncidentPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.incidentManagementPolicy).toBe(false);
    expect(result.deEscalationGuidance).toBe(false);
    expect(result.restraintPolicy).toBe(false);
    expect(result.postIncidentDebriefPolicy).toBe(false);
    expect(result.childViewInIncidentPolicy).toBe(false);
    expect(result.notificationProcedure).toBe(false);
    expect(result.lessonsLearnedFramework).toBe(false);
  });

  it("scores 0 for all false", () => {
    const result = evaluateIncidentPolicy({
      incidentManagementPolicy: false,
      deEscalationGuidance: false,
      restraintPolicy: false,
      postIncidentDebriefPolicy: false,
      childViewInIncidentPolicy: false,
      notificationProcedure: false,
      lessonsLearnedFramework: false,
    });
    expect(result.overallScore).toBe(0);
  });

  it("first 4 booleans weighted at 4 each", () => {
    const result = evaluateIncidentPolicy({
      incidentManagementPolicy: true,
      deEscalationGuidance: true,
      restraintPolicy: true,
      postIncidentDebriefPolicy: true,
      childViewInIncidentPolicy: false,
      notificationProcedure: false,
      lessonsLearnedFramework: false,
    });
    expect(result.overallScore).toBe(16);
  });

  it("last 3 booleans weighted at 3 each", () => {
    const result = evaluateIncidentPolicy({
      incidentManagementPolicy: false,
      deEscalationGuidance: false,
      restraintPolicy: false,
      postIncidentDebriefPolicy: false,
      childViewInIncidentPolicy: true,
      notificationProcedure: true,
      lessonsLearnedFramework: true,
    });
    expect(result.overallScore).toBe(9);
  });

  it("preserves boolean values in result", () => {
    const policy = { ...makeFullPolicy(), lessonsLearnedFramework: false };
    const result = evaluateIncidentPolicy(policy);
    expect(result.lessonsLearnedFramework).toBe(false);
    expect(result.incidentManagementPolicy).toBe(true);
  });

  it("single weight-4 boolean scores 4", () => {
    const result = evaluateIncidentPolicy({
      incidentManagementPolicy: true,
      deEscalationGuidance: false,
      restraintPolicy: false,
      postIncidentDebriefPolicy: false,
      childViewInIncidentPolicy: false,
      notificationProcedure: false,
      lessonsLearnedFramework: false,
    });
    expect(result.overallScore).toBe(4);
  });

  it("single weight-3 boolean scores 3", () => {
    const result = evaluateIncidentPolicy({
      incidentManagementPolicy: false,
      deEscalationGuidance: false,
      restraintPolicy: false,
      postIncidentDebriefPolicy: false,
      childViewInIncidentPolicy: true,
      notificationProcedure: false,
      lessonsLearnedFramework: false,
    });
    expect(result.overallScore).toBe(3);
  });

  it("partial policy scores correctly", () => {
    const result = evaluateIncidentPolicy({
      incidentManagementPolicy: true,
      deEscalationGuidance: true,
      restraintPolicy: false,
      postIncidentDebriefPolicy: false,
      childViewInIncidentPolicy: true,
      notificationProcedure: false,
      lessonsLearnedFramework: true,
    });
    // 4 + 4 + 0 + 0 + 3 + 0 + 3 = 14
    expect(result.overallScore).toBe(14);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: Staff Readiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffIncidentReadiness", () => {
  it("scores 25 for all-skilled staff", () => {
    const staff = [makeFullStaff(), { ...makeFullStaff(), staffId: "staff-tom" }];
    const result = evaluateStaffIncidentReadiness(staff);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(2);
  });

  it("scores 0 for empty staff", () => {
    const result = evaluateStaffIncidentReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("scores 0 for all-false skills", () => {
    const staff: StaffIncidentTraining[] = [{
      staffId: "staff-sarah",
      deEscalationSkills: false,
      incidentRecording: false,
      restraintCertification: false,
      postIncidentSupport: false,
      childProtectionAwareness: false,
      conflictResolution: false,
    }];
    const result = evaluateStaffIncidentReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("weights deEscalationSkills highest (6)", () => {
    const staff: StaffIncidentTraining[] = [{
      staffId: "staff-sarah",
      deEscalationSkills: true,
      incidentRecording: false,
      restraintCertification: false,
      postIncidentSupport: false,
      childProtectionAwareness: false,
      conflictResolution: false,
    }];
    const result = evaluateStaffIncidentReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("weights incidentRecording at 5", () => {
    const staff: StaffIncidentTraining[] = [{
      staffId: "staff-sarah",
      deEscalationSkills: false,
      incidentRecording: true,
      restraintCertification: false,
      postIncidentSupport: false,
      childProtectionAwareness: false,
      conflictResolution: false,
    }];
    const result = evaluateStaffIncidentReadiness(staff);
    expect(result.overallScore).toBe(5);
  });

  it("weights restraintCertification at 5", () => {
    const staff: StaffIncidentTraining[] = [{
      staffId: "staff-sarah",
      deEscalationSkills: false,
      incidentRecording: false,
      restraintCertification: true,
      postIncidentSupport: false,
      childProtectionAwareness: false,
      conflictResolution: false,
    }];
    const result = evaluateStaffIncidentReadiness(staff);
    expect(result.overallScore).toBe(5);
  });

  it("weights postIncidentSupport at 4", () => {
    const staff: StaffIncidentTraining[] = [{
      staffId: "staff-sarah",
      deEscalationSkills: false,
      incidentRecording: false,
      restraintCertification: false,
      postIncidentSupport: true,
      childProtectionAwareness: false,
      conflictResolution: false,
    }];
    const result = evaluateStaffIncidentReadiness(staff);
    expect(result.overallScore).toBe(4);
  });

  it("weights childProtectionAwareness at 3", () => {
    const staff: StaffIncidentTraining[] = [{
      staffId: "staff-sarah",
      deEscalationSkills: false,
      incidentRecording: false,
      restraintCertification: false,
      postIncidentSupport: false,
      childProtectionAwareness: true,
      conflictResolution: false,
    }];
    const result = evaluateStaffIncidentReadiness(staff);
    expect(result.overallScore).toBe(3);
  });

  it("weights conflictResolution lowest (2)", () => {
    const staff: StaffIncidentTraining[] = [{
      staffId: "staff-sarah",
      deEscalationSkills: false,
      incidentRecording: false,
      restraintCertification: false,
      postIncidentSupport: false,
      childProtectionAwareness: false,
      conflictResolution: true,
    }];
    const result = evaluateStaffIncidentReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("handles mixed skills across staff", () => {
    const staff: StaffIncidentTraining[] = [
      makeFullStaff(),
      { ...makeFullStaff(), staffId: "staff-tom", deEscalationSkills: false, restraintCertification: false },
    ];
    const result = evaluateStaffIncidentReadiness(staff);
    expect(result.deEscalationSkillsRate).toBe(50);
    expect(result.restraintCertificationRate).toBe(50);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("returns correct rates for multiple staff", () => {
    const staff: StaffIncidentTraining[] = [
      makeFullStaff(),
      { ...makeFullStaff(), staffId: "staff-tom" },
      { staffId: "staff-lisa", deEscalationSkills: false, incidentRecording: false, restraintCertification: false, postIncidentSupport: false, childProtectionAwareness: false, conflictResolution: false },
    ];
    const result = evaluateStaffIncidentReadiness(staff);
    expect(result.deEscalationSkillsRate).toBe(67);
    expect(result.totalStaff).toBe(3);
  });

  it("never exceeds 25", () => {
    const staff = Array.from({ length: 50 }, (_, i) => ({ ...makeFullStaff(), staffId: `staff-${i}` }));
    expect(evaluateStaffIncidentReadiness(staff).overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Child Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildIncidentProfiles", () => {
  it("returns empty array for no records", () => {
    expect(buildChildIncidentProfiles([])).toEqual([]);
  });

  it("groups by childId", () => {
    const records = [
      makeRecord({ id: "inc-1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "inc-2", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "inc-3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildIncidentProfiles(records);
    expect(profiles).toHaveLength(2);
  });

  it("scores 10 for perfect child (many records, high rates, diverse)", () => {
    const cats = ["physical_incident", "verbal_incident", "self_harm", "absconding", "substance_misuse"] as const;
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `inc-${i}`, childId: "child-alex", childName: "Alex", category: cats[i % cats.length] })
    );
    const profiles = buildChildIncidentProfiles(records);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("scores frequency: >=10 records -> 2, >=5 -> 1, <5 -> 0", () => {
    // 3 records → freq:0 + rate1:3 + rate2:3 + diversity:0 = 6
    const records = Array.from({ length: 3 }, (_, i) => makeRecord({ id: `inc-${i}` }));
    const profiles = buildChildIncidentProfiles(records);
    expect(profiles[0].overallScore).toBe(6);
  });

  it("frequency 5 scores 1", () => {
    const records = Array.from({ length: 5 }, (_, i) => makeRecord({ id: `inc-${i}` }));
    const profiles = buildChildIncidentProfiles(records);
    // freq:1 + rate1:3 + rate2:3 + diversity:0 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("frequency 10 scores 2", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `inc-${i}` }));
    const profiles = buildChildIncidentProfiles(records);
    // freq:2 + rate1:3 + rate2:3 + diversity:0 = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("deEscalation rate thresholds: 80->3, 60->2, 40->1, <40->0", () => {
    // 5 records, 3 with deEsc=true → rate 60 → score 2
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `inc-${i}`, deEscalationAttempted: i < 3, childViewRecorded: false })
    );
    const profiles = buildChildIncidentProfiles(records);
    // freq:1 + deEsc(60%):2 + childView(0%):0 + diversity:0 = 3
    expect(profiles[0].overallScore).toBe(3);
  });

  it("childView rate thresholds: 80->3, 60->2, 40->1, <40->0", () => {
    // 5 records, 2 with childView=true → rate 40 → score 1
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `inc-${i}`, deEscalationAttempted: false, childViewRecorded: i < 2 })
    );
    const profiles = buildChildIncidentProfiles(records);
    // freq:1 + deEsc(0%):0 + childView(40%):1 + diversity:0 = 2
    expect(profiles[0].overallScore).toBe(2);
  });

  it("diversity thresholds: >=4 -> 2, >=2 -> 1, <2 -> 0", () => {
    const records = [
      makeRecord({ id: "inc-1", category: "physical_incident", deEscalationAttempted: false, childViewRecorded: false }),
      makeRecord({ id: "inc-2", category: "verbal_incident", deEscalationAttempted: false, childViewRecorded: false }),
      makeRecord({ id: "inc-3", category: "self_harm", deEscalationAttempted: false, childViewRecorded: false }),
      makeRecord({ id: "inc-4", category: "absconding", deEscalationAttempted: false, childViewRecorded: false }),
    ];
    const profiles = buildChildIncidentProfiles(records);
    // freq:0 + deEsc(0%):0 + childView(0%):0 + diversity(4):2 = 2
    expect(profiles[0].overallScore).toBe(2);
    expect(profiles[0].categoriesCovered).toHaveLength(4);
  });

  it("sorts by overallScore descending", () => {
    const records = [
      makeRecord({ id: "inc-1", childId: "child-alex", childName: "Alex", deEscalationAttempted: false, childViewRecorded: false }),
      ...Array.from({ length: 10 }, (_, i) =>
        makeRecord({ id: `inc-j${i}`, childId: "child-jordan", childName: "Jordan", category: (["physical_incident", "verbal_incident", "self_harm", "absconding"] as const)[i % 4] })
      ),
    ];
    const profiles = buildChildIncidentProfiles(records);
    expect(profiles[0].childId).toBe("child-jordan");
  });

  it("caps at 10", () => {
    const cats = ["physical_incident", "verbal_incident", "self_harm", "absconding", "substance_misuse", "criminal_behaviour"] as const;
    const records = Array.from({ length: 15 }, (_, i) =>
      makeRecord({ id: `inc-${i}`, childId: "child-alex", childName: "Alex", category: cats[i % cats.length] })
    );
    const profiles = buildChildIncidentProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("includes categoriesCovered list", () => {
    const records = [
      makeRecord({ id: "inc-1", category: "physical_incident" }),
      makeRecord({ id: "inc-2", category: "verbal_incident" }),
      makeRecord({ id: "inc-3", category: "physical_incident" }),
    ];
    const profiles = buildChildIncidentProfiles(records);
    expect(profiles[0].categoriesCovered).toEqual(expect.arrayContaining(["physical_incident", "verbal_incident"]));
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });

  it("returns correct rates per child", () => {
    const records = [
      makeRecord({ id: "inc-1", childId: "child-alex", childName: "Alex", deEscalationAttempted: true, childViewRecorded: true }),
      makeRecord({ id: "inc-2", childId: "child-alex", childName: "Alex", deEscalationAttempted: false, childViewRecorded: true }),
    ];
    const profiles = buildChildIncidentProfiles(records);
    expect(profiles[0].deEscalationAttemptedRate).toBe(50);
    expect(profiles[0].childViewRecordedRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Orchestrator
// ══════════════════════════════════════════════════════════════════════════════

describe("generateIncidentIntelligence", () => {
  it("returns outstanding for perfect data", () => {
    const cats = ["physical_incident", "verbal_incident", "self_harm", "absconding", "substance_misuse", "criminal_behaviour", "bullying", "property_damage"] as const;
    const records = cats.map((cat, i) => makeRecord({ id: `inc-${i}`, category: cat }));
    const staff = [makeFullStaff(), { ...makeFullStaff(), staffId: "staff-tom" }];

    const result = generateIncidentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeFullPolicy(),
      staff,
    });

    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("returns inadequate for empty data", () => {
    const result = generateIncidentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("filters records to period", () => {
    const records = [
      makeRecord({ id: "inc-1", date: "2026-03-15" }),   // in range
      makeRecord({ id: "inc-2", date: "2026-06-15" }),   // in range
      makeRecord({ id: "inc-3", date: "2025-12-31" }),   // out of range (before)
      makeRecord({ id: "inc-4", date: "2026-09-01" }),   // out of range (after)
    ];

    const result = generateIncidentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-08-31",
      records,
      policy: makeFullPolicy(),
      staff: [makeFullStaff()],
    });

    expect(result.incidentQuality.totalRecords).toBe(2);
  });

  it("includes boundary dates in period filter", () => {
    const records = [
      makeRecord({ id: "inc-1", date: "2026-01-01" }),   // start boundary
      makeRecord({ id: "inc-2", date: "2026-12-31" }),   // end boundary
    ];

    const result = generateIncidentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeFullPolicy(),
      staff: [makeFullStaff()],
    });

    expect(result.incidentQuality.totalRecords).toBe(2);
  });

  it("sums 4 evaluator scores", () => {
    const cats = ["physical_incident", "verbal_incident", "self_harm", "absconding", "substance_misuse", "criminal_behaviour", "bullying", "property_damage"] as const;
    const records = cats.map((cat, i) => makeRecord({ id: `inc-${i}`, category: cat }));
    const staff = [makeFullStaff()];

    const result = generateIncidentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeFullPolicy(),
      staff,
    });

    const expectedSum =
      result.incidentQuality.overallScore +
      result.incidentCompliance.overallScore +
      result.incidentPolicy.overallScore +
      result.staffReadiness.overallScore;

    expect(result.overallScore).toBe(Math.min(100, expectedSum));
  });

  it("caps overallScore at 100", () => {
    const cats = ["physical_incident", "verbal_incident", "self_harm", "absconding", "substance_misuse", "criminal_behaviour", "bullying", "property_damage"] as const;
    const records = cats.map((cat, i) => makeRecord({ id: `inc-${i}`, category: cat }));
    const staff = [makeFullStaff()];

    const result = generateIncidentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeFullPolicy(),
      staff,
    });

    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates strengths for excellent data", () => {
    const cats = ["physical_incident", "verbal_incident", "self_harm", "absconding", "substance_misuse", "criminal_behaviour", "bullying", "property_damage"] as const;
    const records = cats.map((cat, i) => makeRecord({ id: `inc-${i}`, category: cat }));
    const staff = [makeFullStaff()];

    const result = generateIncidentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeFullPolicy(),
      staff,
    });

    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("populates actions for empty records", () => {
    const result = generateIncidentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.actions.some(a => a.includes("URGENT"))).toBe(true);
  });

  it("includes correct metadata fields", () => {
    const result = generateIncidentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.homeId).toBe("home-oak");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("includes child profiles in result", () => {
    const records = [
      makeRecord({ id: "inc-1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "inc-2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateIncidentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: makeFullPolicy(),
      staff: [makeFullStaff()],
    });

    expect(result.childProfiles).toHaveLength(2);
  });

  it("returns good for decent but not perfect data", () => {
    const records = [
      makeRecord({ id: "inc-1", category: "physical_incident" }),
      makeRecord({ id: "inc-2", category: "verbal_incident", childViewRecorded: false }),
      makeRecord({ id: "inc-3", category: "self_harm", debriefConducted: false }),
      makeRecord({ id: "inc-4", category: "absconding", lessonsIdentified: false, timelyRecording: false }),
      makeRecord({ id: "inc-5", category: "substance_misuse", deEscalationAttempted: false, documentationComplete: false }),
      makeRecord({ id: "inc-6", category: "physical_incident", childViewRecorded: false, debriefConducted: false }),
    ];
    const policy: IncidentPolicy = {
      incidentManagementPolicy: true,
      deEscalationGuidance: true,
      restraintPolicy: true,
      postIncidentDebriefPolicy: false,
      childViewInIncidentPolicy: true,
      notificationProcedure: false,
      lessonsLearnedFramework: false,
    };
    const staff: StaffIncidentTraining[] = [
      makeFullStaff(),
      { ...makeFullStaff(), staffId: "staff-tom", deEscalationSkills: false, restraintCertification: false, conflictResolution: false },
    ];

    const result = generateIncidentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy,
      staff,
    });

    expect(result.rating).toBe("good");
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThan(80);
  });

  it("regulatory links match the specified 7 links", () => {
    const result = generateIncidentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 34 — Safeguarding of children");
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 35 — Behaviour management");
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 40 — Notification of serious events");
    expect(result.regulatoryLinks).toContain("NMS 9 — Positive behaviour and relationships");
    expect(result.regulatoryLinks).toContain("SCCIF — Safety: behaviour management and incident handling");
    expect(result.regulatoryLinks).toContain("Children Act 1989 s.22 — Duty of care");
    expect(result.regulatoryLinks).toContain("Quality Standards 2015 — Standard 3 (protection)");
  });

  it("areasForImprovement populated for weak data", () => {
    const records = [
      makeRecord({ id: "inc-1", deEscalationAttempted: false, childViewRecorded: false, debriefConducted: false, documentationComplete: false, timelyRecording: false }),
    ];
    const result = generateIncidentIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: null,
      staff: [],
    });

    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });
});
