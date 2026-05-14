"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert, ChevronRight, AlertTriangle, Brain,
  Clock, FileWarning, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = {
  total_referrals: 10,
  investigation_count: 3,
  pending_count: 2,
  immediate_urgency_count: 2,
  timely_rate: 80.0,
  ofsted_notified_rate: 70.0,
  lado_consulted_rate: 60.0,
  unique_children: 5,
};

const DEMO_RECORDS: { child: string; type: string; urgency: string; status: string }[] = [
  { child: "Child A", type: "MASH", urgency: "Immediate", status: "Investigating" },
  { child: "Child B", type: "Police", urgency: "24 Hours", status: "Pending" },
  { child: "Child C", type: "LADO", urgency: "48 Hours", status: "Completed" },
  { child: "Child D", type: "Social Svc", urgency: "Routine", status: "NFA" },
  { child: "Child A", type: "NSPCC", urgency: "Immediate", status: "Investigating" },
  { child: "Child E", type: "Health", urgency: "1 Week", status: "Monitoring" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "untimely", severity: "critical", message: "1 immediate referral was not timely — review safeguarding response." },
  { type: "ofsted", severity: "high", message: "3 referrals have Ofsted not notified — review notification obligations." },
  { type: "lado", severity: "high", message: "4 referrals have LADO not consulted — review consultation requirement." },
];

const ARIA_INSIGHTS = [
  "10 referrals. Investigating: 3. Pending: 2. Timely: 80%. Ofsted: 70%. LADO: 60%. 5 children.",
  "Priority: 1 untimely immediate. Ofsted gaps. LADO not consulted. Improve notification compliance.",
  "Positive: Multi-agency engagement. Strategy meetings held. Follow-up tracked. Strengthen timeliness.",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  "Investigating": { label: "Invest.", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Pending": { label: "Pending", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Completed": { label: "Done", color: "text-green-700 bg-green-50 border-green-200" },
  "NFA": { label: "NFA", color: "text-gray-700 bg-gray-50 border-gray-200" },
  "Monitoring": { label: "Monitor", color: "text-purple-700 bg-purple-50 border-purple-200" },
};

export function SafeguardingReferralCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-brand" />
            Safeguarding Referrals
          </CardTitle>
          <Link href="/safeguarding-referrals" className="text-xs text-brand hover:underline flex items-center gap-1">
            Referrals <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg p-2 bg-blue-50">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.total_referrals}</p>
            <p className="text-[10px] text-muted-foreground">Referrals</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.pending_count === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.pending_count === 0 ? "text-green-600" : "text-amber-600")}>{m.pending_count}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.timely_rate >= 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.timely_rate >= 100 ? "text-green-600" : "text-amber-600")}>{m.timely_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Timely</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.immediate_urgency_count === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.immediate_urgency_count === 0 ? "text-green-600" : "text-red-600")}>{m.immediate_urgency_count}</p>
            <p className="text-[10px] text-muted-foreground">Urgent</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Recent Referrals</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => {
              const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES["Pending"];
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Send className="h-3 w-3 text-red-500 shrink-0" />
                    <span className="font-medium">{r.child}</span>
                    <span className="text-muted-foreground truncate">{r.type} · {r.urgency}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Referral Alerts</p>
            {DEMO_ALERTS.map((a, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Referral Intelligence</p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
