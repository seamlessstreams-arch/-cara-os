"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFFING COVERAGE CARD
// Live data from workforce intelligence engine.
// CHR 2015 Reg 12, Reg 34. SCCIF: Helped & Protected.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain, ChevronRight, Loader2, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate } from "@/lib/metrics/rate";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function StaffingCoverageCard() {
  const { data, isLoading } = useWorkforceIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  const insights = d?.insights ?? [];

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-600" />
            <span className="text-slate-900">Staffing Coverage</span>
          </CardTitle>
          <Link href="/workforce" className="text-xs text-slate-600 hover:underline flex items-center gap-1">
            View <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">{d?.staffing?.shifts_this_week ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Shifts</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{d?.staffing?.shifts_filled ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Filled</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", (d?.staffing?.shifts_unfilled ?? 0) > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (d?.staffing?.shifts_unfilled ?? 0) > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{d?.staffing?.shifts_unfilled ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Unfilled</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className={cn("text-lg font-bold tabular-nums", d?.staffing?.coverage_rate == null ? "text-muted-foreground" : "text-green-600")}>{formatRate(d?.staffing?.coverage_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Rate %</p>
          </div>
        </div>

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Staffing Coverage Intelligence
            </p>
            {insights.slice(0, 2).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
