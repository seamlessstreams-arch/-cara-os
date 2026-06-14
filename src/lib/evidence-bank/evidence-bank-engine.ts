// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUTOMATED EVIDENCE BANK ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// "Evidence builds itself." Every event already carries the Ofsted evidence
// categories it contributes to (set by the projector). This engine rolls the
// event stream up by category — coverage, recency, contributing event types and
// gaps — so a manager can see, at a glance, where the home is well-evidenced and
// where it is thin or empty, and generate inspection-ready summaries without
// hand-collating anything.
//
// Regulatory: CHR 2015 Reg 44/45, Reg 13 (leadership). SCCIF: leaders can
// evidence the quality of care across all judgement areas.
// ══════════════════════════════════════════════════════════════════════════════

import type { CornerstoneEvent } from "@/types/cornerstone-event";

// ── The 14 canonical evidence categories ────────────────────────────────────────

export const EVIDENCE_CATEGORIES = [
  "safeguarding",
  "leadership and management",
  "children's progress",
  "help and protection",
  "health",
  "education",
  "positive relationships",
  "workforce development",
  "quality assurance",
  "Regulation 44",
  "Regulation 45",
  "complaints",
  "consultation",
  "risk management",
] as const;
export type EvidenceCategory = (typeof EVIDENCE_CATEGORIES)[number];

// Categories an inspector will expect strong, current evidence for.
const KEY_CATEGORIES = new Set<string>(["safeguarding", "Regulation 45", "help and protection", "children's progress"]);

// ── Input / Output ──────────────────────────────────────────────────────────────

export interface EvidenceBankInput {
  events: CornerstoneEvent[];
  today?: string;
}

export type EvidenceStatus = "well_evidenced" | "thin" | "gap";

export interface TypeCount { type: string; count: number }

export interface EvidenceCategoryCoverage {
  category: string;
  count_90d: number;
  count_30d: number;
  last_evidenced: string | null;     // ISO date of most recent contributing event
  top_event_types: TypeCount[];
  status: EvidenceStatus;
}

export interface EvidenceBankOverview {
  total_categories: number;
  well_evidenced: number;
  thin: number;
  gaps: number;
  total_evidence_events: number;     // events contributing to ≥1 category (90d)
  coverage_rate: number;             // % of categories with any evidence
}

export interface EvidenceBankAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}
export interface CaraEvidenceInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface EvidenceBankResult {
  overview: EvidenceBankOverview;
  categories: EvidenceCategoryCoverage[];
  gaps: string[];
  alerts: EvidenceBankAlert[];
  insights: CaraEvidenceInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(iso: string, today: string): number {
  return Math.floor((new Date(today).getTime() - new Date(iso).getTime()) / 86_400_000);
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeEvidenceBank(input: EvidenceBankInput): EvidenceBankResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);

  const recent = input.events.filter((e) => {
    const d = daysAgo(e.occurredAt, today);
    return d >= 0 && d < 90;
  });

  const total_evidence_events = recent.filter((e) => (e.evidenceCategories?.length ?? 0) > 0).length;

  const categories: EvidenceCategoryCoverage[] = EVIDENCE_CATEGORIES.map((category) => {
    const contributing = recent.filter((e) => (e.evidenceCategories ?? []).includes(category));
    const count_90d = contributing.length;
    const count_30d = contributing.filter((e) => daysAgo(e.occurredAt, today) < 30).length;
    const last_evidenced = contributing
      .map((e) => e.occurredAt)
      .sort((a, b) => b.localeCompare(a))[0]?.slice(0, 10) ?? null;

    const typeCounts = new Map<string, number>();
    for (const e of contributing) typeCounts.set(e.eventType, (typeCounts.get(e.eventType) ?? 0) + 1);
    const top_event_types = [...typeCounts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    let status: EvidenceStatus;
    if (count_90d === 0) status = "gap";
    else if (count_90d < 3 || count_30d === 0) status = "thin";
    else status = "well_evidenced";

    return { category, count_90d, count_30d, last_evidenced, top_event_types, status };
  });

  const gaps = categories.filter((c) => c.status === "gap").map((c) => c.category);
  const well = categories.filter((c) => c.status === "well_evidenced").length;
  const thin = categories.filter((c) => c.status === "thin").length;

  const overview: EvidenceBankOverview = {
    total_categories: EVIDENCE_CATEGORIES.length,
    well_evidenced: well,
    thin,
    gaps: gaps.length,
    total_evidence_events,
    coverage_rate: Math.round(((EVIDENCE_CATEGORIES.length - gaps.length) / EVIDENCE_CATEGORIES.length) * 100),
  };

  return { overview, categories, gaps, alerts: buildAlerts(categories), insights: buildInsights(categories, overview) };
}

// ── Alerts & insights ──────────────────────────────────────────────────────────

function buildAlerts(categories: EvidenceCategoryCoverage[]): EvidenceBankAlert[] {
  const alerts: EvidenceBankAlert[] = [];
  for (const c of categories) {
    if (c.status === "gap" && KEY_CATEGORIES.has(c.category)) {
      alerts.push({ severity: "high", message: `No evidence recorded for "${c.category}" in 90 days — a key inspection area with a gap` });
    }
  }
  for (const c of categories) {
    if (c.status === "gap" && !KEY_CATEGORIES.has(c.category)) {
      alerts.push({ severity: "medium", message: `"${c.category}" has no evidence in 90 days — consider what would naturally evidence it` });
    } else if (c.status === "thin" && KEY_CATEGORIES.has(c.category)) {
      alerts.push({ severity: "medium", message: `"${c.category}" evidence is thin (${c.count_90d} in 90d, ${c.count_30d} recent) — strengthen before inspection` });
    }
  }
  return alerts;
}

function buildInsights(categories: EvidenceCategoryCoverage[], overview: EvidenceBankOverview): CaraEvidenceInsight[] {
  const insights: CaraEvidenceInsight[] = [];

  if (overview.gaps > 0) {
    const gapNames = categories.filter((c) => c.status === "gap").map((c) => c.category).slice(0, 4).join(", ");
    insights.push({
      severity: overview.gaps >= 4 ? "critical" : "warning",
      text: `${overview.gaps} of ${overview.total_categories} evidence categories have no events in the last 90 days (${gapNames}). The evidence bank builds itself from day-to-day recording — these gaps usually mean the activity is happening but not being captured as structured events. Close them by recording the relevant work, not by manufacturing evidence.`,
    });
  }

  const reg45 = categories.find((c) => c.category === "Regulation 45");
  if (reg45 && reg45.status === "well_evidenced") {
    insights.push({
      severity: "positive",
      text: `Regulation 45 is well-evidenced (${reg45.count_90d} contributing events in 90 days) — the quality-of-care review pack is assembling itself from incidents, safeguarding, medication, QA and Reg 44 events as they happen.`,
    });
  }

  if (overview.coverage_rate >= 80 && overview.gaps === 0) {
    insights.push({
      severity: "positive",
      text: `Every evidence category has current evidence (${overview.coverage_rate}% coverage, ${overview.well_evidenced} well-evidenced). The home is inspection-ready on breadth — focus now on the depth and quality of what's captured.`,
    });
  }

  return insights;
}
