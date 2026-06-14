// ══════════════════════════════════════════════════════════════════════════════
// Tests — Cara Smart Linking
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

// Mock Supabase before importing
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => null),
  isSupabaseEnabled: vi.fn(() => false),
}));

import {
  writeSmartLinks,
  flagRecordAsCaraAssisted,
  getCaraUsageForRecord,
  linkCommittedOutput,
  _testing,
} from "../cara-smart-linking";

const { CARA_FLAGGABLE_TABLES } = _testing;

// ─── CARA_FLAGGABLE_TABLES ──────────────────────────────────────────────────

describe("CARA_FLAGGABLE_TABLES", () => {
  it("includes the expected tables", () => {
    expect(CARA_FLAGGABLE_TABLES.has("daily_log_entries")).toBe(true);
    expect(CARA_FLAGGABLE_TABLES.has("incidents")).toBe(true);
    expect(CARA_FLAGGABLE_TABLES.has("key_work_sessions")).toBe(true);
    expect(CARA_FLAGGABLE_TABLES.has("care_forms")).toBe(true);
    expect(CARA_FLAGGABLE_TABLES.has("handovers")).toBe(true);
    expect(CARA_FLAGGABLE_TABLES.has("supervisions")).toBe(true);
  });

  it("does not include tables without an cara flag column", () => {
    expect(CARA_FLAGGABLE_TABLES.has("young_people")).toBe(false);
    expect(CARA_FLAGGABLE_TABLES.has("tasks")).toBe(false);
    expect(CARA_FLAGGABLE_TABLES.has("qa_audits")).toBe(false);
  });
});

// ─── writeSmartLinks (Supabase off) ─────────────────────────────────────────

describe("writeSmartLinks", () => {
  it("returns 0 written when Supabase is disabled", async () => {
    const result = await writeSmartLinks([
      {
        outputId: "out_1",
        sourceTable: "daily_log_entries",
        sourceRecordId: "dl_1",
        linkType: "context_source",
      },
    ]);
    expect(result.written).toBe(0);
  });

  it("returns 0 written for empty links array", async () => {
    const result = await writeSmartLinks([]);
    expect(result.written).toBe(0);
  });
});

// ─── flagRecordAsCaraAssisted (Supabase off) ────────────────────────────────

describe("flagRecordAsCaraAssisted", () => {
  it("returns false when Supabase is disabled", async () => {
    const result = await flagRecordAsCaraAssisted("daily_log_entries", "dl_1");
    expect(result).toBe(false);
  });

  it("returns false for non-flaggable tables", async () => {
    const result = await flagRecordAsCaraAssisted("young_people", "yp_1");
    expect(result).toBe(false);
  });
});

// ─── getCaraUsageForRecord (Supabase off) ───────────────────────────────────

describe("getCaraUsageForRecord", () => {
  it("returns empty array when Supabase is disabled", async () => {
    const result = await getCaraUsageForRecord("daily_log_entries", "dl_1");
    expect(result).toEqual([]);
  });
});

// ─── linkCommittedOutput (Supabase off) ─────────────────────────────────────

describe("linkCommittedOutput", () => {
  it("does not throw when Supabase is disabled", async () => {
    await expect(
      linkCommittedOutput("out_1", "daily_log_entries", "dl_1"),
    ).resolves.not.toThrow();
  });
});
