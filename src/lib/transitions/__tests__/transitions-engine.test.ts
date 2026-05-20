import { describe, it, expect } from "vitest";
import {
  pct, getRating, getTransitionCategoryLabel, getTransitionOutcomeLabel, getRatingLabel,
  evaluateTransitionQuality, evaluateTransitionCompliance, evaluateTransitionPolicy,
  evaluateStaffTransitionReadiness, buildChildTransitionProfiles,
  generateTransitionsIntelligence,
} from "../transitions-engine";
import type { TransitionRecord, TransitionPolicy, StaffTransitionTraining, TransitionCategory } from "../transitions-engine";

let _sid = 0;
function makeRecord(o: Partial<TransitionRecord> = {}): TransitionRecord {
  _sid++;
  return { id: `tr-${_sid}`, childId: "child-1", childName: "Alex", transitionDate: "2026-03-01", category: "admission_transition", transitionPlanInPlace: true, childPrepared: true, receivingServiceBriefed: true, handoverComplete: true, documentationComplete: true, timelyProcess: true, ...o };
}
function makePolicy(o: Partial<TransitionPolicy> = {}): TransitionPolicy {
  return { id: "p-1", transitionPolicy: true, placementStabilityGuidance: true, handoverProtocol: true, childPreparationFramework: true, familyInvolvementPolicy: true, emergencyMoveProtocol: true, reviewSchedule: true, ...o };
}
let _tid = 0;
function makeTraining(o: Partial<StaffTransitionTraining> = {}): StaffTransitionTraining {
  _tid++;
  return { id: `t-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, transitionPlanning: true, childPreparation: true, handoverSkills: true, familyEngagement: true, multiAgencyWorking: true, emotionalSupport: true, ...o };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 for den=0", () => { expect(pct(5, 0)).toBe(0); });
  it("correct pct", () => { expect(pct(3, 4)).toBe(75); });
  it("rounds", () => { expect(pct(1, 3)).toBe(33); });
  it("100 for equal", () => { expect(pct(10, 10)).toBe(100); });
  it("0 for num=0", () => { expect(pct(0, 5)).toBe(0); });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("outstanding >= 80", () => { expect(getRating(80)).toBe("outstanding"); });
  it("outstanding at 100", () => { expect(getRating(100)).toBe("outstanding"); });
  it("good >= 60", () => { expect(getRating(60)).toBe("good"); });
  it("good at 79", () => { expect(getRating(79)).toBe("good"); });
  it("requires_improvement >= 40", () => { expect(getRating(40)).toBe("requires_improvement"); });
  it("inadequate < 40", () => { expect(getRating(0)).toBe("inadequate"); });
  it("inadequate at 39", () => { expect(getRating(39)).toBe("inadequate"); });
});

// ══════════════════════════════════════════════════════════════════════════════
// Labels
// ══════════════════════════════════════════════════════════════════════════════

describe("labels", () => {
  it("category labels", () => {
    expect(getTransitionCategoryLabel("admission_transition")).toBe("Admission Transition");
    expect(getTransitionCategoryLabel("discharge_planning")).toBe("Discharge Planning");
    expect(getTransitionCategoryLabel("placement_move")).toBe("Placement Move");
    expect(getTransitionCategoryLabel("step_down")).toBe("Step Down");
    expect(getTransitionCategoryLabel("step_up")).toBe("Step Up");
    expect(getTransitionCategoryLabel("family_reunification")).toBe("Family Reunification");
    expect(getTransitionCategoryLabel("independent_living")).toBe("Independent Living");
    expect(getTransitionCategoryLabel("emergency_move")).toBe("Emergency Move");
  });
  it("outcome labels", () => {
    expect(getTransitionOutcomeLabel("completed")).toBe("Completed");
    expect(getTransitionOutcomeLabel("partially_completed")).toBe("Partially Completed");
    expect(getTransitionOutcomeLabel("not_completed")).toBe("Not Completed");
    expect(getTransitionOutcomeLabel("deferred")).toBe("Deferred");
    expect(getTransitionOutcomeLabel("emergency_override")).toBe("Emergency Override");
  });
  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 1: Transition Quality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateTransitionQuality", () => {
  it("zeros for empty", () => {
    const r = evaluateTransitionQuality([]);
    expect(r.overallScore).toBe(0); expect(r.totalTransitions).toBe(0);
    expect(r.transitionPlanRate).toBe(0); expect(r.childPreparedRate).toBe(0);
    expect(r.receivingBriefedRate).toBe(0); expect(r.handoverRate).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("max 25 with perfect records", () => {
    const r = evaluateTransitionQuality(Array.from({ length: 10 }, () => makeRecord()));
    expect(r.overallScore).toBe(25); expect(r.transitionPlanRate).toBe(100);
  });
  it("transitionPlan rate", () => {
    const s = [makeRecord({ transitionPlanInPlace: true }), makeRecord({ transitionPlanInPlace: false })];
    expect(evaluateTransitionQuality(s).transitionPlanRate).toBe(50);
  });
  it("childPrepared rate", () => {
    const s = [makeRecord({ childPrepared: true }), makeRecord({ childPrepared: false }), makeRecord({ childPrepared: false })];
    expect(evaluateTransitionQuality(s).childPreparedRate).toBe(33);
  });
  it("receivingBriefed rate", () => {
    const s = [makeRecord({ receivingServiceBriefed: true }), makeRecord({ receivingServiceBriefed: false })];
    expect(evaluateTransitionQuality(s).receivingBriefedRate).toBe(50);
  });
  it("handover rate", () => {
    const s = [makeRecord({ handoverComplete: true }), makeRecord({ handoverComplete: true }), makeRecord({ handoverComplete: false })];
    expect(evaluateTransitionQuality(s).handoverRate).toBe(67);
  });
  it("caps at 25", () => { expect(evaluateTransitionQuality(Array.from({ length: 20 }, () => makeRecord())).overallScore).toBeLessThanOrEqual(25); });
  it("rating outstanding", () => { expect(evaluateTransitionQuality(Array.from({ length: 5 }, () => makeRecord())).rating).toBe("outstanding"); });
  it("rating inadequate when poor", () => {
    const s = [makeRecord({ transitionPlanInPlace: false, childPrepared: false, receivingServiceBriefed: false, handoverComplete: false })];
    expect(evaluateTransitionQuality(s).rating).toBe("inadequate");
  });
  it("totalTransitions matches input", () => {
    const s = [makeRecord(), makeRecord(), makeRecord()];
    expect(evaluateTransitionQuality(s).totalTransitions).toBe(3);
  });
  it("weighted score calculation with mixed inputs", () => {
    // 50% plan (weight 7) + 100% prepared (weight 6) + 0% briefed (weight 6) + 100% handover (weight 6) = 3.5+6+0+6 = 15.5 -> 16
    const s = [
      makeRecord({ transitionPlanInPlace: true, childPrepared: true, receivingServiceBriefed: false, handoverComplete: true }),
      makeRecord({ transitionPlanInPlace: false, childPrepared: true, receivingServiceBriefed: false, handoverComplete: true }),
    ];
    const r = evaluateTransitionQuality(s);
    expect(r.overallScore).toBe(16);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: Transition Compliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateTransitionCompliance", () => {
  it("zeros for empty", () => { expect(evaluateTransitionCompliance([]).overallScore).toBe(0); });
  it("max 25 with full diversity", () => {
    const cats: TransitionCategory[] = ["admission_transition", "discharge_planning", "placement_move", "step_down", "step_up", "family_reunification", "independent_living", "emergency_move"];
    const r = evaluateTransitionCompliance(cats.map((c) => makeRecord({ category: c })));
    expect(r.overallScore).toBe(25); expect(r.categoryDiversityRatio).toBe(100);
  });
  it("documentation rate", () => {
    const s = [makeRecord({ documentationComplete: true }), makeRecord({ documentationComplete: false })];
    expect(evaluateTransitionCompliance(s).documentationRate).toBe(50);
  });
  it("timely rate", () => {
    const s = [makeRecord({ timelyProcess: true }), makeRecord({ timelyProcess: false }), makeRecord({ timelyProcess: false })];
    expect(evaluateTransitionCompliance(s).timelyRate).toBe(33);
  });
  it("handover rate in compliance", () => {
    const s = [makeRecord({ handoverComplete: true }), makeRecord({ handoverComplete: false })];
    expect(evaluateTransitionCompliance(s).handoverRate).toBe(50);
  });
  it("diversity 2/8=25%", () => {
    const s = [makeRecord({ category: "admission_transition" }), makeRecord({ category: "discharge_planning" }), makeRecord({ category: "admission_transition" })];
    expect(evaluateTransitionCompliance(s).categoryDiversityRatio).toBe(25);
  });
  it("diversity 1/8=13%", () => {
    const s = [makeRecord({ category: "step_down" }), makeRecord({ category: "step_down" })];
    expect(evaluateTransitionCompliance(s).categoryDiversityRatio).toBe(13);
  });
  it("rating for empty is inadequate", () => { expect(evaluateTransitionCompliance([]).rating).toBe("inadequate"); });
  it("caps at 25", () => {
    const cats: TransitionCategory[] = ["admission_transition", "discharge_planning", "placement_move", "step_down", "step_up", "family_reunification", "independent_living", "emergency_move"];
    expect(evaluateTransitionCompliance(cats.map((c) => makeRecord({ category: c }))).overallScore).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: Transition Policy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateTransitionPolicy", () => {
  it("null gives 0", () => { const r = evaluateTransitionPolicy(null); expect(r.overallScore).toBe(0); expect(r.transitionPolicy).toBe(false); });
  it("all true gives 25", () => { expect(evaluateTransitionPolicy(makePolicy()).overallScore).toBe(25); });
  it("first 4 at 4pts", () => { expect(evaluateTransitionPolicy(makePolicy({ familyInvolvementPolicy: false, emergencyMoveProtocol: false, reviewSchedule: false })).overallScore).toBe(16); });
  it("last 3 at 3pts", () => { expect(evaluateTransitionPolicy(makePolicy({ transitionPolicy: false, placementStabilityGuidance: false, handoverProtocol: false, childPreparationFramework: false })).overallScore).toBe(9); });
  it("all false gives 0", () => { expect(evaluateTransitionPolicy(makePolicy({ transitionPolicy: false, placementStabilityGuidance: false, handoverProtocol: false, childPreparationFramework: false, familyInvolvementPolicy: false, emergencyMoveProtocol: false, reviewSchedule: false })).overallScore).toBe(0); });
  it("mirrors booleans", () => { const r = evaluateTransitionPolicy(makePolicy({ transitionPolicy: false })); expect(r.transitionPolicy).toBe(false); expect(r.placementStabilityGuidance).toBe(true); });
  it("single 4pt = 4", () => { expect(evaluateTransitionPolicy(makePolicy({ transitionPolicy: true, placementStabilityGuidance: false, handoverProtocol: false, childPreparationFramework: false, familyInvolvementPolicy: false, emergencyMoveProtocol: false, reviewSchedule: false })).overallScore).toBe(4); });
  it("single 3pt = 3", () => { expect(evaluateTransitionPolicy(makePolicy({ transitionPolicy: false, placementStabilityGuidance: false, handoverProtocol: false, childPreparationFramework: false, familyInvolvementPolicy: true, emergencyMoveProtocol: false, reviewSchedule: false })).overallScore).toBe(3); });
  it("rating outstanding at 25", () => { expect(evaluateTransitionPolicy(makePolicy()).rating).toBe("outstanding"); });
  it("rating inadequate at 0", () => { expect(evaluateTransitionPolicy(null).rating).toBe("inadequate"); });
  it("null sets all booleans false", () => {
    const r = evaluateTransitionPolicy(null);
    expect(r.placementStabilityGuidance).toBe(false);
    expect(r.handoverProtocol).toBe(false);
    expect(r.childPreparationFramework).toBe(false);
    expect(r.familyInvolvementPolicy).toBe(false);
    expect(r.emergencyMoveProtocol).toBe(false);
    expect(r.reviewSchedule).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: Staff Transition Readiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffTransitionReadiness", () => {
  it("zeros for empty", () => { expect(evaluateStaffTransitionReadiness([]).overallScore).toBe(0); });
  it("25 fully trained", () => { expect(evaluateStaffTransitionReadiness([makeTraining()]).overallScore).toBe(25); });
  it("transitionPlanning only = 6", () => {
    const t = makeTraining({ transitionPlanning: true, childPreparation: false, handoverSkills: false, familyEngagement: false, multiAgencyWorking: false, emotionalSupport: false });
    expect(evaluateStaffTransitionReadiness([t]).overallScore).toBe(6);
  });
  it("emotionalSupport only = 2", () => {
    const t = makeTraining({ transitionPlanning: false, childPreparation: false, handoverSkills: false, familyEngagement: false, multiAgencyWorking: false, emotionalSupport: true });
    expect(evaluateStaffTransitionReadiness([t]).overallScore).toBe(2);
  });
  it("childPreparation only = 5", () => {
    const t = makeTraining({ transitionPlanning: false, childPreparation: true, handoverSkills: false, familyEngagement: false, multiAgencyWorking: false, emotionalSupport: false });
    expect(evaluateStaffTransitionReadiness([t]).overallScore).toBe(5);
  });
  it("handoverSkills only = 5", () => {
    const t = makeTraining({ transitionPlanning: false, childPreparation: false, handoverSkills: true, familyEngagement: false, multiAgencyWorking: false, emotionalSupport: false });
    expect(evaluateStaffTransitionReadiness([t]).overallScore).toBe(5);
  });
  it("familyEngagement only = 4", () => {
    const t = makeTraining({ transitionPlanning: false, childPreparation: false, handoverSkills: false, familyEngagement: true, multiAgencyWorking: false, emotionalSupport: false });
    expect(evaluateStaffTransitionReadiness([t]).overallScore).toBe(4);
  });
  it("multiAgencyWorking only = 3", () => {
    const t = makeTraining({ transitionPlanning: false, childPreparation: false, handoverSkills: false, familyEngagement: false, multiAgencyWorking: true, emotionalSupport: false });
    expect(evaluateStaffTransitionReadiness([t]).overallScore).toBe(3);
  });
  it("mixed rates", () => {
    const t1 = makeTraining({ transitionPlanning: true, childPreparation: false, handoverSkills: false, familyEngagement: false, multiAgencyWorking: false, emotionalSupport: false });
    const t2 = makeTraining({ transitionPlanning: false, childPreparation: true, handoverSkills: false, familyEngagement: false, multiAgencyWorking: false, emotionalSupport: false });
    const r = evaluateStaffTransitionReadiness([t1, t2]);
    expect(r.transitionPlanningRate).toBe(50); expect(r.childPreparationRate).toBe(50);
  });
  it("totalStaff count", () => { expect(evaluateStaffTransitionReadiness([makeTraining(), makeTraining()]).totalStaff).toBe(2); });
  it("rating outstanding when fully trained", () => { expect(evaluateStaffTransitionReadiness([makeTraining()]).rating).toBe("outstanding"); });
  it("rating inadequate when empty", () => { expect(evaluateStaffTransitionReadiness([]).rating).toBe("inadequate"); });
});

// ══════════════════════════════════════════════════════════════════════════════
// Child Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildTransitionProfiles", () => {
  it("empty gives []", () => { expect(buildChildTransitionProfiles([])).toEqual([]); });
  it("groups by childId", () => {
    const s = [makeRecord({ childId: "c1", childName: "A" }), makeRecord({ childId: "c1", childName: "A" }), makeRecord({ childId: "c2", childName: "B" })];
    const p = buildChildTransitionProfiles(s);
    expect(p).toHaveLength(2); expect(p[0].totalRecords).toBe(2);
  });
  it("caps at 10", () => {
    const cats: TransitionCategory[] = ["admission_transition", "discharge_planning", "placement_move", "step_down", "independent_living"];
    const s = Array.from({ length: 12 }, (_, i) => makeRecord({ childId: "c1", childName: "A", category: cats[i % cats.length] }));
    expect(buildChildTransitionProfiles(s)[0].overallScore).toBeLessThanOrEqual(10);
  });
  it("freq scoring: 3 -> 0", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({ childId: "cx", childName: "X", transitionPlanInPlace: false, childPrepared: false, category: "admission_transition" }));
    expect(buildChildTransitionProfiles(mk(3))[0].overallScore).toBe(0);
  });
  it("freq scoring: 5 -> 1", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({ childId: "cx", childName: "X", transitionPlanInPlace: false, childPrepared: false, category: "admission_transition" }));
    expect(buildChildTransitionProfiles(mk(5))[0].overallScore).toBe(1);
  });
  it("freq scoring: 10 -> 2", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({ childId: "cx", childName: "X", transitionPlanInPlace: false, childPrepared: false, category: "admission_transition" }));
    expect(buildChildTransitionProfiles(mk(10))[0].overallScore).toBe(2);
  });
  it("diversity: 4 categories -> 2", () => {
    const cats: TransitionCategory[] = ["admission_transition", "discharge_planning", "placement_move", "step_down"];
    const s = cats.map((c) => makeRecord({ childId: "c1", childName: "A", transitionPlanInPlace: false, childPrepared: false, category: c }));
    expect(buildChildTransitionProfiles(s)[0].overallScore).toBe(2);
  });
  it("diversity: 2 categories -> 1", () => {
    const cats: TransitionCategory[] = ["admission_transition", "discharge_planning"];
    const s = cats.map((c) => makeRecord({ childId: "c1", childName: "A", transitionPlanInPlace: false, childPrepared: false, category: c }));
    expect(buildChildTransitionProfiles(s)[0].overallScore).toBe(1);
  });
  it("perfect child gets 10", () => {
    const cats: TransitionCategory[] = ["admission_transition", "discharge_planning", "placement_move", "step_down", "independent_living"];
    const s = Array.from({ length: 10 }, (_, i) => makeRecord({ childId: "c1", childName: "A", category: cats[i % cats.length] }));
    expect(buildChildTransitionProfiles(s)[0].overallScore).toBe(10);
  });
  it("transitionPlanRate computed correctly", () => {
    const s = [makeRecord({ childId: "c1", childName: "A", transitionPlanInPlace: true }), makeRecord({ childId: "c1", childName: "A", transitionPlanInPlace: false })];
    expect(buildChildTransitionProfiles(s)[0].transitionPlanRate).toBe(50);
  });
  it("childPreparedRate computed correctly", () => {
    const s = [makeRecord({ childId: "c1", childName: "A", childPrepared: true }), makeRecord({ childId: "c1", childName: "A", childPrepared: false }), makeRecord({ childId: "c1", childName: "A", childPrepared: false })];
    expect(buildChildTransitionProfiles(s)[0].childPreparedRate).toBe(33);
  });
  it("categoriesCovered lists unique categories", () => {
    const s = [
      makeRecord({ childId: "c1", childName: "A", category: "step_down" }),
      makeRecord({ childId: "c1", childName: "A", category: "step_up" }),
      makeRecord({ childId: "c1", childName: "A", category: "step_down" }),
    ];
    const p = buildChildTransitionProfiles(s);
    expect(p[0].categoriesCovered).toHaveLength(2);
    expect(p[0].categoriesCovered).toContain("step_down");
    expect(p[0].categoriesCovered).toContain("step_up");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Master Intelligence Generator
// ══════════════════════════════════════════════════════════════════════════════

describe("generateTransitionsIntelligence", () => {
  it("complete result", () => {
    const cats: TransitionCategory[] = ["admission_transition", "discharge_planning", "placement_move", "step_down", "step_up", "family_reunification", "independent_living", "emergency_move"];
    const s = cats.map((c, i) => makeRecord({ childId: i < 4 ? "c1" : "c2", childName: i < 4 ? "A" : "B", category: c }));
    const r = generateTransitionsIntelligence(s, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(r.homeId).toBe("oak-house"); expect(r.overallScore).toBeLessThanOrEqual(100); expect(r.regulatoryLinks).toHaveLength(7);
  });
  it("100 perfect", () => {
    const cats: TransitionCategory[] = ["admission_transition", "discharge_planning", "placement_move", "step_down", "step_up", "family_reunification", "independent_living", "emergency_move"];
    const r = generateTransitionsIntelligence(cats.map((c) => makeRecord({ category: c })), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(100); expect(r.rating).toBe("outstanding");
  });
  it("0 empty", () => {
    const r = generateTransitionsIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
  });
  it("URGENT actions", () => {
    const r = generateTransitionsIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.filter((a) => a.startsWith("URGENT")).length).toBe(2);
  });
  it("strengths >=80%", () => {
    const cats: TransitionCategory[] = ["admission_transition", "discharge_planning", "placement_move", "step_down", "step_up", "family_reunification", "independent_living", "emergency_move"];
    const r = generateTransitionsIntelligence(cats.map((c) => makeRecord({ category: c })), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.strengths.length).toBeGreaterThan(0);
  });
  it("improvements <60%", () => {
    const s = [makeRecord({ transitionPlanInPlace: false, childPrepared: false, receivingServiceBriefed: false, handoverComplete: false, documentationComplete: false, timelyProcess: false })];
    const r = generateTransitionsIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });
  it("child preparation action when low", () => {
    const s = [makeRecord({ childPrepared: false })];
    const r = generateTransitionsIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.some((a) => a.toLowerCase().includes("child") && a.toLowerCase().includes("preparation"))).toBe(true);
  });
  it("child profiles included", () => {
    const s = [makeRecord({ childId: "c1", childName: "A" }), makeRecord({ childId: "c2", childName: "B" })];
    const r = generateTransitionsIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.childProfiles).toHaveLength(2);
  });
  it("regulatory links", () => {
    const r = generateTransitionsIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.regulatoryLinks.some((l) => l.includes("Reg 5"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Reg 14"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });
  it("overallScore capped at 100", () => {
    const r = generateTransitionsIntelligence(Array.from({ length: 20 }, () => makeRecord()), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("periodStart and periodEnd in result", () => {
    const r = generateTransitionsIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.periodStart).toBe("2026-01-01"); expect(r.periodEnd).toBe("2026-06-01");
  });
  it("documentation action when low", () => {
    const s = [makeRecord({ documentationComplete: false })];
    const r = generateTransitionsIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.some((a) => a.toLowerCase().includes("documentation"))).toBe(true);
  });
  it("no URGENT actions when policy and staff present", () => {
    const cats: TransitionCategory[] = ["admission_transition", "discharge_planning", "placement_move", "step_down", "step_up", "family_reunification", "independent_living", "emergency_move"];
    const r = generateTransitionsIntelligence(cats.map((c) => makeRecord({ category: c })), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.filter((a) => a.startsWith("URGENT")).length).toBe(0);
  });
  it("receiving briefed action when low", () => {
    const s = [makeRecord({ receivingServiceBriefed: false })];
    const r = generateTransitionsIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.some((a) => a.toLowerCase().includes("receiving") || a.toLowerCase().includes("briefed"))).toBe(true);
  });
  it("family engagement action when staff low", () => {
    const t = makeTraining({ familyEngagement: false });
    const s = [makeRecord()];
    const r = generateTransitionsIntelligence(s, makePolicy(), [t], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.some((a) => a.toLowerCase().includes("family"))).toBe(true);
  });
});
