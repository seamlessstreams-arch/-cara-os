"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — PLACEMENT BREAKDOWN FORECAST (detail page)
// Forward-looking early-warning view of placement stability across the home.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert, AlertTriangle, Brain, Loader2, TrendingUp, TrendingDown,
  Minus, CalendarClock, ShieldCheck, ListChecks, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlacementBreakdownForecast } from "@/hooks/use-placement-breakdown-forecast";

const BAND_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  critical: { bg: "bg-[--cs-risk-bg]", text: "text-[--cs-risk]", ring: "ring-[--cs-risk-soft]" },
  elevated: { bg: "bg-[--cs-warning-bg]", text: "text-[--cs-warning]", ring: "ring-[--cs-warning-soft]" },
  watch: { bg: "bg-[--cs-info-bg]", text: "text-[--cs-info]", ring: "ring-[--cs-info-soft]" },
  stable: { bg: "bg-[--cs-success-bg]", text: "text-[--cs-success]", ring: "ring-[--cs-success-soft]" },
};

const TREND_META: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
  escalating: { icon: <TrendingUp className="h-4 w-4" />, label: "Escalating", cls: "text-[--cs-risk]" },
  improving: { icon: <TrendingDown className="h-4 w-4" />, label: "Improving", cls: "text-[--cs-success]" },
  stable: { icon: <Minus className="h-4 w-4" />, label: "Stable", cls: "text-gray-500" },
};

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

const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "bg-[--cs-risk-bg]", text: "text-[--cs-risk]" },
  high: { bg: "bg-[--cs-warning-bg]", text: "text-[--cs-warning]" },
  routine: { bg: "bg-gray-100", text: "text-gray-600" },
};

export default function PlacementBreakdownForecastPage() {
  const { data, isLoading } = usePlacementBreakdownForecast();
  const intel = data?.data;

  return (
    <PageShell
      title="Placement Breakdown Forecast"
      subtitle="Forward-looking early warning for placement stability — projecting which children are most at risk, and how soon"
      icon={<ShieldAlert className="h-5 w-5" />}
      showQuickCreate={false}
      caraContext={{ pageTitle: "Placement Breakdown Forecast", sourceType: "general" }}
    >
      {isLoading || !intel ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── What this is ─────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 flex gap-3">
            <Info className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
              This is an <strong>early-warning indicator</strong>, not a prediction of certainty. Each child's risk is
              scored over the last 14 days and compared with the preceding 14 days to detect a <em>trajectory</em>;
              an accelerating trajectory projects an indicative time to a critical risk threshold. Every score is
              fully explained below so you can act on the evidence, not a black box. Supports CHR 2015 Reg 11
              (placement stability), Reg 12, and Reg 8.
            </p>
          </div>

          {/* ── Overview ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <OverviewStat label="Current Placements" value={intel.overview.total_children} />
            <OverviewStat label="Critical" value={intel.overview.critical_count} tone={intel.overview.critical_count > 0 ? "red" : "green"} />
            <OverviewStat label="Elevated" value={intel.overview.elevated_count} tone={intel.overview.elevated_count > 0 ? "amber" : "gray"} />
            <OverviewStat label="Escalating" value={intel.overview.escalating_count} tone={intel.overview.escalating_count > 0 ? "amber" : "gray"} />
            <OverviewStat label="Avg Risk" value={`${intel.overview.avg_risk_score}/100`} />
            <OverviewStat
              label="Soonest to Critical"
              value={intel.overview.earliest_projected_days != null ? `${intel.overview.earliest_projected_days}d` : "—"}
              tone={intel.overview.earliest_projected_days != null ? "red" : "gray"}
              hint={intel.overview.earliest_projected_child ?? undefined}
            />
          </div>

          {/* ── Cara insights ────────────────────────────────────────────── */}
          {(intel.insights ?? []).length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-1.5 text-purple-700">
                <Brain className="h-4 w-4" /> Cara Placement Stability Intelligence
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
                <AlertTriangle className="h-4 w-4" /> Early-Warning Alerts
              </h2>
              {(intel.alerts ?? []).map((alert, i) => (
                <div key={i} className={cn("rounded-xl border p-3 text-sm leading-relaxed", ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium)}>
                  {alert.message}
                </div>
              ))}
            </div>
          )}

          {/* ── Per-child forecasts ──────────────────────────────────────── */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--cs-text-secondary)]">Children — ordered by urgency</h2>
            {(intel.child_forecasts ?? []).length === 0 && (
              <p className="text-sm text-[var(--cs-text-muted)]">No current placements to forecast.</p>
            )}
            {(intel.child_forecasts ?? []).map((f) => {
              const band = BAND_STYLES[f.risk_band] ?? BAND_STYLES.stable;
              const trend = TREND_META[f.trend] ?? TREND_META.stable;
              return (
                <Card key={f.child_id} className={cn("overflow-hidden ring-1", band.ring)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {f.child_name}
                          <span className="text-xs font-normal text-[var(--cs-text-muted)]">
                            Age {f.age} · {f.placement_type.replace(/_/g, " ")} · {f.days_in_placement}d in placement
                          </span>
                        </CardTitle>
                        <div className={cn("mt-1 flex items-center gap-1.5 text-xs font-medium", trend.cls)}>
                          {trend.icon}
                          {trend.label}
                          {f.trend === "escalating" && <span>· +{f.velocity_per_week}/week</span>}
                          {f.trend === "improving" && <span>· {f.velocity_per_week}/week</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={cn("inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-lg font-bold tabular-nums", band.bg, band.text)}>
                          {f.risk_score}
                        </div>
                        <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5 capitalize">{f.risk_band} risk</p>
                      </div>
                    </div>
                    {f.projected_days_to_critical != null && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-[--cs-risk-bg] border border-[--cs-risk-soft] px-3 py-1.5 text-xs text-[--cs-risk]">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {f.projected_days_to_critical === 0
                          ? "At or above the critical threshold now"
                          : `Projected to reach critical risk in ~${f.projected_days_to_critical} days${f.projected_date ? ` (by ${f.projected_date})` : ""}`}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">

                    {/* Contributing factors */}
                    {(f.contributing_factors ?? []).length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-[var(--cs-text-muted)]">Contributing factors</p>
                        {(f.contributing_factors ?? []).map((cf, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-xs">
                            <div className="min-w-0">
                              <span className="font-medium">{cf.factor}</span>
                              {cf.rising && (
                                <Badge className="ml-1.5 text-[9px] bg-[--cs-risk-bg] text-[--cs-risk] border-[--cs-risk-soft]">rising</Badge>
                              )}
                              <p className="text-[11px] text-[var(--cs-text-muted)] truncate">{cf.detail}</p>
                            </div>
                            <span className="shrink-0 tabular-nums font-semibold text-[var(--cs-text-secondary)]">+{cf.points}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Protective factors */}
                    {(f.protective_factors ?? []).length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-[--cs-success] flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" /> Protective factors
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(f.protective_factors ?? []).map((p, i) => (
                            <Badge key={i} className="text-[10px] bg-[--cs-success-bg] text-[--cs-success] border-[--cs-success-soft]">{p}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended actions */}
                    {(f.recommended_actions ?? []).length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-[var(--cs-text-secondary)] flex items-center gap-1">
                          <ListChecks className="h-3.5 w-3.5" /> Recommended actions
                        </p>
                        {(f.recommended_actions ?? []).map((a, i) => {
                          const pr = PRIORITY_STYLES[a.priority] ?? PRIORITY_STYLES.routine;
                          return (
                            <div key={i} className="rounded-lg border p-2.5 text-xs">
                              <div className="flex items-center gap-2">
                                <Badge className={cn("text-[9px] uppercase", pr.bg, pr.text)}>{a.priority}</Badge>
                                <span className="font-medium">{a.action}</span>
                              </div>
                              <p className="text-[10px] text-[var(--cs-text-muted)] mt-1">{a.regulatory_link}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
}

// ── Small overview stat tile ────────────────────────────────────────────────

function OverviewStat({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "red" | "amber" | "green" | "gray";
  hint?: string;
}) {
  const toneCls: Record<string, string> = {
    neutral: "text-[var(--cs-navy)]",
    red: "text-[--cs-risk]",
    amber: "text-[--cs-warning]",
    green: "text-[--cs-success]",
    gray: "text-gray-400",
  };
  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
      <p className={cn("text-2xl font-bold tabular-nums", toneCls[tone])}>{value}</p>
      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{label}</p>
      {hint && <p className="text-[10px] text-[var(--cs-text-gentle)] mt-0.5 truncate">{hint}</p>}
    </div>
  );
}
