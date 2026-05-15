"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ChevronRight, AlertTriangle, Brain, Clock, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_records: 8, completed_count: 3, in_progress_count: 3, not_started_count: 1, expired_count: 1, reg32_compliant_rate: 62.5, within_deadline_rate: 75.0, assessor_assigned_rate: 87.5, portfolio_rate: 75.0, employer_funded_rate: 87.5, study_time_rate: 62.5, mentor_rate: 50.0, registration_current_rate: 62.5, unique_staff: 6 };

const DEMO_RECORDS: { staff: string; level: string; status: string; type: string }[] = [
  { staff: "Staff A", level: "Level 3", status: "Completed", type: "Diploma RCC" },
  { staff: "Staff B", level: "Level 3", status: "In Progress", type: "Diploma RCC" },
  { staff: "Staff C", level: "Level 5", status: "In Progress", type: "Leadership" },
  { staff: "Staff D", level: "Level 3", status: "Not Started", type: "Diploma RCC" },
  { staff: "Staff E", level: "Level 3", status: "Completed", type: "Diploma RCC" },
  { staff: "Staff F", level: "Level 4", status: "Expired", type: "Certificate" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "reg32_not_progressing", severity: "critical", message: "Staff D not Reg 32 compliant and qualification not in progress — immediate action required." },
  { type: "expired_qualification", severity: "high", message: "1 staff member with expired qualification — arrange renewal." },
  { type: "no_mentor", severity: "medium", message: "4 staff without mentor assigned for qualification support." },
];

const ARIA_INSIGHTS = [
  "8 records across 6 staff. Completed: 3. In progress: 3. Not started: 1. Expired: 1.",
  "Priority: 1 non-compliant not progressing. Reg 32 compliant 62.5%. Within deadline 75.0%.",
  "Qualifications underpin safe practice. Is every staff member on track for Reg 32 compliance? Are portfolios progressing with adequate support?",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Completed": { label: "Complete", color: "text-green-700 bg-green-50 border-green-200" },
  "In Progress": { label: "Progress", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Not Started": { label: "Not Started", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Expired": { label: "Expired", color: "text-red-700 bg-red-50 border-red-200" },
  "Enrolled": { label: "Enrolled", color: "text-sky-700 bg-sky-50 border-sky-200" },
};

export function StaffNvqQualificationTrackingCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-sky-200">
      <CardHeader className="pb-3 bg-sky-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4 text-sky-600" /><span className="text-sky-900">NVQ Tracking</span></CardTitle>
          <Link href="/staff-nvq-qualification-tracking" className="text-xs text-sky-600 hover:underline flex items-center gap-1">Qualifications <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.not_started_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.not_started_count === 0 ? "text-green-600" : "text-red-600")}>{m.not_started_count}</p><p className="text-[10px] text-muted-foreground">Not Started</p></div>
          <div className={cn("text-center rounded-lg p-2", m.expired_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.expired_count === 0 ? "text-green-600" : "text-red-600")}>{m.expired_count}</p><p className="text-[10px] text-muted-foreground">Expired</p></div>
          <div className="text-center rounded-lg p-2 bg-green-50"><p className="text-lg font-bold tabular-nums text-green-600">{m.completed_count}</p><p className="text-[10px] text-muted-foreground">Completed</p></div>
          <div className="text-center rounded-lg p-2 bg-sky-50"><p className="text-lg font-bold tabular-nums text-sky-600">{m.total_records}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Records</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["In Progress"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Award className="h-3 w-3 text-sky-500 shrink-0" /><span className="font-medium">{r.staff}</span><span className="text-muted-foreground truncate">{r.level} · {r.type}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Qualification Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-sky-700"><Brain className="h-3 w-3" />ARIA Qualification Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-sky-200 bg-sky-50 text-sky-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
