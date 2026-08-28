// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUTOMATION ENGINE TYPES
// Centralised trigger-action automation system. Defines triggers, actions,
// rules, conditions, and run records for the deterministic automation engine.
// ══════════════════════════════════════════════════════════════════════════════

export type AutomationTrigger =
  | "incident_submitted" | "incident_severity_high"
  | "risk_level_changed" | "risk_review_due_7_days"
  | "daily_log_missing_9pm" | "daily_log_created"
  | "safeguarding_concern_created" | "safeguarding_referral_required"
  | "direct_work_gap_7_days" | "direct_work_completed"
  | "care_plan_review_due" | "care_plan_goal_achieved"
  | "medication_missed" | "medication_error"
  | "missing_from_care_reported" | "missing_from_care_returned"
  | "restraint_used" | "body_map_required"
  | "review_due_14_days" | "report_generated"
  | "task_overdue" | "compliance_breach"
  | "placement_started" | "placement_ending_28_days"
  | "staff_supervision_overdue" | "training_expiring"
  | "child_absent_from_education" | "health_appointment_missed"
  | "custom_trigger";

export type AutomationAction =
  | "create_task" | "notify_manager" | "notify_senior" | "notify_staff"
  | "add_timeline_event" | "flag_dashboard" | "request_approval"
  | "schedule_review" | "update_compliance_status"
  | "escalate_safeguarding" | "create_compliance_alert"
  | "create_risk_review_task" | "mark_child_followup"
  | "include_in_report" | "send_notification"
  | "log_audit_event" | "custom_action";

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions: AutomationActionConfig[];
  enabled: boolean;
  priority: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  run_count: number;
  last_run_at?: string;
}

export interface AutomationCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "is_empty" | "is_not_empty";
  value: unknown;
}

export interface AutomationActionConfig {
  action: AutomationAction;
  params: Record<string, any>;
}

export interface AutomationRun {
  id: string;
  rule_id: string;
  trigger: AutomationTrigger;
  trigger_data: Record<string, any>;
  actions_executed: { action: AutomationAction; success: boolean; result?: unknown; error?: string }[];
  status: "success" | "partial" | "failed";
  duration_ms: number;
  created_at: string;
}
