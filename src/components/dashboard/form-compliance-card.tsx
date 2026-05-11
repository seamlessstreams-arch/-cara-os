"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FORM COMPLIANCE CARD
// Dashboard widget showing care form completion and approval pipeline.
// Regulatory requirement: all care forms must be completed, reviewed,
// and approved in a timely manner.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useForms } from "@/hooks/use-forms";
import { cn } from "@/lib/utils";
import {
  FileText, Loader2, AlertTriangle, CheckCircle2,
  Clock, FilePen, FileCheck2, AlertCircle,
} from "lucide-react";

// ── Component ───────────────────────────────────────────────────────────────

export function FormComplianceCard() {
  const { data, isPending } = useForms();
  const meta = data?.meta;

  if (isPending) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <FileText className="h-4 w-4 text-sky-500" />
            Care Forms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!meta) return null;

  const hasAlert = meta.overdue > 0 || meta.urgent > 0;

  return (
    <Card className={cn(hasAlert && "border-sky-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <FileText className="h-4 w-4 text-sky-500" />
            Care Forms
          </CardTitle>
          <Link href="/forms">
            <Badge className="text-[9px] bg-sky-100 text-sky-700 border-0 rounded-full hover:bg-sky-200 cursor-pointer">
              View all
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-emerald-50 p-2 text-center">
            <FileCheck2 className="h-3 w-3 text-emerald-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-emerald-700 tabular-nums">{meta.approved}</div>
            <div className="text-[9px] text-emerald-500">Approved</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", meta.pending_review > 0 ? "bg-amber-50" : "bg-[var(--cs-surface)]")}>
            <Clock className={cn("h-3 w-3 mx-auto mb-0.5", meta.pending_review > 0 ? "text-amber-500" : "text-[var(--cs-text-muted)]")} />
            <div className={cn("text-sm font-bold tabular-nums", meta.pending_review > 0 ? "text-amber-700" : "text-[var(--cs-text-muted)]")}>
              {meta.pending_review}
            </div>
            <div className={cn("text-[9px]", meta.pending_review > 0 ? "text-amber-500" : "text-[var(--cs-text-muted)]")}>Pending</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", meta.draft > 0 ? "bg-blue-50" : "bg-[var(--cs-surface)]")}>
            <FilePen className={cn("h-3 w-3 mx-auto mb-0.5", meta.draft > 0 ? "text-blue-500" : "text-[var(--cs-text-muted)]")} />
            <div className={cn("text-sm font-bold tabular-nums", meta.draft > 0 ? "text-blue-700" : "text-[var(--cs-text-muted)]")}>
              {meta.draft}
            </div>
            <div className={cn("text-[9px]", meta.draft > 0 ? "text-blue-500" : "text-[var(--cs-text-muted)]")}>Draft</div>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between text-[10px] px-1">
          <span className="text-[var(--cs-text-muted)]">Total forms</span>
          <span className="font-bold text-[var(--cs-text-secondary)] tabular-nums">{meta.total}</span>
        </div>

        {/* Completion rate */}
        {meta.total > 0 && (
          <div className="flex items-center justify-between text-[10px] px-1">
            <span className="text-[var(--cs-text-muted)]">Completion rate</span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-16 rounded-full bg-[var(--cs-surface)] overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    Math.round((meta.approved / meta.total) * 100) >= 80 ? "bg-emerald-500"
                    : Math.round((meta.approved / meta.total) * 100) >= 50 ? "bg-amber-500"
                    : "bg-red-500"
                  )}
                  style={{ width: `${Math.round((meta.approved / meta.total) * 100)}%` }}
                />
              </div>
              <span className="font-bold text-[var(--cs-text-secondary)] tabular-nums">
                {Math.round((meta.approved / meta.total) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Overdue alert */}
        {meta.overdue > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2 flex items-start gap-2">
            <AlertCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-red-700">
                {meta.overdue} form{meta.overdue !== 1 ? "s" : ""} overdue
              </p>
              <p className="text-[10px] text-red-600">
                Immediate completion required for regulatory compliance
              </p>
            </div>
          </div>
        )}

        {/* Urgent alert */}
        {meta.urgent > 0 && meta.overdue === 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-2 flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-semibold text-amber-700">
              {meta.urgent} urgent form{meta.urgent !== 1 ? "s" : ""} require attention
            </p>
          </div>
        )}

        {/* All clear */}
        {meta.overdue === 0 && meta.urgent === 0 && meta.pending_review === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              All forms up to date
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
