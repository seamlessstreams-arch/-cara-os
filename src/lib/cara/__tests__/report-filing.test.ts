import { describe, it, expect, vi } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — REPORT FILING INTEGRATION TESTS
// ══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => null),
}));

import {
  buildReportFilingPath,
  fileLockedReport,
  previewFilingPath,
} from "../reports/report-filing";
import type { ChildReport } from "@/types/cara-reports";

function buildMockReport(overrides?: Partial<ChildReport>): ChildReport {
  return {
    id: "rpt-1",
    organisation_id: "org-1",
    home_id: "home-1",
    child_id: "child-jayden",
    report_type: "weekly_child_report",
    audience: "internal_manager",
    title: "Jayden — Weekly Report",
    status: "locked",
    version: 1,
    parent_report_id: null,
    date_range_start: "2026-05-05",
    date_range_end: "2026-05-11",
    overall_summary: "A positive week overall.",
    overall_confidence_score: 78,
    risk_tier: "low",
    child_voice_included: true,
    evidence_gap_count: 1,
    agent_run_id: null,
    requested_by: "user-1",
    generated_at: "2026-05-11T10:00:00Z",
    reviewed_by: "manager-1",
    reviewed_at: "2026-05-11T12:00:00Z",
    review_notes: null,
    approved_by: "manager-1",
    approved_at: "2026-05-11T12:00:00Z",
    rejection_reason: null,
    locked_by: "manager-1",
    locked_at: "2026-05-11T14:00:00Z",
    created_at: "2026-05-11T10:00:00Z",
    updated_at: "2026-05-11T14:00:00Z",
    ...overrides,
  };
}

describe("buildReportFilingPath", () => {
  it("builds correct path for weekly child report", () => {
    const report = buildMockReport();
    const path = buildReportFilingPath(report);
    expect(path).toBe("young-people/child-jayden/cara-reports/weekly/2026-05-11");
  });

  it("builds correct path for social worker update", () => {
    const report = buildMockReport({ report_type: "social_worker_update" });
    const path = buildReportFilingPath(report);
    expect(path).toContain("social-worker-updates");
    expect(path).toContain("child-jayden");
  });

  it("builds correct path for risk review report", () => {
    const report = buildMockReport({ report_type: "risk_review_report" });
    const path = buildReportFilingPath(report);
    expect(path).toContain("risk-assessments");
  });

  it("builds correct path for end of placement report", () => {
    const report = buildMockReport({ report_type: "end_of_placement_transition_report" });
    const path = buildReportFilingPath(report);
    expect(path).toContain("transition");
  });

  it("uses locked_at date when available", () => {
    const report = buildMockReport({ locked_at: "2026-06-15T09:00:00Z" });
    const path = buildReportFilingPath(report);
    expect(path).toContain("2026-06-15");
  });

  it("falls back to created_at date when locked_at is null", () => {
    const report = buildMockReport({ locked_at: null, created_at: "2026-04-20T08:00:00Z" });
    const path = buildReportFilingPath(report);
    expect(path).toContain("2026-04-20");
  });

  it("includes child_id in path", () => {
    const report = buildMockReport({ child_id: "child-amara" });
    const path = buildReportFilingPath(report);
    expect(path).toContain("child-amara");
  });
});

describe("previewFilingPath", () => {
  it("returns the same path as buildReportFilingPath", () => {
    const report = buildMockReport();
    expect(previewFilingPath(report)).toBe(buildReportFilingPath(report));
  });
});

describe("fileLockedReport (demo mode)", () => {
  it("returns success in demo mode", async () => {
    const result = await fileLockedReport("rpt-demo-1");
    expect(result.success).toBe(true);
    expect(result.filingPath).toBeDefined();
    expect(result.filingPath!.length).toBeGreaterThan(0);
    expect(result.documentId).toBeDefined();
  });

  it("demo filing path includes cara-reports", async () => {
    const result = await fileLockedReport("rpt-demo-2");
    expect(result.filingPath).toContain("cara-reports");
  });
});
