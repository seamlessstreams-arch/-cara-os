"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECORDS MANAGEMENT CARD
// Live data from qa intelligence engine.
// CHR 2015 Reg 12, Reg 34. SCCIF: Helped & Protected.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, ChevronRight, FolderOpen, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { QualityAssuranceIntelligenceResult } from "@/lib/engines/quality-assurance-intelligence-engine";

interface QualityAssuranceIntelligenceResponse {
  data: QualityAssuranceIntelligenceResult;
}

function useQualityAssuranceIntelligence() {
  return useQuery({
    queryKey: ["quality-assurance-intelligence"],
    queryFn: () =>
      api.get<QualityAssuranceIntelligenceResponse>(
        "/quality-assurance-intelligence"
      ),
    refetchInterval: 60_000,
  });
}

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

export function RecordsManagementCard() {
  const { data, isLoading } = useQualityAssuranceIntelligence();

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
            <FolderOpen className="h-4 w-4 text-slate-600" />
            <span className="text-slate-900">Records Management</span>
          </CardTitle>
          <Link href="/quality-of-care" className="text-xs text-slate-600 hover:underline flex items-center gap-1">
            View <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">{d?.overview?.total_actions ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Actions</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{d?.overview?.actions_completed ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Done</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", (d?.overview?.actions_overdue ?? 0) > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (d?.overview?.actions_overdue ?? 0) > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{d?.overview?.actions_overdue ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{Math.round(d?.overview?.recommendation_completion_rate ?? 0)}%</p>
            <p className="text-[10px] text-muted-foreground">Rate %</p>
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
              Cara Records Management Intelligence
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
