"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ChevronRight, AlertTriangle, Brain, Clock, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_assessments: 10, lacks_capacity_count: 1, not_assessed_count: 1, refused_count: 2, best_interest_count: 1, child_views_rate: 80.0, advocacy_rate: 60.0, information_rate: 70.0, decision_respected_rate: 90.0, unique_children: 7 };

const DEMO_RECORDS: { child: string; area: string; capacity: string; decision: string }[] = [
  { child: "Child A", area: "Medical", capacity: "Full", decision: "Given" },
  { child: "Child B", area: "Education", capacity: "Partial", decision: "Given" },
  { child: "Child C", area: "Contact", capacity: "Lacks", decision: "Best Interest" },
  { child: "Child D", area: "Activities", capacity: "Full", decision: "Refused" },
  { child: "Child E", area: "Mental Health", capacity: "Fluctuating", decision: "Deferred" },
  { child: "Child F", area: "Data Sharing", capacity: "Full", decision: "Given" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "best_interest_not_documented", severity: "critical", message: "Child C has best interest decision without proper documentation." },
  { type: "decision_not_respected", severity: "high", message: "1 assessment where decision was not respected." },
  { type: "information_not_provided", severity: "medium", message: "3 assessments without adequate information provided." },
];

const ARIA_INSIGHTS = [
  "10 assessments. Lacks capacity: 1. Not assessed: 1. Refused: 2. Best interest: 1. Views: 80%. Advocacy: 60%.",
  "Priority: 1 undocumented best interest. 1 decision not respected. 3 missing information. Strengthen consent processes.",
  "Positive: Decisions mostly respected. Legal framework followed in most cases. Care plans updated consistently.",
];

const CAPACITY_BADGES: Record<string, { label: string; color: string }> = {
  "Full": { label: "Full", color: "text-green-700 bg-green-50 border-green-200" },
  "Partial": { label: "Partial", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Fluctuating": { label: "Fluct.", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Lacks": { label: "Lacks", color: "text-red-700 bg-red-50 border-red-200" },
};

export function ConsentCapacityMonitoringCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" />Consent & Capacity</CardTitle>
          <Link href="/consent-capacity-monitoring" className="text-xs text-brand hover:underline flex items-center gap-1">Monitoring <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.lacks_capacity_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.lacks_capacity_count === 0 ? "text-green-600" : "text-red-600")}>{m.lacks_capacity_count}</p><p className="text-[10px] text-muted-foreground">Lacks</p></div>
          <div className={cn("text-center rounded-lg p-2", m.refused_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.refused_count === 0 ? "text-green-600" : "text-amber-600")}>{m.refused_count}</p><p className="text-[10px] text-muted-foreground">Refused</p></div>
          <div className={cn("text-center rounded-lg p-2", m.best_interest_count === 0 ? "bg-green-50" : "bg-blue-50")}><p className={cn("text-lg font-bold tabular-nums", m.best_interest_count === 0 ? "text-green-600" : "text-blue-600")}>{m.best_interest_count}</p><p className="text-[10px] text-muted-foreground">Best Int.</p></div>
          <div className="text-center rounded-lg p-2 bg-blue-50"><p className="text-lg font-bold tabular-nums text-blue-600">{m.total_assessments}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Assessments</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = CAPACITY_BADGES[r.capacity] ?? CAPACITY_BADGES["Full"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><FileCheck className="h-3 w-3 text-indigo-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.area} · {r.decision}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Consent Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Consent Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
