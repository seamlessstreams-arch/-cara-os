// Integration test: REAL store → canonical stream (projector) → duplicate detection.
import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildEventStream } from "@/lib/event-stream/event-projector";
import { mapStoreToEventInput } from "@/lib/event-stream/store-mapper";
import { computeDuplicateDetection, type ChildRef } from "../duplicate-detection-engine";

function childrenFromStore(): ChildRef[] {
  const store = getStore() as any;
  return ((store.youngPeople ?? []) as any[]).map((yp) => ({
    id: yp.id,
    first_name: yp.first_name,
    last_name: yp.last_name,
    preferred_name: yp.preferred_name ?? null,
  }));
}

describe("duplicate-detection integration (store → projector → engine)", () => {
  const stream = buildEventStream(mapStoreToEventInput(getStore()));
  const children = childrenFromStore();
  const result = computeDuplicateDetection({ events: stream.events, children, today: "2026-06-03" });

  it("runs over the real event stream and reports a sensible overview", () => {
    expect(stream.events.length).toBeGreaterThan(0);
    expect(result.overview.total_events).toBe(stream.events.length);
    expect(result.overview.suspected_duplicates).toBeGreaterThanOrEqual(0);
    expect(result.overview.suspected_duplicates).toBeLessThanOrEqual(stream.events.length);
    expect(result.overview.clusters).toBeLessThanOrEqual(result.overview.suspected_duplicates);
  });

  it("only flags same-type, same-child pairs and resolves a real child name", () => {
    const byId = new Map(children.map((c) => [c.id, c]));
    for (const d of result.duplicates) {
      // Both ends must be the same type/child as recorded on the pair.
      const primary = stream.events.find((e) => e.id === d.primary_event_id)!;
      const dup = stream.events.find((e) => e.id === d.duplicate_event_id)!;
      expect(primary).toBeDefined();
      expect(dup).toBeDefined();
      expect(primary.eventType).toBe(d.event_type);
      expect(dup.eventType).toBe(d.event_type);
      expect(primary.childId).toBe(d.child_id);
      expect(dup.childId).toBe(d.child_id);
      // Name resolves from the directory when the child is known.
      if (byId.has(d.child_id)) {
        expect(d.child_name).not.toBe(d.child_id);
      }
      // Similarity is always within the valid range and meets the bar.
      expect(d.similarity).toBeGreaterThanOrEqual(0.6);
      expect(d.similarity).toBeLessThanOrEqual(1);
      expect(d.suggested_action).toBe("Link to the existing event instead of creating a duplicate");
    }
  });

  it("never flags events more than 48h apart (spot-check the pairs)", () => {
    for (const d of result.duplicates) {
      const primary = stream.events.find((e) => e.id === d.primary_event_id)!;
      const dup = stream.events.find((e) => e.id === d.duplicate_event_id)!;
      const gapMs = Math.abs(new Date(dup.occurredAt).getTime() - new Date(primary.occurredAt).getTime());
      expect(gapMs).toBeLessThanOrEqual(48 * 60 * 60 * 1000);
    }
  });

  it("is deterministic on real data (same input → identical JSON)", () => {
    const again = computeDuplicateDetection({ events: stream.events, children, today: "2026-06-03" });
    expect(JSON.stringify(result)).toBe(JSON.stringify(again));
  });

  it("always returns at least one Cara insight", () => {
    expect(result.insights.length).toBeGreaterThan(0);
    for (const i of result.insights) {
      expect(["critical", "warning", "positive"]).toContain(i.severity);
    }
  });

  it("seeds a detectable duplicate when an event is intentionally copied", () => {
    // Take a real child event and clone it 1 hour later — must be flagged.
    const withChild = stream.events.find((e) => !!e.childId);
    expect(withChild).toBeDefined();
    const clone = {
      ...withChild!,
      id: `${withChild!.id}_copy`,
      occurredAt: new Date(new Date(withChild!.occurredAt).getTime() + 60 * 60 * 1000).toISOString(),
    };
    const seeded = computeDuplicateDetection({
      events: [...stream.events, clone],
      children,
      today: "2026-06-03",
    });
    const pair = seeded.duplicates.find(
      (d) => d.duplicate_event_id === clone.id || d.primary_event_id === clone.id,
    );
    expect(pair).toBeDefined();
    expect(pair!.similarity).toBe(1);
  });
});
