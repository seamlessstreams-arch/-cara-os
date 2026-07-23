"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — NVQ QUALIFICATION TRACKING CARD
// Live data from useWorkforceIntelligence() — training categories detail.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ChevronRight, Brain, Loader2, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function StaffNvqQualificationTrackingCard() {
  const { data, isLoading } = useWorkforceIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-sky-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const { training } = d;
  const totalCompliant = training.reduce((sum, t) => sum + t.compliant, 0);
  const totalExpiring = training.reduce((sum, t) => sum + t.expiring_soon, 0);
  const totalExpired = training.reduce((sum, t) => sum + t.expired, 0);

  return (
    <Card className="overflow-hidden border-sky-200">
      <CardHeader className="pb-3 bg-sky-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-sky-600" />
            <span className="text-sky-900">NVQ Tracking</span>
          </CardTitle>
          <Link href="/workforce" className="text-xs text-sky-600 hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Summary strip ──────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg p-2 bg-sky-50">
            <p className="text-lg font-bold tabular-nums text-sky-600">{training.length}</p>
            <p className="text-[10px] text-muted-foreground">Categories</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-green-50">
            <p className="text-lg font-bold tabular-nums text-green-600">{totalCompliant}</p>
            <p className="text-[10px] text-muted-foreground">Compliant</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", totalExpiring > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", totalExpiring > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{totalExpiring}</p>
            <p className="text-[10px] text-muted-foreground">Expiring</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", totalExpired > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", totalExpired > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{totalExpired}</p>
            <p className="text-[10px] text-muted-foreground">Expired</p>
          </div>
        </div>

        {/* ── Training detail ─────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Award className="h-3 w-3" />Training Categories
          </p>
          <div className="space-y-1">
            {training.map((t, i) => (
              <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Award className="h-3 w-3 text-sky-500 shrink-0" />
                  <span className="font-medium truncate">{t.category}</span>
                  <span className="text-muted-foreground">{t.compliant}/{t.total_required}</span>
                </div>
                <Badge variant="outline" className={cn("text-[10px] shrink-0", meets(t.compliance_rate, 90) ? "text-green-700 bg-green-50 border-green-200" : meets(t.compliance_rate, 70) ? "text-amber-700 bg-amber-50 border-amber-200" : "text-red-700 bg-red-50 border-red-200")}>
                  {formatRate(t.compliance_rate)}
                </Badge>
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
