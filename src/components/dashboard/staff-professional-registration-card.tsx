"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF PROFESSIONAL REGISTRATION CARD
// Live data from workforce intelligence engine.
// CHR 2015 Reg 12, Reg 34. SCCIF: Helped & Protected.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BadgeCheck, Brain, ChevronRight, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate } from "@/lib/metrics/rate";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function StaffProfessionalRegistrationCard() {
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
            <BadgeCheck className="h-4 w-4 text-slate-600" />
            <span className="text-slate-900">Professional Registration</span>
          </CardTitle>
          <Link href="/workforce" className="text-xs text-slate-600 hover:underline flex items-center gap-1">
            View <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">{d?.dbs?.total_staff ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{d?.dbs?.valid_dbs ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Valid</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", (d?.dbs?.expired_or_missing ?? 0) > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (d?.dbs?.expired_or_missing ?? 0) > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{d?.dbs?.expired_or_missing ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Expired</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className={cn("text-lg font-bold tabular-nums", d?.dbs?.compliance_rate == null ? "text-muted-foreground" : "text-green-600")}>{formatRate(d?.dbs?.compliance_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Rate %</p>
          </div>
        </div>

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Professional Registration Intelligence
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
