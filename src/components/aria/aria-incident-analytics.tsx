// ══════════════════════════════════════════════════════════════════════════════
// AriaIncidentAnalytics — AI-powered incident pattern analysis
//
// Analyses incident data to identify patterns: time-of-day clustering,
// common triggers, escalation trends, young person correlation, and
// staff-on-shift patterns. Provides ARIA-generated insights for prevention.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import React, { useState } from "react";
import {
  Sparkles, BarChart3, Clock, AlertTriangle, TrendingUp,
  TrendingDown, Minus, Users, Shield, ChevronDown,
  ChevronUp, Zap, Calendar, Target,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type TrendDir = "increasing" | "stable" | "decreasing";

interface TimeSlot {
  label: string;
  count: number;
  percentage: number;
}

interface TriggerPattern {
  trigger: string;
  count: number;
  percentage: number;
  trend: TrendDir;
}

interface ChildPattern {
  childName: string;
  count30d: number;
  count90d: number;
  trend: TrendDir;
  primaryTrigger: string;
  peakTime: string;
}

interface IncidentAnalyticsData {
  period: string;
  totalIncidents30d: number;
  totalIncidents90d: number;
  trend: TrendDir;
  avgPerWeek: number;
  physicalInterventionRate: number;
  managementOversightRate: number;
  timeSlots: TimeSlot[];
  triggers: TriggerPattern[];
  childPatterns: ChildPattern[];
  ariaInsights: string[];
}

// ── Config ───────────────────────────────────────────────────────────────────

const TREND_CONFIG: Record<TrendDir, { icon: React.ReactNode; label: string; colour: string }> = {
  increasing: { icon: <TrendingUp className="h-3 w-3" />,   label: "Increasing", colour: "text-red-500" },
  stable:     { icon: <Minus className="h-3 w-3" />,        label: "Stable",     colour: "text-blue-400" },
  decreasing: { icon: <TrendingDown className="h-3 w-3" />, label: "Decreasing", colour: "text-emerald-500" },
};

// ── Demo data ────────────────────────────────────────────────────────────────

function getDemoIncidentAnalytics(): IncidentAnalyticsData {
  return {
    period: "12 Apr – 12 May 2026",
    totalIncidents30d: 14,
    totalIncidents90d: 38,
    trend: "increasing",
    avgPerWeek: 3.5,
    physicalInterventionRate: 21,
    managementOversightRate: 79,
    timeSlots: [
      { label: "Morning (06–12)",    count: 2,  percentage: 14 },
      { label: "Afternoon (12–17)",  count: 3,  percentage: 21 },
      { label: "Evening (17–22)",    count: 7,  percentage: 50 },
      { label: "Night (22–06)",      count: 2,  percentage: 14 },
    ],
    triggers: [
      { trigger: "Peer conflict",            count: 5,  percentage: 36, trend: "increasing" },
      { trigger: "Refusal / non-compliance", count: 3,  percentage: 21, trend: "stable" },
      { trigger: "Contact with family",      count: 2,  percentage: 14, trend: "stable" },
      { trigger: "Environmental",            count: 2,  percentage: 14, trend: "decreasing" },
      { trigger: "Unknown / unclear",        count: 2,  percentage: 14, trend: "stable" },
    ],
    childPatterns: [
      {
        childName: "Alex W",
        count30d: 6,
        count90d: 12,
        trend: "increasing",
        primaryTrigger: "Peer conflict",
        peakTime: "Evening (17–22)",
      },
      {
        childName: "Riley P",
        count30d: 4,
        count90d: 14,
        trend: "decreasing",
        primaryTrigger: "Refusal / non-compliance",
        peakTime: "Afternoon (12–17)",
      },
      {
        childName: "Casey T",
        count30d: 2,
        count90d: 8,
        trend: "decreasing",
        primaryTrigger: "Contact with family",
        peakTime: "Evening (17–22)",
      },
      {
        childName: "Jordan M",
        count30d: 2,
        count90d: 4,
        trend: "stable",
        primaryTrigger: "Environmental",
        peakTime: "Morning (06–12)",
      },
    ],
    ariaInsights: [
      "50% of incidents occur during the evening (17:00–22:00). Consider additional staffing or structured activities during this window.",
      "Peer conflict is the leading trigger (36%) and rising. Review seating and activity arrangements to reduce friction points.",
      "Alex W accounts for 43% of incidents this month with an escalating trend. Behaviour support plan review recommended.",
      "Physical intervention rate (21%) is within expected range but should be monitored. Reg 35 requires minimisation.",
      "Management oversight at 79% — 3 incidents awaiting review. Reg 40 requires timely oversight of all incidents.",
    ],
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export function AriaIncidentAnalytics() {
  const [showInsights, setShowInsights] = useState(true);
  const [showChildren, setShowChildren] = useState(false);
  const data = getDemoIncidentAnalytics();
  const tCfg = TREND_CONFIG[data.trend];

  // Find peak time slot
  const peakSlot = data.timeSlots.reduce((max, s) => (s.count > max.count ? s : max), data.timeSlots[0]);

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-[var(--cs-aria-gold-bg)] to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[var(--cs-aria-gold-soft)] rounded-lg">
              <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" />
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
          { label: "30-Day Total",        value: data.totalIncidents30d, colour: "text-[var(--cs-navy)]" },
          { label: "Avg / Week",          value: data.avgPerWeek,        colour: "text-[var(--cs-navy)]" },
          { label: "Physical Int. Rate",  value: `${data.physicalInterventionRate}%`, colour: data.physicalInterventionRate > 30 ? "text-red-600" : "text-amber-600" },
          { label: "Oversight Complete",  value: `${data.managementOversightRate}%`,  colour: data.managementOversightRate >= 90 ? "text-emerald-600" : "text-amber-600" },
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
          <span className="text-[10px] text-[var(--cs-text-muted)] ml-auto">Peak: {peakSlot.label}</span>
        </div>
        <div className="flex h-6 rounded-lg overflow-hidden border border-[var(--cs-border)]">
          {data.timeSlots.map((slot, i) => {
            const colours = ["bg-sky-300", "bg-amber-300", "bg-orange-400", "bg-indigo-300"];
            return (
              <div
                key={slot.label}
                className={`${colours[i]} flex items-center justify-center text-[9px] font-semibold text-white transition-all`}
                style={{ width: `${slot.percentage}%` }}
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
      </div>

      {/* Trigger patterns */}
      <div className="px-4 py-3 border-b border-[var(--cs-border)]">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          <span className="text-[11px] font-medium text-[var(--cs-navy)]">Common Triggers</span>
        </div>
        <div className="space-y-1.5">
          {data.triggers.map((t) => {
            const trCfg = TREND_CONFIG[t.trend];
            return (
              <div key={t.trigger} className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--cs-text-secondary)] w-[160px] truncate">{t.trigger}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-[var(--cs-navy)] rounded-full transition-all"
                    style={{ width: `${t.percentage}%` }}
                  />
                </div>
                <span className="text-[10px] text-[var(--cs-text-muted)] tabular-nums w-8 text-right">{t.count}</span>
                <span className={`${trCfg.colour}`}>{trCfg.icon}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-child patterns (collapsible) */}
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
          <div className="px-4 pb-3 space-y-2 animate-fade-in">
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
                    <span className="flex items-center gap-1">
                      <Zap className="h-2.5 w-2.5" /> {cp.primaryTrigger}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> {cp.peakTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ARIA insights */}
      <div>
        <button
          className="w-full px-4 py-2.5 flex items-center gap-1.5 text-xs text-[var(--cs-text-secondary)] hover:text-[var(--cs-navy)] transition-colors border-b border-[var(--cs-border)]"
          onClick={() => setShowInsights(!showInsights)}
        >
          <Sparkles className="h-3.5 w-3.5 text-[var(--cs-aria-gold)]" />
          <span className="font-medium">ARIA Insights</span>
          <span className="text-[var(--cs-text-muted)]">({data.ariaInsights.length})</span>
          {showInsights ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
        </button>

        {showInsights && (
          <div className="px-4 py-3 space-y-2 animate-fade-in">
            {data.ariaInsights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl bg-[var(--cs-aria-gold-bg)] border border-[var(--cs-aria-gold-soft)] p-2.5">
                <Target className="h-3 w-3 text-[var(--cs-aria-gold)] mt-0.5 shrink-0" />
                <p className="text-[11px] text-[var(--cs-text-secondary)]">{insight}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--cs-border)] bg-slate-50/50">
        <p className="text-[10px] text-[var(--cs-text-muted)] text-center">
          Patterns analysed from incident records. Reg 40 requires prompt recording and management oversight of all incidents.
        </p>
      </div>
    </div>
  );
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = { TREND_CONFIG, getDemoIncidentAnalytics };
