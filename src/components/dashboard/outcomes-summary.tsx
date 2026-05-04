"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — OUTCOMES SUMMARY WIDGET
// Dashboard card showing young people's progress at a glance.
// Highlights declining areas requiring attention.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOutcomes } from "@/hooks/use-outcomes";
import { getYPName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Target, TrendingUp, TrendingDown, Minus, Star, Loader2,
  ChevronRight, AlertTriangle, User,
} from "lucide-react";

export function OutcomesSummary() {
  const { data, isLoading } = useOutcomes();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Target className="h-4 w-4 text-indigo-500" />
            Outcomes
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

  const meta      = data?.meta;
  const perChild  = data?.per_child ?? [];
  const targets   = data?.data ?? [];
  const declining = targets.filter((t) => t.direction === "declining" && t.status === "active");

  if (!meta) return null;

  return (
    <Card className={cn(declining.length > 0 && "border-red-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Target className="h-4 w-4 text-indigo-500" />
            Outcomes
          </CardTitle>
          <Link href="/outcomes">
            <Badge className="text-[9px] bg-indigo-100 text-indigo-700 border-0 rounded-full hover:bg-indigo-200 cursor-pointer">
              {meta.active_targets} targets
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* Direction summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px]">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-emerald-700 font-semibold">{meta.improving}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <Minus className="h-3 w-3 text-amber-500" />
            <span className="text-amber-700 font-semibold">{meta.stable}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <TrendingDown className="h-3 w-3 text-red-500" />
            <span className={cn("font-semibold", meta.declining > 0 ? "text-red-700" : "text-slate-400")}>{meta.declining}</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < Math.round(meta.avg_rating) ? "text-amber-400 fill-amber-400" : "text-slate-200",
                )}
              />
            ))}
            <span className="text-[10px] text-slate-400 ml-1">{meta.avg_rating}</span>
          </div>
        </div>

        {/* Per child bars */}
        {perChild.map((child) => {
          const total = child.active_targets;
          if (total === 0) return null;
          const improvPct = Math.round((child.improving / total) * 100);
          const stablePct = Math.round((child.stable / total) * 100);
          const declPct   = 100 - improvPct - stablePct;
          return (
            <Link key={child.child_id} href={`/outcomes?child=${child.child_id}`}>
              <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors">
                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <User className="h-3 w-3 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[11px] font-medium text-slate-700">{getYPName(child.child_id)}</p>
                    <span className={cn(
                      "text-[10px] font-semibold",
                      child.avg_rating >= 3.5 ? "text-emerald-600" : child.avg_rating >= 2.5 ? "text-amber-600" : "text-red-600",
                    )}>
                      {child.avg_rating}
                    </span>
                  </div>
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-100">
                    {improvPct > 0 && <div className="bg-emerald-400" style={{ width: `${improvPct}%` }} />}
                    {stablePct > 0 && <div className="bg-amber-300" style={{ width: `${stablePct}%` }} />}
                    {declPct > 0 && <div className="bg-red-400" style={{ width: `${declPct}%` }} />}
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
              </div>
            </Link>
          );
        })}

        {/* Declining alert */}
        {declining.length > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              <p className="text-[10px] font-semibold text-red-700">Declining areas</p>
            </div>
            {declining.slice(0, 3).map((t) => (
              <p key={t.id} className="text-[10px] text-red-600 ml-4">
                {getYPName(t.child_id)} — {t.target_description.slice(0, 50)}...
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
