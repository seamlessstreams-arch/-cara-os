// Integration: REAL store → spine + intervals (mapper) → conflict detection.
import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { mapStoreToConflictInput } from "../conflict-input-mapper";
import { computeConflictDetection } from "../conflict-detection-engine";

describe("conflict-detection integration (store → spine + intervals → engine)", () => {
  const input = mapStoreToConflictInput(getStore());
  const result = computeConflictDetection({ ...input, today: "2026-06-03" });

  it("runs over the real event stream with a sensible overview", () => {
    expect(input.events.length).toBeGreaterThan(0);
    expect(result.overview.total_events).toBe(input.events.length);
    expect(result.overview.conflicts_found).toBe(result.conflicts.length);
    expect(result.overview.conflicts_found).toBeGreaterThanOrEqual(0);
    expect(result.overview.auto_resolved).toBe(0); // safeguard: never auto-resolved
  });

  it("every finding is structurally valid and references two real (or interval-sourced) records", () => {
    const byId = new Map(input.events.map((e) => [e.id, e]));
    for (const c of result.conflicts) {
      expect(c.id.startsWith("cf_")).toBe(true);
      expect(["critical", "high", "medium", "low"]).toContain(c.severity);
      expect(["child", "staff"]).toContain(c.subject_kind);
      expect(c.event_a.event_id.length).toBeGreaterThan(0);
      expect(c.event_b.event_id.length).toBeGreaterThan(0);
      expect(c.event_a.event_id).not.toBe(c.event_b.event_id);
      // event_b is always a real spine event (the "other side" of every rule).
      expect(byId.has(c.event_b.event_id)).toBe(true);
      // Safeguard invariants on every finding.
      expect(c.status).toBe("needs_human_review");
      expect(c.auto_resolved).toBe(false);
      expect(c.cara_assessment.confidence).toBeGreaterThanOrEqual(0);
      expect(c.cara_assessment.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("present_while_missing findings genuinely sit inside a missing interval", () => {
    const missingIntervals = input.intervals.filter((i) => i.kind === "missing");
    for (const c of result.conflicts.filter((x) => x.category === "present_while_missing")) {
      const t = new Date(c.event_b.occurred_at).getTime();
      const covering = missingIntervals.some((iv) => {
        const s = new Date(iv.start).getTime();
        const e = iv.end ? new Date(iv.end).getTime() : Number.POSITIVE_INFINITY;
        return iv.subject_id === c.subject_id && t > s && t < e;
      });
      expect(covering).toBe(true);
    }
  });

  it("is deterministic on real data (same input → identical JSON)", () => {
    const again = computeConflictDetection({ ...mapStoreToConflictInput(getStore()), today: "2026-06-03" });
    expect(JSON.stringify(result)).toBe(JSON.stringify(again));
  });

  it("always returns at least one Cara insight with a valid severity", () => {
    expect(result.insights.length).toBeGreaterThan(0);
    for (const i of result.insights) {
      expect(["critical", "warning", "positive"]).toContain(i.severity);
    }
  });
});
