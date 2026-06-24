// ─────────────────────────────────────────────────────────────────────────────
// Staying Safe Plan Engine
//
// Reads a child's Staying Safe Plan and surfaces how complete and usable it is —
// especially the safety-critical parts (the red zone, trusted people, the child's
// own voice) — and across the home, who has no plan and whose plan a recent
// post-incident reflection has flagged for review. Every flag is explainable.
// Deterministic (injected `now`, no LLM) → prod-safe.
// ─────────────────────────────────────────────────────────────────────────────

import type { StayingSafePlan } from "./types";
import type { PostIncidentReflection } from "@/lib/post-incident-reflection/types";
import type { Incident } from "@/types";

export type FlagSeverity = "info" | "advisory" | "high";

export interface SafePlanFlag {
  key: string;
  severity: FlagSeverity;
  message: string;
  why: string;
}

export interface SafePlanAnalysis {
  planId: string;
  childId: string;
  completenessPct: number;
  flags: SafePlanFlag[];
  needsAttention: boolean;
}

const present = (v: unknown): boolean => typeof v === "string" && v.trim().length > 0;

function isPast(dateIso: string | null | undefined, now: string): boolean {
  if (!dateIso) return false;
  const t = Date.parse(dateIso);
  const n = Date.parse(now);
  if (Number.isNaN(t) || Number.isNaN(n)) return false;
  return t < n;
}

function daysSince(dateIso: string | undefined, now: string): number {
  if (!dateIso) return Number.POSITIVE_INFINITY;
  const t = Date.parse(dateIso);
  const n = Date.parse(now);
  if (Number.isNaN(t) || Number.isNaN(n)) return Number.POSITIVE_INFINITY;
  return (n - t) / 86_400_000;
}

const REQUIRED: { get: (p: StayingSafePlan) => string; label: string }[] = [
  { get: (p) => p.when_to_use, label: "When to use the plan" },
  { get: (p) => p.early_warning_signs, label: "Early warning signs" },
  { get: (p) => p.green?.signs ?? "", label: "Green zone" },
  { get: (p) => p.amber?.signs ?? "", label: "Amber zone" },
  { get: (p) => p.red?.signs ?? "", label: "Red zone signs" },
  { get: (p) => p.red?.staff_do ?? "", label: "Red zone — what staff should do" },
  { get: (p) => p.calming_tools, label: "Calming tools" },
  { get: (p) => p.trusted_people, label: "Trusted people" },
  { get: (p) => p.repair_recovery, label: "Repair & recovery" },
  { get: (p) => p.child_contribution, label: "Child's contribution" },
];

export function analyseStayingSafePlan(p: StayingSafePlan, now: string): SafePlanAnalysis {
  const done = REQUIRED.filter((r) => present(r.get(p))).length;
  const completenessPct = Math.round((done / REQUIRED.length) * 100);

  const flags: SafePlanFlag[] = [];

  if (!present(p.red?.staff_do ?? "")) {
    flags.push({
      key: "red-zone-incomplete",
      severity: "high",
      message: "The red zone doesn't say what staff should do.",
      why: "The red zone is the most critical — staff need to know exactly what helps when the child needs urgent help.",
    });
  }
  if (!present(p.trusted_people)) {
    flags.push({
      key: "no-trusted-people",
      severity: "high",
      message: "No trusted people are listed.",
      why: "Knowing who the child turns to is central to keeping them safe and supported.",
    });
  }
  if (!present(p.child_contribution)) {
    flags.push({
      key: "no-child-voice",
      severity: "high",
      message: "The child hasn't contributed to the plan.",
      why: "A Staying Safe Plan should be the child's own — co-produced, not done to them.",
    });
  }
  if (p.review_date && isPast(p.review_date, now)) {
    flags.push({
      key: "review-overdue",
      severity: "high",
      message: "The plan is overdue for review.",
      why: "Safety plans go stale — review keeps them accurate to how the child is now.",
    });
  }
  if (!present(p.early_warning_signs)) {
    flags.push({
      key: "no-early-warning",
      severity: "advisory",
      message: "No early warning signs recorded.",
      why: "Spotting the amber zone early is how staff prevent a crisis.",
    });
  }
  if (!present(p.calming_tools)) {
    flags.push({
      key: "no-calming-tools",
      severity: "advisory",
      message: "No calming tools listed.",
      why: "Capturing what actually helps the child regulate makes the plan usable in the moment.",
    });
  }
  if (!p.manager_approved) {
    flags.push({
      key: "not-approved",
      severity: "advisory",
      message: "The plan hasn't been approved by a manager.",
      why: "Manager approval confirms the plan is safe to rely on.",
    });
  }
  if (!present(p.repair_recovery)) {
    flags.push({
      key: "no-repair",
      severity: "advisory",
      message: "No repair & recovery section.",
      why: "How the child is helped to feel safe again afterwards is part of keeping the relationship strong.",
    });
  }

  const hasHigh = flags.some((f) => f.severity === "high");
  return {
    planId: p.id,
    childId: p.child_id,
    completenessPct,
    flags,
    needsAttention: hasHigh || completenessPct < 60 || !p.manager_approved,
  };
}

// ── Home-wide overview ───────────────────────────────────────────────────────

export interface SafePlanAlert {
  key: string;
  label: string;
  why: string;
  items: string[];
}

export interface SafePlanSummary {
  plan: StayingSafePlan;
  childName: string;
  analysis: SafePlanAnalysis;
}

export interface SafePlanOverview {
  generatedAt: string;
  headline: string;
  homeStatus: "settled" | "monitor" | "action_needed";
  total: number;
  childrenWithoutPlan: { id: string; name: string }[];
  alerts: SafePlanAlert[];
  plans: SafePlanSummary[];
}

export interface SafePlanOverviewInput {
  now: string;
  plans: StayingSafePlan[];
  children: { id: string; name: string }[];
  reflections: PostIncidentReflection[];
  incidents: Incident[];
  recentWindowDays?: number;
}

export function buildStayingSafePlanOverview(input: SafePlanOverviewInput): SafePlanOverview {
  const nameOf = (id: string) => input.children.find((c) => c.id === id)?.name ?? "Child";
  const windowDays = input.recentWindowDays ?? 60;

  const plans: SafePlanSummary[] = input.plans
    .map((plan) => ({ plan, childName: nameOf(plan.child_id), analysis: analyseStayingSafePlan(plan, input.now) }))
    .sort((a, b) => a.childName.localeCompare(b.childName));

  const childIdsWithPlan = new Set(input.plans.map((p) => p.child_id));
  const childrenWithoutPlan = input.children.filter((c) => !childIdsWithPlan.has(c.id));

  // Children whose plan a recent reflection flagged for review.
  const reviewFlaggedChildren = [
    ...new Set(
      input.reflections
        .filter((r) => r.staying_safe_plan_review && daysSince(r.incident_date, input.now) <= windowDays)
        .map((r) => r.child_id),
    ),
  ];

  const mk = (key: string, label: string, why: string, items: string[]): SafePlanAlert | null =>
    items.length ? { key, label, why, items: [...new Set(items)] } : null;

  const alerts = [
    mk(
      "no_plan",
      "Children with no Staying Safe Plan",
      "Every child should have a plan staff can follow when they're struggling.",
      childrenWithoutPlan.map((c) => c.name),
    ),
    mk(
      "review_flagged",
      "Plans flagged for review after an incident",
      "A recent post-incident reflection asked for this child's plan to be revisited.",
      reviewFlaggedChildren.map(nameOf),
    ),
    mk(
      "overdue_review",
      "Plans overdue for review",
      "These plans may no longer match how the child is now.",
      plans.filter((s) => s.analysis.flags.some((f) => f.key === "review-overdue")).map((s) => s.childName),
    ),
    mk(
      "incomplete_red_zone",
      "Plans missing the red-zone response",
      "Staff must know what to do when the child needs urgent help.",
      plans.filter((s) => s.analysis.flags.some((f) => f.key === "red-zone-incomplete")).map((s) => s.childName),
    ),
    mk(
      "missing_child_voice",
      "Plans without the child's contribution",
      "A Staying Safe Plan should be co-produced with the child.",
      plans.filter((s) => s.analysis.flags.some((f) => f.key === "no-child-voice")).map((s) => s.childName),
    ),
    mk(
      "not_approved",
      "Plans awaiting manager approval",
      "Approval confirms the plan is safe to rely on.",
      plans.filter((s) => !s.plan.manager_approved).map((s) => s.childName),
    ),
  ].filter((a): a is SafePlanAlert => a !== null);

  const needingAttention = plans.filter((s) => s.analysis.needsAttention).length;
  const homeStatus: SafePlanOverview["homeStatus"] =
    childrenWithoutPlan.length > 0 || reviewFlaggedChildren.length > 0 || needingAttention >= 2
      ? "action_needed"
      : alerts.length > 0 || needingAttention > 0
        ? "monitor"
        : "settled";

  const headline =
    plans.length === 0 && childrenWithoutPlan.length === 0
      ? "No Staying Safe Plans yet."
      : childrenWithoutPlan.length > 0
        ? `${childrenWithoutPlan.length} ${childrenWithoutPlan.length === 1 ? "child has" : "children have"} no Staying Safe Plan; ${needingAttention} plan${needingAttention === 1 ? "" : "s"} need attention.`
        : `${plans.length} plan${plans.length === 1 ? "" : "s"} in place; ${needingAttention} need attention.`;

  return {
    generatedAt: input.now,
    headline,
    homeStatus,
    total: plans.length,
    childrenWithoutPlan,
    alerts,
    plans,
  };
}
