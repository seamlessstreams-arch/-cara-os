"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD PRIORITY (UNIFIED RISK) detail page
// One ranked, joined-up view of which children need attention most — and why.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ListOrdered, Brain, Loader2, Info, Layers, ShieldAlert, ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildPriority } from "@/hooks/use-child-priority";

const BAND_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-200" },
  high: { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" },
  medium: { bg: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-200" },
  low: { bg: "bg-green-100", text: "text-green-700", ring: "ring-green-200" },
};
const DOMAIN_STYLES: Record<string, { bar: string; label: string }> = {
  placement: { bar: "bg-amber-400", label: "Placement breakdown risk" },
  complaints: { bar: "bg-indigo-400", label: "Complaints ↔ incident signal" },
  medication: { bar: "bg-rose-400", label: "Medication-error involvement" },
  continuity: { bar: "bg-teal-400", label: "Relationship continuity gap" },
};
const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-amber-100", text: "text-amber-700" },
  routine: { bg: "bg-gray-100", text: "text-gray-600" },
};
const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

export default function ChildPriorityPage() {
  const { data, isLoading } = useChildPriority();
  const intel = data?.data;

  return (
    <PageShell
      title="Child Priority — Unified Risk"
      subtitle="Every intelligence stream, fused into one ranked list — who needs attention most today, and why"
      icon={<ListOrdered className="h-5 w-5" />}
      showQuickCreate={false}
      ariaContext={{ pageTitle: "Child Priority — Unified Risk", sourceType: "general" }}
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
              This fuses three intelligence streams — <strong>placement-breakdown risk</strong>,
              <strong> complaints↔incident correlation</strong>, and <strong>medication-error involvement</strong> —
              into one priority score per child. The principle: a child flagged across <em>more than one</em> stream
              (<Layers className="inline h-3 w-3" />) is the clearest signal of who needs attention first, because
              convergent risk is what gets missed when each system is reviewed alone. Supports CHR 2015 Reg 12 / 13
              (protection and leadership oversight).
            </p>
          </div>

          {/* ── Overview ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <OverviewStat label="Children" value={intel.overview.children_analysed} />
            <OverviewStat label="Critical" value={intel.overview.critical_count} tone={intel.overview.critical_count > 0 ? "red" : "green"} />
            <OverviewStat label="High" value={intel.overview.high_count} tone={intel.overview.high_count > 0 ? "amber" : "gray"} />
            <OverviewStat label="Multi-stream" value={intel.overview.multi_domain_count} tone={intel.overview.multi_domain_count > 0 ? "red" : "gray"} />
            <OverviewStat label="Top priority" value={intel.overview.top_priority_child ?? "—"} hint={intel.overview.top_priority_child ? `score ${intel.overview.top_priority_score}` : undefined} />
          </div>

          {/* ── ARIA insights ────────────────────────────────────────────── */}
          {(intel.insights ?? []).length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-1.5 text-purple-700">
                <Brain className="h-4 w-4" /> ARIA Unified Risk Intelligence
              </h2>
              {(intel.insights ?? []).map((insight, i) => (
                <div key={i} className={cn("rounded-xl border p-3 text-sm leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive)}>
                  {insight.text}
                </div>
              ))}
            </div>
          )}

          {/* ── Ranked children ──────────────────────────────────────────── */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--cs-text-secondary)]">Priority ranking</h2>
            {(intel.children ?? []).length === 0 && (
              <p className="text-sm text-[var(--cs-text-muted)]">No children currently show a meaningful cross-domain signal.</p>
            )}
            {(intel.children ?? []).map((c) => {
              const band = BAND_STYLES[c.priority_band] ?? BAND_STYLES.low;
              return (
                <Card key={c.child_id} className={cn("overflow-hidden ring-1", band.ring)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--cs-navy)] text-white text-xs font-bold">{c.rank}</span>
                        {c.child_name}
                        {c.multi_domain && (
                          <Badge className="text-[10px] bg-red-50 text-red-700 border-red-200 flex items-center gap-0.5">
                            <Layers className="h-3 w-3" /> multi-stream
                          </Badge>
                        )}
                        {c.safeguarding && (
                          <Badge className="text-[10px] bg-red-50 text-red-700 border-red-200 flex items-center gap-0.5">
                            <ShieldAlert className="h-3 w-3" /> safeguarding
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="text-right shrink-0">
                        <div className={cn("inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-lg font-bold tabular-nums", band.bg, band.text)}>
                          {c.priority_score}
                        </div>
                        <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5 capitalize">{c.priority_band} priority</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Domain breakdown */}
                    <div className="space-y-2">
                      {(c.domains ?? []).map((dm, i) => {
                        const ds = DOMAIN_STYLES[dm.domain] ?? { bar: "bg-gray-400", label: dm.domain };
                        return (
                          <div key={i} className="text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{ds.label}</span>
                              <span className="tabular-nums text-[var(--cs-text-muted)]">{dm.score}/100{dm.active ? " · elevated" : ""}</span>
                            </div>
                            <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", ds.bar)} style={{ width: `${dm.score}%` }} />
                            </div>
                            <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{dm.detail}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Top action */}
                    {c.top_action && (
                      <div className="rounded-lg border p-2.5 text-xs">
                        <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] flex items-center gap-1 mb-1">
                          <ListChecks className="h-3.5 w-3.5" /> Most important next step
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-[9px] uppercase", (PRIORITY_STYLES[c.top_action.priority] ?? PRIORITY_STYLES.routine).bg, (PRIORITY_STYLES[c.top_action.priority] ?? PRIORITY_STYLES.routine).text)}>
                            {c.top_action.priority}
                          </Badge>
                          <span className="font-medium">{c.top_action.action}</span>
                        </div>
                        <p className="text-[10px] text-[var(--cs-text-muted)] mt-1">{c.top_action.regulatory_link}</p>
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
  label, value, tone = "neutral", hint,
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "red" | "amber" | "green" | "gray";
  hint?: string;
}) {
  const toneCls: Record<string, string> = {
    neutral: "text-[var(--cs-navy)]", red: "text-red-600", amber: "text-amber-600", green: "text-green-600", gray: "text-gray-400",
  };
  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
      <p className={cn("text-2xl font-bold tabular-nums truncate", toneCls[tone])}>{value}</p>
      <p className="text-[11px] text-[var(--cs-text-muted)] mt-0.5">{label}</p>
      {hint && <p className="text-[10px] text-[var(--cs-text-gentle)] mt-0.5">{hint}</p>}
    </div>
  );
}
