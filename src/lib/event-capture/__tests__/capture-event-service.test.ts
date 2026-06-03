import { describe, it, expect } from "vitest";
import { draftToEvent, buildCapturePlan, type CaptureDraft } from "../capture-event-service";
import type { CornerstoneEvent, CornerstoneEventType, CornerstoneRiskLevel } from "@/types/cornerstone-event";

const NOW = "2026-05-01T11:00:00.000Z";
const TODAY = "2026-05-02";

function ev(o: {
  id: string; eventType: CornerstoneEventType; occurredAt: string;
  childId?: string; summary?: string; risk?: CornerstoneRiskLevel; tags?: string[];
}): CornerstoneEvent {
  return {
    id: o.id, eventType: o.eventType, homeId: "home_oak", childId: o.childId,
    occurredAt: o.occurredAt, createdBy: "staff_x", summary: o.summary ?? "",
    structuredTags: o.tags ?? [o.eventType], riskLevel: o.risk ?? "low",
    requiresApproval: false, linkedDocuments: [], linkedTasks: [], linkedRisks: [], linkedNotifications: [],
    audit: { createdAt: o.occurredAt, updatedAt: o.occurredAt, version: 1, changeHistory: [] },
  };
}

describe("capture-event service (pure core)", () => {
  it("draftToEvent stamps a canonical event with id, audit, evidence and derived approval", () => {
    const e = draftToEvent(
      { eventType: "safeguarding", childId: "yp1", summary: "Disclosure made to key worker.", riskLevel: "critical" },
      { id: "evt_cap_1", now: NOW },
    );
    expect(e.id).toBe("evt_cap_1");
    expect(e.occurredAt).toBe(NOW);            // defaults to now when not provided
    expect(e.audit.version).toBe(1);
    expect(e.audit.createdAt).toBe(NOW);
    expect(e.evidenceCategories!.length).toBeGreaterThan(0);
    expect(e.requiresApproval).toBe(true);     // derived from safeguarding/critical
    expect(e.approvalLevel).toBeTruthy();
    expect(e.structuredTags).toContain("safeguarding");
  });

  it("persists a clean novel draft (validate-once passes, no duplicate)", () => {
    const candidate = draftToEvent(
      { eventType: "keywork", childId: "yp1", summary: "Key-work session reviewing goals and weekend plans." },
      { id: "evt_cap_novel", now: NOW },
    );
    const plan = buildCapturePlan(candidate, [], TODAY);
    expect(plan.persist).toBe(true);
    expect(plan.hold_reason).toBeNull();
    expect(plan.capture.ready_to_submit).toBe(true);
  });

  it("HOLDS an invalid draft — validate once at the write boundary (never overridable)", () => {
    const candidate = draftToEvent(
      { eventType: "daily_log", summary: "" } as CaptureDraft, // empty summary + missing childId
      { id: "evt_cap_bad", now: NOW },
    );
    const plan = buildCapturePlan(candidate, [], TODAY, { force: true }); // force must NOT override validation
    expect(plan.persist).toBe(false);
    expect(plan.capture.validation.passed).toBe(false);
    expect(plan.hold_reason).toMatch(/validation/i);
  });

  it("HOLDS a suspected duplicate (never-duplicate) — unless force is set", () => {
    const existing = [ev({
      id: "evt_inc_seed", eventType: "incident", childId: "yp1",
      occurredAt: "2026-05-01T10:00:00.000Z",
      summary: "Altercation in the kitchen between two residents over the television remote.",
      risk: "medium",
    })];
    const candidate = draftToEvent(
      { eventType: "incident", childId: "yp1", riskLevel: "medium",
        summary: "Altercation in the kitchen between two residents over the television remote." },
      { id: "evt_cap_dup", now: NOW },
    );
    const held = buildCapturePlan(candidate, existing, TODAY);
    expect(held.persist).toBe(false);
    expect(held.capture.duplicates.suspected).toBe(true);
    expect(held.hold_reason).toMatch(/duplicate/i);

    const forced = buildCapturePlan(candidate, existing, TODAY, { force: true });
    expect(forced.persist).toBe(true);
    expect(forced.hold_reason).toBeNull();
  });

  it("is deterministic — identical inputs yield identical plans", () => {
    const candidate = draftToEvent(
      { eventType: "health", childId: "yp1", summary: "GP appointment attended — routine review, no concerns." },
      { id: "evt_cap_det", now: NOW },
    );
    const a = buildCapturePlan(candidate, [], TODAY);
    const b = buildCapturePlan(candidate, [], TODAY);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
