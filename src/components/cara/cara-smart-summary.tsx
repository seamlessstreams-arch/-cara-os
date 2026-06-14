"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraSmartSummary
//
// Generates an AI-powered summary of a child's recent records across modules.
// Shows a compact card with key highlights, recent trends, and areas needing
// attention. Useful on child profile pages and in supervision preparation.
//
// Usage:
//   <CaraSmartSummary childId="demo-child-1" days={14} />
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Brain,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type Trend = "improving" | "stable" | "declining" | "new_concern";

interface SummarySection {
  id: string;
  label: string;
  content: string;
  trend: Trend;
  recordCount: number;
}

interface SmartSummary {
  childId: string;
  childName: string;
  periodDays: number;
  generatedAt: string;
  overallTrend: Trend;
  headline: string;
  sections: SummarySection[];
  areasOfConcern: string[];
  positiveHighlights: string[];
}

// ── Config ─────────────────────────────────────────────────────────────────

const TREND_CONFIG: Record<Trend, { label: string; icon: React.ElementType; colour: string; bg: string }> = {
  improving:   { label: "Improving",    icon: TrendingUp,   colour: "text-emerald-700", bg: "bg-emerald-50" },
  stable:      { label: "Stable",       icon: Minus,        colour: "text-blue-700",    bg: "bg-blue-50" },
  declining:   { label: "Declining",    icon: TrendingDown, colour: "text-red-700",     bg: "bg-red-50" },
  new_concern: { label: "New concern",  icon: AlertTriangle, colour: "text-amber-700",  bg: "bg-amber-50" },
};

// ── Demo data ──────────────────────────────────────────────────────────────

function getDemoSummary(childId: string, days: number): SmartSummary {
  return {
    childId,
    childName: childId === "demo-child-1" ? "Jayden Mitchell" : childId === "demo-child-2" ? "Amara Osei" : "Reuben Walsh",
    periodDays: days,
    generatedAt: new Date().toISOString(),
    overallTrend: "stable",
    headline: "Overall stable presentation with positive engagement in education. One incident of verbal conflict with a peer, managed well by staff. Key work session recorded with good child voice captured.",
    sections: [
      {
        id: "behaviour",
        label: "Behaviour & Incidents",
        content: "One incident recorded this period — a verbal disagreement with a peer during communal time. Staff used verbal de-escalation successfully. No physical intervention required. The child reflected positively in the key work session that followed.",
        trend: "stable",
        recordCount: 3,
      },
      {
        id: "education",
        label: "Education & Activities",
        content: "Daily log entries show consistent school attendance (4/5 days this week). Engaged well in English and Art. Homework completion has improved compared to the previous fortnight.",
        trend: "improving",
        recordCount: 8,
      },
      {
        id: "health",
        label: "Health & Wellbeing",
        content: "Sleep patterns remain consistent. No medication changes. Staff have noted improved appetite over the past week. The child reported feeling settled during the last key work session.",
        trend: "improving",
        recordCount: 4,
      },
      {
        id: "relationships",
        label: "Relationships & Contact",
        content: "Weekly phone contact with mother — reported as positive by the child. One visit from social worker. Peer relationships are mixed but the verbal disagreement was an isolated event.",
        trend: "stable",
        recordCount: 3,
      },
      {
        id: "plans",
        label: "Plans & Reviews",
        content: "Care plan review due in 3 weeks. Risk assessment is current. No outstanding statutory requirements.",
        trend: "stable",
        recordCount: 1,
      },
    ],
    areasOfConcern: [
      "One incident this period — ensure follow-up key work is completed",
      "School attendance dipped on Monday — check for pattern",
    ],
    positiveHighlights: [
      "Homework completion improved compared to previous fortnight",
      "Child reported feeling settled during key work",
      "Positive phone contact with mother",
    ],
  };
}

// ── Component ──────────────────────────────────────────────────────────────

interface CaraSmartSummaryProps {
  childId: string;
  days?: number;
  className?: string;
}

export function CaraSmartSummary({
  childId,
  days = 14,
  className,
}: CaraSmartSummaryProps) {
  const [summary, setSummary] = useState<SmartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSummary(getDemoSummary(childId, days));
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [childId, days]);

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => {
      setSummary(getDemoSummary(childId, days));
      setRefreshing(false);
    }, 800);
  }

  if (loading || !summary) {
    return (
      <div className={cn("rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] p-5", className)}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-[var(--cs-cara-gold)] animate-spin" />
          <span className="text-xs text-[var(--cs-text-muted)]">Generating summary…</span>
        </div>
      </div>
    );
  }

  const overallTrend = TREND_CONFIG[summary.overallTrend];
  const OverallIcon = overallTrend.icon;

  return (
    <div className={cn("rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-white overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-[var(--cs-cara-gold-bg)] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
          <h3 className="text-xs font-bold text-[var(--cs-navy)]">
            Cara Summary — {summary.childName}
          </h3>
          <span className="text-[9px] text-[var(--cs-text-muted)]">
            Last {summary.periodDays} days
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold", overallTrend.bg, overallTrend.colour)}>
            <OverallIcon className="h-2.5 w-2.5" />
            {overallTrend.label}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-[var(--cs-text-muted)] hover:text-[var(--cs-cara-gold)] transition-colors"
          >
            <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Headline */}
      <div className="px-5 py-3 border-b border-[var(--cs-border-subtle)]">
        <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
          {summary.headline}
        </p>
      </div>

      {/* Highlights & concerns */}
      <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {summary.positiveHighlights.length > 0 && (
          <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 px-3 py-2.5">
            <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Positive Highlights
            </p>
            <ul className="space-y-1">
              {summary.positiveHighlights.map((h, i) => (
                <li key={i} className="text-[10px] text-emerald-800 leading-relaxed">· {h}</li>
              ))}
            </ul>
          </div>
        )}
        {summary.areasOfConcern.length > 0 && (
          <div className="rounded-xl bg-amber-50/50 border border-amber-100 px-3 py-2.5">
            <p className="text-[9px] font-semibold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Areas of Attention
            </p>
            <ul className="space-y-1">
              {summary.areasOfConcern.map((c, i) => (
                <li key={i} className="text-[10px] text-amber-800 leading-relaxed">· {c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Expandable sections */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 px-5 py-2 border-t border-[var(--cs-border-subtle)] text-[10px] text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp className="h-3 w-3" /> Hide detail
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" /> Show {summary.sections.length} sections
          </>
        )}
      </button>

      {expanded && (
        <div className="divide-y divide-[var(--cs-border-subtle)]">
          {summary.sections.map((section) => {
            const trend = TREND_CONFIG[section.trend];
            const TrendIcon = trend.icon;
            return (
              <div key={section.id} className="px-5 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[var(--cs-navy)]">
                      {section.label}
                    </span>
                    <span className="text-[9px] text-[var(--cs-text-muted)]">
                      {section.recordCount} records
                    </span>
                  </div>
                  <div className={cn("inline-flex items-center gap-1 text-[9px] font-medium", trend.colour)}>
                    <TrendIcon className="h-2.5 w-2.5" />
                    {trend.label}
                  </div>
                </div>
                <p className="text-[10px] text-[var(--cs-text-secondary)] leading-relaxed">
                  {section.content}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Cara disclaimer */}
      <div className="px-5 py-2 bg-slate-50 text-[9px] text-[var(--cs-text-muted)]">
        <Sparkles className="h-2.5 w-2.5 inline mr-1 text-[var(--cs-cara-gold)]" />
        Cara-generated summary. Draft only — verify all facts before use in statutory records.
      </div>
    </div>
  );
}

// Expose for testing
export const _testing = { TREND_CONFIG, getDemoSummary };
