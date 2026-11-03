"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraInsightCard
//
// Displays proactive Cara insights — patterns detected, risk summaries,
// compliance gaps, or positive trends. Each insight has a type, severity,
// confidence level, and an actionable recommendation.
//
// NB: this component previously loaded a hardcoded set of demo insights
// (fictional children and events) into state unconditionally — which on the live
// tenant surfaced children who are not resident in the home.
// Fabricated records must never appear on a live care-record system, so the demo
// data has been removed. Until a real insights feed is wired in, the widget
// renders an honest empty state rather than inventing insights. When a real
// source is connected, the list below renders it (capped by `limit`).
//
// Usage:
//   <CaraInsightCard homeId="demo-home" limit={4} />
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Shield,
  CheckCircle2,
  ChevronRight,
  Users,
  Activity,
  Brain,
  Eye,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type InsightType =
  | "behaviour_pattern"
  | "risk_escalation"
  | "compliance_gap"
  | "positive_trend"
  | "staffing_concern"
  | "oversight_gap"
  | "evidence_gap"
  | "wellbeing_alert";

type InsightSeverity = "critical" | "high" | "medium" | "low" | "positive";

interface Insight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  summary: string;
  recommendation: string;
  confidence: number;
  relatedChildId?: string;
  relatedChildName?: string;
  relatedModule: string;
  detectedAt: string;
  actionUrl?: string;
}

// ── Config ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<InsightType, { label: string; icon: React.ElementType }> = {
  behaviour_pattern:   { label: "Behaviour pattern",   icon: Brain },
  risk_escalation:     { label: "Risk escalation",     icon: TrendingUp },
  compliance_gap:      { label: "Compliance gap",      icon: Shield },
  positive_trend:      { label: "Positive trend",      icon: CheckCircle2 },
  staffing_concern:    { label: "Staffing concern",    icon: Users },
  oversight_gap:       { label: "Oversight gap",       icon: Eye },
  evidence_gap:        { label: "Evidence gap",        icon: AlertTriangle },
  wellbeing_alert:     { label: "Wellbeing alert",     icon: Activity },
};

const SEVERITY_CONFIG: Record<InsightSeverity, { colour: string; bg: string; border: string; dot: string }> = {
  critical: { colour: "text-red-700",     bg: "bg-red-50",     border: "border-l-red-500",     dot: "bg-red-500" },
  high:     { colour: "text-orange-700",  bg: "bg-orange-50",  border: "border-l-orange-500",  dot: "bg-orange-500" },
  medium:   { colour: "text-amber-700",   bg: "bg-amber-50",   border: "border-l-amber-400",   dot: "bg-amber-400" },
  low:      { colour: "text-slate-600",   bg: "bg-slate-50",   border: "border-l-slate-300",   dot: "bg-slate-400" },
  positive: { colour: "text-emerald-700", bg: "bg-emerald-50", border: "border-l-emerald-500", dot: "bg-emerald-500" },
};

// ── Component ──────────────────────────────────────────────────────────────

interface CaraInsightCardProps {
  homeId?: string;
  limit?: number;
  className?: string;
}

export function CaraInsightCard({
  limit = 5,
  className,
}: CaraInsightCardProps) {
  // Insights are not yet sourced from a live feed. Rather than fabricate demo
  // insights — which previously surfaced fictional children on the live tenant —
  // the widget starts from nothing and shows an honest empty state. When a real
  // insights source is connected, the list below renders it (capped by `limit`).
  const insights: Insight[] = [];
  const displayed = insights.slice(0, limit);

  if (displayed.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-[var(--cs-border)] bg-slate-50 p-6 text-center",
          className,
        )}
      >
        <Sparkles className="h-6 w-6 text-[var(--cs-text-muted)] mx-auto mb-2" />
        <p className="text-sm font-medium text-[var(--cs-text-secondary)]">No insights yet</p>
        <p className="text-[11px] text-[var(--cs-text-muted)] mt-1">
          Cara surfaces insights here as records are logged across the home.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {displayed.map((insight) => {
        const sev = SEVERITY_CONFIG[insight.severity];
        const typeConfig = TYPE_CONFIG[insight.type];
        const TypeIcon = typeConfig.icon;

        return (
          <div
            key={insight.id}
            className={cn(
              "rounded-xl border bg-white border-l-4 p-4 transition-shadow hover:shadow-sm",
              sev.border,
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center shrink-0", sev.bg)}>
                  <TypeIcon className={cn("h-3.5 w-3.5", sev.colour)} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[var(--cs-navy)] line-clamp-1">
                    {insight.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-[var(--cs-text-muted)]">{typeConfig.label}</span>
                    {insight.relatedChildName && (
                      <>
                        <span className="text-[var(--cs-text-gentle)]">·</span>
                        <span className="text-[9px] font-medium text-[var(--cs-cara-gold)]">
                          {insight.relatedChildName}
                        </span>
                      </>
                    )}
                    <span className="text-[var(--cs-text-gentle)]">·</span>
                    <span className="text-[9px] text-[var(--cs-text-muted)]">
                      {insight.confidence}% confidence
                    </span>
                  </div>
                </div>
              </div>
              <span className={cn("h-2 w-2 rounded-full shrink-0 mt-1", sev.dot)} />
            </div>

            {/* Summary */}
            <p className="text-[11px] text-[var(--cs-text-secondary)] leading-relaxed mb-2 line-clamp-2">
              {insight.summary}
            </p>

            {/* Recommendation */}
            <div className="rounded-lg bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] px-3 py-2 mb-2">
              <div className="flex items-center gap-1 mb-0.5">
                <Sparkles className="h-2.5 w-2.5 text-[var(--cs-cara-gold)]" />
                <span className="text-[9px] font-semibold text-[var(--cs-navy)]">Cara recommendation</span>
              </div>
              <p className="text-[10px] text-[var(--cs-text-secondary)] leading-relaxed">
                {insight.recommendation}
              </p>
            </div>

            {/* Action link */}
            {insight.actionUrl && (
              <Link
                href={insight.actionUrl}
                className="flex items-center gap-1 text-[10px] font-medium text-[var(--cs-cara-gold)] hover:text-[var(--cs-navy)] transition-colors"
              >
                Review in Cara
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Expose for testing — pure config maps only, no fabricated data.
export const _testing = { TYPE_CONFIG, SEVERITY_CONFIG };
