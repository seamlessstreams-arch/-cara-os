// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTINUOUS HEALTH CHECK (pure engine)
//
// runSystemHealthCheck(input) scans the home's records and returns a Health
// Report: every issue carries its severity, the record it points at, a
// recommended action, and whether it needs human review. Detection only — Cara
// never auto-alters a safeguarding record. No model calls, no store access.
// ══════════════════════════════════════════════════════════════════════════════

import {
  SYSTEM_HEALTH_VERSION,
  type HealthCheckCategory,
  type HealthIssue,
  type HealthSeverity,
  type SystemHealthInput,
  type SystemHealthReport,
} from "./types";

const DISCLAIMER =
  "Cara has scanned the home's records and surfaced what needs attention. It detects and prompts — it never auto-changes a safeguarding record or a professional decision. Every practice issue is for a person to resolve.";

const SEVERITY_WEIGHT: Record<HealthSeverity, number> = { critical: 15, high: 8, medium: 3, low: 1 };

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export function runSystemHealthCheck(input: SystemHealthInput): SystemHealthReport {
  const { asOf } = input;
  const childIds = new Set(input.children.map((c) => c.id));
  const issues: HealthIssue[] = [];
  const push = (i: Omit<HealthIssue, "autoFixable" | "humanReviewRequired"> & Partial<Pick<HealthIssue, "autoFixable" | "humanReviewRequired">>) =>
    issues.push({ autoFixable: false, humanReviewRequired: true, ...i });

  const overdue = (dateStr: string) => !!dateStr && daysBetween(dateStr, asOf) > 0;

  // ── 1. Overdue actions ─────────────────────────────────────────────────────
  for (const t of input.tasks) {
    if (overdue(t.due_date) && t.status !== "completed" && t.status !== "cancelled") {
      push({ id: `hc_task_${t.id}`, category: "overdue_action", severity: "high", module: "Tasks", recordType: "tasks", recordId: t.id, childId: t.child_id, message: `Action overdue by ${daysBetween(t.due_date, asOf)} day(s): "${t.title}".`, recommendedAction: "Complete the action or re-plan it with a new owner and date." });
    }
  }

  // ── 2. Missing management oversight ─────────────────────────────────────────
  for (const inc of input.incidents) {
    if (inc.requires_oversight && !inc.has_oversight && inc.status !== "closed") {
      push({ id: `hc_ovs_${inc.id}`, category: "missing_oversight", severity: "high", module: "Incidents", recordType: "incidents", recordId: inc.id, childId: inc.child_id, message: `Incident needs management oversight and none is recorded.`, recommendedAction: "Complete the manager oversight before the record is closed." });
    }
  }

  // ── 3. Restraint repair gap (safeguarding-critical) ─────────────────────────
  for (const r of input.restraints) {
    if (!r.child_debriefed && !r.has_debrief) {
      push({ id: `hc_rst_${r.id}`, category: "restraint_repair_gap", severity: "critical", module: "Restraints", recordType: "restraints", recordId: r.id, childId: r.child_id, message: `Physical intervention has no recorded child debrief — the repair conversation is outstanding.`, recommendedAction: "Hold and record the child's debrief; review the restraint with the child." });
    }
  }

  // ── 4. Missing return interview after a missing episode ─────────────────────
  for (const m of input.missingEpisodes) {
    if (!m.has_return_interview) {
      push({ id: `hc_mfc_${m.id}`, category: "missing_return_interview", severity: "high", module: "Missing from care", recordType: "missingEpisodes", recordId: m.id, childId: m.child_id, message: `Missing episode has no return home interview recorded.`, recommendedAction: "Offer and record the independent return home interview." });
    }
  }

  // ── 5. Overdue reviews (risk assessments, LAC reviews, care plans) ──────────
  for (const rev of input.reviews) {
    if (overdue(rev.next_review_date)) {
      push({ id: `hc_rev_${rev.id}`, category: "overdue_review", severity: "medium", module: rev.kind, recordType: "reviews", recordId: rev.id, childId: rev.child_id, message: `${rev.kind} review is overdue by ${daysBetween(rev.next_review_date, asOf)} day(s).`, recommendedAction: `Schedule and complete the ${rev.kind.toLowerCase()} review.` });
    }
  }

  // ── 6. Recording gaps (no daily log in N days) ─────────────────────────────
  const gapDays = input.recordingGapDays ?? 3;
  for (const child of input.children) {
    const dates = input.dailyLogDatesByChild[child.id] ?? [];
    const mostRecent = dates.sort((a, b) => (a < b ? 1 : -1))[0];
    const since = mostRecent ? daysBetween(mostRecent, asOf) : Infinity;
    if (since > gapDays) {
      push({ id: `hc_log_${child.id}`, category: "recording_gap", severity: since === Infinity || since > gapDays * 3 ? "high" : "medium", module: "Daily logs", recordType: "youngPeople", recordId: child.id, childId: child.id, message: mostRecent ? `No daily log for ${child.name} in ${since} day(s).` : `No daily log on record for ${child.name}.`, recommendedAction: `Record ${child.name}'s daily log — safeguarding-critical continuity of the record.` });
    }
  }

  // ── 7. Orphaned references (record points at a child not on roll) ──────────
  const orphanCheck = (recordType: string, recs: Array<{ id: string; child_id?: string }>, module: string) => {
    for (const r of recs) {
      if (r.child_id && !childIds.has(r.child_id)) {
        push({ id: `hc_orphan_${recordType}_${r.id}`, category: "orphaned_reference", severity: "medium", module, recordType, recordId: r.id, message: `${module} record references a child (${r.child_id}) who is not a current resident.`, recommendedAction: "Check the record — the child may have left, or the reference is wrong." });
      }
    }
  };
  orphanCheck("tasks", input.tasks, "Tasks");
  orphanCheck("incidents", input.incidents, "Incidents");
  orphanCheck("restraints", input.restraints, "Restraints");

  // ── Summarise ───────────────────────────────────────────────────────────────
  const bySeverity: Record<HealthSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  const byCategory: Partial<Record<HealthCheckCategory, number>> = {};
  for (const i of issues) {
    bySeverity[i.severity]++;
    byCategory[i.category] = (byCategory[i.category] ?? 0) + 1;
  }
  const penalty = issues.reduce((s, i) => s + SEVERITY_WEIGHT[i.severity], 0);
  const healthScore = Math.max(0, 100 - penalty);
  const status: SystemHealthReport["status"] = bySeverity.critical > 0 || healthScore < 50 ? "action_required" : healthScore < 80 ? "attention" : "healthy";

  const checksRun: HealthCheckCategory[] = [
    "overdue_action", "missing_oversight", "restraint_repair_gap", "missing_return_interview", "overdue_review", "recording_gap", "orphaned_reference",
  ];

  // Most severe first, then by category.
  const rank = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  issues.sort((a, b) => rank[a.severity] - rank[b.severity]);

  return {
    homeId: input.homeId,
    asOf,
    checksRun,
    issues,
    summary: { total: issues.length, bySeverity, byCategory },
    healthScore,
    status,
    disclaimer: DISCLAIMER,
    engineVersion: SYSTEM_HEALTH_VERSION,
  };
}

export { SYSTEM_HEALTH_VERSION };
