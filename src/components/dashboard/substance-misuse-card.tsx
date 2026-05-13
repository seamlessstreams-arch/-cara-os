"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SUBSTANCE MISUSE INTELLIGENCE CARD
// Dashboard card for substance assessments, incident tracking, interventions,
// and ARIA substance misuse intelligence.
// CHR 2015 Reg 12 (protection from harm), Reg 34 (notifications).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pill, ChevronRight, AlertTriangle, Brain,
  Activity, Eye, Shield, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  children_assessed: 4,
  total_children: 5,
  serious_risk: 0,
  significant_risk: 1,
  moderate_risk: 1,
  active_referrals: 1,
  incidents_this_quarter: 2,
  overdue_assessments: 1,
};

const DEMO_BY_SUBSTANCE = [
  { substance: "Cannabis", assessments: 2, incidents: 1 },
  { substance: "Alcohol", assessments: 2, incidents: 1 },
  { substance: "Vaping", assessments: 3, incidents: 0 },
  { substance: "Tobacco", assessments: 2, incidents: 0 },
];

const DEMO_RISK_CHILDREN = [
  { child: "Child B", risk: "significant", substance: "Cannabis", status: "active", intervention: true },
  { child: "Child D", risk: "moderate", substance: "Alcohol", status: "monitoring", intervention: true },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "overdue_assessment", severity: "high", message: "Child A's substance assessment is overdue by 2 weeks. Quarterly assessments required for all children with identified risk factors." },
  { type: "intervention_needed", severity: "medium", message: "Child B has significant cannabis risk but referral response from local substance misuse team is pending. Follow up this week." },
];

const ARIA_INSIGHTS = [
  "Child B — significant cannabis risk. Regular use reported by peers and staff observation. Referral to local substance misuse service made 3 weeks ago, awaiting allocation. Intervention plan in place: weekly key-working sessions, education programme scheduled. Cross-reference: behaviour incidents increased 40% in same period.",
  "Child D — moderate alcohol risk. Experimental use identified. Context: peer pressure during unsupervised community access. Intervention plan focuses on peer resistance skills and supervised outings. Social worker informed. No referral needed at this stage — monitoring with 6-weekly reassessment.",
  "Overall: 4/5 children assessed. 1 significant, 1 moderate risk. 1 child not yet assessed (Child E — new admission, assessment due within 2 weeks). 2 incidents this quarter (cannabis found, alcohol suspected). All incidents documented with appropriate notifications. Vaping most common concern across cohort.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function SubstanceMisuseCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className="h-4 w-4 text-brand" />
            Substance Misuse
          </CardTitle>
          <Link href="/substance-misuse" className="text-xs text-brand hover:underline flex items-center gap-1">
            Assessments <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.children_assessed === m.total_children ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.children_assessed === m.total_children ? "text-green-600" : "text-amber-600")}>
              {m.children_assessed}/{m.total_children}
            </p>
            <p className="text-[10px] text-muted-foreground">Assessed</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.significant_risk + m.serious_risk === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.significant_risk + m.serious_risk === 0 ? "text-green-600" : "text-red-600")}>
              {m.significant_risk + m.serious_risk}
            </p>
            <p className="text-[10px] text-muted-foreground">High Risk</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.incidents_this_quarter}</p>
            <p className="text-[10px] text-muted-foreground">Incidents (Q)</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.overdue_assessments === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.overdue_assessments === 0 ? "text-green-600" : "text-red-600")}>
              {m.overdue_assessments}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
        </div>

        {/* ── At-risk children ────────────────────────────────────────── */}

        {DEMO_RISK_CHILDREN.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Children with Identified Risk
            </p>
            {DEMO_RISK_CHILDREN.map((c) => (
              <div key={c.child} className="rounded border p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{c.child}</span>
                  <Badge className={cn(
                    "text-[10px]",
                    c.risk === "serious" || c.risk === "significant" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700",
                  )}>
                    {c.risk}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{c.substance} — {c.status}</span>
                  {c.intervention && <Badge className="text-[9px] bg-blue-100 text-blue-700">Plan active</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── By substance type ───────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Activity className="h-3 w-3" />
            By Substance
          </p>
          {DEMO_BY_SUBSTANCE.map((s) => (
            <div key={s.substance} className="flex items-center justify-between rounded border p-2 text-xs">
              <span className="truncate flex-1">{s.substance}</span>
              <div className="flex items-center gap-1.5 ml-2">
                <Badge variant="outline" className="text-[10px] tabular-nums">{s.assessments} assessed</Badge>
                {s.incidents > 0 && (
                  <Badge className="text-[10px] bg-red-100 text-red-700">{s.incidents} incident</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Response ────────────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Eye className="h-3 w-3 text-blue-500" />
            Active Response
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center rounded border p-2">
              <p className="text-sm font-bold tabular-nums text-blue-600">{m.active_referrals}</p>
              <p className="text-[10px] text-muted-foreground">Referrals</p>
            </div>
            <div className="text-center rounded border p-2">
              <p className="text-sm font-bold tabular-nums text-blue-600">{m.moderate_risk + m.significant_risk}</p>
              <p className="text-[10px] text-muted-foreground">Plans Active</p>
            </div>
            <div className="text-center rounded border p-2">
              <p className="text-sm font-bold tabular-nums text-blue-600">{m.children_assessed}</p>
              <p className="text-[10px] text-muted-foreground">Assessed</p>
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Substance Misuse Alerts
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

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Substance Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-red-200 bg-red-50 text-red-800"
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
