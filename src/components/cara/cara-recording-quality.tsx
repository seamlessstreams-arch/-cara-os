"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraRecordingQuality
//
// Dashboard widget showing recording quality metrics for the home.
// Fetches batch quality data from /api/cara/recording-quality and displays:
//   - Overall average score with grade badge
//   - Grade distribution bar
//   - Child voice presence %
//   - Actionable content %
//   - Top suggestions for improvement
//   - Top strengths across the team
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from "react";
import {
  Loader2, PenLine, Quote, Lightbulb, TrendingUp,
  ChevronDown, ChevronUp, RefreshCw, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface BatchData {
  averageScore: number;
  averageGrade: string;
  totalRecords: number;
  childVoicePresent: number;
  childVoicePercent: number;
  actionablePercent: number;
  gradeDistribution: Record<string, number>;
  topSuggestions: string[];
  topStrengths: string[];
}

interface IndividualScore {
  index: number;
  entryType: string;
  overall: number;
  grade: string;
  wordCount: number;
  hasChildVoice: boolean;
  hasActionableContent: boolean;
}

interface QualityResponse {
  batch: BatchData;
  individual: IndividualScore[];
  period: { days: number; homeId: string; childId?: string };
}

// ── Grade config ────────────────────────────────────────────────────────────

const GRADE_CONFIG: Record<string, { label: string; bg: string; text: string; bar: string }> = {
  excellent: { label: "Excellent", bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
  good: { label: "Good", bg: "bg-blue-50", text: "text-blue-700", bar: "bg-blue-500" },
  adequate: { label: "Adequate", bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500" },
  needs_improvement: { label: "Needs Improvement", bg: "bg-orange-50", text: "text-orange-700", bar: "bg-orange-500" },
  insufficient: { label: "Insufficient", bg: "bg-red-50", text: "text-red-700", bar: "bg-red-500" },
};

// ── Component ────────────────────────────────────────────────────────────────

export function CaraRecordingQuality({ homeId = "home_oak", days = 7 }: { homeId?: string; days?: number }) {
  const [data, setData] = useState<QualityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  async function fetchQuality() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cara/recording-quality?homeId=${homeId}&days=${days}`);
      const json = await res.json();
      if (json.ok && json.data) setData(json.data);
    } catch {
      // Silent — widget is supplementary
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuality();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId, days]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--cs-cara-gold)]" />
          <span className="text-xs text-[var(--cs-text-muted)]">Analysing recording quality...</span>
        </div>
      </div>
    );
  }

  if (!data || data.batch.totalRecords === 0) {
    return (
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5">
        <div className="flex items-center gap-2">
          <PenLine className="h-4 w-4 text-[var(--cs-text-gentle)]" />
          <span className="text-xs text-[var(--cs-text-muted)]">No recordings to analyse in the last {days} days</span>
        </div>
      </div>
    );
  }

  const { batch } = data;
  const gradeConfig = GRADE_CONFIG[batch.averageGrade] ?? GRADE_CONFIG.adequate;

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--cs-border)] bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-100 rounded-lg">
              <PenLine className="h-4 w-4 text-[var(--cs-navy)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Recording Quality</h3>
              <p className="text-[10px] text-[var(--cs-text-muted)]">{batch.totalRecords} entries over {days} days</p>
            </div>
          </div>
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", gradeConfig.bg, gradeConfig.text)}>
            {batch.averageScore}% {gradeConfig.label}
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="px-5 py-3 border-b border-[var(--cs-border)]">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", gradeConfig.bar)}
              style={{ width: `${batch.averageScore}%` }}
            />
          </div>
          <span className="text-xs font-medium text-[var(--cs-text-secondary)] tabular-nums w-10 text-right">
            {batch.averageScore}%
          </span>
        </div>

        {/* Grade distribution mini-bar */}
        <div className="flex gap-0.5 mt-2 h-1.5 rounded-full overflow-hidden">
          {Object.entries(batch.gradeDistribution).map(([grade, count]) => {
            if (count === 0) return null;
            const cfg = GRADE_CONFIG[grade];
            const pct = (count / batch.totalRecords) * 100;
            return (
              <div
                key={grade}
                className={cn("h-full transition-all", cfg?.bar ?? "bg-slate-300")}
                style={{ width: `${pct}%` }}
                title={`${cfg?.label ?? grade}: ${count}`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-[var(--cs-text-gentle)]">
            {batch.gradeDistribution.excellent + (batch.gradeDistribution.good ?? 0)} of {batch.totalRecords} rated good or above
          </span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="px-5 py-3 border-b border-[var(--cs-border)] grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Quote className="h-3.5 w-3.5 text-purple-500" />
          <div>
            <div className="text-xs font-semibold text-[var(--cs-navy)]">{batch.childVoicePercent}%</div>
            <div className="text-[10px] text-[var(--cs-text-muted)]">Child voice present</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          <div>
            <div className="text-xs font-semibold text-[var(--cs-navy)]">{batch.actionablePercent}%</div>
            <div className="text-[10px] text-[var(--cs-text-muted)]">Include actions</div>
          </div>
        </div>
      </div>

      {/* Top suggestions */}
      {batch.topSuggestions.length > 0 && (
        <div className="px-5 py-3 border-b border-[var(--cs-border)]">
          <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase mb-1.5">Team improvement areas</div>
          <div className="space-y-1.5">
            {batch.topSuggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)] mt-0.5 shrink-0" />
                <span className="text-[10px] text-[var(--cs-text-secondary)] leading-tight">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top strengths */}
      {batch.topStrengths.length > 0 && (
        <div className="px-5 py-3 border-b border-[var(--cs-border)]">
          <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase mb-1.5">Team strengths</div>
          <div className="space-y-1.5">
            {batch.topStrengths.map((s, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <TrendingUp className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-[10px] text-[var(--cs-text-secondary)] leading-tight">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded — individual scores */}
      {expanded && data.individual.length > 0 && (
        <div className="px-5 py-3 border-b border-[var(--cs-border)]">
          <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Individual entries</div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {data.individual.map((entry) => {
              const cfg = GRADE_CONFIG[entry.grade] ?? GRADE_CONFIG.adequate;
              return (
                <div key={entry.index} className="flex items-center gap-2 text-[10px]">
                  <div className={cn("h-2 w-2 rounded-full shrink-0", cfg.bar)} />
                  <span className="text-[var(--cs-text-secondary)] capitalize">{entry.entryType.replace(/_/g, " ")}</span>
                  <span className="text-[var(--cs-text-gentle)]">{entry.wordCount}w</span>
                  {entry.hasChildVoice && <Quote className="h-2.5 w-2.5 text-purple-400" />}
                  <span className={cn("ml-auto font-medium tabular-nums", cfg.text)}>{entry.overall}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-2 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-[10px] gap-1 h-7">
          {expanded ? <>Hide entries <ChevronUp className="h-3 w-3" /></> : <>Show entries <ChevronDown className="h-3 w-3" /></>}
        </Button>
        <Button variant="ghost" size="sm" onClick={fetchQuality} className="text-[10px] gap-1 h-7">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>
    </div>
  );
}
