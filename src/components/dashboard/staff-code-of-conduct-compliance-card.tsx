"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF CODE OF CONDUCT COMPLIANCE CARD
// Live data from useWorkforceIntelligence() — DBS, training, supervision, staff.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Scale, ChevronRight, Brain, Loader2,
  ShieldCheck, BookOpen, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meanOf, meets } from "@/lib/metrics/rate";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

// ── Insight styling ──────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

// ── Component ────────────────────────────────────────────────────────────────

export function StaffCodeOfConductComplianceCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4 text-brand" />
            Code of Conduct
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

  const { dbs, training, supervision, profile } = intel;
  const avgTrainingCompliance = meanOf(training.map((t) => t.compliance_rate));
  const supervisionRate = supervision.total_staff_requiring > 0
    ? Math.round((supervision.up_to_date / supervision.total_staff_requiring) * 100)
    : 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4 text-brand" />
            Code of Conduct
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", meets(dbs.compliance_rate, 95) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(dbs.compliance_rate, 95) ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(dbs.compliance_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">DBS</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", avgTrainingCompliance === null ? "bg-slate-50" : avgTrainingCompliance >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", avgTrainingCompliance === null ? "text-[var(--cs-text-muted)]" : avgTrainingCompliance >= 90 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(avgTrainingCompliance)}
            </p>
            <p className="text-[10px] text-muted-foreground">Training</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", supervisionRate >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", supervisionRate >= 90 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {supervisionRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Supervision</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-blue-50">
            <p className="text-lg font-bold tabular-nums text-blue-600">{profile.active_staff}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
        </div>

        {/* ── Profile breakdown ───────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            Staff Profile
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center rounded-lg bg-blue-50 p-2">
              <p className="text-sm font-bold tabular-nums text-blue-600">{profile.full_time}</p>
              <p className="text-[10px] text-muted-foreground">Full-Time</p>
            </div>
            <div className="text-center rounded-lg bg-blue-50 p-2">
              <p className="text-sm font-bold tabular-nums text-blue-600">{profile.part_time}</p>
              <p className="text-[10px] text-muted-foreground">Part-Time</p>
            </div>
            <div className={cn("text-center rounded-lg p-2", profile.bank_agency > 0 ? "bg-amber-50" : "bg-green-50")}>
              <p className={cn("text-sm font-bold tabular-nums", profile.bank_agency > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{profile.bank_agency}</p>
              <p className="text-[10px] text-muted-foreground">Bank/Agency</p>
            </div>
          </div>
        </div>

        {/* ── Training categories ─────────────────────────────────────── */}

        {training.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Training Compliance
            </p>
            <div className="space-y-1">
              {training.slice(0, 5).map((t) => (
                <div key={t.category} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                    <span className="font-medium truncate">{t.category}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", meets(t.compliance_rate, 90) ? "text-green-700 bg-green-50 border-green-200" : meets(t.compliance_rate, 70) ? "text-amber-700 bg-amber-50 border-amber-200" : "text-red-700 bg-red-50 border-red-200")}>
                    {formatRate(t.compliance_rate)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Conduct Intelligence
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
