import { describe, it, expect } from "vitest";
import {
  generateSafeguardingReferralQualityIntelligence, evaluateReferralQuality, evaluateReferralCompliance,
  evaluateSafeguardingPolicy, evaluateStaffSafeguardingReadiness, buildChildSafeguardingProfiles, getRating,
  getReferralTypeLabel, getReferralOutcomeLabel, getRatingLabel,
} from "../safeguarding-referral-quality-engine";
import type { SafeguardingReferral, SafeguardingPolicy, StaffSafeguardingTraining } from "../safeguarding-referral-quality-engine";

let _id = 0;
function makeReferral(overrides: Partial<SafeguardingReferral> = {}): SafeguardingReferral {
  _id++;
  return { id: `sr-${_id}`, childId: "child-alex", childName: "Alex", referralDate: "2026-04-01", referralType: "section_47", referralOutcome: "appropriate_action", timelyResponse: true, multiAgencyEngaged: true, childInformed: true, documentedInRecord: true, managementOversight: true, lessonsLearned: true, ...overrides };
}
function makePolicy(overrides: Partial<SafeguardingPolicy> = {}): SafeguardingPolicy {
  return { id: "sp-1", safeguardingProcedure: true, referralThresholds: true, multiAgencyProtocol: true, whistleblowingPolicy: true, escalationPathway: true, learningFromCases: true, regularReview: true, ...overrides };
}
let _tid = 0;
function makeTraining(overrides: Partial<StaffSafeguardingTraining> = {}): StaffSafeguardingTraining {
  _tid++;
  return { id: `st-${_tid}`, staffId: `staff-${_tid}`, staffName: `Staff ${_tid}`, safeguardingLevel3: true, referralProcesses: true, multiAgencyWorking: true, recognisingAbuse: true, recordKeeping: true, whistleblowing: true, ...overrides };
}

describe("getRating", () => {
  it("outstanding >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("inadequate < 40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

describe("label getters", () => {
  it("getReferralTypeLabel", () => {
    expect(getReferralTypeLabel("section_47")).toBe("Section 47 Enquiry");
    expect(getReferralTypeLabel("section_17")).toBe("Section 17 Assessment");
    expect(getReferralTypeLabel("lado")).toBe("LADO Referral");
    expect(getReferralTypeLabel("police_referral")).toBe("Police Referral");
    expect(getReferralTypeLabel("multi_agency")).toBe("Multi-Agency Referral");
    expect(getReferralTypeLabel("early_help")).toBe("Early Help Assessment");
    expect(getReferralTypeLabel("internal_concern")).toBe("Internal Concern");
    expect(getReferralTypeLabel("external_disclosure")).toBe("External Disclosure");
  });
  it("getReferralOutcomeLabel", () => {
    expect(getReferralOutcomeLabel("appropriate_action")).toBe("Appropriate Action");
    expect(getReferralOutcomeLabel("investigation_opened")).toBe("Investigation Opened");
    expect(getReferralOutcomeLabel("no_further_action")).toBe("No Further Action");
    expect(getReferralOutcomeLabel("escalated")).toBe("Escalated");
    expect(getReferralOutcomeLabel("pending")).toBe("Pending");
  });
  it("getRatingLabel", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

describe("evaluateReferralQuality", () => {
  it("returns 0 for empty", () => { const r = evaluateReferralQuality([]); expect(r.overallScore).toBe(0); expect(r.totalReferrals).toBe(0); });
  it("scores 25 for perfect", () => { expect(evaluateReferralQuality(Array.from({ length: 10 }, () => makeReferral())).overallScore).toBe(25); });
  it("counts appropriate_action+investigation_opened as appropriate", () => {
    const referrals = [makeReferral({ referralOutcome: "appropriate_action" }), makeReferral({ referralOutcome: "investigation_opened" }), makeReferral({ referralOutcome: "no_further_action" }), makeReferral({ referralOutcome: "escalated" }), makeReferral({ referralOutcome: "pending" })];
    expect(evaluateReferralQuality(referrals).appropriateOutcomeRate).toBe(40);
  });
  it("calculates timely response rate", () => {
    const referrals = [makeReferral({ timelyResponse: true }), makeReferral({ timelyResponse: false })];
    expect(evaluateReferralQuality(referrals).timelyResponseRate).toBe(50);
  });
  it("calculates multi agency rate", () => {
    const referrals = [makeReferral({ multiAgencyEngaged: true }), makeReferral({ multiAgencyEngaged: true }), makeReferral({ multiAgencyEngaged: false })];
    expect(evaluateReferralQuality(referrals).multiAgencyRate).toBe(67);
  });
  it("calculates child informed rate", () => {
    const referrals = Array.from({ length: 4 }, () => makeReferral({ childInformed: true })).concat([makeReferral({ childInformed: false })]);
    expect(evaluateReferralQuality(referrals).childInformedRate).toBe(80);
  });
  it("caps at 25", () => { expect(evaluateReferralQuality(Array.from({ length: 20 }, () => makeReferral())).overallScore).toBeLessThanOrEqual(25); });
  it("scores lower with poor outcomes", () => {
    const good = evaluateReferralQuality(Array.from({ length: 5 }, () => makeReferral()));
    const bad = evaluateReferralQuality(Array.from({ length: 5 }, () => makeReferral({ referralOutcome: "no_further_action", timelyResponse: false })));
    expect(good.overallScore).toBeGreaterThan(bad.overallScore);
  });
});

describe("evaluateReferralCompliance", () => {
  it("returns 0 for empty", () => { expect(evaluateReferralCompliance([]).overallScore).toBe(0); });
  it("calculates documented rate", () => {
    const referrals = [makeReferral({ documentedInRecord: true }), makeReferral({ documentedInRecord: false })];
    expect(evaluateReferralCompliance(referrals).documentedRate).toBe(50);
  });
  it("calculates management oversight rate", () => {
    const referrals = [makeReferral({ managementOversight: true }), makeReferral({ managementOversight: false }), makeReferral({ managementOversight: true })];
    expect(evaluateReferralCompliance(referrals).managementOversightRate).toBe(67);
  });
  it("calculates lessons learned rate", () => {
    const referrals = Array.from({ length: 3 }, () => makeReferral({ lessonsLearned: true })).concat([makeReferral({ lessonsLearned: false })]);
    expect(evaluateReferralCompliance(referrals).lessonsLearnedRate).toBe(75);
  });
  it("calculates referral type diversity ratio", () => {
    const referrals = [makeReferral({ referralType: "section_47" }), makeReferral({ referralType: "section_47" })];
    expect(evaluateReferralCompliance(referrals).referralTypeDiversityRatio).toBe(13);
  });
  it("caps at 25", () => { expect(evaluateReferralCompliance(Array.from({ length: 20 }, () => makeReferral())).overallScore).toBeLessThanOrEqual(25); });
});

describe("evaluateSafeguardingPolicy", () => {
  it("returns 0 for null", () => { const r = evaluateSafeguardingPolicy(null); expect(r.overallScore).toBe(0); expect(r.safeguardingProcedure).toBe(false); });
  it("scores 25 for full policy", () => { expect(evaluateSafeguardingPolicy(makePolicy()).overallScore).toBe(25); });
  it("4-point items individually", () => { expect(evaluateSafeguardingPolicy(makePolicy({ safeguardingProcedure: true, referralThresholds: false, multiAgencyProtocol: false, whistleblowingPolicy: false, escalationPathway: false, learningFromCases: false, regularReview: false })).overallScore).toBe(4); });
  it("3-point items individually", () => { expect(evaluateSafeguardingPolicy(makePolicy({ safeguardingProcedure: false, referralThresholds: false, multiAgencyProtocol: false, whistleblowingPolicy: false, escalationPathway: true, learningFromCases: false, regularReview: false })).overallScore).toBe(3); });
  it("4-point items = 16", () => { expect(evaluateSafeguardingPolicy(makePolicy({ escalationPathway: false, learningFromCases: false, regularReview: false })).overallScore).toBe(16); });
  it("3-point items = 9", () => { expect(evaluateSafeguardingPolicy(makePolicy({ safeguardingProcedure: false, referralThresholds: false, multiAgencyProtocol: false, whistleblowingPolicy: false })).overallScore).toBe(9); });
  it("all false = 0", () => { expect(evaluateSafeguardingPolicy(makePolicy({ safeguardingProcedure: false, referralThresholds: false, multiAgencyProtocol: false, whistleblowingPolicy: false, escalationPathway: false, learningFromCases: false, regularReview: false })).overallScore).toBe(0); });
});

describe("evaluateStaffSafeguardingReadiness", () => {
  it("returns 0 for empty", () => { const r = evaluateStaffSafeguardingReadiness([]); expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0); });
  it("scores 25 for fully trained", () => { expect(evaluateStaffSafeguardingReadiness(Array.from({ length: 5 }, () => makeTraining())).overallScore).toBe(25); });
  it("scores 0 for untrained", () => { expect(evaluateStaffSafeguardingReadiness([makeTraining({ safeguardingLevel3: false, referralProcesses: false, multiAgencyWorking: false, recognisingAbuse: false, recordKeeping: false, whistleblowing: false })]).overallScore).toBe(0); });
  it("single fully trained = 25", () => { expect(evaluateStaffSafeguardingReadiness([makeTraining()]).overallScore).toBe(25); });
  it("caps at 25", () => { expect(evaluateStaffSafeguardingReadiness(Array.from({ length: 20 }, () => makeTraining())).overallScore).toBeLessThanOrEqual(25); });
});

describe("buildChildSafeguardingProfiles", () => {
  it("returns empty for no referrals", () => { expect(buildChildSafeguardingProfiles([]).length).toBe(0); });
  it("groups by child", () => {
    const referrals = [makeReferral({ childId: "c1", childName: "Alex" }), makeReferral({ childId: "c2", childName: "Jordan" })];
    expect(buildChildSafeguardingProfiles(referrals).length).toBe(2);
  });
  it("calculates appropriate outcome rate", () => {
    const referrals = [makeReferral({ childId: "c1", childName: "Alex", referralOutcome: "appropriate_action" }), makeReferral({ childId: "c1", childName: "Alex", referralOutcome: "no_further_action" })];
    expect(buildChildSafeguardingProfiles(referrals)[0].appropriateOutcomeRate).toBe(50);
  });
  it("calculates timely response rate", () => {
    const referrals = [makeReferral({ childId: "c1", childName: "Alex", timelyResponse: true }), makeReferral({ childId: "c1", childName: "Alex", timelyResponse: false })];
    expect(buildChildSafeguardingProfiles(referrals)[0].timelyResponseRate).toBe(50);
  });
  it("diversity bonus for 4+ types", () => {
    const types: SafeguardingReferral["referralType"][] = ["section_47", "section_17", "lado", "police_referral"];
    const referrals = types.map((t) => makeReferral({ childId: "c1", childName: "Alex", referralType: t }));
    expect(buildChildSafeguardingProfiles(referrals)[0].overallScore).toBeGreaterThanOrEqual(5);
  });
  it("caps at 10", () => {
    const referrals = Array.from({ length: 15 }, () => makeReferral({ childId: "c1", childName: "Alex" }));
    expect(buildChildSafeguardingProfiles(referrals)[0].overallScore).toBeLessThanOrEqual(10);
  });
});

describe("generateSafeguardingReferralQualityIntelligence", () => {
  const b = { homeId: "oak-house", periodStart: "2026-01-01", periodEnd: "2026-05-19" };

  it("returns inadequate for empty", () => {
    const r = generateSafeguardingReferralQualityIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(0); expect(r.rating).toBe("inadequate");
  });
  it("returns outstanding for perfect", () => {
    const types: SafeguardingReferral["referralType"][] = ["section_47", "section_17", "lado", "police_referral", "multi_agency", "early_help", "internal_concern", "external_disclosure"];
    const referrals = Array.from({ length: 10 }, (_, i) => makeReferral({ referralType: types[i % 8] }));
    const r = generateSafeguardingReferralQualityIntelligence(referrals, makePolicy(), Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBe(100); expect(r.rating).toBe("outstanding");
  });
  it("caps at 100", () => {
    const types: SafeguardingReferral["referralType"][] = ["section_47", "section_17", "lado", "police_referral", "multi_agency", "early_help", "internal_concern", "external_disclosure"];
    const r = generateSafeguardingReferralQualityIntelligence(Array.from({ length: 20 }, (_, i) => makeReferral({ referralType: types[i % 8] })), makePolicy(), Array.from({ length: 10 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("includes homeId and period", () => {
    const r = generateSafeguardingReferralQualityIntelligence([], null, [], "test", "2026-01-01", "2026-06-30");
    expect(r.homeId).toBe("test"); expect(r.periodStart).toBe("2026-01-01");
  });
  it("generates strength for high appropriate outcomes", () => {
    const r = generateSafeguardingReferralQualityIntelligence(Array.from({ length: 5 }, () => makeReferral()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("appropriate action"))).toBe(true);
  });
  it("generates strength for high timely responses", () => {
    const r = generateSafeguardingReferralQualityIntelligence(Array.from({ length: 5 }, () => makeReferral()), null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.strengths.some((s) => s.includes("Timely"))).toBe(true);
  });
  it("generates action for no referrals", () => {
    const r = generateSafeguardingReferralQualityIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.includes("No safeguarding referral records"))).toBe(true);
  });
  it("generates URGENT for no policy", () => {
    const r = generateSafeguardingReferralQualityIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });
  it("generates URGENT for no training", () => {
    const r = generateSafeguardingReferralQualityIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });
  it("has 7 regulatory links", () => {
    const r = generateSafeguardingReferralQualityIntelligence([], null, [], b.homeId, b.periodStart, b.periodEnd);
    expect(r.regulatoryLinks.length).toBe(7);
    expect(r.regulatoryLinks.some((l) => l.includes("Section 47"))).toBe(true);
  });
  it("good rating for ~75", () => {
    const r = generateSafeguardingReferralQualityIntelligence(Array.from({ length: 5 }, () => makeReferral()), null, Array.from({ length: 5 }, () => makeTraining()), b.homeId, b.periodStart, b.periodEnd);
    expect(r.rating).toBe("good");
  });
});
