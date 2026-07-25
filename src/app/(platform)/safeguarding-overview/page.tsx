"use client";

// CARA — Home Safeguarding Overview: the DSL's open safeguarding picture.

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { PrintButton } from "@/components/common/print-button";
import { api } from "@/hooks/use-api";
import { ShieldAlert, ShieldCheck, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import type { SafeguardingSection, SafeguardingSeverity } from "@/lib/engines/safeguarding-overview-engine";
import type { SafeguardingOverviewResult } from "@/lib/engines/safeguarding-overview-engine";

const SECTION_TONE: Record<SafeguardingSeverity, string> = {
  critical: "border-l-[var(--cs-risk)]",
  high: "border-l-[var(--cs-warning)]",
  warning: "border-l-[var(--cs-warning)]",
  ok: "border-l-[var(--cs-success)]",
  none: "border-l-[var(--cs-border)]",
};
const STATUS_CHIP: Record<SafeguardingSeverity, string> = {
  critical: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",
  high: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]",
  warning: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]",
  ok: "bg-[var(--cs-success-bg)] text-[var(--cs-success)]",
  none: "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]",
};
const ITEM_BAR: Record<string, string> = {
  critical: "border-l-[var(--cs-risk)]",
  high: "border-l-[var(--cs-warning)]",
  medium: "border-l-[var(--cs-teal)]",
  low: "border-l-[var(--cs-border)]",
};
const OVERALL: Record<string, { cls: string; label: string }> = {
  critical: { cls: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]", label: "Critical — act now" },
  elevated: { cls: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]", label: "Elevated — open actions" },
  stable: { cls: "bg-[var(--cs-success-bg)] text-[var(--cs-success)]", label: "Stable" },
};

function SectionCard({ s }: { s: SafeguardingSection }) {
  return (
    <Card className={`border-l-4 ${SECTION_TONE[s.severity]}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">{s.label}</CardTitle>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CHIP[s.severity]}`}>{s.status_text}</span>
      </CardHeader>
      <CardContent>
        {s.items.length === 0 ? (
          <p className="flex items-center gap-2 py-1 text-sm text-[var(--cs-text-muted)]">
            {s.severity === "ok" ? <CheckCircle2 className="h-3.5 w-3.5 text-[var(--cs-success)]" /> : null}
            {s.severity === "none" ? "Nothing recorded for this home yet." : "Nothing outstanding."}
          </p>
        ) : (
          <div className="space-y-1.5">
            {s.items.map((it, i) => (
              <Link key={i} href={it.href} className={`block rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] p-2.5 border-l-4 ${ITEM_BAR[it.severity]} transition-shadow hover:shadow-[var(--cs-shadow-soft)]`}>
                <p className="text-sm font-semibold capitalize text-[var(--cs-navy)]">{it.title}</p>
                <p className="mt-0.5 text-xs text-[var(--cs-text-secondary)]">{it.detail}</p>
              </Link>
            ))}
          </div>
        )}
        {s.count > s.items.length && (
          <Link href={s.href} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--cs-teal)] hover:underline">
            View all {s.count} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export default function SafeguardingOverviewPage() {
  // Query config inlined from use-safeguarding-overview hook
  const { data: resp, isLoading, error } = useQuery({
    queryKey: ["safeguarding-overview"],
    queryFn: () => api.get<{ data: SafeguardingOverviewResult }>("/safeguarding-overview"),
    staleTime: 30_000,
  });
  const o = resp?.data;

  return (
    <PageShell
      title="Safeguarding Overview"
      subtitle={o ? `${o.date} · ${o.headline}` : "The home's open safeguarding picture — oversight, missing, risk, LADO and notifications."}
      showQuickCreate={false}
      actions={o ? <PrintButton title="Safeguarding Overview" subtitle={o.headline} targetId="safeguarding-overview-print" /> : undefined}
    >
      <div className="space-y-6">
        {error && <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Could not load the overview: {(error as Error).message}</CardContent></Card>}
        {isLoading && <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Loading the safeguarding picture…</CardContent></Card>}

        {o && (
          <div id="safeguarding-overview-print" className="space-y-6">
            {/* Overall banner */}
            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 ${OVERALL[o.overall].cls}`}>
              <div className="flex items-center gap-2.5">
                {o.overall === "stable" ? <ShieldCheck className="h-5 w-5 shrink-0" /> : <ShieldAlert className="h-5 w-5 shrink-0" />}
                <div>
                  <p className="text-sm font-bold">{OVERALL[o.overall].label}</p>
                  <p className="text-xs opacity-80">{o.headline}</p>
                </div>
              </div>
            </div>

            {/* Counts */}
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Awaiting oversight", value: o.counts.oversight_pending },
                { label: "Open incidents", value: o.counts.open_incidents },
                { label: "Active missing", value: o.counts.missing_active },
                { label: "RHI outstanding", value: o.counts.rhi_outstanding },
                { label: "Risk overdue", value: o.counts.risk_overdue },
                { label: "Notifications", value: o.counts.notifiable_pending },
              ].map((c) => (
                <div key={c.label} className="rounded-xl bg-[var(--cs-surface)] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">{c.label}</p>
                  <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-[var(--cs-navy)]">{c.value}</p>
                </div>
              ))}
            </div>

            {/* Sections */}
            <CardErrorBoundary>
              <div className="grid gap-4 lg:grid-cols-2">
                {o.sections.map((s) => <SectionCard key={s.key} s={s} />)}
              </div>
            </CardErrorBoundary>

            {/* Positives */}
            {o.positives.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {o.positives.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--cs-success-bg)] px-3 py-1 text-xs font-medium text-[var(--cs-success)]">
                    <CheckCircle2 className="h-3 w-3" /> {p}
                  </span>
                ))}
              </div>
            )}

            <p className="flex items-start gap-2 text-xs text-[var(--cs-text-gentle)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              A live safeguarding lens drawn from incidents, missing episodes, risk assessments, LADO referrals and notifiable events. It supports professional judgement — for notifiable events, the manager should consider whether notification is required. Staff and managers remain responsible for decisions and safeguarding actions.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
