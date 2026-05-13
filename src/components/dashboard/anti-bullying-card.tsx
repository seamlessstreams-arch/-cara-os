"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ANTI-BULLYING INTELLIGENCE CARD
// Dashboard card for bullying incidents, interventions, and peer safety.
// CHR 2015 Reg 12/34/7. SCCIF: Safety.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldOff, ChevronRight, AlertTriangle, Brain,
  CheckCircle2, Users, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  total_incidents: 5,
  incidents_this_month: 1,
  resolved_count: 3,
  pending_count: 1,
  escalated_count: 1,
  follow_ups_pending: 1,
  unique_victims: 3,
  repeat_victims: 1,
  cyber_incidents: 1,
};

const DEMO_INCIDENTS: {
  victim: string;
  type: string;
  severity: string;
  date: string;
  outcome: string;
  intervention: string;
}[] = [
  { victim: "Child C", type: "Verbal", severity: "medium", date: "2026-05-08", outcome: "Pending", intervention: "Mediation" },
  { victim: "Child B", type: "Cyber", severity: "high", date: "2026-04-22", outcome: "Ongoing Monitoring", intervention: "Safety Plan" },
  { victim: "Child C", type: "Social Exclusion", severity: "medium", date: "2026-04-10", outcome: "Resolved", intervention: "Restorative Conversation" },
  { victim: "Child A", type: "Physical", severity: "high", date: "2026-03-15", outcome: "Resolved", intervention: "Increased Supervision" },
  { victim: "Child E", type: "Verbal", severity: "low", date: "2026-02-28", outcome: "Resolved", intervention: "Education Session" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "repeat_victim", severity: "high", message: "Child C has been a victim in 2 bullying incidents — review safety plan and peer relationships." },
  { type: "follow_up_overdue", severity: "medium", message: "Follow-up for cyberbullying incident involving Child B overdue — check on wellbeing and online safety measures." },
];

const ARIA_INSIGHTS = [
  "5 bullying incidents recorded, 1 this month. 3 resolved, 1 pending, 1 ongoing monitoring. 3 unique victims, 1 repeat victim (Child C). 1 cyber incident. Most common intervention: mediation/restorative approaches.",
  "Child C: Repeat victim (verbal + social exclusion). Pattern suggests peer relationship difficulties — recommend key worker session to explore dynamics and update behaviour support plan. Consider peer mediation programme.",
  "Positive trends: No physical incidents in 2 months. Restorative approaches showing good outcomes (2/2 resolved). Gap: Cyberbullying incident for Child B needs continued monitoring — ensure device agreement reflects current risks.",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_BADGES: Record<string, { label: string; color: string }> = {
  critical: { label: "Critical", color: "text-red-700 bg-red-50 border-red-200" },
  high: { label: "High", color: "text-orange-700 bg-orange-50 border-orange-200" },
  medium: { label: "Medium", color: "text-blue-700 bg-blue-50 border-blue-200" },
  low: { label: "Low", color: "text-gray-700 bg-gray-50 border-gray-200" },
};

// ── Component ────────────────────────────────────────────────────────────────

export function AntiBullyingCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldOff className="h-4 w-4 text-brand" />
            Anti-Bullying
          </CardTitle>
          <Link href="/anti-bullying" className="text-xs text-brand hover:underline flex items-center gap-1">
            Bullying <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.incidents_this_month === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.incidents_this_month === 0 ? "text-green-600" : "text-amber-600")}>
              {m.incidents_this_month}
            </p>
            <p className="text-[10px] text-muted-foreground">This Month</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{m.resolved_count}</p>
            <p className="text-[10px] text-muted-foreground">Resolved</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.pending_count === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.pending_count === 0 ? "text-green-600" : "text-amber-600")}>
              {m.pending_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.repeat_victims === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.repeat_victims === 0 ? "text-green-600" : "text-red-600")}>
              {m.repeat_victims}
            </p>
            <p className="text-[10px] text-muted-foreground">Repeat</p>
          </div>
        </div>

        {/* ── Incidents ───────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            Bullying Incidents
          </p>
          <div className="space-y-1">
            {DEMO_INCIDENTS.map((inc, i) => {
              const badge = SEVERITY_BADGES[inc.severity] ?? SEVERITY_BADGES.medium;
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium">{inc.victim}</span>
                    <span className="text-muted-foreground truncate">{inc.type}</span>
                    {inc.outcome === "Resolved" && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                    {inc.outcome === "Pending" && <Clock className="h-3 w-3 text-amber-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-muted-foreground">{inc.date}</span>
                    <Badge variant="outline" className={cn("text-[10px]", badge.color)}>
                      {badge.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Bullying Alerts
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
            ARIA Anti-Bullying Intelligence
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
