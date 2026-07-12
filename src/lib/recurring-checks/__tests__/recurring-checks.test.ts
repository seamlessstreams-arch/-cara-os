import { describe, it, expect, afterEach } from "vitest";
import {
  DEFAULT_CHECK_TEMPLATES,
  periodKey,
  checkMarker,
  periodDueDate,
  computeMissingChecks,
  computeCheckStatuses,
} from "../recurring-checks-engine";
import { materialiseRecurringChecks } from "../materialise";
import { getStore } from "@/lib/db/store";

const FLAG = "CARA_RECURRING_CHECKS";
afterEach(() => {
  delete process.env[FLAG];
  // remove anything the materialiser created
  const tasks = getStore().tasks;
  for (let i = tasks.length - 1; i >= 0; i--) {
    if (tasks[i].created_by === "system_recurring_checks") tasks.splice(i, 1);
  }
});

const NOW = "2026-07-12T10:00:00.000Z"; // a Sunday

describe("period keys (deterministic bucketing)", () => {
  it("daily / weekly / monthly keys are stable and correct", () => {
    expect(periodKey("daily", NOW)).toBe("2026-07-12");
    expect(periodKey("monthly", NOW)).toBe("2026-07");
    expect(periodKey("weekly", NOW)).toMatch(/^2026-W\d{2}$/);
    // same week, different day → same weekly key
    expect(periodKey("weekly", "2026-07-08T09:00:00.000Z")).toBe(periodKey("weekly", NOW));
    // next week → different key
    expect(periodKey("weekly", "2026-07-13T09:00:00.000Z")).not.toBe(periodKey("weekly", NOW));
  });

  it("due dates land at period end", () => {
    expect(periodDueDate("daily", NOW)).toBe("2026-07-12");
    expect(periodDueDate("weekly", NOW)).toBe("2026-07-12"); // Sunday = week end
    expect(periodDueDate("monthly", NOW)).toBe("2026-07-31");
  });
});

describe("computeMissingChecks / statuses", () => {
  const templates = DEFAULT_CHECK_TEMPLATES.slice(0, 2); // fire alarm (weekly), fire drill (monthly)

  it("everything missing when no tasks carry markers", () => {
    const missing = computeMissingChecks(templates, [], NOW);
    expect(missing.length).toBe(2);
    expect(missing[0].marker).toContain("recurring-check:");
  });

  it("a task carrying the marker satisfies the period (idempotency)", () => {
    const marker = checkMarker(templates[0].id, periodKey(templates[0].cadence, NOW));
    const tasks = [{ id: "t1", description: `Fire alarm test ${marker}`, status: "pending" }];
    const missing = computeMissingChecks(templates, tasks, NOW);
    expect(missing.map((m) => m.template.id)).not.toContain(templates[0].id);
    const statuses = computeCheckStatuses(templates, tasks, NOW);
    expect(statuses.find((s) => s.template_id === templates[0].id)?.status).toBe("pending");
  });

  it("a completed marker task reads as done", () => {
    const marker = checkMarker(templates[0].id, periodKey(templates[0].cadence, NOW));
    const tasks = [{ id: "t1", description: marker, status: "completed" }];
    const statuses = computeCheckStatuses(templates, tasks, NOW);
    expect(statuses.find((s) => s.template_id === templates[0].id)?.status).toBe("done");
  });
});

describe("materialiser (flag-gated, idempotent)", () => {
  it("flag OFF (default): creates nothing", () => {
    const before = getStore().tasks.length;
    const r = materialiseRecurringChecks(NOW);
    expect(r.enabled).toBe(false);
    expect(r.created).toBe(0);
    expect(getStore().tasks.length).toBe(before);
  });

  it("flag ON: creates one task per active template, and a re-run creates zero", () => {
    process.env[FLAG] = "true";
    const before = getStore().tasks.length;
    const first = materialiseRecurringChecks(NOW);
    expect(first.enabled).toBe(true);
    expect(first.created).toBe(first.considered);
    expect(getStore().tasks.length).toBe(before + first.created);
    const second = materialiseRecurringChecks(NOW);
    expect(second.created).toBe(0); // idempotent — markers already present
  });
});
