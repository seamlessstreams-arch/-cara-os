// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUTOMATION ACTION EXECUTOR (Phase 2 · Operational Control · Module 1)
//
// The automation engine was fully built but SIMULATE-ONLY: evaluateRules()
// returns the actions a trigger would fire and its header says "the caller
// decides whether to execute" — and no caller ever executed. This is the
// executor, with three hard guarantees:
//
//   1. FLAG-GATED — isFeatureEnabled("automation_executor"), opt-in, default
//      OFF. Off = today's simulate-only behaviour, byte-for-byte. Demo-safe.
//   2. SAFE-SUBSET ONLY — it executes exactly three deterministic, operational
//      side effects with real targets in the store: create a task, create an
//      in-app notification, write an audit event. Everything that would touch
//      an official record or safeguarding state (update_compliance_status,
//      escalate_safeguarding, request_approval, mark_child_followup, …) is
//      returned as REQUIRES_CONFIRMATION for a human to action — per the
//      master-prompt rule that nothing auto-updates official records.
//   3. HONEST OUTCOMES — every action reports executed | requires_confirmation
//      | skipped(reason); nothing is silently dropped and nothing is invented.
//      Each run is written to the audit trail via the existing recorder.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import { recordEntityAudit } from "@/lib/audit/audit-recorder";
import type {
  AutomationAction,
  AutomationActionConfig,
  AutomationRun,
} from "./types";

export type ActionOutcomeStatus = "executed" | "requires_confirmation" | "skipped";

export interface ActionOutcome {
  action: AutomationAction;
  status: ActionOutcomeStatus;
  /** What was created / why it was withheld. */
  detail: string;
  /** Id of a created record (task/notification), when one was created. */
  created_id?: string;
}

export interface ExecutedRun {
  rule_id: string;
  rule_name: string;
  executed: boolean;
  outcomes: ActionOutcome[];
}

export interface ExecutionContext {
  /** The caller on whose authority operational actions are created. */
  userId: string;
  homeId?: string | null;
}

/** Actions the executor may perform autonomously (operational, reversible). */
const SAFE_ACTIONS: ReadonlySet<AutomationAction> = new Set([
  "create_task",
  "create_risk_review_task",
  "notify_manager",
  "notify_senior",
  "notify_staff",
  "send_notification",
  "log_audit_event",
]);

/** Actions that touch official records / safeguarding state — never executed
 *  autonomously; surfaced for a human to confirm. */
const CONFIRMATION_ACTIONS: ReadonlySet<AutomationAction> = new Set([
  "update_compliance_status",
  "escalate_safeguarding",
  "request_approval",
  "mark_child_followup",
  "schedule_review",
]);

/** Is the executor switched on? (Off = the engine stays simulate-only.) */
export function isExecutorEnabled(): boolean {
  return isFeatureEnabled("automation_executor");
}

function resolveNotificationRecipient(action: AutomationAction, params: Record<string, unknown>): string | null {
  if (typeof params.recipient_id === "string" && params.recipient_id) return params.recipient_id;
  const staff = db.staff.findAll() as Array<{ id: string; role: string; is_active?: boolean }>;
  if (action === "notify_manager") {
    return staff.find((s) => s.role === "registered_manager" && s.is_active !== false)?.id ?? null;
  }
  if (action === "notify_senior") {
    return (
      staff.find((s) => (s.role === "deputy_manager" || s.role === "team_leader") && s.is_active !== false)?.id ??
      staff.find((s) => s.role === "registered_manager" && s.is_active !== false)?.id ??
      null
    );
  }
  if (typeof params.staff_id === "string" && params.staff_id) return params.staff_id;
  return null;
}

function executeOne(
  cfg: AutomationActionConfig,
  ruleName: string,
  triggerData: Record<string, unknown>,
  ctx: ExecutionContext,
): ActionOutcome {
  const { action, params = {} } = cfg;

  if (CONFIRMATION_ACTIONS.has(action)) {
    return {
      action,
      status: "requires_confirmation",
      detail: "Touches official records or safeguarding state — a human must confirm this action.",
    };
  }
  if (!SAFE_ACTIONS.has(action)) {
    return {
      action,
      status: "skipped",
      detail: "No deterministic execution target for this action type — left to its owning surface.",
    };
  }

  // ── Safe subset ──────────────────────────────────────────────────────────
  if (action === "create_task" || action === "create_risk_review_task") {
    const task = db.tasks.create({
      title: String(params.title ?? `Automation: ${ruleName}`),
      description: String(
        params.description ??
          `Created by automation rule "${ruleName}"${triggerData.child_id ? ` for ${String(triggerData.child_id)}` : ""}.`,
      ),
      category: (params.category as never) ?? ("compliance" as never),
      priority: (params.priority as never) ?? ("high" as never),
      status: "pending" as never,
      assigned_to: typeof params.assigned_to === "string" ? params.assigned_to : null,
      assigned_role: (params.assigned_role as never) ?? ("registered_manager" as never),
      due_date: typeof params.due_date === "string" ? params.due_date : null,
      created_by: ctx.userId,
    });
    return { action, status: "executed", detail: `Task created: ${task.title}`, created_id: task.id };
  }

  if (action === "log_audit_event") {
    void recordEntityAudit({
      entityType: "automation_rule",
      entityId: String(params.entity_id ?? "rule"),
      homeId: ctx.homeId ?? null,
      action: "update",
      performedBy: ctx.userId,
      metadata: { rule: ruleName, ...params },
    });
    return { action, status: "executed", detail: "Audit event recorded." };
  }

  // notify_* / send_notification
  const recipient = resolveNotificationRecipient(action, params);
  if (!recipient) {
    return { action, status: "skipped", detail: "No resolvable recipient (no staff_id/recipient_id and no matching role on the roster)." };
  }
  const notif = db.notifications.create({
    recipient_id: recipient,
    title: String(params.title ?? `Automation: ${ruleName}`),
    message: String(params.message ?? params.body ?? `Rule "${ruleName}" fired.`),
    type: "automation" as never,
    read: false as never,
    link: typeof params.link === "string" ? params.link : undefined,
  } as never);
  return { action, status: "executed", detail: `Notification sent to ${recipient}.`, created_id: (notif as { id: string }).id };
}

/**
 * Execute the safe actions of already-evaluated rule runs. Call AFTER
 * evaluateRules(); pass its output. When the flag is off, returns every action
 * as requires_confirmation-or-skipped with executed=false — behaviour is
 * identical to today's simulate-only engine.
 */
export function executeRuns(
  runs: AutomationRun[],
  rules: { id: string; name: string; actions: AutomationActionConfig[] }[],
  triggerData: Record<string, unknown>,
  ctx: ExecutionContext,
): ExecutedRun[] {
  const enabled = isExecutorEnabled();
  const byId = new Map(rules.map((r) => [r.id, r]));

  return runs.map((run) => {
    const rule = byId.get(run.rule_id);
    if (!rule) {
      return { rule_id: run.rule_id, rule_name: run.rule_id, executed: false, outcomes: [] };
    }
    if (!enabled) {
      return {
        rule_id: rule.id,
        rule_name: rule.name,
        executed: false,
        outcomes: rule.actions.map((a) => ({
          action: a.action,
          status: "skipped" as const,
          detail: "automation_executor flag is off — simulate-only.",
        })),
      };
    }
    const outcomes = rule.actions.map((a) => executeOne(a, rule.name, triggerData, ctx));
    // The run itself goes on the audit trail — who fired what, with outcomes.
    void recordEntityAudit({
      entityType: "automation_run",
      entityId: rule.id,
      homeId: ctx.homeId ?? null,
      action: "create",
      performedBy: ctx.userId,
      metadata: {
        rule: rule.name,
        outcomes: outcomes.map((o) => ({ action: o.action, status: o.status })),
      },
    });
    return { rule_id: rule.id, rule_name: rule.name, executed: true, outcomes };
  });
}
