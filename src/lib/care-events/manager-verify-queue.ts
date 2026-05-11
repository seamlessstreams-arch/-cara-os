// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Manager Verify Queue  (Milestone 29 engine)
//
// Read-only listing of care events sitting in `manager_review_required` (or
// `routing_failed`) status, waiting for a manager to verify or return.
//
// Surfaces each item's safeguarding sensitivity, age, evidence count and
// failed-route count so a manager can prioritise. Consumers (the page and
// the bulk action endpoint) decide what to do.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type { CareEvent, CareEventStatus } from "@/types/care-events";

export type ManagerVerifyPriority = "critical" | "high" | "medium" | "low";

export interface ManagerVerifyRow {
  care_event_id: string;
  home_id: string;
  child_id: string | null;
  title: string;
  category: string;
  status: CareEventStatus;
  staff_id: string;
  event_date: string;
  submitted_at: string | null;
  age_hours: number;
  is_safeguarding_sensitive: boolean;
  contributes_to_reg45: boolean;
  contributes_to_annex_a: boolean;
  requires_reg40_triage: boolean;
  pending_reg45_evidence: number;
  pending_annex_a_evidence: number;
  failed_routes: number;
  failed_jobs: number;
  priority: ManagerVerifyPriority;
}

export interface ManagerVerifyQueue {
  home_id: string;
  generated_at: string;
  total: number;
  sensitive_count: number;
  by_priority: Record<ManagerVerifyPriority, number>;
  by_category: { category: string; count: number }[];
  rows: ManagerVerifyRow[];
}

const PRIORITY_ORDER: Record<ManagerVerifyPriority, number> = {
  critical: 0, high: 1, medium: 2, low: 3,
};

const REVIEWABLE_STATUSES: ReadonlySet<CareEventStatus> = new Set<CareEventStatus>([
  "manager_review_required",
  "routing_failed",
]);

function priorityFor(e: CareEvent, sensitive: boolean, ageHours: number): ManagerVerifyPriority {
  if (sensitive || e.requires_reg40_triage) return "critical";
  if (e.status === "routing_failed") return "high";
  if (e.contributes_to_reg45 || e.contributes_to_annex_a) return "high";
  if (ageHours >= 48) return "high";
  if (ageHours >= 24) return "medium";
  return "low";
}

export function loadManagerVerifyQueue(homeId: string): ManagerVerifyQueue {
  const events = db.careEvents.findCurrent().filter(
    (e) => e.home_id === homeId && REVIEWABLE_STATUSES.has(e.status),
  );

  const allReg45 = db.ariaReg45EvidenceItems.findAll(homeId);
  const allAnnex = db.annexAEvidenceQueue.findAll();
  const allRoutes = db.careEventRoutes.findAll();
  const allJobs = db.careEventJobs.findAll();

  const now = Date.now();

  const rows: ManagerVerifyRow[] = events.map((e) => {
    const submittedMs = e.submitted_at ? Date.parse(e.submitted_at) : Date.parse(e.created_at);
    const age_hours = Math.max(0, Math.round((now - submittedMs) / 36e5));
    const sensitive =
      Boolean(e.is_safeguarding) ||
      Boolean(e.requires_reg40_triage) ||
      Boolean(e.contributes_to_reg45) ||
      Boolean(e.contributes_to_annex_a);

    const pending_reg45_evidence = allReg45.filter(
      (r) => r.source_id === e.id && r.status === "ai_draft",
    ).length;
    const pending_annex_a_evidence = allAnnex.filter(
      (a) => a.care_event_id === e.id && a.manager_decision === "pending",
    ).length;
    const failed_routes = allRoutes.filter(
      (r) => r.care_event_id === e.id &&
        (r.status === "failed" || r.status === "retry_required"),
    ).length;
    const failed_jobs = allJobs.filter(
      (j) => j.care_event_id === e.id &&
        (j.status === "failed" || j.status === "retry_required"),
    ).length;

    return {
      care_event_id: e.id,
      home_id: e.home_id,
      child_id: e.child_id ?? null,
      title: e.title,
      category: e.category,
      status: e.status,
      staff_id: e.staff_id,
      event_date: e.event_date,
      submitted_at: e.submitted_at ?? null,
      age_hours,
      is_safeguarding_sensitive: sensitive,
      contributes_to_reg45: Boolean(e.contributes_to_reg45),
      contributes_to_annex_a: Boolean(e.contributes_to_annex_a),
      requires_reg40_triage: Boolean(e.requires_reg40_triage),
      pending_reg45_evidence,
      pending_annex_a_evidence,
      failed_routes,
      failed_jobs,
      priority: priorityFor(e, sensitive, age_hours),
    };
  });

  rows.sort((a, b) => {
    const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (p !== 0) return p;
    if (a.is_safeguarding_sensitive !== b.is_safeguarding_sensitive) {
      return a.is_safeguarding_sensitive ? -1 : 1;
    }
    return b.age_hours - a.age_hours;
  });

  const by_priority: Record<ManagerVerifyPriority, number> = {
    critical: 0, high: 0, medium: 0, low: 0,
  };
  const catMap = new Map<string, number>();
  let sensitive_count = 0;
  for (const r of rows) {
    by_priority[r.priority] += 1;
    if (r.is_safeguarding_sensitive) sensitive_count += 1;
    catMap.set(r.category, (catMap.get(r.category) ?? 0) + 1);
  }
  const by_category = [...catMap.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    home_id: homeId,
    generated_at: new Date().toISOString(),
    total: rows.length,
    sensitive_count,
    by_priority,
    by_category,
    rows,
  };
}
