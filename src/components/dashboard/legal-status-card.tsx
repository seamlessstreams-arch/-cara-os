"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — LEGAL STATUS CARD
// Live data from safeguarding intelligence engine.
// CHR 2015 Reg 12, Reg 34. SCCIF: Helped & Protected.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain, ChevronRight, Loader2, Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { SafeguardingIntelligenceResult } from "@/lib/engines/safeguarding-intelligence-engine";

interface SafeguardingIntelligenceResponse {
  data: SafeguardingIntelligenceResult;
}

function useSafeguardingIntelligence() {
  return useQuery({
    queryKey: ["safeguarding-intelligence"],
    queryFn: () => api.get<SafeguardingIntelligenceResponse>("/safeguarding-intelligence"),
    refetchInterval: 30_000, // 30 second refresh (safeguarding data is critical)
  });
}

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function LegalStatusCard() {
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
  const insights = d?.insights ?? [];

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4 text-slate-600" />
            <span className="text-slate-900">Legal Status</span>
          </CardTitle>
          <Link href="/safeguarding" className="text-xs text-slate-600 hover:underline flex items-center gap-1">
            View <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">{d?.risk_assessments?.total_current ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Assessments</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", (d?.risk_assessments?.high_or_very_high ?? 0) > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (d?.risk_assessments?.high_or_very_high ?? 0) > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{d?.risk_assessments?.high_or_very_high ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">High+</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", (d?.risk_assessments?.overdue_reviews ?? 0) > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (d?.risk_assessments?.overdue_reviews ?? 0) > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{d?.risk_assessments?.overdue_reviews ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{d?.risk_assessments?.improving_trend ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Improving</p>
          </div>
        </div>

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Legal Status Intelligence
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
