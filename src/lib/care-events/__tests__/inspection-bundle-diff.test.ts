// ══════════════════════════════════════════════════════════════════════════════
// Inspection Bundle Diff — engine tests (Milestone 44)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  buildInspectionBundle,
  persistInspectionBundle,
} from "@/lib/care-events/inspection-bundle";
import { diffInspectionBundles } from "@/lib/care-events/inspection-bundle-diff";

const HOME = "home_oak";

beforeEach(() => {
  const arr = db.inspectionBundles.findAll() as { home_id: string }[];
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].home_id === HOME) arr.splice(i, 1);
  }
});

describe("inspection bundle diff (M44)", () => {
  it("returns null if current bundle does not exist", () => {
    expect(diffInspectionBundles("nope_xyz", null)).toBeNull();
  });

  it("treats null previous_id as an empty baseline", () => {
    const b = buildInspectionBundle(HOME, { generatedBy: "u" });
    persistInspectionBundle(b);
    const d = diffInspectionBundles(b.bundle_id, null);
    expect(d).not.toBeNull();
    expect(d!.previous_id).toBeNull();
    expect(d!.headline.readiness_score.previous).toBe(0);
    expect(d!.headline.readiness_score.current).toBe(b.headline.readiness_score);
    // every reg45 / annex_a / reg44 entry counts as added when baseline is empty
    expect(d!.reg45_evidence.added.length).toBe(b.headline.reg45_evidence_items);
    expect(d!.annex_a_evidence.added.length).toBe(b.headline.annex_a_evidence_items);
    expect(d!.reg44_packs.added.length).toBe(b.headline.reg44_packs_included);
  });

  it("returns null when previous_id is provided but missing", () => {
    const b = buildInspectionBundle(HOME);
    persistInspectionBundle(b);
    expect(diffInspectionBundles(b.bundle_id, "missing_xyz")).toBeNull();
  });

  it("computes deltas between two bundles of the same home", async () => {
    const a = buildInspectionBundle(HOME);
    persistInspectionBundle(a);
    await new Promise((r) => setTimeout(r, 5));
    const c = buildInspectionBundle(HOME);
    persistInspectionBundle(c);
    const d = diffInspectionBundles(c.bundle_id, a.bundle_id);
    expect(d).not.toBeNull();
    expect(d!.previous_id).toBe(a.bundle_id);
    expect(d!.current_id).toBe(c.bundle_id);
    // Same home, no underlying data changed between rebuilds:
    expect(d!.headline.readiness_score.delta).toBe(0);
    expect(d!.reg45_evidence.added.length).toBe(0);
    expect(d!.reg45_evidence.removed.length).toBe(0);
    expect(d!.notable_changes.some((s) => s.includes("No notable changes"))).toBe(true);
  });

  it("notable_changes mentions readiness severity flips", async () => {
    const a = buildInspectionBundle(HOME);
    persistInspectionBundle(a);
    // Mutate the persisted previous payload to simulate a different severity
    const stored = db.inspectionBundles.findById(a.bundle_id);
    expect(stored).not.toBeNull();
    type MutablePayload = { headline: { readiness_severity: string; readiness_score: number } };
    const payload = stored!.payload as MutablePayload;
    payload.headline.readiness_severity = "needs-action";
    payload.headline.readiness_score = 1;
    await new Promise((r) => setTimeout(r, 5));
    const c = buildInspectionBundle(HOME);
    persistInspectionBundle(c);
    const d = diffInspectionBundles(c.bundle_id, a.bundle_id)!;
    expect(d.headline.readiness_severity.changed).toBe(true);
    expect(d.notable_changes.some((s) => s.startsWith("Readiness severity changed"))).toBe(true);
  });
});
