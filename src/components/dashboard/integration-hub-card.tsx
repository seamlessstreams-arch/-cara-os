"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — INTEGRATION HUB CARD
// Adapter framework status: typed adapters (rota, payroll, HR/training, calendar,
// notifications, document storage, external forms, LA reporting) each with secure
// credentials, retry handling, idempotency keys, sync status and a manual override.
// Powered by the Integration Hub Engine. NO real external calls — scaffold only.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plug, ChevronRight, AlertTriangle, Brain, Loader2,
  CheckCircle2, XCircle, CircleDashed, RefreshCw, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { IntegrationHubResult } from "@/lib/integration-hub/integration-hub-engine";

interface IntegrationHubResponse {
  data: IntegrationHubResult;
}

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
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  connected: { bg: "bg-green-100", text: "text-green-700" },
  syncing: { bg: "bg-blue-100", text: "text-blue-700" },
  error: { bg: "bg-red-100", text: "text-red-700" },
  disconnected: { bg: "bg-amber-100", text: "text-amber-700" },
  not_configured: { bg: "bg-gray-100", text: "text-gray-600" },
};
const STATUS_LABEL: Record<string, string> = {
  connected: "Connected",
  syncing: "Syncing",
  error: "Error",
  disconnected: "Disconnected",
  not_configured: "Not set up",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  connected: <CheckCircle2 className="h-3 w-3 text-green-500" />,
  syncing: <RefreshCw className="h-3 w-3 text-blue-500" />,
  error: <XCircle className="h-3 w-3 text-red-500" />,
  disconnected: <AlertTriangle className="h-3 w-3 text-amber-500" />,
  not_configured: <CircleDashed className="h-3 w-3 text-gray-400" />,
};

export function IntegrationHubCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["integration-hub"],
    queryFn: () => api.get<IntegrationHubResponse>("/integration-hub"),
    refetchInterval: 60_000, // 60 second refresh
  });
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plug className="h-4 w-4 text-brand" />
            Integration Hub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const o = intel.overview;
  const adapters = intel.adapters ?? [];
  const alerts = intel.alerts ?? [];
  const insights = intel.insights ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plug className="h-4 w-4 text-brand" />
            Integration Hub
          </CardTitle>
          <Link href="/integration-hub" className="text-xs text-brand hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── KPI strip ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.total_adapters}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">Adapters</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-green-600">{o.connected}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">Connected</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.errors > 0 ? "bg-red-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.errors > 0 ? "text-[--cs-risk]" : "text-gray-500")}>{o.errors}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">Errors</p>
          </div>
        </div>

        {/* ── Framework guarantee strip ────────────────────────────────── */}
        <div className="flex items-center gap-2 rounded-lg border p-2.5 text-xs">
          <Lock className="h-3.5 w-3.5 text-brand shrink-0" />
          <span className="text-[var(--cs-text-muted)]">Secure credentials, retries, idempotency &amp; audit on every adapter</span>
          <Badge className="text-[9px] bg-[--cs-bg] text-[--cs-text-secondary] ml-auto shrink-0">{o.not_configured} to set up</Badge>
        </div>

        {/* ── Adapter list with status chips ───────────────────────────── */}
        {adapters.length > 0 && (
          <div className="space-y-1.5">
            {adapters.slice(0, 5).map((a) => {
              const st = STATUS_STYLES[a.status] ?? STATUS_STYLES.not_configured;
              return (
                <div key={a.id} className="rounded-lg border p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {STATUS_ICON[a.status]}
                      <span className="font-medium truncate">{a.kind_label}</span>
                      {a.is_key_adapter && (
                        <Badge className="text-[9px] bg-brand/10 text-brand shrink-0">key</Badge>
                      )}
                    </div>
                    <Badge className={cn("text-[10px] shrink-0", st.bg, st.text)}>
                      {STATUS_LABEL[a.status] ?? a.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[10px] text-[var(--cs-text-muted)] truncate">
                    {a.name} · {a.sync_status}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}
        {alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[var(--cs-text-muted)] flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Integration Alerts
            </p>
            {alerts.slice(0, 3).map((alert, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium)}>
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── Cara insights ────────────────────────────────────────────── */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Integration Intelligence
            </p>
            {insights.slice(0, 2).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
