"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF INDUCTION INTELLIGENCE CARD
// Dashboard card for induction progress, probation tracking, pre-employment checks.
// CHR 2015 Reg 33/34, Schedule 2. SCCIF: Well-Led.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus, ChevronRight, AlertTriangle, Brain,
  CheckCircle2, Shield, Clock, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  total_records: 3,
  in_probation: 2,
  probation_passed: 1,
  completion_rate: 68.5,
  dbs_verified_rate: 100,
  references_verified_rate: 100,
  can_work_unsupervised_count: 1,
  tasks_overdue: 2,
};

const DEMO_INDUCTEES: {
  name: string;
  role: string;
  startDate: string;
  probation: string;
  tasksComplete: string;
  dbsOk: boolean;
  refsOk: boolean;
  unsupervised: boolean;
}[] = [
  { name: "Emma Wilson", role: "RSW", startDate: "2026-04-14", probation: "In Probation", tasksComplete: "12/18", dbsOk: true, refsOk: true, unsupervised: true },
  { name: "Amir Hassan", role: "Night RSW", startDate: "2026-05-01", probation: "In Probation", tasksComplete: "5/18", dbsOk: true, refsOk: true, unsupervised: false },
  { name: "Lucy Brown", role: "RSW", startDate: "2025-11-03", probation: "Passed", tasksComplete: "18/18", dbsOk: true, refsOk: true, unsupervised: true },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "task_overdue", severity: "high", message: "Amir Hassan: Medication administration training overdue since 08/05 — must complete before administering medication." },
  { type: "task_overdue", severity: "high", message: "Amir Hassan: Restraint training overdue since 10/05 — must complete before working unsupervised." },
  { type: "probation_ending", severity: "medium", message: "Emma Wilson probation review due in 10 days — schedule month 1 review meeting." },
];

const ARIA_INSIGHTS = [
  "3 induction records: 2 in probation, 1 passed. 68.5% overall task completion. 100% DBS and reference checks verified. 2 overdue tasks (both Amir Hassan — medication and restraint).",
  "Amir Hassan (Night RSW, started 01/05) has critical safety training gaps — cannot work unsupervised until medication and restraint training completed. Recommend prioritising these within next 48 hours.",
  "Emma Wilson progressing well (12/18 tasks, 67%). On track for month 1 review. Lucy Brown completed all 18 tasks and passed probation — induction quality benchmark for new starters.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function StaffInductionCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-brand" />
            Staff Induction
          </CardTitle>
          <Link href="/staff-induction" className="text-xs text-brand hover:underline flex items-center gap-1">
            Induction <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.in_probation}</p>
            <p className="text-[10px] text-muted-foreground">Probation</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.completion_rate >= 80 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.completion_rate >= 80 ? "text-green-600" : "text-amber-600")}>
              {m.completion_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Complete</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.dbs_verified_rate >= 100 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.dbs_verified_rate >= 100 ? "text-green-600" : "text-red-600")}>
              {m.dbs_verified_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">DBS</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.tasks_overdue === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.tasks_overdue === 0 ? "text-green-600" : "text-red-600")}>
              {m.tasks_overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
        </div>

        {/* ── Inductees ───────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Induction Progress
          </p>
          <div className="space-y-1">
            {DEMO_INDUCTEES.map((ind) => (
              <div key={ind.name} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium">{ind.name}</span>
                  {ind.dbsOk && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                  {ind.unsupervised && <Shield className="h-3 w-3 text-blue-500 shrink-0" />}
                  {!ind.unsupervised && <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-muted-foreground">{ind.tasksComplete}</span>
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    ind.probation === "Passed"
                      ? "text-green-700 bg-green-50 border-green-200"
                      : "text-blue-700 bg-blue-50 border-blue-200",
                  )}>
                    {ind.probation}
                  </Badge>
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
              Induction Alerts
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
            ARIA Induction Intelligence
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
