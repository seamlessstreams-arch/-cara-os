"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, ChevronRight, AlertTriangle, Brain, Clock, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_placements: 10, not_ready_count: 1, not_suitable_count: 1, no_gain_count: 1, decline_count: 0, child_consented_rate: 90.0, safeguarding_rate: 80.0, dbs_verified_rate: 70.0, pathway_plan_rate: 60.0, unique_children: 5 };

const DEMO_RECORDS: { child: string; type: string; feedback: string; readiness: string }[] = [
  { child: "Child A", type: "Work Exp.", feedback: "Excellent", readiness: "Work Ready" },
  { child: "Child B", type: "Volunteer", feedback: "Good", readiness: "Nearly Ready" },
  { child: "Child C", type: "CV Workshop", feedback: "Satisfactory", readiness: "Developing" },
  { child: "Child D", type: "Interview", feedback: "Good", readiness: "Nearly Ready" },
  { child: "Child E", type: "Career Taster", feedback: "Not Suitable", readiness: "Not Ready" },
  { child: "Child F", type: "Enterprise", feedback: "Excellent", readiness: "Work Ready" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "no_safeguarding_check", severity: "high", message: "2 placements have no safeguarding check." },
  { type: "no_dbs_verified", severity: "high", message: "3 placements have DBS not verified." },
  { type: "no_pathway_plan", severity: "medium", message: "4 placements without pathway plan updated." },
];

const ARIA_INSIGHTS = [
  "10 placements. Not ready: 1. Not suitable: 1. No gain: 1. Consent: 90%. Safeguarding: 80%.",
  "Priority: DBS verification at 70%. Pathway plans at 60%. Safeguarding checks need strengthening.",
  "Positive: Most children consenting. Good placement variety. Strong employer feedback overall.",
];

const FEEDBACK_BADGES: Record<string, { label: string; color: string }> = {
  "Excellent": { label: "Excel.", color: "text-green-700 bg-green-50 border-green-200" },
  "Good": { label: "Good", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Satisfactory": { label: "Satis.", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Needs Imp.": { label: "Needs", color: "text-orange-700 bg-orange-50 border-orange-200" },
  "Not Suitable": { label: "N/Suit.", color: "text-red-700 bg-red-50 border-red-200" },
};

export function WorkExperienceEmploymentCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4 text-brand" />Work Experience</CardTitle>
          <Link href="/work-experience-employment" className="text-xs text-brand hover:underline flex items-center gap-1">Placements <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.not_suitable_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.not_suitable_count === 0 ? "text-green-600" : "text-red-600")}>{m.not_suitable_count}</p><p className="text-[10px] text-muted-foreground">N/Suit.</p></div>
          <div className={cn("text-center rounded-lg p-2", m.not_ready_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.not_ready_count === 0 ? "text-green-600" : "text-amber-600")}>{m.not_ready_count}</p><p className="text-[10px] text-muted-foreground">Not Ready</p></div>
          <div className={cn("text-center rounded-lg p-2", m.no_gain_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.no_gain_count === 0 ? "text-green-600" : "text-amber-600")}>{m.no_gain_count}</p><p className="text-[10px] text-muted-foreground">No Gain</p></div>
          <div className="text-center rounded-lg p-2 bg-blue-50"><p className="text-lg font-bold tabular-nums text-blue-600">{m.total_placements}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Placements</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = FEEDBACK_BADGES[r.feedback] ?? FEEDBACK_BADGES["Satisfactory"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Hammer className="h-3 w-3 text-amber-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.type} · {r.readiness}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Employment Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Employment Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
