// Integration: REAL store → canonical stream → workflow orchestration actions.
import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildEventStream } from "@/lib/event-stream/event-projector";
import { mapStoreToEventInput } from "@/lib/event-stream/store-mapper";
import { computeWorkflowOrchestration } from "../workflow-orchestration-engine";

describe("workflow-orchestration integration (store → projector → actions)", () => {
  const events = buildEventStream(mapStoreToEventInput(getStore())).events;
  const result = computeWorkflowOrchestration({ events });

  it("generates actions from real events", () => {
    expect(events.length).toBeGreaterThan(0);
    expect(result.overview.rules_fired).toBeGreaterThan(0);
    expect(result.overview.actions_generated).toBeGreaterThan(0);
  });

  it("fires the incident workflow and produces an approval task with escalation", () => {
    const hasIncident = events.some((e) => e.eventType === "incident");
    if (hasIncident) {
      expect(result.triggered.some((t) => t.rule_id === "wf-incident")).toBe(true);
      const appr = result.actions.find((a) => a.type === "create_approval_task" && a.rule_id === "wf-incident");
      expect(appr).toBeDefined();
      expect(appr!.escalation).not.toBeNull();
    }
  });

  it("drafts external notifications (gated) for safeguarding/missing events present in the seed", () => {
    const hasGatedSource = events.some((e) => e.eventType === "safeguarding" || e.eventType === "missing");
    if (hasGatedSource) {
      expect(result.overview.notifications_drafted).toBeGreaterThan(0);
      for (const a of result.actions.filter((x) => x.notification_draft)) {
        expect(a.requires_approval).toBe(true); // never auto-sent
      }
    }
  });

  it("every generated action has an owner and a stable id", () => {
    for (const a of result.actions) {
      expect(a.owner_role.length).toBeGreaterThan(0);
      expect(a.id.startsWith("act_")).toBe(true);
    }
  });
});
