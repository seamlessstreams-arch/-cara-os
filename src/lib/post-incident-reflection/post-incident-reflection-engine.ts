// ─────────────────────────────────────────────────────────────────────────────
// Post-Incident Reflection & Learning Engine
//
// Turns incidents into learning. Reads a reflection's workflow + content and
// surfaces: how far through the workflow it is, where the child's voice or a
// debrief is missing, whether a serious incident has triggered a plan review,
// and — across the home — which incidents still have no reflection and which
// children show a repeated trigger pattern.
//
// Every flag is explainable (`why`) and is support, not a verdict. Deterministic
// (injected `now`, no LLM) → works in production with no AI key.
// ─────────────────────────────────────────────────────────────────────────────

import { STAGE_DEFS, type PostIncidentReflection } from "./types";
import type { Incident } from "@/types";

export type FlagSeverity = "info" | "advisory" | "high";

export interface ReflectionFlag {
  key: string;
  severity: FlagSeverity;
  message: string;
  why: string;
}

export interface ReflectionAnalysis {
  reflectionId: string;
  incidentId: string;
  childId: string;
  stagesComplete: number;
  stagesTotal: number;
  progressPct: number;
  nextStageLabel: string | null;
  flags: ReflectionFlag[];
  needsManagerAttention: boolean;
}

const HIGH_SEVERITY = new Set(["serious", "high", "major", "critical"]);
const present = (v: unknown): boolean => typeof v === "string" && v.trim().length > 0;

function daysSince(dateIso: string | undefined, now: string): number {
  if (!dateIso) return Number.POSITIVE_INFINITY;
  const t = Date.parse(dateIso);
  const n = Date.parse(now);
  if (Number.isNaN(t) || Number.isNaN(n)) return Number.POSITIVE_INFINITY;
  return (n - t) / 86_400_000;
}

const STAGE_DONE = new Set(["completed", "signed_off"]);

function stageDone(r: PostIncidentReflection, key: string): boolean {
  return STAGE_DONE.has(r.stages.find((s) => s.key === key)?.status ?? "not_started");
}

// ── Analyse one reflection ───────────────────────────────────────────────────

export function analysePostIncidentReflection(r: PostIncidentReflection, now: string): ReflectionAnalysis {
  const stagesTotal = r.stages.length;
  const stagesComplete = r.stages.filter((s) => STAGE_DONE.has(s.status)).length;
  const progressPct = stagesTotal ? Math.round((stagesComplete / stagesTotal) * 100) : 0;
  const nextStage = r.stages.find((s) => !STAGE_DONE.has(s.status));

  const flags: ReflectionFlag[] = [];
  const serious = HIGH_SEVERITY.has(String(r.severity));
  const ageDays = daysSince(r.incident_date, now);
  const anyPlanReview =
    r.staying_safe_plan_review ||
    r.risk_assessment_review ||
    r.behaviour_support_review ||
    r.relationship_map_review ||
    r.restrictive_practice_review;

  if (!present(r.child_view)) {
    flags.push({
      key: "no-child-voice",
      severity: "high",
      message: "The child's view of the incident isn't recorded.",
      why: "Understanding the incident from the child's perspective is central to learning and repair.",
    });
  }
  if (r.child_debrief_done !== "yes") {
    flags.push({
      key: "no-child-debrief",
      severity: serious ? "high" : "advisory",
      message: "A child debrief is not recorded as completed.",
      why: "A restorative conversation with the child supports repair and is expected after an incident.",
    });
  }
  if (r.staff_debrief_done === "no") {
    flags.push({
      key: "no-staff-debrief",
      severity: "advisory",
      message: "No staff debrief recorded.",
      why: "Staff involved should have a chance to reflect and be supported, especially after a serious incident.",
    });
  }
  if (serious && !anyPlanReview) {
    flags.push({
      key: "serious-no-plan-update",
      severity: "high",
      message: "A serious incident, but no linked plan has been flagged for review.",
      why: "Serious incidents usually mean a Staying Safe Plan, risk assessment or behaviour support plan needs revisiting.",
    });
  }
  if (!present(r.learning_points)) {
    flags.push({
      key: "no-learning",
      severity: "advisory",
      message: "No learning points captured yet.",
      why: "The point of reflection is to capture what was learned so practice improves.",
    });
  }
  const unresolved = r.actions.filter((a) => (a.status === "open" || a.status === "blocked") && a.due_date && daysSince(a.due_date, now) > 0);
  if (unresolved.length > 0) {
    flags.push({
      key: "unresolved-actions",
      severity: "high",
      message: `${unresolved.length} action${unresolved.length === 1 ? "" : "s"} overdue and unresolved.`,
      why: "Actions from reflection only improve safety if they are completed — these are past their due date.",
    });
  }
  if (r.response_helped === "no") {
    flags.push({
      key: "response-didnt-help",
      severity: "advisory",
      message: "The staff response is recorded as not having helped.",
      why: "If the response didn't help, capture what would be tried differently next time.",
    });
  }
  // Stages stale for the incident's age.
  if (ageDays > 5 && r.status !== "signed_off") {
    const stale = ["staff_reflection", "child_debrief", "manager_oversight"].filter((k) => !stageDone(r, k));
    if (stale.length > 0) {
      flags.push({
        key: "stages-overdue",
        severity: "advisory",
        message: "Key reflection stages are still open several days after the incident.",
        why: "Reflection, child debrief and manager oversight are most useful soon after the event.",
      });
    }
  }

  const hasHigh = flags.some((f) => f.severity === "high");
  const needsManagerAttention = hasHigh || !stageDone(r, "manager_oversight") || progressPct < 60;

  return {
    reflectionId: r.id,
    incidentId: r.incident_id,
    childId: r.child_id,
    stagesComplete,
    stagesTotal,
    progressPct,
    nextStageLabel: nextStage ? (STAGE_DEFS.find((d) => d.key === nextStage.key)?.label ?? null) : null,
    flags,
    needsManagerAttention,
  };
}

// ── Home-wide overview ───────────────────────────────────────────────────────

export interface IncidentNeedingReflection {
  incidentId: string;
  childId: string;
  childName: string;
  date: string;
  severity: string;
}

export interface RepeatedTrigger {
  childId: string;
  childName: string;
  trigger: string;
  count: number;
}

export interface ReflectionAlert {
  key: string;
  label: string;
  why: string;
  items: string[]; // child names / references for context
}

export interface ReflectionSummary {
  reflection: PostIncidentReflection;
  childName: string;
  analysis: ReflectionAnalysis;
}

export interface ReflectionOverview {
  generatedAt: string;
  headline: string;
  homeStatus: "settled" | "monitor" | "action_needed";
  totalReflections: number;
  openCount: number;
  needingAttention: number;
  incidentsNeedingReflection: IncidentNeedingReflection[];
  repeatedTriggers: RepeatedTrigger[];
  alerts: ReflectionAlert[];
  reflections: ReflectionSummary[];
}

export interface ReflectionOverviewInput {
  now: string;
  reflections: PostIncidentReflection[];
  incidents: Incident[];
  children: { id: string; name: string }[];
  /** Only surface incidents needing reflection within this window (days). */
  reflectionWindowDays?: number;
}

const STOP_WORDS = new Set(["the", "a", "an", "and", "of", "to", "in", "on", "at", "with", "for", "his", "her", "their", "was", "were", "by"]);

function triggerTokens(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
}

export function buildReflectionOverview(input: ReflectionOverviewInput): ReflectionOverview {
  const nameOf = (childId: string) => input.children.find((c) => c.id === childId)?.name ?? "Child";
  const windowDays = input.reflectionWindowDays ?? 60;

  const summaries: ReflectionSummary[] = input.reflections
    .map((reflection) => ({
      reflection,
      childName: nameOf(reflection.child_id),
      analysis: analysePostIncidentReflection(reflection, input.now),
    }))
    .sort((a, b) => b.reflection.incident_date.localeCompare(a.reflection.incident_date));

  // Automation surfacing: incidents (recent) with no reflection started.
  const reflectedIncidentIds = new Set(input.reflections.map((r) => r.incident_id));
  const incidentsNeedingReflection: IncidentNeedingReflection[] = input.incidents
    .filter((i) => !reflectedIncidentIds.has(i.id) && daysSince(i.date, input.now) <= windowDays)
    .map((i) => ({ incidentId: i.id, childId: i.child_id, childName: nameOf(i.child_id), date: i.date, severity: String(i.severity) }))
    .sort((a, b) => b.date.localeCompare(a.date));

  // Repeated-trigger pattern: a child with >=2 reflections sharing a trigger token.
  const repeatedTriggers: RepeatedTrigger[] = [];
  const byChild = new Map<string, PostIncidentReflection[]>();
  for (const r of input.reflections) byChild.set(r.child_id, [...(byChild.get(r.child_id) ?? []), r]);
  for (const [childId, rs] of byChild) {
    if (rs.length < 2) continue;
    const tokenCounts = new Map<string, number>();
    for (const r of rs) {
      for (const t of new Set(triggerTokens(r.likely_triggers))) {
        tokenCounts.set(t, (tokenCounts.get(t) ?? 0) + 1);
      }
    }
    const top = [...tokenCounts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1])[0];
    if (top) repeatedTriggers.push({ childId, childName: nameOf(childId), trigger: top[0], count: top[1] });
  }

  const needingAttention = summaries.filter((s) => s.analysis.needsManagerAttention).length;
  const openCount = summaries.filter((s) => s.reflection.status !== "signed_off").length;

  const mk = (key: string, label: string, why: string, items: string[]): ReflectionAlert | null =>
    items.length ? { key, label, why, items: [...new Set(items)] } : null;

  const alerts = [
    mk(
      "incidents_no_reflection",
      "Incidents with no reflection started",
      "Every incident should lead to reflection so the home learns from it.",
      incidentsNeedingReflection.map((i) => i.childName),
    ),
    mk(
      "missing_child_voice",
      "Reflections without the child's view",
      "The child's perspective is central to understanding and repair.",
      summaries.filter((s) => s.analysis.flags.some((f) => f.key === "no-child-voice")).map((s) => s.childName),
    ),
    mk(
      "missing_child_debrief",
      "Incidents without a recorded child debrief",
      "A restorative conversation with the child supports repair.",
      summaries.filter((s) => s.reflection.child_debrief_done !== "yes").map((s) => s.childName),
    ),
    mk(
      "serious_no_plan_update",
      "Serious incidents with no plan review flagged",
      "A serious incident usually means a plan needs revisiting.",
      summaries.filter((s) => s.analysis.flags.some((f) => f.key === "serious-no-plan-update")).map((s) => s.childName),
    ),
    mk(
      "unresolved_actions",
      "Reflections with overdue actions",
      "Actions only improve safety once completed.",
      summaries.filter((s) => s.analysis.flags.some((f) => f.key === "unresolved-actions")).map((s) => s.childName),
    ),
    mk(
      "repeated_triggers",
      "Children showing a repeated trigger pattern",
      "The same trigger recurring suggests a plan change, not just incident-by-incident responses.",
      repeatedTriggers.map((t) => `${t.childName} (“${t.trigger}”)`),
    ),
  ].filter((a): a is ReflectionAlert => a !== null);

  const homeStatus: ReflectionOverview["homeStatus"] =
    incidentsNeedingReflection.length > 0 || repeatedTriggers.length > 0 || needingAttention >= 2
      ? "action_needed"
      : alerts.length > 0 || needingAttention > 0
        ? "monitor"
        : "settled";

  const headline =
    summaries.length === 0 && incidentsNeedingReflection.length === 0
      ? "No incidents needing reflection right now."
      : incidentsNeedingReflection.length > 0
        ? `${incidentsNeedingReflection.length} incident${incidentsNeedingReflection.length === 1 ? "" : "s"} need a reflection started; ${needingAttention} reflection${needingAttention === 1 ? "" : "s"} need attention.`
        : `${needingAttention} of ${summaries.length} reflection${summaries.length === 1 ? "" : "s"} need attention.`;

  return {
    generatedAt: input.now,
    headline,
    homeStatus,
    totalReflections: summaries.length,
    openCount,
    needingAttention,
    incidentsNeedingReflection,
    repeatedTriggers,
    alerts,
    reflections: summaries,
  };
}
