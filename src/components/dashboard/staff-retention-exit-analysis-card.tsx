"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF RETENTION & PROFILE INTELLIGENCE CARD
// Dashboard card for turnover, vacancies, and workforce profile breakdown.
// Powered by the Workforce Intelligence Engine — live data.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserMinus, ChevronRight, Brain, Loader2,
  Users, Briefcase,
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

// ── Insight styling ──────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

// ── Component ────────────────────────────────────────────────────────────────

export function StaffRetentionExitAnalysisCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserMinus className="h-4 w-4 text-brand" />
            Staff Retention
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

  const p = intel.profile;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserMinus className="h-4 w-4 text-brand" />
            Staff Retention
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{p.total_staff}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{p.active_staff}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", p.bank_agency === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", p.bank_agency === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {p.bank_agency}
            </p>
            <p className="text-[10px] text-muted-foreground">Bank/Agency</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{p.average_tenure_months}</p>
            <p className="text-[10px] text-muted-foreground">Avg Tenure (m)</p>
          </div>
        </div>

        {/* ── Profile breakdown ───────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            Workforce Profile
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total staff</span>
              <span className="font-semibold tabular-nums">{p.total_staff}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active</span>
              <span className="font-semibold tabular-nums">{p.active_staff}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Full-time</span>
              <span className="font-semibold tabular-nums">{p.full_time}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Part-time</span>
              <span className="font-semibold tabular-nums">{p.part_time}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Bank/Agency</span>
              <span className="font-semibold tabular-nums">{p.bank_agency}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">On probation</span>
              <span className="font-semibold tabular-nums">{p.on_probation}</span>
            </div>
          </div>

          {/* Staff composition bar */}
          {p.total_staff > 0 && (
            <div className="space-y-0.5">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-400" style={{ width: `${(p.full_time / p.total_staff) * 100}%` }} title="Full-time" />
                <div className="h-full bg-emerald-400" style={{ width: `${(p.part_time / p.total_staff) * 100}%` }} title="Part-time" />
                <div className="h-full bg-amber-400" style={{ width: `${(p.bank_agency / p.total_staff) * 100}%` }} title="Bank/Agency" />
              </div>
              <div className="flex gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />FT</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />PT</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Bank</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Retention Intelligence
            </p>
            {intel.insights.map((insight, i) => (
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
