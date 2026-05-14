"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronRight, AlertTriangle, Brain, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_milestones: 14, not_met_count: 2, regressed_count: 1, intensive_support_count: 1, no_progress_count: 1, child_views_rate: 85.7, celebration_rate: 71.4, next_steps_rate: 78.6, resources_rate: 71.4, unique_children: 5 };

const DEMO_RECORDS: { child: string; domain: string; status: string; progress: string }[] = [
  { child: "Child A", domain: "Cognitive", status: "Met", progress: "Good" },
  { child: "Child B", domain: "Social", status: "Progressing", progress: "Steady" },
  { child: "Child C", domain: "Physical", status: "Not Met", progress: "Limited" },
  { child: "Child D", domain: "Self-Care", status: "Exceeded", progress: "Excellent" },
  { child: "Child E", domain: "Language", status: "Regressed", progress: "No Progress" },
  { child: "Child A", domain: "Resilience", status: "Progressing", progress: "Steady" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "regressed_no_specialist", severity: "critical", message: "Child E has regressed in language communication without specialist input — arrange assessment." },
  { type: "no_progress", severity: "high", message: "1 milestone shows no progress." },
  { type: "achievement_not_celebrated", severity: "medium", message: "4 milestones without celebration of achievement." },
];

const ARIA_INSIGHTS = [
  "14 milestones. 5 children. Not met: 2. Regressed: 1. Child views: 85.7%. Celebration: 71.4%.",
  "Priority: 1 regressed no specialist. 1 no progress. 4 not celebrated. Strengthen developmental support.",
  "Positive: Most milestones progressing. Next steps routinely planned. Multi-agency working improving.",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Exceeded": { label: "Exceeded", color: "text-green-700 bg-green-50 border-green-200" },
  "Met": { label: "Met", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Progressing": { label: "Progress", color: "text-gray-700 bg-gray-50 border-gray-200" },
  "Not Met": { label: "Not Met", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Regressed": { label: "Regressed", color: "text-red-700 bg-red-50 border-red-200" },
};

export function ChildDevelopmentMilestoneCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-brand" />Development</CardTitle>
          <Link href="/child-development-milestone" className="text-xs text-brand hover:underline flex items-center gap-1">Milestones <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.regressed_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.regressed_count === 0 ? "text-green-600" : "text-red-600")}>{m.regressed_count}</p><p className="text-[10px] text-muted-foreground">Regressed</p></div>
          <div className={cn("text-center rounded-lg p-2", m.not_met_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.not_met_count === 0 ? "text-green-600" : "text-amber-600")}>{m.not_met_count}</p><p className="text-[10px] text-muted-foreground">Not Met</p></div>
          <div className={cn("text-center rounded-lg p-2", m.no_progress_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.no_progress_count === 0 ? "text-green-600" : "text-amber-600")}>{m.no_progress_count}</p><p className="text-[10px] text-muted-foreground">Stalled</p></div>
          <div className="text-center rounded-lg p-2 bg-blue-50"><p className="text-lg font-bold tabular-nums text-blue-600">{m.unique_children}</p><p className="text-[10px] text-muted-foreground">Children</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Milestones</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Progressing"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Star className="h-3 w-3 text-yellow-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.domain} · {r.progress}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Development Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Development Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
