// Integration: captureEvent → persisted spine → buildLiveEventStream → intelligence.
import { describe, it, expect, beforeEach } from "vitest";
import { getStore, db } from "@/lib/db/store";
import { captureEvent } from "../capture-event-service";
import { buildLiveEventStream } from "@/lib/event-stream/live-event-stream";
import { buildEventStream } from "@/lib/event-stream/event-projector";
import { mapStoreToEventInput } from "@/lib/event-stream/store-mapper";
import { computeEventIntelligence } from "@/lib/event-intelligence/event-intelligence-engine";

const TODAY = "2026-06-03";

// Isolate the persisted spine per test (the projected domain collections are untouched).
beforeEach(() => { getStore().cornerstoneEvents.length = 0; });

describe("captureEvent integration (write path → spine)", () => {
  it("persists a clean novel event to the canonical spine and surfaces it in the live stream", () => {
    const projectedLen = buildEventStream(mapStoreToEventInput(getStore())).events.length;

    const out = captureEvent(
      { eventType: "keywork", childId: "yp_alex", summary: "Captured-once test: key-work session planning a weekend museum visit and reviewing personal goals." },
      { id: "evt_cap_int1", now: "2026-06-02T10:00:00.000Z", today: TODAY },
    );

    expect(out.persisted).toBe(true);
    expect(out.event!.id).toBe("evt_cap_int1");
    expect(getStore().cornerstoneEvents.length).toBe(1);
    expect(db.cornerstoneEvents.findById("evt_cap_int1")).toBeDefined();

    // Surfaces everywhere the spine is read — union with no double-count.
    const live = buildLiveEventStream(getStore());
    expect(live.events.length).toBe(projectedLen + 1);
    expect(live.events.filter((e) => e.id === "evt_cap_int1").length).toBe(1);

    // And it flows into the cross-domain intelligence that reads the spine:
    // the child-linked captured event lifts the intelligence count by exactly one.
    const children = (getStore().youngPeople as any[]).map((yp) => ({ id: yp.id, name: `${yp.first_name} ${yp.last_name}` }));
    const projectedIntel = computeEventIntelligence({ events: buildEventStream(mapStoreToEventInput(getStore())).events, children, today: TODAY });
    const liveIntel = computeEventIntelligence({ events: live.events, children, today: TODAY });
    expect(liveIntel.overview.total_events).toBe(projectedIntel.overview.total_events + 1);
  });

  it("holds a re-submission as a duplicate (never-duplicate), then persists under force", () => {
    const draft = {
      eventType: "incident" as const, childId: "yp_jordan", riskLevel: "medium" as const,
      summary: "Captured-once test: brief verbal disagreement in the lounge over choice of film; resolved through staff mediation in minutes.",
    };
    const first = captureEvent(draft, { id: "evt_cap_d1", now: "2026-06-02T09:00:00.000Z", today: TODAY });
    expect(first.persisted).toBe(true);
    expect(getStore().cornerstoneEvents.length).toBe(1);

    const second = captureEvent(draft, { id: "evt_cap_d2", now: "2026-06-02T10:00:00.000Z", today: TODAY });
    expect(second.persisted).toBe(false);
    expect(second.hold_reason).toMatch(/duplicate/i);
    expect(getStore().cornerstoneEvents.length).toBe(1); // unchanged — the duplicate was not written

    const forced = captureEvent(draft, { id: "evt_cap_d3", now: "2026-06-02T11:00:00.000Z", today: TODAY, force: true });
    expect(forced.persisted).toBe(true);
    expect(getStore().cornerstoneEvents.length).toBe(2);
  });

  it("records external routing as gated (requires human approval) and never sends", () => {
    const out = captureEvent(
      { eventType: "safeguarding", childId: "yp_casey", riskLevel: "critical",
        summary: "Captured-once test: disclosure of a historic safeguarding concern made to the key worker; strategy discussion to be arranged." },
      { id: "evt_cap_sg1", now: "2026-06-02T08:00:00.000Z", today: TODAY },
    );
    expect(out.persisted).toBe(true);
    // Capture records routing intent only; any external destination stays gated.
    if (out.capture.routing.external_apis.length > 0) {
      expect(out.capture.routing.requires_human_approval).toBe(true);
    }
  });

  it("is deterministic — identical capture (same id/now/today) yields identical outcome JSON", () => {
    const draft = { eventType: "health" as const, childId: "yp_alex", summary: "Captured-once test: dental check-up attended, no treatment required." };
    const a = captureEvent(draft, { id: "evt_cap_det", now: "2026-06-02T12:00:00.000Z", today: TODAY });
    getStore().cornerstoneEvents.length = 0; // reset so the second run sees the same empty spine
    const b = captureEvent(draft, { id: "evt_cap_det", now: "2026-06-02T12:00:00.000Z", today: TODAY });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
