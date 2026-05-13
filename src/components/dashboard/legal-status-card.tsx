"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LEGAL STATUS INTELLIGENCE CARD
// Dashboard card for children's legal status, court orders, conditions,
// and legal milestone tracking.
// CHR 2015 Reg 8/36. Children Act 1989. SCCIF: Well-Led.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Scale, ChevronRight, AlertTriangle, Brain,
  Gavel, Users, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  total_records: 6,
  children_with_records: 6,
  legal_coverage: 100,
  section_20_count: 2,
  full_care_order_count: 2,
  interim_care_order_count: 1,
  placement_order_count: 1,
  staff_briefed_rate: 83.3,
  upcoming_hearings: 2,
  orders_expiring_soon: 1,
};

const DEMO_RECORDS: {
  child: string;
  status: string;
  orderType: string | null;
  expiry: string | null;
  staffBriefed: boolean;
  nextHearing: string | null;
}[] = [
  { child: "Child A", status: "Section 31 (Full)", orderType: "Care Order", expiry: null, staffBriefed: true, nextHearing: null },
  { child: "Child B", status: "Section 20", orderType: null, expiry: null, staffBriefed: true, nextHearing: null },
  { child: "Child C", status: "Section 38 (Interim)", orderType: "Interim Care Order", expiry: "2026-06-15", staffBriefed: true, nextHearing: "2026-05-20" },
  { child: "Child D", status: "Placement Order", orderType: "Placement Order", expiry: null, staffBriefed: true, nextHearing: null },
  { child: "Child E", status: "Section 31 (Full)", orderType: "Care Order", expiry: null, staffBriefed: false, nextHearing: "2026-06-02" },
  { child: "Child F", status: "Section 20", orderType: null, expiry: null, staffBriefed: true, nextHearing: null },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "hearing_imminent", severity: "high", message: "Court hearing for Child C on 2026-05-20 at Anytown Family Court — ensure preparation is complete." },
  { type: "staff_not_briefed", severity: "high", message: "Staff not briefed on legal status for Child E (section 31 full) — all staff must understand the legal framework." },
  { type: "order_expiring", severity: "critical", message: "Interim care order for Child C expires 2026-06-15 — ensure renewal or alternative arrangements." },
];

const ARIA_INSIGHTS = [
  "6 children, all with legal status documented (100% coverage). 2 Section 20 (voluntary), 2 full care orders, 1 interim care, 1 placement order. Staff briefed on 83.3% of cases. 2 upcoming hearings within 30 days. 1 order expiring soon.",
  "Priority: Child C has a court hearing on 2026-05-20 and their interim care order expires 2026-06-15. Ensure solicitor and guardian are contacted, placement report is completed, and all staff understand implications. Child E's staff briefing is overdue.",
  "Section 20 children (B, F): Ensure parental responsibility holders are clearly documented and parents understand their right to remove the child. Regular review of voluntary arrangements is best practice. Consider whether s.31 threshold is met.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function LegalStatusCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4 text-brand" />
            Legal Status
          </CardTitle>
          <Link href="/legal-status" className="text-xs text-brand hover:underline flex items-center gap-1">
            Legal <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.legal_coverage === 100 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.legal_coverage === 100 ? "text-green-600" : "text-red-600")}>
              {m.legal_coverage}%
            </p>
            <p className="text-[10px] text-muted-foreground">Coverage</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.staff_briefed_rate === 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.staff_briefed_rate === 100 ? "text-green-600" : "text-amber-600")}>
              {m.staff_briefed_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Briefed</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.upcoming_hearings === 0 ? "bg-green-50" : "bg-blue-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.upcoming_hearings === 0 ? "text-green-600" : "text-blue-600")}>
              {m.upcoming_hearings}
            </p>
            <p className="text-[10px] text-muted-foreground">Hearings</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.orders_expiring_soon === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.orders_expiring_soon === 0 ? "text-green-600" : "text-red-600")}>
              {m.orders_expiring_soon}
            </p>
            <p className="text-[10px] text-muted-foreground">Expiring</p>
          </div>
        </div>

        {/* ── Legal records ───────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Gavel className="h-3 w-3" />
            Children&apos;s Legal Status
          </p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((rec, i) => (
              <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium">{rec.child}</span>
                  <span className="text-muted-foreground truncate">{rec.status}</span>
                  {rec.staffBriefed && <ShieldCheck className="h-3 w-3 text-green-500 shrink-0" />}
                  {!rec.staffBriefed && <Users className="h-3 w-3 text-amber-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {rec.nextHearing && (
                    <Badge variant="outline" className="text-[10px] text-blue-700 bg-blue-50 border-blue-200">
                      Hearing {rec.nextHearing}
                    </Badge>
                  )}
                  {rec.expiry && (
                    <Badge variant="outline" className="text-[10px] text-red-700 bg-red-50 border-red-200">
                      Exp {rec.expiry}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Legal Alerts
            </p>
            {DEMO_ALERTS.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  alert.severity === "critical" || alert.severity === "high"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ───────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Legal Status Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-blue-200 bg-blue-50 text-blue-800"
                  : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-green-200 bg-green-50 text-green-800",
              )}
            >
              {insight}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
