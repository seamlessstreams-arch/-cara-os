"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — QUALITY OF CARE REVIEW CARD
// Dashboard card powered by the Quality Assurance Intelligence Engine.
// Reg 45 (quality of care review), SCCIF Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Award, ChevronRight, AlertTriangle, Brain,
  Star, Target, TrendingUp, FileSearch, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQualityAssuranceIntelligence } from "@/hooks/use-quality-assurance-intelligence";

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

const RATING_COLOURS: Record<string, string> = {
  Excellent: "bg-green-100 text-green-700",
  Good: "bg-blue-100 text-blue-700",
  "Requires Improvement": "bg-amber-100 text-amber-700",
  Inadequate: "bg-red-100 text-red-700",
};

// ── Component ───────────────────────────────────────────────────────────────

export function QualityOfCareReviewCard() {
  const { data, isLoading } = useQualityAssuranceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card className="border-yellow-200">
        <CardHeader className="pb-3 bg-yellow-50/50">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-900">Quality of Care</span>
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
    <Card className="overflow-hidden border-yellow-200">
      <CardHeader className="pb-3 bg-yellow-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-900">Quality of Care</span>
          </CardTitle>
          <Link href="/audits" className="text-xs text-yellow-600 hover:underline flex items-center gap-1">
            Reviews <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.avg_rating_score >= 3 ? "bg-green-50" : o.avg_rating_score >= 2 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.avg_rating_score >= 3 ? "text-green-600" : o.avg_rating_score >= 2 ? "text-amber-600" : "text-red-600",
            )}>
              {o.avg_rating_label}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Rating</p>
          </div>
          <div className="text-center rounded-lg bg-yellow-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-yellow-600">
              {o.total_audits}
            </p>
            <p className="text-[10px] text-muted-foreground">Audits</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.actions_overdue === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.actions_overdue === 0 ? "text-green-600" : "text-red-600",
            )}>
              {o.actions_overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.improvement_rate >= 80 ? "bg-green-50" : o.improvement_rate >= 60 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.improvement_rate >= 80 ? "text-green-600" : o.improvement_rate >= 60 ? "text-amber-600" : "text-red-600",
            )}>
              {o.improvement_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Improved</p>
          </div>
        </div>

        {/* ── Audit areas ─────────────────────────────────────────────── */}

        {intel.audit_areas.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <FileSearch className="h-3 w-3" />
              Audit Areas
            </p>
            {intel.audit_areas.slice(0, 6).map((a) => (
              <div key={a.scope} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="truncate flex-1 capitalize">{a.scope.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <Badge variant="outline" className="text-[10px] tabular-nums">{a.audit_count}</Badge>
                  <Badge className={cn("text-[10px]", RATING_COLOURS[a.avg_rating] ?? "bg-gray-100 text-gray-600")}>
                    <Star className="h-2.5 w-2.5 mr-0.5" />
                    {a.avg_rating}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Overdue actions ─────────────────────────────────────────── */}

        {intel.overdue_actions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Overdue Actions
            </p>
            {intel.overdue_actions.slice(0, 3).map((a, i) => (
              <div key={i} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-red-800 truncate flex-1">{a.action}</span>
                  <Badge className="text-[10px] bg-red-100 text-red-700 ml-1">{a.days_overdue}d</Badge>
                </div>
                <p className="text-red-700 text-[10px] mt-0.5">
                  {a.audit_title} · Owner: {a.owner}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Quality Alerts
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

        {/* ── ARIA Quality Intelligence ───────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Quality Intelligence
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
