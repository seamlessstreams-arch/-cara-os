import { describe, it, expect } from "vitest";
import {
  pct, getRating, getComplaintCategoryLabel, getComplaintStatusLabel, getRatingLabel,
  evaluateComplaintQuality, evaluateComplaintCompliance, evaluateComplaintPolicy,
  evaluateStaffComplaintReadiness, buildChildComplaintProfiles,
  generateComplaintsFeedbackIntelligence,
} from "../complaints-feedback-engine";
import type { ComplaintRecord, ComplaintPolicy, StaffComplaintTraining, ComplaintCategory } from "../complaints-feedback-engine";

let _sid = 0;
function makeRecord(o: Partial<ComplaintRecord> = {}): ComplaintRecord {
  _sid++;
  return { id: `c-${_sid}`, childId: "child-1", childName: "Alex", complaintDate: "2026-03-01", category: "care_quality", status: "resolved_satisfactorily", childViewsSought: true, respondedWithinTimescale: true, outcomeDocumented: true, lessonLearnedRecorded: true, complainantInformed: true, advocacyOffered: true, ...o };
}
function makePolicy(o: Partial<ComplaintPolicy> = {}): ComplaintPolicy {
  return { id: "p-1", complaintsProcess: true, childFriendlyGuide: true, independentAdvocacyAccess: true, escalationPathway: true, feedbackMechanism: true, regulatoryNotification: true, regularReview: true, ...o };
}
let _tid = 0;
function makeTraining(o: Partial<StaffComplaintTraining> = {}): StaffComplaintTraining {
  _tid++;
  return { id: `t-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, complaintsHandling: true, activeListening: true, conflictResolution: true, childRightsAwareness: true, documentationSkills: true, escalationProcess: true, ...o };
}

describe("pct", () => {
  it("returns 0 for den=0", () => { expect(pct(5, 0)).toBe(0); });
  it("correct pct", () => { expect(pct(3, 4)).toBe(75); });
  it("rounds", () => { expect(pct(1, 3)).toBe(33); });
  it("100 for equal", () => { expect(pct(10, 10)).toBe(100); });
  it("0 for num=0", () => { expect(pct(0, 5)).toBe(0); });
});

describe("getRating", () => {
  it("outstanding >= 80", () => { expect(getRating(80)).toBe("outstanding"); });
  it("good >= 60", () => { expect(getRating(60)).toBe("good"); });
  it("requires_improvement >= 40", () => { expect(getRating(40)).toBe("requires_improvement"); });
  it("inadequate < 40", () => { expect(getRating(0)).toBe("inadequate"); });
});

describe("labels", () => {
  it("category labels", () => {
    expect(getComplaintCategoryLabel("care_quality")).toBe("Care Quality");
    expect(getComplaintCategoryLabel("staff_behaviour")).toBe("Staff Behaviour");
    expect(getComplaintCategoryLabel("food_nutrition")).toBe("Food & Nutrition");
    expect(getComplaintCategoryLabel("environment_facilities")).toBe("Environment & Facilities");
    expect(getComplaintCategoryLabel("privacy_dignity")).toBe("Privacy & Dignity");
    expect(getComplaintCategoryLabel("communication")).toBe("Communication");
    expect(getComplaintCategoryLabel("activities_opportunities")).toBe("Activities & Opportunities");
    expect(getComplaintCategoryLabel("safety_concerns")).toBe("Safety Concerns");
  });
  it("status labels", () => {
    expect(getComplaintStatusLabel("resolved_satisfactorily")).toBe("Resolved Satisfactorily");
    expect(getComplaintStatusLabel("escalated")).toBe("Escalated");
    expect(getComplaintStatusLabel("not_resolved")).toBe("Not Resolved");
  });
  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

describe("evaluateComplaintQuality", () => {
  it("zeros for empty", () => {
    const r = evaluateComplaintQuality([]);
    expect(r.overallScore).toBe(0); expect(r.totalComplaints).toBe(0);
  });
  it("max 25 with perfect", () => {
    const r = evaluateComplaintQuality(Array.from({ length: 10 }, () => makeRecord()));
    expect(r.overallScore).toBe(25); expect(r.resolutionRate).toBe(100);
  });
  it("resolved_satisfactorily and resolved_partially count as resolved", () => {
    const s = [makeRecord({ status: "resolved_satisfactorily" }), makeRecord({ status: "resolved_partially" }), makeRecord({ status: "not_resolved" }), makeRecord({ status: "escalated" })];
    expect(evaluateComplaintQuality(s).resolutionRate).toBe(50);
  });
  it("individual rates", () => {
    const s = [
      makeRecord({ childViewsSought: true, respondedWithinTimescale: false, advocacyOffered: false }),
      makeRecord({ childViewsSought: false, respondedWithinTimescale: true, advocacyOffered: false }),
      makeRecord({ childViewsSought: false, respondedWithinTimescale: false, advocacyOffered: true }),
      makeRecord({ childViewsSought: false, respondedWithinTimescale: false, advocacyOffered: false }),
    ];
    const r = evaluateComplaintQuality(s);
    expect(r.childViewsRate).toBe(25); expect(r.timelyResponseRate).toBe(25); expect(r.advocacyRate).toBe(25);
  });
  it("caps at 25", () => { expect(evaluateComplaintQuality(Array.from({ length: 20 }, () => makeRecord())).overallScore).toBeLessThanOrEqual(25); });
  it("rating outstanding when score 25", () => { expect(evaluateComplaintQuality(Array.from({ length: 5 }, () => makeRecord())).rating).toBe("outstanding"); });
  it("rating inadequate when all poor", () => {
    const s = [makeRecord({ status: "not_resolved", childViewsSought: false, respondedWithinTimescale: false, advocacyOffered: false })];
    expect(evaluateComplaintQuality(s).rating).toBe("inadequate");
  });
});

describe("evaluateComplaintCompliance", () => {
  it("zeros for empty", () => { expect(evaluateComplaintCompliance([]).overallScore).toBe(0); });
  it("max 25 with full diversity", () => {
    const cats: ComplaintCategory[] = ["care_quality", "staff_behaviour", "food_nutrition", "environment_facilities", "privacy_dignity", "communication", "activities_opportunities", "safety_concerns"];
    const r = evaluateComplaintCompliance(cats.map((c) => makeRecord({ category: c })));
    expect(r.overallScore).toBe(25); expect(r.categoryDiversityRatio).toBe(100);
  });
  it("documented rate", () => {
    const s = [makeRecord({ outcomeDocumented: true }), makeRecord({ outcomeDocumented: false })];
    expect(evaluateComplaintCompliance(s).documentedRate).toBe(50);
  });
  it("lesson learned rate", () => {
    const s = [makeRecord({ lessonLearnedRecorded: true }), makeRecord({ lessonLearnedRecorded: false }), makeRecord({ lessonLearnedRecorded: false })];
    expect(evaluateComplaintCompliance(s).lessonLearnedRate).toBe(33);
  });
  it("diversity 2/8=25%", () => {
    const s = [makeRecord({ category: "care_quality" }), makeRecord({ category: "staff_behaviour" }), makeRecord({ category: "care_quality" })];
    expect(evaluateComplaintCompliance(s).categoryDiversityRatio).toBe(25);
  });
});

describe("evaluateComplaintPolicy", () => {
  it("null→0", () => { const r = evaluateComplaintPolicy(null); expect(r.overallScore).toBe(0); expect(r.complaintsProcess).toBe(false); });
  it("all true→25", () => { expect(evaluateComplaintPolicy(makePolicy()).overallScore).toBe(25); });
  it("first 4 at 4pts", () => { expect(evaluateComplaintPolicy(makePolicy({ feedbackMechanism: false, regulatoryNotification: false, regularReview: false })).overallScore).toBe(16); });
  it("last 3 at 3pts", () => { expect(evaluateComplaintPolicy(makePolicy({ complaintsProcess: false, childFriendlyGuide: false, independentAdvocacyAccess: false, escalationPathway: false })).overallScore).toBe(9); });
  it("all false→0", () => { expect(evaluateComplaintPolicy(makePolicy({ complaintsProcess: false, childFriendlyGuide: false, independentAdvocacyAccess: false, escalationPathway: false, feedbackMechanism: false, regulatoryNotification: false, regularReview: false })).overallScore).toBe(0); });
  it("mirrors booleans", () => { const r = evaluateComplaintPolicy(makePolicy({ complaintsProcess: false })); expect(r.complaintsProcess).toBe(false); expect(r.childFriendlyGuide).toBe(true); });
  it("single boolean = 4", () => { expect(evaluateComplaintPolicy(makePolicy({ complaintsProcess: true, childFriendlyGuide: false, independentAdvocacyAccess: false, escalationPathway: false, feedbackMechanism: false, regulatoryNotification: false, regularReview: false })).overallScore).toBe(4); });
});

describe("evaluateStaffComplaintReadiness", () => {
  it("zeros for empty", () => { expect(evaluateStaffComplaintReadiness([]).overallScore).toBe(0); });
  it("25 fully trained", () => { expect(evaluateStaffComplaintReadiness([makeTraining()]).overallScore).toBe(25); });
  it("partial — complaintsHandling only = 6", () => {
    const t = makeTraining({ complaintsHandling: true, activeListening: false, conflictResolution: false, childRightsAwareness: false, documentationSkills: false, escalationProcess: false });
    expect(evaluateStaffComplaintReadiness([t]).overallScore).toBe(6);
  });
  it("partial — escalationProcess only = 2", () => {
    const t = makeTraining({ complaintsHandling: false, activeListening: false, conflictResolution: false, childRightsAwareness: false, documentationSkills: false, escalationProcess: true });
    expect(evaluateStaffComplaintReadiness([t]).overallScore).toBe(2);
  });
  it("mixed rates", () => {
    const t1 = makeTraining({ complaintsHandling: true, activeListening: false, conflictResolution: false, childRightsAwareness: false, documentationSkills: false, escalationProcess: false });
    const t2 = makeTraining({ complaintsHandling: false, activeListening: true, conflictResolution: false, childRightsAwareness: false, documentationSkills: false, escalationProcess: false });
    const r = evaluateStaffComplaintReadiness([t1, t2]);
    expect(r.complaintsHandlingRate).toBe(50); expect(r.activeListeningRate).toBe(50);
  });
});

describe("buildChildComplaintProfiles", () => {
  it("empty→[]", () => { expect(buildChildComplaintProfiles([])).toEqual([]); });
  it("groups by childId", () => {
    const s = [makeRecord({ childId: "c1", childName: "A" }), makeRecord({ childId: "c1", childName: "A" }), makeRecord({ childId: "c2", childName: "B" })];
    const p = buildChildComplaintProfiles(s);
    expect(p).toHaveLength(2); expect(p[0].totalComplaints).toBe(2);
  });
  it("caps at 10", () => {
    const cats: ComplaintCategory[] = ["care_quality", "staff_behaviour", "food_nutrition", "environment_facilities", "privacy_dignity"];
    const s = Array.from({ length: 12 }, (_, i) => makeRecord({ childId: "c1", childName: "A", category: cats[i % cats.length] }));
    expect(buildChildComplaintProfiles(s)[0].overallScore).toBeLessThanOrEqual(10);
  });
  it("freq scoring: 3→0", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({ childId: "cx", childName: "X", status: "not_resolved", childViewsSought: false, category: "care_quality" }));
    expect(buildChildComplaintProfiles(mk(3))[0].overallScore).toBe(0);
  });
  it("freq scoring: 5→1", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({ childId: "cx", childName: "X", status: "not_resolved", childViewsSought: false, category: "care_quality" }));
    expect(buildChildComplaintProfiles(mk(5))[0].overallScore).toBe(1);
  });
  it("freq scoring: 10→2", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({ childId: "cx", childName: "X", status: "not_resolved", childViewsSought: false, category: "care_quality" }));
    expect(buildChildComplaintProfiles(mk(10))[0].overallScore).toBe(2);
  });
  it("diversity: 4 categories → 2", () => {
    const cats: ComplaintCategory[] = ["care_quality", "staff_behaviour", "food_nutrition", "environment_facilities"];
    const s = cats.map((c) => makeRecord({ childId: "c1", childName: "A", status: "not_resolved", childViewsSought: false, category: c }));
    expect(buildChildComplaintProfiles(s)[0].overallScore).toBe(2);
  });
  it("perfect child gets 10", () => {
    const cats: ComplaintCategory[] = ["care_quality", "staff_behaviour", "food_nutrition", "environment_facilities", "privacy_dignity"];
    const s = Array.from({ length: 10 }, (_, i) => makeRecord({ childId: "c1", childName: "A", category: cats[i % cats.length] }));
    expect(buildChildComplaintProfiles(s)[0].overallScore).toBe(10);
  });
});

describe("generateComplaintsFeedbackIntelligence", () => {
  it("complete result", () => {
    const cats: ComplaintCategory[] = ["care_quality", "staff_behaviour", "food_nutrition", "environment_facilities", "privacy_dignity", "communication", "activities_opportunities", "safety_concerns"];
    const s = cats.map((c, i) => makeRecord({ childId: i < 4 ? "c1" : "c2", childName: i < 4 ? "A" : "B", category: c }));
    const r = generateComplaintsFeedbackIntelligence(s, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(r.homeId).toBe("oak-house"); expect(r.overallScore).toBeLessThanOrEqual(100); expect(r.regulatoryLinks).toHaveLength(7);
  });
  it("100 perfect", () => {
    const cats: ComplaintCategory[] = ["care_quality", "staff_behaviour", "food_nutrition", "environment_facilities", "privacy_dignity", "communication", "activities_opportunities", "safety_concerns"];
    const r = generateComplaintsFeedbackIntelligence(cats.map((c) => makeRecord({ category: c })), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(100); expect(r.rating).toBe("outstanding");
  });
  it("0 empty", () => {
    const r = generateComplaintsFeedbackIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
  });
  it("URGENT actions", () => {
    const r = generateComplaintsFeedbackIntelligence([], null, [], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.filter((a) => a.startsWith("URGENT")).length).toBe(2);
  });
  it("strengths >=80%", () => {
    const cats: ComplaintCategory[] = ["care_quality", "staff_behaviour", "food_nutrition", "environment_facilities", "privacy_dignity", "communication", "activities_opportunities", "safety_concerns"];
    const r = generateComplaintsFeedbackIntelligence(cats.map((c) => makeRecord({ category: c })), makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.strengths.length).toBeGreaterThan(0);
  });
  it("improvements <60%", () => {
    const s = [makeRecord({ status: "not_resolved", childViewsSought: false, respondedWithinTimescale: false, advocacyOffered: false, outcomeDocumented: false, lessonLearnedRecorded: false, complainantInformed: false })];
    const r = generateComplaintsFeedbackIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });
  it("advocacy and timely actions when rates low", () => {
    const s = [makeRecord({ advocacyOffered: false, respondedWithinTimescale: false })];
    const r = generateComplaintsFeedbackIntelligence(s, makePolicy(), [makeTraining()], "h", "2026-01-01", "2026-06-01");
    expect(r.actions.some((a) => a.includes("advocacy"))).toBe(true);
    expect(r.actions.some((a) => a.includes("timescale"))).toBe(true);
  });
});
