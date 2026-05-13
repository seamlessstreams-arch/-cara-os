"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF ABSENCE INTELLIGENCE CARD
// Dashboard card for absence monitoring, patterns, and staffing impact.
// CHR 2015 Reg 33/34. SCCIF: Well-Led — Staffing.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserMinus, ChevronRight, AlertTriangle, Brain,
  Clock, Calendar, Activity, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  total_absences: 14,
  current_absences: 3,
  sickness_absences: 8,
  total_days_lost: 47,
  avg_days_per_absence: 3.9,
  absence_rate: 1.6,
  agency_cover_count: 4,
  return_to_work_pending: 1,
  return_to_work_overdue: 1,
  stress_related: 2,
  long_term_sickness: 1,
};

const DEMO_CURRENT: {
  name: string;
  role: string;
  type: string;
  startDate: string;
  daysLost: number;
  coveredBy: string | null;
  agency: boolean;
}[] = [
  { name: "Sarah Mitchell", role: "Senior RSW", type: "Sickness (Long-Term)", startDate: "2026-04-21", daysLost: 22, coveredBy: null, agency: true },
  { name: "James Taylor", role: "RSW", type: "Sickness (Short-Term)", startDate: "2026-05-10", daysLost: 3, coveredBy: "Emma Wilson", agency: false },
  { name: "Priya Patel", role: "RSW", type: "Annual Leave", startDate: "2026-05-12", daysLost: 5, coveredBy: "Rota adjusted", agency: false },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "no_oh_referral", severity: "high", message: "Sarah Mitchell on long-term sickness since 21/04 without occupational health referral — consider referral urgently." },
  { type: "rtw_overdue", severity: "medium", message: "Return-to-work interview overdue for Daniel Hughes — returned 06/05, interview not yet completed." },
  { type: "no_fit_note", severity: "medium", message: "Sarah Mitchell has been off sick for 22 days without a fit note — request from GP." },
];

const ARIA_INSIGHTS = [
  "14 absences recorded, 3 currently absent. 47 total days lost (avg 3.9 per absence). Absence rate: 1.6%. Agency cover used 4 times. 1 long-term sickness, 2 stress-related absences this period.",
  "Priority: Sarah Mitchell (Senior RSW) — 22 days long-term sickness without OH referral or fit note. Critical staffing gap in senior team. Recommend immediate OH referral and cover plan review.",
  "Pattern analysis: 2 stress/mental health absences this quarter (up from 0 last quarter). Correlates with period of increased incidents. Consider team wellbeing review and supervision frequency increase.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function StaffAbsenceCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserMinus className="h-4 w-4 text-brand" />
            Staff Absence
          </CardTitle>
          <Link href="/staff-absence" className="text-xs text-brand hover:underline flex items-center gap-1">
            Absence <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.current_absences === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.current_absences === 0 ? "text-green-600" : "text-amber-600")}>
              {m.current_absences}
            </p>
            <p className="text-[10px] text-muted-foreground">Current</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.total_days_lost}</p>
            <p className="text-[10px] text-muted-foreground">Days Lost</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.agency_cover_count === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.agency_cover_count === 0 ? "text-green-600" : "text-amber-600")}>
              {m.agency_cover_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Agency</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.stress_related === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.stress_related === 0 ? "text-green-600" : "text-red-600")}>
              {m.stress_related}
            </p>
            <p className="text-[10px] text-muted-foreground">Stress</p>
          </div>
        </div>

        {/* ── Currently absent ─────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Currently Absent
          </p>
          <div className="space-y-1">
            {DEMO_CURRENT.map((a) => (
              <div key={a.name} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{a.name}</span>
                    {a.agency && <Badge variant="outline" className="text-[10px] text-orange-700 bg-orange-50 border-orange-200">Agency</Badge>}
                  </div>
                  <div className="text-muted-foreground">{a.type} — {a.daysLost} days</div>
                </div>
                <div className="text-right text-muted-foreground shrink-0 ml-2">
                  {a.coveredBy && <div className="text-[10px]">{a.coveredBy}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Absence Alerts
            </p>
            {DEMO_ALERTS.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  alert.severity === "critical" || alert.severity === "high"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ───────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Absence Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-blue-200 bg-blue-50 text-blue-800"
                  : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800"
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
