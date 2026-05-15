"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronRight, AlertTriangle, Brain, Clock, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_records: 8, non_compliant_count: 1, partially_compliant_count: 2, pending_count: 1, dbs_verified_rate: 87.5, references_rate: 75.0, qualifications_rate: 75.0, induction_rate: 62.5, safeguarding_rate: 75.0, mandatory_training_rate: 62.5, supervision_rate: 50.0, avg_shifts: 12, unique_staff: 6, unique_agencies: 3 };

const DEMO_RECORDS: { staff: string; agency: string; status: string; shifts: number }[] = [
  { staff: "Staff A", agency: "CareStaff Ltd", status: "Compliant", shifts: 18 },
  { staff: "Staff B", agency: "Temp Care", status: "Partially Compliant", shifts: 8 },
  { staff: "Staff C", agency: "CareStaff Ltd", status: "Compliant", shifts: 22 },
  { staff: "Staff D", agency: "Relief Cover", status: "Non-Compliant", shifts: 3 },
  { staff: "Staff E", agency: "Temp Care", status: "Pending Review", shifts: 5 },
  { staff: "Staff F", agency: "CareStaff Ltd", status: "Compliant", shifts: 15 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "non_compliant", severity: "critical", message: "Staff D non-compliant — suspend shifts until compliance resolved." },
  { type: "dbs_not_verified", severity: "critical", message: "1 agency worker without DBS verification — safeguarding risk." },
  { type: "induction_incomplete", severity: "high", message: "3 agency workers without induction completed." },
];

const ARIA_INSIGHTS = [
  "8 records across 6 staff from 3 agencies. Non-compliant: 1. Partial: 2. Pending: 1.",
  "Priority: 1 non-compliant worker. DBS verified 87.5%. Induction 62.5%. Supervision 50.0%.",
  "Agency workers need the same oversight as permanent staff. Are inductions meaningful? Is supervision genuinely happening?",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Compliant": { label: "Compliant", color: "text-green-700 bg-green-50 border-green-200" },
  "Partially Compliant": { label: "Partial", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Non-Compliant": { label: "Non-Comp.", color: "text-red-700 bg-red-50 border-red-200" },
  "Pending Review": { label: "Pending", color: "text-blue-700 bg-blue-50 border-blue-200" },
};

export function StaffAgencyWorkerComplianceCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-emerald-200">
      <CardHeader className="pb-3 bg-emerald-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4 text-emerald-600" /><span className="text-emerald-900">Agency Compliance</span></CardTitle>
          <Link href="/staff-agency-worker-compliance" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">Records <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.non_compliant_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.non_compliant_count === 0 ? "text-green-600" : "text-red-600")}>{m.non_compliant_count}</p><p className="text-[10px] text-muted-foreground">Non-Comp.</p></div>
          <div className={cn("text-center rounded-lg p-2", m.partially_compliant_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.partially_compliant_count === 0 ? "text-green-600" : "text-amber-600")}>{m.partially_compliant_count}</p><p className="text-[10px] text-muted-foreground">Partial</p></div>
          <div className={cn("text-center rounded-lg p-2", m.pending_count === 0 ? "bg-green-50" : "bg-blue-50")}><p className={cn("text-lg font-bold tabular-nums", m.pending_count === 0 ? "text-green-600" : "text-blue-600")}>{m.pending_count}</p><p className="text-[10px] text-muted-foreground">Pending</p></div>
          <div className="text-center rounded-lg p-2 bg-emerald-50"><p className="text-lg font-bold tabular-nums text-emerald-600">{m.total_records}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Records</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Compliant"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><UserCog className="h-3 w-3 text-emerald-500 shrink-0" /><span className="font-medium">{r.staff}</span><span className="text-muted-foreground truncate">{r.agency} · {r.shifts} shifts</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Agency Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-emerald-700"><Brain className="h-3 w-3" />ARIA Agency Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
