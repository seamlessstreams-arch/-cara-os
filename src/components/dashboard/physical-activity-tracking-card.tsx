"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, ChevronRight, AlertTriangle, Brain, Clock, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_activities: 14, refused_count: 2, unable_count: 1, disliked_count: 1, below_average_count: 2, child_choice_rate: 71.4, risk_assessed_rate: 85.7, achievement_celebrated_rate: 57.1, inclusive_rate: 78.6, unique_children: 6 };

const DEMO_RECORDS: { child: string; activity: string; participation: string; enjoyment: string }[] = [
  { child: "Child A", activity: "Swimming", participation: "Enthusiastic", enjoyment: "Loved It" },
  { child: "Child B", activity: "Team Sport", participation: "Willing", enjoyment: "Enjoyed" },
  { child: "Child C", activity: "Gym/Fitness", participation: "Refused", enjoyment: "—" },
  { child: "Child D", activity: "Dance", participation: "Reluctant", enjoyment: "Neutral" },
  { child: "Child E", activity: "Outdoor Adventure", participation: "Enthusiastic", enjoyment: "Loved It" },
  { child: "Child F", activity: "Martial Arts", participation: "Unable", enjoyment: "—" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "refused_no_health_check", severity: "critical", message: "Child C refused activity without health needs being considered." },
  { type: "no_child_choice", severity: "high", message: "4 activities without child choice offered." },
  { type: "achievement_not_celebrated", severity: "medium", message: "6 activities without achievement celebrated." },
];

const ARIA_INSIGHTS = [
  "14 activities. Refused: 2. Unable: 1. Disliked: 1. Below avg fitness: 2. Choice: 71.4%. Risk assessed: 85.7%.",
  "Priority: 1 refused without health check. 4 no choice offered. 6 achievements uncelebrated. Promote inclusive activity.",
  "Positive: Most activities age-appropriate. Peer interactions positive. Safeguarding considered in most sessions.",
];

const PARTICIPATION_BADGES: Record<string, { label: string; color: string }> = {
  "Enthusiastic": { label: "Enthus.", color: "text-green-700 bg-green-50 border-green-200" },
  "Willing": { label: "Willing", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Reluctant": { label: "Reluct.", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Refused": { label: "Refused", color: "text-red-700 bg-red-50 border-red-200" },
  "Unable": { label: "Unable", color: "text-gray-700 bg-gray-50 border-gray-200" },
};

export function PhysicalActivityTrackingCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Dumbbell className="h-4 w-4 text-brand" />Physical Activity</CardTitle>
          <Link href="/physical-activity-tracking" className="text-xs text-brand hover:underline flex items-center gap-1">Tracking <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.refused_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.refused_count === 0 ? "text-green-600" : "text-red-600")}>{m.refused_count}</p><p className="text-[10px] text-muted-foreground">Refused</p></div>
          <div className={cn("text-center rounded-lg p-2", m.unable_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.unable_count === 0 ? "text-green-600" : "text-amber-600")}>{m.unable_count}</p><p className="text-[10px] text-muted-foreground">Unable</p></div>
          <div className={cn("text-center rounded-lg p-2", m.below_average_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.below_average_count === 0 ? "text-green-600" : "text-amber-600")}>{m.below_average_count}</p><p className="text-[10px] text-muted-foreground">Below Avg</p></div>
          <div className="text-center rounded-lg p-2 bg-blue-50"><p className="text-lg font-bold tabular-nums text-blue-600">{m.total_activities}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Activities</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = PARTICIPATION_BADGES[r.participation] ?? PARTICIPATION_BADGES["Willing"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Medal className="h-3 w-3 text-indigo-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.activity} · {r.enjoyment}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Activity Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Activity Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
