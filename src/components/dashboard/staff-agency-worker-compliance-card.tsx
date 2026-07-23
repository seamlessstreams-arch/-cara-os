"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — AGENCY WORKER COMPLIANCE CARD
// Live data from useWorkforceIntelligence() — DBS, coverage, bank/agency staff.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronRight, Brain, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function StaffAgencyWorkerComplianceCard() {
  const { data, isLoading } = useWorkforceIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-emerald-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const { profile, dbs, staffing } = d;

  return (
    <Card className="overflow-hidden border-emerald-200">
      <CardHeader className="pb-3 bg-emerald-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <span className="text-emerald-900">Agency Compliance</span>
          </CardTitle>
          <Link href="/workforce" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Summary strip ──────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg p-2 bg-emerald-50">
            <p className="text-lg font-bold tabular-nums text-emerald-600">{profile.bank_agency}</p>
            <p className="text-[10px] text-muted-foreground">Bank/Agency</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", meets(dbs.compliance_rate, 95) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(dbs.compliance_rate, 95) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(dbs.compliance_rate)}</p>
            <p className="text-[10px] text-muted-foreground">DBS %</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", meets(staffing.coverage_rate, 95) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(staffing.coverage_rate, 95) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(staffing.coverage_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Coverage</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-emerald-50">
            <p className="text-lg font-bold tabular-nums text-emerald-600">{profile.active_staff}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
        </div>

        {/* ── DBS detail ──────────────────────────────────────────────── */}
        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />DBS Compliance
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Valid DBS</span>
              <span className="font-bold tabular-nums text-green-600">{dbs.valid_dbs}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Update Service</span>
              <span className="font-bold tabular-nums text-blue-600">{dbs.update_service_enrolled}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Expired/Missing</span>
              <span className={cn("font-bold tabular-nums", dbs.expired_or_missing > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{dbs.expired_or_missing}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total Staff</span>
              <span className="font-bold tabular-nums">{dbs.total_staff}</span>
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
