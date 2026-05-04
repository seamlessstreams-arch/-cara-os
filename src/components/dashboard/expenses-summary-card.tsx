"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EXPENSES SUMMARY CARD
// Dashboard widget showing petty cash and expense claim status.
// Financial oversight is a key Ofsted management & leadership indicator.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExpenses } from "@/hooks/use-expenses";
import { cn } from "@/lib/utils";
import {
  PoundSterling, Loader2, AlertTriangle, CheckCircle2,
  Clock, Receipt, Wallet,
} from "lucide-react";

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Component ───────────────────────────────────────────────────────────────

export function ExpensesSummaryCard() {
  const { data, isPending } = useExpenses();
  const meta = data?.meta;

  if (isPending) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <PoundSterling className="h-4 w-4 text-green-600" />
            Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!meta) return null;

  const approvedAmount = meta.total_amount - meta.pending_amount;
  const approvedCount = meta.total_count - meta.pending_count;
  const hasAlert = meta.pending_count > 5;

  return (
    <Card className={cn(hasAlert && "border-green-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <PoundSterling className="h-4 w-4 text-green-600" />
            Expenses
          </CardTitle>
          <Link href="/expenses">
            <Badge className="text-[9px] bg-green-100 text-green-700 border-0 rounded-full hover:bg-green-200 cursor-pointer">
              View all
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-green-50 p-2 text-center">
            <Wallet className="h-3 w-3 text-green-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-green-700 tabular-nums">{formatCurrency(meta.total_amount)}</div>
            <div className="text-[9px] text-green-500">Total</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", meta.pending_count > 0 ? "bg-amber-50" : "bg-slate-50")}>
            <Clock className={cn("h-3 w-3 mx-auto mb-0.5", meta.pending_count > 0 ? "text-amber-500" : "text-slate-400")} />
            <div className={cn("text-sm font-bold tabular-nums", meta.pending_count > 0 ? "text-amber-700" : "text-slate-400")}>
              {meta.pending_count}
            </div>
            <div className={cn("text-[9px]", meta.pending_count > 0 ? "text-amber-500" : "text-slate-400")}>Pending</div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2 text-center">
            <CheckCircle2 className="h-3 w-3 text-emerald-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-emerald-700 tabular-nums">{approvedCount}</div>
            <div className="text-[9px] text-emerald-500">Approved</div>
          </div>
        </div>

        {/* Pending amount */}
        {meta.pending_amount > 0 && (
          <div className="flex items-center justify-between text-[10px] px-1">
            <span className="text-slate-500 flex items-center gap-1">
              <Receipt className="h-3 w-3" /> Pending amount
            </span>
            <span className="font-bold text-amber-600 tabular-nums">{formatCurrency(meta.pending_amount)}</span>
          </div>
        )}

        {/* Approved amount */}
        <div className="flex items-center justify-between text-[10px] px-1">
          <span className="text-slate-500">Approved amount</span>
          <span className="font-bold text-emerald-600 tabular-nums">{formatCurrency(approvedAmount)}</span>
        </div>

        {/* Total claims */}
        <div className="flex items-center justify-between text-[10px] px-1">
          <span className="text-slate-500">Total claims</span>
          <span className="font-bold text-slate-700 tabular-nums">{meta.total_count}</span>
        </div>

        {/* Pending alert */}
        {meta.pending_count > 5 && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-2 flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-semibold text-amber-700">
              {meta.pending_count} expense{meta.pending_count !== 1 ? "s" : ""} awaiting approval
            </p>
          </div>
        )}

        {/* All clear */}
        {meta.pending_count === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              All expenses processed
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
