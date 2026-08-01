// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD IMPACT VIEW TYPES
// Defines the shape of the per-child impact assessment: 10 care domains,
// overall progress summary, achievements, actions, risks, goals, and narrative.
//
// Used by the child-impact-engine, API route, hook, and component.
// ══════════════════════════════════════════════════════════════════════════════

export interface ChildImpactDomain {
  domain: string;
  label: string;
  icon: string;
  current_status: "improving" | "stable" | "declining" | "not_assessed";
  score: number;
  trend: "up" | "flat" | "down";
  highlights: string[];
  concerns: string[];
  evidence_count: number;
}

export interface ChildImpactView {
  child_id: string;
  child_name: string;
  assessment_date: string;
  placement_duration_days: number;
  overall_progress: "significant" | "good" | "some" | "limited" | "not_assessed";
  overall_score: number | null;
  domains: ChildImpactDomain[];
  key_achievements: string[];
  outstanding_actions: string[];
  risks_reduced: string[];
  goals_progressed: string[];
  relationships_supported: string[];
  lessons_learned: string[];
  next_steps: string[];
  total_direct_work_hours: number;
  total_incidents: number;
  incidents_trend: "up" | "flat" | "down";
}
