"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EVENT INTELLIGENCE (detail page)
// Stream-native analytics: cross-domain risk radar, approval backlog, compliance
// register and theme trends — all from the canonical CornerstoneEvent stream.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Radar, Brain, Loader2, Info, ShieldCheck, AlertTriangle, TrendingUp, TrendingDown, Minus, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEventIntelligence } from "@/hooks/use-event-intelligence";
import { eventTypeLabel } from "@/lib/event-stream/event-type-meta";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};
const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};
const TREND_META: Record<string, { icon: React.ReactNode; cls: string }> = {
  escalating: { icon: <TrendingUp className="h-4 w-4" />, cls: "text-red-600" },
  improving: { icon: <TrendingDown className="h-4 w-4" />, cls: "text-green-600" },
  stable: { icon: <Minus className="h-4 w-4" />, cls: "text-gray-500" },
};
function riskTone(score: number): { bg: string; text: string; ring: string } {
  if (score >= 70) return { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-200" };
  if (score >= 45) return { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" };
  if (score >= 20) return { bg: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-200" };
  return { bg: "bg-green-100", text: "text-green-700", ring: "ring-green-200" };
}

export default function EventIntelligencePage() {
  const { data, isLoading } = useEventIntelligence();
  const intel = data?.data;

  return (
    <PageShell
      title="Event Intelligence"
      subtitle="Analytics derived from the canonical event stream — one cross-domain view of risk, approvals and compliance across every event type"
      icon={<Radar className="h-5 w-5" />}
      showQuickCreate={false}
      ariaContext={{ pageTitle: "Event Intelligence", sourceType: "general" }}
    >
      {isLoading || !intel ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      ) : (
        <div className="space-y-6">

          <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-bg)] p-4 flex gap-3">
            <Info className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">
              This reads the <strong>same canonical event stream</strong> that powers the timeline and turns it into
              analytics — so it reasons across <em>every</em> event type at once (incidents, missing, medication,
              restraint, behaviour-in-logs, maintenance, QA, Reg 44, staff absence…). It surfaces a cross-domain risk
              radar, the approval backlog and a single compliance register. <strong>Capture once, surface
              everywhere</strong> — applied to the analytics, not just the feed.
            </p>
          </div>

          {/* Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <OverviewStat label="Events (90d)" value={intel.overview.total_events} />
            <OverviewStat label="Escalating children" value={intel.overview.escalating_children} tone={intel.overview.escalating_children > 0 ? "red" : "green"} />
            <OverviewStat label="Pending approval" value={intel.overview.pending_approvals} tone={intel.overview.pending_approvals > 0 ? "amber" : "green"} />
            <OverviewStat label="Open flags" value={intel.overview.open_compliance_flags} tone={intel.overview.open_compliance_flags > 0 ? "amber" : "green"} />
            <OverviewStat label="Critical events" value={intel.overview.by_risk.critical} tone={intel.overview.by_risk.critical > 0 ? "red" : "green"} />
            <OverviewStat label="Most at risk" value={intel.overview.most_at_risk_child ?? "—"} />
          </div>

          {/* Insights */}
          {(intel.insights ?? []).length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-1.5 text-purple-700"><Brain className="h-4 w-4" /> ARIA Event Intelligence</h2>
              {(intel.insights ?? []).map((insight, i) => (
                <div key={i} className={cn("rounded-xl border p-3 text-sm leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive)}>{insight.text}</div>
              ))}
            </div>
          )}

          {/* Alerts */}
          {(intel.alerts ?? []).length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-1.5 text-[var(--cs-text-secondary)]"><AlertTriangle className="h-4 w-4" /> Alerts</h2>
              {(intel.alerts ?? []).map((a, i) => (
                <div key={i} className={cn("rounded-xl border p-3 text-sm leading-relaxed", ALERT_STYLES[a.severity] ?? ALERT_STYLES.medium)}>{a.message}</div>
              ))}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Risk radar */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Radar className="h-4 w-4 text-brand" /> Cross-domain risk radar</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(intel.child_radar ?? []).length === 0 && <p className="text-sm text-[var(--cs-text-muted)]">No child events in the last 90 days.</p>}
                {(intel.child_radar ?? []).map((c) => {
                  const tone = riskTone(c.risk_score);
                  const traj = TREND_META[c.trend] ?? TREND_META.stable;
                  return (
                    <div key={c.child_id} className={cn("rounded-lg border p-3 text-xs ring-1", tone.ring)}>
                      <div className="flex items-center justify-between gap-2">
                        <div className={cn("flex items-center gap-1.5 font-medium", traj.cls)}>{traj.icon}<span className="text-[var(--cs-text-primary)]">{c.child_name}</span></div>
                        <Badge className={cn("text-[10px]", tone.bg, tone.text)}>{c.risk_score}/100</Badge>
                      </div>
                      <p className="text-[10px] text-[var(--cs-text-muted)] mt-1">
                        {c.events_90d} events · {c.critical_events} critical · {c.pending_approvals} pending · {c.open_compliance_flags} flags
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.top_event_types.map((t, i) => (
                          <Badge key={i} className="text-[9px] bg-gray-50 text-gray-600 border">{eventTypeLabel(t.type)} {t.count}</Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="space-y-4">
              {/* Approval backlog */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> Approval backlog</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {(intel.approval_backlog ?? []).length === 0 && <p className="text-sm text-green-700">Nothing awaiting sign-off.</p>}
                  {(intel.approval_backlog ?? []).map((b, i) => (
                    <div key={i} className="rounded-lg border p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{b.approvalLevel.replace("_", " ")}</span>
                        <Badge className="text-[10px] bg-amber-100 text-amber-700">{b.count}</Badge>
                      </div>
                      {b.examples.map((ex, j) => <p key={j} className="text-[10px] text-[var(--cs-text-muted)] truncate mt-0.5">· {ex}</p>)}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Compliance register */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-brand" /> Compliance register</CardTitle></CardHeader>
                <CardContent className="space-y-1.5">
                  {(intel.compliance_register ?? []).length === 0 && <p className="text-sm text-green-700">No open compliance flags.</p>}
                  {(intel.compliance_register ?? []).map((f, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-[var(--cs-text-secondary)]">{f.flag}</span>
                      <Badge className="text-[10px] bg-amber-100 text-amber-700 shrink-0">{f.count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Theme trends */}
          {(intel.theme_trends ?? []).length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Tag className="h-4 w-4 text-brand" /> Active themes</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(intel.theme_trends ?? []).map((t, i) => (
                    <Badge key={i} className="text-[11px] bg-purple-50 text-purple-700 border-purple-200">{t.theme} ×{t.count}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PageShell>
  );
}

function OverviewStat({ label, value, tone = "neutral" }: { label: string; value: string | number; tone?: "neutral" | "red" | "amber" | "green" | "gray" }) {
  const toneCls: Record<string, string> = {
    neutral: "text-[var(--cs-navy)]", red: "text-red-600", amber: "text-amber-600", green: "text-green-600", gray: "text-gray-400",
  };
  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
      <p className={cn("text-2xl font-bold tabular-nums truncate", toneCls[tone])}>{value}</p>
      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{label}</p>
    </div>
  );
}
