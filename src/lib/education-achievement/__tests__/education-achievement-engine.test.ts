// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Education Achievement Intelligence — Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateAttendance,
  evaluatePEPQuality,
  evaluateAcademicProgress,
  evaluateSchoolStability,
  buildChildEducationProfiles,
  generateEducationAchievementIntelligence,
  getRating,
  getSchoolTypeLabel,
  getAttendanceStatusLabel,
  getPEPStatusLabel,
  getPEPQualityLabel,
  getAcademicProgressLabel,
  getExclusionTypeLabel,
  getRatingLabel,
} from "../education-achievement-engine";
import type {
  AttendanceRecord,
  PEPRecord,
  AcademicOutcome,
  SchoolStability,
  ExclusionRecord,
  SchoolType,
  AttendanceStatus,
  PEPStatus,
  PEPQuality,
  AcademicProgress,
  ExclusionType,
  Rating,
} from "../education-achievement-engine";

// ── Constants ────────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

// ── Factories ────────────────────────────────────────────────────────────────

function makeAttendance(overrides: Partial<AttendanceRecord> = {}): AttendanceRecord {
  return {
    id: "att-001",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-03-15",
    status: "present",
    schoolName: "Oakwood Academy",
    ...overrides,
  };
}

function makePEP(overrides: Partial<PEPRecord> = {}): PEPRecord {
  return {
    id: "pep-001",
    childId: "child-alex",
    childName: "Alex",
    pepDate: "2026-03-01",
    status: "current",
    quality: "good",
    childViewsIncluded: true,
    targetsSMART: true,
    virtualSchoolInvolved: true,
    ppFundingUsed: true,
    reviewDate: "2026-06-01",
    ...overrides,
  };
}

function makeOutcome(overrides: Partial<AcademicOutcome> = {}): AcademicOutcome {
  return {
    id: "out-001",
    childId: "child-alex",
    childName: "Alex",
    subject: "English",
    progress: "expected",
    assessmentDate: "2026-03-15",
    ...overrides,
  };
}

function makeStability(overrides: Partial<SchoolStability> = {}): SchoolStability {
  return {
    id: "stab-001",
    childId: "child-alex",
    childName: "Alex",
    schoolType: "mainstream",
    currentSchoolName: "Oakwood Academy",
    schoolChangesInYear: 0,
    daysOutOfEducation: 0,
    ...overrides,
  };
}

function makeExclusion(overrides: Partial<ExclusionRecord> = {}): ExclusionRecord {
  return {
    id: "excl-001",
    childId: "child-jordan",
    childName: "Jordan",
    exclusionType: "fixed_term",
    durationDays: 3,
    reason: "Persistent disruptive behaviour",
    alternativeProvisionArranged: true,
    reintegrationPlanInPlace: true,
    ...overrides,
  };
}

// ── Chamberlain House Demo Data ──────────────────────────────────────────────────────

// Alex: mainstream school, 95% attendance, good PEP, expected progress
function makeAlexAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  for (let i = 0; i < 19; i++) {
    records.push(makeAttendance({
      id: `att-alex-${i}`,
      childId: "child-alex",
      childName: "Alex",
      date: `2026-03-${String(i + 1).padStart(2, "0")}`,
      status: "present",
      schoolName: "Oakwood Academy",
    }));
  }
  // 1 authorised absence out of 20 = 95%
  records.push(makeAttendance({
    id: "att-alex-20",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-03-20",
    status: "authorised_absence",
    schoolName: "Oakwood Academy",
  }));
  return records;
}

// Jordan: PRU, 85% attendance, overdue PEP, below expected, 1 fixed-term exclusion
function makeJordanAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  for (let i = 0; i < 17; i++) {
    records.push(makeAttendance({
      id: `att-jordan-${i}`,
      childId: "child-jordan",
      childName: "Jordan",
      date: `2026-03-${String(i + 1).padStart(2, "0")}`,
      status: "present",
      schoolName: "Bridge PRU",
    }));
  }
  // 2 unauthorised absences
  records.push(makeAttendance({
    id: "att-jordan-18",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-03-18",
    status: "unauthorised_absence",
    schoolName: "Bridge PRU",
  }));
  records.push(makeAttendance({
    id: "att-jordan-19",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-03-19",
    status: "unauthorised_absence",
    schoolName: "Bridge PRU",
  }));
  // 1 excluded
  records.push(makeAttendance({
    id: "att-jordan-20",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-03-20",
    status: "excluded",
    schoolName: "Bridge PRU",
  }));
  return records;
}

// Morgan: mainstream, 92% attendance, outstanding PEP, exceeding in English/Maths
function makeMorganAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  for (let i = 0; i < 23; i++) {
    records.push(makeAttendance({
      id: `att-morgan-${i}`,
      childId: "child-morgan",
      childName: "Morgan",
      date: `2026-03-${String(i + 1).padStart(2, "0")}`,
      status: "present",
      schoolName: "Riverside High",
    }));
  }
  // 2 authorised absences out of 25 = 92%
  records.push(makeAttendance({
    id: "att-morgan-24",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-03-24",
    status: "authorised_absence",
    schoolName: "Riverside High",
  }));
  records.push(makeAttendance({
    id: "att-morgan-25",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-03-25",
    status: "authorised_absence",
    schoolName: "Riverside High",
  }));
  return records;
}

const DEMO_ATTENDANCE: AttendanceRecord[] = [
  ...makeAlexAttendance(),
  ...makeJordanAttendance(),
  ...makeMorganAttendance(),
];

const DEMO_PEPS: PEPRecord[] = [
  makePEP({
    id: "pep-alex",
    childId: "child-alex",
    childName: "Alex",
    pepDate: "2026-02-15",
    status: "current",
    quality: "good",
    childViewsIncluded: true,
    targetsSMART: true,
    virtualSchoolInvolved: true,
    ppFundingUsed: true,
    reviewDate: "2026-05-15",
  }),
  makePEP({
    id: "pep-jordan",
    childId: "child-jordan",
    childName: "Jordan",
    pepDate: "2025-11-01",
    status: "overdue",
    quality: "requires_improvement",
    childViewsIncluded: false,
    targetsSMART: false,
    virtualSchoolInvolved: false,
    ppFundingUsed: false,
    reviewDate: "2026-02-01",
  }),
  makePEP({
    id: "pep-morgan",
    childId: "child-morgan",
    childName: "Morgan",
    pepDate: "2026-03-01",
    status: "current",
    quality: "outstanding",
    childViewsIncluded: true,
    targetsSMART: true,
    virtualSchoolInvolved: true,
    ppFundingUsed: true,
    reviewDate: "2026-06-01",
  }),
];

const DEMO_OUTCOMES: AcademicOutcome[] = [
  // Alex — expected progress
  makeOutcome({ id: "out-alex-eng", childId: "child-alex", childName: "Alex", subject: "English", progress: "expected", assessmentDate: "2026-03-01" }),
  makeOutcome({ id: "out-alex-maths", childId: "child-alex", childName: "Alex", subject: "Maths", progress: "expected", assessmentDate: "2026-03-01" }),
  makeOutcome({ id: "out-alex-sci", childId: "child-alex", childName: "Alex", subject: "Science", progress: "expected", assessmentDate: "2026-03-01" }),
  // Jordan — below expected
  makeOutcome({ id: "out-jordan-eng", childId: "child-jordan", childName: "Jordan", subject: "English", progress: "below_expected", assessmentDate: "2026-03-01" }),
  makeOutcome({ id: "out-jordan-maths", childId: "child-jordan", childName: "Jordan", subject: "Maths", progress: "below_expected", assessmentDate: "2026-03-01" }),
  // Morgan — exceeding in English/Maths
  makeOutcome({ id: "out-morgan-eng", childId: "child-morgan", childName: "Morgan", subject: "English", progress: "exceeding", assessmentDate: "2026-03-01" }),
  makeOutcome({ id: "out-morgan-maths", childId: "child-morgan", childName: "Morgan", subject: "Maths", progress: "exceeding", assessmentDate: "2026-03-01" }),
  makeOutcome({ id: "out-morgan-sci", childId: "child-morgan", childName: "Morgan", subject: "Science", progress: "expected", assessmentDate: "2026-03-01" }),
  makeOutcome({ id: "out-morgan-hist", childId: "child-morgan", childName: "Morgan", subject: "History", progress: "expected", assessmentDate: "2026-03-01" }),
];

const DEMO_STABILITY: SchoolStability[] = [
  makeStability({
    id: "stab-alex",
    childId: "child-alex",
    childName: "Alex",
    schoolType: "mainstream",
    currentSchoolName: "Oakwood Academy",
    schoolChangesInYear: 0,
    daysOutOfEducation: 0,
  }),
  makeStability({
    id: "stab-jordan",
    childId: "child-jordan",
    childName: "Jordan",
    schoolType: "pupil_referral_unit",
    currentSchoolName: "Bridge PRU",
    schoolChangesInYear: 1,
    reasonForChange: "Moved from mainstream following exclusion",
    daysOutOfEducation: 5,
  }),
  makeStability({
    id: "stab-morgan",
    childId: "child-morgan",
    childName: "Morgan",
    schoolType: "mainstream",
    currentSchoolName: "Riverside High",
    schoolChangesInYear: 0,
    daysOutOfEducation: 0,
  }),
];

const DEMO_EXCLUSIONS: ExclusionRecord[] = [
  makeExclusion({
    id: "excl-jordan-1",
    childId: "child-jordan",
    childName: "Jordan",
    exclusionType: "fixed_term",
    durationDays: 3,
    reason: "Persistent disruptive behaviour",
    alternativeProvisionArranged: true,
    reintegrationPlanInPlace: true,
  }),
];

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Education Achievement Intelligence Engine", () => {
  // ── Label Functions ──────────────────────────────────────────────────────

  describe("getSchoolTypeLabel", () => {
    it("returns correct labels for all school types", () => {
      const types: SchoolType[] = [
        "mainstream", "special", "pupil_referral_unit",
        "alternative_provision", "home_educated", "not_in_education",
      ];
      expect(getSchoolTypeLabel("mainstream")).toBe("Mainstream");
      expect(getSchoolTypeLabel("pupil_referral_unit")).toBe("Pupil Referral Unit");
      expect(getSchoolTypeLabel("not_in_education")).toBe("Not in Education");
      for (const t of types) {
        expect(getSchoolTypeLabel(t)).toBeTruthy();
      }
    });
  });

  describe("getAttendanceStatusLabel", () => {
    it("returns correct labels for all statuses", () => {
      const statuses: AttendanceStatus[] = [
        "present", "authorised_absence", "unauthorised_absence", "excluded", "late",
      ];
      expect(getAttendanceStatusLabel("present")).toBe("Present");
      expect(getAttendanceStatusLabel("unauthorised_absence")).toBe("Unauthorised Absence");
      for (const s of statuses) {
        expect(getAttendanceStatusLabel(s)).toBeTruthy();
      }
    });
  });

  describe("getPEPStatusLabel", () => {
    it("returns correct labels for all PEP statuses", () => {
      const statuses: PEPStatus[] = ["current", "overdue", "not_started", "completed"];
      expect(getPEPStatusLabel("current")).toBe("Current");
      expect(getPEPStatusLabel("overdue")).toBe("Overdue");
      for (const s of statuses) {
        expect(getPEPStatusLabel(s)).toBeTruthy();
      }
    });
  });

  describe("getPEPQualityLabel", () => {
    it("returns correct labels for all PEP quality levels", () => {
      const qualities: PEPQuality[] = ["outstanding", "good", "requires_improvement", "inadequate"];
      expect(getPEPQualityLabel("outstanding")).toBe("Outstanding");
      expect(getPEPQualityLabel("requires_improvement")).toBe("Requires Improvement");
      for (const q of qualities) {
        expect(getPEPQualityLabel(q)).toBeTruthy();
      }
    });
  });

  describe("getAcademicProgressLabel", () => {
    it("returns correct labels for all progress levels", () => {
      const levels: AcademicProgress[] = [
        "exceeding", "expected", "below_expected", "significantly_below", "not_assessed",
      ];
      expect(getAcademicProgressLabel("exceeding")).toBe("Exceeding");
      expect(getAcademicProgressLabel("significantly_below")).toBe("Significantly Below");
      for (const l of levels) {
        expect(getAcademicProgressLabel(l)).toBeTruthy();
      }
    });
  });

  describe("getExclusionTypeLabel", () => {
    it("returns correct labels for all exclusion types", () => {
      const types: ExclusionType[] = ["fixed_term", "permanent", "internal"];
      expect(getExclusionTypeLabel("fixed_term")).toBe("Fixed Term");
      expect(getExclusionTypeLabel("permanent")).toBe("Permanent");
      for (const t of types) {
        expect(getExclusionTypeLabel(t)).toBeTruthy();
      }
    });
  });

  describe("getRatingLabel", () => {
    it("returns correct labels for all ratings", () => {
      const ratings: Rating[] = ["outstanding", "good", "requires_improvement", "inadequate"];
      expect(getRatingLabel("outstanding")).toBe("Outstanding");
      expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
      for (const r of ratings) {
        expect(getRatingLabel(r)).toBeTruthy();
      }
    });
  });

  describe("getRating", () => {
    it("returns outstanding for score >= 80", () => {
      expect(getRating(80)).toBe("outstanding");
      expect(getRating(100)).toBe("outstanding");
      expect(getRating(95)).toBe("outstanding");
    });

    it("returns good for score 60-79", () => {
      expect(getRating(60)).toBe("good");
      expect(getRating(79)).toBe("good");
      expect(getRating(70)).toBe("good");
    });

    it("returns requires_improvement for score 40-59", () => {
      expect(getRating(40)).toBe("requires_improvement");
      expect(getRating(59)).toBe("requires_improvement");
    });

    it("returns inadequate for score < 40", () => {
      expect(getRating(0)).toBe("inadequate");
      expect(getRating(39)).toBe("inadequate");
      expect(getRating(10)).toBe("inadequate");
    });
  });

  // ── evaluateAttendance ────────────────────────────────────────────────

  describe("evaluateAttendance", () => {
    it("returns 0 for no attendance records", () => {
      const result = evaluateAttendance([]);
      expect(result.overallScore).toBe(0);
      expect(result.totalRecords).toBe(0);
      expect(result.attendanceRate).toBe(0);
      expect(result.unauthorisedAbsenceRate).toBe(0);
      expect(result.persistentAbsenceChildren).toBe(0);
      expect(result.lateRate).toBe(0);
      expect(result.exclusionDays).toBe(0);
    });

    it("scores well for demo data", () => {
      const result = evaluateAttendance(DEMO_ATTENDANCE);
      expect(result.overallScore).toBeGreaterThanOrEqual(5);
      expect(result.totalRecords).toBe(65);
    });

    it("calculates attendance rate correctly", () => {
      const result = evaluateAttendance(DEMO_ATTENDANCE);
      // 59 present out of 65 total (19 + 17 + 23 present = 59)
      expect(result.attendanceRate).toBe(91); // (59/65)*100 = 90.77 -> 91
    });

    it("calculates unauthorised absence rate", () => {
      const result = evaluateAttendance(DEMO_ATTENDANCE);
      // 2 unauthorised out of 65
      expect(result.unauthorisedAbsenceRate).toBe(3);
    });

    it("detects persistent absence children", () => {
      const result = evaluateAttendance(DEMO_ATTENDANCE);
      // Jordan has 17/20 = 85% < 90%
      expect(result.persistentAbsenceChildren).toBe(1);
    });

    it("counts exclusion days", () => {
      const result = evaluateAttendance(DEMO_ATTENDANCE);
      expect(result.exclusionDays).toBe(1);
    });

    it("scores high for perfect attendance", () => {
      const records = Array.from({ length: 20 }, (_, i) =>
        makeAttendance({ id: `att-${i}`, status: "present" }),
      );
      const result = evaluateAttendance(records);
      expect(result.overallScore).toBeGreaterThanOrEqual(20);
      expect(result.attendanceRate).toBe(100);
      expect(result.unauthorisedAbsenceRate).toBe(0);
      expect(result.persistentAbsenceChildren).toBe(0);
    });

    it("scores low for poor attendance", () => {
      const records = [
        makeAttendance({ id: "a1", status: "present" }),
        makeAttendance({ id: "a2", status: "unauthorised_absence" }),
        makeAttendance({ id: "a3", status: "unauthorised_absence" }),
        makeAttendance({ id: "a4", status: "excluded" }),
        makeAttendance({ id: "a5", status: "unauthorised_absence" }),
      ];
      const result = evaluateAttendance(records);
      expect(result.attendanceRate).toBe(20);
      expect(result.overallScore).toBeLessThan(7);
    });

    it("counts late as present for attendance rate", () => {
      const records = [
        makeAttendance({ id: "a1", status: "present" }),
        makeAttendance({ id: "a2", status: "late" }),
      ];
      const result = evaluateAttendance(records);
      expect(result.attendanceRate).toBe(100);
    });

    it("calculates late rate", () => {
      const records = [
        makeAttendance({ id: "a1", status: "present" }),
        makeAttendance({ id: "a2", status: "present" }),
        makeAttendance({ id: "a3", status: "late" }),
      ];
      const result = evaluateAttendance(records);
      expect(result.lateRate).toBe(33);
    });

    it("gives max score for >= 95% attendance with no issues", () => {
      const records = Array.from({ length: 100 }, (_, i) =>
        makeAttendance({ id: `a-${i}`, status: i < 96 ? "present" : "authorised_absence" }),
      );
      const result = evaluateAttendance(records);
      expect(result.attendanceRate).toBe(96);
      expect(result.overallScore).toBeGreaterThanOrEqual(20);
    });

    it("handles single child with 100% attendance", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeAttendance({ id: `a-${i}`, childId: "child-1", status: "present" }),
      );
      const result = evaluateAttendance(records);
      expect(result.persistentAbsenceChildren).toBe(0);
    });

    it("handles multiple children with varied attendance", () => {
      const records = [
        // Child A: 100%
        ...Array.from({ length: 10 }, (_, i) =>
          makeAttendance({ id: `a-a${i}`, childId: "child-a", status: "present" }),
        ),
        // Child B: 50%
        ...Array.from({ length: 10 }, (_, i) =>
          makeAttendance({ id: `a-b${i}`, childId: "child-b", status: i < 5 ? "present" : "unauthorised_absence" }),
        ),
      ];
      const result = evaluateAttendance(records);
      expect(result.persistentAbsenceChildren).toBe(1);
    });

    it("gives attendance rate thresholds correctly", () => {
      // 90% attendance
      const records90 = Array.from({ length: 10 }, (_, i) =>
        makeAttendance({ id: `a-${i}`, status: i < 9 ? "present" : "authorised_absence" }),
      );
      const result90 = evaluateAttendance(records90);
      expect(result90.attendanceRate).toBe(90);

      // 85% attendance
      const records85 = Array.from({ length: 20 }, (_, i) =>
        makeAttendance({ id: `a-${i}`, status: i < 17 ? "present" : "authorised_absence" }),
      );
      const result85 = evaluateAttendance(records85);
      expect(result85.attendanceRate).toBe(85);
    });
  });

  // ── evaluatePEPQuality ────────────────────────────────────────────────

  describe("evaluatePEPQuality", () => {
    it("returns 0 for no PEP records", () => {
      const result = evaluatePEPQuality([]);
      expect(result.overallScore).toBe(0);
      expect(result.totalPEPs).toBe(0);
      expect(result.currentRate).toBe(0);
      expect(result.childViewsRate).toBe(0);
      expect(result.smartTargetsRate).toBe(0);
      expect(result.virtualSchoolInvolvedRate).toBe(0);
      expect(result.ppFundingUsedRate).toBe(0);
    });

    it("scores well for demo data", () => {
      const result = evaluatePEPQuality(DEMO_PEPS);
      expect(result.overallScore).toBeGreaterThanOrEqual(3);
      expect(result.totalPEPs).toBe(3);
    });

    it("calculates current rate", () => {
      const result = evaluatePEPQuality(DEMO_PEPS);
      // 2 of 3 are current
      expect(result.currentRate).toBe(67);
    });

    it("calculates quality distribution", () => {
      const result = evaluatePEPQuality(DEMO_PEPS);
      expect(result.qualityDistribution.outstanding).toBe(1);
      expect(result.qualityDistribution.good).toBe(1);
      expect(result.qualityDistribution.requires_improvement).toBe(1);
      expect(result.qualityDistribution.inadequate).toBe(0);
    });

    it("calculates child views rate", () => {
      const result = evaluatePEPQuality(DEMO_PEPS);
      // 2 of 3 have child views
      expect(result.childViewsRate).toBe(67);
    });

    it("calculates SMART targets rate", () => {
      const result = evaluatePEPQuality(DEMO_PEPS);
      // 2 of 3
      expect(result.smartTargetsRate).toBe(67);
    });

    it("calculates virtual school involved rate", () => {
      const result = evaluatePEPQuality(DEMO_PEPS);
      // 2 of 3
      expect(result.virtualSchoolInvolvedRate).toBe(67);
    });

    it("calculates PP funding used rate", () => {
      const result = evaluatePEPQuality(DEMO_PEPS);
      // 2 of 3
      expect(result.ppFundingUsedRate).toBe(67);
    });

    it("scores high for perfect PEPs", () => {
      const peps = [
        makePEP({ id: "p1", status: "current", quality: "outstanding", childViewsIncluded: true, targetsSMART: true, virtualSchoolInvolved: true, ppFundingUsed: true }),
        makePEP({ id: "p2", childId: "child-jordan", status: "current", quality: "good", childViewsIncluded: true, targetsSMART: true, virtualSchoolInvolved: true, ppFundingUsed: true }),
      ];
      const result = evaluatePEPQuality(peps);
      expect(result.overallScore).toBeGreaterThanOrEqual(22);
      expect(result.currentRate).toBe(100);
      expect(result.childViewsRate).toBe(100);
      expect(result.smartTargetsRate).toBe(100);
    });

    it("scores low for poor PEPs", () => {
      const peps = [
        makePEP({ status: "overdue", quality: "inadequate", childViewsIncluded: false, targetsSMART: false, virtualSchoolInvolved: false, ppFundingUsed: false }),
      ];
      const result = evaluatePEPQuality(peps);
      expect(result.overallScore).toBeLessThan(5);
    });

    it("treats completed PEPs as current", () => {
      const peps = [makePEP({ status: "completed" })];
      const result = evaluatePEPQuality(peps);
      expect(result.currentRate).toBe(100);
    });

    it("handles mix of current and not_started", () => {
      const peps = [
        makePEP({ id: "p1", status: "current" }),
        makePEP({ id: "p2", childId: "child-b", status: "not_started" }),
      ];
      const result = evaluatePEPQuality(peps);
      expect(result.currentRate).toBe(50);
    });

    it("quality distribution sums to total", () => {
      const result = evaluatePEPQuality(DEMO_PEPS);
      const sum = result.qualityDistribution.outstanding +
        result.qualityDistribution.good +
        result.qualityDistribution.requires_improvement +
        result.qualityDistribution.inadequate;
      expect(sum).toBe(result.totalPEPs);
    });
  });

  // ── evaluateAcademicProgress ──────────────────────────────────────────

  describe("evaluateAcademicProgress", () => {
    it("returns 0 for no outcomes", () => {
      const result = evaluateAcademicProgress([]);
      expect(result.overallScore).toBe(0);
      expect(result.totalOutcomes).toBe(0);
      expect(result.exceedingExpectedRate).toBe(0);
      expect(result.belowExpectedRate).toBe(0);
      expect(result.subjectCoverage).toBe(0);
      expect(result.uniqueSubjects).toEqual([]);
    });

    it("scores well for demo data", () => {
      const result = evaluateAcademicProgress(DEMO_OUTCOMES);
      expect(result.overallScore).toBeGreaterThanOrEqual(10);
      expect(result.totalOutcomes).toBe(9);
    });

    it("calculates exceeding/expected rate", () => {
      const result = evaluateAcademicProgress(DEMO_OUTCOMES);
      // 7 of 9 are expected or exceeding (alex: 3 expected, jordan: 0, morgan: 2 exceeding + 2 expected)
      expect(result.exceedingExpectedRate).toBe(78);
    });

    it("calculates below expected rate", () => {
      const result = evaluateAcademicProgress(DEMO_OUTCOMES);
      // 2 of 9 below expected (Jordan)
      expect(result.belowExpectedRate).toBe(22);
    });

    it("counts unique subjects", () => {
      const result = evaluateAcademicProgress(DEMO_OUTCOMES);
      expect(result.subjectCoverage).toBe(4);
      expect(result.uniqueSubjects).toContain("english");
      expect(result.uniqueSubjects).toContain("maths");
      expect(result.uniqueSubjects).toContain("science");
      expect(result.uniqueSubjects).toContain("history");
    });

    it("scores high for all exceeding", () => {
      const outcomes = [
        makeOutcome({ id: "o1", subject: "English", progress: "exceeding" }),
        makeOutcome({ id: "o2", subject: "Maths", progress: "exceeding" }),
        makeOutcome({ id: "o3", subject: "Science", progress: "exceeding" }),
        makeOutcome({ id: "o4", subject: "History", progress: "exceeding" }),
        makeOutcome({ id: "o5", subject: "Geography", progress: "exceeding" }),
      ];
      const result = evaluateAcademicProgress(outcomes);
      expect(result.overallScore).toBeGreaterThanOrEqual(20);
      expect(result.exceedingExpectedRate).toBe(100);
      expect(result.belowExpectedRate).toBe(0);
    });

    it("scores low for all below expected", () => {
      const outcomes = [
        makeOutcome({ id: "o1", progress: "significantly_below" }),
        makeOutcome({ id: "o2", progress: "below_expected" }),
      ];
      const result = evaluateAcademicProgress(outcomes);
      expect(result.exceedingExpectedRate).toBe(0);
      expect(result.belowExpectedRate).toBe(100);
    });

    it("excludes not_assessed from calculations", () => {
      const outcomes = [
        makeOutcome({ id: "o1", progress: "expected" }),
        makeOutcome({ id: "o2", progress: "not_assessed" }),
      ];
      const result = evaluateAcademicProgress(outcomes);
      // Only 1 assessed outcome — expected
      expect(result.exceedingExpectedRate).toBe(100);
      expect(result.totalOutcomes).toBe(2);
    });

    it("handles all not_assessed outcomes", () => {
      const outcomes = [
        makeOutcome({ id: "o1", progress: "not_assessed" }),
        makeOutcome({ id: "o2", progress: "not_assessed" }),
      ];
      const result = evaluateAcademicProgress(outcomes);
      expect(result.exceedingExpectedRate).toBe(0);
      expect(result.totalOutcomes).toBe(2);
    });

    it("awards bonus for core subject exceeding", () => {
      const withCore = [
        makeOutcome({ id: "o1", subject: "English", progress: "exceeding" }),
        makeOutcome({ id: "o2", subject: "Maths", progress: "exceeding" }),
      ];
      const withoutCore = [
        makeOutcome({ id: "o1", subject: "Art", progress: "exceeding" }),
        makeOutcome({ id: "o2", subject: "Music", progress: "exceeding" }),
      ];
      const resultCore = evaluateAcademicProgress(withCore);
      const resultNoCore = evaluateAcademicProgress(withoutCore);
      expect(resultCore.overallScore).toBeGreaterThan(resultNoCore.overallScore);
    });

    it("counts subject coverage for scoring", () => {
      const fiveSubjects = [
        makeOutcome({ id: "o1", subject: "English", progress: "expected" }),
        makeOutcome({ id: "o2", subject: "Maths", progress: "expected" }),
        makeOutcome({ id: "o3", subject: "Science", progress: "expected" }),
        makeOutcome({ id: "o4", subject: "History", progress: "expected" }),
        makeOutcome({ id: "o5", subject: "Art", progress: "expected" }),
      ];
      const result = evaluateAcademicProgress(fiveSubjects);
      expect(result.subjectCoverage).toBe(5);
    });

    it("treats subjects case-insensitively for unique counting", () => {
      const outcomes = [
        makeOutcome({ id: "o1", subject: "English", progress: "expected" }),
        makeOutcome({ id: "o2", subject: "english", progress: "expected" }),
      ];
      const result = evaluateAcademicProgress(outcomes);
      expect(result.subjectCoverage).toBe(1);
    });

    it("handles predictedGrade and achievedGrade fields", () => {
      const outcomes = [
        makeOutcome({ id: "o1", progress: "expected", predictedGrade: "B", achievedGrade: "A" }),
      ];
      const result = evaluateAcademicProgress(outcomes);
      expect(result.totalOutcomes).toBe(1);
    });
  });

  // ── evaluateSchoolStability ───────────────────────────────────────────

  describe("evaluateSchoolStability", () => {
    it("returns 25 for no stability records (no data = stable)", () => {
      const result = evaluateSchoolStability([], []);
      expect(result.overallScore).toBe(25);
      expect(result.totalChildren).toBe(0);
      expect(result.totalDaysOutOfEducation).toBe(0);
      expect(result.totalSchoolChanges).toBe(0);
      expect(result.exclusionImpactDays).toBe(0);
    });

    it("scores well for demo data", () => {
      const result = evaluateSchoolStability(DEMO_STABILITY, DEMO_EXCLUSIONS);
      expect(result.overallScore).toBeGreaterThanOrEqual(10);
      expect(result.totalChildren).toBe(3);
    });

    it("calculates total days out of education", () => {
      const result = evaluateSchoolStability(DEMO_STABILITY, DEMO_EXCLUSIONS);
      expect(result.totalDaysOutOfEducation).toBe(5);
    });

    it("calculates average days out of education", () => {
      const result = evaluateSchoolStability(DEMO_STABILITY, DEMO_EXCLUSIONS);
      expect(result.averageDaysOutOfEducation).toBe(2); // 5/3 = 1.67 -> 2
    });

    it("counts school changes", () => {
      const result = evaluateSchoolStability(DEMO_STABILITY, DEMO_EXCLUSIONS);
      expect(result.totalSchoolChanges).toBe(1);
    });

    it("counts children with multiple changes", () => {
      const result = evaluateSchoolStability(DEMO_STABILITY, DEMO_EXCLUSIONS);
      // No child has > 1 change
      expect(result.childrenWithMultipleChanges).toBe(0);
    });

    it("counts exclusion impact days", () => {
      const result = evaluateSchoolStability(DEMO_STABILITY, DEMO_EXCLUSIONS);
      expect(result.exclusionImpactDays).toBe(3);
    });

    it("scores high for fully stable children", () => {
      const stability = [
        makeStability({ schoolChangesInYear: 0, daysOutOfEducation: 0 }),
        makeStability({ id: "s2", childId: "child-b", schoolChangesInYear: 0, daysOutOfEducation: 0 }),
      ];
      const result = evaluateSchoolStability(stability, []);
      expect(result.overallScore).toBeGreaterThanOrEqual(22);
    });

    it("penalises days out of education", () => {
      const stability = [
        makeStability({ daysOutOfEducation: 25 }),
      ];
      const result = evaluateSchoolStability(stability, []);
      expect(result.overallScore).toBeLessThan(20);
    });

    it("penalises school changes", () => {
      const stability = [
        makeStability({ schoolChangesInYear: 3 }),
      ];
      const result = evaluateSchoolStability(stability, []);
      expect(result.overallScore).toBeLessThan(20);
    });

    it("penalises multiple school changes per child", () => {
      const stability = [
        makeStability({ schoolChangesInYear: 2 }),
      ];
      const result = evaluateSchoolStability(stability, []);
      expect(result.childrenWithMultipleChanges).toBe(1);
    });

    it("heavily penalises permanent exclusions", () => {
      const exclusions = [
        makeExclusion({ exclusionType: "permanent", durationDays: 0 }),
      ];
      const result = evaluateSchoolStability(DEMO_STABILITY, exclusions);
      expect(result.overallScore).toBeLessThan(20);
    });

    it("penalises not in education", () => {
      const stability = [
        makeStability({ schoolType: "not_in_education", daysOutOfEducation: 30 }),
      ];
      const result = evaluateSchoolStability(stability, []);
      expect(result.notInEducationCount).toBe(1);
      expect(result.overallScore).toBeLessThan(15);
    });

    it("scores 0 minimum even with extreme penalties", () => {
      const stability = [
        makeStability({ schoolType: "not_in_education", schoolChangesInYear: 5, daysOutOfEducation: 50 }),
      ];
      const exclusions = [
        makeExclusion({ exclusionType: "permanent", durationDays: 30 }),
      ];
      const result = evaluateSchoolStability(stability, exclusions);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it("counts not in education children", () => {
      const stability = [
        makeStability({ id: "s1", childId: "c1", schoolType: "not_in_education" }),
        makeStability({ id: "s2", childId: "c2", schoolType: "mainstream" }),
        makeStability({ id: "s3", childId: "c3", schoolType: "not_in_education" }),
      ];
      const result = evaluateSchoolStability(stability, []);
      expect(result.notInEducationCount).toBe(2);
    });

    it("handles internal exclusions", () => {
      const exclusions = [
        makeExclusion({ exclusionType: "internal", durationDays: 2 }),
      ];
      const result = evaluateSchoolStability(DEMO_STABILITY, exclusions);
      expect(result.exclusionImpactDays).toBe(2);
    });
  });

  // ── buildChildEducationProfiles ───────────────────────────────────────

  describe("buildChildEducationProfiles", () => {
    it("builds profiles for all children", () => {
      const profiles = buildChildEducationProfiles(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
      );
      expect(profiles.length).toBe(3);
    });

    it("includes correct child names", () => {
      const profiles = buildChildEducationProfiles(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
      );
      const names = profiles.map((p) => p.childName).sort();
      expect(names).toEqual(["Alex", "Jordan", "Morgan"]);
    });

    it("calculates attendance rate per child", () => {
      const profiles = buildChildEducationProfiles(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
      );
      const alex = profiles.find((p) => p.childId === "child-alex")!;
      expect(alex.attendanceRate).toBe(95); // 19/20
    });

    it("includes PEP status per child", () => {
      const profiles = buildChildEducationProfiles(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
      );
      const alex = profiles.find((p) => p.childId === "child-alex")!;
      expect(alex.pepStatus).toBe("current");
      const jordan = profiles.find((p) => p.childId === "child-jordan")!;
      expect(jordan.pepStatus).toBe("overdue");
    });

    it("includes academic progress per child", () => {
      const profiles = buildChildEducationProfiles(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
      );
      const alex = profiles.find((p) => p.childId === "child-alex")!;
      expect(alex.academicProgress).toBe("expected");
      const jordan = profiles.find((p) => p.childId === "child-jordan")!;
      expect(jordan.academicProgress).toBe("below_expected");
    });

    it("includes school type per child", () => {
      const profiles = buildChildEducationProfiles(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
      );
      const jordan = profiles.find((p) => p.childId === "child-jordan")!;
      expect(jordan.schoolType).toBe("pupil_referral_unit");
    });

    it("includes days out of education per child", () => {
      const profiles = buildChildEducationProfiles(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
      );
      const jordan = profiles.find((p) => p.childId === "child-jordan")!;
      expect(jordan.daysOutOfEducation).toBe(5);
      const alex = profiles.find((p) => p.childId === "child-alex")!;
      expect(alex.daysOutOfEducation).toBe(0);
    });

    it("counts exclusions per child", () => {
      const profiles = buildChildEducationProfiles(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
      );
      const jordan = profiles.find((p) => p.childId === "child-jordan")!;
      expect(jordan.exclusionCount).toBe(1);
      const alex = profiles.find((p) => p.childId === "child-alex")!;
      expect(alex.exclusionCount).toBe(0);
    });

    it("scores profiles 0-10", () => {
      const profiles = buildChildEducationProfiles(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
      );
      for (const p of profiles) {
        expect(p.overallScore).toBeGreaterThanOrEqual(0);
        expect(p.overallScore).toBeLessThanOrEqual(10);
      }
    });

    it("Alex scores higher than Jordan", () => {
      const profiles = buildChildEducationProfiles(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
      );
      const alex = profiles.find((p) => p.childId === "child-alex")!;
      const jordan = profiles.find((p) => p.childId === "child-jordan")!;
      expect(alex.overallScore).toBeGreaterThan(jordan.overallScore);
    });

    it("Morgan scores highest (exceeding progress, good attendance, outstanding PEP)", () => {
      const profiles = buildChildEducationProfiles(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
      );
      const morgan = profiles.find((p) => p.childId === "child-morgan")!;
      const alex = profiles.find((p) => p.childId === "child-alex")!;
      expect(morgan.overallScore).toBeGreaterThanOrEqual(alex.overallScore);
    });

    it("returns empty for no data", () => {
      const profiles = buildChildEducationProfiles([], [], [], [], []);
      expect(profiles.length).toBe(0);
    });

    it("handles child with only attendance data", () => {
      const attendance = [makeAttendance({ childId: "child-only", childName: "OnlyAttendance" })];
      const profiles = buildChildEducationProfiles(attendance, [], [], [], []);
      expect(profiles.length).toBe(1);
      expect(profiles[0].pepStatus).toBe("none");
      expect(profiles[0].academicProgress).toBe("none");
      expect(profiles[0].schoolType).toBe("unknown");
    });

    it("handles child with only PEP data", () => {
      const peps = [makePEP({ childId: "child-only", childName: "OnlyPEP" })];
      const profiles = buildChildEducationProfiles([], peps, [], [], []);
      expect(profiles.length).toBe(1);
      expect(profiles[0].attendanceRate).toBe(0);
    });

    it("deduplicates children across data sources", () => {
      const attendance = [makeAttendance({ childId: "child-1", childName: "Child One" })];
      const peps = [makePEP({ childId: "child-1", childName: "Child One" })];
      const outcomes = [makeOutcome({ childId: "child-1", childName: "Child One" })];
      const profiles = buildChildEducationProfiles(attendance, peps, outcomes, [], []);
      expect(profiles.length).toBe(1);
    });
  });

  // ── Full Integration ──────────────────────────────────────────────────

  describe("generateEducationAchievementIntelligence", () => {
    it("produces valid output for Chamberlain House demo", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.homeId).toBe("oak-house");
      expect(result.periodStart).toBe(PERIOD_START);
      expect(result.periodEnd).toBe(PERIOD_END);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    });

    it("overall score is sum of 4 components", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      const expected = result.attendance.overallScore +
        result.pepQuality.overallScore +
        result.academicProgress.overallScore +
        result.schoolStability.overallScore;
      expect(result.overallScore).toBe(Math.min(expected, 100));
    });

    it("returns child profiles", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.childProfiles.length).toBe(3);
    });

    it("generates strengths", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.strengths.length).toBeGreaterThan(0);
    });

    it("generates areas for improvement", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.areasForImprovement.length).toBeGreaterThan(0);
    });

    it("generates actions", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.actions.length).toBeGreaterThan(0);
    });

    it("generates regulatory links", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.regulatoryLinks.length).toBeGreaterThanOrEqual(8);
      expect(result.regulatoryLinks.some((l) => l.includes("Reg 8"))).toBe(true);
      expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 28"))).toBe(true);
      expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 29"))).toBe(true);
      expect(result.regulatoryLinks.some((l) => l.includes("NMS 8"))).toBe(true);
      expect(result.regulatoryLinks.some((l) => l.includes("SEND Code of Practice"))).toBe(true);
      expect(result.regulatoryLinks.some((l) => l.includes("Virtual School Head"))).toBe(true);
      expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
      expect(result.regulatoryLinks.some((l) => l.includes("DfE"))).toBe(true);
    });

    // Edge cases

    it("handles all empty data", () => {
      const result = generateEducationAchievementIntelligence(
        [], [], [], [], [], "empty", PERIOD_START, PERIOD_END,
      );
      // Attendance=0, PEP=0, Academic=0, Stability=25 (no data = stable)
      expect(result.overallScore).toBe(25);
      expect(result.rating).toBe("inadequate");
      expect(result.childProfiles.length).toBe(0);
    });

    it("generates urgent actions for empty data", () => {
      const result = generateEducationAchievementIntelligence(
        [], [], [], [], [], "empty", PERIOD_START, PERIOD_END,
      );
      expect(result.actions.length).toBeGreaterThan(0);
      expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
    });

    it("clamped to 100", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it("demo data produces reasonable rating", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      // Demo data has mixed quality (Jordan has issues), so should be good or requires_improvement
      expect(["outstanding", "good", "requires_improvement"]).toContain(result.rating);
    });

    it("detects persistent absence area for improvement", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.areasForImprovement).toEqual(
        expect.arrayContaining([expect.stringContaining("persistent absence")]),
      );
    });

    it("detects PEP currency area for improvement", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.areasForImprovement).toEqual(
        expect.arrayContaining([expect.stringContaining("PEPs are current")]),
      );
    });

    it("detects exclusion impact area", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.areasForImprovement).toEqual(
        expect.arrayContaining([expect.stringContaining("exclusion")]),
      );
    });

    it("detects days out of education area", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.areasForImprovement).toEqual(
        expect.arrayContaining([expect.stringContaining("days out of education")]),
      );
    });

    it("generates attendance improvement action for persistent absence", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.actions).toEqual(
        expect.arrayContaining([expect.stringContaining("attendance improvement")]),
      );
    });

    it("generates PEP review action when overdue", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.actions).toEqual(
        expect.arrayContaining([expect.stringContaining("overdue PEP")]),
      );
    });

    it("generates child views action when not 100%", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.actions).toEqual(
        expect.arrayContaining([expect.stringContaining("contribute to their PEP")]),
      );
    });

    it("strength for good attendance when above 90%", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.strengths).toEqual(
        expect.arrayContaining([expect.stringContaining("attendance")]),
      );
    });

    it("strength for good academic progress", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.strengths).toEqual(
        expect.arrayContaining([expect.stringContaining("academic progress")]),
      );
    });

    it("strength for all children in education", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.strengths).toEqual(
        expect.arrayContaining([expect.stringContaining("NEET")]),
      );
    });

    it("includes attendance result in output", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.attendance).toBeDefined();
      expect(result.attendance.totalRecords).toBe(65);
    });

    it("includes PEP quality result in output", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.pepQuality).toBeDefined();
      expect(result.pepQuality.totalPEPs).toBe(3);
    });

    it("includes academic progress result in output", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.academicProgress).toBeDefined();
      expect(result.academicProgress.totalOutcomes).toBe(9);
    });

    it("includes school stability result in output", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.schoolStability).toBeDefined();
      expect(result.schoolStability.totalChildren).toBe(3);
    });

    it("handles only attendance data", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, [], [], [], [],
        "partial", PERIOD_START, PERIOD_END,
      );
      expect(result.attendance.overallScore).toBeGreaterThan(0);
      expect(result.pepQuality.overallScore).toBe(0);
      expect(result.academicProgress.overallScore).toBe(0);
      expect(result.schoolStability.overallScore).toBe(25);
    });

    it("handles only PEP data", () => {
      const result = generateEducationAchievementIntelligence(
        [], DEMO_PEPS, [], [], [],
        "partial", PERIOD_START, PERIOD_END,
      );
      expect(result.attendance.overallScore).toBe(0);
      expect(result.pepQuality.overallScore).toBeGreaterThan(0);
    });

    it("handles only academic data", () => {
      const result = generateEducationAchievementIntelligence(
        [], [], DEMO_OUTCOMES, [], [],
        "partial", PERIOD_START, PERIOD_END,
      );
      expect(result.academicProgress.overallScore).toBeGreaterThan(0);
    });

    it("NEET children trigger urgent action", () => {
      const stability = [
        makeStability({ schoolType: "not_in_education", daysOutOfEducation: 20 }),
      ];
      const result = generateEducationAchievementIntelligence(
        [], [], [], stability, [],
        "neet-test", PERIOD_START, PERIOD_END,
      );
      expect(result.actions).toEqual(
        expect.arrayContaining([expect.stringContaining("URGENT")]),
      );
      expect(result.areasForImprovement).toEqual(
        expect.arrayContaining([expect.stringContaining("not in education")]),
      );
    });

    it("no attendance records triggers area for improvement", () => {
      const result = generateEducationAchievementIntelligence(
        [], DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.areasForImprovement).toEqual(
        expect.arrayContaining([expect.stringContaining("No attendance records")]),
      );
    });

    it("no PEP records triggers area for improvement", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, [], DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.areasForImprovement).toEqual(
        expect.arrayContaining([expect.stringContaining("No PEP records")]),
      );
    });

    it("PP funding action when usage low", () => {
      const result = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, DEMO_PEPS, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      // Jordan's PEP has ppFundingUsed: false, so rate is 67% > 50%, no action
      // But let's test with low PP funding
      const lowPPPeps = [
        makePEP({ id: "p1", ppFundingUsed: false }),
        makePEP({ id: "p2", childId: "child-b", ppFundingUsed: false }),
        makePEP({ id: "p3", childId: "child-c", ppFundingUsed: false }),
      ];
      const result2 = generateEducationAchievementIntelligence(
        DEMO_ATTENDANCE, lowPPPeps, DEMO_OUTCOMES, DEMO_STABILITY, DEMO_EXCLUSIONS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result2.actions).toEqual(
        expect.arrayContaining([expect.stringContaining("Pupil Premium Plus")]),
      );
    });
  });
});
