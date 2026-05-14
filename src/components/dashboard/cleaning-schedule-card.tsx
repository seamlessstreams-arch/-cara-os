"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SprayCan, ChevronRight, AlertTriangle, Brain,
  Clock, Sparkles, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = {
  total_cleans: 30,
  acceptable_rate: 86.7,
  below_standard_count: 2,
  unacceptable_count: 1,
  coshh_compliant_rate: 90.0,
  surfaces_sanitised_rate: 83.3,
  high_risk_count: 1,
  deep_clean_count: 4,
};

const DEMO_RECORDS: { area: string; type: string; date: string; status: string }[] = [
  { area: "Kitchen", type: "Daily", date: "14 May", status: "Good" },
  { area: "Bathroom 1", type: "Daily", date: "14 May", status: "Good" },
  { area: "Lounge", type: "Weekly", date: "13 May", status: "Below" },
  { area: "Bedroom 3", type: "Daily", date: "13 May", status: "Good" },
  { area: "Hallway", type: "Infection", date: "12 May", status: "Excellent" },
  { area: "Kitchen", type: "Deep Clean", date: "11 May", status: "Good" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "hygiene", severity: "critical", message: "Critical hygiene risk — immediate deep clean required." },
  { type: "unacceptable", severity: "high", message: "1 area has unacceptable cleanliness — reclean immediately." },
  { type: "coshh", severity: "high", message: "3 cleans not COSHH compliant — review chemical safety." },
];

const ARIA_INSIGHTS = [
  "30 cleans. Acceptable: 86.7%. 2 below standard. COSHH: 90%. Surfaces sanitised: 83.3%. 4 deep cleans.",
  "Priority: 1 critical hygiene risk. 1 unacceptable area. COSHH gaps. Address lounge cleaning standards.",
  "Positive: Regular daily cleaning. Deep cleans scheduled. Good surface sanitisation. Improve COSHH compliance.",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Excellent": { label: "Excellent", color: "text-green-700 bg-green-50 border-green-200" },
  "Good": { label: "Good", color: "text-green-700 bg-green-50 border-green-200" },
  "Below": { label: "Below", color: "text-amber-700 bg-amber-50 border-amber-200" },
};

export function CleaningScheduleCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <SprayCan className="h-4 w-4 text-brand" />
            Cleaning Schedule
          </CardTitle>
          <Link href="/cleaning-schedule" className="text-xs text-brand hover:underline flex items-center gap-1">
            Cleans <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.acceptable_rate >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.acceptable_rate >= 90 ? "text-green-600" : "text-amber-600")}>{m.acceptable_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Acceptable</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.coshh_compliant_rate >= 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.coshh_compliant_rate >= 100 ? "text-green-600" : "text-amber-600")}>{m.coshh_compliant_rate}%</p>
            <p className="text-[10px] text-muted-foreground">COSHH</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.unacceptable_count === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.unacceptable_count === 0 ? "text-green-600" : "text-red-600")}>{m.unacceptable_count}</p>
            <p className="text-[10px] text-muted-foreground">Poor</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.high_risk_count === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.high_risk_count === 0 ? "text-green-600" : "text-red-600")}>{m.high_risk_count}</p>
            <p className="text-[10px] text-muted-foreground">High Risk</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Cleans</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => {
              const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Good"];
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Sparkles className="h-3 w-3 text-cyan-500 shrink-0" />
                    <span className="font-medium">{r.area}</span>
                    <span className="text-muted-foreground truncate">{r.type} · {r.date}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Cleaning Alerts</p>
            {DEMO_ALERTS.map((a, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Cleaning Intelligence</p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
