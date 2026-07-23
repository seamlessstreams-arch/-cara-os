"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SAFEGUARDING INTELLIGENCE CARD
// Dashboard card for incident tracking, restraint analysis, missing episodes,
// risk assessment overview, Reg 40 notification compliance, and Cara insights.
// Powered by the Safeguarding Intelligence Engine — live data.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, Bell, Loader2, ShieldAlert, MapPin, TrendingDown, TrendingUp, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { meets, formatRate } from "@/lib/metrics/rate";
import { useSafeguardingIntelligence } from "@/hooks/use-safeguarding-intelligence";

// ── Styling maps ────────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const RISK_LEVEL_STYLES: Record<string, string> = {
  very_high: "bg-[--cs-risk-bg] text-[--cs-risk]",
  high: "bg-[--cs-warning-soft] text-[--cs-warning]",
  medium: "bg-[--cs-warning-bg] text-[--cs-warning]",
  low: "bg-[--cs-success-bg] text-[--cs-success]",
};

const TREND_ICONS: Record<string, React.ReactNode> = {
  increasing: <TrendingUp className="h-3 w-3 text-red-500" />,
  decreasing: <TrendingDown className="h-3 w-3 text-green-500" />,
  stable: <Minus className="h-3 w-3 text-gray-400" />,
};

// ── Component ────────────────────────────────────────────────────────────────

export function SafeguardingIntelligenceCard() {
  const { data, isLoading } = useSafeguardingIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand" />
            Safeguarding Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const p = intel.profile;
  const r = intel.restraints;
  const m = intel.missing;
  const ne = intel.notifiable_events;
  const ra = intel.risk_assessments;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand" />
            Safeguarding Intelligence
          </CardTitle>
          <Link href="/safeguarding" className="text-xs text-brand hover:underline flex items-center gap-1">
            Safeguarding <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2">
            <div className="flex items-center justify-center gap-1">
              <p className="text-lg font-bold tabular-nums">{p.total_incidents_90d}</p>
              {TREND_ICONS[p.incident_trend]}
            </div>
            <p className="text-[10px] text-muted-foreground">Incidents</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", p.open_incidents > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", p.open_incidents > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>
              {p.open_incidents}
            </p>
            <p className="text-[10px] text-muted-foreground">Open</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", r.total_restraints_30d > 0 ? "bg-orange-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", r.total_restraints_30d > 0 ? "text-orange-600" : "text-[--cs-success]")}>
              {r.total_restraints_90d}
            </p>
            <p className="text-[10px] text-muted-foreground">Restraints</p>
          </div>
          <div className="text-center rounded-lg p-2" style={{ background: meets(ne.compliance_rate, 100) ? "hsl(var(--chart-2) / 0.1)" : ne.compliance_rate === null ? "hsl(var(--muted) / 0.4)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", meets(ne.compliance_rate, 100) ? "text-[--cs-success]" : ne.compliance_rate === null ? "text-muted-foreground" : "text-[--cs-warning]")}>
              {formatRate(ne.compliance_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Reg 40</p>
          </div>
        </div>

        {/* ── Reg 40 notification status ──────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Bell className={cn("h-4 w-4", ne.pending_notification > 0 ? "text-red-500" : ne.notified_late > 0 ? "text-amber-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">Ofsted Notifications</p>
              <p className="text-[10px] text-muted-foreground">
                {ne.notified_on_time} on time · {ne.notified_late} late · {ne.pending_notification} pending
              </p>
            </div>
          </div>
          {ne.pending_notification > 0 ? (
            <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk]">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
              {ne.pending_notification} pending
            </Badge>
          ) : ne.notified_late > 0 ? (
            <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning]">
              {ne.notified_late} late
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-[--cs-success-bg] text-[--cs-success]">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Compliant
            </Badge>
          )}
        </div>

        {/* ── Restraint overview ──────────────────────────────────────── */}

        {r.total_restraints_90d > 0 && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className={cn("h-4 w-4", r.injuries_during_restraint > 0 ? "text-red-500" : "text-amber-500")} />
              <div>
                <p className="text-xs font-medium">Physical Interventions</p>
                <p className="text-[10px] text-muted-foreground">
                  {r.total_restraints_90d} in 90d · Avg {r.average_duration_minutes}min · {formatRate(r.debrief_completion_rate)} debriefed
                </p>
              </div>
            </div>
            {r.injuries_during_restraint > 0 ? (
              <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk]">
                {r.injuries_during_restraint} injury
              </Badge>
            ) : (
              <Badge className="text-[10px] bg-[--cs-success-bg] text-[--cs-success]">
                No injuries
              </Badge>
            )}
          </div>
        )}

        {/* ── Missing from care overview ──────────────────────────────── */}

        {m.total_episodes_90d > 0 && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <MapPin className={cn("h-4 w-4", m.repeat_missing_children > 0 ? "text-red-500" : "text-amber-500")} />
              <div>
                <p className="text-xs font-medium">Missing from Care</p>
                <p className="text-[10px] text-muted-foreground">
                  {m.total_episodes_90d} episodes · {m.children_with_episodes} child(ren) · {formatRate(m.return_interview_rate)} return interviews
                </p>
              </div>
            </div>
            {m.repeat_missing_children > 0 ? (
              <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk]">
                {m.repeat_missing_children} repeat
              </Badge>
            ) : m.contextual_safeguarding_flagged > 0 ? (
              <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning]">
                {m.contextual_safeguarding_flagged} CS risk
              </Badge>
            ) : (
              <Badge className="text-[10px] bg-[--cs-success-bg] text-[--cs-success]">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Managed
              </Badge>
            )}
          </div>
        )}

        {/* ── Risk assessment summary ────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn("h-4 w-4", ra.overdue_reviews > 0 ? "text-amber-500" : ra.high_or_very_high > 0 ? "text-orange-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">Risk Assessments</p>
              <p className="text-[10px] text-muted-foreground">
                {ra.total_current} current · {ra.high_or_very_high} high/very high · {ra.improving_trend} improving
              </p>
            </div>
          </div>
          {ra.overdue_reviews > 0 ? (
            <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning]">
              {ra.overdue_reviews} overdue
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-[--cs-success-bg] text-[--cs-success]">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Current
            </Badge>
          )}
        </div>

        {/* ── Risk domains (top 4) — compact chips ──────────────────── */}

        {ra.by_domain.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(ra.by_domain ?? []).slice(0, 4).map((d) => (
              <Badge
                key={d.domain}
                className={cn("text-[10px]", RISK_LEVEL_STYLES[d.highest_level] ?? "bg-[--cs-bg] text-[--cs-text-secondary]")}
              >
                {d.domain.replace(/_/g, " ")} ({d.highest_level.replace(/_/g, " ")})
              </Badge>
            ))}
          </div>
        )}

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Safeguarding Intelligence
            </p>
            {intel.insights.map((insight, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive,
                )}
              >
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
