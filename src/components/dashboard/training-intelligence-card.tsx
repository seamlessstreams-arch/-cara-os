"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — TRAINING & DEVELOPMENT INTELLIGENCE CARD
// Dashboard card for mandatory training compliance, DBS status,
// supervision, and Cara workforce intelligence (Reg 32/33).
// Powered by the Workforce Intelligence Engine — live data.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, Shield, BookOpen, Loader2, Users,
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

export function TrainingIntelligenceCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand" />
            Training & Development
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

  const p = intel.profile;
  const dbs = intel.dbs;
  const sup = intel.supervision;

  // Compute totals from training matrix
  const totalExpired = intel.training.reduce((sum, t) => sum + t.expired, 0);
  const totalExpiring = intel.training.reduce((sum, t) => sum + t.expiring_soon, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand" />
            Training & Development
          </CardTitle>
          <Link href="/training" className="text-xs text-brand hover:underline flex items-center gap-1">
            Training <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg p-2" style={{ background: meets(p.training_compliance_rate, 90) ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", meets(p.training_compliance_rate, 90) ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(p.training_compliance_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Compliance</p>
          </div>
          <div className="text-center rounded-lg p-2" style={{ background: meets(p.supervision_compliance_rate, 90) ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", meets(p.supervision_compliance_rate, 90) ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(p.supervision_compliance_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Supervision</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", totalExpired > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", totalExpired > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>
              {totalExpired}
            </p>
            <p className="text-[10px] text-muted-foreground">Expired</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", totalExpiring > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", totalExpiring > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>
              {totalExpiring}
            </p>
            <p className="text-[10px] text-muted-foreground">Expiring</p>
          </div>
        </div>

        {/* ── Training matrix ────────────────────────────────────────── */}

        {intel.training.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Mandatory Training
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
                  <span className="w-16 text-right tabular-nums font-medium text-[10px]">
                    {t.compliant}
                    {t.expiring_soon > 0 && <span className="text-amber-500"> +{t.expiring_soon}</span>}
                    {t.expired > 0 && <span className="text-red-500"> -{t.expired}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DBS status ──────────────────────────────────────────────── */}

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

        {/* ── Supervision overview ────────────────────────────────────── */}

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
              {sup.overdue} overdue
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-[--cs-success-bg] text-[--cs-success]">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All current
            </Badge>
          )}
        </div>

        {/* ── Cara insights ────────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Workforce Intelligence
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
