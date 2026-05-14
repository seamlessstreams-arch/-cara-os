"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, ChevronRight, AlertTriangle, Brain, Clock, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_allocations: 8, unallocated_count: 1, broken_down_count: 1, overloaded_count: 1, no_continuity_count: 1, child_views_rate: 75.0, regular_sessions_rate: 62.5, backup_worker_rate: 50.0, handover_rate: 62.5, unique_children: 6 };

const DEMO_RECORDS: { child: string; worker: string; status: string; relationship: string }[] = [
  { child: "Child A", worker: "Staff A", status: "Active", relationship: "Good" },
  { child: "Child B", worker: "Staff B", status: "Active", relationship: "Excellent" },
  { child: "Child C", worker: "—", status: "Unallocated", relationship: "Broken Down" },
  { child: "Child D", worker: "Staff C", status: "Temp Cover", relationship: "Developing" },
  { child: "Child E", worker: "Staff A", status: "Active", relationship: "Good" },
  { child: "Child F", worker: "Staff D", status: "Under Review", relationship: "Strained" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "unallocated_broken_down", severity: "critical", message: "Child C is unallocated with broken down key worker relationship." },
  { type: "children_unallocated", severity: "high", message: "1 child is without key worker allocation." },
  { type: "no_backup_worker", severity: "medium", message: "4 allocations without backup worker identified." },
];

const ARIA_INSIGHTS = [
  "8 allocations. Unallocated: 1. Broken down: 1. Overloaded: 1. Sessions: 62.5%. Backup: 50%.",
  "Priority: 1 unallocated broken down. 1 child unallocated. 4 no backup. Strengthen allocation continuity.",
  "Positive: Child views sought in most reviews. Advocacy roles fulfilled. Training appropriate for most workers.",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Active": { label: "Active", color: "text-green-700 bg-green-50 border-green-200" },
  "Temp Cover": { label: "Temp", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Under Review": { label: "Review", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Unallocated": { label: "None", color: "text-red-700 bg-red-50 border-red-200" },
};

export function KeyWorkerAllocationCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><UserCheck className="h-4 w-4 text-brand" />Key Workers</CardTitle>
          <Link href="/key-worker-allocation" className="text-xs text-brand hover:underline flex items-center gap-1">Allocation <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.unallocated_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.unallocated_count === 0 ? "text-green-600" : "text-red-600")}>{m.unallocated_count}</p><p className="text-[10px] text-muted-foreground">Unalloc.</p></div>
          <div className={cn("text-center rounded-lg p-2", m.broken_down_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.broken_down_count === 0 ? "text-green-600" : "text-red-600")}>{m.broken_down_count}</p><p className="text-[10px] text-muted-foreground">Broken</p></div>
          <div className={cn("text-center rounded-lg p-2", m.overloaded_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.overloaded_count === 0 ? "text-green-600" : "text-amber-600")}>{m.overloaded_count}</p><p className="text-[10px] text-muted-foreground">Overloaded</p></div>
          <div className="text-center rounded-lg p-2 bg-blue-50"><p className="text-lg font-bold tabular-nums text-blue-600">{m.total_allocations}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Current Allocations</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Under Review"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Handshake className="h-3 w-3 text-indigo-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.worker} · {r.relationship}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Allocation Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Key Worker Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
