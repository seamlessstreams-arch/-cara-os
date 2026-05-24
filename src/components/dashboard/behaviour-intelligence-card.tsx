"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BEHAVIOUR SUPPORT INTELLIGENCE CARD
// Dashboard card for behaviour trends, PI analysis, de-escalation success,
// rewards/sanctions balance, and ARIA behaviour intelligence (Reg 19/20).
// Powered by the Behaviour Intelligence Engine — live data.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, Shield, HandMetal, SmilePlus, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBehaviourIntelligence } from "@/hooks/use-behaviour-intelligence";

// ── Colour maps ────────────────────────────────────────────────────────────

const CATEGORY_COLOURS: Record<string, string> = {
  positive: "bg-green-400",
  concerning: "bg-amber-400",
  escalating: "bg-orange-400",
  verbal_aggression: "bg-orange-400",
  aggression: "bg-red-400",
  property_damage: "bg-red-400",
  self_harm: "bg-red-500",
  absconding: "bg-purple-400",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};

// ── Component ────────────────────────────────────────────────────────────────

export function BehaviourIntelligenceCard() {
  const { data, isLoading } = useBehaviourIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand" />
            Behaviour Support
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
  const rs = intel.rewards_sanctions;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand" />
            Behaviour Support
          </CardTitle>
          <Link href="/behaviour" className="text-xs text-brand hover:underline flex items-center gap-1">
            Behaviour <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">
              {p.positive_percentage}%
            </p>
            <p className="text-[10px] text-muted-foreground">Positive</p>
          </div>
          <div className="text-center rounded-lg p-2" style={{ background: p.de_escalation_success_rate >= 75 ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", p.de_escalation_success_rate >= 75 ? "text-green-600" : "text-amber-600")}>
              {p.de_escalation_success_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">De-escalation</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", p.pi_count > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", p.pi_count > 0 ? "text-amber-600" : "text-green-600")}>
              {p.pi_count}
            </p>
            <p className="text-[10px] text-muted-foreground">PI Events</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", rs.ratio >= 75 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", rs.ratio >= 75 ? "text-green-600" : "text-amber-600")}>
              {rs.ratio}%
            </p>
            <p className="text-[10px] text-muted-foreground">Reward Ratio</p>
          </div>
        </div>

        {/* ── Category breakdown ──────────────────────────────────────── */}

        {intel.categories.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Behaviour Categories</p>
            <div className="space-y-1">
              {intel.categories.map((cat) => (
                <div key={cat.category} className="flex items-center gap-2 text-xs">
                  <span className="w-28 text-muted-foreground capitalize">{cat.category.replace(/_/g, " ")}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", CATEGORY_COLOURS[cat.category] ?? "bg-gray-400")}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right tabular-nums font-medium">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PI events ──────────────────────────────────────────────── */}

        {intel.pi_entries.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <HandMetal className="h-3 w-3" />
              Physical Interventions
            </p>
            {intel.pi_entries.slice(0, 3).map((pi) => (
              <div key={pi.id} className="rounded-lg border p-2.5 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{pi.child_name}</span>
                  <span className="text-muted-foreground">{pi.technique} · {pi.duration_minutes}m</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {pi.debriefed ? (
                    <Badge className="text-[10px] bg-green-100 text-green-700">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                      Debriefed
                    </Badge>
                  ) : (
                    <Badge className="text-[10px] bg-red-100 text-red-700">
                      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                      No debrief
                    </Badge>
                  )}
                  {pi.injury && (
                    <Badge className="text-[10px] bg-red-100 text-red-700">Injury</Badge>
                  )}
                  <span className="text-muted-foreground">{pi.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Rewards vs Sanctions ────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <SmilePlus className={cn("h-4 w-4", rs.ratio >= 75 ? "text-green-500" : "text-amber-500")} />
            <div>
              <p className="text-xs font-medium">Rewards vs Sanctions</p>
              <p className="text-[10px] text-muted-foreground">
                {rs.total_rewards} rewards · {rs.total_sanctions} sanctions
              </p>
            </div>
          </div>
          <Badge className={cn("text-[10px]", rs.ratio >= 75 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
            {rs.reward_to_sanction} ratio
          </Badge>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Behaviour Alerts
            </p>
            {intel.alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium,
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Behaviour Intelligence
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
