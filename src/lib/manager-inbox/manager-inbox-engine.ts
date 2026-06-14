// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGER ACTION INBOX ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// One command centre for managers, deputies, team leaders and the RI. It composes
// the canonical event stream into a single prioritised list of things that need a
// human: approvals, safeguarding alerts, high-risk events, missing information and
// compliance gaps — each with a reason, a deadline, the linked child/staff, the
// required action, an Cara-suggested response, evidence links and the actions a
// manager can take (approve / request changes / escalate).
//
// It never decides or auto-acts — it surfaces and routes. Approvals and escalations
// remain human actions.
//
// Regulatory: CHR 2015 Reg 13 (leadership oversight), Reg 12, Reg 40. SCCIF:
// leaders have an accurate, prioritised operating picture and act on it.
// ══════════════════════════════════════════════════════════════════════════════

import type { CornerstoneEvent, CornerstoneRiskLevel, CornerstoneApprovalLevel } from "@/types/cornerstone-event";

// ── Output ────────────────────────────────────────────────────────────────────

export type InboxPriority = "critical" | "high" | "medium" | "low";
export type InboxCategory = "safeguarding" | "approval" | "high_risk" | "missing_info" | "compliance";

export interface InboxItem {
  id: string;
  event_id: string;
  event_type: string;
  priority: InboxPriority;
  category: InboxCategory;
  title: string;
  reason: string;
  child_id?: string;
  staff_id?: string;
  required_action: string;
  approval_level?: CornerstoneApprovalLevel;
  aria_suggested_response: string | null;
  evidence_categories: string[];
  occurred_at: string;
  deadline: string;          // ISO date
  overdue: boolean;
  available_actions: string[];
}

export interface ManagerInboxOverview {
  total: number;
  by_priority: Record<InboxPriority, number>;
  by_category: Record<InboxCategory, number>;
  approvals_pending: number;
  safeguarding_alerts: number;
  overdue: number;
}

export interface CaraInboxInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ManagerInboxResult {
  overview: ManagerInboxOverview;
  items: InboxItem[];
  insights: CaraInboxInsight[];
}

export interface ManagerInboxInput {
  events: CornerstoneEvent[];
  today?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const PRIORITY_RANK: Record<InboxPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const RISK_RANK: Record<CornerstoneRiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };

function addDays(date: string, days: number): string {
  const d = new Date(date.slice(0, 10));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function deadlineDays(priority: InboxPriority): number {
  return priority === "critical" ? 1 : priority === "high" ? 3 : priority === "medium" ? 7 : 14;
}

function isSafeguarding(e: CornerstoneEvent): boolean {
  return e.eventType === "safeguarding" || e.eventType === "missing" ||
    e.structuredTags.some((t) => /safeguard|missing|exploit|injury/i.test(t));
}

// ── Build one inbox item from an event (or null if no action needed) ────────────

function toItem(e: CornerstoneEvent, today: string): InboxItem | null {
  const flags = e.caraAnalysis?.complianceFlags ?? [];
  const safeguarding = isSafeguarding(e);
  const highRisk = e.riskLevel === "high" || e.riskLevel === "critical";

  // Only actionable events reach the inbox.
  if (!e.requiresApproval && flags.length === 0 && !highRisk && !safeguarding) return null;

  // Category by precedence.
  let category: InboxCategory;
  if (safeguarding) category = "safeguarding";
  else if (e.requiresApproval) category = "approval";
  else if (highRisk) category = "high_risk";
  else if (flags.length > 0) category = "missing_info";
  else category = "compliance";

  // Priority.
  let priority: InboxPriority;
  if (e.riskLevel === "critical" || (safeguarding && e.riskLevel === "high")) priority = "critical";
  else if (highRisk || e.approvalLevel === "manager" || e.approvalLevel === "ri") priority = "high";
  else if (e.requiresApproval || flags.length > 0) priority = "medium";
  else priority = "low";

  const reasons: string[] = [];
  if (safeguarding) reasons.push("safeguarding-related event");
  if (e.requiresApproval) reasons.push(`needs ${e.approvalLevel ?? "manager"} sign-off`);
  if (highRisk) reasons.push(`${e.riskLevel} risk`);
  if (flags.length > 0) reasons.push(flags[0]);

  const required_action =
    category === "approval" ? `Review and approve (or request changes)`
    : category === "safeguarding" ? "Review the safeguarding response and confirm notifications"
    : category === "high_risk" ? "Review and confirm the actions taken are sufficient"
    : "Add the missing information / close the compliance gap";

  const available_actions = e.requiresApproval
    ? ["approve", "request_changes", "escalate"]
    : ["acknowledge", "add_information", "escalate"];

  const deadline = addDays(e.occurredAt, deadlineDays(priority));
  const overdue = deadline < today.slice(0, 10);

  return {
    id: `inbox_${e.id}`,
    event_id: e.id,
    event_type: e.eventType,
    priority,
    category,
    title: e.summary,
    reason: reasons.join("; "),
    child_id: e.childId,
    staff_id: e.staffId,
    required_action,
    approval_level: e.approvalLevel,
    aria_suggested_response: e.caraAnalysis?.suggestedActions?.[0] ?? null,
    evidence_categories: e.evidenceCategories ?? [],
    occurred_at: e.occurredAt,
    deadline,
    overdue,
    available_actions,
  };
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeManagerInbox(input: ManagerInboxInput): ManagerInboxResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);

  const items = input.events
    .map((e) => toItem(e, today))
    .filter((i): i is InboxItem => i !== null)
    .sort((a, b) => {
      if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority]) return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      return a.deadline.localeCompare(b.deadline);
    });

  const by_priority: Record<InboxPriority, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  const by_category: Record<InboxCategory, number> = { safeguarding: 0, approval: 0, high_risk: 0, missing_info: 0, compliance: 0 };
  let approvals_pending = 0, safeguarding_alerts = 0, overdue = 0;
  for (const i of items) {
    by_priority[i.priority]++;
    by_category[i.category]++;
    if (i.category === "approval") approvals_pending++;
    if (i.category === "safeguarding") safeguarding_alerts++;
    if (i.overdue) overdue++;
  }

  const overview: ManagerInboxOverview = {
    total: items.length, by_priority, by_category, approvals_pending, safeguarding_alerts, overdue,
  };

  return { overview, items, insights: buildInsights(items, overview) };
}

// ── Insights ──────────────────────────────────────────────────────────────────

function buildInsights(items: InboxItem[], overview: ManagerInboxOverview): CaraInboxInsight[] {
  const insights: CaraInboxInsight[] = [];

  if (overview.safeguarding_alerts > 0 || overview.by_priority.critical > 0) {
    const top = items.find((i) => i.priority === "critical");
    insights.push({
      severity: "critical",
      text: `${overview.by_priority.critical} critical item${overview.by_priority.critical === 1 ? "" : "s"} need attention now${top ? `, starting with: ${top.title.slice(0, 70)}` : ""}. These are sorted to the top with the shortest deadlines — clear them first.`,
    });
  }

  if (overview.overdue > 0) {
    insights.push({
      severity: "warning",
      text: `${overview.overdue} action${overview.overdue === 1 ? " is" : "s are"} past their target deadline. Overdue management actions are exactly what inspectors probe — work the overdue queue down and record the reason for any genuine delay.`,
    });
  }

  if (overview.approvals_pending > 0) {
    insights.push({
      severity: overview.approvals_pending >= 5 ? "warning" : "positive",
      text: `${overview.approvals_pending} item${overview.approvals_pending === 1 ? "" : "s"} await sign-off. Timely approval keeps the audit trail tight and surfaces serious events without delay — each item shows who needs to approve and an Cara-suggested response to speed the decision.`,
    });
  }

  if (items.length === 0) {
    insights.push({ severity: "positive", text: `The action inbox is clear — no approvals, safeguarding alerts, high-risk events or compliance gaps are outstanding. Maintain oversight with a daily check.` });
  }
  return insights;
}
