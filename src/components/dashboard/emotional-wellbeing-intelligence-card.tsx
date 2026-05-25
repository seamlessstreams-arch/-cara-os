"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EMOTIONAL WELLBEING INTELLIGENCE CARD
// Dashboard widget for mood trends, SDQ scores, self-harm risk, CAMHS
// engagement, and ARIA wellbeing intelligence.
// Powered by the Health & Wellbeing Intelligence Engine — live data (Reg 23/7).
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart, AlertTriangle, Brain, Loader2, Users,
  TrendingUp, TrendingDown, Minus, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthWellbeing } from "@/hooks/use-health-wellbeing";

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

const TREND_STYLES: Record<string, { icon: React.ReactNode; text: string; label: string }> = {
  improving: {
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    text: "text-green-600",
    label: "Improving",
  },
  stable: {
    icon: <Minus className="h-3.5 w-3.5" />,
    text: "text-gray-500",
    label: "Stable",
  },
  declining: {
    icon: <TrendingDown className="h-3.5 w-3.5" />,
    text: "text-red-600",
    label: "Declining",
  },
  unknown: {
    icon: <Minus className="h-3.5 w-3.5" />,
    text: "text-gray-400",
    label: "Unknown",
  },
};

const SDQ_BAND_STYLES: Record<string, { bg: string; text: string }> = {
  normal: { bg: "bg-green-100", text: "text-green-700" },
  borderline: { bg: "bg-amber-100", text: "text-amber-700" },
  abnormal: { bg: "bg-red-100", text: "text-red-700" },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function moodLabel(score: number): string {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  if (score >= 4) return "Fair";
  if (score >= 2) return "Low";
  return "Very Low";
}

function moodColor(score: number): string {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-blue-600";
  if (score >= 4) return "text-amber-600";
  return "text-red-600";
}

// ── Component ────────────────────────────────────────────────────────────────

export function EmotionalWellbeingIntelligenceCard() {
  const { data, isLoading } = useHealthWellbeing();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-brand" />
            Emotional Wellbeing Intelligence
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

  const { wellbeing_trends, child_profiles, camhs, alerts, insights } = intel;

  // Compute aggregate mood from child profiles with wellbeing data
  const profilesWithMood = child_profiles.filter((p) => p.wellbeing_score !== null);
  const avgMood = profilesWithMood.length > 0
    ? Math.round((profilesWithMood.reduce((sum, p) => sum + (p.wellbeing_score ?? 0), 0) / profilesWithMood.length) * 10) / 10
    : 0;

  // Overall mood trend from wellbeing_trends
  const improvingCount = wellbeing_trends.filter((t) => t.trend === "improving").length;
  const decliningCount = wellbeing_trends.filter((t) => t.trend === "declining").length;
  const overallTrend: "improving" | "stable" | "declining" =
    improvingCount > decliningCount ? "improving" :
    decliningCount > improvingCount ? "declining" : "stable";
  const trendStyle = TREND_STYLES[overallTrend];

  // SDQ profiles
  const profilesWithSdq = child_profiles.filter((p) => p.sdq_band !== null);
  const abnormalSdq = profilesWithSdq.filter((p) => p.sdq_band === "abnormal").length;
  const borderlineSdq = profilesWithSdq.filter((p) => p.sdq_band === "borderline").length;

  // Self-harm risk — from alerts that mention self-harm
  const selfHarmAlerts = alerts.filter((a) =>
    a.type?.toLowerCase().includes("self_harm") || a.message?.toLowerCase().includes("self-harm") || a.message?.toLowerCase().includes("self harm")
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Heart className="h-4 w-4 text-brand" />
          Emotional Wellbeing Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          {/* Avg Mood */}
          <div className={cn("text-center rounded-lg p-2.5", avgMood >= 6 ? "bg-green-50" : avgMood >= 4 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", moodColor(avgMood))}>
              {avgMood > 0 ? avgMood.toFixed(1) : "N/A"}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Mood</p>
          </div>

          {/* Mood Trend */}
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <div className={cn("flex items-center justify-center gap-1", trendStyle.text)}>
              {trendStyle.icon}
              <p className="text-xs font-bold">{trendStyle.label}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">Mood Trend</p>
          </div>

          {/* SDQ */}
          <div className={cn("text-center rounded-lg p-2.5", abnormalSdq > 0 ? "bg-red-50" : borderlineSdq > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", abnormalSdq > 0 ? "text-red-600" : borderlineSdq > 0 ? "text-amber-600" : "text-green-600")}>
              {profilesWithSdq.length > 0 ? profilesWithSdq.length : "N/A"}
            </p>
            <p className="text-[10px] text-muted-foreground">SDQ Scored</p>
          </div>

          {/* CAMHS Engaged */}
          <div className="text-center rounded-lg bg-purple-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-purple-600">
              {camhs.active_referrals}
            </p>
            <p className="text-[10px] text-muted-foreground">CAMHS Active</p>
          </div>
        </div>

        {/* ── Wellbeing trends by child ────────────────────────────────── */}

        {wellbeing_trends.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Wellbeing Trends (7-day)
            </p>
            {wellbeing_trends.slice(0, 4).map((trend) => {
              const ts = TREND_STYLES[trend.trend] ?? TREND_STYLES.stable;
              return (
                <div key={trend.child_id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{trend.child_name}</span>
                    <div className={cn("flex items-center gap-1", ts.text)}>
                      {ts.icon}
                      <span className="text-[10px] font-medium">{ts.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                    <span className="text-[10px]">
                      Current avg: <span className={cn("font-medium", moodColor(trend.current_avg))}>{trend.current_avg.toFixed(1)}</span>
                    </span>
                    <span className="text-[10px]">
                      Previous: {trend.previous_avg.toFixed(1)}
                    </span>
                    <span className="text-[10px]">
                      Latest: {trend.latest_score}/10
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SDQ overview ─────────────────────────────────────────────── */}

        {profilesWithSdq.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">SDQ Bands</p>
            <div className="flex items-center gap-2 flex-wrap">
              {profilesWithSdq.map((profile) => {
                const bandStyle = SDQ_BAND_STYLES[profile.sdq_band ?? "normal"] ?? SDQ_BAND_STYLES.normal;
                return (
                  <Badge
                    key={profile.child_id}
                    className={cn("text-[10px]", bandStyle.bg, bandStyle.text)}
                  >
                    {profile.child_name}: {profile.sdq_band} ({profile.sdq_total})
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Self-harm risk section ──────────────────────────────────── */}

        {selfHarmAlerts.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs space-y-1">
            <p className="font-semibold text-red-800 flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              Self-Harm Risk
            </p>
            {selfHarmAlerts.slice(0, 2).map((alert, i) => (
              <p key={i} className="text-red-700 leading-relaxed">
                <span className="font-medium">{alert.child_name}:</span> {alert.message}
              </p>
            ))}
          </div>
        )}

        {/* ── CAMHS engagement ────────────────────────────────────────── */}

        {camhs.active_referrals > 0 && (
          <div className="rounded-lg border p-3 text-xs space-y-1">
            <p className="font-semibold text-muted-foreground">CAMHS Engagement</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span>{camhs.active_referrals} active referral{camhs.active_referrals > 1 ? "s" : ""}</span>
              {camhs.waiting_list > 0 && (
                <Badge className="text-[9px] bg-amber-100 text-amber-700">
                  {camhs.waiting_list} waiting (avg {camhs.avg_waiting_weeks}wk)
                </Badge>
              )}
              {camhs.disengaged_count > 0 && (
                <Badge className="text-[9px] bg-red-100 text-red-700">
                  {camhs.disengaged_count} disengaged
                </Badge>
              )}
              <span className="text-muted-foreground">{camhs.total_sessions_held} sessions held</span>
            </div>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Wellbeing Alerts
            </p>
            {alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium,
                )}
              >
                <span className="font-medium">{alert.child_name}:</span> {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA Wellbeing Intelligence ──────────────────────────────── */}

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Wellbeing Intelligence
            </p>
            {insights.slice(0, 3).map((insight, i) => (
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
