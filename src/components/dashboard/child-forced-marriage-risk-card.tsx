"use client";

// ════════════════════════���═════════════════════════════════════════════════════
// CORNERSTONE — CHILD FORCED MARRIAGE RISK CARD
// Live data from safeguarding intelligence engine.
// CHR 2015 Reg 12, Reg 34. SCCIF: Helped & Protected.
// ═══════════════════════════════��══════════════════════════════���═══════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldAlert, ChevronRight, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSafeguardingIntelligence } from "@/hooks/use-safeguarding-intelligence";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

export function ChildForcedMarriageRiskCard() {
  const { data, isLoading } = useSafeguardingIntelligence();

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
  const risk = d?.risk_assessments;
  const insights = d?.insights ?? [];

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-slate-600" />
            <span className="text-slate-900">Forced Marriage Risk</span>
          </CardTitle>
          <Link href="/safeguarding" className="text-xs text-slate-600 hover:underline flex items-center gap-1">
            Safeguarding <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">{risk?.total_current ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", (risk?.high_or_very_high ?? 0) > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (risk?.high_or_very_high ?? 0) > 0 ? "text-red-600" : "text-green-600")}>{risk?.high_or_very_high ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">High+</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", (risk?.overdue_reviews ?? 0) > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (risk?.overdue_reviews ?? 0) > 0 ? "text-amber-600" : "text-green-600")}>{risk?.overdue_reviews ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", (risk?.worsening_trend ?? 0) === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (risk?.worsening_trend ?? 0) === 0 ? "text-green-600" : "text-red-600")}>{risk?.worsening_trend ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Worsening</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Risk Trends</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded border p-2 text-center">
              <p className="font-semibold text-green-600">{risk?.improving_trend ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Improving</p>
            </div>
            <div className="rounded border p-2 text-center">
              <p className="font-semibold text-blue-600">{risk?.stable_trend ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Stable</p>
            </div>
            <div className="rounded border p-2 text-center">
              <p className="font-semibold text-red-600">{risk?.worsening_trend ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Worsening</p>
            </div>
          </div>
        </div>

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Marriage Risk Intelligence
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
