import { describe, it, expect } from "vitest";
import {
  getRating,
  getReg44VisitCategoryLabel,
  getReg44VisitOutcomeLabel,
  getRatingLabel,
  evaluateReg44VisitQuality,
  evaluateReg44VisitCompliance,
  evaluateReg44VisitPolicy,
  evaluateStaffReg44VisitReadiness,
  buildChildReg44VisitProfiles,
  generateReg44VisitIntelligence,
} from "../reg44-visits-engine";
import type {
  Reg44VisitRecord,
  Reg44VisitPolicy,
  StaffReg44VisitTraining,
  Reg44VisitCategory,
} from "../reg44-visits-engine";

// -- Fixtures -----------------------------------------------------------------

let _rid = 0;
function makeRecord(o: Partial<Reg44VisitRecord> = {}): Reg44VisitRecord {
  _rid++;
  return {
    id: `rv-${_rid}`,
    homeId: "home-oak",
    date: "2026-03-01",
    childId: "child-1",
    childName: "Alex",
    category: "scheduled_visit",
    outcome: "satisfactory",
    childrenInterviewed: true,
    staffInterviewed: true,
    recordsReviewed: true,
    premisesInspected: true,
    documentationComplete: true,
    timelyRecording: true,
    ...o,
  };
}

function makePolicy(o: Partial<Reg44VisitPolicy> = {}): Reg44VisitPolicy {
  return {
    reg44VisitPolicy: true,
    visitFrequencyGuidance: true,
    childInterviewProcedure: true,
    reportWritingStandard: true,
    actionTrackingProcedure: true,
    escalationProtocol: true,
    independentVisitorPolicy: true,
    ...o,
  };
}

let _tid = 0;
function makeTraining(o: Partial<StaffReg44VisitTraining> = {}): StaffReg44VisitTraining {
  _tid++;
  return {
    staffId: `staff-${_tid}`,
    reg44Requirements: true,
    childInterviewSkills: true,
    reportWriting: true,
    actionTracking: true,
    regulatoryKnowledge: true,
    escalationProcedure: true,
    ...o,
  };
}

// == pct ======================================================================

// == getRating ================================================================

describe("getRating", () => {
  it("outstanding at 80", () => {
    expect(getRating(80)).toBe("outstanding");
  });
  it("outstanding at 100", () => {
    expect(getRating(100)).toBe("outstanding");
  });
  it("good at 60", () => {
    expect(getRating(60)).toBe("good");
  });
  it("good at 79", () => {
    expect(getRating(79)).toBe("good");
  });
  it("requires_improvement at 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
  });
  it("inadequate at 0", () => {
    expect(getRating(0)).toBe("inadequate");
  });
  it("inadequate at 39", () => {
    expect(getRating(39)).toBe("inadequate");
  });
});

// == Label functions ==========================================================

describe("getReg44VisitCategoryLabel", () => {
  it("scheduled_visit", () => {
    expect(getReg44VisitCategoryLabel("scheduled_visit")).toBe("Scheduled Visit");
  });
  it("unannounced_visit", () => {
    expect(getReg44VisitCategoryLabel("unannounced_visit")).toBe("Unannounced Visit");
  });
  it("follow_up_visit", () => {
    expect(getReg44VisitCategoryLabel("follow_up_visit")).toBe("Follow-Up Visit");
  });
  it("child_interview", () => {
    expect(getReg44VisitCategoryLabel("child_interview")).toBe("Child Interview");
  });
  it("staff_interview", () => {
    expect(getReg44VisitCategoryLabel("staff_interview")).toBe("Staff Interview");
  });
  it("records_review", () => {
    expect(getReg44VisitCategoryLabel("records_review")).toBe("Records Review");
  });
  it("premises_inspection", () => {
    expect(getReg44VisitCategoryLabel("premises_inspection")).toBe("Premises Inspection");
  });
  it("action_review", () => {
    expect(getReg44VisitCategoryLabel("action_review")).toBe("Action Review");
  });
});

describe("getReg44VisitOutcomeLabel", () => {
  it("satisfactory", () => {
    expect(getReg44VisitOutcomeLabel("satisfactory")).toBe("Satisfactory");
  });
  it("minor_concern", () => {
    expect(getReg44VisitOutcomeLabel("minor_concern")).toBe("Minor Concern");
  });
  it("significant_concern", () => {
    expect(getReg44VisitOutcomeLabel("significant_concern")).toBe("Significant Concern");
  });
  it("action_required", () => {
    expect(getReg44VisitOutcomeLabel("action_required")).toBe("Action Required");
  });
  it("not_applicable", () => {
    expect(getReg44VisitOutcomeLabel("not_applicable")).toBe("Not Applicable");
  });
});

describe("getRatingLabel", () => {
  it("outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });
  it("requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// == evaluateReg44VisitQuality ================================================

describe("evaluateReg44VisitQuality", () => {
  it("zeros for empty", () => {
    const r = evaluateReg44VisitQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalRecords).toBe(0);
    expect(r.childrenInterviewedRate).toBeNull();
    expect(r.staffInterviewedRate).toBeNull();
    expect(r.recordsReviewedRate).toBeNull();
    expect(r.premisesInspectedRate).toBeNull();
  });

  it("max 25 with perfect records", () => {
    const r = evaluateReg44VisitQuality(Array.from({ length: 10 }, () => makeRecord()));
    expect(r.overallScore).toBe(25);
    expect(r.childrenInterviewedRate).toBe(100);
    expect(r.staffInterviewedRate).toBe(100);
    expect(r.recordsReviewedRate).toBe(100);
    expect(r.premisesInspectedRate).toBe(100);
  });

  it("childrenInterviewed rate", () => {
    const s = [makeRecord({ childrenInterviewed: true }), makeRecord({ childrenInterviewed: false })];
    expect(evaluateReg44VisitQuality(s).childrenInterviewedRate).toBe(50);
  });

  it("staffInterviewed rate", () => {
    const s = [makeRecord({ staffInterviewed: true }), makeRecord({ staffInterviewed: false }), makeRecord({ staffInterviewed: false })];
    expect(evaluateReg44VisitQuality(s).staffInterviewedRate).toBe(33);
  });

  it("recordsReviewed rate", () => {
    const s = [makeRecord({ recordsReviewed: true }), makeRecord({ recordsReviewed: false })];
    expect(evaluateReg44VisitQuality(s).recordsReviewedRate).toBe(50);
  });

  it("premisesInspected rate", () => {
    const s = [makeRecord({ premisesInspected: true }), makeRecord({ premisesInspected: true }), makeRecord({ premisesInspected: false })];
    expect(evaluateReg44VisitQuality(s).premisesInspectedRate).toBe(67);
  });

  it("caps at 25", () => {
    expect(evaluateReg44VisitQuality(Array.from({ length: 20 }, () => makeRecord())).overallScore).toBeLessThanOrEqual(25);
  });

  it("all false gives 0 score", () => {
    const s = [makeRecord({ childrenInterviewed: false, staffInterviewed: false, recordsReviewed: false, premisesInspected: false })];
    expect(evaluateReg44VisitQuality(s).overallScore).toBe(0);
  });

  it("mixed data produces partial score", () => {
    const s = [
      makeRecord({ childrenInterviewed: true, staffInterviewed: false, recordsReviewed: true, premisesInspected: false }),
      makeRecord({ childrenInterviewed: false, staffInterviewed: true, recordsReviewed: false, premisesInspected: true }),
    ];
    const r = evaluateReg44VisitQuality(s);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThan(25);
    expect(r.childrenInterviewedRate).toBe(50);
    expect(r.staffInterviewedRate).toBe(50);
  });
});

// == evaluateReg44VisitCompliance =============================================

describe("evaluateReg44VisitCompliance", () => {
  it("zeros for empty", () => {
    const r = evaluateReg44VisitCompliance([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalRecords).toBe(0);
    expect(r.uniqueCategories).toBe(0);
  });

  it("max 25 with full diversity", () => {
    const cats: Reg44VisitCategory[] = ["scheduled_visit", "unannounced_visit", "follow_up_visit", "child_interview", "staff_interview", "records_review", "premises_inspection", "action_review"];
    const r = evaluateReg44VisitCompliance(cats.map((c) => makeRecord({ category: c })));
    expect(r.overallScore).toBe(25);
    expect(r.categoryDiversityRatio).toBe(1);
    expect(r.uniqueCategories).toBe(8);
  });

  it("documentation rate", () => {
    const s = [makeRecord({ documentationComplete: true }), makeRecord({ documentationComplete: false })];
    expect(evaluateReg44VisitCompliance(s).documentationRate).toBe(50);
  });

  it("timely recording rate", () => {
    const s = [makeRecord({ timelyRecording: true }), makeRecord({ timelyRecording: false }), makeRecord({ timelyRecording: false })];
    expect(evaluateReg44VisitCompliance(s).timelyRecordingRate).toBe(33);
  });

  it("diversity 2/8", () => {
    const s = [makeRecord({ category: "scheduled_visit" }), makeRecord({ category: "unannounced_visit" }), makeRecord({ category: "scheduled_visit" })];
    expect(evaluateReg44VisitCompliance(s).categoryDiversityRatio).toBe(0.25);
    expect(evaluateReg44VisitCompliance(s).uniqueCategories).toBe(2);
  });

  it("childrenInterviewed rate in compliance", () => {
    const s = [makeRecord({ childrenInterviewed: true }), makeRecord({ childrenInterviewed: false })];
    expect(evaluateReg44VisitCompliance(s).childrenInterviewedRate).toBe(50);
  });

  it("all false gives low score", () => {
    const s = [makeRecord({ documentationComplete: false, timelyRecording: false, childrenInterviewed: false })];
    const r = evaluateReg44VisitCompliance(s);
    // Only category diversity contributes (1/8 = 0.125 * 5 = 0.625 -> rounds to 0.6)
    expect(r.overallScore).toBeLessThan(5);
  });
});

// == evaluateReg44VisitPolicy =================================================

describe("evaluateReg44VisitPolicy", () => {
  it("null gives 0 and all false", () => {
    const r = evaluateReg44VisitPolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.reg44VisitPolicy).toBe(false);
    expect(r.visitFrequencyGuidance).toBe(false);
    expect(r.childInterviewProcedure).toBe(false);
    expect(r.reportWritingStandard).toBe(false);
    expect(r.actionTrackingProcedure).toBe(false);
    expect(r.escalationProtocol).toBe(false);
    expect(r.independentVisitorPolicy).toBe(false);
  });

  it("all true gives 25", () => {
    expect(evaluateReg44VisitPolicy(makePolicy()).overallScore).toBe(25);
  });

  it("first 4 at 4pts each = 16", () => {
    expect(evaluateReg44VisitPolicy(makePolicy({
      actionTrackingProcedure: false,
      escalationProtocol: false,
      independentVisitorPolicy: false,
    })).overallScore).toBe(16);
  });

  it("last 3 at 3pts each = 9", () => {
    expect(evaluateReg44VisitPolicy(makePolicy({
      reg44VisitPolicy: false,
      visitFrequencyGuidance: false,
      childInterviewProcedure: false,
      reportWritingStandard: false,
    })).overallScore).toBe(9);
  });

  it("all false gives 0", () => {
    expect(evaluateReg44VisitPolicy(makePolicy({
      reg44VisitPolicy: false,
      visitFrequencyGuidance: false,
      childInterviewProcedure: false,
      reportWritingStandard: false,
      actionTrackingProcedure: false,
      escalationProtocol: false,
      independentVisitorPolicy: false,
    })).overallScore).toBe(0);
  });

  it("mirrors booleans", () => {
    const r = evaluateReg44VisitPolicy(makePolicy({ reg44VisitPolicy: false }));
    expect(r.reg44VisitPolicy).toBe(false);
    expect(r.visitFrequencyGuidance).toBe(true);
  });

  it("single 4pt = 4", () => {
    expect(evaluateReg44VisitPolicy(makePolicy({
      reg44VisitPolicy: true,
      visitFrequencyGuidance: false,
      childInterviewProcedure: false,
      reportWritingStandard: false,
      actionTrackingProcedure: false,
      escalationProtocol: false,
      independentVisitorPolicy: false,
    })).overallScore).toBe(4);
  });

  it("single 3pt = 3", () => {
    expect(evaluateReg44VisitPolicy(makePolicy({
      reg44VisitPolicy: false,
      visitFrequencyGuidance: false,
      childInterviewProcedure: false,
      reportWritingStandard: false,
      actionTrackingProcedure: true,
      escalationProtocol: false,
      independentVisitorPolicy: false,
    })).overallScore).toBe(3);
  });

  it("partial combination", () => {
    // 4 + 4 + 3 = 11
    const r = evaluateReg44VisitPolicy(makePolicy({
      reg44VisitPolicy: true,
      visitFrequencyGuidance: true,
      childInterviewProcedure: false,
      reportWritingStandard: false,
      actionTrackingProcedure: true,
      escalationProtocol: false,
      independentVisitorPolicy: false,
    }));
    expect(r.overallScore).toBe(11);
  });
});

// == evaluateStaffReg44VisitReadiness =========================================

describe("evaluateStaffReg44VisitReadiness", () => {
  it("zeros for empty", () => {
    const r = evaluateStaffReg44VisitReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
  });

  it("25 fully trained", () => {
    expect(evaluateStaffReg44VisitReadiness([makeTraining()]).overallScore).toBe(25);
  });

  it("reg44Requirements only = 6", () => {
    const t = makeTraining({
      reg44Requirements: true,
      childInterviewSkills: false,
      reportWriting: false,
      actionTracking: false,
      regulatoryKnowledge: false,
      escalationProcedure: false,
    });
    expect(evaluateStaffReg44VisitReadiness([t]).overallScore).toBe(6);
  });

  it("escalationProcedure only = 2", () => {
    const t = makeTraining({
      reg44Requirements: false,
      childInterviewSkills: false,
      reportWriting: false,
      actionTracking: false,
      regulatoryKnowledge: false,
      escalationProcedure: true,
    });
    expect(evaluateStaffReg44VisitReadiness([t]).overallScore).toBe(2);
  });

  it("mixed rates", () => {
    const t1 = makeTraining({
      reg44Requirements: true,
      childInterviewSkills: false,
      reportWriting: false,
      actionTracking: false,
      regulatoryKnowledge: false,
      escalationProcedure: false,
    });
    const t2 = makeTraining({
      reg44Requirements: false,
      childInterviewSkills: true,
      reportWriting: false,
      actionTracking: false,
      regulatoryKnowledge: false,
      escalationProcedure: false,
    });
    const r = evaluateStaffReg44VisitReadiness([t1, t2]);
    expect(r.reg44RequirementsRate).toBe(50);
    expect(r.childInterviewSkillsRate).toBe(50);
  });

  it("totalStaff count", () => {
    expect(evaluateStaffReg44VisitReadiness([makeTraining(), makeTraining()]).totalStaff).toBe(2);
  });

  it("caps at 25", () => {
    expect(evaluateStaffReg44VisitReadiness(Array.from({ length: 10 }, () => makeTraining())).overallScore).toBeLessThanOrEqual(25);
  });

  it("childInterviewSkills only = 5", () => {
    const t = makeTraining({
      reg44Requirements: false,
      childInterviewSkills: true,
      reportWriting: false,
      actionTracking: false,
      regulatoryKnowledge: false,
      escalationProcedure: false,
    });
    expect(evaluateStaffReg44VisitReadiness([t]).overallScore).toBe(5);
  });

  it("reportWriting only = 5", () => {
    const t = makeTraining({
      reg44Requirements: false,
      childInterviewSkills: false,
      reportWriting: true,
      actionTracking: false,
      regulatoryKnowledge: false,
      escalationProcedure: false,
    });
    expect(evaluateStaffReg44VisitReadiness([t]).overallScore).toBe(5);
  });

  it("actionTracking only = 4", () => {
    const t = makeTraining({
      reg44Requirements: false,
      childInterviewSkills: false,
      reportWriting: false,
      actionTracking: true,
      regulatoryKnowledge: false,
      escalationProcedure: false,
    });
    expect(evaluateStaffReg44VisitReadiness([t]).overallScore).toBe(4);
  });

  it("regulatoryKnowledge only = 3", () => {
    const t = makeTraining({
      reg44Requirements: false,
      childInterviewSkills: false,
      reportWriting: false,
      actionTracking: false,
      regulatoryKnowledge: true,
      escalationProcedure: false,
    });
    expect(evaluateStaffReg44VisitReadiness([t]).overallScore).toBe(3);
  });
});

// == buildChildReg44VisitProfiles =============================================

describe("buildChildReg44VisitProfiles", () => {
  it("empty gives []", () => {
    expect(buildChildReg44VisitProfiles([])).toEqual([]);
  });

  it("groups by childId", () => {
    const s = [
      makeRecord({ childId: "c1", childName: "A" }),
      makeRecord({ childId: "c1", childName: "A" }),
      makeRecord({ childId: "c2", childName: "B" }),
    ];
    const p = buildChildReg44VisitProfiles(s);
    expect(p).toHaveLength(2);
    expect(p[0].totalRecords).toBe(2);
  });

  it("caps at 10", () => {
    const cats: Reg44VisitCategory[] = ["scheduled_visit", "unannounced_visit", "follow_up_visit", "child_interview", "staff_interview"];
    const s = Array.from({ length: 12 }, (_, i) => makeRecord({
      childId: "c1",
      childName: "A",
      category: cats[i % cats.length],
    }));
    expect(buildChildReg44VisitProfiles(s)[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("freq scoring: 3 records -> 0 freq points", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({
      childId: "cx",
      childName: "X",
      childrenInterviewed: false,
      staffInterviewed: false,
      category: "scheduled_visit",
    }));
    expect(buildChildReg44VisitProfiles(mk(3))[0].overallScore).toBe(0);
  });

  it("freq scoring: 5 records -> 1 freq point", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({
      childId: "cx",
      childName: "X",
      childrenInterviewed: false,
      staffInterviewed: false,
      category: "scheduled_visit",
    }));
    expect(buildChildReg44VisitProfiles(mk(5))[0].overallScore).toBe(1);
  });

  it("freq scoring: 10 records -> 2 freq points", () => {
    const mk = (n: number) => Array.from({ length: n }, () => makeRecord({
      childId: "cx",
      childName: "X",
      childrenInterviewed: false,
      staffInterviewed: false,
      category: "scheduled_visit",
    }));
    expect(buildChildReg44VisitProfiles(mk(10))[0].overallScore).toBe(2);
  });

  it("diversity: 4 categories -> 2 diversity points", () => {
    const cats: Reg44VisitCategory[] = ["scheduled_visit", "unannounced_visit", "follow_up_visit", "child_interview"];
    const s = cats.map((c) => makeRecord({
      childId: "c1",
      childName: "A",
      childrenInterviewed: false,
      staffInterviewed: false,
      category: c,
    }));
    expect(buildChildReg44VisitProfiles(s)[0].overallScore).toBe(2);
  });

  it("diversity: 2 categories -> 1 diversity point", () => {
    const cats: Reg44VisitCategory[] = ["scheduled_visit", "unannounced_visit"];
    const s = cats.map((c) => makeRecord({
      childId: "c1",
      childName: "A",
      childrenInterviewed: false,
      staffInterviewed: false,
      category: c,
    }));
    expect(buildChildReg44VisitProfiles(s)[0].overallScore).toBe(1);
  });

  it("diversity: 1 category -> 0 diversity points", () => {
    const s = [makeRecord({
      childId: "c1",
      childName: "A",
      childrenInterviewed: false,
      staffInterviewed: false,
      category: "scheduled_visit",
    })];
    expect(buildChildReg44VisitProfiles(s)[0].overallScore).toBe(0);
  });

  it("perfect child gets 10", () => {
    const cats: Reg44VisitCategory[] = ["scheduled_visit", "unannounced_visit", "follow_up_visit", "child_interview", "staff_interview"];
    const s = Array.from({ length: 10 }, (_, i) => makeRecord({
      childId: "c1",
      childName: "A",
      category: cats[i % cats.length],
    }));
    expect(buildChildReg44VisitProfiles(s)[0].overallScore).toBe(10);
  });

  it("childrenInterviewedRate scoring thresholds", () => {
    // 80% -> 3 points
    const mk80 = Array.from({ length: 5 }, (_, i) => makeRecord({
      childId: "cx",
      childName: "X",
      childrenInterviewed: i < 4,
      staffInterviewed: false,
      category: "scheduled_visit",
    }));
    const p80 = buildChildReg44VisitProfiles(mk80)[0];
    expect(p80.childrenInterviewedRate).toBe(80);
    // 5 records (1 freq) + 80% rate (3) + 0 staff + 1 cat (0 diversity) = 4
    expect(p80.overallScore).toBe(4);

    // 60% -> 2 points
    const mk60 = Array.from({ length: 5 }, (_, i) => makeRecord({
      childId: "cy",
      childName: "Y",
      childrenInterviewed: i < 3,
      staffInterviewed: false,
      category: "scheduled_visit",
    }));
    const p60 = buildChildReg44VisitProfiles(mk60)[0];
    expect(p60.childrenInterviewedRate).toBe(60);
    // 5 records (1 freq) + 60% rate (2) + 0 staff + 1 cat (0 diversity) = 3
    expect(p60.overallScore).toBe(3);
  });

  it("staffInterviewedRate scoring thresholds", () => {
    // 40% -> 1 point
    const mk40 = Array.from({ length: 5 }, (_, i) => makeRecord({
      childId: "cx",
      childName: "X",
      childrenInterviewed: false,
      staffInterviewed: i < 2,
      category: "scheduled_visit",
    }));
    const p40 = buildChildReg44VisitProfiles(mk40)[0];
    expect(p40.staffInterviewedRate).toBe(40);
    // 5 records (1 freq) + 0 children + 40% staff (1) + 1 cat (0 diversity) = 2
    expect(p40.overallScore).toBe(2);
  });

  it("categoriesCovered is populated correctly", () => {
    const s = [
      makeRecord({ childId: "c1", childName: "A", category: "scheduled_visit" }),
      makeRecord({ childId: "c1", childName: "A", category: "premises_inspection" }),
      makeRecord({ childId: "c1", childName: "A", category: "scheduled_visit" }),
    ];
    const p = buildChildReg44VisitProfiles(s);
    expect(p[0].categoriesCovered).toContain("scheduled_visit");
    expect(p[0].categoriesCovered).toContain("premises_inspection");
    expect(p[0].categoriesCovered).toHaveLength(2);
  });
});

// == generateReg44VisitIntelligence ===========================================

describe("generateReg44VisitIntelligence", () => {
  it("complete result structure", () => {
    const cats: Reg44VisitCategory[] = ["scheduled_visit", "unannounced_visit", "follow_up_visit", "child_interview", "staff_interview", "records_review", "premises_inspection", "action_review"];
    const recs = cats.map((c, i) => makeRecord({
      childId: i < 4 ? "c1" : "c2",
      childName: i < 4 ? "A" : "B",
      category: c,
    }));
    const r = generateReg44VisitIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: recs,
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(r.homeId).toBe("home-oak");
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.regulatoryLinks).toHaveLength(7);
    expect(r.visitQuality).toBeDefined();
    expect(r.visitCompliance).toBeDefined();
    expect(r.visitPolicy).toBeDefined();
    expect(r.staffReadiness).toBeDefined();
    expect(r.childProfiles).toBeDefined();
  });

  it("100 perfect", () => {
    const cats: Reg44VisitCategory[] = ["scheduled_visit", "unannounced_visit", "follow_up_visit", "child_interview", "staff_interview", "records_review", "premises_inspection", "action_review"];
    const r = generateReg44VisitIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-06-01",
      records: cats.map((c) => makeRecord({ category: c })),
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });

  it("0 empty", () => {
    const r = generateReg44VisitIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-06-01",
      records: [],
      policy: null,
      staff: [],
    });
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });

  it("URGENT actions when policy null and staff empty", () => {
    const r = generateReg44VisitIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-06-01",
      records: [],
      policy: null,
      staff: [],
    });
    expect(r.actions.filter((a) => a.startsWith("URGENT")).length).toBe(2);
  });

  it("strengths populated when rates >=80%", () => {
    const cats: Reg44VisitCategory[] = ["scheduled_visit", "unannounced_visit", "follow_up_visit", "child_interview", "staff_interview", "records_review", "premises_inspection", "action_review"];
    const r = generateReg44VisitIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-06-01",
      records: cats.map((c) => makeRecord({ category: c })),
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("improvements populated when rates <60%", () => {
    const s = [makeRecord({
      childrenInterviewed: false,
      staffInterviewed: false,
      recordsReviewed: false,
      premisesInspected: false,
      documentationComplete: false,
      timelyRecording: false,
    })];
    const r = generateReg44VisitIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-06-01",
      records: s,
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("child profiles included", () => {
    const s = [
      makeRecord({ childId: "c1", childName: "A" }),
      makeRecord({ childId: "c2", childName: "B" }),
    ];
    const r = generateReg44VisitIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-06-01",
      records: s,
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(r.childProfiles).toHaveLength(2);
  });

  it("regulatory links contain expected references", () => {
    const r = generateReg44VisitIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-06-01",
      records: [],
      policy: null,
      staff: [],
    });
    expect(r.regulatoryLinks.some((l) => l.includes("Reg 44"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Reg 45"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Reg 13"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("NMS 19"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Children Act"))).toBe(true);
    expect(r.regulatoryLinks.some((l) => l.includes("Quality Standards"))).toBe(true);
  });

  it("overallScore capped at 100", () => {
    const r = generateReg44VisitIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-06-01",
      records: Array.from({ length: 20 }, () => makeRecord()),
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("filters records to period", () => {
    const inPeriod = makeRecord({ date: "2026-03-15", childId: "c1", childName: "A" });
    const outBefore = makeRecord({ date: "2025-12-01", childId: "c2", childName: "B" });
    const outAfter = makeRecord({ date: "2026-07-01", childId: "c3", childName: "C" });
    const r = generateReg44VisitIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-06-01",
      records: [inPeriod, outBefore, outAfter],
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(r.visitQuality.totalRecords).toBe(1);
    expect(r.childProfiles).toHaveLength(1);
    expect(r.childProfiles[0].childId).toBe("c1");
  });

  it("score aggregation equals sum of evaluators", () => {
    const cats: Reg44VisitCategory[] = ["scheduled_visit", "unannounced_visit", "follow_up_visit", "child_interview"];
    const recs = cats.map((c) => makeRecord({ category: c }));
    const r = generateReg44VisitIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-06-01",
      records: recs,
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    const sum = r.visitQuality.overallScore + r.visitCompliance.overallScore + r.visitPolicy.overallScore + r.staffReadiness.overallScore;
    expect(r.overallScore).toBe(Math.min(100, sum));
  });

  it("rating mapping follows getRating thresholds", () => {
    // Empty = 0 = inadequate
    const r0 = generateReg44VisitIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-06-01",
      records: [],
      policy: null,
      staff: [],
    });
    expect(r0.rating).toBe("inadequate");

    // Perfect = 100 = outstanding
    const cats: Reg44VisitCategory[] = ["scheduled_visit", "unannounced_visit", "follow_up_visit", "child_interview", "staff_interview", "records_review", "premises_inspection", "action_review"];
    const r100 = generateReg44VisitIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-06-01",
      records: cats.map((c) => makeRecord({ category: c })),
      policy: makePolicy(),
      staff: [makeTraining()],
    });
    expect(r100.rating).toBe("outstanding");
  });

  it("periodStart and periodEnd are returned", () => {
    const r = generateReg44VisitIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-05-20",
      records: [],
      policy: null,
      staff: [],
    });
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-05-20");
  });

  it("actions for children interview and documentation", () => {
    const s = [makeRecord({
      childrenInterviewed: false,
      staffInterviewed: false,
      documentationComplete: false,
      timelyRecording: false,
      premisesInspected: false,
    })];
    const r = generateReg44VisitIntelligence({
      homeId: "h",
      periodStart: "2026-01-01",
      periodEnd: "2026-06-01",
      records: s,
      policy: makePolicy(),
      staff: [makeTraining({ escalationProcedure: false })],
    });
    expect(r.actions.some((a) => a.toLowerCase().includes("child") && a.toLowerCase().includes("interview"))).toBe(true);
    expect(r.actions.some((a) => a.toLowerCase().includes("documentation"))).toBe(true);
  });
});
