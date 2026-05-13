"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MATCHING & REFERRAL INTELLIGENCE CARD
// Dashboard card for referral intake, matching assessments, and admission decisions.
// CHR 2015 Reg 8/9/14. SCCIF: Overall Experiences — Matching.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GitPullRequest, ChevronRight, AlertTriangle, Brain,
  UserPlus, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = {
  total_referrals: 12,
  received_count: 2,
  accepted_count: 6,
  declined_count: 3,
  admitted_count: 4,
  acceptance_rate: 66.7,
  impact_assessment_rate: 83.3,
  existing_children_consulted_rate: 75.0,
  matching_concerns_count: 3,
};

const DEMO_REFERRALS: { child: string; age: number; authority: string; status: string; date: string }[] = [
  { child: "Referral — Lucy M", age: 14, authority: "Anytown CC", status: "received", date: "2026-05-12" },
  { child: "Referral — Jake P", age: 12, authority: "Boroughshire", status: "under_assessment", date: "2026-05-05" },
  { child: "Child G", age: 15, authority: "Anytown CC", status: "admitted", date: "2026-04-20" },
  { child: "Referral — Sam K", age: 11, authority: "Metro Council", status: "declined", date: "2026-04-10" },
  { child: "Child F", age: 13, authority: "Boroughshire", status: "admitted", date: "2026-03-15" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "referral_pending", severity: "medium", message: "Referral for Lucy M (age 14) from Anytown CC received 2026-05-12 — begin assessment." },
  { type: "matching_concerns", severity: "high", message: "Jake P has 2 matching concerns: peer dynamics, behavioural needs." },
];

const ARIA_INSIGHTS = [
  "12 referrals total. 2 currently in pipeline (1 received, 1 under assessment). Acceptance rate: 66.7%. Impact assessment rate: 83.3%. Existing children consulted in 75% of cases. 3 referrals had matching concerns.",
  "Lucy M's referral needs assessment. Jake P under assessment but matching concerns flagged for peer dynamics and behavioural needs — ensure impact assessment on existing children is thorough before any decision.",
  "Gap: Existing children consulted rate (75%) should be higher. All children should have the opportunity to share their views about potential new admissions. Consider improving the consultation process.",
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  received: { label: "Received", color: "text-blue-700 bg-blue-50 border-blue-200" },
  under_assessment: { label: "Assessing", color: "text-amber-700 bg-amber-50 border-amber-200" },
  accepted: { label: "Accepted", color: "text-green-700 bg-green-50 border-green-200" },
  declined: { label: "Declined", color: "text-red-700 bg-red-50 border-red-200" },
  admitted: { label: "Admitted", color: "text-green-700 bg-green-50 border-green-200" },
  withdrawn: { label: "Withdrawn", color: "text-gray-700 bg-gray-50 border-gray-200" },
};

export function MatchingReferralCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-brand" />
            Matching & Referrals
          </CardTitle>
          <Link href="/matching-referral" className="text-xs text-brand hover:underline flex items-center gap-1">
            Referrals <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.received_count === 0 ? "bg-green-50" : "bg-blue-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.received_count === 0 ? "text-green-600" : "text-blue-600")}>{m.received_count}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{m.admitted_count}</p>
            <p className="text-[10px] text-muted-foreground">Admitted</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.acceptance_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Accept Rate</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.matching_concerns_count === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.matching_concerns_count === 0 ? "text-green-600" : "text-amber-600")}>{m.matching_concerns_count}</p>
            <p className="text-[10px] text-muted-foreground">Concerns</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><UserPlus className="h-3 w-3" />Referral Pipeline</p>
          <div className="space-y-1">
            {DEMO_REFERRALS.map((r, i) => {
              const badge = STATUS_BADGES[r.status] ?? STATUS_BADGES.received;
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {r.status === "admitted" ? <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" /> : r.status === "declined" ? <XCircle className="h-3 w-3 text-red-500 shrink-0" /> : <Clock className="h-3 w-3 text-blue-500 shrink-0" />}
                    <span className="font-medium">{r.child}</span>
                    <span className="text-muted-foreground truncate">Age {r.age} — {r.authority}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-muted-foreground">{r.date}</span>
                    <Badge variant="outline" className={cn("text-[10px]", badge.color)}>{badge.label}</Badge>
                  </div>
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
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Matching Intelligence</p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
