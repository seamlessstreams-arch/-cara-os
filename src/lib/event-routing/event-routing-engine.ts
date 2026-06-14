// ══════════════════════════════════════════════════════════════════════════════
// CARA — EVENT ROUTING ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls, and
// crucially NO external calls. It computes a routing PLAN for each CornerstoneEvent
// from a set of RoutingRules: which in-app surfaces it flows to, which external
// notifications it would trigger, and whether a human must approve first.
//
// SAFETY MODEL: in-app surfaces (child profile, handover, manager inbox, evidence
// banks…) are informational and route automatically. Anything that would leave the
// building — an external API notification (Ofsted / Police / LADO / Virtual
// School) — is ALWAYS gated behind human approval and is only ever planned here,
// never fired. A rule's requiresHumanApproval also gates the whole event.
//
// Core rule: capture once (CornerstoneEvent) → link intelligently (RoutingRule) →
// surface everywhere (destinations) — without ever auto-firing an irreversible
// external action.
// ══════════════════════════════════════════════════════════════════════════════

import type { CornerstoneEvent, CornerstoneRiskLevel } from "@/types/cornerstone-event";
import type { RoutingRule, RoutingCondition, InternalDestination } from "@/types/routing-rule";
import { INTERNAL_DESTINATIONS } from "@/types/routing-rule";

// ── Output Types ──────────────────────────────────────────────────────────────

export type RoutingStatus = "auto_routed" | "pending_approval" | "unrouted";

export interface EventRoutingPlan {
  event_id: string;
  event_type: string;
  child_id?: string;
  staff_id?: string;
  summary: string;
  risk_level: CornerstoneRiskLevel;
  destinations: InternalDestination[];
  external_apis: string[];
  requires_human_approval: boolean;
  status: RoutingStatus;
  matched_rules: number;
}

export interface RoutingOverview {
  total_events: number;
  auto_routed: number;
  pending_approval: number;
  unrouted: number;
  destination_counts: Record<string, number>;
  external_api_counts: Record<string, number>;
  external_notifications_pending: number;
}

export interface RoutingAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  event_id?: string;
}

export interface CaraRoutingInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface EventRoutingResult {
  overview: RoutingOverview;
  plans: EventRoutingPlan[];
  alerts: RoutingAlert[];
  insights: CaraRoutingInsight[];
}

// ── Risk ordering ─────────────────────────────────────────────────────────────

const RISK_ORDER: Record<CornerstoneRiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };

// ── Condition evaluation ──────────────────────────────────────────────────────

export function evalCondition(e: CornerstoneEvent, c: RoutingCondition): boolean {
  switch (c.field) {
    case "eventType":
      return c.op === "neq" ? e.eventType !== c.value : e.eventType === c.value;
    case "riskLevel": {
      const r = RISK_ORDER[e.riskLevel];
      if (c.op === "gte") return r >= (RISK_ORDER[c.value as CornerstoneRiskLevel] ?? 99);
      if (c.op === "in") return Array.isArray(c.value) && (c.value as string[]).includes(e.riskLevel);
      if (c.op === "eq") return e.riskLevel === c.value;
      if (c.op === "neq") return e.riskLevel !== c.value;
      return false;
    }
    case "requiresApproval":
      return e.requiresApproval === (c.value ?? true);
    case "tag":
      if (c.op === "includes" || c.op === "eq") return e.structuredTags.includes(c.value as string);
      return false;
    case "complianceFlags":
      if (c.op === "exists") return (e.caraAnalysis?.complianceFlags.length ?? 0) > 0;
      if (c.op === "includes") return (e.caraAnalysis?.complianceFlags ?? []).includes(c.value as string);
      return false;
    case "childId":
      return c.op === "exists" ? !!e.childId : e.childId === c.value;
    case "staffId":
      return c.op === "exists" ? !!e.staffId : e.staffId === c.value;
    default:
      return false; // fail-safe: unknown condition never matches (no over-routing)
  }
}

export function ruleMatches(e: CornerstoneEvent, rule: RoutingRule): boolean {
  if (rule.eventType !== "*" && rule.eventType !== e.eventType) return false;
  return (rule.conditions ?? []).every((c) => evalCondition(e, c));
}

// ── Default rule set (Ofsted-aligned "surface everywhere") ──────────────────────

export const DEFAULT_ROUTING_RULES: RoutingRule[] = [
  // Safeguarding — the widest reach, fully gated (external notifications).
  {
    eventType: "safeguarding", conditions: [],
    routeTo: { childProfile: true, riskAssessment: true, managerInbox: true, qaEvidenceBank: true, reg45Evidence: true, notificationCentre: true, handover: true, externalApi: ["Ofsted", "LADO"] },
    requiresHumanApproval: true,
  },
  // Incidents — severity-split.
  {
    eventType: "incident", conditions: [{ field: "riskLevel", op: "gte", value: "high" }],
    routeTo: { childProfile: true, riskAssessment: true, managerInbox: true, qaEvidenceBank: true, handover: true },
    requiresHumanApproval: true,
  },
  {
    eventType: "incident", conditions: [{ field: "riskLevel", op: "in", value: ["low", "medium"] }],
    routeTo: { childProfile: true, handover: true, dashboard: true },
    requiresHumanApproval: false,
  },
  // Missing — statutory external notifications.
  {
    eventType: "missing", conditions: [],
    routeTo: { childProfile: true, riskAssessment: true, managerInbox: true, handover: true, notificationCentre: true, externalApi: ["Police", "LocalAuthority"] },
    requiresHumanApproval: true,
  },
  // Physical intervention.
  {
    eventType: "physical_intervention", conditions: [],
    routeTo: { childProfile: true, riskAssessment: true, managerInbox: true, qaEvidenceBank: true, handover: true },
    requiresHumanApproval: true,
  },
  // Medication — harm vs routine.
  {
    eventType: "medication", conditions: [{ field: "riskLevel", op: "gte", value: "medium" }],
    routeTo: { childProfile: true, managerInbox: true, qaEvidenceBank: true, notificationCentre: true },
    requiresHumanApproval: true,
  },
  {
    eventType: "medication", conditions: [{ field: "riskLevel", op: "eq", value: "low" }],
    routeTo: { childProfile: true, qaEvidenceBank: true },
    requiresHumanApproval: false,
  },
  // Daily logs — base + significant.
  { eventType: "daily_log", conditions: [], routeTo: { childProfile: true, handover: true, dashboard: true }, requiresHumanApproval: false },
  { eventType: "daily_log", conditions: [{ field: "tag", op: "includes", value: "significant" }], routeTo: { managerInbox: true }, requiresHumanApproval: false },
  // Key-working & education feed the care plan.
  { eventType: "keywork", conditions: [], routeTo: { childProfile: true, carePlan: true }, requiresHumanApproval: false },
  { eventType: "education", conditions: [], routeTo: { childProfile: true, carePlan: true }, requiresHumanApproval: false },
  {
    eventType: "education", conditions: [{ field: "tag", op: "includes", value: "excluded" }],
    routeTo: { managerInbox: true, notificationCentre: true, externalApi: ["VirtualSchool"] },
    requiresHumanApproval: true,
  },
  // Supervision → staff record + QA.
  { eventType: "supervision", conditions: [], routeTo: { staffProfile: true, qaEvidenceBank: true }, requiresHumanApproval: false },
  // Reg 44 — independent oversight, external to Ofsted.
  {
    eventType: "reg44", conditions: [],
    routeTo: { managerInbox: true, qaEvidenceBank: true, reg45Evidence: true, notificationCentre: true, externalApi: ["Ofsted"] },
    requiresHumanApproval: true,
  },
  // QA checks → evidence; flagged ones to the manager.
  { eventType: "qa_check", conditions: [], routeTo: { qaEvidenceBank: true, reg45Evidence: true }, requiresHumanApproval: false },
  { eventType: "qa_check", conditions: [{ field: "complianceFlags", op: "exists" }], routeTo: { managerInbox: true }, requiresHumanApproval: false },
  // Premises / staffing / health.
  { eventType: "maintenance", conditions: [], routeTo: { dashboard: true }, requiresHumanApproval: false },
  { eventType: "maintenance", conditions: [{ field: "complianceFlags", op: "exists" }], routeTo: { managerInbox: true }, requiresHumanApproval: false },
  { eventType: "overtime", conditions: [], routeTo: { staffProfile: true, managerInbox: true }, requiresHumanApproval: false },
  { eventType: "staff_absence", conditions: [], routeTo: { staffProfile: true, managerInbox: true }, requiresHumanApproval: false },
  { eventType: "health", conditions: [], routeTo: { childProfile: true, carePlan: true, handover: true }, requiresHumanApproval: false },
  { eventType: "health", conditions: [{ field: "complianceFlags", op: "exists" }], routeTo: { managerInbox: true }, requiresHumanApproval: false },
];

// ── Main Computation ────────────────────────────────────────────────────────

export interface EventRoutingInput {
  events: CornerstoneEvent[];
  rules?: RoutingRule[];
}

export function computeEventRouting(input: EventRoutingInput): EventRoutingResult {
  const rules = input.rules ?? DEFAULT_ROUTING_RULES;

  const plans: EventRoutingPlan[] = input.events.map((e) => {
    const matched = rules.filter((r) => ruleMatches(e, r));

    const destSet = new Set<InternalDestination>();
    const apiSet = new Set<string>();
    let ruleApproval = false;
    for (const r of matched) {
      for (const key of INTERNAL_DESTINATIONS) {
        if ((r.routeTo as Record<string, unknown>)[key]) destSet.add(key);
      }
      for (const api of r.routeTo.externalApi ?? []) apiSet.add(api);
      if (r.requiresHumanApproval) ruleApproval = true;
    }

    const external_apis = [...apiSet].sort();
    // External notifications ALWAYS require human approval — never auto-fire.
    const requires_human_approval = ruleApproval || external_apis.length > 0;

    const status: RoutingStatus =
      matched.length === 0 ? "unrouted" : requires_human_approval ? "pending_approval" : "auto_routed";

    return {
      event_id: e.id,
      event_type: e.eventType,
      child_id: e.childId,
      staff_id: e.staffId,
      summary: e.summary,
      risk_level: e.riskLevel,
      destinations: [...destSet].sort(),
      external_apis,
      requires_human_approval,
      status,
      matched_rules: matched.length,
    };
  });

  const overview = buildOverview(plans);
  const alerts = buildAlerts(plans);
  const insights = buildInsights(plans, overview);

  return { overview, plans, alerts, insights };
}

// ── Aggregation ───────────────────────────────────────────────────────────────

function buildOverview(plans: EventRoutingPlan[]): RoutingOverview {
  const destination_counts: Record<string, number> = {};
  const external_api_counts: Record<string, number> = {};
  let auto_routed = 0, pending_approval = 0, unrouted = 0, external_notifications_pending = 0;

  for (const p of plans) {
    if (p.status === "auto_routed") auto_routed++;
    else if (p.status === "pending_approval") pending_approval++;
    else unrouted++;
    for (const dest of p.destinations) destination_counts[dest] = (destination_counts[dest] ?? 0) + 1;
    for (const api of p.external_apis) external_api_counts[api] = (external_api_counts[api] ?? 0) + 1;
    if (p.external_apis.length > 0) external_notifications_pending++;
  }

  return {
    total_events: plans.length,
    auto_routed, pending_approval, unrouted,
    destination_counts, external_api_counts, external_notifications_pending,
  };
}

function buildAlerts(plans: EventRoutingPlan[]): RoutingAlert[] {
  const alerts: RoutingAlert[] = [];

  // External notifications awaiting approval — the safety-critical queue.
  const apiTotals: Record<string, number> = {};
  for (const p of plans) for (const api of p.external_apis) apiTotals[api] = (apiTotals[api] ?? 0) + 1;
  for (const [api, count] of Object.entries(apiTotals).sort((a, b) => b[1] - a[1])) {
    alerts.push({
      severity: api === "Ofsted" || api === "Police" || api === "LADO" ? "critical" : "high",
      message: `${count} event${count === 1 ? "" : "s"} would notify ${api} — awaiting human approval before sending`,
    });
  }

  // Critical events still pending approval.
  const criticalPending = plans.filter((p) => p.risk_level === "critical" && p.status === "pending_approval");
  if (criticalPending.length > 0) {
    alerts.push({
      severity: "critical",
      message: `${criticalPending.length} critical event${criticalPending.length === 1 ? "" : "s"} are routed but awaiting sign-off — approve to surface and notify`,
    });
  }

  const unrouted = plans.filter((p) => p.status === "unrouted");
  if (unrouted.length > 0) {
    alerts.push({
      severity: "low",
      message: `${unrouted.length} event${unrouted.length === 1 ? "" : "s"} matched no routing rule — review whether a rule is missing`,
    });
  }

  return alerts;
}

function buildInsights(plans: EventRoutingPlan[], overview: RoutingOverview): CaraRoutingInsight[] {
  const insights: CaraRoutingInsight[] = [];

  if (overview.external_notifications_pending > 0) {
    const apis = Object.keys(overview.external_api_counts).sort().join(", ");
    insights.push({
      severity: "critical",
      text: `${overview.external_notifications_pending} event${overview.external_notifications_pending === 1 ? "" : "s"} would trigger an external notification (${apis}). These are planned but never sent automatically — a human must approve each one, so a statutory notification is never missed and never fired in error.`,
    });
  }

  if (overview.auto_routed > 0) {
    const topDest = Object.entries(overview.destination_counts).sort((a, b) => b[1] - a[1])[0];
    insights.push({
      severity: "positive",
      text: `${overview.auto_routed} event${overview.auto_routed === 1 ? "" : "s"} auto-surfaced to the right places with no manual filing${topDest ? ` (most to the ${topDest[0]})` : ""}. Capture once, surface everywhere — the record is written one time and appears wherever it is needed.`,
    });
  }

  if (overview.pending_approval > 0) {
    insights.push({
      severity: "warning",
      text: `${overview.pending_approval} event${overview.pending_approval === 1 ? "" : "s"} are routed but held for human approval (higher-risk or externally-notifiable). Clearing this queue promptly keeps oversight tight and surfaces serious events without delay.`,
    });
  }

  return insights;
}
