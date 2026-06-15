// ══════════════════════════════════════════════════════════════════════════════
// CaraIncidentAnalytics — incident pattern analysis computed from live store
//
// Reads all incidents via useIncidents(), computes patterns deterministically
// (time-of-day distribution, incident-type breakdown, per-child clustering,
// PI rate, oversight completion) and derives rule-based Cara insights.
// No AI key required — pure deterministic.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles, Clock, AlertTriangle, TrendingUp,
  TrendingDown, Minus, Users, ChevronDown,
  ChevronUp, Zap, Target,
} from "lucide-react";
import { useIncidents } from "@/hooks/use-incidents";
import { INCIDENT_TYPE_LABELS } from "@/lib/constants";
import type { IncidentType } from "@/lib/constants";
import { getYPName } from "@/lib/seed-data";
import type { Incident } from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

type TrendDir = "increasing" | "stable" | "decreasing";

interface TimeSlot { label: string; count: number; percentage: number }
interface TriggerPattern { trigger: string; count: number; percentage: number; trend: TrendDir }
interface ChildPattern {
  childName: string; count30d: number; count90d: number;
  trend: TrendDir; primaryTrigger: string; peakTime: string;
}
interface IncidentAnalyticsData {
  period: string;
  totalIncidents30d: number; totalIncidents90d: number;
  trend: TrendDir; avgPerWeek: number;
  physicalInterventionRate: number; managementOversightRate: number;
  timeSlots: TimeSlot[]; triggers: TriggerPattern[];
  childPatterns: ChildPattern[]; caraInsights: string[];
}

// ── Config ───────────────────────────────────────────────────────────────────

const TREND_CONFIG: Record<TrendDir, { icon: React.ReactNode; label: string; colour: string }> = {
  increasing: { icon: <TrendingUp className="h-3 w-3" />,   label: "Increasing", colour: "text-red-500" },
  stable:     { icon: <Minus className="h-3 w-3" />,        label: "Stable",     colour: "text-blue-400" },
  decreasing: { icon: <TrendingDown className="h-3 w-3" />, label: "Decreasing", colour: "text-emerald-500" },
};

// ── Pure analytics engine ────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthAbbr(d: Date): string {
  return d.toLocaleString("en-GB", { month: "short" });
}

function computeIncidentAnalytics(incidents: Incident[], today: string): IncidentAnalyticsData {
  const todayMs = Date.parse(today + "T00:00:00Z");
  const d30 = isoDate(new Date(todayMs - 30 * 864e5));
  const d60 = isoDate(new Date(todayMs - 60 * 864e5));
  const d90 = isoDate(new Date(todayMs - 90 * 864e5));

  const in30  = incidents.filter((i) => i.date >= d30);
  const in30b = incidents.filter((i) => i.date >= d60 && i.date < d30); // prev 30d for trend
  const in90  = incidents.filter((i) => i.date >= d90);

  // Trend
  const trend: TrendDir =
    in30.length > in30b.length * 1.1  ? "increasing" :
    in30.length < in30b.length * 0.9  ? "decreasing" : "stable";

  // Rates
  const physCount = in30.filter((i) => i.type === "physical_intervention").length;
  const physRate  = in30.length > 0 ? Math.round((physCount / in30.length) * 100) : 0;
  const oversightDone = in30.filter((i) => Boolean(i.oversight_by)).length;
  const oversightRate = in30.length > 0 ? Math.round((oversightDone / in30.length) * 100) : 100;

  // Time slots
  const slots: TimeSlot[] = [
    { label: "Morning (06–12)",   count: 0, percentage: 0 },
    { label: "Afternoon (12–17)", count: 0, percentage: 0 },
    { label: "Evening (17–22)",   count: 0, percentage: 0 },
    { label: "Night (22–06)",     count: 0, percentage: 0 },
  ];
  in30.forEach((inc) => {
    const h = parseInt((inc.time || "12:00").split(":")[0], 10);
    if (h >= 6  && h < 12) slots[0].count++;
    else if (h >= 12 && h < 17) slots[1].count++;
    else if (h >= 17 && h < 22) slots[2].count++;
    else slots[3].count++;
  });
  const tot = in30.length || 1;
  slots.forEach((s) => { s.percentage = Math.round((s.count / tot) * 100); });

  // Triggers (by incident type, top 5)
  const typeCounts: Record<string, number> = {};
  const typePrev:   Record<string, number> = {};
  in30.forEach((i) => { typeCounts[i.type] = (typeCounts[i.type] ?? 0) + 1; });
  in30b.forEach((i) => { typePrev[i.type]  = (typePrev[i.type]  ?? 0) + 1; });

  const triggers: TriggerPattern[] = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => {
      const prev = typePrev[type] ?? 0;
      const trendT: TrendDir = count > prev * 1.1 ? "increasing" : count < prev * 0.9 ? "decreasing" : "stable";
      return {
        trigger: INCIDENT_TYPE_LABELS[type as IncidentType] ?? type,
        count,
        percentage: Math.round((count / tot) * 100),
        trend: trendT,
      };
    });

  // Per-child patterns
  const child30: Record<string, number> = {};
  const child90: Record<string, number> = {};
  const childTypes: Record<string, Record<string, number>> = {};
  in30.forEach((i) => {
    child30[i.child_id] = (child30[i.child_id] ?? 0) + 1;
    childTypes[i.child_id] ??= {};
    childTypes[i.child_id][i.type] = (childTypes[i.child_id][i.type] ?? 0) + 1;
  });
  in90.forEach((i) => { child90[i.child_id] = (child90[i.child_id] ?? 0) + 1; });

  const peakSlot = slots.reduce((m, s) => (s.count > m.count ? s : m), slots[0]);

  const childPatterns: ChildPattern[] = Object.entries(child30)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([childId, count30d]) => {
      const count90d = child90[childId] ?? 0;
      const prevCount = count90d - count30d;
      const trendC: TrendDir = count30d > prevCount * 1.1 ? "increasing" : count30d < prevCount * 0.9 ? "decreasing" : "stable";
      const typeMap = childTypes[childId] ?? {};
      const primaryType = Object.entries(typeMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "other";
      return {
        childName: getYPName(childId),
        count30d,
        count90d,
        trend: trendC,
        primaryTrigger: INCIDENT_TYPE_LABELS[primaryType as IncidentType] ?? primaryType,
        peakTime: peakSlot.label,
      };
    });

  // Rule-based Cara insights
  const caraInsights: string[] = [];
  if (peakSlot.count > 0) {
    caraInsights.push(`${peakSlot.percentage}% of incidents occur during ${peakSlot.label.toLowerCase()}. Consider additional staffing or structured activities during this window.`);
  }
  if (triggers.length > 0) {
    const top = triggers[0];
    caraInsights.push(
      `${top.trigger} is the leading incident type (${top.percentage}%)${top.trend === "increasing" ? " and is rising" : ""}. ${top.trend === "increasing" ? "Review prevention strategies and individual support plans." : ""}`.trim(),
    );
  }
  if (childPatterns.length > 0 && childPatterns[0].trend === "increasing") {
    const c = childPatterns[0];
    caraInsights.push(`${c.childName} accounts for ${Math.round((c.count30d / tot) * 100)}% of incidents this month with an escalating trend. Behaviour support plan review recommended.`);
  }
  if (physRate > 20) {
    caraInsights.push(`Physical intervention rate (${physRate}%) is elevated. Reg 35 requires minimisation — review de-escalation strategies and debrief culture.`);
  }
  const outstanding = in30.filter((i) => !i.oversight_by && i.requires_oversight).length;
  if (outstanding > 0) {
    caraInsights.push(`${outstanding} incident${outstanding > 1 ? "s" : ""} requiring management oversight ${outstanding > 1 ? "are" : "is"} outstanding. Reg 40 requires timely oversight of all notifiable incidents.`);
  } else if (oversightRate < 90) {
    caraInsights.push(`Management oversight completion at ${oversightRate}%. Ensure all incidents receive timely oversight per Reg 40 requirements.`);
  }

  // Period label
  const fromDate = new Date(todayMs - 30 * 864e5);
  const toDate   = new Date(todayMs);
  const period   = `${fromDate.getDate()} ${monthAbbr(fromDate)} – ${toDate.getDate()} ${monthAbbr(toDate)} ${toDate.getFullYear()}`;

  return {
    period,
    totalIncidents30d: in30.length,
    totalIncidents90d: in90.length,
    trend,
    avgPerWeek: Math.round((in30.length / 4.3) * 10) / 10,
    physicalInterventionRate: physRate,
    managementOversightRate: oversightRate,
    timeSlots: slots,
    triggers,
    childPatterns,
    caraInsights,
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export function CaraIncidentAnalytics() {
  const [showInsights, setShowInsights] = useState(true);
  const [showChildren, setShowChildren] = useState(false);

  const incQuery = useIncidents();
  const allIncidents = incQuery.data?.data ?? [];
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const data   = useMemo(() => computeIncidentAnalytics(allIncidents, today), [allIncidents, today]);

  const tCfg    = TREND_CONFIG[data.trend];
  const peakSlot = data.timeSlots.reduce((m, s) => (s.count > m.count ? s : m), data.timeSlots[0]);

  if (incQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-6 text-sm text-[var(--cs-text-muted)]">
        Loading incident analytics…
      </div>
    );
  }

  if (allIncidents.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-6 text-sm text-[var(--cs-text-muted)]">
        No incidents recorded — nothing to analyse.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[var(--cs-cara-gold-soft)] rounded-lg">
              <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Incident Analytics</h3>
              <p className="text-[10px] text-[var(--cs-text-muted)]">{data.period}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${data.trend === "increasing" ? "bg-red-50 text-red-600 border border-red-200" : data.trend === "decreasing" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-blue-50 text-blue-600 border border-blue-200"}`}>
            {tCfg.icon} {tCfg.label}
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[var(--cs-border)] border-b border-[var(--cs-border)]">
        {[
          { label: "30-Day Total",       value: data.totalIncidents30d,             colour: "text-[var(--cs-navy)]" },
          { label: "Avg / Week",         value: data.avgPerWeek,                    colour: "text-[var(--cs-navy)]" },
          { label: "Physical Int. Rate", value: `${data.physicalInterventionRate}%`, colour: data.physicalInterventionRate > 30 ? "text-red-600" : "text-amber-600" },
          { label: "Oversight Complete", value: `${data.managementOversightRate}%`,  colour: data.managementOversightRate >= 90 ? "text-emerald-600" : "text-amber-600" },
        ].map((m) => (
          <div key={m.label} className="px-3 py-2.5 text-center">
            <div className={`text-lg font-bold tabular-nums ${m.colour}`}>{m.value}</div>
            <div className="text-[10px] text-[var(--cs-text-muted)]">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Time distribution bar */}
      <div className="px-4 py-3 border-b border-[var(--cs-border)]">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          <span className="text-[11px] font-medium text-[var(--cs-navy)]">Time Distribution</span>
          {peakSlot.count > 0 && <span className="text-[10px] text-[var(--cs-text-muted)] ml-auto">Peak: {peakSlot.label}</span>}
        </div>
        {peakSlot.count > 0 ? (
          <>
            <div className="flex h-6 rounded-lg overflow-hidden border border-[var(--cs-border)]">
              {data.timeSlots.map((slot, i) => {
                const colours = ["bg-sky-300", "bg-amber-300", "bg-orange-400", "bg-indigo-300"];
                return (
                  <div
                    key={slot.label}
                    className={`${colours[i]} flex items-center justify-center text-[9px] font-semibold text-white transition-all`}
                    style={{ width: `${slot.percentage || 0}%`, minWidth: slot.count > 0 ? "4px" : "0" }}
                    title={`${slot.label}: ${slot.count} incidents (${slot.percentage}%)`}
                  >
                    {slot.percentage >= 15 ? `${slot.percentage}%` : ""}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[9px] text-[var(--cs-text-muted)]">
              {data.timeSlots.map((slot, i) => {
                const dots = ["bg-sky-300", "bg-amber-300", "bg-orange-400", "bg-indigo-300"];
                return (
                  <span key={slot.label} className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-sm ${dots[i]}`} />
                    {slot.label.split(" ")[0]}
                  </span>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-xs text-[var(--cs-text-muted)]">No incidents with time data in this period.</p>
        )}
      </div>

      {/* Trigger patterns */}
      {data.triggers.length > 0 && (
        <div className="px-4 py-3 border-b border-[var(--cs-border)]">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <span className="text-[11px] font-medium text-[var(--cs-navy)]">Incident Types</span>
          </div>
          <div className="space-y-1.5">
            {data.triggers.map((t) => {
              const trCfg = TREND_CONFIG[t.trend];
              return (
                <div key={t.trigger} className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--cs-text-secondary)] w-[160px] truncate">{t.trigger}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-[var(--cs-navy)] rounded-full transition-all" style={{ width: `${t.percentage}%` }} />
                  </div>
                  <span className="text-[10px] text-[var(--cs-text-muted)] tabular-nums w-8 text-right">{t.count}</span>
                  <span className={trCfg.colour}>{trCfg.icon}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-child patterns (collapsible) */}
      {data.childPatterns.length > 0 && (
        <div className="border-b border-[var(--cs-border)]">
          <button
            className="w-full px-4 py-2.5 flex items-center gap-1.5 text-xs text-[var(--cs-text-secondary)] hover:text-[var(--cs-navy)] transition-colors"
            onClick={() => setShowChildren(!showChildren)}
          >
            <Users className="h-3.5 w-3.5" />
            <span className="font-medium">Per-child breakdown</span>
            <span className="text-[var(--cs-text-muted)]">({data.childPatterns.length})</span>
            {showChildren ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
          </button>

          {showChildren && (
            <div className="px-4 pb-3 space-y-2">
              {data.childPatterns.map((cp) => {
                const cpTrend = TREND_CONFIG[cp.trend];
                return (
                  <div key={cp.childName} className="rounded-lg border border-[var(--cs-border)] p-2.5 bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[var(--cs-navy)]">{cp.childName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--cs-text-muted)] tabular-nums">{cp.count30d} / 30d</span>
                        <span className={`flex items-center gap-0.5 text-[10px] ${cpTrend.colour}`}>
                          {cpTrend.icon} {cpTrend.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--cs-text-muted)]">
                      <span className="flex items-center gap-1"><Zap className="h-2.5 w-2.5" /> {cp.primaryTrigger}</span>
                      <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {cp.peakTime}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Cara insights */}
      {data.caraInsights.length > 0 && (
        <div>
          <button
            className="w-full px-4 py-2.5 flex items-center gap-1.5 text-xs text-[var(--cs-text-secondary)] hover:text-[var(--cs-navy)] transition-colors border-b border-[var(--cs-border)]"
            onClick={() => setShowInsights(!showInsights)}
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--cs-cara-gold)]" />
            <span className="font-medium">Cara Insights</span>
            <span className="text-[var(--cs-text-muted)]">({data.caraInsights.length})</span>
            {showInsights ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
          </button>

          {showInsights && (
            <div className="px-4 py-3 space-y-2">
              {data.caraInsights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] p-2.5">
                  <Target className="h-3 w-3 text-[var(--cs-cara-gold)] mt-0.5 shrink-0" />
                  <p className="text-[11px] text-[var(--cs-text-secondary)]">{insight}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--cs-border)] bg-slate-50/50">
        <p className="text-[10px] text-[var(--cs-text-muted)] text-center">
          Patterns analysed from {data.totalIncidents90d} incidents over 90 days. Reg 40 requires prompt recording and management oversight of all incidents.
        </p>
      </div>
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = { TREND_CONFIG, computeIncidentAnalytics };
