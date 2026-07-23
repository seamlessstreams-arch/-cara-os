"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGER'S INTELLIGENCE BRIEFING CARD
// Cross-cutting meta-intelligence aggregated from all domain engines.
// CHR 2015 Reg 5 (RM duties), Reg 45 (quality of care review).
// SCCIF: Overall Experiences, Helped & Protected, Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain, ChevronRight, Loader2, Shield, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Activity,
  CheckCircle2, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate } from "@/lib/metrics/rate";
import { useManagerBriefing } from "@/hooks/use-manager-briefing";

const RISK_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "CRITICAL" },
  elevated: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", label: "ELEVATED" },
  moderate: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", label: "MODERATE" },
  stable: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", label: "STABLE" },
  unknown: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300", label: "NOT ASSESSED" },
};

const STATUS_DOT: Record<string, string> = {
  green: "bg-green-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

const ALERT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  medium: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
  low: "border-slate-200 bg-slate-50 text-slate-700",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

function TrendIcon({ direction }: { direction: string }) {
  if (direction === "improving") return <TrendingUp className="h-3 w-3 text-green-600" />;
  if (direction === "worsening") return <TrendingDown className="h-3 w-3 text-red-600" />;
  return <Minus className="h-3 w-3 text-slate-400" />;
}

export function ManagerIntelligenceBriefingCard() {
  const { data, isLoading } = useManagerBriefing();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200 col-span-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const exec = d.executive_summary;
  const riskStyle = RISK_STYLES[exec.overall_risk_level] ?? RISK_STYLES.stable;
  const trend = d.trend_analysis;
  const reg = d.regulatory_compliance;

  return (
    <Card className="overflow-hidden border-slate-200 col-span-full">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-600" />
            <span className="text-slate-900">RM Intelligence Briefing</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", riskStyle.bg, riskStyle.text, riskStyle.border)}>
              {riskStyle.label}
            </span>
          </CardTitle>
          <Link href="/daily-risk-briefing" className="text-xs text-slate-600 hover:underline flex items-center gap-1">
            Full Briefing <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{exec.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Executive KPIs */}
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", exec.total_critical_alerts > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", exec.total_critical_alerts > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>
              {exec.total_critical_alerts}
            </p>
            <p className="text-[10px] text-muted-foreground">Critical</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", exec.domains_at_risk > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", exec.domains_at_risk > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>
              {exec.domains_at_risk}
            </p>
            <p className="text-[10px] text-muted-foreground">Domains at Risk</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">{formatRate(reg.overall_compliance_pct)}</p>
            <p className="text-[10px] text-muted-foreground">Compliance</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", exec.children_requiring_attention > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", exec.children_requiring_attention > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>
              {exec.children_requiring_attention}
            </p>
            <p className="text-[10px] text-muted-foreground">YP Attention</p>
          </div>
        </div>

        {/* Domain Health Matrix */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Domain Health</p>
          <div className="grid grid-cols-4 gap-1.5">
            {d.domain_health.map((dh) => (
              <div key={dh.domain} className="rounded border p-1.5 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[dh.status])} />
                  <p className="text-[10px] font-medium text-slate-700 truncate">{dh.domain_label}</p>
                </div>
                <div className="flex items-center justify-center gap-1">
                  {dh.compliance_rate !== null && (
                    <span className="text-[10px] tabular-nums text-muted-foreground">{dh.compliance_rate}%</span>
                  )}
                  <TrendIcon direction={dh.trend_direction} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trend Summary */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Trends</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded border p-2 text-center">
              <p className="font-semibold text-green-600">{trend.domains_improving}</p>
              <p className="text-[10px] text-muted-foreground">Improving</p>
            </div>
            <div className="rounded border p-2 text-center">
              <p className="font-semibold text-blue-600">{trend.domains_stable}</p>
              <p className="text-[10px] text-muted-foreground">Stable</p>
            </div>
            <div className="rounded border p-2 text-center">
              <p className="font-semibold text-red-600">{trend.domains_worsening}</p>
              <p className="text-[10px] text-muted-foreground">Worsening</p>
            </div>
          </div>
        </div>

        {/* Children Requiring Attention */}
        {d.children_attention.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3 text-amber-600" />
              Children Requiring Attention
            </p>
            {d.children_attention.slice(0, 3).map((child) => (
              <div
                key={child.child_id}
                className={cn(
                  "rounded border p-2 text-xs",
                  child.severity === "critical" ? "border-[--cs-risk-soft] bg-[--cs-risk-bg]" :
                  child.severity === "high" ? "border-[--cs-warning-soft] bg-[--cs-warning-bg]" :
                  "border-slate-200 bg-slate-50",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{child.child_name}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    child.severity === "critical" ? "bg-red-200 text-[--cs-risk]" :
                    child.severity === "high" ? "bg-amber-200 text-[--cs-warning]" :
                    "bg-slate-200 text-slate-700",
                  )}>
                    {child.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-muted-foreground mt-0.5">
                  {(child.domains_flagged ?? []).join(", ")} — {child.action_required}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Priority Actions */}
        {d.priority_actions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Priority Actions ({d.priority_actions.length})
            </p>
            {d.priority_actions.slice(0, 3).map((action) => (
              <div key={action.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", ALERT_STYLES[action.severity] ?? ALERT_STYLES.medium)}>
                <div className="flex items-start justify-between gap-2">
                  <span>{action.action}</span>
                  {action.regulatory_ref && (
                    <span className="text-[10px] font-mono shrink-0 opacity-60">{action.regulatory_ref}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Regulatory Compliance */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Regulatory Compliance</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border p-2 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-700">{reg.domains_above_threshold} domains</p>
                <p className="text-[10px] text-muted-foreground">Above 80% threshold</p>
              </div>
            </div>
            <div className="rounded border p-2 flex items-center gap-2">
              {reg.domains_below_threshold > 0 ? (
                <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
              )}
              <div>
                <p className={cn("font-semibold", reg.domains_below_threshold > 0 ? "text-red-700" : "text-green-700")}>
                  {reg.domains_below_threshold} domains
                </p>
                <p className="text-[10px] text-muted-foreground">Below threshold</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cara Intelligence Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Intelligence Briefing
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
