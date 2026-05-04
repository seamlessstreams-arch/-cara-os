"use client";
import React, { useState, useRef, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Award, Calendar, CheckCircle2, AlertTriangle, FileText,
  Star, Clock, Download, TrendingUp, Shield,
  Brain, Copy, Loader2, Sparkles, AlertCircle, Zap, ClipboardList,
} from "lucide-react";
import { HOME, getStaffName } from "@/lib/seed-data";
import { useHealthCheck } from "@/hooks/use-dashboard";
import { usePatternAlerts, useActionOutcomes, useHomeClimate, useUpdateActionOutcome } from "@/hooks/use-intelligence";
import type { ActionOutcome } from "@/types/extended";
import { cn, formatDate, daysFromNow, todayStr } from "@/lib/utils";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";

// ── Static data ───────────────────────────────────────────────────────────────

const INSPECTION_HISTORY = [
  { date: "2025-10-15", type: "Full inspection", grade: "Good", inspector: "Jane Whitfield", reportUrl: "#", actions: 2, actionsComplete: 2 },
  { date: "2024-04-22", type: "Full inspection", grade: "Good", inspector: "Mark Tanner", reportUrl: "#", actions: 1, actionsComplete: 1 },
  { date: "2023-11-08", type: "Short notice", grade: "Requires improvement", inspector: "Susan Blake", reportUrl: "#", actions: 5, actionsComplete: 5 },
];

const GRADE_COLORS: Record<string, string> = {
  "Outstanding": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Good": "bg-blue-100 text-blue-700 border-blue-200",
  "Requires improvement": "bg-amber-100 text-amber-700 border-amber-200",
  "Inadequate": "bg-red-100 text-red-700 border-red-200",
};

const READINESS_AREAS_FALLBACK = [
  { area: "Outcomes for young people", score: 88, status: "good" },
  { area: "How well YP are helped & protected", score: 92, status: "good" },
  { area: "Leadership & management", score: 85, status: "good" },
  { area: "Training compliance", score: 76, status: "warn" },
  { area: "Supervision compliance", score: 83, status: "warn" },
  { area: "Record keeping", score: 91, status: "good" },
  { area: "Staffing & rotas", score: 89, status: "good" },
  { area: "Policies current & signed", score: 72, status: "warn" },
];

const CLIMATE_LEVEL_COLORS: Record<string, string> = {
  settled: "text-emerald-600",
  stable: "text-blue-600",
  unsettled: "text-amber-600",
  concerning: "text-orange-600",
  critical: "text-red-600",
};

const CLIMATE_LEVEL_BG: Record<string, string> = {
  settled: "bg-emerald-50 border-emerald-200",
  stable: "bg-blue-50 border-blue-200",
  unsettled: "bg-amber-50 border-amber-200",
  concerning: "bg-orange-50 border-orange-200",
  critical: "bg-red-50 border-red-200",
};

// ── ARIA Narrative Generator ──────────────────────────────────────────────────

function NarrativeGenerator() {
  const [reportType, setReportType] = useState("Reg 44 Independent Visit Report");
  const [period, setPeriod] = useState("Last 28 days");
  const [additionalContext, setAdditionalContext] = useState("");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const periodDaysMap: Record<string, number> = {
    "Last 28 days": 28,
    "Last 3 months": 90,
    "Last 6 months": 180,
  };

  async function handleGenerate() {
    setOutput("");
    setIsDone(false);
    setCopied(false);
    setIsGenerating(true);

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/v1/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          mode: "inspection_narrative",
          style: "reg_45_narrative",
          stream: true,
          page_context: "inspection",
          user_role: "registered_manager",
          question: `Generate a ${reportType} covering the past ${period}.`,
          source_content: additionalContext || "No additional context provided.",
          period_days: periodDaysMap[period] ?? 28,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`API error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.type === "text_delta") {
                setOutput((prev) => prev + parsed.text);
              }
            } catch {
              /* ignore malformed SSE lines */
            }
          }
        }
      }

      setIsDone(true);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setOutput("An error occurred while generating the narrative. Please try again.");
        setIsDone(true);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  return (
    <Card className="border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 shadow-sm">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Reg 44/45 Narrative Generator
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                ARIA generates a professional draft for regulatory reporting
              </p>
            </div>
          </div>
          <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px] font-semibold">
            <Sparkles className="h-3 w-3 mr-1" />
            ARIA
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Report type */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              disabled={isGenerating}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
            >
              <option>Reg 44 Independent Visit Report</option>
              <option>Reg 45 Quality of Care Report</option>
            </select>
          </div>

          {/* Period */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              disabled={isGenerating}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
            >
              <option>Last 28 days</option>
              <option>Last 3 months</option>
              <option>Last 6 months</option>
            </select>
          </div>

          {/* Generate button */}
          <div className="space-y-1.5 flex flex-col justify-end">
            {isGenerating ? (
              <Button
                onClick={handleStop}
                variant="outline"
                className="w-full border-violet-200 text-violet-700 hover:bg-violet-50"
              >
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Stop Generating
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
              >
                <Brain className="h-4 w-4 mr-2" />
                Generate with ARIA
              </Button>
            )}
          </div>
        </div>

        {/* Additional context */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Additional Context <span className="normal-case font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            disabled={isGenerating}
            placeholder="Add any specific themes, events, or context you want ARIA to include in the narrative..."
            rows={3}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:opacity-50 resize-none"
          />
        </div>

        {/* Output area */}
        {(isGenerating || output) && (
          <div className="rounded-xl border border-violet-100 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-violet-100 bg-violet-50/60">
              <div className="flex items-center gap-2">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 text-violet-600 animate-spin" />
                    <span className="text-xs font-semibold text-violet-700">Generating narrative…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">Draft complete</span>
                  </>
                )}
              </div>
              {isDone && output && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-7 text-xs border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1.5 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1.5" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm text-slate-800 leading-relaxed min-h-[80px]">
                {output}
                {isGenerating && (
                  <span className="inline-block w-2 h-4 bg-violet-400 animate-pulse ml-0.5 align-middle" />
                )}
              </pre>
            </div>
            {isDone && (
              <div className="px-4 pb-3 flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                <span className="text-[11px] text-amber-700">
                  AI-generated draft — requires professional review before use
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Live Intelligence Summary ─────────────────────────────────────────────────

function LiveIntelligenceSummary() {
  const alertsQuery = usePatternAlerts({ status: "active" });
  const actionsQuery = useActionOutcomes({ status: "overdue" });
  const climateQuery = useHomeClimate();

  const alerts = alertsQuery.data?.data ?? [];
  const overdueActions = actionsQuery.data?.data ?? [];
  const climate = climateQuery.data?.data?.latest;

  const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;
  const highAlerts = alerts.filter((a) => a.severity === "high").length;
  const medAlerts = alerts.filter((a) => a.severity === "medium").length;

  const climateScore = climate?.overall_climate_score ?? null;
  const climateLevel: string =
    climateScore === null ? "stable" :
    climateScore >= 85 ? "settled" :
    climateScore >= 70 ? "stable" :
    climateScore >= 55 ? "unsettled" :
    climateScore >= 40 ? "concerning" : "critical";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Active Alerts */}
      <Card className={cn(
        "border",
        alerts.length === 0 ? "border-emerald-200 bg-emerald-50" :
        criticalAlerts > 0 ? "border-red-200 bg-red-50" :
        highAlerts > 0 ? "border-orange-200 bg-orange-50" :
        "border-amber-200 bg-amber-50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Active Alerts
              </div>
              {alertsQuery.isLoading ? (
                <div className="flex items-center gap-1.5 mt-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  <span className="text-xs text-slate-400">Loading…</span>
                </div>
              ) : (
                <>
                  <div className={cn(
                    "text-3xl font-black",
                    alerts.length === 0 ? "text-emerald-600" :
                    criticalAlerts > 0 ? "text-red-600" :
                    highAlerts > 0 ? "text-orange-600" : "text-amber-600"
                  )}>
                    {alerts.length}
                  </div>
                  {alerts.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {criticalAlerts > 0 && (
                        <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                          {criticalAlerts} critical
                        </span>
                      )}
                      {highAlerts > 0 && (
                        <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                          {highAlerts} high
                        </span>
                      )}
                      {medAlerts > 0 && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                          {medAlerts} medium
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-600 mt-1 font-medium">No active alerts</div>
                  )}
                </>
              )}
            </div>
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              alerts.length === 0 ? "bg-emerald-200" :
              criticalAlerts > 0 ? "bg-red-200" :
              highAlerts > 0 ? "bg-orange-200" : "bg-amber-200"
            )}>
              <AlertCircle className={cn(
                "h-5 w-5",
                alerts.length === 0 ? "text-emerald-700" :
                criticalAlerts > 0 ? "text-red-700" :
                highAlerts > 0 ? "text-orange-700" : "text-amber-700"
              )} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Actions */}
      <Card className={cn(
        "border",
        overdueActions.length === 0 ? "border-emerald-200 bg-emerald-50" :
        overdueActions.length >= 5 ? "border-red-200 bg-red-50" :
        "border-amber-200 bg-amber-50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Overdue Actions
              </div>
              {actionsQuery.isLoading ? (
                <div className="flex items-center gap-1.5 mt-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  <span className="text-xs text-slate-400">Loading…</span>
                </div>
              ) : (
                <>
                  <div className={cn(
                    "text-3xl font-black",
                    overdueActions.length === 0 ? "text-emerald-600" :
                    overdueActions.length >= 5 ? "text-red-600" : "text-amber-600"
                  )}>
                    {overdueActions.length}
                  </div>
                  <div className={cn(
                    "text-xs mt-1 font-medium",
                    overdueActions.length === 0 ? "text-emerald-600" :
                    overdueActions.length >= 5 ? "text-red-600" : "text-amber-600"
                  )}>
                    {overdueActions.length === 0
                      ? "All actions on track"
                      : overdueActions.length === 1
                      ? "1 action requires attention"
                      : `${overdueActions.length} actions require attention`}
                  </div>
                </>
              )}
            </div>
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              overdueActions.length === 0 ? "bg-emerald-200" :
              overdueActions.length >= 5 ? "bg-red-200" : "bg-amber-200"
            )}>
              <Clock className={cn(
                "h-5 w-5",
                overdueActions.length === 0 ? "text-emerald-700" :
                overdueActions.length >= 5 ? "text-red-700" : "text-amber-700"
              )} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Home Climate */}
      <Card className={cn("border", CLIMATE_LEVEL_BG[climateLevel] ?? "border-slate-200 bg-white")}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Home Climate
              </div>
              {climateQuery.isLoading ? (
                <div className="flex items-center gap-1.5 mt-2">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  <span className="text-xs text-slate-400">Loading…</span>
                </div>
              ) : (
                <>
                  <div className={cn(
                    "text-3xl font-black capitalize",
                    CLIMATE_LEVEL_COLORS[climateLevel] ?? "text-slate-700"
                  )}>
                    {climateLevel}
                  </div>
                  {climateScore !== null && (
                    <div className="text-xs text-slate-500 mt-1">
                      Score: <span className="font-semibold text-slate-700">{climateScore}/100</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              climateLevel === "settled" ? "bg-emerald-200" :
              climateLevel === "stable" ? "bg-blue-200" :
              climateLevel === "unsettled" ? "bg-amber-200" :
              climateLevel === "concerning" ? "bg-orange-200" : "bg-red-200"
            )}>
              <Zap className={cn(
                "h-5 w-5",
                CLIMATE_LEVEL_COLORS[climateLevel] ?? "text-slate-600"
              )} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Inspection Action Plan ───────────────────────────────────────────────────

const ACTION_STATUS_CFG: Record<string, { label: string; colour: string; bg: string; icon: React.ElementType }> = {
  open:        { label: "Open",        colour: "text-blue-700",    bg: "bg-blue-50 border-blue-200",    icon: Clock },
  in_progress: { label: "In Progress", colour: "text-amber-700",   bg: "bg-amber-50 border-amber-200",  icon: Clock },
  completed:   { label: "Completed",   colour: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  overdue:     { label: "Overdue",     colour: "text-red-700",     bg: "bg-red-50 border-red-200",      icon: AlertTriangle },
  stalled:     { label: "Stalled",     colour: "text-orange-700",  bg: "bg-orange-50 border-orange-200", icon: AlertTriangle },
  cancelled:   { label: "Cancelled",   colour: "text-slate-500",   bg: "bg-slate-50 border-slate-200",  icon: FileText },
};

const ACTION_EXPORT_COLS: ExportColumn<ActionOutcome>[] = [
  { header: "Title", accessor: (r) => r.title },
  { header: "Action", accessor: (r) => r.what_was_agreed },
  { header: "Why It Matters", accessor: (r) => r.why_it_matters },
  { header: "Owner", accessor: (r) => r.owner_id ? getStaffName(r.owner_id) : "" },
  { header: "Due Date", accessor: (r) => r.due_date ?? "" },
  { header: "Status", accessor: (r) => ACTION_STATUS_CFG[r.status]?.label ?? r.status },
  { header: "What Was Done", accessor: (r) => r.what_was_done ?? "" },
  { header: "What Changed", accessor: (r) => r.what_changed ?? "" },
  { header: "Effectiveness", accessor: (r) => r.effectiveness ?? "" },
  { header: "Completed", accessor: (r) => r.completed_at ?? "" },
];

function ActionPlanPanel() {
  const allActionsQuery = useActionOutcomes();
  const updateAction = useUpdateActionOutcome();
  const [filter, setFilter] = useState<"all" | "open" | "completed" | "overdue">("open");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allActions = allActionsQuery.data?.data ?? [];
  const today = todayStr();

  // Derive overdue from due_date
  const actions = allActions.map((a) => {
    if (a.status === "open" || a.status === "in_progress") {
      if (a.due_date && a.due_date < today) {
        return { ...a, status: "overdue" as const };
      }
    }
    return a;
  });

  const filtered = actions.filter((a) => {
    switch (filter) {
      case "open": return a.status !== "completed" && a.status !== "cancelled";
      case "completed": return a.status === "completed";
      case "overdue": return a.status === "overdue";
      default: return true;
    }
  }).sort((a, b) => {
    const statusOrder: Record<string, number> = { overdue: 0, stalled: 1, in_progress: 2, open: 3, completed: 4, cancelled: 5 };
    return (statusOrder[a.status] ?? 6) - (statusOrder[b.status] ?? 6);
  });

  const openCount = actions.filter((a) => a.status !== "completed" && a.status !== "cancelled").length;
  const overdueCount = actions.filter((a) => a.status === "overdue").length;
  const completedCount = actions.filter((a) => a.status === "completed").length;

  const handleStatusChange = (id: string, newStatus: string) => {
    updateAction.mutate({ id, status: newStatus as ActionOutcome["status"] });
  };

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border bg-white p-3 text-center">
          <div className="text-xl font-bold text-slate-800 tabular-nums">{actions.length}</div>
          <div className="text-[10px] text-slate-500">Total Actions</div>
        </div>
        <div className={cn("rounded-xl border p-3 text-center", openCount > 0 ? "bg-blue-50 border-blue-200" : "bg-white")}>
          <div className={cn("text-xl font-bold tabular-nums", openCount > 0 ? "text-blue-700" : "text-slate-400")}>{openCount}</div>
          <div className="text-[10px] text-slate-500">Open</div>
        </div>
        <div className={cn("rounded-xl border p-3 text-center", overdueCount > 0 ? "bg-red-50 border-red-200" : "bg-white")}>
          <div className={cn("text-xl font-bold tabular-nums", overdueCount > 0 ? "text-red-700" : "text-slate-400")}>{overdueCount}</div>
          <div className="text-[10px] text-slate-500">Overdue</div>
        </div>
        <div className={cn("rounded-xl border p-3 text-center", completedCount > 0 ? "bg-emerald-50 border-emerald-200" : "bg-white")}>
          <div className={cn("text-xl font-bold tabular-nums", completedCount > 0 ? "text-emerald-700" : "text-slate-400")}>{completedCount}</div>
          <div className="text-[10px] text-slate-500">Completed</div>
        </div>
      </div>

      {/* Filter + export */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {(["open", "all", "overdue", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize",
                filter === f ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <ExportButton
          filename="inspection-action-plan"
          columns={ACTION_EXPORT_COLS}
          data={filtered}
          label="Export"
        />
      </div>

      {/* Action list */}
      {allActionsQuery.isLoading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm">Loading actions…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
          <div className="text-sm font-medium text-slate-600">
            {filter === "overdue" ? "No overdue actions" : filter === "completed" ? "No completed actions" : "No open actions"}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {filter === "open" ? "All actions have been resolved" : "Try a different filter"}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((action) => {
            const cfg = ACTION_STATUS_CFG[action.status] ?? ACTION_STATUS_CFG.agreed;
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === action.id;
            const daysUntilDue = action.due_date
              ? Math.ceil((new Date(action.due_date).getTime() - Date.now()) / 86400000)
              : null;

            return (
              <div key={action.id} className={cn(
                "rounded-2xl border bg-white overflow-hidden transition-all",
                action.status === "overdue" ? "border-l-4 border-l-red-500 border-red-200" :
                action.status === "stalled" ? "border-l-4 border-l-orange-400 border-orange-200" :
                "border-slate-200"
              )}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : action.id)}
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
                >
                  <div className={cn("rounded-lg p-1.5 shrink-0 mt-0.5 border", cfg.bg)}>
                    <StatusIcon className={cn("h-3.5 w-3.5", cfg.colour)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{action.what_was_agreed}</span>
                      <Badge className={cn("text-[9px] rounded-full border-0", cfg.bg, cfg.colour)}>
                        {cfg.label}
                      </Badge>
                      {action.effectiveness && (
                        <Badge className="text-[9px] rounded-full bg-violet-100 text-violet-700 border-0 capitalize">{action.effectiveness.replace(/_/g, " ")}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      {action.owner_id && (
                        <span>Owner: {getStaffName(action.owner_id)}</span>
                      )}
                      {action.due_date && (
                        <span className={cn(
                          "flex items-center gap-0.5",
                          action.status === "overdue" ? "text-red-600 font-medium" : ""
                        )}>
                          <Calendar className="h-3 w-3" />
                          {formatDate(action.due_date)}
                          {daysUntilDue !== null && daysUntilDue > 0 && (
                            <span className="text-slate-400">({daysUntilDue}d)</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                    {/* Why it matters */}
                    <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2">
                      <div className="text-[10px] font-semibold text-blue-600 mb-0.5">Why This Matters</div>
                      <div className="text-xs text-blue-800">{action.why_it_matters}</div>
                    </div>

                    {/* What was done */}
                    {action.what_was_done && (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
                        <div className="text-[10px] font-semibold text-emerald-600 mb-0.5">What Was Done</div>
                        <div className="text-xs text-emerald-800">{action.what_was_done}</div>
                      </div>
                    )}

                    {/* What changed */}
                    {action.what_changed && (
                      <div className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-2">
                        <div className="text-[10px] font-semibold text-violet-600 mb-0.5">What Changed</div>
                        <div className="text-xs text-violet-800">{action.what_changed}</div>
                      </div>
                    )}

                    {/* Effectiveness notes */}
                    {action.effectiveness_notes && (
                      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                        <div className="text-[10px] font-semibold text-slate-600 mb-0.5">Effectiveness Notes</div>
                        <div className="text-xs text-slate-800">{action.effectiveness_notes}</div>
                      </div>
                    )}

                    {/* Status change buttons */}
                    {action.status !== "completed" && action.status !== "cancelled" && (
                      <div className="flex items-center gap-2 pt-1">
                        {action.status === "open" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                            onClick={() => handleStatusChange(action.id, "in_progress")}
                            disabled={updateAction.isPending}
                          >
                            <Clock className="h-3 w-3 mr-1" />Start Progress
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleStatusChange(action.id, "completed")}
                          disabled={updateAction.isPending}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />Mark Complete
                        </Button>
                      </div>
                    )}

                    {/* Created info */}
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
                      <span>Created: {formatDate(action.created_at)}</span>
                      {action.due_date && (
                        <span>Due: {formatDate(action.due_date)}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Regulatory note */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Regulatory Note — </span>
        All actions arising from Ofsted inspections, Reg 44 visits, and internal quality audits must be tracked
        through to completion with evidence of impact. Ofsted inspectors will review the action plan during
        the opening meeting.
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type InspectionTab = "readiness" | "actions";

export default function InspectionPage() {
  const [activeTab, setActiveTab] = useState<InspectionTab>("readiness");
  const hcQuery = useHealthCheck();
  const hc = hcQuery.data?.data;

  const readinessAreas = hc
    ? [
        { area: "Outcomes for young people",           score: hc.overall,        status: hc.overall >= 85 ? "good" : "warn" },
        { area: "How well YP are helped & protected",  score: hc.safeguarding,   status: hc.safeguarding >= 85 ? "good" : "warn" },
        { area: "Leadership & management",             score: hc.staffing,       status: hc.staffing >= 85 ? "good" : "warn" },
        { area: "Training compliance",                 score: hc.compliance,     status: hc.compliance >= 85 ? "good" : "warn" },
        { area: "Supervision compliance",              score: hc.staffing,       status: hc.staffing >= 85 ? "good" : "warn" },
        { area: "Record keeping",                      score: hc.operational,    status: hc.operational >= 85 ? "good" : "warn" },
        { area: "Staffing & rotas",                    score: hc.staffing,       status: hc.staffing >= 85 ? "good" : "warn" },
        { area: "Policies current & signed",           score: hc.compliance,     status: hc.compliance >= 85 ? "good" : "warn" },
      ]
    : READINESS_AREAS_FALLBACK;

  const nextInspectionEstimate = daysFromNow(180);
  const avgReadiness = Math.round(readinessAreas.reduce((a, r) => a + r.score, 0) / readinessAreas.length);
  const warnings = readinessAreas.filter((r) => r.status === "warn").length;

  return (
    <PageShell
      title="Inspection Readiness"
      subtitle="Ofsted inspection tracker, readiness scoring, and evidence preparation"
      quickCreateContext={{ module: "inspection", defaultTaskCategory: "inspection", defaultFormType: "review_meeting_notes" }}
      actions={
        <div className="flex gap-2">
          <PrintButton title="Inspection Readiness" subtitle="Oak House — Ofsted Preparation Report" targetId="inspection-content" />
          <SmartUploadButton variant="inline" label="Upload Evidence" uploadContext="Inspection — inspection evidence upload" />
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Evidence packs are compiled from the Documents section. Visit Documents to prepare your pack."
          >
            <Download className="h-3.5 w-3.5 mr-1" />Evidence Pack
          </Button>
          <Button
            size="sm"
            disabled
            title="Inspection preparation checklists are available in the Audits section."
          >
            Prepare for Inspection
          </Button>
        </div>
      }
    >
      <div id="inspection-content" className="space-y-6">
        {/* ── Tab bar ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 bg-slate-100/80 rounded-2xl p-1.5 w-fit">
          {([
            { id: "readiness" as const, label: "Readiness", icon: TrendingUp },
            { id: "actions" as const, label: "Action Plan", icon: ClipboardList },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                activeTab === id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "readiness" && (
        <div className="space-y-6">
        {/* ── ARIA Narrative Generator (hero) ─────────────────────────── */}
        <NarrativeGenerator />

        {/* ── Current grade & next inspection cards ───────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 col-span-2 lg:col-span-1">
            <div className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider mb-1">Current Ofsted Grade</div>
            <div className="text-4xl font-black text-blue-700">{HOME.last_inspection_grade}</div>
            <div className="text-xs text-blue-500 mt-1">{HOME.last_inspection_date}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Readiness Score</div>
            <div className={cn("mt-1 text-3xl font-bold", avgReadiness >= 85 ? "text-emerald-600" : avgReadiness >= 70 ? "text-amber-600" : "text-red-600")}>
              {avgReadiness}%
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{warnings} areas need attention</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Est. Next Inspection</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{formatDate(nextInspectionEstimate)}</div>
            <div className="text-xs text-slate-400 mt-0.5">±3 months (rolling)</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reg 44 Visits</div>
            <div className="mt-1 text-3xl font-bold text-violet-600">3</div>
            <div className="text-xs text-slate-400 mt-0.5">This year</div>
          </div>
        </div>

        {/* ── Live Intelligence Summary ────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-slate-700">Live Intelligence</h2>
            <span className="text-xs text-slate-400">— real-time signals from across the home</span>
          </div>
          <LiveIntelligenceSummary />
        </div>

        {/* ── Readiness + History ──────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Readiness breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />Inspection Readiness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {readinessAreas.map(({ area, score, status }) => (
                  <div key={area} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={cn("text-slate-700", status === "warn" ? "text-amber-700 font-medium" : "")}>{area}</span>
                      <span className={cn("font-semibold", score >= 85 ? "text-emerald-600" : score >= 70 ? "text-amber-600" : "text-red-600")}>{score}%</span>
                    </div>
                    <Progress
                      value={score}
                      color={score >= 85 ? "bg-emerald-500" : score >= 70 ? "bg-amber-500" : "bg-red-500"}
                      className="h-1.5"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Inspection history */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />Inspection History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {INSPECTION_HISTORY.map((insp) => (
                  <div key={insp.date} className="rounded-xl border border-slate-200 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{insp.type}</span>
                      <Badge className={cn("text-[9px] rounded-full border", GRADE_COLORS[insp.grade] || "bg-slate-100")}>
                        {insp.grade}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500">{formatDate(insp.date)} · {insp.inspector}</div>
                    <div className="text-xs text-slate-600">{insp.actionsComplete}/{insp.actions} actions completed</div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled
                      title="Inspection reports are stored in the Documents section."
                    >
                      <FileText className="h-3 w-3 mr-1" />View report
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
        )}

        {activeTab === "actions" && <ActionPlanPanel />}
      </div>
    </PageShell>
  );
}
