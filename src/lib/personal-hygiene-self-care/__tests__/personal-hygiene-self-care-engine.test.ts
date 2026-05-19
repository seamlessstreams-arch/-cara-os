import { describe, it, expect } from "vitest";
import {
  generatePersonalHygieneSelfCareIntelligence, evaluateSelfCareQuality, evaluateDignityPrivacy,
  evaluateHygienePolicy, evaluateStaffHygieneReadiness, buildChildHygieneProfiles, pct, getRating,
  getHygieneAreaLabel, getSupportLevelLabel, getRatingLabel,
} from "../personal-hygiene-self-care-engine";
import type { HygieneRecord, HygienePolicy, StaffHygieneTraining } from "../personal-hygiene-self-care-engine";

let _id = 0;
function makeRecord(overrides: Partial<HygieneRecord> = {}): HygieneRecord {
  _id++;
  return { id: `hr-${_id}`, childId: "child-a", childName: "Alex", recordDate: "2026-04-01", hygieneArea: "bathing_showering", supportLevel: "independent", dignityMaintained: true, childChoiceRespected: true, appropriateProducts: true, privacyEnsured: true, staffSupportSensitive: true, documentedInPlan: true, ...overrides };
}
function makePolicy(overrides: Partial<HygienePolicy> = {}): HygienePolicy {
  return { id: "hp-1", personalCarePolicy: true, dignityPrivacyGuidance: true, ageAppropriateSupport: true, culturalSensitivity: true, menstrualHygieneProvision: true, productAvailability: true, regularReview: true, ...overrides };
}
let _tid = 0;
function makeTraining(overrides: Partial<StaffHygieneTraining> = {}): StaffHygieneTraining {
  _tid++;
  return { id: `ht-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, personalCareSupport: true, dignityInPractice: true, culturalAwareness: true, menstrualHealthAwareness: true, infectionControl: true, sensitiveConversations: true, ...overrides };
}

describe("pct", () => {
  it("returns percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 for den=0", () => { expect(pct(0, 0)).toBe(0); });
  it("returns 100 for equal", () => { expect(pct(5, 5)).toBe(100); });
  it("returns 0 for num=0", () => { expect(pct(0, 10)).toBe(0); });
});

describe("getRating", () => {
  it("outstanding >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("inadequate < 40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

describe("label getters", () => {
  it("getHygieneAreaLabel", () => {
    expect(getHygieneAreaLabel("bathing_showering")).toBe("Bathing/Showering");
    expect(getHygieneAreaLabel("dental_care")).toBe("Dental Care");
    expect(getHygieneAreaLabel("menstrual_hygiene")).toBe("Menstrual Hygiene");
    expect(getHygieneAreaLabel("handwashing")).toBe("Handwashing");
  });
  it("getSupportLevelLabel", () => {
    expect(getSupportLevelLabel("independent")).toBe("Independent");
    expect(getSupportLevelLabel("prompted")).toBe("Prompted");
    expect(getSupportLevelLabel("fully_supported")).toBe("Fully Supported");
    expect(getSupportLevelLabel("refused")).toBe("Refused");
  });
  it("getRatingLabel", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
});

describe("evaluateSelfCareQuality", () => {
  it("returns 0 for empty", () => {
    const r = evaluateSelfCareQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalRecords).toBe(0);
  });
  it("scores 25 for perfect", () => {
    const r = evaluateSelfCareQuality(Array.from({ length: 10 }, () => makeRecord()));
    expect(r.overallScore).toBe(25);
  });
  it("counts independent+prompted as independent", () => {
    const records = [
      makeRecord({ supportLevel: "independent" }),
      makeRecord({ supportLevel: "prompted" }),
      makeRecord({ supportLevel: "assisted" }),
      makeRecord({ supportLevel: "fully_supported" }),
      makeRecord({ supportLevel: "refused" }),
    ];
    expect(evaluateSelfCareQuality(records).independenceRate).toBe(40);
  });
  it("calculates dignity rate", () => {
    const records = [makeRecord({ dignityMaintained: true }), makeRecord({ dignityMaintained: false })];
    expect(evaluateSelfCareQuality(records).dignityRate).toBe(50);
  });
  it("calculates choice respected rate", () => {
    const records = [makeRecord({ childChoiceRespected: true }), makeRecord({ childChoiceRespected: false }), makeRecord({ childChoiceRespected: false })];
    expect(evaluateSelfCareQuality(records).choiceRespectedRate).toBe(33);
  });
  it("calculates appropriate products rate", () => {
    const records = Array.from({ length: 4 }, () => makeRecord({ appropriateProducts: true })).concat([makeRecord({ appropriateProducts: false })]);
    expect(evaluateSelfCareQuality(records).appropriateProductsRate).toBe(80);
  });
  it("caps at 25", () => {
    expect(evaluateSelfCareQuality(Array.from({ length: 20 }, () => makeRecord())).overallScore).toBeLessThanOrEqual(25);
  });
  it("scores lower with poor dignity", () => {
    const good = evaluateSelfCareQuality(Array.from({ length: 5 }, () => makeRecord()));
    const bad = evaluateSelfCareQuality(Array.from({ length: 5 }, () => makeRecord({ dignityMaintained: false, childChoiceRespected: false })));
    expect(good.overallScore).toBeGreaterThan(bad.overallScore);
  });
});

describe("evaluateDignityPrivacy", () => {
  it("returns 0 for empty", () => {
    const r = evaluateDignityPrivacy([]);
    expect(r.overallScore).toBe(0);
  });
  it("scores 25 for perfect", () => {
    const r = evaluateDignityPrivacy(Array.from({ length: 10 }, () => makeRecord()));
    expect(r.overallScore).toBe(25);
  });
  it("calculates privacy rate", () => {
    const records = [makeRecord({ privacyEnsured: true }), makeRecord({ privacyEnsured: false })];
    expect(evaluateDignityPrivacy(records).privacyRate).toBe(50);
  });
  it("calculates sensitive staff rate", () => {
    const records = [makeRecord({ staffSupportSensitive: true }), makeRecord({ staffSupportSensitive: false }), makeRecord({ staffSupportSensitive: true })];
    expect(evaluateDignityPrivacy(records).sensitiveStaffRate).toBe(67);
  });
  it("calculates documented rate", () => {
    const records = Array.from({ length: 3 }, () => makeRecord({ documentedInPlan: true })).concat([makeRecord({ documentedInPlan: false })]);
    expect(evaluateDignityPrivacy(records).documentedRate).toBe(75);
  });
  it("calculates dignity maintained rate", () => {
    const records = [makeRecord({ dignityMaintained: true }), makeRecord({ dignityMaintained: true }), makeRecord({ dignityMaintained: false })];
    expect(evaluateDignityPrivacy(records).dignityMaintainedRate).toBe(67);
  });
  it("caps at 25", () => {
    expect(evaluateDignityPrivacy(Array.from({ length: 20 }, () => makeRecord())).overallScore).toBeLessThanOrEqual(25);
  });
  it("scores lower with poor privacy", () => {
    const good = evaluateDignityPrivacy(Array.from({ length: 5 }, () => makeRecord()));
    const bad = evaluateDignityPrivacy(Array.from({ length: 5 }, () => makeRecord({ privacyEnsured: false, staffSupportSensitive: false })));
    expect(good.overallScore).toBeGreaterThan(bad.overallScore);
  });
});

describe("evaluateHygienePolicy", () => {
  it("returns 0 for null", () => {
    const r = evaluateHygienePolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.personalCarePolicy).toBe(false);
  });
  it("scores 25 for full policy", () => {
    expect(evaluateHygienePolicy(makePolicy()).overallScore).toBe(25);
  });
  it("scores individual 4-point items", () => {
    expect(evaluateHygienePolicy(makePolicy({ personalCarePolicy: true, dignityPrivacyGuidance: false, ageAppropriateSupport: false, culturalSensitivity: false, menstrualHygieneProvision: false, productAvailability: false, regularReview: false })).overallScore).toBe(4);
  });
  it("scores individual 3-point items", () => {
    expect(evaluateHygienePolicy(makePolicy({ personalCarePolicy: false, dignityPrivacyGuidance: false, ageAppropriateSupport: false, culturalSensitivity: false, menstrualHygieneProvision: true, productAvailability: false, regularReview: false })).overallScore).toBe(3);
  });
  it("4-point items = 16", () => {
    expect(evaluateHygienePolicy(makePolicy({ menstrualHygieneProvision: false, productAvailability: false, regularReview: false })).overallScore).toBe(16);
  });
  it("3-point items = 9", () => {
    expect(evaluateHygienePolicy(makePolicy({ personalCarePolicy: false, dignityPrivacyGuidance: false, ageAppropriateSupport: false, culturalSensitivity: false })).overallScore).toBe(9);
  });
  it("all false = 0", () => {
    expect(evaluateHygienePolicy(makePolicy({ personalCarePolicy: false, dignityPrivacyGuidance: false, ageAppropriateSupport: false, culturalSensitivity: false, menstrualHygieneProvision: false, productAvailability: false, regularReview: false })).overallScore).toBe(0);
  });
  it("exposes individual flags", () => {
    const r = evaluateHygienePolicy(makePolicy({ productAvailability: false }));
    expect(r.productAvailability).toBe(false);
    expect(r.personalCarePolicy).toBe(true);
  });
});

describe("evaluateStaffHygieneReadiness", () => {
  it("returns 0 for empty", () => {
    const r = evaluateStaffHygieneReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
  });
  it("scores 25 for fully trained", () => {
    expect(evaluateStaffHygieneReadiness(Array.from({ length: 5 }, () => makeTraining())).overallScore).toBe(25);
  });
  it("scores 0 for untrained staff", () => {
    expect(evaluateStaffHygieneReadiness([makeTraining({ personalCareSupport: false, dignityInPractice: false, culturalAwareness: false, menstrualHealthAwareness: false, infectionControl: false, sensitiveConversations: false })]).overallScore).toBe(0);
  });
  it("single fully trained = 25", () => {
    expect(evaluateStaffHygieneReadiness([makeTraining()]).overallScore).toBe(25);
  });
  it("caps at 25", () => {
    expect(evaluateStaffHygieneReadiness(Array.from({ length: 20 }, () => makeTraining())).overallScore).toBeLessThanOrEqual(25);
  });
  it("calculates individual rates", () => {
    const t = [makeTraining({ culturalAwareness: false }), makeTraining()];
    const r = evaluateStaffHygieneReadiness(t);
    expect(r.culturalAwarenessRate).toBe(50);
    expect(r.personalCareSupportRate).toBe(100);
  });
});

describe("buildChildHygieneProfiles", () => {
  it("returns empty for no records", () => {
    expect(buildChildHygieneProfiles([]).length).toBe(0);
  });
  it("groups by child", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex" }), makeRecord({ childId: "c2", childName: "Jordan" })];
    expect(buildChildHygieneProfiles(records).length).toBe(2);
  });
  it("calculates independence rate", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "Alex", supportLevel: "independent" }),
      makeRecord({ childId: "c1", childName: "Alex", supportLevel: "refused" }),
    ];
    expect(buildChildHygieneProfiles(records)[0].independenceRate).toBe(50);
  });
  it("calculates dignity rate", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "Alex", dignityMaintained: true }),
      makeRecord({ childId: "c1", childName: "Alex", dignityMaintained: false }),
    ];
    expect(buildChildHygieneProfiles(records)[0].dignityRate).toBe(50);
  });
  it("counts unique areas", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "Alex", hygieneArea: "bathing_showering" }),
      makeRecord({ childId: "c1", childName: "Alex", hygieneArea: "dental_care" }),
      makeRecord({ childId: "c1", childName: "Alex", hygieneArea: "bathing_showering" }),
    ];
    expect(buildChildHygieneProfiles(records)[0].areasCount).toBe(2);
  });
  it("caps at 10", () => {
    const records = Array.from({ length: 15 }, (_, i) => makeRecord({ childId: "c1", childName: "Alex", hygieneArea: (["bathing_showering", "dental_care", "hair_care", "skincare", "nail_care", "clothing_cleanliness", "menstrual_hygiene", "handwashing"] as const)[i % 8] }));
    expect(buildChildHygieneProfiles(records)[0].overallScore).toBeLessThanOrEqual(10);
  });
  it("perfect profile = 10", () => {
    const areas: HygieneRecord["hygieneArea"][] = ["bathing_showering", "dental_care", "hair_care", "skincare", "nail_care", "clothing_cleanliness", "menstrual_hygiene", "handwashing"];
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ childId: "c1", childName: "Alex", hygieneArea: areas[i % 8] }));
    expect(buildChildHygieneProfiles(records)[0].overallScore).toBe(10);
  });
  it("low frequency scores lower", () => {
    const records = [makeRecord({ childId: "c1", childName: "Alex" })];
    expect(buildChildHygieneProfiles(records)[0].overallScore).toBeLessThan(10);
  });
});

describe("generatePersonalHygieneSelfCareIntelligence", () => {
  const b = { homeId: "oak-house", periodStart: "2026-01-01", periodEnd: "2026-05-19" };

  it("returns inadequate for empty", () => {
    const r = generatePersonalHygieneSelfCareIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("returns outstanding for perfect", () => {
    const r = generatePersonalHygieneSelfCareIntelligence(Array.from({ length: 10 }, () => makeRecord()), makePolicy(), Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });
  it("caps at 100", () => {
    const r = generatePersonalHygieneSelfCareIntelligence(Array.from({ length: 20 }, () => makeRecord()), makePolicy(), Array.from({ length: 10 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("includes homeId and period", () => {
    const r = generatePersonalHygieneSelfCareIntelligence([], null, [], "test", "2026-01-01", "2026-06-30");
    expect(r.homeId).toBe("test");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-06-30");
  });
  it("generates strengths for high independence", () => {
    const r = generatePersonalHygieneSelfCareIntelligence(Array.from({ length: 5 }, () => makeRecord()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("independence"))).toBe(true);
  });
  it("generates strength for high dignity", () => {
    const r = generatePersonalHygieneSelfCareIntelligence(Array.from({ length: 5 }, () => makeRecord()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("dignity"))).toBe(true);
  });
  it("generates strength for high privacy", () => {
    const r = generatePersonalHygieneSelfCareIntelligence(Array.from({ length: 5 }, () => makeRecord()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("Privacy"))).toBe(true);
  });
  it("generates action for no records", () => {
    const r = generatePersonalHygieneSelfCareIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("No personal hygiene records"))).toBe(true);
  });
  it("generates URGENT for no policy", () => {
    const r = generatePersonalHygieneSelfCareIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });
  it("generates URGENT for no training", () => {
    const r = generatePersonalHygieneSelfCareIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });
  it("has 7 regulatory links", () => {
    const r = generatePersonalHygieneSelfCareIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.length).toBe(7);
    expect(r.regulatoryLinks.some((l) => l.includes("UNCRC Article 16"))).toBe(true);
  });
  it("generates areas for improvement for low independence", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ supportLevel: "fully_supported", dignityMaintained: false }));
    const r = generatePersonalHygieneSelfCareIntelligence(records, makePolicy(), Array.from({ length: 3 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.areasForImprovement.some((a) => a.includes("Independence"))).toBe(true);
  });
  it("good rating for 75", () => {
    const r = generatePersonalHygieneSelfCareIntelligence(Array.from({ length: 5 }, () => makeRecord()), null, Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(75);
    expect(r.rating).toBe("good");
  });
  it("generates action for low products rate", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ appropriateProducts: false }));
    const r = generatePersonalHygieneSelfCareIntelligence(records, makePolicy(), Array.from({ length: 3 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("products"))).toBe(true);
  });
  it("generates action for low sensitive staff rate", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ staffSupportSensitive: false }));
    const r = generatePersonalHygieneSelfCareIntelligence(records, makePolicy(), Array.from({ length: 3 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("sensitivity"))).toBe(true);
  });
});
