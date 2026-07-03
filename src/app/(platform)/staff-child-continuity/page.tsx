"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF–CHILD CONTINUITY OF CARE (detail page)
// Relational continuity per child — consistent, trusted adults.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HeartHandshake, AlertTriangle, Brain, Loader2, Info, UserX, ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStaffChildContinuity } from "@/hooks/use-staff-child-continuity";

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
const BAND_STYLES: Record<string, { bg: string; text: string; ring: string; bar: string }> = {
  strong: { bg: "bg-green-100", text: "text-green-700", ring: "ring-green-200", bar: "bg-green-400" },
  adequate: { bg: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-200", bar: "bg-blue-400" },
  fragmented: { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-[var(--cs-warning-soft)]", bar: "bg-amber-400" },
  critical: { bg: "bg-red-100", text: "text-red-700", ring: "ring-[var(--cs-risk-soft)]", bar: "bg-red-400" },
};
const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-amber-100", text: "text-amber-700" },
  routine: { bg: "bg-gray-100", text: "text-gray-600" },
};

export default function StaffChildContinuityPage() {
  const { data, isLoading } = useStaffChildContinuity();
  const intel = data?.data;

  return (
    <PageShell
      title="Staff–Child Continuity of Care"
      subtitle="Does every child have a consistent, trusted adult — and is their key worker actually the one building the relationship?"
      icon={<HeartHandshake className="h-5 w-5" />}
      showQuickCreate={false}
      caraContext={{ pageTitle: "Staff–Child Continuity of Care", sourceType: "general" }}
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
              Children in care do best with consistent, trusted adults who know them well. This measures the
              <strong> relational</strong> continuity of each child's care (distinct from routine or handover
              continuity): is an <em>active</em> key worker assigned, are they <em>actually delivering</em> the
              key-working sessions, and is the relationship concentrated and recent — or spread thinly across many
              staff? Supports CHR 2015 Reg 11 (positive relationships), Reg 6 and Reg 12.
            </p>
          </div>

          {/* ── Overview ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <OverviewStat label="Children" value={intel.overview.children_analysed} />
            <OverviewStat label="Avg continuity" value={`${intel.overview.avg_continuity_index}/100`} tone={intel.overview.avg_continuity_index >= 75 ? "green" : intel.overview.avg_continuity_index >= 55 ? "neutral" : "amber"} />
            <OverviewStat label="Strong" value={intel.overview.strong_count} tone={intel.overview.strong_count > 0 ? "green" : "gray"} />
            <OverviewStat label="Fragmented" value={intel.overview.fragmented_count} tone={intel.overview.fragmented_count > 0 ? "amber" : "green"} />
            <OverviewStat label="No key worker" value={intel.overview.no_key_worker_count} tone={intel.overview.no_key_worker_count > 0 ? "red" : "green"} />
            <OverviewStat label="Key worker left" value={intel.overview.inactive_key_worker_count} tone={intel.overview.inactive_key_worker_count > 0 ? "red" : "green"} />
          </div>

          {/* ── Cara insights ────────────────────────────────────────────── */}
          {(intel.insights ?? []).length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold flex items-center gap-1.5 text-purple-700">
                <Brain className="h-4 w-4" /> Cara Relationship Continuity Intelligence
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
                <AlertTriangle className="h-4 w-4" /> Continuity Alerts
              </h2>
              {(intel.alerts ?? []).map((alert, i) => (
                <div key={i} className={cn("rounded-xl border p-3 text-sm leading-relaxed", ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium)}>
                  {alert.message}
                </div>
              ))}
            </div>
          )}

          {/* ── Per-child continuity (weakest first) ─────────────────────── */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--cs-text-secondary)]">Children — weakest continuity first</h2>
            {(intel.children ?? []).map((c) => {
              const band = BAND_STYLES[c.band] ?? BAND_STYLES.adequate;
              return (
                <Card key={c.child_id} className={cn("overflow-hidden ring-1", band.ring)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {c.child_name}
                          {(!c.key_worker_id || !c.key_worker_active) && (
                            <Badge className="text-[10px] bg-red-50 text-red-700 border-red-200 flex items-center gap-0.5">
                              <UserX className="h-3 w-3" /> {c.key_worker_id ? "key worker inactive" : "no key worker"}
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">
                          Key worker: <span className="font-medium">{c.key_worker_name ?? "—"}</span> · delivers {c.key_worker_share}% of sessions · {c.sessions_90d} session{c.sessions_90d === 1 ? "" : "s"} / 90d · {c.distinct_staff} different staff
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={cn("inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-lg font-bold tabular-nums", band.bg, band.text)}>
                          {c.continuity_index}
                        </div>
                        <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5 capitalize">{c.band}</p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", band.bar)} style={{ width: `${c.continuity_index}%` }} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(c.flags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(c.flags ?? []).map((f, i) => (
                          <Badge key={i} className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">{f}</Badge>
                        ))}
                      </div>
                    )}
                    {(c.recommended_actions ?? []).length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-[var(--cs-text-secondary)] flex items-center gap-1">
                          <ListChecks className="h-3.5 w-3.5" /> Recommended actions
                        </p>
                        {(c.recommended_actions ?? []).map((a, i) => {
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
