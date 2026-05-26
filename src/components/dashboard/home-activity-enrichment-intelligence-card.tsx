"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ACTIVITY & ENRICHMENT INTELLIGENCE CARD
// Home-level: activity provision quality, participation rates, category
// variety, new experiences, per-child profiles, ARIA insights.
// CHR 2015 Reg 9 (enjoyment & achievement). SCCIF: "Experiences and progress."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, AlertCircle,
  Sparkles, Palette, Activity, Star,
  User, BarChart3, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeActivityEnrichmentIntelligence } from "@/hooks/use-home-activity-enrichment-intelligence";
import type { EnrichmentRating } from "@/lib/engines/home-activity-enrichment-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<EnrichmentRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
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

const CAT_COLORS: Record<string, string> = {
  sport: "bg-green-500",
  creative: "bg-purple-500",
  outdoor: "bg-emerald-500",
  educational: "bg-blue-500",
  social: "bg-pink-500",
  life_skills: "bg-amber-500",
  cultural: "bg-indigo-500",
  therapeutic: "bg-teal-500",
  community: "bg-orange-500",
  digital: "bg-cyan-500",
};

function scoreColor(score: number): string {
  if (score >= 65) return "text-green-600";
  if (score >= 45) return "text-amber-600";
  return "text-red-600";
}

function scoreBg(score: number): string {
  if (score >= 65) return "bg-green-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-red-500";
}

// ── Component ───────────────────────────────────────────────────────────────

export function HomeActivityEnrichmentIntelligenceCard() {
  const { data, isLoading } = useHomeActivityEnrichmentIntelligence();

  if (isLoading) {
    return (
      <Card className="col-span-full overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const ratingStyle = RATING_STYLES[d.enrichment_rating] ?? RATING_STYLES.insufficient_data;

  return (
    <Card className="col-span-full overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4 text-purple-500" />
            <span className="text-slate-900">Activity & Enrichment</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{d.enrichment_score}%</span>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Provision KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-purple-50 p-2">
            <p className={cn("text-lg font-bold tabular-nums", d.provision.total_activities_30d >= 10 ? "text-green-600" : d.provision.total_activities_30d >= 4 ? "text-amber-600" : "text-red-600")}>
              {d.provision.total_activities_30d}
            </p>
            <p className="text-[10px] text-muted-foreground">Activities (30d)</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className={cn("text-lg font-bold tabular-nums", d.provision.unique_categories_30d >= 5 ? "text-green-600" : d.provision.unique_categories_30d >= 3 ? "text-amber-600" : "text-red-600")}>
              {d.provision.unique_categories_30d}
            </p>
            <p className="text-[10px] text-muted-foreground">Categories</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <div className="flex items-center justify-center gap-1">
              <Star className={cn("h-3.5 w-3.5", d.provision.new_experiences_30d >= 3 ? "text-amber-500" : "text-slate-400")} />
              <p className={cn("text-lg font-bold tabular-nums", d.provision.new_experiences_30d >= 3 ? "text-amber-600" : d.provision.new_experiences_30d >= 1 ? "text-amber-500" : "text-slate-400")}>
                {d.provision.new_experiences_30d}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">New Experiences</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <div className="flex items-center justify-center gap-1">
              <Zap className={cn("h-3.5 w-3.5", d.provision.yp_suggested_30d >= 2 ? "text-cyan-500" : "text-slate-400")} />
              <p className={cn("text-lg font-bold tabular-nums", d.provision.yp_suggested_30d >= 2 ? "text-cyan-600" : "text-slate-500")}>
                {d.provision.yp_suggested_30d}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">YP Suggested</p>
          </div>
        </div>

        {/* Category Breakdown */}
        {d.category_breakdown.length > 0 && (
          <div className="rounded border border-purple-200 bg-purple-50 p-2 text-xs">
            <p className="font-medium text-purple-700 flex items-center gap-1 mb-1.5">
              <BarChart3 className="h-3 w-3" />
              Category Mix
            </p>
            <div className="flex flex-wrap gap-1">
              {d.category_breakdown.map((cat, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-white/60 rounded px-1.5 py-0.5 text-[10px] text-purple-800 border border-purple-200 capitalize">
                  <span className={cn("w-1.5 h-1.5 rounded-full", CAT_COLORS[cat.category] ?? "bg-slate-400")} />
                  {cat.category.replace("_", " ")} <span className="font-bold">{cat.count}</span>
                  <span className="opacity-50">({cat.percentage}%)</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Per-Child Profiles */}
        {d.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <User className="h-3 w-3" />
              Child Activity Profiles
            </p>
            <div className="grid gap-1.5">
              {d.child_profiles.map((cp) => (
                <div key={cp.child_id} className="rounded border border-slate-200 bg-slate-50 p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">{cp.child_name}</span>
                      <span className={cn("font-bold tabular-nums", scoreColor(cp.activity_score))}>{cp.activity_score}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{cp.activities_30d} act.</span>
                      {cp.new_experiences_30d > 0 && (
                        <span className="text-amber-600">{cp.new_experiences_30d} new</span>
                      )}
                      <span>{cp.categories_accessed.length} cat.</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className={cn("h-1.5 rounded-full", scoreBg(cp.activity_score))} style={{ width: `${Math.min(cp.activity_score, 100)}%` }} />
                  </div>
                  {cp.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cp.flags.map((f, i) => (
                        <span key={i} className="inline-flex text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
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

        {/* ARIA Enrichment Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Enrichment Intelligence
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
