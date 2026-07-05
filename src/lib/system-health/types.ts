// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTINUOUS HEALTH CHECK (types)
//
// A deterministic scan of the home's live records for operational and practice-
// safety issues — overdue actions, missing management oversight, restraint repair
// gaps, missing return interviews, overdue reviews, recording gaps and orphaned
// references — producing a Health Report a manager can act on.
//
// SAFETY: Cara DETECTS and surfaces; it never auto-alters a safeguarding record
// or a professional decision. Every practice-sensitive issue is flagged for human
// review. (Auto-repair, when built, is limited to technical issues — safe link
// refreshes / cache rebuilds — never practice records.)
// ══════════════════════════════════════════════════════════════════════════════

export const SYSTEM_HEALTH_VERSION = "1.0.0";

export type HealthSeverity = "critical" | "high" | "medium" | "low";

export type HealthCheckCategory =
  | "overdue_action"
  | "missing_oversight"
  | "restraint_repair_gap"
  | "missing_return_interview"
  | "overdue_review"
  | "recording_gap"
  | "orphaned_reference";

export interface HealthIssue {
  id: string;
  category: HealthCheckCategory;
  severity: HealthSeverity;
  module: string;
  recordType: string;
  recordId: string;
  childId?: string;
  message: string;
  recommendedAction: string;
  /** Only ever true for technical issues; practice records are never auto-fixed. */
  autoFixable: boolean;
  humanReviewRequired: boolean;
}

export interface SystemHealthReport {
  homeId: string;
  asOf: string;
  checksRun: HealthCheckCategory[];
  issues: HealthIssue[];
  summary: {
    total: number;
    bySeverity: Record<HealthSeverity, number>;
    byCategory: Partial<Record<HealthCheckCategory, number>>;
  };
  /** 0–100 — 100 is clean. */
  healthScore: number;
  status: "healthy" | "attention" | "action_required";
  disclaimer: string;
  engineVersion: string;
}

// ── Input snapshots (the route reads the store; the engine stays pure) ────────

export interface SystemHealthInput {
  homeId: string;
  asOf: string; // YYYY-MM-DD
  children: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string; due_date: string; status: string; child_id?: string }>;
  incidents: Array<{ id: string; type: string; date: string; requires_oversight: boolean; has_oversight: boolean; child_id?: string; status: string }>;
  restraints: Array<{ id: string; date: string; child_debriefed: boolean; has_debrief: boolean; child_id?: string }>;
  missingEpisodes: Array<{ id: string; date: string; has_return_interview: boolean; child_id?: string }>;
  reviews: Array<{ id: string; kind: string; next_review_date: string; child_id?: string }>;
  dailyLogDatesByChild: Record<string, string[]>; // child_id → recent daily-log dates
  /** Recording-gap threshold (days without a daily log). Default 3. */
  recordingGapDays?: number;
}
