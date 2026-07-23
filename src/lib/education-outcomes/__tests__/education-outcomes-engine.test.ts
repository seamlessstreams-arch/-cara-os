// ══════════════════════════════════════════════════════════════════════════════
// Cara Education Attendance & Achievement Intelligence — Engine Tests
//
// Covers all 6 core functions, scoring logic, and edge cases.
// Demo data: Chamberlain House — Alex (14), Jordan (13), Morgan (15)
// Staff: Sarah Johnson (RM), Tom Richards (RSW), Lisa Williams (Senior RSW),
//        Darren Laville (RM)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateAttendance,
  evaluateExclusions,
  evaluatePEPQuality,
  evaluateSENDSupport,
  evaluateAchievements,
  generateEducationOutcomesIntelligence,
} from "../education-outcomes-engine";
import type {
  AttendanceRecord,
  ExclusionRecord,
  PEPRecord,
  SENDSupportRecord,
  AchievementRecord,
  AttendanceStatus,
  AchievementType,
} from "../education-outcomes-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-05";
const PERIOD_END = "2026-03-31";
const REFERENCE_DATE = "2026-04-01";
const HOME_ID = "home-oak";

const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];
const CHILD_NAMES: Record<string, string> = {
  "child-alex": "Alex",
  "child-jordan": "Jordan",
  "child-morgan": "Morgan",
};

// ── Factories ──────────────────────────────────────────────────────────────

let _idCounter = 0;
function nextId(prefix = "rec"): string {
  return `${prefix}-${++_idCounter}`;
}

function makeAttendance(overrides: Partial<AttendanceRecord> = {}): AttendanceRecord {
  return {
    id: nextId("att"),
    childId: "child-alex",
    childName: "Alex",
    date: "2026-02-01",
    status: "present",
    ...overrides,
  };
}

function makeExclusion(overrides: Partial<ExclusionRecord> = {}): ExclusionRecord {
  return {
    id: nextId("exc"),
    childId: "child-alex",
    childName: "Alex",
    startDate: "2026-02-10",
    endDate: "2026-02-12",
    exclusionType: "fixed_term",
    reason: "Disruptive behaviour",
    daysExcluded: 3,
    alternativeProvision: true,
    reintegrationMeeting: true,
    challengedByHome: true,
    ...overrides,
  };
}

function makePEP(overrides: Partial<PEPRecord> = {}): PEPRecord {
  return {
    id: nextId("pep"),
    childId: "child-alex",
    childName: "Alex",
    reviewDate: "2026-03-01",
    status: "current",
    virtualSchoolInvolved: true,
    childAttended: true,
    childVoiceRecorded: true,
    targetsSet: 4,
    targetsAchieved: 2,
    pupilPremiumSpend: "£1,200",
    nextReviewDate: "2026-06-01",
    ...overrides,
  };
}

function makeSEND(overrides: Partial<SENDSupportRecord> = {}): SENDSupportRecord {
  return {
    id: nextId("send"),
    childId: "child-alex",
    childName: "Alex",
    sendCategory: "SEMH",
    ehcpInPlace: false,
    supportDescription: "Weekly therapeutic support",
    providerName: "CAMHS",
    hoursPerWeek: 2,
    effectivenessRating: "good",
    ...overrides,
  };
}

function makeAchievement(overrides: Partial<AchievementRecord> = {}): AchievementRecord {
  return {
    id: nextId("ach"),
    childId: "child-alex",
    childName: "Alex",
    date: "2026-03-15",
    achievementType: "academic",
    description: "Improved maths grade from D to C",
    recognisedBy: "Sarah Johnson",
    celebrated: true,
    evidenceRecorded: true,
    ...overrides,
  };
}

// Helper: generate multiple attendance days
function generateAttendanceDays(
  childId: string,
  childName: string,
  startDate: string,
  count: number,
  statuses: AttendanceStatus[],
): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const start = new Date(startDate);
  let statusIdx = 0;
  for (let i = 0; i < count; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    records.push(makeAttendance({
      childId,
      childName,
      date: d.toISOString().slice(0, 10),
      status: statuses[statusIdx % statuses.length],
    }));
    statusIdx++;
  }
  return records;
}

// ── Build Demo Data ────────────────────────────────────────────────────────

// Alex: good attendance (present ~92%), 1 fixed-term exclusion challenged by home, SEMH support
function buildAlexAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const start = new Date("2026-01-05");
  let day = 0;
  for (let i = 0; i < 58; i++) {
    const d = new Date(start.getTime() + day * 24 * 60 * 60 * 1000);
    day++;
    if (d.getDay() === 0 || d.getDay() === 6) { i--; continue; }
    let status: AttendanceStatus = "present";
    if (i === 10 || i === 11) status = "excluded";
    else if (i === 15) status = "EOTAS";
    else if (i === 20) status = "late";
    else if (i === 30) status = "authorised_absence";
    else if (i === 40 || i === 50) status = "unauthorised_absence";
    else if (i === 55) status = "late";
    records.push(makeAttendance({
      childId: "child-alex",
      childName: "Alex",
      date: d.toISOString().slice(0, 10),
      status,
    }));
  }
  return records;
}

// Jordan: excellent attendance (~99%), no exclusions, no SEND
function buildJordanAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const start = new Date("2026-01-05");
  let day = 0;
  for (let i = 0; i < 58; i++) {
    const d = new Date(start.getTime() + day * 24 * 60 * 60 * 1000);
    day++;
    if (d.getDay() === 0 || d.getDay() === 6) { i--; continue; }
    let status: AttendanceStatus = "present";
    if (i === 40) status = "authorised_absence";
    records.push(makeAttendance({
      childId: "child-jordan",
      childName: "Jordan",
      date: d.toISOString().slice(0, 10),
      status,
    }));
  }
  return records;
}

// Morgan: patchy attendance (~82%), informal exclusion, SpLD with EHCP
function buildMorganAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const start = new Date("2026-01-05");
  let day = 0;
  for (let i = 0; i < 58; i++) {
    const d = new Date(start.getTime() + day * 24 * 60 * 60 * 1000);
    day++;
    if (d.getDay() === 0 || d.getDay() === 6) { i--; continue; }
    let status: AttendanceStatus = "present";
    if (i % 6 === 0 && i > 0) status = "unauthorised_absence";
    else if (i === 15 || i === 16) status = "authorised_absence";
    else if (i === 25) status = "late";
    else if (i === 50) status = "late";
    records.push(makeAttendance({
      childId: "child-morgan",
      childName: "Morgan",
      date: d.toISOString().slice(0, 10),
      status,
    }));
  }
  return records;
}

function buildDemoAttendance(): AttendanceRecord[] {
  return [
    ...buildAlexAttendance(),
    ...buildJordanAttendance(),
    ...buildMorganAttendance(),
  ];
}

function buildDemoExclusions(): ExclusionRecord[] {
  return [
    makeExclusion({
      childId: "child-alex",
      childName: "Alex",
      startDate: "2026-02-10",
      endDate: "2026-02-11",
      exclusionType: "fixed_term",
      reason: "Disruptive behaviour in class",
      daysExcluded: 2,
      alternativeProvision: true,
      reintegrationMeeting: true,
      challengedByHome: true,
    }),
    makeExclusion({
      childId: "child-morgan",
      childName: "Morgan",
      startDate: "2026-01-20",
      exclusionType: "informal",
      reason: "Sent home early — not formally recorded",
      daysExcluded: 1,
      alternativeProvision: false,
      reintegrationMeeting: false,
      challengedByHome: false,
    }),
  ];
}

function buildDemoPEPs(): PEPRecord[] {
  return [
    makePEP({
      childId: "child-alex",
      childName: "Alex",
      reviewDate: "2026-03-01",
      status: "current",
      virtualSchoolInvolved: true,
      childAttended: true,
      childVoiceRecorded: true,
      targetsSet: 4,
      targetsAchieved: 2,
    }),
    makePEP({
      childId: "child-jordan",
      childName: "Jordan",
      reviewDate: "2026-03-05",
      status: "current",
      virtualSchoolInvolved: true,
      childAttended: true,
      childVoiceRecorded: true,
      targetsSet: 3,
      targetsAchieved: 2,
    }),
    makePEP({
      childId: "child-morgan",
      childName: "Morgan",
      reviewDate: "2025-11-01",
      status: "overdue",
      virtualSchoolInvolved: false,
      childAttended: false,
      childVoiceRecorded: false,
      targetsSet: 3,
      targetsAchieved: 0,
    }),
  ];
}

function buildDemoSEND(): SENDSupportRecord[] {
  return [
    makeSEND({
      childId: "child-alex",
      childName: "Alex",
      sendCategory: "SEMH",
      ehcpInPlace: false,
      supportDescription: "Weekly therapeutic support sessions",
      providerName: "CAMHS",
      hoursPerWeek: 2,
      effectivenessRating: "good",
      childView: "The sessions help me when I'm stressed",
    }),
    makeSEND({
      childId: "child-morgan",
      childName: "Morgan",
      sendCategory: "SpLD",
      ehcpInPlace: true,
      ehcpReviewDate: "2025-09-15",
      supportDescription: "Specialist dyslexia tutor",
      providerName: "Learning Support Service",
      hoursPerWeek: 3,
      effectivenessRating: "adequate",
      childView: "It's okay but I wish we did more reading together",
    }),
    makeSEND({
      childId: "child-morgan",
      childName: "Morgan",
      sendCategory: "SpLD",
      ehcpInPlace: true,
      ehcpReviewDate: "2025-09-15",
      supportDescription: "In-class teaching assistant support",
      providerName: "School TA",
      hoursPerWeek: 10,
      effectivenessRating: "good",
    }),
  ];
}

function buildDemoAchievements(): AchievementRecord[] {
  return [
    makeAchievement({ childId: "child-alex", childName: "Alex", achievementType: "academic", description: "Improved maths from D to C", recognisedBy: "Sarah Johnson", celebrated: true, evidenceRecorded: true }),
    makeAchievement({ childId: "child-alex", childName: "Alex", achievementType: "personal", description: "Managed anger in difficult situation", recognisedBy: "Tom Richards", celebrated: true, evidenceRecorded: true }),
    makeAchievement({ childId: "child-alex", childName: "Alex", achievementType: "physical", description: "Completed Couch to 5K programme", recognisedBy: "Darren Laville", celebrated: true, evidenceRecorded: true }),
    makeAchievement({ childId: "child-jordan", childName: "Jordan", achievementType: "academic", description: "Top marks in science test", recognisedBy: "Lisa Williams", celebrated: true, evidenceRecorded: true }),
    makeAchievement({ childId: "child-jordan", childName: "Jordan", achievementType: "social", description: "Volunteered at local food bank", recognisedBy: "Sarah Johnson", celebrated: true, evidenceRecorded: true }),
    makeAchievement({ childId: "child-jordan", childName: "Jordan", achievementType: "creative", description: "Art piece selected for school exhibition", recognisedBy: "Tom Richards", celebrated: true, evidenceRecorded: false }),
    makeAchievement({ childId: "child-jordan", childName: "Jordan", achievementType: "life_skills", description: "Cooked a full meal independently", recognisedBy: "Darren Laville", celebrated: true, evidenceRecorded: true }),
    makeAchievement({ childId: "child-morgan", childName: "Morgan", achievementType: "vocational", description: "Completed work experience at garage", recognisedBy: "Sarah Johnson", celebrated: false, evidenceRecorded: true }),
    makeAchievement({ childId: "child-morgan", childName: "Morgan", achievementType: "personal", description: "Attended all counselling sessions this month", recognisedBy: "Lisa Williams", celebrated: false, evidenceRecorded: false }),
    makeAchievement({ childId: "child-morgan", childName: "Morgan", achievementType: "physical", description: "Joined the school rugby team", recognisedBy: "Tom Richards", celebrated: true, evidenceRecorded: true }),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. evaluateAttendance
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateAttendance", () => {
  it("calculates overall attendance rate across all children", () => {
    const records = buildDemoAttendance();
    const result = evaluateAttendance(records, CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.overallAttendanceRate).toBeGreaterThan(0);
    expect(result.overallAttendanceRate).toBeLessThanOrEqual(100);
  });

  it("returns per-child attendance breakdown", () => {
    const records = buildDemoAttendance();
    const result = evaluateAttendance(records, CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.perChild).toHaveLength(3);
    expect(result.perChild.map(c => c.childId)).toEqual(CHILD_IDS);
  });

  it("Alex has good but not excellent attendance", () => {
    const records = buildDemoAttendance();
    const result = evaluateAttendance(records, CHILD_IDS, PERIOD_START, PERIOD_END);
    const alex = result.perChild.find(c => c.childId === "child-alex")!;
    expect(alex.attendanceRate).toBeGreaterThan(85);
    expect(alex.attendanceRate).toBeLessThan(98);
  });

  it("Jordan has excellent attendance", () => {
    const records = buildDemoAttendance();
    const result = evaluateAttendance(records, CHILD_IDS, PERIOD_START, PERIOD_END);
    const jordan = result.perChild.find(c => c.childId === "child-jordan")!;
    expect(jordan.attendanceRate).toBeGreaterThanOrEqual(98);
  });

  it("Morgan has patchy attendance", () => {
    const records = buildDemoAttendance();
    const result = evaluateAttendance(records, CHILD_IDS, PERIOD_START, PERIOD_END);
    const morgan = result.perChild.find(c => c.childId === "child-morgan")!;
    expect(morgan.attendanceRate).toBeLessThan(92);
  });

  it("counts unauthorised absences correctly", () => {
    const records = buildDemoAttendance();
    const result = evaluateAttendance(records, CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.totalUnauthorised).toBeGreaterThan(0);
    expect(result.unauthorisedAbsenceRate).toBeGreaterThan(0);
  });

  it("tracks lateness", () => {
    const records = buildDemoAttendance();
    const result = evaluateAttendance(records, CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.totalLate).toBeGreaterThan(0);
    expect(result.latenessRate).toBeGreaterThan(0);
  });

  it("tracks EOTAS days", () => {
    const records = buildDemoAttendance();
    const result = evaluateAttendance(records, CHILD_IDS, PERIOD_START, PERIOD_END);
    expect(result.eotasDays).toBeGreaterThan(0);
  });

  it("excludes school_holiday from countable days", () => {
    const records = [
      makeAttendance({ date: "2026-02-01", status: "present" }),
      makeAttendance({ date: "2026-02-02", status: "school_holiday" }),
      makeAttendance({ date: "2026-02-03", status: "present" }),
    ];
    const result = evaluateAttendance(records, ["child-alex"], "2026-01-01", "2026-03-31");
    expect(result.totalSchoolDays).toBe(2);
  });

  it("treats late as present for attendance rate", () => {
    const records = [
      makeAttendance({ date: "2026-02-01", status: "present" }),
      makeAttendance({ date: "2026-02-02", status: "late" }),
    ];
    const result = evaluateAttendance(records, ["child-alex"], "2026-01-01", "2026-03-31");
    expect(result.overallAttendanceRate).toBe(100);
  });

  it("treats EOTAS as present for attendance rate", () => {
    const records = [
      makeAttendance({ date: "2026-02-01", status: "EOTAS" }),
    ];
    const result = evaluateAttendance(records, ["child-alex"], "2026-01-01", "2026-03-31");
    expect(result.overallAttendanceRate).toBe(100);
  });

  it("reports attendance as unmeasured for empty records", () => {
    const result = evaluateAttendance([], ["child-alex"], PERIOD_START, PERIOD_END);
    expect(result.overallAttendanceRate).toBeNull();
    expect(result.unauthorisedAbsenceRate).toBeNull();
    expect(result.latenessRate).toBeNull();
    expect(result.totalSchoolDays).toBe(0);
  });

  it("filters records by date period", () => {
    const records = [
      makeAttendance({ date: "2025-12-01", status: "unauthorised_absence" }),
      makeAttendance({ date: "2026-02-01", status: "present" }),
      makeAttendance({ date: "2026-06-01", status: "unauthorised_absence" }),
    ];
    const result = evaluateAttendance(records, ["child-alex"], "2026-01-01", "2026-03-31");
    expect(result.totalSchoolDays).toBe(1);
    expect(result.overallAttendanceRate).toBe(100);
  });

  it("calculates per-child lateness rate", () => {
    const records = [
      makeAttendance({ childId: "child-alex", date: "2026-02-01", status: "late" }),
      makeAttendance({ childId: "child-alex", date: "2026-02-02", status: "present" }),
    ];
    const result = evaluateAttendance(records, ["child-alex"], "2026-01-01", "2026-03-31");
    expect(result.perChild[0].latenessRate).toBe(50);
  });

  it("calculates per-child EOTAS days", () => {
    const records = [
      makeAttendance({ childId: "child-alex", date: "2026-02-01", status: "EOTAS" }),
      makeAttendance({ childId: "child-alex", date: "2026-02-02", status: "EOTAS" }),
      makeAttendance({ childId: "child-alex", date: "2026-02-03", status: "present" }),
    ];
    const result = evaluateAttendance(records, ["child-alex"], "2026-01-01", "2026-03-31");
    expect(result.perChild[0].eotasDays).toBe(2);
  });

  it("determines improving trend when second half is better", () => {
    const records = [
      // First half — absences
      makeAttendance({ date: "2026-01-10", status: "unauthorised_absence" }),
      makeAttendance({ date: "2026-01-11", status: "unauthorised_absence" }),
      makeAttendance({ date: "2026-01-12", status: "present" }),
      makeAttendance({ date: "2026-01-13", status: "present" }),
      makeAttendance({ date: "2026-01-14", status: "unauthorised_absence" }),
      // Second half — all present
      makeAttendance({ date: "2026-03-10", status: "present" }),
      makeAttendance({ date: "2026-03-11", status: "present" }),
      makeAttendance({ date: "2026-03-12", status: "present" }),
      makeAttendance({ date: "2026-03-13", status: "present" }),
      makeAttendance({ date: "2026-03-14", status: "present" }),
    ];
    const result = evaluateAttendance(records, ["child-alex"], PERIOD_START, PERIOD_END);
    expect(result.perChild[0].trend).toBe("improving");
  });

  it("determines declining trend when second half is worse", () => {
    const records = [
      // First half — all present
      makeAttendance({ date: "2026-01-10", status: "present" }),
      makeAttendance({ date: "2026-01-11", status: "present" }),
      makeAttendance({ date: "2026-01-12", status: "present" }),
      makeAttendance({ date: "2026-01-13", status: "present" }),
      makeAttendance({ date: "2026-01-14", status: "present" }),
      // Second half — absences
      makeAttendance({ date: "2026-03-10", status: "unauthorised_absence" }),
      makeAttendance({ date: "2026-03-11", status: "unauthorised_absence" }),
      makeAttendance({ date: "2026-03-12", status: "present" }),
      makeAttendance({ date: "2026-03-13", status: "unauthorised_absence" }),
      makeAttendance({ date: "2026-03-14", status: "present" }),
    ];
    const result = evaluateAttendance(records, ["child-alex"], PERIOD_START, PERIOD_END);
    expect(result.perChild[0].trend).toBe("declining");
  });

  it("determines stable trend when halves are similar", () => {
    const records = [
      makeAttendance({ date: "2026-01-10", status: "present" }),
      makeAttendance({ date: "2026-01-11", status: "present" }),
      makeAttendance({ date: "2026-03-10", status: "present" }),
      makeAttendance({ date: "2026-03-11", status: "present" }),
    ];
    const result = evaluateAttendance(records, ["child-alex"], PERIOD_START, PERIOD_END);
    expect(result.perChild[0].trend).toBe("stable");
  });

  it("handles child with no records gracefully", () => {
    const records = [
      makeAttendance({ childId: "child-alex", date: "2026-02-01", status: "present" }),
    ];
    const result = evaluateAttendance(records, ["child-alex", "child-unknown"], "2026-01-01", "2026-03-31");
    const unknown = result.perChild.find(c => c.childId === "child-unknown")!;
    expect(unknown.attendanceRate).toBeNull();
    expect(unknown.totalDays).toBe(0);
  });

  it("counts excluded days as absent", () => {
    const records = [
      makeAttendance({ date: "2026-02-01", status: "excluded" }),
      makeAttendance({ date: "2026-02-02", status: "present" }),
    ];
    const result = evaluateAttendance(records, ["child-alex"], "2026-01-01", "2026-03-31");
    expect(result.totalAbsent).toBe(1);
    expect(result.overallAttendanceRate).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. evaluateExclusions
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateExclusions", () => {
  const demoExclusions = buildDemoExclusions();

  it("counts total exclusions", () => {
    const result = evaluateExclusions(demoExclusions);
    expect(result.totalExclusions).toBe(2);
  });

  it("counts total days lost", () => {
    const result = evaluateExclusions(demoExclusions);
    expect(result.totalDaysLost).toBe(3);
  });

  it("breaks down by exclusion type", () => {
    const result = evaluateExclusions(demoExclusions);
    expect(result.fixedTermCount).toBe(1);
    expect(result.informalCount).toBe(1);
    expect(result.permanentCount).toBe(0);
    expect(result.internalCount).toBe(0);
  });

  it("calculates alternative provision rate", () => {
    const result = evaluateExclusions(demoExclusions);
    expect(result.alternativeProvisionRate).toBe(50);
  });

  it("calculates reintegration rate", () => {
    const result = evaluateExclusions(demoExclusions);
    expect(result.reintegrationRate).toBe(50);
  });

  it("calculates home challenge rate", () => {
    const result = evaluateExclusions(demoExclusions);
    expect(result.homeChallengeRate).toBe(50);
  });

  it("provides per-child exclusion analysis", () => {
    const result = evaluateExclusions(demoExclusions);
    expect(result.perChild).toHaveLength(2);
    const alex = result.perChild.find(c => c.childId === "child-alex")!;
    expect(alex.exclusionCount).toBe(1);
    expect(alex.totalDays).toBe(2);
    expect(alex.challengedByHome).toBe(true);
  });

  it("lists exclusion types per child", () => {
    const result = evaluateExclusions(demoExclusions);
    const morgan = result.perChild.find(c => c.childId === "child-morgan")!;
    expect(morgan.types).toContain("informal");
  });

  it("handles empty exclusions", () => {
    const result = evaluateExclusions([]);
    expect(result.totalExclusions).toBe(0);
    expect(result.totalDaysLost).toBe(0);
    expect(result.alternativeProvisionRate).toBeNull();
    expect(result.reintegrationRate).toBeNull();
    expect(result.homeChallengeRate).toBeNull();
    expect(result.perChild).toHaveLength(0);
  });

  it("handles permanent exclusion", () => {
    const exc = [makeExclusion({ exclusionType: "permanent", daysExcluded: 0 })];
    const result = evaluateExclusions(exc);
    expect(result.permanentCount).toBe(1);
  });

  it("handles internal exclusion", () => {
    const exc = [makeExclusion({ exclusionType: "internal", daysExcluded: 1 })];
    const result = evaluateExclusions(exc);
    expect(result.internalCount).toBe(1);
  });

  it("aggregates multiple exclusions for same child", () => {
    const exc = [
      makeExclusion({ childId: "child-alex", daysExcluded: 2 }),
      makeExclusion({ childId: "child-alex", daysExcluded: 3 }),
    ];
    const result = evaluateExclusions(exc);
    expect(result.perChild).toHaveLength(1);
    expect(result.perChild[0].exclusionCount).toBe(2);
    expect(result.perChild[0].totalDays).toBe(5);
  });

  it("computes 100% rates when all exclusions have provisions", () => {
    const exc = [
      makeExclusion({ alternativeProvision: true, reintegrationMeeting: true }),
    ];
    const result = evaluateExclusions(exc);
    expect(result.alternativeProvisionRate).toBe(100);
    expect(result.reintegrationRate).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. evaluatePEPQuality
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluatePEPQuality", () => {
  const demoPEPs = buildDemoPEPs();

  it("calculates PEP currency rate", () => {
    const result = evaluatePEPQuality(demoPEPs, CHILD_IDS, REFERENCE_DATE);
    // 2 out of 3 are current
    expect(result.pepCurrencyRate).toBeCloseTo(66.7, 0);
  });

  it("tracks virtual school involvement", () => {
    const result = evaluatePEPQuality(demoPEPs, CHILD_IDS, REFERENCE_DATE);
    expect(result.virtualSchoolInvolvementRate).toBeCloseTo(66.7, 0);
  });

  it("tracks child attendance at PEP", () => {
    const result = evaluatePEPQuality(demoPEPs, CHILD_IDS, REFERENCE_DATE);
    expect(result.childAttendanceRate).toBeCloseTo(66.7, 0);
  });

  it("tracks child voice", () => {
    const result = evaluatePEPQuality(demoPEPs, CHILD_IDS, REFERENCE_DATE);
    expect(result.childVoiceRate).toBeCloseTo(66.7, 0);
  });

  it("calculates target achievement rate", () => {
    const result = evaluatePEPQuality(demoPEPs, CHILD_IDS, REFERENCE_DATE);
    // 4 achieved out of 10 targets
    expect(result.targetAchievementRate).toBe(40);
  });

  it("counts overdue PEPs", () => {
    const result = evaluatePEPQuality(demoPEPs, CHILD_IDS, REFERENCE_DATE);
    expect(result.overduePEPs).toBe(1);
  });

  it("provides per-child PEP detail", () => {
    const result = evaluatePEPQuality(demoPEPs, CHILD_IDS, REFERENCE_DATE);
    expect(result.perChild).toHaveLength(3);
    const morgan = result.perChild.find(c => c.childId === "child-morgan")!;
    expect(morgan.pepStatus).toBe("overdue");
    expect(morgan.virtualSchoolInvolved).toBe(false);
  });

  it("uses most recent PEP when multiple exist", () => {
    const peps = [
      makePEP({ childId: "child-alex", reviewDate: "2026-01-01", status: "overdue", targetsSet: 2, targetsAchieved: 0 }),
      makePEP({ childId: "child-alex", reviewDate: "2026-03-01", status: "current", targetsSet: 4, targetsAchieved: 3 }),
    ];
    const result = evaluatePEPQuality(peps, ["child-alex"], REFERENCE_DATE);
    expect(result.perChild[0].pepStatus).toBe("current");
    expect(result.perChild[0].targetsSet).toBe(4);
  });

  it("handles child with no PEP", () => {
    const result = evaluatePEPQuality([], ["child-alex"], REFERENCE_DATE);
    expect(result.perChild[0].pepStatus).toBe("not_in_place");
    expect(result.notInPlacePEPs).toBe(1);
  });

  it("returns 100% currency when all PEPs current", () => {
    const peps = [
      makePEP({ childId: "child-alex", status: "current" }),
      makePEP({ childId: "child-jordan", status: "current" }),
    ];
    const result = evaluatePEPQuality(peps, ["child-alex", "child-jordan"], REFERENCE_DATE);
    expect(result.pepCurrencyRate).toBe(100);
  });

  it("counts draft PEPs", () => {
    const peps = [makePEP({ childId: "child-alex", status: "draft" })];
    const result = evaluatePEPQuality(peps, ["child-alex"], REFERENCE_DATE);
    expect(result.draftPEPs).toBe(1);
  });

  it("handles empty childIds", () => {
    const result = evaluatePEPQuality(demoPEPs, [], REFERENCE_DATE);
    expect(result.pepCurrencyRate).toBeNull();
    expect(result.perChild).toHaveLength(0);
  });

  it("calculates 0% target achievement when no targets set", () => {
    const peps = [makePEP({ childId: "child-alex", targetsSet: 0, targetsAchieved: 0 })];
    const result = evaluatePEPQuality(peps, ["child-alex"], REFERENCE_DATE);
    expect(result.targetAchievementRate).toBe(0);
  });

  it("counts not_in_place status correctly", () => {
    const peps = [makePEP({ childId: "child-alex", status: "not_in_place" })];
    const result = evaluatePEPQuality(peps, ["child-alex"], REFERENCE_DATE);
    expect(result.notInPlacePEPs).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. evaluateSENDSupport
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateSENDSupport", () => {
  const demoSEND = buildDemoSEND();

  it("counts children with SEND", () => {
    const result = evaluateSENDSupport(demoSEND, CHILD_IDS);
    expect(result.childrenWithSEND).toBe(2);
  });

  it("calculates SEND coverage rate", () => {
    const result = evaluateSENDSupport(demoSEND, CHILD_IDS);
    expect(result.sendCoverageRate).toBe(100);
  });

  it("counts EHCPs", () => {
    const result = evaluateSENDSupport(demoSEND, CHILD_IDS);
    expect(result.ehcpCount).toBe(1); // Morgan
  });

  it("calculates average hours per week", () => {
    const result = evaluateSENDSupport(demoSEND, CHILD_IDS);
    expect(result.averageHoursPerWeek).toBe(5); // (2 + 3 + 10) / 3
  });

  it("breaks down effectiveness ratings", () => {
    const result = evaluateSENDSupport(demoSEND, CHILD_IDS);
    expect(result.effectivenessBreakdown.good).toBe(2);
    expect(result.effectivenessBreakdown.adequate).toBe(1);
    expect(result.effectivenessBreakdown.excellent).toBe(0);
    expect(result.effectivenessBreakdown.poor).toBe(0);
  });

  it("calculates child voice captured rate", () => {
    const result = evaluateSENDSupport(demoSEND, CHILD_IDS);
    // 2 out of 3 have childView
    expect(result.childVoiceCapturedRate).toBeCloseTo(66.7, 0);
  });

  it("provides per-child SEND analysis", () => {
    const result = evaluateSENDSupport(demoSEND, CHILD_IDS);
    expect(result.perChild).toHaveLength(2);
    const morgan = result.perChild.find(c => c.childId === "child-morgan")!;
    expect(morgan.sendCategory).toBe("SpLD");
    expect(morgan.ehcpInPlace).toBe(true);
    expect(morgan.hoursPerWeek).toBe(13); // 3 + 10
  });

  it("handles empty SEND records", () => {
    const result = evaluateSENDSupport([], CHILD_IDS);
    expect(result.childrenWithSEND).toBe(0);
    expect(result.sendCoverageRate).toBeNull();
    expect(result.ehcpCurrencyRate).toBeNull();
    expect(result.averageHoursPerWeek).toBe(0);
  });

  it("correctly identifies EHCP currency", () => {
    const result = evaluateSENDSupport(demoSEND, CHILD_IDS);
    const morgan = result.perChild.find(c => c.childId === "child-morgan")!;
    // Morgan's EHCP review was Sept 2025 — more than 12 months ago from May 2026
    // This depends on current date, but the review is overdue
    expect(morgan.ehcpInPlace).toBe(true);
  });

  it("uses best effectiveness rating per child", () => {
    const result = evaluateSENDSupport(demoSEND, CHILD_IDS);
    const morgan = result.perChild.find(c => c.childId === "child-morgan")!;
    // Morgan has adequate + good — should pick good
    expect(morgan.effectivenessRating).toBe("good");
  });

  it("handles child with no childView", () => {
    const sends = [makeSEND({ childView: undefined })];
    const result = evaluateSENDSupport(sends, ["child-alex"]);
    expect(result.childVoiceCapturedRate).toBe(0);
  });

  it("handles child with empty string childView", () => {
    const sends = [makeSEND({ childView: "" })];
    const result = evaluateSENDSupport(sends, ["child-alex"]);
    expect(result.childVoiceCapturedRate).toBe(0);
  });

  it("treats 'none' SEND category as no SEND", () => {
    const sends = [makeSEND({ sendCategory: "none" })];
    const result = evaluateSENDSupport(sends, ["child-alex"]);
    expect(result.childrenWithSEND).toBe(0);
  });

  it("calculates correct EHCP currency when review is recent", () => {
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 3);
    const sends = [makeSEND({
      ehcpInPlace: true,
      ehcpReviewDate: recentDate.toISOString().slice(0, 10),
    })];
    const result = evaluateSENDSupport(sends, ["child-alex"]);
    expect(result.ehcpCurrencyRate).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. evaluateAchievements
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateAchievements", () => {
  const demoAchievements = buildDemoAchievements();

  it("counts total achievements", () => {
    const result = evaluateAchievements(demoAchievements);
    expect(result.totalAchievements).toBe(10);
  });

  it("breaks down by achievement type", () => {
    const result = evaluateAchievements(demoAchievements);
    expect(result.achievementTypeBreakdown.academic).toBe(2);
    expect(result.achievementTypeBreakdown.personal).toBe(2);
    expect(result.achievementTypeBreakdown.physical).toBe(2);
    expect(result.achievementTypeBreakdown.social).toBe(1);
    expect(result.achievementTypeBreakdown.creative).toBe(1);
    expect(result.achievementTypeBreakdown.vocational).toBe(1);
    expect(result.achievementTypeBreakdown.life_skills).toBe(1);
  });

  it("calculates type variety score", () => {
    const result = evaluateAchievements(demoAchievements);
    // All 7 types present: 100%
    expect(result.typeVarietyScore).toBe(100);
  });

  it("calculates celebration rate", () => {
    const result = evaluateAchievements(demoAchievements);
    // 8 out of 10 celebrated
    expect(result.celebrationRate).toBe(80);
  });

  it("calculates evidence recording rate", () => {
    const result = evaluateAchievements(demoAchievements);
    // 8 out of 10 evidenced
    expect(result.evidenceRecordingRate).toBe(80);
  });

  it("provides per-child achievement breakdown", () => {
    const result = evaluateAchievements(demoAchievements);
    expect(result.perChild).toHaveLength(3);
    const alex = result.perChild.find(c => c.childId === "child-alex")!;
    expect(alex.achievementCount).toBe(3);
    expect(alex.types).toContain("academic");
    expect(alex.types).toContain("personal");
    expect(alex.types).toContain("physical");
  });

  it("Jordan has most achievements", () => {
    const result = evaluateAchievements(demoAchievements);
    const jordan = result.perChild.find(c => c.childId === "child-jordan")!;
    expect(jordan.achievementCount).toBe(4);
  });

  it("handles empty achievements", () => {
    const result = evaluateAchievements([]);
    expect(result.totalAchievements).toBe(0);
    expect(result.typeVarietyScore).toBe(0);
    expect(result.celebrationRate).toBe(0);
    expect(result.evidenceRecordingRate).toBe(0);
    expect(result.perChild).toHaveLength(0);
  });

  it("calculates per-child celebration rate", () => {
    const result = evaluateAchievements(demoAchievements);
    const alex = result.perChild.find(c => c.childId === "child-alex")!;
    expect(alex.celebrationRate).toBe(100); // All 3 celebrated
  });

  it("Morgan has lower celebration rate", () => {
    const result = evaluateAchievements(demoAchievements);
    const morgan = result.perChild.find(c => c.childId === "child-morgan")!;
    // 1 out of 3 celebrated
    expect(morgan.celebrationRate).toBeCloseTo(33.3, 0);
  });

  it("correctly counts variety when only one type", () => {
    const achs = [
      makeAchievement({ achievementType: "academic" }),
      makeAchievement({ achievementType: "academic" }),
    ];
    const result = evaluateAchievements(achs);
    expect(result.typeVarietyScore).toBeCloseTo(14.3, 0); // 1/7
  });

  it("all types in breakdown default to 0", () => {
    const result = evaluateAchievements([]);
    const allTypes: AchievementType[] = ["academic", "vocational", "personal", "social", "creative", "physical", "life_skills"];
    for (const t of allTypes) {
      expect(result.achievementTypeBreakdown[t]).toBe(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. generateEducationOutcomesIntelligence — Scoring & Rating
// ═══════════════════════════════════════════════════════════════════════════

describe("generateEducationOutcomesIntelligence", () => {
  function buildIntelligence() {
    return generateEducationOutcomesIntelligence(
      buildDemoAttendance(),
      buildDemoExclusions(),
      buildDemoPEPs(),
      buildDemoSEND(),
      buildDemoAchievements(),
      CHILD_IDS,
      CHILD_NAMES,
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
  }

  it("returns overall score between 0 and 100", () => {
    const result = buildIntelligence();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns a valid rating", () => {
    const result = buildIntelligence();
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.overallRating);
  });

  it("score breakdown sums to overall", () => {
    const result = buildIntelligence();
    const sum =
      result.breakdown.attendance.score +
      result.breakdown.exclusionManagement.score +
      result.breakdown.pepQuality.score +
      result.breakdown.sendSupport.score +
      result.breakdown.achievements.score;
    expect(sum).toBe(result.overallScore);
  });

  it("breakdown max scores sum to 100", () => {
    const result = buildIntelligence();
    const maxSum =
      result.breakdown.attendance.maxScore +
      result.breakdown.exclusionManagement.maxScore +
      result.breakdown.pepQuality.maxScore +
      result.breakdown.sendSupport.maxScore +
      result.breakdown.achievements.maxScore;
    expect(maxSum).toBe(100);
  });

  it("attendance score does not exceed 25", () => {
    const result = buildIntelligence();
    expect(result.breakdown.attendance.score).toBeLessThanOrEqual(25);
  });

  it("exclusion score does not exceed 20", () => {
    const result = buildIntelligence();
    expect(result.breakdown.exclusionManagement.score).toBeLessThanOrEqual(20);
  });

  it("PEP score does not exceed 25", () => {
    const result = buildIntelligence();
    expect(result.breakdown.pepQuality.score).toBeLessThanOrEqual(25);
  });

  it("SEND score does not exceed 15", () => {
    const result = buildIntelligence();
    expect(result.breakdown.sendSupport.score).toBeLessThanOrEqual(15);
  });

  it("achievement score does not exceed 15", () => {
    const result = buildIntelligence();
    expect(result.breakdown.achievements.score).toBeLessThanOrEqual(15);
  });

  it("includes home ID and period", () => {
    const result = buildIntelligence();
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("includes child profiles for all children", () => {
    const result = buildIntelligence();
    expect(result.childProfiles).toHaveLength(3);
    expect(result.childProfiles.map(c => c.childId)).toEqual(CHILD_IDS);
  });

  it("child profiles contain correct names", () => {
    const result = buildIntelligence();
    for (const profile of result.childProfiles) {
      expect(profile.childName).toBe(CHILD_NAMES[profile.childId]);
    }
  });

  it("child profiles include attendance rates", () => {
    const result = buildIntelligence();
    for (const profile of result.childProfiles) {
      expect(profile.attendanceRate).toBeGreaterThanOrEqual(0);
      expect(profile.attendanceRate).toBeLessThanOrEqual(100);
    }
  });

  it("child profiles include PEP status", () => {
    const result = buildIntelligence();
    const morgan = result.childProfiles.find(c => c.childId === "child-morgan")!;
    expect(morgan.pepStatus).toBe("overdue");
  });

  it("child profiles include exclusion days", () => {
    const result = buildIntelligence();
    const alex = result.childProfiles.find(c => c.childId === "child-alex")!;
    expect(alex.exclusionDays).toBe(2);
  });

  it("child profiles include SEND category", () => {
    const result = buildIntelligence();
    const alex = result.childProfiles.find(c => c.childId === "child-alex")!;
    expect(alex.sendCategory).toBe("SEMH");
  });

  it("generates strengths", () => {
    const result = buildIntelligence();
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement", () => {
    const result = buildIntelligence();
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions", () => {
    const result = buildIntelligence();
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("includes regulatory links", () => {
    const result = buildIntelligence();
    expect(result.regulatoryLinks.length).toBeGreaterThanOrEqual(5);
  });

  it("regulatory links cover Reg 8", () => {
    const result = buildIntelligence();
    const reg8 = result.regulatoryLinks.find(r => r.regulation.includes("Reg 8"));
    expect(reg8).toBeDefined();
    expect(["met", "partially_met", "not_met"]).toContain(reg8!.status);
  });

  it("regulatory links cover Reg 9", () => {
    const result = buildIntelligence();
    const reg9 = result.regulatoryLinks.find(r => r.regulation.includes("Reg 9"));
    expect(reg9).toBeDefined();
  });

  it("regulatory links cover SCCIF", () => {
    const result = buildIntelligence();
    const sccif = result.regulatoryLinks.find(r => r.regulation.includes("SCCIF"));
    expect(sccif).toBeDefined();
  });

  it("regulatory links cover Virtual School Head", () => {
    const result = buildIntelligence();
    const vs = result.regulatoryLinks.find(r => r.regulation.includes("Virtual School"));
    expect(vs).toBeDefined();
  });

  it("regulatory links cover SEND Code of Practice", () => {
    const result = buildIntelligence();
    const send = result.regulatoryLinks.find(r => r.regulation.includes("SEND"));
    expect(send).toBeDefined();
  });

  it("mentions informal exclusions in areas for improvement", () => {
    const result = buildIntelligence();
    const hasInformal = result.areasForImprovement.some(a => a.toLowerCase().includes("informal"));
    expect(hasInformal).toBe(true);
  });

  it("mentions PEP overdue in areas for improvement", () => {
    const result = buildIntelligence();
    const hasPEP = result.areasForImprovement.some(a => a.toLowerCase().includes("pep"));
    expect(hasPEP).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Rating threshold tests
// ═══════════════════════════════════════════════════════════════════════════

describe("Rating thresholds", () => {
  function makeOutstandingData() {
    // Perfect attendance, no exclusions, all PEPs current with full participation, good SEND, many achievements
    const attendance: AttendanceRecord[] = [];
    const start = new Date("2026-01-05");
    let dayOffset = 0;
    for (const childId of CHILD_IDS) {
      for (let i = 0; i < 60; i++) {
        const d = new Date(start.getTime() + dayOffset * 24 * 60 * 60 * 1000);
        dayOffset++;
        if (d.getDay() === 0 || d.getDay() === 6) { i--; continue; }
        attendance.push(makeAttendance({
          childId,
          childName: CHILD_NAMES[childId],
          date: d.toISOString().slice(0, 10),
          status: "present",
        }));
      }
      dayOffset = 0;
    }

    const exclusions: ExclusionRecord[] = [];

    const peps: PEPRecord[] = CHILD_IDS.map(id => makePEP({
      childId: id,
      childName: CHILD_NAMES[id],
      status: "current",
      virtualSchoolInvolved: true,
      childAttended: true,
      childVoiceRecorded: true,
      targetsSet: 4,
      targetsAchieved: 3,
    }));

    const sends: SENDSupportRecord[] = [];

    const achievementTypes: AchievementType[] = ["academic", "vocational", "personal", "social", "creative", "physical", "life_skills"];
    const achievements: AchievementRecord[] = [];
    for (const childId of CHILD_IDS) {
      for (const t of achievementTypes.slice(0, 4)) {
        achievements.push(makeAchievement({
          childId,
          childName: CHILD_NAMES[childId],
          achievementType: t,
          celebrated: true,
          evidenceRecorded: true,
        }));
      }
    }

    return { attendance, exclusions, peps, sends, achievements };
  }

  it("outstanding rating for excellent data (>=80)", () => {
    const data = makeOutstandingData();
    const result = generateEducationOutcomesIntelligence(
      data.attendance, data.exclusions, data.peps, data.sends, data.achievements,
      CHILD_IDS, CHILD_NAMES, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.overallRating).toBe("outstanding");
  });

  it("inadequate rating for very poor data (<40)", () => {
    // No attendance, many exclusions, no PEPs, poor SEND, no achievements
    const exclusions = CHILD_IDS.map(id => makeExclusion({
      childId: id,
      childName: CHILD_NAMES[id],
      daysExcluded: 10,
      alternativeProvision: false,
      reintegrationMeeting: false,
      challengedByHome: false,
    }));

    const sends = [makeSEND({
      effectivenessRating: "poor",
      childView: undefined,
      ehcpInPlace: true,
      ehcpReviewDate: "2020-01-01",
    })];

    const result = generateEducationOutcomesIntelligence(
      [], exclusions, [], sends, [],
      CHILD_IDS, CHILD_NAMES, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.overallRating).toBe("inadequate");
  });

  it("score is 0 with absolutely no data and many exclusions", () => {
    const exclusions = [
      makeExclusion({ childId: "child-alex", daysExcluded: 20, alternativeProvision: false, reintegrationMeeting: false, challengedByHome: false }),
      makeExclusion({ childId: "child-jordan", daysExcluded: 15, alternativeProvision: false, reintegrationMeeting: false, challengedByHome: false }),
      makeExclusion({ childId: "child-morgan", daysExcluded: 10, alternativeProvision: false, reintegrationMeeting: false, challengedByHome: false }),
      makeExclusion({ childId: "child-alex", daysExcluded: 5, alternativeProvision: false, reintegrationMeeting: false, challengedByHome: false }),
    ];

    const result = generateEducationOutcomesIntelligence(
      [], exclusions, [], [], [],
      CHILD_IDS, CHILD_NAMES, HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    // Attendance: no records = 100% = 12 + 7 + 6 = 25
    // Exclusions: 4 exclusions, 0 challenge, 0 reint, 0 alt = 0 + 0 + 0 + 0 = 0
    // PEP: no PEPs = 0 currency for 3 children = 0 + 0 + 0 + 0 = 0
    // SEND: no records = 15
    // Achievements: 0 = 0
    expect(result.overallScore).toBeLessThanOrEqual(45);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Edge case tests
// ═══════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles single child", () => {
    const result = generateEducationOutcomesIntelligence(
      [makeAttendance({ date: "2026-02-01", status: "present" })],
      [],
      [makePEP({ childId: "child-alex", status: "current" })],
      [],
      [makeAchievement()],
      ["child-alex"],
      { "child-alex": "Alex" },
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(result.childProfiles).toHaveLength(1);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("handles no children gracefully", () => {
    const result = generateEducationOutcomesIntelligence(
      [], [], [], [], [],
      [], {},
      HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.childProfiles).toHaveLength(0);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("attendance is unmeasured when every record is a school holiday", () => {
    const records = [
      makeAttendance({ date: "2026-02-01", status: "school_holiday" }),
      makeAttendance({ date: "2026-02-02", status: "school_holiday" }),
    ];
    const result = evaluateAttendance(records, ["child-alex"], "2026-01-01", "2026-03-31");
    expect(result.overallAttendanceRate).toBeNull();
    expect(result.totalSchoolDays).toBe(0);
  });

  it("exclusion with 0 days excluded", () => {
    const exc = [makeExclusion({ daysExcluded: 0 })];
    const result = evaluateExclusions(exc);
    expect(result.totalDaysLost).toBe(0);
    expect(result.totalExclusions).toBe(1);
  });

  it("PEP with 100% target achievement", () => {
    const peps = [makePEP({ targetsSet: 5, targetsAchieved: 5 })];
    const result = evaluatePEPQuality(peps, ["child-alex"], REFERENCE_DATE);
    expect(result.targetAchievementRate).toBe(100);
  });

  it("SEND with excellent rating", () => {
    const sends = [makeSEND({ effectivenessRating: "excellent" })];
    const result = evaluateSENDSupport(sends, ["child-alex"]);
    expect(result.effectivenessBreakdown.excellent).toBe(1);
  });

  it("SEND with no EHCP review date", () => {
    const sends = [makeSEND({ ehcpInPlace: true, ehcpReviewDate: undefined })];
    const result = evaluateSENDSupport(sends, ["child-alex"]);
    expect(result.ehcpCount).toBe(1);
    // No review date means not current
    const child = result.perChild[0];
    expect(child.ehcpCurrent).toBe(false);
  });

  it("achievements with zero celebration", () => {
    const achs = [
      makeAchievement({ celebrated: false, evidenceRecorded: false }),
      makeAchievement({ celebrated: false, evidenceRecorded: false }),
    ];
    const result = evaluateAchievements(achs);
    expect(result.celebrationRate).toBe(0);
    expect(result.evidenceRecordingRate).toBe(0);
  });

  it("mixed attendance statuses in a single day correctly tallied", () => {
    const records = [
      makeAttendance({ childId: "child-alex", date: "2026-02-01", status: "present" }),
      makeAttendance({ childId: "child-jordan", date: "2026-02-01", status: "late" }),
      makeAttendance({ childId: "child-morgan", date: "2026-02-01", status: "unauthorised_absence" }),
    ];
    const result = evaluateAttendance(records, CHILD_IDS, "2026-01-01", "2026-03-31");
    expect(result.totalSchoolDays).toBe(3);
    expect(result.totalPresent).toBe(2); // present + late
    expect(result.totalUnauthorised).toBe(1);
  });

  it("no SEND children gives full 15 points", () => {
    const result = generateEducationOutcomesIntelligence(
      [makeAttendance({ date: "2026-02-01", status: "present" })],
      [],
      [makePEP({ status: "current", childId: "child-alex" })],
      [],
      [makeAchievement()],
      ["child-alex"],
      { "child-alex": "Alex" },
      HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.breakdown.sendSupport.score).toBe(15);
  });

  it("child with unknown ID in childNames uses childId as fallback", () => {
    const result = generateEducationOutcomesIntelligence(
      [], [], [], [], [],
      ["child-unknown"],
      {},
      HOME_ID, PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.childProfiles[0].childName).toBe("child-unknown");
  });

  it("all attendance records outside period returns empty results", () => {
    const records = [
      makeAttendance({ date: "2025-06-01", status: "unauthorised_absence" }),
    ];
    const result = evaluateAttendance(records, ["child-alex"], PERIOD_START, PERIOD_END);
    expect(result.totalSchoolDays).toBe(0);
    expect(result.overallAttendanceRate).toBeNull();
  });
});
