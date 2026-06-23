// ─────────────────────────────────────────────────────────────────────────────
// Cara Action Centre
//
// "No action should disappear just because a form was completed." This is a PURE
// aggregator that brings every action and attention item into one place:
//   • real, persisted actions from post-incident reflections (owner, due, status)
//   • high-priority attention items projected from each module's intelligence
//     (rights/restriction, reflection, staying-safe-plan, relationships)
//
// Capture-once: it reads the modules' existing flags rather than duplicating them.
// Deterministic (injected `now`, no LLM) → prod-safe.
// ─────────────────────────────────────────────────────────────────────────────

import type { PostIncidentReflection } from "@/lib/post-incident-reflection/types";

export type ActionStatus = "open" | "in_progress" | "done" | "blocked";
export type ActionPriority = "high" | "medium";
export type ActionKind = "action" | "attention";

export interface ActionItem {
  id: string;
  source: string;
  child: string | null;
  description: string;
  detail: string;
  owner: string | null;
  dueDate: string | null;
  priority: ActionPriority;
  status: ActionStatus;
  overdue: boolean;
  kind: ActionKind;
}

/** A module's flagged item, flattened by the route into this common shape. */
export interface AttentionInput {
  source: string;
  label: string;
  why: string;
  childNames: string[]; // empty = home-level
}

export interface ActionCentre {
  generatedAt: string;
  headline: string;
  total: number;
  overdueCount: number;
  highCount: number;
  openActions: number;
  bySource: { source: string; count: number }[];
  items: ActionItem[]; // sorted: overdue → high → open actions → attention
}

export interface ActionCentreInput {
  now: string;
  reflections: PostIncidentReflection[];
  childNameOf: (childId: string) => string;
  attention: AttentionInput[];
}

function isPast(dateIso: string | null | undefined, now: string): boolean {
  if (!dateIso) return false;
  const t = Date.parse(dateIso);
  const n = Date.parse(now);
  return !Number.isNaN(t) && !Number.isNaN(n) && t < n;
}

const OPEN_STATUSES = new Set<ActionStatus>(["open", "blocked"]);
const RANK: Record<ActionPriority, number> = { high: 0, medium: 1 };

export function buildActionCentre(input: ActionCentreInput): ActionCentre {
  const items: ActionItem[] = [];

  // Real, persisted actions from reflections.
  for (const r of input.reflections) {
    for (const a of r.actions ?? []) {
      const overdue = OPEN_STATUSES.has(a.status as ActionStatus) && isPast(a.due_date, input.now);
      items.push({
        id: `act_${a.id}`,
        source: "Post-incident reflection",
        child: input.childNameOf(r.child_id),
        description: a.description,
        detail: "",
        owner: a.owner || null,
        dueDate: a.due_date,
        priority: overdue ? "high" : "medium",
        status: a.status as ActionStatus,
        overdue,
        kind: "action",
      });
    }
  }

  // Attention items projected from each module's intelligence.
  let n = 0;
  for (const at of input.attention) {
    const targets = at.childNames.length ? at.childNames : [null];
    for (const child of targets) {
      items.push({
        id: `att_${n++}`,
        source: at.source,
        child,
        description: at.label,
        detail: at.why,
        owner: null,
        dueDate: null,
        priority: "high",
        status: "open",
        overdue: false,
        kind: "attention",
      });
    }
  }

  // Sort: overdue first, then by priority, then real actions before attention.
  items.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    if (RANK[a.priority] !== RANK[b.priority]) return RANK[a.priority] - RANK[b.priority];
    if (a.kind !== b.kind) return a.kind === "action" ? -1 : 1;
    return (a.child ?? "").localeCompare(b.child ?? "");
  });

  const overdueCount = items.filter((i) => i.overdue).length;
  const highCount = items.filter((i) => i.priority === "high").length;
  const openActions = items.filter((i) => i.kind === "action" && OPEN_STATUSES.has(i.status)).length;

  const sourceMap = new Map<string, number>();
  for (const i of items) sourceMap.set(i.source, (sourceMap.get(i.source) ?? 0) + 1);
  const bySource = [...sourceMap.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);

  const headline =
    items.length === 0
      ? "Nothing needs action right now — every workflow is up to date."
      : `${items.length} item${items.length === 1 ? "" : "s"} need attention across ${bySource.length} area${bySource.length === 1 ? "" : "s"}${overdueCount ? `, ${overdueCount} overdue` : ""}.`;

  return {
    generatedAt: input.now,
    headline,
    total: items.length,
    overdueCount,
    highCount,
    openActions,
    bySource,
    items,
  };
}
