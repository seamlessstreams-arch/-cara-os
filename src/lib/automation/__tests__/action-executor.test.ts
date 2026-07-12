import { describe, it, expect, afterEach } from "vitest";
import { getStore } from "@/lib/db/store";
import { executeRuns, isExecutorEnabled } from "../action-executor";
import type { AutomationRun } from "../types";

// Phase 2 · Operational Control · Module 1 — the automation engine was
// simulate-only; this proves the executor's three guarantees: flag-gated,
// safe-subset-only, honest outcomes.

const FLAG = "CARA_AUTOMATION_EXECUTOR";
afterEach(() => {
  delete process.env[FLAG];
});

const CTX = { userId: "staff_darren", homeId: null };

const mkRun = (ruleId: string): AutomationRun => ({
  id: "run_1",
  rule_id: ruleId,
  trigger: "incident_severity_high",
  trigger_data: { child_id: "yp_alex" },
  actions_executed: [],
  status: "success",
  duration_ms: 1,
  created_at: "2026-07-12T00:00:00.000Z",
});

describe("automation action executor", () => {
  it("flag OFF (default): executes nothing — simulate-only behaviour preserved", () => {
    delete process.env[FLAG];
    expect(isExecutorEnabled()).toBe(false);
    const before = getStore().tasks.length;
    const rules = [{ id: "r1", name: "High severity incident", actions: [{ action: "create_task" as const, params: {} }] }];
    const out = executeRuns([mkRun("r1")], rules, {}, CTX);
    expect(out[0].executed).toBe(false);
    expect(out[0].outcomes[0].status).toBe("skipped");
    expect(out[0].outcomes[0].detail).toContain("flag is off");
    expect(getStore().tasks.length).toBe(before); // nothing created
  });

  it("flag ON: create_task really creates a task (and cleans up)", () => {
    process.env[FLAG] = "true";
    const before = getStore().tasks.length;
    const rules = [{
      id: "r1",
      name: "High severity incident",
      actions: [{ action: "create_task" as const, params: { title: "Review the incident", priority: "urgent" } }],
    }];
    const out = executeRuns([mkRun("r1")], rules, { child_id: "yp_alex" }, CTX);
    expect(out[0].executed).toBe(true);
    expect(out[0].outcomes[0].status).toBe("executed");
    expect(out[0].outcomes[0].created_id).toBeTruthy();
    expect(getStore().tasks.length).toBe(before + 1);
    const created = getStore().tasks.find((t) => t.id === out[0].outcomes[0].created_id)!;
    expect(created.title).toBe("Review the incident");
    expect(created.created_by).toBe("staff_darren");
    // cleanup the shared store
    getStore().tasks.splice(getStore().tasks.findIndex((t) => t.id === created.id), 1);
  });

  it("flag ON: notify_manager resolves the RM from the roster and creates a notification", () => {
    process.env[FLAG] = "true";
    const before = getStore().notifications.length;
    const rules = [{ id: "r2", name: "Missing from care", actions: [{ action: "notify_manager" as const, params: { message: "Child reported missing" } }] }];
    const out = executeRuns([mkRun("r2")], rules, {}, CTX);
    expect(out[0].outcomes[0].status).toBe("executed");
    expect(getStore().notifications.length).toBe(before + 1);
    const n = getStore().notifications[getStore().notifications.length - 1];
    expect(n.recipient_id).toBe("staff_darren"); // the seeded RM
    getStore().notifications.splice(getStore().notifications.length - 1, 1);
  });

  it("flag ON: official-record actions are NEVER executed — requires_confirmation", () => {
    process.env[FLAG] = "true";
    const rules = [{
      id: "r3",
      name: "Safeguarding escalation",
      actions: [
        { action: "escalate_safeguarding" as const, params: {} },
        { action: "update_compliance_status" as const, params: {} },
      ],
    }];
    const out = executeRuns([mkRun("r3")], rules, {}, CTX);
    expect(out[0].outcomes.every((o) => o.status === "requires_confirmation")).toBe(true);
    expect(out[0].outcomes[0].detail).toContain("human");
  });

  it("flag ON: unmapped action types are honestly skipped, not faked", () => {
    process.env[FLAG] = "true";
    const rules = [{ id: "r4", name: "Dashboard flag", actions: [{ action: "flag_dashboard" as const, params: {} }] }];
    const out = executeRuns([mkRun("r4")], rules, {}, CTX);
    expect(out[0].outcomes[0].status).toBe("skipped");
    expect(out[0].outcomes[0].detail).toContain("No deterministic execution target");
  });

  it("notification with no resolvable recipient is skipped with the reason", () => {
    process.env[FLAG] = "true";
    const rules = [{ id: "r5", name: "Notify a staff member", actions: [{ action: "notify_staff" as const, params: {} }] }];
    const out = executeRuns([mkRun("r5")], rules, {}, CTX);
    expect(out[0].outcomes[0].status).toBe("skipped");
    expect(out[0].outcomes[0].detail).toContain("No resolvable recipient");
  });
});
