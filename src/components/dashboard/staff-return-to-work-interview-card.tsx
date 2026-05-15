"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BriefcaseMedical, ChevronRight, AlertTriangle, Brain, Clock, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_interviews: 8, not_fit_count: 1, phased_return_count: 2, adjustments_count: 2, oh_referral_count: 1, trigger_level_count: 1, support_plan_rate: 62.5, welfare_check_rate: 87.5, follow_up_rate: 50.0, avg_absence_days: 12, unique_staff: 6 };

const DEMO_RECORDS: { staff: string; absence: string; days: number; status: string }[] = [
  { staff: "Staff A", absence: "Short-term", days: 3, status: "Fit" },
  { staff: "Staff B", absence: "Long-term", days: 42, status: "Phased" },
  { staff: "Staff C", absence: "Bereavement", days: 5, status: "Fit" },
  { staff: "Staff D", absence: "Suspension", days: 14, status: "Not Fit" },
  { staff: "Staff E", absence: "Short-term", days: 2, status: "Fit" },
  { staff: "Staff F", absence: "Personal", days: 7, status: "Phased" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "not_fit_no_adjustments", severity: "critical", message: "Staff D not fit to return without adjustments — review required immediately." },
  { type: "trigger_level", severity: "high", message: "1 staff member at Stage 2 trigger level." },
  { type: "phased_no_support", severity: "medium", message: "1 phased return without support plan agreed." },
];

const ARIA_INSIGHTS = [
  "8 interviews across 6 staff. Not fit: 1. Phased: 2. Avg absence: 12 days.",
  "Priority: 1 not fit without adjustments. Trigger levels reached: 1. Support plans 62.5%.",
  "Return to work is a critical welfare moment. Are interviews genuinely supportive? Is phased return properly resourced?",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Fit": { label: "Fit", color: "text-green-700 bg-green-50 border-green-200" },
  "Phased": { label: "Phased", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Not Fit": { label: "Not Fit", color: "text-red-700 bg-red-50 border-red-200" },
};

export function StaffReturnToWorkInterviewCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-cyan-200">
      <CardHeader className="pb-3 bg-cyan-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><BriefcaseMedical className="h-4 w-4 text-cyan-600" /><span className="text-cyan-900">Return to Work</span></CardTitle>
          <Link href="/staff-return-to-work-interview" className="text-xs text-cyan-600 hover:underline flex items-center gap-1">Interviews <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.not_fit_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.not_fit_count === 0 ? "text-green-600" : "text-red-600")}>{m.not_fit_count}</p><p className="text-[10px] text-muted-foreground">Not Fit</p></div>
          <div className={cn("text-center rounded-lg p-2", m.phased_return_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.phased_return_count === 0 ? "text-green-600" : "text-amber-600")}>{m.phased_return_count}</p><p className="text-[10px] text-muted-foreground">Phased</p></div>
          <div className={cn("text-center rounded-lg p-2", m.trigger_level_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.trigger_level_count === 0 ? "text-green-600" : "text-amber-600")}>{m.trigger_level_count}</p><p className="text-[10px] text-muted-foreground">Triggers</p></div>
          <div className="text-center rounded-lg p-2 bg-cyan-50"><p className="text-lg font-bold tabular-nums text-cyan-600">{m.total_interviews}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Interviews</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Fit"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><UserCheck className="h-3 w-3 text-cyan-500 shrink-0" /><span className="font-medium">{r.staff}</span><span className="text-muted-foreground truncate">{r.absence} · {r.days}d</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Return Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-cyan-700"><Brain className="h-3 w-3" />ARIA Return Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-cyan-200 bg-cyan-50 text-cyan-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
