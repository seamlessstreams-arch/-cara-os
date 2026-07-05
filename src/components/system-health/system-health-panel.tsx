"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Continuous Health Check Panel
//
// A deterministic integrity scan of the home's live records. The health score and
// status sit up top; issues follow, most-severe first, each with the record it
// points at and the recommended next step. Detection only — Cara surfaces what
// needs a person; it never auto-changes a safeguarding record.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Activity, ShieldCheck, AlertTriangle } from "lucide-react";
import { useSystemHealth } from "@/hooks/use-system-health";
import type { HealthSeverity, HealthCheckCategory } from "@/lib/system-health/types";

const SEV_STYLE: Record<HealthSeverity, { bg: string; fg: string; border: string; label: string }> = {
  critical: { bg: "#fdeceb", fg: "#c0392b", border: "#f0b8b2", label: "Critical" },
  high: { bg: "#fdf1e7", fg: "#c05621", border: "#f0cdb0", label: "High" },
  medium: { bg: "#fdf4e3", fg: "#b7791f", border: "#f0dcb0", label: "Medium" },
  low: { bg: "#eef4f8", fg: "#31708e", border: "#c7dbe6", label: "Low" },
};

const STATUS_STYLE: Record<string, { fg: string; label: string }> = {
  healthy: { fg: "#0d9488", label: "Healthy" },
  attention: { fg: "#b7791f", label: "Needs attention" },
  action_required: { fg: "#c0392b", label: "Action required" },
};

const CATEGORY_LABEL: Record<HealthCheckCategory, string> = {
  overdue_action: "Overdue action",
  missing_oversight: "Missing oversight",
  restraint_repair_gap: "Restraint repair gap",
  missing_return_interview: "Missing return interview",
  overdue_review: "Overdue review",
  recording_gap: "Recording gap",
  orphaned_reference: "Orphaned reference",
};

export function SystemHealthPanel() {
  const { data, isLoading, isError } = useSystemHealth();
  const r = data?.data;
  const status = r ? STATUS_STYLE[r.status] : null;

  return (
    <Card className="border-[var(--cs-border,#e2e8ec)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" style={{ color: "var(--cs-teal,#0d9488)" }} />
            Continuous Health Check
          </CardTitle>
          {r && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold tabular-nums" style={{ color: status?.fg }}>
                {r.healthScore}
              </span>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: `${status?.fg}1a`, color: status?.fg }}>
                {status?.label}
              </span>
            </div>
          )}
        </div>
        <CardDescription>
          {r
            ? `${r.summary.total === 0 ? "No" : r.summary.total} issue${r.summary.total === 1 ? "" : "s"} across ${r.checksRun.length} integrity checks of the home's records.`
            : "A deterministic scan of the home's live records for what needs attention."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-[var(--cs-text-muted,#6c7a83)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Scanning the records…
          </div>
        )}
        {isError && <p className="py-4 text-sm text-[var(--cs-text-muted,#6c7a83)]">Couldn&apos;t run the health check right now.</p>}

        {r && r.issues.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-[#b6e4d7] bg-[#e6f7f2] px-3 py-4 text-sm" style={{ color: "#0d9488" }}>
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Nothing outstanding — every integrity check passed.
          </div>
        )}

        {r &&
          r.issues.map((issue) => {
            const s = SEV_STYLE[issue.severity];
            return (
              <div key={issue.id} className="rounded-lg border px-3 py-2.5" style={{ borderColor: s.border, backgroundColor: `${s.bg}80` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: s.fg }} />
                    <span className="text-[13px] font-medium text-[var(--cs-text,#1f2a30)]">{CATEGORY_LABEL[issue.category]}</span>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ backgroundColor: s.bg, color: s.fg }}>
                    {s.label}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-[var(--cs-text,#37424a)]">{issue.message}</p>
                <p className="mt-1 text-[12px] text-[var(--cs-text-muted,#6c7a83)]">
                  <span className="font-medium">Next:</span> {issue.recommendedAction}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--cs-text-muted,#8a97a0)]">
                  <span className="rounded bg-[var(--cs-surface-subtle,#f0f4f6)] px-1.5 py-0.5">{issue.module}</span>
                  {issue.humanReviewRequired && <span className="rounded bg-[var(--cs-surface-subtle,#f0f4f6)] px-1.5 py-0.5">Human review required</span>}
                </div>
              </div>
            );
          })}

        {r && (
          <p className="pt-1 text-[11px] leading-relaxed text-[var(--cs-text-muted,#8a97a0)]">{r.disclaimer}</p>
        )}
      </CardContent>
    </Card>
  );
}
