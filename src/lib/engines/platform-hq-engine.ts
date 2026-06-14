// ══════════════════════════════════════════════════════════════════════════════
// CARA HQ — platform overview engine (pure)
//
// Rolls the HQ collections up into the owner cockpit: customer counts, usage
// activity, AI cost (estimated GBP) and open break-glass grants. Deterministic —
// `now` is injected; no store/clock access here.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  HqAiUsageRow,
  HqApiCallRow,
  HqBreakGlassGrant,
  HqDecisionRow,
  HqOrganisation,
  HqUsageEvent,
} from "@/lib/hq/hq-types";

export interface HqEngineInput {
  organisations: HqOrganisation[];
  usageEvents: HqUsageEvent[];
  aiUsage: HqAiUsageRow[];
  apiCalls: HqApiCallRow[];
  decisions: HqDecisionRow[];
  breakGlass: HqBreakGlassGrant[];
  now: string;
}

export interface HqCustomerSummary {
  total: number;
  active: number;
  suspended: number;
  churned: number;
  by_plan: { plan: string; count: number }[];
}

export interface HqUsageSummary {
  events_24h: number;
  events_7d: number;
  events_30d: number;
  by_kind_30d: { kind: string; count: number }[];
}

export interface HqAiSummary {
  calls_30d: number;
  cost_30d_gbp: number;
  by_feature: { feature: string; cost_gbp: number; calls: number }[];
  by_org: { org_id: string; cost_gbp: number; calls: number }[];
  /** All costs are rough estimates for margin watching — never billing. */
  estimated: boolean;
}

export interface HqApiCallSummary {
  calls_24h: number;
  calls_7d: number;
  calls_30d: number;
  /** Intelligence/decision endpoint calls in the last 30d. */
  intelligence_30d: number;
  by_feature_30d: { feature: string; count: number; intelligence: boolean }[];
}

export interface HqDecisionSummary {
  total_30d: number;
  deterministic_30d: number;
  ai_30d: number;
  /** Share of decisions made with no model call (0–100). */
  deterministic_pct: number;
  by_feature_30d: { feature: string; deterministic: number; ai: number }[];
}

export interface HqBreakGlassSummary {
  open: HqBreakGlassGrant[];
  open_count: number;
  recent: HqBreakGlassGrant[];
}

export interface HqOverview {
  customers: HqCustomerSummary;
  usage: HqUsageSummary;
  ai: HqAiSummary;
  api_calls: HqApiCallSummary;
  decisions: HqDecisionSummary;
  break_glass: HqBreakGlassSummary;
  attention: string[];
}

const DAY = 864e5;

function withinDays(at: string, now: string, days: number): boolean {
  const t = Date.parse(at);
  const n = Date.parse(now);
  return Number.isFinite(t) && Number.isFinite(n) && n - t >= 0 && n - t <= days * DAY;
}

/** A grant is open when not revoked and not yet expired. */
export function isBreakGlassOpen(g: HqBreakGlassGrant, now: string): boolean {
  return g.revoked_at == null && Date.parse(g.expires_at) > Date.parse(now);
}

export function summariseCustomers(orgs: HqOrganisation[]): HqCustomerSummary {
  const byPlan = new Map<string, number>();
  for (const o of orgs) byPlan.set(o.plan, (byPlan.get(o.plan) ?? 0) + 1);
  return {
    total: orgs.length,
    active: orgs.filter((o) => o.status === "active").length,
    suspended: orgs.filter((o) => o.status === "suspended").length,
    churned: orgs.filter((o) => o.status === "churned").length,
    by_plan: [...byPlan.entries()]
      .map(([plan, count]) => ({ plan, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export function summariseUsage(events: HqUsageEvent[], now: string): HqUsageSummary {
  const in30 = events.filter((e) => withinDays(e.at, now, 30));
  const byKind = new Map<string, number>();
  for (const e of in30) byKind.set(e.kind, (byKind.get(e.kind) ?? 0) + 1);
  return {
    events_24h: events.filter((e) => withinDays(e.at, now, 1)).length,
    events_7d: events.filter((e) => withinDays(e.at, now, 7)).length,
    events_30d: in30.length,
    by_kind_30d: [...byKind.entries()]
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
  };
}

export function summariseAiUsage(rows: HqAiUsageRow[], now: string): HqAiSummary {
  const in30 = rows.filter((r) => withinDays(r.at, now, 30));
  const byFeature = new Map<string, { cost: number; calls: number }>();
  const byOrg = new Map<string, { cost: number; calls: number }>();
  let total = 0;
  for (const r of in30) {
    total += r.cost_gbp;
    const f = byFeature.get(r.feature) ?? { cost: 0, calls: 0 };
    f.cost += r.cost_gbp;
    f.calls += 1;
    byFeature.set(r.feature, f);
    if (r.org_id) {
      const o = byOrg.get(r.org_id) ?? { cost: 0, calls: 0 };
      o.cost += r.cost_gbp;
      o.calls += 1;
      byOrg.set(r.org_id, o);
    }
  }
  const round = (n: number) => Math.round(n * 10000) / 10000;
  return {
    calls_30d: in30.length,
    cost_30d_gbp: round(total),
    by_feature: [...byFeature.entries()]
      .map(([feature, v]) => ({ feature, cost_gbp: round(v.cost), calls: v.calls }))
      .sort((a, b) => b.cost_gbp - a.cost_gbp),
    by_org: [...byOrg.entries()]
      .map(([org_id, v]) => ({ org_id, cost_gbp: round(v.cost), calls: v.calls }))
      .sort((a, b) => b.cost_gbp - a.cost_gbp),
    estimated: true,
  };
}

export function summariseApiCalls(rows: HqApiCallRow[], now: string): HqApiCallSummary {
  const in30 = rows.filter((r) => withinDays(r.at, now, 30));
  const byFeature = new Map<string, { count: number; intelligence: boolean }>();
  for (const r of in30) {
    const f = byFeature.get(r.feature) ?? { count: 0, intelligence: r.intelligence };
    f.count += 1;
    f.intelligence = f.intelligence || r.intelligence;
    byFeature.set(r.feature, f);
  }
  return {
    calls_24h: rows.filter((r) => withinDays(r.at, now, 1)).length,
    calls_7d: rows.filter((r) => withinDays(r.at, now, 7)).length,
    calls_30d: in30.length,
    intelligence_30d: in30.filter((r) => r.intelligence).length,
    by_feature_30d: [...byFeature.entries()]
      .map(([feature, v]) => ({ feature, count: v.count, intelligence: v.intelligence }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}

export function summariseDecisions(rows: HqDecisionRow[], now: string): HqDecisionSummary {
  const in30 = rows.filter((r) => withinDays(r.at, now, 30));
  const deterministic = in30.filter((r) => r.mode === "deterministic").length;
  const ai = in30.filter((r) => r.mode === "ai").length;
  const total = in30.length;
  const byFeature = new Map<string, { deterministic: number; ai: number }>();
  for (const r of in30) {
    const f = byFeature.get(r.feature) ?? { deterministic: 0, ai: 0 };
    if (r.mode === "ai") f.ai += 1; else f.deterministic += 1;
    byFeature.set(r.feature, f);
  }
  return {
    total_30d: total,
    deterministic_30d: deterministic,
    ai_30d: ai,
    deterministic_pct: total === 0 ? 100 : Math.round((deterministic / total) * 100),
    by_feature_30d: [...byFeature.entries()]
      .map(([feature, v]) => ({ feature, deterministic: v.deterministic, ai: v.ai }))
      .sort((a, b) => b.deterministic + b.ai - (a.deterministic + a.ai))
      .slice(0, 10),
  };
}

export function summariseBreakGlass(
  grants: HqBreakGlassGrant[],
  now: string,
): HqBreakGlassSummary {
  const open = grants
    .filter((g) => isBreakGlassOpen(g, now))
    .sort((a, b) => b.granted_at.localeCompare(a.granted_at));
  const recent = [...grants]
    .sort((a, b) => b.granted_at.localeCompare(a.granted_at))
    .slice(0, 10);
  return { open, open_count: open.length, recent };
}

export function computeHqOverview(input: HqEngineInput): HqOverview {
  const customers = summariseCustomers(input.organisations);
  const usage = summariseUsage(input.usageEvents, input.now);
  const ai = summariseAiUsage(input.aiUsage, input.now);
  const apiCalls = summariseApiCalls(input.apiCalls, input.now);
  const decisions = summariseDecisions(input.decisions, input.now);
  const breakGlass = summariseBreakGlass(input.breakGlass, input.now);

  const attention: string[] = [];
  if (customers.suspended > 0) {
    attention.push(`${customers.suspended} customer${customers.suspended === 1 ? "" : "s"} suspended — review status`);
  }
  if (breakGlass.open_count > 0) {
    attention.push(`${breakGlass.open_count} open break-glass grant${breakGlass.open_count === 1 ? "" : "s"} — confirm still needed, revoke when done`);
  }
  if (usage.events_24h === 0 && customers.active > 0) {
    attention.push("No recorded activity in the last 24h across active customers");
  }

  return { customers, usage, ai, api_calls: apiCalls, decisions, break_glass: breakGlass, attention };
}
