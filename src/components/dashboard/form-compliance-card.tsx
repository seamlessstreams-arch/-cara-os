"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CARE FORM INTELLIGENCE CARD
// Dashboard card powered by the Care Form Intelligence Engine — live data.
// Reg 35 (policies/procedures documentation), Reg 37 (notifications),
// Schedule 1, SCCIF: "Are records accurate, up to date, and support
// effective planning?"
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, ChevronRight, AlertTriangle, Brain, Loader2,
  Clock, FileWarning, FileCheck2, BarChart3, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCareFormIntelligence } from "@/hooks/use-care-form-intelligence";
import { formatRate } from "@/lib/metrics/rate";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  medium: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  low: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-[--cs-risk-bg] text-[--cs-risk]",
  high: "bg-[--cs-warning-bg] text-[--cs-warning]",
  medium: "bg-[--cs-info-bg] text-[--cs-info]",
  low: "bg-[--cs-bg] text-[--cs-text-secondary]",
};

function formatFormType(ft: string): string {
  return ft.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Component ───────────────────────────────────────────────────────────────

export function FormComplianceCard() {
  const { data, isLoading } = useCareFormIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-sky-500" />
            Care Forms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const o = intel.overview;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-sky-500" />
            Care Forms
          </CardTitle>
          <Link href="/forms" className="text-xs text-brand hover:underline flex items-center gap-1">
            All Forms <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.completion_rate === null ? "bg-slate-50" : o.completion_rate >= 80 ? "bg-green-50" : o.completion_rate >= 50 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.completion_rate === null ? "text-[var(--cs-text-muted)]" : o.completion_rate >= 80 ? "text-[--cs-success]" : o.completion_rate >= 50 ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {formatRate(o.completion_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Complete</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.overdue_count === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.overdue_count === 0 ? "text-[--cs-success]" : "text-[--cs-risk]",
            )}>
              {o.overdue_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.pending_review_count === 0 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.pending_review_count === 0 ? "text-[--cs-success]" : "text-[--cs-warning]",
            )}>
              {o.pending_review_count + o.submitted_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.total_forms}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
        </div>

        {/* ── Key metrics bar ──────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className={cn(
              "font-bold tabular-nums",
              o.avg_review_days <= 2 ? "text-[--cs-success]" : o.avg_review_days <= 5 ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {o.avg_review_days}d
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Review</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.child_linked_count}</p>
            <p className="text-[10px] text-muted-foreground">Child-linked</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.form_types_used}</p>
            <p className="text-[10px] text-muted-foreground">Form Types</p>
          </div>
        </div>

        {/* ── Form type breakdown ──────────────────────────────────────── */}

        {intel.form_type_analysis.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              By Form Type
            </p>
            {intel.form_type_analysis.slice(0, 5).map((ft) => (
              <div key={ft.form_type} className="flex items-center justify-between text-xs rounded-lg border px-3 py-2">
                <span className="font-medium truncate flex-1">{formatFormType(ft.form_type)}</span>
                {/* ONE badge: overdue > pending > approved */}
                {ft.overdue_count > 0 ? (
                  <Badge className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">
                    <FileWarning className="h-2.5 w-2.5 mr-0.5" />{ft.overdue_count} overdue
                  </Badge>
                ) : ft.pending_count > 0 ? (
                  <Badge className="text-[9px] bg-[--cs-warning-bg] text-[--cs-warning]">
                    <Clock className="h-2.5 w-2.5 mr-0.5" />{ft.pending_count} pending
                  </Badge>
                ) : ft.approved_count > 0 ? (
                  <Badge className="text-[9px] bg-[--cs-success-bg] text-[--cs-success]">
                    <FileCheck2 className="h-2.5 w-2.5 mr-0.5" />{ft.approved_count}
                  </Badge>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* ── Form profiles (at-risk) ────────────────────────────────── */}

        {intel.form_profiles.filter((fp) => (fp.risk_flags?.length ?? 0) > 0).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              At-Risk Forms
            </p>
            {intel.form_profiles
              .filter((fp) => (fp.risk_flags?.length ?? 0) > 0)
              .sort((a, b) => (b.risk_flags?.length ?? 0) - (a.risk_flags?.length ?? 0))
              .slice(0, 4)
              .map((fp) => {
                const flagCount = fp.risk_flags?.length ?? 0;
                return (
                  <div key={fp.form_id} className="rounded-lg border p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate flex-1">{fp.title}</span>
                      <Badge className={cn("text-[9px]", PRIORITY_STYLES[fp.priority] ?? PRIORITY_STYLES.medium)}>
                        {fp.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                      {fp.submitted_by_name && (
                        <span className="text-[10px]">By {fp.submitted_by_name}</span>
                      )}
                      {fp.is_overdue && (
                        <span className="text-[10px] text-[--cs-risk]">{fp.days_overdue}d overdue</span>
                      )}
                      {fp.days_since_submitted !== null && !fp.is_overdue && (
                        <span className="text-[10px]">{fp.days_since_submitted}d since submitted</span>
                      )}
                      {flagCount > 0 && (
                        <Badge className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">
                          <FileWarning className="h-2.5 w-2.5 mr-0.5" />
                          {flagCount} flag{flagCount > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Form Alerts
            </p>
            {intel.alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium,
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── Cara Care Form Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Form Intelligence
            </p>
            {intel.insights.slice(0, 3).map((insight, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive,
                )}
              >
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
