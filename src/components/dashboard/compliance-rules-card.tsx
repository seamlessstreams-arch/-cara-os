"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPLIANCE RULES CARD
// The home's FIXED regulatory checks — hard pass/fail rules, deliberately
// separate from Cara's suggestions. Shows how many rules are passing/failing,
// the failing critical/high alerts, and Cara's read on the overall posture.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, ChevronRight, Brain, Loader2, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { ComplianceRulesResult } from "@/lib/compliance-rules/compliance-rules-engine";

interface ComplianceRulesResponse {
  data: ComplianceRulesResult;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-amber-100", text: "text-amber-700" },
  medium: { bg: "bg-blue-100", text: "text-blue-700" },
  low: { bg: "bg-gray-100", text: "text-gray-600" },
};
const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function ComplianceRulesCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["compliance-rules"],
    queryFn: () => api.get<ComplianceRulesResponse>("/compliance-rules"),
    refetchInterval: 60_000, // 60 second refresh
  });
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            Compliance Rules — Fixed Checks
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
  const alerts = intel.alerts ?? [];
  const insights = intel.insights ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            Compliance Rules — Fixed Checks
          </CardTitle>
          <Link href="/compliance-rules" className="text-xs text-brand hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── KPI strip ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.rules_evaluated}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">Rules</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.passing > 0 ? "bg-green-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.passing > 0 ? "text-[--cs-success]" : "text-gray-500")}>{o.passing}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">Passing</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.failing > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.failing > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{o.failing}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">Failing</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.by_severity.critical > 0 ? "bg-red-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.by_severity.critical > 0 ? "text-[--cs-risk]" : "text-gray-500")}>{o.by_severity.critical}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">Critical</p>
          </div>
        </div>

        {/* ── Failing rule list (or all-clear) ──────────────────────────── */}
        {alerts.length > 0 ? (
          <div className="space-y-1.5">
            {alerts.slice(0, 4).map((a, i) => {
              const s = SEVERITY_STYLES[a.severity] ?? SEVERITY_STYLES.low;
              return (
                <div key={i} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <span className="font-medium truncate">{a.title}</span>
                    </div>
                    <Badge className={cn("text-[10px] shrink-0", s.bg, s.text)}>{a.severity}</Badge>
                  </div>
                  <p className="text-[10px] text-[var(--cs-text-muted)] mt-1 line-clamp-2">{a.message}</p>
                </div>
              );
            })}
            {alerts.length > 4 && (
              <p className="text-[10px] text-[var(--cs-text-muted)] text-center pt-0.5">+{alerts.length - 4} more failing critical/high rules</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-[--cs-success-soft] bg-[--cs-success-bg] p-3 text-xs text-[--cs-success]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>No critical or high compliance rules are failing.</span>
          </div>
        )}

        {/* ── Cara insights ─────────────────────────────────────────────── */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Compliance Posture
            </p>
            {insights.slice(0, 2).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
