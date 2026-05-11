"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — OUTCOMES PROGRESS CARD
// Dashboard widget showing young people's progress across care plan domains.
// Ofsted ILACS primary focus: "Are children making progress?"
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOutcomes } from "@/hooks/use-outcomes";
import { cn } from "@/lib/utils";
import {
  Target, Loader2, TrendingUp, TrendingDown, Minus,
  Star, AlertTriangle, CheckCircle2,
} from "lucide-react";

// ── Component ───────────────────────────────────────────────────────────────

export function OutcomesProgressCard() {
  const { data, isPending } = useOutcomes();
  const meta = data?.meta;

  if (isPending) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Target className="h-4 w-4 text-indigo-500" />
            Outcomes Progress
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

  const hasAlert = meta.declining > 0 || meta.reviews_due_soon > 3;

  return (
    <Card className={cn(hasAlert && "border-indigo-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Target className="h-4 w-4 text-indigo-500" />
            Outcomes Progress
          </CardTitle>
          <Link href="/outcomes">
            <Badge className="text-[9px] bg-indigo-100 text-indigo-700 border-0 rounded-full hover:bg-indigo-200 cursor-pointer">
              View all
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-indigo-50 p-2 text-center">
            <Target className="h-3 w-3 text-indigo-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-indigo-700 tabular-nums">{meta.active_targets}</div>
            <div className="text-[9px] text-indigo-500">Active</div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2 text-center">
            <TrendingUp className="h-3 w-3 text-emerald-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-emerald-700 tabular-nums">{meta.improving}</div>
            <div className="text-[9px] text-emerald-500">Improving</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", meta.declining > 0 ? "bg-red-50" : "bg-[var(--cs-surface)]")}>
            <TrendingDown className={cn("h-3 w-3 mx-auto mb-0.5", meta.declining > 0 ? "text-red-500" : "text-[var(--cs-text-muted)]")} />
            <div className={cn("text-sm font-bold tabular-nums", meta.declining > 0 ? "text-red-700" : "text-[var(--cs-text-muted)]")}>{meta.declining}</div>
            <div className={cn("text-[9px]", meta.declining > 0 ? "text-red-500" : "text-[var(--cs-text-muted)]")}>Declining</div>
          </div>
        </div>

        {/* Average rating */}
        <div className="flex items-center justify-between text-[10px] px-1">
          <span className="text-[var(--cs-text-muted)]">Average rating</span>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-2.5 w-2.5",
                    i < Math.round(meta.avg_rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-[var(--cs-text-gentle)]"
                  )}
                />
              ))}
            </div>
            <span className="font-bold text-[var(--cs-text-secondary)] tabular-nums">{meta.avg_rating}/5</span>
          </div>
        </div>

        {/* Stable count */}
        <div className="flex items-center justify-between text-[10px] px-1">
          <span className="text-[var(--cs-text-muted)] flex items-center gap-1">
            <Minus className="h-3 w-3" /> Stable
          </span>
          <span className="font-bold text-amber-600 tabular-nums">{meta.stable}</span>
        </div>

        {/* Achieved count */}
        {meta.achieved > 0 && (
          <div className="flex items-center justify-between text-[10px] px-1">
            <span className="text-[var(--cs-text-muted)] flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Achieved
            </span>
            <span className="font-bold text-emerald-600 tabular-nums">{meta.achieved}</span>
          </div>
        )}

        {/* Declining alert */}
        {meta.declining > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2 flex items-start gap-2">
            <TrendingDown className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-red-700">
                {meta.declining} area{meta.declining !== 1 ? "s" : ""} declining
              </p>
              <p className="text-[10px] text-red-600">
                Immediate review and intervention planning required
              </p>
            </div>
          </div>
        )}

        {/* Reviews due */}
        {meta.reviews_due_soon > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-2 flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-semibold text-amber-700">
              {meta.reviews_due_soon} review{meta.reviews_due_soon !== 1 ? "s" : ""} due soon
            </p>
          </div>
        )}

        {/* All clear */}
        {meta.declining === 0 && meta.reviews_due_soon === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              All outcomes on track
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
