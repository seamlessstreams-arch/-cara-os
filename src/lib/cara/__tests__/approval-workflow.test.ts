import { describe, it, expect, vi } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — APPROVAL WORKFLOW TESTS
//
// Note: In demo mode (null Supabase), fetchReport always returns a fresh
// report with status "draft". Each workflow function calls fetchReport
// independently, so there is no persistent state between calls. Tests
// must be structured around single-step transitions from "draft" or
// verify the state machine validation logic directly.
// ══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => null),
}));

import {
  submitForReview,
  approveReport,
  rejectReport,
  lockReport,
  archiveReport,
} from "../reports/approval-workflow";

describe("submitForReview (demo mode)", () => {
  it("transitions a draft report to pending_review", async () => {
    const result = await submitForReview("report-1", "user-1");
    expect(result.status).toBe("pending_review");
  });

  it("returns a report with the correct id", async () => {
    const result = await submitForReview("report-2", "user-1");
    expect(result.id).toBe("report-2");
  });

  it("returned report has core fields", async () => {
    const result = await submitForReview("report-3", "user-1");
    expect(result.organisation_id).toBeDefined();
    expect(result.home_id).toBeDefined();
    expect(result.child_id).toBeDefined();
    expect(result.report_type).toBeDefined();
    expect(result.title).toBeDefined();
  });
});

describe("invalid status transitions (demo mode — always starts as draft)", () => {
  it("cannot approve a draft report directly (must go through pending_review first)", async () => {
    await expect(
      approveReport("report-direct-approve", "manager-1"),
    ).rejects.toThrow("Invalid status transition");
  });

  it("cannot reject a draft report directly", async () => {
    await expect(
      rejectReport("report-direct-reject", "manager-1", "Not good"),
    ).rejects.toThrow("Invalid status transition");
  });

  it("cannot lock a draft report directly", async () => {
    await expect(
      lockReport("report-direct-lock", "manager-1"),
    ).rejects.toThrow("Invalid status transition");
  });

  it("cannot archive a draft report directly", async () => {
    await expect(
      archiveReport("report-direct-archive"),
    ).rejects.toThrow("Invalid status transition");
  });
});

describe("submitForReview result shape", () => {
  it("has the expected report type", async () => {
    const result = await submitForReview("report-shape-1", "user-1");
    expect(result.report_type).toBe("weekly_child_report");
  });

  it("has a version number", async () => {
    const result = await submitForReview("report-shape-2", "user-1");
    expect(result.version).toBeGreaterThanOrEqual(1);
  });

  it("has date range fields", async () => {
    const result = await submitForReview("report-shape-3", "user-1");
    expect(result.date_range_start).toBeDefined();
    expect(result.date_range_end).toBeDefined();
  });

  it("has risk_tier field", async () => {
    const result = await submitForReview("report-shape-4", "user-1");
    expect(["low", "medium", "high"]).toContain(result.risk_tier);
  });

  it("has child_voice_included field", async () => {
    const result = await submitForReview("report-shape-5", "user-1");
    expect(typeof result.child_voice_included).toBe("boolean");
  });
});

describe("workflow transition validation rules", () => {
  it("draft can only transition to pending_review", async () => {
    // This succeeds — draft → pending_review is valid
    const result = await submitForReview("valid-transition-1", "user-1");
    expect(result.status).toBe("pending_review");

    // These fail — draft cannot skip to approved/locked/archived
    await expect(approveReport("invalid-1", "mgr")).rejects.toThrow();
    await expect(lockReport("invalid-2", "mgr")).rejects.toThrow();
    await expect(archiveReport("invalid-3")).rejects.toThrow();
  });
});
