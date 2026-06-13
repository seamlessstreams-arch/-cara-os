"use client";

// CARA — Sickness & Absence patterns: occupational-health intelligence across the team.

import React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { PrintButton } from "@/components/common/print-button";
import { useWorkforceAbsence } from "@/hooks/use-workforce-absence";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { AbsenceLevel, AbsenceStaffRow } from "@/lib/engines/workforce-absence-engine";

const LEVEL_BAR: Record<AbsenceLevel, string> = {
  critical: "border-l-[var(--cs-risk)]",
  attention: "border-l-[var(--cs-warning)]",
  ok: "border-l-[var(--cs-success)]",
};
const LEVEL_CHIP: Record<AbsenceLevel, string> = {
  critical: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",
  attention: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]",
  ok: "bg-[var(--cs-success-bg)] text-[var(--cs-success)]",
};
const LEVEL_LABEL: Record<AbsenceLevel, string> = { critical: "Critical", attention: "Review", ok: "OK" };

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-[var(--cs-text-muted)]">{label}:</span>
      <span className="text-[11px] font-semibold text-[var(--cs-navy)]">{value}</span>
    </div>
  );
}

function Row({ r }: { r: AbsenceStaffRow }) {
  return (
    <Link href={`/staff/${r.staff_id}`} className={`block rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] p-3 border-l-4 ${LEVEL_BAR[r.level]} transition-shadow hover:shadow-[var(--cs-shadow-soft)]`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--cs-navy)]">{r.full_name}</span>
            {r.currently_absent && <span className="rounded-full bg-[var(--cs-risk-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--cs-risk)]">Currently off</span>}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            <Stat label="Bradford" value={r.bradford} />
            <Stat label="Spells (12m)" value={r.spells_12m} />
            <Stat label="Days (12m)" value={r.days_12m} />
            <Stat label="In 90d" value={r.spells_90d} />
          </div>
          {r.flags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {r.flags.map((f, i) => (
                <span key={i} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${f.severity === "critical" ? "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]" : "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]"}`}>{f.text}</span>
              ))}
            </div>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${LEVEL_CHIP[r.level]}`}>{LEVEL_LABEL[r.level]}</span>
      </div>
    </Link>
  );
}

export default function WorkforceAbsencePage() {
  const { data: resp, isLoading, error } = useWorkforceAbsence();
  const o = resp?.data;
  const concern = (o?.rows ?? []).filter((r) => r.level !== "ok");
  const clear = (o?.rows ?? []).filter((r) => r.level === "ok");

  return (
    <PageShell
      title="Sickness & Absence"
      subtitle={o ? `${o.date} · ${o.headline}` : "Bradford Factor, absence triggers and return-to-work across the team."}
      showQuickCreate={false}
      actions={o ? <PrintButton title="Sickness & Absence Patterns" subtitle={o.headline} targetId="workforce-absence-print" /> : undefined}
    >
      <div className="space-y-6">
        {error && <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Could not load absence data: {(error as Error).message}</CardContent></Card>}
        {isLoading && <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Loading absence patterns…</CardContent></Card>}

        {o && (
          <div id="workforce-absence-print" className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Team", value: o.total_staff, risky: false },
                { label: "Needs review", value: o.summary.with_concern, risky: o.summary.with_concern > 0 },
                { label: "Currently off", value: o.summary.currently_absent, risky: o.summary.currently_absent > 0 },
                { label: "RTW overdue", value: o.summary.rtw_overdue, risky: o.summary.rtw_overdue > 0 },
                { label: "Long-term", value: o.summary.long_term, risky: o.summary.long_term > 0 },
                { label: "Bradford trigger", value: o.summary.bradford_trigger, risky: o.summary.bradford_trigger > 0 },
              ].map((c) => (
                <div key={c.label} className="rounded-xl bg-[var(--cs-surface)] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">{c.label}</p>
                  <p className={`mt-0.5 text-2xl font-extrabold tracking-tight ${c.risky ? "text-[var(--cs-warning)]" : "text-[var(--cs-navy)]"}`}>{c.value}</p>
                </div>
              ))}
            </div>

            <CardErrorBoundary>
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Activity className="h-4 w-4 text-[var(--cs-teal)]" />
                  <CardTitle className="text-sm">Patterns needing a conversation</CardTitle>
                </CardHeader>
                <CardContent>
                  {concern.length === 0 ? (
                    <p className="flex items-center gap-2 py-1 text-sm text-[var(--cs-text-secondary)]"><CheckCircle2 className="h-4 w-4 text-[var(--cs-success)]" /> No absence patterns flagged across the team.</p>
                  ) : (
                    <div className="space-y-2">{concern.map((r) => <Row key={r.staff_id} r={r} />)}</div>
                  )}
                </CardContent>
              </Card>
            </CardErrorBoundary>

            {clear.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">No current concern ({clear.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">{clear.map((r) => <Row key={r.staff_id} r={r} />)}</div>
                </CardContent>
              </Card>
            )}

            <p className="flex items-start gap-2 text-xs text-[var(--cs-text-gentle)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              The Bradford Factor (spells² × total days, rolling 12 months) and trigger points are prompts for a supportive conversation and proper process — not automatic conclusions about anyone. It supports professional judgement; managers remain responsible for absence decisions.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
