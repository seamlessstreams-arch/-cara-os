"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PROVIDER VISITS INTELLIGENCE CARD
// Dashboard card for social worker visits, Reg 44, Ofsted, and professional visits.
// CHR 2015 Reg 44/45. SCCIF: Well-Led.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck, ChevronRight, AlertTriangle, Brain,
  Calendar, CheckCircle2, Clock, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = {
  total_visits: 24,
  completed_visits: 18,
  scheduled_visits: 4,
  overdue_visits: 2,
  satisfactory_rate: 83.3,
  actions_outstanding: 3,
  reports_pending: 2,
  reg_44_completed: 5,
  reg_44_overdue: 1,
};

const DEMO_VISITS: { visitor: string; type: string; date: string; status: string; outcome: string | null }[] = [
  { visitor: "Jane Smith (SW)", type: "Social Worker", date: "2026-05-10", status: "completed", outcome: "Satisfactory" },
  { visitor: "Mark Jones", type: "Reg 44", date: "2026-05-01", status: "completed", outcome: "Actions Required" },
  { visitor: "Dr Lee", type: "Health", date: "2026-05-15", status: "scheduled", outcome: null },
  { visitor: "Reg 44 Visit", type: "Reg 44", date: "2026-04-05", status: "overdue", outcome: null },
  { visitor: "Tom Brown (IRO)", type: "IRO", date: "2026-04-20", status: "completed", outcome: "Satisfactory" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "reg_44_overdue", severity: "critical", message: "Reg 44 independent visit is overdue (was due 2026-04-05) — this is a statutory requirement." },
  { type: "actions_outstanding", severity: "high", message: "3 outstanding actions from Mark Jones's visit on 2026-05-01 where concerns were raised — complete urgently." },
  { type: "report_overdue", severity: "medium", message: "Report not received from Jane Smith for visit on 2026-04-15 — chase with Local Authority." },
];

const ARIA_INSIGHTS = [
  "24 visits recorded. 18 completed, 4 scheduled, 2 overdue. Satisfactory rate: 83.3%. 3 actions outstanding. 2 reports pending. Reg 44: 5 completed, 1 overdue. SW visits on track.",
  "Critical: 1 Reg 44 visit overdue — this is a statutory requirement under CHR 2015 Reg 44. Arrange immediately. 3 outstanding actions from the May visit need completion before the next Reg 44.",
  "Positive: Good visit frequency and high satisfactory rate. Ensure all children have opportunity to speak privately to visitors. Chase pending reports within 14 days of visit completion.",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  completed: { label: "Completed", color: "text-green-700 bg-green-50 border-green-200" },
  scheduled: { label: "Scheduled", color: "text-blue-700 bg-blue-50 border-blue-200" },
  overdue: { label: "Overdue", color: "text-red-700 bg-red-50 border-red-200" },
  cancelled: { label: "Cancelled", color: "text-gray-700 bg-gray-50 border-gray-200" },
};

export function ProviderVisitsCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-brand" />
            Provider Visits
          </CardTitle>
          <Link href="/provider-visits" className="text-xs text-brand hover:underline flex items-center gap-1">
            Visits <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{m.completed_visits}</p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.overdue_visits === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.overdue_visits === 0 ? "text-green-600" : "text-red-600")}>{m.overdue_visits}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.actions_outstanding === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.actions_outstanding === 0 ? "text-green-600" : "text-amber-600")}>{m.actions_outstanding}</p>
            <p className="text-[10px] text-muted-foreground">Actions</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.reg_44_overdue === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.reg_44_overdue === 0 ? "text-green-600" : "text-red-600")}>{m.reg_44_overdue}</p>
            <p className="text-[10px] text-muted-foreground">Reg 44 Due</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Recent & Upcoming Visits</p>
          <div className="space-y-1">
            {DEMO_VISITS.map((v, i) => {
              const badge = STATUS_BADGES[v.status] ?? STATUS_BADGES.completed;
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {v.status === "completed" ? <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" /> : v.status === "overdue" ? <AlertCircle className="h-3 w-3 text-red-500 shrink-0" /> : <Clock className="h-3 w-3 text-blue-500 shrink-0" />}
                    <span className="font-medium">{v.visitor}</span>
                    <span className="text-muted-foreground truncate">{v.type}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-muted-foreground">{v.date}</span>
                    <Badge variant="outline" className={cn("text-[10px]", badge.color)}>{badge.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Visit Alerts</p>
            {DEMO_ALERTS.map((a, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Visit Intelligence</p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
