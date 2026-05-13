"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ONLINE SAFETY INTELLIGENCE CARD
// Dashboard card for online safety monitoring, incidents, and device agreements.
// CHR 2015 Reg 12/5, KCSIE. SCCIF: Safety.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wifi, ChevronRight, AlertTriangle, Brain,
  Shield, CheckCircle2, AlertCircle, Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  total_incidents: 6,
  incidents_this_month: 2,
  critical_incidents: 0,
  safeguarding_referrals: 1,
  active_agreements: 5,
  agreement_coverage: 100,
  filtering_enabled_rate: 100,
  monitoring_enabled_rate: 80,
  checks_overdue: 1,
};

const DEMO_AGREEMENTS: {
  child: string;
  status: string;
  filtering: boolean;
  monitoring: boolean;
  reviewOverdue: boolean;
}[] = [
  { child: "Child A", status: "Active", filtering: true, monitoring: true, reviewOverdue: false },
  { child: "Child B", status: "Active", filtering: true, monitoring: true, reviewOverdue: false },
  { child: "Child C", status: "Active", filtering: true, monitoring: true, reviewOverdue: true },
  { child: "Child D", status: "Active", filtering: true, monitoring: false, reviewOverdue: false },
  { child: "Child E", status: "Active", filtering: true, monitoring: true, reviewOverdue: false },
];

const DEMO_RECENT_INCIDENTS = [
  { child: "Child B", category: "Social Media Misuse", severity: "medium", date: "2026-05-08" },
  { child: "Child D", category: "Excessive Screen Time", severity: "low", date: "2026-05-03" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "safety_controls_missing", severity: "high", message: "Monitoring not enabled on Child D's device agreement — review safety controls." },
  { type: "review_overdue", severity: "medium", message: "Device agreement review overdue for Child C — review filtering and monitoring." },
];

const ARIA_INSIGHTS = [
  "6 online safety incidents total, 2 this month. 0 critical incidents. 100% agreement coverage — all 5 children have active device agreements. Filtering enabled on all devices. 1 safeguarding referral made.",
  "Child D: Monitoring not enabled and has had excessive screen time incidents — recommend enabling monitoring and reviewing usage hours. Child B: Social media misuse incident — ensure age-appropriate platform restrictions are in place.",
  "Overall strong online safety position. All children have agreements, filtering is universal. Gap: 1 agreement overdue for review (Child C). Recommend quarterly review cycle for all agreements aligned with care plan reviews.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function OnlineSafetyCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wifi className="h-4 w-4 text-brand" />
            Online Safety
          </CardTitle>
          <Link href="/online-safety" className="text-xs text-brand hover:underline flex items-center gap-1">
            Safety <ChevronRight className="h-3 w-3" />
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
          <div className={cn("text-center rounded-lg p-2", m.agreement_coverage >= 100 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.agreement_coverage >= 100 ? "text-green-600" : "text-red-600")}>
              {m.agreement_coverage}%
            </p>
            <p className="text-[10px] text-muted-foreground">Coverage</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.filtering_enabled_rate >= 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.filtering_enabled_rate >= 100 ? "text-green-600" : "text-amber-600")}>
              {m.filtering_enabled_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Filtered</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.monitoring_enabled_rate >= 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.monitoring_enabled_rate >= 100 ? "text-green-600" : "text-amber-600")}>
              {m.monitoring_enabled_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Monitored</p>
          </div>
        </div>

        {/* ── Device agreements ────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Monitor className="h-3 w-3" />
            Device Agreements
          </p>
          <div className="space-y-1">
            {DEMO_AGREEMENTS.map((a) => (
              <div key={a.child} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium">{a.child}</span>
                  {a.filtering && <Shield className="h-3 w-3 text-green-500 shrink-0" />}
                  {a.monitoring && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                  {!a.monitoring && <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {a.reviewOverdue && <Badge variant="outline" className="text-[10px] text-red-700 bg-red-50 border-red-200">Review Due</Badge>}
                  <Badge variant="outline" className="text-[10px] text-green-700 bg-green-50 border-green-200">{a.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent incidents ─────────────────────────────────────────── */}

        {DEMO_RECENT_INCIDENTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Recent Incidents
            </p>
            {DEMO_RECENT_INCIDENTS.map((inc, i) => (
              <div key={i} className="rounded border p-2 text-xs">
                <span className="font-medium">{inc.child}</span>
                <span className="text-muted-foreground"> — {inc.category}</span>
                <span className="text-muted-foreground"> ({inc.date})</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
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
            ARIA Online Safety Intelligence
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
