"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraInsightCard
//
// Displays a proactive Cara insight — patterns detected, risk summaries,
// compliance gaps, or positive trends. Each insight has a type, severity,
// confidence level, and actionable recommendation.
//
// Usage:
//   <CaraInsightCard homeId="demo-home" limit={4} />
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  CheckCircle2,
  ChevronRight,
  Clock,
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

// ── Demo data ──────────────────────────────────────────────────────────────

const DEMO_INSIGHTS: Insight[] = [
  {
    id: "ins_001",
    type: "behaviour_pattern",
    severity: "high",
    title: "Escalating behaviour pattern — Alex W",
    summary: "Three incidents involving similar behaviour within 14 days. The pattern suggests environmental triggers during evening transitions.",
    recommendation: "Review risk assessment and consider updating the behaviour support plan. A key work session to capture the child's perspective is recommended.",
    confidence: 87,
    relatedChildId: "demo-child-1",
    relatedChildName: "Alex W",
    relatedModule: "incidents",
    detectedAt: "2026-05-12T08:00:00Z",
    actionUrl: "/cara/review",
  },
  {
    id: "ins_002",
    type: "positive_trend",
    severity: "positive",
    title: "Improved engagement — Casey T",
    summary: "Daily log entries over the past 21 days show increasing engagement in education and positive peer interactions, with no incidents recorded.",
    recommendation: "Highlight in the next Reg 45 report and during the upcoming LAC review as evidence of placement stability.",
    confidence: 92,
    relatedChildId: "demo-child-2",
    relatedChildName: "Casey T",
    relatedModule: "daily_log",
    detectedAt: "2026-05-11T16:00:00Z",
    actionUrl: "/young-people/demo-child-2",
  },
  {
    id: "ins_003",
    type: "oversight_gap",
    severity: "medium",
    title: "Management oversight pending for 3 incidents",
    summary: "Three incidents from the past week have not yet received management oversight. Regulation 40 requires timely review of all incidents.",
    recommendation: "Review and add management oversight to the outstanding incidents. Cara has prepared draft oversight notes for your review.",
    confidence: 95,
    relatedModule: "incidents",
    detectedAt: "2026-05-12T07:30:00Z",
    actionUrl: "/cara/review",
  },
  {
    id: "ins_004",
    type: "compliance_gap",
    severity: "medium",
    title: "Supervision overdue for 2 staff members",
    summary: "Two staff members have not had supervision within the required 4-week cycle. This is a Quality Standards requirement.",
    recommendation: "Schedule supervision sessions within the next 5 working days. Cara can generate supervision agenda templates.",
    confidence: 98,
    relatedModule: "supervision",
    detectedAt: "2026-05-12T06:00:00Z",
    actionUrl: "/supervision",
  },
  {
    id: "ins_005",
    type: "evidence_gap",
    severity: "low",
    title: "Missing child voice evidence — Jordan M",
    summary: "No key work session or wishes-and-feelings record found in the past 30 days. The child's voice should be visible in the evidence base.",
    recommendation: "Schedule a key work session with Jordan. Cara can suggest age-appropriate prompts for capturing wishes and feelings.",
    confidence: 88,
    relatedChildId: "demo-child-3",
    relatedChildName: "Jordan M",
    relatedModule: "key_work",
    detectedAt: "2026-05-11T10:00:00Z",
    actionUrl: "/young-people/demo-child-3",
  },
];

// ── Component ──────────────────────────────────────────────────────────────

interface CaraInsightCardProps {
  homeId?: string;
  limit?: number;
  className?: string;
}

export function CaraInsightCard({
  homeId,
  limit = 5,
  className,
}: CaraInsightCardProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, fetch from /api/cara/insights
    // For now, use demo data
    const timer = setTimeout(() => {
      setInsights(DEMO_INSIGHTS.slice(0, limit));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [homeId, limit]);

  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-slate-50 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Sparkles className="h-6 w-6 text-[var(--cs-text-gentle)] mx-auto mb-2" />
        <p className="text-sm text-[var(--cs-text-muted)]">No insights detected</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {insights.map((insight) => {
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

// Expose for testing
export const _testing = { TYPE_CONFIG, SEVERITY_CONFIG, DEMO_INSIGHTS };
