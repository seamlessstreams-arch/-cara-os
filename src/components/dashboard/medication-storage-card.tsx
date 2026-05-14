"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package, ChevronRight, AlertTriangle, Brain,
  Clock, Thermometer, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = {
  total_checks: 22,
  satisfactory_rate: 81.8,
  temperature_in_range_rate: 85.7,
  cabinet_locked_rate: 95.5,
  all_drugs_accounted_rate: 90.9,
  expired_items_count: 2,
  total_discrepancies: 3,
  unsatisfactory_count: 1,
};

const DEMO_RECORDS: { location: string; type: string; date: string; status: string }[] = [
  { location: "CD Cupboard", type: "Daily Check", date: "14 May", status: "Good" },
  { location: "Med Fridge", type: "Temp Check", date: "14 May", status: "Good" },
  { location: "Cabinet A", type: "Stock Count", date: "13 May", status: "Issue" },
  { location: "CD Cupboard", type: "Lock Check", date: "13 May", status: "Good" },
  { location: "Med Fridge", type: "Temp Check", date: "12 May", status: "Alert" },
  { location: "Cabinet B", type: "Expiry Check", date: "11 May", status: "Good" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "unlocked", severity: "critical", message: "Controlled drug cupboard found unlocked — secure immediately." },
  { type: "not_accounted", severity: "critical", message: "1 check has drugs not accounted for — investigate immediately." },
  { type: "expired", severity: "high", message: "2 checks have found expired items — remove and dispose safely." },
];

const ARIA_INSIGHTS = [
  "22 checks. Satisfactory: 81.8%. Temp in range: 85.7%. Locked: 95.5%. Accounted: 90.9%.",
  "Priority: 1 unlocked cupboard. 1 discrepancy. 2 expired items. Temperature out of range on 3 checks.",
  "Positive: Daily checks maintained. Controlled drugs mostly accounted. Keys secure. Improve storage cleaning.",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Good": { label: "Good", color: "text-green-700 bg-green-50 border-green-200" },
  "Issue": { label: "Issue", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Alert": { label: "Alert", color: "text-red-700 bg-red-50 border-red-200" },
};

export function MedicationStorageCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-brand" />
            Medication Storage
          </CardTitle>
          <Link href="/medication-storage" className="text-xs text-brand hover:underline flex items-center gap-1">
            Storage <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.satisfactory_rate >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.satisfactory_rate >= 90 ? "text-green-600" : "text-amber-600")}>{m.satisfactory_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Satisfact.</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.cabinet_locked_rate >= 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.cabinet_locked_rate >= 100 ? "text-green-600" : "text-amber-600")}>{m.cabinet_locked_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Locked</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.expired_items_count === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.expired_items_count === 0 ? "text-green-600" : "text-red-600")}>{m.expired_items_count}</p>
            <p className="text-[10px] text-muted-foreground">Expired</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.total_discrepancies === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.total_discrepancies === 0 ? "text-green-600" : "text-amber-600")}>{m.total_discrepancies}</p>
            <p className="text-[10px] text-muted-foreground">Discrep.</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Checks</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => {
              const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Good"];
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Lock className="h-3 w-3 text-teal-500 shrink-0" />
                    <span className="font-medium">{r.location}</span>
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
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Storage Alerts</p>
            {DEMO_ALERTS.map((a, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Storage Intelligence</p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
