"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF DISCIPLINARY INTELLIGENCE CARD
// Dashboard card for disciplinary cases, grievances, investigations,
// referral tracking, and ARIA workforce intelligence.
// CHR 2015 Reg 33 (employment), Reg 34 (fitness), Reg 40 (notifications).
// SCCIF Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Scale, ChevronRight, AlertTriangle, Brain,
  FileWarning, Clock, Shield, UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_DISCIPLINARY_METRICS = {
  active_cases: 2,
  under_investigation: 1,
  closed_this_year: 3,
  avg_investigation_days: 14,
  lado_referrals: 1,
  ofsted_notifications: 1,
  active_grievances: 1,
  resolved_grievances: 2,
};

const DEMO_ACTIVE_CASES = [
  { staff: "Staff F", category: "Safeguarding Concern", status: "under_investigation", days: 8 },
  { staff: "Staff G", category: "Conduct", status: "hearing_scheduled", days: 22 },
];

const DEMO_OUTCOME_BREAKDOWN = [
  { outcome: "No Action", count: 1 },
  { outcome: "Verbal Warning", count: 1 },
  { outcome: "Written Warning", count: 1 },
  { outcome: "Dismissed", count: 0 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "safeguarding_investigation", severity: "critical", message: "1 active safeguarding concern under investigation. LADO referral made. Ensure interim measures are in place (Reg 34)." },
  { type: "investigation_timeline", severity: "medium", message: "1 case has been under investigation for 22 days. Aim to conclude within 20 working days." },
];

const ARIA_INSIGHTS = [
  "Active safeguarding concern for Staff F — LADO referral submitted 8 days ago. Ensure the staff member is not working unsupervised pending investigation outcome. Ofsted notification has been made as required under Reg 40.",
  "1 active grievance (working conditions). Informal resolution was attempted but not successful. Now at formal stage 1. Average investigation duration is 14 days — within the recommended 20-day target. 3 cases closed this year with appropriate outcomes documented.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function StaffDisciplinaryCard() {
  const d = DEMO_DISCIPLINARY_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4 text-brand" />
            Staff Disciplinary
          </CardTitle>
          <Link href="/staff-disciplinary" className="text-xs text-brand hover:underline flex items-center gap-1">
            Cases <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", d.active_cases === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", d.active_cases === 0 ? "text-green-600" : "text-amber-600")}>
              {d.active_cases}
            </p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", d.under_investigation === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", d.under_investigation === 0 ? "text-green-600" : "text-red-600")}>
              {d.under_investigation}
            </p>
            <p className="text-[10px] text-muted-foreground">Investigating</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{d.avg_investigation_days}d</p>
            <p className="text-[10px] text-muted-foreground">Avg Duration</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", d.active_grievances === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", d.active_grievances === 0 ? "text-green-600" : "text-amber-600")}>
              {d.active_grievances}
            </p>
            <p className="text-[10px] text-muted-foreground">Grievances</p>
          </div>
        </div>

        {/* ── Active cases ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <FileWarning className="h-3 w-3" />
            Active Cases
          </p>
          {DEMO_ACTIVE_CASES.map((c, i) => (
            <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
              <div className="flex items-center gap-2 flex-1">
                <UserX className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{c.staff}</span>
                <span className="text-muted-foreground truncate">{c.category}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  <Clock className="h-2.5 w-2.5 mr-0.5" />
                  {c.days}d
                </Badge>
                <Badge className={cn(
                  "text-[10px]",
                  c.status === "under_investigation" ? "bg-red-100 text-red-700"
                    : c.status === "hearing_scheduled" ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700",
                )}>
                  {c.status === "under_investigation" ? "Investigating" : c.status === "hearing_scheduled" ? "Hearing Due" : c.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* ── Outcomes & referrals ────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Shield className="h-3 w-3 text-indigo-500" />
            Outcomes & Referrals
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {DEMO_OUTCOME_BREAKDOWN.map((o) => (
              <div key={o.outcome} className="flex items-center justify-between">
                <span className="text-muted-foreground">{o.outcome}</span>
                <span className="font-bold tabular-nums">{o.count}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-1.5 mt-1 grid grid-cols-2 gap-x-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">LADO Referrals</span>
              <span className={cn("font-bold tabular-nums", d.lado_referrals > 0 ? "text-red-600" : "text-green-600")}>{d.lado_referrals}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ofsted Notified</span>
              <span className={cn("font-bold tabular-nums", d.ofsted_notifications > 0 ? "text-amber-600" : "text-green-600")}>{d.ofsted_notifications}</span>
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Disciplinary Alerts
            </p>
            {DEMO_ALERTS.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  alert.severity === "critical" ? "border-red-300 bg-red-50 text-red-800"
                    : alert.severity === "high" ? "border-red-200 bg-red-50 text-red-800"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Workforce Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-red-200 bg-red-50 text-red-800"
                  : "border-green-200 bg-green-50 text-green-800",
              )}
            >
              {insight}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
