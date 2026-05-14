"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, ChevronRight, AlertTriangle, Brain, Clock, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_sessions: 20, positive_progress_count: 10, declined_count: 2, cancelled_count: 1, refused_count: 1, child_prepared_rate: 85.0, progress_documented_rate: 80.0, child_debriefed_rate: 75.0, unique_children: 5, average_duration: 48.5 };

const DEMO_RECORDS: { child: string; type: string; therapist: string; outcome: string }[] = [
  { child: "Child A", type: "CAMHS", therapist: "Dr Smith", outcome: "Positive" },
  { child: "Child B", type: "Play", therapist: "Ms Jones", outcome: "Engaged" },
  { child: "Child C", type: "CBT", therapist: "Dr Brown", outcome: "Positive" },
  { child: "Child D", type: "Art", therapist: "Ms Green", outcome: "Declined" },
  { child: "Child A", type: "EMDR", therapist: "Dr Smith", outcome: "Positive" },
  { child: "Child E", type: "Family", therapist: "Ms White", outcome: "Cancelled" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "refused", severity: "critical", message: "Child D refused art therapy and consent not current — review therapeutic plan." },
  { type: "not_documented", severity: "high", message: "4 sessions have progress not documented." },
  { type: "not_debriefed", severity: "high", message: "5 sessions have no child debrief." },
];

const ARIA_INSIGHTS = [
  "20 sessions. 5 children. Positive: 10. Declined: 2. Cancelled: 1. Prepared: 85%. Avg: 48.5 min.",
  "Priority: 1 refused no consent. 4 not documented. 5 not debriefed. Strengthen therapy support.",
  "Positive: Good CAMHS engagement. Regular sessions. Goals reviewed. Strong therapist relationships.",
];

const OUTCOME_BADGES: Record<string, { label: string; color: string }> = {
  "Positive": { label: "Positive", color: "text-green-700 bg-green-50 border-green-200" },
  "Engaged": { label: "Engaged", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Declined": { label: "Declined", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Cancelled": { label: "Cancelled", color: "text-red-700 bg-red-50 border-red-200" },
};

export function ChildrensTherapySessionsCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><HeartPulse className="h-4 w-4 text-brand" />Therapy Sessions</CardTitle>
          <Link href="/childrens-therapy-sessions" className="text-xs text-brand hover:underline flex items-center gap-1">Therapy <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg p-2 bg-green-50"><p className="text-lg font-bold tabular-nums text-green-600">{m.positive_progress_count}</p><p className="text-[10px] text-muted-foreground">Positive</p></div>
          <div className={cn("text-center rounded-lg p-2", m.child_prepared_rate >= 90 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.child_prepared_rate >= 90 ? "text-green-600" : "text-amber-600")}>{m.child_prepared_rate}%</p><p className="text-[10px] text-muted-foreground">Prepared</p></div>
          <div className={cn("text-center rounded-lg p-2", m.declined_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.declined_count === 0 ? "text-green-600" : "text-amber-600")}>{m.declined_count}</p><p className="text-[10px] text-muted-foreground">Declined</p></div>
          <div className={cn("text-center rounded-lg p-2", m.refused_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.refused_count === 0 ? "text-green-600" : "text-red-600")}>{m.refused_count}</p><p className="text-[10px] text-muted-foreground">Refused</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Sessions</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = OUTCOME_BADGES[r.outcome] ?? OUTCOME_BADGES["Engaged"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Stethoscope className="h-3 w-3 text-purple-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.type} · {r.therapist}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Therapy Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Therapy Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
