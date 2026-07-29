import { describe, it, expect } from "vitest";
import {
  csvCell,
  toCsv,
  timesheetCsv,
  sageCsv,
  type TimesheetCsvEntry,
} from "../csv-export";

// ── csvCell + toCsv (mirrors the RFC-4180 rules the recruitment helper enforces) ─

describe("csvCell", () => {
  it("returns empty string for null/undefined/empty", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell("")).toBe("");
  });
  it("passes plain strings through unquoted", () => {
    expect(csvCell("hello world")).toBe("hello world");
  });
  it("quotes commas / quotes / newlines and doubles inner quotes", () => {
    expect(csvCell("a,b")).toBe(`"a,b"`);
    expect(csvCell(`he said "hi"`)).toBe(`"he said ""hi"""`);
    expect(csvCell("line1\nline2")).toBe(`"line1\nline2"`);
  });
  it("stringifies numbers and booleans", () => {
    expect(csvCell(0)).toBe("0");
    expect(csvCell(42.5)).toBe("42.5");
    expect(csvCell(true)).toBe("true");
    expect(csvCell(false)).toBe("false");
  });
});

describe("toCsv", () => {
  it("joins cells with commas, rows with \\r\\n, and terminates with \\r\\n", () => {
    expect(toCsv([["a", "b"], ["1", "2"]])).toBe("a,b\r\n1,2\r\n");
  });
  it("delegates escaping per-cell", () => {
    expect(toCsv([["ok", "has, comma"]])).toBe(`ok,"has, comma"\r\n`);
  });
});

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<TimesheetCsvEntry> = {}): TimesheetCsvEntry {
  return {
    staff: {
      id: "staff_1",
      full_name: "Alex Rivers",
      job_title: "Support Worker",
      payroll_id: "PR-001",
      contracted_hours: 37.5,
    },
    totalScheduledMins: 40 * 60, // 40 hours
    overtimeMinutes: 0,
    overtimePay: 0,
    status: "complete",
    ...overrides,
  };
}

// ── timesheetCsv ────────────────────────────────────────────────────────────

describe("timesheetCsv", () => {
  it("returns a header-only sheet for zero entries", () => {
    const csv = timesheetCsv([], new Set());
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Staff Name");
    expect(lines[0]).toContain("Approved");
    expect(lines[0]).toContain("OT Pay (£)");
  });

  it("emits one row per entry with the visible-table columns", () => {
    const csv = timesheetCsv(
      [
        makeEntry({
          staff: {
            id: "s1",
            full_name: "Alex Rivers",
            job_title: "Support Worker",
            payroll_id: "PR-001",
            contracted_hours: 37.5,
          },
          totalScheduledMins: 40 * 60,
          overtimeMinutes: 120,
          overtimePay: 30.5,
          status: "complete",
        }),
      ],
      new Set(["s1"]),
    );
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(2);
    // Hours worked = 40.00, OT mins = 120, OT pay = 30.50, Approved = Yes
    expect(lines[1]).toContain("Alex Rivers");
    expect(lines[1]).toContain("Support Worker");
    expect(lines[1]).toContain("PR-001");
    expect(lines[1]).toContain("40.00");
    expect(lines[1]).toContain(",120,"); // OT mins column
    expect(lines[1]).toContain("30.50");
    expect(lines[1]).toContain("complete");
    expect(lines[1]).toMatch(/,Yes\r?$|,Yes$/);
  });

  it("emits 'No' in the Approved column when the id isn't in the approved set", () => {
    const csv = timesheetCsv([makeEntry({ staff: { ...makeEntry().staff, id: "s1" } })], new Set());
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines[1]).toMatch(/,No\r?$|,No$/);
  });

  it("uses an empty Payroll ID cell when payroll_id is null", () => {
    const csv = timesheetCsv(
      [makeEntry({ staff: { ...makeEntry().staff, payroll_id: null } })],
      new Set(),
    );
    // Payroll ID is the 3rd column — two commas in a row after the job title.
    expect(csv).toMatch(/,Support Worker,,/);
  });

  it("quotes a full name that contains a comma", () => {
    const csv = timesheetCsv(
      [makeEntry({ staff: { ...makeEntry().staff, full_name: "Rivers, Alex" } })],
      new Set(),
    );
    expect(csv).toContain(`"Rivers, Alex"`);
  });
});

// ── sageCsv ─────────────────────────────────────────────────────────────────

describe("sageCsv", () => {
  const PERIOD_END = "2026-07-31";

  it("uses the Sage-shaped header (8 columns)", () => {
    const csv = sageCsv([], new Set(), PERIOD_END);
    const header = csv.split("\r\n")[0];
    expect(header).toBe(
      "Employee Reference,Full Name,Payment Type,Units (hours),Rate (£),Total (£),Period End,Notes",
    );
  });

  it("returns a header-only sheet for zero entries", () => {
    const csv = sageCsv([], new Set(), PERIOD_END);
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(1);
  });

  it("emits ONE Basic row (no Overtime row) when overtimeMinutes is 0", () => {
    const csv = sageCsv(
      [
        makeEntry({
          staff: { ...makeEntry().staff, id: "s1", payroll_id: "PR-001" },
          totalScheduledMins: 40 * 60,
          overtimeMinutes: 0,
          overtimePay: 0,
        }),
      ],
      new Set(),
      PERIOD_END,
    );
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(2); // header + basic only
    expect(lines[1]).toContain("Basic");
    expect(lines[1]).not.toContain("Overtime");
  });

  it("emits TWO rows (Basic + Overtime) when overtimeMinutes > 0", () => {
    const csv = sageCsv(
      [
        makeEntry({
          staff: { ...makeEntry().staff, id: "s1", payroll_id: "PR-001" },
          totalScheduledMins: 40 * 60,
          overtimeMinutes: 120, // 2 hours
          overtimePay: 45, // → rate = 45 / 2 / 1.5 = £15/hr
        }),
      ],
      new Set(["s1"]),
      PERIOD_END,
    );
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(3); // header + basic + overtime
    expect(lines[1]).toContain(",Basic,");
    expect(lines[2]).toContain(",Overtime,");
    // Rate backed out from OT: 15.00 in both rows
    expect(lines[1]).toContain(",15.00,");
    expect(lines[2]).toContain(",15.00,");
    // Basic total = 40 hrs × £15 = £600.00; OT total = £45.00
    expect(lines[1]).toContain(",600.00,");
    expect(lines[2]).toContain(",45.00,");
    expect(lines[2]).toContain("OT @ 1.5x");
  });

  it("leaves Rate + Basic Total blank when no OT ran (rate is unknown)", () => {
    const csv = sageCsv(
      [makeEntry({ totalScheduledMins: 40 * 60, overtimeMinutes: 0, overtimePay: 0 })],
      new Set(),
      PERIOD_END,
    );
    const lines = csv.split("\r\n").filter(Boolean);
    // Basic row: Rate cell and Total cell are both empty (adjacent commas).
    expect(lines[1]).toMatch(/,40\.00,,,/); // units,rate-blank,total-blank
  });

  it("falls back to staff.id when payroll_id is null", () => {
    const csv = sageCsv(
      [
        makeEntry({
          staff: { ...makeEntry().staff, id: "staff_xyz", payroll_id: null },
        }),
      ],
      new Set(),
      PERIOD_END,
    );
    expect(csv.split("\r\n")[1]).toMatch(/^staff_xyz,/);
  });

  it("writes the injected periodEnd verbatim (no date logic in the helper)", () => {
    const csv = sageCsv([makeEntry()], new Set(), "2026-12-31");
    expect(csv).toContain(",2026-12-31,");
  });

  it("writes Approved / Pending approval based on the approved-set", () => {
    const csv = sageCsv(
      [
        makeEntry({ staff: { ...makeEntry().staff, id: "s1" } }),
        makeEntry({ staff: { ...makeEntry().staff, id: "s2", full_name: "Sam W" } }),
      ],
      new Set(["s1"]),
      PERIOD_END,
    );
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines[1]).toMatch(/,Approved\r?$|,Approved$/);
    expect(lines[2]).toMatch(/,Pending approval\r?$|,Pending approval$/);
  });
});
