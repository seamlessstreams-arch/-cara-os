"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF MANDATORY TRAINING CARD
// Dashboard card powered by the Workforce Intelligence Engine.
// Tracks training compliance by category. CHR 2015 Reg 33.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, ChevronRight, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meanOf, meets } from "@/lib/metrics/rate";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning:  "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

// ── Component ───────────────────────────────────────────────────────────────

export function StaffMandatoryTrainingCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand" />
            Mandatory Training
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

  const totalExpiring = intel.training.reduce((s, t) => s + t.expiring_soon, 0);
  const totalExpired = intel.training.reduce((s, t) => s + t.expired, 0);
  const avgCompliance = meanOf(intel.training.map((t) => t.compliance_rate));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand" />
            Mandatory Training
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", meets(avgCompliance, 95) ? "bg-green-50" : meets(avgCompliance, 80) ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(avgCompliance, 95) ? "text-[--cs-success]" : meets(avgCompliance, 80) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{formatRate(avgCompliance)}</p>
            <p className="text-[10px] text-muted-foreground">Compliance</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{intel.training.length}</p>
            <p className="text-[10px] text-muted-foreground">Categories</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", totalExpiring === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", totalExpiring === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{totalExpiring}</p>
            <p className="text-[10px] text-muted-foreground">Expiring</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", totalExpired === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", totalExpired === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{totalExpired}</p>
            <p className="text-[10px] text-muted-foreground">Expired</p>
          </div>
        </div>

        {/* ── Training categories ──────────────────────────────────────── */}

        {intel.training.length > 0 && (
          <div className="space-y-1.5">
            {intel.training.map((t) => (
              <div key={t.category} className="flex items-center gap-2 text-xs">
                <span className="w-28 truncate capitalize text-muted-foreground">{t.category.replace(/_/g, " ")}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", meets(t.compliance_rate, 95) ? "bg-green-400" : meets(t.compliance_rate, 80) ? "bg-amber-400" : "bg-red-400")}
                    style={{ width: `${t.compliance_rate ?? 0}%` }}
                  />
                </div>
                <span className={cn("w-8 text-right tabular-nums font-medium", meets(t.compliance_rate, 95) ? "text-[--cs-success]" : meets(t.compliance_rate, 80) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>
                  {formatRate(t.compliance_rate)}
                </span>
                {t.expired > 0 && <Badge className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">{t.expired}</Badge>}
              </div>
            ))}
          </div>
        )}

        {/* ── Cara Intelligence ───────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Training Intelligence
            </p>
            {intel.insights.slice(0, 2).map((insight, i) => (
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
