"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — INTEGRATION HUB
// The adapter framework: a registry of typed integrations (rota, payroll,
// HR/training, calendar, notifications, document storage, external forms, LA
// reporting). Every adapter ships the same contract — secure credentials, retry
// handling with backoff, error logging, idempotency keys, sync status, an audit
// trail and a manual override. NO real external calls are made; this is the
// scaffold that lets "enter once" extend to the systems around the home.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plug, Loader2, CheckCircle2, XCircle, CircleDashed, RefreshCw,
  AlertTriangle, Brain, Lock, Repeat, ShieldCheck, ScrollText, Hand,
  Clock, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIntegrationHub } from "@/hooks/use-integration-hub";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  connected: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  syncing: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  error: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  disconnected: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  not_configured: { bg: "bg-gray-50", text: "text-gray-600", border: "border-[var(--cs-border)]" },
};
const STATUS_LABEL: Record<string, string> = {
  connected: "Connected",
  syncing: "Syncing",
  error: "Error",
  disconnected: "Disconnected",
  not_configured: "Not configured",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  connected: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  syncing: <RefreshCw className="h-4 w-4 text-blue-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  disconnected: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  not_configured: <CircleDashed className="h-4 w-4 text-gray-400" />,
};
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

const FRAMEWORK_GUARANTEES: { icon: React.ReactNode; title: string; body: string }[] = [
  { icon: <Lock className="h-4 w-4 text-brand" />, title: "Secure credentials", body: "Secrets live in an encrypted vault, never in code or logs." },
  { icon: <Repeat className="h-4 w-4 text-brand" />, title: "Retry & backoff", body: "Transient failures retry automatically with exponential backoff." },
  { icon: <ShieldCheck className="h-4 w-4 text-brand" />, title: "Idempotency keys", body: "A retried sync never double-posts — every write is keyed." },
  { icon: <ScrollText className="h-4 w-4 text-brand" />, title: "Audit trail", body: "Every connect, sync and disconnect is logged as evidence." },
  { icon: <Activity className="h-4 w-4 text-brand" />, title: "Sync status", body: "Each adapter reports a live status so stalls surface early." },
  { icon: <Hand className="h-4 w-4 text-brand" />, title: "Manual override", body: "Pause or run any integration by hand — the workflow never blocks." },
];

export default function IntegrationHubPage() {
  const { data, isLoading } = useIntegrationHub();
  const intel = data?.data;

  return (
    <PageShell
      title="Integration Hub"
      subtitle="Adapter framework — connect Cara to the systems around the home"
      icon={<Plug className="h-5 w-5" />}
      showQuickCreate={false}
      caraContext={{ pageTitle: "Integration Hub", sourceType: "general" }}
    >
      {isLoading || !intel ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      ) : (
        <IntegrationHubBody intel={intel} />
      )}
    </PageShell>
  );
}

function IntegrationHubBody({ intel }: { intel: NonNullable<ReturnType<typeof useIntegrationHub>["data"]>["data"] }) {
  const o = intel.overview;
  const adapters = intel.adapters ?? [];
  const alerts = intel.alerts ?? [];
  const insights = intel.insights ?? [];

  return (
    <div className="space-y-6">

      {/* ── Overview stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total adapters" value={o.total_adapters} tone="neutral" />
        <StatCard label="Connected" value={o.connected} tone="good" />
        <StatCard label="Errors" value={o.errors} tone={o.errors > 0 ? "bad" : "neutral"} />
        <StatCard label="Not configured" value={o.not_configured} tone={o.not_configured > 0 ? "warn" : "neutral"} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Key integrations connected" value={`${o.key_adapters_connected}/${o.key_adapters}`} tone={o.key_adapters_connected === o.key_adapters ? "good" : "warn"} />
        <StatCard label="Disconnected" value={o.disconnected} tone={o.disconnected > 0 ? "warn" : "neutral"} />
        <StatCard label="Idempotent adapters" value={`${o.idempotent_adapters}/${o.total_adapters}`} tone="neutral" />
        <StatCard label="Hub health" value={`${o.health_score}/100`} tone={o.health_score >= 70 ? "good" : o.health_score >= 40 ? "warn" : "bad"} />
      </div>

      {/* ── Framework guarantees ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            Built-in for every adapter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FRAMEWORK_GUARANTEES.map((g) => (
              <div key={g.title} className="flex items-start gap-2.5 rounded-lg border p-3">
                <div className="mt-0.5 shrink-0">{g.icon}</div>
                <div>
                  <p className="text-xs font-semibold">{g.title}</p>
                  <p className="text-[11px] text-[var(--cs-text-muted)] leading-relaxed">{g.body}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Alerts ───────────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Integration Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className={cn("rounded border p-3 text-sm leading-relaxed", ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium)}>
                <Badge className="mr-2 text-[10px] uppercase tracking-wide bg-white/60">{alert.severity}</Badge>
                {alert.message}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Cara insights ────────────────────────────────────────────────── */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
              <Brain className="h-4 w-4" />
              Cara Integration Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className={cn("rounded border p-3 text-sm leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive)}>
                {insight.text}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Full adapter registry ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plug className="h-4 w-4 text-brand" />
            Adapter Registry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {adapters.map((a) => {
            const st = STATUS_STYLES[a.status] ?? STATUS_STYLES.not_configured;
            return (
              <div key={a.id} className={cn("rounded-lg border p-4", st.border)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 shrink-0">{STATUS_ICON[a.status]}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{a.kind_label}</p>
                        {a.is_key_adapter && (
                          <Badge className="text-[10px] bg-brand/10 text-brand">key integration</Badge>
                        )}
                        {a.manual_override && (
                          <Badge className="text-[10px] bg-purple-100 text-purple-700">manual override</Badge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--cs-text-muted)]">{a.name}</p>
                    </div>
                  </div>
                  <Badge className={cn("text-[10px] shrink-0", st.bg, st.text)}>
                    {STATUS_LABEL[a.status] ?? a.status}
                  </Badge>
                </div>

                <p className="mt-2 text-xs text-[var(--cs-text-secondary)] leading-relaxed">
                  {a.capability_summary}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--cs-text-muted)]">
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3" /> {a.sync_status}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {a.last_sync
                      ? a.last_sync_days_ago === 0
                        ? "Synced today"
                        : `Synced ${a.last_sync_days_ago}d ago`
                      : "Never synced"}
                    {a.stale && <Badge className="ml-1 text-[9px] bg-amber-100 text-amber-700">stale</Badge>}
                  </span>
                  <span className="flex items-center gap-1">
                    <Repeat className="h-3 w-3" /> retry ×{a.retry.max_attempts} / {a.retry.backoff_seconds}s backoff
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> idempotency {a.supports_idempotency ? "on" : "off"}
                  </span>
                  {a.error_count > 0 && (
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-3 w-3" /> {a.error_count} error{a.error_count === 1 ? "" : "s"} logged
                    </span>
                  )}
                </div>

                {a.latest_error && (
                  <p className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-[11px] text-red-700">
                    Latest error: {a.latest_error.message}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "neutral" | "good" | "warn" | "bad";
}) {
  const toneStyles: Record<string, string> = {
    neutral: "bg-white",
    good: "bg-green-50 border-green-200",
    warn: "bg-amber-50 border-amber-200",
    bad: "bg-red-50 border-red-200",
  };
  const valueStyles: Record<string, string> = {
    neutral: "text-[var(--cs-text-primary)]",
    good: "text-green-600",
    warn: "text-amber-600",
    bad: "text-red-600",
  };
  return (
    <Card className={cn(toneStyles[tone])}>
      <CardContent className="p-4">
        <p className={cn("text-2xl font-bold tabular-nums", valueStyles[tone])}>{value}</p>
        <p className="text-xs text-[var(--cs-text-muted)] mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
