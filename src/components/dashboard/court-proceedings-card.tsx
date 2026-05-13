"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COURT PROCEEDINGS INTELLIGENCE CARD
// Dashboard card for court case tracking and statement management.
// CHR 2015 Reg 38/8. Children Act 1989.
// SCCIF: Leadership & Management — Court cooperation.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Scale, ChevronRight, AlertTriangle, Brain,
  Gavel, FileText, User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = {
  total_proceedings: 5,
  active_count: 3,
  concluded_count: 1,
  pending_decision_count: 1,
  statement_late_count: 1,
  child_views_sought_rate: 60.0,
  upcoming_hearings: 3,
  home_statement_submitted_rate: 50.0,
};

const DEMO_PROCEEDINGS: { child: string; type: string; status: string; hearing: string }[] = [
  { child: "Child A", type: "Care Order", status: "Active", hearing: "Final Hearing — 2026-05-28" },
  { child: "Child B", type: "Supervision Order", status: "Active", hearing: "Review — 2026-06-12" },
  { child: "Child C", type: "Secure Accommodation", status: "Pending Decision", hearing: "Awaiting judgment" },
  { child: "Child D", type: "Care Order", status: "Concluded", hearing: "Complete" },
  { child: "Child E", type: "Special Guardianship", status: "Active", hearing: "Case Mgmt — 2026-05-22" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "statement_late", severity: "critical", message: "Court statement for Child A (Family Court) is late — submit immediately to avoid contempt." },
  { type: "child_views_not_sought", severity: "high", message: "Child views not sought for Child B's court proceedings — Reg 7 requires children's wishes to be ascertained." },
  { type: "pending_decision", severity: "medium", message: "Court decision pending for Child C (secure accommodation) — prepare for all possible outcomes." },
];

const ARIA_INSIGHTS = [
  "5 court proceedings: 3 active, 1 concluded, 1 pending decision. 1 late statement. Child views sought: 60%. Upcoming hearings: 3. Home statements submitted: 50%.",
  "Priority: Child A's statement is late — risk of contempt. Child B's views not sought before proceedings — ascertain wishes urgently. Home statement submission rate at 50% — ensure all required statements filed on time.",
  "Positive: Care order for Child D concluded successfully. Strong guardian involvement in active cases. Ensure Child E's SGO proceedings have updated evidence from the home. Target 100% child views before all hearings.",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  Active: { label: "Active", color: "text-blue-700 bg-blue-50 border-blue-200" },
  Concluded: { label: "Concluded", color: "text-green-700 bg-green-50 border-green-200" },
  "Pending Decision": { label: "Pending", color: "text-amber-700 bg-amber-50 border-amber-200" },
  Adjourned: { label: "Adjourned", color: "text-gray-700 bg-gray-50 border-gray-200" },
  Withdrawn: { label: "Withdrawn", color: "text-red-700 bg-red-50 border-red-200" },
};

export function CourtProceedingsCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4 text-brand" />
            Court Proceedings
          </CardTitle>
          <Link href="/court-proceedings" className="text-xs text-brand hover:underline flex items-center gap-1">
            Cases <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.active_count}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className="text-center rounded-lg bg-amber-50 p-2">
            <p className="text-lg font-bold tabular-nums text-amber-600">{m.upcoming_hearings}</p>
            <p className="text-[10px] text-muted-foreground">Hearings</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.statement_late_count === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.statement_late_count === 0 ? "text-green-600" : "text-red-600")}>{m.statement_late_count}</p>
            <p className="text-[10px] text-muted-foreground">Late Stmts</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.pending_decision_count === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.pending_decision_count === 0 ? "text-green-600" : "text-amber-600")}>{m.pending_decision_count}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Gavel className="h-3 w-3" />Court Cases</p>
          <div className="space-y-1">
            {DEMO_PROCEEDINGS.map((cp, i) => {
              const badge = STATUS_BADGES[cp.status] ?? STATUS_BADGES.Active;
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="font-medium">{cp.child}</span>
                    <span className="text-muted-foreground truncate">{cp.type} · {cp.hearing}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Court Alerts</p>
            {DEMO_ALERTS.map((a, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Court Intelligence</p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
