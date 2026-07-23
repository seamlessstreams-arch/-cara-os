"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANDATORY REFRESHER TRAINING CARD
// Live data from useWorkforceIntelligence() — training compliance per category.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ChevronRight, Brain, Loader2, BookCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meanOf, meets } from "@/lib/metrics/rate";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function StaffMandatoryRefresherTrainingCard() {
  const { data, isLoading } = useWorkforceIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-amber-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const { training } = d;
  const avgCompliance = meanOf(training.map((t) => t.compliance_rate));
  const totalExpiring = training.reduce((sum, t) => sum + t.expiring_soon, 0);
  const totalExpired = training.reduce((sum, t) => sum + t.expired, 0);

  return (
    <Card className="overflow-hidden border-amber-200">
      <CardHeader className="pb-3 bg-amber-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-amber-600" />
            <span className="text-amber-900">Refresher Training</span>
          </CardTitle>
          <Link href="/workforce" className="text-xs text-amber-600 hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Summary strip ──────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", meets(avgCompliance, 90) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(avgCompliance, 90) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(avgCompliance)}</p>
            <p className="text-[10px] text-muted-foreground">Avg Comp.</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", totalExpiring > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", totalExpiring > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{totalExpiring}</p>
            <p className="text-[10px] text-muted-foreground">Expiring</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", totalExpired > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", totalExpired > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{totalExpired}</p>
            <p className="text-[10px] text-muted-foreground">Expired</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-amber-50">
            <p className="text-lg font-bold tabular-nums text-amber-600">{training.length}</p>
            <p className="text-[10px] text-muted-foreground">Categories</p>
          </div>
        </div>

        {/* ── Training bars ───────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <BookCheck className="h-3 w-3" />Compliance by Category
          </p>
          <div className="space-y-1">
            {training.map((t, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate">{t.category}</span>
                  <span className={cn("font-bold tabular-nums", meets(t.compliance_rate, 90) ? "text-[--cs-success]" : meets(t.compliance_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{formatRate(t.compliance_rate)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", meets(t.compliance_rate, 90) ? "bg-green-500" : meets(t.compliance_rate, 70) ? "bg-amber-500" : "bg-red-500")}
                    style={{ width: `${t.compliance_rate ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Cara insights ──────────────────────────────────────────── */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />Cara Insights
            </p>
            {d.insights.map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity])}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
