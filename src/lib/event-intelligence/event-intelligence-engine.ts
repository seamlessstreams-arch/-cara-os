// ══════════════════════════════════════════════════════════════════════════════
// CARA — EVENT INTELLIGENCE ENGINE (stream-native analytics)
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// Consumes the canonical CornerstoneEvent stream (not the raw store) and turns it
// into intelligence — the "capture once, surface everywhere" payoff applied to
// the analytics layer, not just the timeline. Because it reads the normalised
// stream, it reasons across EVERY event type at once (incidents, missing,
// medication, restraint, maintenance, QA, Reg 44, staff absence, …) — surfacing:
//   • a per-child cross-domain risk radar (weighted by event risk + escalation)
//   • the approval backlog (who needs to sign off what, by level)
//   • the compliance register (every open Cara compliance flag, aggregated)
//   • the most active risk themes
//
// This complements the deep per-domain engines: those go deep on one domain with
// rich fields; this goes broad across all domains from the shared stream.
//
// Regulatory: supports leadership oversight (Reg 13), notification awareness
// (Reg 40) and a single accurate operating picture (SCCIF — leadership & mgmt).
// ══════════════════════════════════════════════════════════════════════════════

import type { CornerstoneEvent, CornerstoneRiskLevel, CornerstoneApprovalLevel } from "@/types/cornerstone-event";

// ── Input ─────────────────────────────────────────────────────────────────────

export interface EventIntelligenceInput {
  events: CornerstoneEvent[];
  children?: { id: string; name: string }[];
  today?: string; // ISO date — injectable for deterministic tests
}

// ── Output ────────────────────────────────────────────────────────────────────

export type RadarTrend = "escalating" | "stable" | "improving";

export interface TypeCount { type: string; count: number }
export interface FlagCount { flag: string; count: number }
export interface ThemeCount { theme: string; count: number }

export interface ChildEventRisk {
  child_id: string;
  child_name: string;
  events_90d: number;
  weighted_recent: number;     // risk-weighted load, last 30d
  weighted_prior: number;      // risk-weighted load, prior 30-60d
  trend: RadarTrend;
  risk_score: number;          // 0-100
  top_event_types: TypeCount[];
  open_compliance_flags: number;
  pending_approvals: number;
  critical_events: number;
}

export interface ApprovalBacklogItem {
  approvalLevel: CornerstoneApprovalLevel;
  count: number;
  examples: string[];
}

export interface EventIntelligenceOverview {
  total_events: number;
  by_risk: Record<CornerstoneRiskLevel, number>;
  by_type: TypeCount[];
  pending_approvals: number;
  open_compliance_flags: number;
  escalating_children: number;
  most_at_risk_child: string | null;
}

export interface EventIntelligenceAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  child_id?: string;
}

export interface CaraEventInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface EventIntelligenceResult {
  overview: EventIntelligenceOverview;
  child_radar: ChildEventRisk[];
  approval_backlog: ApprovalBacklogItem[];
  compliance_register: FlagCount[];
  theme_trends: ThemeCount[];
  alerts: EventIntelligenceAlert[];
  insights: CaraEventInsight[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const RISK_WEIGHT: Record<CornerstoneRiskLevel, number> = { low: 1, medium: 3, high: 7, critical: 12 };
export const RECENT_DAYS = 30;
export const PRIOR_DAYS = 60;
export const ANALYSIS_DAYS = 90;
const APPROVAL_ORDER: CornerstoneApprovalLevel[] = ["ri", "manager", "deputy", "team_leader"];

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysAgo(iso: string, today: string): number {
  return Math.floor((new Date(today).getTime() - new Date(iso).getTime()) / 86_400_000);
}
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
function trendOf(recent: number, prior: number): RadarTrend {
  if (recent > prior * 1.2 && recent - prior >= 3) return "escalating";
  if (recent < prior * 0.8 && prior - recent >= 3) return "improving";
  return "stable";
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeEventIntelligence(input: EventIntelligenceInput): EventIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const nameById = new Map((input.children ?? []).map((c) => [c.id, c.name]));

  const inWindow = (e: CornerstoneEvent, min: number, max: number) => {
    const d = daysAgo(e.occurredAt, today);
    return d >= min && d < max;
  };

  const analysis = input.events.filter((e) => {
    const d = daysAgo(e.occurredAt, today);
    return d >= 0 && d < ANALYSIS_DAYS;
  });

  // ── Overview ───────────────────────────────────────────────────────────
  const by_risk: Record<CornerstoneRiskLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  const typeCounts = new Map<string, number>();
  let pending_approvals = 0;
  let open_compliance_flags = 0;
  for (const e of analysis) {
    by_risk[e.riskLevel] += 1;
    typeCounts.set(e.eventType, (typeCounts.get(e.eventType) ?? 0) + 1);
    if (e.requiresApproval) pending_approvals += 1;
    open_compliance_flags += e.caraAnalysis?.complianceFlags.length ?? 0;
  }
  const by_type: TypeCount[] = [...typeCounts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);

  // ── Per-child radar ────────────────────────────────────────────────────
  const childIds = new Set<string>();
  for (const e of analysis) if (e.childId) childIds.add(e.childId);

  const child_radar: ChildEventRisk[] = [];
  for (const childId of childIds) {
    const evs = analysis.filter((e) => e.childId === childId);
    const recent = evs.filter((e) => inWindow(e, 0, RECENT_DAYS));
    const prior = evs.filter((e) => inWindow(e, RECENT_DAYS, PRIOR_DAYS));
    const weighted_recent = recent.reduce((s, e) => s + RISK_WEIGHT[e.riskLevel], 0);
    const weighted_prior = prior.reduce((s, e) => s + RISK_WEIGHT[e.riskLevel], 0);
    const trend = trendOf(weighted_recent, weighted_prior);

    const tc = new Map<string, number>();
    for (const e of evs) tc.set(e.eventType, (tc.get(e.eventType) ?? 0) + 1);
    const top_event_types = [...tc.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 4);

    const open_flags = evs.reduce((s, e) => s + (e.caraAnalysis?.complianceFlags.length ?? 0), 0);
    const pending = evs.filter((e) => e.requiresApproval).length;
    const critical_events = evs.filter((e) => e.riskLevel === "critical").length;

    const risk_score = Math.round(clamp(
      Math.min(weighted_recent * 5, 70) +
      (trend === "escalating" ? 12 : 0) +
      Math.min(open_flags * 4, 12) +
      Math.min(critical_events * 6, 12),
      0, 100,
    ));

    child_radar.push({
      child_id: childId, child_name: nameById.get(childId) ?? childId,
      events_90d: evs.length, weighted_recent, weighted_prior, trend, risk_score,
      top_event_types, open_compliance_flags: open_flags, pending_approvals: pending, critical_events,
    });
  }
  child_radar.sort((a, b) => b.risk_score - a.risk_score);

  // ── Approval backlog (by level) ────────────────────────────────────────
  const backlog = new Map<CornerstoneApprovalLevel, { count: number; examples: string[] }>();
  for (const e of analysis) {
    if (!e.requiresApproval || !e.approvalLevel) continue;
    const cur = backlog.get(e.approvalLevel) ?? { count: 0, examples: [] };
    cur.count += 1;
    if (cur.examples.length < 3) cur.examples.push(e.summary.slice(0, 80));
    backlog.set(e.approvalLevel, cur);
  }
  const approval_backlog: ApprovalBacklogItem[] = APPROVAL_ORDER
    .filter((lvl) => backlog.has(lvl))
    .map((lvl) => ({ approvalLevel: lvl, count: backlog.get(lvl)!.count, examples: backlog.get(lvl)!.examples }));

  // ── Compliance register (aggregated open flags) ────────────────────────
  const flagCounts = new Map<string, number>();
  for (const e of analysis) {
    for (const f of e.caraAnalysis?.complianceFlags ?? []) {
      flagCounts.set(f, (flagCounts.get(f) ?? 0) + 1);
    }
  }
  const compliance_register: FlagCount[] = [...flagCounts.entries()].map(([flag, count]) => ({ flag, count })).sort((a, b) => b.count - a.count);

  // ── Theme trends ───────────────────────────────────────────────────────
  const themeCounts = new Map<string, number>();
  for (const e of analysis) {
    for (const t of e.caraAnalysis?.themes ?? []) themeCounts.set(t, (themeCounts.get(t) ?? 0) + 1);
  }
  const theme_trends: ThemeCount[] = [...themeCounts.entries()].map(([theme, count]) => ({ theme, count })).sort((a, b) => b.count - a.count).slice(0, 6);

  const mostAtRisk = child_radar.find((c) => c.risk_score > 0) ?? null;

  const overview: EventIntelligenceOverview = {
    total_events: analysis.length,
    by_risk,
    by_type,
    pending_approvals,
    open_compliance_flags,
    escalating_children: child_radar.filter((c) => c.trend === "escalating").length,
    most_at_risk_child: mostAtRisk ? mostAtRisk.child_name : null,
  };

  const alerts = buildAlerts(child_radar, approval_backlog, compliance_register, by_risk);
  const insights = buildInsights(child_radar, approval_backlog, compliance_register, theme_trends, overview);

  return { overview, child_radar, approval_backlog, compliance_register, theme_trends, alerts, insights };
}

// ── Alerts ──────────────────────────────────────────────────────────────────

function buildAlerts(
  radar: ChildEventRisk[],
  backlog: ApprovalBacklogItem[],
  register: FlagCount[],
  byRisk: Record<CornerstoneRiskLevel, number>,
): EventIntelligenceAlert[] {
  const alerts: EventIntelligenceAlert[] = [];

  for (const c of radar) {
    if (c.risk_score >= 70 || (c.critical_events > 0 && c.trend === "escalating")) {
      alerts.push({ severity: "critical", child_id: c.child_id, message: `${c.child_name} is the focus across the event stream (risk ${c.risk_score}/100${c.trend === "escalating" ? ", escalating" : ""}) — ${c.events_90d} events, ${c.critical_events} critical` });
    } else if (c.trend === "escalating" && c.risk_score >= 40) {
      alerts.push({ severity: "high", child_id: c.child_id, message: `${c.child_name}'s event activity is escalating (risk ${c.risk_score}/100) across ${c.top_event_types.length} domains` });
    }
  }

  const ri = backlog.find((b) => b.approvalLevel === "ri");
  const manager = backlog.find((b) => b.approvalLevel === "manager");
  if (ri) alerts.push({ severity: "high", message: `${ri.count} event${ri.count === 1 ? "" : "s"} await RI sign-off` });
  if (manager && manager.count >= 3) alerts.push({ severity: "medium", message: `${manager.count} events await manager sign-off — clear the approval backlog` });

  if (register[0] && register[0].count >= 2) {
    alerts.push({ severity: "medium", message: `Most common open compliance flag: "${register[0].flag}" (${register[0].count})` });
  }

  void byRisk;
  return alerts;
}

// ── Insights ──────────────────────────────────────────────────────────────────

function buildInsights(
  radar: ChildEventRisk[],
  backlog: ApprovalBacklogItem[],
  register: FlagCount[],
  themes: ThemeCount[],
  overview: EventIntelligenceOverview,
): CaraEventInsight[] {
  const insights: CaraEventInsight[] = [];

  const escalating = radar.filter((c) => c.trend === "escalating");
  if (escalating.length > 0) {
    const names = escalating.slice(0, 3).map((c) => c.child_name).join(", ");
    insights.push({
      severity: "critical",
      text: `${escalating.length} child${escalating.length === 1 ? "'s" : "ren's"} activity is escalating across the whole event stream (${names}). Because this reads every record type at once — incidents, missing, medication, behaviour-in-logs and more — it catches build-ups that any single domain view would miss. Review these children as a priority.`,
    });
  }

  if (overview.open_compliance_flags > 0) {
    const top = register.slice(0, 2).map((f) => `${f.flag} (${f.count})`).join("; ");
    insights.push({
      severity: "warning",
      text: `${overview.open_compliance_flags} open compliance flag${overview.open_compliance_flags === 1 ? "" : "s"} across the home, led by: ${top}. The unified stream turns scattered records into one actionable compliance register — work it down to stay inspection-ready.`,
    });
  }

  const totalBacklog = backlog.reduce((s, b) => s + b.count, 0);
  if (totalBacklog > 0) {
    insights.push({
      severity: "warning",
      text: `${totalBacklog} event${totalBacklog === 1 ? "" : "s"} are waiting for sign-off (${backlog.map((b) => `${b.count} ${b.approvalLevel.replace("_", " ")}`).join(", ")}). Timely approval is part of good oversight (Reg 13) — and an unapproved high-risk event is an audit risk.`,
    });
  }

  if (themes[0]) {
    insights.push({
      severity: "positive",
      text: `The home's most active theme this period is "${themes[0].theme}" (${themes[0].count} events). Use the theme view to target supervision, training and reflective practice where the activity actually is.`,
    });
  }

  return insights;
}
