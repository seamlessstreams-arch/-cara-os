"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — REG45 REPORTS CARD
// Live data from qa intelligence engine.
// CHR 2015 Reg 12, Reg 34. SCCIF: Helped & Protected.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, ChevronRight, FileText, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQualityAssuranceIntelligence } from "@/hooks/use-quality-assurance-intelligence";

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

export function Reg45ReportsCard() {
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
            <FileText className="h-4 w-4 text-slate-600" />
            <span className="text-slate-900">Reg 45 Reports</span>
          </CardTitle>
          <Link href="/quality-of-care" className="text-xs text-slate-600 hover:underline flex items-center gap-1">
            View <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">{d?.overview?.total_audits ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Audits</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{d?.overview?.audits_last_90_days ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Last 90d</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{d?.overview?.strengths_count ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Strengths</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", (d?.overview?.improvements_count ?? 0) > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (d?.overview?.improvements_count ?? 0) > 0 ? "text-amber-600" : "text-green-600")}>{d?.overview?.improvements_count ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Improve</p>
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
              ARIA Reg 45 Reports Intelligence
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
