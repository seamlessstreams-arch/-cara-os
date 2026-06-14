import { describe, it, expect } from "vitest";
import { computeEventIntelligence, type EventIntelligenceInput } from "../event-intelligence-engine";
import type { CornerstoneEvent, CornerstoneEventType, CornerstoneRiskLevel, CornerstoneApprovalLevel } from "@/types/cornerstone-event";

const TODAY = "2026-06-02";
function addDays(date: string, n: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const at = (n: number) => `${addDays(TODAY, -n)}T00:00:00.000Z`;

function ev(o: {
  id: string; daysAgo: number; risk: CornerstoneRiskLevel; type?: CornerstoneEventType;
  childId?: string; approval?: CornerstoneApprovalLevel; flags?: string[]; themes?: string[];
}): CornerstoneEvent {
  return {
    id: o.id, eventType: o.type ?? "incident", homeId: "home_oak", childId: o.childId,
    occurredAt: at(o.daysAgo), createdBy: "system", summary: `${o.type ?? "incident"} ${o.id}`,
    structuredTags: [], riskLevel: o.risk, requiresApproval: !!o.approval, approvalLevel: o.approval,
    linkedDocuments: [], linkedTasks: [], linkedRisks: [], linkedNotifications: [],
    caraAnalysis: { themes: o.themes ?? [], suggestedActions: [], complianceFlags: o.flags ?? [], missingInformation: [], confidenceScore: 1 },
    audit: { createdAt: at(o.daysAgo), updatedAt: at(o.daysAgo), version: 1, changeHistory: [] },
  };
}
function run(p: Partial<EventIntelligenceInput>): EventIntelligenceInput {
  return { events: [], today: TODAY, ...p };
}

// ══════════════════════════════════════════════════════════════════════════════
describe("empty input", () => {
  const r = computeEventIntelligence(run({}));
  it("returns an empty result", () => {
    expect(r.overview.total_events).toBe(0);
    expect(r.child_radar).toHaveLength(0);
    expect(r.approval_backlog).toHaveLength(0);
    expect(r.alerts).toHaveLength(0);
  });
});

describe("per-child risk radar", () => {
  const r = computeEventIntelligence(run({
    children: [{ id: "a", name: "Alex" }, { id: "b", name: "Bo" }],
    events: [
      ev({ id: "1", daysAgo: 3, risk: "critical", type: "safeguarding", childId: "a", approval: "manager", flags: ["Ofsted notification (Reg 40) may be required"], themes: ["safeguarding"] }),
      ev({ id: "2", daysAgo: 10, risk: "high", type: "missing", childId: "a", approval: "deputy", flags: ["Return home interview outstanding (72h)"], themes: ["missing from care"] }),
      ev({ id: "3", daysAgo: 20, risk: "medium", type: "medication", childId: "a" }),
      ev({ id: "4", daysAgo: 40, risk: "low", type: "daily_log", childId: "a" }),
      ev({ id: "5", daysAgo: 8, risk: "low", type: "keywork", childId: "b" }),
    ],
  }));
  const alex = r.child_radar.find((c) => c.child_id === "a")!;

  it("computes a weighted, escalating risk score for the most-active child", () => {
    expect(alex.child_name).toBe("Alex");
    expect(alex.events_90d).toBe(4);
    expect(alex.weighted_recent).toBe(22); // 12 + 7 + 3
    expect(alex.weighted_prior).toBe(1);
    expect(alex.trend).toBe("escalating");
    expect(alex.risk_score).toBe(96);
  });
  it("counts pending approvals, critical events and open compliance flags per child", () => {
    expect(alex.pending_approvals).toBe(2);
    expect(alex.critical_events).toBe(1);
    expect(alex.open_compliance_flags).toBe(2);
  });
  it("ranks the most-at-risk child first", () => {
    expect(r.child_radar[0].child_id).toBe("a");
    expect(r.overview.most_at_risk_child).toBe("Alex");
  });
});

describe("approval backlog by level", () => {
  const r = computeEventIntelligence(run({
    events: [
      ev({ id: "1", daysAgo: 2, risk: "critical", type: "safeguarding", approval: "ri" }),
      ev({ id: "2", daysAgo: 3, risk: "high", type: "physical_intervention", approval: "manager" }),
      ev({ id: "3", daysAgo: 4, risk: "high", type: "missing", approval: "deputy" }),
      ev({ id: "4", daysAgo: 5, risk: "medium", type: "daily_log", approval: "manager" }),
      ev({ id: "5", daysAgo: 6, risk: "low", type: "keywork" }), // no approval
    ],
  }));
  it("groups events awaiting sign-off by approval level, RI first", () => {
    expect(r.overview.pending_approvals).toBe(4);
    expect(r.approval_backlog[0].approvalLevel).toBe("ri");
    const manager = r.approval_backlog.find((b) => b.approvalLevel === "manager")!;
    expect(manager.count).toBe(2);
  });
  it("raises an alert that RI sign-off is awaited", () => {
    expect(r.alerts.some((a) => /RI sign-off/i.test(a.message))).toBe(true);
  });
});

describe("compliance register and theme trends", () => {
  const r = computeEventIntelligence(run({
    events: [
      ev({ id: "1", daysAgo: 2, risk: "high", type: "missing", flags: ["Return home interview outstanding (72h)"], themes: ["missing from care", "child safety"] }),
      ev({ id: "2", daysAgo: 5, risk: "high", type: "missing", flags: ["Return home interview outstanding (72h)"], themes: ["missing from care"] }),
      ev({ id: "3", daysAgo: 8, risk: "medium", type: "qa_check", flags: ["Audit score below expected standard — action plan required"], themes: ["quality assurance"] }),
    ],
  }));
  it("aggregates open compliance flags, most common first", () => {
    expect(r.compliance_register[0].flag).toMatch(/Return home interview/);
    expect(r.compliance_register[0].count).toBe(2);
    expect(r.overview.open_compliance_flags).toBe(3);
  });
  it("ranks the most active themes", () => {
    expect(r.theme_trends[0].theme).toBe("missing from care");
    expect(r.theme_trends[0].count).toBe(2);
  });
});

describe("insights", () => {
  it("emits escalation, compliance and backlog insights", () => {
    const r = computeEventIntelligence(run({
      children: [{ id: "a", name: "Alex" }],
      events: [
        ev({ id: "1", daysAgo: 3, risk: "critical", type: "safeguarding", childId: "a", approval: "manager", flags: ["Reg 40 likely required"] }),
        ev({ id: "2", daysAgo: 6, risk: "high", type: "missing", childId: "a", approval: "deputy", flags: ["RHI outstanding"] }),
        ev({ id: "3", daysAgo: 9, risk: "high", type: "incident", childId: "a" }),
      ],
    }));
    expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
    expect(r.insights.some((i) => i.severity === "warning")).toBe(true);
  });
});

describe("determinism", () => {
  it("returns identical output for identical input", () => {
    const input = run({
      children: [{ id: "a", name: "Alex" }],
      events: [ev({ id: "1", daysAgo: 3, risk: "critical", childId: "a", approval: "manager", flags: ["x"] }), ev({ id: "2", daysAgo: 20, risk: "low", childId: "a" })],
    });
    expect(JSON.stringify(computeEventIntelligence(input))).toBe(JSON.stringify(computeEventIntelligence(input)));
  });
});
