"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUDIT QUALITY ASSURANCE INTELLIGENCE CARD
// Dashboard card powered by the Audit Quality Intelligence Engine — live data.
// Reg 45 (review of quality of care — the registered person must establish
// and maintain a system for monitoring, reviewing, and evaluating quality).
// Schedule 6, SCCIF: "Does the home have robust quality assurance systems?"
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck, ChevronRight, AlertTriangle, Brain, Loader2,
  BarChart3, Clock, Shield, FileWarning, Star, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditQualityIntelligenceResult } from "@/lib/engines/audit-quality-intelligence-engine";
import { meets, formatRate } from "@/lib/metrics/rate";

// ── Query Config ────────────────────────────────────────────────────────────
const AUDIT_QUALITY_INTELLIGENCE_KEY = "audit-quality-intelligence";
const AUDIT_QUALITY_INTELLIGENCE_API = "/api/v1/audit-quality-intelligence";

interface AuditQualityIntelligenceResponse {
  data: AuditQualityIntelligenceResult;
}

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

function formatCategory(cat: string): string {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Component ───────────────────────────────────────────────────────────────

export function AuditComplianceCard() {
  const { data, isLoading } = useQuery<AuditQualityIntelligenceResponse>({
    queryKey: [AUDIT_QUALITY_INTELLIGENCE_KEY],
    queryFn: () => fetch(AUDIT_QUALITY_INTELLIGENCE_API).then((r) => r.json()),
    refetchInterval: 60_000,
  });
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-amber-500" />
            Audit Compliance
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
            <ClipboardCheck className="h-4 w-4 text-amber-500" />
            Audit Compliance
          </CardTitle>
          <Link href="/audits" className="text-xs text-brand hover:underline flex items-center gap-1">
            All Audits <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            meets(o.avg_compliance_score, 85) ? "bg-green-50" : meets(o.avg_compliance_score, 70) ? "bg-amber-50" : o.avg_compliance_score === null ? "bg-slate-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              meets(o.avg_compliance_score, 85) ? "text-[--cs-success]" : meets(o.avg_compliance_score, 70) ? "text-[--cs-warning]" : o.avg_compliance_score === null ? "text-[var(--cs-text-muted)]" : "text-[--cs-risk]",
            )}>
              {formatRate(o.avg_compliance_score)}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Score</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-green-600">{o.completed_count}</p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
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
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.scheduled_count}</p>
            <p className="text-[10px] text-muted-foreground">Scheduled</p>
          </div>
        </div>

        {/* ── Key metrics bar ──────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.total_findings}</p>
            <p className="text-[10px] text-muted-foreground">Findings</p>
          </div>
          <div>
            <p className={cn(
              "font-bold tabular-nums",
              o.unresolved_findings === 0 ? "text-[--cs-success]" : "text-[--cs-warning]",
            )}>
              {o.unresolved_findings}
            </p>
            <p className="text-[10px] text-muted-foreground">Unresolved</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.categories_covered}</p>
            <p className="text-[10px] text-muted-foreground">Categories</p>
          </div>
        </div>

        {/* ── Category compliance bars ──────────────────────────────────── */}

        {intel.category_analysis.filter((ca) => ca.completed_count > 0).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Compliance by Category
            </p>
            {intel.category_analysis
              .filter((ca) => ca.completed_count > 0)
              .map((ca) => (
                <div key={ca.category} className="flex items-center gap-2 text-xs">
                  <span className="w-28 text-right text-muted-foreground capitalize truncate">
                    {formatCategory(ca.category)}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        meets(ca.avg_compliance_score, 85) ? "bg-green-400"
                          : meets(ca.avg_compliance_score, 70) ? "bg-amber-400"
                          : ca.avg_compliance_score === null ? "bg-slate-300"
                          : "bg-red-400",
                      )}
                      style={{ width: `${Math.max(4, ca.avg_compliance_score ?? 0)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-medium tabular-nums">{formatRate(ca.avg_compliance_score)}</span>
                </div>
              ))}
          </div>
        )}

        {/* ── Audit profiles ────────────────────────────────────────────── */}

        {intel.audit_profiles.filter((ap) => (ap.risk_flags?.length ?? 0) > 0 || ap.status !== "completed").length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Audit Status
            </p>
            {intel.audit_profiles
              .filter((ap) => (ap.risk_flags?.length ?? 0) > 0 || ap.status !== "completed")
              .slice(0, 4)
              .map((ap) => (
                <div key={ap.audit_id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate flex-1">{ap.title}</span>
                    <div className="flex items-center gap-1.5">
                      {ap.status === "completed" ? (
                        <Badge className={cn(
                          "text-[9px]",
                          meets(ap.compliance_pct, 85) ? "bg-[--cs-success-bg] text-[--cs-success]"
                            : meets(ap.compliance_pct, 70) ? "bg-[--cs-warning-bg] text-[--cs-warning]"
                            : ap.compliance_pct === null ? "bg-[--cs-info-bg] text-[--cs-info]"
                            : "bg-[--cs-risk-bg] text-[--cs-risk]",
                        )}>
                          {formatRate(ap.compliance_pct)}
                        </Badge>
                      ) : (
                        <Badge className={cn(
                          "text-[9px]",
                          ap.is_overdue ? "bg-[--cs-risk-bg] text-[--cs-risk]" : "bg-[--cs-info-bg] text-[--cs-info]",
                        )}>
                          {ap.is_overdue ? "Overdue" : ap.status === "scheduled" ? "Scheduled" : "In Progress"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                    {ap.completed_by_name && (
                      <span className="text-[10px]">By {ap.completed_by_name}</span>
                    )}
                    <span className={cn(
                      "text-[10px]",
                      ap.days_since_or_until < 0 && ap.status !== "completed" ? "text-[--cs-risk]" : "",
                    )}>
                      {ap.days_since_or_until < 0
                        ? `${Math.abs(ap.days_since_or_until)}d ago`
                        : ap.days_since_or_until === 0
                          ? "Today"
                          : `In ${ap.days_since_or_until}d`}
                    </span>
                    {ap.unresolved_findings > 0 && (
                      <span className="text-[10px] text-amber-600">
                        {ap.unresolved_findings} unresolved
                      </span>
                    )}
                  </div>
                  {(ap.risk_flags?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(ap.risk_flags ?? []).slice(0, 3).map((flag, i) => (
                        <Badge key={i} className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">
                          <FileWarning className="h-2.5 w-2.5 mr-0.5" />
                          {flag.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Audit Alerts
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

        {/* ── Cara Audit Intelligence ────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Audit Intelligence
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
