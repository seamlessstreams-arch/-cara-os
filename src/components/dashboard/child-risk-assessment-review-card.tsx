"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD RISK ASSESSMENT REVIEW INTELLIGENCE CARD
// Dashboard card powered by the Risk Assessment Intelligence Engine.
// CHR 2015 Reg 12. SCCIF: Helped & Protected — Risk management.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert, ChevronRight, AlertTriangle, Brain,
  Target, TrendingDown, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRiskAssessmentIntelligence } from "@/hooks/use-risk-assessment-intelligence";

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

const LEVEL_STYLES: Record<string, string> = {
  very_high: "bg-red-100 text-red-700 border-red-200",
  high:      "bg-orange-100 text-orange-700 border-orange-200",
  medium:    "bg-amber-100 text-amber-700 border-amber-200",
  low:       "bg-green-100 text-green-700 border-green-200",
};

// ── Component ───────────────────────────────────────────────────────────────

export function ChildRiskAssessmentReviewCard() {
  const { data, isLoading } = useRiskAssessmentIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-brand" />
            Risk Assessment Reviews
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
            <ShieldAlert className="h-4 w-4 text-brand" />
            Risk Assessment Reviews
          </CardTitle>
          <Link href="/risk-assessments" className="text-xs text-brand hover:underline flex items-center gap-1">
            Reviews <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", o.decreasing_count > 0 ? "bg-green-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.decreasing_count > 0 ? "text-green-600" : "text-gray-600")}>{o.decreasing_count}</p>
            <p className="text-[10px] text-muted-foreground">Reducing</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.increasing_count === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.increasing_count === 0 ? "text-green-600" : "text-red-600")}>{o.increasing_count}</p>
            <p className="text-[10px] text-muted-foreground">Increasing</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", (o.very_high_count + o.high_count) === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (o.very_high_count + o.high_count) === 0 ? "text-green-600" : "text-red-600")}>{o.very_high_count + o.high_count}</p>
            <p className="text-[10px] text-muted-foreground">High+</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.child_voice_rate >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.child_voice_rate >= 90 ? "text-green-600" : "text-amber-600")}>{o.child_voice_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Voice</p>
          </div>
        </div>

        {/* ── Child risk profiles ─────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Child Risk Profiles
            </p>
            {intel.child_profiles.map((cp) => (
              <div key={cp.child_id} className="rounded border p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{cp.child_id.replace("yp_", "")}</span>
                  <Badge variant="outline" className={cn("text-[10px]", LEVEL_STYLES[cp.highest_level] ?? LEVEL_STYLES.medium)}>
                    {cp.highest_level.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(cp.domains ?? []).map((d) => (
                    <Badge key={d} variant="outline" className="text-[10px] capitalize">
                      {d.replace(/_/g, " ")}
                    </Badge>
                  ))}
                  {cp.increasing_risks > 0 && (
                    <Badge className="text-[10px] bg-red-100 text-red-700">{cp.increasing_risks} increasing</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Domain analysis ─────────────────────────────────────────── */}

        {intel.domain_analysis.length > 0 && (
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-xs font-semibold flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-green-500" />
              Mitigation Effectiveness
            </p>
            <div className="space-y-1">
              {intel.domain_analysis.map((da) => (
                <div key={da.domain} className="flex items-center gap-2 text-xs">
                  <span className="w-20 truncate capitalize text-muted-foreground">{da.domain.replace(/_/g, " ")}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", da.mitigation_effective_rate >= 75 ? "bg-green-400" : da.mitigation_effective_rate >= 50 ? "bg-amber-400" : "bg-red-400")}
                      style={{ width: `${da.mitigation_effective_rate}%` }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums font-medium w-8 text-right">{da.mitigation_effective_rate}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Risk Review Alerts
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

        {/* ── ARIA Risk Intelligence ─────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Risk Intelligence
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
