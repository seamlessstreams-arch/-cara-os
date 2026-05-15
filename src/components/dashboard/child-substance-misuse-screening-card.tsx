"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, ChevronRight, AlertTriangle, Brain, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_screenings: 8, high_risk_count: 1, immediate_intervention_count: 0, no_concern_count: 4, referral_rate: 37.5, risk_assessment_rate: 87.5, safety_plan_rate: 25.0, parental_notification_rate: 75.0, social_worker_rate: 62.5, follow_up_rate: 50.0, unique_children: 5, unique_assessors: 3 };

const DEMO_RECORDS: { child: string; substance: string; outcome: string; intervention: string }[] = [
  { child: "Child A", substance: "Tobacco", outcome: "No Concern", intervention: "Education" },
  { child: "Child B", substance: "Cannabis", outcome: "Moderate Risk", intervention: "Counselling" },
  { child: "Child C", substance: "Alcohol", outcome: "Low Risk", intervention: "Education" },
  { child: "Child D", substance: "NPS", outcome: "High Risk", intervention: "CAMHS Referral" },
  { child: "Child A", substance: "Solvents", outcome: "No Concern", intervention: "None Required" },
  { child: "Child E", substance: "Cannabis", outcome: "Moderate Risk", intervention: "Multi-Agency" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "high_risk_no_referral", severity: "high", message: "1 high-risk screening without referral — arrange specialist intervention." },
  { type: "risk_assessment_gap", severity: "medium", message: "1 screening without risk assessment completed." },
  { type: "social_worker_gap", severity: "medium", message: "3 screenings without social worker notification." },
];

const ARIA_INSIGHTS = [
  "8 screenings across 5 children. High risk: 1. Immediate: 0. No concern: 4.",
  "Priority: 1 high-risk without referral. Risk assessment 87.5%. Safety plans 25.0%.",
  "Substance misuse often masks deeper pain. Are screenings supportive, not punitive? Are follow-ups genuinely therapeutic?",
];

const OUTCOME_BADGES: Record<string, { label: string; color: string }> = {
  "No Concern": { label: "Clear", color: "text-green-700 bg-green-50 border-green-200" },
  "Low Risk": { label: "Low", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Moderate Risk": { label: "Moderate", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "High Risk": { label: "High", color: "text-red-700 bg-red-50 border-red-200" },
  "Immediate Intervention": { label: "Immediate", color: "text-red-900 bg-red-100 border-red-300" },
};

export function ChildSubstanceMisuseScreeningCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-rose-200">
      <CardHeader className="pb-3 bg-rose-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="h-4 w-4 text-rose-600" /><span className="text-rose-900">Substance Screening</span></CardTitle>
          <Link href="/child-substance-misuse-screening" className="text-xs text-rose-600 hover:underline flex items-center gap-1">Screenings <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.immediate_intervention_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.immediate_intervention_count === 0 ? "text-green-600" : "text-red-600")}>{m.immediate_intervention_count}</p><p className="text-[10px] text-muted-foreground">Immediate</p></div>
          <div className={cn("text-center rounded-lg p-2", m.high_risk_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.high_risk_count === 0 ? "text-green-600" : "text-red-600")}>{m.high_risk_count}</p><p className="text-[10px] text-muted-foreground">High</p></div>
          <div className={cn("text-center rounded-lg p-2", m.no_concern_count === m.total_screenings ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.no_concern_count === m.total_screenings ? "text-green-600" : "text-amber-600")}>{m.no_concern_count}</p><p className="text-[10px] text-muted-foreground">Clear</p></div>
          <div className="text-center rounded-lg p-2 bg-rose-50"><p className="text-lg font-bold tabular-nums text-rose-600">{m.total_screenings}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Screenings</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = OUTCOME_BADGES[r.outcome] ?? OUTCOME_BADGES["No Concern"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><ShieldAlert className="h-3 w-3 text-rose-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.substance} · {r.intervention}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Screening Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-rose-700"><Brain className="h-3 w-3" />ARIA Substance Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-rose-200 bg-rose-50 text-rose-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
