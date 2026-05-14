"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ChevronRight, AlertTriangle, Brain, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_assessments: 6, not_ready_count: 1, not_assessed_count: 1, overdue_pathway_count: 1, not_started_pathway_count: 1, child_views_rate: 83.3, life_skills_rate: 66.7, housing_rate: 50.0, personal_advisor_rate: 66.7, unique_children: 5 };

const DEMO_RECORDS: { child: string; type: string; readiness: string; pathway: string }[] = [
  { child: "Child A", type: "Leaving Care", readiness: "Mostly Ready", pathway: "In Place" },
  { child: "Child B", type: "School Trans", readiness: "Not Ready", pathway: "Overdue" },
  { child: "Child C", type: "Semi-Indep", readiness: "Partially", pathway: "In Progress" },
  { child: "Child D", type: "Step Down", readiness: "Fully Ready", pathway: "In Place" },
  { child: "Child E", type: "Leaving Care", readiness: "Not Assessed", pathway: "Not Started" },
  { child: "Child A", type: "Age Trans", readiness: "Mostly Ready", pathway: "In Place" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "leaving_care_not_ready", severity: "critical", message: "Child B not ready for leaving care with pathway plan overdue." },
  { type: "pathway_overdue", severity: "high", message: "1 assessment has overdue pathway plan." },
  { type: "housing_not_identified", severity: "high", message: "3 assessments have no housing identified." },
];

const ARIA_INSIGHTS = [
  "6 assessments. Not ready: 1. Not assessed: 1. Pathway overdue: 1. Not started: 1. Life skills: 66.7%. Housing: 50%.",
  "Priority: 1 leaving care not ready. 1 pathway overdue. 3 no housing. Strengthen transition preparation.",
  "Positive: Child views increasingly included. Care plans updated. Social workers consistently involved.",
];

const READINESS_BADGES: Record<string, { label: string; color: string }> = {
  "Fully Ready": { label: "Ready", color: "text-green-700 bg-green-50 border-green-200" },
  "Mostly Ready": { label: "Mostly", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Partially": { label: "Partial", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Not Ready": { label: "Not Ready", color: "text-red-700 bg-red-50 border-red-200" },
  "Not Assessed": { label: "N/A", color: "text-gray-700 bg-gray-50 border-gray-200" },
};

export function TransitionPlanningReadinessCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4 text-brand" />Transition Planning</CardTitle>
          <Link href="/transition-planning-readiness" className="text-xs text-brand hover:underline flex items-center gap-1">Readiness <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.not_ready_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.not_ready_count === 0 ? "text-green-600" : "text-red-600")}>{m.not_ready_count}</p><p className="text-[10px] text-muted-foreground">Not Ready</p></div>
          <div className={cn("text-center rounded-lg p-2", m.overdue_pathway_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.overdue_pathway_count === 0 ? "text-green-600" : "text-red-600")}>{m.overdue_pathway_count}</p><p className="text-[10px] text-muted-foreground">Overdue</p></div>
          <div className={cn("text-center rounded-lg p-2", m.not_started_pathway_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.not_started_pathway_count === 0 ? "text-green-600" : "text-amber-600")}>{m.not_started_pathway_count}</p><p className="text-[10px] text-muted-foreground">Not Started</p></div>
          <div className="text-center rounded-lg p-2 bg-blue-50"><p className="text-lg font-bold tabular-nums text-blue-600">{m.total_assessments}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Assessments</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = READINESS_BADGES[r.readiness] ?? READINESS_BADGES["Not Assessed"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><MapPin className="h-3 w-3 text-green-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.type} · {r.pathway}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Transition Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Transition Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
