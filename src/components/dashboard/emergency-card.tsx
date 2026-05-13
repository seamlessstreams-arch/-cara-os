"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EMERGENCY PLANNING INTELLIGENCE CARD
// Dashboard card for fire drills, emergency contacts, contingency plans,
// evacuation metrics, and ARIA emergency preparedness intelligence.
// CHR 2015 Reg 22 (arrangements), Reg 25 (premises), Reg 40 (notifications).
// SCCIF Helped & Protected / Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Flame, ChevronRight, AlertTriangle, Brain,
  Timer, Phone, FileCheck, ShieldAlert,
  Users, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_EMERGENCY_METRICS = {
  total_drills: 14,
  avg_evacuation_time: 187,
  all_accounted_rate: 93,
  drills_with_issues: 3,
  active_contacts: 12,
  contacts_verified: 9,
  contacts_verification_rate: 75,
  current_plans: 7,
  expired_plans: 1,
  total_plan_types_covered: 7,
  total_plan_types_required: 10,
};

const DEMO_DRILL_TYPES = [
  { type: "Fire Evacuation", count: 8, last: "2026-05-01", status: "current" },
  { type: "Night-Time Fire", count: 2, last: "2026-03-15", status: "current" },
  { type: "Lockdown", count: 2, last: "2026-02-20", status: "due" },
  { type: "Missing Child", count: 1, last: "2025-12-10", status: "overdue" },
  { type: "Medical Emergency", count: 1, last: "2025-11-05", status: "overdue" },
];

const DEMO_RECENT_DRILLS = [
  { date: "2026-05-01", type: "Fire Evacuation", time: 165, accounted: true, issues: 0 },
  { date: "2026-04-03", type: "Fire Evacuation", time: 198, accounted: true, issues: 1 },
  { date: "2026-03-15", type: "Night-Time Fire", time: 245, accounted: true, issues: 2 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "overdue_drills", severity: "high", message: "Missing child and medical emergency drills are overdue. 6-monthly drills required." },
  { type: "expired_plans", severity: "high", message: "1 contingency plan expired. Review and update immediately." },
  { type: "unverified_contacts", severity: "medium", message: "3 emergency contacts not verified in the last 6 months." },
];

const ARIA_INSIGHTS = [
  "Lockdown drill is due and missing child / medical emergency drills are overdue — schedule these within the next 2 weeks to maintain compliance. Fire evacuation drills are current (monthly) with average evacuation time of 3m 7s.",
  "1 expired contingency plan (data breach/IT failure) needs urgent review. 7 of 10 plan types covered — missing plans for flood, gas leak, and pandemic scenarios. Prepare at least the flood and gas leak plans before the next Reg 44 visit.",
  "Overall preparedness: 14 drills completed, 93% all-accounted rate (1 drill had missing headcount — investigate). 12 active contacts, 75% verified. Average evacuation time trending slightly up from 2m 45s to 3m 18s over 3 drills — review assembly point signage and staff familiarity.",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatSeconds = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
};

// ── Component ────────────────────────────────────────────────────────────────

export function EmergencyCard() {
  const e = DEMO_EMERGENCY_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="h-4 w-4 text-brand" />
            Emergency Planning
          </CardTitle>
          <Link href="/emergency" className="text-xs text-brand hover:underline flex items-center gap-1">
            Plans <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {e.total_drills}
            </p>
            <p className="text-[10px] text-muted-foreground">Drills</p>
          </div>
          <div className="text-center rounded-lg bg-indigo-50 p-2">
            <p className="text-lg font-bold tabular-nums text-indigo-600">
              {formatSeconds(e.avg_evacuation_time)}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Time</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", e.all_accounted_rate === 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", e.all_accounted_rate === 100 ? "text-green-600" : "text-amber-600")}>
              {e.all_accounted_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Accounted</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", e.expired_plans === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", e.expired_plans === 0 ? "text-green-600" : "text-red-600")}>
              {e.current_plans}
            </p>
            <p className="text-[10px] text-muted-foreground">Active Plans</p>
          </div>
        </div>

        {/* ── Drill types tracker ─────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" />
            Drill Types
          </p>
          {DEMO_DRILL_TYPES.map((d) => (
            <div key={d.type} className="flex items-center justify-between rounded border p-2 text-xs">
              <span className="truncate flex-1">{d.type}</span>
              <div className="flex items-center gap-1.5 ml-2">
                <Badge variant="outline" className="text-[10px] tabular-nums">{d.count}</Badge>
                <Badge className={cn(
                  "text-[10px]",
                  d.status === "current" ? "bg-green-100 text-green-700"
                    : d.status === "due" ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700",
                )}>
                  {d.status === "current" ? "Current" : d.status === "due" ? "Due" : "Overdue"}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* ── Recent drills ───────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Timer className="h-3 w-3" />
            Recent Drills
          </p>
          {DEMO_RECENT_DRILLS.map((d, i) => (
            <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-muted-foreground">{new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                <span className="font-medium truncate">{d.type}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                <Badge variant="outline" className="text-[10px] tabular-nums">{formatSeconds(d.time)}</Badge>
                {d.accounted ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                )}
                {d.issues > 0 && (
                  <Badge className="text-[10px] bg-amber-100 text-amber-700">{d.issues} issue{d.issues > 1 ? "s" : ""}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Emergency contacts ──────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Phone className="h-3 w-3 text-blue-500" />
            Emergency Contacts
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center rounded border p-2">
              <p className="text-sm font-bold tabular-nums text-blue-600">{e.active_contacts}</p>
              <p className="text-[10px] text-muted-foreground">Active</p>
            </div>
            <div className="text-center rounded border p-2">
              <p className="text-sm font-bold tabular-nums text-green-600">{e.contacts_verified}</p>
              <p className="text-[10px] text-muted-foreground">Verified</p>
            </div>
            <div className={cn("text-center rounded border p-2", e.contacts_verification_rate >= 90 ? "" : "")}>
              <p className={cn("text-sm font-bold tabular-nums", e.contacts_verification_rate >= 90 ? "text-green-600" : "text-amber-600")}>
                {e.contacts_verification_rate}%
              </p>
              <p className="text-[10px] text-muted-foreground">Verified Rate</p>
            </div>
          </div>
        </div>

        {/* ── Contingency plan coverage ───────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <FileCheck className="h-3 w-3 text-green-500" />
            Plan Coverage
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  e.total_plan_types_covered >= 8 ? "bg-green-500" : e.total_plan_types_covered >= 5 ? "bg-amber-500" : "bg-red-500",
                )}
                style={{ width: `${Math.round((e.total_plan_types_covered / e.total_plan_types_required) * 100)}%` }}
              />
            </div>
            <span className={cn(
              "text-xs font-bold tabular-nums",
              e.total_plan_types_covered >= 8 ? "text-green-600" : e.total_plan_types_covered >= 5 ? "text-amber-600" : "text-red-600",
            )}>
              {e.total_plan_types_covered}/{e.total_plan_types_required}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Current plans</span>
            <span className="font-bold text-green-600">{e.current_plans}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Expired plans</span>
            <span className={cn("font-bold", e.expired_plans > 0 ? "text-red-600" : "text-green-600")}>
              {e.expired_plans}
            </span>
          </div>
        </div>

        {/* ── Evacuation performance ──────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Users className="h-3 w-3 text-indigo-500" />
            Evacuation Performance
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Average evacuation time</span>
            <span className="font-bold tabular-nums">{formatSeconds(e.avg_evacuation_time)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">All accounted for rate</span>
            <span className={cn("font-bold tabular-nums", e.all_accounted_rate === 100 ? "text-green-600" : "text-amber-600")}>
              {e.all_accounted_rate}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Drills with issues</span>
            <span className={cn("font-bold tabular-nums", e.drills_with_issues > 0 ? "text-amber-600" : "text-green-600")}>
              {e.drills_with_issues}
            </span>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Emergency Alerts
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

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Emergency Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-red-200 bg-red-50 text-red-800"
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
