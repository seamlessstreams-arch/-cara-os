"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraFeedbackStats
//
// Shows aggregated feedback analytics — overall satisfaction rate, common
// negative tags, and per-command ratings. Used on the Cara management and
// governance pages to track output quality over time.
//
// Usage:
//   <CaraFeedbackStats homeId="demo-home" days={30} />
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Sparkles,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface FeedbackStats {
  totalFeedback: number;
  positiveCount: number;
  negativeCount: number;
  satisfactionRate: number;
  topNegativeTags: Array<{ tag: string; count: number }>;
  commandBreakdown: Array<{
    commandId: string;
    positive: number;
    negative: number;
    total: number;
  }>;
}

// ── Pure helpers (exported for testing) ────────────────────────────────────

export function computeSatisfactionRate(positive: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((positive / total) * 100);
}

export function formatTagLabel(tag: string): string {
  return tag.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatCommandLabel(commandId: string): string {
  return commandId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Demo data ──────────────────────────────────────────────────────────────

function getDemoStats(): FeedbackStats {
  return {
    totalFeedback: 47,
    positiveCount: 38,
    negativeCount: 9,
    satisfactionRate: 81,
    topNegativeTags: [
      { tag: "too_long", count: 4 },
      { tag: "tone", count: 3 },
      { tag: "missing_context", count: 2 },
      { tag: "inaccurate", count: 1 },
    ],
    commandBreakdown: [
      { commandId: "improve_writing", positive: 12, negative: 2, total: 14 },
      { commandId: "summarise_record", positive: 8, negative: 1, total: 9 },
      { commandId: "extract_tasks", positive: 7, negative: 0, total: 7 },
      { commandId: "draft_oversight", positive: 6, negative: 3, total: 9 },
      { commandId: "simplify_language", positive: 5, negative: 3, total: 8 },
    ],
  };
}

// ── Component ──────────────────────────────────────────────────────────────

interface CaraFeedbackStatsProps {
  homeId?: string;
  days?: number;
  className?: string;
}

export function CaraFeedbackStats({
  homeId,
  days = 30,
  className,
}: CaraFeedbackStatsProps) {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, fetch from /api/cara/feedback/stats
    const timer = setTimeout(() => {
      setStats(getDemoStats());
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [homeId, days]);

  if (loading || !stats) {
    return (
      <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-white p-5 animate-pulse h-64", className)} />
    );
  }

  const satisfactionColour =
    stats.satisfactionRate >= 80
      ? "text-emerald-700"
      : stats.satisfactionRate >= 60
        ? "text-amber-700"
        : "text-red-700";

  const satisfactionBg =
    stats.satisfactionRate >= 80
      ? "bg-emerald-50"
      : stats.satisfactionRate >= 60
        ? "bg-amber-50"
        : "bg-red-50";

  return (
    <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden", className)}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-[var(--cs-cara-gold)]" />
        <h3 className="text-sm font-bold text-[var(--cs-navy)]">
          Cara Feedback Analytics
        </h3>
        <span className="text-[10px] text-[var(--cs-text-muted)]">
          Last {days} days
        </span>
      </div>

      {/* Top-level stats */}
      <div className="px-5 pb-3 grid grid-cols-3 gap-3">
        <div className={cn("rounded-xl px-3 py-2.5 text-center", satisfactionBg)}>
          <div className={cn("text-xl font-bold tabular-nums", satisfactionColour)}>
            {stats.satisfactionRate}%
          </div>
          <div className="text-[9px] text-[var(--cs-text-muted)] font-medium">
            Satisfaction
          </div>
        </div>
        <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1">
            <ThumbsUp className="h-3 w-3 text-emerald-600" />
            <span className="text-xl font-bold text-emerald-700 tabular-nums">
              {stats.positiveCount}
            </span>
          </div>
          <div className="text-[9px] text-[var(--cs-text-muted)] font-medium">Helpful</div>
        </div>
        <div className="rounded-xl bg-red-50 px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1">
            <ThumbsDown className="h-3 w-3 text-red-600" />
            <span className="text-xl font-bold text-red-700 tabular-nums">
              {stats.negativeCount}
            </span>
          </div>
          <div className="text-[9px] text-[var(--cs-text-muted)] font-medium">Needs work</div>
        </div>
      </div>

      {/* Top negative tags */}
      {stats.topNegativeTags.length > 0 && (
        <div className="px-5 pb-3">
          <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">
            Common Issues
          </p>
          <div className="flex flex-wrap gap-1.5">
            {stats.topNegativeTags.map((t) => (
              <span
                key={t.tag}
                className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-[9px] font-medium text-red-700"
              >
                {formatTagLabel(t.tag)}
                <span className="text-red-400">×{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Per-command breakdown */}
      <div className="px-5 pb-5">
        <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">
          By Command
        </p>
        <div className="space-y-2">
          {stats.commandBreakdown.map((cmd) => {
            const pct = cmd.total > 0 ? Math.round((cmd.positive / cmd.total) * 100) : 0;
            return (
              <div key={cmd.commandId} className="flex items-center gap-3">
                <span className="text-[10px] text-[var(--cs-text-secondary)] w-28 truncate font-medium">
                  {formatCommandLabel(cmd.commandId)}
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[9px] text-[var(--cs-text-muted)] w-8 text-right tabular-nums">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Expose for testing
export const _testing = { computeSatisfactionRate, formatTagLabel, formatCommandLabel, getDemoStats };
