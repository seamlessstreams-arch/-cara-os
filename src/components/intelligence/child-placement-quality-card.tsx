"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD PLACEMENT QUALITY INTELLIGENCE CARD
// Per-child placement quality: mood trajectory, daily log engagement,
// key work profile, welfare checks, activities, stability, and ARIA insights.
// CHR 2015 Reg 5, 6, 7, 9. SCCIF: "Experiences and progress of children."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, Home, AlertCircle,
  Sparkles, TrendingUp, TrendingDown, Minus, Activity,
  Users, Calendar, Smile, Target, ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildPlacementQuality } from "@/hooks/use-child-placement-quality";
import type { PlacementQuality } from "@/lib/engines/child-placement-quality-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const QUALITY_STYLES: Record<PlacementQuality, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  concerning:        { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", label: "CONCERNING" },
  poor:              { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "POOR" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-600",  border: "border-slate-300",  label: "NO DATA" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-red-200 bg-red-50 text-red-800",
  soon: "border-amber-200 bg-amber-50 text-amber-800",
  planned: "border-blue-200 bg-blue-50 text-blue-800",
};

function moodColor(score: number): string {
  if (score >= 7) return "text-green-600";
  if (score >= 5) return "text-amber-600";
  return "text-red-600";
}

function moodBg(score: number): string {
  if (score >= 7) return "bg-green-50";
  if (score >= 5) return "bg-amber-50";
  return "bg-red-50";
}

const TREND_ICON = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
  insufficient_data: Minus,
};

const TREND_TEXT = {
  improving: "text-green-600",
  stable: "text-slate-500",
  declining: "text-red-600",
  insufficient_data: "text-slate-400",
};

// ── Component ───────────────────────────────────────────────────────────────

export function ChildPlacementQualityCard({ childId }: { childId: string }) {
  const { data, isLoading } = useChildPlacementQuality(childId);

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

  const qualityStyle = QUALITY_STYLES[d.placement_quality] ?? QUALITY_STYLES.insufficient_data;
  const mt = d.mood_trajectory;
  const eng = d.engagement;
  const kw = d.key_work;
  const welf = d.welfare;
  const act = d.activities;
  const stab = d.stability;

  const TrendIcon = TREND_ICON[mt.trend];

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Home className="h-4 w-4 text-teal-500" />
            <span className="text-slate-900">Placement Quality</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", qualityStyle.bg, qualityStyle.text, qualityStyle.border)}>
              {qualityStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{d.quality_score}%</span>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Mood + Stability Row */}
        <div className="grid grid-cols-2 gap-2">
          <div className={cn("text-center rounded-lg p-2", mt.average_30d > 0 ? moodBg(mt.average_30d) : "bg-slate-50")}>
            <div className="flex items-center justify-center gap-1">
              <Smile className={cn("h-4 w-4", mt.average_30d > 0 ? moodColor(mt.average_30d) : "text-slate-400")} />
              <p className={cn("text-lg font-bold tabular-nums", mt.average_30d > 0 ? moodColor(mt.average_30d) : "text-slate-400")}>
                {mt.average_30d > 0 ? `${mt.average_30d}/10` : "—"}
              </p>
              <TrendIcon className={cn("h-3.5 w-3.5", TREND_TEXT[mt.trend])} />
            </div>
            <p className="text-[10px] text-muted-foreground">Mood (30d avg)</p>
            {mt.trend !== "insufficient_data" && (
              <p className={cn("text-[10px] capitalize", TREND_TEXT[mt.trend])}>{mt.trend}</p>
            )}
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-teal-600">{stab.days_in_placement}d</p>
            <p className="text-[10px] text-muted-foreground">In Placement</p>
            {stab.is_long_term && <p className="text-[10px] text-green-600">Long-term</p>}
            {stab.unplanned_moves > 0 && <p className="text-[10px] text-red-600">{stab.unplanned_moves} disruption{stab.unplanned_moves !== 1 ? "s" : ""}</p>}
          </div>
        </div>

        {/* Engagement KPIs */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className={cn("text-lg font-bold tabular-nums", eng.daily_log_count_30d >= 15 ? "text-green-600" : eng.daily_log_count_30d >= 5 ? "text-amber-600" : "text-red-600")}>{eng.daily_log_count_30d}</p>
            <p className="text-[10px] text-muted-foreground">Logs (30d)</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className={cn("text-lg font-bold tabular-nums", kw.sessions_30d >= 3 ? "text-green-600" : kw.sessions_30d >= 1 ? "text-amber-600" : "text-red-600")}>{kw.sessions_30d}</p>
            <p className="text-[10px] text-muted-foreground">Key Work</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className={cn("text-lg font-bold tabular-nums", welf.checks_30d >= 5 ? "text-green-600" : welf.checks_30d >= 1 ? "text-amber-600" : "text-slate-400")}>{welf.checks_30d}</p>
            <p className="text-[10px] text-muted-foreground">Welfare</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className={cn("text-lg font-bold tabular-nums", act.activities_30d >= 3 ? "text-green-600" : act.activities_30d >= 1 ? "text-amber-600" : "text-slate-400")}>{act.activities_30d}</p>
            <p className="text-[10px] text-muted-foreground">Activities</p>
          </div>
        </div>

        {/* Key Work Detail */}
        {kw.sessions_30d > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 flex items-center gap-2 text-xs">
              <Users className={cn("h-3.5 w-3.5 shrink-0", kw.engagement_rate >= 80 ? "text-green-500" : "text-amber-500")} />
              <div className="min-w-0">
                <p className="font-medium text-slate-700">KW Engagement</p>
                <p className="text-[10px] text-muted-foreground">
                  <span className={kw.engagement_rate >= 80 ? "text-green-600" : "text-amber-600"}>
                    {kw.engagement_rate}% engaged
                  </span>
                </p>
              </div>
            </div>
            <div className="rounded border p-2 flex items-center gap-2 text-xs">
              <TrendingUp className={cn("h-3.5 w-3.5 shrink-0", kw.mood_improvement_rate >= 50 ? "text-green-500" : "text-amber-500")} />
              <div className="min-w-0">
                <p className="font-medium text-slate-700">Mood Uplift</p>
                <p className="text-[10px] text-muted-foreground">
                  <span className={kw.mood_improvement_rate >= 50 ? "text-green-600" : "text-amber-600"}>
                    {kw.mood_improvement_rate}% sessions
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top Key Work Themes */}
        {(kw.top_themes?.length ?? 0) > 0 && (
          <div className="rounded border border-teal-200 bg-teal-50 p-2 text-xs">
            <p className="font-medium text-teal-700 flex items-center gap-1 mb-1">
              <Target className="h-3 w-3" />
              Key Work Themes
            </p>
            <div className="flex flex-wrap gap-1">
              {(kw.top_themes ?? []).slice(0, 5).map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-white/60 rounded px-1.5 py-0.5 text-[10px] text-teal-800 border border-teal-200">
                  {t.theme} <span className="font-bold">{t.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Log Entry Type Spread */}
        {eng.entry_type_spread.length > 0 && (
          <div className="rounded border border-slate-200 bg-slate-50 p-2 text-xs">
            <p className="font-medium text-slate-700 flex items-center gap-1 mb-1">
              <ClipboardCheck className="h-3 w-3" />
              Recording Coverage ({eng.staff_variety_30d} staff)
            </p>
            <div className="flex flex-wrap gap-1">
              {(eng.entry_type_spread ?? []).map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-white/60 rounded px-1.5 py-0.5 text-[10px] text-slate-700 border border-slate-200 capitalize">
                  {t.type} <span className="font-bold">{t.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {d.strengths.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Strengths ({d.strengths.length})
            </p>
            {d.strengths.slice(0, 3).map((s, i) => (
              <div key={i} className="rounded border border-green-200 bg-green-50 p-2.5 text-xs text-green-800 leading-relaxed">
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Concerns */}
        {d.concerns.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Concerns ({d.concerns.length})
            </p>
            {d.concerns.slice(0, 3).map((c, i) => (
              <div key={i} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 leading-relaxed">
                {c}
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {d.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Recommendations ({d.recommendations.length})
            </p>
            {d.recommendations.slice(0, 3).map((rec) => (
              <div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_STYLES[rec.urgency] ?? REC_STYLES.planned)}>
                <div className="flex items-start justify-between gap-2">
                  <span>{rec.recommendation}</span>
                  {rec.regulatory_ref && (
                    <span className="text-[10px] font-mono shrink-0 opacity-60">{rec.regulatory_ref}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ARIA Placement Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Placement Intelligence
            </p>
            {d.insights.slice(0, 3).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
