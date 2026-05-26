"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME REGULATORY COMPLIANCE INTELLIGENCE CARD
// Home-level: Reg 44 visits, quality audits, notifiable events, inspection
// history, policy review status — holistic regulatory health view.
// CHR 2015 Reg 44, 45, 46. SCCIF: "Leadership and management."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, AlertCircle,
  Sparkles, ShieldCheck, FileCheck, Eye,
  TrendingUp, TrendingDown, Minus, Clock,
  BookOpen, ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeRegulatoryComplianceIntelligence } from "@/hooks/use-home-regulatory-compliance-intelligence";
import type { RegulatoryComplianceRating } from "@/lib/engines/home-regulatory-compliance-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<RegulatoryComplianceRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:        { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:               { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:           { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:         { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data:  { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-red-200 bg-red-50 text-red-800",
  soon: "border-amber-200 bg-amber-50 text-amber-800",
  planned: "border-blue-200 bg-blue-50 text-blue-800",
};

const TREND_ICON = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
  insufficient_data: Minus,
};

const TREND_COLOR: Record<string, string> = {
  improving: "text-green-600",
  stable: "text-slate-500",
  declining: "text-red-600",
  insufficient_data: "text-slate-400",
};

// ── Component ───────────────────────────────────────────────────────────────

export function HomeRegulatoryComplianceIntelligenceCard() {
  const { data, isLoading } = useHomeRegulatoryComplianceIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const ratingStyle = RATING_STYLES[d.regulatory_compliance_rating] ?? RATING_STYLES.insufficient_data;
  const hasPending = d.notifiable_events.pending_count > 0;
  const hasOverduePolicies = d.policies.overdue_count > 0;
  const isAlert = hasPending || d.regulatory_compliance_rating === "inadequate";

  const Reg44TrendIcon = TREND_ICON[d.reg44.trend];
  const AuditTrendIcon = TREND_ICON[d.audits.trend];
  const GradeTrendIcon = TREND_ICON[d.inspection.grade_trend];

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-indigo-500")} />
            <span className="text-slate-900">Regulatory Compliance</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.regulatory_compliance_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.regulatory_compliance_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.regulatory_compliance_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Reg 44 Visits */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.reg44.total_visits_12m >= 11 ? "text-green-600" : d.reg44.total_visits_12m >= 9 ? "text-amber-600" : "text-red-600")}>
                  {d.reg44.total_visits_12m}
                </p>
                {d.reg44.trend !== "insufficient_data" && (
                  <Reg44TrendIcon className={cn("h-3 w-3", TREND_COLOR[d.reg44.trend])} />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Reg 44 (12m)</p>
            </div>

            {/* Audit Avg Score */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ClipboardCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.audits.avg_score !== null && d.audits.avg_score >= 85 ? "text-green-600" : d.audits.avg_score !== null && d.audits.avg_score >= 70 ? "text-amber-600" : "text-red-600")}>
                  {d.audits.avg_score ?? "—"}%
                </p>
                {d.audits.trend !== "insufficient_data" && (
                  <AuditTrendIcon className={cn("h-3 w-3", TREND_COLOR[d.audits.trend])} />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Audit Avg</p>
            </div>

            {/* Pending Notifications */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <p className={cn("text-lg font-bold tabular-nums", d.notifiable_events.pending_count === 0 ? "text-green-600" : "text-red-600")}>
                {d.notifiable_events.pending_count}
              </p>
              <p className="text-[10px] text-muted-foreground">Pending NEs</p>
            </div>

            {/* Overdue Policies */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <p className={cn("text-lg font-bold tabular-nums", d.policies.overdue_count === 0 ? "text-green-600" : d.policies.overdue_count <= 1 ? "text-amber-600" : "text-red-600")}>
                {d.policies.overdue_count}
              </p>
              <p className="text-[10px] text-muted-foreground">Overdue Policies</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.regulatory_compliance_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            {/* Reg 44 Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Eye className="h-3 w-3 text-indigo-400" />
                Reg 44 Visits
              </p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Open recs: <span className={cn("font-medium", d.reg44.open_recommendations > 0 ? "text-amber-600" : "text-green-600")}>{d.reg44.open_recommendations}</span>
                  {d.reg44.high_priority_open > 0 && <span className="text-red-600 font-medium"> ({d.reg44.high_priority_open} high)</span>}
                </p>
                <p>Completion: <span className={cn("font-medium", d.reg44.recommendation_completion_rate >= 90 ? "text-green-600" : "text-amber-600")}>{d.reg44.recommendation_completion_rate}%</span></p>
                <p>Sent Ofsted: <span className={cn("font-medium", d.reg44.reports_sent_to_ofsted_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.reg44.reports_sent_to_ofsted_rate}%</span></p>
              </div>
            </div>

            {/* Inspection Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1 flex items-center gap-1">
                <FileCheck className="h-3 w-3 text-indigo-400" />
                Inspection
              </p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Grade: <span className="font-medium text-slate-600">{d.inspection.latest_grade}</span>
                  {d.inspection.grade_trend !== "insufficient_data" && (
                    <GradeTrendIcon className={cn("inline h-3 w-3 ml-1", TREND_COLOR[d.inspection.grade_trend])} />
                  )}
                </p>
                <p>Actions: <span className={cn("font-medium", d.inspection.action_completion_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.inspection.total_actions_completed}/{d.inspection.total_actions_required}</span></p>
                <p>Last: <span className="font-medium text-slate-600">{d.inspection.months_since_last_inspection}m ago</span></p>
              </div>
            </div>

            {/* Notifiable Events Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                Notifiable Events
              </p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>90d: <span className="font-medium text-slate-600">{d.notifiable_events.total_90d}</span> · 12m: <span className="font-medium text-slate-600">{d.notifiable_events.total_12m}</span></p>
                <p>On-time: <span className={cn("font-medium", d.notifiable_events.notified_within_24h_rate === 100 ? "text-green-600" : d.notifiable_events.notified_within_24h_rate >= 80 ? "text-amber-600" : "text-red-600")}>{d.notifiable_events.notified_within_24h_rate}%</span></p>
                <p>Follow-up: <span className={cn("font-medium", d.notifiable_events.follow_up_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.notifiable_events.follow_up_rate}%</span></p>
              </div>
            </div>

            {/* Policies Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1 flex items-center gap-1">
                <BookOpen className="h-3 w-3 text-indigo-400" />
                Policies
              </p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total: <span className="font-medium text-slate-600">{d.policies.total_policies}</span> · Current: <span className={cn("font-medium", d.policies.current_count === d.policies.total_policies ? "text-green-600" : "text-amber-600")}>{d.policies.current_count}</span></p>
                <p>Ack rate: <span className={cn("font-medium", d.policies.avg_acknowledgement_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.policies.avg_acknowledgement_rate}%</span></p>
                {d.policies.review_due_within_30d > 0 && (
                  <p className="text-amber-600 font-medium">{d.policies.review_due_within_30d} due within 30d</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Event Types */}
        {d.notifiable_events.event_types.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Event Types (12m)</p>
            <div className="flex flex-wrap gap-1">
              {d.notifiable_events.event_types.slice(0, 5).map((t, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700">
                  {t.type.replace(/_/g, " ")} ({t.count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Overdue Policies */}
        {d.policies.overdue_policies.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">Overdue Policies</p>
            <div className="flex flex-wrap gap-1">
              {d.policies.overdue_policies.slice(0, 4).map((p, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {d.strengths.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Strengths ({d.strengths.length})
            </p>
            {d.strengths.slice(0, 3).map((s, i) => (
              <div key={i} className="rounded border border-green-200 bg-green-50 p-2.5 text-xs text-green-800 leading-relaxed">
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Concerns */}
        {d.concerns.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Concerns ({d.concerns.length})
            </p>
            {d.concerns.slice(0, 3).map((c, i) => (
              <div key={i} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 leading-relaxed">
                {c}
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {d.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Recommendations ({d.recommendations.length})
            </p>
            {d.recommendations.slice(0, 3).map((rec) => (
              <div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_STYLES[rec.urgency] ?? REC_STYLES.planned)}>
                <div className="flex items-start justify-between gap-2">
                  <span>{rec.recommendation}</span>
                  {rec.regulatory_ref && (
                    <span className="text-[10px] font-mono shrink-0 opacity-60">{rec.regulatory_ref}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ARIA Regulatory Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Regulatory Intelligence
            </p>
            {d.insights.slice(0, 3).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
