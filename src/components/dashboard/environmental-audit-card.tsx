"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, ChevronRight, AlertTriangle, Brain, Clock, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_audits: 15, outstanding_count: 3, good_count: 8, requires_improvement_count: 3, inadequate_count: 1, homely_feel_rate: 86.7, child_friendly_rate: 80.0, children_consulted_rate: 60.0, immediate_priority_count: 1 };

const DEMO_RECORDS: { area: string; type: string; rating: string; status: string }[] = [
  { area: "Lounge", type: "Manager Walk", rating: "Good", status: "Good" },
  { area: "Bedroom 1", type: "Children Led", rating: "Outstanding", status: "Outstand." },
  { area: "Kitchen", type: "Scheduled", rating: "Req. Imp.", status: "RI" },
  { area: "Garden", type: "Spot Check", rating: "Good", status: "Good" },
  { area: "Bathroom 2", type: "Scheduled", rating: "Inadequate", status: "Inadeq." },
  { area: "Hallway", type: "Manager Walk", rating: "Good", status: "Good" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "inadequate_unsafe", severity: "critical", message: "Bathroom 2 rated inadequate and unsafe — address immediately." },
  { type: "immediate", severity: "high", message: "1 area has immediate priority — action required today." },
  { type: "not_friendly", severity: "high", message: "3 areas not child-friendly — review environment." },
];

const ARIA_INSIGHTS = [
  "15 audits. Outstanding: 3. Good: 8. RI: 3. Inadequate: 1. Homely: 86.7%. Consulted: 60%.",
  "Priority: 1 inadequate unsafe. 1 immediate priority. 3 not child-friendly. Improve consultation.",
  "Positive: Most areas good/outstanding. Regular audits. Bedrooms personalised. Strengthen participation.",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Good": { label: "Good", color: "text-green-700 bg-green-50 border-green-200" },
  "Outstand.": { label: "Outstand.", color: "text-green-700 bg-green-50 border-green-200" },
  "RI": { label: "RI", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Inadeq.": { label: "Inadeq.", color: "text-red-700 bg-red-50 border-red-200" },
};

export function EnvironmentalAuditCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Home className="h-4 w-4 text-brand" />Environmental Audit</CardTitle>
          <Link href="/environmental-audits" className="text-xs text-brand hover:underline flex items-center gap-1">Audits <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.homely_feel_rate >= 90 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.homely_feel_rate >= 90 ? "text-green-600" : "text-amber-600")}>{m.homely_feel_rate}%</p><p className="text-[10px] text-muted-foreground">Homely</p></div>
          <div className="text-center rounded-lg p-2 bg-green-50"><p className="text-lg font-bold tabular-nums text-green-600">{m.good_count}</p><p className="text-[10px] text-muted-foreground">Good+</p></div>
          <div className={cn("text-center rounded-lg p-2", m.inadequate_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.inadequate_count === 0 ? "text-green-600" : "text-red-600")}>{m.inadequate_count}</p><p className="text-[10px] text-muted-foreground">Inadeq.</p></div>
          <div className={cn("text-center rounded-lg p-2", m.immediate_priority_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.immediate_priority_count === 0 ? "text-green-600" : "text-red-600")}>{m.immediate_priority_count}</p><p className="text-[10px] text-muted-foreground">Urgent</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Audits</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Good"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Leaf className="h-3 w-3 text-emerald-500 shrink-0" /><span className="font-medium">{r.area}</span><span className="text-muted-foreground truncate">{r.type} · {r.rating}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Environment Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Environment Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
