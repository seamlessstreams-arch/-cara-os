"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, ChevronRight, AlertTriangle, Brain, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_assessments: 20, meets_count: 12, exceeds_count: 3, below_count: 2, not_competent_count: 1, competency_maintained_rate: 80.0, evidence_documented_rate: 70.0, unique_staff: 8 };

const DEMO_RECORDS: { staff: string; area: string; method: string; status: string }[] = [
  { staff: "Staff A", area: "Medication", method: "Observation", status: "Meets" },
  { staff: "Staff B", area: "Safeguarding", method: "Test", status: "Exceeds" },
  { staff: "Staff C", area: "Restraint", method: "Practical", status: "Develop" },
  { staff: "Staff D", area: "First Aid", method: "Scenario", status: "Meets" },
  { staff: "Staff E", area: "Medication", method: "Observation", status: "Not Yet" },
  { staff: "Staff A", area: "Recording", method: "Review", status: "Meets" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "med_incompetent", severity: "critical", message: "Staff not competent in medication — remove from duties." },
  { type: "below", severity: "high", message: "3 assessments below expectations — review development plans." },
  { type: "no_evidence", severity: "high", message: "6 assessments without evidence documented." },
];

const ARIA_INSIGHTS = [
  "20 assessments. Meets: 12. Exceeds: 3. Below: 2. Not competent: 1. Maintained: 80%. 8 staff.",
  "Priority: 1 medication incompetency. 3 below expectations. Evidence gaps. Update development plans.",
  "Positive: Most staff meeting expectations. Regular assessments. Good practical demonstrations.",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Meets": { label: "Meets", color: "text-green-700 bg-green-50 border-green-200" },
  "Exceeds": { label: "Exceeds", color: "text-green-700 bg-green-50 border-green-200" },
  "Develop": { label: "Develop", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Not Yet": { label: "Not Yet", color: "text-red-700 bg-red-50 border-red-200" },
};

export function StaffCompetencyAssessmentCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4 text-brand" />Staff Competency</CardTitle>
          <Link href="/staff-competency-assessments" className="text-xs text-brand hover:underline flex items-center gap-1">Competency <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.competency_maintained_rate >= 90 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.competency_maintained_rate >= 90 ? "text-green-600" : "text-amber-600")}>{m.competency_maintained_rate}%</p><p className="text-[10px] text-muted-foreground">Maintained</p></div>
          <div className="text-center rounded-lg p-2 bg-green-50"><p className="text-lg font-bold tabular-nums text-green-600">{m.meets_count}</p><p className="text-[10px] text-muted-foreground">Meets</p></div>
          <div className={cn("text-center rounded-lg p-2", m.below_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.below_count === 0 ? "text-green-600" : "text-amber-600")}>{m.below_count}</p><p className="text-[10px] text-muted-foreground">Below</p></div>
          <div className={cn("text-center rounded-lg p-2", m.not_competent_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.not_competent_count === 0 ? "text-green-600" : "text-red-600")}>{m.not_competent_count}</p><p className="text-[10px] text-muted-foreground">Not Yet</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Assessments</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Meets"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Star className="h-3 w-3 text-yellow-500 shrink-0" /><span className="font-medium">{r.staff}</span><span className="text-muted-foreground truncate">{r.area} · {r.method}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Competency Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Competency Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
