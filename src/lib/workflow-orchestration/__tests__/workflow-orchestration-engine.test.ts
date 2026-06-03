import { describe, it, expect } from "vitest";
import { computeWorkflowOrchestration, DEFAULT_WORKFLOW_RULES } from "../workflow-orchestration-engine";
import type { CornerstoneEvent, CornerstoneEventType, CornerstoneRiskLevel } from "@/types/cornerstone-event";

const TODAY = "2026-06-02";
function addDays(date: string, n: number): string { const d = new Date(date); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
const at = (n: number) => `${addDays(TODAY, -n)}T12:00:00.000Z`;

function ev(o: { id: string; type: CornerstoneEventType; risk?: CornerstoneRiskLevel; childId?: string; daysAgo?: number }): CornerstoneEvent {
  return {
    id: o.id, eventType: o.type, homeId: "home_oak", childId: o.childId, occurredAt: at(o.daysAgo ?? 1), createdBy: "staff_x",
    summary: `${o.type} ${o.id}`, structuredTags: [], riskLevel: o.risk ?? "low", requiresApproval: false,
    linkedDocuments: [], linkedTasks: [], linkedRisks: [], linkedNotifications: [],
    audit: { createdAt: at(o.daysAgo ?? 1), updatedAt: at(o.daysAgo ?? 1), version: 1, changeHistory: [] },
  };
}
const run = (events: CornerstoneEvent[]) => computeWorkflowOrchestration({ events, today: TODAY });

// ══════════════════════════════════════════════════════════════════════════════
describe("default rules", () => {
  it("ships a configurable rule set including the incident workflow", () => {
    expect(DEFAULT_WORKFLOW_RULES.length).toBeGreaterThanOrEqual(5);
    const inc = DEFAULT_WORKFLOW_RULES.find((r) => r.id === "wf-incident")!;
    expect(inc.actions.map((a) => a.type)).toEqual(expect.arrayContaining(["create_approval_task", "create_debrief_task", "suggest_keywork", "add_evidence", "generate_aria_summary", "update_trend"]));
  });
});

describe("incident workflow (the spec example)", () => {
  const r = run([ev({ id: "1", type: "incident", risk: "high", childId: "a", daysAgo: 1 })]);
  it("fires and generates the full action set", () => {
    expect(r.triggered.some((t) => t.rule_id === "wf-incident")).toBe(true);
    const types = r.actions.map((a) => a.type);
    expect(types).toEqual(expect.arrayContaining(["create_approval_task", "create_debrief_task", "suggest_keywork", "add_evidence", "generate_aria_summary", "update_trend"]));
    expect(r.overview.actions_generated).toBe(6);
  });
  it("the approval task is owned, deadlined and escalates", () => {
    const appr = r.actions.find((a) => a.type === "create_approval_task")!;
    expect(appr.requires_approval).toBe(true);
    expect(appr.approval_level).toBe("manager");
    expect(appr.deadline).toBe(addDays(TODAY, -1 + 2));
    expect(appr.escalation).toEqual({ after_days: 2, to_role: "ri" });
    expect(appr.evidence_categories).toEqual(expect.arrayContaining(["Regulation 45"]));
  });
  it("does not fire for a low-risk incident (condition gte medium)", () => {
    const low = run([ev({ id: "2", type: "incident", risk: "low", childId: "a" })]);
    expect(low.overview.rules_fired).toBe(0);
    expect(low.overview.actions_generated).toBe(0);
  });
});

describe("safeguarding & missing generate human-gated notification drafts", () => {
  it("safeguarding drafts an Ofsted/LADO notification (never auto-sent)", () => {
    const r = run([ev({ id: "1", type: "safeguarding", risk: "critical", childId: "a" })]);
    const draft = r.actions.find((a) => a.type === "create_notification_draft")!;
    expect(draft.notification_draft).toEqual(["Ofsted", "LADO"]);
    expect(draft.requires_approval).toBe(true);
    expect(r.overview.notifications_drafted).toBeGreaterThanOrEqual(1);
    expect(r.alerts.some((a) => a.severity === "critical" && /never auto-sent/i.test(a.message))).toBe(true);
  });
  it("missing drafts a Police/LA notification", () => {
    const r = run([ev({ id: "1", type: "missing", risk: "high", childId: "a" })]);
    expect(r.actions.find((a) => a.type === "create_notification_draft")!.notification_draft).toEqual(["Police", "LocalAuthority"]);
  });
});

describe("escalation on overdue actions", () => {
  const r = run([ev({ id: "1", type: "incident", risk: "high", childId: "a", daysAgo: 10 })]); // approval deadline -8 → overdue
  it("marks overdue actions and counts pending escalations", () => {
    const appr = r.actions.find((a) => a.type === "create_approval_task")!;
    expect(appr.overdue).toBe(true);
    expect(r.overview.escalations_pending).toBeGreaterThanOrEqual(1);
    expect(r.alerts.some((a) => /escalate/i.test(a.message))).toBe(true);
  });
});

describe("overview & determinism", () => {
  it("aggregates by action type and approvals", () => {
    const r = run([ev({ id: "1", type: "incident", risk: "high", childId: "a" }), ev({ id: "2", type: "safeguarding", risk: "critical", childId: "b" })]);
    expect(r.overview.events_processed).toBe(2);
    expect(r.overview.rules_fired).toBe(2);
    expect(r.overview.approvals_required).toBeGreaterThanOrEqual(2);
    expect(Object.keys(r.overview.by_action_type).length).toBeGreaterThan(0);
  });
  it("returns identical output for identical input", () => {
    const events = [ev({ id: "1", type: "incident", risk: "high", childId: "a" }), ev({ id: "2", type: "missing", risk: "high", childId: "b" })];
    expect(JSON.stringify(run(events))).toBe(JSON.stringify(run(events)));
  });
});
