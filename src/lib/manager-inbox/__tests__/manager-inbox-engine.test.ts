import { describe, it, expect } from "vitest";
import { computeManagerInbox } from "../manager-inbox-engine";
import type { CornerstoneEvent, CornerstoneEventType, CornerstoneRiskLevel, CornerstoneApprovalLevel } from "@/types/cornerstone-event";

const TODAY = "2026-06-02";
function addDays(date: string, n: number): string { const d = new Date(date); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
const at = (n: number) => `${addDays(TODAY, -n)}T00:00:00.000Z`;

function ev(o: {
  id: string; type: CornerstoneEventType; daysAgo?: number; risk?: CornerstoneRiskLevel;
  approval?: CornerstoneApprovalLevel; flags?: string[]; childId?: string; tags?: string[]; suggestion?: string;
}): CornerstoneEvent {
  return {
    id: o.id, eventType: o.type, homeId: "home_oak", childId: o.childId, occurredAt: at(o.daysAgo ?? 2), createdBy: "system",
    summary: `${o.type} ${o.id}`, structuredTags: o.tags ?? [], evidenceCategories: ["risk management"],
    riskLevel: o.risk ?? "low", requiresApproval: !!o.approval, approvalLevel: o.approval,
    linkedDocuments: [], linkedTasks: [], linkedRisks: [], linkedNotifications: [],
    caraAnalysis: { themes: [], suggestedActions: o.suggestion ? [o.suggestion] : [], complianceFlags: o.flags ?? [], missingInformation: [], confidenceScore: 1 },
    audit: { createdAt: at(o.daysAgo ?? 2), updatedAt: at(o.daysAgo ?? 2), version: 1, changeHistory: [] },
  };
}
const run = (events: CornerstoneEvent[]) => computeManagerInbox({ events, today: TODAY });

// ══════════════════════════════════════════════════════════════════════════════
describe("only actionable events reach the inbox", () => {
  const r = run([
    ev({ id: "info", type: "daily_log", risk: "low" }),  // not actionable → excluded
    ev({ id: "appr", type: "incident", risk: "high", approval: "deputy" }),
  ]);
  it("excludes purely informational low events", () => {
    expect(r.items.find((i) => i.event_id === "info")).toBeUndefined();
    expect(r.items.find((i) => i.event_id === "appr")).toBeDefined();
  });
});

describe("categorisation by precedence", () => {
  it("classifies a safeguarding event as safeguarding, critical priority, short deadline", () => {
    const i = run([ev({ id: "1", type: "safeguarding", risk: "critical", approval: "ri" })]).items[0];
    expect(i.category).toBe("safeguarding");
    expect(i.priority).toBe("critical");
    expect(i.deadline).toBe(addDays(TODAY, -2 + 1)); // occurredAt(-2) + 1 day
    expect(i.available_actions).toContain("approve");
  });
  it("classifies an approval-needed incident as approval/high", () => {
    const i = run([ev({ id: "1", type: "incident", risk: "high", approval: "deputy" })]).items[0];
    expect(i.category).toBe("approval");
    expect(i.priority).toBe("high");
    expect(i.approval_level).toBe("deputy");
  });
  it("classifies a high-risk event with no approval as high_risk", () => {
    const i = run([ev({ id: "1", type: "restraint" as CornerstoneEventType, risk: "high" })]).items[0];
    expect(i.category).toBe("high_risk");
  });
  it("classifies a flagged low event as missing_info/medium", () => {
    const i = run([ev({ id: "1", type: "medication", risk: "low", flags: ["Duty of candour outstanding"] })]).items[0];
    expect(i.category).toBe("missing_info");
    expect(i.priority).toBe("medium");
    expect(i.reason).toMatch(/candour/i);
  });
});

describe("Cara suggestion, evidence links and actions", () => {
  it("surfaces the event's Cara suggested response and evidence categories", () => {
    const i = run([ev({ id: "1", type: "incident", risk: "high", approval: "manager", suggestion: "Record the outcome and lessons learned" })]).items[0];
    expect(i.aria_suggested_response).toBe("Record the outcome and lessons learned");
    expect(i.evidence_categories).toContain("risk management");
    expect(i.available_actions).toEqual(["approve", "request_changes", "escalate"]);
  });
});

describe("overdue + sorting", () => {
  const r = run([
    ev({ id: "old", type: "incident", risk: "high", approval: "deputy", daysAgo: 10 }),  // deadline -10+3 = -7 → overdue
    ev({ id: "newcrit", type: "safeguarding", risk: "critical", approval: "ri", daysAgo: 1 }),
    ev({ id: "med", type: "medication", risk: "low", flags: ["x"], daysAgo: 1 }),
  ]);
  it("flags overdue items", () => {
    expect(r.items.find((i) => i.event_id === "old")!.overdue).toBe(true);
    expect(r.overview.overdue).toBeGreaterThanOrEqual(1);
  });
  it("sorts critical first", () => {
    expect(r.items[0].event_id).toBe("newcrit");
  });
  it("aggregates the overview", () => {
    expect(r.overview.total).toBe(3);
    expect(r.overview.safeguarding_alerts).toBe(1);
    expect(r.overview.approvals_pending).toBeGreaterThanOrEqual(1);
  });
});

describe("insights", () => {
  it("emits a critical insight when critical items exist and positive when clear", () => {
    const withCrit = run([ev({ id: "1", type: "safeguarding", risk: "critical", approval: "ri" })]);
    expect(withCrit.insights.some((i) => i.severity === "critical")).toBe(true);
    const clear = run([ev({ id: "1", type: "daily_log", risk: "low" })]);
    expect(clear.items).toHaveLength(0);
    expect(clear.insights.some((i) => i.severity === "positive")).toBe(true);
  });
});

describe("determinism", () => {
  it("returns identical output for identical input", () => {
    const events = [ev({ id: "1", type: "safeguarding", risk: "critical", approval: "ri" }), ev({ id: "2", type: "incident", risk: "high", approval: "deputy" })];
    expect(JSON.stringify(run(events))).toBe(JSON.stringify(run(events)));
  });
});
