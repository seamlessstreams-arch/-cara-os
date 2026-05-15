"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, ChevronRight, AlertTriangle, Brain, Clock, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = { total_inspections: 8, immediately_dangerous_count: 0, at_risk_count: 1, safe_count: 6, certificate_rate: 87.5, remedial_completion_rate: 75.0, co_alarm_rate: 87.5, next_inspection_scheduled_rate: 75.0, non_compliant_count: 1, defects_total: 3, unique_engineers: 2 };

const DEMO_RECORDS: { engineer: string; type: string; result: string; location: string }[] = [
  { engineer: "Gas Safe Eng. A", type: "Annual CP12", result: "Safe", location: "Boiler Room" },
  { engineer: "Gas Safe Eng. B", type: "Boiler Service", result: "Safe", location: "Kitchen" },
  { engineer: "Gas Safe Eng. A", type: "Appliance Check", result: "At Risk", location: "Lounge" },
  { engineer: "Gas Safe Eng. B", type: "Flue Inspection", result: "Safe", location: "Boiler Room" },
  { engineer: "Gas Safe Eng. A", type: "Annual CP12", result: "Safe", location: "Kitchen" },
  { engineer: "Gas Safe Eng. B", type: "Appliance Check", result: "Safe", location: "Bedroom 1" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "at_risk_no_remedial", severity: "critical", message: "1 at-risk appliance without remedial work completed — immediate action needed." },
  { type: "non_compliant", severity: "high", message: "1 inspection with non-compliant status." },
  { type: "co_alarm_gap", severity: "medium", message: "1 location without CO alarm tested." },
];

const ARIA_INSIGHTS = [
  "8 inspections across 2 engineers. Immediately dangerous: 0. At risk: 1. Safe: 6.",
  "Priority: 1 at-risk without remedial. Certificate rate 87.5%. CO alarm tested 87.5%.",
  "Gas safety is a landlord duty. Is the CP12 within date? Are all appliances on the certificate? Is the CO alarm working and tested?",
];

const RESULT_BADGES: Record<string, { label: string; color: string }> = {
  "Safe": { label: "Safe", color: "text-green-700 bg-green-50 border-green-200" },
  "At Risk": { label: "At Risk", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Immediately Dangerous": { label: "ID", color: "text-red-900 bg-red-100 border-red-300" },
  "Not Inspected": { label: "Not Insp.", color: "text-gray-700 bg-gray-50 border-gray-200" },
};

export function HomeGasSafetyCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden border-orange-200">
      <CardHeader className="pb-3 bg-orange-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Flame className="h-4 w-4 text-orange-600" /><span className="text-orange-900">Gas Safety</span></CardTitle>
          <Link href="/home-gas-safety" className="text-xs text-orange-600 hover:underline flex items-center gap-1">Inspections <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.immediately_dangerous_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.immediately_dangerous_count === 0 ? "text-green-600" : "text-red-600")}>{m.immediately_dangerous_count}</p><p className="text-[10px] text-muted-foreground">Dangerous</p></div>
          <div className={cn("text-center rounded-lg p-2", m.at_risk_count === 0 ? "bg-green-50" : "bg-amber-50")}><p className={cn("text-lg font-bold tabular-nums", m.at_risk_count === 0 ? "text-green-600" : "text-amber-600")}>{m.at_risk_count}</p><p className="text-[10px] text-muted-foreground">At Risk</p></div>
          <div className={cn("text-center rounded-lg p-2", m.non_compliant_count === 0 ? "bg-green-50" : "bg-red-50")}><p className={cn("text-lg font-bold tabular-nums", m.non_compliant_count === 0 ? "text-green-600" : "text-red-600")}>{m.non_compliant_count}</p><p className="text-[10px] text-muted-foreground">Non-Comp.</p></div>
          <div className="text-center rounded-lg p-2 bg-orange-50"><p className="text-lg font-bold tabular-nums text-orange-600">{m.total_inspections}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Inspections</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => { const badge = RESULT_BADGES[r.result] ?? RESULT_BADGES["Safe"]; return (<div key={i} className="flex items-center justify-between rounded border p-2 text-xs"><div className="flex items-center gap-2 flex-1 min-w-0"><Gauge className="h-3 w-3 text-orange-500 shrink-0" /><span className="font-medium">{r.engineer}</span><span className="text-muted-foreground truncate">{r.type} · {r.location}</span></div><Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge></div>); })}
          </div>
        </div>
        {DEMO_ALERTS.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Gas Alerts</p>{DEMO_ALERTS.map((a, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>))}</div>)}
        <div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-orange-700"><Brain className="h-3 w-3" />ARIA Gas Intelligence</p>{ARIA_INSIGHTS.map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-orange-200 bg-orange-50 text-orange-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>))}</div>
      </CardContent>
    </Card>
  );
}
