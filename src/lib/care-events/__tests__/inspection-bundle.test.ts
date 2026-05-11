// ══════════════════════════════════════════════════════════════════════════════
// Inspection Bundle — engine tests (Milestone 42)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  buildInspectionBundle,
  INSPECTION_BUNDLE_SCHEMA_VERSION,
} from "@/lib/care-events/inspection-bundle";

const HOME = "home_oak";

describe("inspection bundle (M42)", () => {
  it("composes a bundle with snapshot, filing index and headline counts", () => {
    const b = buildInspectionBundle(HOME);
    expect(b.home_id).toBe(HOME);
    expect(b.schema_version).toBe(INSPECTION_BUNDLE_SCHEMA_VERSION);
    expect(b.bundle_id.startsWith(`inspection_bundle_${HOME}_`)).toBe(true);
    expect(b.inspection_snapshot).toBeDefined();
    expect(b.inspection_snapshot.headline.readiness_score).toBeTypeOf("number");
    expect(b.filing_cabinet).toBeDefined();
    expect(Array.isArray(b.reg44_packs)).toBe(true);
    expect(Array.isArray(b.reg45_evidence)).toBe(true);
    expect(Array.isArray(b.annex_a_evidence)).toBe(true);
    expect(b.export_history_recent).toBeDefined();
  });

  it("headline counts match the underlying collections", () => {
    const b = buildInspectionBundle(HOME);
    expect(b.headline.reg44_packs_included).toBe(b.reg44_packs.length);
    expect(b.headline.reg45_evidence_items).toBe(b.reg45_evidence.length);
    expect(b.headline.annex_a_evidence_items).toBe(b.annex_a_evidence.length);
    expect(b.headline.filing_total).toBe(b.filing_cabinet.total);
    expect(b.headline.recent_exports_included).toBe(b.export_history_recent.total);
    expect(b.headline.readiness_score).toBe(b.inspection_snapshot.headline.readiness_score);
  });

  it("respects generatedBy", () => {
    const b = buildInspectionBundle(HOME, { generatedBy: "u_test" });
    expect(b.generated_by).toBe("u_test");
  });

  it("isolates by home", () => {
    const a = buildInspectionBundle(HOME);
    const c = buildInspectionBundle("home_does_not_exist");
    expect(c.headline.reg44_packs_included).toBe(0);
    expect(c.headline.filing_total).toBe(0);
    expect(a.bundle_id).not.toBe(c.bundle_id);
  });
});
