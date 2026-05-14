"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ChevronRight, AlertTriangle, Brain, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_engagements: 10, disengaged_count: 1, hostile_count: 1, no_participation_count: 1, broken_down_count: 1, child_views_rate: 80.0, child_prepared_rate: 70.0, follow_up_rate: 60.0, safeguarding_rate: 90.0, unique_children: 5 };

const DEMO_RECORDS: { child: string; family: string; type: string; response: string }[] = [
  { child: "Child A", family: "Mum", type: "Visit", response: "Engaged" },
  { child: "Child B", family: "Dad", type: "Phone", response: "Variable" },
  { child: "Child C", family: "Gran", type: "Review", response: "Very Engaged" },
  { child: "Child A", family: "Sibling", type: "Event", response: "Engaged" },
  { child: "Child D", family: "Mum", type: "Meeting", response: "Hostile" },
  { child: "Child E", family: "Dad", type: "Phone", response: "Disengaged" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "hostile_no_safeguarding", severity: "critical", message: "Child D's family member hostile without safeguarding consideration." },
  { type: "no_participation", severity: "high", message: "1 engagement has no family participation." },
  { type: "follow_up_not_planned", severity: "medium", message: "4 engagements without follow-up planned." },
];

const ARIA_INSIGHTS = [
  "10 engagements. Disengaged: 1. Hostile: 1. No participation: 1. Child views: 80%. Follow-up: 60%.",
  "Priority: 1 hostile no safeguarding. 1 no participation. 4 no follow-up. Strengthen family engagement.",
  "Positive: Child views increasingly sought. Safeguarding considered in 90%. Reviews well attended.",
];

const RESPONSE_BADGES: Record<string, { label: string; color: string }> = {
  "Very Engaged": { label: "Very Engaged", color: "text-green-700 bg-green-50 border-green-200" },
  "Engaged": { label: "Engaged", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Variable": { label: "Variable", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Disengaged": { label: "Disengaged", color: "text-orange-700 bg-orange-50 border-orange-200" },
  "Hostile": { label: "Hostile", color: "text-red-700 bg-red-50 border-red-200" },
};

export function FamilyEngagementTrackingCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-brand" />Family Engagement</CardTitle>
          <Link href="/family-engagement-tracking" className="text-xs text-brand hover:underline flex items-center gap-1">Tracking <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.hostile_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.hostile_count === 0 ? "text-green-600" : "text-red-600")}>{m.hostile_count}</p><p className="text-[10px] text-muted-foreground">Hostile</p></div>
          <div className={cn("text-center rounded-lg p-2", m.disengaged_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.disengaged_count === 0 ? "text-green-600" : "text-amber-600")}>{m.disengaged_count}</p><p className="text-[10px] text-muted-foreground">Disengaged</p></div>
          <div className={cn("text-center rounded-lg p-2", m.broken_down_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.broken_down_count === 0 ? "text-green-600" : "text-amber-600")}>{m.broken_down_count}</p><p className="text-[10px] text-muted-foreground">Broken</p></div>
          <div className="text-center rounded-lg p-2 bg-blue-50"><p className="text-lg font-bold tabular-nums text-blue-600">{m.total_engagements}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Engagements</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = RESPONSE_BADGES[r.response] ?? RESPONSE_BADGES["Variable"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Users className="h-3 w-3 text-pink-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.family} · {r.type}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Engagement Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Family Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
