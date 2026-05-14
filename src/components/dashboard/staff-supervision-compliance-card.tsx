"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, ChevronRight, AlertTriangle, Brain, Clock, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_supervisions: 15, overdue_count: 1, missed_count: 1, poor_quality_count: 1, not_started_count: 1, safeguarding_discussed_rate: 80.0, wellbeing_discussed_rate: 86.7, training_needs_rate: 66.7, average_duration: 52.3, unique_staff: 6 };

const DEMO_RECORDS: { staff: string; type: string; compliance: string; quality: string }[] = [
  { staff: "Staff A", type: "Formal 1-to-1", compliance: "On Schedule", quality: "Good" },
  { staff: "Staff B", type: "Group", compliance: "Slightly Over", quality: "Satisfactory" },
  { staff: "Staff C", type: "Reflective", compliance: "On Schedule", quality: "Excellent" },
  { staff: "Staff D", type: "Management", compliance: "Sig. Overdue", quality: "Poor" },
  { staff: "Staff E", type: "Formal 1-to-1", compliance: "Missed", quality: "N/A" },
  { staff: "Staff F", type: "Clinical", compliance: "Ahead", quality: "Good" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "supervision_overdue", severity: "high", message: "2 supervisions are significantly overdue or missed." },
  { type: "safeguarding_not_discussed", severity: "high", message: "3 supervisions have safeguarding not discussed." },
  { type: "training_not_reviewed", severity: "medium", message: "5 supervisions without training needs reviewed." },
];

const ARIA_INSIGHTS = [
  "15 supervisions. 6 staff. Overdue: 1. Missed: 1. Safeguarding: 80%. Training: 66.7%. Avg: 52 min.",
  "Priority: 2 overdue/missed. 3 no safeguarding. 5 no training review. Strengthen supervision compliance.",
  "Positive: Most supervisions on schedule. Wellbeing routinely discussed. Manager oversight consistent.",
];

const COMPLIANCE_BADGES: Record<string, { label: string; color: string }> = {
  "On Schedule": { label: "On Time", color: "text-green-700 bg-green-50 border-green-200" },
  "Slightly Over": { label: "Slight", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Ahead": { label: "Ahead", color: "text-green-700 bg-green-50 border-green-200" },
  "Sig. Overdue": { label: "Overdue", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Missed": { label: "Missed", color: "text-red-700 bg-red-50 border-red-200" },
};

export function StaffSupervisionComplianceCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-brand" />Supervision</CardTitle>
          <Link href="/staff-supervision-compliance" className="text-xs text-brand hover:underline flex items-center gap-1">Compliance <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.missed_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.missed_count === 0 ? "text-green-600" : "text-red-600")}>{m.missed_count}</p><p className="text-[10px] text-muted-foreground">Missed</p></div>
          <div className={cn("text-center rounded-lg p-2", m.overdue_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.overdue_count === 0 ? "text-green-600" : "text-amber-600")}>{m.overdue_count}</p><p className="text-[10px] text-muted-foreground">Overdue</p></div>
          <div className={cn("text-center rounded-lg p-2", m.poor_quality_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.poor_quality_count === 0 ? "text-green-600" : "text-amber-600")}>{m.poor_quality_count}</p><p className="text-[10px] text-muted-foreground">Poor</p></div>
          <div className="text-center rounded-lg p-2 bg-blue-50"><p className="text-lg font-bold tabular-nums text-blue-600">{m.unique_staff}</p><p className="text-[10px] text-muted-foreground">Staff</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Supervisions</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = COMPLIANCE_BADGES[r.compliance] ?? COMPLIANCE_BADGES["On Schedule"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><UserCog className="h-3 w-3 text-sky-500 shrink-0" /><span className="font-medium">{r.staff}</span><span className="text-muted-foreground truncate">{r.type} · {r.quality}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Supervision Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Supervision Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
