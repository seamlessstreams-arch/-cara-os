// ══════════════════════════════════════════════════════════════════════════════
// CARA — WORKFLOW ORCHESTRATION RULES
//
// Configurable rules that turn an event into a set of concrete ACTIONS — approval
// tasks, staff debriefs, key-working follow-ups, evidence-bank additions, Cara
// summaries, trend updates and (human-gated) notification drafts — with deadlines
// and escalation. The orchestration layer above routing: routing decides WHERE an
// event surfaces; workflow decides WHAT WORK it generates.
// ══════════════════════════════════════════════════════════════════════════════

import type { RoutingCondition } from "@/types/routing-rule";

export type WorkflowActionType =
  | "create_approval_task"
  | "create_task"
  | "create_debrief_task"
  | "suggest_keywork"
  | "add_evidence"
  | "generate_cara_summary"
  | "update_trend"
  | "create_notification_draft";

export type WorkflowRole = "team_leader" | "deputy" | "manager" | "ri" | "key_worker" | "system";

export interface WorkflowActionTemplate {
  type: WorkflowActionType;
  title: string;
  owner_role: WorkflowRole;
  requires_approval?: boolean;
  approval_level?: "team_leader" | "deputy" | "manager" | "ri";
  deadline_days?: number;
  escalation?: { after_days: number; to_role: WorkflowRole };
  evidence_categories?: string[];
  creates_notification_draft?: string[]; // external parties (Ofsted, LADO, Police...) — always human-gated
}

export interface WorkflowRule {
  id: string;
  name: string;
  description?: string;
  trigger: string;                 // a CornerstoneEventType, or "*"
  conditions: RoutingCondition[];
  actions: WorkflowActionTemplate[];
  audit: boolean;                  // workflow firing is always audited
}
