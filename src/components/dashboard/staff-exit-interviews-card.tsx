"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF EXIT INTERVIEWS CARD
// Live data from useWorkforceIntelligence() — turnover, vacancies, profile.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserMinus, ChevronRight, Brain, Loader2, Users } from "lucide-react";
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

export function StaffExitInterviewsCard() {
  const { data, isLoading } = useWorkforceIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-rose-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-rose-600" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const { profile } = d;

  return (
    <Card className="overflow-hidden border-rose-200">
      <CardHeader className="pb-3 bg-rose-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserMinus className="h-4 w-4 text-rose-600" />
            <span className="text-rose-900">Exit Interviews</span>
          </CardTitle>
          <Link href="/workforce" className="text-xs text-rose-600 hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Summary strip ──────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", (profile.average_tenure_months ?? 0) < 12 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (profile.average_tenure_months ?? 0) < 12 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{profile.average_tenure_months}m</p>
            <p className="text-[10px] text-muted-foreground">Avg Tenure</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", profile.on_probation > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", profile.on_probation > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{profile.on_probation}</p>
            <p className="text-[10px] text-muted-foreground">Probation</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-green-50">
            <p className="text-lg font-bold tabular-nums text-green-600">{profile.active_staff}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-rose-50">
            <p className="text-lg font-bold tabular-nums text-rose-600">{profile.total_staff}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
        </div>

        {/* ── Profile data ────────────────────────────────────────────── */}
        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />Workforce Profile
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Full-Time</span>
              <span className="font-bold tabular-nums text-blue-600">{profile.full_time}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Part-Time</span>
              <span className="font-bold tabular-nums text-sky-600">{profile.part_time}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Bank/Agency</span>
              <span className="font-bold tabular-nums text-amber-600">{profile.bank_agency}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Avg Tenure</span>
              <span className={cn("font-bold tabular-nums", (profile.average_tenure_months ?? 0) < 12 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{profile.average_tenure_months}m</span>
            </div>
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
