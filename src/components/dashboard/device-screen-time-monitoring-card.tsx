"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, ChevronRight, AlertTriangle, Brain, Clock, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_checks: 14, non_compliant_count: 1, refused_count: 1, inappropriate_count: 1, significant_concern_count: 1, limits_agreed_rate: 85.7, parental_controls_rate: 71.4, night_time_limits_rate: 78.6, online_safety_rate: 71.4, unique_children: 6 };

const DEMO_RECORDS: { child: string; device: string; usage: string; compliance: string }[] = [
  { child: "Child A", device: "Smartphone", usage: "Social Media", compliance: "Compliant" },
  { child: "Child B", device: "Tablet", usage: "Educational", compliance: "Mostly" },
  { child: "Child C", device: "Console", usage: "Gaming", compliance: "Non-Compl." },
  { child: "Child D", device: "Laptop", usage: "Creative", compliance: "Compliant" },
  { child: "Child E", device: "Smart TV", usage: "Streaming", compliance: "Partial" },
  { child: "Child F", device: "Smartphone", usage: "Inappropriate", compliance: "Refused" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "inappropriate_significant_concern", severity: "critical", message: "Child F accessing inappropriate content on smartphone with significant concern." },
  { type: "no_parental_controls", severity: "high", message: "4 devices have no parental controls active." },
  { type: "no_night_limits", severity: "high", message: "3 checks have no night-time limits." },
];

const ARIA_INSIGHTS = [
  "14 checks. Non-compliant: 1. Refused: 1. Inappropriate: 1. Sig. concern: 1. Controls: 71.4%.",
  "Priority: 1 inappropriate content with concern. Parental controls at 71.4%. Night limits 78.6%.",
  "Positive: Most children compliant. Good device variety monitored. Online safety improving.",
];

const COMPLIANCE_BADGES: Record<string, { label: string; color: string }> = {
  "Compliant": { label: "Compl.", color: "text-green-700 bg-green-50 border-green-200" },
  "Mostly": { label: "Mostly", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Partial": { label: "Partial", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Non-Compl.": { label: "Non-C.", color: "text-orange-700 bg-orange-50 border-orange-200" },
  "Refused": { label: "Refused", color: "text-red-700 bg-red-50 border-red-200" },
};

export function DeviceScreenTimeMonitoringCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Smartphone className="h-4 w-4 text-brand" />Screen Time</CardTitle>
          <Link href="/device-screen-time-monitoring" className="text-xs text-brand hover:underline flex items-center gap-1">Checks <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.inappropriate_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.inappropriate_count === 0 ? "text-green-600" : "text-red-600")}>{m.inappropriate_count}</p><p className="text-[10px] text-muted-foreground">Inapprop.</p></div>
          <div className={cn("text-center rounded-lg p-2", m.non_compliant_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.non_compliant_count === 0 ? "text-green-600" : "text-amber-600")}>{m.non_compliant_count}</p><p className="text-[10px] text-muted-foreground">Non-Comp.</p></div>
          <div className={cn("text-center rounded-lg p-2", m.significant_concern_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.significant_concern_count === 0 ? "text-green-600" : "text-amber-600")}>{m.significant_concern_count}</p><p className="text-[10px] text-muted-foreground">Sig. Conc.</p></div>
          <div className="text-center rounded-lg p-2 bg-blue-50"><p className="text-lg font-bold tabular-nums text-blue-600">{m.total_checks}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Checks</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = COMPLIANCE_BADGES[r.compliance] ?? COMPLIANCE_BADGES["Partial"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Monitor className="h-3 w-3 text-cyan-500 shrink-0" /><span className="font-medium">{r.child}</span><span className="text-muted-foreground truncate">{r.device} · {r.usage}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Screen Time Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Screen Time Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
