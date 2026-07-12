import { describe, it, expect } from "vitest";
import { unifiedAlerts, unifiedEscalations } from "../operational-spine-engine";

const NOW = "2026-07-12T10:00:00.000Z";

describe("operational spine — unified alerts (pure projection over the real store)", () => {
  const result = unifiedAlerts(NOW);

  it("aggregates every source with per-source health reporting", () => {
    const names = result.sources.map((s) => s.source);
    expect(names).toEqual([
      "emergency_alerts",
      "task_sla_breaches",
      "overdue_tasks",
      "unread_notifications",
    ]);
    // no source blew up on the seeded store
    expect(result.sources.every((s) => s.ok)).toBe(true);
  });

  it("items are severity-ranked (critical first) with deep links", () => {
    for (let i = 1; i < result.items.length; i++) {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      expect(order[result.items[i - 1].severity]).toBeLessThanOrEqual(order[result.items[i].severity]);
    }
    for (const item of result.items) {
      expect(item.href.startsWith("/")).toBe(true);
      expect(item.title.length).toBeGreaterThan(0);
    }
  });

  it("totals reconcile with items", () => {
    const sum = Object.values(result.totals).reduce((a, b) => a + b, 0);
    expect(sum).toBe(result.items.length);
  });

  it("is deterministic for a fixed now", () => {
    expect(unifiedAlerts(NOW)).toEqual(result);
  });
});

describe("operational spine — unified escalations", () => {
  const result = unifiedEscalations(NOW, "home_oak");

  it("aggregates decisions + trajectory + urgent tasks, awaiting-decision ranked critical", () => {
    const names = result.sources.map((s) => s.source);
    expect(names).toEqual([
      "risk_escalation_decisions",
      "trajectory_ri_escalations",
      "urgent_overdue_tasks",
    ]);
    expect(result.sources.every((s) => s.ok)).toBe(true);
    const awaiting = result.items.filter((i) => i.title.startsWith("Awaiting decision"));
    for (const a of awaiting) expect(a.severity).toBe("critical");
  });

  it("escalation decisions from the seeded store are present", () => {
    const fromDecisions = result.items.filter((i) => i.source === "risk_escalation_decisions");
    expect(fromDecisions.length).toBeGreaterThan(0);
  });
});
