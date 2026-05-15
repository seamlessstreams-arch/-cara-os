"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, ChevronRight, AlertTriangle, Brain, Clock, UserRoundCog } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_secondments: 6, active_count: 3, completed_count: 2, pending_count: 1, agreement_rate: 83.3, dbs_transfer_rate: 66.7, induction_rate: 66.7, supervision_rate: 50.0, objectives_rate: 66.7, review_scheduled_rate: 50.0, extension_count: 1, unique_staff: 5 };

const DEMO_RECORDS: { staff: string; type: string; status: string; org: string }[] = [
  { staff: "Staff A", type: "Incoming", status: "Active", org: "Care Group X" },
  { staff: "Staff B", type: "Outgoing", status: "Completed", org: "LA Team Y" },
  { staff: "Staff C", type: "Incoming", status: "Active", org: "Agency Z" },
  { staff: "Staff D", type: "Internal Transfer", status: "Pending", org: "Oak House" },
  { staff: "Staff E", type: "Cross-Org", status: "Active", org: "NHS Trust" },
  { staff: "Staff B", type: "Outgoing", status: "Completed", org: "LA Team Y" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "no_agreement", severity: "critical", message: "1 active secondment without signed agreement." },
  { type: "dbs_not_transferred", severity: "critical", message: "1 active secondment without DBS transfer completed." },
  { type: "no_induction", severity: "high", message: "1 active secondment without induction completed." },
];

const ARIA_INSIGHTS = [
  "6 secondments across 5 staff. Active: 3. Completed: 2. Pending: 1.",
  "Priority: 1 without agreement. DBS transferred 66.7%. Induction 66.7%. Supervision 50.0%.",
  "Secondments require the same rigour as permanent appointments. Are agreements comprehensive? Is supervision genuinely happening?",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Active": { label: "Active", color: "text-green-700 bg-green-50 border-green-200" },
  "Completed": { label: "Completed", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Extended": { label: "Extended", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Terminated Early": { label: "Terminated", color: "text-red-700 bg-red-50 border-red-200" },
  "Pending": { label: "Pending", color: "text-gray-700 bg-gray-50 border-gray-200" },
};

export function StaffSecondmentManagementCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-teal-200">
      <CardHeader className="pb-3 bg-teal-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><ArrowLeftRight className="h-4 w-4 text-teal-600" /><span className="text-teal-900">Secondments</span></CardTitle>
          <Link href="/staff-secondment-management" className="text-xs text-teal-600 hover:underline flex items-center gap-1">Records <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg p-2 bg-green-50"><p className="text-lg font-bold tabular-nums text-green-600">{m.active_count}</p><p className="text-[10px] text-muted-foreground">Active</p></div>
          <div className="text-center rounded-lg p-2 bg-blue-50"><p className="text-lg font-bold tabular-nums text-blue-600">{m.completed_count}</p><p className="text-[10px] text-muted-foreground">Completed</p></div>
          <div className={cn("text-center rounded-lg p-2", m.pending_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.pending_count === 0 ? "text-green-600" : "text-amber-600")}>{m.pending_count}</p><p className="text-[10px] text-muted-foreground">Pending</p></div>
          <div className="text-center rounded-lg p-2 bg-teal-50"><p className="text-lg font-bold tabular-nums text-teal-600">{m.total_secondments}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Secondments</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Active"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><UserRoundCog className="h-3 w-3 text-teal-500 shrink-0" /><span className="font-medium">{r.staff}</span><span className="text-muted-foreground truncate">{r.type} · {r.org}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Secondment Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-teal-700"><Brain className="h-3 w-3" />ARIA Secondment Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-teal-200 bg-teal-50 text-teal-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
