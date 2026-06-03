import { describe, it, expect, beforeEach } from "vitest";
import { createIncident, getAuditLog, type CreateIncidentInput } from "../incident-orchestrator";
import { getStore } from "@/lib/db/store";
import { buildLiveEventStream } from "@/lib/event-stream/live-event-stream";

function baseInput(overrides?: Partial<CreateIncidentInput>): CreateIncidentInput {
  return {
    child_id: "child_1",
    type: "behaviour_incident",
    severity: "medium",
    date: "2026-05-28",
    time: "14:30",
    description: "Jake became dysregulated during homework time and threw his textbook across the room.",
    immediate_action: "Staff de-escalated using calm voice technique. Jake was offered a sensory break in the quiet room.",
    reported_by: "staff_darren",
    home_id: "home_oak",
    ...overrides,
  };
}

describe("Incident Orchestrator — createIncident", () => {
  // ── Core creation ───────────────────────────────────────────────────────
  describe("incident creation", () => {
    it("creates an incident with auto-generated ID", () => {
      const result = createIncident(baseInput());
      expect(result.incident.id).toBeTruthy();
      expect(result.incident.id).toMatch(/^inc/);
    });

    it("generates a reference number in INC-YYYY-NNNN format", () => {
      const result = createIncident(baseInput());
      expect(result.incident.reference).toMatch(/^INC-\d{4}-\d{4}$/);
    });

    it("saves all input fields to the incident", () => {
      const input = baseInput({ location: "Living room", witnesses: ["staff_sarah"] });
      const result = createIncident(input);
      expect(result.incident.child_id).toBe("child_1");
      expect(result.incident.type).toBe("behaviour_incident");
      expect(result.incident.severity).toBe("medium");
      expect(result.incident.date).toBe("2026-05-28");
      expect(result.incident.time).toBe("14:30");
      expect(result.incident.location).toBe("Living room");
      expect(result.incident.description).toContain("Jake became dysregulated");
      expect(result.incident.immediate_action).toContain("de-escalated");
      expect(result.incident.reported_by).toBe("staff_darren");
      expect(result.incident.witnesses).toEqual(["staff_sarah"]);
    });

    it("sets status to 'open'", () => {
      const result = createIncident(baseInput());
      expect(result.incident.status).toBe("open");
    });

    it("sets requires_oversight true for high severity", () => {
      const result = createIncident(baseInput({ severity: "high" }));
      expect(result.incident.requires_oversight).toBe(true);
    });

    it("sets requires_oversight true for critical severity", () => {
      const result = createIncident(baseInput({ severity: "critical" }));
      expect(result.incident.requires_oversight).toBe(true);
    });

    it("sets requires_oversight false for medium severity", () => {
      const result = createIncident(baseInput({ severity: "medium" }));
      expect(result.incident.requires_oversight).toBe(false);
    });

    it("sets requires_oversight false for low severity", () => {
      const result = createIncident(baseInput({ severity: "low" }));
      expect(result.incident.requires_oversight).toBe(false);
    });

    it("sets created_at and updated_at timestamps", () => {
      const result = createIncident(baseInput());
      expect(result.incident.created_at).toBeTruthy();
      expect(result.incident.updated_at).toBeTruthy();
    });

    it("stores body_map_required flag", () => {
      const result = createIncident(baseInput({ body_map_required: true }));
      expect(result.incident.body_map_required).toBe(true);
      expect(result.incident.body_map_completed).toBe(false);
    });

    it("stores notifications array", () => {
      const result = createIncident(baseInput({
        notifications: [{ role: "Manager", name: "Darren", method: "Phone" }],
      }));
      expect(result.incident.notifications).toHaveLength(1);
      expect(result.incident.notifications[0].role).toBe("Manager");
    });
  });

  // ── Audit logging ──────────────────────────────────────────────────────
  describe("audit logging", () => {
    it("creates an audit entry", () => {
      const result = createIncident(baseInput());
      expect(result.audit_entry).toBeTruthy();
      expect(result.audit_entry.id).toMatch(/^audit_/);
    });

    it("audit entry has correct event type", () => {
      const result = createIncident(baseInput());
      expect(result.audit_entry.event_type).toBe("incident_created");
    });

    it("audit entry references the incident", () => {
      const result = createIncident(baseInput());
      expect(result.audit_entry.entity_type).toBe("incident");
      expect(result.audit_entry.entity_id).toBe(result.incident.id);
    });

    it("audit entry records the actor", () => {
      const result = createIncident(baseInput({ reported_by: "staff_sarah" }));
      expect(result.audit_entry.actor_id).toBe("staff_sarah");
    });

    it("audit entry includes summary with reference", () => {
      const result = createIncident(baseInput());
      expect(result.audit_entry.summary).toContain(result.incident.reference);
      expect(result.audit_entry.summary).toContain("behaviour incident");
    });

    it("audit entry risk level matches severity", () => {
      expect(createIncident(baseInput({ severity: "critical" })).audit_entry.risk_level).toBe("critical");
      expect(createIncident(baseInput({ severity: "high" })).audit_entry.risk_level).toBe("high");
      expect(createIncident(baseInput({ severity: "medium" })).audit_entry.risk_level).toBe("medium");
      expect(createIncident(baseInput({ severity: "low" })).audit_entry.risk_level).toBe("low");
    });

    it("audit entries accumulate in the log", () => {
      createIncident(baseInput());
      createIncident(baseInput());
      const log = getAuditLog();
      expect(log.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── Timeline events ────────────────────────────────────────────────────
  describe("timeline events", () => {
    it("creates a timeline event", () => {
      const result = createIncident(baseInput());
      expect(result.timeline_event).toBeTruthy();
      expect(result.timeline_event.id).toBeTruthy();
    });

    it("timeline event type is incident_submitted", () => {
      const result = createIncident(baseInput());
      expect(result.timeline_event.event_type).toBe("incident_submitted");
    });

    it("timeline event links to the incident", () => {
      const result = createIncident(baseInput());
      expect(result.timeline_event.linked_record_type).toBe("incident");
      expect(result.timeline_event.linked_record_id).toBe(result.incident.id);
    });

    it("timeline event includes child and staff", () => {
      const result = createIncident(baseInput());
      expect(result.timeline_event.child_id).toBe("child_1");
      expect(result.timeline_event.staff_id).toBe("staff_darren");
    });

    it("timeline event has risk level matching severity", () => {
      expect(createIncident(baseInput({ severity: "critical" })).timeline_event.risk_level).toBe("critical");
      expect(createIncident(baseInput({ severity: "low" })).timeline_event.risk_level).toBe("low");
    });

    it("timeline event has safeguarding visibility for safeguarding types", () => {
      const result = createIncident(baseInput({ type: "safeguarding_concern" }));
      expect(result.timeline_event.visibility_level).toBe("safeguarding");
    });

    it("timeline event has standard visibility for non-safeguarding types", () => {
      const result = createIncident(baseInput({ type: "behaviour_incident" }));
      expect(result.timeline_event.visibility_level).toBe("standard");
    });

    it("timeline event tags include type and severity", () => {
      const result = createIncident(baseInput({ type: "self_harm", severity: "high" }));
      expect(result.timeline_event.tags).toContain("self_harm");
      expect(result.timeline_event.tags).toContain("high");
    });

    it("timeline event title includes reference", () => {
      const result = createIncident(baseInput());
      expect(result.timeline_event.title).toContain(result.incident.reference);
    });
  });

  // ── Follow-up task generation ──────────────────────────────────────────
  describe("task generation", () => {
    it("creates manager review task for high severity", () => {
      const result = createIncident(baseInput({ severity: "high" }));
      const reviewTask = result.tasks_created.find((t) => t.title.includes("Review incident"));
      expect(reviewTask).toBeTruthy();
      expect(reviewTask!.priority).toBe("high");
      expect(reviewTask!.category).toBe("safeguarding");
    });

    it("creates manager review task for critical severity with urgent priority", () => {
      const result = createIncident(baseInput({ severity: "critical" }));
      const reviewTask = result.tasks_created.find((t) => t.title.includes("Review incident"));
      expect(reviewTask).toBeTruthy();
      expect(reviewTask!.priority).toBe("urgent");
    });

    it("creates risk assessment review task for high severity", () => {
      const result = createIncident(baseInput({ severity: "high" }));
      const riskTask = result.tasks_created.find((t) => t.title.includes("risk assessment"));
      expect(riskTask).toBeTruthy();
    });

    it("creates body map task when body_map_required is true", () => {
      const result = createIncident(baseInput({ body_map_required: true }));
      const bodyMapTask = result.tasks_created.find((t) => t.title.includes("body map"));
      expect(bodyMapTask).toBeTruthy();
      expect(bodyMapTask!.priority).toBe("urgent");
    });

    it("does NOT create body map task when body_map_required is false", () => {
      const result = createIncident(baseInput({ body_map_required: false }));
      const bodyMapTask = result.tasks_created.find((t) => t.title.includes("body map"));
      expect(bodyMapTask).toBeUndefined();
    });

    it("creates PI debrief task for physical_intervention", () => {
      const result = createIncident(baseInput({ type: "physical_intervention", severity: "high" }));
      const debriefTask = result.tasks_created.find((t) => t.title.includes("debrief"));
      expect(debriefTask).toBeTruthy();
    });

    it("creates Reg 40 notification task for notifiable events", () => {
      const result = createIncident(baseInput({ type: "safeguarding_concern", severity: "high" }));
      const reg40Task = result.tasks_created.find((t) => t.title.includes("Reg 40"));
      expect(reg40Task).toBeTruthy();
      expect(reg40Task!.priority).toBe("urgent");
    });

    it("creates follow-up check for medium severity", () => {
      const result = createIncident(baseInput({ severity: "medium" }));
      const followUp = result.tasks_created.find((t) => t.title.includes("Follow-up check"));
      expect(followUp).toBeTruthy();
      expect(followUp!.priority).toBe("medium");
    });

    it("does NOT create follow-up check for low severity", () => {
      const result = createIncident(baseInput({ severity: "low" }));
      const followUp = result.tasks_created.find((t) => t.title.includes("Follow-up check"));
      expect(followUp).toBeUndefined();
    });

    it("all tasks link back to the incident", () => {
      const result = createIncident(baseInput({ severity: "critical", type: "physical_intervention", body_map_required: true }));
      for (const task of result.tasks_created) {
        expect(task.linked_record_type).toBe("incident");
        expect(task.linked_record_id).toBe(result.incident.id);
      }
    });

    it("task IDs are linked back to the incident record", () => {
      const result = createIncident(baseInput({ severity: "high" }));
      expect(result.incident.linked_task_ids.length).toBe(result.tasks_created.length);
      for (const task of result.tasks_created) {
        expect(result.incident.linked_task_ids).toContain(task.id);
      }
    });

    it("critical safeguarding incident generates maximum tasks", () => {
      const result = createIncident(baseInput({
        type: "safeguarding_concern",
        severity: "critical",
        body_map_required: true,
      }));
      // Manager review + risk assessment + body map + Reg 40 = at least 4
      expect(result.tasks_created.length).toBeGreaterThanOrEqual(4);
    });

    it("low severity behaviour incident generates zero tasks", () => {
      const result = createIncident(baseInput({ severity: "low", type: "behaviour_incident" }));
      expect(result.tasks_created.length).toBe(0);
    });
  });

  // ── Automation rules ───────────────────────────────────────────────────
  describe("automation rules", () => {
    it("evaluates incident_submitted automation rules", () => {
      const result = createIncident(baseInput());
      expect(result.automation_runs.length).toBeGreaterThanOrEqual(1);
    });

    it("evaluates incident_severity_high rules for high severity", () => {
      const result = createIncident(baseInput({ severity: "high" }));
      const highRun = result.automation_runs.find((r) => r.rule_name.toLowerCase().includes("severity"));
      expect(highRun).toBeTruthy();
    });

    it("does NOT evaluate severity rules for low severity", () => {
      const result = createIncident(baseInput({ severity: "low" }));
      const highRun = result.automation_runs.find((r) => r.rule_name.toLowerCase().includes("severity"));
      expect(highRun).toBeUndefined();
    });
  });

  // ── Linked updates ─────────────────────────────────────────────────────
  describe("linked updates", () => {
    it("includes incident saved message", () => {
      const result = createIncident(baseInput());
      expect(result.linked_updates.some((u) => u.includes("Incident INC-"))).toBe(true);
    });

    it("includes audit trail message", () => {
      const result = createIncident(baseInput());
      expect(result.linked_updates.some((u) => u.includes("Audit trail"))).toBe(true);
    });

    it("includes timeline event message", () => {
      const result = createIncident(baseInput());
      expect(result.linked_updates.some((u) => u.includes("Timeline event"))).toBe(true);
    });

    it("includes task creation messages", () => {
      const result = createIncident(baseInput({ severity: "high" }));
      expect(result.linked_updates.some((u) => u.includes("Task created"))).toBe(true);
    });

    it("includes oversight flag message for high/critical", () => {
      const result = createIncident(baseInput({ severity: "critical" }));
      expect(result.linked_updates.some((u) => u.includes("oversight"))).toBe(true);
    });

    it("includes automation run messages", () => {
      const result = createIncident(baseInput());
      expect(result.linked_updates.some((u) => u.includes("Automation"))).toBe(true);
    });
  });

  // ── End-to-end scenarios ───────────────────────────────────────────────
  describe("end-to-end scenarios", () => {
    it("low severity behaviour incident: minimal side effects", () => {
      const result = createIncident(baseInput({ severity: "low", type: "behaviour_incident" }));
      expect(result.incident.status).toBe("open");
      expect(result.incident.requires_oversight).toBe(false);
      expect(result.tasks_created.length).toBe(0);
      expect(result.audit_entry).toBeTruthy();
      expect(result.timeline_event).toBeTruthy();
      expect(result.linked_updates.length).toBeGreaterThanOrEqual(3); // saved + audit + timeline
    });

    it("critical safeguarding concern: full orchestration", () => {
      const result = createIncident(baseInput({
        type: "safeguarding_concern",
        severity: "critical",
        body_map_required: true,
        notifications: [
          { role: "Registered Manager", name: "Darren", method: "Phone" },
          { role: "Social Worker", name: "Jane Smith", method: "Email" },
        ],
      }));

      // Incident saved
      expect(result.incident.reference).toMatch(/^INC-/);
      expect(result.incident.requires_oversight).toBe(true);
      expect(result.incident.status).toBe("open");

      // Audit logged
      expect(result.audit_entry.risk_level).toBe("critical");

      // Timeline recorded
      expect(result.timeline_event.visibility_level).toBe("safeguarding");
      expect(result.timeline_event.risk_level).toBe("critical");

      // Tasks generated
      expect(result.tasks_created.length).toBeGreaterThanOrEqual(4);
      const taskTitles = result.tasks_created.map((t) => t.title);
      expect(taskTitles.some((t) => t.includes("Review incident"))).toBe(true);
      expect(taskTitles.some((t) => t.includes("risk assessment"))).toBe(true);
      expect(taskTitles.some((t) => t.includes("body map"))).toBe(true);
      expect(taskTitles.some((t) => t.includes("Reg 40"))).toBe(true);

      // All tasks link back
      expect(result.incident.linked_task_ids.length).toBe(result.tasks_created.length);

      // Automation rules fired
      expect(result.automation_runs.length).toBeGreaterThanOrEqual(2);

      // Linked updates comprehensive
      expect(result.linked_updates.length).toBeGreaterThanOrEqual(8);
    });

    it("physical intervention: generates debrief task", () => {
      const result = createIncident(baseInput({
        type: "physical_intervention",
        severity: "high",
        body_map_required: true,
      }));

      const taskTitles = result.tasks_created.map((t) => t.title);
      expect(taskTitles.some((t) => t.includes("debrief"))).toBe(true);
      expect(taskTitles.some((t) => t.includes("body map"))).toBe(true);
      expect(taskTitles.some((t) => t.includes("Reg 40"))).toBe(true);
    });
  });

  // ── Canonical spine write-through (forms-as-views increment 2) ─────────────
  describe("canonical spine write-through", () => {
    it("emits a validated canonical evt_inc_ event that surfaces in the live spine, de-duped vs projection", () => {
      getStore().cornerstoneEvents.length = 0;
      const result = createIncident(baseInput({ severity: "high", description: "Distinctive incident write-through probe: sustained verbal aggression in the kitchen." }));
      expect(result.canonical_event_id).toBe(`evt_inc_${result.incident.id}`);

      const live = buildLiveEventStream(getStore());
      const ev = live.events.find((e) => e.id === result.canonical_event_id);
      expect(ev).toBeDefined();
      expect(ev!.structuredTags).toContain("spine_capture");
      expect(ev!.summary).toMatch(/write-through probe/);
      expect(ev!.linkedTasks.length).toBe(result.tasks_created.length); // links carried onto the canonical event
      expect(live.events.filter((e) => e.id === result.canonical_event_id).length).toBe(1); // persisted wins, no double-count
    });

    it("routes a safeguarding-type incident through as a safeguarding event", () => {
      getStore().cornerstoneEvents.length = 0;
      const result = createIncident(baseInput({ type: "safeguarding_concern", severity: "high", description: "Probe: safeguarding disclosure requiring a strategy discussion." }));
      const ev = buildLiveEventStream(getStore()).events.find((e) => e.id === result.canonical_event_id);
      expect(ev).toBeDefined();
      expect(ev!.eventType).toBe("safeguarding");
    });
  });
});
