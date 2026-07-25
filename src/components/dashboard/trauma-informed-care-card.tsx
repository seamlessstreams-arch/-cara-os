"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — TRAUMA INFORMED CARE CARD
// Live data from health intelligence engine.
// CHR 2015 Reg 12, Reg 34. SCCIF: Helped & Protected.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, ChevronRight, Heart, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { HealthWellbeingResult } from "@/lib/engines/health-wellbeing-engine";

interface HealthWellbeingResponse { data: HealthWellbeingResult; }

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

export function TraumaInformedCareCard() {
  const { data, isLoading } = useQuery<HealthWellbeingResponse>({
    queryKey: ["health-wellbeing"],
    queryFn: () => api.get<HealthWellbeingResponse>("/health-wellbeing"),
    refetchInterval: 45_000,
  });

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
  const alerts = d?.alerts ?? [];

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-slate-600" />
            <span className="text-slate-900">Trauma-Informed Care</span>
          </CardTitle>
          <Link href="/health" className="text-xs text-slate-600 hover:underline flex items-center gap-1">
            View <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{d?.camhs?.active_referrals ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Referrals</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{d?.camhs?.total_sessions_held ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Sessions</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", (d?.camhs?.disengaged_count ?? 0) > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (d?.camhs?.disengaged_count ?? 0) > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{d?.camhs?.disengaged_count ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Disengaged</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">{d?.compliance?.total_children ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Alerts
            </p>
            {alerts.slice(0, 3).map((a, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", ALERT_STYLES[a.severity] ?? ALERT_STYLES.medium)}>
                {a.message}
              </div>
            ))}
          </div>
        )}

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Trauma-Informed Care Intelligence
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
