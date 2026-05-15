"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radiation, ChevronRight, AlertTriangle, Brain, Clock, TestTube } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_tests: 6, above_action_count: 0, above_target_count: 1, mitigation_required_count: 1, mitigation_installed_rate: 100.0, avg_radon_level: 85.3, max_radon_level: 180, retest_scheduled_rate: 50.0, compliant_count: 4, non_compliant_count: 0, unique_testers: 2 };

const DEMO_RECORDS: { tester: string; location: string; level: number; status: string }[] = [
  { tester: "D. Laville", location: "Living Room", level: 45, status: "Compliant" },
  { tester: "J. Hughes", location: "Bedroom 1", level: 62, status: "Compliant" },
  { tester: "D. Laville", location: "Basement", level: 180, status: "Monitoring" },
  { tester: "J. Hughes", location: "Kitchen", level: 38, status: "Compliant" },
  { tester: "D. Laville", location: "Bedroom 2", level: 55, status: "Compliant" },
  { tester: "J. Hughes", location: "Hallway", level: 72, status: "Action Required" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "above_target_no_retest", severity: "medium", message: "1 location above target level without retest scheduled." },
  { type: "mitigation_no_type", severity: "medium", message: "Basement requires mitigation type to be specified." },
];

const ARIA_INSIGHTS = [
  "6 tests across 2 testers. Above action: 0. Above target: 1. Avg level: 85.3 Bq/m3.",
  "Priority: 1 above target level. Retest scheduled 50.0%. Mitigation installed 100.0%.",
  "Radon is the second leading cause of lung cancer. Are long-term tests genuinely 3 months? Is post-mitigation testing confirming effectiveness?",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Compliant": { label: "Compliant", color: "text-green-700 bg-green-50 border-green-200" },
  "Monitoring": { label: "Monitor", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Action Required": { label: "Action", color: "text-orange-700 bg-orange-50 border-orange-200" },
  "Non-Compliant": { label: "Non-Comp.", color: "text-red-700 bg-red-50 border-red-200" },
};

export function HomeRadonTestingCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-yellow-200">
      <CardHeader className="pb-3 bg-yellow-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Radiation className="h-4 w-4 text-yellow-600" /><span className="text-yellow-900">Radon Testing</span></CardTitle>
          <Link href="/home-radon-testing" className="text-xs text-yellow-600 hover:underline flex items-center gap-1">Tests <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.above_action_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.above_action_count === 0 ? "text-green-600" : "text-red-600")}>{m.above_action_count}</p><p className="text-[10px] text-muted-foreground">Action</p></div>
          <div className={cn("text-center rounded-lg p-2", m.above_target_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.above_target_count === 0 ? "text-green-600" : "text-amber-600")}>{m.above_target_count}</p><p className="text-[10px] text-muted-foreground">Target</p></div>
          <div className={cn("text-center rounded-lg p-2", m.non_compliant_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.non_compliant_count === 0 ? "text-green-600" : "text-red-600")}>{m.non_compliant_count}</p><p className="text-[10px] text-muted-foreground">Non-Comp.</p></div>
          <div className="text-center rounded-lg p-2 bg-yellow-50"><p className="text-lg font-bold tabular-nums text-yellow-600">{m.total_tests}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Tests</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Compliant"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><TestTube className="h-3 w-3 text-yellow-500 shrink-0" /><span className="font-medium">{r.tester}</span><span className="text-muted-foreground truncate">{r.location} · {r.level} Bq/m3</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Radon Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-yellow-700"><Brain className="h-3 w-3" />ARIA Radon Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-yellow-200 bg-yellow-50 text-yellow-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
