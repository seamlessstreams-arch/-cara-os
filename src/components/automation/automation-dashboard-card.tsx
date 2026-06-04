"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — AUTOMATION DASHBOARD CARD
// Overview card for the centralised automation engine. Shows total rules,
// enabled/disabled split, recent automation runs with status badges, and
// the top-triggered rules. Follows Cornerstone design patterns.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Zap, Loader2, CheckCircle2, AlertTriangle, XCircle,
  ChevronRight, ToggleLeft, ToggleRight, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutomationRules } from "@/hooks/use-automation";

// ── Status badge styles ────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  success: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2 },
  partial: { bg: "bg-amber-100", text: "text-amber-700", icon: AlertTriangle },
  failed:  { bg: "bg-red-100",   text: "text-red-700",   icon: XCircle },
};

// ── Helper: format trigger name for display ────────────────────────────────

function formatTrigger(trigger: string): string {
  return trigger
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Component ──────────────────────────────────────────────────────────────

export function AutomationDashboardCard() {
  const { data, isLoading } = useAutomationRules();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const { rules, summary } = d;

  // Derive recent runs from rules that have run_count > 0, sorted by last_run_at
  const rulesWithRuns = rules
    .filter((r) => r.run_count > 0 && r.last_run_at)
    .sort((a, b) => new Date(b.last_run_at!).getTime() - new Date(a.last_run_at!).getTime())
    .slice(0, 5);

  // Top triggered rules by run_count
  const topTriggered = [...rules]
    .sort((a, b) => b.run_count - a.run_count)
    .filter((r) => r.run_count > 0)
    .slice(0, 5);

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-slate-900">Automation Engine</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-300">
              {summary.enabled} ACTIVE
            </span>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {summary.total_rules} rule{summary.total_rules !== 1 ? "s" : ""} configured — {summary.enabled} enabled, {summary.disabled} disabled — covering {summary.triggers_covered} trigger type{summary.triggers_covered !== 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg p-2 bg-slate-50">
            <p className="text-lg font-bold tabular-nums text-slate-700">{summary.total_rules}</p>
            <p className="text-[10px] text-muted-foreground">Total Rules</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-green-50">
            <p className="text-lg font-bold tabular-nums text-green-600">{summary.enabled}</p>
            <p className="text-[10px] text-muted-foreground">Enabled</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-slate-50">
            <p className="text-lg font-bold tabular-nums text-slate-500">{summary.disabled}</p>
            <p className="text-[10px] text-muted-foreground">Disabled</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-blue-50">
            <p className="text-lg font-bold tabular-nums text-blue-600">{summary.total_runs}</p>
            <p className="text-[10px] text-muted-foreground">Total Runs</p>
          </div>
        </div>

        {/* Trigger Coverage */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Trigger Coverage
          </p>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(summary.trigger_counts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([trigger, count]) => (
                <div key={trigger} className="rounded border border-slate-200 px-2 py-1.5 text-xs flex items-center justify-between">
                  <span className="font-medium text-slate-700 truncate">{formatTrigger(trigger)}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground ml-1 shrink-0">
                    {count} rule{count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Runs */}
        {rulesWithRuns.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Recent Automation Runs
            </p>
            {rulesWithRuns.map((rule) => (
              <div key={rule.id} className="rounded border border-slate-200 p-2 text-xs flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-700 truncate">{rule.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatTrigger(rule.trigger)} — {rule.run_count} run{rule.run_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground shrink-0 ml-2">
                  {rule.last_run_at ? new Date(rule.last_run_at).toLocaleDateString("en-GB") : "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Top Triggered Rules */}
        {topTriggered.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <ToggleRight className="h-3 w-3" />
              Top Triggered Rules
            </p>
            {topTriggered.map((rule) => (
              <div key={rule.id} className="rounded border border-slate-200 p-2 text-xs flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-700 truncate">{rule.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{rule.description}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-[10px] font-bold tabular-nums text-slate-600">{rule.run_count}x</span>
                  {rule.enabled ? (
                    <ToggleRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-3 w-3 text-slate-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No runs yet message */}
        {rulesWithRuns.length === 0 && topTriggered.length === 0 && (
          <div className="rounded border border-slate-200 bg-slate-50 p-4 text-center">
            <Zap className="h-5 w-5 text-slate-400 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">
              No automation runs recorded yet. Rules will fire automatically when triggers occur across the platform.
            </p>
          </div>
        )}

        {/* View All Rules link */}
        <div className="pt-1">
          <a
            href="/workflow-orchestration"
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            View All Rules
            <ChevronRight className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
