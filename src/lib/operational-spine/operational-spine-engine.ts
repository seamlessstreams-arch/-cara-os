// ══════════════════════════════════════════════════════════════════════════════
// CARA — OPERATIONAL SPINE (Phase 2 · Operational Control · M3+M4)
//
// The audit found alerts and escalations fragmented across parallel systems —
// a manager has no single place that answers "what operational signals are
// live right now?" and "what is escalating?". Following the repo's proven
// consolidation pattern (the calendar: one PURE PROJECTION over many sources,
// no source rewritten), this is the read spine:
//
//   • unifiedAlerts()      — emergency alerts · unread notifications · overdue
//                            tasks · task-SLA breaches, in ONE severity-ranked
//                            shape with a deep link each.
//   • unifiedEscalations() — risk-escalation decisions (awaiting first) ·
//                            trajectory RI escalations · urgent overdue tasks.
//
// Deterministic, read-only, zero writes — no flag needed. Every source is
// isolated behind its own try/catch: one source's shape drift degrades that
// source to empty, never the whole feed (and the gap is reported honestly in
// `sources`). Sources that already have rich surfaces of their own (system
// health, pattern alerts, priority briefing) are deep-LINKED rather than
// re-projected — no duplicate intelligence.
// ══════════════════════════════════════════════════════════════════════════════

import { db, getStore } from "@/lib/db/store";
import { monitorTaskSla, type SlaTask } from "@/lib/escalation/task-sla-monitor";
import { detectTrajectoryRiEscalations } from "@/lib/care-events/inspection-trajectory";

export type SpineSeverity = "critical" | "high" | "medium" | "low";

export interface SpineItem {
  id: string;
  source: string;
  severity: SpineSeverity;
  title: string;
  detail?: string;
  href: string;
  child_id?: string | null;
  created_at?: string | null;
}

export interface SpineResult {
  items: SpineItem[];
  /** Per-source counts + health — a failed source reports ok:false, count 0. */
  sources: { source: string; ok: boolean; count: number }[];
  totals: Record<SpineSeverity, number>;
}

const SEV_ORDER: Record<SpineSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function finish(items: SpineItem[], sources: SpineResult["sources"]): SpineResult {
  items.sort(
    (a, b) =>
      SEV_ORDER[a.severity] - SEV_ORDER[b.severity] ||
      (b.created_at ?? "").localeCompare(a.created_at ?? "") ||
      a.id.localeCompare(b.id),
  );
  const totals: Record<SpineSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const i of items) totals[i.severity]++;
  return { items, sources, totals };
}

function collect(
  source: string,
  sources: SpineResult["sources"],
  items: SpineItem[],
  fn: () => SpineItem[],
): void {
  try {
    const got = fn();
    items.push(...got);
    sources.push({ source, ok: true, count: got.length });
  } catch {
    sources.push({ source, ok: false, count: 0 });
  }
}

/** One severity-ranked feed of live operational alerts. Pure projection. */
export function unifiedAlerts(nowIso: string): SpineResult {
  const items: SpineItem[] = [];
  const sources: SpineResult["sources"] = [];
  const today = nowIso.slice(0, 10);

  collect("emergency_alerts", sources, items, () =>
    db.emergencyAlerts
      .findAll()
      .filter((a) => a.status === "active")
      .map((a) => ({
        id: `emg:${a.id}`,
        source: "emergency_alerts",
        severity: "critical" as const,
        title: `Emergency: ${String(a.type).replace(/_/g, " ")}`,
        detail: a.location ? `Location: ${a.location}` : undefined,
        href: "/safe-staffing",
        created_at: (a as { created_at?: string }).created_at ?? null,
      })),
  );

  collect("task_sla_breaches", sources, items, () => {
    const result = monitorTaskSla(getStore().tasks as unknown as SlaTask[], new Date(nowIso));
    const breaches = (result as { breaches?: unknown[] }).breaches ?? [];
    return (breaches as Array<{ task_id?: string; id?: string; title?: string; severity?: string }>).map((b, i) => ({
      id: `sla:${b.task_id ?? b.id ?? i}`,
      source: "task_sla_breaches",
      severity: (b.severity === "critical" ? "critical" : "high") as SpineSeverity,
      title: `SLA breach: ${b.title ?? "deadline-bound task"}`,
      href: "/tasks",
      created_at: null,
    }));
  });

  collect("overdue_tasks", sources, items, () =>
    getStore()
      .tasks.filter(
        (t) =>
          t.due_date &&
          t.due_date < today &&
          t.status !== "completed" &&
          (t.status as string) !== "cancelled",
      )
      .slice(0, 25)
      .map((t) => ({
        id: `task:${t.id}`,
        source: "overdue_tasks",
        severity: ((t.priority as string) === "urgent" ? "high" : "medium") as SpineSeverity,
        title: `Overdue: ${t.title}`,
        detail: `Due ${t.due_date}`,
        href: "/tasks",
        created_at: t.due_date,
      })),
  );

  collect("unread_notifications", sources, items, () =>
    getStore()
      .notifications.filter((n) => !n.read)
      .slice(0, 25)
      .map((n) => ({
        id: `notif:${n.id}`,
        source: "unread_notifications",
        severity: "low" as const,
        title: (n as { title?: string }).title ?? "Notification",
        href: "/notifications",
        created_at: (n as { created_at?: string }).created_at ?? null,
      })),
  );

  return finish(items, sources);
}

/** One feed of everything escalating — awaiting decisions first. */
export function unifiedEscalations(nowIso: string, homeId = "home_oak"): SpineResult {
  const items: SpineItem[] = [];
  const sources: SpineResult["sources"] = [];
  const today = nowIso.slice(0, 10);

  collect("risk_escalation_decisions", sources, items, () =>
    db.escalationDecisions.findAll().map((d) => ({
      id: `esc:${d.id}`,
      source: "risk_escalation_decisions",
      severity: (d.status === "awaiting_decision" ? "critical" : "medium") as SpineSeverity,
      title:
        d.status === "awaiting_decision"
          ? `Awaiting decision: ${d.concernSummary}`
          : `Decided: ${d.concernSummary}`,
      detail: d.childName ? `Child: ${d.childName}` : undefined,
      href: "/risk-escalation",
      child_id: d.childId ?? null,
      created_at: d.createdAt,
    })),
  );

  collect("trajectory_ri_escalations", sources, items, () =>
    detectTrajectoryRiEscalations(homeId).map((e, i) => {
      const r = e as { id?: string; message?: string; summary?: string; detected_at?: string };
      return {
        id: `traj:${r.id ?? i}`,
        source: "trajectory_ri_escalations",
        severity: "high" as const,
        title: r.message ?? r.summary ?? "Trajectory escalation to the RI",
        href: "/inspection-readiness",
        created_at: r.detected_at ?? null,
      };
    }),
  );

  collect("urgent_overdue_tasks", sources, items, () =>
    getStore()
      .tasks.filter(
        (t) =>
          (t.priority as string) === "urgent" &&
          t.due_date &&
          t.due_date < today &&
          t.status !== "completed" &&
          (t.status as string) !== "cancelled",
      )
      .slice(0, 15)
      .map((t) => ({
        id: `utask:${t.id}`,
        source: "urgent_overdue_tasks",
        severity: "high" as const,
        title: `Urgent + overdue: ${t.title}`,
        detail: `Due ${t.due_date}`,
        href: "/tasks",
        created_at: t.due_date,
      })),
  );

  return finish(items, sources);
}
