"use client";

// ═════════════════════════════════════════════════════════════════���════════════
// CaraPatternAlert
//
// Dashboard widget surfacing detected behavioural patterns for a specific
// child or across the home. Shows high/medium significance patterns with
// suggested actions, risk trend indicators, and positive improvements.
// Now backed by the deterministic pattern-detection engine.
// ═══════��═══════════════════════════════���══════════════════════════════════════

import React, { useEffect, useState } from "react";
import {
  Loader2, BrainCircuit, AlertTriangle, TrendingUp, TrendingDown,
  Minus, ChevronDown, ChevronUp, RefreshCw, Sparkles, Activity,
  Heart, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface PatternEvidence {
  eventIds: string[];
  dates: string[];
  summary: string;
}

interface DetectedPattern {
  id: string;
  type: string;
  confidence: number;
  significance: "high" | "medium" | "low";
  childId: string;
  title: string;
  description: string;
  evidence: PatternEvidence[];
  suggestedActions: string[];
  frequency: number;
}

interface RiskIndicator {
  category: string;
  trend: "increasing" | "stable" | "decreasing";
  currentRate: number;
  previousRate: number;
  percentChange: number;
}

interface PatternAnalysis {
  childId: string;
  analysisDate: string;
  windowDays: number;
  totalEvents: number;
  patternsDetected: DetectedPattern[];
  riskIndicators: RiskIndicator[];
  positivePatterns: DetectedPattern[];
  summary: string;
}

// ── Pattern type config ─────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ReactNode> = {
  temporal: <Activity className="h-3 w-3" />,
  sequential: <ArrowRight className="h-3 w-3" />,
  escalation: <TrendingUp className="h-3 w-3" />,
  correlation: <BrainCircuit className="h-3 w-3" />,
  cyclical: <RefreshCw className="h-3 w-3" />,
  improvement: <Heart className="h-3 w-3" />,
};

const SIGNIFICANCE_CONFIG = {
  high: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  low: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" },
};

// ── Component ──────────────────────────────────���─────────────────────────────

export function CaraPatternAlert({
  childId = "child_jordan",
  homeId = "home_oak",
  days = 28,
}: {
  childId?: string;
  homeId?: string;
  days?: number;
}) {
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  async function fetchPatterns() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cara/pattern-detection?childId=${childId}&homeId=${homeId}&days=${days}`);
      const json = await res.json();
      if (json.ok && json.data) setAnalysis(json.data);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPatterns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, homeId, days]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--cs-cara-gold)]" />
          <span className="text-xs text-[var(--cs-text-muted)]">Detecting behavioural patterns...</span>
        </div>
      </div>
    );
  }

  if (!analysis || (analysis.patternsDetected.length === 0 && analysis.positivePatterns.length === 0)) {
    return (
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-[var(--cs-text-gentle)]" />
          <span className="text-xs text-[var(--cs-text-muted)]">No significant patterns detected in the last {days} days</span>
        </div>
      </div>
    );
  }

  const highPatterns = analysis.patternsDetected.filter((p) => p.significance === "high");
  const allPatterns = expanded ? analysis.patternsDetected : highPatterns.slice(0, 3);

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <BrainCircuit className="h-4 w-4 text-[var(--cs-navy)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Pattern Intelligence</h3>
              <p className="text-[10px] text-[var(--cs-text-muted)]">
                {analysis.totalEvents} events analysed over {analysis.windowDays} days
              </p>
            </div>
          </div>
          {highPatterns.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              {highPatterns.length} alert{highPatterns.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 py-2.5 border-b border-[var(--cs-border)] text-[10px] text-[var(--cs-text-secondary)]">
        {analysis.summary}
      </div>

      {/* Patterns list */}
      <div className="divide-y divide-[var(--cs-border)]">
        {allPatterns.map((pattern) => {
          const sigCfg = SIGNIFICANCE_CONFIG[pattern.significance];
          const isExpanded = expandedPattern === pattern.id;

          return (
            <div key={pattern.id} className="px-5 py-2.5">
              <button
                onClick={() => setExpandedPattern(isExpanded ? null : pattern.id)}
                className="w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full shrink-0", sigCfg.dot)} />
                  <span className="text-[var(--cs-text-gentle)]">{TYPE_ICONS[pattern.type]}</span>
                  <span className="text-xs font-medium text-[var(--cs-navy)] flex-1">{pattern.title}</span>
                  <span className="text-[10px] text-[var(--cs-text-muted)] tabular-nums">{pattern.confidence}%</span>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-2 ml-4 space-y-2">
                  <p className="text-[10px] text-[var(--cs-text-secondary)]">{pattern.description}</p>

                  {pattern.evidence[0] && (
                    <div className="text-[10px] text-[var(--cs-text-gentle)] italic">
                      {pattern.evidence[0].summary}
                    </div>
                  )}

                  <div className="space-y-1">
                    {pattern.suggestedActions.slice(0, 3).map((action, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <Sparkles className="h-2.5 w-2.5 text-[var(--cs-cara-gold)] mt-0.5 shrink-0" />
                        <span className="text-[10px] text-[var(--cs-text-secondary)]">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Positive patterns */}
      {analysis.positivePatterns.length > 0 && (
        <div className="px-5 py-2.5 border-t border-[var(--cs-border)] bg-emerald-50/30">
          <div className="text-[10px] font-semibold text-emerald-700 uppercase mb-1">Positive trends</div>
          {analysis.positivePatterns.slice(0, 2).map((p) => (
            <div key={p.id} className="flex items-center gap-2 mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] text-[var(--cs-text-secondary)]">{p.title}</span>
              <span className="text-[10px] text-emerald-600 font-medium tabular-nums ml-auto">{p.confidence}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Risk indicators */}
      {expanded && analysis.riskIndicators.length > 0 && (
        <div className="px-5 py-2.5 border-t border-[var(--cs-border)]">
          <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase mb-1.5">Risk trends</div>
          <div className="space-y-1">
            {analysis.riskIndicators.slice(0, 5).map((ri, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                {ri.trend === "increasing" ? (
                  <TrendingUp className="h-3 w-3 text-red-500" />
                ) : ri.trend === "decreasing" ? (
                  <TrendingDown className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Minus className="h-3 w-3 text-slate-400" />
                )}
                <span className="text-[var(--cs-text-secondary)] capitalize">{ri.category.replace(/_/g, " ")}</span>
                <span className="ml-auto tabular-nums font-medium text-[var(--cs-text-muted)]">
                  {ri.currentRate}/wk
                </span>
                {ri.percentChange !== 0 && (
                  <span className={cn("tabular-nums font-medium", ri.percentChange > 0 ? "text-red-600" : "text-emerald-600")}>
                    {ri.percentChange > 0 ? "+" : ""}{ri.percentChange}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-2 border-t border-[var(--cs-border)] flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] gap-1 h-7"
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              All {analysis.patternsDetected.length} patterns <ChevronDown className="h-3 w-3" />
            </>
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={fetchPatterns} className="text-[10px] gap-1 h-7">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>
    </div>
  );
}
