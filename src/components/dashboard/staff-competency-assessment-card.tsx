"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF COMPETENCY & ASSESSMENT INTELLIGENCE CARD
// Dashboard card for training compliance, supervision, and DBS status overview.
// Powered by the Workforce Intelligence Engine — live data.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Award, ChevronRight, Brain, Loader2,
  BookOpen, Users, Shield, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meanOf, meets, rate } from "@/lib/metrics/rate";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

// ── Insight styling ──────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

// ── Component ────────────────────────────────────────────────────────────────

export function StaffCompetencyAssessmentCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-brand" />
            Staff Competency
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

  const sup = intel.supervision;
  const dbs = intel.dbs;

  // Compute overall training compliance average
  const avgCompliance = meanOf(intel.training.map((t) => t.compliance_rate));

  const categoriesWithExpired = intel.training.filter((t) => t.expired > 0).length;
  const supRate = rate(sup.up_to_date, sup.total_staff_requiring);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-brand" />
            Staff Competency
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", meets(avgCompliance, 90) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(avgCompliance, 90) ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(avgCompliance)}
            </p>
            <p className="text-[10px] text-muted-foreground">Training</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", categoriesWithExpired === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", categoriesWithExpired === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>
              {categoriesWithExpired}
            </p>
            <p className="text-[10px] text-muted-foreground">Expired Cat.</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", meets(supRate, 90) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(supRate, 90) ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(supRate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Supervision</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", meets(dbs.compliance_rate, 90) ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(dbs.compliance_rate, 90) ? "text-[--cs-success]" : "text-[--cs-risk]")}>
              {formatRate(dbs.compliance_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">DBS</p>
          </div>
        </div>

        {/* ── Training breakdown bars ─────────────────────────────────── */}

        {intel.training.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Training Breakdown
            </p>
            <div className="space-y-1">
              {intel.training.map((t) => (
                <div key={t.category} className="flex items-center gap-2 text-xs">
                  <span className="w-28 text-muted-foreground capitalize">{t.category.replace(/_/g, " ")}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-400" style={{ width: `${(t.compliant / Math.max(t.total_required, 1)) * 100}%` }} />
                    <div className="h-full bg-amber-400" style={{ width: `${(t.expiring_soon / Math.max(t.total_required, 1)) * 100}%` }} />
                    <div className="h-full bg-red-400" style={{ width: `${(t.expired / Math.max(t.total_required, 1)) * 100}%` }} />
                  </div>
                  <span className="w-12 text-right tabular-nums font-medium text-[10px]">
                    {formatRate(t.compliance_rate)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Supervision status ──────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Users className={cn("h-4 w-4", sup.overdue > 0 ? "text-amber-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">Supervision</p>
              <p className="text-[10px] text-muted-foreground">
                {sup.up_to_date} up to date · {sup.overdue} overdue · {sup.due_within_7_days} due soon
              </p>
            </div>
          </div>
          {sup.overdue > 0 ? (
            <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning]">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
              {sup.overdue} overdue
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-[--cs-success-bg] text-[--cs-success]">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All current
            </Badge>
          )}
        </div>

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Competency Intelligence
            </p>
            {intel.insights.map((insight, i) => (
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
