"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ChevronRight, AlertTriangle, Brain, Clock, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_incidents: 12, severe_count: 1, critical_count: 1, restraint_count: 1, unknown_trigger_count: 2, de_escalation_rate: 66.7, debrief_rate: 58.3, positive_strategies_rate: 75.0, pattern_identified_rate: 50.0, unique_children: 5 };

const DEMO_RECORDS: { child: string; category: string; severity: string; outcome: string }[] = [
  { child: "Child A", category: "Verbal Aggression", severity: "Moderate", outcome: "De-escalated" },
  { child: "Child B", category: "Physical Aggression", severity: "Severe", outcome: "Restraint" },
  { child: "Child C", category: "Absconding", severity: "High", outcome: "Self-resolved" },
  { child: "Child A", category: "Property Damage", severity: "Moderate", outcome: "Partially Resolved" },
  { child: "Child D", category: "Withdrawal", severity: "Low", outcome: "De-escalated" },
  { child: "Child E", category: "Defiance", severity: "Critical", outcome: "Separation" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "restraint_no_deescalation", severity: "critical", message: "Child B had restraint used without de-escalation being attempted first." },
  { type: "debrief_not_completed", severity: "high", message: "5 incidents without debrief completed." },
  { type: "pattern_not_identified", severity: "medium", message: "6 incidents without pattern identified." },
];

const ARIA_INSIGHTS = [
  "12 incidents. Severe: 1. Critical: 1. Restraint: 1. Unknown triggers: 2. De-escalation: 66.7%. Debrief: 58.3%.",
  "Priority: 1 restraint without de-escalation. 5 no debrief. 6 patterns unidentified. Strengthen positive strategies.",
  "Positive: Positive strategies used in 75% of incidents. Social workers informed. Care plans updated for most.",
];

const SEVERITY_BADGES: Record<string, { label: string; color: string }> = {
  "Low": { label: "Low", color: "text-green-700 bg-green-50 border-green-200" },
  "Moderate": { label: "Mod", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "High": { label: "High", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Severe": { label: "Severe", color: "text-orange-700 bg-orange-50 border-orange-200" },
  "Critical": { label: "Crit", color: "text-red-700 bg-red-50 border-red-200" },
};

export function BehaviourPatternAnalysisCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-brand" />Behaviour Patterns</CardTitle>
          <Link href="/behaviour-pattern-analysis" className="text-xs text-brand hover:underline flex items-center gap-1">Analysis <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.restraint_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.restraint_count === 0 ? "text-green-600" : "text-red-600")}>{m.restraint_count}</p><p className="text-[10px] text-muted-foreground">Restraint</p></div>
          <div className={cn("text-center rounded-lg p-2", (m.severe_count + m.critical_count) === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", (m.severe_count + m.critical_count) === 0 ? "text-green-600" : "text-red-600")}>{m.severe_count + m.critical_count}</p><p className="text-[10px] text-muted-foreground">Sev/Crit</p></div>
          <div className={cn("text-center rounded-lg p-2", m.unknown_trigger_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.unknown_trigger_count === 0 ? "text-green-600" : "text-amber-600")}>{m.unknown_trigger_count}</p><p className="text-[10px] text-muted-foreground">Unknown</p></div>
          <div className="text-center rounded-lg p-2 bg-blue-50"><p className="text-lg font-bold tabular-nums text-blue-600">{m.total_incidents}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Incidents</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = SEVERITY_BADGES[r.severity] ?? SEVERITY_BADGES["Moderate"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><BarChart3 className="h-3 w-3 text-indigo-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.category} · {r.outcome}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Behaviour Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Behaviour Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
