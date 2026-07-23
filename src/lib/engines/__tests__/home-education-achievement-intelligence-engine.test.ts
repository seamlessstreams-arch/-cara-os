// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME EDUCATION ACHIEVEMENT INTELLIGENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeEducation,
  type HomeEducationInput,
  type EducationRecordInput,
} from "../home-education-achievement-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<EducationRecordInput> = {}): EducationRecordInput {
  return {
    id: "edu_1",
    child_id: "yp_alex",
    date: "2026-05-20",
    record_type: "attendance",
    attendance_status: "present",
    linked_pep: false,
    has_outcome: false,
    has_follow_up: false,
    status: "open",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeEducationInput> = {}): HomeEducationInput {
  return {
    today: "2026-05-26",
    total_children: 3,
    child_ids: ["yp_alex", "yp_jordan", "yp_casey"],
    education_records: [
      // Attendance records
      makeRecord({ id: "edu_1", child_id: "yp_alex", date: "2026-05-20", record_type: "attendance", attendance_status: "present" }),
      makeRecord({ id: "edu_2", child_id: "yp_jordan", date: "2026-05-20", record_type: "attendance", attendance_status: "present" }),
      makeRecord({ id: "edu_3", child_id: "yp_casey", date: "2026-05-20", record_type: "attendance", attendance_status: "present" }),
      makeRecord({ id: "edu_4", child_id: "yp_alex", date: "2026-05-19", record_type: "attendance", attendance_status: "present" }),
      makeRecord({ id: "edu_5", child_id: "yp_jordan", date: "2026-05-19", record_type: "attendance", attendance_status: "present" }),
      // PEP meetings
      makeRecord({ id: "edu_6", child_id: "yp_alex", date: "2026-05-15", record_type: "pep_meeting", attendance_status: null, linked_pep: true, has_outcome: true }),
      makeRecord({ id: "edu_7", child_id: "yp_jordan", date: "2026-05-10", record_type: "pep_meeting", attendance_status: null, linked_pep: true, has_outcome: true }),
      makeRecord({ id: "edu_8", child_id: "yp_casey", date: "2026-05-08", record_type: "pep_meeting", attendance_status: null, linked_pep: true, has_outcome: true }),
      // Achievements
      makeRecord({ id: "edu_9", child_id: "yp_casey", date: "2026-05-05", record_type: "achievement", attendance_status: null, has_outcome: true }),
      makeRecord({ id: "edu_10", child_id: "yp_jordan", date: "2026-05-04", record_type: "achievement", attendance_status: null, has_outcome: true }),
      // Attainment
      makeRecord({ id: "edu_11", child_id: "yp_casey", date: "2026-05-03", record_type: "attainment", attendance_status: null, linked_pep: true, has_outcome: true }),
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Home Education Achievement Intelligence Engine", () => {

  // ── Insufficient Data ────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data with fewer than 3 records", () => {
      const r = computeHomeEducation({ today: "2026-05-26", total_children: 3, child_ids: ["yp_alex"], education_records: [makeRecord(), makeRecord({ id: "edu_2" })] });
      expect(r.education_rating).toBe("insufficient_data");
      expect(r.education_score).toBe(0);
    });

    it("returns insufficient_data with no records", () => {
      const r = computeHomeEducation({ today: "2026-05-26", total_children: 3, child_ids: [], education_records: [] });
      expect(r.education_rating).toBe("insufficient_data");
    });

    it("provides recommendation when insufficient data", () => {
      const r = computeHomeEducation({ today: "2026-05-26", total_children: 3, child_ids: [], education_records: [] });
      expect(r.recommendations.length).toBe(1);
      expect(r.recommendations[0].regulatory_ref).toContain("Reg 8");
    });

    it("returns empty profiles", () => {
      const r = computeHomeEducation({ today: "2026-05-26", total_children: 3, child_ids: [], education_records: [] });
      expect(r.attendance.total_attendance_records_30d).toBe(0);
      expect(r.pep.total_pep_meetings_90d).toBe(0);
      expect(r.achievements.achievements_90d).toBe(0);
    });
  });

  // ── Rating Thresholds ────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("awards outstanding for excellent education data", () => {
      const r = computeHomeEducation(baseInput());
      expect(r.education_score).toBeGreaterThanOrEqual(80);
      expect(r.education_rating).toBe("outstanding");
    });

    it("awards good for decent education data with minor gaps", () => {
      const records = [
        makeRecord({ id: "edu_1", child_id: "yp_alex", date: "2026-05-20", attendance_status: "present" }),
        makeRecord({ id: "edu_2", child_id: "yp_jordan", date: "2026-05-20", attendance_status: "present" }),
        makeRecord({ id: "edu_3", child_id: "yp_casey", date: "2026-05-20", attendance_status: "late" }),
        makeRecord({ id: "edu_4", child_id: "yp_alex", date: "2026-05-15", record_type: "pep_meeting", attendance_status: null, linked_pep: true, has_outcome: true }),
        makeRecord({ id: "edu_5", child_id: "yp_jordan", date: "2026-05-10", record_type: "pep_meeting", attendance_status: null, linked_pep: true, has_outcome: true }),
        makeRecord({ id: "edu_6", child_id: "yp_casey", date: "2026-05-05", record_type: "achievement", attendance_status: null }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.education_score).toBeGreaterThanOrEqual(65);
      expect(r.education_score).toBeLessThan(80);
      expect(r.education_rating).toBe("good");
    });

    it("awards inadequate for poor attendance and no PEPs", () => {
      const records = [
        makeRecord({ id: "edu_1", child_id: "yp_alex", date: "2026-05-20", attendance_status: "absent" }),
        makeRecord({ id: "edu_2", child_id: "yp_jordan", date: "2026-05-20", attendance_status: "excluded" }),
        makeRecord({ id: "edu_3", child_id: "yp_casey", date: "2026-05-20", attendance_status: "absent" }),
        makeRecord({ id: "edu_4", child_id: "yp_alex", date: "2026-05-15", attendance_status: "absent" }),
        makeRecord({ id: "edu_5", child_id: "yp_alex", date: "2026-05-10", record_type: "exclusion", attendance_status: "excluded" }),
        makeRecord({ id: "edu_6", child_id: "yp_jordan", date: "2026-05-08", record_type: "exclusion", attendance_status: "excluded" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.education_score).toBeLessThan(45);
      expect(r.education_rating).toBe("inadequate");
    });
  });

  // ── Attendance Profile ───────────────────────────────────────────────

  describe("attendance profile", () => {
    it("counts attendance records within 30d", () => {
      const r = computeHomeEducation(baseInput());
      expect(r.attendance.total_attendance_records_30d).toBe(5);
      expect(r.attendance.present_count).toBe(5);
    });

    it("separates present, absent, late, excluded", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "present" }),
        makeRecord({ id: "edu_2", date: "2026-05-19", attendance_status: "absent" }),
        makeRecord({ id: "edu_3", date: "2026-05-18", attendance_status: "late" }),
        makeRecord({ id: "edu_4", date: "2026-05-17", attendance_status: "excluded" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.attendance.present_count).toBe(1);
      expect(r.attendance.absent_count).toBe(1);
      expect(r.attendance.late_count).toBe(1);
      expect(r.attendance.excluded_count).toBe(1);
    });

    it("calculates attendance rate (present + late / total)", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "present" }),
        makeRecord({ id: "edu_2", date: "2026-05-19", attendance_status: "late" }),
        makeRecord({ id: "edu_3", date: "2026-05-18", attendance_status: "absent" }),
        makeRecord({ id: "edu_4", date: "2026-05-17", attendance_status: "absent" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      // 2/4 = 50%
      expect(r.attendance.attendance_rate).toBe(50);
    });

    it("calculates punctuality rate (on time of non-excluded)", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "present" }),
        makeRecord({ id: "edu_2", date: "2026-05-19", attendance_status: "late" }),
        makeRecord({ id: "edu_3", date: "2026-05-18", attendance_status: "present" }),
        makeRecord({ id: "edu_4", date: "2026-05-17", attendance_status: "excluded" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      // 2/3 non-excluded = 67%
      expect(r.attendance.punctuality_rate).toBe(67);
    });

    it("counts exclusions in 90d", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "present" }),
        makeRecord({ id: "edu_2", date: "2026-05-15", record_type: "exclusion", attendance_status: "excluded", child_id: "yp_alex" }),
        makeRecord({ id: "edu_3", date: "2026-04-01", record_type: "exclusion", attendance_status: "excluded", child_id: "yp_jordan" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.attendance.exclusion_count_90d).toBe(2);
      expect(r.attendance.children_with_exclusions_90d).toContain("yp_alex");
      expect(r.attendance.children_with_exclusions_90d).toContain("yp_jordan");
    });

    it("excludes records outside 30d from attendance counts", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "present" }),
        makeRecord({ id: "edu_2", date: "2026-04-01", attendance_status: "absent" }),
        makeRecord({ id: "edu_3", date: "2026-03-01", attendance_status: "present" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.attendance.total_attendance_records_30d).toBe(1);
    });
  });

  // ── PEP Profile ──────────────────────────────────────────────────────

  describe("pep profile", () => {
    it("counts PEP meetings in 90d", () => {
      const r = computeHomeEducation(baseInput());
      expect(r.pep.total_pep_meetings_90d).toBeGreaterThanOrEqual(3);
    });

    it("identifies children with and without PEPs", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "present" }),
        makeRecord({ id: "edu_2", date: "2026-05-15", child_id: "yp_alex", record_type: "pep_meeting", attendance_status: null, linked_pep: true }),
        makeRecord({ id: "edu_3", date: "2026-05-10", child_id: "yp_jordan", record_type: "pep_meeting", attendance_status: null, linked_pep: true }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.pep.children_with_pep_90d).toContain("yp_alex");
      expect(r.pep.children_with_pep_90d).toContain("yp_jordan");
      expect(r.pep.children_without_pep_90d).toContain("yp_casey");
    });

    it("counts linked_pep records as PEP evidence", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "present" }),
        makeRecord({ id: "edu_2", date: "2026-05-15", child_id: "yp_alex", record_type: "attainment", attendance_status: null, linked_pep: true }),
        makeRecord({ id: "edu_3", date: "2026-05-10", child_id: "yp_alex", record_type: "attendance", attendance_status: "present" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.pep.children_with_pep_90d).toContain("yp_alex");
    });

    it("calculates PEP per child", () => {
      const r = computeHomeEducation(baseInput());
      // 4 PEP records (3 pep_meeting + 1 attainment linked_pep) / 3 children
      expect(r.pep.pep_per_child).toBeGreaterThan(0);
    });
  });

  // ── Achievement Profile ──────────────────────────────────────────────

  describe("achievement profile", () => {
    it("counts achievements in 90d", () => {
      const r = computeHomeEducation(baseInput());
      expect(r.achievements.achievements_90d).toBe(2);
    });

    it("counts attainment records in 90d", () => {
      const r = computeHomeEducation(baseInput());
      expect(r.achievements.attainment_records_90d).toBe(1);
    });

    it("counts concerns and resolution rate", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "present" }),
        makeRecord({ id: "edu_2", date: "2026-05-15", record_type: "concern", attendance_status: null, status: "resolved" }),
        makeRecord({ id: "edu_3", date: "2026-05-10", record_type: "concern", attendance_status: null, status: "open" }),
        makeRecord({ id: "edu_4", date: "2026-05-08", record_type: "concern", attendance_status: null, status: "monitoring" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.achievements.concerns_90d).toBe(3);
      // 2 of 3 resolved/monitoring
      expect(r.achievements.concern_resolution_rate).toBe(67);
    });

    it("leaves the resolution rate unmeasured when no concerns", () => {
      const r = computeHomeEducation(baseInput());
      expect(r.achievements.concern_resolution_rate).toBeNull();
    });
  });

  // ── Scoring ──────────────────────────────────────────────────────────

  describe("scoring", () => {
    it("rewards high attendance", () => {
      const good = baseInput();
      const poor = baseInput({
        education_records: [
          makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "absent" }),
          makeRecord({ id: "edu_2", date: "2026-05-19", attendance_status: "absent" }),
          makeRecord({ id: "edu_3", date: "2026-05-18", attendance_status: "absent" }),
          makeRecord({ id: "edu_4", date: "2026-05-15", record_type: "pep_meeting", attendance_status: null, linked_pep: true }),
        ],
      });
      expect(computeHomeEducation(good).education_score).toBeGreaterThan(computeHomeEducation(poor).education_score);
    });

    it("penalises exclusions", () => {
      const noExcl = baseInput();
      const withExcl = baseInput({
        education_records: [
          ...baseInput().education_records,
          makeRecord({ id: "edu_x1", date: "2026-05-10", record_type: "exclusion", attendance_status: "excluded" }),
          makeRecord({ id: "edu_x2", date: "2026-05-05", record_type: "exclusion", attendance_status: "excluded" }),
        ],
      });
      expect(computeHomeEducation(noExcl).education_score).toBeGreaterThan(computeHomeEducation(withExcl).education_score);
    });

    it("rewards PEP coverage", () => {
      const full = baseInput();
      const partial = baseInput({
        education_records: baseInput().education_records.filter(r => r.record_type !== "pep_meeting" || r.child_id !== "yp_casey"),
      });
      expect(computeHomeEducation(full).education_score).toBeGreaterThanOrEqual(computeHomeEducation(partial).education_score);
    });

    it("rewards achievements", () => {
      const with_ = baseInput();
      const without = baseInput({
        education_records: baseInput().education_records.filter(r => r.record_type !== "achievement"),
      });
      expect(computeHomeEducation(with_).education_score).toBeGreaterThan(computeHomeEducation(without).education_score);
    });

    it("clamps score to 0-100", () => {
      const r = computeHomeEducation(baseInput());
      expect(r.education_score).toBeGreaterThanOrEqual(0);
      expect(r.education_score).toBeLessThanOrEqual(100);
    });
  });

  // ── Strengths ────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("identifies high attendance as a strength", () => {
      const r = computeHomeEducation(baseInput());
      expect(r.strengths.some(s => s.includes("attendance"))).toBe(true);
    });

    it("identifies zero exclusions as a strength", () => {
      const r = computeHomeEducation(baseInput());
      expect(r.strengths.some(s => s.includes("exclusion"))).toBe(true);
    });

    it("identifies PEP coverage as a strength", () => {
      const r = computeHomeEducation(baseInput());
      expect(r.strengths.some(s => s.includes("PEP"))).toBe(true);
    });

    it("identifies achievements as a strength", () => {
      const r = computeHomeEducation(baseInput());
      expect(r.strengths.some(s => s.includes("achievement"))).toBe(true);
    });
  });

  // ── Concerns ─────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags low attendance", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "absent" }),
        makeRecord({ id: "edu_2", date: "2026-05-19", attendance_status: "absent" }),
        makeRecord({ id: "edu_3", date: "2026-05-18", attendance_status: "present" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.concerns.some(c => c.includes("Attendance rate") || c.includes("absence"))).toBe(true);
    });

    it("flags exclusions", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "present" }),
        makeRecord({ id: "edu_2", date: "2026-05-15", record_type: "exclusion", attendance_status: "excluded" }),
        makeRecord({ id: "edu_3", date: "2026-05-10", record_type: "exclusion", attendance_status: "excluded" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.concerns.some(c => c.includes("exclusion"))).toBe(true);
    });

    it("flags missing PEPs", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "present" }),
        makeRecord({ id: "edu_2", date: "2026-05-15", child_id: "yp_alex", record_type: "pep_meeting", attendance_status: null, linked_pep: true }),
        makeRecord({ id: "edu_3", date: "2026-05-10", attendance_status: "present" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.concerns.some(c => c.includes("PEP"))).toBe(true);
    });
  });

  // ── Recommendations ──────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends attendance improvement when low", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "absent" }),
        makeRecord({ id: "edu_2", date: "2026-05-19", attendance_status: "absent" }),
        makeRecord({ id: "edu_3", date: "2026-05-18", attendance_status: "present" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("attendance"))).toBe(true);
    });

    it("recommends PEP scheduling when children missing", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "present" }),
        makeRecord({ id: "edu_2", date: "2026-05-15", child_id: "yp_alex", record_type: "pep_meeting", attendance_status: null, linked_pep: true }),
        makeRecord({ id: "edu_3", date: "2026-05-10", attendance_status: "present" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("PEP"))).toBe(true);
    });

    it("includes regulatory references", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "absent" }),
        makeRecord({ id: "edu_2", date: "2026-05-19", attendance_status: "absent" }),
        makeRecord({ id: "edu_3", date: "2026-05-18", attendance_status: "absent" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.recommendations.every(rec => rec.regulatory_ref.length > 0)).toBe(true);
    });
  });

  // ── Insights ─────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates critical insight for very low attendance", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "absent" }),
        makeRecord({ id: "edu_2", date: "2026-05-19", attendance_status: "absent" }),
        makeRecord({ id: "edu_3", date: "2026-05-18", attendance_status: "absent" }),
        makeRecord({ id: "edu_4", date: "2026-05-17", attendance_status: "present" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("attendance"))).toBe(true);
    });

    it("generates critical insight for multiple exclusions", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "present" }),
        makeRecord({ id: "edu_2", date: "2026-05-15", record_type: "exclusion", attendance_status: "excluded" }),
        makeRecord({ id: "edu_3", date: "2026-05-10", record_type: "exclusion", attendance_status: "excluded" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("exclusion"))).toBe(true);
    });

    it("generates positive insight for excellent education", () => {
      const r = computeHomeEducation(baseInput());
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });

    it("generates critical insight for missing PEPs", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "present" }),
        makeRecord({ id: "edu_2", date: "2026-05-19", attendance_status: "present" }),
        makeRecord({ id: "edu_3", date: "2026-05-18", attendance_status: "present" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("PEP"))).toBe(true);
    });
  });

  // ── Headlines ────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("provides outstanding headline", () => {
      const r = computeHomeEducation(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("provides inadequate headline", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", attendance_status: "absent" }),
        makeRecord({ id: "edu_2", date: "2026-05-15", record_type: "exclusion", attendance_status: "excluded" }),
        makeRecord({ id: "edu_3", date: "2026-05-10", record_type: "exclusion", attendance_status: "excluded" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── Edge Cases ───────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles records with null attendance_status", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20", record_type: "pep_meeting", attendance_status: null, linked_pep: true }),
        makeRecord({ id: "edu_2", date: "2026-05-15", record_type: "achievement", attendance_status: null }),
        makeRecord({ id: "edu_3", date: "2026-05-10", record_type: "concern", attendance_status: null }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.attendance.total_attendance_records_30d).toBe(0);
    });

    it("handles all records outside 90d window", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-01-01" }),
        makeRecord({ id: "edu_2", date: "2026-01-15" }),
        makeRecord({ id: "edu_3", date: "2026-01-20" }),
      ];
      const r = computeHomeEducation(baseInput({ education_records: records }));
      expect(r.attendance.total_attendance_records_30d).toBe(0);
      expect(r.pep.total_pep_meetings_90d).toBe(0);
    });

    it("handles zero total children", () => {
      const records = [
        makeRecord({ id: "edu_1", date: "2026-05-20" }),
        makeRecord({ id: "edu_2", date: "2026-05-19" }),
        makeRecord({ id: "edu_3", date: "2026-05-18" }),
      ];
      const r = computeHomeEducation(baseInput({ total_children: 0, child_ids: [], education_records: records }));
      expect(r.pep.pep_per_child).toBeNull();
    });
  });
});
