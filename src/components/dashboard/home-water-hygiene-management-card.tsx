"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, ChevronRight, AlertTriangle, Brain, Clock, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_checks: 8, non_compliant_count: 1, action_required_count: 1, hot_temp_compliant_rate: 87.5, cold_temp_compliant_rate: 75.0, flushing_rate: 62.5, sample_taken_rate: 25.0, legionella_detected: 0, unique_locations: 6, unique_checkers: 2 };

const DEMO_RECORDS: { checker: string; type: string; location: string; status: string }[] = [
  { checker: "D. Laville", type: "Temperature Monitoring", location: "Kitchen", status: "Compliant" },
  { checker: "J. Hughes", type: "Weekly Flushing", location: "Bathroom 1", status: "Compliant" },
  { checker: "D. Laville", type: "Showerhead Descale", location: "En-suite 2", status: "Action Required" },
  { checker: "J. Hughes", type: "TMV Service", location: "Bathroom 3", status: "Compliant" },
  { checker: "D. Laville", type: "Water Sampling", location: "Kitchen", status: "Non-Compliant" },
  { checker: "J. Hughes", type: "Monthly Flushing", location: "Guest Room", status: "Compliant" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "legionella_risk", severity: "critical", message: "Kitchen water sample shows elevated count — investigate and retest within 48 hours." },
  { type: "cold_temp_high", severity: "high", message: "2 outlets with cold water above 20°C — risk of legionella proliferation." },
  { type: "flushing_overdue", severity: "medium", message: "3 outlets with weekly flushing overdue." },
];

const ARIA_INSIGHTS = [
  "8 water hygiene checks across 6 locations. Non-compliant: 1. Action required: 1. Hot temp 87.5%. Cold temp 75.0%.",
  "Priority: 1 elevated sample result. Flushing completion 62.5%. Sampling rate 25.0%.",
  "Water hygiene is a daily duty under HSG274. Are all dead legs identified? Are TMVs being serviced at the required frequency? Is the written scheme up to date?",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Compliant": { label: "Compliant", color: "text-green-700 bg-green-50 border-green-200" },
  "Non-Compliant": { label: "Non-Comp.", color: "text-red-700 bg-red-50 border-red-200" },
  "Action Required": { label: "Action", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Overdue": { label: "Overdue", color: "text-red-700 bg-red-50 border-red-200" },
};

export function HomeWaterHygieneManagementCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-cyan-200">
      <CardHeader className="pb-3 bg-cyan-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Droplets className="h-4 w-4 text-cyan-600" /><span className="text-cyan-900">Water Hygiene</span></CardTitle>
          <Link href="/home-water-hygiene-management" className="text-xs text-cyan-600 hover:underline flex items-center gap-1">Checks <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.non_compliant_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.non_compliant_count === 0 ? "text-green-600" : "text-red-600")}>{m.non_compliant_count}</p><p className="text-[10px] text-muted-foreground">Non-Comp.</p></div>
          <div className={cn("text-center rounded-lg p-2", m.action_required_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.action_required_count === 0 ? "text-green-600" : "text-amber-600")}>{m.action_required_count}</p><p className="text-[10px] text-muted-foreground">Action</p></div>
          <div className="text-center rounded-lg p-2 bg-blue-50"><p className="text-lg font-bold tabular-nums text-blue-600">{m.unique_locations}</p><p className="text-[10px] text-muted-foreground">Locations</p></div>
          <div className="text-center rounded-lg p-2 bg-cyan-50"><p className="text-lg font-bold tabular-nums text-cyan-600">{m.total_checks}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Checks</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Compliant"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Thermometer className="h-3 w-3 text-cyan-500 shrink-0" /><span className="font-medium">{r.checker}</span><span className="text-muted-foreground truncate">{r.type} · {r.location}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Water Hygiene Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-cyan-700"><Brain className="h-3 w-3" />ARIA Water Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-cyan-200 bg-cyan-50 text-cyan-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
