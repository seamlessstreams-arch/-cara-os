"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — VISITORS LOG INTELLIGENCE CARD
// Dashboard card for visitor tracking, sign-in/out compliance,
// professional visits, and ARIA safeguarding intelligence.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DoorOpen, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, Shield, Clock, UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_SUMMARY = {
  totalVisitsThisMonth: 24,
  uniqueVisitors: 16,
  professionalVisits: 18,
  familyVisits: 6,
  avgDurationMinutes: 52,
};

const COMPLIANCE = {
  dbsCheckRate: 94.4,
  idVerificationRate: 87.5,
  signOutRate: 91.7,
  incompleteEntries: 2,
};

const TODAYS_VISITORS = [
  { name: "Sarah Collins", type: "Social Worker", child: "Alex W", time: "10:30", signedOut: true },
  { name: "Dr. Patel", type: "CAMHS", child: "Tyler R", time: "14:00", signedOut: false },
  { name: "Jane Doe", type: "Family Member", child: "Jordan M", time: "15:30", signedOut: false },
];

const VISITOR_TYPES_BREAKDOWN = [
  { type: "Social Worker", count: 8 },
  { type: "Health Professional", count: 4 },
  { type: "Family Member", count: 6 },
  { type: "Education", count: 3 },
  { type: "Reg 44 Visitor", count: 1 },
  { type: "Other", count: 2 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "visitor_not_signed_out", severity: "medium", message: "Dr. Patel (CAMHS) arrived at 14:00 and has not signed out — visit duration now exceeds 4 hours." },
  { type: "dbs_not_checked", severity: "high", message: "1 professional visitor this month was not DBS checked. Review and update visitor records." },
];

const ARIA_INSIGHTS = [
  "24 visits this month with 94.4% DBS check compliance for professional visitors. 1 professional visitor DBS not verified — follow up and ensure all professionals present valid DBS or are supervised. Safeguarding standards require DBS verification.",
  "Reg 44 independent visit completed this month. Next visit due within 28 days. Social worker visits are the most frequent (8 this month), indicating good professional oversight. All 4 children received at least 1 professional visit.",
  "Positive: Sign-out compliance at 91.7% — 2 entries incomplete. Average visit duration of 52 minutes suggests meaningful engagement. Family visits (6) show maintained family connections. ID verification at 87.5% — aim for 100% for safeguarding.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function VisitorsCard() {
  const s = DEMO_SUMMARY;
  const c = COMPLIANCE;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <DoorOpen className="h-4 w-4 text-brand" />
            Visitors Log
          </CardTitle>
          <Link href="/visitors" className="text-xs text-brand hover:underline flex items-center gap-1">
            Visitors <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {s.totalVisitsThisMonth}
            </p>
            <p className="text-[10px] text-muted-foreground">This Month</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">
              {s.professionalVisits}
            </p>
            <p className="text-[10px] text-muted-foreground">Professional</p>
          </div>
          <div className="text-center rounded-lg p-2" style={{ background: c.dbsCheckRate >= 95 ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", c.dbsCheckRate >= 95 ? "text-green-600" : "text-amber-600")}>
              {c.dbsCheckRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">DBS Check</p>
          </div>
          <div className="text-center rounded-lg p-2" style={{ background: c.signOutRate >= 95 ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", c.signOutRate >= 95 ? "text-green-600" : "text-amber-600")}>
              {c.signOutRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Signed Out</p>
          </div>
        </div>

        {/* ── Today's visitors ──────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Today&apos;s Visitors
          </p>
          {TODAYS_VISITORS.map((v, i) => (
            <div key={i} className="rounded-lg border p-2.5 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{v.name}</span>
                <span className="text-muted-foreground">{v.type}</span>
                {v.child && <span className="text-muted-foreground">→ {v.child}</span>}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{v.time}</span>
                {v.signedOut ? (
                  <Badge className="text-[10px] bg-green-100 text-green-700">
                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                    Out
                  </Badge>
                ) : (
                  <Badge className="text-[10px] bg-blue-100 text-blue-700">
                    <UserCheck className="h-2.5 w-2.5 mr-0.5" />
                    In
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Visitor type breakdown ──────────────────────────────────── */}

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">Visitor Types</p>
          <div className="space-y-1">
            {VISITOR_TYPES_BREAKDOWN.map((vt) => {
              const pct = Math.round((vt.count / s.totalVisitsThisMonth) * 100);
              return (
                <div key={vt.type} className="flex items-center gap-2 text-xs">
                  <span className="w-28 text-muted-foreground">{vt.type}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right tabular-nums font-medium">{vt.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Compliance bar ──────────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Shield className={cn("h-4 w-4", c.incompleteEntries > 0 ? "text-amber-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">Compliance</p>
              <p className="text-[10px] text-muted-foreground">
                ID verified: {c.idVerificationRate}% · Avg duration: {s.avgDurationMinutes}min
              </p>
            </div>
          </div>
          {c.incompleteEntries > 0 ? (
            <Badge className="text-[10px] bg-amber-100 text-amber-700">
              {c.incompleteEntries} incomplete
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Visitor Alerts
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
            ARIA Visitor Intelligence
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
