"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Siren, ChevronRight, AlertTriangle, Brain, Clock, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_assessments: 6, high_risk_count: 1, county_lines_count: 1, nrm_referral_count: 1, safety_plan_rate: 50.0, exploitation_screening_rate: 83.3, multi_agency_rate: 33.3, police_notification_rate: 50.0, unique_children: 4, unique_assessors: 3 };

const DEMO_RECORDS: { child: string; risk: string; indicators: number; strategy: string }[] = [
  { child: "Child A", risk: "No Identified Risk", indicators: 0, strategy: "None Required" },
  { child: "Child B", risk: "Medium", indicators: 3, strategy: "Safety Plan" },
  { child: "Child C", risk: "High", indicators: 6, strategy: "Multi-Agency Plan" },
  { child: "Child D", risk: "Low", indicators: 1, strategy: "None Required" },
  { child: "Child B", risk: "Medium", indicators: 4, strategy: "Restricted Contact" },
  { child: "Child C", risk: "Significant", indicators: 8, strategy: "Placement Move" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "significant_no_safety", severity: "critical", message: "Child C at significant risk without safety plan — immediate action required." },
  { type: "county_lines_no_nrm", severity: "critical", message: "1 child with county lines risk without NRM referral." },
  { type: "high_no_multi_agency", severity: "high", message: "1 high-risk assessment without multi-agency meeting held." },
];

const ARIA_INSIGHTS = [
  "6 assessments across 4 children. High+Significant: 1. County lines: 1. NRM referrals: 1.",
  "Priority: 1 significant risk without safety plan. Multi-agency meetings 33.3%. Exploitation screening 83.3%.",
  "Gang affiliation is a safeguarding issue, not a behaviour issue. Are disruption strategies genuinely protective? Is the child's voice centred in planning?",
];

const RISK_BADGES: Record<string, { label: string; color: string }> = {
  "No Identified Risk": { label: "None", color: "text-green-700 bg-green-50 border-green-200" },
  "Low": { label: "Low", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Medium": { label: "Medium", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "High": { label: "High", color: "text-red-700 bg-red-50 border-red-200" },
  "Significant": { label: "Signif.", color: "text-red-900 bg-red-100 border-red-300" },
};

export function ChildGangsAffiliationRiskCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-orange-200">
      <CardHeader className="pb-3 bg-orange-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Siren className="h-4 w-4 text-orange-600" /><span className="text-orange-900">Gangs Risk</span></CardTitle>
          <Link href="/child-gangs-affiliation-risk" className="text-xs text-orange-600 hover:underline flex items-center gap-1">Assessments <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.high_risk_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.high_risk_count === 0 ? "text-green-600" : "text-red-600")}>{m.high_risk_count}</p><p className="text-[10px] text-muted-foreground">High+</p></div>
          <div className={cn("text-center rounded-lg p-2", m.county_lines_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.county_lines_count === 0 ? "text-green-600" : "text-red-600")}>{m.county_lines_count}</p><p className="text-[10px] text-muted-foreground">County Lines</p></div>
          <div className={cn("text-center rounded-lg p-2", m.nrm_referral_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.nrm_referral_count === 0 ? "text-green-600" : "text-amber-600")}>{m.nrm_referral_count}</p><p className="text-[10px] text-muted-foreground">NRM</p></div>
          <div className="text-center rounded-lg p-2 bg-orange-50"><p className="text-lg font-bold tabular-nums text-orange-600">{m.total_assessments}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Assessments</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = RISK_BADGES[r.risk] ?? RISK_BADGES["No Identified Risk"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><ShieldOff className="h-3 w-3 text-orange-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.indicators} ind. · {r.strategy}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Gangs Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-orange-700"><Brain className="h-3 w-3" />ARIA Gangs Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-orange-200 bg-orange-50 text-orange-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
