"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION ERROR TRENDS (detail page)
// Temporal + repeat-pattern view of medication safety, with learning-loop closure.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pill, AlertTriangle, Brain, Loader2, TrendingUp, TrendingDown, Minus,
  Repeat, GraduationCap, Info, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMedicationErrorTrends } from "@/hooks/use-medication-error-trends";

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
const GAP_STYLES: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-amber-100", text: "text-amber-700" },
  medium: { bg: "bg-blue-100", text: "text-blue-700" },
};
const SEVERITY_STYLES: Record<string, { bg: string; text: string }> = {
  death: { bg: "bg-red-200", text: "text-red-900" },
  severe: { bg: "bg-red-100", text: "text-red-700" },
  moderate: { bg: "bg-amber-100", text: "text-amber-700" },
  low: { bg: "bg-blue-100", text: "text-blue-700" },
  no_harm: { bg: "bg-gray-100", text: "text-gray-600" },
};
const DIMENSION_LABEL: Record<string, string> = {
  medication: "Medication",
  child: "Child",
  error_type: "Error type",
  time_of_day: "Time of day",
};
const TREND_META: Record<string, { icon: React.ReactNode; cls: string }> = {
  rising: { icon: <TrendingUp className="h-4 w-4" />, cls: "text-red-600" },
  falling: { icon: <TrendingDown className="h-4 w-4" />, cls: "text-green-600" },
  stable: { icon: <Minus className="h-4 w-4" />, cls: "text-gray-500" },
};

export default function MedicationErrorTrendsPage() {
  const { data, isLoading } = useMedicationErrorTrends();
  const intel = data?.data;

  return (
    <PageShell
      title="Medication Error Trends"
      subtitle="Temporal and repeat-pattern early warning for medicines safety — and whether the home's learning loop is closing"
      icon={<Pill className="h-5 w-5" />}
      showQuickCreate={false}
      caraContext={{ pageTitle: "Medication Error Trends", sourceType: "general" }}
    >
      {isLoading || !intel ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── No-blame framing ─────────────────────────────────────────── */}
          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 flex gap-3">
            <Info className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
              This is a <strong>systems</strong> view, not a blame tool. Repeat patterns are grouped by medication, child,
              error type and time of day — never by who reported them. A steady flow of error and near-miss reports is a
              sign of a <em>healthy</em> safety culture. The aim is to spot where the system needs changing, and to check
              that recorded learning is actually preventing recurrence. Supports CHR 2015 Reg 23 (medicines), Reg 13
              (learning), and Reg 40 (notifications).
            </p>
          </div>

          {/* ── Overview ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <OverviewStat label="Errors (90 days)" value={intel.overview.total_errors_90d} />
            <OverviewStat
              label={`Trend (${intel.trend.recent_30d} vs ${intel.trend.prior_30d})`}
              value={intel.overview.trend_direction}
              tone={intel.overview.trend_direction === "rising" ? "red" : intel.overview.trend_direction === "falling" ? "green" : "gray"}
            />
            <OverviewStat label="Repeat Patterns" value={intel.overview.repeat_pattern_count} tone={intel.overview.repeat_pattern_count > 0 ? "amber" : "gray"} />
            <OverviewStat label="Learning Gaps" value={intel.overview.learning_gap_count} tone={intel.overview.learning_gap_count > 0 ? "red" : "green"} />
            <OverviewStat label="Harm Events" value={intel.overview.harm_events} tone={intel.overview.harm_events > 0 ? "red" : "green"} />
            <OverviewStat
              label="Rate / 100 admin"
              value={intel.overview.recent_rate_per_100_admin != null ? intel.overview.recent_rate_per_100_admin : "—"}
              tone="neutral"
            />
          </div>

          {/* ── Cara insights ────────────────────────────────────────────── */}
          {(intel.insights ?? []).length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-1.5 text-purple-700">
                <Brain className="h-4 w-4" /> Cara Medication Safety Intelligence
              </h2>
              {(intel.insights ?? []).map((insight, i) => (
                <div key={i} className={cn("rounded-xl border p-3 text-sm leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive)}>
                  {insight.text}
                </div>
              ))}
            </div>
          )}

          {/* ── Alerts ───────────────────────────────────────────────────── */}
          {(intel.alerts ?? []).length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-1.5 text-[var(--cs-text-secondary)]">
                <AlertTriangle className="h-4 w-4" /> Safety Alerts
              </h2>
              {(intel.alerts ?? []).map((alert, i) => (
                <div key={i} className={cn("rounded-xl border p-3 text-sm leading-relaxed", ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium)}>
                  {alert.message}
                </div>
              ))}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4">
            {/* ── Repeat patterns ────────────────────────────────────────── */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-brand" /> Repeat Patterns (90 days)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(intel.repeat_patterns ?? []).length === 0 && (
                  <p className="text-sm text-[var(--cs-text-muted)]">No repeat patterns — no medication, child, error type or time recurred.</p>
                )}
                {(intel.repeat_patterns ?? []).map((p, i) => {
                  const sev = SEVERITY_STYLES[p.max_severity] ?? SEVERITY_STYLES.no_harm;
                  return (
                    <div key={i} className="rounded-lg border p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase text-[var(--cs-text-muted)]">{DIMENSION_LABEL[p.dimension] ?? p.dimension}</span>
                          <p className="font-medium">{p.key}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge className={cn("text-[9px]", sev.bg, sev.text)}>{p.max_severity.replace("_", " ")}</Badge>
                          <Badge className="text-[10px] bg-amber-100 text-amber-700">×{p.count}</Badge>
                        </div>
                      </div>
                      <p className="text-[11px] text-[var(--cs-text-muted)] mt-1">{p.detail}</p>
                      {p.recurred_after_lesson && (
                        <Badge className="mt-1.5 text-[9px] bg-red-50 text-red-700 border-red-200">recurred after a lesson was recorded</Badge>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* ── Severity + learning gaps ───────────────────────────────── */}
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-brand" /> Severity (90 days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {(["no_harm", "low", "moderate", "severe", "death"] as const).map((s) => {
                      const st = SEVERITY_STYLES[s];
                      return (
                        <div key={s} className={cn("rounded-lg p-2", st.bg)}>
                          <p className={cn("text-base font-bold tabular-nums", st.text)}>{intel.severity_breakdown[s]}</p>
                          <p className="text-[9px] text-[var(--cs-text-muted)] capitalize">{s.replace("_", " ")}</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[var(--cs-text-muted)] mt-2">
                    Harm rate: <span className="font-semibold">{intel.severity_breakdown.harm_rate}%</span> of errors caused moderate-or-worse harm
                  </p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-brand" /> Learning-Loop Closure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(intel.learning_gaps ?? []).length === 0 && (
                    <p className="text-sm text-green-700">Learning loop is closing — no recurrence-after-lesson, open actions, or candour gaps.</p>
                  )}
                  {(intel.learning_gaps ?? []).map((g, i) => {
                    const s = GAP_STYLES[g.severity] ?? GAP_STYLES.medium;
                    return (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <Badge className={cn("text-[9px] shrink-0 mt-0.5", s.bg, s.text)}>{g.severity}</Badge>
                        <span className="text-[var(--cs-text-secondary)]">{g.detail}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function OverviewStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "red" | "amber" | "green" | "gray";
}) {
  const toneCls: Record<string, string> = {
    neutral: "text-[var(--cs-navy)]",
    red: "text-red-600",
    amber: "text-amber-600",
    green: "text-green-600",
    gray: "text-gray-400",
  };
  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
      <p className={cn("text-2xl font-bold tabular-nums capitalize", toneCls[tone])}>{value}</p>
      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{label}</p>
    </div>
  );
}
