"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  KeyRound, ChevronRight, AlertTriangle, Brain,
  Clock, Lock, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = {
  total_events: 18,
  keys_issued_count: 8,
  keys_returned_count: 6,
  keys_lost_count: 1,
  all_accounted_rate: 83.3,
  discrepancy_count: 1,
  total_keys_missing: 2,
  audits_count: 3,
};

const DEMO_RECORDS: { event: string; key: string; holder: string; status: string }[] = [
  { event: "Audit", key: "All", holder: "Manager", status: "OK" },
  { event: "Issued", key: "Front Door", holder: "Staff A", status: "Active" },
  { event: "Returned", key: "Office", holder: "Staff B", status: "Returned" },
  { event: "Lost", key: "Back Door", holder: "Staff C", status: "Lost" },
  { event: "Issued", key: "Med Cabinet", holder: "Nurse", status: "Active" },
  { event: "Lock Changed", key: "Back Door", holder: "N/A", status: "Changed" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "lost", severity: "high", message: "1 lost key has not had locks changed — address security risk." },
  { type: "discrepancy", severity: "high", message: "1 key audit has found discrepancies — investigate and reconcile." },
  { type: "register", severity: "medium", message: "3 key events without register updated — maintain accurate records." },
];

const ARIA_INSIGHTS = [
  "18 events. Issued: 8. Returned: 6. Lost: 1. All accounted: 83.3%. 1 discrepancy. 2 keys missing.",
  "Priority: 1 lost key without lock change. 1 audit discrepancy. Register gaps. Address back door security.",
  "Positive: 3 audits completed. Lock changed after loss. Medication keys separate. Improve register updates.",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "OK": { label: "OK", color: "text-green-700 bg-green-50 border-green-200" },
  "Active": { label: "Active", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Returned": { label: "Return", color: "text-green-700 bg-green-50 border-green-200" },
  "Lost": { label: "Lost", color: "text-red-700 bg-red-50 border-red-200" },
  "Changed": { label: "Changed", color: "text-amber-700 bg-amber-50 border-amber-200" },
};

export function KeyHoldingCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-brand" />
            Key Holding Register
          </CardTitle>
          <Link href="/key-holding" className="text-xs text-brand hover:underline flex items-center gap-1">
            Keys <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.all_accounted_rate >= 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.all_accounted_rate >= 100 ? "text-green-600" : "text-amber-600")}>{m.all_accounted_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Accounted</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-blue-50">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.keys_issued_count}</p>
            <p className="text-[10px] text-muted-foreground">Issued</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.keys_lost_count === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.keys_lost_count === 0 ? "text-green-600" : "text-red-600")}>{m.keys_lost_count}</p>
            <p className="text-[10px] text-muted-foreground">Lost</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.discrepancy_count === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.discrepancy_count === 0 ? "text-green-600" : "text-amber-600")}>{m.discrepancy_count}</p>
            <p className="text-[10px] text-muted-foreground">Issues</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Events</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => {
              const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["OK"];
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Lock className="h-3 w-3 text-slate-500 shrink-0" />
                    <span className="font-medium">{r.event}</span>
                    <span className="text-muted-foreground truncate">{r.key} · {r.holder}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Key Holding Alerts</p>
            {DEMO_ALERTS.map((a, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Key Security Intelligence</p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
