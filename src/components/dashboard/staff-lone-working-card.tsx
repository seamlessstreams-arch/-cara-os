"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, ChevronRight, AlertTriangle, Brain, Clock, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_assessments: 14, very_high_count: 1, high_count: 3, not_authorised_count: 2, risk_assessed_rate: 85.7, manager_authorised_rate: 85.7, communication_plan_rate: 78.6, unique_staff: 6 };

const DEMO_RECORDS: { staff: string; scenario: string; risk: string; auth: string }[] = [
  { staff: "Staff A", scenario: "Night Solo", risk: "High", auth: "Manager" },
  { staff: "Staff B", scenario: "Community", risk: "Medium", auth: "Senior" },
  { staff: "Staff C", scenario: "Sleep-In", risk: "Low", auth: "Standing" },
  { staff: "Staff D", scenario: "School Run", risk: "Low", auth: "Manager" },
  { staff: "Staff A", scenario: "Emergency", risk: "V. High", auth: "None" },
  { staff: "Staff E", scenario: "Transport", risk: "Medium", auth: "Manager" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "very_high", severity: "critical", message: "Staff A lone working in emergency cover — very high risk without authorisation." },
  { type: "not_assessed", severity: "high", message: "2 lone working arrangements not risk assessed." },
  { type: "no_plan", severity: "high", message: "3 arrangements have no communication plan." },
];

const ARIA_INSIGHTS = [
  "14 assessments. 6 staff. V.High: 1. High: 3. Not authorised: 2. Assessed: 85.7%. Comms: 78.6%.",
  "Priority: 1 v.high no auth. 2 not assessed. 3 no comms plan. Strengthen lone working protocols.",
  "Positive: Good check-in protocols. First aid trained. Safeguarding trained. Policy compliance improving.",
];

const RISK_BADGES: Record<string, { label: string; color: string }> = {
  "V. High": { label: "V. High", color: "text-red-700 bg-red-50 border-red-200" },
  "High": { label: "High", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Medium": { label: "Medium", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Low": { label: "Low", color: "text-green-700 bg-green-50 border-green-200" },
};

export function StaffLoneWorkingCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><UserCheck className="h-4 w-4 text-brand" />Lone Working</CardTitle>
          <Link href="/staff-lone-working" className="text-xs text-brand hover:underline flex items-center gap-1">Assessments <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.risk_assessed_rate >= 95 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.risk_assessed_rate >= 95 ? "text-green-600" : "text-amber-600")}>{m.risk_assessed_rate}%</p><p className="text-[10px] text-muted-foreground">Assessed</p></div>
          <div className={cn("text-center rounded-lg p-2", m.very_high_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.very_high_count === 0 ? "text-green-600" : "text-red-600")}>{m.very_high_count}</p><p className="text-[10px] text-muted-foreground">V. High</p></div>
          <div className={cn("text-center rounded-lg p-2", m.not_authorised_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.not_authorised_count === 0 ? "text-green-600" : "text-red-600")}>{m.not_authorised_count}</p><p className="text-[10px] text-muted-foreground">No Auth</p></div>
          <div className={cn("text-center rounded-lg p-2", m.communication_plan_rate >= 90 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.communication_plan_rate >= 90 ? "text-green-600" : "text-amber-600")}>{m.communication_plan_rate}%</p><p className="text-[10px] text-muted-foreground">Comms</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Assessments</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = RISK_BADGES[r.risk] ?? RISK_BADGES["Medium"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Radio className="h-3 w-3 text-amber-500 shrink-0" /><span className="font-medium">{r.staff}</span><span className="text-muted-foreground truncate">{r.scenario} · {r.auth}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Lone Working Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Safety Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
