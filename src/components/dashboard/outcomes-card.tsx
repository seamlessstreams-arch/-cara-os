"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — YOUNG PERSON OUTCOMES INTELLIGENCE CARD
// Dashboard widget for outcome target tracking, domain progress analysis,
// per-child profiles, review compliance, and ARIA outcomes intelligence.
// Powered by the Outcomes Progress Engine — live data (Reg 7–14, SCCIF).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target, ChevronRight, AlertTriangle, TrendingUp,
  TrendingDown, Brain, Loader2, CheckCircle2, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOutcomesProgress } from "@/hooks/use-outcomes-progress";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const DIRECTION_COLOURS: Record<string, string> = {
  improving: "text-green-600",
  stable: "text-gray-500",
  declining: "text-red-600",
};

// ── Component ────────────────────────────────────────────────────────────────

export function OutcomesCard() {
  const { data, isLoading } = useOutcomesProgress();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-brand" />
            Young Person Outcomes
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
  const rc = intel.review_compliance;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-brand" />
            Young Person Outcomes
          </CardTitle>
          <Link href="/outcomes" className="text-xs text-brand hover:underline flex items-center gap-1">
            Outcomes <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.active_targets}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-green-600">{o.achieved_targets}</p>
            <p className="text-[10px] text-muted-foreground">Achieved</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.improving_pct >= 50 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.improving_pct >= 50 ? "text-green-600" : "text-amber-600")}>
              {o.improving_pct}%
            </p>
            <p className="text-[10px] text-muted-foreground">Improving</p>
          </div>
          <div className="text-center rounded-lg bg-purple-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-purple-600">{o.avg_progress_pct}%</p>
            <p className="text-[10px] text-muted-foreground">Progress</p>
          </div>
        </div>

        {/* ── Direction summary ───────────────────────────────────────── */}

        <div className="flex items-center justify-between text-xs border rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-green-600">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="font-medium">{o.improving_count} improving</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <span className="font-medium">{o.stable_count} stable</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-600">
            <TrendingDown className="h-3.5 w-3.5" />
            <span className="font-medium">{o.declining_count} declining</span>
          </div>
        </div>

        {/* ── Domain progress ─────────────────────────────────────────── */}

        {intel.domain_analysis.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Domain Progress</p>
            {intel.domain_analysis.map((d) => (
              <div key={d.domain} className="flex items-center gap-2 text-xs">
                <span className="w-24 truncate text-muted-foreground">{d.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      d.avg_progress_pct >= 60 ? "bg-green-400"
                        : d.avg_progress_pct >= 30 ? "bg-amber-400"
                        : "bg-red-400",
                    )}
                    style={{ width: `${d.avg_progress_pct}%` }}
                  />
                </div>
                <span className="w-8 text-right tabular-nums font-medium">{d.avg_progress_pct}%</span>
                <Badge variant="outline" className="text-[10px] tabular-nums">{d.active_targets}</Badge>
              </div>
            ))}
          </div>
        )}

        {/* ── Per-child outcome profiles ──────────────────────────────���─ */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Child Outcomes
            </p>
            {intel.child_profiles.slice(0, 4).map((child) => (
              <div key={child.child_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{child.child_name}</span>
                    <span className={cn("text-[10px] font-medium", DIRECTION_COLOURS[child.overall_direction])}>
                      {child.overall_direction}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold tabular-nums">{child.avg_progress_pct}%</span>
                    <span className="text-muted-foreground text-[10px]">progress</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                  <span className="text-[10px]">{child.active_targets} active</span>
                  {child.achieved_targets > 0 && (
                    <Badge className="text-[9px] bg-green-100 text-green-700">
                      {child.achieved_targets} achieved
                    </Badge>
                  )}
                  {child.strongest_domain && (
                    <span className="text-[10px] text-green-600">↑ {child.strongest_domain}</span>
                  )}
                  {child.reviews_overdue > 0 && (
                    <Badge className="text-[9px] bg-amber-100 text-amber-700">
                      {child.reviews_overdue} review overdue
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Review compliance ───────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Target className={cn("h-4 w-4", rc.targets_overdue_review > 0 ? "text-amber-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">Review Compliance</p>
              <p className="text-[10px] text-muted-foreground">
                {rc.total_reviews_30d} reviews (30d) · {rc.yp_participation_rate}% YP voice
              </p>
            </div>
          </div>
          {rc.targets_overdue_review > 0 ? (
            <Badge className="text-[10px] bg-amber-100 text-amber-700">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
              {rc.targets_overdue_review} overdue
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All current
            </Badge>
          )}
        </div>

        {/* ── Alerts ──────────────────────��───────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Outcome Alerts
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

        {/* ── ARIA Outcomes Intelligence ──────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Outcomes Intelligence
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
