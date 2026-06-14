"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPLAINTS ↔ INCIDENT CORRELATION (detail page)
// Cross-dataset early-warning view linking children's complaints to incidents.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Link2, AlertTriangle, Brain, Loader2, Info, MessageSquareWarning,
  ListChecks, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useComplaintsIncidentCorrelation } from "@/hooks/use-complaints-incident-correlation";

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
const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-amber-100", text: "text-amber-700" },
  routine: { bg: "bg-gray-100", text: "text-gray-600" },
};
const TYPE_META: Record<string, { label: string; bg: string; text: string; ring: string }> = {
  leading_indicator: { label: "Leading indicator", bg: "bg-red-100", text: "text-red-700", ring: "ring-red-200" },
  convergent: { label: "Convergent", bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" },
  emerging_watch: { label: "Emerging watch", bg: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-200" },
  incidents_only: { label: "Voice gap", bg: "bg-indigo-100", text: "text-indigo-700", ring: "ring-indigo-200" },
  complaints_only: { label: "Handled", bg: "bg-green-100", text: "text-green-700", ring: "ring-green-200" },
  none: { label: "—", bg: "bg-gray-100", text: "text-gray-600", ring: "ring-gray-200" },
};

export default function ComplaintsIncidentCorrelationPage() {
  const { data, isLoading } = useComplaintsIncidentCorrelation();
  const intel = data?.data;

  return (
    <PageShell
      title="Complaints ↔ Incident Correlation"
      subtitle="A cross-dataset early-warning lens — were a child's complaints a signal we should have acted on before things escalated?"
      icon={<Link2 className="h-5 w-5" />}
      showQuickCreate={false}
      caraContext={{ pageTitle: "Complaints ↔ Incident Correlation", sourceType: "general" }}
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
              This links two datasets that are usually reviewed separately — <strong>complaints</strong> and
              <strong> incidents</strong> — for each child. It looks for cases where complaints came first and incidents
              followed (a <em>leading indicator</em>), where both rise together, and where incidents occur with
              <em> no</em> complaint logged (a possible <em>voice gap</em>). The aim is simple: listen to children
              earlier. Supports CHR 2015 Reg 22 (complaints), Reg 12 (protection) and Reg 7 (wishes &amp; feelings).
            </p>
          </div>

          {/* ── Overview ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <OverviewStat label="Children Analysed" value={intel.overview.children_analysed} />
            <OverviewStat label="Leading Indicators" value={intel.overview.leading_indicator_count} tone={intel.overview.leading_indicator_count > 0 ? "red" : "green"} />
            <OverviewStat label="Convergent" value={intel.overview.convergent_count} tone={intel.overview.convergent_count > 0 ? "amber" : "gray"} />
            <OverviewStat label="Emerging Watch" value={intel.overview.emerging_watch_count} tone={intel.overview.emerging_watch_count > 0 ? "amber" : "gray"} />
            <OverviewStat label="Voice Gaps" value={intel.overview.incidents_only_count} tone={intel.overview.incidents_only_count > 0 ? "red" : "green"} />
            <OverviewStat label="Complaints / Incidents (90d)" value={`${intel.overview.total_complaints_90}/${intel.overview.total_incidents_90}`} />
          </div>

          {/* ── Cara insights ────────────────────────────────────────────── */}
          {(intel.insights ?? []).length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-1.5 text-purple-700">
                <Brain className="h-4 w-4" /> Cara Voice &amp; Protection Intelligence
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

          {/* ── Per-child correlations ───────────────────────────────────── */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--cs-text-secondary)]">Children — ordered by signal strength</h2>
            {(intel.child_correlations ?? []).length === 0 && (
              <p className="text-sm text-[var(--cs-text-muted)]">No complaints or incidents to correlate in the last 90 days.</p>
            )}
            {(intel.child_correlations ?? []).map((r) => {
              const meta = TYPE_META[r.correlation_type] ?? TYPE_META.none;
              return (
                <Card key={r.child_id} className={cn("overflow-hidden ring-1", meta.ring)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {r.child_name}
                        {r.safeguarding_overlap && (
                          <Badge className="text-[10px] bg-red-50 text-red-700 border-red-200 flex items-center gap-0.5">
                            <ShieldAlert className="h-3 w-3" /> safeguarding overlap
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="text-right shrink-0">
                        <Badge className={cn("text-[11px]", meta.bg, meta.text)}>{meta.label}</Badge>
                        <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">score {r.correlation_score}/100</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Counts */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border p-2.5">
                        <p className="text-[10px] uppercase text-[var(--cs-text-muted)] flex items-center gap-1"><MessageSquareWarning className="h-3 w-3" /> Complaints</p>
                        <p className="tabular-nums mt-0.5">{r.complaints_recent} recent · {r.complaints_prior} prior · {r.complaints_90} in 90d</p>
                      </div>
                      <div className="rounded-lg border p-2.5">
                        <p className="text-[10px] uppercase text-[var(--cs-text-muted)] flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Incidents</p>
                        <p className="tabular-nums mt-0.5">{r.incidents_recent} recent · {r.incidents_prior} prior · {r.incidents_90} in 90d</p>
                      </div>
                    </div>

                    {/* Signals */}
                    {(r.signals ?? []).length > 0 && (
                      <div className="space-y-1">
                        {(r.signals ?? []).map((s, i) => (
                          <p key={i} className="text-xs text-[var(--cs-text-secondary)] flex gap-1.5">
                            <span className="text-[var(--cs-text-muted)]">•</span>{s}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Recommended actions */}
                    {(r.recommended_actions ?? []).length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-[var(--cs-text-secondary)] flex items-center gap-1">
                          <ListChecks className="h-3.5 w-3.5" /> Recommended actions
                        </p>
                        {(r.recommended_actions ?? []).map((a, i) => {
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
      <p className={cn("text-2xl font-bold tabular-nums", toneCls[tone])}>{value}</p>
      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{label}</p>
    </div>
  );
}
