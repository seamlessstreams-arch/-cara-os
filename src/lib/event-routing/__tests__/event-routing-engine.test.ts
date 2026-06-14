import { describe, it, expect } from "vitest";
import {
  computeEventRouting, evalCondition, ruleMatches, DEFAULT_ROUTING_RULES,
} from "../event-routing-engine";
import type { CornerstoneEvent, CornerstoneEventType, CornerstoneRiskLevel } from "@/types/cornerstone-event";
import type { RoutingRule } from "@/types/routing-rule";

function ev(o: {
  id: string; type: CornerstoneEventType; risk?: CornerstoneRiskLevel; childId?: string; staffId?: string;
  tags?: string[]; flags?: string[]; requiresApproval?: boolean;
}): CornerstoneEvent {
  return {
    id: o.id, eventType: o.type, homeId: "home_oak", childId: o.childId, staffId: o.staffId,
    occurredAt: "2026-06-01T00:00:00.000Z", createdBy: "system", summary: `${o.type} ${o.id}`,
    structuredTags: o.tags ?? [], riskLevel: o.risk ?? "low", requiresApproval: o.requiresApproval ?? false,
    linkedDocuments: [], linkedTasks: [], linkedRisks: [], linkedNotifications: [],
    caraAnalysis: { themes: [], suggestedActions: [], complianceFlags: o.flags ?? [], missingInformation: [], confidenceScore: 1 },
    audit: { createdAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z", version: 1, changeHistory: [] },
  };
}
const planFor = (events: CornerstoneEvent[]) => computeEventRouting({ events }).plans[0];

// ══════════════════════════════════════════════════════════════════════════════
describe("evalCondition", () => {
  it("evaluates riskLevel gte / in / eq", () => {
    const e = ev({ id: "1", type: "incident", risk: "high" });
    expect(evalCondition(e, { field: "riskLevel", op: "gte", value: "high" })).toBe(true);
    expect(evalCondition(e, { field: "riskLevel", op: "gte", value: "critical" })).toBe(false);
    expect(evalCondition(e, { field: "riskLevel", op: "in", value: ["low", "medium"] })).toBe(false);
    expect(evalCondition(e, { field: "riskLevel", op: "eq", value: "high" })).toBe(true);
  });
  it("evaluates tag includes and complianceFlags exists", () => {
    const e = ev({ id: "1", type: "daily_log", tags: ["daily_log", "significant"], flags: ["x"] });
    expect(evalCondition(e, { field: "tag", op: "includes", value: "significant" })).toBe(true);
    expect(evalCondition(e, { field: "tag", op: "includes", value: "nope" })).toBe(false);
    expect(evalCondition(e, { field: "complianceFlags", op: "exists" })).toBe(true);
  });
  it("fails safe on unknown fields", () => {
    const e = ev({ id: "1", type: "incident" });
    // @ts-expect-error testing unknown field
    expect(evalCondition(e, { field: "nonsense", op: "eq", value: 1 })).toBe(false);
  });
});

describe("ruleMatches", () => {
  it("requires eventType match and all conditions", () => {
    const e = ev({ id: "1", type: "incident", risk: "high" });
    const rule: RoutingRule = { eventType: "incident", conditions: [{ field: "riskLevel", op: "gte", value: "high" }], routeTo: { managerInbox: true }, requiresHumanApproval: true };
    expect(ruleMatches(e, rule)).toBe(true);
    expect(ruleMatches(ev({ id: "2", type: "incident", risk: "low" }), rule)).toBe(false);
    expect(ruleMatches(ev({ id: "3", type: "medication", risk: "high" }), rule)).toBe(false);
  });
  it("supports the wildcard eventType", () => {
    expect(ruleMatches(ev({ id: "1", type: "keywork" }), { eventType: "*", conditions: [], routeTo: { dashboard: true }, requiresHumanApproval: false })).toBe(true);
  });
});

describe("routing plans (default rules)", () => {
  it("routes safeguarding widely and gates external notifications", () => {
    const p = planFor([ev({ id: "1", type: "safeguarding", risk: "critical", childId: "yp_alex" })]);
    expect(p.destinations).toEqual(expect.arrayContaining(["childProfile", "riskAssessment", "managerInbox", "qaEvidenceBank", "reg45Evidence", "notificationCentre"]));
    expect(p.external_apis).toEqual(["LADO", "Ofsted"]);
    expect(p.requires_human_approval).toBe(true);
    expect(p.status).toBe("pending_approval");
  });
  it("auto-routes a low incident with no approval", () => {
    const p = planFor([ev({ id: "1", type: "incident", risk: "low", childId: "yp_alex" })]);
    expect(p.destinations).toEqual(expect.arrayContaining(["childProfile", "handover", "dashboard"]));
    expect(p.external_apis).toEqual([]);
    expect(p.requires_human_approval).toBe(false);
    expect(p.status).toBe("auto_routed");
  });
  it("gates a high incident for approval", () => {
    const p = planFor([ev({ id: "1", type: "incident", risk: "high", childId: "yp_alex" })]);
    expect(p.destinations).toEqual(expect.arrayContaining(["riskAssessment", "managerInbox", "qaEvidenceBank"]));
    expect(p.status).toBe("pending_approval");
  });
  it("routes missing to Police + Local Authority (gated)", () => {
    const p = planFor([ev({ id: "1", type: "missing", risk: "high", childId: "yp_alex" })]);
    expect(p.external_apis).toEqual(["LocalAuthority", "Police"]);
    expect(p.requires_human_approval).toBe(true);
  });
  it("unions multiple matching rules for a significant daily log", () => {
    const p = planFor([ev({ id: "1", type: "daily_log", tags: ["daily_log", "significant"], childId: "yp_alex" })]);
    expect(p.matched_rules).toBe(2); // base + significant
    expect(p.destinations).toEqual(expect.arrayContaining(["childProfile", "handover", "dashboard", "managerInbox"]));
    expect(p.status).toBe("auto_routed");
  });
  it("auto-routes a low medication error to evidence", () => {
    const p = planFor([ev({ id: "1", type: "medication", risk: "low", childId: "yp_casey" })]);
    expect(p.destinations).toEqual(expect.arrayContaining(["childProfile", "qaEvidenceBank"]));
    expect(p.requires_human_approval).toBe(false);
  });
  it("marks an event with no matching rule as unrouted", () => {
    const p = planFor([ev({ id: "1", type: "health" as CornerstoneEventType, risk: "low" })]); // health has a rule...
    // use a genuinely unknown type
    const p2 = computeEventRouting({ events: [ev({ id: "2", type: "qa_check", risk: "low" })], rules: [] }).plans[0];
    expect(p2.status).toBe("unrouted");
    expect(p2.destinations).toEqual([]);
    void p;
  });
});

describe("overview, alerts, insights", () => {
  const r = computeEventRouting({
    events: [
      ev({ id: "1", type: "safeguarding", risk: "critical", childId: "yp_alex" }),
      ev({ id: "2", type: "missing", risk: "high", childId: "yp_alex" }),
      ev({ id: "3", type: "incident", risk: "low", childId: "yp_jordan" }),
      ev({ id: "4", type: "daily_log", childId: "yp_casey" }),
      ev({ id: "5", type: "keywork", childId: "yp_casey" }),
    ],
  });
  it("aggregates routing status and destinations", () => {
    expect(r.overview.total_events).toBe(5);
    expect(r.overview.pending_approval).toBe(2); // safeguarding + missing
    expect(r.overview.auto_routed).toBe(3);
    expect(r.overview.external_notifications_pending).toBe(2);
    expect(r.overview.destination_counts.childProfile).toBeGreaterThanOrEqual(4);
  });
  it("counts external API targets", () => {
    expect(r.overview.external_api_counts.Ofsted).toBe(1);
    expect(r.overview.external_api_counts.Police).toBe(1);
  });
  it("raises critical alerts for statutory external notifications", () => {
    expect(r.alerts.some((a) => a.severity === "critical" && /Ofsted|Police|LADO/.test(a.message))).toBe(true);
  });
  it("emits a critical insight that external notifications are never auto-sent", () => {
    expect(r.insights.some((i) => i.severity === "critical" && /never sent automatically/i.test(i.text))).toBe(true);
  });
});

describe("default rules + determinism", () => {
  it("ships a non-trivial default rule set", () => {
    expect(DEFAULT_ROUTING_RULES.length).toBeGreaterThan(10);
  });
  it("returns identical output for identical input", () => {
    const events = [ev({ id: "1", type: "safeguarding", risk: "critical" }), ev({ id: "2", type: "keywork" })];
    expect(JSON.stringify(computeEventRouting({ events }))).toBe(JSON.stringify(computeEventRouting({ events })));
  });
});
