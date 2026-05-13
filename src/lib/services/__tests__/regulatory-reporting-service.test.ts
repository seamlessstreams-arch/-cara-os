// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — REGULATORY REPORTING SERVICE TESTS
// Pure-function tests for report generation, progress computation,
// reporting schedule, and compliance calculations.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../regulatory-reporting-service";

const {
  REG44_SECTIONS,
  REG45_SECTIONS,
  generateReportSections,
  computeReportProgress,
  computeReportingSchedule,
  computeReportingCompliance,
  calculateNextDueDate,
} = _testing;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Fixed "now" for deterministic date tests. */
const NOW = new Date("2026-06-01T00:00:00Z");

/** Build a minimal ReportSection. */
function section(
  id: string,
  completed: boolean,
  reviewedBy: string | null = null,
) {
  return {
    id,
    title: id,
    guidance: "",
    content: completed ? "some content" : "",
    regulation_ref: "",
    completed,
    reviewed_by: reviewedBy,
    reviewed_at: reviewedBy ? "2026-05-01T00:00:00Z" : null,
  };
}

/** Build a minimal report record for schedule tests. */
function scheduleReport(
  report_type: "reg44" | "reg45",
  submitted_date: string | null,
  next_due_date: string | null,
) {
  return { report_type, submitted_date, next_due_date } as {
    report_type: "reg44" | "reg45";
    submitted_date: string | null;
    next_due_date: string | null;
  };
}

/** Build a minimal report record for compliance tests. */
function complianceReport(
  report_type: "reg44" | "reg45",
  submitted_date: string | null,
  status: "submitted" | "draft" | "in_progress" = "submitted",
) {
  return { report_type, submitted_date, status } as {
    report_type: "reg44" | "reg45";
    submitted_date: string | null;
    status: "submitted" | "draft";
  };
}

// ── REG44_SECTIONS constant ────────────────────────────────────────────────

describe("REG44_SECTIONS", () => {
  it("has exactly 12 entries", () => {
    expect(REG44_SECTIONS).toHaveLength(12);
  });

  it("each entry has id, title, guidance, and regulation_ref", () => {
    for (const s of REG44_SECTIONS) {
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("title");
      expect(s).toHaveProperty("guidance");
      expect(s).toHaveProperty("regulation_ref");
      expect(typeof s.id).toBe("string");
      expect(typeof s.title).toBe("string");
      expect(typeof s.guidance).toBe("string");
      expect(typeof s.regulation_ref).toBe("string");
      expect(s.id.length).toBeGreaterThan(0);
      expect(s.title.length).toBeGreaterThan(0);
    }
  });

  it("all entries have unique ids", () => {
    const ids = REG44_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all regulation references cite CHR2015 Reg 44", () => {
    for (const s of REG44_SECTIONS) {
      expect(s.regulation_ref).toMatch(/CHR2015 Reg 44/);
    }
  });
});

// ── REG45_SECTIONS constant ────────────────────────────────────────────────

describe("REG45_SECTIONS", () => {
  it("has exactly 10 entries", () => {
    expect(REG45_SECTIONS).toHaveLength(10);
  });

  it("each entry has id, title, guidance, and regulation_ref", () => {
    for (const s of REG45_SECTIONS) {
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("title");
      expect(s).toHaveProperty("guidance");
      expect(s).toHaveProperty("regulation_ref");
      expect(typeof s.id).toBe("string");
      expect(typeof s.title).toBe("string");
      expect(typeof s.guidance).toBe("string");
      expect(typeof s.regulation_ref).toBe("string");
      expect(s.id.length).toBeGreaterThan(0);
      expect(s.title.length).toBeGreaterThan(0);
    }
  });

  it("all entries have unique ids", () => {
    const ids = REG45_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all regulation references cite CHR2015 Reg 45", () => {
    for (const s of REG45_SECTIONS) {
      expect(s.regulation_ref).toMatch(/CHR2015 Reg 45/);
    }
  });
});

// ── generateReportSections ─────────────────────────────────────────────────

describe("generateReportSections", () => {
  it("returns 12 sections for reg44", () => {
    const sections = generateReportSections("reg44");
    expect(sections).toHaveLength(12);
  });

  it("returns 10 sections for reg45", () => {
    const sections = generateReportSections("reg45");
    expect(sections).toHaveLength(10);
  });

  it("returns empty array for unsupported report types", () => {
    const sections = generateReportSections("annual_review");
    expect(sections).toHaveLength(0);
  });

  it("initialises all sections with empty content and completed=false", () => {
    const sections = generateReportSections("reg44");
    for (const s of sections) {
      expect(s.content).toBe("");
      expect(s.completed).toBe(false);
      expect(s.reviewed_by).toBeNull();
      expect(s.reviewed_at).toBeNull();
    }
  });

  it("preserves template fields (id, title, guidance, regulation_ref)", () => {
    const sections = generateReportSections("reg45");
    for (const s of sections) {
      expect(typeof s.id).toBe("string");
      expect(typeof s.title).toBe("string");
      expect(typeof s.guidance).toBe("string");
      expect(typeof s.regulation_ref).toBe("string");
    }
  });

  it("reg44 sections match the REG44_SECTIONS template ids", () => {
    const sections = generateReportSections("reg44");
    const templateIds = REG44_SECTIONS.map((t) => t.id);
    const sectionIds = sections.map((s) => s.id);
    expect(sectionIds).toEqual(templateIds);
  });

  it("reg45 sections match the REG45_SECTIONS template ids", () => {
    const sections = generateReportSections("reg45");
    const templateIds = REG45_SECTIONS.map((t) => t.id);
    const sectionIds = sections.map((s) => s.id);
    expect(sectionIds).toEqual(templateIds);
  });
});

// ── computeReportProgress ──────────────────────────────────────────────────

describe("computeReportProgress", () => {
  it("returns zero progress for empty sections", () => {
    const result = computeReportProgress([]);
    expect(result.total_sections).toBe(0);
    expect(result.completed_sections).toBe(0);
    expect(result.reviewed_sections).toBe(0);
    expect(result.progress_percentage).toBe(0);
    expect(result.review_percentage).toBe(0);
    expect(result.ready_for_submission).toBe(false);
  });

  it("returns 100% progress when all sections are completed", () => {
    const sections = [
      section("a", true),
      section("b", true),
      section("c", true),
    ];
    const result = computeReportProgress(sections);
    expect(result.total_sections).toBe(3);
    expect(result.completed_sections).toBe(3);
    expect(result.progress_percentage).toBe(100);
  });

  it("computes partial completion correctly", () => {
    const sections = [
      section("a", true),
      section("b", false),
      section("c", true),
      section("d", false),
    ];
    const result = computeReportProgress(sections);
    expect(result.total_sections).toBe(4);
    expect(result.completed_sections).toBe(2);
    expect(result.progress_percentage).toBe(50);
  });

  it("counts reviewed sections separately", () => {
    const sections = [
      section("a", true, "reviewer-1"),
      section("b", true, null),
      section("c", true, "reviewer-2"),
    ];
    const result = computeReportProgress(sections);
    expect(result.reviewed_sections).toBe(2);
    expect(result.review_percentage).toBe(67); // Math.round(2/3 * 100)
  });

  it("ready_for_submission is true only when all completed AND all reviewed", () => {
    const allDone = [
      section("a", true, "reviewer-1"),
      section("b", true, "reviewer-1"),
    ];
    expect(computeReportProgress(allDone).ready_for_submission).toBe(true);

    // All completed but not all reviewed
    const notReviewed = [
      section("a", true, "reviewer-1"),
      section("b", true, null),
    ];
    expect(computeReportProgress(notReviewed).ready_for_submission).toBe(false);

    // All reviewed but not all completed
    const notCompleted = [
      section("a", false, "reviewer-1"),
      section("b", true, "reviewer-1"),
    ];
    expect(computeReportProgress(notCompleted).ready_for_submission).toBe(false);
  });

  it("rounds progress percentage correctly", () => {
    // 1 of 3 completed = 33.33... -> 33
    const sections = [
      section("a", true),
      section("b", false),
      section("c", false),
    ];
    const result = computeReportProgress(sections);
    expect(result.progress_percentage).toBe(33);
  });
});

// ── computeReportingSchedule ───────────────────────────────────────────────

describe("computeReportingSchedule", () => {
  it("returns empty schedule when no reports exist", () => {
    const result = computeReportingSchedule([], NOW);
    expect(result.upcoming).toEqual([]);
    expect(result.overdue).toEqual([]);
    expect(result.last_submitted).toEqual({});
  });

  it("identifies upcoming reports with correct days_until_due", () => {
    // Due 10 days from NOW (2026-06-11)
    const reports = [scheduleReport("reg44", null, "2026-06-11")];
    const result = computeReportingSchedule(reports, NOW);
    expect(result.upcoming).toHaveLength(1);
    expect(result.upcoming[0].report_type).toBe("reg44");
    expect(result.upcoming[0].due_date).toBe("2026-06-11");
    expect(result.upcoming[0].days_until_due).toBe(10);
    expect(result.overdue).toHaveLength(0);
  });

  it("identifies overdue reports with correct days_overdue", () => {
    // Due 5 days before NOW (2026-05-27)
    const reports = [scheduleReport("reg45", null, "2026-05-27")];
    const result = computeReportingSchedule(reports, NOW);
    expect(result.overdue).toHaveLength(1);
    expect(result.overdue[0].report_type).toBe("reg45");
    expect(result.overdue[0].due_date).toBe("2026-05-27");
    expect(result.overdue[0].days_overdue).toBe(5);
    expect(result.upcoming).toHaveLength(0);
  });

  it("tracks last_submitted per report type", () => {
    const reports = [
      scheduleReport("reg44", "2026-04-01", null),
      scheduleReport("reg44", "2026-05-01", null),
      scheduleReport("reg45", "2026-03-15", null),
    ];
    const result = computeReportingSchedule(reports, NOW);
    expect(result.last_submitted.reg44).toBe("2026-05-01");
    expect(result.last_submitted.reg45).toBe("2026-03-15");
  });

  it("sets last_submitted to null for report types with no submissions", () => {
    const reports = [scheduleReport("reg44", null, "2026-07-01")];
    const result = computeReportingSchedule(reports, NOW);
    expect(result.last_submitted.reg44).toBeNull();
  });

  it("sorts upcoming by soonest first", () => {
    const reports = [
      scheduleReport("reg45", null, "2026-08-01"),
      scheduleReport("reg44", null, "2026-06-10"),
      scheduleReport("reg44", null, "2026-06-20"),
    ];
    const result = computeReportingSchedule(reports, NOW);
    expect(result.upcoming).toHaveLength(3);
    expect(result.upcoming[0].days_until_due).toBeLessThanOrEqual(
      result.upcoming[1].days_until_due,
    );
    expect(result.upcoming[1].days_until_due).toBeLessThanOrEqual(
      result.upcoming[2].days_until_due,
    );
  });

  it("sorts overdue by most overdue first", () => {
    const reports = [
      scheduleReport("reg44", null, "2026-05-30"),
      scheduleReport("reg45", null, "2026-05-01"),
    ];
    const result = computeReportingSchedule(reports, NOW);
    expect(result.overdue).toHaveLength(2);
    expect(result.overdue[0].days_overdue).toBeGreaterThanOrEqual(
      result.overdue[1].days_overdue,
    );
  });

  it("deduplicates same report_type + due_date combinations", () => {
    const reports = [
      scheduleReport("reg44", null, "2026-06-15"),
      scheduleReport("reg44", null, "2026-06-15"),
    ];
    const result = computeReportingSchedule(reports, NOW);
    expect(result.upcoming).toHaveLength(1);
  });

  it("treats a report due today as upcoming with 0 days", () => {
    const reports = [scheduleReport("reg44", null, "2026-06-01")];
    const result = computeReportingSchedule(reports, NOW);
    expect(result.upcoming).toHaveLength(1);
    expect(result.upcoming[0].days_until_due).toBe(0);
    expect(result.overdue).toHaveLength(0);
  });
});

// ── computeReportingCompliance ─────────────────────────────────────────────

describe("computeReportingCompliance", () => {
  it("returns non_compliant with zero counts when no reports exist", () => {
    const result = computeReportingCompliance([], NOW);
    expect(result.reg44_compliant).toBe(false);
    expect(result.reg45_compliant).toBe(false);
    expect(result.reg44_count_12_months).toBe(0);
    expect(result.reg45_count_12_months).toBe(0);
    expect(result.compliance_rating).toBe("non_compliant");
  });

  it("counts only submitted reports (ignores draft/in_progress)", () => {
    const reports = [
      complianceReport("reg44", "2026-03-15", "draft"),
      complianceReport("reg44", "2026-04-15", "in_progress"),
    ];
    const result = computeReportingCompliance(reports, NOW);
    expect(result.reg44_count_12_months).toBe(0);
  });

  it("reg44 compliance requires a submission in each calendar month", () => {
    // Build one submission per month from July 2025 to May 2026 (11 months)
    const reports = [];
    for (let m = 7; m <= 12; m++) {
      reports.push(
        complianceReport("reg44", `2025-${String(m).padStart(2, "0")}-15`, "submitted"),
      );
    }
    for (let m = 1; m <= 5; m++) {
      reports.push(
        complianceReport("reg44", `2026-${String(m).padStart(2, "0")}-15`, "submitted"),
      );
    }
    // Also need June 2026 (current month) — wait, NOW is June 1 so
    // expected months start from month after 12-months-ago up to now.
    // 12 months ago = 2025-06-01, so expectedMonths starts at 2025-07
    // and goes through 2026-06.
    reports.push(complianceReport("reg44", "2026-06-01", "submitted"));

    const result = computeReportingCompliance(reports, NOW);
    expect(result.reg44_count_12_months).toBe(12);
    expect(result.reg44_compliant).toBe(true);
  });

  it("reg44 is non-compliant when a month is missing", () => {
    // Only provide reports for a few months
    const reports = [
      complianceReport("reg44", "2026-03-15", "submitted"),
      complianceReport("reg44", "2026-04-15", "submitted"),
      complianceReport("reg44", "2026-05-15", "submitted"),
    ];
    const result = computeReportingCompliance(reports, NOW);
    expect(result.reg44_compliant).toBe(false);
  });

  it("reg45 compliance requires at least one submission in last 6 months", () => {
    // Submitted 3 months ago — within 6 month window
    const reports = [
      complianceReport("reg45", "2026-03-01", "submitted"),
    ];
    const result = computeReportingCompliance(reports, NOW);
    expect(result.reg45_compliant).toBe(true);
    expect(result.reg45_count_12_months).toBe(1);
  });

  it("reg45 is non-compliant when no submission in last 6 months", () => {
    // Submitted 8 months ago — outside 6 month window
    const reports = [
      complianceReport("reg45", "2025-09-01", "submitted"),
    ];
    const result = computeReportingCompliance(reports, NOW);
    expect(result.reg45_compliant).toBe(false);
  });

  it("compliance_rating is compliant when both reg44 and reg45 pass", () => {
    const reports = [];
    // Full reg44 coverage
    for (let m = 7; m <= 12; m++) {
      reports.push(
        complianceReport("reg44", `2025-${String(m).padStart(2, "0")}-15`, "submitted"),
      );
    }
    for (let m = 1; m <= 6; m++) {
      reports.push(
        complianceReport("reg44", `2026-${String(m).padStart(2, "0")}-15`, "submitted"),
      );
    }
    // Reg 45 in last 6 months
    reports.push(complianceReport("reg45", "2026-04-01", "submitted"));

    const result = computeReportingCompliance(reports, NOW);
    expect(result.compliance_rating).toBe("compliant");
  });

  it("compliance_rating is partially_compliant when only one passes", () => {
    // Only reg45 passes
    const reports = [
      complianceReport("reg45", "2026-04-01", "submitted"),
    ];
    const result = computeReportingCompliance(reports, NOW);
    expect(result.reg45_compliant).toBe(true);
    expect(result.reg44_compliant).toBe(false);
    expect(result.compliance_rating).toBe("partially_compliant");
  });

  it("compliance_rating is non_compliant when neither passes", () => {
    // Reg45 too old, no reg44
    const reports = [
      complianceReport("reg45", "2025-06-01", "submitted"),
    ];
    const result = computeReportingCompliance(reports, NOW);
    expect(result.compliance_rating).toBe("non_compliant");
  });

  it("ignores reports older than 12 months for counts", () => {
    // 13 months ago
    const reports = [
      complianceReport("reg44", "2025-04-15", "submitted"),
    ];
    const result = computeReportingCompliance(reports, NOW);
    expect(result.reg44_count_12_months).toBe(0);
  });
});

// ── calculateNextDueDate ───────────────────────────────────────────────────

describe("calculateNextDueDate", () => {
  it("adds 28 days for reg44", () => {
    const last = new Date("2026-06-01T00:00:00Z");
    const next = calculateNextDueDate("reg44", last);
    expect(next.toISOString()).toBe("2026-06-29T00:00:00.000Z");
  });

  it("adds 6 months for reg45", () => {
    const last = new Date("2026-06-01T00:00:00Z");
    const next = calculateNextDueDate("reg45", last);
    // setMonth operates in local time so we compare date components
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(11); // December (0-indexed)
    expect(next.getDate()).toBe(1);
  });

  it("adds 12 months for annual_review", () => {
    const last = new Date("2025-06-01T00:00:00Z");
    const next = calculateNextDueDate("annual_review", last);
    expect(next.toISOString()).toBe("2026-06-01T00:00:00.000Z");
  });

  it("defaults to 3 months for other report types", () => {
    const last = new Date("2026-06-01T00:00:00Z");
    const next = calculateNextDueDate("serious_incident", last);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(8); // September (0-indexed)
    expect(next.getDate()).toBe(1);
  });

  it("does not mutate the input date", () => {
    const last = new Date("2026-06-01T00:00:00Z");
    const originalTime = last.getTime();
    calculateNextDueDate("reg44", last);
    expect(last.getTime()).toBe(originalTime);
  });

  it("handles month-end boundaries for reg45", () => {
    // Aug 31 + 6 months = Feb 28 (or 29 in leap year)
    const last = new Date("2026-08-31T00:00:00Z");
    const next = calculateNextDueDate("reg45", last);
    // Feb 2027 has 28 days, so JS Date rolls to March 3
    expect(next.getMonth()).toBe(2); // March (0-indexed)
  });

  it("handles reg44 across month boundaries", () => {
    // May 20 + 28 days = June 17
    const last = new Date("2026-05-20T00:00:00Z");
    const next = calculateNextDueDate("reg44", last);
    expect(next.toISOString()).toBe("2026-06-17T00:00:00.000Z");
  });
});
