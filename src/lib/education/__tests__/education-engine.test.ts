// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Education & PEP Tracking — Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateEducationCompliance,
  calculateHomeEducationMetrics,
  getEducationStatusLabel,
  getKeyStageLabel,
  getAttainmentLabel,
} from "../education-engine";
import type {
  ChildEducationRecord,
  PEPTarget,
  SubjectAttainment,
  ExclusionRecord,
} from "../education-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-05-16T12:00:00Z";

// ── Factories ──────────────────────────────────────────────────────────────

function makeTarget(overrides: Partial<PEPTarget> = {}): PEPTarget {
  return {
    id: "target-001",
    subject: "English",
    target: "Improve reading comprehension by one level",
    progress: "in_progress",
    ppFunded: true,
    ...overrides,
  };
}

function makeAttainment(overrides: Partial<SubjectAttainment> = {}): SubjectAttainment {
  return {
    subject: "English",
    currentLevel: "age_expected",
    targetLevel: "above",
    progress: "on_track",
    lastAssessed: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

function makeRecord(overrides: Partial<ChildEducationRecord> = {}): ChildEducationRecord {
  return {
    childId: "child-jordan",
    childName: "Jordan Williams",
    homeId: "home-oak",
    dateOfBirth: "2010-06-15T00:00:00Z",
    keyStage: "ks4",
    educationStatus: "enrolled_mainstream",
    schoolName: "Oakfield Academy",
    schoolType: "mainstream",
    designatedTeacher: "Mrs Collins",
    designatedTeacherEmail: "collins@oakfield.edu",
    yearGroup: 11,
    pepStatus: "current",
    lastPEPDate: "2026-04-15T00:00:00Z",
    nextPEPDue: "2026-07-10T00:00:00Z",
    pepTargets: [
      makeTarget(),
      makeTarget({ id: "t2", subject: "Maths", target: "Achieve Grade 5 in mock exams", progress: "achieved" }),
      makeTarget({ id: "t3", subject: "Science", target: "Complete coursework on time", progress: "in_progress" }),
    ],
    pupilPremiumAllocation: 2530,
    pupilPremiumSpent: 2200,
    attendancePercentage: 96,
    sessionsAttended: 288,
    sessionsPossible: 300,
    authorisedAbsences: 8,
    unauthorisedAbsences: 4,
    attainmentLevels: [
      makeAttainment({ subject: "English" }),
      makeAttainment({ subject: "Maths", currentLevel: "above", progress: "above_target" }),
      makeAttainment({ subject: "Science", progress: "on_track" }),
    ],
    senStatus: "none",
    ehcpInPlace: false,
    exclusions: [],
    homeworkCompletion: 85,
    extracurricularActivities: ["Football club", "Art workshop"],
    aspirations: "Wants to study sports science at college",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// evaluateEducationCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEducationCompliance", () => {
  it("returns compliant for good education record", () => {
    const record = makeRecord();
    const result = evaluateEducationCompliance(record, FIXED_NOW);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.pepCompliant).toBe(true);
    expect(result.attendanceCompliant).toBe(true);
    expect(result.exclusionConcerns).toBe(false);
    expect(result.ppSpendOnTrack).toBe(true);
  });

  it("flags overdue PEP", () => {
    const record = makeRecord({ pepStatus: "overdue" });
    const result = evaluateEducationCompliance(record, FIXED_NOW);
    expect(result.pepCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("PEP overdue"))).toBe(true);
    expect(result.recommendations.some(r => r.includes("Virtual School"))).toBe(true);
  });

  it("flags no PEP in place", () => {
    const record = makeRecord({ pepStatus: "not_started" });
    const result = evaluateEducationCompliance(record, FIXED_NOW);
    expect(result.pepCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("No PEP in place"))).toBe(true);
  });

  it("flags attendance below target (90-95%)", () => {
    const record = makeRecord({ attendancePercentage: 92 });
    const result = evaluateEducationCompliance(record, FIXED_NOW);
    expect(result.attendanceCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("92%"))).toBe(true);
  });

  it("flags persistent absence (<90%)", () => {
    const record = makeRecord({ attendancePercentage: 85 });
    const result = evaluateEducationCompliance(record, FIXED_NOW);
    expect(result.attendanceCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("Persistent absence"))).toBe(true);
    expect(result.recommendations.some(r => r.includes("attendance strategy"))).toBe(true);
  });

  it("flags recent exclusions", () => {
    const record = makeRecord({
      exclusions: [
        { date: "2026-05-01T00:00:00Z", type: "fixed_term", days: 3, reason: "Violent behaviour", alternativeProvision: true, returnMeetingHeld: true },
      ],
    });
    const result = evaluateEducationCompliance(record, FIXED_NOW);
    expect(result.exclusionConcerns).toBe(true);
    expect(result.issues.some(i => i.includes("exclusion"))).toBe(true);
  });

  it("flags informal exclusions as unlawful", () => {
    const record = makeRecord({
      exclusions: [
        { date: "2026-05-01T00:00:00Z", type: "informal", days: 1, reason: "Sent home early", alternativeProvision: false, returnMeetingHeld: false },
      ],
    });
    const result = evaluateEducationCompliance(record, FIXED_NOW);
    expect(result.issues.some(i => i.includes("unlawful"))).toBe(true);
  });

  it("flags low PP+ utilisation", () => {
    const record = makeRecord({ pupilPremiumAllocation: 2530, pupilPremiumSpent: 500 });
    const result = evaluateEducationCompliance(record, FIXED_NOW);
    expect(result.ppSpendOnTrack).toBe(false);
    expect(result.issues.some(i => i.includes("PP+ utilisation"))).toBe(true);
  });

  it("handles zero PP allocation gracefully", () => {
    const record = makeRecord({ pupilPremiumAllocation: 0, pupilPremiumSpent: 0 });
    const result = evaluateEducationCompliance(record, FIXED_NOW);
    expect(result.ppSpendOnTrack).toBe(true);
  });

  it("calculates target progress percentage", () => {
    const record = makeRecord({
      pepTargets: [
        makeTarget({ progress: "achieved" }),
        makeTarget({ id: "t2", progress: "in_progress" }),
        makeTarget({ id: "t3", progress: "not_started" }),
        makeTarget({ id: "t4", progress: "not_started" }),
      ],
    });
    const result = evaluateEducationCompliance(record, FIXED_NOW);
    expect(result.targetProgress).toBe(50); // 2/4
  });

  it("generates recommendation for below-target attainment", () => {
    const record = makeRecord({
      attainmentLevels: [
        makeAttainment({ subject: "English", progress: "below_target" }),
        makeAttainment({ subject: "Maths", progress: "below_target" }),
        makeAttainment({ subject: "Science", progress: "on_track" }),
      ],
    });
    const result = evaluateEducationCompliance(record, FIXED_NOW);
    expect(result.recommendations.some(r => r.includes("2 subjects below target"))).toBe(true);
  });

  it("flags EHCP needed but not in place", () => {
    const record = makeRecord({ senStatus: "ehcp", ehcpInPlace: false });
    const result = evaluateEducationCompliance(record, FIXED_NOW);
    expect(result.issues.some(i => i.includes("EHCP"))).toBe(true);
  });

  it("does not flag old exclusions (>3 months)", () => {
    const record = makeRecord({
      exclusions: [
        { date: "2025-12-01T00:00:00Z", type: "fixed_term", days: 2, reason: "Old incident", alternativeProvision: true, returnMeetingHeld: true },
      ],
    });
    const result = evaluateEducationCompliance(record, FIXED_NOW);
    expect(result.exclusionConcerns).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// calculateHomeEducationMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeEducationMetrics", () => {
  it("calculates average attendance", () => {
    const records = [
      makeRecord({ childId: "c1", attendancePercentage: 96 }),
      makeRecord({ childId: "c2", attendancePercentage: 88 }),
    ];
    const result = calculateHomeEducationMetrics(records, "home-oak", FIXED_NOW);
    expect(result.averageAttendance).toBe(92);
  });

  it("calculates PEP compliance rate", () => {
    const records = [
      makeRecord({ childId: "c1", pepStatus: "current" }),
      makeRecord({ childId: "c2", pepStatus: "overdue" }),
      makeRecord({ childId: "c3", pepStatus: "current" }),
    ];
    const result = calculateHomeEducationMetrics(records, "home-oak", FIXED_NOW);
    expect(result.pepComplianceRate).toBe(67); // 2/3
  });

  it("counts total exclusions and days", () => {
    const records = [
      makeRecord({
        childId: "c1",
        exclusions: [
          { date: "2026-05-01", type: "fixed_term", days: 3, reason: "r", alternativeProvision: true, returnMeetingHeld: true },
          { date: "2026-04-01", type: "fixed_term", days: 2, reason: "r", alternativeProvision: true, returnMeetingHeld: true },
        ],
      }),
    ];
    const result = calculateHomeEducationMetrics(records, "home-oak", FIXED_NOW);
    expect(result.exclusionCount).toBe(2);
    expect(result.exclusionDays).toBe(5);
  });

  it("calculates PP utilisation rate", () => {
    const records = [
      makeRecord({ childId: "c1", pupilPremiumAllocation: 2000, pupilPremiumSpent: 1500 }),
      makeRecord({ childId: "c2", pupilPremiumAllocation: 2000, pupilPremiumSpent: 1000 }),
    ];
    const result = calculateHomeEducationMetrics(records, "home-oak", FIXED_NOW);
    expect(result.totalPPAllocation).toBe(4000);
    expect(result.totalPPSpent).toBe(2500);
    expect(result.ppUtilisationRate).toBe(63); // 2500/4000
  });

  it("identifies concerns", () => {
    const records = [
      makeRecord({ childId: "c1", childName: "Jordan", attendancePercentage: 85 }),
      makeRecord({ childId: "c2", childName: "Alex", pepStatus: "overdue" }),
    ];
    const result = calculateHomeEducationMetrics(records, "home-oak", FIXED_NOW);
    expect(result.concerns.length).toBeGreaterThanOrEqual(2);
    expect(result.concerns.some(c => c.concern.includes("Persistent absence"))).toBe(true);
    expect(result.concerns.some(c => c.concern.includes("PEP overdue"))).toBe(true);
  });

  it("filters to correct home", () => {
    const records = [
      makeRecord({ childId: "c1", homeId: "home-oak" }),
      makeRecord({ childId: "c2", homeId: "home-elm" }),
    ];
    const result = calculateHomeEducationMetrics(records, "home-oak", FIXED_NOW);
    expect(result.childCount).toBe(1);
  });

  it("returns defaults for no records", () => {
    const result = calculateHomeEducationMetrics([], "home-oak", FIXED_NOW);
    expect(result.childCount).toBe(0);
    expect(result.averageAttendance).toBe(100);
    expect(result.pepComplianceRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

describe("helper functions", () => {
  it("getEducationStatusLabel returns labels", () => {
    expect(getEducationStatusLabel("enrolled_mainstream")).toBe("Enrolled (Mainstream)");
    expect(getEducationStatusLabel("neet")).toBe("NEET (16+)");
    expect(getEducationStatusLabel("excluded_permanent")).toBe("Permanently Excluded");
  });

  it("getKeyStageLabel returns labels", () => {
    expect(getKeyStageLabel("ks4")).toBe("Key Stage 4 (Y10-Y11)");
    expect(getKeyStageLabel("eyfs")).toBe("Early Years Foundation Stage");
  });

  it("getAttainmentLabel returns labels", () => {
    expect(getAttainmentLabel("age_expected")).toBe("Age Expected");
    expect(getAttainmentLabel("significantly_below")).toBe("Significantly Below Expected");
  });
});
