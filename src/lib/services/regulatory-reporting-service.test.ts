import { describe, it, expect } from "vitest";
import {
  generateReportSections,
  computeReportProgress,
  computeReportingSchedule,
  computeReportingCompliance,
  calculateNextDueDate,
  REG44_SECTIONS,
  REG45_SECTIONS,
  type ReportSection,
} from "./regulatory-reporting-service";

function makeSection(overrides: Partial<ReportSection> = {}): ReportSection {
  return {
    id: "sec-1",
    title: "Test Section",
    guidance: "Guidance text",
    content: "",
    regulation_ref: "Reg X",
    completed: false,
    reviewed_by: null,
    reviewed_at: null,
    ...overrides,
  };
}

describe("generateReportSections", () => {
  it("generates reg44 sections with correct count", () => {
    const sections = generateReportSections("reg44");
    expect(sections.length).toBe(REG44_SECTIONS.length);
    expect(sections.every((s) => s.content === "")).toBe(true);
    expect(sections.every((s) => s.completed === false)).toBe(true);
  });

  it("generates reg45 sections with correct count", () => {
    const sections = generateReportSections("reg45");
    expect(sections.length).toBe(REG45_SECTIONS.length);
  });

  it("returns empty array for unknown report type", () => {
    const sections = generateReportSections("annual_review");
    expect(sections).toEqual([]);
  });
});

describe("computeReportProgress", () => {
  it("returns zeroes for empty sections", () => {
    const p = computeReportProgress([]);
    expect(p.total_sections).toBe(0);
    expect(p.completed_sections).toBe(0);
    expect(p.reviewed_sections).toBe(0);
    expect(p.progress_percentage).toBeNull();
    expect(p.review_percentage).toBeNull();
    expect(p.ready_for_submission).toBe(false);
  });

  it("calculates percentages correctly", () => {
    const sections = [
      makeSection({ completed: true, reviewed_by: "Rev A" }),
      makeSection({ id: "s2", completed: true, reviewed_by: null }),
      makeSection({ id: "s3", completed: false, reviewed_by: null }),
      makeSection({ id: "s4", completed: false, reviewed_by: null }),
    ];
    const p = computeReportProgress(sections);
    expect(p.total_sections).toBe(4);
    expect(p.completed_sections).toBe(2);
    expect(p.reviewed_sections).toBe(1);
    expect(p.progress_percentage).toBe(50);
    expect(p.review_percentage).toBe(25);
    expect(p.ready_for_submission).toBe(false);
  });

  it("ready_for_submission true when all completed and reviewed", () => {
    const sections = [
      makeSection({ completed: true, reviewed_by: "Rev A" }),
      makeSection({ id: "s2", completed: true, reviewed_by: "Rev B" }),
    ];
    const p = computeReportProgress(sections);
    expect(p.ready_for_submission).toBe(true);
  });
});

describe("computeReportingSchedule", () => {
  const now = new Date("2025-06-15T00:00:00Z");

  it("handles empty reports", () => {
    const s = computeReportingSchedule([], now);
    expect(s.upcoming).toEqual([]);
    expect(s.overdue).toEqual([]);
    expect(s.last_submitted).toEqual({});
  });

  it("classifies upcoming and overdue", () => {
    const reports = [
      { report_type: "reg44" as const, submitted_date: "2025-06-01", next_due_date: "2025-07-01" },
      { report_type: "reg45" as const, submitted_date: "2025-01-01", next_due_date: "2025-05-01" },
    ];
    const s = computeReportingSchedule(reports, now);
    expect(s.upcoming.length).toBe(1);
    expect(s.upcoming[0].report_type).toBe("reg44");
    expect(s.overdue.length).toBe(1);
    expect(s.overdue[0].report_type).toBe("reg45");
  });

  it("tracks last submitted per type", () => {
    const reports = [
      { report_type: "reg44" as const, submitted_date: "2025-03-01", next_due_date: null },
      { report_type: "reg44" as const, submitted_date: "2025-06-01", next_due_date: null },
    ];
    const s = computeReportingSchedule(reports, now);
    expect(s.last_submitted.reg44).toBe("2025-06-01");
  });
});

describe("computeReportingCompliance", () => {
  const now = new Date("2025-06-15T00:00:00Z");

  it("returns non_compliant with no reports", () => {
    const c = computeReportingCompliance([], now);
    expect(c.reg44_compliant).toBe(false);
    expect(c.reg45_compliant).toBe(false);
    expect(c.compliance_rating).toBe("non_compliant");
  });

  it("reg45 compliant when at least 1 in last 6 months", () => {
    const reports = [
      { report_type: "reg45" as const, submitted_date: "2025-05-01", status: "submitted" as const },
    ];
    const c = computeReportingCompliance(reports, now);
    expect(c.reg45_compliant).toBe(true);
    expect(c.reg45_count_12_months).toBe(1);
  });

  it("partially compliant when only one reg is met", () => {
    const reports = [
      { report_type: "reg45" as const, submitted_date: "2025-04-01", status: "submitted" as const },
    ];
    const c = computeReportingCompliance(reports, now);
    expect(c.compliance_rating).toBe("partially_compliant");
  });
});

describe("calculateNextDueDate", () => {
  it("reg44 is +28 days", () => {
    const result = calculateNextDueDate("reg44", new Date("2025-06-01"));
    expect(result.toISOString().split("T")[0]).toBe("2025-06-29");
  });

  it("reg45 is +6 months", () => {
    const result = calculateNextDueDate("reg45", new Date("2025-06-01"));
    expect(result.toISOString().split("T")[0]).toBe("2025-12-01");
  });

  it("annual_review is +1 year", () => {
    const result = calculateNextDueDate("annual_review", new Date("2025-06-01"));
    expect(result.toISOString().split("T")[0]).toBe("2026-06-01");
  });

  it("default types get +3 months", () => {
    const result = calculateNextDueDate("serious_incident", new Date("2025-06-01"));
    expect(result.toISOString().split("T")[0]).toBe("2025-09-01");
  });
});
