"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF INDUCTION & COMPLIANCE INTELLIGENCE CARD
// Dashboard card for DBS compliance, training categories, and expiring items.
// Powered by the Workforce Intelligence Engine — live data.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus, ChevronRight, Brain, Loader2,
  Shield, BookOpen, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

// ── Insight styling ──────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

// ── Component ────────────────────────────────────────────────────────────────

export function StaffInductionCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-brand" />
            Staff Induction
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

  const dbs = intel.dbs;
  const totalCompliant = intel.training.reduce((sum, t) => sum + t.compliant, 0);
  const totalExpiring = intel.training.reduce((sum, t) => sum + t.expiring_soon, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-brand" />
            Staff Induction
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", meets(dbs.compliance_rate, 90) ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(dbs.compliance_rate, 90) ? "text-[--cs-success]" : "text-[--cs-risk]")}>
              {formatRate(dbs.compliance_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">DBS</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", dbs.expired_or_missing === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", dbs.expired_or_missing === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>
              {dbs.expired_or_missing}
            </p>
            <p className="text-[10px] text-muted-foreground">Expired/Missing</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{totalCompliant}</p>
            <p className="text-[10px] text-muted-foreground">Compliant</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", totalExpiring === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", totalExpiring === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {totalExpiring}
            </p>
            <p className="text-[10px] text-muted-foreground">Expiring</p>
          </div>
        </div>

        {/* ── Training compliance bars by category ────────────────────── */}

        {intel.training.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Training Compliance
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

        {/* ── DBS section ─────────────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Shield className={cn("h-4 w-4", dbs.expired_or_missing > 0 ? "text-red-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">DBS Status</p>
              <p className="text-[10px] text-muted-foreground">
                {dbs.valid_dbs} valid · {dbs.update_service_enrolled} update service · {dbs.expired_or_missing} needing action
              </p>
            </div>
          </div>
          {dbs.expired_or_missing > 0 ? (
            <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk]">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
              {dbs.expired_or_missing} action
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-[--cs-success-bg] text-[--cs-success]">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All clear
            </Badge>
          )}
        </div>

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Induction Intelligence
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
