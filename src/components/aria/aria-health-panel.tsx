"use client";

// ═════════════════════════════════════════════════════════════════════════════
// AriaHealthPanel
//
// Displays full ARIA health diagnostics for managers.
// Shows provider status, Supabase connectivity, approval queue depth,
// audit log health, command registry coverage, and actionable recommendations.
//
// Never shown to staff-level roles. The API enforces RBAC independently;
// this component is the UI layer.
// ═════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, Zap, Database,
  FileText, Shield, RefreshCw, ChevronDown, ChevronUp, Sparkles,
  Info, Activity, BookOpen, Users,
} from "lucide-react";
import {
  useAriaHealth,
  useAriaHealthDeepTest,
  type AriaHealthStatus,
  type AriaOverallStatus,
  type ProviderHealth,
  type ProviderTestStatus,
} from "@/hooks/use-aria-health";

// ─── Status colour helpers ───────────────────────────────────────────────────

const OVERALL_META: Record<
  AriaOverallStatus,
  { label: string; colour: string; dot: string; icon: React.ElementType }
> = {
  full_capacity: {
    label: "Full Capacity",
    colour: "bg-emerald-50 border-emerald-200 text-emerald-900",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  partial: {
    label: "Partial Capacity",
    colour: "bg-amber-50 border-amber-200 text-amber-900",
    dot: "bg-amber-500",
    icon: AlertTriangle,
  },
  not_configured: {
    label: "Not Configured",
    colour: "bg-slate-50 border-slate-200 text-slate-600",
    dot: "bg-slate-400",
    icon: XCircle,
  },
  degraded: {
    label: "Degraded",
    colour: "bg-red-50 border-red-200 text-red-900",
    dot: "bg-red-500",
    icon: AlertTriangle,
  },
  error: {
    label: "Error",
    colour: "bg-red-50 border-red-200 text-red-900",
    dot: "bg-red-600",
    icon: XCircle,
  },
};

const TEST_STATUS_META: Record<
  ProviderTestStatus,
  { label: string; colour: string; icon: React.ElementType }
> = {
  ok: { label: "Live ✓", colour: "text-emerald-700 bg-emerald-50", icon: CheckCircle2 },
  failed: { label: "Failed", colour: "text-red-700 bg-red-50", icon: XCircle },
  skipped: { label: "Not tested", colour: "text-slate-500 bg-slate-50", icon: Clock },
  not_configured: { label: "Not configured", colour: "text-slate-400 bg-slate-50", icon: XCircle },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusDot({ ok, warn }: { ok: boolean; warn?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full shrink-0 mt-0.5",
        ok ? "bg-emerald-500" : warn ? "bg-amber-500" : "bg-red-500",
      )}
    />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
      {children}
    </p>
  );
}

function ProviderCard({
  name,
  icon,
  health,
}: {
  name: string;
  icon: React.ReactNode;
  health: ProviderHealth;
}) {
  const testMeta = TEST_STATUS_META[health.testCallStatus];
  const TestIcon = testMeta.icon;

  return (
    <div className="rounded-lg border bg-white p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{name}</span>
        </div>
        <StatusDot ok={health.configured} warn={false} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
        <span className="text-slate-400">API Key</span>
        <span className={health.configured ? "text-emerald-700 font-medium" : "text-red-600 font-medium"}>
          {health.configured ? "Configured" : "Not set"}
        </span>

        <span className="text-slate-400">Model</span>
        <span>{health.model ?? "—"}</span>

        <span className="text-slate-400">Live test</span>
        <span className={cn("flex items-center gap-1", testMeta.colour)}>
          <TestIcon className="h-3 w-3" />
          {testMeta.label}
          {health.latencyMs !== undefined && (
            <span className="text-slate-400 ml-1">{health.latencyMs} ms</span>
          )}
        </span>

        {health.requestsToday !== undefined && (
          <>
            <span className="text-slate-400">Requests today</span>
            <span>{health.requestsToday}</span>
          </>
        )}

        {health.lastUsedAt && (
          <>
            <span className="text-slate-400">Last used</span>
            <span>{new Date(health.lastUsedAt).toLocaleString("en-GB")}</span>
          </>
        )}
      </div>

      {health.errorMessage && (
        <div className="flex items-start gap-1.5 rounded bg-red-50 border border-red-200 px-2.5 py-1.5 text-xs text-red-700">
          <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
          {health.errorMessage}
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface AriaHealthPanelProps {
  /** The current user's ARIA role — gating visibility. */
  userRole: string;
  /** The current user's ID — required for auth headers. */
  userId: string;
  /** Compact mode for inline use (e.g. sidebar badge). */
  compact?: boolean;
  className?: string;
}

export function AriaHealthPanel({
  userRole,
  userId,
  compact = false,
  className,
}: AriaHealthPanelProps) {
  const [showDetails, setShowDetails] = useState(!compact);
  const [showCoverage, setShowCoverage] = useState(false);

  const { data: health, isLoading, error, refetch } = useAriaHealth(userRole, userId);
  const deepTest = useAriaHealthDeepTest();

  // Only render for manager roles
  const allowedRoles = ["registered_manager", "responsible_individual", "deputy_manager"];
  if (!allowedRoles.includes(userRole)) return null;

  // ── Compact badge mode ──────────────────────────────────────────────────
  if (compact) {
    if (isLoading) {
      return (
        <div className={cn("flex items-center gap-1.5 text-xs text-slate-400", className)}>
          <RefreshCw className="h-3 w-3 animate-spin" />
          Checking ARIA…
        </div>
      );
    }
    if (!health) return null;

    const meta = OVERALL_META[health.overallStatus];
    const Icon = meta.icon;

    return (
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={cn(
          "flex items-center gap-1.5 text-xs px-2 py-1 rounded border font-medium transition-colors",
          meta.colour,
          "hover:opacity-80",
          className,
        )}
      >
        <span className={cn("h-2 w-2 rounded-full shrink-0", meta.dot)} />
        <Icon className="h-3 w-3" />
        ARIA {meta.label}
        {health.approvals.overdueCount > 0 && (
          <span className="ml-1 rounded-full bg-red-500 text-white text-[10px] px-1.5 leading-4">
            {health.approvals.overdueCount}
          </span>
        )}
      </button>
    );
  }

  // ── Full panel mode ─────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header card */}
      <Card
        className={cn(
          "border-2",
          health
            ? OVERALL_META[health.overallStatus].colour
            : "bg-slate-50 border-slate-200",
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">ARIA Intelligence Health</CardTitle>
                {health?.lastCheckedAt && (
                  <p className="text-xs opacity-70 mt-0.5">
                    Last checked {new Date(health.lastCheckedAt).toLocaleString("en-GB")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {health && (
                <span
                  className={cn(
                    "text-sm font-semibold px-3 py-1 rounded-full border",
                    OVERALL_META[health.overallStatus].colour,
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-2 w-2 rounded-full mr-1.5",
                      OVERALL_META[health.overallStatus].dot,
                    )}
                  />
                  {OVERALL_META[health.overallStatus].label}
                </span>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
                className="text-xs"
              >
                <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
                Refresh
              </Button>

              {userRole === "responsible_individual" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deepTest.mutate()}
                  disabled={deepTest.isPending}
                  className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                  title="Makes a live 1-token API call to each provider to verify connectivity. Has a small cost."
                >
                  <Zap className={cn("h-3 w-3 mr-1", deepTest.isPending && "animate-pulse")} />
                  {deepTest.isPending ? "Testing…" : "Deep test"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {error && (
          <CardContent className="pt-0">
            <div className="flex items-start gap-2 rounded bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error instanceof Error ? error.message : "Health check failed"}</span>
            </div>
          </CardContent>
        )}

        {isLoading && !health && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Running health diagnostics…
            </div>
          </CardContent>
        )}
      </Card>

      {health && (
        <>
          {/* Recommendations */}
          {health.recommendations.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-2 mb-2">
                  <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-amber-800">
                    {health.recommendations.length} recommendation
                    {health.recommendations.length === 1 ? "" : "s"}
                  </p>
                </div>
                <ul className="space-y-1.5 ml-6">
                  {health.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-amber-800 list-disc">
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Toggle details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
          >
            {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showDetails ? "Hide" : "Show"} detailed diagnostics
          </button>

          {showDetails && (
            <div className="space-y-4">
              {/* Provider section */}
              <div>
                <SectionLabel>AI Providers</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ProviderCard
                    name="OpenAI"
                    icon={<Sparkles className="h-4 w-4 text-emerald-600" />}
                    health={health.openai}
                  />
                  <ProviderCard
                    name="Anthropic"
                    icon={<Sparkles className="h-4 w-4 text-violet-600" />}
                    health={health.anthropic}
                  />
                </div>
              </div>

              {/* Persistence + Audit */}
              <div>
                <SectionLabel>Data Layer</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Supabase */}
                  <div className="rounded-lg border bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-slate-500" />
                        <span className="font-medium text-sm">Supabase</span>
                      </div>
                      <StatusDot ok={health.supabase.connected && health.supabase.tablesPresent} warn={health.supabase.connected && !health.supabase.tablesPresent} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="text-slate-400">Connection</span>
                      <span className={health.supabase.connected ? "text-emerald-700" : "text-red-600"}>
                        {health.supabase.connected ? "Connected" : "Not connected"}
                      </span>
                      <span className="text-slate-400">ARIA tables</span>
                      <span className={health.supabase.tablesPresent ? "text-emerald-700" : "text-red-600"}>
                        {health.supabase.tablesPresent ? "All present" : `Missing: ${health.supabase.missingTables.join(", ")}`}
                      </span>
                      {health.supabase.lastWriteAt && (
                        <>
                          <span className="text-slate-400">Last write</span>
                          <span>{new Date(health.supabase.lastWriteAt).toLocaleString("en-GB")}</span>
                        </>
                      )}
                    </div>
                    {health.supabase.errorMessage && (
                      <div className="flex items-start gap-1.5 rounded bg-red-50 border border-red-200 px-2.5 py-1.5 text-xs text-red-700">
                        <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                        {health.supabase.errorMessage}
                      </div>
                    )}
                  </div>

                  {/* Audit log */}
                  <div className="rounded-lg border bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-slate-500" />
                        <span className="font-medium text-sm">Audit Log</span>
                      </div>
                      <StatusDot ok={health.audit.writable} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="text-slate-400">Status</span>
                      <span className={health.audit.writable ? "text-emerald-700" : "text-red-600"}>
                        {health.audit.writable ? "Writable" : "Not writable"}
                      </span>
                      {health.audit.totalEventsToday !== undefined && (
                        <>
                          <span className="text-slate-400">Events today</span>
                          <span>{health.audit.totalEventsToday}</span>
                        </>
                      )}
                      {health.audit.lastEventAt && (
                        <>
                          <span className="text-slate-400">Last event</span>
                          <span>{new Date(health.audit.lastEventAt).toLocaleString("en-GB")}</span>
                        </>
                      )}
                    </div>
                    {health.audit.errorMessage && (
                      <div className="flex items-start gap-1.5 rounded bg-red-50 border border-red-200 px-2.5 py-1.5 text-xs text-red-700">
                        <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                        {health.audit.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Approvals */}
              <div>
                <SectionLabel>Approval Queue</SectionLabel>
                <div className="rounded-lg border bg-white p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-800">{health.approvals.pendingCount}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Pending</p>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-2xl font-bold", health.approvals.overdueCount > 0 ? "text-red-600" : "text-slate-800")}>
                        {health.approvals.overdueCount}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Overdue (&gt;24 h)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-800">{health.approvals.recentRejectionCount}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Rejected (7 days)</p>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-2xl font-bold", (health.failedPersistenceCount ?? 0) > 0 ? "text-amber-600" : "text-slate-800")}>
                        {health.failedPersistenceCount ?? 0}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Failed generations</p>
                    </div>
                  </div>
                  {health.approvals.oldestPendingAt && (
                    <p className="text-xs text-slate-400 mt-3 text-center">
                      Oldest pending: {new Date(health.approvals.oldestPendingAt).toLocaleString("en-GB")}
                    </p>
                  )}
                </div>
              </div>

              {/* Generation history */}
              {(health.lastGeneratedAt || health.lastFailedAt) && (
                <div>
                  <SectionLabel>Generation History</SectionLabel>
                  <div className="rounded-lg border bg-white p-4">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      {health.lastGeneratedAt && (
                        <>
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5 text-emerald-500" />
                            Last successful
                          </span>
                          <span className="text-slate-700">{new Date(health.lastGeneratedAt).toLocaleString("en-GB")}</span>
                        </>
                      )}
                      {health.lastFailedAt && (
                        <>
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <XCircle className="h-3.5 w-3.5 text-red-400" />
                            Last failure
                          </span>
                          <span className="text-red-600">{new Date(health.lastFailedAt).toLocaleString("en-GB")}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Command registry */}
              {health.commandRegistry.totalCommands > 0 && (
                <div>
                  <SectionLabel>Command Registry</SectionLabel>
                  <div className="rounded-lg border bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium">{health.commandRegistry.totalCommands} commands registered</span>
                      </div>
                      {health.commandRegistry.hasGeneralCommands && (
                        <Badge variant="secondary" className="text-xs">Includes general commands</Badge>
                      )}
                    </div>

                    {/* Module coverage */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-500">Platform coverage</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {health.moduleCoverage.coveragePercent}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            health.moduleCoverage.coveragePercent >= 90 ? "bg-emerald-500" :
                            health.moduleCoverage.coveragePercent >= 60 ? "bg-amber-500" : "bg-red-500",
                          )}
                          style={{ width: `${health.moduleCoverage.coveragePercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {health.moduleCoverage.modulesWithCommands} of {health.moduleCoverage.totalModules} platform modules covered
                      </p>
                    </div>

                    {/* Coverage toggle */}
                    {health.moduleCoverage.modulesWithoutDedicatedCommands.length > 0 && (
                      <div>
                        <button
                          onClick={() => setShowCoverage(!showCoverage)}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                        >
                          {showCoverage ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {showCoverage ? "Hide" : "Show"} modules without dedicated commands
                        </button>
                        {showCoverage && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {health.moduleCoverage.modulesWithoutDedicatedCommands.map((m) => (
                              <Badge key={m} variant="outline" className="text-[10px] text-slate-500 border-slate-200">
                                {m.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Env var summary */}
              <div>
                <SectionLabel>Environment Variables</SectionLabel>
                <div className="rounded-lg border bg-white p-4">
                  <div className="space-y-1.5">
                    {[
                      { name: "OPENAI_API_KEY", ok: health.openai.configured },
                      { name: "ANTHROPIC_API_KEY", ok: health.anthropic.configured },
                      { name: "NEXT_PUBLIC_SUPABASE_URL", ok: health.supabase.connected },
                      { name: "SUPABASE_SERVICE_ROLE_KEY", ok: health.supabase.connected },
                    ].map(({ name, ok }) => (
                      <div key={name} className="flex items-center gap-2 text-xs">
                        {ok ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        )}
                        <code className={cn("font-mono", ok ? "text-slate-700" : "text-red-600")}>{name}</code>
                        <span className={ok ? "text-emerald-600" : "text-red-500"}>{ok ? "set" : "not set"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Inline status badge (for nav, headers, etc.) ────────────────────────────

export function AriaStatusBadge({
  userRole,
  userId,
  className,
}: {
  userRole: string;
  userId: string;
  className?: string;
}) {
  return (
    <AriaHealthPanel
      userRole={userRole}
      userId={userId}
      compact
      className={className}
    />
  );
}
