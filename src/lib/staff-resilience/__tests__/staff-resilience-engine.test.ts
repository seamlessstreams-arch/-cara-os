// ══════════════════════════════════════════════════════════════════════════════
// Staff Resilience Intelligence Engine — Tests
//
// Oak House demo data:
//   Staff: Sarah Johnson (RM), Tom Richards (RSW), Lisa Williams (Senior RSW),
//          Darren Laville (RM)
//   Children: Alex (14), Jordan (13), Morgan (15)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateAbsencePatterns,
  evaluateSupportAccess,
  evaluateSupervisionQuality,
  evaluateTeamHealth,
  evaluateSecondaryTrauma,
  generateStaffResilienceIntelligence,
} from "../staff-resilience-engine";
import type {
  StaffAbsenceRecord,
  SupportAccessRecord,
  SupervisionRecord,
  TeamHealthCheck,
  SecondaryTraumaScreen,
  BurnoutIndicator,
} from "../staff-resilience-engine";

// ── Constants ─────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01T00:00:00Z";
const PERIOD_END = "2026-05-18T00:00:00Z";
const REFERENCE_DATE = "2026-05-18T12:00:00Z";

const STAFF_IDS = ["staff-sarah", "staff-tom", "staff-lisa", "staff-darren"];
const STAFF_NAMES: Record<string, string> = {
  "staff-sarah": "Sarah Johnson",
  "staff-tom": "Tom Richards",
  "staff-lisa": "Lisa Williams",
  "staff-darren": "Darren Laville",
};

// ── Demo Fixtures ─────────────────────────────────────────────────────────

function makeDemoAbsences(): StaffAbsenceRecord[] {
  return [
    // Sarah — minimal absence: 1 annual leave
    {
      id: "abs-1", staffId: "staff-sarah", staffName: "Sarah Johnson",
      startDate: "2026-02-10T00:00:00Z", endDate: "2026-02-14T00:00:00Z",
      reason: "annual_leave", returnToWorkCompleted: false,
    },
    // Tom — some stress absence + a sickness
    {
      id: "abs-2", staffId: "staff-tom", staffName: "Tom Richards",
      startDate: "2026-03-01T00:00:00Z", endDate: "2026-03-05T00:00:00Z",
      reason: "stress", returnToWorkCompleted: true, adjustmentsMade: "Reduced caseload for 2 weeks",
    },
    {
      id: "abs-3", staffId: "staff-tom", staffName: "Tom Richards",
      startDate: "2026-04-10T00:00:00Z", endDate: "2026-04-12T00:00:00Z",
      reason: "sickness", returnToWorkCompleted: true,
    },
    // Lisa — good attendance: 1 compassionate
    {
      id: "abs-4", staffId: "staff-lisa", staffName: "Lisa Williams",
      startDate: "2026-03-20T00:00:00Z", endDate: "2026-03-21T00:00:00Z",
      reason: "compassionate", returnToWorkCompleted: true,
    },
    // Darren — training absence
    {
      id: "abs-5", staffId: "staff-darren", staffName: "Darren Laville",
      startDate: "2026-04-01T00:00:00Z", endDate: "2026-04-03T00:00:00Z",
      reason: "training", returnToWorkCompleted: false,
    },
  ];
}

function makeDemoSupports(): SupportAccessRecord[] {
  return [
    // Sarah — clinical supervision + peer support
    { id: "sup-1", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-02-01T10:00:00Z", supportType: "clinical_supervision", accessedVoluntarily: true, followUpPlanned: true, satisfactionRating: 4 },
    { id: "sup-2", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-03-15T10:00:00Z", supportType: "peer_support", accessedVoluntarily: true, followUpPlanned: false, satisfactionRating: 5 },
    // Tom — EAP + debriefing after stress
    { id: "sup-3", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-03-06T10:00:00Z", supportType: "EAP", accessedVoluntarily: false, followUpPlanned: true, satisfactionRating: 3 },
    { id: "sup-4", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-03-15T10:00:00Z", supportType: "debriefing", accessedVoluntarily: true, followUpPlanned: true, satisfactionRating: 4 },
    // Lisa — reflective group + wellness check
    { id: "sup-5", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-02-20T10:00:00Z", supportType: "reflective_group", accessedVoluntarily: true, followUpPlanned: false, satisfactionRating: 4 },
    { id: "sup-6", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-04-05T10:00:00Z", supportType: "wellness_check", accessedVoluntarily: true, followUpPlanned: true, satisfactionRating: 5 },
    // Darren — one_to_one_supervision + team day
    { id: "sup-7", staffId: "staff-darren", staffName: "Darren Laville", date: "2026-01-20T10:00:00Z", supportType: "one_to_one_supervision", accessedVoluntarily: true, followUpPlanned: true, satisfactionRating: 4 },
    { id: "sup-8", staffId: "staff-darren", staffName: "Darren Laville", date: "2026-04-15T10:00:00Z", supportType: "team_day", accessedVoluntarily: true, followUpPlanned: false, satisfactionRating: 5 },
  ];
}

function makeDemoSupervisions(): SupervisionRecord[] {
  return [
    // Sarah — monthly supervisions, good quality
    { id: "sv-1", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-01-15T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 3, actionPointsCompleted: 3, nextDueDate: "2026-02-15T10:00:00Z" },
    { id: "sv-2", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-02-14T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-03-14T10:00:00Z" },
    { id: "sv-3", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-03-14T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: false, actionPoints: 3, actionPointsCompleted: 2, nextDueDate: "2026-04-14T10:00:00Z" },
    { id: "sv-4", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-04-15T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-05-15T10:00:00Z" },
    { id: "sv-5", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-05-14T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: false, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 1, nextDueDate: "2026-06-14T10:00:00Z" },
    // Tom — 4 supervisions (slightly below monthly), mixed quality
    { id: "sv-6", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-01-20T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 3, actionPointsCompleted: 2, nextDueDate: "2026-02-20T10:00:00Z" },
    { id: "sv-7", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-02-18T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: false, actionPoints: 2, actionPointsCompleted: 1, nextDueDate: "2026-03-18T10:00:00Z" },
    { id: "sv-8", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-04-05T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: false, developmentDiscussed: true, actionPoints: 3, actionPointsCompleted: 2, nextDueDate: "2026-05-05T10:00:00Z" },
    { id: "sv-9", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-05-10T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: false, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-06-10T10:00:00Z" },
    // Lisa — 5 supervisions, consistent quality
    { id: "sv-10", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-01-10T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-02-10T10:00:00Z" },
    { id: "sv-11", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-02-12T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 3, actionPointsCompleted: 3, nextDueDate: "2026-03-12T10:00:00Z" },
    { id: "sv-12", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-03-10T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-04-10T10:00:00Z" },
    { id: "sv-13", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-04-08T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: false, actionPoints: 3, actionPointsCompleted: 2, nextDueDate: "2026-05-08T10:00:00Z" },
    { id: "sv-14", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-05-06T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-06-06T10:00:00Z" },
    // Darren — 5 supervisions, good quality
    { id: "sv-15", staffId: "staff-darren", staffName: "Darren Laville", date: "2026-01-12T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 3, actionPointsCompleted: 3, nextDueDate: "2026-02-12T10:00:00Z" },
    { id: "sv-16", staffId: "staff-darren", staffName: "Darren Laville", date: "2026-02-10T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-03-10T10:00:00Z" },
    { id: "sv-17", staffId: "staff-darren", staffName: "Darren Laville", date: "2026-03-12T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-04-12T10:00:00Z" },
    { id: "sv-18", staffId: "staff-darren", staffName: "Darren Laville", date: "2026-04-10T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: false, actionPoints: 3, actionPointsCompleted: 2, nextDueDate: "2026-05-10T10:00:00Z" },
    { id: "sv-19", staffId: "staff-darren", staffName: "Darren Laville", date: "2026-05-08T10:00:00Z", supervisorName: "Area Manager", wellbeingDiscussed: true, workloadDiscussed: false, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-06-08T10:00:00Z" },
  ];
}

function makeDemoTeamHealthChecks(): TeamHealthCheck[] {
  return [
    {
      id: "thc-1", date: "2026-02-15T10:00:00Z", conductedBy: "Sarah Johnson",
      teamMorale: "good", workloadManageable: true, supportAdequate: true,
      communicationEffective: true,
      issuesRaised: ["Night shift cover stretched", "Need more training on de-escalation"],
      actionsAgreed: ["Recruit bank staff", "Book PRICE refresher"],
      actionsCompleted: true,
    },
    {
      id: "thc-2", date: "2026-04-20T10:00:00Z", conductedBy: "Sarah Johnson",
      teamMorale: "high", workloadManageable: true, supportAdequate: true,
      communicationEffective: true,
      issuesRaised: ["Handover notes could be more detailed"],
      actionsAgreed: ["Update handover template", "Peer observation programme"],
      actionsCompleted: false,
    },
  ];
}

function makeDemoSecondaryTraumaScreens(): SecondaryTraumaScreen[] {
  return [
    // Sarah — screened, no indicators
    {
      id: "sts-1", staffId: "staff-sarah", staffName: "Sarah Johnson",
      screeningDate: "2026-03-01T10:00:00Z", screenedBy: "External Supervisor",
      indicatorsPresent: [], supportOffered: false, supportAccepted: false,
      actionPlan: false, reviewDate: "2026-09-01T10:00:00Z",
    },
    // Tom — screened, some indicators (stress-related)
    {
      id: "sts-2", staffId: "staff-tom", staffName: "Tom Richards",
      screeningDate: "2026-03-10T10:00:00Z", screenedBy: "Sarah Johnson",
      indicatorsPresent: ["emotional_exhaustion", "increased_sickness"],
      supportOffered: true, supportAccepted: true,
      actionPlan: true, reviewDate: "2026-06-10T10:00:00Z",
    },
    // Lisa — screened, one indicator
    {
      id: "sts-3", staffId: "staff-lisa", staffName: "Lisa Williams",
      screeningDate: "2026-03-05T10:00:00Z", screenedBy: "Sarah Johnson",
      indicatorsPresent: ["reduced_engagement"],
      supportOffered: true, supportAccepted: false,
      actionPlan: false, reviewDate: "2026-06-05T10:00:00Z",
    },
    // Darren — screened, no indicators
    {
      id: "sts-4", staffId: "staff-darren", staffName: "Darren Laville",
      screeningDate: "2026-03-08T10:00:00Z", screenedBy: "External Supervisor",
      indicatorsPresent: [], supportOffered: false, supportAccepted: false,
      actionPlan: false, reviewDate: "2026-09-08T10:00:00Z",
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1: evaluateAbsencePatterns
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateAbsencePatterns", () => {
  const absences = makeDemoAbsences();

  it("calculates overall absence rate per staff member", () => {
    const result = evaluateAbsencePatterns(absences, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.overallAbsenceRate).toBeGreaterThan(0);
    expect(typeof result.overallAbsenceRate).toBe("number");
  });

  it("identifies stress-related absence rate", () => {
    const result = evaluateAbsencePatterns(absences, STAFF_IDS, PERIOD_START, PERIOD_END);
    // Tom has 1 stress absence out of 5 total
    expect(result.stressRelatedAbsenceRate).toBeGreaterThan(0);
    expect(result.stressRelatedAbsenceRate).toBeLessThanOrEqual(100);
  });

  it("calculates return-to-work completion rate excluding annual leave and training", () => {
    const result = evaluateAbsencePatterns(absences, STAFF_IDS, PERIOD_START, PERIOD_END);
    // RTW applicable: stress (done), sickness (done), compassionate (done) = 3/3 = 100%
    expect(result.returnToWorkCompletionRate).toBe(100);
  });

  it("calculates adjustment rate", () => {
    const result = evaluateAbsencePatterns(absences, STAFF_IDS, PERIOD_START, PERIOD_END);
    // 1 out of 3 applicable absences has adjustments (Tom's stress)
    expect(result.adjustmentRate).toBeGreaterThan(0);
  });

  it("generates per-staff patterns for each staff ID", () => {
    const result = evaluateAbsencePatterns(absences, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.staffPatterns).toHaveLength(4);
  });

  it("shows Sarah with minimal absence (annual leave only)", () => {
    const result = evaluateAbsencePatterns(absences, STAFF_IDS, PERIOD_START, PERIOD_END);
    const sarah = result.staffPatterns.find(p => p.staffId === "staff-sarah")!;
    expect(sarah.stressDays).toBe(0);
    expect(sarah.totalDays).toBeGreaterThan(0);
  });

  it("shows Tom with stress-related absence", () => {
    const result = evaluateAbsencePatterns(absences, STAFF_IDS, PERIOD_START, PERIOD_END);
    const tom = result.staffPatterns.find(p => p.staffId === "staff-tom")!;
    expect(tom.stressDays).toBeGreaterThan(0);
    expect(tom.absenceCount).toBe(2);
    expect(tom.hasAdjustments).toBe(true);
  });

  it("shows Lisa with compassionate absence", () => {
    const result = evaluateAbsencePatterns(absences, STAFF_IDS, PERIOD_START, PERIOD_END);
    const lisa = result.staffPatterns.find(p => p.staffId === "staff-lisa")!;
    expect(lisa.absenceCount).toBe(1);
    expect(lisa.stressDays).toBe(0);
  });

  it("shows Darren with training absence", () => {
    const result = evaluateAbsencePatterns(absences, STAFF_IDS, PERIOD_START, PERIOD_END);
    const darren = result.staffPatterns.find(p => p.staffId === "staff-darren")!;
    expect(darren.absenceCount).toBe(1);
    expect(darren.stressDays).toBe(0);
  });

  it("returns total absence days", () => {
    const result = evaluateAbsencePatterns(absences, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.totalAbsenceDays).toBeGreaterThan(0);
  });

  it("returns total stress absence days", () => {
    const result = evaluateAbsencePatterns(absences, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.totalStressAbsenceDays).toBeGreaterThan(0);
  });

  it("handles empty absences", () => {
    const result = evaluateAbsencePatterns([], STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.overallAbsenceRate).toBe(0);
    expect(result.stressRelatedAbsenceRate).toBe(0);
    expect(result.returnToWorkCompletionRate).toBe(100);
    expect(result.totalAbsenceDays).toBe(0);
  });

  it("handles empty staff IDs", () => {
    const result = evaluateAbsencePatterns(absences, [], PERIOD_START, PERIOD_END);
    expect(result.staffPatterns).toHaveLength(0);
  });

  it("filters absences outside period", () => {
    const outOfPeriod: StaffAbsenceRecord[] = [
      { id: "abs-oop", staffId: "staff-sarah", staffName: "Sarah Johnson", startDate: "2025-06-01T00:00:00Z", endDate: "2025-06-03T00:00:00Z", reason: "sickness", returnToWorkCompleted: true },
    ];
    const result = evaluateAbsencePatterns(outOfPeriod, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.totalAbsenceDays).toBe(0);
  });

  it("counts absence without endDate as 1 day", () => {
    const noEnd: StaffAbsenceRecord[] = [
      { id: "abs-ne", staffId: "staff-sarah", staffName: "Sarah Johnson", startDate: "2026-03-01T00:00:00Z", reason: "sickness", returnToWorkCompleted: true },
    ];
    const result = evaluateAbsencePatterns(noEnd, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.totalAbsenceDays).toBe(1);
  });

  it("correctly calculates return-to-work rate when some are incomplete", () => {
    const mixed: StaffAbsenceRecord[] = [
      { id: "m1", staffId: "staff-tom", staffName: "Tom Richards", startDate: "2026-02-01T00:00:00Z", endDate: "2026-02-03T00:00:00Z", reason: "sickness", returnToWorkCompleted: false },
      { id: "m2", staffId: "staff-tom", staffName: "Tom Richards", startDate: "2026-03-01T00:00:00Z", endDate: "2026-03-02T00:00:00Z", reason: "sickness", returnToWorkCompleted: true },
    ];
    const result = evaluateAbsencePatterns(mixed, ["staff-tom"], PERIOD_START, PERIOD_END);
    expect(result.returnToWorkCompletionRate).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2: evaluateSupportAccess
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateSupportAccess", () => {
  const supports = makeDemoSupports();

  it("calculates access rate per staff", () => {
    const result = evaluateSupportAccess(supports);
    // 8 accesses / 4 unique staff = 2.0
    expect(result.accessRatePerStaff).toBe(2);
  });

  it("counts support type variety", () => {
    const result = evaluateSupportAccess(supports);
    // clinical_supervision, peer_support, EAP, debriefing, reflective_group, wellness_check, one_to_one_supervision, team_day
    expect(result.supportTypeVariety).toBe(8);
  });

  it("calculates voluntary access rate", () => {
    const result = evaluateSupportAccess(supports);
    // 7 out of 8 voluntary
    expect(result.voluntaryAccessRate).toBe(88);
  });

  it("calculates satisfaction rate scaled to 0-100", () => {
    const result = evaluateSupportAccess(supports);
    // All rated: (4+5+3+4+4+5+4+5)/8 = 34/8 = 4.25 -> 4.25/5 = 85%
    expect(result.satisfactionRate).toBe(85);
  });

  it("calculates follow-up rate", () => {
    const result = evaluateSupportAccess(supports);
    // 5 out of 8 have followUp planned
    expect(result.followUpRate).toBe(63);
  });

  it("returns total accesses", () => {
    const result = evaluateSupportAccess(supports);
    expect(result.totalAccesses).toBe(8);
  });

  it("returns type breakdown", () => {
    const result = evaluateSupportAccess(supports);
    expect(result.typeBreakdown["clinical_supervision"]).toBe(1);
    expect(result.typeBreakdown["EAP"]).toBe(1);
    expect(result.typeBreakdown["peer_support"]).toBe(1);
  });

  it("handles empty supports", () => {
    const result = evaluateSupportAccess([]);
    expect(result.accessRatePerStaff).toBe(0);
    expect(result.supportTypeVariety).toBe(0);
    expect(result.voluntaryAccessRate).toBe(0);
    expect(result.satisfactionRate).toBe(0);
    expect(result.followUpRate).toBe(0);
    expect(result.totalAccesses).toBe(0);
  });

  it("handles supports without satisfaction ratings", () => {
    const noRating: SupportAccessRecord[] = [
      { id: "nr1", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-02-01T10:00:00Z", supportType: "EAP", accessedVoluntarily: true, followUpPlanned: true },
    ];
    const result = evaluateSupportAccess(noRating);
    expect(result.satisfactionRate).toBe(0);
  });

  it("correctly handles single staff access", () => {
    const single: SupportAccessRecord[] = [
      { id: "s1", staffId: "staff-sarah", staffName: "Sarah Johnson", date: "2026-02-01T10:00:00Z", supportType: "EAP", accessedVoluntarily: true, followUpPlanned: true, satisfactionRating: 5 },
    ];
    const result = evaluateSupportAccess(single);
    expect(result.accessRatePerStaff).toBe(1);
    expect(result.supportTypeVariety).toBe(1);
    expect(result.satisfactionRate).toBe(100);
  });

  it("calculates correctly when all accesses are involuntary", () => {
    const involuntary: SupportAccessRecord[] = [
      { id: "iv1", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-02-01T10:00:00Z", supportType: "EAP", accessedVoluntarily: false, followUpPlanned: false, satisfactionRating: 2 },
      { id: "iv2", staffId: "staff-lisa", staffName: "Lisa Williams", date: "2026-02-02T10:00:00Z", supportType: "debriefing", accessedVoluntarily: false, followUpPlanned: false, satisfactionRating: 3 },
    ];
    const result = evaluateSupportAccess(involuntary);
    expect(result.voluntaryAccessRate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3: evaluateSupervisionQuality
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateSupervisionQuality", () => {
  const supervisions = makeDemoSupervisions();

  it("calculates frequency rate (monthly target)", () => {
    const result = evaluateSupervisionQuality(supervisions, STAFF_IDS, PERIOD_START, PERIOD_END);
    // Period is ~5 months. Sarah: 5, Tom: 4, Lisa: 5, Darren: 5 — Tom below target
    expect(result.frequencyRate).toBeGreaterThan(0);
    expect(result.frequencyRate).toBeLessThanOrEqual(100);
  });

  it("calculates wellbeing discussed rate", () => {
    const result = evaluateSupervisionQuality(supervisions, STAFF_IDS, PERIOD_START, PERIOD_END);
    // 18 out of 19 supervisions discussed wellbeing
    expect(result.wellbeingDiscussedRate).toBeGreaterThan(80);
  });

  it("calculates workload discussed rate", () => {
    const result = evaluateSupervisionQuality(supervisions, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.workloadDiscussedRate).toBeGreaterThan(0);
  });

  it("calculates action completion rate", () => {
    const result = evaluateSupervisionQuality(supervisions, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.actionCompletionRate).toBeGreaterThan(0);
    expect(result.actionCompletionRate).toBeLessThanOrEqual(100);
  });

  it("calculates average action points", () => {
    const result = evaluateSupervisionQuality(supervisions, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.averageActionPoints).toBeGreaterThan(0);
  });

  it("identifies overdue supervisions", () => {
    const result = evaluateSupervisionQuality(supervisions, STAFF_IDS, PERIOD_START, PERIOD_END);
    // All staff have recent supervisions, none should be overdue
    expect(result.overdueCount).toBe(0);
  });

  it("returns staff supervision details for each staff member", () => {
    const result = evaluateSupervisionQuality(supervisions, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.staffSupervisionDetails).toHaveLength(4);
  });

  it("shows Sarah with 5 supervisions", () => {
    const result = evaluateSupervisionQuality(supervisions, STAFF_IDS, PERIOD_START, PERIOD_END);
    const sarah = result.staffSupervisionDetails.find(d => d.staffId === "staff-sarah")!;
    expect(sarah.supervisionCount).toBe(5);
    expect(sarah.isOverdue).toBe(false);
  });

  it("shows Tom with 4 supervisions", () => {
    const result = evaluateSupervisionQuality(supervisions, STAFF_IDS, PERIOD_START, PERIOD_END);
    const tom = result.staffSupervisionDetails.find(d => d.staffId === "staff-tom")!;
    expect(tom.supervisionCount).toBe(4);
  });

  it("handles empty supervisions", () => {
    const result = evaluateSupervisionQuality([], STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.frequencyRate).toBe(0);
    expect(result.wellbeingDiscussedRate).toBe(0);
    expect(result.actionCompletionRate).toBe(100);
    expect(result.overdueCount).toBe(4);
  });

  it("handles empty staff IDs", () => {
    const result = evaluateSupervisionQuality(supervisions, [], PERIOD_START, PERIOD_END);
    expect(result.frequencyRate).toBe(0);
    expect(result.staffSupervisionDetails).toHaveLength(0);
  });

  it("marks staff as overdue when last supervision is >35 days before period end", () => {
    const old: SupervisionRecord[] = [
      { id: "old-1", staffId: "staff-tom", staffName: "Tom Richards", date: "2026-01-15T10:00:00Z", supervisorName: "Sarah Johnson", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 1, nextDueDate: "2026-02-15T10:00:00Z" },
    ];
    const result = evaluateSupervisionQuality(old, ["staff-tom"], PERIOD_START, PERIOD_END);
    const tom = result.staffSupervisionDetails.find(d => d.staffId === "staff-tom")!;
    expect(tom.isOverdue).toBe(true);
    expect(result.overdueCount).toBe(1);
  });

  it("calculates wellbeing discussed rate per staff", () => {
    const result = evaluateSupervisionQuality(supervisions, STAFF_IDS, PERIOD_START, PERIOD_END);
    const tom = result.staffSupervisionDetails.find(d => d.staffId === "staff-tom")!;
    // Tom: 3 out of 4 discussed wellbeing = 75%
    expect(tom.wellbeingDiscussedRate).toBe(75);
  });

  it("calculates action completion rate per staff", () => {
    const result = evaluateSupervisionQuality(supervisions, STAFF_IDS, PERIOD_START, PERIOD_END);
    const sarah = result.staffSupervisionDetails.find(d => d.staffId === "staff-sarah")!;
    // Sarah: 10 completed out of 12 total = 83%
    expect(sarah.actionCompletionRate).toBe(83);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4: evaluateTeamHealth
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateTeamHealth", () => {
  const checks = makeDemoTeamHealthChecks();

  it("returns latest morale", () => {
    const result = evaluateTeamHealth(checks);
    expect(result.latestMorale).toBe("high");
  });

  it("detects improving morale trend", () => {
    const result = evaluateTeamHealth(checks);
    // good -> high = improving
    expect(result.moraleTrend).toBe("improving");
  });

  it("calculates workload manageable rate", () => {
    const result = evaluateTeamHealth(checks);
    // Both checks had manageable workload
    expect(result.workloadManageableRate).toBe(100);
  });

  it("calculates support adequacy rate", () => {
    const result = evaluateTeamHealth(checks);
    expect(result.supportAdequacyRate).toBe(100);
  });

  it("calculates communication effective rate", () => {
    const result = evaluateTeamHealth(checks);
    expect(result.communicationEffectiveRate).toBe(100);
  });

  it("calculates action completion rate", () => {
    const result = evaluateTeamHealth(checks);
    // 1 of 2 completed = 50%
    expect(result.actionCompletionRate).toBe(50);
  });

  it("counts total issues raised", () => {
    const result = evaluateTeamHealth(checks);
    expect(result.totalIssuesRaised).toBe(3);
  });

  it("counts total actions agreed", () => {
    const result = evaluateTeamHealth(checks);
    expect(result.totalActionsAgreed).toBe(4);
  });

  it("handles empty checks", () => {
    const result = evaluateTeamHealth([]);
    expect(result.latestMorale).toBe("no_data");
    expect(result.moraleTrend).toBe("insufficient_data");
    expect(result.workloadManageableRate).toBe(0);
  });

  it("handles single check — insufficient data for trend", () => {
    const single: TeamHealthCheck[] = [checks[0]];
    const result = evaluateTeamHealth(single);
    expect(result.latestMorale).toBe("good");
    expect(result.moraleTrend).toBe("insufficient_data");
  });

  it("detects declining morale trend", () => {
    const declining: TeamHealthCheck[] = [
      { ...checks[0], date: "2026-01-15T10:00:00Z", teamMorale: "high" },
      { ...checks[1], date: "2026-03-15T10:00:00Z", teamMorale: "low" },
    ];
    const result = evaluateTeamHealth(declining);
    expect(result.moraleTrend).toBe("declining");
  });

  it("detects stable morale trend", () => {
    const stable: TeamHealthCheck[] = [
      { ...checks[0], date: "2026-01-15T10:00:00Z", teamMorale: "good" },
      { ...checks[1], date: "2026-03-15T10:00:00Z", teamMorale: "good" },
    ];
    const result = evaluateTeamHealth(stable);
    expect(result.moraleTrend).toBe("stable");
  });

  it("handles checks with no issues or actions", () => {
    const clean: TeamHealthCheck[] = [
      { ...checks[0], issuesRaised: [], actionsAgreed: [], actionsCompleted: true },
    ];
    const result = evaluateTeamHealth(clean);
    expect(result.totalIssuesRaised).toBe(0);
    expect(result.totalActionsAgreed).toBe(0);
    expect(result.actionCompletionRate).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5: evaluateSecondaryTrauma
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateSecondaryTrauma", () => {
  const screens = makeDemoSecondaryTraumaScreens();

  it("calculates screening coverage", () => {
    const result = evaluateSecondaryTrauma(screens, STAFF_IDS);
    // All 4 staff screened
    expect(result.screeningCoverage).toBe(100);
  });

  it("calculates indicator prevalence", () => {
    const result = evaluateSecondaryTrauma(screens, STAFF_IDS);
    // Total indicators: 0 + 2 + 1 + 0 = 3 across 4 screens = 0.8
    expect(result.indicatorPrevalence).toBe(0.8);
  });

  it("counts staff with indicators", () => {
    const result = evaluateSecondaryTrauma(screens, STAFF_IDS);
    // Tom and Lisa have indicators
    expect(result.staffWithIndicators).toBe(2);
  });

  it("calculates support offered rate for those with indicators", () => {
    const result = evaluateSecondaryTrauma(screens, STAFF_IDS);
    // 2 with indicators, both offered support = 100%
    expect(result.supportOfferedRate).toBe(100);
  });

  it("calculates support accepted rate", () => {
    const result = evaluateSecondaryTrauma(screens, STAFF_IDS);
    // 2 offered support, 1 accepted (Tom) = 50%
    expect(result.supportAcceptedRate).toBe(50);
  });

  it("calculates action plan rate", () => {
    const result = evaluateSecondaryTrauma(screens, STAFF_IDS);
    // 2 with indicators, 1 action plan (Tom) = 50%
    expect(result.actionPlanRate).toBe(50);
  });

  it("identifies most common indicators", () => {
    const result = evaluateSecondaryTrauma(screens, STAFF_IDS);
    expect(result.mostCommonIndicators.length).toBeGreaterThan(0);
    const indicators = result.mostCommonIndicators.map(i => i.indicator);
    expect(indicators).toContain("emotional_exhaustion");
    expect(indicators).toContain("increased_sickness");
    expect(indicators).toContain("reduced_engagement");
  });

  it("handles empty screens", () => {
    const result = evaluateSecondaryTrauma([], STAFF_IDS);
    expect(result.screeningCoverage).toBe(0);
    expect(result.indicatorPrevalence).toBe(0);
    expect(result.staffWithIndicators).toBe(0);
  });

  it("handles empty staff IDs", () => {
    const result = evaluateSecondaryTrauma(screens, []);
    expect(result.screeningCoverage).toBe(0);
  });

  it("returns 100% support offered when no one has indicators", () => {
    const clean: SecondaryTraumaScreen[] = [
      { ...screens[0], indicatorsPresent: [] },
      { ...screens[3], indicatorsPresent: [] },
    ];
    const result = evaluateSecondaryTrauma(clean, ["staff-sarah", "staff-darren"]);
    expect(result.supportOfferedRate).toBe(100);
    expect(result.staffWithIndicators).toBe(0);
  });

  it("returns 100% action plan rate when no one has indicators", () => {
    const clean: SecondaryTraumaScreen[] = [
      { ...screens[0], indicatorsPresent: [] },
    ];
    const result = evaluateSecondaryTrauma(clean, ["staff-sarah"]);
    expect(result.actionPlanRate).toBe(100);
  });

  it("handles partial screening coverage", () => {
    const partial = [screens[0], screens[1]]; // Only Sarah and Tom screened
    const result = evaluateSecondaryTrauma(partial, STAFF_IDS);
    expect(result.screeningCoverage).toBe(50);
  });

  it("sorts most common indicators by count descending", () => {
    const multiIndicator: SecondaryTraumaScreen[] = [
      { ...screens[1], indicatorsPresent: ["emotional_exhaustion", "cynicism", "reduced_effectiveness"] },
      { ...screens[2], indicatorsPresent: ["emotional_exhaustion", "cynicism"] },
      { ...screens[0], indicatorsPresent: ["emotional_exhaustion"] },
    ];
    const result = evaluateSecondaryTrauma(multiIndicator, STAFF_IDS);
    expect(result.mostCommonIndicators[0].indicator).toBe("emotional_exhaustion");
    expect(result.mostCommonIndicators[0].count).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 6: generateStaffResilienceIntelligence
// ═══════════════════════════════════════════════════════════════════════════

describe("generateStaffResilienceIntelligence", () => {
  const absences = makeDemoAbsences();
  const supports = makeDemoSupports();
  const supervisions = makeDemoSupervisions();
  const teamHealthChecks = makeDemoTeamHealthChecks();
  const screens = makeDemoSecondaryTraumaScreens();

  function generate() {
    return generateStaffResilienceIntelligence(
      absences, supports, supervisions, teamHealthChecks, screens,
      STAFF_IDS, STAFF_NAMES, "home-oak", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
  }

  it("returns homeId", () => {
    const result = generate();
    expect(result.homeId).toBe("home-oak");
  });

  it("returns period dates", () => {
    const result = generate();
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("returns generatedAt", () => {
    const result = generate();
    expect(result.generatedAt).toBe(REFERENCE_DATE);
  });

  it("calculates overall score between 0 and 100", () => {
    const result = generate();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns a valid overall rating", () => {
    const result = generate();
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.overallRating);
  });

  it("returns component scores that sum to overall score", () => {
    const result = generate();
    const { absenceManagement, supportAccess, supervisionQuality, teamHealth, secondaryTrauma } = result.componentScores;
    expect(absenceManagement + supportAccess + supervisionQuality + teamHealth + secondaryTrauma).toBe(result.overallScore);
  });

  it("absence management score is between 0 and 20", () => {
    const result = generate();
    expect(result.componentScores.absenceManagement).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.absenceManagement).toBeLessThanOrEqual(20);
  });

  it("support access score is between 0 and 20", () => {
    const result = generate();
    expect(result.componentScores.supportAccess).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.supportAccess).toBeLessThanOrEqual(20);
  });

  it("supervision quality score is between 0 and 25", () => {
    const result = generate();
    expect(result.componentScores.supervisionQuality).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.supervisionQuality).toBeLessThanOrEqual(25);
  });

  it("team health score is between 0 and 15", () => {
    const result = generate();
    expect(result.componentScores.teamHealth).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.teamHealth).toBeLessThanOrEqual(15);
  });

  it("secondary trauma score is between 0 and 20", () => {
    const result = generate();
    expect(result.componentScores.secondaryTrauma).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.secondaryTrauma).toBeLessThanOrEqual(20);
  });

  it("returns absence patterns sub-result", () => {
    const result = generate();
    expect(result.absencePatterns).toBeDefined();
    expect(result.absencePatterns.staffPatterns).toHaveLength(4);
  });

  it("returns support access sub-result", () => {
    const result = generate();
    expect(result.supportAccess).toBeDefined();
    expect(result.supportAccess.totalAccesses).toBe(8);
  });

  it("returns supervision quality sub-result", () => {
    const result = generate();
    expect(result.supervisionQuality).toBeDefined();
    expect(result.supervisionQuality.staffSupervisionDetails).toHaveLength(4);
  });

  it("returns team health sub-result", () => {
    const result = generate();
    expect(result.teamHealth).toBeDefined();
    expect(result.teamHealth.latestMorale).toBe("high");
  });

  it("returns secondary trauma sub-result", () => {
    const result = generate();
    expect(result.secondaryTrauma).toBeDefined();
    expect(result.secondaryTrauma.screeningCoverage).toBe(100);
  });

  it("generates strengths", () => {
    const result = generate();
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("includes strength about wellbeing in supervision", () => {
    const result = generate();
    const hasWellbeingStrength = result.strengths.some(s => s.toLowerCase().includes("wellbeing"));
    expect(hasWellbeingStrength).toBe(true);
  });

  it("includes strength about positive team morale", () => {
    const result = generate();
    const hasMoraleStrength = result.strengths.some(s => s.toLowerCase().includes("morale"));
    expect(hasMoraleStrength).toBe(true);
  });

  it("includes strength about trauma screening", () => {
    const result = generate();
    const hasScreeningStrength = result.strengths.some(s => s.toLowerCase().includes("trauma screening") || s.toLowerCase().includes("screening coverage"));
    expect(hasScreeningStrength).toBe(true);
  });

  it("generates regulatory links", () => {
    const result = generate();
    expect(result.regulatoryLinks.length).toBeGreaterThanOrEqual(5);
  });

  it("includes CHR 2015 Reg 32 link", () => {
    const result = generate();
    const reg32 = result.regulatoryLinks.find(r => r.regulation.includes("Reg 32"));
    expect(reg32).toBeDefined();
    expect(["met", "partially_met", "not_met"]).toContain(reg32!.status);
  });

  it("includes CHR 2015 Reg 33 link", () => {
    const result = generate();
    const reg33 = result.regulatoryLinks.find(r => r.regulation.includes("Reg 33"));
    expect(reg33).toBeDefined();
  });

  it("includes ACAS Guidance link", () => {
    const result = generate();
    const acas = result.regulatoryLinks.find(r => r.regulation.includes("ACAS"));
    expect(acas).toBeDefined();
  });

  it("includes Health & Safety at Work Act link", () => {
    const result = generate();
    const hsaw = result.regulatoryLinks.find(r => r.regulation.includes("Health & Safety"));
    expect(hsaw).toBeDefined();
  });

  it("includes SCCIF link", () => {
    const result = generate();
    const sccif = result.regulatoryLinks.find(r => r.regulation.includes("SCCIF"));
    expect(sccif).toBeDefined();
  });

  it("generates staff profiles for each staff member", () => {
    const result = generate();
    expect(result.staffProfiles).toHaveLength(4);
  });

  it("staff profiles include correct names from staffNames map", () => {
    const result = generate();
    const sarah = result.staffProfiles.find(p => p.staffId === "staff-sarah")!;
    expect(sarah.staffName).toBe("Sarah Johnson");
    const darren = result.staffProfiles.find(p => p.staffId === "staff-darren")!;
    expect(darren.staffName).toBe("Darren Laville");
  });

  it("staff profiles include absence days", () => {
    const result = generate();
    const tom = result.staffProfiles.find(p => p.staffId === "staff-tom")!;
    expect(tom.absenceDays).toBeGreaterThan(0);
  });

  it("staff profiles include support accesses count", () => {
    const result = generate();
    const sarah = result.staffProfiles.find(p => p.staffId === "staff-sarah")!;
    expect(sarah.supportAccesses).toBe(2);
  });

  it("staff profiles include supervision count", () => {
    const result = generate();
    const lisa = result.staffProfiles.find(p => p.staffId === "staff-lisa")!;
    expect(lisa.supervisionCount).toBe(5);
  });

  it("Tom profile shows trauma indicators", () => {
    const result = generate();
    const tom = result.staffProfiles.find(p => p.staffId === "staff-tom")!;
    expect(tom.hasTraumaIndicators).toBe(true);
    expect(tom.indicatorCount).toBe(2);
  });

  it("Sarah profile shows no trauma indicators", () => {
    const result = generate();
    const sarah = result.staffProfiles.find(p => p.staffId === "staff-sarah")!;
    expect(sarah.hasTraumaIndicators).toBe(false);
    expect(sarah.indicatorCount).toBe(0);
  });

  it("Tom profile has risk flags for stress absence and trauma indicators", () => {
    const result = generate();
    const tom = result.staffProfiles.find(p => p.staffId === "staff-tom")!;
    expect(tom.riskFlags.some(f => f.toLowerCase().includes("stress"))).toBe(true);
    expect(tom.riskFlags.some(f => f.toLowerCase().includes("trauma"))).toBe(true);
  });

  it("generates recommended actions when issues exist", () => {
    const result = generate();
    expect(result.recommendedActions).toBeDefined();
    expect(Array.isArray(result.recommendedActions)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 7: Scoring thresholds and ratings
// ═══════════════════════════════════════════════════════════════════════════

describe("scoring and ratings", () => {
  it("rates outstanding when score >= 80", () => {
    // Create ideal data to push score high
    const idealAbsences: StaffAbsenceRecord[] = [];
    const idealSupports: SupportAccessRecord[] = [
      { id: "is1", staffId: "s1", staffName: "A", date: "2026-02-01T10:00:00Z", supportType: "clinical_supervision", accessedVoluntarily: true, followUpPlanned: true, satisfactionRating: 5 },
      { id: "is2", staffId: "s1", staffName: "A", date: "2026-03-01T10:00:00Z", supportType: "peer_support", accessedVoluntarily: true, followUpPlanned: true, satisfactionRating: 5 },
      { id: "is3", staffId: "s1", staffName: "A", date: "2026-04-01T10:00:00Z", supportType: "EAP", accessedVoluntarily: true, followUpPlanned: true, satisfactionRating: 5 },
      { id: "is4", staffId: "s1", staffName: "A", date: "2026-05-01T10:00:00Z", supportType: "debriefing", accessedVoluntarily: true, followUpPlanned: true, satisfactionRating: 5 },
      { id: "is5", staffId: "s1", staffName: "A", date: "2026-05-05T10:00:00Z", supportType: "reflective_group", accessedVoluntarily: true, followUpPlanned: true, satisfactionRating: 5 },
    ];
    const idealSups: SupervisionRecord[] = [
      { id: "isv1", staffId: "s1", staffName: "A", date: "2026-01-15T10:00:00Z", supervisorName: "B", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 3, actionPointsCompleted: 3, nextDueDate: "2026-02-15T10:00:00Z" },
      { id: "isv2", staffId: "s1", staffName: "A", date: "2026-02-15T10:00:00Z", supervisorName: "B", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 3, actionPointsCompleted: 3, nextDueDate: "2026-03-15T10:00:00Z" },
      { id: "isv3", staffId: "s1", staffName: "A", date: "2026-03-15T10:00:00Z", supervisorName: "B", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 3, actionPointsCompleted: 3, nextDueDate: "2026-04-15T10:00:00Z" },
      { id: "isv4", staffId: "s1", staffName: "A", date: "2026-04-15T10:00:00Z", supervisorName: "B", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 3, actionPointsCompleted: 3, nextDueDate: "2026-05-15T10:00:00Z" },
      { id: "isv5", staffId: "s1", staffName: "A", date: "2026-05-14T10:00:00Z", supervisorName: "B", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 3, actionPointsCompleted: 3, nextDueDate: "2026-06-14T10:00:00Z" },
    ];
    const idealHealth: TeamHealthCheck[] = [
      { id: "ith1", date: "2026-02-15T10:00:00Z", conductedBy: "B", teamMorale: "high", workloadManageable: true, supportAdequate: true, communicationEffective: true, issuesRaised: [], actionsAgreed: [], actionsCompleted: true },
      { id: "ith2", date: "2026-04-15T10:00:00Z", conductedBy: "B", teamMorale: "high", workloadManageable: true, supportAdequate: true, communicationEffective: true, issuesRaised: [], actionsAgreed: [], actionsCompleted: true },
    ];
    const idealScreens: SecondaryTraumaScreen[] = [
      { id: "its1", staffId: "s1", staffName: "A", screeningDate: "2026-03-01T10:00:00Z", screenedBy: "C", indicatorsPresent: [], supportOffered: false, supportAccepted: false, actionPlan: false, reviewDate: "2026-09-01T10:00:00Z" },
    ];

    const result = generateStaffResilienceIntelligence(
      idealAbsences, idealSupports, idealSups, idealHealth, idealScreens,
      ["s1"], { s1: "A" }, "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.overallRating).toBe("outstanding");
  });

  it("rates inadequate when score < 40", () => {
    const result = generateStaffResilienceIntelligence(
      [], [], [], [], [],
      ["s1"], { s1: "A" }, "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.overallRating).toBe("inadequate");
  });

  it("component scores are non-negative", () => {
    const result = generateStaffResilienceIntelligence(
      [], [], [], [], [],
      [], {}, "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.componentScores.absenceManagement).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.supportAccess).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.supervisionQuality).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.teamHealth).toBeGreaterThanOrEqual(0);
    expect(result.componentScores.secondaryTrauma).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 8: Edge cases
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles all empty inputs gracefully", () => {
    const result = generateStaffResilienceIntelligence(
      [], [], [], [], [],
      [], {}, "home-empty", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    // Empty inputs still score points for "no absences" and default 100% rates
    // Absence: 8 (low rate) + 6 (100% RTW) + 6 (100% adj) = 20
    // Supervision: 7 (100% action completion with 0 actions)
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.staffProfiles).toHaveLength(0);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("handles single staff member", () => {
    const singleAbsence: StaffAbsenceRecord[] = [
      { id: "sa1", staffId: "s1", staffName: "Solo", startDate: "2026-02-01T00:00:00Z", endDate: "2026-02-02T00:00:00Z", reason: "sickness", returnToWorkCompleted: true, adjustmentsMade: "Phased return" },
    ];
    const result = generateStaffResilienceIntelligence(
      singleAbsence, [], [], [], [],
      ["s1"], { s1: "Solo" }, "home-solo", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.staffProfiles).toHaveLength(1);
    expect(result.staffProfiles[0].staffName).toBe("Solo");
  });

  it("absence with same start and end date counts as 1 day", () => {
    const sameDay: StaffAbsenceRecord[] = [
      { id: "sd1", staffId: "s1", staffName: "A", startDate: "2026-03-01T00:00:00Z", endDate: "2026-03-01T00:00:00Z", reason: "sickness", returnToWorkCompleted: true },
    ];
    const result = evaluateAbsencePatterns(sameDay, ["s1"], PERIOD_START, PERIOD_END);
    expect(result.totalAbsenceDays).toBe(1);
  });

  it("supervision with zero action points has 100% completion", () => {
    const zeroActions: SupervisionRecord[] = [
      { id: "za1", staffId: "s1", staffName: "A", date: "2026-03-01T10:00:00Z", supervisorName: "B", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 0, actionPointsCompleted: 0, nextDueDate: "2026-04-01T10:00:00Z" },
    ];
    const result = evaluateSupervisionQuality(zeroActions, ["s1"], PERIOD_START, PERIOD_END);
    expect(result.actionCompletionRate).toBe(100);
  });

  it("support access with only one type shows variety of 1", () => {
    const oneType: SupportAccessRecord[] = [
      { id: "ot1", staffId: "s1", staffName: "A", date: "2026-02-01T10:00:00Z", supportType: "EAP", accessedVoluntarily: true, followUpPlanned: true, satisfactionRating: 4 },
      { id: "ot2", staffId: "s2", staffName: "B", date: "2026-02-02T10:00:00Z", supportType: "EAP", accessedVoluntarily: true, followUpPlanned: false, satisfactionRating: 3 },
    ];
    const result = evaluateSupportAccess(oneType);
    expect(result.supportTypeVariety).toBe(1);
  });

  it("team health with all low morale", () => {
    const lowMorale: TeamHealthCheck[] = [
      { id: "lm1", date: "2026-02-15T10:00:00Z", conductedBy: "X", teamMorale: "low", workloadManageable: false, supportAdequate: false, communicationEffective: false, issuesRaised: ["Everything"], actionsAgreed: ["Fix it"], actionsCompleted: false },
      { id: "lm2", date: "2026-04-15T10:00:00Z", conductedBy: "X", teamMorale: "low", workloadManageable: false, supportAdequate: false, communicationEffective: false, issuesRaised: ["Still everything"], actionsAgreed: ["Still fix it"], actionsCompleted: false },
    ];
    const result = evaluateTeamHealth(lowMorale);
    expect(result.latestMorale).toBe("low");
    expect(result.moraleTrend).toBe("stable");
    expect(result.workloadManageableRate).toBe(0);
    expect(result.supportAdequacyRate).toBe(0);
    expect(result.communicationEffectiveRate).toBe(0);
    expect(result.actionCompletionRate).toBe(0);
  });

  it("secondary trauma with all staff having indicators", () => {
    const allIndicators: SecondaryTraumaScreen[] = [
      { id: "ai1", staffId: "s1", staffName: "A", screeningDate: "2026-03-01T10:00:00Z", screenedBy: "C", indicatorsPresent: ["emotional_exhaustion", "cynicism", "reduced_effectiveness"], supportOffered: true, supportAccepted: true, actionPlan: true, reviewDate: "2026-06-01T10:00:00Z" },
      { id: "ai2", staffId: "s2", staffName: "B", screeningDate: "2026-03-01T10:00:00Z", screenedBy: "C", indicatorsPresent: ["withdrawal_from_team", "increased_sickness"], supportOffered: true, supportAccepted: false, actionPlan: true, reviewDate: "2026-06-01T10:00:00Z" },
    ];
    const result = evaluateSecondaryTrauma(allIndicators, ["s1", "s2"]);
    expect(result.staffWithIndicators).toBe(2);
    expect(result.supportOfferedRate).toBe(100);
    expect(result.actionPlanRate).toBe(100);
    expect(result.indicatorPrevalence).toBe(2.5);
  });

  it("absence patterns handle large number of absences", () => {
    const manyAbsences: StaffAbsenceRecord[] = Array.from({ length: 50 }, (_, i) => ({
      id: `ma-${i}`,
      staffId: "s1",
      staffName: "Stressed Staff",
      startDate: `2026-0${Math.min(Math.floor(i / 10) + 1, 5)}-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
      reason: "sickness" as const,
      returnToWorkCompleted: i % 2 === 0,
    }));
    const result = evaluateAbsencePatterns(manyAbsences, ["s1"], PERIOD_START, PERIOD_END);
    expect(result.totalAbsenceDays).toBeGreaterThan(0);
    expect(result.returnToWorkCompletionRate).toBe(50);
  });

  it("generates areas for improvement when supervision frequency is low", () => {
    const lowSups: SupervisionRecord[] = [
      { id: "ls1", staffId: "s1", staffName: "A", date: "2026-01-15T10:00:00Z", supervisorName: "B", wellbeingDiscussed: false, workloadDiscussed: false, developmentDiscussed: false, actionPoints: 3, actionPointsCompleted: 0, nextDueDate: "2026-02-15T10:00:00Z" },
    ];
    const result = generateStaffResilienceIntelligence(
      [], [], lowSups, [], [],
      ["s1", "s2"], { s1: "A", s2: "B" }, "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    const hasSupArea = result.areasForImprovement.some(a => a.toLowerCase().includes("supervision"));
    expect(hasSupArea).toBe(true);
  });

  it("generates recommended action to schedule overdue supervision", () => {
    const result = generateStaffResilienceIntelligence(
      [], [], [], [], [],
      ["s1"], { s1: "A" }, "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    const hasScheduleAction = result.recommendedActions.some(a => a.toLowerCase().includes("overdue supervision") || a.toLowerCase().includes("schedule"));
    expect(hasScheduleAction).toBe(true);
  });

  it("staff profile includes supervision overdue flag correctly", () => {
    const recentSup: SupervisionRecord[] = [
      { id: "rs1", staffId: "s1", staffName: "A", date: "2026-05-10T10:00:00Z", supervisorName: "B", wellbeingDiscussed: true, workloadDiscussed: true, developmentDiscussed: true, actionPoints: 2, actionPointsCompleted: 2, nextDueDate: "2026-06-10T10:00:00Z" },
    ];
    const result = generateStaffResilienceIntelligence(
      [], [], recentSup, [], [],
      ["s1"], { s1: "A" }, "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    const profile = result.staffProfiles.find(p => p.staffId === "s1")!;
    expect(profile.supervisionOverdue).toBe(false);
  });

  it("regulatory link status reflects actual data quality", () => {
    // All empty data should produce poor regulatory compliance
    const result = generateStaffResilienceIntelligence(
      [], [], [], [], [],
      ["s1"], { s1: "A" }, "home-test", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    const notMetCount = result.regulatoryLinks.filter(r => r.status === "not_met").length;
    expect(notMetCount).toBeGreaterThan(0);
  });
});
