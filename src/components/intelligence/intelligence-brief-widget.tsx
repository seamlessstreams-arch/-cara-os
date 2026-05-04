"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INTELLIGENCE BRIEF WIDGET
// Compact intelligence bar: home climate, active alerts, overdue actions,
// and an inline Morning Brief powered by ARIA streaming.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef } from "react";
import {
  Brain, Sparkles, X, Loader2, AlertTriangle, TrendingDown, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePatternAlerts, useActionOutcomes, useHomeClimate } from "@/hooks/use-intelligence";
import { cn } from "@/lib/utils";

// ── Climate helpers ───────────────────────────────────────────────────────────

function getClimateLevel(score: number): string {
  if (score >= 85) return "Settled";
  if (score >= 70) return "Stable";
  if (score >= 55) return "Unsettled";
  if (score >= 40) return "Concerning";
  return "Critical";
}

function getClimatePillClasses(score: number): string {
  if (score >= 85) return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (score >= 70) return "bg-blue-50 border-blue-200 text-blue-700";
  if (score >= 55) return "bg-amber-50 border-amber-200 text-amber-700";
  if (score >= 40) return "bg-orange-50 border-orange-200 text-orange-700";
  return "bg-red-50 border-red-200 text-red-700";
}

// ── Stat Pill ─────────────────────────────────────────────────────────────────

interface StatPillProps {
  label: string;
  value: string | number;
  pillClass: string;
  icon?: React.ReactNode;
}

function StatPill({ label, value, pillClass, icon }: StatPillProps) {
  return (
    <div className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border", pillClass)}>
      {icon}
      <span className="text-[10px] font-medium opacity-75">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────────

export function IntelligenceBriefWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // ── Data hooks ────────────────────────────────────────────────────────────

  const climateQ = useHomeClimate();
  const alertsQ = usePatternAlerts({ status: "active" });
  const overdueQ = useActionOutcomes({ status: "overdue" });

  const climateScore = climateQ.data?.data?.latest?.overall_climate_score ?? null;
  const activeAlerts = alertsQ.data?.data ?? [];
  const overdueActions = overdueQ.data?.data ?? [];

  const hasHighAlerts = activeAlerts.some(
    (a) => a.severity === "high" || a.severity === "critical"
  );

  // Alert pill colour
  const alertPillClass =
    activeAlerts.length === 0
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : hasHighAlerts
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-amber-50 border-amber-200 text-amber-700";

  // Overdue pill colour
  const overduePillClass =
    overdueActions.length === 0
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : "bg-red-50 border-red-200 text-red-700";

  // ── Today date label ──────────────────────────────────────────────────────

  const todayLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  // ── Morning Brief streaming ───────────────────────────────────────────────

  async function handleMorningBrief() {
    if (isOpen && !isDone && isGenerating) {
      // Stop streaming
      abortRef.current?.abort();
      return;
    }

    // Toggle panel
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    setOutput("");
    setIsDone(false);
    setIsGenerating(true);

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/v1/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          mode: "assist",
          style: "concise_manager",
          stream: true,
          page_context: "dashboard",
          user_role: "registered_manager",
          question:
            "Give me a concise morning intelligence brief for Oak House. Cover: active pattern alerts, home climate, overdue actions, and what I should prioritise today. Be specific and actionable.",
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`API error ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
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
        setOutput("An error occurred while generating the brief. Please try again.");
        setIsDone(true);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  function handleClose() {
    abortRef.current?.abort();
    setIsOpen(false);
    setOutput("");
    setIsDone(false);
    setIsGenerating(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 overflow-hidden">
      {/* ── Bar row ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">

        {/* Left: ARIA label */}
        <div className="flex items-center gap-2 min-w-0">
          <Brain className="h-4 w-4 text-violet-600 shrink-0" />
          <div>
            <div className="text-[11px] font-semibold text-violet-700 leading-none">
              ARIA Intelligence
            </div>
            <div className="text-[10px] text-slate-400 leading-none mt-0.5">{todayLabel}</div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-violet-200 hidden sm:block" />

        {/* Middle: stat pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Home Climate */}
          {climateScore !== null ? (
            <StatPill
              label="Home Climate"
              value={`${Math.round(climateScore)} · ${getClimateLevel(climateScore)}`}
              pillClass={getClimatePillClasses(climateScore)}
            />
          ) : (
            <StatPill label="Home Climate" value="—" pillClass="bg-slate-50 border-slate-200 text-slate-500" />
          )}

          {/* Active Alerts */}
          <StatPill
            label="Alerts"
            value={alertsQ.isLoading ? "…" : activeAlerts.length}
            pillClass={alertPillClass}
            icon={
              activeAlerts.length > 0 ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )
            }
          />

          {/* Overdue Actions */}
          <StatPill
            label="Overdue Actions"
            value={overdueQ.isLoading ? "…" : overdueActions.length}
            pillClass={overduePillClass}
            icon={
              overdueActions.length > 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )
            }
          />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: Morning Brief button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleMorningBrief}
          className={cn(
            "gap-1.5 text-xs font-semibold border-violet-300 text-violet-700 hover:bg-violet-100 hover:border-violet-400",
            isOpen && "bg-violet-100 border-violet-400"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Stop
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Morning Brief
            </>
          )}
        </Button>
      </div>

      {/* ── Expansion panel ───────────────────────────────────────────────── */}
      {isOpen && (
        <div className="border-t border-violet-200 bg-white/70 px-4 py-3">
          {/* Header row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />
              Morning Brief
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Close brief"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Streaming output */}
          {isGenerating && !output && (
            <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
              Generating morning brief…
            </div>
          )}

          {output && (
            <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap font-mono text-slate-700 leading-relaxed">
              {output}
              {isGenerating && (
                <span className="inline-block ml-1 h-3.5 w-0.5 bg-violet-500 animate-pulse" />
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-2 text-[10px] text-slate-400">
            AI-generated — verify against live data
          </div>
        </div>
      )}
    </div>
  );
}
