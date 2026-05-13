"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONTEXTUAL SAFEGUARDING INTELLIGENCE CARD
// Dashboard card for exploitation screenings, locality risk mapping,
// extra-familial risk tracking, and ARIA safeguarding intelligence.
// CHR 2015 Reg 12 (protection from harm), Reg 13, Reg 34, SCCIF Helped & Protected.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert, ChevronRight, AlertTriangle, Brain,
  MapPin, Eye, Users, Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  children_screened: 5,
  total_children: 5,
  screenings_this_quarter: 8,
  high_risk_children: 1,
  moderate_risk: 2,
  emerging_risk: 1,
  no_concern: 4,
  referrals_made: 2,
  safety_plans_active: 2,
  overdue_screenings: 1,
  locality_risks_total: 6,
  locality_high_risk: 2,
};

const DEMO_SCREENING_TYPES = [
  { type: "CSE", count: 5, highRisk: 1 },
  { type: "CCE / County Lines", count: 4, highRisk: 0 },
  { type: "Online", count: 5, highRisk: 0 },
  { type: "Radicalisation", count: 3, highRisk: 0 },
  { type: "Peer-on-Peer", count: 3, highRisk: 0 },
];

const DEMO_HIGH_RISK_LOCATIONS = [
  { name: "Town Centre Park", type: "Park", risk: "Drug dealing / CCE", level: "high" },
  { name: "Bus Station", type: "Transport Hub", risk: "CSE / Grooming", level: "high" },
  { name: "Shopping Centre", type: "Venue", risk: "Gang activity", level: "medium" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "serious_risk", severity: "critical", message: "Child A has serious CSE risk level. Safety plan active, referral made to MACE. Next screening overdue." },
  { type: "overdue_screening", severity: "high", message: "1 child has overdue exploitation screening. Quarterly screenings required for all children." },
  { type: "high_risk_location", severity: "medium", message: "2 high-risk locality areas identified near the home. Ensure all staff are aware of mitigation measures." },
];

const ARIA_INSIGHTS = [
  "Child A flagged as serious CSE risk — 5 indicators identified including going missing, unexplained gifts, and older associates. MACE referral active. Safety plan review due in 3 days. Cross-reference with missing from care data — 3 episodes in 30 days.",
  "2 high-risk locations within 1 mile of the home (park and bus station). Staff should use agreed safe routes and be aware of county lines activity. Mitigation measures include always-two escort policy for under-14s in these areas.",
  "Overall: 5/5 children screened this quarter. 1 serious, 2 moderate, 1 emerging risk. Online risk screening completed for all children. 2 active referrals (MACE and police). Radicalisation screening up to date. Next full screening cycle due in 6 weeks.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function ContextualSafeguardingCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-brand" />
            Contextual Safeguarding
          </CardTitle>
          <Link href="/contextual-safeguarding" className="text-xs text-brand hover:underline flex items-center gap-1">
            Screenings <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.children_screened === m.total_children ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.children_screened === m.total_children ? "text-green-600" : "text-red-600")}>
              {m.children_screened}/{m.total_children}
            </p>
            <p className="text-[10px] text-muted-foreground">Screened</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.high_risk_children === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.high_risk_children === 0 ? "text-green-600" : "text-red-600")}>
              {m.high_risk_children}
            </p>
            <p className="text-[10px] text-muted-foreground">High Risk</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.referrals_made}</p>
            <p className="text-[10px] text-muted-foreground">Referrals</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.overdue_screenings === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.overdue_screenings === 0 ? "text-green-600" : "text-red-600")}>
              {m.overdue_screenings}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
        </div>

        {/* ── Risk distribution ────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded border p-2">
            <p className="text-sm font-bold tabular-nums text-red-600">{m.high_risk_children}</p>
            <p className="text-[10px] text-muted-foreground">Serious</p>
          </div>
          <div className="text-center rounded border p-2">
            <p className="text-sm font-bold tabular-nums text-amber-600">{m.moderate_risk}</p>
            <p className="text-[10px] text-muted-foreground">Moderate</p>
          </div>
          <div className="text-center rounded border p-2">
            <p className="text-sm font-bold tabular-nums text-yellow-600">{m.emerging_risk}</p>
            <p className="text-[10px] text-muted-foreground">Emerging</p>
          </div>
          <div className="text-center rounded border p-2">
            <p className="text-sm font-bold tabular-nums text-green-600">{m.no_concern}</p>
            <p className="text-[10px] text-muted-foreground">No Concern</p>
          </div>
        </div>

        {/* ── Screening types ─────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Screening Coverage
          </p>
          {DEMO_SCREENING_TYPES.map((s) => (
            <div key={s.type} className="flex items-center justify-between rounded border p-2 text-xs">
              <span className="truncate flex-1">{s.type}</span>
              <div className="flex items-center gap-1.5 ml-2">
                <Badge variant="outline" className="text-[10px] tabular-nums">{s.count}</Badge>
                {s.highRisk > 0 && (
                  <Badge className="text-[10px] bg-red-100 text-red-700">
                    <Radio className="h-2.5 w-2.5 mr-0.5" />
                    {s.highRisk} high
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Locality risk map ───────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Locality Risks ({m.locality_risks_total})
          </p>
          {DEMO_HIGH_RISK_LOCATIONS.map((l) => (
            <div key={l.name} className="flex items-center justify-between rounded border p-2 text-xs">
              <div className="flex items-center gap-2 flex-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <span className="font-medium">{l.name}</span>
                  <span className="text-muted-foreground ml-1">({l.type})</span>
                </div>
              </div>
              <Badge className={cn(
                "text-[10px]",
                l.level === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700",
              )}>
                {l.risk}
              </Badge>
            </div>
          ))}
        </div>

        {/* ── Safety plans ────────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Users className="h-3 w-3 text-indigo-500" />
            Active Response
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center rounded border p-2">
              <p className="text-sm font-bold tabular-nums text-blue-600">{m.safety_plans_active}</p>
              <p className="text-[10px] text-muted-foreground">Safety Plans</p>
            </div>
            <div className="text-center rounded border p-2">
              <p className="text-sm font-bold tabular-nums text-indigo-600">{m.referrals_made}</p>
              <p className="text-[10px] text-muted-foreground">Referrals</p>
            </div>
            <div className="text-center rounded border p-2">
              <p className="text-sm font-bold tabular-nums text-blue-600">{m.screenings_this_quarter}</p>
              <p className="text-[10px] text-muted-foreground">Screenings (Q)</p>
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Exploitation Alerts
            </p>
            {DEMO_ALERTS.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  alert.severity === "critical" ? "border-red-300 bg-red-50 text-red-800"
                    : alert.severity === "high" ? "border-red-200 bg-red-50 text-red-800"
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
            ARIA Exploitation Intelligence
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
