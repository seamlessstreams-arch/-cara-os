"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COMPLAINTS INVESTIGATION INTELLIGENCE CARD
// CHR 2015 Reg 38, Reg 13; Children Act 1989 s26.
// SCCIF: Leadership & Management — "Complaints are investigated
// thoroughly and used as opportunities for learning."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquareWarning, ChevronRight, AlertTriangle, Brain,
  Scale, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = {
  total_complaints: 8,
  child_complaints: 3,
  open_complaints: 3,
  resolved_complaints: 4,
  escalated_complaints: 1,
  acknowledged_rate: 87.5,
  learning_identified_rate: 75.0,
  satisfaction_rate: 60.0,
};

const DEMO_RECORDS: { source: string; category: string; stage: string; outcome: string }[] = [
  { source: "Child", category: "Care Quality", stage: "Investigating", outcome: "Pending" },
  { source: "Parent", category: "Contact", stage: "Resolved", outcome: "Upheld" },
  { source: "Social Worker", category: "Communication", stage: "Resolved", outcome: "Partially Upheld" },
  { source: "Staff", category: "Staff Conduct", stage: "Escalated", outcome: "Pending" },
  { source: "Child", category: "Activities", stage: "Resolved", outcome: "Upheld" },
  { source: "Advocate", category: "Safeguarding", stage: "Investigating", outcome: "Pending" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "safeguarding_complaint", severity: "critical", message: "Active safeguarding complaint from advocate — prioritise investigation." },
  { type: "escalated", severity: "high", message: "1 complaint has been escalated — review investigation process." },
  { type: "late_acknowledgement", severity: "high", message: "1 complaint was not acknowledged within 24 hours — Reg 38 requires prompt acknowledgement." },
];

const ARIA_INSIGHTS = [
  "8 complaints (3 from children). Open: 3. Resolved: 4. Escalated: 1. Acknowledged within 24h: 87.5%. Learning rate: 75.0%.",
  "Priority: Active safeguarding complaint — prioritise. 1 escalated complaint needs RM review. 1 late acknowledgement. Child complaints 37.5% — positive they feel safe to complain.",
  "Positive: 75% learning rate shows reflective culture. 87.5% acknowledgement mostly compliant. Children making complaints directly shows trust. Review resolution timescales for open cases.",
];

const STAGE_BADGES: Record<string, { label: string; color: string }> = {
  "Investigating": { label: "Investigating", color: "text-blue-700 bg-blue-50 border-blue-200" },
  "Resolved": { label: "Resolved", color: "text-green-700 bg-green-50 border-green-200" },
  "Escalated": { label: "Escalated", color: "text-red-700 bg-red-50 border-red-200" },
  "Received": { label: "Received", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Withdrawn": { label: "Withdrawn", color: "text-slate-600 bg-slate-50 border-slate-200" },
};

export function ComplaintsInvestigationCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquareWarning className="h-4 w-4 text-brand" />
            Complaints Investigation
          </CardTitle>
          <Link href="/complaints-investigation" className="text-xs text-brand hover:underline flex items-center gap-1">
            Complaints <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.open_complaints > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.open_complaints > 0 ? "text-amber-600" : "text-green-600")}>{m.open_complaints}</p>
            <p className="text-[10px] text-muted-foreground">Open</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.escalated_complaints > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.escalated_complaints > 0 ? "text-red-600" : "text-green-600")}>{m.escalated_complaints}</p>
            <p className="text-[10px] text-muted-foreground">Escalated</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{m.acknowledged_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Ack&apos;d 24h</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.learning_identified_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Learning</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Scale className="h-3 w-3" />Recent Complaints</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => {
              const badge = STAGE_BADGES[r.stage] ?? STAGE_BADGES["Received"];
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CheckCircle2 className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="font-medium">{r.source}</span>
                    <span className="text-muted-foreground truncate">{r.category} · {r.outcome}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Complaint Alerts</p>
            {DEMO_ALERTS.map((a, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Complaints Intelligence</p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
