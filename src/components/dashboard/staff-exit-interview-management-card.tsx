"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DoorOpen, ChevronRight, AlertTriangle, Brain, Clock, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_interviews: 6, incomplete_count: 2, overdue_count: 1, knowledge_transfer_rate: 50.0, handover_rate: 66.7, equipment_return_rate: 83.3, access_revoked_rate: 66.7, avg_satisfaction: 6.2, unique_staff: 5, unique_interviewers: 2 };

const DEMO_RECORDS: { staff: string; reason: string; status: string; interviewer: string }[] = [
  { staff: "Staff A", reason: "Resignation", status: "Complete", interviewer: "D. Laville" },
  { staff: "Staff B", reason: "End of Contract", status: "Incomplete", interviewer: "J. Hughes" },
  { staff: "Staff C", reason: "Career Change", status: "Complete", interviewer: "D. Laville" },
  { staff: "Staff D", reason: "Retirement", status: "Pending", interviewer: "J. Hughes" },
  { staff: "Staff E", reason: "Transfer", status: "Overdue", interviewer: "D. Laville" },
  { staff: "Staff A", reason: "Personal Reasons", status: "Complete", interviewer: "J. Hughes" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "access_not_revoked", severity: "critical", message: "2 departed staff still have system access — revoke immediately." },
  { type: "overdue", severity: "high", message: "1 exit interview overdue — complete before final pay." },
  { type: "no_handover", severity: "medium", message: "2 departures without handover document provided." },
];

const ARIA_INSIGHTS = [
  "6 exit interviews across 5 staff. Incomplete: 2. Overdue: 1. Avg satisfaction: 6.2/10.",
  "Priority: 2 staff with access not revoked. Knowledge transfer 50.0%. Equipment return 83.3%.",
  "Exit interviews protect both staff and service. Are patterns in departure reasons being tracked? Is knowledge genuinely transferred before the last day?",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Complete": { label: "Complete", color: "text-green-700 bg-green-50 border-green-200" },
  "Incomplete": { label: "Incomplete", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Pending": { label: "Pending", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Overdue": { label: "Overdue", color: "text-red-700 bg-red-50 border-red-200" },
};

export function StaffExitInterviewManagementCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-orange-200">
      <CardHeader className="pb-3 bg-orange-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><DoorOpen className="h-4 w-4 text-orange-600" /><span className="text-orange-900">Exit Interviews</span></CardTitle>
          <Link href="/staff-exit-interview-management" className="text-xs text-orange-600 hover:underline flex items-center gap-1">Interviews <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.incomplete_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.incomplete_count === 0 ? "text-green-600" : "text-amber-600")}>{m.incomplete_count}</p><p className="text-[10px] text-muted-foreground">Incomplete</p></div>
          <div className={cn("text-center rounded-lg p-2", m.overdue_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.overdue_count === 0 ? "text-green-600" : "text-red-600")}>{m.overdue_count}</p><p className="text-[10px] text-muted-foreground">Overdue</p></div>
          <div className="text-center rounded-lg p-2 bg-blue-50"><p className="text-lg font-bold tabular-nums text-blue-600">{m.unique_staff}</p><p className="text-[10px] text-muted-foreground">Staff</p></div>
          <div className="text-center rounded-lg p-2 bg-orange-50"><p className="text-lg font-bold tabular-nums text-orange-600">{m.total_interviews}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Interviews</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Pending"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><UserMinus className="h-3 w-3 text-orange-500 shrink-0" /><span className="font-medium">{r.staff}</span><span className="text-muted-foreground truncate">{r.reason} · {r.interviewer}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Exit Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-orange-700"><Brain className="h-3 w-3" />ARIA Exit Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-orange-200 bg-orange-50 text-orange-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
