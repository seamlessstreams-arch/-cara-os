"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — KEYWORKING INTELLIGENCE CARD
// Dashboard widget for keywork session frequency, mood impact, follow-up
// compliance, per-child profiles, topic coverage, and Cara insights.
// Powered by the Keyworking Intelligence Engine — live data (Reg 9/14/22).
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HeartHandshake, AlertTriangle, CheckCircle2, Brain,
  Users, Loader2, ChevronRight, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useKeyworkingIntelligence } from "@/hooks/use-keyworking-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  medium: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  low: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const COMPLIANCE_STYLES: Record<string, string> = {
  on_track: "text-[--cs-success]",
  below_target: "text-[--cs-warning]",
  overdue: "text-[--cs-risk]",
};

// ── Component ────────────────────────────────────────────────────────────────

export function KeyworkingIntelligenceCard() {
  const { data, isLoading } = useKeyworkingIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-brand" />
            Keyworking Intelligence
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

  const o = intel.overview;
  const fu = intel.follow_up_compliance;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-brand" />
            Keyworking Intelligence
          </CardTitle>
          <Link href="/key-working" className="text-xs text-brand hover:underline flex items-center gap-1">
            Sessions <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.total_sessions_30d}</p>
            <p className="text-[10px] text-muted-foreground">Sessions (30d)</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-green-600">{formatRate(o.mood_improvement_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Mood ↑</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", meets(o.child_voice_rate, 80) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(o.child_voice_rate, 80) ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(o.child_voice_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Voice</p>
          </div>
          <div className="text-center rounded-lg bg-purple-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-purple-600">{o.avg_duration_minutes}m</p>
            <p className="text-[10px] text-muted-foreground">Avg Dur.</p>
          </div>
        </div>

        {/* ── Per-child profiles ───────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Child Keywork
            </p>
            {intel.child_profiles.slice(0, 4).map((child) => (
              <div key={child.child_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{child.child_name}</span>
                    <span className={cn("text-[10px] font-medium", COMPLIANCE_STYLES[child.compliance])}>
                      {child.compliance === "on_track" ? "on track" : child.compliance === "below_target" ? "below target" : "overdue"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold tabular-nums">{child.sessions_30d}</span>
                    <span className="text-muted-foreground text-[10px]">/ 30d</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                  {child.avg_mood_improvement > 0 && (
                    <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                      <TrendingUp className="h-2.5 w-2.5" />+{child.avg_mood_improvement} mood
                    </span>
                  )}
                  <span className="text-[10px]">{child.avg_duration}m avg</span>
                  {child.last_session_days_ago <= 30 && (
                    <span className="text-[10px]">{child.last_session_days_ago}d ago</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Session types ────────────────────────────────────────────── */}

        {intel.session_type_breakdown.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {intel.session_type_breakdown.slice(0, 5).map((b) => (
              <Badge key={b.type} variant="outline" className="text-[10px] gap-1">
                {b.label}
                <span className="font-bold">{b.count_30d}</span>
              </Badge>
            ))}
          </div>
        )}

        {/* ── Follow-up compliance ─────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <HeartHandshake className={cn("h-4 w-4", fu.overdue > 0 ? "text-amber-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">Follow-up Actions</p>
              <p className="text-[10px] text-muted-foreground">
                {fu.total_due > 0
                  ? `${fu.completed}/${fu.total_due} completed · ${formatRate(fu.completion_rate)}`
                  : "No follow-up actions due yet"}
              </p>
            </div>
          </div>
          {fu.overdue > 0 ? (
            <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning]">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
              {fu.overdue} overdue
            </Badge>
          ) : fu.total_due === 0 ? (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              None due
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-[--cs-success-bg] text-[--cs-success]">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All done
            </Badge>
          )}
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Keywork Alerts
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

        {/* ── Cara Keyworking Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Keyworking Intelligence
            </p>
            {intel.insights.slice(0, 3).map((insight, i) => (
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
