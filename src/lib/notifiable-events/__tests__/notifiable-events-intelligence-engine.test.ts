import { describe, it, expect } from "vitest";
import {
  pct, getRating, getNotifiableEventsCategoryLabel, getNotifiableEventsOutcomeLabel, getRatingLabel,
  evaluateNotifiableEventsQuality, evaluateNotifiableEventsCompliance, evaluateNotifiableEventsPolicy,
  evaluateStaffNotifiableEventsReadiness, buildChildNotifiableEventsProfiles, generateNotifiableEventsIntelligence,
} from "../notifiable-events-intelligence-engine";
import type {
  NotifiableEventsRecord, NotifiableEventsPolicy, StaffNotifiableEventsTraining,
  NotifiableEventsCategory, NotifiableEventsOutcome, Rating,
} from "../notifiable-events-intelligence-engine";

function makeRecord(overrides: Partial<NotifiableEventsRecord> = {}): NotifiableEventsRecord {
  return { id: "ne-1", homeId: "home-oak", date: "2026-03-15", childId: "child-alex", childName: "Alex", category: "serious_injury", outcome: "notified_within_timeframe", notificationTimely: true, correctRecipientsNotified: true, documentationComplete: true, followUpActioned: true, regulatoryBodyNotified: true, timelyRecording: true, ...overrides };
}
function makeRecords(n: number, o: Partial<NotifiableEventsRecord> = {}): NotifiableEventsRecord[] {
  return Array.from({ length: n }, (_, i) => makeRecord({ id: `ne-${i}`, ...o }));
}
function allTruePolicy(): NotifiableEventsPolicy {
  return { notifiableEventsPolicy: true, notificationTimeframePolicy: true, ofstedNotificationProcedure: true, localAuthorityNotificationPolicy: true, internalEscalationPolicy: true, postIncidentReviewPolicy: true, recordKeepingPolicy: true };
}
function allFalsePolicy(): NotifiableEventsPolicy {
  return { notifiableEventsPolicy: false, notificationTimeframePolicy: false, ofstedNotificationProcedure: false, localAuthorityNotificationPolicy: false, internalEscalationPolicy: false, postIncidentReviewPolicy: false, recordKeepingPolicy: false };
}
function makeStaff(o: Partial<StaffNotifiableEventsTraining> = {}): StaffNotifiableEventsTraining {
  return { staffId: "s1", notifiableEventsKnowledge: true, ofstedNotificationProcess: true, localAuthorityReporting: true, internalEscalationProcedure: true, documentationRequirements: true, postIncidentReviewSkills: true, ...o };
}

// ═══ pct ═══
describe("pct", () => {
  it("returns percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 for den=0", () => { expect(pct(5, 0)).toBe(0); });
  it("100 for 1/1", () => { expect(pct(1, 1)).toBe(100); });
  it("rounds 2/3 to 67", () => { expect(pct(2, 3)).toBe(67); });
  it("rounds 1/3 to 33", () => { expect(pct(1, 3)).toBe(33); });
});

// ═══ getRating ═══
describe("getRating", () => {
  it("outstanding ≥80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("inadequate <40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

// ═══ Labels ═══
describe("getNotifiableEventsCategoryLabel", () => {
  const cases: [NotifiableEventsCategory, string][] = [
    ["serious_injury", "Serious Injury"], ["child_death", "Child Death"], ["child_protection_referral", "Child Protection Referral"],
    ["police_involvement", "Police Involvement"], ["safeguarding_concern", "Safeguarding Concern"], ["missing_from_care", "Missing from Care"],
    ["allegation_against_staff", "Allegation Against Staff"], ["significant_incident", "Significant Incident"],
  ];
  it.each(cases)("%s → %s", (c, l) => { expect(getNotifiableEventsCategoryLabel(c)).toBe(l); });
});

describe("getNotifiableEventsOutcomeLabel", () => {
  const cases: [NotifiableEventsOutcome, string][] = [
    ["notified_within_timeframe", "Notified Within Timeframe"], ["late_notification", "Late Notification"],
    ["partial_notification", "Partial Notification"], ["not_notified", "Not Notified"], ["not_applicable", "Not Applicable"],
  ];
  it.each(cases)("%s → %s", (o, l) => { expect(getNotifiableEventsOutcomeLabel(o)).toBe(l); });
});

describe("getRatingLabel", () => {
  const cases: [Rating, string][] = [["outstanding", "Outstanding"], ["good", "Good"], ["requires_improvement", "Requires Improvement"], ["inadequate", "Inadequate"]];
  it.each(cases)("%s → %s", (r, l) => { expect(getRatingLabel(r)).toBe(l); });
});

// ═══ Quality ═══
describe("evaluateNotifiableEventsQuality", () => {
  it("0 for empty", () => { const r = evaluateNotifiableEventsQuality([]); expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0); });
  it("25 for perfect", () => { const r = evaluateNotifiableEventsQuality(makeRecords(5)); expect(r.overallScore).toBe(25); expect(r.totalRecords).toBe(5); });
  it("0 for all-false", () => { const r = evaluateNotifiableEventsQuality(makeRecords(3, { notificationTimely: false, correctRecipientsNotified: false, documentationComplete: false, followUpActioned: false })); expect(r.overallScore).toBe(0); });
  it("weight 7 for notificationTimely", () => { const r = evaluateNotifiableEventsQuality([makeRecord({ notificationTimely: true, correctRecipientsNotified: false, documentationComplete: false, followUpActioned: false })]); expect(r.overallScore).toBe(7); });
  it("weight 6 for correctRecipientsNotified", () => { const r = evaluateNotifiableEventsQuality([makeRecord({ notificationTimely: false, correctRecipientsNotified: true, documentationComplete: false, followUpActioned: false })]); expect(r.overallScore).toBe(6); });
  it("weight 6 for documentationComplete", () => { const r = evaluateNotifiableEventsQuality([makeRecord({ notificationTimely: false, correctRecipientsNotified: false, documentationComplete: true, followUpActioned: false })]); expect(r.overallScore).toBe(6); });
  it("weight 6 for followUpActioned", () => { const r = evaluateNotifiableEventsQuality([makeRecord({ notificationTimely: false, correctRecipientsNotified: false, documentationComplete: false, followUpActioned: true })]); expect(r.overallScore).toBe(6); });
  it("partial rates 50%", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", notificationTimely: false, correctRecipientsNotified: false, documentationComplete: false, followUpActioned: false })];
    const r = evaluateNotifiableEventsQuality(records);
    expect(r.notificationTimelyRate).toBe(50);
    expect(r.overallScore).toBe(12.5);
  });
  it("caps at 25", () => { const r = evaluateNotifiableEventsQuality(makeRecords(100)); expect(r.overallScore).toBeLessThanOrEqual(25); });
});

// ═══ Compliance ═══
describe("evaluateNotifiableEventsCompliance", () => {
  it("0 for empty", () => { const r = evaluateNotifiableEventsCompliance([]); expect(r.overallScore).toBe(0); expect(r.uniqueCategories).toBe(0); });
  it("25 for perfect with all 8 categories", () => {
    const cats: NotifiableEventsCategory[] = ["serious_injury", "child_death", "child_protection_referral", "police_involvement", "safeguarding_concern", "missing_from_care", "allegation_against_staff", "significant_incident"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = evaluateNotifiableEventsCompliance(records);
    expect(r.overallScore).toBe(25);
    expect(r.uniqueCategories).toBe(8);
    expect(r.categoryDiversityRatio).toBe(1);
  });
  it("categoryDiversityRatio for 4/8", () => {
    const cats: NotifiableEventsCategory[] = ["serious_injury", "child_death", "police_involvement", "missing_from_care"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = evaluateNotifiableEventsCompliance(records);
    expect(r.uniqueCategories).toBe(4);
    expect(r.categoryDiversityRatio).toBe(0.5);
  });
  it("single category ratio", () => { const r = evaluateNotifiableEventsCompliance(makeRecords(5)); expect(r.uniqueCategories).toBe(1); expect(r.categoryDiversityRatio).toBe(0.13); });
  it("weight 8 for regulatoryBodyNotified", () => {
    const records = [makeRecord({ regulatoryBodyNotified: true, timelyRecording: false, notificationTimely: false })];
    const r = evaluateNotifiableEventsCompliance(records);
    const catRatio = Math.round((1 / 8) * 100) / 100;
    const expected = Math.round((8 + catRatio * 5) * 10) / 10;
    expect(r.overallScore).toBe(expected);
  });
  it("caps at 25", () => { const r = evaluateNotifiableEventsCompliance(makeRecords(100)); expect(r.overallScore).toBeLessThanOrEqual(25); });
});

// ═══ Policy ═══
describe("evaluateNotifiableEventsPolicy", () => {
  it("0 for null", () => { const r = evaluateNotifiableEventsPolicy(null); expect(r.overallScore).toBe(0); expect(r.notifiableEventsPolicy).toBe(false); });
  it("25 for all-true", () => { expect(evaluateNotifiableEventsPolicy(allTruePolicy()).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateNotifiableEventsPolicy(allFalsePolicy()).overallScore).toBe(0); });
  it("notifiableEventsPolicy = 4", () => { expect(evaluateNotifiableEventsPolicy({ ...allFalsePolicy(), notifiableEventsPolicy: true }).overallScore).toBe(4); });
  it("notificationTimeframePolicy = 4", () => { expect(evaluateNotifiableEventsPolicy({ ...allFalsePolicy(), notificationTimeframePolicy: true }).overallScore).toBe(4); });
  it("ofstedNotificationProcedure = 4", () => { expect(evaluateNotifiableEventsPolicy({ ...allFalsePolicy(), ofstedNotificationProcedure: true }).overallScore).toBe(4); });
  it("localAuthorityNotificationPolicy = 4", () => { expect(evaluateNotifiableEventsPolicy({ ...allFalsePolicy(), localAuthorityNotificationPolicy: true }).overallScore).toBe(4); });
  it("internalEscalationPolicy = 3", () => { expect(evaluateNotifiableEventsPolicy({ ...allFalsePolicy(), internalEscalationPolicy: true }).overallScore).toBe(3); });
  it("postIncidentReviewPolicy = 3", () => { expect(evaluateNotifiableEventsPolicy({ ...allFalsePolicy(), postIncidentReviewPolicy: true }).overallScore).toBe(3); });
  it("recordKeepingPolicy = 3", () => { expect(evaluateNotifiableEventsPolicy({ ...allFalsePolicy(), recordKeepingPolicy: true }).overallScore).toBe(3); });
  it("weights sum to 25", () => { expect(evaluateNotifiableEventsPolicy(allTruePolicy()).overallScore).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3); });
  it("partial: one disabled = 22", () => { expect(evaluateNotifiableEventsPolicy({ ...allTruePolicy(), recordKeepingPolicy: false }).overallScore).toBe(22); });
});

// ═══ Staff Readiness ═══
describe("evaluateStaffNotifiableEventsReadiness", () => {
  it("0 for empty", () => { const r = evaluateStaffNotifiableEventsReadiness([]); expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0); });
  it("25 for all-true", () => { expect(evaluateStaffNotifiableEventsReadiness([makeStaff()]).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateStaffNotifiableEventsReadiness([makeStaff({ notifiableEventsKnowledge: false, ofstedNotificationProcess: false, localAuthorityReporting: false, internalEscalationProcedure: false, documentationRequirements: false, postIncidentReviewSkills: false })]).overallScore).toBe(0); });
  it("notifiableEventsKnowledge = 6", () => { expect(evaluateStaffNotifiableEventsReadiness([makeStaff({ notifiableEventsKnowledge: true, ofstedNotificationProcess: false, localAuthorityReporting: false, internalEscalationProcedure: false, documentationRequirements: false, postIncidentReviewSkills: false })]).overallScore).toBe(6); });
  it("ofstedNotificationProcess = 5", () => { expect(evaluateStaffNotifiableEventsReadiness([makeStaff({ notifiableEventsKnowledge: false, ofstedNotificationProcess: true, localAuthorityReporting: false, internalEscalationProcedure: false, documentationRequirements: false, postIncidentReviewSkills: false })]).overallScore).toBe(5); });
  it("localAuthorityReporting = 5", () => { expect(evaluateStaffNotifiableEventsReadiness([makeStaff({ notifiableEventsKnowledge: false, ofstedNotificationProcess: false, localAuthorityReporting: true, internalEscalationProcedure: false, documentationRequirements: false, postIncidentReviewSkills: false })]).overallScore).toBe(5); });
  it("internalEscalationProcedure = 4", () => { expect(evaluateStaffNotifiableEventsReadiness([makeStaff({ notifiableEventsKnowledge: false, ofstedNotificationProcess: false, localAuthorityReporting: false, internalEscalationProcedure: true, documentationRequirements: false, postIncidentReviewSkills: false })]).overallScore).toBe(4); });
  it("documentationRequirements = 3", () => { expect(evaluateStaffNotifiableEventsReadiness([makeStaff({ notifiableEventsKnowledge: false, ofstedNotificationProcess: false, localAuthorityReporting: false, internalEscalationProcedure: false, documentationRequirements: true, postIncidentReviewSkills: false })]).overallScore).toBe(3); });
  it("postIncidentReviewSkills = 2", () => { expect(evaluateStaffNotifiableEventsReadiness([makeStaff({ notifiableEventsKnowledge: false, ofstedNotificationProcess: false, localAuthorityReporting: false, internalEscalationProcedure: false, documentationRequirements: false, postIncidentReviewSkills: true })]).overallScore).toBe(2); });
  it("weights sum to 25", () => { expect(evaluateStaffNotifiableEventsReadiness([makeStaff()]).overallScore).toBe(6 + 5 + 5 + 4 + 3 + 2); });
  it("mixed staff partial", () => {
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2", notifiableEventsKnowledge: false, postIncidentReviewSkills: false })];
    const r = evaluateStaffNotifiableEventsReadiness(staff);
    expect(r.totalStaff).toBe(2);
    expect(r.notifiableEventsKnowledgeRate).toBe(50);
    // (50/100)*6 + 5 + 5 + 4 + 3 + (50/100)*2 = 3+5+5+4+3+1 = 21
    expect(r.overallScore).toBe(21);
  });
});

// ═══ Child Profiles ═══
describe("buildChildNotifiableEventsProfiles", () => {
  it("empty for no records", () => { expect(buildChildNotifiableEventsProfiles([])).toEqual([]); });
  it("groups by childId", () => {
    const profiles = buildChildNotifiableEventsProfiles([makeRecord({ id: "a", childId: "c1", childName: "A" }), makeRecord({ id: "b", childId: "c2", childName: "B" }), makeRecord({ id: "c", childId: "c1", childName: "A" })]);
    expect(profiles).toHaveLength(2);
    expect(profiles.find(p => p.childId === "c1")!.totalRecords).toBe(2);
  });
  it("freq=0 for <5", () => { const p = buildChildNotifiableEventsProfiles(makeRecords(4, { childId: "c1" })); expect(p[0].overallScore).toBe(6); /* 0+3+3+0 */ });
  it("freq=1 for 5-9", () => { const p = buildChildNotifiableEventsProfiles(makeRecords(5, { childId: "c1" })); expect(p[0].overallScore).toBe(7); });
  it("freq=2 for >=10", () => { const p = buildChildNotifiableEventsProfiles(makeRecords(10, { childId: "c1" })); expect(p[0].overallScore).toBe(8); });
  it("diversity bonus 1 for 2 cats", () => {
    const records = [makeRecord({ id: "a", childId: "c1", category: "serious_injury" }), makeRecord({ id: "b", childId: "c1", category: "child_death" })];
    const p = buildChildNotifiableEventsProfiles(records);
    expect(p[0].overallScore).toBe(7); // 0+3+3+1
  });
  it("diversity bonus 2 for >=4 cats", () => {
    const cats: NotifiableEventsCategory[] = ["serious_injury", "child_death", "police_involvement", "missing_from_care"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, childId: "c1", category: c }));
    const p = buildChildNotifiableEventsProfiles(records);
    expect(p[0].overallScore).toBe(8); // 0+3+3+2
  });
  it("caps at 10", () => {
    const cats: NotifiableEventsCategory[] = ["serious_injury", "child_death", "police_involvement", "missing_from_care", "safeguarding_concern", "allegation_against_staff", "significant_incident", "child_protection_referral"];
    const records = cats.flatMap((c, ci) => [0, 1].map(j => makeRecord({ id: `r-${ci}-${j}`, childId: "c1", category: c })));
    const p = buildChildNotifiableEventsProfiles(records);
    expect(p[0].overallScore).toBe(10);
  });
});

// ═══ Orchestrator ═══
describe("generateNotifiableEventsIntelligence", () => {
  it("outstanding for perfect data", () => {
    const cats: NotifiableEventsCategory[] = ["serious_injury", "child_death", "child_protection_referral", "police_involvement", "safeguarding_concern", "missing_from_care", "allegation_against_staff", "significant_incident"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = generateNotifiableEventsIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });
  it("inadequate for empty", () => {
    const r = generateNotifiableEventsIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("filters by period", () => {
    const r = generateNotifiableEventsIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord({ id: "in", date: "2026-06-15" }), makeRecord({ id: "out", date: "2025-01-01" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.notifiableEventsQuality.totalRecords).toBe(1);
  });
  it("includes all evaluators", () => {
    const r = generateNotifiableEventsIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.notifiableEventsQuality).toBeDefined();
    expect(r.notifiableEventsCompliance).toBeDefined();
    expect(r.notifiableEventsPolicy).toBeDefined();
    expect(r.staffReadiness).toBeDefined();
  });
  it("includes child profiles", () => {
    const r = generateNotifiableEventsIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord({ childId: "c1" }), makeRecord({ id: "b", childId: "c2" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.childProfiles).toHaveLength(2);
  });
  it("includes regulatory links", () => {
    const r = generateNotifiableEventsIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.length).toBeGreaterThan(0);
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 40"))).toBe(true);
  });
  it("strengths for outstanding", () => {
    const cats: NotifiableEventsCategory[] = ["serious_injury", "child_death", "child_protection_referral", "police_involvement", "safeguarding_concern", "missing_from_care", "allegation_against_staff", "significant_incident"];
    const r = generateNotifiableEventsIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.length).toBeGreaterThan(0);
  });
  it("areas for improvement when no records", () => {
    const r = generateNotifiableEventsIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });
  it("actions when policy null", () => {
    const r = generateNotifiableEventsIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.actions.some(a => a.includes("URGENT"))).toBe(true);
  });
});
