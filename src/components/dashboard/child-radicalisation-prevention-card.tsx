"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ChevronRight, AlertTriangle, Brain, Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_assessments: 8, high_risk_count: 0, significant_risk_count: 1, channel_active_count: 0, monitoring_count: 2, prevent_training_rate: 75.0, online_monitoring_rate: 62.5, channel_referral_rate: 12.5, multi_agency_rate: 37.5, child_views_rate: 87.5, family_engaged_rate: 62.5, safety_plan_rate: 50.0, unique_children: 4 };

const DEMO_RECORDS: { child: string; type: string; level: string; status: string }[] = [
  { child: "Child A", type: "Online Radical.", level: "Medium", status: "Monitoring" },
  { child: "Child B", type: "Peer Influence", level: "Low", status: "Closed" },
  { child: "Child C", type: "Far Right", level: "Significant", status: "Assessment" },
  { child: "Child A", type: "Single Issue", level: "Low", status: "Closed" },
  { child: "Child D", type: "Mixed Ideology", level: "Medium", status: "Monitoring" },
  { child: "Child B", type: "Eco Extremism", level: "Low", status: "Screening" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "significant_no_multi", severity: "high", message: "1 significant vulnerability without multi-agency involvement — escalate immediately." },
  { type: "prevent_training_gap", severity: "medium", message: "2 assessments where Prevent training not completed for staff involved." },
  { type: "child_views_gap", severity: "medium", message: "1 assessment where child views not obtained." },
];

const ARIA_INSIGHTS = [
  "8 assessments across 4 children. Significant: 1. Monitoring: 2. Channel active: 0.",
  "Priority: 1 significant without multi-agency. Online monitoring 62.5%. Safety plans 50.0%.",
  "Prevent is everyone's responsibility. Are vulnerability indicators understood? Are online risks being monitored alongside offline behaviours?",
];

const LEVEL_BADGES: Record<string, { label: string; color: string }> = {
  "Low": { label: "Low", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Medium": { label: "Medium", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Significant": { label: "Signif.", color: "text-orange-700 bg-orange-50 border-orange-200" },
  "High": { label: "High", color: "text-red-700 bg-red-50 border-red-200" },
};

export function ChildRadicalisationPreventionCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-pink-200">
      <CardHeader className="pb-3 bg-pink-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-pink-600" /><span className="text-pink-900">Prevent Duty</span></CardTitle>
          <Link href="/child-radicalisation-prevention" className="text-xs text-pink-600 hover:underline flex items-center gap-1">Assessments <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.high_risk_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.high_risk_count === 0 ? "text-green-600" : "text-red-600")}>{m.high_risk_count}</p><p className="text-[10px] text-muted-foreground">High</p></div>
          <div className={cn("text-center rounded-lg p-2", m.significant_risk_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.significant_risk_count === 0 ? "text-green-600" : "text-amber-600")}>{m.significant_risk_count}</p><p className="text-[10px] text-muted-foreground">Significant</p></div>
          <div className={cn("text-center rounded-lg p-2", m.monitoring_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.monitoring_count === 0 ? "text-green-600" : "text-amber-600")}>{m.monitoring_count}</p><p className="text-[10px] text-muted-foreground">Monitoring</p></div>
          <div className="text-center rounded-lg p-2 bg-pink-50"><p className="text-lg font-bold tabular-nums text-pink-600">{m.total_assessments}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Assessments</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = LEVEL_BADGES[r.level] ?? LEVEL_BADGES["Low"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Eye className="h-3 w-3 text-pink-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.type} · {r.status}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Prevent Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-pink-700"><Brain className="h-3 w-3" />ARIA Prevent Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-pink-200 bg-pink-50 text-pink-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
