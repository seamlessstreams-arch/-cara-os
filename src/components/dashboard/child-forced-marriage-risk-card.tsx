"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ban, ChevronRight, AlertTriangle, Brain, Clock, ShieldBan } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_assessments: 6, high_risk_count: 0, fmpo_count: 0, fmu_contacted_count: 1, safety_plan_rate: 33.3, multi_agency_rate: 50.0, police_notification_rate: 16.7, passport_secured_rate: 16.7, travel_restriction_rate: 16.7, review_scheduled_rate: 66.7, unique_children: 4, unique_assessors: 2 };

const DEMO_RECORDS: { child: string; risk: string; indicators: number; status: string }[] = [
  { child: "Child A", risk: "No Identified Risk", indicators: 0, status: "Routine" },
  { child: "Child B", risk: "Low", indicators: 1, status: "Monitoring" },
  { child: "Child C", risk: "Medium", indicators: 3, status: "Multi-Agency" },
  { child: "Child A", risk: "No Identified Risk", indicators: 0, status: "Review" },
  { child: "Child D", risk: "Low", indicators: 2, status: "Monitoring" },
  { child: "Child C", risk: "Medium", indicators: 4, status: "FMU Contact" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "no_multi_agency", severity: "medium", message: "2 assessments with identified risk without multi-agency referral." },
  { type: "review_gap", severity: "medium", message: "2 assessments without review date scheduled." },
];

const ARIA_INSIGHTS = [
  "6 assessments across 4 children. High+Immediate: 0. FMPOs: 0. FMU contacted: 1.",
  "Priority: 2 without multi-agency referral. Safety plans 33.3%. Passport secured 16.7%.",
  "Forced marriage is abuse. Are staff trained to recognise the signs? Is the Forced Marriage Unit pathway clear to all?",
];

const RISK_BADGES: Record<string, { label: string; color: string }> = {
  "No Identified Risk": { label: "None", color: "text-green-700 bg-green-50 border-green-200" },
  "Low": { label: "Low", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Medium": { label: "Medium", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "High": { label: "High", color: "text-red-700 bg-red-50 border-red-200" },
  "Immediate": { label: "Immediate", color: "text-red-900 bg-red-100 border-red-300" },
};

export function ChildForcedMarriageRiskCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-fuchsia-200">
      <CardHeader className="pb-3 bg-fuchsia-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Ban className="h-4 w-4 text-fuchsia-600" /><span className="text-fuchsia-900">Forced Marriage Risk</span></CardTitle>
          <Link href="/child-forced-marriage-risk" className="text-xs text-fuchsia-600 hover:underline flex items-center gap-1">Assessments <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.high_risk_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.high_risk_count === 0 ? "text-green-600" : "text-red-600")}>{m.high_risk_count}</p><p className="text-[10px] text-muted-foreground">High+</p></div>
          <div className={cn("text-center rounded-lg p-2", m.fmpo_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.fmpo_count === 0 ? "text-green-600" : "text-amber-600")}>{m.fmpo_count}</p><p className="text-[10px] text-muted-foreground">FMPOs</p></div>
          <div className={cn("text-center rounded-lg p-2", m.fmu_contacted_count === 0 ? "bg-green-50" : "bg-blue-50")}><p className={cn("text-lg font-bold tabular-nums", m.fmu_contacted_count === 0 ? "text-green-600" : "text-blue-600")}>{m.fmu_contacted_count}</p><p className="text-[10px] text-muted-foreground">FMU</p></div>
          <div className="text-center rounded-lg p-2 bg-fuchsia-50"><p className="text-lg font-bold tabular-nums text-fuchsia-600">{m.total_assessments}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Assessments</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = RISK_BADGES[r.risk] ?? RISK_BADGES["No Identified Risk"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><ShieldBan className="h-3 w-3 text-fuchsia-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.indicators} ind. · {r.status}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />FM Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-fuchsia-700"><Brain className="h-3 w-3" />ARIA FM Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
