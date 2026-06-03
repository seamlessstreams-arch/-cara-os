// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WORKFLOW ORCHESTRATION ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no external calls.
//
// Processes events against configurable WorkflowRules and emits the concrete
// ACTIONS each event generates: approval tasks, staff debriefs, key-working
// follow-ups, evidence-bank additions, ARIA summaries, trend updates and
// human-gated notification drafts — each with an owner, a deadline and an
// escalation path. This is the orchestration layer above routing.
//
// Realises the spec's example: "When an incident is submitted → check missing
// info, link to child, update behaviour/risk trend, create manager approval task,
// create staff debrief task, suggest keywork follow-up, add to Reg 45 evidence
// bank, update manager dashboard, generate ARIA summary, create notification draft
// where appropriate." Notification drafts are NEVER sent automatically.
//
// Regulatory: CHR 2015 Reg 13 (leadership — consistent processes), Reg 12, Reg 40.
// ══════════════════════════════════════════════════════════════════════════════

import type { CornerstoneEvent } from "@/types/cornerstone-event";
import type { WorkflowRule, WorkflowActionType, WorkflowRole } from "@/types/workflow-rule";
import { evalCondition } from "@/lib/event-routing/event-routing-engine";

// ── Output ────────────────────────────────────────────────────────────────────

export interface GeneratedAction {
  id: string;
  event_id: string;
  event_type: string;
  child_id?: string;
  staff_id?: string;
  rule_id: string;
  rule_name: string;
  type: WorkflowActionType;
  title: string;
  owner_role: WorkflowRole;
  requires_approval: boolean;
  approval_level?: string;
  deadline: string | null;
  escalation: { after_days: number; to_role: WorkflowRole } | null;
  evidence_categories: string[];
  notification_draft: string[] | null; // external parties — human approval required, never auto-sent
  status: "pending";
  overdue: boolean;
}

export interface TriggeredRule {
  event_id: string;
  event_type: string;
  rule_id: string;
  rule_name: string;
  action_count: number;
}

export interface WorkflowOverview {
  events_processed: number;
  rules_fired: number;
  actions_generated: number;
  by_action_type: Record<string, number>;
  approvals_required: number;
  notifications_drafted: number;
  escalations_pending: number;       // overdue actions that have an escalation path
}

export interface WorkflowAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}
export interface AriaWorkflowInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface WorkflowOrchestrationResult {
  overview: WorkflowOverview;
  triggered: TriggeredRule[];
  actions: GeneratedAction[];
  alerts: WorkflowAlert[];
  insights: AriaWorkflowInsight[];
}

export interface WorkflowOrchestrationInput {
  events: CornerstoneEvent[];
  rules?: WorkflowRule[];
  today?: string;
}

// ── Default, configurable rule set ──────────────────────────────────────────────

export const DEFAULT_WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: "wf-incident", name: "Incident submitted", trigger: "incident",
    conditions: [{ field: "riskLevel", op: "gte", value: "medium" }], audit: true,
    actions: [
      { type: "create_approval_task", title: "Manager review & sign-off of incident", owner_role: "manager", requires_approval: true, approval_level: "manager", deadline_days: 2, escalation: { after_days: 2, to_role: "ri" }, evidence_categories: ["help and protection", "Regulation 45"] },
      { type: "create_debrief_task", title: "Staff debrief following the incident", owner_role: "team_leader", deadline_days: 3 },
      { type: "suggest_keywork", title: "Key-working follow-up with the child", owner_role: "key_worker", deadline_days: 5 },
      { type: "add_evidence", title: "Add to the Regulation 45 evidence bank", owner_role: "system", evidence_categories: ["Regulation 45"] },
      { type: "generate_aria_summary", title: "Generate an ARIA incident summary", owner_role: "system" },
      { type: "update_trend", title: "Update behaviour & risk trend", owner_role: "system" },
    ],
  },
  {
    id: "wf-safeguarding", name: "Safeguarding event", trigger: "safeguarding", conditions: [], audit: true,
    actions: [
      { type: "create_approval_task", title: "Registered manager review of safeguarding response", owner_role: "manager", requires_approval: true, approval_level: "manager", deadline_days: 1, escalation: { after_days: 1, to_role: "ri" }, evidence_categories: ["safeguarding", "help and protection", "Regulation 45"] },
      { type: "create_notification_draft", title: "Draft Ofsted (Reg 40) / LADO notification for approval", owner_role: "manager", requires_approval: true, approval_level: "manager", creates_notification_draft: ["Ofsted", "LADO"], deadline_days: 1 },
      { type: "create_task", title: "Convene a strategy discussion with partner agencies", owner_role: "manager", deadline_days: 1 },
      { type: "add_evidence", title: "Add to the safeguarding & Regulation 45 evidence banks", owner_role: "system", evidence_categories: ["safeguarding", "Regulation 45"] },
      { type: "generate_aria_summary", title: "Generate an ARIA safeguarding summary", owner_role: "system" },
    ],
  },
  {
    id: "wf-missing", name: "Missing from care", trigger: "missing", conditions: [], audit: true,
    actions: [
      { type: "create_task", title: "Complete the return home interview within 72 hours", owner_role: "key_worker", deadline_days: 3, escalation: { after_days: 3, to_role: "manager" } },
      { type: "create_notification_draft", title: "Draft Police / Local Authority notification for approval", owner_role: "deputy", requires_approval: true, approval_level: "deputy", creates_notification_draft: ["Police", "LocalAuthority"], deadline_days: 1 },
      { type: "update_trend", title: "Update the missing-from-care pattern analysis", owner_role: "system" },
      { type: "add_evidence", title: "Add to help & protection / Regulation 45 evidence", owner_role: "system", evidence_categories: ["help and protection", "Regulation 45"] },
    ],
  },
  {
    id: "wf-physical-intervention", name: "Physical intervention", trigger: "physical_intervention", conditions: [], audit: true,
    actions: [
      { type: "create_approval_task", title: "Manager review of the physical intervention", owner_role: "manager", requires_approval: true, approval_level: "manager", deadline_days: 2, escalation: { after_days: 2, to_role: "ri" }, evidence_categories: ["help and protection", "Regulation 45"] },
      { type: "create_debrief_task", title: "Post-incident debrief with the child and staff", owner_role: "team_leader", deadline_days: 2 },
      { type: "update_trend", title: "Update the restraint-reduction trend", owner_role: "system" },
    ],
  },
  {
    id: "wf-medication", name: "Medication error", trigger: "medication",
    conditions: [{ field: "riskLevel", op: "gte", value: "medium" }], audit: true,
    actions: [
      { type: "create_task", title: "Medication-error follow-up and root-cause review", owner_role: "deputy", deadline_days: 2, escalation: { after_days: 2, to_role: "manager" } },
      { type: "add_evidence", title: "Add to health & Regulation 45 evidence", owner_role: "system", evidence_categories: ["health", "Regulation 45"] },
      { type: "generate_aria_summary", title: "Generate an ARIA medication-safety note", owner_role: "system" },
    ],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function addDays(dateIso: string, days: number): string {
  const d = new Date((dateIso ?? "").slice(0, 10));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function ruleApplies(e: CornerstoneEvent, rule: WorkflowRule): boolean {
  if (rule.trigger !== "*" && rule.trigger !== e.eventType) return false;
  return (rule.conditions ?? []).every((c) => evalCondition(e, c));
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeWorkflowOrchestration(input: WorkflowOrchestrationInput): WorkflowOrchestrationResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const todayDay = today.slice(0, 10);
  const rules = input.rules ?? DEFAULT_WORKFLOW_RULES;

  const triggered: TriggeredRule[] = [];
  const actions: GeneratedAction[] = [];

  for (const e of input.events) {
    for (const rule of rules) {
      if (!ruleApplies(e, rule)) continue;
      triggered.push({ event_id: e.id, event_type: e.eventType, rule_id: rule.id, rule_name: rule.name, action_count: rule.actions.length });
      for (const a of rule.actions) {
        const deadline = a.deadline_days != null ? addDays(e.occurredAt, a.deadline_days) : null;
        actions.push({
          id: `act_${e.id}_${rule.id}_${a.type}`,
          event_id: e.id, event_type: e.eventType, child_id: e.childId, staff_id: e.staffId,
          rule_id: rule.id, rule_name: rule.name,
          type: a.type, title: a.title, owner_role: a.owner_role,
          requires_approval: !!a.requires_approval, approval_level: a.approval_level,
          deadline, escalation: a.escalation ?? null,
          evidence_categories: a.evidence_categories ?? [],
          notification_draft: a.creates_notification_draft ?? null,
          status: "pending",
          overdue: deadline != null && deadline < todayDay,
        });
      }
    }
  }

  // Stable ordering: by deadline (soonest first, nulls last), then id.
  actions.sort((x, y) => {
    const dx = x.deadline ?? "9999-12-31";
    const dy = y.deadline ?? "9999-12-31";
    if (dx !== dy) return dx.localeCompare(dy);
    return x.id.localeCompare(y.id);
  });

  const by_action_type: Record<string, number> = {};
  let approvals_required = 0, notifications_drafted = 0, escalations_pending = 0;
  for (const a of actions) {
    by_action_type[a.type] = (by_action_type[a.type] ?? 0) + 1;
    if (a.requires_approval) approvals_required++;
    if (a.notification_draft) notifications_drafted++;
    if (a.overdue && a.escalation) escalations_pending++;
  }

  const overview: WorkflowOverview = {
    events_processed: input.events.length,
    rules_fired: triggered.length,
    actions_generated: actions.length,
    by_action_type,
    approvals_required,
    notifications_drafted,
    escalations_pending,
  };

  return { overview, triggered, actions, alerts: buildAlerts(overview, actions), insights: buildInsights(overview) };
}

// ── Alerts & insights ──────────────────────────────────────────────────────────

function buildAlerts(o: WorkflowOverview, actions: GeneratedAction[]): WorkflowAlert[] {
  const alerts: WorkflowAlert[] = [];
  if (o.escalations_pending > 0) {
    alerts.push({ severity: "high", message: `${o.escalations_pending} generated action${o.escalations_pending === 1 ? " is" : "s are"} overdue and due to escalate — clear or escalate them` });
  }
  if (o.notifications_drafted > 0) {
    alerts.push({ severity: "critical", message: `${o.notifications_drafted} external notification draft${o.notifications_drafted === 1 ? "" : "s"} generated (Ofsted / LADO / Police / LA) — awaiting human approval, never auto-sent` });
  }
  const overdueApprovals = actions.filter((a) => a.requires_approval && a.overdue).length;
  if (overdueApprovals > 0) {
    alerts.push({ severity: "high", message: `${overdueApprovals} approval task${overdueApprovals === 1 ? " is" : "s are"} overdue` });
  }
  return alerts;
}

function buildInsights(o: WorkflowOverview): AriaWorkflowInsight[] {
  const insights: AriaWorkflowInsight[] = [];
  if (o.actions_generated > 0) {
    insights.push({
      severity: "positive",
      text: `${o.rules_fired} workflow${o.rules_fired === 1 ? "" : "s"} fired across ${o.events_processed} events, generating ${o.actions_generated} actions automatically — approval tasks, debriefs, key-working follow-ups, evidence additions and ARIA summaries — so consistent process follows every significant event without anyone remembering each step.`,
    });
  }
  if (o.notifications_drafted > 0) {
    insights.push({
      severity: "warning",
      text: `${o.notifications_drafted} notification draft${o.notifications_drafted === 1 ? "" : "s"} prepared from the rules. Drafting is automated so a statutory notification is never forgotten; sending stays a human decision with a full audit trail.`,
    });
  }
  if (o.escalations_pending > 0) {
    insights.push({
      severity: "critical",
      text: `${o.escalations_pending} action${o.escalations_pending === 1 ? "" : "s"} have passed their deadline and their escalation path has triggered. Escalation is how the workflow guarantees nothing stalls silently — action or formally escalate each one.`,
    });
  }
  return insights;
}
