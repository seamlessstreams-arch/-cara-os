"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF DBS RENEWAL TRACKING CARD
// Dashboard card powered by the Workforce Intelligence Engine.
// Tracks DBS compliance, expiry, and update service enrolment.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, ChevronRight, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning:  "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

// ── Component ───────────────────────────────────────────────────────────────

export function StaffDbsRenewalTrackingCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand" />
            DBS Renewal Tracking
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

  const d = intel.dbs;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand" />
            DBS Renewal Tracking
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", meets(d.compliance_rate, 100) ? "bg-green-50" : meets(d.compliance_rate, 90) ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(d.compliance_rate, 100) ? "text-[--cs-success]" : meets(d.compliance_rate, 90) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{formatRate(d.compliance_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Compliance</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{d.valid_dbs}</p>
            <p className="text-[10px] text-muted-foreground">Valid</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", d.expired_or_missing === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", d.expired_or_missing === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{d.expired_or_missing}</p>
            <p className="text-[10px] text-muted-foreground">Expired</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{d.update_service_enrolled}</p>
            <p className="text-[10px] text-muted-foreground">Update Svc</p>
          </div>
        </div>

        {/* ── DBS detail ──────────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold">DBS Overview</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-28 text-muted-foreground">Total staff</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(d.valid_dbs / d.total_staff) * 100}%` }} />
              </div>
              <span className="w-14 text-right tabular-nums font-medium">{d.valid_dbs}/{d.total_staff}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-28 text-muted-foreground">Update service</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full" style={{ width: `${(d.update_service_enrolled / d.total_staff) * 100}%` }} />
              </div>
              <span className="w-14 text-right tabular-nums font-medium">{d.update_service_enrolled}/{d.total_staff}</span>
            </div>
          </div>
        </div>

        {/* ── Cara Intelligence ───────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara DBS Intelligence
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
