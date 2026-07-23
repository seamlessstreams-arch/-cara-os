"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HANDOVER CONTINUITY INTELLIGENCE CARD
// Dashboard card powered by the Handover Continuity Intelligence Engine — live data.
// Reg 34(1)(b) — staff must understand responsibilities at handover.
// SCCIF: "Do staff share information effectively at handover?"
// Quality Standards: continuity of care across shifts.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightLeft, ChevronRight, AlertTriangle, Brain, Loader2,
  CheckCircle2, Clock, Heart, FileWarning, Users, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useHandoverContinuityIntelligence } from "@/hooks/use-handover-continuity-intelligence";

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

function moodColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 7) return "text-[--cs-success]";
  if (score >= 5) return "text-[--cs-warning]";
  return "text-[--cs-risk]";
}

function moodBg(score: number | null): string {
  if (score === null) return "bg-muted";
  if (score >= 7) return "bg-green-50";
  if (score >= 5) return "bg-amber-50";
  return "bg-red-50";
}

// ── Component ───────────────────────────────────────────────────────────────

export function ShiftHandoverQualityCard() {
  const { data, isLoading } = useHandoverContinuityIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-brand" />
            Handover Quality
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-brand" />
            Handover Quality
          </CardTitle>
          <Link href="/handover" className="text-xs text-brand hover:underline flex items-center gap-1">
            Handovers <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.completion_rate === null ? "bg-muted" : meets(o.completion_rate, 100) ? "bg-green-50" : meets(o.completion_rate, 50) ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.completion_rate === null ? "text-muted-foreground" : meets(o.completion_rate, 100) ? "text-[--cs-success]" : meets(o.completion_rate, 50) ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {formatRate(o.completion_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Complete</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.sign_off_rate === null ? "bg-muted" : meets(o.sign_off_rate, 100) ? "bg-green-50" : meets(o.sign_off_rate, 50) ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.sign_off_rate === null ? "text-muted-foreground" : meets(o.sign_off_rate, 100) ? "text-[--cs-success]" : meets(o.sign_off_rate, 50) ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {formatRate(o.sign_off_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Signed Off</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", moodBg(o.avg_mood_score))}>
            <p className={cn("text-lg font-bold tabular-nums", moodColor(o.avg_mood_score))}>
              {o.avg_mood_score ?? "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Mood</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.total_child_alerts === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.total_child_alerts === 0 ? "text-[--cs-success]" : "text-[--cs-risk]",
            )}>
              {o.total_child_alerts}
            </p>
            <p className="text-[10px] text-muted-foreground">Alerts</p>
          </div>
        </div>

        {/* ── Key metrics bar ──────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.total_handovers}</p>
            <p className="text-[10px] text-muted-foreground">Handovers</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.children_covered}</p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
          <div>
            <p className={cn(
              "font-bold tabular-nums",
              o.total_flags === 0 ? "text-[--cs-success]" : "text-[--cs-warning]",
            )}>
              {o.total_flags}
            </p>
            <p className="text-[10px] text-muted-foreground">Flags</p>
          </div>
        </div>

        {/* ── Child mood summary ───────────────────────────────────────── */}

        {intel.child_mood_summary.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Heart className="h-3 w-3" />
              Child Mood
            </p>
            {intel.child_mood_summary.map((cm) => (
              <div key={cm.child_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{cm.child_name}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge className={cn("text-[9px]", moodBg(cm.avg_mood), moodColor(cm.avg_mood))}>
                      {cm.avg_mood === null ? "— /10" : `${cm.avg_mood}/10`}
                    </Badge>
                    {cm.total_alerts > 0 && (
                      <Badge className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">
                        {cm.total_alerts} alert{cm.total_alerts !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>
                {(cm.alert_themes?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(cm.alert_themes ?? []).slice(0, 3).map((theme, i) => (
                      <span key={i} className="text-[10px] text-red-600 bg-red-50 rounded px-1.5 py-0.5">
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Handover profiles ─────────────────────────────────────────── */}

        {intel.handover_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Recent Handovers
            </p>
            {intel.handover_profiles.slice(0, 4).map((hp) => (
              <div key={hp.handover_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{hp.shift_label}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge className={cn(
                      "text-[9px]",
                      hp.is_completed ? "bg-[--cs-success-bg] text-[--cs-success]" : "bg-[--cs-risk-bg] text-[--cs-risk]",
                    )}>
                      {hp.is_completed ? "Complete" : "Incomplete"}
                    </Badge>
                    <Badge className={cn(
                      "text-[9px]",
                      hp.is_fully_signed ? "bg-[--cs-success-bg] text-[--cs-success]" : "bg-[--cs-warning-bg] text-[--cs-warning]",
                    )}>
                      {hp.sign_off_count}/{hp.incoming_count} signed
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                  <span className="text-[10px]">{hp.handover_time}</span>
                  <span className="text-[10px]">{hp.child_update_count} child updates</span>
                  {hp.flag_count > 0 && (
                    <span className="text-[10px] text-amber-600">{hp.flag_count} flags</span>
                  )}
                  {hp.incident_link_count > 0 && (
                    <span className="text-[10px] text-red-600">{hp.incident_link_count} incidents</span>
                  )}
                </div>
                {(hp.risk_flags?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(hp.risk_flags ?? []).slice(0, 3).map((flag, i) => (
                      <Badge key={i} className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">
                        <FileWarning className="h-2.5 w-2.5 mr-0.5" />
                        {flag.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Handover Alerts
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

        {/* ── Cara Handover Intelligence ──────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Handover Intelligence
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
