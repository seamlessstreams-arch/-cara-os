"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — FINANCIAL MANAGEMENT INTELLIGENCE CARD
// Dashboard card powered by the Financial Management Intelligence Engine — live data.
// Reg 40 (financial management — homes must demonstrate responsible and
// transparent financial management), SCCIF: "Is the home well led and managed?"
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PoundSterling, ChevronRight, AlertTriangle, Brain, Loader2,
  Receipt, Wallet, Clock, Users, BarChart3, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinancialManagementIntelligence } from "@/hooks/use-financial-management-intelligence";
import { below, formatRate, meets } from "@/lib/metrics/rate";

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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ── Component ───────────────────────────────────────────────────────────────

export function ExpensesSummaryCard() {
  const { data, isLoading } = useFinancialManagementIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <PoundSterling className="h-4 w-4 text-green-500" />
            Financial Management
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
            <PoundSterling className="h-4 w-4 text-green-500" />
            Financial Management
          </CardTitle>
          <Link href="/expenses" className="text-xs text-brand hover:underline flex items-center gap-1">
            All Expenses <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-green-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-green-600">
              {formatCurrency(o.total_spend)}
            </p>
            <p className="text-[10px] text-muted-foreground">Total Spend</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.pending_approval > 0 ? "bg-amber-50" : "bg-green-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.pending_approval > 0 ? "text-[--cs-warning]" : "text-[--cs-success]",
            )}>
              {o.pending_approval}
            </p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.missing_receipts === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.missing_receipts === 0 ? "text-[--cs-success]" : "text-[--cs-risk]",
            )}>
              {o.missing_receipts}
            </p>
            <p className="text-[10px] text-muted-foreground">No Receipt</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            meets(o.approval_rate, 80) ? "bg-green-50" : meets(o.approval_rate, 50) ? "bg-amber-50" : below(o.approval_rate, 50) ? "bg-red-50" : "bg-muted",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              meets(o.approval_rate, 80) ? "text-[--cs-success]" : meets(o.approval_rate, 50) ? "text-[--cs-warning]" : below(o.approval_rate, 50) ? "text-[--cs-risk]" : "text-muted-foreground",
            )}>
              {formatRate(o.approval_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Approved</p>
          </div>
        </div>

        {/* ── Key metrics bar ──────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-slate-700 tabular-nums">
              {o.approved_count + o.paid_count}/{o.total_expenses}
            </p>
            <p className="text-[10px] text-muted-foreground">Processed</p>
          </div>
          <div>
            <p className={cn(
              "font-bold tabular-nums",
              o.avg_approval_days === null ? "text-muted-foreground"
                : o.avg_approval_days <= 2 ? "text-[--cs-success]"
                : o.avg_approval_days <= 5 ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {o.avg_approval_days === null ? "—" : `${o.avg_approval_days}d`}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Approval</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">
              {formatCurrency(o.child_linked_spend)}
            </p>
            <p className="text-[10px] text-muted-foreground">Child-linked</p>
          </div>
        </div>

        {/* ── Category spend breakdown ──────────────────────────────────── */}

        {intel.category_spend.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Spend by Category
            </p>
            {intel.category_spend.slice(0, 5).map((cs) => (
              <div key={cs.category} className="flex items-center gap-2 text-xs">
                <span className="w-28 text-right text-muted-foreground capitalize truncate">
                  {formatCategory(cs.category)}
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      cs.pct_of_total >= 30 ? "bg-green-400" : cs.pct_of_total >= 15 ? "bg-blue-400" : "bg-slate-400",
                    )}
                    style={{ width: `${Math.max(4, cs.pct_of_total)}%` }}
                  />
                </div>
                <span className="w-16 text-right font-medium tabular-nums">
                  {formatCurrency(cs.total_amount)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Staff spend profiles ──────────────────────────────────────── */}

        {intel.staff_spend.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Spend by Staff
            </p>
            {intel.staff_spend.slice(0, 4).map((ss) => (
              <div key={ss.staff_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate flex-1">{ss.staff_name}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge className="text-[9px] bg-[--cs-success-bg] text-[--cs-success]">
                      {formatCurrency(ss.total_amount)}
                    </Badge>
                    <Badge className="text-[9px] bg-[--cs-bg] text-[--cs-text-secondary]">
                      {ss.count} claim{ss.count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                  {ss.pending_count > 0 && (
                    <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {ss.pending_count} pending
                    </span>
                  )}
                  {ss.missing_receipts > 0 && (
                    <span className="text-[10px] text-red-600 flex items-center gap-0.5">
                      <Receipt className="h-2.5 w-2.5" />
                      {ss.missing_receipts} no receipt
                    </span>
                  )}
                  {ss.pending_count === 0 && ss.missing_receipts === 0 && (
                    <span className="text-[10px] text-green-600">All processed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Financial Alerts
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

        {/* ── Cara Financial Intelligence ────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Financial Intelligence
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
