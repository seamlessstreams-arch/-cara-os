import { describe, it, expect } from "vitest";
import {
  generateStaffSupervisionEffectivenessIntelligence, evaluateSessionEffectiveness, evaluateSupervisionCompliance,
  evaluateSupervisionPolicy, evaluateSupervisorReadiness, buildStaffSupervisionProfiles, pct, getRating,
  getSupervisionTypeLabel, getSupervisionOutcomeLabel, getRatingLabel,
} from "../staff-supervision-effectiveness-engine";
import type { SupervisionSession, SupervisionPolicy, SupervisorTraining } from "../staff-supervision-effectiveness-engine";

let _id = 0;
function makeSession(overrides: Partial<SupervisionSession> = {}): SupervisionSession {
  _id++;
  return { id: `ss-${_id}`, staffId: "staff-sarah", staffName: "Sarah Johnson", supervisorId: "sup-darren", supervisorName: "Darren Laville", sessionDate: "2026-04-01", supervisionType: "formal_one_to_one", supervisionOutcome: "very_effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentedInRecord: true, staffSatisfied: true, ...overrides };
}
function makePolicy(overrides: Partial<SupervisionPolicy> = {}): SupervisionPolicy {
  return { id: "sp-1", supervisionFramework: true, frequencyStandards: true, safeguardingRequirement: true, reflectivePracticeModel: true, documentationStandards: true, escalationProcedure: true, regularReview: true, ...overrides };
}
let _tid = 0;
function makeTraining(overrides: Partial<SupervisorTraining> = {}): SupervisorTraining {
  _tid++;
  return { id: `st-${_tid}`, staffId: `sup-${_tid}`, staffName: `Supervisor ${_tid}`, supervisionSkills: true, reflectivePractice: true, safeguardingOversight: true, performanceManagement: true, wellbeingSupport: true, documentationSkills: true, ...overrides };
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
  it("getSupervisionTypeLabel", () => {
    expect(getSupervisionTypeLabel("formal_one_to_one")).toBe("Formal One-to-One");
    expect(getSupervisionTypeLabel("reflective_practice")).toBe("Reflective Practice");
    expect(getSupervisionTypeLabel("clinical_supervision")).toBe("Clinical Supervision");
    expect(getSupervisionTypeLabel("management_supervision")).toBe("Management Supervision");
  });
  it("getSupervisionOutcomeLabel", () => {
    expect(getSupervisionOutcomeLabel("very_effective")).toBe("Very Effective");
    expect(getSupervisionOutcomeLabel("ineffective")).toBe("Ineffective");
    expect(getSupervisionOutcomeLabel("not_attended")).toBe("Not Attended");
  });
  it("getRatingLabel", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

describe("evaluateSessionEffectiveness", () => {
  it("returns 0 for empty", () => { const r = evaluateSessionEffectiveness([]); expect(r.overallScore).toBe(0); expect(r.totalSessions).toBe(0); });
  it("scores 25 for perfect", () => { expect(evaluateSessionEffectiveness(Array.from({ length: 10 }, () => makeSession())).overallScore).toBe(25); });
  it("counts very_effective+effective as effective", () => {
    const sessions = [makeSession({ supervisionOutcome: "very_effective" }), makeSession({ supervisionOutcome: "effective" }), makeSession({ supervisionOutcome: "partially_effective" }), makeSession({ supervisionOutcome: "ineffective" }), makeSession({ supervisionOutcome: "not_attended" })];
    expect(evaluateSessionEffectiveness(sessions).effectivenessRate).toBe(40);
  });
  it("calculates safeguarding rate", () => {
    const sessions = [makeSession({ safeguardingDiscussed: true }), makeSession({ safeguardingDiscussed: false })];
    expect(evaluateSessionEffectiveness(sessions).safeguardingRate).toBe(50);
  });
  it("calculates wellbeing rate", () => {
    const sessions = [makeSession({ wellbeingChecked: true }), makeSession({ wellbeingChecked: true }), makeSession({ wellbeingChecked: false })];
    expect(evaluateSessionEffectiveness(sessions).wellbeingRate).toBe(67);
  });
  it("calculates action points rate", () => {
    const sessions = Array.from({ length: 4 }, () => makeSession({ actionPointsSet: true })).concat([makeSession({ actionPointsSet: false })]);
    expect(evaluateSessionEffectiveness(sessions).actionPointsRate).toBe(80);
  });
  it("caps at 25", () => { expect(evaluateSessionEffectiveness(Array.from({ length: 20 }, () => makeSession())).overallScore).toBeLessThanOrEqual(25); });
  it("scores lower with poor outcomes", () => {
    const good = evaluateSessionEffectiveness(Array.from({ length: 5 }, () => makeSession()));
    const bad = evaluateSessionEffectiveness(Array.from({ length: 5 }, () => makeSession({ supervisionOutcome: "ineffective", safeguardingDiscussed: false })));
    expect(good.overallScore).toBeGreaterThan(bad.overallScore);
  });
});

describe("evaluateSupervisionCompliance", () => {
  it("returns 0 for empty", () => { expect(evaluateSupervisionCompliance([]).overallScore).toBe(0); });
  it("calculates previous actions reviewed rate", () => {
    const sessions = [makeSession({ previousActionsReviewed: true }), makeSession({ previousActionsReviewed: false })];
    expect(evaluateSupervisionCompliance(sessions).previousActionsReviewedRate).toBe(50);
  });
  it("calculates documented rate", () => {
    const sessions = [makeSession({ documentedInRecord: true }), makeSession({ documentedInRecord: false }), makeSession({ documentedInRecord: true })];
    expect(evaluateSupervisionCompliance(sessions).documentedRate).toBe(67);
  });
  it("calculates staff satisfaction rate", () => {
    const sessions = Array.from({ length: 3 }, () => makeSession({ staffSatisfied: true })).concat([makeSession({ staffSatisfied: false })]);
    expect(evaluateSupervisionCompliance(sessions).staffSatisfactionRate).toBe(75);
  });
  it("calculates type diversity ratio", () => {
    const sessions = [makeSession({ supervisionType: "formal_one_to_one" }), makeSession({ supervisionType: "formal_one_to_one" })];
    expect(evaluateSupervisionCompliance(sessions).typeDiversityRatio).toBe(13);
  });
  it("caps at 25", () => { expect(evaluateSupervisionCompliance(Array.from({ length: 20 }, () => makeSession())).overallScore).toBeLessThanOrEqual(25); });
});

describe("evaluateSupervisionPolicy", () => {
  it("returns 0 for null", () => { const r = evaluateSupervisionPolicy(null); expect(r.overallScore).toBe(0); expect(r.supervisionFramework).toBe(false); });
  it("scores 25 for full policy", () => { expect(evaluateSupervisionPolicy(makePolicy()).overallScore).toBe(25); });
  it("4-point items individually", () => { expect(evaluateSupervisionPolicy(makePolicy({ supervisionFramework: true, frequencyStandards: false, safeguardingRequirement: false, reflectivePracticeModel: false, documentationStandards: false, escalationProcedure: false, regularReview: false })).overallScore).toBe(4); });
  it("3-point items individually", () => { expect(evaluateSupervisionPolicy(makePolicy({ supervisionFramework: false, frequencyStandards: false, safeguardingRequirement: false, reflectivePracticeModel: false, documentationStandards: true, escalationProcedure: false, regularReview: false })).overallScore).toBe(3); });
  it("4-point items = 16", () => { expect(evaluateSupervisionPolicy(makePolicy({ documentationStandards: false, escalationProcedure: false, regularReview: false })).overallScore).toBe(16); });
  it("3-point items = 9", () => { expect(evaluateSupervisionPolicy(makePolicy({ supervisionFramework: false, frequencyStandards: false, safeguardingRequirement: false, reflectivePracticeModel: false })).overallScore).toBe(9); });
  it("all false = 0", () => { expect(evaluateSupervisionPolicy(makePolicy({ supervisionFramework: false, frequencyStandards: false, safeguardingRequirement: false, reflectivePracticeModel: false, documentationStandards: false, escalationProcedure: false, regularReview: false })).overallScore).toBe(0); });
});

describe("evaluateSupervisorReadiness", () => {
  it("returns 0 for empty", () => { const r = evaluateSupervisorReadiness([]); expect(r.overallScore).toBe(0); expect(r.totalSupervisors).toBe(0); });
  it("scores 25 for fully trained", () => { expect(evaluateSupervisorReadiness(Array.from({ length: 5 }, () => makeTraining())).overallScore).toBe(25); });
  it("scores 0 for untrained", () => { expect(evaluateSupervisorReadiness([makeTraining({ supervisionSkills: false, reflectivePractice: false, safeguardingOversight: false, performanceManagement: false, wellbeingSupport: false, documentationSkills: false })]).overallScore).toBe(0); });
  it("single fully trained = 25", () => { expect(evaluateSupervisorReadiness([makeTraining()]).overallScore).toBe(25); });
  it("caps at 25", () => { expect(evaluateSupervisorReadiness(Array.from({ length: 20 }, () => makeTraining())).overallScore).toBeLessThanOrEqual(25); });
});

describe("buildStaffSupervisionProfiles", () => {
  it("returns empty for no sessions", () => { expect(buildStaffSupervisionProfiles([]).length).toBe(0); });
  it("groups by staff", () => {
    const sessions = [makeSession({ staffId: "s1", staffName: "Sarah" }), makeSession({ staffId: "s2", staffName: "Tom" })];
    expect(buildStaffSupervisionProfiles(sessions).length).toBe(2);
  });
  it("calculates effectiveness rate", () => {
    const sessions = [makeSession({ staffId: "s1", staffName: "Sarah", supervisionOutcome: "very_effective" }), makeSession({ staffId: "s1", staffName: "Sarah", supervisionOutcome: "ineffective" })];
    expect(buildStaffSupervisionProfiles(sessions)[0].effectivenessRate).toBe(50);
  });
  it("calculates safeguarding rate", () => {
    const sessions = [makeSession({ staffId: "s1", staffName: "Sarah", safeguardingDiscussed: true }), makeSession({ staffId: "s1", staffName: "Sarah", safeguardingDiscussed: false })];
    expect(buildStaffSupervisionProfiles(sessions)[0].safeguardingRate).toBe(50);
  });
  it("consistency bonus for single supervisor", () => {
    const sessions = Array.from({ length: 10 }, () => makeSession({ staffId: "s1", staffName: "Sarah", supervisorId: "sup-1" }));
    expect(buildStaffSupervisionProfiles(sessions)[0].overallScore).toBe(10);
  });
  it("caps at 10", () => {
    const sessions = Array.from({ length: 15 }, () => makeSession({ staffId: "s1", staffName: "Sarah" }));
    expect(buildStaffSupervisionProfiles(sessions)[0].overallScore).toBeLessThanOrEqual(10);
  });
});

describe("generateStaffSupervisionEffectivenessIntelligence", () => {
  const b = { homeId: "oak-house", periodStart: "2026-01-01", periodEnd: "2026-05-19" };

  it("returns inadequate for empty", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
  });
  it("returns outstanding for perfect", () => {
    const types: SupervisionSession["supervisionType"][] = ["formal_one_to_one", "group_supervision", "reflective_practice", "case_discussion", "clinical_supervision", "ad_hoc_support", "peer_supervision", "management_supervision"];
    const sessions = Array.from({ length: 10 }, (_, i) => makeSession({ supervisionType: types[i % 8] }));
    const r = generateStaffSupervisionEffectivenessIntelligence(sessions, makePolicy(), Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(100); expect(r.rating).toBe("outstanding");
  });
  it("caps at 100", () => {
    const types: SupervisionSession["supervisionType"][] = ["formal_one_to_one", "group_supervision", "reflective_practice", "case_discussion", "clinical_supervision", "ad_hoc_support", "peer_supervision", "management_supervision"];
    const r = generateStaffSupervisionEffectivenessIntelligence(Array.from({ length: 20 }, (_, i) => makeSession({ supervisionType: types[i % 8] })), makePolicy(), Array.from({ length: 10 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("includes homeId and period", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence([], null, [], "test", "2026-01-01", "2026-06-30");
    expect(r.homeId).toBe("test"); expect(r.periodStart).toBe("2026-01-01");
  });
  it("generates strength for high effectiveness", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence(Array.from({ length: 5 }, () => makeSession()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("effectiveness"))).toBe(true);
  });
  it("generates strength for high safeguarding", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence(Array.from({ length: 5 }, () => makeSession()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("Safeguarding"))).toBe(true);
  });
  it("generates action for no sessions", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("No supervision session records"))).toBe(true);
  });
  it("generates URGENT for no policy", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });
  it("generates URGENT for no training", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });
  it("has 7 regulatory links", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.length).toBe(7);
    expect(r.regulatoryLinks.some((l) => l.includes("Skills for Care"))).toBe(true);
  });
  it("good rating for ~75", () => {
    const r = generateStaffSupervisionEffectivenessIntelligence(Array.from({ length: 5 }, () => makeSession()), null, Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.rating).toBe("good");
  });
});
