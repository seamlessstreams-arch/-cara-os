"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — BEHAVIOUR TRIGGER & ESCALATION PATTERNS (detail page)
// Per-child triggers, intensity trajectory, de-escalation coverage, balance.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, AlertTriangle, Brain, Loader2, Info, Zap, TrendingUp, TrendingDown, Minus, ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBehaviourTriggerPatterns } from "@/hooks/use-behaviour-trigger-patterns";

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
const LEVEL_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-200" },
  high: { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" },
  moderate: { bg: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-200" },
  low: { bg: "bg-green-100", text: "text-green-700", ring: "ring-green-200" },
};
const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-amber-100", text: "text-amber-700" },
  routine: { bg: "bg-gray-100", text: "text-gray-600" },
};
const TRAJECTORY_META: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
  escalating: { icon: <TrendingUp className="h-4 w-4" />, label: "Escalating", cls: "text-red-600" },
  improving: { icon: <TrendingDown className="h-4 w-4" />, label: "Improving", cls: "text-green-600" },
  stable: { icon: <Minus className="h-4 w-4" />, label: "Stable", cls: "text-gray-500" },
  insufficient_data: { icon: <Minus className="h-4 w-4" />, label: "Insufficient data", cls: "text-gray-400" },
};

export default function BehaviourTriggerPatternsPage() {
  const { data, isLoading } = useBehaviourTriggerPatterns();
  const intel = data?.data;

  return (
    <PageShell
      title="Behaviour Triggers & Escalation"
      subtitle="What sets each child off, whether behaviour is escalating, and whether de-escalation is recorded — the foundation of a good behaviour support plan"
      icon={<Activity className="h-5 w-5" />}
      showQuickCreate={false}
      caraContext={{ pageTitle: "Behaviour Triggers & Escalation", sourceType: "general" }}
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
              This analyses the <em>patterns</em> in each child's behaviour log (distinct from whether records are
              complete): recurring <strong>triggers</strong>, whether concerning behaviour is <strong>escalating</strong>
              in intensity, whether a <strong>de-escalation strategy</strong> is recorded (especially for high-intensity
              incidents), and the balance of positive to concerning entries. Understanding behaviour is how restraint is
              reduced. Supports CHR 2015 Reg 11 (behaviour management), Reg 6 and Reg 12.
            </p>
          </div>

          {/* ── Overview ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <OverviewStat label="Children" value={intel.overview.children_analysed} />
            <OverviewStat label="Concerns (90d)" value={intel.overview.total_concerning_90d} />
            <OverviewStat label="Escalating" value={intel.overview.escalating_count} tone={intel.overview.escalating_count > 0 ? "red" : "green"} />
            <OverviewStat label="High concern" value={intel.overview.high_concern_count} tone={intel.overview.high_concern_count > 0 ? "amber" : "green"} />
            <OverviewStat label="Avg +:concern" value={intel.overview.avg_reinforcement_ratio} tone="green" />
          </div>

          {/* ── Home-wide triggers ───────────────────────────────────────── */}
          {(intel.overview.top_home_triggers ?? []).length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Most common triggers across the home</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(intel.overview.top_home_triggers ?? []).map((t, i) => (
                    <Badge key={i} className="text-[11px] bg-amber-50 text-amber-700 border-amber-200">{t.trigger} ×{t.count}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Cara insights ────────────────────────────────────────────── */}
          {(intel.insights ?? []).length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-1.5 text-purple-700">
                <Brain className="h-4 w-4" /> Cara Behaviour Pattern Intelligence
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
                <AlertTriangle className="h-4 w-4" /> Behaviour Alerts
              </h2>
              {(intel.alerts ?? []).map((alert, i) => (
                <div key={i} className={cn("rounded-xl border p-3 text-sm leading-relaxed", ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium)}>
                  {alert.message}
                </div>
              ))}
            </div>
          )}

          {/* ── Per-child patterns ───────────────────────────────────────── */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--cs-text-secondary)]">Children — highest concern first</h2>
            {(intel.children ?? []).map((c) => {
              const lvl = LEVEL_STYLES[c.concern_level] ?? LEVEL_STYLES.low;
              const traj = TRAJECTORY_META[c.intensity_trajectory] ?? TRAJECTORY_META.insufficient_data;
              return (
                <Card key={c.child_id} className={cn("overflow-hidden ring-1", lvl.ring)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">{c.child_name}</CardTitle>
                        <div className={cn("mt-1 flex items-center gap-1.5 text-xs font-medium", traj.cls)}>
                          {traj.icon} {traj.label}
                          <span className="text-[var(--cs-text-muted)] font-normal">· {c.concerning_90d} concern{c.concerning_90d === 1 ? "" : "s"} / 90d · avg intensity {c.avg_intensity} · {c.positive_90d} positive ({c.reinforcement_ratio}:1)</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge className={cn("text-[11px] capitalize", lvl.bg, lvl.text)}>{c.concern_level} concern</Badge>
                        <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">score {c.concern_score}/100</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {c.top_triggers.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase text-[var(--cs-text-muted)] mb-1 flex items-center gap-1"><Zap className="h-3 w-3" /> Triggers</p>
                        <div className="flex flex-wrap gap-1.5">
                          {c.top_triggers.map((t, i) => (
                            <Badge key={i} className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">{t.trigger} ×{t.count}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--cs-text-muted)]">
                      <span>De-escalation strategy recorded: <span className={cn("font-semibold", c.strategy_coverage_pct < 50 ? "text-amber-700" : "text-green-700")}>{c.strategy_coverage_pct}%</span></span>
                      {c.high_intensity_unsupported > 0 && (
                        <span className="text-red-700 font-medium">{c.high_intensity_unsupported} high-intensity without strategy</span>
                      )}
                    </div>
                    {c.flags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {c.flags.map((f, i) => (
                          <Badge key={i} className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">{f}</Badge>
                        ))}
                      </div>
                    )}
                    {c.recommended_actions.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-[var(--cs-text-secondary)] flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" /> Recommended actions</p>
                        {c.recommended_actions.map((a, i) => {
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

function OverviewStat({
  label, value, tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "red" | "amber" | "green" | "gray";
}) {
  const toneCls: Record<string, string> = {
    neutral: "text-[var(--cs-navy)]", red: "text-red-600", amber: "text-amber-600", green: "text-green-600", gray: "text-gray-400",
  };
  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
      <p className={cn("text-2xl font-bold tabular-nums", toneCls[tone])}>{value}</p>
      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{label}</p>
    </div>
  );
}
