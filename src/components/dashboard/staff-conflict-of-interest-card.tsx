"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF CONFLICT OF INTEREST CARD
// Live data from useWorkforceIntelligence() — profile, DBS, training.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert, ChevronRight, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meanOf, meets } from "@/lib/metrics/rate";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function StaffConflictOfInterestCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-brand" />
            Conflict of Interest
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

  const { profile, dbs, training } = intel;
  const avgTraining = meanOf(training.map((t) => t.compliance_rate));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-brand" />
            Conflict of Interest
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
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", meets(dbs.compliance_rate, 95) ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(dbs.compliance_rate, 95) ? "text-[--cs-success]" : "text-[--cs-risk]")}>{formatRate(dbs.compliance_rate)}</p>
            <p className="text-[10px] text-muted-foreground">DBS</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", avgTraining === null ? "bg-slate-50" : avgTraining >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", avgTraining === null ? "text-[var(--cs-text-muted)]" : avgTraining >= 90 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(avgTraining)}</p>
            <p className="text-[10px] text-muted-foreground">Training</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", profile.on_probation === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", profile.on_probation === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{profile.on_probation}</p>
            <p className="text-[10px] text-muted-foreground">Probation</p>
          </div>
        </div>

        {/* ── Compliance overview ─────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold">Compliance Overview</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border p-2">
              <span className="text-muted-foreground">DBS valid:</span>{" "}
              <span className="font-semibold">{dbs.valid_dbs}/{dbs.total_staff}</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Update service:</span>{" "}
              <span className="font-semibold">{dbs.update_service_enrolled}</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Expired/Missing:</span>{" "}
              <span className="font-semibold text-red-600">{dbs.expired_or_missing}</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Bank/Agency:</span>{" "}
              <span className="font-semibold">{profile.bank_agency}</span>
            </div>
          </div>
        </div>

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Integrity Intelligence
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
