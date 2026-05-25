"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WORKFORCE INTELLIGENCE CARD
// Dashboard card for staffing profile, DBS compliance, training status,
// shift coverage, supervision compliance, and ARIA workforce intelligence.
// Powered by the Workforce Intelligence Engine — live data (Reg 33/34).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, ChevronRight, AlertTriangle, Brain, Loader2,
  Shield, GraduationCap, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

// ── Component ────────────────────────────────────────────────────────────────

export function WorkforcePlanningCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            Workforce Intelligence
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
  const s = intel.staffing;
  const d = intel.dbs;
  const sup = intel.supervision;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            Workforce Intelligence
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Staff <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{p.active_staff}</p>
            <p className="text-[10px] text-muted-foreground">Active Staff</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", p.training_compliance_rate >= 90 ? "bg-green-50" : p.training_compliance_rate >= 75 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", p.training_compliance_rate >= 90 ? "text-green-600" : p.training_compliance_rate >= 75 ? "text-amber-600" : "text-red-600")}>
              {p.training_compliance_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Training</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", d.compliance_rate >= 100 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", d.compliance_rate >= 100 ? "text-green-600" : "text-red-600")}>
              {d.compliance_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">DBS</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", s.coverage_rate >= 95 ? "bg-green-50" : s.coverage_rate >= 80 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", s.coverage_rate >= 95 ? "text-green-600" : s.coverage_rate >= 80 ? "text-amber-600" : "text-red-600")}>
              {s.coverage_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Shifts</p>
          </div>
        </div>

        {/* ── Key metrics ─────────────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-blue-500" />
              <div>
                <p className="text-xs font-medium">{p.supervision_compliance_rate}%</p>
                <p className="text-[10px] text-muted-foreground">Supervision</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-purple-500" />
              <div>
                <p className="text-xs font-medium">{Math.round(p.average_tenure_months / 12 * 10) / 10}y</p>
                <p className="text-[10px] text-muted-foreground">Avg Tenure</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-green-500" />
              <div>
                <p className="text-xs font-medium">{p.staff_on_shift_today}</p>
                <p className="text-[10px] text-muted-foreground">On Today</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Staffing breakdown ───────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Staffing Profile</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div className="flex items-center justify-between rounded border p-2">
              <span className="text-muted-foreground">Full-time</span>
              <span className="font-medium">{p.full_time}</span>
            </div>
            <div className="flex items-center justify-between rounded border p-2">
              <span className="text-muted-foreground">Part-time</span>
              <span className="font-medium">{p.part_time}</span>
            </div>
            <div className="flex items-center justify-between rounded border p-2">
              <span className="text-muted-foreground">Bank/Agency</span>
              <span className={cn("font-medium", p.bank_agency > 0 ? "text-amber-600" : "")}>{p.bank_agency}</span>
            </div>
            <div className="flex items-center justify-between rounded border p-2">
              <span className="text-muted-foreground">On Leave</span>
              <span className="font-medium">{p.staff_on_leave_today}</span>
            </div>
          </div>
        </div>

        {/* ── Training compliance ──────────────────────────────────────── */}

        {intel.training.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              Training ({p.training_compliance_rate}% compliant)
            </p>
            {intel.training.slice(0, 4).map((t) => (
              <div key={t.category} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="capitalize truncate">{t.category.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn("font-medium tabular-nums", t.compliance_rate >= 100 ? "text-green-600" : t.compliance_rate >= 75 ? "text-amber-600" : "text-red-600")}>
                    {t.compliant}/{t.total_required}
                  </span>
                  {t.expired > 0 && (
                    <Badge className="text-[9px] bg-red-100 text-red-700">{t.expired} expired</Badge>
                  )}
                  {t.expiring_soon > 0 && (
                    <Badge className="text-[9px] bg-amber-100 text-amber-700">{t.expiring_soon} due</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Supervision ──────────────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3 text-xs">
          <div>
            <p className="font-medium">Supervision Compliance</p>
            <p className="text-[10px] text-muted-foreground">
              {sup.up_to_date} current · {sup.overdue} overdue · {sup.due_within_7_days} due soon
            </p>
          </div>
          <Badge className={cn("text-[10px]", sup.overdue === 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
            {sup.overdue === 0 ? "All current" : `${sup.overdue} overdue`}
          </Badge>
        </div>

        {/* ── Shift coverage ───────────────────────────────────────────── */}

        {s.shifts_unfilled > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Coverage Concerns
            </p>
            <div className="rounded border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
              {s.shifts_unfilled} shift{s.shifts_unfilled > 1 ? "s" : ""} unfilled this week out of {s.shifts_this_week}. Coverage rate: {s.coverage_rate}%.
              {s.no_shows_this_month > 0 && ` ${s.no_shows_this_month} no-show(s) this month.`}
            </div>
          </div>
        )}

        {/* ── ARIA Workforce Intelligence ──────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Workforce Intelligence
            </p>
            {intel.insights.slice(0, 3).map((insight, i) => (
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
