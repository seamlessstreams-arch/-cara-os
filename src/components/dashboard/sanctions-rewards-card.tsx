"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SANCTIONS & REWARDS INTELLIGENCE CARD
// Dashboard card powered by the Sanctions & Rewards Intelligence Engine.
// CHR 2015 Reg 19 (behaviour management), Reg 35 (behaviour management
// standards), SCCIF Experiences & Progress, Helped & Protected.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Award, ChevronRight, AlertTriangle, Brain,
  ThumbsDown, ThumbsUp, BarChart3, Loader2, FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSanctionsRewardsIntelligence } from "@/hooks/use-sanctions-rewards-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high:     "border-red-200 bg-red-50 text-red-800",
  medium:   "border-amber-200 bg-amber-50 text-amber-800",
  low:      "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning:  "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function SanctionsRewardsCard() {
  const { data, isLoading } = useSanctionsRewardsIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-brand" />
            Sanctions & Rewards
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
            <Award className="h-4 w-4 text-brand" />
            Sanctions & Rewards
          </CardTitle>
          <Link href="/sanctions-rewards" className="text-xs text-brand hover:underline flex items-center gap-1">
            Framework <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.reward_to_sanction_ratio >= 3 ? "bg-green-50" : o.reward_to_sanction_ratio >= 2 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.reward_to_sanction_ratio >= 3 ? "text-green-600" : o.reward_to_sanction_ratio >= 2 ? "text-amber-600" : "text-red-600",
            )}>
              {o.reward_to_sanction_ratio}:1
            </p>
            <p className="text-[10px] text-muted-foreground">R:S Ratio</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.proportionality_rate === 100 ? "bg-green-50" : o.proportionality_rate >= 80 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.proportionality_rate === 100 ? "text-green-600" : o.proportionality_rate >= 80 ? "text-amber-600" : "text-red-600",
            )}>
              {o.proportionality_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Proportionate</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-green-600">
              {o.total_rewards}
            </p>
            <p className="text-[10px] text-muted-foreground">Rewards</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.total_sanctions === 0 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.total_sanctions === 0 ? "text-green-600" : "text-amber-600",
            )}>
              {o.total_sanctions}
            </p>
            <p className="text-[10px] text-muted-foreground">Sanctions</p>
          </div>
        </div>

        {/* ── Type breakdowns (side by side) ──────────────────────────── */}

        <div className="grid grid-cols-2 gap-3">
          {intel.sanction_types.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <ThumbsDown className="h-3 w-3" />
                Sanctions ({o.total_sanctions})
              </p>
              {intel.sanction_types.slice(0, 4).map((s) => (
                <div key={s.type} className="flex items-center justify-between text-xs rounded border p-1.5">
                  <span className="truncate">{s.type_label}</span>
                  <Badge variant="outline" className="text-[10px] tabular-nums">{s.count}</Badge>
                </div>
              ))}
            </div>
          )}
          {intel.reward_types.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                Rewards ({o.total_rewards})
              </p>
              {intel.reward_types.slice(0, 4).map((r) => (
                <div key={r.type} className="flex items-center justify-between text-xs rounded border p-1.5">
                  <span className="truncate">{r.type_label}</span>
                  <Badge variant="outline" className="text-[10px] tabular-nums">{r.count}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Per-child breakdown ──────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Per Child
            </p>
            {intel.child_profiles.slice(0, 5).map((c) => (
              <div key={c.child_id} className="rounded-lg border p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.child_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 tabular-nums">{c.sanctions}S</span>
                    <span className="text-green-600 tabular-nums">{c.rewards}R</span>
                    {c.sanctions > 0 && (
                      <Badge className={cn(
                        "text-[10px] tabular-nums",
                        c.ratio >= 3 ? "bg-green-100 text-green-700"
                          : c.ratio >= 2 ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700",
                      )}>
                        {c.ratio}:1
                      </Badge>
                    )}
                  </div>
                </div>
                {(c.risk_flags?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(c.risk_flags ?? []).slice(0, 3).map((flag, i) => (
                      <Badge key={i} className="text-[9px] bg-red-100 text-red-700">
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

        {/* ── Key metrics bar ──────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.children_with_entries}</p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
          <div>
            <p className="font-bold text-green-600 tabular-nums">{o.children_with_rewards_only}</p>
            <p className="text-[10px] text-muted-foreground">Rewards Only</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.staff_recording_count}</p>
            <p className="text-[10px] text-muted-foreground">Staff Recording</p>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
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

        {/* ── ARIA Behaviour Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Behaviour Intelligence
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
