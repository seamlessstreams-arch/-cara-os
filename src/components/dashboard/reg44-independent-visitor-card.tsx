"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, ChevronRight, AlertTriangle, Brain, Clock, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_reports: 6, serious_concern_count: 1, concern_count: 1, overdue_action_count: 1, not_started_count: 1, children_spoken_to_rate: 83.3, records_reviewed_rate: 66.7, previous_actions_rate: 50.0, child_views_rate: 66.7, manager_responded_rate: 50.0, unique_visitors: 2 };

const DEMO_RECORDS: { visitor: string; area: string; severity: string; status: string }[] = [
  { visitor: "J. Smith", area: "Safeguarding", severity: "Commendation", status: "Closed" },
  { visitor: "J. Smith", area: "Health & Wellbeing", severity: "Recommendation", status: "In Progress" },
  { visitor: "M. Davies", area: "Education", severity: "Concern", status: "Actioned" },
  { visitor: "J. Smith", area: "Physical Env.", severity: "Minor Obs.", status: "Completed" },
  { visitor: "M. Davies", area: "Records & Docs", severity: "Serious Concern", status: "Escalated" },
  { visitor: "J. Smith", area: "Leadership", severity: "Recommendation", status: "Not Started" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "serious_concern_unactioned", severity: "critical", message: "1 serious concern finding has not been completed — immediate management action required." },
  { type: "overdue_actions", severity: "high", message: "1 Reg 44 action is overdue." },
  { type: "child_views_missing", severity: "high", message: "2 reports have child views not captured." },
];

const ARIA_INSIGHTS = [
  "6 Reg 44 findings across 2 visitors. Serious concerns: 1. Concerns: 1. Overdue: 1.",
  "Priority: 1 serious concern unactioned. Manager responded 50.0%. Previous actions followed up 50.0%.",
  "Regulation 44 visits are your independent safeguard. Are findings acted on promptly? Are children heard?",
];

const SEVERITY_BADGES: Record<string, { label: string; color: string }> = {
  "Commendation": { label: "Commend", color: "text-green-700 bg-green-50 border-green-200" },
  "Minor Obs.": { label: "Minor", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Recommendation": { label: "Recom.", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Concern": { label: "Concern", color: "text-orange-700 bg-orange-50 border-orange-200" },
  "Serious Concern": { label: "Serious", color: "text-red-700 bg-red-50 border-red-200" },
};

export function Reg44IndependentVisitorCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-slate-600" /><span className="text-slate-900">Reg 44 Visits</span></CardTitle>
          <Link href="/reg44-independent-visitor" className="text-xs text-slate-600 hover:underline flex items-center gap-1">Reports <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.serious_concern_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.serious_concern_count === 0 ? "text-green-600" : "text-red-600")}>{m.serious_concern_count}</p><p className="text-[10px] text-muted-foreground">Serious</p></div>
          <div className={cn("text-center rounded-lg p-2", m.concern_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.concern_count === 0 ? "text-green-600" : "text-amber-600")}>{m.concern_count}</p><p className="text-[10px] text-muted-foreground">Concerns</p></div>
          <div className={cn("text-center rounded-lg p-2", m.overdue_action_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.overdue_action_count === 0 ? "text-green-600" : "text-red-600")}>{m.overdue_action_count}</p><p className="text-[10px] text-muted-foreground">Overdue</p></div>
          <div className="text-center rounded-lg p-2 bg-slate-50"><p className="text-lg font-bold tabular-nums text-slate-600">{m.total_reports}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Findings</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = SEVERITY_BADGES[r.severity] ?? SEVERITY_BADGES["Minor Obs."]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><FileSearch className="h-3 w-3 text-slate-500 shrink-0" /><span className="font-medium">{r.visitor}</span><span className="text-muted-foreground truncate">{r.area} · {r.status}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Reg 44 Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-slate-700"><Brain className="h-3 w-3" />ARIA Reg 44 Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-slate-200 bg-slate-50 text-slate-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
