"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PartyPopper, ChevronRight, AlertTriangle, Brain, Clock, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_events: 13, missed_count: 1, poor_quality_count: 1, uncomfortable_count: 1, no_family_count: 3, child_chose_rate: 84.6, culturally_sensitive_rate: 92.3, memories_preserved_rate: 76.9, family_included_rate: 76.9, unique_children: 6 };

const DEMO_RECORDS: { child: string; type: string; response: string; quality: string }[] = [
  { child: "Child A", type: "Birthday", response: "Delighted", quality: "Exceptional" },
  { child: "Child B", type: "Academic", response: "Happy", quality: "Good" },
  { child: "Child C", type: "Cultural Fest.", response: "Uncomfortable", quality: "Poor" },
  { child: "Child D", type: "Sporting", response: "Delighted", quality: "Exceptional" },
  { child: "Child E", type: "Personal", response: "Neutral", quality: "Adequate" },
  { child: "Child F", type: "Transition", response: "Happy", quality: "Good" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "missed_upset", severity: "critical", message: "Child C cultural festival milestone missed and child uncomfortable." },
  { type: "no_child_choice", severity: "high", message: "2 celebrations have child not choosing." },
  { type: "no_memories_preserved", severity: "medium", message: "3 events without memories preserved." },
];

const ARIA_INSIGHTS = [
  "13 events. Missed: 1. Poor quality: 1. Uncomfortable: 1. Child choice: 84.6%. Cultural: 92.3%.",
  "Priority: 1 milestone missed causing upset. Memories preservation at 76.9%. Family inclusion 76.9%.",
  "Positive: Most celebrations child-led. Cultural sensitivity strong. Variety of celebration types.",
];

const RESPONSE_BADGES: Record<string, { label: string; color: string }> = {
  "Delighted": { label: "Delight", color: "text-green-700 bg-green-50 border-green-200" },
  "Happy": { label: "Happy", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Neutral": { label: "Neutral", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Uncomfortable": { label: "Uncomf.", color: "text-orange-700 bg-orange-50 border-orange-200" },
  "Upset": { label: "Upset", color: "text-red-700 bg-red-50 border-red-200" },
};

export function CelebrationMilestonesCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><PartyPopper className="h-4 w-4 text-brand" />Celebrations</CardTitle>
          <Link href="/celebration-milestones" className="text-xs text-brand hover:underline flex items-center gap-1">Events <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.missed_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.missed_count === 0 ? "text-green-600" : "text-red-600")}>{m.missed_count}</p><p className="text-[10px] text-muted-foreground">Missed</p></div>
          <div className={cn("text-center rounded-lg p-2", m.poor_quality_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.poor_quality_count === 0 ? "text-green-600" : "text-amber-600")}>{m.poor_quality_count}</p><p className="text-[10px] text-muted-foreground">Poor Qual.</p></div>
          <div className={cn("text-center rounded-lg p-2", m.uncomfortable_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.uncomfortable_count === 0 ? "text-green-600" : "text-amber-600")}>{m.uncomfortable_count}</p><p className="text-[10px] text-muted-foreground">Uncomf.</p></div>
          <div className="text-center rounded-lg p-2 bg-blue-50"><p className="text-lg font-bold tabular-nums text-blue-600">{m.total_events}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Events</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = RESPONSE_BADGES[r.response] ?? RESPONSE_BADGES["Neutral"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Gift className="h-3 w-3 text-pink-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.type} · {r.quality}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Celebration Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Celebration Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
