"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquareWarning, ChevronRight, AlertTriangle, Brain, Clock, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_complaints: 6, upheld_count: 1, escalated_count: 1, overdue_count: 1, pending_count: 2, acknowledged_rate: 83.3, learning_identified_rate: 66.7, satisfaction_rate: 50.0, average_resolution_days: 12.5 };

const DEMO_RECORDS: { complainant: string; category: string; status: string; outcome: string }[] = [
  { complainant: "Parent A", category: "Care Quality", status: "Resolved", outcome: "Upheld" },
  { complainant: "Social Worker", category: "Medication", status: "Investigating", outcome: "Pending" },
  { complainant: "Child B", category: "Food", status: "Received", outcome: "Pending" },
  { complainant: "Parent C", category: "Staff Conduct", status: "Escalated", outcome: "Partially" },
  { complainant: "Advocate", category: "Environment", status: "Resolved", outcome: "Not Upheld" },
  { complainant: "Parent A", category: "Contact", status: "Resolved", outcome: "Withdrawn" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "response_overdue", severity: "high", message: "1 complaint has overdue response." },
  { type: "no_learning_identified", severity: "high", message: "2 complaints have no learning identified." },
  { type: "satisfaction_not_assessed", severity: "medium", message: "3 complaints without satisfaction assessment." },
];

const ARIA_INSIGHTS = [
  "6 complaints. Upheld: 1. Escalated: 1. Overdue: 1. Learning: 66.7%. Satisfaction: 50%. Avg: 12.5 days.",
  "Priority: 1 overdue. 2 no learning. 3 no satisfaction check. Strengthen complaint follow-up.",
  "Positive: Acknowledgement rate improving. Manager oversight consistent. Appeals routinely offered.",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Resolved": { label: "Resolved", color: "text-green-700 bg-green-50 border-green-200" },
  "Investigating": { label: "Investigating", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Received": { label: "Received", color: "text-gray-700 bg-gray-50 border-gray-200" },
  "Escalated": { label: "Escalated", color: "text-red-700 bg-red-50 border-red-200" },
};

export function ComplaintResolutionTrackingCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><MessageSquareWarning className="h-4 w-4 text-brand" />Complaints</CardTitle>
          <Link href="/complaint-resolution-tracking" className="text-xs text-brand hover:underline flex items-center gap-1">Tracking <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.overdue_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.overdue_count === 0 ? "text-green-600" : "text-red-600")}>{m.overdue_count}</p><p className="text-[10px] text-muted-foreground">Overdue</p></div>
          <div className={cn("text-center rounded-lg p-2", m.escalated_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.escalated_count === 0 ? "text-green-600" : "text-amber-600")}>{m.escalated_count}</p><p className="text-[10px] text-muted-foreground">Escalated</p></div>
          <div className={cn("text-center rounded-lg p-2", m.pending_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.pending_count === 0 ? "text-green-600" : "text-amber-600")}>{m.pending_count}</p><p className="text-[10px] text-muted-foreground">Pending</p></div>
          <div className="text-center rounded-lg p-2 bg-blue-50"><p className="text-lg font-bold tabular-nums text-blue-600">{m.total_complaints}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Complaints</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Received"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><FileWarning className="h-3 w-3 text-amber-500 shrink-0" /><span className="font-medium">{r.complainant}</span><span className="text-muted-foreground truncate">{r.category} · {r.outcome}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Complaint Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Complaints Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
