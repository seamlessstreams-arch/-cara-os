"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, ChevronRight, AlertTriangle, Brain, Clock, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_assessments: 8, suitable_count: 5, unsuitable_count: 1, pending_count: 2, impact_risk_rate: 75.0, matching_criteria_rate: 62.5, existing_children_consulted_rate: 50.0, unique_children: 6 };

const DEMO_RECORDS: { child: string; stage: string; match: string; status: string }[] = [
  { child: "Child A", stage: "Admission Day", match: "Good", status: "Suitable" },
  { child: "Child B", stage: "Panel", match: "Excellent", status: "Suitable" },
  { child: "Child C", stage: "Matching", match: "Poor", status: "Pending" },
  { child: "Child D", stage: "Pre-Visit", match: "Good", status: "Suitable" },
  { child: "Child E", stage: "Initial", match: "Acceptable", status: "Pending" },
  { child: "Child F", stage: "72hr Review", match: "Good", status: "Suitable" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "poor_match", severity: "critical", message: "Poor match assessed as suitable — review matching decision." },
  { type: "no_impact", severity: "high", message: "2 assessments without impact risk — complete before admission." },
  { type: "not_consulted", severity: "high", message: "4 assessments with existing children not consulted." },
];

const ARIA_INSIGHTS = [
  "8 assessments. Suitable: 5. Pending: 2. Impact: 75%. Matching: 62.5%. Consulted: 50%. 6 children.",
  "Priority: 1 poor match admitted. 2 missing impact risks. Children not consulted. Improve matching process.",
  "Positive: Panel decisions recorded. Pre-visits completed. 72hr reviews done. Strengthen consultation.",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Suitable": { label: "Suitable", color: "text-green-700 bg-green-50 border-green-200" },
  "Pending": { label: "Pending", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Unsuitable": { label: "Unsuit.", color: "text-red-700 bg-red-50 border-red-200" },
};

export function AdmissionAssessmentCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><UserPlus className="h-4 w-4 text-brand" />Admission Assessment</CardTitle>
          <Link href="/admission-assessments" className="text-xs text-brand hover:underline flex items-center gap-1">Admissions <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg p-2 bg-blue-50"><p className="text-lg font-bold tabular-nums text-blue-600">{m.total_assessments}</p><p className="text-[10px] text-muted-foreground">Assessed</p></div>
          <div className={cn("text-center rounded-lg p-2", m.pending_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.pending_count === 0 ? "text-green-600" : "text-amber-600")}>{m.pending_count}</p><p className="text-[10px] text-muted-foreground">Pending</p></div>
          <div className={cn("text-center rounded-lg p-2", m.impact_risk_rate >= 100 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.impact_risk_rate >= 100 ? "text-green-600" : "text-amber-600")}>{m.impact_risk_rate}%</p><p className="text-[10px] text-muted-foreground">Impact</p></div>
          <div className={cn("text-center rounded-lg p-2", m.unsuitable_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.unsuitable_count === 0 ? "text-green-600" : "text-red-600")}>{m.unsuitable_count}</p><p className="text-[10px] text-muted-foreground">Unsuit.</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Assessments</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Pending"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Target className="h-3 w-3 text-indigo-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.stage} · {r.match}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Admission Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Admission Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
