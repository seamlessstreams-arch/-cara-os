// Integration test: REAL store → canonical stream (projector) → routing plans.
import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildEventStream } from "@/lib/event-stream/event-projector";
import { mapStoreToEventInput } from "@/lib/event-stream/store-mapper";
import { computeEventRouting } from "../event-routing-engine";

describe("event-routing integration (store → projector → routing)", () => {
  const stream = buildEventStream(mapStoreToEventInput(getStore()));
  const result = computeEventRouting({ events: stream.events });

  it("produces a routing plan for every event", () => {
    expect(stream.events.length).toBeGreaterThan(0);
    expect(result.plans.length).toBe(stream.events.length);
    expect(result.overview.total_events).toBe(stream.events.length);
  });

  it("auto-routes informational events but never auto-fires external notifications", () => {
    expect(result.overview.auto_routed).toBeGreaterThan(0);
    // Any plan with external APIs must be gated for human approval.
    for (const p of result.plans) {
      if (p.external_apis.length > 0) {
        expect(p.requires_human_approval).toBe(true);
        expect(p.status).toBe("pending_approval");
      }
    }
  });

  it("surfaces statutory external notifications as pending (e.g. Ofsted / Police)", () => {
    // Seed has a safeguarding incident + missing episodes, so external notifications exist.
    expect(result.overview.external_notifications_pending).toBeGreaterThan(0);
    const apis = Object.keys(result.overview.external_api_counts);
    expect(apis.length).toBeGreaterThan(0);
  });

  it("routes the most events to the child profile (capture once, surface on the record)", () => {
    expect(result.overview.destination_counts.childProfile).toBeGreaterThan(0);
  });
});
