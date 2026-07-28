"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF GRIEVANCE INTELLIGENCE CARD
// Live data from useWorkforceIntelligence() — sickness, profile, staffing.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileWarning, ChevronRight, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { WorkforceIntelligenceResult } from "@/lib/engines/workforce-intelligence-engine";

interface WorkforceIntelligenceResponse {
  data: WorkforceIntelligenceResult;
}

function useWorkforceIntelligence() {
  return useQuery({
    queryKey: ["workforce-intelligence"],
    queryFn: () => api.get<WorkforceIntelligenceResponse>("/workforce-intelligence"),
    refetchInterval: 60_000, // 60 second refresh (workforce data changes less frequently)
  });
}

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function StaffGrievanceCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-brand" />
            Staff Grievance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { profile, sickness, staffing, supervision } = intel;
  const supervisionRate = supervision.total_staff_requiring > 0
    ? Math.round((supervision.up_to_date / supervision.total_staff_requiring) * 100)
    : 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-brand" />
            Staff Grievance
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{profile.active_staff}</p>
            <p className="text-[10px] text-muted-foreground">Staff</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", sickness.staff_with_sickness === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", sickness.staff_with_sickness === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{sickness.staff_with_sickness}</p>
            <p className="text-[10px] text-muted-foreground">Sick</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", supervisionRate >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", supervisionRate >= 90 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{supervisionRate}%</p>
            <p className="text-[10px] text-muted-foreground">Supervision</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", staffing.shifts_unfilled === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", staffing.shifts_unfilled === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{staffing.shifts_unfilled}</p>
            <p className="text-[10px] text-muted-foreground">Unfilled</p>
          </div>
        </div>

        {/* ── Overdue supervision ─────────────────────────────────────── */}

        {supervision.staff_overdue.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Supervision Overdue</p>
            {supervision.staff_overdue.slice(0, 3).map((s) => (
              <div key={s.staff_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <span className="font-medium">{s.staff_name}</span>
                <Badge className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">{s.days_overdue}d overdue</Badge>
              </div>
            ))}
          </div>
        )}

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Grievance Intelligence
            </p>
            {intel.insights.slice(0, 2).map((insight, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive,
                )}
              >
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
