"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — NIGHT MONITORING INTELLIGENCE CARD
// Dashboard card for waking night checks, overnight logs, premises security,
// and ARIA night monitoring intelligence.
// CHR 2015 Reg 12 (protection), Reg 25 (premises), Reg 32/33 (staffing).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Moon, ChevronRight, AlertTriangle, Brain,
  Shield, Clock, CheckCircle, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  total_checks_7d: 84,
  avg_checks_per_night: 12,
  all_children_checked_rate: 100,
  disturbances_7d: 3,
  incidents_7d: 0,
  premises_secure_rate: 100,
  handover_completion_rate: 86,
  unreviewed_logs: 2,
};

const DEMO_LAST_NIGHT = {
  date: "2026-05-12",
  lead: "K. Johnson",
  checks: 12,
  all_checked: true,
  disturbances: 1,
  incidents: 0,
  premises_secure: true,
  fire_panel: true,
  status: "completed",
};

const DEMO_BY_STATUS = [
  { status: "Sleeping", count: 52, pct: 62 },
  { status: "Awake Settled", count: 18, pct: 21 },
  { status: "Awake Unsettled", count: 8, pct: 10 },
  { status: "Distressed", count: 3, pct: 4 },
  { status: "Not in Room", count: 3, pct: 4 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "unreviewed", severity: "medium", message: "2 overnight logs from the past week have not been reviewed by management. All night logs should be reviewed within 48 hours." },
  { type: "handover", severity: "medium", message: "1 of 7 night shifts this week did not record handover notes being given to the day team. Ensure continuity of care." },
];

const ARIA_INSIGHTS = [
  "Last night (12 May): 12 checks completed, all 5 children checked. 1 disturbance — Child C awake and unsettled at 01:30, spoken to and reassured, settled by 02:00. No incidents. Premises secure, fire panel checked. K. Johnson lead.",
  "Pattern detected: Child C has been awake and unsettled 4 of the last 7 nights between 01:00-02:00. Consider reviewing bedtime routine and discuss with CAMHS if sleep difficulties persist. May indicate underlying anxiety — cross-reference with behaviour logs.",
  "Overall (7 days): 84 checks across 7 nights, average 12 per night. All children checked every shift. 3 disturbances, 0 incidents. 100% premises security compliance. Handover completion at 86% — 1 shift missing. Fire panel checked every night.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function NightMonitoringCard() {
  const m = DEMO_METRICS;
  const ln = DEMO_LAST_NIGHT;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Moon className="h-4 w-4 text-brand" />
            Night Monitoring
          </CardTitle>
          <Link href="/night-monitoring" className="text-xs text-brand hover:underline flex items-center gap-1">
            Logs <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.total_checks_7d}</p>
            <p className="text-[10px] text-muted-foreground">Checks (7d)</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.all_children_checked_rate === 100 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.all_children_checked_rate === 100 ? "text-green-600" : "text-red-600")}>
              {m.all_children_checked_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">All Checked</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.incidents_7d === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.incidents_7d === 0 ? "text-green-600" : "text-red-600")}>
              {m.incidents_7d}
            </p>
            <p className="text-[10px] text-muted-foreground">Incidents</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.premises_secure_rate === 100 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.premises_secure_rate === 100 ? "text-green-600" : "text-red-600")}>
              {m.premises_secure_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Secure</p>
          </div>
        </div>

        {/* ── Last night summary ──────────────────────────────────────── */}

        <div className="rounded border p-2.5 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              Last Night — {new Date(ln.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </p>
            <Badge className={cn(
              "text-[10px]",
              ln.status === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
            )}>
              {ln.status}
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="font-bold text-blue-600">{ln.checks}</p>
              <p className="text-[9px] text-muted-foreground">Checks</p>
            </div>
            <div>
              <p className={cn("font-bold", ln.all_checked ? "text-green-600" : "text-red-600")}>
                {ln.all_checked ? <CheckCircle className="h-4 w-4 mx-auto" /> : "No"}
              </p>
              <p className="text-[9px] text-muted-foreground">All Checked</p>
            </div>
            <div>
              <p className={cn("font-bold", ln.disturbances === 0 ? "text-green-600" : "text-amber-600")}>{ln.disturbances}</p>
              <p className="text-[9px] text-muted-foreground">Disturb.</p>
            </div>
            <div>
              <p className={cn("font-bold", ln.premises_secure ? "text-green-600" : "text-red-600")}>
                {ln.premises_secure ? <Shield className="h-4 w-4 mx-auto text-green-600" /> : "No"}
              </p>
              <p className="text-[9px] text-muted-foreground">Secure</p>
            </div>
          </div>
          <p className="text-muted-foreground">Lead: {ln.lead}</p>
        </div>

        {/* ── Check outcomes ──────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Check Outcomes (7d)
          </p>
          {DEMO_BY_STATUS.map((s) => (
            <div key={s.status} className="flex items-center gap-2 text-xs">
              <span className="w-28 truncate">{s.status}</span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    s.status === "Sleeping" ? "bg-blue-400"
                      : s.status === "Awake Settled" ? "bg-green-400"
                      : s.status === "Distressed" ? "bg-red-400"
                      : "bg-amber-400",
                  )}
                  style={{ width: `${s.pct}%` }}
                />
              </div>
              <span className="w-8 text-right tabular-nums text-muted-foreground">{s.count}</span>
            </div>
          ))}
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Night Monitoring Alerts
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
            ARIA Night Intelligence
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
