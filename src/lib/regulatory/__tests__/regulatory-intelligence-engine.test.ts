import { describe, it, expect } from "vitest";
import {
  pct, getRating, getRegulatoryCategoryLabel, getRegulatoryOutcomeLabel, getRatingLabel,
  evaluateRegulatoryQuality, evaluateRegulatoryCompliance, evaluateRegulatoryPolicy,
  evaluateStaffRegulatoryReadiness, buildChildRegulatoryProfiles, generateRegulatoryIntelligence,
} from "../regulatory-intelligence-engine";
import type {
  RegulatoryRecord, RegulatoryPolicy, StaffRegulatoryTraining,
  RegulatoryCategory, RegulatoryOutcome, Rating,
} from "../regulatory-intelligence-engine";

function makeRecord(overrides: Partial<RegulatoryRecord> = {}): RegulatoryRecord {
  return { id: "reg-1", homeId: "home-oak", date: "2026-03-15", childId: "child-alex", childName: "Alex", category: "reg44_visit", outcome: "fully_compliant", reportAccurate: true, deadlineMet: true, evidenceAttached: true, actionPointsAddressed: true, documentationComplete: true, timelyRecording: true, ...overrides };
}
function makeRecords(n: number, o: Partial<RegulatoryRecord> = {}): RegulatoryRecord[] {
  return Array.from({ length: n }, (_, i) => makeRecord({ id: `reg-${i}`, ...o }));
}
function allTruePolicy(): RegulatoryPolicy {
  return { reg44VisitPolicy: true, reg45ReportingPolicy: true, ofstedNotificationPolicy: true, statutoryNotificationPolicy: true, actionPointTrackingPolicy: true, complianceAuditPolicy: true, regulatoryInspectionPolicy: true };
}
function allFalsePolicy(): RegulatoryPolicy {
  return { reg44VisitPolicy: false, reg45ReportingPolicy: false, ofstedNotificationPolicy: false, statutoryNotificationPolicy: false, actionPointTrackingPolicy: false, complianceAuditPolicy: false, regulatoryInspectionPolicy: false };
}
function makeStaff(o: Partial<StaffRegulatoryTraining> = {}): StaffRegulatoryTraining {
  return { staffId: "s1", regulatoryKnowledge: true, reportWritingSkills: true, notificationProcedureKnowledge: true, actionPointManagementSkills: true, complianceAuditSkills: true, inspectionPreparationSkills: true, ...o };
}

// ═══ pct ═══
describe("pct", () => {
  it("returns percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 for den=0", () => { expect(pct(5, 0)).toBe(0); });
  it("100 for 1/1", () => { expect(pct(1, 1)).toBe(100); });
  it("rounds 2/3 to 67", () => { expect(pct(2, 3)).toBe(67); });
  it("rounds 1/3 to 33", () => { expect(pct(1, 3)).toBe(33); });
  it("returns 0 for 0/0", () => { expect(pct(0, 0)).toBe(0); });
  it("returns 50 for 1/2", () => { expect(pct(1, 2)).toBe(50); });
});

// ═══ getRating ═══
describe("getRating", () => {
  it("outstanding >=80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("inadequate <40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
  it("boundary 80 is outstanding", () => { expect(getRating(80)).toBe("outstanding"); });
  it("boundary 60 is good", () => { expect(getRating(60)).toBe("good"); });
  it("boundary 40 is requires_improvement", () => { expect(getRating(40)).toBe("requires_improvement"); });
});

// ═══ Labels ═══
describe("getRegulatoryCategoryLabel", () => {
  const cases: [RegulatoryCategory, string][] = [
    ["reg44_visit", "Reg 44 Visit"], ["reg45_report", "Reg 45 Report"], ["ofsted_notification", "Ofsted Notification"],
    ["schedule4_matter", "Schedule 4 Matter"], ["statutory_notification", "Statutory Notification"],
    ["action_point_tracking", "Action Point Tracking"], ["regulatory_inspection", "Regulatory Inspection"],
    ["compliance_audit", "Compliance Audit"],
  ];
  it.each(cases)("%s → %s", (c, l) => { expect(getRegulatoryCategoryLabel(c)).toBe(l); });
});

describe("getRegulatoryOutcomeLabel", () => {
  const cases: [RegulatoryOutcome, string][] = [
    ["fully_compliant", "Fully Compliant"], ["partially_compliant", "Partially Compliant"],
    ["overdue", "Overdue"], ["non_compliant", "Non-Compliant"], ["not_applicable", "Not Applicable"],
  ];
  it.each(cases)("%s → %s", (o, l) => { expect(getRegulatoryOutcomeLabel(o)).toBe(l); });
});

describe("getRatingLabel", () => {
  const cases: [Rating, string][] = [["outstanding", "Outstanding"], ["good", "Good"], ["requires_improvement", "Requires Improvement"], ["inadequate", "Inadequate"]];
  it.each(cases)("%s → %s", (r, l) => { expect(getRatingLabel(r)).toBe(l); });
});

// ═══ Quality ═══
describe("evaluateRegulatoryQuality", () => {
  it("0 for empty", () => { const r = evaluateRegulatoryQuality([]); expect(r.overallScore).toBe(0); expect(r.totalRecords).toBe(0); });
  it("25 for perfect", () => { const r = evaluateRegulatoryQuality(makeRecords(5)); expect(r.overallScore).toBe(25); expect(r.totalRecords).toBe(5); });
  it("0 for all-false", () => { const r = evaluateRegulatoryQuality(makeRecords(3, { reportAccurate: false, deadlineMet: false, evidenceAttached: false, actionPointsAddressed: false })); expect(r.overallScore).toBe(0); });
  it("weight 7 for reportAccurate", () => { const r = evaluateRegulatoryQuality([makeRecord({ reportAccurate: true, deadlineMet: false, evidenceAttached: false, actionPointsAddressed: false })]); expect(r.overallScore).toBe(7); });
  it("weight 6 for deadlineMet", () => { const r = evaluateRegulatoryQuality([makeRecord({ reportAccurate: false, deadlineMet: true, evidenceAttached: false, actionPointsAddressed: false })]); expect(r.overallScore).toBe(6); });
  it("weight 6 for evidenceAttached", () => { const r = evaluateRegulatoryQuality([makeRecord({ reportAccurate: false, deadlineMet: false, evidenceAttached: true, actionPointsAddressed: false })]); expect(r.overallScore).toBe(6); });
  it("weight 6 for actionPointsAddressed", () => { const r = evaluateRegulatoryQuality([makeRecord({ reportAccurate: false, deadlineMet: false, evidenceAttached: false, actionPointsAddressed: true })]); expect(r.overallScore).toBe(6); });
  it("partial rates 50%", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", reportAccurate: false, deadlineMet: false, evidenceAttached: false, actionPointsAddressed: false })];
    const r = evaluateRegulatoryQuality(records);
    expect(r.reportAccurateRate).toBe(50);
    expect(r.overallScore).toBe(12.5);
  });
  it("caps at 25", () => { const r = evaluateRegulatoryQuality(makeRecords(100)); expect(r.overallScore).toBeLessThanOrEqual(25); });
  it("reports correct rates", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", reportAccurate: false }), makeRecord({ id: "c", deadlineMet: false })];
    const r = evaluateRegulatoryQuality(records);
    expect(r.reportAccurateRate).toBe(67);
    expect(r.deadlineMetRate).toBe(67);
    expect(r.evidenceAttachedRate).toBe(100);
    expect(r.actionPointsAddressedRate).toBe(100);
  });
  it("single record all true = 25", () => { const r = evaluateRegulatoryQuality([makeRecord()]); expect(r.overallScore).toBe(25); });
});

// ═══ Compliance ═══
describe("evaluateRegulatoryCompliance", () => {
  it("0 for empty", () => { const r = evaluateRegulatoryCompliance([]); expect(r.overallScore).toBe(0); expect(r.uniqueCategories).toBe(0); });
  it("25 for perfect with all 8 categories", () => {
    const cats: RegulatoryCategory[] = ["reg44_visit", "reg45_report", "ofsted_notification", "schedule4_matter", "statutory_notification", "action_point_tracking", "regulatory_inspection", "compliance_audit"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = evaluateRegulatoryCompliance(records);
    expect(r.overallScore).toBe(25);
    expect(r.uniqueCategories).toBe(8);
    expect(r.categoryDiversityRatio).toBe(1);
  });
  it("categoryDiversityRatio for 4/8", () => {
    const cats: RegulatoryCategory[] = ["reg44_visit", "reg45_report", "ofsted_notification", "schedule4_matter"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = evaluateRegulatoryCompliance(records);
    expect(r.uniqueCategories).toBe(4);
    expect(r.categoryDiversityRatio).toBe(0.5);
  });
  it("single category ratio", () => { const r = evaluateRegulatoryCompliance(makeRecords(5)); expect(r.uniqueCategories).toBe(1); expect(r.categoryDiversityRatio).toBe(0.13); });
  it("weight 8 for documentationComplete", () => {
    const records = [makeRecord({ documentationComplete: true, timelyRecording: false, reportAccurate: false })];
    const r = evaluateRegulatoryCompliance(records);
    const catRatio = Math.round((1 / 8) * 100) / 100;
    const expected = Math.round((8 + catRatio * 5) * 10) / 10;
    expect(r.overallScore).toBe(expected);
  });
  it("weight 7 for timelyRecording", () => {
    const records = [makeRecord({ documentationComplete: false, timelyRecording: true, reportAccurate: false })];
    const r = evaluateRegulatoryCompliance(records);
    const catRatio = Math.round((1 / 8) * 100) / 100;
    const expected = Math.round((7 + catRatio * 5) * 10) / 10;
    expect(r.overallScore).toBe(expected);
  });
  it("weight 5 for reportAccurate", () => {
    const records = [makeRecord({ documentationComplete: false, timelyRecording: false, reportAccurate: true })];
    const r = evaluateRegulatoryCompliance(records);
    const catRatio = Math.round((1 / 8) * 100) / 100;
    const expected = Math.round((5 + catRatio * 5) * 10) / 10;
    expect(r.overallScore).toBe(expected);
  });
  it("caps at 25", () => { const r = evaluateRegulatoryCompliance(makeRecords(100)); expect(r.overallScore).toBeLessThanOrEqual(25); });
  it("0 for all-false single category", () => {
    const records = [makeRecord({ documentationComplete: false, timelyRecording: false, reportAccurate: false })];
    const r = evaluateRegulatoryCompliance(records);
    const catRatio = Math.round((1 / 8) * 100) / 100;
    expect(r.overallScore).toBe(Math.round(catRatio * 5 * 10) / 10);
  });
  it("reports correct rates", () => {
    const records = [makeRecord({ id: "a" }), makeRecord({ id: "b", documentationComplete: false }), makeRecord({ id: "c", timelyRecording: false })];
    const r = evaluateRegulatoryCompliance(records);
    expect(r.documentationCompleteRate).toBe(67);
    expect(r.timelyRecordingRate).toBe(67);
    expect(r.reportAccurateRate).toBe(100);
  });
});

// ═══ Policy ═══
describe("evaluateRegulatoryPolicy", () => {
  it("0 for null", () => { const r = evaluateRegulatoryPolicy(null); expect(r.overallScore).toBe(0); expect(r.reg44VisitPolicy).toBe(false); });
  it("25 for all-true", () => { expect(evaluateRegulatoryPolicy(allTruePolicy()).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateRegulatoryPolicy(allFalsePolicy()).overallScore).toBe(0); });
  it("reg44VisitPolicy = 4", () => { expect(evaluateRegulatoryPolicy({ ...allFalsePolicy(), reg44VisitPolicy: true }).overallScore).toBe(4); });
  it("reg45ReportingPolicy = 4", () => { expect(evaluateRegulatoryPolicy({ ...allFalsePolicy(), reg45ReportingPolicy: true }).overallScore).toBe(4); });
  it("ofstedNotificationPolicy = 4", () => { expect(evaluateRegulatoryPolicy({ ...allFalsePolicy(), ofstedNotificationPolicy: true }).overallScore).toBe(4); });
  it("statutoryNotificationPolicy = 4", () => { expect(evaluateRegulatoryPolicy({ ...allFalsePolicy(), statutoryNotificationPolicy: true }).overallScore).toBe(4); });
  it("actionPointTrackingPolicy = 3", () => { expect(evaluateRegulatoryPolicy({ ...allFalsePolicy(), actionPointTrackingPolicy: true }).overallScore).toBe(3); });
  it("complianceAuditPolicy = 3", () => { expect(evaluateRegulatoryPolicy({ ...allFalsePolicy(), complianceAuditPolicy: true }).overallScore).toBe(3); });
  it("regulatoryInspectionPolicy = 3", () => { expect(evaluateRegulatoryPolicy({ ...allFalsePolicy(), regulatoryInspectionPolicy: true }).overallScore).toBe(3); });
  it("weights sum to 25", () => { expect(evaluateRegulatoryPolicy(allTruePolicy()).overallScore).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3); });
  it("partial: one disabled = 22", () => { expect(evaluateRegulatoryPolicy({ ...allTruePolicy(), regulatoryInspectionPolicy: false }).overallScore).toBe(22); });
  it("null returns all false booleans", () => {
    const r = evaluateRegulatoryPolicy(null);
    expect(r.reg44VisitPolicy).toBe(false);
    expect(r.reg45ReportingPolicy).toBe(false);
    expect(r.ofstedNotificationPolicy).toBe(false);
    expect(r.statutoryNotificationPolicy).toBe(false);
    expect(r.actionPointTrackingPolicy).toBe(false);
    expect(r.complianceAuditPolicy).toBe(false);
    expect(r.regulatoryInspectionPolicy).toBe(false);
  });
  it("two policies enabled = 8", () => { expect(evaluateRegulatoryPolicy({ ...allFalsePolicy(), reg44VisitPolicy: true, reg45ReportingPolicy: true }).overallScore).toBe(8); });
});

// ═══ Staff Readiness ═══
describe("evaluateStaffRegulatoryReadiness", () => {
  it("0 for empty", () => { const r = evaluateStaffRegulatoryReadiness([]); expect(r.overallScore).toBe(0); expect(r.totalStaff).toBe(0); });
  it("25 for all-true", () => { expect(evaluateStaffRegulatoryReadiness([makeStaff()]).overallScore).toBe(25); });
  it("0 for all-false", () => { expect(evaluateStaffRegulatoryReadiness([makeStaff({ regulatoryKnowledge: false, reportWritingSkills: false, notificationProcedureKnowledge: false, actionPointManagementSkills: false, complianceAuditSkills: false, inspectionPreparationSkills: false })]).overallScore).toBe(0); });
  it("regulatoryKnowledge = 6", () => { expect(evaluateStaffRegulatoryReadiness([makeStaff({ regulatoryKnowledge: true, reportWritingSkills: false, notificationProcedureKnowledge: false, actionPointManagementSkills: false, complianceAuditSkills: false, inspectionPreparationSkills: false })]).overallScore).toBe(6); });
  it("reportWritingSkills = 5", () => { expect(evaluateStaffRegulatoryReadiness([makeStaff({ regulatoryKnowledge: false, reportWritingSkills: true, notificationProcedureKnowledge: false, actionPointManagementSkills: false, complianceAuditSkills: false, inspectionPreparationSkills: false })]).overallScore).toBe(5); });
  it("notificationProcedureKnowledge = 5", () => { expect(evaluateStaffRegulatoryReadiness([makeStaff({ regulatoryKnowledge: false, reportWritingSkills: false, notificationProcedureKnowledge: true, actionPointManagementSkills: false, complianceAuditSkills: false, inspectionPreparationSkills: false })]).overallScore).toBe(5); });
  it("actionPointManagementSkills = 4", () => { expect(evaluateStaffRegulatoryReadiness([makeStaff({ regulatoryKnowledge: false, reportWritingSkills: false, notificationProcedureKnowledge: false, actionPointManagementSkills: true, complianceAuditSkills: false, inspectionPreparationSkills: false })]).overallScore).toBe(4); });
  it("complianceAuditSkills = 3", () => { expect(evaluateStaffRegulatoryReadiness([makeStaff({ regulatoryKnowledge: false, reportWritingSkills: false, notificationProcedureKnowledge: false, actionPointManagementSkills: false, complianceAuditSkills: true, inspectionPreparationSkills: false })]).overallScore).toBe(3); });
  it("inspectionPreparationSkills = 2", () => { expect(evaluateStaffRegulatoryReadiness([makeStaff({ regulatoryKnowledge: false, reportWritingSkills: false, notificationProcedureKnowledge: false, actionPointManagementSkills: false, complianceAuditSkills: false, inspectionPreparationSkills: true })]).overallScore).toBe(2); });
  it("weights sum to 25", () => { expect(evaluateStaffRegulatoryReadiness([makeStaff()]).overallScore).toBe(6 + 5 + 5 + 4 + 3 + 2); });
  it("mixed staff partial", () => {
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2", regulatoryKnowledge: false, inspectionPreparationSkills: false })];
    const r = evaluateStaffRegulatoryReadiness(staff);
    expect(r.totalStaff).toBe(2);
    expect(r.regulatoryKnowledgeRate).toBe(50);
    // (50/100)*6 + 5 + 5 + 4 + 3 + (50/100)*2 = 3+5+5+4+3+1 = 21
    expect(r.overallScore).toBe(21);
  });
  it("reports correct rates", () => {
    const staff = [makeStaff({ staffId: "s1" }), makeStaff({ staffId: "s2", regulatoryKnowledge: false, reportWritingSkills: false })];
    const r = evaluateStaffRegulatoryReadiness(staff);
    expect(r.regulatoryKnowledgeRate).toBe(50);
    expect(r.reportWritingSkillsRate).toBe(50);
    expect(r.notificationProcedureKnowledgeRate).toBe(100);
  });
  it("three staff mixed", () => {
    const staff = [
      makeStaff({ staffId: "s1" }),
      makeStaff({ staffId: "s2", regulatoryKnowledge: false }),
      makeStaff({ staffId: "s3", regulatoryKnowledge: false, reportWritingSkills: false }),
    ];
    const r = evaluateStaffRegulatoryReadiness(staff);
    expect(r.totalStaff).toBe(3);
    expect(r.regulatoryKnowledgeRate).toBe(33);
    expect(r.reportWritingSkillsRate).toBe(67);
  });
});

// ═══ Child Profiles ═══
describe("buildChildRegulatoryProfiles", () => {
  it("empty for no records", () => { expect(buildChildRegulatoryProfiles([])).toEqual([]); });
  it("groups by childId", () => {
    const profiles = buildChildRegulatoryProfiles([makeRecord({ id: "a", childId: "c1", childName: "A" }), makeRecord({ id: "b", childId: "c2", childName: "B" }), makeRecord({ id: "c", childId: "c1", childName: "A" })]);
    expect(profiles).toHaveLength(2);
    expect(profiles.find(p => p.childId === "c1")!.totalRecords).toBe(2);
  });
  it("freq=0 for <5", () => { const p = buildChildRegulatoryProfiles(makeRecords(4, { childId: "c1" })); expect(p[0].overallScore).toBe(6); /* 0+3+3+0 */ });
  it("freq=1 for 5-9", () => { const p = buildChildRegulatoryProfiles(makeRecords(5, { childId: "c1" })); expect(p[0].overallScore).toBe(7); });
  it("freq=2 for >=10", () => { const p = buildChildRegulatoryProfiles(makeRecords(10, { childId: "c1" })); expect(p[0].overallScore).toBe(8); });
  it("diversity bonus 1 for 2 cats", () => {
    const records = [makeRecord({ id: "a", childId: "c1", category: "reg44_visit" }), makeRecord({ id: "b", childId: "c1", category: "reg45_report" })];
    const p = buildChildRegulatoryProfiles(records);
    expect(p[0].overallScore).toBe(7); // 0+3+3+1
  });
  it("diversity bonus 2 for >=4 cats", () => {
    const cats: RegulatoryCategory[] = ["reg44_visit", "reg45_report", "ofsted_notification", "schedule4_matter"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, childId: "c1", category: c }));
    const p = buildChildRegulatoryProfiles(records);
    expect(p[0].overallScore).toBe(8); // 0+3+3+2
  });
  it("caps at 10", () => {
    const cats: RegulatoryCategory[] = ["reg44_visit", "reg45_report", "ofsted_notification", "schedule4_matter", "statutory_notification", "action_point_tracking", "regulatory_inspection", "compliance_audit"];
    const records = cats.flatMap((c, ci) => [0, 1].map(j => makeRecord({ id: `r-${ci}-${j}`, childId: "c1", category: c })));
    const p = buildChildRegulatoryProfiles(records);
    expect(p[0].overallScore).toBe(10);
  });
  it("rate1Score tiers", () => {
    // rate1 = reportAccurateRate: >=80 → 3, >=60 → 2, >=40 → 1, else 0
    const records = makeRecords(5, { childId: "c1", reportAccurate: false, deadlineMet: true });
    const p = buildChildRegulatoryProfiles(records);
    expect(p[0].reportAccurateRate).toBe(0);
    // freq=1, rate1=0, rate2=3 (100%), diversity=0 => 4
    expect(p[0].overallScore).toBe(4);
  });
  it("rate2Score tiers", () => {
    // rate2 = deadlineMetRate: >=80 → 3, >=60 → 2, >=40 → 1, else 0
    const records = makeRecords(5, { childId: "c1", deadlineMet: false, reportAccurate: true });
    const p = buildChildRegulatoryProfiles(records);
    expect(p[0].deadlineMetRate).toBe(0);
    // freq=1, rate1=3 (100%), rate2=0, diversity=0 => 4
    expect(p[0].overallScore).toBe(4);
  });
  it("rate1 at 60% boundary", () => {
    // 3 out of 5 = 60%
    const records = [
      makeRecord({ id: "a", childId: "c1", reportAccurate: true, deadlineMet: true }),
      makeRecord({ id: "b", childId: "c1", reportAccurate: true, deadlineMet: true }),
      makeRecord({ id: "c", childId: "c1", reportAccurate: true, deadlineMet: true }),
      makeRecord({ id: "d", childId: "c1", reportAccurate: false, deadlineMet: false }),
      makeRecord({ id: "e", childId: "c1", reportAccurate: false, deadlineMet: false }),
    ];
    const p = buildChildRegulatoryProfiles(records);
    expect(p[0].reportAccurateRate).toBe(60);
    expect(p[0].deadlineMetRate).toBe(60);
    // freq=1, rate1=2 (60%), rate2=2 (60%), diversity=0 => 5
    expect(p[0].overallScore).toBe(5);
  });
  it("rate1 at 40% boundary", () => {
    // 2 out of 5 = 40%
    const records = [
      makeRecord({ id: "a", childId: "c1", reportAccurate: true, deadlineMet: true }),
      makeRecord({ id: "b", childId: "c1", reportAccurate: true, deadlineMet: true }),
      makeRecord({ id: "c", childId: "c1", reportAccurate: false, deadlineMet: false }),
      makeRecord({ id: "d", childId: "c1", reportAccurate: false, deadlineMet: false }),
      makeRecord({ id: "e", childId: "c1", reportAccurate: false, deadlineMet: false }),
    ];
    const p = buildChildRegulatoryProfiles(records);
    expect(p[0].reportAccurateRate).toBe(40);
    expect(p[0].deadlineMetRate).toBe(40);
    // freq=1, rate1=1 (40%), rate2=1 (40%), diversity=0 => 3
    expect(p[0].overallScore).toBe(3);
  });
  it("categoriesCovered is correct", () => {
    const records = [
      makeRecord({ id: "a", childId: "c1", category: "reg44_visit" }),
      makeRecord({ id: "b", childId: "c1", category: "reg45_report" }),
      makeRecord({ id: "c", childId: "c1", category: "reg44_visit" }),
    ];
    const p = buildChildRegulatoryProfiles(records);
    expect(p[0].categoriesCovered).toContain("reg44_visit");
    expect(p[0].categoriesCovered).toContain("reg45_report");
    expect(p[0].categoriesCovered).toHaveLength(2);
  });
});

// ═══ Orchestrator ═══
describe("generateRegulatoryIntelligence", () => {
  it("outstanding for perfect data", () => {
    const cats: RegulatoryCategory[] = ["reg44_visit", "reg45_report", "ofsted_notification", "schedule4_matter", "statutory_notification", "action_point_tracking", "regulatory_inspection", "compliance_audit"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });
  it("inadequate for empty", () => {
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });
  it("filters by period", () => {
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord({ id: "in", date: "2026-06-15" }), makeRecord({ id: "out", date: "2025-01-01" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.regulatoryQuality.totalRecords).toBe(1);
  });
  it("includes all evaluators", () => {
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.regulatoryQuality).toBeDefined();
    expect(r.regulatoryCompliance).toBeDefined();
    expect(r.regulatoryPolicy).toBeDefined();
    expect(r.staffReadiness).toBeDefined();
  });
  it("includes child profiles", () => {
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord({ childId: "c1" }), makeRecord({ id: "b", childId: "c2" })], policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.childProfiles).toHaveLength(2);
  });
  it("includes regulatory links", () => {
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.length).toBeGreaterThan(0);
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 44/45"))).toBe(true);
  });
  it("strengths for outstanding", () => {
    const cats: RegulatoryCategory[] = ["reg44_visit", "reg45_report", "ofsted_notification", "schedule4_matter", "statutory_notification", "action_point_tracking", "regulatory_inspection", "compliance_audit"];
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c })), policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.strengths.length).toBeGreaterThan(0);
  });
  it("areas for improvement when no records", () => {
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });
  it("actions when policy null", () => {
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.actions.some(a => a.includes("URGENT"))).toBe(true);
  });
  it("homeId preserved", () => {
    const r = generateRegulatoryIntelligence({ homeId: "home-elm", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.homeId).toBe("home-elm");
  });
  it("period preserved", () => {
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-02-01", periodEnd: "2026-06-30", records: [], policy: null, staff: [] });
    expect(r.periodStart).toBe("2026-02-01");
    expect(r.periodEnd).toBe("2026-06-30");
  });
  it("score capped at 100", () => {
    const cats: RegulatoryCategory[] = ["reg44_visit", "reg45_report", "ofsted_notification", "schedule4_matter", "statutory_notification", "action_point_tracking", "regulatory_inspection", "compliance_audit"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
  it("no actions message when all good", () => {
    const cats: RegulatoryCategory[] = ["reg44_visit", "reg45_report", "ofsted_notification", "schedule4_matter", "statutory_notification", "action_point_tracking", "regulatory_inspection", "compliance_audit"];
    const records = cats.map((c, i) => makeRecord({ id: `r-${i}`, category: c }));
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.actions.some(a => a.includes("No immediate actions required"))).toBe(true);
  });
  it("low score children trigger action", () => {
    const records = [makeRecord({ childId: "c1", childName: "Low", reportAccurate: false, deadlineMet: false })];
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records, policy: allTruePolicy(), staff: [makeStaff()] });
    expect(r.actions.some(a => a.includes("child(ren) with low regulatory scores"))).toBe(true);
  });
  it("regulatory links include all expected", () => {
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.regulatoryLinks.some(l => l.includes("CHR 2015 Reg 40/41"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("NMS 15"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("SCCIF"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("Children Act 1989"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("Quality Standards 2015"))).toBe(true);
    expect(r.regulatoryLinks.some(l => l.includes("Ofsted inspection framework"))).toBe(true);
  });
  it("no staff triggers urgent action", () => {
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [makeRecord()], policy: allTruePolicy(), staff: [] });
    expect(r.actions.some(a => a.includes("URGENT") && a.includes("training"))).toBe(true);
  });
  it("areas for improvement includes no policy warning", () => {
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.areasForImprovement.some(a => a.includes("No regulatory policy"))).toBe(true);
  });
  it("areas for improvement includes no staff warning", () => {
    const r = generateRegulatoryIntelligence({ homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-12-31", records: [], policy: null, staff: [] });
    expect(r.areasForImprovement.some(a => a.includes("No staff regulatory training"))).toBe(true);
  });
});
