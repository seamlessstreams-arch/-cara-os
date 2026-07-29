// ══════════════════════════════════════════════════════════════════════════════
// Timesheets → CSV shapes (pure functions, tested in __tests__/csv-export.test.ts)
//
// The page component (src/app/(platform)/timesheets/page.tsx) used to inline
// both shapes. Pulled here so:
//   * the shape is testable (the page component isn't easily test-mounted),
//   * a payroll admin can see the column layout in one place,
//   * bumping a Sage column doesn't silently drift from what tests assert.
//
// The RFC-4180 cell/row primitives are duplicated (not imported from
// src/lib/recruitment/csv-export.ts) — two callers is fine, three would earn
// a shared src/lib/csv/rfc4180.ts. YAGNI until then.
// ══════════════════════════════════════════════════════════════════════════════

import type { StaffMember } from "@/types";

// The subset of buildTimesheetData()'s return shape the CSV builders need —
// kept structural so this helper never has to reach into StaffEnriched or
// whatever the page's inferred TimesheetEntry type resolves to.
export interface TimesheetCsvEntry {
  staff: Pick<
    StaffMember,
    "id" | "full_name" | "job_title" | "payroll_id" | "contracted_hours"
  >;
  totalScheduledMins: number;
  overtimeMinutes: number;
  overtimePay: number;
  status: string; // page uses a specific union; helper doesn't care
}

// ── RFC-4180 primitives ─────────────────────────────────────────────────────

export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s === "") return "";
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, `""`)}"` : s;
}

export function toCsv(
  rows: ReadonlyArray<ReadonlyArray<string | number | boolean | null | undefined>>,
): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

// ── Timesheet summary CSV ───────────────────────────────────────────────────
// Ops-facing sheet: one row per staff member, mirrors the on-screen table.

const TIMESHEET_HEADERS = [
  "Staff Name",
  "Job Title",
  "Payroll ID",
  "Contracted Hrs/wk",
  "Hours Worked",
  "Overtime Mins",
  "OT Pay (£)",
  "Status",
  "Approved",
] as const;

export function timesheetCsv(
  entries: ReadonlyArray<TimesheetCsvEntry>,
  approvedIds: ReadonlySet<string>,
): string {
  const rows: (string | number)[][] = [TIMESHEET_HEADERS.map((h) => h)];
  for (const d of entries) {
    rows.push([
      d.staff.full_name,
      d.staff.job_title,
      d.staff.payroll_id ?? "",
      String(d.staff.contracted_hours),
      (d.totalScheduledMins / 60).toFixed(2),
      String(d.overtimeMinutes),
      d.overtimePay.toFixed(2),
      d.status,
      approvedIds.has(d.staff.id) ? "Yes" : "No",
    ]);
  }
  return toCsv(rows);
}

// ── Sage Payroll CSV ────────────────────────────────────────────────────────
// Sage 50 Payroll-shaped: one row per staff per payment type (Basic, and
// Overtime when > 0). Rate is BACKED OUT from overtime pay ÷ overtime hours
// ÷ 1.5x — if no OT ran this period, we leave rate blank rather than guess
// (the tooltip on the button already warns the admin to double-check Rate).
// Overtime rows are OMITTED when the staff member had no OT, so the sheet
// isn't padded with zero-unit noise.

const SAGE_HEADERS = [
  "Employee Reference",
  "Full Name",
  "Payment Type",
  "Units (hours)",
  "Rate (£)",
  "Total (£)",
  "Period End",
  "Notes",
] as const;

export function sageCsv(
  entries: ReadonlyArray<TimesheetCsvEntry>,
  approvedIds: ReadonlySet<string>,
  periodEnd: string, // YYYY-MM-DD; injected for testability + timezone control
): string {
  const rows: (string | number)[][] = [SAGE_HEADERS.map((h) => h)];
  for (const d of entries) {
    const ref = d.staff.payroll_id ?? d.staff.id;
    const basicHours = d.totalScheduledMins / 60;
    const rateFromOt =
      d.overtimeMinutes > 0 && d.overtimePay > 0
        ? d.overtimePay / (d.overtimeMinutes / 60) / 1.5
        : null;
    const rate = rateFromOt !== null ? rateFromOt.toFixed(2) : "";
    rows.push([
      ref,
      d.staff.full_name,
      "Basic",
      basicHours.toFixed(2),
      rate,
      rateFromOt !== null ? (basicHours * rateFromOt).toFixed(2) : "",
      periodEnd,
      approvedIds.has(d.staff.id) ? "Approved" : "Pending approval",
    ]);
    if (d.overtimeMinutes > 0) {
      rows.push([
        ref,
        d.staff.full_name,
        "Overtime",
        (d.overtimeMinutes / 60).toFixed(2),
        rate,
        d.overtimePay.toFixed(2),
        periodEnd,
        "OT @ 1.5x",
      ]);
    }
  }
  return toCsv(rows);
}
