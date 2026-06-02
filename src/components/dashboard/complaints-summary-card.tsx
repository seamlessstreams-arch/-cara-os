"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COMPLAINTS SUMMARY CARD
// Dashboard widget showing open complaints, statutory deadlines, escalation
// status, and safeguarding flags.
// Reg 39 — Complaints must be managed within statutory timescales.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useComplaints } from "@/hooks/use-complaints";
import { cn, formatRelative } from "@/lib/utils";
import {
  MessageCircleWarning, Loader2, AlertTriangle, CheckCircle2,
  Clock, Scale, ShieldAlert, ArrowUpRight,
} from "lucide-react";

const STAGE_LABELS: Record<string, string> = {
  stage_1: "Stage 1",
  stage_2: "Stage 2",
  ombudsman: "Ombudsman",
};

const STATUS_LABELS: Record<string, string> = {
  received: "Received",
  acknowledged: "Acknowledged",
  under_investigation: "Investigating",
  response_sent: "Response Sent",
  escalated: "Escalated",
  closed: "Closed",
};

// ── Component ───────────────────────────────────────────────────────────────

export function ComplaintsSummaryCard() {
  const { data, isPending } = useComplaints({ homeId: "home_oak" });
  const complaints = data?.data ?? [];

  const {
    total, open, overdue, escalated, withSafeguarding,
    urgentItems, hasAlert,
  } = useMemo(() => {
    const now = new Date();
    const open = complaints.filter((c) => c.status !== "closed");
    const overdue = open.filter((c) => {
      if (c.status === "received" && c.acknowledgement_due) {
        return new Date(c.acknowledgement_due) < now;
      }
      if (c.response_due && !c.response_sent_at) {
        return new Date(c.response_due) < now;
      }
      return false;
    });
    const escalated = complaints.filter((c) => c.stage === "stage_2" || c.stage === "ombudsman");
    const withSafeguarding = open.filter((c) => c.includes_safeguarding_element);

    // Urgent items: overdue or safeguarding-linked, sorted by response_due
    const urgentItems = open
      .filter((c) => {
        const isOverdue = overdue.some((o) => o.id === c.id);
        return isOverdue || c.includes_safeguarding_element;
      })
      .sort((a, b) => new Date(a.response_due).getTime() - new Date(b.response_due).getTime())
      .slice(0, 4);

    return {
      total: complaints.length,
      open: open.length,
      overdue: overdue.length,
      escalated: escalated.length,
      withSafeguarding: withSafeguarding.length,
      urgentItems,
      hasAlert: overdue.length > 0 || withSafeguarding.length > 0,
    };
  }, [complaints]);

  if (isPending) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <MessageCircleWarning className="h-4 w-4 text-orange-500" />
            Complaints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(hasAlert && "border-orange-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <MessageCircleWarning className="h-4 w-4 text-orange-500" />
            Complaints
          </CardTitle>
          <Link href="/complaints">
            <Badge className="text-[9px] bg-orange-100 text-orange-700 border-0 rounded-full hover:bg-orange-200 cursor-pointer">
              View all
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className={cn("rounded-xl p-2 text-center", open > 0 ? "bg-orange-50" : "bg-[var(--cs-surface)]")}>
            <MessageCircleWarning className={cn("h-3 w-3 mx-auto mb-0.5", open > 0 ? "text-orange-500" : "text-[var(--cs-text-muted)]")} />
            <div className={cn("text-sm font-bold tabular-nums", open > 0 ? "text-orange-700" : "text-[var(--cs-text-muted)]")}>{open}</div>
            <div className={cn("text-[9px]", open > 0 ? "text-orange-500" : "text-[var(--cs-text-muted)]")}>Open</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", overdue > 0 ? "bg-red-50" : "bg-[var(--cs-surface)]")}>
            <Clock className={cn("h-3 w-3 mx-auto mb-0.5", overdue > 0 ? "text-red-500" : "text-[var(--cs-text-muted)]")} />
            <div className={cn("text-sm font-bold tabular-nums", overdue > 0 ? "text-red-700" : "text-[var(--cs-text-muted)]")}>{overdue}</div>
            <div className={cn("text-[9px]", overdue > 0 ? "text-red-500" : "text-[var(--cs-text-muted)]")}>Overdue</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", escalated > 0 ? "bg-amber-50" : "bg-emerald-50")}>
            <ArrowUpRight className={cn("h-3 w-3 mx-auto mb-0.5", escalated > 0 ? "text-amber-500" : "text-emerald-500")} />
            <div className={cn("text-sm font-bold tabular-nums", escalated > 0 ? "text-amber-700" : "text-emerald-700")}>{escalated}</div>
            <div className={cn("text-[9px]", escalated > 0 ? "text-amber-500" : "text-emerald-500")}>Escalated</div>
          </div>
        </div>

        {/* Safeguarding flag */}
        {withSafeguarding > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2 flex items-start gap-2">
            <ShieldAlert className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-red-700">
                {withSafeguarding} complaint{withSafeguarding !== 1 ? "s" : ""} with safeguarding element
              </p>
              <p className="text-[10px] text-red-600">
                Must be referred to LADO alongside complaint investigation
              </p>
            </div>
          </div>
        )}

        {/* Overdue alert */}
        {overdue > 0 && (
          <div className="rounded-lg bg-orange-50 border border-orange-100 p-2 flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-orange-700">
                {overdue} complaint{overdue !== 1 ? "s" : ""} past statutory deadline
              </p>
              <p className="text-[10px] text-orange-600">
                Reg 39 requires acknowledgement within 3 days and response within 10
              </p>
            </div>
          </div>
        )}

        {/* Urgent items list */}
        {urgentItems.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-[var(--cs-text-muted)] px-1">Action Required</span>
            {urgentItems.map((c) => (
              <Link key={c.id} href="/complaints">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--cs-surface)] transition-colors bg-orange-50/50">
                  <Scale className="h-3 w-3 text-orange-500 shrink-0" />
                  <span className="text-[11px] font-medium text-[var(--cs-text-secondary)] flex-1 truncate">
                    {c.reference}: {c.summary.length > 40 ? (c.summary ?? []).slice(0, 40) + "…" : c.summary}
                  </span>
                  <span className="text-[9px] text-[var(--cs-text-muted)] shrink-0">
                    {STAGE_LABELS[c.stage] ?? c.stage}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* All clear */}
        {open === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              No open complaints
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
